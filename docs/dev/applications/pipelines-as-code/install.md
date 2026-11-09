---
title: 安装与配置
parent: Pipelines as Code
nav_order: 1
---

1. TOC
{:toc}

本页介绍在 KDO 平台上安装 Pipelines as Code、安装命令行工具，以及自定义控制器配置。

## 2.1 在 KDO 上安装 Pipelines as Code

Pipelines as Code 随 Tekton Pipelines Operator 一同安装，默认安装在 `pipelines-as-code` 命名空间中。

## 2.2 安装 CLI（tkn pac / opc）

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

## 2.3 自定义 Pipelines as Code 配置

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

### 完整配置示例

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

## 2.4 配置额外的 Pipelines as Code 控制器以支持多个 GitHub App

默认情况下，Pipelines as Code 只能与一个 GitHub App 交互。如果需要使用多个 GitHub App（例如不同的 GitHub 账号，或 GitHub Enterprise + GitHub SaaS），必须为每个额外的 GitHub App 配置额外的 Pipelines as Code 控制器。

### 配置方式

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

## 2.5 其他资源

- [安装 Tekton Pipelines](https://docs.redhat.com/en/documentation/red_hat_openshift_pipelines/1.22/html/installing_openshift_pipelines/index)
- [安装 tkn CLI](https://docs.redhat.com/en/documentation/red_hat_openshift_pipelines/1.22/html/installing_openshift_pipelines/installing-tkn)
- [Tekton Pipelines 发布说明](https://docs.redhat.com/en/documentation/red_hat_openshift_pipelines/1.22/html/release_notes/index)
