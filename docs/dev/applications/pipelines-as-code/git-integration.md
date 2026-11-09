---
title: Git 仓库托管服务集成
parent: Pipelines as Code
nav_order: 2
---

1. TOC
{:toc}

安装 Pipelines as Code 后，集群管理员需要配置一个 Git 仓库托管服务提供商。

**支持的平台**：

| 平台 | 推荐度 | 说明 |
|---|---|---|
| GitHub App | ⭐ 推荐 | 功能最完整，支持 Checks API、GitOps 评论、自动配置等 |
| GitHub Webhook | 备选 | 可在无法创建 GitHub App 时使用，功能有限 |
| GitLab | 可选 | 通过 Webhook 集成 |
| Bitbucket Cloud | 可选 | 通过 Webhook 集成 |
| Bitbucket Data Center | 可选 | 通过 Webhook 集成 |

## 3.1 GitHub App 集成

GitHub App 是推荐的集成方式，它将 Tekton Pipelines 与基于 Git 的工作流整合。集群管理员为所有用户配置一个 GitHub App，Webhook 指向 Pipelines as Code 控制器端点以触发 PipelineRun。

**三种设置方式**：

1. 使用 `tkn` 命令行工具
2. 使用 Web 控制台的管理员视角（Administrator perspective）
3. 在 GitHub 中手动创建 App，然后为 Pipelines as Code 创建 Secret

### 3.1.1 使用命令行界面配置

**先决条件**：
- 以集群管理员身份登录 KDO 平台集群
- 已安装带 `tkn pac` 插件的 `tkn` CLI

**步骤**：

```bash
tkn pac bootstrap github-app
```

**对于 GitHub Enterprise**，使用 `--github-api-url` 指定端点：

```bash
tkn pac bootstrap github-app --github-api-url https://github.com/enterprises/example-enterprise
```

**验证**：导航到 GitHub 账号或组织设置，确认新 GitHub App 显示在 GitHub Apps 部分。

### 3.1.2 在管理员视角中创建

**先决条件**：已从 OperatorHub 安装 `pipelines-1.22` Operator。

**步骤**：

1. 在管理员视角中，使用导航面板进入 **Pipelines**
2. 在 **Pipelines** 页面点击 **Setup GitHub App**
3. 输入 GitHub App 名称，例如 `pipelines-ci-clustername-testui`
4. 点击 **Setup**
5. 在浏览器中提示时输入 Git 密码
6. 点击 **Create GitHub App for \<username\>**

**验证**：创建成功后,KDO Web 控制台会打开并显示应用的详细信息。Pipelines as Code 将 GitHub App 的详细信息保存为 `pipelines-as-code` 命名空间中的 Secret。

查看已创建的 GitHub App 详情：进入 **Pipelines** → **View GitHub App**。

### 3.1.3 手动配置 GitHub App 并创建 Secret

此方法也用于为额外控制器创建 GitHub App。

**先决条件**：
- 已从 OperatorHub 安装 `pipelines-1.22` Operator
- 拥有可以创建 GitHub App 的 GitHub 账号（个人账号或组织）
- 以集群管理员身份登录 OpenShift

**步骤**：

**第一步：在 GitHub 上创建 App**

1. 登录 GitHub 账号
2. 进入 **Settings → Developer settings → GitHub Apps**，点击 **New GitHub App**
3. 填写以下信息：

   | 字段 | 值 |
   |---|---|
   | GitHub Application Name | `Tekton Pipelines` |
   | Homepage URL | KDO Console URL |
   | Webhook URL | Pipelines as Code 路由或 Ingress URL |

   获取路由 URL：

   ```bash
   echo https://$(kubectl get route -n pipelines-as-code pipelines-as-code-controller -o jsonpath='{.spec.host}')
   ```

   对于额外控制器：

   ```bash
   echo https://$(kubectl get route -n pipelines-as-code pac_controller_2 -o jsonpath='{.spec.host}')
   ```

   | Webhook secret | 运行 `openssl rand -hex 20` 生成 |

4. **Repository 权限**（选择以下项）：

   | 权限 | 级别 |
   |---|---|
   | Checks | Read & Write |
   | Contents | Read & Write |
   | Issues | Read & Write |
   | Metadata | Read-only |
   | Pull requests | Read & Write |

5. **Organization 权限**：

   | 权限 | 级别 |
   |---|---|
   | Members | Read-only |

6. **订阅事件**：勾选以下事件：
   - Check run
   - Check suite
   - Commit comment
   - Issue comment
   - Pull request
   - Push

7. 点击 **Create GitHub App**

**第二步：记录 App 信息**

- 在新建 GitHub App 的 **Details** 页面顶部记下 **App ID**
- 在 **Private keys** 部分，点击 **Generate Private key** 生成并下载私钥，安全保存

**第三步：安装 App 到仓库**

- 将要使用 Pipelines as Code 的仓库安装该 App

**第四步：在 KDO 中创建 Secret**

```bash
kubectl -n pipelines-as-code create secret generic pipelines-as-code-secret \
  --from-literal github-private-key="$(cat <PATH_PRIVATE_KEY>)" \
  --from-literal github-application-id="<APP_ID>" \
  --from-literal webhook.secret="<WEBHOOK_SECRET>"
```

- `<PATH_PRIVATE_KEY>`：下载的私钥路径
- `<APP_ID>`：GitHub App 的 App ID
- `<WEBHOOK_SECRET>`：创建 App 时提供的 Webhook secret

> 如果为额外控制器配置，将 `pipelines-as-code-secret` 替换为该控制器的 `secretName` 参数值。

**验证**：在 GitHub 账号或组织设置中确认 App 已安装并显示在 **Installed GitHub Apps** 部分。

### 3.1.4 扩展 GitHub Token 到额外仓库

Pipelines as Code 使用 GitHub App 生成访问 token，默认仅限定到包含流水线定义的仓库。有时需要 token 访问额外仓库，例如 `.tekton/pr.yaml` 位于 CI 仓库，但构建过程从另一个私有 CD 仓库获取任务。

**两种扩展方式**：

| 方式 | 权限要求 | 说明 |
|---|---|---|
| 全局配置 | 需要管理员权限 | 将 token 扩展到不同命名空间的仓库列表 |
| 仓库级别配置 | 不需要管理员权限 | 将 token 扩展到与原始仓库同一命名空间的仓库列表 |

**先决条件**：
- 对 KDO 集群有管理员访问权限（或对仓库级别配置有仓库管理员权限）
- 已为集群配置 Pipelines as Code GitHub App
- 知道要扩展的额外仓库名称
- 额外仓库必须在 GitHub 组织或账号中已存在

**步骤**：

1. 在 `TektonConfig` CR 中将 `secret-github-app-token-scoped` 设为 `false`：

```yaml
apiVersion: operator.tekton.dev/v1alpha1
kind: TektonConfig
metadata:
  name: config
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        enable: true
        settings:
          secret-github-app-token-scoped: false
          secret-github-app-scope-extra-repos: "owner2/project2, owner3/project3"
```

2. 仓库级别配置，在 `Repository` CR 中设置：

```yaml
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: test
  namespace: test-repo
spec:
  url: "https://github.com/linda/project"
  settings:
    github_app_token_scope_repos:
      - "owner/project"
      - "owner1/project1"
```

> 额外仓库可以是公开或私有的，但必须与 Repository CR 所在的命名空间相同。

**验证**：生成的 GitHub token 应能访问所有配置的额外仓库。

## 3.2 GitHub Webhook 集成

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

### 自动配置（使用 CLI）

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

### 手动配置

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

## 3.3 GitLab 集成

**先决条件**：
- 集群上已安装 Pipelines as Code
- 已生成 GitLab Personal Access Token（项目或组织管理员权限）
- 如需使用 `tkn pac` CLI 配置 webhook，token 需有 `admin:repo_hook` 权限

> 如果使用仅限特定项目的 token，无法通过 API 访问从 fork 仓库发送的合并请求（MR），Pipelines as Code 会将流水线结果以评论形式显示在 MR 上。

### 自动配置（使用 CLI）

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

### 手动配置

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

## 3.4 Bitbucket Cloud 集成

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
  url: "https://bitbucket.com/workspace/repo"
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

## 3.5 Bitbucket Data Center 集成

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
  url: "https://bitbucket.com/workspace/repo"
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
my-repo  https://bitbucket.com/workspace/repo           target-namespace   True        Succeeded
```

## 3.6 配置自定义证书

如需配置 Pipelines as Code 使用私有签名或自定义证书的 Git 仓库：

- 如果使用 Tekton Pipelines Operator 安装，可以通过 `Proxy` 对象将自定义证书添加到集群
- Operator 会自动将证书暴露给所有 Tekton Pipelines 组件和工作负载，包括 Pipelines as Code

## 3.7 私有仓库支持

Pipelines as Code 通过在目标命名空间中创建或更新 Secret 来支持私有仓库。`git-clone` 任务使用此 token 克隆私有仓库。

**自动创建的 Secret 格式**：`pac-gitauth-<REPOSITORY_OWNER>-<REPOSITORY_NAME>-<RANDOM_STRING>`

**在 PipelineRun 中引用 Secret**：

```yaml
spec:
  pipelineSpec:
    workspaces:
      - name: basic-auth
        secret:
          secretName: "{{ git_auth_secret }}"
    tasks:
      - name: git-clone-from-catalog
        taskRef:
          name: git-clone
        params:
          - name: url
            value: $(params.repo_url)
          - name: revision
            value: $(params.revision)
        workspaces:
          - name: output
            workspace: shared-workspace
```

**在 Pipeline 中引用 `basic-auth` workspace**：

```yaml
spec:
  workspaces:
    - name: basic-auth
  tasks:
    - name: git-clone-from-catalog
      workspaces:
        - name: basic-auth
          workspace: basic-auth
```

**控制自动 Secret 创建**：通过 `secret-auto-create` 参数控制（在 `TektonConfig` CR 的 `pipelinesAsCode.settings` 中）。
