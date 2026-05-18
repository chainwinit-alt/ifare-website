#!/usr/bin/env python3
"""
Import Google Trends data into SQL Server and sync daily external trend scores.

Requirements:
- pyodbc
- pytrends

Default flow:
1. Read active terms from dbo.search_term
2. Fetch Google Trends interest_over_time in batches
3. Upsert rows into dbo.search_term_trend_daily
4. Merge trend metrics into dbo.search_term_stat_daily

Examples:
python scripts/import-google-trends.py
python scripts/import-google-trends.py --max-terms 200 --timeframe "today 3-m"
python scripts/import-google-trends.py --term-source-kind policy_extract --term-source-kind code_keyword
python scripts/import-google-trends.py --skip-stat-sync
"""

from __future__ import annotations

import argparse
import json
import random
import time
from dataclasses import dataclass
from pathlib import Path

import pyodbc

try:
    from pytrends.request import TrendReq
except ImportError as exc:  # pragma: no cover - runtime dependency check
    raise SystemExit(
        "Missing dependency: pytrends. Install it with `pip install pytrends`."
    ) from exc


DEFAULT_TIMEFRAME = "today 3-m"
DEFAULT_REGION = "TW"
DEFAULT_LANGUAGE = "zh-TW"
DEFAULT_TIMEZONE_MINUTES = 480
DEFAULT_BATCH_SIZE = 5
DEFAULT_SLEEP_SECONDS = 2.0
DEFAULT_MAX_TERMS = 200
DEFAULT_MAX_RETRIES = 5
DEFAULT_BACKOFF_SECONDS = 8.0
TREND_SOURCE = "google_trends"


@dataclass(frozen=True)
class SearchTerm:
    term_id: int
    term: str
    display_term: str
    normalized_term: str
    term_type: str
    source_kind: str


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
        "--trend-table",
        default="dbo.search_term_trend_daily",
        help="Target SQL table for raw Google Trends rows",
    )
    parser.add_argument(
        "--timeframe",
        default=DEFAULT_TIMEFRAME,
        help='Google Trends timeframe, for example "today 3-m" or "today 12-m"',
    )
    parser.add_argument(
        "--region",
        default=DEFAULT_REGION,
        help="Google Trends region code, for example TW",
    )
    parser.add_argument(
        "--language",
        default=DEFAULT_LANGUAGE,
        help="Google Trends UI language, for example zh-TW",
    )
    parser.add_argument(
        "--timezone-minutes",
        type=int,
        default=DEFAULT_TIMEZONE_MINUTES,
        help="Google Trends timezone offset in minutes",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help="Terms per Google Trends request. Google supports up to 5.",
    )
    parser.add_argument(
        "--sleep-seconds",
        type=float,
        default=DEFAULT_SLEEP_SECONDS,
        help="Delay between Google Trends requests",
    )
    parser.add_argument(
        "--max-terms",
        type=int,
        default=DEFAULT_MAX_TERMS,
        help="Maximum active search terms to fetch",
    )
    parser.add_argument(
        "--term-type",
        action="append",
        default=[],
        help="Optional repeated filter for dbo.search_term.term_type",
    )
    parser.add_argument(
        "--term-source-kind",
        action="append",
        default=[],
        help="Optional repeated filter for dbo.search_term.source_kind",
    )
    parser.add_argument(
        "--skip-stat-sync",
        action="store_true",
        help="Only import raw trend rows, do not update dbo.search_term_stat_daily",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=DEFAULT_MAX_RETRIES,
        help="Maximum retries for a failed Google Trends batch",
    )
    parser.add_argument(
        "--backoff-seconds",
        type=float,
        default=DEFAULT_BACKOFF_SECONDS,
        help="Initial backoff seconds for 429 or transient batch failures",
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


def chunked(items: list[SearchTerm], batch_size: int) -> list[list[SearchTerm]]:
    return [items[index : index + batch_size] for index in range(0, len(items), batch_size)]


def safe_keyword(term: SearchTerm) -> str:
    text = term.display_term.strip() or term.term.strip()
    return text[:100]


def dedupe_terms_for_trends(terms: list[SearchTerm]) -> list[SearchTerm]:
    seen_keywords: set[str] = set()
    deduped: list[SearchTerm] = []
    for term in terms:
        keyword = safe_keyword(term)
        if not keyword or keyword in seen_keywords:
            continue
        seen_keywords.add(keyword)
        deduped.append(term)
    return deduped


def fetch_search_terms(
    connection_string: str,
    max_terms: int,
    term_types: list[str],
    source_kinds: list[str],
) -> list[SearchTerm]:
    clauses = ["status = N'active'"]
    params: list[object] = [max_terms]

    if term_types:
        placeholders = ", ".join("?" for _ in term_types)
        clauses.append(f"term_type IN ({placeholders})")
        params.extend(term_types)

    if source_kinds:
        placeholders = ", ".join("?" for _ in source_kinds)
        clauses.append(f"source_kind IN ({placeholders})")
        params.extend(source_kinds)

    query = f"""
SELECT TOP (?)
    id,
    term,
    COALESCE(NULLIF(display_term, N''), term) AS display_term,
    normalized_term,
    term_type,
    source_kind
FROM [dbo].[search_term]
WHERE {' AND '.join(clauses)}
ORDER BY
    manual_boost DESC,
    base_weight DESC,
    id ASC;
"""
    rows: list[SearchTerm] = []
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        for row in cursor.fetchall():
            rows.append(
                SearchTerm(
                    term_id=int(row.id),
                    term=str(row.term),
                    display_term=str(row.display_term),
                    normalized_term=str(row.normalized_term),
                    term_type=str(row.term_type),
                    source_kind=str(row.source_kind),
                )
            )
    return rows


def fetch_google_trends(
    terms: list[SearchTerm],
    timeframe: str,
    region: str,
    language: str,
    timezone_minutes: int,
    batch_size: int,
    sleep_seconds: float,
    max_retries: int,
    backoff_seconds: float,
) -> list[TrendRow]:
    trend_client = TrendReq(hl=language, tz=timezone_minutes)
    all_rows: list[TrendRow] = []
    batches = chunked(terms, batch_size)

    for batch_index, batch in enumerate(batches, start=1):
        keywords = [safe_keyword(term) for term in batch]
        keyword_to_term = {safe_keyword(term): term for term in batch}

        frame = None
        for attempt in range(1, max_retries + 1):
            try:
                trend_client.build_payload(
                    kw_list=keywords,
                    cat=0,
                    timeframe=timeframe,
                    geo=region,
                    gprop="",
                )
                frame = trend_client.interest_over_time()
                break
            except Exception as exc:
                error_text = str(exc)
                is_rate_limited = "429" in error_text
                if attempt >= max_retries:
                    print(
                        f"warning=batch_failed batch={batch_index} attempt={attempt} "
                        f"keywords={keywords} error={exc}"
                    )
                    break

                delay_seconds = backoff_seconds * (2 ** (attempt - 1))
                if is_rate_limited:
                    delay_seconds += random.uniform(0.5, 2.0)
                print(
                    f"warning=batch_retry batch={batch_index} attempt={attempt} "
                    f"delay_seconds={delay_seconds:.1f} keywords={keywords} error={exc}"
                )
                time.sleep(delay_seconds)

        if frame is None:
            time.sleep(sleep_seconds)
            continue

        if frame is None or frame.empty:
            time.sleep(sleep_seconds)
            continue

        partial_series = frame["isPartial"] if "isPartial" in frame.columns else None
        term_columns = [column for column in frame.columns if column != "isPartial"]

        for trend_date, payload in frame.iterrows():
            is_partial = bool(partial_series.loc[trend_date]) if partial_series is not None else False
            trend_date_text = trend_date.date().isoformat()
            for keyword in term_columns:
                mapped_term = keyword_to_term.get(keyword)
                if mapped_term is None:
                    continue
                value = float(payload[keyword])
                all_rows.append(
                    TrendRow(
                        normalized_term=mapped_term.normalized_term,
                        term=mapped_term.display_term,
                        source=TREND_SOURCE,
                        region=region,
                        trend_date=trend_date_text,
                        trend_value=value,
                        is_partial=is_partial,
                    )
                )

        if batch_index < len(batches):
            time.sleep(sleep_seconds)

    return all_rows


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


def sync_stat_daily(connection_string: str, trend_table: str, region: str) -> None:
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
"""
            ,
            TREND_SOURCE,
            region,
        )
        conn.commit()


def main() -> None:
    args = parse_args()
    if args.batch_size < 1 or args.batch_size > 5:
        raise ValueError("--batch-size must be between 1 and 5")

    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)

    ensure_trend_table(pyodbc_connection_string, args.trend_table)
    fetched_terms = fetch_search_terms(
        pyodbc_connection_string,
        max_terms=args.max_terms,
        term_types=args.term_type,
        source_kinds=args.term_source_kind,
    )
    terms = dedupe_terms_for_trends(fetched_terms)
    trend_rows = fetch_google_trends(
        terms,
        timeframe=args.timeframe,
        region=args.region,
        language=args.language,
        timezone_minutes=args.timezone_minutes,
        batch_size=args.batch_size,
        sleep_seconds=args.sleep_seconds,
        max_retries=args.max_retries,
        backoff_seconds=args.backoff_seconds,
    )
    upsert_trend_rows(pyodbc_connection_string, args.trend_table, trend_rows)

    if not args.skip_stat_sync:
        sync_stat_daily(pyodbc_connection_string, args.trend_table, args.region)

    print(f"terms={len(terms)}")
    print(f"deduped_from={len(fetched_terms)}")
    print(f"trend_rows={len(trend_rows)}")
    print(f"trend_table={args.trend_table}")
    print(f"stat_sync={'no' if args.skip_stat_sync else 'yes'}")


if __name__ == "__main__":
    main()
