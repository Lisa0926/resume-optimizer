#!/bin/bash

# ==========================================
# 飞书通知发送脚本
# 用于 openclaw 任务的统一通知入口
# ==========================================

# 参数解析
TARGET="${1:-}"
TITLE="${2:-任务通知}"
CONTENT="${3:-}"

# 飞书群聊 ID 配置
NIGHTLY_TASK_GROUP="chat:oc_5cc382057eb83bc86ec2ec6367e10d14"  # 夜间任务群
NEWS_GROUP="chat:oc_a06b8d3aaf54247f117afe4aeac55fd1"          # 新闻推送群

# 检查 openclaw 命令
OPENCLAW_CMD="/usr/local/node/bin/openclaw"
if ! command -v openclaw &> /dev/null; then
    echo "[$(date)] 错误：openclaw 命令未找到" >&2
    exit 1
fi

# 默认目标：夜间任务群
if [ -z "$TARGET" ]; then
    TARGET="$NIGHTLY_TASK_GROUP"
fi

# 构建消息
MESSAGE="$TITLE

$CONTENT

🕐 执行时间：$(date '+%Y-%m-%d %H:%M:%S')"

# 发送消息
$OPENCLAW_CMD message send --channel feishu --target "$TARGET" --message "$MESSAGE" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "[$(date)] 通知发送成功：$TARGET"
    exit 0
else
    echo "[$(date)] 通知发送失败：$TARGET" >&2
    exit 1
fi
