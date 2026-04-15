from datetime import UTC, datetime

from fastapi import APIRouter, Query, Request, status

from app.api.deps import CurrentUser, raise_api_error
from app.core.config import settings
from app.core.request_context import set_session_id
from app.models.entities import ChatMessage, ChatSession
from app.schemas.chat import (
    ChatMessageResponse,
    ChatMessageSendRequest,
    ChatSessionCreateRequest,
    ChatSessionResponse,
)
from app.services.rag import build_assistant_answer, mock_bm25_rerank, mock_retrieve_context
from app.services.store import store

router = APIRouter()


def _to_chat_session_response(session: ChatSession) -> ChatSessionResponse:
    return ChatSessionResponse(
        id=session.id,
        profile_id=session.profile_id,
        user_id=session.user_id,
        title=session.title,
        status=session.status,
        started_at=session.started_at,
        last_message_at=session.last_message_at,
    )


def _to_message_response(msg: ChatMessage) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=msg.id,
        session_id=msg.session_id,
        role=msg.role,
        content_md=msg.content_md,
        content_text=msg.content_text,
        seq_no=msg.seq_no,
        request_id=msg.request_id,
        latency_ms=msg.latency_ms,
        prompt_tokens=msg.prompt_tokens,
        completion_tokens=msg.completion_tokens,
        total_tokens=msg.total_tokens,
        created_at=msg.created_at,
    )


@router.post("/profiles/{profile_id}/sessions")
def create_session(
    profile_id: str,
    payload: ChatSessionCreateRequest,
    request: Request,
    current_user: CurrentUser,
) -> ChatSessionResponse:
    profile = store.get_profile(profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    session = store.create_chat_session(
        profile_id=profile_id, user_id=current_user.id, title=payload.title
    )
    return _to_chat_session_response(session)


@router.get("/profiles/{profile_id}/sessions")
def list_sessions(
    profile_id: str,
    request: Request,
    current_user: CurrentUser,
) -> list[ChatSessionResponse]:
    profile = store.get_profile(profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    sessions = store.list_chat_sessions(profile_id=profile_id, user_id=current_user.id)
    return [_to_chat_session_response(item) for item in sessions]


@router.get("/sessions/{session_id}/messages")
def list_messages(
    session_id: str,
    request: Request,
    current_user: CurrentUser,
    limit: int = Query(default=20, ge=1, le=100),
    cursor: int | None = Query(default=None, ge=0),
) -> dict:
    session = store.get_chat_session(session_id)
    if session is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Session not found")
    if session.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")

    messages = store.get_messages(session_id)
    start = cursor or 0
    items = messages[start : start + limit]
    next_cursor = start + limit if start + limit < len(messages) else None
    return {
        "items": [_to_message_response(item).model_dump() for item in items],
        "next_cursor": next_cursor,
    }


@router.post("/sessions/{session_id}/messages")
def send_message(
    session_id: str,
    payload: ChatMessageSendRequest,
    request: Request,
    current_user: CurrentUser,
) -> dict:
    session = store.get_chat_session(session_id)
    if session is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Session not found")
    if session.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")

    set_session_id(session_id)
    request_id = getattr(request.state, "request_id", None)
    user_message = store.add_message(
        session_id=session_id,
        role="USER",
        content=payload.content,
        request_id=request_id,
    )

    all_messages = store.get_messages(session_id)
    memory_window = [m.content_text for m in all_messages if m.role == "USER"][
        -settings.memory_window :
    ]
    profile = store.get_profile(session.profile_id)
    top_k = 5 if profile is None else profile.top_k
    rerank_top_n = 3 if profile is None else profile.rerank_top_n
    candidates = mock_retrieve_context(payload.content, top_k=top_k)
    reranked = mock_bm25_rerank(candidates, rerank_top_n=rerank_top_n)
    start_ts = datetime.now(UTC)
    answer = build_assistant_answer(payload.content, reranked, memory_window)
    latency_ms = int((datetime.now(UTC) - start_ts).total_seconds() * 1000)
    assistant_message = store.add_message(
        session_id=session_id,
        role="ASSISTANT",
        content=answer,
        request_id=request_id,
        latency_ms=latency_ms,
        prompt_tokens=max(1, len(payload.content) // 4),
        completion_tokens=max(1, len(answer) // 4),
    )
    return {
        "stream": payload.stream,
        "user_message": _to_message_response(user_message).model_dump(),
        "assistant_message": _to_message_response(assistant_message).model_dump(),
        "retrieval_trace": {
            "top_k": top_k,
            "rerank_top_n": rerank_top_n,
            "bm25_enabled": True,
            "raw_candidates": candidates,
            "reranked_results": reranked,
            "citations": [item["chunk_id"] for item in reranked],
            "memory_window_size": settings.memory_window,
        },
    }
