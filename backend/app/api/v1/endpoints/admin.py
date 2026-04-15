from fastapi import APIRouter

router = APIRouter()


@router.get("/users")
def list_users() -> dict[str, str]:
    return {"message": "TODO: list users"}


@router.post("/users")
def create_user() -> dict[str, str]:
    return {"message": "TODO: create user"}


@router.patch("/users/{user_id}")
def update_user(user_id: str) -> dict[str, str]:
    return {"message": f"TODO: update user {user_id}"}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(user_id: str) -> dict[str, str]:
    return {"message": f"TODO: reset password for user {user_id}"}


@router.get("/documents")
def admin_list_documents() -> dict[str, str]:
    return {"message": "TODO: admin list documents"}


@router.delete("/documents/{document_id}")
def admin_delete_document(document_id: str) -> dict[str, str]:
    return {"message": f"TODO: admin delete document {document_id}"}


@router.get("/system-config/model")
def get_system_model_config() -> dict[str, str]:
    return {"message": "TODO: get system model config"}


@router.put("/system-config/model")
def update_system_model_config() -> dict[str, str]:
    return {"message": "TODO: update system model config"}
