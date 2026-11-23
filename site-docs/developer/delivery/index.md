---
title: "交付与流水线"
description: "KDO 的流水线、Pipelines as Code 和 GitOps 交付入口。"
sidebar_position: 0
doc_type: explanation
audience: [developer, admin]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

KDO 的交付链路围绕 Git 仓库、PipelineRun 和 GitOps 写回展开。你可以先用标准流水线完成构建和部署，再接入 Pipelines as Code，让 Git 事件自动触发流水线。

## 选择交付方式

| 方式 | 适用场景 | 入口 |
|------|----------|------|
| 标准流水线 | 在控制台维护 Pipeline 和 PipelineRun，适合固定流程 | [流水线](/docs/developer/delivery/pipelines/) |
| Pipelines as Code | 仓库内维护 `.tekton` 定义，由 Git 事件触发 | [Pipelines as Code](/docs/developer/delivery/pac/) |
| 嵌入流水线 | 在应用内维护流水线，适合单应用快速迭代 | [嵌入流水线](/docs/developer/delivery/pipelines/embedded-pipeline/) |
| 审批任务 | 在流水线中加入人工审批节点 | [审批任务](/docs/developer/delivery/pipelines/approval-task/) |

## 推荐阅读顺序

1. 先了解 [流水线执行流程](/docs/developer/delivery/pipelines/) 和 Tekton 资源对象。
2. 按 [创建 Git 应用](/docs/developer/applications/git/) 完成第一次构建和部署。
3. 需要仓库内流水线时，接入 [Pipelines as Code](/docs/developer/delivery/pac/)。
4. 需要人工卡点时，加入 [审批任务](/docs/developer/delivery/pipelines/approval-task/)。
5. 需要多环境发布时，参考 [持续交付](/docs/developer/best-practices/continuous-delivery/)。

## 相关文档

- [管理员视角](/docs/developer/delivery/pipelines/admin/)：流水线基础设施、权限和容量。
- [Repository 与 PipelineRun 配置](/docs/developer/delivery/pac/repository-and-pipelinerun/)：PAC 的仓库和运行配置。
- [运行管理与命令参考](/docs/developer/delivery/pac/manage/)：验证、触发、取消和清理 PipelineRun。
