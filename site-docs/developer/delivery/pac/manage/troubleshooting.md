---
title: "Pipelines as Code 常见问题排查"
description: "排查 PipelineRun 未触发、控制器日志和 GitHub Token 作用域问题。"
sidebar_position: 43
doc_type: reference
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

## PipelineRun 未触发

如果 Pipelines as Code 未触发 PipelineRun，请检查以下内容：

1. ✅ Webhook 是否正确配置到 Git 仓库
2. ✅ Secret 是否正确创建在集群中
3. ✅ Repository CR 是否存在且配置正确
4. ✅ PipelineRun 定义文件是否在 `.tekton` 目录中
5. ✅ 文件扩展名是否为 `.yaml` 或 `.yml`
6. ✅ 事件注解是否匹配 Git 事件类型（pull_request/push/comment）
7. ✅ 目标分支注解是否与实际分支匹配

## 查看 Pipelines as Code 控制器日志

```bash
# 查找控制器 pod
kubectl get pods -n pipelines-as-code

# 查看日志
kubectl logs pipelines-as-code-controller-<pod_id> -n tekton-pipelines
```

## GitHub Token 作用域故障

如果 GitHub token 无法访问额外仓库，检查：
- `secret-github-app-token-scoped` 是否已设为 `false`
- 额外仓库名称格式是否正确（`owner/repo`）
- 仓库级别配置中，额外仓库是否与 Repository CR 在同一命名空间

错误示例：
```
failed to scope GitHub token as repo owner1/project1 does not exist in namespace test-repo
```
