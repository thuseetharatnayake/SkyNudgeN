"""Database connection and schema initialization for SkyNudge."""
from __future__ import annotations

import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "sql" / "schema.sql"


def get_database_url() -> str:
    """Load the local connection string and enforce TLS for Supabase."""
    load_dotenv(BASE_DIR / ".env")
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured.")
    if "sslmode=" not in database_url:
        separator = "&" if "?" in database_url else "?"
        database_url = f"{database_url}{separator}sslmode=require"
    return database_url


def get_connection():
    """Create a PostgreSQL connection without ever exposing its details."""
    try:
        return psycopg2.connect(get_database_url(), connect_timeout=15)
    except psycopg2.Error as error:
        raise RuntimeError(
            "Unable to connect to the database. Check local configuration; "
            "connection details are redacted."
        ) from error


def initialize_database() -> None:
    """Run the exact reviewed SQL schema file in one transaction."""
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")
    connection = get_connection()
    try:
        with connection:
            with connection.cursor() as cursor:
                cursor.execute(schema_sql)
    except (OSError, psycopg2.Error) as error:
        raise RuntimeError(
            "Database initialization failed. Connection details are redacted."
        ) from error
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        initialize_database()
    except RuntimeError as error:
        print(f"Database initialization failed: {error}")
        raise SystemExit(1)
    print("Database initialization completed successfully")