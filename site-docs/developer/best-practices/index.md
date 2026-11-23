---
title: "最佳实践"
description: "汇总 KDO 的持续交付、多环境发布、应用模板和 Git 分支协作实践。"
sidebar_position: 0
doc_type: explanation
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

本栏目收录跨应用、跨环境的交付实践。它们不是单个功能的操作步骤，而是把应用、流水线、环境和分支策略组合起来的推荐做法。

## 实践主题

| 主题 | 适用场景 | 入口 |
|------|----------|------|
| 持续交付 | 从源码、镜像或应用模板持续发布 | [持续交付](/docs/developer/best-practices/continuous-delivery/) |
| 多环境交付 | dev、test、stage、prod 环境分层发布 | [多环境交付](/docs/developer/best-practices/continuous-delivery/multi-env/) |
| 应用模板 | 把应用发布为可复用模板 | [应用模板](/docs/developer/best-practices/continuous-delivery/application-templates/) |
| Git 分支策略 | Git Flow、GitHub Flow、Trunk Based Development | [分支策略](/docs/developer/best-practices/gitflow/) |

## 选择建议

- 团队刚接入 KDO 时，先用 [创建 Git 应用](/docs/developer/applications/git/) 打通单应用交付。
- 需要多环境时，再引入 [多环境交付](/docs/developer/best-practices/continuous-delivery/multi-env/)。
- 分支模型应与发布节奏匹配；不要让分支策略反过来限制交付频率。
- 把环境差异放进配置和部署清单，不要复制多套流水线。

## 相关文档

- [Pipelines as Code](/docs/developer/delivery/pac/)：用 Git 事件驱动流水线。
- [流水线](/docs/developer/delivery/pipelines/)：标准流水线和审批任务。
- [配置管理](/docs/developer/configuration/)：ConfigMap 和 Secret。
