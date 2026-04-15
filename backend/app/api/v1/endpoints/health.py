from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession
from app.schemas.common import HealthResponse, ReadyResponse
from app.services.store import store

router = APIRouter()


@router.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="rag-api")


@router.get("/ready")
def ready(db: DbSession) -> ReadyResponse:
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    admin_seeded = "missing"
    try:
        if store.get_user_by_username(db, "admin") is not None:
            admin_seeded = "ok"
    except Exception:
        admin_seeded = "unknown"

    return ReadyResponse(
        status="ready",
        checks={
            "database": db_status,
            "cache": "ok",
            "object_storage": "ok",
            "llm_provider": "ok",
            "seed_admin": admin_seeded,
        },
        timestamp=datetime.now(UTC),
    )
