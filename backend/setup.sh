#!/bin/bash
# 后端依赖安装脚本

echo "=== 智能简历优化器 - 后端环境设置 ==="

# 检查 Python 版本
echo "检查 Python 版本..."
python3 --version

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "安装 Python 依赖..."
pip install -r requirements.txt

echo ""
echo "✓ 后端环境设置完成！"
echo ""
echo "使用方法:"
echo "  1. 复制 .env.example 为 .env 并配置 API Key"
echo "  2. 运行：source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
