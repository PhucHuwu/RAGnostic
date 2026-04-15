from datetime import datetime

from pydantic import BaseModel, Field


class ProfileCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    topic: str = Field(min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=2000)


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    topic: str | None = Field(default=None, min_length=1, max_length=240)
    description: str | None = Field(default=None, max_length=2000)
    model_override: str | None = Field(default=None, max_length=255)
    chunk_strategy: str | None = Field(default=None)
    chunk_size: int | None = Field(default=None, ge=100, le=10000)
    chunk_overlap: int | None = Field(default=None, ge=0, le=2000)
    top_k: int | None = Field(default=None, ge=1, le=20)
    rerank_top_n: int | None = Field(default=None, ge=1, le=20)
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    is_active: bool | None = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str
    topic: str
    description: str | None
    model_override: str | None
    chunk_strategy: str
    chunk_size: int
    chunk_overlap: int
    top_k: int
    rerank_top_n: int
    temperature: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
