#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

BACKEND_PORT="${BACKEND_PORT:-8037}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

BACKEND_ENV_FILE="${BACKEND_DIR}/.env.localdev"
FRONTEND_ENV_FILE="${FRONTEND_DIR}/.env.localdev"

if [[ ! -f "${BACKEND_ENV_FILE}" ]]; then
  cp "${BACKEND_DIR}/.env.example" "${BACKEND_ENV_FILE}"
  echo "Created ${BACKEND_ENV_FILE} from .env.example"
fi

if [[ ! -f "${FRONTEND_ENV_FILE}" ]]; then
  cat > "${FRONTEND_ENV_FILE}" <<EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:${BACKEND_PORT}/api/v1
EOF
  echo "Created ${FRONTEND_ENV_FILE}"
fi

if ! grep -q "^BACKEND_CORS_ORIGINS=" "${BACKEND_ENV_FILE}"; then
  cat >> "${BACKEND_ENV_FILE}" <<EOF
BACKEND_CORS_ORIGINS=http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}
EOF
fi

if ! grep -q "^BACKEND_CORS_ORIGINS=http://localhost:${FRONTEND_PORT}" "${BACKEND_ENV_FILE}"; then
  python3 - <<PY
from pathlib import Path
path = Path(r"${BACKEND_ENV_FILE}")
lines = path.read_text().splitlines()
out = []
for line in lines:
    if line.startswith("BACKEND_CORS_ORIGINS="):
        line = "BACKEND_CORS_ORIGINS=http://localhost:${FRONTEND_PORT},http://127.0.0.1:${FRONTEND_PORT}"
    out.append(line)
path.write_text("\n".join(out) + "\n")
PY
fi

pkill -f "uvicorn app.main:app --host 0.0.0.0 --port ${BACKEND_PORT}" || true
pkill -f "next dev -p 3000 --port ${FRONTEND_PORT}" || true

echo "Starting backend local on :${BACKEND_PORT}"
nohup "${BACKEND_DIR}/.venv/bin/uvicorn" app.main:app \
  --host 0.0.0.0 \
  --port "${BACKEND_PORT}" \
  --reload \
  --env-file "${BACKEND_ENV_FILE}" \
  > /tmp/opencode/ragnostic-backend-local.log 2>&1 &

echo "Starting frontend local on :${FRONTEND_PORT}"
nohup env NEXT_PUBLIC_API_BASE_URL="http://localhost:${BACKEND_PORT}/api/v1" npm --prefix "${FRONTEND_DIR}" run dev -- --port "${FRONTEND_PORT}" \
  > /tmp/opencode/ragnostic-frontend-local.log 2>&1 &

sleep 2
echo "Local backend:  http://localhost:${BACKEND_PORT}/api/v1/health"
echo "Local frontend: http://localhost:${FRONTEND_PORT}"
