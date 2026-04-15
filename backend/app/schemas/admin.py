from pydantic import BaseModel, Field

from app.core.security import UserRole, UserStatus


class AdminUserCreateRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=200)
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    email: str | None = None


class AdminUserUpdateRequest(BaseModel):
    role: UserRole | None = None
    status: UserStatus | None = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(min_length=6, max_length=200)


class SystemModelConfigRequest(BaseModel):
    provider: str = Field(default="openrouter", min_length=1, max_length=120)
    model_name: str = Field(min_length=1, max_length=255)
    params: dict = Field(default_factory=dict)
