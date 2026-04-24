# RAGnostic

RAGnostic is a monorepo for a multi-tenant, domain-agnostic RAG system.
Requirements are documented in `docs/project.md` and `docs/system-design.md`.

## Project structure

- `backend/`: FastAPI API (`auth`, `profiles`, `documents`, `chat`, `admin`, `logs`)
- `frontend/`: Next.js web UI
- `bff/`: Express BFF service
- `worker/`: ingest worker skeleton
- `infra/`: Docker Compose services (`postgres`, `redis`, `minio`)

## Prerequisites

- Python `3.12.x`
- Node.js `>= 20`
- Docker and Docker Compose
- `uv` / `uvx`

## Quick start

1. Start infrastructure:

```bash
docker compose -f infra/docker-compose.yml up -d
```

2. Prepare backend environment:

```bash
cp backend/.env.example backend/.env
```

Set at least these values in `backend/.env`:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `EMBEDDING_MODEL`
- `EMBEDDING_DIMENSIONS`

3. Install backend dependencies and run migrations with `uvx`:

```bash
uv venv --python 3.12 backend/.venv
uvx --from pip pip --python backend/.venv/bin/python install -e "backend/[dev]"
uvx --from alembic alembic -c backend/alembic.ini upgrade head
```

4. Run backend:

```bash
backend/.venv/bin/uvicorn app.main:app --reload --port 8037 --app-dir backend
```

API base URL: `http://localhost:8037/api/v1`

5. Run frontend:

```bash
cp frontend/.env.example frontend/.env.local
npm --prefix frontend install
npm --prefix frontend run dev
```

Set in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8037/api/v1
```

6. Optional: run BFF:

```bash
npm --prefix bff install
npm --prefix bff run dev
```

## Smoke test

```bash
curl -s http://localhost:8037/api/v1/health
curl -s http://localhost:8037/api/v1/ready
curl -s -X POST http://localhost:8037/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

## Code quality

From repository root:

```bash
npm install
npm run lint
npm run typecheck
npm run format:check
```

## Notes

- Do not commit secrets (`backend/.env`, `frontend/.env.local`).
- Rotate exposed API keys before using production environments.
