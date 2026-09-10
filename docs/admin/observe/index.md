---
title: 观测平台（管理员）
parent: 管理员界面
nav_order: 6
---

## 介绍

**观测平台**（Observability）为集群管理员提供全局的监控、日志、告警和审计能力。与开发者视角侧重单个应用不同，管理员观测平台关注整个集群的健康状态、性能指标和安全合规。

### 核心组件

KDO 平台集成了以下开源可观测性组件：

| 组件 | 功能 | 默认访问地址 |
|------|------|--------------|
| **Prometheus** | 指标采集与存储，支持自定义告警规则 | `http://prometheus.${DEFAULT_DOMAIN}` |
| **Grafana** | 监控大屏展示，预置集群、项目、节点仪表盘 | `http://grafana.${DEFAULT_DOMAIN}` |
| **Loki** | 日志聚合与查询 | `http://loki.${DEFAULT_DOMAIN}` |
| **Alertmanager** | 告警路由与通知（邮件、企业微信等） | 与 Prometheus 集成 |

## 管理任务

- **监控与告警**：[监控(Monitoring)](/docs/observability/monitoring/) - 指标采集、集群监控、告警规则与通知渠道
- **告警配置**：[告警配置(Alertmanager)](/docs/observability/monitoring/alertmanager/) - 告警路由、分组与静默
- **仪表盘**：[仪表盘(Dashboard)](/docs/observability/monitoring/dashboards/) - 集群健康度、资源利用率看板
- **日志**：[日志(Logging)](/docs/observability/logging/) - 全集群日志检索、审计日志与保留策略
- **事件**：[事件(Event)](/docs/observability/events/) - 集群级事件流

## 访问地址

假设集群默认域名为 `kube-do.dev`，访问入口：

- **Grafana**：http://grafana.kube-do.dev （admin/KdoGrafana2025）
- **Prometheus**：http://prometheus.kube-do.dev
- **Alertmanager**：http://alertmanager.kube-do.dev

## 应用级监控（开发者视角）

开发者可通过 [开发者观测平台](/docs/dev/observe/) 查看所属项目的环境概览、应用 Pod 指标、事件与日志。

管理员可以：
- 为项目配置更细粒度的仪表盘
- 设置项目级别的告警规则
- 审核跨项目的资源争抢

## 安全建议

- 🔒 **访问控制**：Grafana、Prometheus 仅允许管理员和运维人员访问
- 🔒 **网络隔离**：将监控组件部署在独立命名空间，限制外部访问
- 🔒 **Secret 管理**：数据库密码、外部 API 密钥使用 Kubernetes Secrets
- 🔒 **审计开启**：Kubernetes API Server 启用审计日志，收集到中央日志系统

## 相关链接

- [开发者观测平台](/docs/dev/observe/) - 项目和应用级监控
- [可观测性概览](/docs/observability/) - 组件文档与技术专题