from datetime import datetime

from pydantic import BaseModel


class LogRecord(BaseModel):
    timestamp: str
    level: str
    service: str
    event: str
    message: str
    request_id: str | None = None
    session_id: str | None = None
    user_id: str | None = None
    metadata: dict


class LogSearchResponse(BaseModel):
    items: list[LogRecord]


class ReadyCheck(BaseModel):
    status: str
    checks: dict[str, str]
    timestamp: datetime
