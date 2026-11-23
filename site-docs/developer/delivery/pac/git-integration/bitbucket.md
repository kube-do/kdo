---
title: "Bitbucket 集成"
description: "为 Pipelines as Code 配置 Bitbucket Cloud 或 Bitbucket Data Center。"
sidebar_position: 24
doc_type: how-to
audience: [admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

**先决条件**：
- 集群上已安装 Pipelines as Code
- 已创建 Bitbucket Cloud App Password，权限如下：

  | 类别 | 权限 |
  |---|---|
  | Account | Email, Read |
  | Workspace membership | Read, Write |
  | Projects | Read, Write |
  | Issues | Read, Write |
  | Pull requests | Read, Write |
  | Webhooks（如需 CLI 配置） | Read, Write |

## Bitbucket Cloud

### 自动配置（使用 CLI）

```bash
tkn pac create repo
```

**交互式输出示例**：

```
? Enter the Git repository url (default: https://bitbucket.org/workspace/repo):
? Please enter the namespace where the pipeline should run (default: repo-pipelines):
! Namespace repo-pipelines is not found
? Would you like me to create the namespace repo-pipelines? Yes
✓ Repository workspace-repo has been created in repo-pipelines namespace
✓ Setting up Bitbucket Webhook for Repository https://bitbucket.org/workspace/repo
? Please enter your bitbucket cloud username: <username>
ℹ ️You now need to create a Bitbucket Cloud app password, ...
? Please enter the Bitbucket Cloud app password: ************************************
👀 I have detected a controller url: https://pipelines-as-code-controller-openshift-pipelines.apps.example.com
? Do you want me to use it? Yes
✓ Webhook has been created on repository workspace/repo
🔑 Webhook Secret workspace-repo has been created in the repo-pipelines namespace.
🔑 Repository CR workspace-repo has been updated with webhook secret in the repo-pipelines namespace
ℹ Directory .tekton has been created.
✓ A basic template has been created in /home/Go/src/bitbucket/repo/.tekton/pipelinerun.yaml
```

### 手动配置

1. 获取控制器 URL
2. 在 Bitbucket Cloud 仓库中配置 Webhook（**Repository settings → Webhooks → Add webhook**）：
   - **Title**：例如 "Pipelines as Code"
   - **URL**：Pipelines as Code 控制器 URL
   - **事件**：勾选 `Repository: Push`、`Pull Request: Created`、`Pull Request: Updated`、`Pull Request: Comment created`
3. 创建 KDO Secret：

```bash
kubectl -n target-namespace create secret generic bitbucket-cloud-token \
  --from-literal provider.token="<BITBUCKET_APP_PASSWORD>"
```

4. 创建 Repository CR：

```yaml
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: my-repo
  namespace: target-namespace
spec:
  url: "https://bitbucket.org/workspace/repo"
  branch: "main"
  git_provider:
    user: "<BITBUCKET_USERNAME>"
    secret:
      name: "bitbucket-cloud-token"
      key: "provider.token"
```

> `git_provider.user`：只能通过 `ACCOUNT_ID` 在 owner 文件中引用用户。

### 安全说明

Bitbucket Cloud **不支持** webhook secret。为防止 CI 被劫持，Pipelines as Code 默认会获取 Bitbucket Cloud IP 地址列表，确保 webhook 接收仅来自这些 IP 地址。

如需禁用此行为，在 `TektonConfig` 中设置：

```yaml
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        settings:
          bitbucket-cloud-check-source-ip: "false"
```

如需添加额外安全 IP 地址或网络：

```yaml
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        settings:
          bitbucket-cloud-additional-source-ip: "192.168.1.0/24,10.0.0.0/16"
```

**验证**：
```bash
kubectl get repository -n <namespace>
```

输出示例：
```
NAME            URL                                              NAMESPACE    SUCCEEDED   REASON
workspace-repo  https://bitbucket.org/workspace/repo              repo-pipelines True        Succeeded
```


## Bitbucket Data Center

**先决条件**：
- 集群上已安装 Pipelines as Code
- 已生成 Bitbucket Data Center Personal Access Token（项目管理员权限）
- Token 必须具有 `PROJECT_ADMIN` 和 `REPOSITORY_ADMIN` 权限
- Token 必须能访问 fork 仓库中的 pull request

**步骤**：

1. 获取控制器 URL：

```bash
echo https://$(kubectl get ingress -n pipelines-as-code pipelines-as-code-controller -o jsonpath='{.spec.host}')
```

2. 在 Bitbucket Data Center 仓库中配置 Webhook（**Repository settings → Webhooks → Add webhook**）：
   - **Title**：例如 "Pipelines as Code"
   - **URL**：Pipelines as Code 控制器 URL
   - **Secret**：`openssl rand -hex 20` 生成
   - **事件**：勾选 `Repository: Push`、`Repository: Modified`、`Pull Request: Opened`、`Pull Request: Source branch updated`、`Pull Request: Comment added`

3. 创建 KDO Secret：

```bash
kubectl -n target-namespace create secret generic bitbucket-datacenter-webhook-config \
  --from-literal provider.token="<PERSONAL_TOKEN>" \
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
  url: "https://bitbucket.org/workspace/repo"
  git_provider:
    url: "https://bitbucket.datacenter.api.url/rest"
    user: "<BITBUCKET_USERNAME>"
    secret:
      name: "bitbucket-datacenter-webhook-config"
      key: "provider.token"
    webhook_secret:
      name: "bitbucket-datacenter-webhook-config"
      key: "webhook.secret"
```

> `git_provider.url`：确保使用正确的 Bitbucket Data Center API URL，不带 `/api/v1.0` 后缀。通常默认安装使用 `/rest` 后缀。

**验证**：
```bash
kubectl get repository -n <namespace>
```

输出示例：
```
NAME     URL                                            NAMESPACE          SUCCEEDED   REASON
my-repo  https://bitbucket.org/workspace/repo           target-namespace   True        Succeeded
```
