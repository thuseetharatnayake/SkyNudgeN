"""Verify that DATABASE_URL can connect without exposing credentials."""
from database import get_connection


try:
    connection = get_connection()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    finally:
        connection.close()
except RuntimeError as error:
    print(f"Database connection failed: {error}")
    raise SystemExit(1)

print("Database connection successful")