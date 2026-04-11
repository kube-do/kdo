---
title: 观测平台(管理员)
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
| **Loki** | 日志聚合与查询（可选组件） | `http://loki.${DEFAULT_DOMAIN}` |
| **Alertmanager** | 告警路由与通知（邮件、企业微信等） | 与 Prometheus 集成 |

---

## 快速导航

### 管理任务

- [配置监控告警](/admin/observe/alerting/) - 设置告警规则和通知渠道
- [管理仪表盘](/admin/observe/dashboards/) - 查看集群健康度、资源利用率
- [日志查询](/admin/observe/logging/) - 全集群日志检索与分析
- [审计日志](/admin/observe/audit/) - Kubernetes API 审计追踪（待完善）

### 访问地址

假设集群默认域名为 `kube-do.dev`，访问入口：

- **Grafana**：http://grafana.kube-do.dev （admin/KdoGrafana2025）
- **Prometheus**：http://prometheus.kube-do.dev
- **Alertmanager**：http://alertmanager.kube-do.dev

---

## 功能概览

### 1. 集群监控

**监控对象：**
- 集群节点：CPU、内存、磁盘、网络
- Kubernetes 组件：kube-apiserver、etcd、kubelet、kube-scheduler
- 工作负载：Pod、Deployment、StatefulSet 的资源使用
- 自定义指标：应用业务指标（通过 Prometheus Annotations 暴露）

**预置仪表盘：**
- Cluster Overview：集群总览
- Node Monitoring：节点详细指标
- Kubernetes / Compute Resources：命名空间级资源使用
- etcd：核心组件健康度

### 2. 应用级监控（开发者视角）

开发者可通过 [开发者观测平台](/dev/observe/) 查看：
- 所属项目的环境概览
- 应用的 Pod 指标（CPU、内存、网络、文件系统）
- 应用事件（部署、扩缩、故障）
- 应用日志（实时查看和检索）

管理员可以：
- 为项目配置更细粒度的仪表盘
- 设置项目级别的告警规则
- 审核跨项目的资源争抢

### 3. 告警管理

**告警规则分类：**

| 级别 | 触发条件 | 通知方式 | 响应时间 |
|------|---------|---------|---------|
| **Critical** | 集群不可用、etcd 故障、Master 节点 Down | 电话、短信、企业微信 @负责人 | 立即 |
| **Warning** | 节点 NotReady、资源水位 >80%、Pod 频繁重启 | 企业微信、邮件 | 15 分钟内 |
| **Info** | 部署完成、配置变更 | 日志记录，可选通知 | 不紧急 |

**通知渠道配置：**
- 企业微信机器人（Webhook）
- 邮件（SMTP）
- Slack、钉钉、飞书（Webhook）
- PagerDuty、Opsgenie（集成）

### 4. 日志管理

**日志源：**
- 容器标准输出（stdout/stderr）
- 容器内文件（通过 Fluentd/Fluent Bit 采集）
- Kubernetes 审计日志（API Server 操作记录）
- 系统日志（节点 journald）

**日志索引：**
- 按命名空间、 Pod、容器标签过滤
- 全文检索（支持正则）
- 时间范围查询（最近 1h/6h/24h/7d）
- 日志流实时查看

**保留策略：**
- 应用日志：默认 7 天，可延长至 30 天
- 审计日志：默认 90 天（合规要求）
- 高频日志：压缩归档至对象存储（成本优化）

---

## 最佳实践

### 监控配置

- 📊 **遵循黄金指标**：Latency、Traffic、Errors、Saturation（4 个关键 SLO）
- 📊 **分层监控**：集群层 -> 节点层 -> 应用层 -> 业务层
- 📊 **Dashboard as Code**：将 Grafana Dashboard 以 JSON 格式版本化管理
- 📊 **标签规范**：所有资源添加统一的标签（如 `project`、`team`、`env`）

### 告警设计

- 🔔 **分级明确**：Critical、Warning、Info 分离，避免告警疲劳
- 🔔 **可操作**：每条告警附带处理步骤和负责人
- 🔔 **静默机制**：维护窗口期设置静默，避免无用通知
- 🔔 **持续优化**：定期复盘告警，删除无效规则，调整阈值

### 日志策略

- 📝 **结构化日志**：应用输出 JSON 格式日志，便于解析和查询
- 📝 **敏感信息脱敏**：避免在日志中记录密码、Token、个人隐私
- 📝 **日志分级**：使用 `info`、`warn`、`error` 等级别，便于过滤
- 📝 **日志周转**：高频日志设置合理的 `retention` 和 `compaction`

### 容量规划

- 📈 **趋势分析**：基于历史监控数据预测资源增长（至少 30 天）
- 📈 **阈值预警**：资源使用率 >70% 时触发 Warning，>85% 触发 Critical
- 📈 **自动扩缩**：结合 HPA（水平扩缩）和 VPA（垂直扩缩）应对突发流量
- 📈 **成本控制**：低利用率节点考虑合并或降配，避免资源浪费

---

## 常见问题

### Q: Grafana 无法显示数据？

- 检查 Prometheus 是否正常运行：`kubectl get pods -n monitoring`
- 确认 Data Source 配置：Grafana → Configuration → Data Sources → Prometheus
- 查看 Prometheus targets 页面，所有 target 应为 `UP` 状态
- 检查网络策略是否阻止 Grafana 访问 Prometheus

### Q: 告警不触发？

- 确认告警规则已加载：`kubectl get prometheusrules -n <namespace>`
- 查看 Prometheus 的规则评估状态：`kubectl get alert -n monitoring`（如果安装了 alertmanager）
- 手动测试规则：Prometheus Web UI → Alerts → 查看规则详情
- 确认 Alertmanager 配置了正确的接收器（`alertmanager-config` ConfigMap）

### Q: Pod 日志查不到？

- 确认 Fluentd/Fluent Bit 正在运行：`kubectl get pods -n logging`
- 检查 Pod 的标签是否与日志采集的 selector 匹配
- 确认日志存储后端（Elasticsearch/Loki）有足够容量
- 查看采集器日志：`kubectl logs -n logging <fluentd-pod>`

### Q: 如何添加自定义监控指标？

1. 应用代码暴露 Prometheus 指标端点（`/metrics`）
2. 创建 ServiceMonitor 或 PodMonitor CR 定义如何采集
3. 配置 Prometheus 自动发现并抓取
4. 在 Grafana 创建 Dashboard 展示

示例 ServiceMonitor：
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
    interval: 30s
```

---

## 安全建议

- 🔒 **访问控制**：Grafana、Prometheus 仅允许管理员和运维人员访问
- 🔒 **网络隔离**：将监控组件部署在独立命名空间，限制外部访问
- 🔒 **Secret 管理**：数据库密码、外部 API 密钥使用 Kubernetes Secrets
- 🔒 **审计开启**：Kubernetes API Server 启用审计日志，收集到中央日志系统

---

## 相关链接

- [开发者观测平台](/dev/observe/) - 项目和应用级监控
- [可观测性组件官方文档](https://prometheus.io/docs/, https://grafana.com/docs/)
- [Kubernetes 日志架构](https://kubernetes.io/docs/concepts/cluster-administration/logging/)
- [Kubernetes Monitoring 最佳实践](https://kubernetes.io/docs/tasks/debug/debug-cluster/monitoring/)
