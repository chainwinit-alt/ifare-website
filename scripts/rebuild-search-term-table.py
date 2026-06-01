#!/usr/bin/env python3
"""
Rebuild or sync dbo.search_term from trusted IFare source tables.

Why this exists:
- scripts/extract-policy-term-candidates.py is useful for candidate discovery,
  but its CSV output contains noisy n-grams and should not directly replace
  dbo.search_term.
- This script only uses trusted source tables and applies deterministic
  normalization/deduplication before syncing dbo.search_term and
  dbo.search_term_source.

Examples:
python scripts/rebuild-search-term-table.py --preview-csv scripts/search-term-preview.csv
python scripts/rebuild-search-term-table.py --apply
python scripts/rebuild-search-term-table.py --apply --prune-missing
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path

import pyodbc


MANAGED_SOURCE_KINDS = (
    "ifare_policy",
    "code_keyword",
    "code_recipient",
    "code_identity",
    "code_income",
    "code_policy",
)

SOURCE_PRIORITY = {
    "ifare_policy": 1,
    "code_keyword": 2,
    "code_policy": 3,
    "code_recipient": 4,
    "code_identity": 5,
    "code_income": 6,
}


@dataclass(frozen=True)
class SourceTerm:
    term: str
    normalized_term: str
    display_term: str
    term_type: str
    source_kind: str
    source_ref_id: str
    base_weight: float


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
        "--preview-csv",
        help="Optional CSV output for the final deduplicated search_term rows",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply MERGE changes to dbo.search_term and dbo.search_term_source",
    )
    parser.add_argument(
        "--prune-missing",
        action="store_true",
        help="When used with --apply, set missing managed dbo.search_term rows to inactive",
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


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def clean_policy_title(text: str) -> str:
    text = normalize_whitespace(text)
    text = re.sub(r"^[【\[][^】\]]{1,30}[】\]]\s*", "", text)
    return text.strip()


def normalize_term(text: str) -> str:
    text = normalize_whitespace(text).lower()
    return (
        text.replace(" ", "")
        .replace("-", "")
        .replace("_", "")
        .replace("/", "")
        .replace("\\", "")
        .replace(" ", "")
    )


def fetch_source_terms(connection_string: str) -> list[SourceTerm]:
    query = """
WITH valid_policy AS (
    SELECT
        p.ID,
        p.Title
    FROM [dbo].[IFarePolicy] p
    WHERE
        p.State NOT IN (N'Disabled', N'Delete')
        AND p.ReleaseTime IS NOT NULL
        AND p.ReleaseTime <= GETDATE()
        AND (p.DiscontinuedTime IS NULL OR p.DiscontinuedTime > GETDATE())
)
SELECT
    CAST(vp.Title AS NVARCHAR(200)) AS term,
    CAST(N'policy_title' AS NVARCHAR(50)) AS term_type,
    CAST(N'ifare_policy' AS NVARCHAR(50)) AS source_kind,
    CAST(vp.ID AS NVARCHAR(100)) AS source_ref_id,
    CAST(1.2000 AS DECIMAL(10,4)) AS base_weight
FROM valid_policy vp
WHERE NULLIF(LTRIM(RTRIM(vp.Title)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(k.LabelName AS NVARCHAR(200)),
    CAST(N'keyword' AS NVARCHAR(50)),
    CAST(N'code_keyword' AS NVARCHAR(50)),
    CAST(k.ID AS NVARCHAR(100)),
    CAST(1.1000 AS DECIMAL(10,4))
FROM [dbo].[CodeKeyword] k
WHERE
    k.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(k.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(r.LabelName AS NVARCHAR(200)),
    CAST(N'recipient' AS NVARCHAR(50)),
    CAST(N'code_recipient' AS NVARCHAR(50)),
    CAST(r.ID AS NVARCHAR(100)),
    CAST(1.0000 AS DECIMAL(10,4))
FROM [dbo].[CodeRecipient] r
WHERE
    r.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(r.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(i.LabelName AS NVARCHAR(200)),
    CAST(N'identity' AS NVARCHAR(50)),
    CAST(N'code_identity' AS NVARCHAR(50)),
    CAST(i.ID AS NVARCHAR(100)),
    CAST(0.9500 AS DECIMAL(10,4))
FROM [dbo].[CodeIdentity] i
WHERE
    i.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(i.LabelName AS NVARCHAR(200)),
    CAST(N'income' AS NVARCHAR(50)),
    CAST(N'code_income' AS NVARCHAR(50)),
    CAST(i.ID AS NVARCHAR(100)),
    CAST(0.9000 AS DECIMAL(10,4))
FROM [dbo].[CodeIncome] i
WHERE
    i.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(p.LabelName AS NVARCHAR(200)),
    CAST(N'policy' AS NVARCHAR(50)),
    CAST(N'code_policy' AS NVARCHAR(50)),
    CAST(p.ID AS NVARCHAR(100)),
    CAST(1.0500 AS DECIMAL(10,4))
FROM [dbo].[CodePolicy] p
WHERE
    p.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(p.LabelName)), N'') IS NOT NULL;
"""
    rows: list[SourceTerm] = []
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        for row in cursor.fetchall():
            raw_term = str(row.term).strip()
            source_kind = str(row.source_kind)
            display_term = clean_policy_title(raw_term) if source_kind == "ifare_policy" else normalize_whitespace(raw_term)
            normalized = normalize_term(display_term)
            if not display_term or not normalized:
                continue
            rows.append(
                SourceTerm(
                    term=display_term,
                    normalized_term=normalized,
                    display_term=display_term,
                    term_type=str(row.term_type),
                    source_kind=source_kind,
                    source_ref_id=str(row.source_ref_id),
                    base_weight=float(row.base_weight),
                )
            )
    return rows


def deduplicate_terms(source_terms: list[SourceTerm]) -> list[SourceTerm]:
    best_by_key: dict[tuple[str, str], SourceTerm] = {}
    for item in source_terms:
        key = (item.normalized_term, item.term_type)
        current = best_by_key.get(key)
        if current is None:
            best_by_key[key] = item
            continue
        current_priority = (
            current.base_weight,
            -SOURCE_PRIORITY.get(current.source_kind, 99),
            current.source_ref_id,
        )
        next_priority = (
            item.base_weight,
            -SOURCE_PRIORITY.get(item.source_kind, 99),
            item.source_ref_id,
        )
        if next_priority > current_priority:
            best_by_key[key] = item
    return sorted(
        best_by_key.values(),
        key=lambda item: (item.term_type, item.normalized_term, item.source_kind, item.source_ref_id),
    )


def write_preview_csv(output_path: Path, rows: list[SourceTerm]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "term",
                "normalized_term",
                "display_term",
                "term_type",
                "source_kind",
                "source_ref_id",
                "base_weight",
            ],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "term": row.term,
                    "normalized_term": row.normalized_term,
                    "display_term": row.display_term,
                    "term_type": row.term_type,
                    "source_kind": row.source_kind,
                    "source_ref_id": row.source_ref_id,
                    "base_weight": f"{row.base_weight:.4f}",
                }
            )


def apply_sync(connection_string: str, rows: list[SourceTerm], prune_missing: bool) -> None:
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
IF OBJECT_ID('tempdb..#search_term_stage') IS NOT NULL DROP TABLE #search_term_stage;
IF OBJECT_ID('tempdb..#search_term_source_stage') IS NOT NULL DROP TABLE #search_term_source_stage;

CREATE TABLE #search_term_stage
(
    term NVARCHAR(200) NOT NULL,
    normalized_term NVARCHAR(200) NOT NULL,
    display_term NVARCHAR(200) NOT NULL,
    term_type NVARCHAR(50) NOT NULL,
    source_kind NVARCHAR(50) NOT NULL,
    source_ref_id NVARCHAR(100) NOT NULL,
    base_weight DECIMAL(10,4) NOT NULL
);

CREATE TABLE #search_term_source_stage
(
    normalized_term NVARCHAR(200) NOT NULL,
    term_type NVARCHAR(50) NOT NULL,
    source_kind NVARCHAR(50) NOT NULL,
    source_ref_id NVARCHAR(100) NOT NULL,
    source_score DECIMAL(10,4) NOT NULL
);
"""
        )

        cursor.fast_executemany = True
        cursor.executemany(
            """
INSERT INTO #search_term_stage
    (term, normalized_term, display_term, term_type, source_kind, source_ref_id, base_weight)
VALUES (?, ?, ?, ?, ?, ?, ?)
""",
            [
                (
                    row.term,
                    row.normalized_term,
                    row.display_term,
                    row.term_type,
                    row.source_kind,
                    row.source_ref_id,
                    row.base_weight,
                )
                for row in rows
            ],
        )

        cursor.executemany(
            """
INSERT INTO #search_term_source_stage
    (normalized_term, term_type, source_kind, source_ref_id, source_score)
VALUES (?, ?, ?, ?, ?)
""",
            [
                (
                    row.normalized_term,
                    row.term_type,
                    row.source_kind,
                    row.source_ref_id,
                    row.base_weight,
                )
                for row in rows
            ],
        )

        cursor.execute(
            """
MERGE [dbo].[search_term] AS target
USING #search_term_stage AS src
ON target.normalized_term = src.normalized_term
AND target.term_type = src.term_type
WHEN MATCHED THEN
    UPDATE SET
        target.term = src.term,
        target.display_term = src.display_term,
        target.status = N'active',
        target.language = N'zh-TW',
        target.base_weight = src.base_weight,
        target.source_kind = src.source_kind,
        target.source_ref_id = src.source_ref_id,
        target.updated_at = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT
    (
        term,
        normalized_term,
        display_term,
        term_type,
        status,
        language,
        base_weight,
        manual_boost,
        source_kind,
        source_ref_id,
        created_at,
        updated_at
    )
    VALUES
    (
        src.term,
        src.normalized_term,
        src.display_term,
        src.term_type,
        N'active',
        N'zh-TW',
        src.base_weight,
        0.0000,
        src.source_kind,
        src.source_ref_id,
        SYSUTCDATETIME(),
        SYSUTCDATETIME()
    );

MERGE [dbo].[search_term_source] AS target
USING
(
    SELECT
        t.id AS term_id,
        s.source_kind,
        s.source_ref_id AS source_ref,
        s.source_score
    FROM #search_term_source_stage s
    INNER JOIN [dbo].[search_term] t
        ON t.normalized_term = s.normalized_term
       AND t.term_type = s.term_type
) AS src
ON target.term_id = src.term_id
AND target.source_kind = src.source_kind
AND ISNULL(target.source_ref, N'') = ISNULL(src.source_ref, N'')
WHEN MATCHED THEN
    UPDATE SET
        target.source_score = src.source_score
WHEN NOT MATCHED THEN
    INSERT (term_id, source_kind, source_ref, source_score, created_at)
    VALUES (src.term_id, src.source_kind, src.source_ref, src.source_score, SYSUTCDATETIME());
"""
        )

        if prune_missing:
            managed_kinds = ", ".join(f"N'{kind}'" for kind in MANAGED_SOURCE_KINDS)
            cursor.execute(
                f"""
UPDATE t
SET
    t.status = N'inactive',
    t.updated_at = SYSUTCDATETIME()
FROM [dbo].[search_term] t
WHERE
    t.source_kind IN ({managed_kinds})
    AND NOT EXISTS
    (
        SELECT 1
        FROM #search_term_stage s
        WHERE s.normalized_term = t.normalized_term
          AND s.term_type = t.term_type
    );
"""
            )

        conn.commit()


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()
    preview_csv = (repo_root / args.preview_csv).resolve() if args.preview_csv else None

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)

    source_terms = fetch_source_terms(pyodbc_connection_string)
    final_terms = deduplicate_terms(source_terms)

    if preview_csv:
        write_preview_csv(preview_csv, final_terms)

    if args.apply:
        apply_sync(pyodbc_connection_string, final_terms, prune_missing=args.prune_missing)

    print(f"source_terms={len(source_terms)}")
    print(f"final_terms={len(final_terms)}")
    if preview_csv:
        print(f"preview_csv={preview_csv}")
    print(f"applied={'yes' if args.apply else 'no'}")
    print(f"prune_missing={'yes' if args.prune_missing else 'no'}")


if __name__ == "__main__":
    main()
