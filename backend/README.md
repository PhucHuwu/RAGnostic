# Backend

FastAPI service for RAGnostic.

## Run with uvx

```bash
uvx --from pip pip --python .venv/bin/python install -e ".[dev]"
uvx --from alembic alembic -c alembic.ini upgrade head
.venv/bin/uvicorn app.main:app --reload --port 8037
```

API base URL: `http://localhost:8037/api/v1`
