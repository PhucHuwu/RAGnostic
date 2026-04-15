from datetime import datetime

from pydantic import BaseModel, Field


class APIError(BaseModel):
    code: str
    message: str
    details: dict | None = None
    request_id: str | None = None


class PaginationCursorResponse(BaseModel):
    items: list[dict]
    next_cursor: str | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str | None = None


class ReadyResponse(BaseModel):
    status: str = "ready"
    checks: dict[str, str] = Field(default_factory=dict)
    timestamp: datetime
