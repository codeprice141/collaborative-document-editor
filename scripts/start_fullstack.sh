#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🚀 Starting Full-Stack Real-Time Collaborative Doc Editor"
echo "=========================================================="

# 1. Start PostgreSQL if docker is available
if command -v docker &> /dev/null; then
  echo "[1/3] Ensuring PostgreSQL container is running..."
  docker start collaborative_doc_postgres 2>/dev/null || docker compose up -d postgres 2>/dev/null || true
fi

# 2. Start Backend
echo "[2/3] Starting FastAPI Backend on http://localhost:8000..."
export PYTHONPATH=backend
.venv/bin/uvicorn app.main:app --port 8000 --reload &
BACKEND_PID=$!

# 3. Start Frontend
echo "[3/3] Starting React Frontend on http://localhost:5173..."
cd frontend
npm run dev -- --port 5173 &
FRONTEND_PID=$!
cd ..

trap "echo 'Stopping all services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

echo ""
echo "🎉 System is running!"
echo "👉 Frontend App:     http://localhost:5173"
echo "👉 Backend API:      http://localhost:8000"
echo "👉 Interactive Docs: http://localhost:8000/api/v1/docs"
echo "👉 Health Check:     http://localhost:8000/health"
echo "Press CTRL+C to stop all services."
echo ""

wait
