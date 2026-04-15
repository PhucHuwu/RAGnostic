import uuid
from datetime import timedelta

from fastapi import APIRouter, Request, status

from app.api.deps import (
    ClientIP,
    CurrentUser,
    DbSession,
    enforce_auth_rate_limit,
    hash_refresh_token,
    raise_api_error,
)
from app.core.config import settings
from app.core.security import AuthTokenType, create_token, verify_password
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenLogoutRequest,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserInfo,
)
from app.services.store import store

router = APIRouter()


@router.post("/login")
def login(
    payload: LoginRequest, request: Request, client_ip: ClientIP, db: DbSession
) -> LoginResponse:
    enforce_auth_rate_limit(f"login:{client_ip}")
    user = store.get_user_by_username(db, payload.username)
    if user is None or not verify_password(payload.password, user.password_hash):
        raise_api_error(
            request,
            status.HTTP_401_UNAUTHORIZED,
            "INVALID_CREDENTIALS",
            "Invalid username or password",
        )

    access_payload = {
        "sub": user.id,
        "role": user.role,
        "type": AuthTokenType.ACCESS,
    }
    refresh_jti = str(uuid.uuid4())
    access_token = create_token(
        access_payload,
        settings.jwt_secret,
        timedelta(minutes=settings.jwt_access_expires_minutes),
    )
    refresh_token = create_token(
        {
            "sub": user.id,
            "role": user.role,
            "type": AuthTokenType.REFRESH,
            "sid": refresh_jti,
        },
        settings.jwt_secret,
        timedelta(days=settings.jwt_refresh_expires_days),
    )
    session = store.create_session(
        db,
        user_id=user.id,
        refresh_token=refresh_token,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
        expires_days=settings.jwt_refresh_expires_days,
        session_id=refresh_jti,
    )
    user.last_login_at = session.updated_at
    db.commit()
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserInfo(id=user.id, username=user.username, role=user.role),
    )


@router.post("/refresh")
def refresh(payload: TokenRefreshRequest, request: Request, db: DbSession) -> TokenRefreshResponse:
    enforce_auth_rate_limit("refresh:global")
    from app.core.security import decode_token

    try:
        token_payload = decode_token(payload.refresh_token, settings.jwt_secret)
    except ValueError as exc:
        raise_api_error(request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", str(exc))

    if token_payload.get("type") != AuthTokenType.REFRESH:
        raise_api_error(
            request,
            status.HTTP_401_UNAUTHORIZED,
            "UNAUTHORIZED",
            "Invalid token type",
        )

    user_id = token_payload.get("sub")
    if not isinstance(user_id, str):
        raise_api_error(
            request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Invalid token subject"
        )

    user = store.get_user(db, user_id)
    if user is None:
        raise_api_error(request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "User not found")

    session_id = token_payload.get("sid")
    if not isinstance(session_id, str):
        raise_api_error(request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Missing session id")

    session = store.get_session(db, session_id)
    if session is None or session.revoked_at is not None:
        raise_api_error(request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", "Session revoked")

    if hash_refresh_token(payload.refresh_token) != session.refresh_token_hash:
        raise_api_error(
            request,
            status.HTTP_401_UNAUTHORIZED,
            "UNAUTHORIZED",
            "Refresh token does not match",
        )

    access_payload = {"sub": user.id, "role": user.role, "type": AuthTokenType.ACCESS}
    new_refresh_payload = {
        "sub": user.id,
        "role": user.role,
        "type": AuthTokenType.REFRESH,
        "sid": session.id,
    }
    access_token = create_token(
        access_payload,
        settings.jwt_secret,
        timedelta(minutes=settings.jwt_access_expires_minutes),
    )
    refresh_token = create_token(
        new_refresh_payload,
        settings.jwt_secret,
        timedelta(days=settings.jwt_refresh_expires_days),
    )
    store.rotate_refresh_token(db, session.id, refresh_token, settings.jwt_refresh_expires_days)
    return TokenRefreshResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
def logout(payload: TokenLogoutRequest, request: Request, db: DbSession) -> dict[str, str]:
    from app.core.security import decode_token

    try:
        token_payload = decode_token(payload.refresh_token, settings.jwt_secret)
    except ValueError as exc:
        raise_api_error(request, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", str(exc))

    session_id = token_payload.get("sid")
    if isinstance(session_id, str):
        session = store.get_session(db, session_id)
        if (
            session is not None
            and hash_refresh_token(payload.refresh_token) == session.refresh_token_hash
        ):
            store.revoke_session(db, session_id)
    return {"message": "Logged out"}


@router.get("/me")
def me(current_user: CurrentUser) -> UserInfo:
    return UserInfo(id=current_user.id, username=current_user.username, role=current_user.role)
