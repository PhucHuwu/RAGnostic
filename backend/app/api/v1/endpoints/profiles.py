from datetime import UTC, datetime

from fastapi import APIRouter, Request, status

from app.api.deps import CurrentUser, DbSession, raise_api_error
from app.models.db import ChatbotProfileDB
from app.schemas.profiles import ProfileCreateRequest, ProfileResponse, ProfileUpdateRequest
from app.services.store import store

router = APIRouter()


def _to_profile_response(profile: ChatbotProfileDB) -> ProfileResponse:
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        name=profile.name,
        topic=profile.topic,
        description=profile.description,
        icon_name=profile.icon_name,
        model_override=profile.model_override,
        chunk_strategy=profile.chunk_strategy,
        chunk_size=profile.chunk_size,
        chunk_overlap=profile.chunk_overlap,
        top_k=profile.top_k,
        rerank_top_n=profile.rerank_top_n,
        temperature=profile.temperature,
        is_active=profile.is_active,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.get("")
def list_profiles(current_user: CurrentUser, db: DbSession) -> list[ProfileResponse]:
    return [_to_profile_response(p) for p in store.list_profiles_by_user(db, current_user.id)]


@router.post("")
def create_profile(
    payload: ProfileCreateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> ProfileResponse:
    profile = store.create_profile(
        db,
        user_id=current_user.id,
        name=payload.name,
        topic=payload.topic,
        description=payload.description,
        icon_name=payload.icon_name,
    )
    return _to_profile_response(profile)


@router.get("/{profile_id}")
def get_profile(
    profile_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> ProfileResponse:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    return _to_profile_response(profile)


@router.patch("/{profile_id}")
def update_profile(
    profile_id: str,
    payload: ProfileUpdateRequest,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> ProfileResponse:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")

    updates = payload.model_dump(exclude_unset=True)
    for field_name, value in updates.items():
        setattr(profile, field_name, value)
    profile.updated_at = datetime.now(UTC)
    db.commit()
    db.refresh(profile)
    return _to_profile_response(profile)


@router.delete("/{profile_id}")
def delete_profile(
    profile_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, str]:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    profile.deleted = True
    profile.updated_at = datetime.now(UTC)
    db.commit()
    return {"message": "Profile deleted"}
