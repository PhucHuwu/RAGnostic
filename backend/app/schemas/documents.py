from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    owner_user_id: str
    profile_id: str
    file_name: str
    file_ext: str
    mime_type: str
    file_size_bytes: int
    storage_bucket: str
    storage_key: str
    checksum_sha256: str
    status: str
    error_message: str | None
    uploaded_at: datetime
    updated_at: datetime


class DocumentPreviewResponse(BaseModel):
    document_id: str
    profile_id: str
    preview: str
