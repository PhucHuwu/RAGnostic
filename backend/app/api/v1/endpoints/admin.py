from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request, status

from app.api.deps import AdminUser, DbSession, raise_api_error
from app.core.security import UserRole, UserStatus, hash_password
from app.schemas.admin import (
    AdminResetPasswordRequest,
    AdminUserCreateRequest,
    AdminUserUpdateRequest,
    SystemModelConfigRequest,
)
from app.schemas.auth import UserInfo
from app.schemas.documents import (
    DocumentChunkDetailResponse,
    DocumentChunksResponse,
    DocumentResponse,
)
from app.services.store import store

router = APIRouter()


@router.get("/users")
def list_users(_: AdminUser, db: DbSession) -> list[dict]:
    users = store.list_users(db)
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "status": user.status,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
        for user in users
    ]


@router.post("/users")
def create_user(
    payload: AdminUserCreateRequest, request: Request, current_admin: AdminUser, db: DbSession
) -> UserInfo:
    user = store.create_user(
        db,
        username=payload.username,
        password=payload.password,
        role=payload.role,
        status=payload.status,
        email=payload.email,
    )
    store.add_audit_log(
        db,
        actor_user_id=current_admin.id,
        action="ADMIN_CREATE_USER",
        resource_type="user",
        resource_id=user.id,
        before_json=None,
        after_json={
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "status": user.status,
        },
        request_id=getattr(request.state, "request_id", None),
    )
    return UserInfo(id=user.id, username=user.username, role=user.role)


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    payload: AdminUserUpdateRequest,
    request: Request,
    current_admin: AdminUser,
    db: DbSession,
) -> dict:
    user = store.get_user(db, user_id)
    if user is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng")

    before = {"role": user.role, "status": user.status}
    if payload.role is not None:
        if (
            user.id == current_admin.id
            and user.role == UserRole.ADMIN
            and payload.role == UserRole.USER
        ):
            raise_api_error(
                request,
                status.HTTP_400_BAD_REQUEST,
                "VALIDATION_ERROR",
                "Không thể tự hạ quyền quản trị viên của chính bạn",
            )
        user.role = payload.role
    if payload.status is not None:
        if (
            user.id == current_admin.id
            and user.role == UserRole.ADMIN
            and payload.status != UserStatus.ACTIVE
        ):
            raise_api_error(
                request,
                status.HTTP_400_BAD_REQUEST,
                "VALIDATION_ERROR",
                "Không thể tự tạm khóa hoặc vô hiệu hóa tài khoản của chính bạn",
            )
        user.status = payload.status
    user.updated_at = datetime.now(UTC)
    after = {"role": user.role, "status": user.status}
    db.commit()

    store.add_audit_log(
        db,
        actor_user_id=current_admin.id,
        action="ADMIN_UPDATE_USER",
        resource_type="user",
        resource_id=user.id,
        before_json=before,
        after_json=after,
        request_id=getattr(request.state, "request_id", None),
    )
    return {"id": user.id, **after}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: AdminResetPasswordRequest,
    request: Request,
    current_admin: AdminUser,
    db: DbSession,
) -> dict[str, str]:
    user = store.get_user(db, user_id)
    if user is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Không tìm thấy người dùng")
    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.now(UTC)
    db.commit()
    store.add_audit_log(
        db,
        actor_user_id=current_admin.id,
        action="ADMIN_RESET_PASSWORD",
        resource_type="user",
        resource_id=user.id,
        before_json=None,
        after_json={"password_changed": True},
        request_id=getattr(request.state, "request_id", None),
    )
    return {"message": "Password reset successful"}


@router.get("/documents")
def admin_list_documents(_: AdminUser, db: DbSession) -> list[DocumentResponse]:
    docs = store.list_documents(db)
    return [
        DocumentResponse(
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
            chunk_count=store.count_chunks_for_document(db, document.id),
            error_message=document.error_message,
            uploaded_at=document.uploaded_at,
            updated_at=document.updated_at,
        )
        for document in docs
    ]


@router.delete("/documents/{document_id}")
def admin_delete_document(
    document_id: str,
    request: Request,
    current_admin: AdminUser,
    db: DbSession,
) -> dict[str, str]:
    doc = store.get_document(db, document_id)
    if doc is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Không tìm thấy tài liệu")
    before = {
        "id": doc.id,
        "status": doc.status,
        "owner_user_id": doc.owner_user_id,
        "profile_id": doc.profile_id,
    }
    store.soft_delete_document(db, document_id)
    store.add_audit_log(
        db,
        actor_user_id=current_admin.id,
        action="ADMIN_DELETE_DOCUMENT",
        resource_type="document",
        resource_id=document_id,
        before_json=before,
        after_json={"status": "DELETED"},
        request_id=getattr(request.state, "request_id", None),
    )
    return {"message": "Document deleted"}


@router.get("/documents/{document_id}/chunks")
def admin_get_document_chunks(
    document_id: str,
    request: Request,
    _: AdminUser,
    db: DbSession,
) -> DocumentChunksResponse:
    document = store.get_document(db, document_id)
    if document is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Không tìm thấy tài liệu")

    chunks = store.list_chunks_for_document(db, document.id)
    profile = store.get_profile(db, document.profile_id)
    return DocumentChunksResponse(
        document_id=document.id,
        profile_id=document.profile_id,
        total_chunks=len(chunks),
        strategy=profile.chunk_strategy if profile is not None else None,
        items=[
            DocumentChunkDetailResponse(
                id=item.id,
                chunk_index=item.chunk_index,
                token_count=item.token_count,
                char_count=item.char_count,
                section_title=item.section_title,
                page_no=item.page_no,
                source_ref=item.source_ref,
                chunk_hash=item.chunk_hash,
                content=item.content,
            )
            for item in chunks
        ],
    )


@router.get("/system-config/model")
def get_system_model_config(_: AdminUser, db: DbSession) -> dict:
    return store.get_system_model_config(db)


@router.put("/system-config/model")
def update_system_model_config(
    payload: SystemModelConfigRequest,
    request: Request,
    current_admin: AdminUser,
    db: DbSession,
) -> dict:
    before = store.get_system_model_config(db)

    normalized_models: list[dict] = []
    for raw in payload.models:
        if not isinstance(raw, dict):
            continue
        model_name = str(raw.get("model_name") or "").strip()
        if not model_name:
            continue
        params = raw.get("params") if isinstance(raw.get("params"), dict) else {}
        normalized_models.append({"model_name": model_name, "params": params})

    if not normalized_models:
        raise_api_error(
            request,
            status.HTTP_400_BAD_REQUEST,
            "VALIDATION_ERROR",
            "Danh sách model không hợp lệ",
        )

    after = store.update_system_model_config(
        db,
        models=normalized_models,
        updated_by=current_admin.id,
    )
    store.add_audit_log(
        db,
        actor_user_id=current_admin.id,
        action="ADMIN_UPDATE_MODEL_CONFIG",
        resource_type="system_config",
        resource_id="model",
        before_json=before,
        after_json=after,
        request_id=getattr(request.state, "request_id", None),
    )
    return after
