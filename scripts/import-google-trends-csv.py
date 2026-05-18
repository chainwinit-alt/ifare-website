#!/usr/bin/env python3
"""
Import manually exported Google Trends CSV files into SQL Server.

Requirements:
- pyodbc

Supported Google Trends exports:
- single keyword interest over time CSV
- compare keywords interest over time CSV

Default flow:
1. Parse a Google Trends CSV export
2. Normalize keyword labels from the CSV header
3. Upsert rows into dbo.search_term_trend_daily
4. Merge trend metrics into dbo.search_term_stat_daily

Examples:
python scripts/import-google-trends-csv.py --csv "C:\\temp\\multiTimeline.csv"
python scripts/import-google-trends-csv.py --csv "C:\\temp\\multiTimeline.csv" --skip-stat-sync
python scripts/import-google-trends-csv.py --csv "C:\\temp\\multiTimeline.csv" --region TW --source google_trends
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import pyodbc


DEFAULT_REGION = "TW"
DEFAULT_SOURCE = "google_trends"


@dataclass(frozen=True)
class TrendRow:
    normalized_term: str
    term: str
    source: str
    region: str
    trend_date: str
    trend_value: float
    is_partial: bool


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--appsettings",
        default=r"Dev/Dev Code/iFare_Frontend_API/src/IFare_API.Web.Host/appsettings.json",
        help="Path to IFare API appsettings.json",
    )
    parser.add_argument(
        "--connection-string-name",
        default="IFare",
        help="Connection string key under ConnectionStrings",
    )
    parser.add_argument(
        "--csv",
        required=True,
        help="Path to Google Trends exported CSV",
    )
    parser.add_argument(
        "--trend-table",
        default="dbo.search_term_trend_daily",
        help="Target SQL table for raw trend rows",
    )
    parser.add_argument(
        "--region",
        default=DEFAULT_REGION,
        help="Region code stored into SQL, for example TW",
    )
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE,
        help="Source label stored into SQL",
    )
    parser.add_argument(
        "--skip-stat-sync",
        action="store_true",
        help="Only import raw trend rows, do not update dbo.search_term_stat_daily",
    )
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Store one summary row per keyword instead of one row per date",
    )
    parser.add_argument(
        "--summary-method",
        default="avg",
        choices=["avg", "max", "last"],
        help="How to summarize a keyword timeline when --summary-only is used",
    )
    parser.add_argument(
        "--snapshot-date",
        help="Override stat date for --summary-only, format YYYY-MM-DD. Defaults to today.",
    )
    return parser.parse_args()


def strip_json_comments(text: str) -> str:
    cleaned_lines: list[str] = []
    for line in text.splitlines():
        if line.lstrip().startswith("//"):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def load_connection_string(appsettings_path: Path, connection_string_name: str) -> str:
    raw = appsettings_path.read_text(encoding="utf-8-sig")
    payload = json.loads(strip_json_comments(raw))
    conn = payload["ConnectionStrings"][connection_string_name]
    if not conn:
        raise ValueError(f"ConnectionStrings:{connection_string_name} is empty")
    return conn


def parse_connection_string(connection_string: str) -> dict[str, str]:
    parts: dict[str, str] = {}
    for chunk in connection_string.split(";"):
        chunk = chunk.strip()
        if not chunk or "=" not in chunk:
            continue
        key, value = chunk.split("=", 1)
        parts[key.strip().lower()] = value.strip()
    return parts


def choose_odbc_driver() -> str:
    available = set(pyodbc.drivers())
    for driver in (
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server",
    ):
        if driver in available:
            return driver
    raise RuntimeError("No SQL Server ODBC driver found. Install ODBC Driver 17/18 for SQL Server.")


def to_pyodbc_connection_string(connection_string: str) -> str:
    raw = parse_connection_string(connection_string)
    driver = raw.get("driver") or choose_odbc_driver()
    server = raw.get("server") or raw.get("data source")
    database = raw.get("database") or raw.get("initial catalog")
    trusted = raw.get("trusted_connection", raw.get("integrated security", "true"))
    encrypt = raw.get("encrypt", "no")
    trust_server_certificate = raw.get("trustservercertificate", "yes")

    if not server:
        raise ValueError("Connection string does not contain Server/Data Source")
    if not database:
        raise ValueError("Connection string does not contain Database/Initial Catalog")

    return ";".join(
        [
            f"Driver={{{driver}}}",
            f"Server={server}",
            f"Database={database}",
            f"Trusted_Connection={'Yes' if trusted.strip().lower() not in {'false', 'no', '0'} else 'No'}",
            f"Encrypt={'Yes' if encrypt.strip().lower() in {'true', 'yes', '1'} else 'No'}",
            "TrustServerCertificate="
            + ("No" if trust_server_certificate.strip().lower() in {"false", "no", "0"} else "Yes"),
        ]
    )


def normalize_term(text: str) -> str:
    text = re.sub(r"\s+", " ", text.strip()).lower()
    return (
        text.replace(" ", "")
        .replace("-", "")
        .replace("_", "")
        .replace("/", "")
        .replace("\\", "")
        .replace(" ", "")
    )


def clean_keyword_label(label: str) -> str:
    text = label.strip().lstrip("\ufeff")
    text = re.sub(r":\s*\([^)]+\)\s*$", "", text)
    text = re.sub(r":\s*[^:]+$", "", text) if text.count(":") == 1 and "(" not in text else text
    return text.strip()


def is_header_row(row: list[str]) -> bool:
    if not row:
        return False
    first = (row[0] or "").strip().lstrip("\ufeff")
    return first in {"Day", "Week", "Month", "Date", "日期", "週", "月"}


def parse_trend_date(raw: str) -> str:
    text = raw.strip()
    if " - " in text:
        text = text.split(" - ", 1)[0].strip()
    return date.fromisoformat(text).isoformat()


def parse_trend_value(raw: str) -> float:
    text = raw.strip()
    if not text:
        return 0.0
    if text == "<1":
        return 0.5
    if text.lower() == "partial":
        return 0.0
    return float(text)


def parse_is_partial(raw: str) -> bool:
    return raw.strip().lower() in {"true", "partial", "yes", "1"}


def read_google_trends_csv(csv_path: Path, region: str, source: str) -> list[TrendRow]:
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.reader(handle))

    header_index = next((index for index, row in enumerate(rows) if is_header_row(row)), None)
    if header_index is None:
        raise ValueError("Could not find Google Trends header row. Expected first column like Day/Week/Month.")

    header = rows[header_index]
    data_rows = rows[header_index + 1 :]
    if len(header) < 2:
        raise ValueError("Google Trends CSV does not contain any keyword columns.")

    keyword_columns = [clean_keyword_label(column) for column in header[1:]]
    parsed_rows: list[TrendRow] = []

    for raw_row in data_rows:
        if not raw_row or not any(cell.strip() for cell in raw_row):
            continue
        trend_date = parse_trend_date(raw_row[0])
        for column_index, keyword in enumerate(keyword_columns, start=1):
            if not keyword:
                continue
            if column_index >= len(raw_row):
                continue
            value_cell = raw_row[column_index]
            is_partial = False
            value_text = value_cell.strip()

            if value_text.lower().endswith(" partial"):
                value_text = value_text[:-8].strip()
                is_partial = True

            if column_index + 1 < len(header):
                next_header = (header[column_index + 1] or "").strip()
                if next_header.lower() == "ispartial" and column_index + 1 < len(raw_row):
                    is_partial = parse_is_partial(raw_row[column_index + 1])

            parsed_rows.append(
                TrendRow(
                    normalized_term=normalize_term(keyword),
                    term=keyword,
                    source=source,
                    region=region,
                    trend_date=trend_date,
                    trend_value=parse_trend_value(value_text),
                    is_partial=is_partial,
                )
            )

    return parsed_rows


def summarize_trend_rows(rows: list[TrendRow], summary_method: str, snapshot_date: str) -> list[TrendRow]:
    grouped: dict[tuple[str, str, str, str], list[TrendRow]] = {}
    for row in rows:
        key = (row.normalized_term, row.term, row.source, row.region)
        grouped.setdefault(key, []).append(row)

    summarized: list[TrendRow] = []
    for key, group_rows in grouped.items():
        ordered_rows = sorted(group_rows, key=lambda row: row.trend_date)
        if summary_method == "max":
            trend_value = max(row.trend_value for row in ordered_rows)
        elif summary_method == "last":
            trend_value = ordered_rows[-1].trend_value
        else:
            trend_value = sum(row.trend_value for row in ordered_rows) / max(len(ordered_rows), 1)

        summarized.append(
            TrendRow(
                normalized_term=key[0],
                term=key[1],
                source=key[2],
                region=key[3],
                trend_date=snapshot_date,
                trend_value=round(trend_value, 4),
                is_partial=any(row.is_partial for row in ordered_rows),
            )
        )

    return summarized


def ensure_trend_table(connection_string: str, trend_table: str) -> None:
    schema_name, table_name = trend_table.split(".", 1) if "." in trend_table else ("dbo", trend_table)
    query = """
SELECT COUNT(*)
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = ?
  AND TABLE_NAME = ?;
"""
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(query, schema_name, table_name)
        count = int(cursor.fetchone()[0])
        if count == 0:
            raise ValueError(f"Trend table not found: {trend_table}")


def upsert_trend_rows(connection_string: str, trend_table: str, rows: list[TrendRow]) -> None:
    if not rows:
        return

    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
IF OBJECT_ID('tempdb..#trend_stage') IS NOT NULL
    DROP TABLE #trend_stage;

CREATE TABLE #trend_stage
(
    normalized_term NVARCHAR(200) NOT NULL,
    term NVARCHAR(200) NOT NULL,
    source NVARCHAR(50) NOT NULL,
    region NVARCHAR(20) NOT NULL,
    trend_date DATE NOT NULL,
    trend_value DECIMAL(12,4) NOT NULL,
    is_partial BIT NOT NULL
);
"""
        )

        cursor.fast_executemany = True
        cursor.executemany(
            """
INSERT INTO #trend_stage
    (normalized_term, term, source, region, trend_date, trend_value, is_partial)
VALUES (?, ?, ?, ?, ?, ?, ?)
""",
            [
                (
                    row.normalized_term,
                    row.term,
                    row.source,
                    row.region,
                    row.trend_date,
                    row.trend_value,
                    1 if row.is_partial else 0,
                )
                for row in rows
            ],
        )

        cursor.execute(
            f"""
MERGE [{trend_table.replace('.', '].[')}] AS target
USING #trend_stage AS src
ON target.normalized_term = src.normalized_term
AND target.source = src.source
AND target.region = src.region
AND target.trend_date = src.trend_date
WHEN MATCHED THEN
    UPDATE SET
        target.term = src.term,
        target.trend_value = src.trend_value,
        target.is_partial = src.is_partial
WHEN NOT MATCHED THEN
    INSERT (normalized_term, term, source, region, trend_date, trend_value, is_partial, created_at)
    VALUES (src.normalized_term, src.term, src.source, src.region, src.trend_date, src.trend_value, src.is_partial, SYSUTCDATETIME());
"""
        )
        conn.commit()


def sync_stat_daily(connection_string: str, trend_table: str, source: str, region: str) -> None:
    table_sql = f"[{trend_table.replace('.', '].[')}]"
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"""
;WITH trend_base AS
(
    SELECT
        t.id AS term_id,
        src.trend_date AS stat_date,
        CAST(src.trend_value AS DECIMAL(18,6)) AS external_trend_score,
        LAG(CAST(src.trend_value AS DECIMAL(18,6))) OVER (
            PARTITION BY t.id
            ORDER BY src.trend_date
        ) AS prev_trend_value
    FROM {table_sql} src
    INNER JOIN [dbo].[search_term] t
        ON t.normalized_term = src.normalized_term
    WHERE
        src.source = ?
        AND src.region = ?
),
payload AS
(
    SELECT
        term_id,
        stat_date,
        external_trend_score,
        CAST(
            CASE
                WHEN prev_trend_value IS NULL OR prev_trend_value <= 0 THEN 0
                ELSE
                    CASE
                        WHEN ((external_trend_score - prev_trend_value) / prev_trend_value) * 100.0 > 100 THEN 100
                        WHEN ((external_trend_score - prev_trend_value) / prev_trend_value) * 100.0 < -100 THEN -100
                        ELSE ((external_trend_score - prev_trend_value) / prev_trend_value) * 100.0
                    END
            END
            AS DECIMAL(18,6)
        ) AS trend_growth_score
    FROM trend_base
)
MERGE [dbo].[search_term_stat_daily] AS target
USING payload AS src
ON target.term_id = src.term_id
AND target.stat_date = src.stat_date
WHEN MATCHED THEN
    UPDATE SET
        target.external_trend_score = src.external_trend_score,
        target.trend_growth_score = src.trend_growth_score,
        target.final_hot_score =
            CAST(
                (ISNULL(target.trend_score, 0) * 0.40) +
                (ISNULL(src.external_trend_score, 0) * 0.15) +
                (CASE WHEN ISNULL(src.trend_growth_score, 0) > 0 THEN src.trend_growth_score ELSE 0 END * 0.05) +
                (ISNULL(target.content_freshness_score, 0) * 0.20) +
                (ISNULL(target.editorial_boost_score, 0) * 0.10)
                AS DECIMAL(18,6)
            ),
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT
    (
        term_id,
        stat_date,
        search_count,
        select_count,
        result_count,
        zero_result_count,
        trend_score,
        external_trend_score,
        trend_growth_score,
        content_match_count,
        content_freshness_score,
        editorial_boost_score,
        final_hot_score,
        created_at,
        updated_at
    )
    VALUES
    (
        src.term_id,
        src.stat_date,
        0,
        0,
        0,
        0,
        0,
        src.external_trend_score,
        src.trend_growth_score,
        0,
        0,
        0,
        CAST(
            (ISNULL(src.external_trend_score, 0) * 0.15) +
            (CASE WHEN ISNULL(src.trend_growth_score, 0) > 0 THEN src.trend_growth_score ELSE 0 END * 0.05)
            AS DECIMAL(18,6)
        ),
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
""",
            source,
            region,
        )
        conn.commit()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()
    csv_path = Path(args.csv).expanduser().resolve()
    snapshot_date = args.snapshot_date or date.today().isoformat()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)

    ensure_trend_table(pyodbc_connection_string, args.trend_table)
    rows = read_google_trends_csv(csv_path, region=args.region, source=args.source)
    if args.summary_only:
        rows = summarize_trend_rows(rows, summary_method=args.summary_method, snapshot_date=snapshot_date)
    upsert_trend_rows(pyodbc_connection_string, args.trend_table, rows)

    if not args.skip_stat_sync:
        sync_stat_daily(pyodbc_connection_string, args.trend_table, source=args.source, region=args.region)

    print(f"csv={csv_path}")
    print(f"trend_rows={len(rows)}")
    print(f"trend_table={args.trend_table}")
    print(f"summary_only={'yes' if args.summary_only else 'no'}")
    print(f"stat_sync={'no' if args.skip_stat_sync else 'yes'}")


if __name__ == "__main__":
    main()
