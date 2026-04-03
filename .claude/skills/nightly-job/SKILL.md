---
name: nightly-job
description: 每日夜间执行代码审查、测试运行、重构优化
disable-model-invocation: false
---

# 每日夜间迭代任务 Skill

读取并执行 `missions/nightly-audit.yaml` 中定义的任务。

## 执行时间

**每天凌晨 01:00、每晚 21:00** (Asia/Shanghai 时区)

## 任务列表

### 1. 代码审查 (code-review)
1. 扫描最近一天修改的代码文件
2. 识别潜在 bug 和性能问题
3. 自动修复简单问题
4. 对复杂问题创建 TODO 注释

### 2. 测试运行 (test-runner)
1. 运行全部单元测试
2. 失败的测试自动尝试修复
3. 生成测试报告到 `reports/test-summary.md`

### 3. 重构优化 (refactor-pass)
1. 识别重复代码
2. 提取公共函数
3. 优化代码结构
4. 确保所有测试通过

### 4. 文档更新 (documentation)
1. 更新变更文件的文档注释
2. 生成 CHANGELOG.md 更新
3. 同步 README 中的 API 示例

## 执行流程

1. 首先读取 `missions/nightly-audit.yaml` 配置文件
2. 按照任务列表顺序执行
3. 每个任务完成后记录日志
4. 最终生成总结报告到 `reports/nightly-summary.md`

## 完成标准

- [ ] 所有测试通过
- [ ] 无关键问题
- [ ] 最多迭代 5 次

## 失败处理

如果任务失败，需要：
1. 记录失败原因
2. 回滚失败的更改
3. 生成失败报告

## 输出报告

1. `reports/test-summary.md` - 测试报告
2. `reports/nightly-summary.md` - 夜间任务总结
