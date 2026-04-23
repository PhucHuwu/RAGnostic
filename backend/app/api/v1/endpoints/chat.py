from datetime import UTC, datetime

from fastapi import APIRouter, Query, Request, status

from app.api.deps import CurrentUser, DbSession, raise_api_error
from app.core.config import settings
from app.core.request_context import set_session_id
from app.models.db import ChatMessageDB, ChatSessionDB
from app.schemas.chat import (
    ChatMessageResponse,
    ChatMessageSendRequest,
    ChatSessionCreateRequest,
    ChatSessionResponse,
)
from app.services.rag import (
    bm25_rerank,
    build_assistant_answer,
    compute_embedding,
    merge_vector_and_lexical_results,
    mock_bm25_rerank,
    mock_retrieve_context,
    retrieve_context,
)
from app.services.store import store

router = APIRouter()


def _to_chat_session_response(session: ChatSessionDB) -> ChatSessionResponse:
    return ChatSessionResponse(
        id=session.id,
        profile_id=session.profile_id,
        user_id=session.user_id,
        title=session.title,
        status=session.status,
        started_at=session.started_at,
        last_message_at=session.last_message_at,
    )


def _to_message_response(msg: ChatMessageDB) -> ChatMessageResponse:
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
    db: DbSession,
) -> ChatSessionResponse:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    session = store.create_chat_session(
        db, profile_id=profile_id, user_id=current_user.id, title=payload.title
    )
    return _to_chat_session_response(session)


@router.get("/profiles/{profile_id}/sessions")
def list_sessions(
    profile_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
) -> list[ChatSessionResponse]:
    profile = store.get_profile(db, profile_id)
    if profile is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Profile not found")
    if profile.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")
    sessions = store.list_chat_sessions(db, profile_id=profile_id, user_id=current_user.id)
    return [_to_chat_session_response(item) for item in sessions]


@router.get("/sessions/{session_id}/messages")
def list_messages(
    session_id: str,
    request: Request,
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=100),
    cursor: int | None = Query(default=None, ge=0),
) -> dict:
    session = store.get_chat_session(db, session_id)
    if session is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Session not found")
    if session.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")

    messages = store.get_messages(db, session_id)
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
    db: DbSession,
) -> dict:
    session = store.get_chat_session(db, session_id)
    if session is None:
        raise_api_error(request, status.HTTP_404_NOT_FOUND, "NOT_FOUND", "Session not found")
    if session.user_id != current_user.id:
        raise_api_error(request, status.HTTP_403_FORBIDDEN, "FORBIDDEN", "Access denied")

    set_session_id(session_id)
    request_id = getattr(request.state, "request_id", None)
    user_message = store.add_message(
        db,
        session_id=session_id,
        role="USER",
        content=payload.content,
        request_id=request_id,
    )

    all_messages = store.get_messages(db, session_id)
    memory_window = [m.content_text for m in all_messages if m.role == "USER"][
        -settings.memory_window :
    ]
    profile = store.get_profile(db, session.profile_id)
    top_k = 5 if profile is None else profile.top_k
    rerank_top_n = 3 if profile is None else profile.rerank_top_n
    chunks = store.list_chunks_for_profile(db, profile_id=session.profile_id)
    retrieval_chunks = [
        {
            "chunk_id": item.id,
            "content": item.content,
            "embedding_vector": item.embedding_vector,
            "source_ref": item.source_ref,
            "section_title": item.section_title,
        }
        for item in chunks
    ]
    if retrieval_chunks:
        query_embedding = compute_embedding(payload.content)
        vector_rows = store.search_chunks_by_vector(
            db,
            profile_id=session.profile_id,
            query_embedding=query_embedding,
            top_k=max(top_k, rerank_top_n) * 2,
        )
        vector_candidates = [
            {
                "chunk_id": row.id,
                "content": row.content,
                "source_ref": row.source_ref,
                "section_title": row.section_title,
                "vector_score": max(0.0, 1 - float(distance)),
                "lexical_score": 0.0,
                "score": max(0.0, 1 - float(distance)),
            }
            for row, distance in vector_rows
        ]
        lexical_candidates = retrieve_context(
            payload.content,
            retrieval_chunks,
            top_k=max(top_k, rerank_top_n) * 2,
        )
        candidates = merge_vector_and_lexical_results(
            query=payload.content,
            vector_candidates=vector_candidates,
            lexical_candidates=lexical_candidates,
            top_k=max(top_k, rerank_top_n) * 2,
        )
        reranked = bm25_rerank(payload.content, candidates, rerank_top_n=rerank_top_n)
    else:
        candidates = mock_retrieve_context(payload.content, top_k=top_k)
        reranked = mock_bm25_rerank(candidates, rerank_top_n=rerank_top_n)
    start_ts = datetime.now(UTC)
    system_model_config = store.get_system_model_config(db)
    answer, usage = build_assistant_answer(
        question=payload.content,
        reranked=reranked,
        memory_window=memory_window,
        system_model_config=system_model_config,
        profile_model_override=profile.model_override if profile is not None else None,
    )
    latency_ms = int((datetime.now(UTC) - start_ts).total_seconds() * 1000)
    assistant_message = store.add_message(
        db,
        session_id=session_id,
        role="ASSISTANT",
        content=answer,
        request_id=request_id,
        latency_ms=latency_ms,
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
    )
    store.add_retrieval_trace(
        db,
        message_id=assistant_message.id,
        retrieval_query=payload.content,
        top_k=top_k,
        rerank_top_n=rerank_top_n,
        bm25_enabled=True,
        raw_candidates=candidates,
        reranked_results=reranked,
        citations=[item["chunk_id"] for item in reranked],
    )
    return {
        "stream": payload.stream,
        "user_message": _to_message_response(user_message).model_dump(),
        "assistant_message": _to_message_response(assistant_message).model_dump(),
        "retrieval_trace": {
            "top_k": top_k,
            "rerank_top_n": rerank_top_n,
            "bm25_enabled": True,
            "embedding_model": settings.embedding_model,
            "raw_candidates": candidates,
            "reranked_results": reranked,
            "citations": [item["chunk_id"] for item in reranked],
            "memory_window_size": settings.memory_window,
            "llm_provider": usage.get("provider"),
            "llm_model": usage.get("model"),
        },
    }
