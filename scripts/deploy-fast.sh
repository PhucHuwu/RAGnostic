#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

DEPLOY_BACKEND_PORT="${DEPLOY_BACKEND_PORT:-3724}"
DEPLOY_FRONTEND_PORT="${DEPLOY_FRONTEND_PORT:-3636}"
DEPLOY_PUBLIC_HOST="${DEPLOY_PUBLIC_HOST:-172.16.4.205}"
DEPLOY_API_BASE_URL="${DEPLOY_API_BASE_URL:-http://${DEPLOY_PUBLIC_HOST}:${DEPLOY_BACKEND_PORT}/api/v1}"

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
    echo "Deploying backend (no reload) on :${DEPLOY_BACKEND_PORT} (attempt ${attempt}/${max_attempts})"
    nohup "${BACKEND_DIR}/.venv/bin/uvicorn" app.main:app \
      --host 0.0.0.0 \
      --port "${DEPLOY_BACKEND_PORT}" \
      --env-file "${BACKEND_DIR}/.env" \
      > /tmp/opencode/ragnostic-backend-deploy.log 2>&1 &

    sleep 2
    if curl -s --max-time 2 "http://localhost:${DEPLOY_BACKEND_PORT}/api/v1/health" >/dev/null; then
      return 0
    fi

    if grep -q "Address already in use" /tmp/opencode/ragnostic-backend-deploy.log 2>/dev/null; then
      echo "Backend port ${DEPLOY_BACKEND_PORT} is busy. Retrying..."
      kill_port "${DEPLOY_BACKEND_PORT}"
    fi

    ((attempt++))
  done

  echo "Failed to deploy backend on :${DEPLOY_BACKEND_PORT}"
  return 1
}

build_frontend_prod() {
  echo "Building frontend production bundle"
  env NEXT_PUBLIC_API_BASE_URL="${DEPLOY_API_BASE_URL}" npm --prefix "${FRONTEND_DIR}" run build > /tmp/opencode/ragnostic-frontend-build.log 2>&1
}

start_frontend_with_retry() {
  local attempt=1
  local max_attempts=3

  while (( attempt <= max_attempts )); do
    echo "Deploying frontend (prod) on :${DEPLOY_FRONTEND_PORT} (attempt ${attempt}/${max_attempts})"
    nohup env PORT="${DEPLOY_FRONTEND_PORT}" HOST="0.0.0.0" NEXT_PUBLIC_API_BASE_URL="${DEPLOY_API_BASE_URL}" npm --prefix "${FRONTEND_DIR}" run start \
      > /tmp/opencode/ragnostic-frontend-deploy.log 2>&1 &

    sleep 2
    if curl -s --max-time 2 "http://localhost:${DEPLOY_FRONTEND_PORT}" >/dev/null; then
      return 0
    fi

    if grep -q "Address already in use" /tmp/opencode/ragnostic-frontend-deploy.log 2>/dev/null; then
      echo "Frontend port ${DEPLOY_FRONTEND_PORT} is busy. Retrying..."
      kill_port "${DEPLOY_FRONTEND_PORT}"
    fi

    ((attempt++))
  done

  echo "Failed to deploy frontend on :${DEPLOY_FRONTEND_PORT}"
  return 1
}

kill_port "${DEPLOY_BACKEND_PORT}"
kill_port "${DEPLOY_FRONTEND_PORT}"

build_frontend_prod
start_backend_with_retry
start_frontend_with_retry

sleep 3
BE_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEPLOY_BACKEND_PORT}/api/v1/health" || true)"
FE_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEPLOY_FRONTEND_PORT}" || true)"

echo "Backend status:  ${BE_CODE} (http://localhost:${DEPLOY_BACKEND_PORT}/api/v1/health)"
echo "Frontend status: ${FE_CODE} (http://localhost:${DEPLOY_FRONTEND_PORT})"
echo "Frontend API base: ${DEPLOY_API_BASE_URL}"
