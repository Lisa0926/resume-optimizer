#!/bin/bash

# ==========================================
# 夜间自动执行任务脚本
# ==========================================

# 1. 设置 PATH (确保 cron 环境能找到 claude 命令)
export PATH="/usr/local/node/bin:$PATH"

# 2. 加载环境变量 (用于 claude 认证)
# 从 backend/.env 文件加载所有敏感配置
ENV_FILE="$PROJECT_ROOT/backend/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    echo "[Cron] 已加载环境变量：$ENV_FILE" >> logs/cron-nightly.log
fi

# 设置默认值（如果 .env 中未配置）
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://coding.dashscope.aliyuncs.com/apps/anthropic}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-qwen3.5-plus}"

# 3. 定义项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

# 4. 创建日志目录
mkdir -p logs

# 5. 加载 mission 配置
MISSION_FILE="$PROJECT_ROOT/missions/nightly-dev-job.yaml"

# 6. 打印开始时间
echo "=========================================" >> logs/cron-nightly.log
echo "[Cron] 夜间迭代任务开始：$(date)" >> logs/cron-nightly.log
echo "工作目录：$PROJECT_ROOT" >> logs/cron-nightly.log
echo "Mission: $MISSION_FILE" >> logs/cron-nightly.log

# 7. 检查 claude 命令是否可用
if ! command -v claude &> /dev/null; then
    echo "[Cron] claude 命令未找到，使用完整路径..." >> logs/cron-nightly.log
    CLAUDE_CMD="/usr/local/node/bin/claude"
else
    CLAUDE_CMD="claude"
fi

# 7. 执行夜间任务
LOG_FILE="logs/nightly-$(date +%Y%m%d).log"

$CLAUDE_CMD -p \
    "执行夜间迭代任务 (dev 测试版本)：读取 missions/nightly-dev-job.yaml 配置，执行代码审查、测试运行、重构优化。最多迭代 5 次，确保所有测试通过。" \
    --effort high \
    < /dev/null \
    > "$LOG_FILE" 2>&1

EXIT_CODE=$?

# 8. 记录执行结果并发送飞书通知
REPORT_TARGET="${FEISHU_NIGHTLY_TASK_GROUP:-YOUR_FEISHU_CHAT_ID_HERE}"
OPENCLAW_CMD="/usr/local/node/bin/openclaw"

# 获取任务摘要（最后 20 行）
SUMMARY=$(tail -20 "$LOG_FILE" 2>/dev/null | tr '\n' '\n')

# 确定任务状态
if [ $EXIT_CODE -eq 0 ]; then
    STATUS_EMOJI="✅"
    STATUS_TEXT="成功"
    echo "[Cron] 夜间迭代任务完成：$(date)" >> logs/cron-nightly.log
else
    STATUS_EMOJI="❌"
    STATUS_TEXT="失败（退出码：$EXIT_CODE）"
    echo "[Cron] 夜间迭代任务退出码：$EXIT_CODE" >> logs/cron-nightly.log
fi

# 发送飞书通知
MESSAGE="$STATUS_EMOJI 夜间迭代任务 (dev 测试) $STATUS_TEXT

📅 执行时间：$(date '+%Y-%m-%d %H:%M:%S')
📂 工作目录：$PROJECT_ROOT
📋 Mission: nightly-dev-job.yaml

📊 执行摘要:
$SUMMARY

📁 完整日志：logs/nightly-$(date +%Y%m%d).log"

# 使用 openclaw 发送消息
if command -v openclaw &> /dev/null; then
    FEISHU_OUTPUT=$($OPENCLAW_CMD message send --channel feishu --target "$REPORT_TARGET" --message "$MESSAGE" 2>&1)
    FEISHU_EXIT=$?
    if [ $FEISHU_EXIT -eq 0 ]; then
        echo "[Cron] 飞书通知已发送：$FEISHU_OUTPUT" >> logs/cron-nightly.log
    else
        echo "[Cron] 飞书通知发送失败：$FEISHU_OUTPUT" >> logs/cron-nightly.log
    fi
else
    echo "[Cron] openclaw 命令未找到，跳过通知发送" >> logs/cron-nightly.log
fi

# 9. 自动生成当日 changelog
echo "[Cron] 正在生成 changelog..." >> logs/cron-nightly.log

TODAY=$(date +%Y-%m-%d)
CHANGELOG="CHANGELOG-${TODAY}.md"

# 检查 git 是否存在且有提交
if git rev-parse --git-dir > /dev/null 2>&1; then
    TODAY_COMMITS=$(git log --since="00:00" --until="23:59" --pretty=format:"%h - %s" 2>/dev/null || echo "")

    if [ -n "$TODAY_COMMITS" ]; then
        if [ ! -f "${CHANGELOG}" ]; then
            cat > "${CHANGELOG}" << EOF
# 变更日志 - ${TODAY}

## 概述
<!-- 待填写 -->

---

## 修改文件
### 后端
| 文件 | 修改类型 | 说明 |
|------|----------|------|

### 前端
| 文件 | 修改类型 | 说明 |
|------|----------|------|

### 脚本/配置
| 文件 | 修改类型 | 说明 |
|------|----------|------|

---

## Git 提交历史
EOF
        fi

        {
            echo "### $(date +%Y-%m-%d)"
            echo ""
            echo "${TODAY_COMMITS}" | while read line; do echo "- $line"; done
            echo ""
            echo "---"
            echo ""
        } >> "${CHANGELOG}"

        echo "[Cron] Changelog 已更新：${CHANGELOG}" >> logs/cron-nightly.log
    else
        echo "[Cron] 今日无 git 提交，跳过 changelog 更新" >> logs/cron-nightly.log
    fi
else
    echo "[Cron] 非 git 仓库，跳过 changelog 更新" >> logs/cron-nightly.log
fi

echo "=========================================" >> logs/cron-nightly.log
