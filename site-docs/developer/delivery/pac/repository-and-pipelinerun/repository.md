---
title: "Repository CR 配置"
description: "配置 Repository 自定义资源：事件匹配、命名空间、认证、并发限制、源分支和自定义参数。"
sidebar_position: 4
doc_type: reference
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

上级：[Repository 与 PipelineRun](/docs/developer/delivery/pac/repository-and-pipelinerun/)

## Repository CR 的主要功能

`Repository` 自定义资源（CR）有以下主要功能：

1. **事件匹配**：告知 Pipelines as Code 处理来自特定 URL 的事件
2. **命名空间绑定**：告知 PipelineRun 运行所在的命名空间
3. **认证配置**：引用 API Secret、用户名或 Git 提供商所需的 API URL（使用 Webhook 时）
4. **状态显示**：显示仓库的最后一次 PipelineRun 状态

## 创建 Repository CR

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

## 创建全局 Repository CR

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

## 设置并发限制

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

## 更改流水线定义的源分支

默认情况下，Pipelines as Code 从触发事件的分支获取流水线定义。如需始终从默认分支（如 `main`、`master` 或 `trunk`）获取：

```yaml
spec:
  settings:
    pipelinerun_provenance: "default_branch"
```

**安全性说明**：这是一种安全措施。默认情况下，Pipelines as Code 使用提交的 PR 中的流水线定义。使用 `default_branch` 设置后，必须先合并流水线定义到默认分支，Pipelines as Code 才会执行它，这确保了所有变更都经过合并审查。

## 自定义参数扩展

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
