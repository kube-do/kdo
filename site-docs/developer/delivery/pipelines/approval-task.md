---
title: "审批任务 (ApprovalTask)"
description: "ApprovalTask 在 PipelineRun DAG 中插入人工审批节点，支持控制台审批、CLI 查看与超时处理。"
sidebar_position: 4
doc_type: reference
audience: [developer, admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

上级：[流水线](/docs/developer/delivery/pipelines/)

> ApprovalTask 是 KDO 平台提供的自定义 CRD（`openshift-pipelines.org/v1alpha1`），在 Tekton PipelineRun 的 DAG 中插入人工审批节点。流水线执行到该节点时会阻塞，等待审批人批准/拒绝后才继续或终止。

## 工作原理

```
PipelineRun 执行
  ↓
到达 ApprovalTask 节点 → 状态: pending → 流水线阻塞
  ↓
审批人收到通知 → 批准/拒绝
  ↓
达到 numberOfApprovalsRequired → 流水线继续
任一审批人拒绝 → 流水线终止
```

## CRD 结构

```yaml
apiVersion: openshift-pipelines.org/v1alpha1
kind: ApprovalTask
metadata:
  name: my-approval
spec:
  approvers:
    - name: admin@kube-do.dev   # 审批人名称
      type: User                # User（指定用户）或 Group（用户组）
      input: pending            # 当前状态: pending / approve / reject
    - name: dev
      type: Group
  numberOfApprovalsRequired: 1  # 需要达到的批准数
status:
  state: pending                # pending / approved / rejected / false(超时)
  approvalsReceived: 0
  approvalsRequired: 1
```

## 在流水线中使用

在 PipelineRun 的 `tasks` 中引用 ApprovalTask，作为流水线的一个节点：

```yaml
tasks:
  - name: run-custom-task
    taskRef:
      apiVersion: openshift-pipelines.org/v1alpha1
      kind: ApprovalTask
    params:
      - name: approvers
        value:
          - admin@kube-do.dev
          - group:dev
      - name: numberOfApprovalsRequired
        value: '1'
  - name: fetch-repository
    runAfter:
      - run-custom-task        # 审批通过后才执行
    taskRef:
      kind: Task
      name: git-clone
```

## KDO 控制台操作

| 功能 | 说明 |
|------|------|
| **审批列表** | 导航 → 审批任务，按状态筛选（待处理/已批准/已拒绝/超时） |
| **批准/拒绝** | 每行操作菜单 → 批准/拒绝，拒绝需填写原因 |
| **组审批** | 组内任一成员均可审批，各人响应独立记录 |
| **拓扑可视化** | PipelineRun DAG 中 ApprovalTask 节点带实时状态图标和描边 |
| **通知提醒** | 有待审批任务时，控制台显示 Toast 通知 |

## 查看审批任务 (CLI)

```bash
# 列出所有审批任务
kubectl get approvaltasks -A

# 查看特定 PipelineRun 关联的审批任务
kubectl get approvaltasks -n <ns> -l tekton.dev/pipelineRun=<pipelinerun-name>

# 查看审批详情
kubectl get approvaltask <name> -n <ns> -o yaml
```
