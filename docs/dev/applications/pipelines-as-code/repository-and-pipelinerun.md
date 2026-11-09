---
title: Repository 与 PipelineRun
parent: Pipelines as Code
nav_order: 3
---

1. TOC
{:toc}

本页介绍 Repository 自定义资源的创建与配置，以及创建 PipelineRun 的方式与常用注解。

## 4.1 Repository CR 的主要功能

`Repository` 自定义资源（CR）有以下主要功能：

1. **事件匹配**：告知 Pipelines as Code 处理来自特定 URL 的事件
2. **命名空间绑定**：告知 PipelineRun 运行所在的命名空间
3. **认证配置**：引用 API Secret、用户名或 Git 提供商所需的 API URL（使用 Webhook 时）
4. **状态显示**：显示仓库的最后一次 PipelineRun 状态

## 4.2 创建 Repository CR

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

## 4.3 创建全局 Repository CR

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

## 4.4 设置并发限制

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

## 4.5 更改流水线定义的源分支

默认情况下，Pipelines as Code 从触发事件的分支获取流水线定义。如需始终从默认分支（如 `main`、`master` 或 `trunk`）获取：

```yaml
spec:
  settings:
    pipelinerun_provenance: "default_branch"
```

**安全性说明**：这是一种安全措施。默认情况下，Pipelines as Code 使用提交的 PR 中的流水线定义。使用 `default_branch` 设置后，必须先合并流水线定义到默认分支，Pipelines as Code 才会执行它，这确保了所有变更都经过合并审查。

## 4.6 自定义参数扩展

可以在 Repository CR 中定义自定义参数，Pipelines as Code 会将这些参数的值替换到 PipelineRun 中。

**适用场景**：
- 定义基于 push 或 pull request 变化的 URL 参数（如镜像仓库 URL）
- 定义管理员可以管理的参数（如账号 UUID），无需修改 Git 仓库中的 PipelineRun

### 基本用法

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

### 从 Kubernetes Secret 中获取值

```yaml
spec:
  params:
    - name: company
      secret_ref:
        name: my-secret
        key: companyname
```

### 解析规则

- 如果同时定义了 `value` 和 `secret_ref`，Pipelines as Code 使用 `value`
- 如果 `params` 部分没有 `name`，不解析该参数
- 如果有多个同名 `params`，使用最后一个

### CEL 条件过滤

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

## 5.1 创建 PipelineRun 的基本流程

1. 确保已配置 Pipelines as Code 与 Git 仓库提供商集成
2. 已创建 Repository CR 定义仓库连接
3. 在仓库根目录创建 `.tekton` 目录
4. 在 `.tekton` 目录中创建 `.yaml` 或 `.yml` 文件，包含 PipelineRun CR 定义
5. 添加事件匹配注解
6. 提交并推送代码
7. 触发匹配的事件（如创建 PR 或 push）

## 5.2 完整 PipelineRun 示例

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

## 5.3 动态变量

Pipelines as Code 提供了丰富的动态变量，可在 PipelineRun 定义中以 `{{ var }}` 格式使用。

### 5.3.1 提交和 URL 信息

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

### 5.3.2 临时 GitHub App Token

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

## 5.4 解析器注解

Pipelines as Code 解析器注解用于引用 `Task` 和 `Pipeline` CR 定义。解析器从注解中指定的位置获取定义，并自动将其包含到生成的 `PipelineRun` CR 中。

> **注意**：KDO 已弃用 Tekton Hub 公共实例（`hub.tekton.dev`），将在未来版本中移除。请使用 [Artifact Hub](https://artifacthub.io) 替代。

### 5.4.1 远程任务注解

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

### 5.4.2 远程流水线注解

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

## 5.5 事件匹配注解

Pipelines as Code 支持通过注解将不同的 Git 提供商事件匹配到每个 PipelineRun。如果多个 PipelineRun 匹配同一事件，Pipelines as Code 并行运行它们，并在每个 PipelineRun 完成后立即将结果发布到 Git 提供商。

### 5.5.1 匹配 Pull Request 事件

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

### 5.5.2 匹配 Push 事件

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

### 5.5.3 匹配评论事件（技术预览）

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

### 5.5.4 CEL 高级事件匹配

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

## 5.6 事件过滤注解

在 PipelineRun 上添加过滤注解，确保仅在所有匹配条件满足时才启动。

### 5.6.1 按路径变化匹配

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

### 5.6.2 排除路径变化

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

### 5.6.3 按 PR 标签匹配（技术预览）

```yaml
apiVersion: tekton.dev/v1
kind: PipelineRun
metadata:
  name: pipeline-bug-or-defect
  annotations:
    pipelinesascode.tekton.dev/on-label: "[bug, defect]"
```

> 目前仅支持 GitHub、Gitea 和 GitLab。当 PR 添加某个标签或更新带有标签的 PR 的提交时触发。

## 5.7 自动取消进行中的 PipelineRun

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
