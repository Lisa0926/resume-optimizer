#!/bin/bash
# 智能简历优化器 - 一键安装和启动脚本

echo "======================================"
echo "   智能简历优化器 - 环境设置"
echo "======================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[1/4] 检查环境依赖...${NC}"

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}错误：未找到 Python3，请先安装 Python 3.10+${NC}"
    exit 1
fi
echo "✓ Python: $(python3 --version)"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误：未找到 Node.js，请先安装 Node.js 18+${NC}"
    exit 1
fi
echo "✓ Node.js: $(node --version)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误：未找到 npm${NC}"
    exit 1
fi
echo "✓ npm: $(npm --version)"

echo ""
echo -e "${YELLOW}[2/4] 安装后端依赖...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "创建 Python 虚拟环境..."
    python3 -m venv venv
fi

echo "激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -q -r requirements.txt
echo "✓ 后端依赖安装完成"

cd ..

echo ""
echo -e "${YELLOW}[3/4] 安装前端依赖...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "运行 npm install..."
    npm install --silent
fi
echo "✓ 前端依赖安装完成"

cd ..

echo ""
echo -e "${YELLOW}[4/4] 创建必要目录...${NC}"
mkdir -p uploads data
echo "✓ 目录创建完成"

echo ""
echo -e "${GREEN}======================================"
echo "   环境设置完成！"
echo "======================================${NC}"
echo ""
echo "使用方法:"
echo "  1. 配置阿里云 API Key:"
echo "     cp backend/.env.example backend/.env"
echo "     编辑 backend/.env 填入 DASHSCOPE_API_KEY"
echo ""
echo "  2. 启动开发服务器:"
echo "     ./start.sh"
echo ""
echo "  3. 访问应用:"
echo "     前端：http://localhost:5173"
echo "     后端 API: http://localhost:8000"
echo "     API 文档：http://localhost:8000/docs"
echo ""
