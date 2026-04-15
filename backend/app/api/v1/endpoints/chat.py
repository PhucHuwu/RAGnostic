from fastapi import APIRouter

router = APIRouter()


@router.post("/profiles/{profile_id}/sessions")
def create_session(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: create session for profile {profile_id}"}


@router.get("/profiles/{profile_id}/sessions")
def list_sessions(profile_id: str) -> dict[str, str]:
    return {"message": f"TODO: list sessions for profile {profile_id}"}


@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str) -> dict[str, str]:
    return {"message": f"TODO: list messages for session {session_id}"}


@router.post("/sessions/{session_id}/messages")
def send_message(session_id: str) -> dict[str, str]:
    return {"message": f"TODO: send message for session {session_id}"}
