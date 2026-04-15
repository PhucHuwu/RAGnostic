from fastapi import APIRouter

router = APIRouter()


@router.post("/profiles/{profile_id}/documents/upload")
def upload_document(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: upload document for profile {profile_id}"}


@router.get("/profiles/{profile_id}/documents")
def list_documents(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: list documents for profile {profile_id}"}


@router.get("/documents/{document_id}")
def get_document(document_id: str) -> dict[str, str]:
    return {"message": f"TODO: get document {document_id}"}


@router.delete("/documents/{document_id}")
def delete_document(document_id: str) -> dict[str, str]:
    return {"message": f"TODO: delete document {document_id}"}


@router.get("/documents/{document_id}/preview")
def preview_document(document_id: str) -> dict[str, str]:
    return {"message": f"TODO: preview document {document_id}"}
