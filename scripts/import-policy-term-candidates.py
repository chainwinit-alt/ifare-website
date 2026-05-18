#!/usr/bin/env python3
"""
Import extracted policy term candidates CSV into SQL Server.

Default target:
- dbo.search_policy_term_candidate

Optional:
- run dbo.sp_promote_policy_term_candidate_to_search_term after import

Examples:
python scripts/import-policy-term-candidates.py
python scripts/import-policy-term-candidates.py --csv scripts/policy-term-candidates.csv --promote
python scripts/import-policy-term-candidates.py --min-score 5 --min-policy-count 3 --promote
python scripts/import-policy-term-candidates.py --replace-source-kind
python scripts/import-policy-term-candidates.py --replace-source-kind --replace-search-term --promote
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path

import pyodbc


@dataclass(frozen=True)
class CandidateRow:
    term: str
    normalized_term: str
    term_freq: int
    document_freq: int
    specificity: float
    title_hit_count: int
    code_hit_count: int
    surface_hit_count: int
    left_entropy: float
    right_entropy: float
    source_kind_count: int
    score: float


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
        default="scripts/policy-term-candidates.csv",
        help="Candidate CSV path",
    )
    parser.add_argument(
        "--min-score",
        type=float,
        default=0.0,
        help="Skip CSV rows below this score before import",
    )
    parser.add_argument(
        "--min-policy-count",
        type=int,
        default=2,
        help="Skip CSV rows below this document_freq before import",
    )
    parser.add_argument(
        "--source-kind",
        default="policy_extract",
        help="source_kind written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--evidence-field",
        default="csv_extract",
        help="evidence_field written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--term-type",
        default="keyword",
        help="term_type written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--status",
        default="ready",
        help="status written into dbo.search_policy_term_candidate",
    )
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Run dbo.sp_promote_policy_term_candidate_to_search_term after import",
    )
    parser.add_argument(
        "--replace-source-kind",
        action="store_true",
        help="Delete existing dbo.search_policy_term_candidate rows for the same source_kind before import",
    )
    parser.add_argument(
        "--replace-search-term",
        action="store_true",
        help="Delete existing dbo.search_term and dbo.search_term_source rows for the same source_kind before promote",
    )
    parser.add_argument(
        "--promote-min-quality-score",
        type=float,
        default=2.0,
        help="Promotion threshold for quality_score",
    )
    parser.add_argument(
        "--promote-min-policy-count",
        type=int,
        default=2,
        help="Promotion threshold for policy_count",
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


def to_int(value: str | None) -> int:
    if value is None or value == "":
        return 0
    return int(float(value))


def to_float(value: str | None) -> float:
    if value is None or value == "":
        return 0.0
    return float(value)


def read_candidates(csv_path: Path, min_score: float, min_policy_count: int) -> list[CandidateRow]:
    rows: list[CandidateRow] = []
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            row = CandidateRow(
                term=(raw.get("term") or "").strip(),
                normalized_term=(raw.get("normalized_term") or "").strip(),
                term_freq=to_int(raw.get("term_freq")),
                document_freq=to_int(raw.get("document_freq")),
                specificity=to_float(raw.get("specificity")),
                title_hit_count=to_int(raw.get("title_hit_count")),
                code_hit_count=to_int(raw.get("code_hit_count")),
                surface_hit_count=to_int(raw.get("surface_hit_count")),
                left_entropy=to_float(raw.get("left_entropy")),
                right_entropy=to_float(raw.get("right_entropy")),
                source_kind_count=to_int(raw.get("source_kind_count")),
                score=to_float(raw.get("score")),
            )
            if not row.term or not row.normalized_term:
                continue
            if row.score < min_score:
                continue
            if row.document_freq < min_policy_count:
                continue
            rows.append(row)
    return rows


def import_candidates(
    connection_string: str,
    rows: list[CandidateRow],
    source_kind: str,
    evidence_field: str,
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
IF OBJECT_ID('tempdb..#policy_term_candidate_stage') IS NOT NULL
    DROP TABLE #policy_term_candidate_stage;

CREATE TABLE #policy_term_candidate_stage
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

        cursor.fast_executemany = True
        cursor.executemany(
            """
INSERT INTO #policy_term_candidate_stage
(
    term, normalized_term, display_term, term_type, source_kind, source_ref_id, evidence_field,
    policy_count, title_hit_count, keyword_hit_count, recipient_hit_count, identity_hit_count,
    income_hit_count, policy_type_hit_count, content_score, quality_score, status
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""",
            [
                (
                    row.term,
                    row.normalized_term,
                    row.term,
                    term_type,
                    source_kind,
                    None,
                    evidence_field,
                    row.document_freq,
                    row.title_hit_count,
                    row.code_hit_count,
                    0,
                    0,
                    0,
                    0,
                    row.score,
                    row.score,
                    status,
                )
                for row in rows
            ],
        )

        cursor.execute(
            """
MERGE [dbo].[search_policy_term_candidate] AS target
USING #policy_term_candidate_stage AS src
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


def delete_search_term_by_source_kind(connection_string: str, source_kind: str) -> None:
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
DELETE src
FROM [dbo].[search_term_source] src
INNER JOIN [dbo].[search_term] term
    ON term.id = src.term_id
WHERE term.source_kind = ?;
""",
            source_kind,
        )
        cursor.execute(
            """
DELETE FROM [dbo].[search_term]
WHERE source_kind = ?;
""",
            source_kind,
        )
        conn.commit()


def promote_candidates(connection_string: str, min_quality_score: float, min_policy_count: int) -> None:
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
EXEC [dbo].[sp_promote_policy_term_candidate_to_search_term]
    @min_quality_score = ?,
    @min_policy_count = ?;
""",
            min_quality_score,
            min_policy_count,
        )
        conn.commit()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()
    csv_path = (repo_root / args.csv).resolve()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)

    rows = read_candidates(csv_path, args.min_score, args.min_policy_count)
    import_candidates(
        pyodbc_connection_string,
        rows,
        source_kind=args.source_kind,
        evidence_field=args.evidence_field,
        term_type=args.term_type,
        status=args.status,
        replace_source_kind=args.replace_source_kind,
    )

    if args.replace_search_term:
        delete_search_term_by_source_kind(pyodbc_connection_string, args.source_kind)

    if args.promote:
        promote_candidates(
            pyodbc_connection_string,
            min_quality_score=args.promote_min_quality_score,
            min_policy_count=args.promote_min_policy_count,
        )

    print(f"csv={csv_path}")
    print(f"imported_rows={len(rows)}")
    print(f"replaced_search_term={'yes' if args.replace_search_term else 'no'}")
    print(f"promoted={'yes' if args.promote else 'no'}")


if __name__ == "__main__":
    main()
