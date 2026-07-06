---
title: Pipelines as Code 配置与使用指南
parent: 应用管理
nav_order: 4
---

## 目录

- [第一章 关于 Pipelines as Code](#第一章-关于-pipelines-as-code)
- [第二章 安装与配置](#第二章-安装与配置)
- [第三章 与 Git 仓库托管服务提供商集成](#第三章-与-git-仓库托管服务提供商集成)
- [第四章 使用 Repository 自定义资源](#第四章-使用-repository-自定义资源)
- [第五章 创建 PipelineRun](#第五章-创建-pipelinerun)
- [第六章 管理 PipelineRun](#第六章-管理-pipelinerun)
- [第七章 命令参考](#第七章-命令参考)

---

## 第一章 关于 Pipelines as Code

### 1.1 概述

Pipelines as Code 是 Tekton Pipelines 的一个子系统，允许集群管理员和具有相应权限的用户将流水线模板定义为源代码 Git 仓库的一部分。当配置的 Git 仓库发生源代码推送（push）或拉取请求（pull request / merge request）时，Pipelines as Code 会自动运行流水线并将执行状态报告回 Git 提供商平台。

### 1.2 主要特性

Pipelines as Code 支持以下功能：

- **拉取请求状态与控制**：在托管 Git 仓库的平台上直接显示流水线运行状态。
- **GitHub Checks API**：使用 GitHub Checks API 设置 PipelineRun 状态，包括重新检查（rechecks）功能。
- **事件驱动**：支持 GitHub pull request 和 commit 事件触发。
- **评论操作**：支持通过 PR/MR 评论中的命令操作流水线，例如 `/retest`。
- **事件过滤**：支持 Git 事件过滤，可为不同事件定义不同的流水线。
- **自动任务解析**：自动解析 Tekton Pipelines 中的任务，支持本地任务、Tekton Hub 和远程 URL。
- **GitHub Blob/Objects API**：通过 GitHub Blob 和 Objects API 检索配置。
- **访问控制**：支持基于 GitHub 组织的 ACL（访问控制列表），或使用 Prow 风格的 `OWNERS` 文件进行权限控制。
- **CLI 工具**：`tkn pac` CLI 插件，用于管理引导和 Pipelines as Code 仓库。
- **多提供商支持**：支持 GitHub App、GitHub Webhook、GitLab、Bitbucket Data Center 和 Bitbucket Cloud。
- **自动 Secret 创建**：对私有仓库自动创建认证 Secret。
- **远程任务和流水线**：支持从远程 URL 引用任务和流水线定义。
- **动态变量**：运行时替换仓库 URL、分支名、提交 SHA 等动态变量。
- **CEL 表达式**：支持 Common Expression Language（CEL）进行高级事件匹配与过滤。
- **并发控制**：支持设置并发限制和自动取消进行中的流水线。
- **自定义参数扩展**：支持在 Repository CR 中定义自定义参数并注入 PipelineRun。
- **Git 标签触发**：支持基于 Git 标签触发 PipelineRun。
- **传入 Webhook**：支持通过传入 Webhook URL 和共享密钥触发流水线。

### 1.3 核心概念与工作流程

Pipelines as Code 的完整工作流程如下：

```
开发者推送代码/创建 PR
       ↓
Git 提供商触发 Webhook
       ↓
Pipelines as Code webhook 端点接收事件
       ↓
匹配 Repository CR（通过 URL、分支等规则）
       ↓
控制器在 Repository CR 所在命名空间创建 PipelineRun CR
       ↓
Tekton Pipelines 执行流水线
       ↓
状态报告回 Git 提供商（Checks Tab / PR 评论）
```

**详细步骤说明**：

1. **配置集成**：集群管理员首先将 Pipelines as Code 与 Git 仓库提供商（如 GitHub、GitLab）集成，配置 Webhook 或 GitHub App。

2. **创建 Repository CR**：在 Kubedo 命名空间中创建 `Repository` 自定义资源（CR），其中包含：
   - 要监听的 Git 仓库 URL
   - Git 提供商的认证信息（Secret 引用）
   - Webhook Secret 引用
   - 分支映射和目标命名空间

3. **定义流水线模板**：在被监听 Git 仓库的根目录下创建 `.tekton` 目录，将 PipelineRun 定义以 `.yaml` 或 `.yml` 文件形式存放在此目录中。

4. **添加事件匹配注解**：在 PipelineRun 定义中添加注解，指定触发该流水线的 Git 事件类型和目标分支。

5. **触发执行**：当匹配的事件发生时，Pipelines as Code 控制器根据定义创建 `PipelineRun` CR，Tekton Pipelines 开始执行流水线。

6. **状态报告**：流水线执行完成后，状态通过 Checks API（GitHub App）或 PR 评论（Webhook）报告回 Git 提供商。

#### 重要安全说明

默认情况下，为 pull request 或 push 事件创建 `PipelineRun` CR 时，Pipelines as Code 使用**事件源分支**（source branch）的 `.tekton` 目录中的定义。这意味着如果 PR 修改了 `.tekton` 目录，Pipelines as Code 将使用修改后的版本。

如果希望提高安全性，可以在 `Repository` CR 中设置：

```yaml
spec:
  settings:
    pipelinerun_provenance: "default_branch"
```

启用此设置后，Pipelines as Code 始终使用 Git 仓库提供商上配置的默认分支（如 `main`、`master` 或 `trunk`）中的 `.tekton` 定义。这确保了流水线定义在被合并到默认分支之前不会被执行，从而要求所有变更都经过合并审查。

---

## 第二章 安装与配置

### 2.1 在 Kdo 上安装 Pipelines as Code

Pipelines as Code 随 Tekton Pipelines Operator 一同安装，默认安装在 `pipelines-as-code` 命名空间中。

### 2.2 安装 CLI（tkn pac / opc）

集群管理员可以在本地机器上将 `tkn pac` 和 `opc` CLI 工具作为容器使用，或直接安装二进制文件。

安装 `tkn` CLI（Tekton Pipelines 的一部分）时会自动安装 `tkn pac` 和 `opc` CLI 工具。

**支持的平台**（v1.22.0）：

| 平台 | 架构 |
|---|---|
| Linux | x86_64, amd64 |
| Linux on IBM zSystems / IBM LinuxONE | s390x |
| Linux on IBM Power | ppc64le |
| Linux on ARM | aarch64, arm64 |
| macOS | |
| Windows | |

### 2.3 自定义 Pipelines as Code 配置

集群管理员可以在 `TektonConfig` CR 的 `platforms.openshift.pipelinesAsCode.settings` spec 中配置以下参数：

| 参数 | 描述 | 默认值 |
|---|---|---|
| `application-name` | 应用名称。例如在 GitHub Checks 标签中显示的名称。 | `"Pipelines as Code CI"` |
| `secret-auto-create` | 启用后，Pipelines as Code 自动使用 GitHub App 的 token 创建 Secret，可用于私有仓库。 | `enabled` |
| `remote-tasks` | 启用后，允许从 PipelineRun 注解引用远程任务。 | `enabled` |
| `hub-url` | [Artifact Hub](https://artifacthub.io) 的基础 URL。 | `https://artifacthub.io` |
| `hub-catalog-name` | Tekton Hub 目录名称。 | `tekton` |
| `tekton-dashboard-url` | Tekton Dashboard 的 URL，用于生成 PipelineRun 链接。 | NA |
| `bitbucket-cloud-check-source-ip` | 启用后，通过查询公共 Bitbucket 的 IP 范围来保护服务请求。修改可能有安全风险。 | `enabled` |
| `bitbucket-cloud-additional-source-ip` | 额外的 IP 范围或网络，逗号分隔。 | NA |
| `max-keep-run-upper-limit` | PipelineRun 的 `max-keep-run` 值上限。 | NA |
| `default-max-keep-runs` | `max-keep-run` 的默认值。如果设置，将应用于所有未设置 `max-keep-run` 注解的 PipelineRun。 | NA |
| `auto-configure-new-github-repo` | 自动配置新的 GitHub 仓库。Pipelines as Code 会设置命名空间并为仓库创建 CR。仅 GitHub App 支持。 | `disabled` |
| `auto-configure-repo-namespace-template` | 用于自动生成命名空间的模板（启用 `auto-configure-new-github-repo` 时）。 | `{repo_name}-pipelines` |
| `auto-configure-repo-repository-template` | 用于自动生成 Repository CR 名称的模板（启用 `auto-configure-new-github-repo` 时）。 | `{{repo_name}}-repo-cr` |
| `error-log-snippet` | 启用/禁用流水线失败任务的日志片段。禁用可防止数据泄露。Tekton Pipelines 将片段截断为 65,000 字符。 | `true` |
| `error-log-snippet-number-of-lines` | 错误日志片段显示的行数。 | `3` |
| `error-detection-from-container-logs` | 启用/禁用检查容器日志中的错误消息并将其作为 PR 注解暴露。仅适用于 GitHub App。 | `true` |
| `error-detection-max-number-of-lines` | 检查容器日志以搜索错误消息的最大行数。设为 `-1` 可检查不限行数。 | `50` |
| `secret-github-app-token-scoped` | 为 `true` 时，GitHub token 仅限定到包含流水线定义的仓库。为 `false` 时，可通过 TektonConfig 和 Repository CR 扩展 token 范围到额外仓库。 | `true` |
| `secret-github-app-scope-extra-repos` | 扩展生成的 GitHub token 访问范围的额外仓库列表。 | NA |
| `enable-cancel-in-progress-on-pull-requests` | 用户在 PR 上推送新提交时取消进行中的 PipelineRun。Pipelines as Code 在新运行启动后才取消旧运行。单个运行上的 `cancel-in-progress` 注解覆盖此设置。 | `false` |
| `enable-cancel-in-progress-on-push` | 用户推送新提交时取消进行中的 PipelineRun。 | `false` |

#### 完整配置示例

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
          application-name: "My CI System"
          secret-auto-create: "true"
          remote-tasks: "true"
          hub-url: "https://artifacthub.io"
          hub-catalog-name: tekton
          tekton-dashboard-url: "https://tekton-dashboard.example.com"
          bitbucket-cloud-check-source-ip: "true"
          max-keep-run-upper-limit: "50"
          default-max-keep-runs: "10"
          auto-configure-new-github-repo: "false"
          error-log-snippet: "true"
          error-log-snippet-number-of-lines: "5"
          error-detection-from-container-logs: "true"
          error-detection-max-number-of-lines: "100"
          secret-github-app-token-scoped: "true"
          enable-cancel-in-progress-on-pull-requests: "true"
          enable-cancel-in-progress-on-push: "false"
```

### 2.4 配置额外的 Pipelines as Code 控制器以支持多个 GitHub App

默认情况下，Pipelines as Code 只能与一个 GitHub App 交互。如果需要使用多个 GitHub App（例如不同的 GitHub 账号，或 GitHub Enterprise + GitHub SaaS），必须为每个额外的 GitHub App 配置额外的 Pipelines as Code 控制器。

#### 配置方式

在 `TektonConfig` CR 的 `platforms.openshift.pipelinesAsCode` spec 中添加 `additionalPACControllers` 部分：

```yaml
apiVersion: operator.tekton.dev/v1
kind: TektonConfig
metadata:
  name: config
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        additionalPACControllers:
          pac_controller_2:
            enable: true
            secretName: pac_secret_2
            settings:
              application-name: "Pipelines as Code CI - Enterprise"
              # 可以为主控制器和额外控制器设置不同的配置
```

**参数说明**：

| 参数 | 描述 |
|---|---|
| `pac_controller_2` | 控制器名称。必须唯一且不超过 25 个字符。 |
| `enable` | 可选参数，设为 `true` 启用，`false` 禁用，默认 `true`。 |
| `secretName` | 必须为此 GitHub App 创建的 Secret 名称。 |
| `settings` | 可选，当设置与主控制器不同时在此配置。 |

**注意**：
- `tkn pac bootstrap github-app` 命令仅适用于主控制器。额外控制器的 GitHub App 必须使用手动方式创建。
- 要为额外控制器配置 GitHub App，在 GitHub 中创建 App 时，使用对应的控制器路由 URL（替换 `pipelines-as-code-controller` 为控制器名称）。

### 2.5 其他资源

- [安装 Tekton Pipelines](https://docs.redhat.com/en/documentation/red_hat_openshift_pipelines/1.22/html/installing_openshift_pipelines/index)
- [安装 tkn CLI](https://docs.redhat.com/en/documentation/red_hat_openshift_pipelines/1.22/html/installing_openshift_pipelines/installing-tkn)
- [Tekton Pipelines 发布说明](https://docs.redhat.com/en/documentation/red_hat_openshift_pipelines/1.22/html/release_notes/index)

---

## 第三章 与 Git 仓库托管服务提供商集成

安装 Pipelines as Code 后，集群管理员需要配置一个 Git 仓库托管服务提供商。

**支持的平台**：

| 平台 | 推荐度 | 说明 |
|---|---|---|
| GitHub App | ⭐ 推荐 | 功能最完整，支持 Checks API、GitOps 评论、自动配置等 |
| GitHub Webhook | 备选 | 可在无法创建 GitHub App 时使用，功能有限 |
| GitLab | 可选 | 通过 Webhook 集成 |
| Bitbucket Cloud | 可选 | 通过 Webhook 集成 |
| Bitbucket Data Center | 可选 | 通过 Webhook 集成 |

### 3.1 GitHub App 集成

GitHub App 是推荐的集成方式，它将 Tekton Pipelines 与基于 Git 的工作流整合。集群管理员为所有用户配置一个 GitHub App，Webhook 指向 Pipelines as Code 控制器端点以触发 PipelineRun。

**三种设置方式**：

1. 使用 `tkn` 命令行工具
2. 使用 Web 控制台的管理员视角（Administrator perspective）
3. 在 GitHub 中手动创建 App，然后为 Pipelines as Code 创建 Secret

#### 3.1.1 使用命令行界面配置

**先决条件**：
- 以集群管理员身份登录 Kdo Platform 集群
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

#### 3.1.2 在管理员视角中创建

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

#### 3.1.3 手动配置 GitHub App 并创建 Secret

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
   | Homepage URL | KdoConsole URL |
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

**第四步：在 Kdo中创建 Secret**

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

#### 3.1.4 扩展 GitHub Token 到额外仓库

Pipelines as Code 使用 GitHub App 生成访问 token，默认仅限定到包含流水线定义的仓库。有时需要 token 访问额外仓库，例如 `.tekton/pr.yaml` 位于 CI 仓库，但构建过程从另一个私有 CD 仓库获取任务。

**两种扩展方式**：

| 方式 | 权限要求 | 说明 |
|---|---|---|
| 全局配置 | 需要管理员权限 | 将 token 扩展到不同命名空间的仓库列表 |
| 仓库级别配置 | 不需要管理员权限 | 将 token 扩展到与原始仓库同一命名空间的仓库列表 |

**先决条件**：
- 对 Kdo集群有管理员访问权限（或对仓库级别配置有仓库管理员权限）
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

### 3.2 GitHub Webhook 集成

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

#### 自动配置（使用 CLI）

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

#### 手动配置

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

3. 创建 KdoSecret：

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

### 3.3 GitLab 集成

**先决条件**：
- 集群上已安装 Pipelines as Code
- 已生成 GitLab Personal Access Token（项目或组织管理员权限）
- 如需使用 `tkn pac` CLI 配置 webhook，token 需有 `admin:repo_hook` 权限

> 如果使用仅限特定项目的 token，无法通过 API 访问从 fork 仓库发送的合并请求（MR），Pipelines as Code 会将流水线结果以评论形式显示在 MR 上。

#### 自动配置（使用 CLI）

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

#### 手动配置

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

### 3.4 Bitbucket Cloud 集成

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

#### 自动配置（使用 CLI）

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

#### 手动配置

1. 获取控制器 URL
2. 在 Bitbucket Cloud 仓库中配置 Webhook（**Repository settings → Webhooks → Add webhook**）：
   - **Title**：例如 "Pipelines as Code"
   - **URL**：Pipelines as Code 控制器 URL
   - **事件**：勾选 `Repository: Push`、`Pull Request: Created`、`Pull Request: Updated`、`Pull Request: Comment created`
3. 创建 KdoSecret：

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

#### 安全说明

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

### 3.5 Bitbucket Data Center 集成

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

3. 创建 KdoSecret：

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

### 3.6 配置自定义证书

如需配置 Pipelines as Code 使用私有签名或自定义证书的 Git 仓库：

- 如果使用 Tekton Pipelines Operator 安装，可以通过 `Proxy` 对象将自定义证书添加到集群
- Operator 会自动将证书暴露给所有 Tekton Pipelines 组件和工作负载，包括 Pipelines as Code

### 3.7 私有仓库支持

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

---

## 第四章 使用 Repository 自定义资源

### 4.1 Repository CR 的主要功能

`Repository` 自定义资源（CR）有以下主要功能：

1. **事件匹配**：告知 Pipelines as Code 处理来自特定 URL 的事件
2. **命名空间绑定**：告知 PipelineRun 运行所在的命名空间
3. **认证配置**：引用 API Secret、用户名或 Git 提供商所需的 API URL（使用 Webhook 时）
4. **状态显示**：显示仓库的最后一次 PipelineRun 状态

### 4.2 创建 Repository CR

**使用 tkn pac CLI**：

```bash
tkn pac create repo
```

**使用 kubectl/oc 直接创建**：

```bash
cat <<EOF | kubectl create -n my-pipeline-ci -f -
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: project-repository
spec:
  url: "https://github.com/<repository>/<project>"
EOF
```

- `my-pipeline-ci` 是目标命名空间
- 每当来自 URL `https://github.com/<repository>/<project>` 的事件到达时，Pipelines as Code 会匹配它，检出仓库内容，然后与 `.tekton/` 目录中的 PipelineRun 定义进行匹配

**重要约束**：
- Repository CR 必须创建在与流水线运行相同的命名空间中，不能跨命名空间
- 如果多个 Repository CR 匹配同一事件，Pipelines as Code 只处理最早的那个
- 如果需要匹配特定命名空间，添加注解：`pipelinesascode.tekton.dev/target-namespace: "<mynamespace>"`

### 4.3 创建全局 Repository CR

可选地，可以在 `pipelines-as-code` 命名空间中创建一个全局 Repository CR（命名为 `pipelines-as-code`）。此 CR 中的设置将默认应用于所有其他 Repository CR。

**示例**：

```bash
cat <<EOF | kubectl create -n pipelines-as-code -f -
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: pipelines-as-code
spec:
  git_provider:
    secret:
      name: "gitlab-webhook-config"
      key: "provider.token"
    webhook_secret:
      name: "gitlab-webhook-config"
      key: "webhook.secret"
EOF
```

> **注意**：全局 Repository CR 是目前的技术预览功能（Technology Preview），生产环境不推荐使用。

### 4.4 设置并发限制

使用 `concurrency_limit` 定义仓库的最大并发 PipelineRun 数量：

```yaml
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: my-repo
  namespace: target-namespace
spec:
  # ...
  concurrency_limit: 3
  # ...
```

如果同时匹配多个 PipelineRun，按字母顺序启动。例如，如果 `.tekton` 目录中有 3 个 PipelineRun，`concurrency_limit` 设为 `1`，则 Pipelines as Code 按字母顺序逐个执行，同一时间只有一个运行中，其余排队。

### 4.5 更改流水线定义的源分支

默认情况下，Pipelines as Code 从触发事件的分支获取流水线定义。如需始终从默认分支（如 `main`、`master` 或 `trunk`）获取：

```yaml
spec:
  settings:
    pipelinerun_provenance: "default_branch"
```

**安全性说明**：这是一种安全措施。默认情况下，Pipelines as Code 使用提交的 PR 中的流水线定义。使用 `default_branch` 设置后，必须先合并流水线定义到默认分支，Pipelines as Code 才会执行它，这确保了所有变更都经过合并审查。

### 4.6 自定义参数扩展

可以在 Repository CR 中定义自定义参数，Pipelines as Code 会将这些参数的值替换到 PipelineRun 中。

**适用场景**：
- 定义基于 push 或 pull request 变化的 URL 参数（如镜像仓库 URL）
- 定义管理员可以管理的参数（如账号 UUID），无需修改 Git 仓库中的 PipelineRun

#### 基本用法

```yaml
spec:
  params:
    - name: company
      value: "ABC Company"
```

在 PipelineRun 中引用：

```yaml
spec:
  params:
    - name: company
      value: "{{ company }}"
```

#### 从 Kubernetes Secret 中获取值

```yaml
spec:
  params:
    - name: company
      secret_ref:
        name: my-secret
        key: companyname
```

#### 解析规则

- 如果同时定义了 `value` 和 `secret_ref`，Pipelines as Code 使用 `value`
- 如果 `params` 部分没有 `name`，不解析该参数
- 如果有多个同名 `params`，使用最后一个

#### CEL 条件过滤

仅在满足特定条件时扩展参数：

```yaml
spec:
  params:
    - name: company
      value: "ABC Company"
      filter: pac.event_type == "pull_request"
```

当有多个同名参数且不同 filter 时，Pipelines as Code 使用第一个匹配 filter 的参数。这样可以按不同事件类型扩展不同值，例如结合 push 和 pull request 事件。

---

## 第五章 创建 PipelineRun

### 5.1 创建 PipelineRun 的基本流程

1. 确保已配置 Pipelines as Code 与 Git 仓库提供商集成
2. 已创建 Repository CR 定义仓库连接
3. 在仓库根目录创建 `.tekton` 目录
4. 在 `.tekton` 目录中创建 `.yaml` 或 `.yml` 文件，包含 PipelineRun CR 定义
5. 添加事件匹配注解
6. 提交并推送代码
7. 触发匹配的事件（如创建 PR 或 push）

### 5.2 完整 PipelineRun 示例

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: maven-build
  annotations:
    # 引用 Tekton Hub 中的 git-clone 任务
    pipelinesascode.tekton.dev/task: "[git-clone]"
    # 匹配 pull request 事件
    pipelinesascode.tekton.dev/on-event: "[pull_request]"
    # 目标分支为 main 或 release
    pipelinesascode.tekton.dev/on-target-branch: "[main, release]"
    # 仅当 src/** 路径有变更时触发
    pipelinesascode.tekton.dev/on-path-changed: "[src/**]"
    # 自动取消进行中的相同 PR 的流水线
    pipelinesascode.tekton.dev/cancel-in-progress: "true"
spec:
  pipelineSpec:
    workspaces:
      - name: shared-workspace
    tasks:
      - name: fetch-repo
        taskRef:
          - name: git-clone
        params:
          - name: url
            value: "{{ repo_url }}"
          - name: revision
            value: "{{ revision }}"
        workspaces:
          - name: output
            workspace: shared-workspace
      - name: build-from-source
        taskRef:
          resolver: cluster
          params:
            - name: kind
              value: task
            - name: name
              value: maven
            - name: namespace
              value: kubedo
        workspaces:
          - name: source
            workspace: shared-workspace
```

**注解说明**：

| 注解 | 说明 |
|---|---|
| `pipelinesascode.tekton.dev/task` | 从 Tekton Hub 引用 `git-clone` 任务 |
| `pipelinesascode.tekton.dev/on-event` | 匹配 pull request（或 merge request）事件 |
| `pipelinesascode.tekton.dev/on-target-branch` | 指定 PR 目标为 `main` 或 `release` 分支时触发 |
| `pipelinesascode.tekton.dev/on-path-changed` | 仅在 `src` 目录下的文件有变更时触发 |
| `pipelinesascode.tekton.dev/cancel-in-progress` | 同一 PR 重新触发时取消先前运行 |

### 5.3 动态变量

Pipelines as Code 提供了丰富的动态变量，可在 PipelineRun 定义中以 `{{ var }}` 格式使用。

#### 5.3.1 提交和 URL 信息

| 变量 | 描述 |
|---|---|
| `{{ repo_owner }}` | 仓库所有者 |
| `{{ repo_name }}` | 仓库名称 |
| `{{ repo_url }}` | 仓库完整 URL |
| `{{ revision }}` | 提交的完整 SHA |
| `{{ sender }}` | 提交发送者的用户名或账号 ID |
| `{{ source_branch }}` | 事件来源的分支名称 |
| `{{ target_branch }}` | 事件目标分支名称。push 事件同 `source_branch` |
| `{{ pull_request_number }}` | PR 或 MR 的编号，仅适用于 `pull_request` 事件类型 |
| `{{ git_auth_secret }}` | Pipelines as Code 自动生成的 Secret 名称，用于检出私有仓库 |
| `{{ git_tag }}` | Git 标签名称 |

> **重要**：动态变量不能在 Pipeline 或 Task 参数的 `default:` 字段中使用，只能在 `value:` 字段中使用。

#### 5.3.2 临时 GitHub App Token

Pipelines as Code 为 GitHub App 生成临时安装 token，用于访问 GitHub API。此 token 存储在 Secret 的 `git-provider-token` key 中。

**使用示例** - 在 PR 上添加评论：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-with-comment
  annotations:
    pipelinesascode.tekton.dev/task: "github-add-comment"
spec:
  pipelineSpec:
    tasks:
      - name: add-sample-comment
        taskRef:
          name: github-add-comment
        params:
          - name: REQUEST_URL
            value: "{{ repo_url }}/pull/{{ pull_request_number }}"
          - name: COMMENT_OR_FILE
            value: "Pipelines as Code IS GREAT!"
          - name: GITHUB_TOKEN_SECRET_NAME
            value: "{{ git_auth_secret }}"
          - name: GITHUB_TOKEN_SECRET_KEY
            value: "git-provider-token"
```

> GitHub App 生成的安装 token 有效期为 8 小时，作用域为发起事件的仓库。

### 5.4 解析器注解

Pipelines as Code 解析器注解用于引用 `Task` 和 `Pipeline` CR 定义。解析器从注解中指定的位置获取定义，并自动将其包含到生成的 `PipelineRun` CR 中。

> **注意**：Kdo 已弃用 Tekton Hub 公共实例（`hub.tekton.dev`），将在未来版本中移除。请使用 [Artifact Hub](https://artifacthub.io) 替代。

#### 5.4.1 远程任务注解

**引用 Tekton Hub 中的单个任务**：

```yaml
pipelinesascode.tekton.dev/task: "git-clone"
```

**引用多个任务**（数组格式）：

```yaml
pipelinesascode.tekton.dev/task: "[git-clone, golang-test, tkn]"
```

**引用多个任务**（使用编号后缀）：

```yaml
pipelinesascode.tekton.dev/task: "git-clone"
pipelinesascode.tekton.dev/task-1: "golang-test"
pipelinesascode.tekton.dev/task-2: "tkn"
```

**指定任务版本**：

```yaml
pipelinesascode.tekton.dev/task: "[git-clone:0.1]"
```

**通过 URL 引用远程任务**：

```yaml
pipelinesascode.tekton.dev/task: "https://remote.url/task.yaml"
```

特殊行为说明：
- 如果使用 GitHub 且远程任务 URL 与 Repository CR 使用相同主机，Pipelines as Code 会使用 GitHub token 通过 GitHub API 获取 URL
- 例如仓库 URL 为 `https://github.com/<organization>/<repository>`，远程 HTTP URL 引用 GitHub blob，Pipelines as Code 会使用 GitHub App token 从该私有仓库获取任务定义文件
- 使用 GitHub Webhook 方式时，可以获取 token 允许的任何组织下的公开或私有仓库

**引用仓库内文件**：

```yaml
pipelinesascode.tekton.dev/task: "<share/tasks/git-clone.yaml>"
```

#### 5.4.2 远程流水线注解

```yaml
pipelinesascode.tekton.dev/pipeline: "https://git.provider/raw/pipeline.yaml"
```

> 每个 PipelineRun 只能引用一个远程流水线。

**覆盖远程流水线中的任务**：

通过添加与远程流水线中任务同名的任务注解来覆盖：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  annotations:
    pipelinesascode.tekton.dev/pipeline: "https://git.provider/raw/pipeline.yaml"
    pipelinesascode.tekton.dev/task: "./my-git-clone-task.yaml"
```

假设远程流水线包含一个名为 `git-clone` 的任务，而 `my-git-clone-task.yaml` 中定义的任务也名为 `git-clone`，则 PipelineRun 执行远程流水线，但将其中名为 `git-clone` 的任务替换为自定义定义。

### 5.5 事件匹配注解

Pipelines as Code 支持通过注解将不同的 Git 提供商事件匹配到每个 PipelineRun。如果多个 PipelineRun 匹配同一事件，Pipelines as Code 并行运行它们，并在每个 PipelineRun 完成后立即将结果发布到 Git 提供商。

#### 5.5.1 匹配 Pull Request 事件

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-pr-main
  annotations:
    pipelinesascode.tekton.dev/on-target-branch: "[main]"
    pipelinesascode.tekton.dev/on-event: "[pull_request]"
```

**分支匹配规则**：

- 逗号分隔多个分支：`"[main, release-nightly]"`
- 完整引用：`"refs/heads/main"`
- 通配符匹配：`"refs/heads/*"`
- 标签匹配：`"refs/tags/1.*"`

#### 5.5.2 匹配 Push 事件

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-push-on-main
  annotations:
    pipelinesascode.tekton.dev/on-target-branch: "[refs/heads/main]"
    pipelinesascode.tekton.dev/on-event: "[push]"
```

分支匹配规则同 Pull Request。

#### 5.5.3 匹配评论事件（技术预览）

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-comment
  annotations:
    pipelinesascode.tekton.dev/on-comment: "^/merge-pr"
```

**评论作者要求**（必须满足以下之一）：
1. 仓库所有者
2. 仓库协作者
3. 组织公开成员
4. `OWNERS` 文件中 `approvers` 或 `reviewers` 部分列出的用户

**关于 OWNERS 文件**：
- Pipelines as Code 支持 Kubernetes 风格的 `OWNERS` 和 `OWNERS_ALIASES` 文件规范
- `OWNERS` 文件应放在仓库根目录
- 如果 `OWNERS` 文件包含 `filters` 部分，Pipelines as Code 仅匹配 `.*` filter 下的审批者和审查者

#### 5.5.4 CEL 高级事件匹配

Pipelines as Code 支持使用 Common Expression Language（CEL）进行高级事件匹配。如果 PipelineRun 中有 `pipelinesascode.tekton.dev/on-cel-expression` 注解，Pipelines as Code 使用 CEL 表达式并**忽略** `on-target-branch` 注解。

> 如果 `on-cel-expression` 与 `on-event`、`on-target-branch`、`on-label`、`on-path-change` 或 `on-path-change-ignore` 同时存在，`on-cel-expression` 优先，其余被忽略。

**示例 1：匹配 PR 事件，目标 main 分支，来源 wip 分支**：

```yaml
pipelinesascode.tekton.dev/on-cel-expression: |
  event == "pull_request" && target_branch == "main" && source_branch == "wip"
```

**示例 2：路径变化匹配**：

```yaml
pipelinesascode.tekton.dev/on-cel-expression: |
  event == "pull_request" && "docs/*.md".pathChanged()
```

**示例 3：匹配标题包含 [DOWNSTREAM] 的 PR**：

```yaml
pipelinesascode.tekton.dev/on-cel-expression: |
  event == "pull_request" && event_title.startsWith("[DOWNSTREAM]")
```

**示例 4：排除 experimental 分支**：

```yaml
pipelinesascode.tekton.dev/on-cel-expression: |
  event == "pull_request" && target_branch != "experimental"
```

**CEL 表达式中可用的字段**：

| 字段 | 类型 | 描述 |
|---|---|---|
| `event` | string | `push` 或 `pull_request` |
| `target_branch` | string | 目标分支 |
| `source_branch` | string | PR 的源分支。push 事件同 `target_branch` |
| `event_title` | string | 事件标题。push 事件为提交标题，pull_request 事件为 PR/MR 标题。仅 GitHub、GitLab、Bitbucket Cloud 支持 |
| `.pathChanged()` | suffix function | 路径变化后缀函数。字符串后加此函数，可检查指定 glob 路径是否有变更。仅 GitHub 和 GitLab 支持 |
| `headers` | map | HTTP 请求头。例如 `headers['x-github-event']` |
| `body` | map | Webhook 负载体。例如 `body.pull_request.state` |

**使用 body 和 header 的完整示例**：

```yaml
pipelinesascode.tekton.dev/on-cel-expression: |
  body.pull_request.base.ref == "main" &&
  body.pull_request.user.login == "superuser" &&
  body.action == "synchronize"
```

**重要说明**：
- 使用 `header` 或 `body` 字段进行事件匹配时，可能无法通过 GitOps 评论（如 `/retest`）重新触发 PipelineRun
- 如需重新触发，可以关闭并重新打开 PR/MR，或强制推送新 SHA 提交

### 5.6 事件过滤注解

在 PipelineRun 上添加过滤注解，确保仅在所有匹配条件满足时才启动。

#### 5.6.1 按路径变化匹配

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-pkg-or-cli
  annotations:
    pipelinesascode.tekton.dev/on-path-changed: "[pkg/*, cli/**]"
```

- `*` — 目录中任意文件
- `**` — 目录及任意子目录中任意文件

#### 5.6.2 排除路径变化

仅当 PR 的变更**不限于**指定路径时才触发：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-docs-not-generated
  annotations:
    pipelinesascode.tekton.dev/on-path-changed: "[docs/**]"
    pipelinesascode.tekton.dev/on-path-changed-ignore: "[docs/generated/**]"
```

结合分支和目标事件的排除示例：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-main-not-docs
  annotations:
    pipelinesascode.tekton.dev/on-target-branch: "[main]"
    pipelinesascode.tekton.dev/on-event: "[pull_request]"
    pipelinesascode.tekton.dev/on-path-changed-ignore: "[docs/**]"
```

#### 5.6.3 按 PR 标签匹配（技术预览）

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-bug-or-defect
  annotations:
    pipelinesascode.tekton.dev/on-label: "[bug, defect]"
```

> 目前仅支持 GitHub、Gitea 和 GitLab。当 PR 添加某个标签或更新带有标签的 PR 的提交时触发。

### 5.7 自动取消进行中的 PipelineRun

通过 `cancel-in-progress` 注解，当同一 PR 或分支的流水线被重新触发时，自动取消先前正在运行的副本：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: sample-pipeline
  annotations:
    pipelinesascode.tekton.dev/cancel-in-progress: "true"
```

**取消时机**：
1. Pipelines as Code 成功启动了同一 PR 或源分支的同一 PipelineRun 的新副本
2. 触发 PipelineRun 的 PR 被合并或关闭

**重要说明**：
- Pipelines as Code 在成功启动新副本**之后**才取消旧副本，不保证任何时候只有一个副本在运行
- 可通过全局设置 `enable-cancel-in-progress-on-pull-requests` 和 `enable-cancel-in-progress-on-push` 为所有 PipelineRun 启用此功能

---

## 第六章 管理 PipelineRun

### 6.1 验证 PipelineRun 定义

在本地验证 Pipelines as Code 解析器是否正确处理定义：

```bash
tkn pac resolve .tekton/pipeline-run-definition.yaml
```

- 如果解析器找不到任何引用的资源，输出显示错误消息
- 如果成功，输出显示包含所有引用资源（如远程任务定义）的 PipelineRun CR 定义

### 6.2 运行 PipelineRun

默认配置下，Pipelines as Code 在仓库默认分支的 `.tekton/` 目录中运行匹配事件的 PipelineRun。

**Pull Request 的非默认分支触发**：

对于来自非默认分支的 PR，Pipelines as Code 仅在以下条件下运行流水线：

1. 作者是仓库所有者
2. 作者是仓库协作者
3. 作者是组织的公开成员
4. `OWNERS` 文件中 `approvers` 或 `reviewers` 部分列出了 PR 作者

如果 PR 作者不满足条件，有权限的用户可以在 PR 上评论 `/ok-to-test` 来批准执行。

**观察执行**：

```bash
# 追踪最后一次 PipelineRun
tkn pac logs -n <my_pipeline_ci> -L

# 交互式选择 PipelineRun
tkn pac logs -n <my_pipeline_ci>
```

对于 GitHub App，PipelineRun URL 会显示在 GitHub 的 **Checks** 标签页中，点击即可跟踪执行。

### 6.3 基于 Git 标签触发 PipelineRun

当创建或引用 Git 标签时，可以通过 GitOps 评论触发 PipelineRun，支持基于版本的发布工作流。

**支持的提供商**：GitHub App、GitHub Webhook、GitLab（不支持 Gitea、Bitbucket Cloud、Bitbucket Data Center）

**最小 PipelineRun 配置示例**：

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipelinerun-on-tag
  annotations:
    pipelinesascode.tekton.dev/on-target-branch: "[refs/tags/*]"
    pipelinesascode.tekton.dev/on-event: "[push]"
spec:
  pipelineSpec:
    tasks:
      - name: tag-task
        taskSpec:
          steps:
            - name: echo
              image: registry.access.redhat.com/ubi9/ubi-micro
              script: |
                echo "tag: {{ git_tag }}"
```

#### 支持的 GitOps 命令

| 命令 | 描述 |
|---|---|
| `/test tag:<tag>` | 重新触发标签提交的所有匹配 PipelineRun |
| `/test <pipelinerun_name> tag:<tag>` | 仅重新触发指定的 PipelineRun |
| `/retest tag:<tag>` | 同 `/test tag:<tag>` |
| `/retest <pipelinerun_name> tag:<tag>` | 同 `/test <name> tag:<tag>` |
| `/cancel tag:<tag>` | 取消标签提交的所有进行中的 PipelineRun |
| `/cancel <pipelinerun_name> tag:<tag>` | 仅取消指定的 PipelineRun |

**触发步骤**：
1. 打开 GitHub 仓库，进入 **Tags** 或 **Releases** 部分
2. 选择标签（如 `v1.0.0`）查看关联提交
3. 点击提交 SHA
4. 在提交评论字段中输入 GitOps 命令，如 `/test tag:v1.0.0`
5. 验证 Pipelines as Code 处理了评论并触发了相应的 PipelineRun

### 6.4 重启或取消 PipelineRun

无需触发新事件（如推送新提交或创建 PR），即可通过评论重启或取消 PipelineRun。

**重启命令**：

| 评论 | 效果 |
|---|---|
| `/test` 或 `/retest` | 重启所有 PipelineRun |
| `/test <pipeline_run_name>` 或 `/retest <pipeline_run_name>` | 启动或重启指定的 PipelineRun |

**取消命令**：

| 评论 | 效果 |
|---|---|
| `/cancel` | 取消所有 PipelineRun |
| `/cancel <pipeline_run_name>` | 取消指定的 PipelineRun |

**权限要求**（评论作者需满足）：
- 仓库所有者
- 仓库协作者
- 组织的公开成员
- `OWNERS` 文件中列出的审批者或审查者

**使用方式**：
- **PR/MR**：直接在 PR 评论中使用命令
- **Push 请求**：在提交消息中包含命令
- **GitHub App**：在 **Checks** 标签页点击 **Re-run all checks**

**在提交上执行命令**：

```bash
# 在 GitHub Commits 或 GitLab History 中
# 点击提交，在行号上添加评论
# 示例：
This is a comment inside a commit.
/retest example_pipeline_run
```

> 如果在多个分支中存在的提交上执行命令，Pipelines as Code 使用最新提交的分支。没有参数时（`/test`），默认在 `main` 分支上执行。可以包含分支指定：`/test branch:user-branch`。

### 6.5 监控 PipelineRun 状态

#### GitHub App 状态
- PipelineRun 完成后，Pipelines as Code 在 **Check** 标签页中添加状态
- 显示每个任务耗时和 `tkn pipelinerun describe` 命令的输出

#### 日志错误片段
- 检测到流水线中某个任务失败时，显示失败任务的最后 3 行日志
- Pipelines as Code 会查找 PipelineRun 并用隐藏字符替换 Secret 值，但无法隐藏来自 workspace 和 `envFrom` 来源的 Secret

#### 容器日志错误检测
- 启用 `error-detection-from-container-logs`（默认 `true`，仅 GitHub App）
- Pipelines as Code 从容器日志中检测错误，并以注解形式添加到 PR 上
- 支持的错误格式：`<filename>:<line>:<column>: <error message>`
- 可通过 `error-detection-simple-regexp` 参数自定义正则表达式
- 默认仅扫描容器日志的最后 50 行，可通过 `error-detection-max-number-of-lines` 调整

#### Webhook 状态
- 对于 Webhook 方式，事件为 PR 时，状态以评论形式添加到 PR 或 MR 上

#### 失败事件
- 如果 Pipelines as Code 匹配到命名空间与 Repository CR 关联，失败日志消息会以 Kubernetes events 形式出现在该命名空间中

#### YAML 解析错误
- Pipelines as Code 检测并报告 `.tekton` 目录中 PipelineRun 定义的 YAML 错误
- 如果 PR 中存在无效 YAML，Pipelines as Code 会在 PR 上创建评论描述错误
- 更新 PR 后检测到新 YAML 错误时，评论会更新为最新信息
- 这些错误不会阻止已验证的 PipelineRun 执行

#### Repository CRD 状态
- Pipelines as Code 在 Repository CR 中存储最近 5 条 PipelineRun 状态消息

```bash
kubectl get repo -n <pipelines_as_code_ci>
```

输出示例：
```
NAME                   URL                                                          NAMESPACE              SUCCEEDED   REASON       STARTTIME   COMPLETIONTIME
pipelines-as-code-ci   https://github.com/openshift-pipelines/pipelines-as-code     pipelines-as-code-ci   True        Succeeded    59m         56m
```

```bash
tkn pac describe -n <namespace>
```

#### 通知
Pipelines as Code 不管理通知。如果需要通知功能，请使用流水线的 `finally` 功能。

### 6.6 清理 PipelineRun

使用 `max-keep-runs` 注解限制保留的 PipelineRun 数量：

```yaml
pipelinesascode.tekton.dev/max-keep-runs: "<max_number>"
```

- Pipelines as Code 在成功执行后立即开始清理，仅保留注解配置的最大数量
- 跳过清理运行中的 PipelineRun，但会清理状态未知的 PipelineRun
- 跳过清理失败的 pull request

### 6.7 传入 Webhook

通过传入 Webhook URL 和共享密钥触发 PipelineRun。

**Repository CRD 配置**：

```yaml
apiVersion: "pipelinesascode.tekton.dev/v1alpha1"
kind: Repository
metadata:
  name: repo
  namespace: ns
spec:
  url: "https://github.com/owner/repo"
  git_provider:
    type: github
    secret:
      name: "owner-token"
  incoming:
    - targets:
        - main
      secret:
        name: repo-incoming-secret
      type: webhook-url
```

**Secret 示例**：

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: repo-incoming-secret
  namespace: ns
type: Opaque
stringData:
  secret: <very_secure_shared_secret>
```

**支持的 Git 提供商**：`github`、`gitlab`、`bitbucket-cloud`

**触发命令**：

```bash
curl -X POST 'https://control.pac.url/incoming?secret=very-secure-shared-secret&repository=repo&branch=main&pipelinerun=target_pipelinerun'
```

- Pipelines as Code 将传入 URL 匹配为 `push` 事件
- 不自动报告触发流水线的状态
- 在流水线中添加 `finally` 任务或使用 `tkn pac` CLI 查看状态

---

## 第七章 命令参考

### 7.1 tkn pac 命令

`tkn pac` CLI 工具用于控制 Pipelines as Code，通过 `TektonConfig` CR 配置日志，使用 `kubectl` 命令查看日志。

**主要功能**：
- 引导 Pipelines as Code 安装和配置
- 创建新的 Pipelines as Code 仓库
- 列出所有 Pipelines as Code 仓库
- 描述仓库及关联运行
- 生成简单的 PipelineRun 模板
- 解析 PipelineRun 定义（如同 Pipelines as Code 执行）

#### 7.1.1 基本语法

```bash
tkn pac [command or options] [arguments]
```

#### 7.1.2 全局选项

```bash
tkn pac --help
```

#### 7.1.3 工具命令

**bootstrap 命令**：

| 命令 | 描述                                                                                |
|---|-----------------------------------------------------------------------------------|
| `tkn pac bootstrap` | 安装和配置 Pipelines as Code（GitHub/GitHub Enterprise）                                 |
| `tkn pac bootstrap --nightly` | 安装 nightly 版本                                                                     |
| `tkn pac bootstrap --route-url <public_url_to_ingress_spec>` | 覆盖 Kdo路由 URL。默认自动检测 Kdo路由；如无 Kdo集群，会要求提供指向 Ingress 端点的公共 URL |
| `tkn pac bootstrap github-app` | 创建 GitHub 应用和 pipelines-as-code 命名空间中的 Secret                                     |

**repository 命令**：

| 命令 | 描述 |
|---|---|
| `tkn pac create repository` | 创建新的 Pipelines as Code 仓库和基于 PipelineRun 模板的命名空间 |
| `tkn pac list` | 列出所有 Pipelines as Code 仓库及关联运行的最后状态 |
| `tkn pac repo describe` | 描述一个 Pipelines as Code 仓库及相关运行 |

**generate 命令**：

| 命令 | 描述 |
|---|---|
| `tkn pac generate` | 生成简单的 PipelineRun。从包含源代码的目录执行时，自动检测当前 Git 信息。具备基本语言检测能力，根据检测到的语言添加额外任务。例如检测到 `setup.py` 时自动添加 `pylint` 任务 |

**resolve 命令**：

| 命令 | 描述 |
|---|---|
| `tkn pac resolve` | 像 Pipelines as Code 服务一样执行 PipelineRun 定义 |
| `tkn pac resolve -f .tekton/pull-request.yaml` | 解析指定文件，显示包含所有引用资源的完整 PipelineRun 定义 |
| `tkn pac resolve -f .tekton/pull-request.yaml \| kubectl apply -f -` | 解析并应用到集群 |
| `tkn pac resolve -f .tekton/pr.yaml -p revision=main -p repo_name=<name>` | 覆盖从 Git 仓库获取的默认参数值 |

> `-f` 选项可接受目录路径，对目录中所有 `.yaml` 或 `.yml` 文件执行 `tkn pac resolve`，也可在同一命令中多次使用 `-f`。

**logs 命令**：

| 命令 | 描述 |
|---|---|
| `tkn pac logs -n <namespace> -L` | 追踪最后一次 PipelineRun 的日志 |
| `tkn pac logs -n <namespace>` | 交互式选择要查看日志的 PipelineRun |

**webhook 命令**：

| 命令 | 描述 |
|---|---|
| `tkn pac webhook add -n <namespace>` | 为已有仓库添加额外的 Webhook |
| `tkn pac webhook update-token -n <namespace>` | 更新 Personal Access Token |

#### 7.1.4 CEL 命令

`tkn pac cel` 用于评估 CEL 表达式，测试和调试 Pipelines as Code 的事件过滤逻辑。

**语法**：

```bash
tkn pac cel -b <body.json> -H <headers.txt> [-p <provider>]
```

**选项**：

| 选项 | 描述 |
|---|---|
| `-b, --body` | 指定 JSON payload 文件 |
| `-H, --headers` | 指定 headers 文件（纯文本、JSON 或 gosmee 脚本） |
| `-p, --provider` | 可选，指定 Git 提供商（auto/github/gitlab/bitbucket-cloud/bitbucket-datacenter/gitea） |

**支持的 header 格式**：

纯文本 HTTP header 格式：
```
X-GitHub-Event: pull_request
Content-Type: application/json
User-Agent: GitHub-Hookshot/abc123
```

JSON 格式：
```json
{
  "X-GitHub-Event": "pull_request",
  "Content-Type": "application/json",
  "User-Agent": "GitHub-Hookshot/abc123"
}
```

Gosmee 生成的 shell 脚本格式（自动检测和解析）：
```bash
#!/usr/bin/env bash
curl -X POST "http://localhost:8080/" \
  -H "X-GitHub-Event: pull_request" \
  -H "Content-Type: application/json" \
  -H "User-Agent: GitHub-Hookshot/abc123" \
  -d @payload.json
```

**交互模式**：
- 在终端中执行时显示交互式 CEL 表达式提示
- 表达式历史可通过方向键导航，跨会话持久化
- 在空行按 Enter 退出提示

**非交互模式**：
```bash
echo 'event == "pull_request"' | tkn pac cel -b body.json -H headers.txt
```

**可用变量**：

| 变量 | 描述 |
|---|---|
| `event` | 事件类型（push/pull_request） |
| `target_branch` | 目标分支名称 |
| `source_branch` | 源分支名称 |
| `target_url` | 目标仓库 URL |
| `source_url` | 源仓库 URL |
| `event_title` | Pull request 标题或提交消息 |
| `body.*` | Webhook payload 中所有字段 |
| `headers.*` | 所有 HTTP 请求头 |
| `files.*` | 在 CLI 模式下始终为空 |
| `pac.*` | 所有 Pipelines as Code 参数（向后兼容） |

**示例表达式**：

```bash
# 匹配 PR 到 main 分支
event == "pull_request" && target_branch == "main"

# 匹配源分支以 feat/ 开头的 PR
event == "pull_request" && source_branch.matches(".*feat/.*")

# 匹配 PR 同步事件
body.action == "synchronize"

# 排除草稿 PR
!body.pull_request.draft

# 按 header 匹配
headers["x-github-event"] == "pull_request"
```

**历史存储**：
- Linux/macOS：`~/.cache/tkn-pac/cel-history/`
- Windows：`%USERPROFILE%\.cache\tkn-pac\cel-history\`

### 7.2 配置 Pipelines as Code 日志

#### 7.2.1 通过 TektonConfig CR 配置

编辑 `TektonConfig` CR 中的 `pac-config-logging` ConfigMap：

```yaml
apiVersion: operator.tekton.dev/v1alpha1
kind: TektonConfig
metadata:
  name: config
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        options:
          configMaps:
            pac-config-logging:
              data:
                loglevel.pac-watcher: warn
                loglevel.pipelines-as-code-webhook: warn
                loglevel.pipelinesascode: warn
                zap-logger-config: |
                  {
                    "level": "info",
                    "development": false,
                    "sampling": {
                      "initial": 100,
                      "thereafter": 100
                    },
                    "outputPaths": ["stdout"],
                    "errorOutputPaths": ["stderr"],
                    "encoding": "json",
                    "encoderConfig": {
                      "timeKey": "ts",
                      "levelKey": "level",
                      "nameKey": "logger",
                      "callerKey": "caller",
                      "messageKey": "msg",
                      "stacktraceKey": "stacktrace",
                      "timeEncoder": "iso8601"
                    }
                  }
```

**日志级别组件**：

| 字段 | 组件 |
|---|---|
| `loglevel.pac-watcher` | pipelines-as-code-watcher |
| `loglevel.pipelines-as-code-webhook` | pipelines-as-code-webhook |
| `loglevel.pipelinesascode` | pipelines-as-code-controller |

**使用自定义 ConfigMap**：

通过 `options.deployments` 字段为每个组件设置环境变量 `CONFIG_LOGGING_NAME`：

```yaml
spec:
  platforms:
    openshift:
      pipelinesAsCode:
        options:
          configMaps:
            custom-pac-config-logging:
              data:
                loglevel.pac-watcher: warn
                loglevel.pipelines-as-code-webhook: warn
                loglevel.pipelinesascode: warn
          deployments:
            pipelines-as-code-controller:
              spec:
                template:
                  spec:
                    containers:
                      - name: pac-controller
                        env:
                          - name: CONFIG_LOGGING_NAME
                            value: custom-pac-config-logging
            pipelines-as-code-watcher:
              spec:
                template:
                  spec:
                    containers:
                      - name: pac-watcher
                        env:
                          - name: CONFIG_LOGGING_NAME
                            value: custom-pac-config-logging
            pipelines-as-code-webhook:
              spec:
                template:
                  spec:
                    containers:
                      - name: pac-webhook
                        env:
                          - name: CONFIG_LOGGING_NAME
                            value: custom-pac-config-logging
```

#### 7.2.2 按命名空间分割日志

Pipelines as Code 日志包含命名空间信息，可以用 `grep` 过滤特定命名空间的日志：

```bash
kubectl logs pipelines-as-code-controller-<unique_id> -n pipelines-as-code | grep mynamespace
```

---

## 附录：常见问题排查

### PipelineRun 未触发

如果 Pipelines as Code 未触发 PipelineRun，请检查以下内容：

1. ✅ Webhook 是否正确配置到 Git 仓库
2. ✅ Secret 是否正确创建在集群中
3. ✅ Repository CR 是否存在且配置正确
4. ✅ PipelineRun 定义文件是否在 `.tekton` 目录中
5. ✅ 文件扩展名是否为 `.yaml` 或 `.yml`
6. ✅ 事件注解是否匹配 Git 事件类型（pull_request/push/comment）
7. ✅ 目标分支注解是否与实际分支匹配

### 查看 Pipelines as Code 控制器日志

```bash
# 查找控制器 pod
kubectl get pods -n pipelines-as-code

# 查看日志
kubectl logs pipelines-as-code-controller-<pod_id> -n tekton-pipelines
```

### GitHub Token 作用域故障

如果 GitHub token 无法访问额外仓库，检查：
- `secret-github-app-token-scoped` 是否已设为 `false`
- 额外仓库名称格式是否正确（`owner/repo`）
- 仓库级别配置中，额外仓库是否与 Repository CR 在同一命名空间

错误示例：
```
failed to scope GitHub token as repo owner1/project1 does not exist in namespace test-repo
```

---

