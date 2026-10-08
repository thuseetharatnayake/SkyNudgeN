"""Health-only FastAPI service for SkyNudge database setup."""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Response, status

from database import BASE_DIR, get_connection, initialize_database

load_dotenv(BASE_DIR / ".env")


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("RUN_DB_INIT_ON_STARTUP", "true").lower() == "true":
        initialize_database()
    yield


app = FastAPI(title="SkyNudge Backend", version="1.0.0", lifespan=lifespan)


@app.get("/")
def root() -> dict[str, str]:
    """Return a non-sensitive service status."""
    return {"status": "ok"}


@app.get("/health")
def health(response: Response) -> dict[str, str]:
    """Verify PostgreSQL availability without returning connection details."""
    try:
        connection = get_connection()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        finally:
            connection.close()
    except RuntimeError:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {"status": "error"}
    return {"status": "ok"}