from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware.request_context import RequestContextMiddleware
from app.services.store import store

configure_logging(service_name=settings.service_name, level=settings.log_level)

app = FastAPI(title="RAGnostic API", version="0.1.0")
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)

store.bootstrap_defaults()


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and {"code", "message"}.issubset(exc.detail):
        payload = dict(exc.detail)
    else:
        payload = {
            "code": "HTTP_ERROR",
            "message": str(exc.detail),
            "details": None,
            "request_id": getattr(request.state, "request_id", None),
        }
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Dữ liệu đầu vào không hợp lệ",
            "details": {"errors": exc.errors()},
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "RAGnostic API", "status": "ok"}
