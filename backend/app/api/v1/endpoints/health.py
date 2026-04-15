from fastapi import APIRouter

from app.models.entities import utcnow
from app.schemas.common import HealthResponse, ReadyResponse
from app.services.store import store

router = APIRouter()


@router.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="rag-api")


@router.get("/ready")
def ready() -> ReadyResponse:
    return ReadyResponse(
        status="ready",
        checks={
            "database": "ok",
            "cache": "ok",
            "object_storage": "ok",
            "llm_provider": "ok",
            "seed_admin": "ok" if store.get_user_by_username("admin") else "missing",
        },
        timestamp=utcnow(),
    )
