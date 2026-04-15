from datetime import UTC, datetime

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.api.deps import AdminUser
from app.schemas.logs import LogRecord, LogSearchResponse
from app.services.store import store

router = APIRouter()


@router.get("/search")
def search_logs(
    _: AdminUser,
    level: str | None = Query(default=None),
    service: str | None = Query(default=None),
    q: str | None = Query(default=None),
    request_id: str | None = Query(default=None),
    session_id: str | None = Query(default=None),
    user_id: str | None = Query(default=None),
) -> LogSearchResponse:
    records: list[LogRecord] = []
    for audit in store.audit_logs:
        text_payload = f"{audit.action} {audit.resource_type} {audit.resource_id}".lower()
        if q and q.lower() not in text_payload:
            continue
        if user_id and audit.actor_user_id != user_id:
            continue
        if session_id:
            continue
        if request_id:
            continue
        if service and service != "rag-api":
            continue
        if level and level.upper() not in {"INFO", "WARNING", "ERROR", "DEBUG", "CRITICAL"}:
            continue

        records.append(
            LogRecord(
                timestamp=audit.created_at.isoformat().replace("+00:00", "Z"),
                level="INFO",
                service="rag-api",
                event="audit.log",
                message=f"{audit.action} on {audit.resource_type}:{audit.resource_id}",
                request_id=None,
                session_id=None,
                user_id=audit.actor_user_id,
                metadata={"before": audit.before_json, "after": audit.after_json},
            )
        )
    return LogSearchResponse(items=records)


@router.get("/stream")
def stream_logs(_: AdminUser) -> StreamingResponse:
    def event_stream():
        now = datetime.now(UTC).isoformat().replace("+00:00", "Z")
        yield (
            "event: log\n"
            f'data: {{"timestamp":"{now}","level":"INFO","service":"rag-api",'
            '"event":"logs.stream.connected","message":"stream connected",'
            '"request_id":null,"session_id":null,"user_id":null,"metadata":{}}\n\n'
        )
        for audit in store.audit_logs[-100:]:
            ts = audit.created_at.isoformat().replace("+00:00", "Z")
            payload = (
                f"event: log\n"
                f'data: {{"timestamp":"{ts}","level":"INFO","service":"rag-api",'
                f'"event":"audit.log","message":"{audit.action}",'
                '"request_id":null,"session_id":null,'
                f'"user_id":"{audit.actor_user_id}","metadata":{{}}}}\n\n'
            )
            yield payload

    return StreamingResponse(event_stream(), media_type="text/event-stream")
