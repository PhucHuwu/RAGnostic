from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime

from fastapi import APIRouter, Request, status

from app.api.deps import AdminUser, raise_api_error
from app.core.security import hash_password
from app.schemas.admin import (
    AdminResetPasswordRequest,
    AdminUserCreateRequest,
    AdminUserUpdateRequest,
    SystemModelConfigRequest,
)
from app.schemas.auth import UserInfo
from app.schemas.documents import DocumentResponse
from app.services.store import store

router = APIRouter()


@router.get("/users")
def list_users(_: AdminUser) -> list[dict]:
    users = store.list_users()
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
def create_user(payload: AdminUserCreateRequest, current_admin: AdminUser) -> UserInfo:
    user = store.create_user(
        username=payload.username,
        password=payload.password,
        role=payload.role,
        status=payload.status,
        email=payload.email,
    )
    store.add_audit_log(
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
    )
    return UserInfo(id=user.id, username=user.username, role=user.role)


@router.patch("/users/{user_id}")
def update_user(
    user_id: str,
    payload: AdminUserUpdateRequest,
    request: Request,
    current_admin: AdminUser,
) -> dict:
    user = store.get_user(user_id)
    if user is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "User not found")

    before = {"role": user.role, "status": user.status}
    if payload.role is not None:
        user.role = payload.role
    if payload.status is not None:
        user.status = payload.status
    user.updated_at = datetime.now(UTC)
    after = {"role": user.role, "status": user.status}

    store.add_audit_log(
        actor_user_id=current_admin.id,
        action="ADMIN_UPDATE_USER",
        resource_type="user",
        resource_id=user.id,
        before_json=before,
        after_json=after,
    )
    return {"id": user.id, **after}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    payload: AdminResetPasswordRequest,
    request: Request,
    current_admin: AdminUser,
) -> dict[str, str]:
    user = store.get_user(user_id)
    if user is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "User not found")
    user.password_hash = hash_password(payload.new_password)
    user.updated_at = datetime.now(UTC)
    store.add_audit_log(
        actor_user_id=current_admin.id,
        action="ADMIN_RESET_PASSWORD",
        resource_type="user",
        resource_id=user.id,
        before_json=None,
        after_json={"password_changed": True},
    )
    return {"message": "Password reset successful"}


@router.get("/documents")
def admin_list_documents(_: AdminUser) -> list[DocumentResponse]:
    docs = store.list_documents()
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
) -> dict[str, str]:
    doc = store.get_document(document_id)
    if doc is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Document not found")
    before = asdict(doc)
    store.soft_delete_document(document_id)
    store.add_audit_log(
        actor_user_id=current_admin.id,
        action="ADMIN_DELETE_DOCUMENT",
        resource_type="document",
        resource_id=document_id,
        before_json=before,
        after_json={"status": "DELETED"},
    )
    return {"message": "Document deleted"}


@router.get("/system-config/model")
def get_system_model_config(_: AdminUser) -> dict:
    return {
        "provider": store.system_model_config.provider,
        "model_name": store.system_model_config.model_name,
        "params": store.system_model_config.params,
    }


@router.put("/system-config/model")
def update_system_model_config(
    payload: SystemModelConfigRequest,
    current_admin: AdminUser,
) -> dict:
    before = {
        "provider": store.system_model_config.provider,
        "model_name": store.system_model_config.model_name,
        "params": store.system_model_config.params,
    }
    store.system_model_config.provider = payload.provider
    store.system_model_config.model_name = payload.model_name
    store.system_model_config.params = payload.params

    after = {
        "provider": store.system_model_config.provider,
        "model_name": store.system_model_config.model_name,
        "params": store.system_model_config.params,
    }
    store.add_audit_log(
        actor_user_id=current_admin.id,
        action="ADMIN_UPDATE_MODEL_CONFIG",
        resource_type="system_config",
        resource_id="model",
        before_json=before,
        after_json=after,
    )
    return after
