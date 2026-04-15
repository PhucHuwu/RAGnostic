from __future__ import annotations

import hashlib
from collections import defaultdict
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.request_context import set_user_id
from app.core.security import AuthTokenType, UserRole, decode_token
from app.db.session import get_db
from app.models.db import UserDB
from app.services.store import store

bearer_scheme = HTTPBearer(auto_error=False)
BearerCredentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]

_auth_rate_window_seconds = 60
_auth_rate_limit_per_minute = 20
_auth_attempts: dict[str, list[float]] = defaultdict(list)


def _now_ts() -> float:
    return datetime.now(UTC).timestamp()


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


def raise_api_error(
    request: Request,
    status_code: int,
    code: str,
    message: str,
    details: dict | None = None,
) -> None:
    raise HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
            "details": details,
            "request_id": _request_id(request),
        },
    )


def get_client_ip(
    request: Request,
    x_forwarded_for: str | None = Header(default=None),
) -> str:
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_auth_rate_limit(key: str) -> None:
    now = _now_ts()
    attempts = _auth_attempts[key]
    _auth_attempts[key] = [ts for ts in attempts if now - ts <= _auth_rate_window_seconds]
    if len(_auth_attempts[key]) >= _auth_rate_limit_per_minute:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": "Too many authentication attempts",
                "details": {"retry_after_seconds": _auth_rate_window_seconds},
                "request_id": None,
            },
        )
    _auth_attempts[key].append(now)


def get_current_user(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    credentials: BearerCredentials,
) -> UserDB:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise_api_error(
            request,
            status.HTTP_401_UNAUTHORIZED,
            "UNAUTHORIZED",
            "Missing bearer token",
        )

    try:
        payload = decode_token(credentials.credentials, settings.jwt_secret)
    except ValueError as exc:
        raise_api_error(
            request,
            status.HTTP_401_UNAUTHORIZED,
            "UNAUTHORIZED",
            str(exc),
        )

    if payload.get("type") != AuthTokenType.ACCESS:
        raise_api_error(
            request,
            status.HTTP_401_UNAUTHORIZED,
            "UNAUTHORIZED",
            "Invalid token type",
        )

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise_api_error(
            request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Invalid token subject"
        )

    user = store.get_user(db, user_id)
    if user is None:
        raise_api_error(request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "User not found")
    set_user_id(user.id)
    return user


CurrentUser = Annotated[UserDB, Depends(get_current_user)]


def require_admin(current_user: CurrentUser) -> UserDB:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN",
                "message": "Admin role required",
                "details": None,
                "request_id": None,
            },
        )
    return current_user


AdminUser = Annotated[UserDB, Depends(require_admin)]
ClientIP = Annotated[str, Depends(get_client_ip)]
DbSession = Annotated[Session, Depends(get_db)]


def hash_refresh_token(refresh_token: str) -> str:
    return hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
