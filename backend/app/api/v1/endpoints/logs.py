from fastapi import APIRouter

router = APIRouter()


@router.get("/search")
def search_logs() -> dict[str, str]:
    return {"message": "TODO: search logs"}


@router.get("/stream")
def stream_logs() -> dict[str, str]:
    return {"message": "TODO: stream logs (SSE/WS)"}
