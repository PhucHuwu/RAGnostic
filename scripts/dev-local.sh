#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

BACKEND_PORT="${BACKEND_PORT:-8037}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

BACKEND_ENV_FILE="${BACKEND_DIR}/.env.localdev"
FRONTEND_ENV_FILE="${FRONTEND_DIR}/.env.localdev"

kill_port() {
  local port="$1"
  local pids
  pids="$(ss -ltnp "( sport = :${port} )" 2>/dev/null | grep -o 'pid=[0-9]\+' | cut -d= -f2 | sort -u || true)"
  if [[ -n "${pids}" ]]; then
    echo "Killing process(es) on :${port} -> ${pids}"
    kill ${pids} || true
    sleep 1
    if ss -ltnp "( sport = :${port} )" 2>/dev/null | grep -q LISTEN; then
      echo "Force killing remaining process(es) on :${port}"
      kill -9 ${pids} || true
    fi
  fi
}

start_backend_with_retry() {
  local attempt=1
  local max_attempts=3

  while (( attempt <= max_attempts )); do
    echo "Starting backend local on :${BACKEND_PORT} (attempt ${attempt}/${max_attempts})"
    nohup "${BACKEND_DIR}/.venv/bin/uvicorn" app.main:app \
      --host 0.0.0.0 \
      --port "${BACKEND_PORT}" \
      --reload \
      --env-file "${BACKEND_ENV_FILE}" \
      > /tmp/opencode/ragnostic-backend-local.log 2>&1 &

    sleep 2
    if curl -s --max-time 2 "http://localhost:${BACKEND_PORT}/api/v1/health" >/dev/null; then
      return 0
    fi

    if grep -q "Address already in use" /tmp/opencode/ragnostic-backend-local.log 2>/dev/null; then
      echo "Backend port ${BACKEND_PORT} is busy. Retrying..."
      kill_port "${BACKEND_PORT}"
    fi

    ((attempt++))
  done

  echo "Failed to start backend local on :${BACKEND_PORT}"
  return 1
}

start_frontend_with_retry() {
  local attempt=1
  local max_attempts=3

  while (( attempt <= max_attempts )); do
    echo "Starting frontend local on :${FRONTEND_PORT} (attempt ${attempt}/${max_attempts})"
    nohup env NEXT_PUBLIC_API_BASE_URL="http://localhost:${BACKEND_PORT}/api/v1" npm --prefix "${FRONTEND_DIR}" run dev -- --port "${FRONTEND_PORT}" \
      > /tmp/opencode/ragnostic-frontend-local.log 2>&1 &

    sleep 2
    if curl -s --max-time 2 "http://localhost:${FRONTEND_PORT}" >/dev/null; then
      return 0
    fi

    if grep -q "Address already in use" /tmp/opencode/ragnostic-frontend-local.log 2>/dev/null; then
      echo "Frontend port ${FRONTEND_PORT} is busy. Retrying..."
      kill_port "${FRONTEND_PORT}"
    fi

    ((attempt++))
  done

  echo "Failed to start frontend local on :${FRONTEND_PORT}"
  return 1
}

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

kill_port "${BACKEND_PORT}"
kill_port "${FRONTEND_PORT}"

start_backend_with_retry
start_frontend_with_retry

for _ in $(seq 1 30); do
  if curl -s --max-time 2 "http://localhost:${BACKEND_PORT}/api/v1/health" >/dev/null; then
    break
  fi
  sleep 1
done

for _ in $(seq 1 30); do
  if curl -s --max-time 2 "http://localhost:${FRONTEND_PORT}" >/dev/null; then
    break
  fi
  sleep 1
done

echo "Local backend:  http://localhost:${BACKEND_PORT}/api/v1/health"
echo "Local frontend: http://localhost:${FRONTEND_PORT}"
