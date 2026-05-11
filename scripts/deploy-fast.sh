#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

DEPLOY_BACKEND_PORT="${DEPLOY_BACKEND_PORT:-3724}"
DEPLOY_FRONTEND_PORT="${DEPLOY_FRONTEND_PORT:-3636}"

echo "Deploying backend on :${DEPLOY_BACKEND_PORT}"
pkill -f "uvicorn app.main:app --host 0.0.0.0 --port ${DEPLOY_BACKEND_PORT}" || true
nohup "${BACKEND_DIR}/.venv/bin/uvicorn" app.main:app \
  --host 0.0.0.0 \
  --port "${DEPLOY_BACKEND_PORT}" \
  --reload \
  --env-file "${BACKEND_DIR}/.env" \
  > /tmp/opencode/ragnostic-backend-deploy.log 2>&1 &

echo "Deploying frontend on :${DEPLOY_FRONTEND_PORT}"
pkill -f "next dev -p 3000 --port ${DEPLOY_FRONTEND_PORT}" || true
nohup env NEXT_PUBLIC_API_BASE_URL="http://localhost:${DEPLOY_BACKEND_PORT}/api/v1" npm --prefix "${FRONTEND_DIR}" run dev -- --port "${DEPLOY_FRONTEND_PORT}" \
  > /tmp/opencode/ragnostic-frontend-deploy.log 2>&1 &

sleep 3
BE_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEPLOY_BACKEND_PORT}/api/v1/health" || true)"
FE_CODE="$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${DEPLOY_FRONTEND_PORT}" || true)"

echo "Backend status:  ${BE_CODE} (http://localhost:${DEPLOY_BACKEND_PORT}/api/v1/health)"
echo "Frontend status: ${FE_CODE} (http://localhost:${DEPLOY_FRONTEND_PORT})"
