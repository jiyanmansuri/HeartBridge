@echo off
echo Starting Backend...
start cmd /k "cd backend && .venv\Scripts\python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo Starting Unified Frontend...
start cmd /k "cd frontend && npm run dev -- --port 3000"

echo Waiting for servers to start...
ping 127.0.0.1 -n 4 > nul

echo Opening browser tabs...
start http://localhost:3000
start http://localhost:8000/docs

echo All services started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
