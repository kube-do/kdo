---
title: "GitLab 集成"
description: "为 Pipelines as Code 配置 GitLab Webhook 与访问令牌。"
sidebar_position: 23
doc_type: how-to
audience: [admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

**先决条件**：
- 集群上已安装 Pipelines as Code
- 已生成 GitLab Personal Access Token（项目或组织管理员权限）
- 如需使用 `tkn pac` CLI 配置 webhook，token 需有 `admin:repo_hook` 权限

> 如果使用仅限特定项目的 token，无法通过 API 访问从 fork 仓库发送的合并请求（MR），Pipelines as Code 会将流水线结果以评论形式显示在 MR 上。

## 自动配置（使用 CLI）

```bash
tkn pac create repo
```

**交互式输出示例**：

```
? Enter the Git repository url (default: https://gitlab.com/owner/repo):
? Please enter the namespace where the pipeline should run (default: repo-pipelines):
! Namespace repo-pipelines is not found
? Would you like me to create the namespace repo-pipelines? Yes
✓ Repository repositories-project has been created in repo-pipelines namespace
✓ Setting up GitLab Webhook for Repository https://gitlab.com/owner/repo
? Please enter the project ID for the repository you want to be configured,
  project ID refers to a unique ID (e.g. 34405323) shown at the top of your GitLab project: 17103
👀 I have detected a controller url: https://pipelines-as-code-controller-openshift-pipelines.apps.example.com
? Do you want me to use it? Yes
? Please enter the secret to configure the webhook for payload validation (default: lFjHIEcaGFlF): lFjHIEcaGFlF
ℹ ️You now need to create a GitLab personal access token with `api` scope
ℹ ️Go to this URL to generate one https://gitlab.com/-/profile/personal_access_tokens
? Please enter the GitLab access token: **************************
? Please enter your GitLab API URL: https://gitlab.com
✓ Webhook has been created on your repository
🔑 Webhook Secret repositories-project has been created in the repo-pipelines namespace.
🔑 Repository CR repositories-project has been updated with webhook secret in the repo-pipelines namespace
ℹ Directory .tekton has been created.
✓ A basic template has been created in /home/Go/src/gitlab.com/repositories/project/.tekton/pipelinerun.yaml
```

## 手动配置

1. 获取控制器 URL：

```bash
echo https://$(kubectl get ingress -n pipelines-as-code pipelines-as-code-controller -o jsonpath='{.spec.host}')
```

2. 在 GitLab 项目中配置 Webhook（**Settings → Webhooks**）：

   - **URL**：Pipelines as Code 控制器公共 URL
   - **Secret**：运行 `openssl rand -hex 20` 生成
   - **触发事件**：选择 "Let me select individual events"：
     - Commit comments
     - Issue comments
     - Pull requests
     - Pushes

3. 创建 k8s Secret：

```bash
kubectl -n target-namespace create secret generic gitlab-webhook-config \
  --from-literal provider.token="<GITLAB_PERSONAL_ACCESS_TOKEN>" \
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
  url: "https://gitlab.com/owner/repo"
  git_provider:
    # 私有 GitLab 实例：取消注释并设置 API URL
    # url: "https://gitlab.example.com/"
    secret:
      name: "gitlab-webhook-config"
      key: "provider.token"
    webhook_secret:
      name: "gitlab-webhook-config"
      key: "webhook.secret"
```

> `git_provider.url`：如果使用私有 GitLab 实例，设置此字段为 GitLab API 的 URL。例如仓库 URL 为 `https://gitlab.example.com/owner/repo`，API URL 为 `https://gitlab.example.com/`。

**验证**：
- 在 GitLab 项目 **Settings → Webhooks** 确认 webhook URL 指向 Pipelines as Code 控制器
- 点击 **Test → Push events** 测试连接
- 推送提交或创建 MR 触发 PipelineRun
- 检查 PipelineRun 状态是否报告回 GitLab
