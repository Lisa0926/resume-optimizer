# 夜间自动迭代任务配置

## 权限说明

夜间任务执行时，权限如下：

1. **文件修改权限** - 允许自动修改 `backend/`、`frontend/`、`scripts/` 目录下的代码文件
2. **测试执行权限** - 允许运行 `npm run test` 和 `python -m pytest`
3. **Git 操作权限** - ⚠️ **需要用户授权** (每次 git 操作前必须询问)

## ⚠️ 铁律（必须始终遵守）

### 铁律 1：敏感信息检查
**在任何 git 操作（add/commit/push）之前，必须检查并确认：**
- 所有飞书/微信 ID（channel、group、chat ID）已移至 `.env` 文件
- 所有 API Key 已移至 `.env` 文件
- `.env` 文件已被 `.gitignore` 屏蔽，不会被跟踪
- 没有任何敏感信息会被上传到远程分支

**检查命令示例：**
```bash
# 检查是否有敏感文件会被提交
git status
git diff --cached

# 检查 .env 是否被屏蔽
git check-ignore backend/.env

# 检查代码中是否有硬编码的敏感信息
grep -r "chat:oc_" --include="*.sh" --include="*.py" .
grep -r "sk-[a-zA-Z0-9]+" --include="*.sh" --include="*.py" .
```

### 铁律 2：Commit 信息语言
**所有 git commit 信息必须使用英语**，除非用户明确要求使用其他语言。

---

## 执行规则

- ✅ 代码审查后自动应用简单修复
- ✅ 测试失败时自动尝试修复
- ✅ 重复代码自动提取为公共函数
- ⚠️ Git 操作（add/commit/push）需要用户批准
- ⚠️ 复杂重构仍需人工批准

## 通知方式

任务执行完成后，通过飞书发送执行报告到指定频道。
