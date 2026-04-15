from fastapi import APIRouter

router = APIRouter()


@router.post("/login")
def login() -> dict[str, str]:
    return {"message": "TODO: implement auth login"}


@router.post("/refresh")
def refresh() -> dict[str, str]:
    return {"message": "TODO: implement token refresh"}


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "TODO: implement auth logout"}


@router.get("/me")
def me() -> dict[str, str]:
    return {"message": "TODO: implement current user info"}
