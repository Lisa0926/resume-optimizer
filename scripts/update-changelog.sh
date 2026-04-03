#!/bin/bash
# scripts/update-changelog.sh
# 手动更新 changelog 的辅助脚本

set -e

CHANGELOG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TODAY=$(date +%Y-%m-%d)
CHANGELOG="${CHANGELOG_DIR}/CHANGELOG-${TODAY}.md"

# 检查是否有 uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  检测到未提交的变更，请先 git commit"
    git status --short
    exit 1
fi

# 如果 changelog 不存在，创建模板
if [ ! -f "${CHANGELOG}" ]; then
    cat > "${CHANGELOG}" << 'TEMPLATE'
# 变更日志 - YYYY-MM-DD

## 概述
<!-- 填写今日变更概述 -->

---

## 修改文件

### 后端
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| | | |

### 前端
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| | | |

### 脚本/配置
| 文件 | 修改类型 | 说明 |
|------|----------|------|
| | | |

---

## Git 提交历史
<!-- 自动生成 -->

TEMPLATE
    echo "✓ 创建新的 changelog: ${CHANGELOG}"
fi

# 自动填充 git 提交历史
echo "正在更新提交历史..."
git log --since="00:00" --pretty=format:"\n### \`%h\` - %ci\n\n\`\`\`\n%s\n\`\`\`\n" >> "${CHANGELOG}" 2>/dev/null || true

echo "✓ Changelog 已更新：${CHANGELOG}"
echo ""
echo "📝 请编辑文件填写概述和说明："
echo "   nano ${CHANGELOG}"
echo "   # 或使用你喜欢的编辑器"
