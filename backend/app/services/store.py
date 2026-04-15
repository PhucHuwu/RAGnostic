from __future__ import annotations

import hashlib
import threading
import uuid
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.core.security import UserRole, UserStatus, hash_password
from app.models.entities import (
    AuditLog,
    ChatbotProfile,
    ChatMessage,
    ChatSession,
    Document,
    SystemModelConfig,
    User,
    UserSession,
)


def _utcnow() -> datetime:
    return datetime.now(UTC)


class InMemoryStore:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.users: dict[str, User] = {}
        self.users_by_username: dict[str, str] = {}
        self.user_sessions: dict[str, UserSession] = {}
        self.profiles: dict[str, ChatbotProfile] = {}
        self.documents: dict[str, Document] = {}
        self.chat_sessions: dict[str, ChatSession] = {}
        self.chat_messages: dict[str, list[ChatMessage]] = {}
        self.audit_logs: list[AuditLog] = []
        self.system_model_config = SystemModelConfig(model_name=settings.openrouter_model)

    def bootstrap_defaults(self) -> None:
        with self._lock:
            if "admin" not in self.users_by_username and settings.app_env in {
                "local",
                "dev",
                "init",
            }:
                self.create_user(
                    username="admin",
                    password="123456",
                    role=UserRole.ADMIN,
                    status=UserStatus.ACTIVE,
                )

    def create_user(
        self,
        username: str,
        password: str,
        role: UserRole = UserRole.USER,
        status: UserStatus = UserStatus.ACTIVE,
        email: str | None = None,
    ) -> User:
        with self._lock:
            user_id = self.users_by_username.get(username)
            if user_id is not None:
                raise ValueError("Username already exists")
            user = User(
                id=str(uuid.uuid4()),
                username=username,
                password_hash=hash_password(password),
                role=role,
                status=status,
                email=email,
            )
            self.users[user.id] = user
            self.users_by_username[username] = user.id
            return user

    def get_user_by_username(self, username: str) -> User | None:
        with self._lock:
            user_id = self.users_by_username.get(username)
            if user_id is None:
                return None
            return self.users.get(user_id)

    def get_user(self, user_id: str) -> User | None:
        return self.users.get(user_id)

    def list_users(self) -> list[User]:
        with self._lock:
            return sorted(self.users.values(), key=lambda u: u.created_at)

    def create_session(
        self,
        user_id: str,
        refresh_token: str,
        ip_address: str | None,
        user_agent: str | None,
        expires_days: int,
        session_id: str | None = None,
    ) -> UserSession:
        with self._lock:
            session = UserSession(
                id=session_id or str(uuid.uuid4()),
                user_id=user_id,
                refresh_token_hash=hashlib.sha256(refresh_token.encode("utf-8")).hexdigest(),
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=_utcnow() + timedelta(days=expires_days),
            )
            self.user_sessions[session.id] = session
            return session

    def get_session(self, session_id: str) -> UserSession | None:
        return self.user_sessions.get(session_id)

    def revoke_session(self, session_id: str) -> None:
        with self._lock:
            session = self.user_sessions.get(session_id)
            if session is not None and session.revoked_at is None:
                session.revoked_at = _utcnow()
                session.updated_at = _utcnow()

    def rotate_refresh_token(
        self, session_id: str, refresh_token: str, expires_days: int
    ) -> UserSession:
        with self._lock:
            session = self.user_sessions[session_id]
            session.refresh_token_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
            session.expires_at = _utcnow() + timedelta(days=expires_days)
            session.updated_at = _utcnow()
            return session

    def create_profile(
        self, user_id: str, name: str, topic: str, description: str | None = None
    ) -> ChatbotProfile:
        with self._lock:
            profile = ChatbotProfile(
                id=str(uuid.uuid4()),
                user_id=user_id,
                name=name,
                topic=topic,
                description=description,
            )
            self.profiles[profile.id] = profile
            return profile

    def list_profiles_by_user(self, user_id: str) -> list[ChatbotProfile]:
        with self._lock:
            return [p for p in self.profiles.values() if p.user_id == user_id and not p.deleted]

    def get_profile(self, profile_id: str) -> ChatbotProfile | None:
        profile = self.profiles.get(profile_id)
        if profile is None or profile.deleted:
            return None
        return profile

    def create_document(
        self,
        owner_user_id: str,
        profile_id: str,
        file_name: str,
        file_ext: str,
        mime_type: str,
        file_size_bytes: int,
        checksum_sha256: str,
    ) -> Document:
        with self._lock:
            doc_id = str(uuid.uuid4())
            doc = Document(
                id=doc_id,
                owner_user_id=owner_user_id,
                profile_id=profile_id,
                file_name=file_name,
                file_ext=file_ext,
                mime_type=mime_type,
                file_size_bytes=file_size_bytes,
                checksum_sha256=checksum_sha256,
                storage_key=f"profiles/{profile_id}/{doc_id}/{file_name}",
                storage_bucket="ragnostic-docs",
            )
            self.documents[doc.id] = doc
            return doc

    def list_documents_for_profile(self, profile_id: str) -> list[Document]:
        with self._lock:
            return [
                d for d in self.documents.values() if d.profile_id == profile_id and not d.deleted
            ]

    def list_documents(self) -> list[Document]:
        with self._lock:
            return [d for d in self.documents.values() if not d.deleted]

    def get_document(self, document_id: str) -> Document | None:
        doc = self.documents.get(document_id)
        if doc is None or doc.deleted:
            return None
        return doc

    def soft_delete_document(self, document_id: str) -> None:
        with self._lock:
            doc = self.documents[document_id]
            doc.deleted = True
            doc.status = "DELETED"
            doc.updated_at = _utcnow()

    def create_chat_session(self, profile_id: str, user_id: str, title: str) -> ChatSession:
        with self._lock:
            session = ChatSession(
                id=str(uuid.uuid4()), profile_id=profile_id, user_id=user_id, title=title
            )
            self.chat_sessions[session.id] = session
            self.chat_messages[session.id] = []
            return session

    def list_chat_sessions(self, profile_id: str, user_id: str) -> list[ChatSession]:
        with self._lock:
            return [
                s
                for s in self.chat_sessions.values()
                if s.profile_id == profile_id and s.user_id == user_id
            ]

    def get_chat_session(self, session_id: str) -> ChatSession | None:
        return self.chat_sessions.get(session_id)

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        request_id: str | None,
        latency_ms: int | None = None,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
    ) -> ChatMessage:
        with self._lock:
            messages = self.chat_messages.setdefault(session_id, [])
            msg = ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role=role,
                content_md=content,
                content_text=content,
                seq_no=len(messages) + 1,
                request_id=request_id,
                latency_ms=latency_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=(prompt_tokens or 0) + (completion_tokens or 0),
            )
            messages.append(msg)
            chat_session = self.chat_sessions[session_id]
            chat_session.last_message_at = _utcnow()
            chat_session.updated_at = _utcnow()
            return msg

    def get_messages(self, session_id: str) -> list[ChatMessage]:
        with self._lock:
            return list(self.chat_messages.get(session_id, []))

    def add_audit_log(
        self,
        actor_user_id: str,
        action: str,
        resource_type: str,
        resource_id: str,
        before_json: dict | None,
        after_json: dict | None,
    ) -> AuditLog:
        with self._lock:
            audit = AuditLog(
                id=str(uuid.uuid4()),
                actor_user_id=actor_user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                before_json=before_json,
                after_json=after_json,
            )
            self.audit_logs.append(audit)
            return audit


store = InMemoryStore()
