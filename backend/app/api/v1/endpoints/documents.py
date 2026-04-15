import hashlib
from datetime import UTC, datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Request, UploadFile, status

from app.api.deps import CurrentUser, DbSession, raise_api_error
from app.core.config import settings
from app.models.db import DocumentDB
from app.schemas.documents import DocumentPreviewResponse, DocumentResponse
from app.services.store import store

router = APIRouter()
UploadDocument = Annotated[UploadFile, File(...)]


def _to_document_response(document: DocumentDB) -> DocumentResponse:
    return DocumentResponse(
        id=document.id,
        owner_user_id=document.owner_user_id,
        profile_id=document.profile_id,
        file_name=document.file_name,
        file_ext=document.file_ext,
        mime_type=document.mime_type,
        file_size_bytes=document.file_size_bytes,
        storage_bucket=document.storage_bucket,
        storage_key=document.storage_key,
        checksum_sha256=document.checksum_sha256,
        status=document.status,
        error_message=document.error_message,
        uploaded_at=document.uploaded_at,
        updated_at=document.updated_at,
    )


@router.post("/profiles/{profile_id}/documents/upload")
async def upload_document(
    profile_id: str,
    request: Request,
    file: UploadDocument,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")

    file_name = file.filename or "unnamed.txt"
    file_ext = Path(file_name).suffix.lower().removeprefix(".")
    if file_ext not in settings.upload_allowed_exts:
        raise_api_error(
            request,
            status.HTTP_400_BAD_REQUEST,
            "VALIDATION_ERROR",
            "Unsupported file extension",
            details={"allowed": list(settings.upload_allowed_exts)},
        )

    raw = await file.read()
    if len(raw) > settings.upload_max_size_bytes:
        raise_api_error(
            request,
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            "PAYLOAD_TOO_LARGE",
            "File size exceeds configured limit",
            details={"max_bytes": settings.upload_max_size_bytes},
        )

    checksum = hashlib.sha256(raw).hexdigest()
    document = store.create_document(
        db,
        owner_user_id=current_user.id,
        profile_id=profile_id,
        file_name=file_name,
        file_ext=file_ext,
        mime_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(raw),
        checksum_sha256=checksum,
    )
    document.status = "READY"
    document.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(document)
    return _to_document_response(document)


@router.get("/profiles/{profile_id}/documents")
def list_documents(
    profile_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> list[DocumentResponse]:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    docs = store.list_documents_for_profile(db, profile_id)
    return [_to_document_response(doc) for doc in docs]


@router.get("/documents/{document_id}")
def get_document(
    document_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    document = store.get_document(db, document_id)
    if document is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Document not found")
    if document.owner_user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    return _to_document_response(document)


@router.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, str]:
    document = store.get_document(db, document_id)
    if document is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Document not found")
    if document.owner_user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    store.soft_delete_document(db, document_id)
    return {"message": "Document deleted"}


@router.get("/documents/{document_id}/preview")
def preview_document(
    document_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentPreviewResponse:
    document = store.get_document(db, document_id)
    if document is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Document not found")
    if document.owner_user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    return DocumentPreviewResponse(
        document_id=document.id,
        profile_id=document.profile_id,
        preview=f"Document {document.file_name} is in status {document.status}",
    )
