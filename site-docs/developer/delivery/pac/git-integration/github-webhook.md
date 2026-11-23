---
title: "GitHub Webhook 集成"
description: "在无法创建 GitHub App 时，为 Pipelines as Code 配置 GitHub Webhook。"
sidebar_position: 22
doc_type: how-to
audience: [admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

如果无法创建 GitHub App，可以使用 GitHub Webhook。但 GitHub Webhook **不支持** GitHub Check Runs API，Pipelines as Code 将任务状态报告为 PR 评论，而非 **Checks** 标签页。

**限制**：
- 不支持 GitOps 评论（如 `/retest`、`/ok-to-test`）
- 重新触发 CI 需要创建新的提交

**先决条件**：
- 集群上已安装 Pipelines as Code
- 已在 GitHub 上创建 Personal Access Token

**Token 权限要求**：

**细粒度 token**（Fine-grained tokens）：

| 名称 | 访问权限 |
|---|---|
| Administration | Read-only |
| Metadata | Read-only |
| Contents | Read-only |
| Commit statuses | Read and Write |
| Pull requests | Read and Write |
| Webhooks | Read and Write |

**经典 token**（Classic tokens）：
- 公开仓库：`public_repo`
- 私有仓库：`repo`
- 如需使用 `tkn pac` CLI 配置 webhook，额外添加 `admin:repo_hook`

## 自动配置（使用 CLI）

```bash
tkn pac create repo
```

**交互式输出示例**：

```
? Enter the Git repository url (default: https://github.com/owner/repo):
? Please enter the namespace where the pipeline should run (default: repo-pipelines):
! Namespace repo-pipelines is not found
? Would you like me to create the namespace repo-pipelines? Yes
✓ Repository owner-repo has been created in repo-pipelines namespace
✓ Setting up GitHub Webhook for Repository https://github.com/owner/repo
👀 I have detected a controller url: https://pipelines-as-code-controller-openshift-pipelines.apps.example.com
? Do you want me to use it? Yes
? Please enter the secret to configure the webhook for payload validation (default: sJNwdmTifHTs): sJNwdmTifHTs
ℹ ️You now need to create a GitHub personal access token, ...
? Please enter the GitHub access token: ****************************************
✓ Webhook has been created on repository owner/repo
🔑 Webhook Secret owner-repo has been created in the repo-pipelines namespace.
🔑 Repository CR owner-repo has been updated with webhook secret in the repo-pipelines namespace
ℹ Directory .tekton has been created.
✓ We have detected your repository using the programming language Go.
✓ A basic template has been created in /home/Go/src/github.com/owner/repo/.tekton/pipelinerun.yaml, ...
```

## 手动配置

1. 获取控制器公共 URL：

```bash
echo https://$(kubectl get ingresss -n pipelines-as-code pipelines-as-code-controller -o jsonpath='{.spec.host}')
```

2. 在 GitHub 仓库中配置 Webhook（**Settings → Webhooks → Add webhook**）：

   - **Payload URL**：Pipelines as Code 控制器公共 URL
   - **Content type**：`application/json`
   - **Secret**：运行 `openssl rand -hex 20` 生成
   - **事件**：选择 "Let me select individual events"，勾选：
     - Commit comments
     - Issue comments
     - Pull requests
     - Pushes

3. 创建 KDO Secret：

```bash
kubectl -n target-namespace create secret generic github-webhook-config \
  --from-literal provider.token="<GITHUB_PERSONAL_ACCESS_TOKEN>" \
  --from-literal webhook.secret="<WEBHOOK_SECRET>"
```

4. 创建 Repository CR：

```yaml
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: my-repo
  namespace: target-namespace
spec:
  url: "https://github.com/owner/repo"
  git_provider:
    secret:
      name: "github-webhook-config"
      key: "provider.token"
    webhook_secret:
      name: "github-webhook-config"
      key: "webhook.secret"
```

**验证**：
- 在 GitHub 仓库 **Settings → Webhooks** 中确认 webhook 显示在列表中
- 检查最近投递记录是否有成功的勾选标记
