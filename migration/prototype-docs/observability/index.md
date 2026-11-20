---
title: 可观测性
description: KDO 可观测性中心：监控、日志、事件、告警和仪表盘的统一入口。
doc_type: how-to
audience: [admin, developer]
applies_to: ">= v2026.11"
tags: [可观测性, 监控, 日志, 事件, 告警]
owner: docs-observability
last_reviewed: 2026-11-20
status: stable
sidebar_label: 可观测性
sidebar_position: 1
---

# 可观测性

可观测性中心是监控、日志、事件和告警的唯一入口。开发者不再从 `dev/observe` 进入，管理员也不再从 `admin/observe` 进入。

| 域 | 用途 |
|---|---|
| [监控](/docs/observability/monitoring/) | 指标采集、Grafana 仪表盘、告警规则 |
| 日志 | Loki 日志检索、日志告警 |
| 事件 | Kubernetes 事件和平台事件 |
| 告警 | 规则、通知渠道、静默、历史 |
| 仪表盘 | 集群、项目、应用级视图 |

:::note
本页是样板站占位页。正式迁移时会把现有 `observability/*`、`dev/observe`、`admin/observe` 合并到这里，删除重复入口。
:::
