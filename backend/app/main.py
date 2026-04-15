from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.request_context import RequestContextMiddleware


configure_logging(service_name="rag-api", level=settings.log_level)

app = FastAPI(title="RAGnostic API", version="0.1.0")
app.add_middleware(RequestContextMiddleware)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "RAGnostic API", "status": "ok"}
