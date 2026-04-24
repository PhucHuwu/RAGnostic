from datetime import datetime

from pydantic import BaseModel, Field


class ChatSessionCreateRequest(BaseModel):
    title: str = Field(default="New Chat", min_length=1, max_length=200)


class ChatSessionUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class ChatSessionResponse(BaseModel):
    id: str
    profile_id: str
    user_id: str
    title: str
    status: str
    started_at: datetime
    last_message_at: datetime | None


class ChatMessageSendRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)
    stream: bool = False


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content_md: str
    content_text: str
    seq_no: int
    request_id: str | None
    latency_ms: int | None
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None
    created_at: datetime
