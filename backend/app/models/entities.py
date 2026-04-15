from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime

from app.core.security import UserRole, UserStatus


def utcnow() -> datetime:
    return datetime.now(UTC)


@dataclass(slots=True)
class User:
    id: str
    username: str
    password_hash: str
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    email: str | None = None
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)
    last_login_at: datetime | None = None


@dataclass(slots=True)
class UserSession:
    id: str
    user_id: str
    refresh_token_hash: str
    ip_address: str | None
    user_agent: str | None
    expires_at: datetime
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)
    revoked_at: datetime | None = None


@dataclass(slots=True)
class ChatbotProfile:
    id: str
    user_id: str
    name: str
    topic: str
    description: str | None = None
    model_override: str | None = None
    chunk_strategy: str = "PARAGRAPH"
    chunk_size: int = 1000
    chunk_overlap: int = 100
    top_k: int = 5
    rerank_top_n: int = 3
    temperature: float = 0.2
    is_active: bool = True
    deleted: bool = False
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)


@dataclass(slots=True)
class Document:
    id: str
    owner_user_id: str
    profile_id: str
    file_name: str
    file_ext: str
    mime_type: str
    file_size_bytes: int
    status: str = "UPLOADED"
    storage_bucket: str = "docs"
    storage_key: str = ""
    checksum_sha256: str = ""
    error_message: str | None = None
    deleted: bool = False
    uploaded_at: datetime = field(default_factory=utcnow)
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)


@dataclass(slots=True)
class ChatSession:
    id: str
    profile_id: str
    user_id: str
    title: str
    status: str = "ACTIVE"
    started_at: datetime = field(default_factory=utcnow)
    last_message_at: datetime | None = None
    created_at: datetime = field(default_factory=utcnow)
    updated_at: datetime = field(default_factory=utcnow)


@dataclass(slots=True)
class ChatMessage:
    id: str
    session_id: str
    role: str
    content_md: str
    content_text: str
    seq_no: int
    request_id: str | None = None
    latency_ms: int | None = None
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None
    created_at: datetime = field(default_factory=utcnow)


@dataclass(slots=True)
class AuditLog:
    id: str
    actor_user_id: str
    action: str
    resource_type: str
    resource_id: str
    before_json: dict | None = None
    after_json: dict | None = None
    created_at: datetime = field(default_factory=utcnow)


@dataclass(slots=True)
class SystemModelConfig:
    provider: str = "openrouter"
    model_name: str = "nvidia/nemotron-3-super-120b-a12b:free"
    params: dict = field(default_factory=lambda: {"temperature": 0.2, "max_tokens": 2048})
