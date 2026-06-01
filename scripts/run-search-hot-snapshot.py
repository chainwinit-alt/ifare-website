#!/usr/bin/env python3
"""
Manually rebuild iFare search hot snapshot.

This is a simple trigger script for environments like SQL Server Express where
SQL Server Agent is unavailable.

Examples:
python scripts/run-search-hot-snapshot.py
python scripts/run-search-hot-snapshot.py --window-days 7
python scripts/run-search-hot-snapshot.py --start-date 2026-05-01 --end-date 2026-05-18
"""

from __future__ import annotations

import argparse
import json
from datetime import date, timedelta
from pathlib import Path

import pyodbc


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
        "--window-days",
        type=int,
        default=30,
        help="Rolling lookback window in days when explicit dates are not provided",
    )
    parser.add_argument(
        "--start-date",
        help="Explicit start date in YYYY-MM-DD",
    )
    parser.add_argument(
        "--end-date",
        help="Explicit end date in YYYY-MM-DD",
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


def resolve_dates(args: argparse.Namespace) -> tuple[str, str]:
    if args.start_date and args.end_date:
        return args.start_date, args.end_date
    if args.start_date or args.end_date:
        raise ValueError("--start-date and --end-date must be provided together")

    end_date = date.today()
    start_date = end_date - timedelta(days=max(args.window_days - 1, 0))
    return start_date.isoformat(), end_date.isoformat()


def execute_rebuild(connection_string: str, start_date: str, end_date: str) -> int:
    with pyodbc.connect(connection_string) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
EXEC [dbo].[sp_rebuild_policy_term_hot_stat]
    @start_date = ?,
    @end_date = ?;
""",
            start_date,
            end_date,
        )
        conn.commit()

        cursor.execute("SELECT COUNT(*) FROM [dbo].[search_term_stat_daily];")
        row_count = int(cursor.fetchone()[0])
        return row_count


def main() -> None:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[1]
    appsettings_path = (repo_root / args.appsettings).resolve()

    connection_string = load_connection_string(appsettings_path, args.connection_string_name)
    pyodbc_connection_string = to_pyodbc_connection_string(connection_string)
    start_date, end_date = resolve_dates(args)
    row_count = execute_rebuild(pyodbc_connection_string, start_date, end_date)

    print(f"start_date={start_date}")
    print(f"end_date={end_date}")
    print(f"search_term_stat_daily_rows={row_count}")


if __name__ == "__main__":
    main()
