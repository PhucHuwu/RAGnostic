from datetime import datetime

from pydantic import BaseModel, Field

from app.core.security import UserRole


class LoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=200)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=200)
    email: str | None = None


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenLogoutRequest(BaseModel):
    refresh_token: str


class UserInfo(BaseModel):
    id: str
    username: str
    role: UserRole


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserInfo


class TokenRefreshResponse(BaseModel):
    access_token: str
    refresh_token: str


class UserSessionResponse(BaseModel):
    id: str
    user_id: str
    expires_at: datetime
    revoked_at: datetime | None
