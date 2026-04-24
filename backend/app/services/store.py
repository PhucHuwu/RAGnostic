from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import UserRole, UserStatus, hash_password
from app.models.db import (
    AuditLogDB,
    ChatbotProfileDB,
    ChatMessageDB,
    ChatSessionDB,
    DocumentDB,
    DocumentChunkDB,
    DocumentParseResultDB,
    MessageRetrievalTraceDB,
    SystemConfigDB,
    UserDB,
    UserSessionDB,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


class DatabaseStore:
    def bootstrap_defaults(self, db: Session) -> None:
        admin_exists = db.scalar(select(UserDB).where(UserDB.username == "admin"))
        if admin_exists is None and settings.app_env in {"local", "dev", "init"}:
            self.create_user(
                db,
                username="admin",
                password="123456",
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )

        model_config = db.get(SystemConfigDB, "model")
        if model_config is None:
            db.add(
                SystemConfigDB(
                    config_key="model",
                    value_json={
                        "provider": "openrouter",
                        "model_name": settings.openrouter_model,
                        "params": {"temperature": 0.2, "max_tokens": 2048},
                    },
                )
            )
        memory_config = db.get(SystemConfigDB, "memory_window")
        if memory_config is None:
            db.add(
                SystemConfigDB(
                    config_key="memory_window", value_json={"value": settings.memory_window}
                )
            )
        db.commit()

    def create_user(
        self,
        db: Session,
        username: str,
        password: str,
        role: UserRole = UserRole.USER,
        status: UserStatus = UserStatus.ACTIVE,
        email: str | None = None,
    ) -> UserDB:
        if db.scalar(select(UserDB.id).where(UserDB.username == username)) is not None:
            raise ValueError("Username already exists")
        user = UserDB(
            username=username,
            password_hash=hash_password(password),
            role=role,
            status=status,
            email=email,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_user_by_username(self, db: Session, username: str) -> UserDB | None:
        return db.scalar(select(UserDB).where(UserDB.username == username))

    def get_user(self, db: Session, user_id: str) -> UserDB | None:
        return db.get(UserDB, user_id)

    def list_users(self, db: Session) -> list[UserDB]:
        return list(db.scalars(select(UserDB).order_by(UserDB.created_at.asc())).all())

    def create_session(
        self,
        db: Session,
        user_id: str,
        refresh_token: str,
        ip_address: str | None,
        user_agent: str | None,
        expires_days: int,
        session_id: str | None = None,
    ) -> UserSessionDB:
        session = UserSessionDB(
            id=session_id,
            user_id=user_id,
            refresh_token_hash=hashlib.sha256(refresh_token.encode("utf-8")).hexdigest(),
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=_utcnow() + timedelta(days=expires_days),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_session(self, db: Session, session_id: str) -> UserSessionDB | None:
        return db.get(UserSessionDB, session_id)

    def revoke_session(self, db: Session, session_id: str) -> None:
        session = db.get(UserSessionDB, session_id)
        if session is not None and session.revoked_at is None:
            session.revoked_at = _utcnow()
            session.updated_at = _utcnow()
            db.commit()

    def rotate_refresh_token(
        self, db: Session, session_id: str, refresh_token: str, expires_days: int
    ) -> UserSessionDB:
        session = db.get(UserSessionDB, session_id)
        if session is None:
            raise ValueError("Session not found")
        session.refresh_token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        session.expires_at = _utcnow() + timedelta(days=expires_days)
        session.updated_at = _utcnow()
        db.commit()
        db.refresh(session)
        return session

    def create_profile(
        self,
        db: Session,
        user_id: str,
        name: str,
        topic: str,
        description: str | None = None,
    ) -> ChatbotProfileDB:
        profile = ChatbotProfileDB(user_id=user_id, name=name, topic=topic, description=description)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    def list_profiles_by_user(self, db: Session, user_id: str) -> list[ChatbotProfileDB]:
        stmt = select(ChatbotProfileDB).where(
            ChatbotProfileDB.user_id == user_id,
            ChatbotProfileDB.deleted.is_(False),
        )
        return list(db.scalars(stmt).all())

    def get_profile(self, db: Session, profile_id: str) -> ChatbotProfileDB | None:
        profile = db.get(ChatbotProfileDB, profile_id)
        if profile is None or profile.deleted:
            return None
        return profile

    def create_document(
        self,
        db: Session,
        owner_user_id: str,
        profile_id: str,
        file_name: str,
        file_ext: str,
        mime_type: str,
        file_size_bytes: int,
        checksum_sha256: str,
    ) -> DocumentDB:
        doc = DocumentDB(
            owner_user_id=owner_user_id,
            profile_id=profile_id,
            file_name=file_name,
            file_ext=file_ext,
            mime_type=mime_type,
            file_size_bytes=file_size_bytes,
            checksum_sha256=checksum_sha256,
            storage_key=f"profiles/{profile_id}/{file_name}",
            storage_bucket="ragnostic-docs",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def update_document_status(
        self,
        db: Session,
        document_id: str,
        status: str,
        error_message: str | None = None,
    ) -> DocumentDB:
        doc = db.get(DocumentDB, document_id)
        if doc is None:
            raise ValueError("Document not found")
        doc.status = status
        doc.error_message = error_message
        doc.updated_at = _utcnow()
        db.commit()
        db.refresh(doc)
        return doc

    def upsert_parse_result(
        self,
        db: Session,
        document_id: str,
        structured_json_path: str,
        summary: str | None,
        metadata_json: dict,
        parser_name: str = "docling",
        parser_version: str = "mock-v1",
    ) -> DocumentParseResultDB:
        row = db.scalar(
            select(DocumentParseResultDB).where(DocumentParseResultDB.document_id == document_id)
        )
        if row is None:
            row = DocumentParseResultDB(
                document_id=document_id,
                parser_name=parser_name,
                parser_version=parser_version,
                structured_json_path=structured_json_path,
                summary=summary,
                metadata_json=metadata_json,
            )
            db.add(row)
        else:
            row.parser_name = parser_name
            row.parser_version = parser_version
            row.structured_json_path = structured_json_path
            row.summary = summary
            row.metadata_json = metadata_json
            row.updated_at = _utcnow()
        db.commit()
        db.refresh(row)
        return row

    def replace_document_chunks(
        self,
        db: Session,
        document_id: str,
        profile_id: str,
        chunks: list[dict],
    ) -> list[DocumentChunkDB]:
        db.query(DocumentChunkDB).filter(DocumentChunkDB.document_id == document_id).delete()
        rows: list[DocumentChunkDB] = []
        for idx, item in enumerate(chunks):
            row = DocumentChunkDB(
                document_id=document_id,
                profile_id=profile_id,
                chunk_index=idx,
                content=item["content"],
                token_count=item.get("token_count", 0),
                char_count=item.get("char_count", len(item["content"])),
                section_title=item.get("section_title"),
                page_no=item.get("page_no"),
                source_ref=item.get("source_ref"),
                chunk_hash=item["chunk_hash"],
                embedding_vector=item.get("embedding_vector"),
            )
            db.add(row)
            rows.append(row)
        db.commit()
        for row in rows:
            db.refresh(row)
        return rows

    def list_documents_for_profile(self, db: Session, profile_id: str) -> list[DocumentDB]:
        stmt = select(DocumentDB).where(
            DocumentDB.profile_id == profile_id, DocumentDB.deleted.is_(False)
        )
        return list(db.scalars(stmt).all())

    def list_documents(self, db: Session) -> list[DocumentDB]:
        return list(db.scalars(select(DocumentDB).where(DocumentDB.deleted.is_(False))).all())

    def get_document(self, db: Session, document_id: str) -> DocumentDB | None:
        doc = db.get(DocumentDB, document_id)
        if doc is None or doc.deleted:
            return None
        return doc

    def get_parse_result(self, db: Session, document_id: str) -> DocumentParseResultDB | None:
        return db.scalar(
            select(DocumentParseResultDB).where(DocumentParseResultDB.document_id == document_id)
        )

    def list_chunks_for_document(self, db: Session, document_id: str) -> list[DocumentChunkDB]:
        stmt = (
            select(DocumentChunkDB)
            .where(DocumentChunkDB.document_id == document_id)
            .order_by(DocumentChunkDB.chunk_index.asc())
        )
        return list(db.scalars(stmt).all())

    def count_chunks_for_document(self, db: Session, document_id: str) -> int:
        stmt = select(func.count(DocumentChunkDB.id)).where(DocumentChunkDB.document_id == document_id)
        return int(db.scalar(stmt) or 0)

    def soft_delete_document(self, db: Session, document_id: str) -> None:
        doc = db.get(DocumentDB, document_id)
        if doc is None:
            raise ValueError("Document not found")
        doc.deleted = True
        doc.status = "DELETED"
        doc.updated_at = _utcnow()
        db.commit()

    def create_chat_session(
        self, db: Session, profile_id: str, user_id: str, title: str
    ) -> ChatSessionDB:
        session = ChatSessionDB(profile_id=profile_id, user_id=user_id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def list_chat_sessions(self, db: Session, profile_id: str, user_id: str) -> list[ChatSessionDB]:
        stmt = select(ChatSessionDB).where(
            ChatSessionDB.profile_id == profile_id,
            ChatSessionDB.user_id == user_id,
            ChatSessionDB.status != "DELETED",
        )
        stmt = stmt.order_by(ChatSessionDB.updated_at.desc(), ChatSessionDB.started_at.desc())
        return list(db.scalars(stmt).all())

    def get_chat_session(self, db: Session, session_id: str) -> ChatSessionDB | None:
        return db.get(ChatSessionDB, session_id)

    def soft_delete_chat_session(self, db: Session, session_id: str) -> None:
        session = db.get(ChatSessionDB, session_id)
        if session is None:
            raise ValueError("Session not found")
        session.status = "DELETED"
        session.updated_at = _utcnow()
        db.commit()

    def add_message(
        self,
        db: Session,
        session_id: str,
        role: str,
        content: str,
        request_id: str | None,
        latency_ms: int | None = None,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
    ) -> ChatMessageDB:
        seq_no = (
            db.scalar(
                select(func.coalesce(func.max(ChatMessageDB.seq_no), 0)).where(
                    ChatMessageDB.session_id == session_id
                )
            )
            or 0
        ) + 1
        msg = ChatMessageDB(
            session_id=session_id,
            role=role,
            content_md=content,
            content_text=content,
            seq_no=seq_no,
            request_id=request_id,
            latency_ms=latency_ms,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=(prompt_tokens or 0) + (completion_tokens or 0),
        )
        db.add(msg)
        session = db.get(ChatSessionDB, session_id)
        if session is not None:
            session.last_message_at = _utcnow()
            session.updated_at = _utcnow()
        db.commit()
        db.refresh(msg)
        return msg

    def get_messages(self, db: Session, session_id: str) -> list[ChatMessageDB]:
        stmt = (
            select(ChatMessageDB)
            .where(ChatMessageDB.session_id == session_id)
            .order_by(ChatMessageDB.seq_no.asc())
        )
        return list(db.scalars(stmt).all())

    def list_chunks_for_profile(self, db: Session, profile_id: str) -> list[DocumentChunkDB]:
        stmt = (
            select(DocumentChunkDB)
            .join(DocumentDB, DocumentDB.id == DocumentChunkDB.document_id)
            .where(
                DocumentChunkDB.profile_id == profile_id,
                DocumentDB.deleted.is_(False),
                DocumentDB.status == "READY",
            )
            .order_by(DocumentChunkDB.created_at.asc())
        )
        return list(db.scalars(stmt).all())

    def search_chunks_by_vector(
        self,
        db: Session,
        *,
        profile_id: str,
        query_embedding: list[float],
        top_k: int,
    ) -> list[tuple[DocumentChunkDB, float]]:
        stmt = (
            select(
                DocumentChunkDB,
                DocumentChunkDB.embedding_vector.cosine_distance(query_embedding).label("distance"),
            )
            .join(DocumentDB, DocumentDB.id == DocumentChunkDB.document_id)
            .where(
                DocumentChunkDB.profile_id == profile_id,
                DocumentChunkDB.embedding_vector.is_not(None),
                DocumentDB.deleted.is_(False),
                DocumentDB.status == "READY",
            )
            .order_by("distance")
            .limit(max(1, top_k))
        )
        return list(db.execute(stmt).all())

    def add_retrieval_trace(
        self,
        db: Session,
        *,
        message_id: str,
        retrieval_query: str,
        top_k: int,
        rerank_top_n: int,
        bm25_enabled: bool,
        raw_candidates: list,
        reranked_results: list,
        citations: list,
    ) -> MessageRetrievalTraceDB:
        trace = MessageRetrievalTraceDB(
            message_id=message_id,
            retrieval_query=retrieval_query,
            top_k=top_k,
            rerank_top_n=rerank_top_n,
            bm25_enabled=bm25_enabled,
            raw_candidates_json=raw_candidates,
            reranked_results_json=reranked_results,
            citations_json=citations,
        )
        db.add(trace)
        db.commit()
        db.refresh(trace)
        return trace

    def add_audit_log(
        self,
        db: Session,
        actor_user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        before_json: dict | None,
        after_json: dict | None,
    ) -> AuditLogDB:
        audit = AuditLogDB(
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before_json=before_json,
            after_json=after_json,
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit

    def list_audit_logs(self, db: Session, limit: int = 200) -> list[AuditLogDB]:
        stmt = select(AuditLogDB).order_by(AuditLogDB.created_at.desc()).limit(limit)
        return list(db.scalars(stmt).all())

    def get_system_model_config(self, db: Session) -> dict:
        row = db.get(SystemConfigDB, "model")
        if row is None:
            return {
                "provider": "openrouter",
                "model_name": settings.openrouter_model,
                "params": {"temperature": 0.2, "max_tokens": 2048},
            }
        return row.value_json

    def update_system_model_config(
        self, db: Session, provider: str, model_name: str, params: dict, updated_by: str
    ) -> dict:
        row = db.get(SystemConfigDB, "model")
        next_value = {"provider": provider, "model_name": model_name, "params": params}
        if row is None:
            row = SystemConfigDB(
                config_key="model",
                value_json=next_value,
                updated_by=updated_by,
            )
            db.add(row)
        else:
            row.value_json = next_value
            row.updated_by = updated_by
        db.commit()
        return next_value


store = DatabaseStore()
