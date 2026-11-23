---
title: "tkn pac 命令参考"
description: "tkn pac 子命令、全局选项、工具命令与 CEL 命令参考。"
sidebar_position: 41
doc_type: reference
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

`tkn pac` CLI 工具用于控制 Pipelines as Code，通过 `TektonConfig` CR 配置日志，使用 `kubectl` 命令查看日志。

**主要功能**：
- 引导 Pipelines as Code 安装和配置
- 创建新的 Pipelines as Code 仓库
- 列出所有 Pipelines as Code 仓库
- 描述仓库及关联运行
- 生成简单的 PipelineRun 模板
- 解析 PipelineRun 定义（如同 Pipelines as Code 执行）

## 基本语法

```bash
tkn pac [command or options] [arguments]
```

## 全局选项

```bash
tkn pac --help
```

## 工具命令

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

## CEL 命令

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
