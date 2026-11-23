---
title: "Git 仓库托管服务集成"
description: "安装 Pipelines as Code 后，集群管理员需要配置一个 Git 仓库托管服务提供商。"
sidebar_position: 2
doc_type: how-to
audience: [admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

安装 Pipelines as Code 后，集群管理员需要配置一个 Git 仓库托管服务提供商。

**支持的平台**：

| 平台 | 推荐度 | 说明 |
|---|---|---|
| GitHub App | ⭐ 推荐 | 功能最完整，支持 Checks API、GitOps 评论、自动配置等 |
| GitHub Webhook | 备选 | 可在无法创建 GitHub App 时使用，功能有限 |
| GitLab | 可选 | 通过 Webhook 集成 |
| Bitbucket Cloud | 可选 | 通过 Webhook 集成 |
| Bitbucket Data Center | 可选 | 通过 Webhook 集成 |
| 阿里云 Codeup | 可选 | 通过控制台代理创建 Webhook，支持公有云 |

## 集成方式

按代码托管平台选择配置方式。GitHub 优先使用 GitHub App；无法创建 App 时使用 Webhook。

| 平台 | 配置方式 |
|---|---|
| GitHub | [GitHub App 集成](/docs/developer/delivery/pac/git-integration/github-app/)（推荐）<br/>[GitHub Webhook 集成](/docs/developer/delivery/pac/git-integration/github-webhook/) |
| GitLab | [GitLab 集成](/docs/developer/delivery/pac/git-integration/gitlab/) |
| Bitbucket | [Bitbucket 集成](/docs/developer/delivery/pac/git-integration/bitbucket/) |
| 阿里云 Codeup | [Codeup 集成](/docs/developer/delivery/pac/git-integration/codeup/) |

## 配置自定义证书

如需配置 Pipelines as Code 使用私有签名或自定义证书的 Git 仓库：

- 如果使用 Tekton Pipelines Operator 安装，可以通过 `Proxy` 对象将自定义证书添加到集群
- Operator 会自动将证书暴露给所有 Tekton Pipelines 组件和工作负载，包括 Pipelines as Code

## 私有仓库支持

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
