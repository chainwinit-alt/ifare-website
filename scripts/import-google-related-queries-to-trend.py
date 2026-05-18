#!/usr/bin/env python3
"""
Import Google Trends relatedQueries CSV files into dbo.search_term_trend_daily
as one summary row per query.

Use this when you do not want timeline/daily granularity and only need the
"current overall trend" for each related query within the exported time window.

Examples:
python scripts/import-google-related-queries-to-trend.py
python scripts/import-google-related-queries-to-trend.py --replace-source-region-date
python scripts/import-google-related-queries-to-trend.py --snapshot-date 2026-05-18
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


DEFAULT_SOURCE = "google_trends_related_query"
DEFAULT_REGION = "TW"
BREAKOUT_TOKENS = {"breakout", "爆紅", "飆升", "急遽增加", "突增"}


@dataclass(frozen=True)
class TrendSnapshotRow:
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
        "--folder",
        default="scripts/Google_Trend",
        help="Folder containing relatedQueries*.csv files",
    )
    parser.add_argument(
        "--trend-table",
        default="dbo.search_term_trend_daily",
        help="Target SQL table",
    )
    parser.add_argument(
        "--region",
        default=DEFAULT_REGION,
        help="Region code stored into SQL",
    )
    parser.add_argument(
        "--source",
        default=DEFAULT_SOURCE,
        help="Source label stored into SQL",
    )
    parser.add_argument(
        "--snapshot-date",
        help="Override trend_date, format YYYY-MM-DD. Defaults to today.",
    )
    parser.add_argument(
        "--replace-source-region-date",
        action="store_true",
        help="Delete existing rows for the same source, region, and snapshot date before import",
    )
    parser.add_argument(
        "--skip-stat-sync",
        action="store_true",
        help="Only import raw trend rows, do not update dbo.search_term_stat_daily",
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


def parse_seed_term(lines: list[str]) -> str:
    for line in lines:
        text = line.strip().strip('"')
        if not text or ":" not in text or "(" not in text:
            continue
        return text.split(":", 1)[0].strip()
    raise ValueError("Could not parse seed term from relatedQueries CSV.")


def parse_value(section: str, raw_value: str) -> float:
    text = raw_value.strip()
    lowered = text.lower()

    if lowered in BREAKOUT_TOKENS or any(token in text for token in {"爆紅", "飆升", "急遽增加", "突增"}):
        return 100.0

    if section == "TOP":
        if text == "<1":
            return 0.5
        numeric_text = text.replace(",", "").replace("%", "").replace("+", "").strip()
        return float(numeric_text)

    percent_text = text.replace(",", "").replace("%", "").replace("+", "").strip()
    try:
        percent_value = float(percent_text)
    except ValueError:
        percent_value = 0.0
    return min(percent_value, 100.0)


def collect_rows(folder: Path, source: str, region: str, snapshot_date: str) -> list[TrendSnapshotRow]:
    rows_by_term: dict[str, TrendSnapshotRow] = {}
    files = sorted(folder.glob("relatedQueries*.csv"))

    for csv_path in files:
        lines = csv_path.read_text(encoding="utf-8-sig").splitlines()
        _seed_term = parse_seed_term(lines)
        current_section = ""

        for line in lines:
            text = line.strip()
            if not text:
                continue
            if text in {"TOP", "RISING"}:
                current_section = text
                continue
            if current_section not in {"TOP", "RISING"}:
                continue

            parsed = next(csv.reader([line]))
            if len(parsed) < 2:
                continue

            term = parsed[0].strip().strip('"')
            raw_value = parsed[1].strip().strip('"')
            if not term or not raw_value:
                continue

            normalized_term = normalize_term(term)
            if not normalized_term:
                continue

            trend_value = parse_value(current_section, raw_value)
            existing = rows_by_term.get(normalized_term)
            candidate = TrendSnapshotRow(
                normalized_term=normalized_term,
                term=term,
                source=source,
                region=region,
                trend_date=snapshot_date,
                trend_value=trend_value,
                is_partial=False,
            )
            if existing is None or candidate.trend_value > existing.trend_value:
                rows_by_term[normalized_term] = candidate

    return sorted(rows_by_term.values(), key=lambda row: (-row.trend_value, row.term))


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


def upsert_rows(
    connection_string: str,
    trend_table: str,
    rows: list[TrendSnapshotRow],
    source: str,
    region: str,
    snapshot_date: str,
    replace_source_region_date: bool,
) -> None:
    if not rows:
        return

    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        table_sql = f"[{trend_table.replace('.', '].[')}]"

        if replace_source_region_date:
            cursor.execute(
                f"""
DELETE FROM {table_sql}
WHERE source = ?
  AND region = ?
  AND trend_date = ?;
""",
                source,
                region,
                snapshot_date,
            )

        cursor.execute(
            """
IF OBJECT_ID('tempdb..#related_query_trend_stage') IS NOT NULL
    DROP TABLE #related_query_trend_stage;

CREATE TABLE #related_query_trend_stage
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

        insert_sql = """
INSERT INTO #related_query_trend_stage
    (normalized_term, term, source, region, trend_date, trend_value, is_partial)
VALUES (?, ?, ?, ?, ?, ?, ?)
"""
        cursor.fast_executemany = False
        for row in rows:
            cursor.execute(
                insert_sql,
                row.normalized_term,
                row.term,
                row.source,
                row.region,
                row.trend_date,
                float(row.trend_value),
                1 if row.is_partial else 0,
            )

        cursor.execute(
            f"""
MERGE {table_sql} AS target
USING #related_query_trend_stage AS src
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


def sync_stat_daily(connection_string: str, trend_table: str, source: str, region: str, snapshot_date: str) -> None:
    table_sql = f"[{trend_table.replace('.', '].[')}]"
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            f"""
;WITH payload AS
(
    SELECT
        term.id AS term_id,
        src.trend_date AS stat_date,
        CAST(src.trend_value AS DECIMAL(18,6)) AS external_trend_score,
        CAST(0 AS DECIMAL(18,6)) AS trend_growth_score
    FROM {table_sql} src
    INNER JOIN [dbo].[search_term] term
        ON term.normalized_term = src.normalized_term
    WHERE
        src.source = ?
        AND src.region = ?
        AND src.trend_date = ?
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
                (ISNULL(src.external_trend_score, 0) * 0.20) +
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
        CAST(ISNULL(src.external_trend_score, 0) * 0.20 AS DECIMAL(18,6)),
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );
""",
            source,
            region,
            snapshot_date,
        )
        conn.commit()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()
    folder = (repo_root / args.folder).resolve()
    snapshot_date = args.snapshot_date or date.today().isoformat()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)

    ensure_trend_table(pyodbc_connection_string, args.trend_table)
    rows = collect_rows(folder, source=args.source, region=args.region, snapshot_date=snapshot_date)
    upsert_rows(
        pyodbc_connection_string,
        args.trend_table,
        rows,
        source=args.source,
        region=args.region,
        snapshot_date=snapshot_date,
        replace_source_region_date=args.replace_source_region_date,
    )

    if not args.skip_stat_sync:
        sync_stat_daily(
            pyodbc_connection_string,
            args.trend_table,
            source=args.source,
            region=args.region,
            snapshot_date=snapshot_date,
        )

    print(f"folder={folder}")
    print(f"files={len(list(sorted(folder.glob('relatedQueries*.csv'))))}")
    print(f"trend_rows={len(rows)}")
    print(f"trend_table={args.trend_table}")
    print(f"snapshot_date={snapshot_date}")
    print(f"stat_sync={'no' if args.skip_stat_sync else 'yes'}")


if __name__ == "__main__":
    main()
