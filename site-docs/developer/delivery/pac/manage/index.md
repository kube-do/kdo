---
title: "运行管理与命令参考"
description: "本页介绍 PipelineRun 的验证、运行、监控与清理，并提供常用命令和配置参考。"
sidebar_position: 4
doc_type: how-to
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

本页介绍 PipelineRun 的验证、运行、监控与清理，并提供常用命令和配置参考。

## 验证 PipelineRun 定义

在本地验证 Pipelines as Code 解析器是否正确处理定义：

```bash
tkn pac resolve .tekton/pipeline-run-definition.yaml
```

- 如果解析器找不到任何引用的资源，输出显示错误消息
- 如果成功，输出显示包含所有引用资源（如远程任务定义）的 PipelineRun CR 定义

## 运行 PipelineRun

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

## 基于 Git 标签触发 PipelineRun

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

### 支持的 GitOps 命令

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

## 重启或取消 PipelineRun

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

## 监控 PipelineRun 状态

### GitHub App 状态
- PipelineRun 完成后，Pipelines as Code 在 **Check** 标签页中添加状态
- 显示每个任务耗时和 `tkn pipelinerun describe` 命令的输出

### 日志错误片段
- 检测到流水线中某个任务失败时，显示失败任务的最后 3 行日志
- Pipelines as Code 会查找 PipelineRun 并用隐藏字符替换 Secret 值，但无法隐藏来自 workspace 和 `envFrom` 来源的 Secret

### 容器日志错误检测
- 启用 `error-detection-from-container-logs`（默认 `true`，仅 GitHub App）
- Pipelines as Code 从容器日志中检测错误，并以注解形式添加到 PR 上
- 支持的错误格式：`<filename>:<line>:<column>: <error message>`
- 可通过 `error-detection-simple-regexp` 参数自定义正则表达式
- 默认仅扫描容器日志的最后 50 行，可通过 `error-detection-max-number-of-lines` 调整

### Webhook 状态
- 对于 Webhook 方式，事件为 PR 时，状态以评论形式添加到 PR 或 MR 上

### 失败事件
- 如果 Pipelines as Code 匹配到命名空间与 Repository CR 关联，失败日志消息会以 Kubernetes events 形式出现在该命名空间中

### YAML 解析错误
- Pipelines as Code 检测并报告 `.tekton` 目录中 PipelineRun 定义的 YAML 错误
- 如果 PR 中存在无效 YAML，Pipelines as Code 会在 PR 上创建评论描述错误
- 更新 PR 后检测到新 YAML 错误时，评论会更新为最新信息
- 这些错误不会阻止已验证的 PipelineRun 执行

### Repository CRD 状态
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

### 通知
Pipelines as Code 不管理通知。如果需要通知功能，请使用流水线的 `finally` 功能。

## 清理 PipelineRun

使用 `max-keep-runs` 注解限制保留的 PipelineRun 数量：

```yaml
pipelinesascode.tekton.dev/max-keep-runs: "<max_number>"
```

- Pipelines as Code 在成功执行后立即开始清理，仅保留注解配置的最大数量
- 跳过清理运行中的 PipelineRun，但会清理状态未知的 PipelineRun
- 跳过清理失败的 pull request

## 传入 Webhook

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

## 高级用法

- [tkn pac 命令参考](/docs/developer/delivery/pac/manage/tkn-pac/)
- [配置 Pipelines as Code 日志](/docs/developer/delivery/pac/manage/logging/)
- [常见问题排查](/docs/developer/delivery/pac/manage/troubleshooting/)
