from contextvars import ContextVar

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)
session_id_ctx: ContextVar[str | None] = ContextVar("session_id", default=None)
user_id_ctx: ContextVar[str | None] = ContextVar("user_id", default=None)


def set_request_id(request_id: str | None) -> None:
    request_id_ctx.set(request_id)


def set_session_id(session_id: str | None) -> None:
    session_id_ctx.set(session_id)


def set_user_id(user_id: str | None) -> None:
    user_id_ctx.set(user_id)


def get_request_id() -> str | None:
    return request_id_ctx.get()


def get_session_id() -> str | None:
    return session_id_ctx.get()


def get_user_id() -> str | None:
    return user_id_ctx.get()
