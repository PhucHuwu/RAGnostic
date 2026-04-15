import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.request_context import set_request_id, set_session_id, set_user_id


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("x-request-id", f"req_{uuid.uuid4().hex[:12]}")
        request.state.request_id = request_id
        set_request_id(request_id)
        set_session_id(None)
        set_user_id(None)
        try:
            response = await call_next(request)
        finally:
            set_request_id(None)
            set_session_id(None)
            set_user_id(None)
        response.headers["x-request-id"] = request_id
        return response
