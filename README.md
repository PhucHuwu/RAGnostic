# RAGnostic

Monorepo cho hệ thống RAG đa tenant, bám theo yêu cầu trong `docs/project.md` và `docs/system-design.md`.

## Kiến trúc MVP

- `backend/`: FastAPI API (`auth`, `profiles`, `documents`, `chat`, `admin`, `logs`)
- `frontend/`: Next.js UI
- `bff/`: Express BFF
- `worker/`: ingest worker (khung, chưa bắt buộc để chạy local MVP hiện tại)
- `infra/`: Docker Compose cho `postgres(pgvector)`, `redis`, `minio`

## Yêu cầu môi trường

- Python `3.12.x`
- Node.js `>= 20`
- Docker + Docker Compose

Nếu dùng `pyenv`:

```bash
pyenv install 3.12.8
pyenv local 3.12.8
```

## Chạy dự án local (khuyến nghị)

### 1) Khởi động hạ tầng

```bash
docker compose -f infra/docker-compose.yml up -d
```

Services mặc định:

- Postgres (pgvector): `localhost:5435`
- Redis: `localhost:6380`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

### 2) Cấu hình backend

```bash
cp backend/.env.example backend/.env
```

Mở `backend/.env` và điền tối thiểu:

- `OPENROUTER_API_KEY=<your_openrouter_key>`
- `OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free`
- `EMBEDDING_MODEL=BAAI/bge-m3`
- `EMBEDDING_DIMENSIONS=1024`

### 3) Cài backend + migrate DB

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -e backend/[dev]
alembic -c backend/alembic.ini upgrade head
```

### 4) Chạy backend

```bash
uvicorn app.main:app --reload --port 8000 --app-dir backend
```

API base: `http://localhost:8000/api/v1`

### 5) Cài và chạy frontend

```bash
cp frontend/.env.example frontend/.env.local
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend: `http://localhost:3000`

Lưu ý: đảm bảo `frontend/.env.local` có:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

### 6) (Tuỳ chọn) Chạy BFF

```bash
npm --prefix bff install
npm --prefix bff run dev
```

BFF health: `http://localhost:4000/health`

## Smoke test nhanh (nên chạy)

### Health/ready

```bash
curl -s http://localhost:8000/api/v1/health
curl -s http://localhost:8000/api/v1/ready
```

### Login admin seed

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

Nếu login fail, kiểm tra lại migration và startup log của backend.

## Luồng kiểm tra RAG tối thiểu

1. Login lấy `access_token`
2. Tạo profile: `POST /api/v1/profiles`
3. Upload tài liệu `txt/pdf/docx`: `POST /api/v1/profiles/{profile_id}/documents/upload`
4. Tạo session: `POST /api/v1/profiles/{profile_id}/sessions`
5. Gửi câu hỏi: `POST /api/v1/sessions/{session_id}/messages`
6. Kiểm tra `retrieval_trace` trong response có `raw_candidates`, `reranked_results`, `citations`

## Lệnh chất lượng mã nguồn

Tại root repo:

```bash
npm install
npm run lint
npm run typecheck
npm run format:check
```

## Lưu ý quan trọng

- Không commit file chứa secret (`backend/.env`, `frontend/.env.local`).
- API key OpenRouter đã lộ phải rotate ngay trước khi dùng môi trường thật.
- `worker/` hiện là khung; ingest MVP đang chạy trong backend upload flow.
