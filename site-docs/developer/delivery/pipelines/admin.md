---
title: "流水线管理员视角"
description: "管理员需要维护 Tekton 基础设施、平台 Task、ServiceAccount、权限与容量，并处理流水线运行问题。"
sidebar_position: 5
doc_type: how-to
audience: [admin, developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

上级：[流水线](/docs/developer/delivery/pipelines/)

开发者关注“如何用流水线交付应用”，管理员还需要保证流水线基础设施可用、权限可控、容量充足。

## 管理员职责

| 层级 | 职责 |
|---|---|
| **基础设施** | 维护 Tekton Pipelines、Pipeline-as-Code、构建缓存和镜像仓库；规划升级、监控与备份 |
| **平台能力** | 提供预装 Task、ServiceAccount、共享 PipelineResource 和常用流水线模板 |
| **权限管理** | 控制谁能创建 Pipeline、谁只能运行、谁能审批；限制跨命名空间访问 |
| **性能与容量** | 规划并发 PipelineRun、工作空间容量、构建节点资源和镜像拉取带宽 |

## 典型场景

### 应用流水线（Embedded）

流水线定义随应用仓库一起维护，管理员通常只需要保证：

- Tekton 与 Pipelines-as-Code 正常运行
- 仓库使用的 ServiceAccount 存在，并具备推送镜像的权限
- 镜像仓库 Secret 已正确挂载
- 构建所需的存储、CPU、内存没有超过命名空间配额

应用仓库中的 `.tekton/` 目录和 PipelineRun 由平台自动生成，管理员不需要逐条维护业务流水线。

### 集群维护流水线

管理员也可以为升级、巡检、批量运维编写独立流水线。例如批量给节点打标签：

```yaml
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: label-nodes
spec:
  params:
    - name: node-selector
      type: string
  tasks:
    - name: label
      taskSpec:
        params:
          - name: selector
            type: string
        steps:
          - name: kubectl
            image: bitnami/kubectl:1.31
            script: |
              #!/usr/bin/env sh
              set -eu
              kubectl get nodes -l "$(params.selector)" -o name \
                | xargs -r kubectl label --overwrite node \
                    maintenance-window=planned
```

这类流水线应使用专用 ServiceAccount，并与业务流水线隔离。

## 最佳实践

### 安全

- 按最小权限为流水线绑定 ServiceAccount，避免默认使用 `cluster-admin`
- 只允许来自受信仓库的镜像和 Task；固定镜像 digest，避免 `latest`
- 为 Task 设置 CPU/内存 requests 和 limits，防止构建任务拖垮节点
- Secret 通过 Kubernetes Secret 挂载，不要写进 Pipeline YAML 或日志

### 性能

- 为命名空间设置并发 PipelineRun 上限，避免同时构建过多
- 复用构建缓存和 Go/Node 依赖缓存，减少重复下载
- 拆分超大 Task，避免单个 Pod 运行过久
- 使用轻量构建镜像，减少拉取时间

### 可观测性

- 保留 PipelineRun 日志和事件，失败时能追溯到具体 Task
- 为失败率、排队时长、执行时长建立指标和告警
- 对审批、权限变更和流水线定义变更保留审计记录，建议至少 90 天

## 常见问题

### PipelineRun 一直处于 Running

1. 查看 `kubectl describe pipelinerun <name> -n <ns>` 的 Conditions
2. 检查 Task Pod 是否 Pending：资源不足、PVC 未绑定、镜像拉取失败都会导致阻塞
3. 检查 ServiceAccount 是否存在，镜像仓库 Secret 是否可读
4. 检查是否有 ApprovalTask 正在等待审批

### 如何限制用户只能运行特定流水线

使用 RBAC 控制 `pipelines` 的 `create/update/delete` 权限，只授予 `pipelineruns` 的 `create` 权限；再通过命名空间和 ServiceAccount 隔离。不要给业务用户集群级 Tekton 权限。

### 如何检查 Tekton 组件是否正常

```bash
kubectl get pods -n tekton-pipelines
kubectl get pods -n pipelines-as-code
kubectl get pipelinerun -A
```

重点关注控制器、webhook、PAC controller 是否 Ready。

### 部署流水线放在哪里，升级后需要重新部署吗

平台预装的流水线通常放在 `pipelines-as-code` 或平台指定的命名空间，由安装器/升级流程维护。自定义流水线应放在业务仓库或独立的 GitOps 仓库中；升级 Tekton 后不需要重新创建业务 PipelineRun，但需要确认 Task 的 `apiVersion` 和准入 webhook 兼容。
