#!/usr/bin/env python3
"""
Import Google Trends relatedQueries CSV files into dbo.search_policy_term_candidate.

Supported input:
- Google Trends "Related queries" CSV exports in the format seen under scripts/Google_Trend

Behavior:
- Parse the seed query from the title line
- Parse TOP and RISING sections
- Upsert rows into dbo.search_policy_term_candidate

Examples:
python scripts/import-google-related-queries.py
python scripts/import-google-related-queries.py --folder scripts/Google_Trend
python scripts/import-google-related-queries.py --replace-source-kind
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path

import pyodbc


DEFAULT_SOURCE_KIND = "google_trends_related_query"
DEFAULT_TERM_TYPE = "keyword"
DEFAULT_STATUS = "candidate"
BREAKOUT_TOKENS = {"breakout", "爆紅", "飆升", "急遽增加", "突增"}


@dataclass(frozen=True)
class RelatedQueryRow:
    seed_term: str
    section: str
    term: str
    normalized_term: str
    raw_value: str
    policy_count: int
    title_hit_count: int
    keyword_hit_count: int
    content_score: float
    quality_score: float
    source_ref_id: str
    evidence_field: str


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
        help="Folder containing Google Trends relatedQueries CSV files",
    )
    parser.add_argument(
        "--source-kind",
        default=DEFAULT_SOURCE_KIND,
        help="source_kind written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--term-type",
        default=DEFAULT_TERM_TYPE,
        help="term_type written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--status",
        default=DEFAULT_STATUS,
        help="status written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--replace-source-kind",
        action="store_true",
        help="Delete existing dbo.search_policy_term_candidate rows for the same source_kind before import",
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


def parse_score(section: str, raw_value: str) -> tuple[float, float, int]:
    text = raw_value.strip()
    if not text:
        return 0.0, 0.0, 0

    lowered = text.lower()
    if lowered in BREAKOUT_TOKENS or any(token in text for token in {"爆紅", "飆升", "急遽增加", "突增"}):
        content_score = 5.0 if section == "RISING" else 4.0
        quality_score = 6.0 if section == "RISING" else 4.5
        policy_count = 10 if section == "RISING" else 8
        return content_score, quality_score, policy_count

    if section == "TOP":
        if text == "<1":
            value = 0.5
        else:
            numeric_text = text.replace(",", "").replace("%", "").replace("+", "").strip()
            value = float(numeric_text)
        content_score = round(value / 20.0, 6)
        quality_score = round((value / 100.0) * 3.0, 6)
        policy_count = max(1, int(round(value / 10.0)))
        return content_score, quality_score, policy_count

    percent_text = text.replace(",", "").replace("%", "").replace("+", "").strip()
    try:
        percent_value = float(percent_text)
    except ValueError:
        percent_value = 0.0
    capped = min(percent_value, 300.0)
    content_score = round(2.0 + (capped / 100.0), 6)
    quality_score = round(3.0 + (capped / 100.0), 6)
    policy_count = max(1, int(round(min(percent_value, 1000.0) / 100.0)))
    return content_score, quality_score, policy_count


def parse_related_queries_csv(csv_path: Path) -> list[RelatedQueryRow]:
    lines = csv_path.read_text(encoding="utf-8-sig").splitlines()
    seed_term = parse_seed_term(lines)

    rows: list[RelatedQueryRow] = []
    current_section = ""
    file_tag = csv_path.stem

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

        normalized = normalize_term(term)
        if not normalized:
            continue

        content_score, quality_score, policy_count = parse_score(current_section, raw_value)
        rows.append(
            RelatedQueryRow(
                seed_term=seed_term,
                section=current_section,
                term=term,
                normalized_term=normalized,
                raw_value=raw_value,
                policy_count=policy_count,
                title_hit_count=0,
                keyword_hit_count=1 if current_section == "TOP" else 0,
                content_score=content_score,
                quality_score=quality_score,
                source_ref_id=f"{seed_term}|{file_tag}|{current_section}",
                evidence_field=f"related_query_{current_section.lower()}",
            )
        )

    return rows


def collect_rows(folder: Path) -> list[RelatedQueryRow]:
    files = sorted(folder.glob("relatedQueries*.csv"))
    all_rows: list[RelatedQueryRow] = []
    for csv_path in files:
        all_rows.extend(parse_related_queries_csv(csv_path))
    return all_rows


def import_rows(
    connection_string: str,
    rows: list[RelatedQueryRow],
    source_kind: str,
    term_type: str,
    status: str,
    replace_source_kind: bool,
) -> None:
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        if replace_source_kind:
            cursor.execute(
                """
DELETE FROM [dbo].[search_policy_term_candidate]
WHERE source_kind = ?;
""",
                source_kind,
            )

        cursor.execute(
            """
IF OBJECT_ID('tempdb..#google_related_query_stage') IS NOT NULL
    DROP TABLE #google_related_query_stage;

CREATE TABLE #google_related_query_stage
(
    term NVARCHAR(200) NOT NULL,
    normalized_term NVARCHAR(200) NOT NULL,
    display_term NVARCHAR(200) NOT NULL,
    term_type NVARCHAR(50) NOT NULL,
    source_kind NVARCHAR(50) NOT NULL,
    source_ref_id NVARCHAR(100) NULL,
    evidence_field NVARCHAR(50) NOT NULL,
    policy_count INT NOT NULL,
    title_hit_count INT NOT NULL,
    keyword_hit_count INT NOT NULL,
    recipient_hit_count INT NOT NULL,
    identity_hit_count INT NOT NULL,
    income_hit_count INT NOT NULL,
    policy_type_hit_count INT NOT NULL,
    content_score DECIMAL(18,6) NOT NULL,
    quality_score DECIMAL(18,6) NOT NULL,
    status NVARCHAR(20) NOT NULL
);
"""
        )

        sql = """
INSERT INTO #google_related_query_stage
(
    term, normalized_term, display_term, term_type, source_kind, source_ref_id, evidence_field,
    policy_count, title_hit_count, keyword_hit_count, recipient_hit_count, identity_hit_count,
    income_hit_count, policy_type_hit_count, content_score, quality_score, status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""
        payload = [
            (
                row.term,
                row.normalized_term,
                row.term,
                term_type,
                source_kind,
                row.source_ref_id,
                row.evidence_field,
                int(row.policy_count),
                int(row.title_hit_count),
                int(row.keyword_hit_count),
                0,
                0,
                0,
                0,
                float(row.content_score),
                float(row.quality_score),
                status,
            )
            for row in rows
        ]

        cursor.fast_executemany = False
        for index, params in enumerate(payload, start=1):
            try:
                cursor.execute(sql, params)
            except pyodbc.ProgrammingError as exc:
                raise RuntimeError(
                    "Failed to insert related query row "
                    f"#{index}: term={params[0]!r}, raw_source_ref_id={params[5]!r}, "
                    f"evidence_field={params[6]!r}, policy_count={params[7]!r}, "
                    f"content_score={params[14]!r}, quality_score={params[15]!r}"
                ) from exc

        cursor.execute(
            """
MERGE [dbo].[search_policy_term_candidate] AS target
USING #google_related_query_stage AS src
ON target.normalized_term = src.normalized_term
AND target.term_type = src.term_type
AND target.source_kind = src.source_kind
AND ISNULL(target.source_ref_id, N'') = ISNULL(src.source_ref_id, N'')
WHEN MATCHED THEN
    UPDATE SET
        target.term = src.term,
        target.display_term = src.display_term,
        target.evidence_field = src.evidence_field,
        target.policy_count = src.policy_count,
        target.title_hit_count = src.title_hit_count,
        target.keyword_hit_count = src.keyword_hit_count,
        target.recipient_hit_count = src.recipient_hit_count,
        target.identity_hit_count = src.identity_hit_count,
        target.income_hit_count = src.income_hit_count,
        target.policy_type_hit_count = src.policy_type_hit_count,
        target.content_score = src.content_score,
        target.quality_score = src.quality_score,
        target.status = src.status,
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT
    (
        term, normalized_term, display_term, term_type, source_kind, source_ref_id, evidence_field,
        policy_count, title_hit_count, keyword_hit_count, recipient_hit_count, identity_hit_count,
        income_hit_count, policy_type_hit_count, content_score, quality_score, status, created_at, updated_at
    )
    VALUES
    (
        src.term, src.normalized_term, src.display_term, src.term_type, src.source_kind, src.source_ref_id, src.evidence_field,
        src.policy_count, src.title_hit_count, src.keyword_hit_count, src.recipient_hit_count, src.identity_hit_count,
        src.income_hit_count, src.policy_type_hit_count, src.content_score, src.quality_score, src.status, SYSUTCDATETIME(), SYSUTCDATETIME()
    );
"""
        )
        conn.commit()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()
    folder = (repo_root / args.folder).resolve()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)
    rows = collect_rows(folder)
    import_rows(
        pyodbc_connection_string,
        rows,
        source_kind=args.source_kind,
        term_type=args.term_type,
        status=args.status,
        replace_source_kind=args.replace_source_kind,
    )

    print(f"folder={folder}")
    print(f"files={len(list(sorted(folder.glob('relatedQueries*.csv'))))}")
    print(f"imported_rows={len(rows)}")
    print(f"source_kind={args.source_kind}")


if __name__ == "__main__":
    main()
