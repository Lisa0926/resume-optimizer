#!/bin/bash

# ==========================================
# 每周产品经理视角迭代任务脚本
# 每周日 05:00 执行，完成后发送微信通知
# ==========================================

# 1. 设置 PATH
export PATH="/usr/local/node/bin:$PATH"

# 2. 加载环境变量
# 从 backend/.env 文件加载所有敏感配置
ENV_FILE="$PROJECT_ROOT/backend/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    echo "[Weekly-PM] 已加载环境变量：$ENV_FILE" >> logs/weekly-pm.log
fi

# 设置默认值（如果 .env 中未配置）
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://coding.dashscope.aliyuncs.com/apps/anthropic}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-qwen3.5-plus}"

# 3. 定义项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# 4. 创建日志目录
mkdir -p logs

# 5. 加载配置文件
MISSION_FILE="$PROJECT_ROOT/missions/weekly-pm-audit.yaml"

# 6. 打印开始时间
echo "=========================================" >> logs/weekly-pm.log
echo "[Weekly-PM] 每周产品迭代任务开始：$(date)" >> logs/weekly-pm.log
echo "工作目录：$PROJECT_ROOT" >> logs/weekly-pm.log
echo "配置文件：$MISSION_FILE" >> logs/weekly-pm.log

# 7. 检查 claude 命令
if ! command -v claude &> /dev/null; then
    CLAUDE_CMD="/usr/local/node/bin/claude"
else
    CLAUDE_CMD="claude"
fi

# 7. 执行每周产品分析任务
LOG_FILE="logs/weekly-pm-$(date +%Y%m%d).log"

echo "开始执行产品分析任务..." > "$LOG_FILE"

$CLAUDE_CMD -p "
执行每周产品经理视角迭代任务：

1. 读取 missions/weekly-pm-audit.yaml 配置文件
2. 执行竞品分析，更新 reports/competitive-analysis.md
3. 执行产品规划，更新 reports/product-backlog.md
4. 直接执行 P0 优先级的 UI 优化改进
5. 生成修改摘要报告到 reports/weekly-summary.md
6. 更新 reports/ui-changelog.md

注意：
- 只执行 ui-ux-improvement 和 generate-summary 任务
- 功能迭代任务（feature-iteration）需要用户批准，不要执行
- 代码重构、测试修复任务也需要批准，不要执行
" \
    --effort high \
    < /dev/null \
    >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

# 8. 生成微信通知内容
REPORT_TARGET="${WEIXIN_REPORT_TARGET:-YOUR_WEIXIN_USER_ID_HERE}"
OPENCLAW_CMD="/usr/local/node/bin/openclaw"

# 获取执行摘要（最后 30 行）
SUMMARY=$(tail -30 "$LOG_FILE" 2>/dev/null | grep -v "^$" | head -20 | tr '\n' '\n')

# 确定任务状态
if [ $EXIT_CODE -eq 0 ]; then
    STATUS_EMOJI="✅"
    STATUS_TEXT="成功"
else
    STATUS_EMOJI="⚠️"
    STATUS_TEXT="完成（可能有部分任务跳过）"
fi

# 9. 构建微信消息
MESSAGE="$STATUS_EMOJI 每周产品迭代报告已生成 $STATUS_TEXT

📅 执行时间：$(date '+%Y-%m-%d %H:%M:%S')
📂 项目：智能简历优化器

📊 已完成的分析:
• 竞品分析报告 → reports/competitive-analysis.md
• 产品待办列表 → reports/product-backlog.md
• UI 修改日志 → reports/ui-changelog.md
• 每周总结报告 → reports/weekly-summary.md

📝 执行摘要:
$SUMMARY

📁 查看方式：打开 Claude Apps → resume-optimizer → reports/ 目录"

# 10. 发送微信通知
if command -v openclaw &> /dev/null; then
    WEIXIN_OUTPUT=$($OPENCLAW_CMD message send --channel openclaw-weixin --target "$REPORT_TARGET" --message "$MESSAGE" 2>&1)
    WEIXIN_EXIT=$?
    if [ $WEIXIN_EXIT -eq 0 ]; then
        echo "[Weekly-PM] 微信通知已发送：$WEIXIN_OUTPUT" >> logs/weekly-pm.log
    else
        echo "[Weekly-PM] 微信通知发送失败：$WEIXIN_OUTPUT" >> logs/weekly-pm.log
    fi
else
    echo "[Weekly-PM] openclaw 命令未找到，跳过通知发送" >> logs/weekly-pm.log
fi

echo "[Weekly-PM] 任务执行完成：$(date)" >> logs/weekly-pm.log
echo "=========================================" >> logs/weekly-pm.log
