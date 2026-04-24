# Backend

FastAPI service for RAGnostic.

## Contents

- [Infrastructure services](#infrastructure-services)
- [Run with uvx](#run-with-uvx)

## Infrastructure services

Start required services from the repository root before running backend:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Service endpoints:

- Postgres (pgvector): `localhost:5435`
- Redis: `localhost:6380`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

## Run with uvx

From the `backend/` directory:

```bash
uvx --from pip pip --python .venv/bin/python install -e ".[dev]"
uvx --from alembic alembic -c alembic.ini upgrade head
.venv/bin/uvicorn app.main:app --reload --port 8037
```

API base URL: `http://localhost:8037/api/v1`
