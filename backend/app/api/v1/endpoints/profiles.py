from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_profiles() -> dict[str, str]:
    return {"message": "TODO: list profiles"}


@router.post("")
def create_profile() -> dict[str, str]:
    return {"message": "TODO: create profile"}


@router.get("/{profile_id}")
def get_profile(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: get profile {profile_id}"}


@router.patch("/{profile_id}")
def update_profile(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: update profile {profile_id}"}


@router.delete("/{profile_id}")
def delete_profile(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: delete profile {profile_id}"}
