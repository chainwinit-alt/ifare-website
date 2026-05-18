#!/usr/bin/env python3
"""
Extract policy term candidates from iFare content using jieba + n-grams.

Purpose:
- Read IFare policy/code data from SQL Server
- Segment Chinese text with jieba
- Generate candidate terms from tokens and 2~4-grams
- Score and export candidates to CSV for manual review

Dependencies:
- pyodbc
- jieba

Example:
python scripts/extract-policy-term-candidates.py --output scripts/policy-term-candidates.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import jieba
import pyodbc


TITLE_WEIGHT = 2.0
CODE_WEIGHT = 1.5
DOC_WEIGHT = 1.2
TF_WEIGHT = 0.8
SPECIFICITY_WEIGHT = 3.0
MIN_TERM_LENGTH = 2
MAX_TERM_LENGTH = 20
DEFAULT_NGRAM_MIN = 2
DEFAULT_NGRAM_MAX = 4
DEFAULT_MIN_DF = 2
DEFAULT_TOP_N = 2000

STOPWORDS = {
    "台中市",
    "臺中市",
    "申請",
    "辦理",
    "補助",
    "計畫",
    "方案",
    "年度",
    "提供",
    "服務",
    "相關",
    "民眾",
}

BLOCKED_EXACT_TERMS = {
    "\u4ee5\u4e0a",
    "\u4ee5\u4e0b",
    "\u5176\u4ed6",
    "\u5c0d\u8c61",
    "\u653f\u5e9c",
    "\u8b49\u660e",
    "\u78ba\u5b9a",
    "\u63d0\u4f9b",
    "\u8fa6\u7406",
    "\u7533\u8acb",
    "\u9023\u540c",
    "\u8868\u793a",
    "\u8cc7\u6599",
    "\u554f\u984c",
    "\u4e0b\u5217",
    "\u76f8\u95dc",
    "\u6cd5\u4ee4",
    "\u898f\u5b9a",
}

BLOCKED_PREFIXES = (
    "\u7b26\u5408",
    "\u4e0b\u5217",
    "\u9818\u6709",
    "\u8a3c\u660e",
    "\u8a2d\u7c4d",
    "\u5c45\u4f4f",
    "\u4ee5\u4e0a",
    "\u4ee5\u4e0b",
    "\u6eff\u8db3",
    "\u5168\u5bb6\u4eba\u53e3",
    "\u6236\u5167",
    "\u5e73\u5747",
    "\u6bcf\u4eba\u6bcf\u6708",
    "\u5c31\u696d\u670d\u52d9",
    "\u5c45\u4f4f\u56fd\u5167",
    "\u8d77\u7b97",
)

BOUNDARY_ENTROPY_THRESHOLD = 0.6


@dataclass
class Document:
    text: str
    source: str
    source_kind: str


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
        "--output",
        default="scripts/policy-term-candidates.csv",
        help="Output CSV path",
    )
    parser.add_argument("--ngram-min", type=int, default=DEFAULT_NGRAM_MIN)
    parser.add_argument("--ngram-max", type=int, default=DEFAULT_NGRAM_MAX)
    parser.add_argument("--min-df", type=int, default=DEFAULT_MIN_DF)
    parser.add_argument("--top-n", type=int, default=DEFAULT_TOP_N)
    return parser.parse_args()


def strip_json_comments(text: str) -> str:
    cleaned_lines: list[str] = []
    for line in text.splitlines():
        stripped = line.lstrip()
        if stripped.startswith("//"):
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
    preferred = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server",
    ]
    for driver in preferred:
        if driver in available:
            return driver
    raise RuntimeError(
        "No SQL Server ODBC driver found. Install ODBC Driver 17/18 for SQL Server."
    )


def to_pyodbc_connection_string(connection_string: str) -> str:
    raw = parse_connection_string(connection_string)
    driver = raw.get("driver") or choose_odbc_driver()
    server = raw.get("server") or raw.get("data source")
    database = raw.get("database") or raw.get("initial catalog")
    trusted = raw.get("trusted_connection", raw.get("integrated security", "true"))
    encrypt = raw.get("encrypt", "no")
    trust_server_certificate = raw.get("trustservercertificate", "yes")

    trusted_normalized = "Yes"
    trusted_value = trusted.strip().lower()
    if trusted_value in {"false", "no", "0"}:
        trusted_normalized = "No"
    elif trusted_value in {"true", "yes", "1"}:
        trusted_normalized = "Yes"

    encrypt_normalized = "No"
    encrypt_value = encrypt.strip().lower()
    if encrypt_value in {"true", "yes", "1"}:
        encrypt_normalized = "Yes"
    elif encrypt_value in {"false", "no", "0"}:
        encrypt_normalized = "No"

    trust_server_certificate_normalized = "Yes"
    trust_server_certificate_value = trust_server_certificate.strip().lower()
    if trust_server_certificate_value in {"false", "no", "0"}:
        trust_server_certificate_normalized = "No"
    elif trust_server_certificate_value in {"true", "yes", "1"}:
        trust_server_certificate_normalized = "Yes"

    if not server:
        raise ValueError("Connection string does not contain Server/Data Source")
    if not database:
        raise ValueError("Connection string does not contain Database/Initial Catalog")

    return ";".join(
        [
            f"Driver={{{driver}}}",
            f"Server={server}",
            f"Database={database}",
            f"Trusted_Connection={trusted_normalized}",
            f"Encrypt={encrypt_normalized}",
            f"TrustServerCertificate={trust_server_certificate_normalized}",
        ]
    )


def normalize_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^【[^】]+】", "", text).strip()
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_term(text: str) -> str:
    text = normalize_text(text)
    text = text.lower()
    text = text.replace(" ", "").replace("-", "").replace("_", "").replace("　", "")
    return text


def is_good_term(text: str) -> bool:
    normalized = normalize_term(text)
    if len(normalized) < MIN_TERM_LENGTH or len(normalized) > MAX_TERM_LENGTH:
        return False
    if normalized.isdigit():
        return False
    if text in STOPWORDS or normalized in STOPWORDS:
        return False
    if normalized in BLOCKED_EXACT_TERMS:
        return False
    if any(normalized.startswith(prefix) for prefix in BLOCKED_PREFIXES):
        return False
    if re.fullmatch(r"[0-9a-zA-Z]+", normalized):
        return False
    if re.search(r"[()（）?？,，:：/\\]", text):
        return False
    return True


def tokenize(text: str) -> list[str]:
    tokens = [token.strip() for token in jieba.cut(text, cut_all=False)]
    return [token for token in tokens if token and is_good_term(token)]


def generate_ngrams(tokens: list[str], ngram_min: int, ngram_max: int) -> Iterable[str]:
    size = len(tokens)
    for n in range(ngram_min, ngram_max + 1):
        if size < n:
            continue
        for i in range(size - n + 1):
            phrase = "".join(tokens[i : i + n]).strip()
            if is_good_term(phrase):
                yield phrase


def has_exact_surface_evidence(document_text: str, phrase: str) -> bool:
    """
    Keep generated phrases only when the exact phrase appears in the source text.

    This avoids many dirty terms produced by token concatenation across punctuation
    or unrelated token boundaries, without relying on a hardcoded denylist.
    """
    return phrase in document_text


def iter_surface_occurrences(document_text: str, phrase: str) -> Iterable[tuple[str | None, str | None]]:
    start = 0
    while True:
        index = document_text.find(phrase, start)
        if index == -1:
            break
        left_char = document_text[index - 1] if index > 0 else None
        right_index = index + len(phrase)
        right_char = document_text[right_index] if right_index < len(document_text) else None
        yield left_char, right_char
        start = index + 1


def shannon_entropy(counter: Counter[str]) -> float:
    total = sum(counter.values())
    if total <= 0:
        return 0.0
    entropy = 0.0
    for count in counter.values():
        probability = count / total
        entropy -= probability * math.log(probability)
    return entropy


def fetch_documents(connection_string: str) -> tuple[list[Document], list[str]]:
    query = """
WITH valid_policy AS (
    SELECT
        p.ID,
        p.Title,
        p.Qualification
    FROM [dbo].[IFarePolicy] p
    WHERE
        p.State NOT IN (N'Disabled', N'Delete')
        AND p.ReleaseTime IS NOT NULL
        AND p.ReleaseTime <= GETDATE()
        AND (p.DiscontinuedTime IS NULL OR p.DiscontinuedTime > GETDATE())
)
SELECT
    CAST(vp.Title AS NVARCHAR(MAX)) AS text_value,
    CAST(N'title' AS NVARCHAR(50)) AS source_name,
    CAST(N'ifare_policy' AS NVARCHAR(50)) AS source_kind
FROM valid_policy vp
WHERE NULLIF(LTRIM(RTRIM(vp.Title)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(vp.Qualification AS NVARCHAR(MAX)) AS text_value,
    CAST(N'qualification' AS NVARCHAR(50)) AS source_name,
    CAST(N'ifare_policy' AS NVARCHAR(50)) AS source_kind
FROM valid_policy vp
WHERE NULLIF(LTRIM(RTRIM(vp.Qualification)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(k.LabelName AS NVARCHAR(MAX)) AS text_value,
    CAST(N'code_keyword' AS NVARCHAR(50)) AS source_name,
    CAST(N'code_keyword' AS NVARCHAR(50)) AS source_kind
FROM [dbo].[CodeKeyword] k
WHERE
    k.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(k.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(r.LabelName AS NVARCHAR(MAX)) AS text_value,
    CAST(N'code_recipient' AS NVARCHAR(50)) AS source_name,
    CAST(N'code_recipient' AS NVARCHAR(50)) AS source_kind
FROM [dbo].[CodeRecipient] r
WHERE
    r.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(r.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(i.LabelName AS NVARCHAR(MAX)) AS text_value,
    CAST(N'code_identity' AS NVARCHAR(50)) AS source_name,
    CAST(N'code_identity' AS NVARCHAR(50)) AS source_kind
FROM [dbo].[CodeIdentity] i
WHERE
    i.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(i.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(inc.LabelName AS NVARCHAR(MAX)) AS text_value,
    CAST(N'code_income' AS NVARCHAR(50)) AS source_name,
    CAST(N'code_income' AS NVARCHAR(50)) AS source_kind
FROM [dbo].[CodeIncome] inc
WHERE
    inc.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(inc.LabelName)), N'') IS NOT NULL

UNION ALL

SELECT
    CAST(cp.LabelName AS NVARCHAR(MAX)) AS text_value,
    CAST(N'code_policy' AS NVARCHAR(50)) AS source_name,
    CAST(N'code_policy' AS NVARCHAR(50)) AS source_kind
FROM [dbo].[CodePolicy] cp
WHERE
    cp.State NOT IN (N'Disabled', N'Delete')
    AND NULLIF(LTRIM(RTRIM(cp.LabelName)), N'') IS NOT NULL;
"""
    documents: list[Document] = []
    code_terms: list[str] = []

    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        for row in cursor.fetchall():
            text = normalize_text(str(row.text_value))
            if not text:
                continue
            source = str(row.source_name)
            source_kind = str(row.source_kind)
            documents.append(Document(text=text, source=source, source_kind=source_kind))
            if source.startswith("code_"):
                code_terms.append(text)

    return documents, code_terms


def build_user_dictionary(code_terms: Iterable[str]) -> None:
    for term in sorted({normalize_text(term) for term in code_terms if normalize_text(term)}):
        jieba.add_word(term, freq=100000)


def extract_candidates(
    documents: list[Document],
    ngram_min: int,
    ngram_max: int,
    min_df: int,
    total_documents: int,
) -> list[dict[str, object]]:
    tf = Counter()
    df = Counter()
    title_hits = Counter()
    code_hits = Counter()
    surface_hits = Counter()
    left_neighbors: dict[str, Counter[str]] = defaultdict(Counter)
    right_neighbors: dict[str, Counter[str]] = defaultdict(Counter)
    source_kinds = defaultdict(set)
    display_terms: dict[str, str] = {}

    for doc in documents:
        text = normalize_text(doc.text)
        if not text:
            continue

        tokens = tokenize(text)
        phrases = set()

        for token in tokens:
            if has_exact_surface_evidence(text, token):
                phrases.add(token)

        for phrase in generate_ngrams(tokens, ngram_min, ngram_max):
            if has_exact_surface_evidence(text, phrase):
                phrases.add(phrase)

        direct_text = normalize_text(text)
        if is_good_term(direct_text):
            phrases.add(direct_text)

        doc_terms = set()
        for phrase in phrases:
            if not is_good_term(phrase):
                continue
            normalized = normalize_term(phrase)
            display_terms.setdefault(normalized, phrase)
            tf[normalized] += 1
            doc_terms.add(normalized)
            source_kinds[normalized].add(doc.source_kind)
            if has_exact_surface_evidence(text, phrase):
                surface_hits[normalized] += 1
                for left_char, right_char in iter_surface_occurrences(text, phrase):
                    left_neighbors[normalized][left_char or "__START__"] += 1
                    right_neighbors[normalized][right_char or "__END__"] += 1
            if doc.source == "title":
                title_hits[normalized] += 1
            if doc.source.startswith("code_"):
                code_hits[normalized] += 1

        for normalized in doc_terms:
            df[normalized] += 1

    candidates: list[dict[str, object]] = []
    for normalized, term_freq in tf.items():
        if df[normalized] < min_df:
            continue

        left_entropy = shannon_entropy(left_neighbors[normalized])
        right_entropy = shannon_entropy(right_neighbors[normalized])
        min_boundary_entropy = min(left_entropy, right_entropy)
        if min_boundary_entropy < BOUNDARY_ENTROPY_THRESHOLD and code_hits[normalized] == 0:
            continue

        display_term = display_terms.get(normalized, normalized)
        specificity = math.log((total_documents + 1) / (df[normalized] + 1))
        score = (
            title_hits[normalized] * TITLE_WEIGHT
            + code_hits[normalized] * CODE_WEIGHT
            + specificity * SPECIFICITY_WEIGHT
            + math.log1p(term_freq) * TF_WEIGHT
        )
        candidates.append(
            {
                "term": display_term,
                "normalized_term": normalized,
                "term_freq": term_freq,
                "document_freq": df[normalized],
                "specificity": round(specificity, 6),
                "title_hit_count": title_hits[normalized],
                "code_hit_count": code_hits[normalized],
                "surface_hit_count": surface_hits[normalized],
                "left_entropy": round(left_entropy, 6),
                "right_entropy": round(right_entropy, 6),
                "source_kind_count": len(source_kinds[normalized]),
                "score": round(score, 6),
            }
        )

    candidates.sort(
        key=lambda item: (
            -float(item["score"]),
            -int(item["document_freq"]),
            -int(item["term_freq"]),
            str(item["term"]),
        )
    )
    return candidates


def write_csv(output_path: Path, candidates: list[dict[str, object]], top_n: int) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "term",
        "normalized_term",
        "term_freq",
        "document_freq",
        "specificity",
        "title_hit_count",
        "code_hit_count",
        "surface_hit_count",
        "left_entropy",
        "right_entropy",
        "source_kind_count",
        "score",
    ]
    with output_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in candidates[:top_n]:
            writer.writerow(row)


if __name__ == "__main__":
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()
    output_path = (repo_root / args.output).resolve()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)
    documents, code_terms = fetch_documents(pyodbc_connection_string)
    build_user_dictionary(code_terms)
    candidates = extract_candidates(documents, args.ngram_min, args.ngram_max, args.min_df, len(documents))
    write_csv(output_path, candidates, args.top_n)

    print(f"documents={len(documents)}")
    print(f"code_terms={len(code_terms)}")
    print(f"candidates={len(candidates)}")
    print(f"output={output_path}")
