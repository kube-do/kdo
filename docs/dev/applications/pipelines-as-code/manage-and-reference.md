---
title: 运行管理与命令参考
parent: Pipelines as Code
nav_order: 4
---

1. TOC
{:toc}

本页介绍 PipelineRun 的验证、运行、监控与清理，并提供常用命令和配置参考。

## 6.1 验证 PipelineRun 定义

在本地验证 Pipelines as Code 解析器是否正确处理定义：

```bash
tkn pac resolve .tekton/pipeline-run-definition.yaml
```

- 如果解析器找不到任何引用的资源，输出显示错误消息
- 如果成功，输出显示包含所有引用资源（如远程任务定义）的 PipelineRun CR 定义

## 6.2 运行 PipelineRun

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

## 6.3 基于 Git 标签触发 PipelineRun

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

## 6.4 重启或取消 PipelineRun

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

## 6.5 监控 PipelineRun 状态

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

## 6.6 清理 PipelineRun

使用 `max-keep-runs` 注解限制保留的 PipelineRun 数量：

```yaml
pipelinesascode.tekton.dev/max-keep-runs: "<max_number>"
```

- Pipelines as Code 在成功执行后立即开始清理，仅保留注解配置的最大数量
- 跳过清理运行中的 PipelineRun，但会清理状态未知的 PipelineRun
- 跳过清理失败的 pull request

## 6.7 传入 Webhook

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

## 7.1 tkn pac 命令

`tkn pac` CLI 工具用于控制 Pipelines as Code，通过 `TektonConfig` CR 配置日志，使用 `kubectl` 命令查看日志。

**主要功能**：
- 引导 Pipelines as Code 安装和配置
- 创建新的 Pipelines as Code 仓库
- 列出所有 Pipelines as Code 仓库
- 描述仓库及关联运行
- 生成简单的 PipelineRun 模板
- 解析 PipelineRun 定义（如同 Pipelines as Code 执行）

### 7.1.1 基本语法

```bash
tkn pac [command or options] [arguments]
```

### 7.1.2 全局选项

```bash
tkn pac --help
```

### 7.1.3 工具命令

**bootstrap 命令**：

| 命令 | 描述                                                                                |
|---|-----------------------------------------------------------------------------------|
| `tkn pac bootstrap` | 安装和配置 Pipelines as Code（GitHub/GitHub Enterprise）                                 |
| `tkn pac bootstrap --nightly` | 安装 nightly 版本                                                                     |
| `tkn pac bootstrap --route-url <public_url_to_ingress_spec>` | 覆盖 KDO 路由 URL。默认自动检测 KDO 路由；如无 KDO 集群，会要求提供指向 Ingress 端点的公共 URL |
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

### 7.1.4 CEL 命令

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

## 7.2 配置 Pipelines as Code 日志

### 7.2.1 通过 TektonConfig CR 配置

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

### 7.2.2 按命名空间分割日志

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
