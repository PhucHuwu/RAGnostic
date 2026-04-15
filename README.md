# RAGnostic

Monorepo skeleton for a multi-tenant, domain-agnostic RAG platform based on project requirements in `docs/project.md` and `docs/system-design.md`.

## Architecture (MVP)

- `backend/`: FastAPI REST API (Auth, Profile, Documents, Chat, Admin APIs)
- `worker/`: async ingest worker (parse -> chunk -> index pipeline)
- `frontend/`: Next.js web app (landing page, chat UI, dashboards)
- `bff/`: Express service for frontend integration needs
- `infra/`: local development infra (`postgres`, `redis`, `minio`)

## Quick start

1. Copy environment file:

```bash
cp .env.example .env
```

2. Start local infrastructure:

```bash
docker compose -f infra/docker-compose.yml up -d
```

3. Backend setup (Python + venv):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
uvicorn app.main:app --reload --port 8000
```

4. Frontend setup:

```bash
cd frontend
npm install
npm run dev
```

5. BFF setup:

```bash
cd bff
npm install
npm run dev
```

## API base

- Base path: `/api/v1`
- Health: `GET /api/v1/health`
- Admin default seed (for init env): `admin/123456` (to be implemented in DB seed)

## Logging standard

Backend includes structured JSON logging with required fields:

- `timestamp`
- `level`
- `service`
- `event`
- `message`
- `request_id`
- `session_id`
- `user_id`
- `metadata`

## Code quality commands

At repository root:

```bash
npm install
```

- Lint all: `npm run lint`
- Typecheck all: `npm run typecheck`
- Format all: `npm run format`
- Check format only: `npm run format:check`

Python tooling uses:

- `ruff` for lint + formatter
- `mypy` for type checking

Node tooling uses:

- `eslint` for lint
- `typescript` for type checking
- `prettier` for formatting

## Notes

- This commit initializes project skeleton only, no business logic yet.
- API contracts and data model details are documented in `docs/system-design.md`.
