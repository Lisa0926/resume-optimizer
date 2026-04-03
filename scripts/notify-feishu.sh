#!/bin/bash
# 飞书通知脚本 - 每周迭代报告生成后发送通知

# 从 backend/.env 加载环境变量
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/backend/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs) 2>/dev/null
fi

# 飞书配置（从环境变量读取，默认值作为后备）
FEISHU_CHAT_ID="${FEISHU_NIGHTLY_TASK_GROUP:-chat:oc_5cc382057eb83bc86ec2ec6367e10d14}"
REPORT_PATH="/home/lisa/claude_apps/resume-optimizer/reports/weekly-summary.md"
MANUAL_URL="${CLAUDE_APPS_URL:-https://claude-apps.com}"

# 读取报告内容，提取关键信息
if [ -f "$REPORT_PATH" ]; then
    # 提取本周 UI 修改摘要（前 500 字符）
    SUMMARY=$(head -50 "$REPORT_PATH" | tail -30 | tr '\n' ' ' | cut -c1-300)

    # 构建消息内容
    MESSAGE_CONTENT=$(cat <<EOF
{
    "msg_type": "interactive",
    "card": {
        "header": {
            "title": {
                "tag": "plain_text",
                "content": "📊 每周迭代报告已生成"
            },
            "template": "blue"
        },
        "elements": [
            {
                "tag": "markdown",
                "content": "**项目**: 智能简历优化器\n\n**报告路径**: \`reports/weekly-summary.md\`\n\n**查看方式**:\n1. 打开 Claude Apps\n2. 导航至 resume-optimizer 项目\n3. 查看 reports/weekly-summary.md 文件"
            },
            {
                "tag": "action",
                "actions": [
                    {
                        "tag": "button",
                        "text": {
                            "tag": "plain_text",
                            "content": "📄 查看完整报告"
                        },
                        "url": "${MANUAL_URL}",
                        "type": "default"
                    }
                ]
            }
        ]
    }
}
EOF
)

    # 发送飞书消息
    curl -X POST "https://open.feishu.cn/open-apis/im/v1/messages" \
        -H "Authorization: Bearer $FEISHU_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"receive_id\": \"$FEISHU_CHAT_ID\",
            \"msg_type\": \"interactive\",
            \"content\": $(echo "$MESSAGE_CONTENT" | jq -c .)}" 2>/dev/null

    echo "飞书通知已发送"
else
    echo "报告文件不存在：$REPORT_PATH"
fi
