---
title: 观测平台
nav_order: 5
---

# 观测平台

可观测性中心是 KDO 平台的核心组件之一，提供全面的监控、日志和事件管理能力，帮助您实时洞察应用和基础设施的运行状态。

## 核心价值

- **主动发现**：实时监控指标，在问题影响用户前提前预警
- **快速定位**：集中日志检索，快速 pinpoint 故障根因
- **统一视图**：一个平台查看集群、应用、中间件状态
- **智能告警**：基于阈值和异常检测的灵活告警策略

## 主要功能

观测平台由三个核心模块组成：

### 📊 [监控 (Monitoring)](/docs/observability/monitoring/)

提供集群和应用的指标监控，包括资源利用率、应用性能指标（APM）、自定义仪表板等。集成 Prometheus + Grafana 技术栈，支持丰富的图表和告警规则。

> **典型场景**：CPU/内存水位监控、Pod 重启告警、请求延迟追踪

### 📝 [日志 (Logging)](/docs/observability/logging/)

统一收集应用和系统日志，支持全文检索、结构化查询、日志分段和导出。使用 Loki + Grafana 实现日志的高效存储和可视化。

> **典型场景**：应用错误日志排查、审计日志追踪、日志归档

### 🔔 [事件 (Event)](/docs/observability/events/)

管理集群事件、告警通知和事件历史。支持多种通知渠道（邮件、钉钉、企业微信），提供事件的订阅、聚合和静默机制。

> **典型场景**：节点故障通知、部署事件通知、告警收敛

## 快速入门

### 1️⃣ 前置条件

- KDO 平台已成功部署（参考[安装指南](/docs/install/)）
- 您具有 `admin` 或 `devops` 角色权限（参考[RBAC 文档](/docs/rbac/)）
- 集群节点已安装必要的监控代理（通常由平台自动部署）

### 2️⃣ 首次访问

1. 登录 KDO 开发者控制台
2. 在左侧导航栏找到 **「可观测性」→「监控面板」**
3. 系统会自动打开 Grafana 仪表板，查看预置的集群概览视图

### 3️⃣ 常用操作

- **查看集群健康**：访问「监控面板」查看集群整体指标
- **搜索日志**：在「全局日志」中输入关键词或选择标签过滤
- **配置告警**：进入「告警规则」创建阈值告警，并配置通知接收人

## 架构概览

```
[应用/基础设施] → 指标/日志采集 → 存储后端 → 可视化界面
      ↓
  告警引擎 → 多渠道通知
```

- **数据采集**：Prometheus Node Exporter、Loki Promtail、Kubernetes 事件监听器
- **存储**：Prometheus TSDB、Loki（对象存储后端可选）
- **可视化**：Grafana（预置仪表板）
- **告警**：Prometheus Alertmanager、自定义 Webhook

## 最佳实践

### 📌 监控

- **合理设置阈值**：避免误报，根据历史 95 分位数设置告警值
- **使用分层仪表板**：集群级、命名空间级、应用级视图分开
- **启用长时监控**：配置数据保留策略（建议 30 天以上）

### 📌 日志

- **结构化日志**：应用输出 JSON 格式，方便字段检索
- **标签规范**：为日志统一添加 `app`、`env`、`cluster` 等标签
- **日志分级**：区分 `info`、`warn`、`error` 级别，便于过滤

### 📌 告警

- **告警分级**：P0（立即处理）、P1（2h响应）、P2（24h响应）
- **收敛策略**：设置告警分组和静默期，避免告警风暴
- **轮值负责**：通过企业微信群机器人通知到对应值班群

## 常见问题 (FAQ)

<details>
<summary>Q: 监控指标显示不完整怎么办？</summary>

A: 检查目标节点的 `node-exporter` 是否正常运行，确认 Prometheus 成功抓取目标状态。可以在 Prometheus 的「Targets」页面查看 scrape 状态。
</details>

<details>
<summary>Q: 日志搜索慢如何处理？</summary>
A: 检查 Loki 存储后端是否健康，查询时间范围是否过大。建议缩小时间窗口或添加标签过滤。若长期存在性能问题，考虑增加 Loki 实例或扩展存储。
</details>

<details>
<summary>Q: 如何定制自己的仪表板？</summary>
A: 登录 Grafana，进入「Dashboards → Create」创建新仪表板，添加 Panel 并选择 Prometheus 数据源。完成后可导出 JSON 或保存为团队模板。
</details>

---

**相关链接**

- [监控详细指南](/docs/observability/monitoring/)
- [日志完整配置](/docs/observability/logging/)
- [事件与告警](/docs/observability/events/)
- [系统架构](/docs/architecture/)
- [联系运维团队](mailto:ops@kube-do.cn)




