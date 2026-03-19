#!/bin/bash
# 智能简历优化器 - 启动开发服务器

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================"
echo "   智能简历优化器 - 启动服务"
echo "======================================"
echo ""

# 启动后端
echo "[后端] 启动 FastAPI 服务器..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 2

# 启动前端
echo "[前端] 启动 Vite 开发服务器..."
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ 服务已启动!"
echo "  前端：http://localhost:5173"
echo "  后端：http://localhost:8000"
echo "  API 文档：http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 等待
wait
