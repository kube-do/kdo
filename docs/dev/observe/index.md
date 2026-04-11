---
title: 观测平台
parent: 开发者界面
nav_order: 6
---

## 介绍

**观测平台**为开发者提供项目和应用级别的监控、日志、事件和告警能力，帮助你实时了解应用运行状态，快速定位问题。

开发者观测平台位于项目环境层面，与管理员视图的集群级监控互补。

---

## 主要功能

观测平台为每个项目环境提供以下 Tab 页面：

1. **仪表盘** - 项目资源概览、应用拓扑
2. **指标** - Pod/容器级别的 CPU、内存、网络、文件系统指标
3. **警报** - 当前激活的告警列表
4. **静默** - 告警静默规则（暂时抑制某些告警）
5. **事件** - 集群、命名空间、资源的事件流
6. **日志** - 全文本搜索、实时日志流、多容器日志聚合

---

## 快速导航

### 查看项目健康度

1. 进入 **开发者界面 → 项目 → 你的项目 → 环境（如 dev）**
2. 点击 **观测平台** Tab
3. 默认显示 **仪表盘**，查看：
   - 命名空间总览（Pod 数量、资源使用）
   - Top 应用资源排行榜
   - 节点健康状况

### 深入应用指标

1. 切换到 **指标** Tab
2. 选择要查看的 **应用** 或 **Pod**
3. 查看实时图表：
   - CPU Usage / Request
   - Memory Usage / Working Set
   - Network Rx/Tx
   - Filesystem Usage

### 查看应用日志

1. 切换到 **日志** Tab
2. 过滤条件：
   - **命名空间**：当前环境
   - **应用**：选择具体应用
   - **Pod**：单个 Pod 或多 Pod 聚合
   - **容器**：多容器应用选择特定容器
   - **时间范围**：最近 1h / 6h / 24h / 自定义
3. 搜索关键词（支持正则）
4. 实时追踪新日志（"Follow" 模式）

### 处理告警

1. 切换到 **警报** Tab
2. 查看当前 `Firing` 状态的告警
3. 点击告警查看详情：
   - 触发规则
   - 当前值 vs 阈值
   - 持续时间
   - 受影响资源
4. 可选：创建 **静默** 规则暂时抑制（如维护窗口）

### 追踪事件

1. 切换到 **事件** Tab
2. 查看命名空间内所有资源的 event 流：
   - Pod 调度、启动、删除
   - Deployment 滚动更新
   - PVC 绑定
   - OOMKill、CrashLoopBackOff
3. 使用过滤器缩小范围（资源类型、原因类型）

---

## 功能详解

### 1. 仪表盘

**预置面板：**

| 面板 | 说明 |
|------|------|
| 资源使用总览 | CPU/内存申请量 vs 使用量，存储使用 |
| Pod 状态分布 | Running / Pending / Failed / Succeeded 比例 |
| Top 5 Pods（CPU） | 消耗 CPU 最多的 Pod 列表 |
| Top 5 Pods（内存） | 消耗内存最多的 Pod 列表 |
| Deployments 健康度 | 可用副本比例、最新版本数 |
| Recent Events | 最近发生的 10 条事件 |

**自定义仪表盘：**
如果你有管理员权限或 Grafana 访问权限，可以在 Grafana 中创建更细粒度的项目 Dashboard。

---

### 2. 指标

指标数据来源于 Prometheus，展示时间序列图表。

**支持的指标：**

| 指标分类 | 示例 | 说明 |
|---------|------|------|
| CPU | `container_cpu_usage_seconds_total` | 容器 CPU 使用时间（秒） |
| 内存 | `container_memory_working_set_bytes` | 工作集内存（活跃内存） |
| 网络 | `container_network_transmit_bytes_total` | 发送字节数 |
| 文件系统 | `container_fs_usage_bytes` | 文件系统使用量 |
| Kubernetes 对象 | `kube_pod_info`、`kube_deployment_status_replicas` | Pod 数量、副本数 |

**如何使用：**

1. 在 **指标** Tab 选择 **查询模式**：
   - **预设图表**：常用指标快速查看
   - **自定义 PromQL**：输入 Prometheus 查询语言表达式
2. 选择时间范围：`5m` / `1h` / `6h` / `24h` / 自定义
3. 可选：添加到 Grafana Dashboard

**示例 PromQL：**

```promql
# Pod 的 CPU 使用率（核）
sum(rate(container_cpu_usage_seconds_total{pod="myapp-xxxx"}[5m])) by (pod)

# Pod 内存使用（字节）
container_memory_working_set_bytes{pod="myapp-xxxx"}

# Ingress 请求率（QPS）
sum(rate(nginx_ingress_controller_requests[5m])) by (service)
```

---

### 3. 警报

警报规则通常由管理员在集群层面定义，但开发者可以：

- 查看自己项目的告警
- 确认告警并标记已处理
- 创建静默规则减少干扰

**告警状态：**

| 状态 | 说明 |
|------|------|
| **Firing** | 告警条件满足，正在触发 |
| **Pending** | 条件满足，但等待 `for` 持续时间后转为 Firing |
| **Resolved** | 条件已恢复，问题解决 |

**常见告警示例：**

| 告警名称 | 触发条件 | 严重性 | 建议处理 |
|---------|---------|--------|---------|
| `HighPodCPU` | Pod CPU 使用率 > 80% 持续 5m | Warning | 检查代码性能或扩容 |
| `PodCrashLooping` | Pod 重启次数 > 5 次/小时 | Critical | 查看日志，修复应用错误 |
| `DeploymentReplicasMismatch` | 可用副本 < 期望副本 | Warning | 检查 Pod 状态、资源 |
| `PVCNotBound` | PVC 处于 Pending 超过 10m | Warning | 检查 StorageClass 或容量 |

---

### 4. 静默

静默（Silence）用于暂时抑制告警通知，适用于：

- 计划内维护窗口
- 已知问题且正在修复中
- 临时的高流量峰值（短期可接受）

**创建静默：**

1. 进入 **警报** Tab → 选择一条告警 → **创建静默**
2. 设置：
   - **开始时间**：立即或指定时间
   - **结束时间**：静默持续时间（如 1h、4h、自定义）
   - **原因**：简要说明（如 "升级中"、"调试中"）
3. 保存后，匹配的告警将不再发送通知，但仍显示在 UI 中（标记为 `Silenced`）

**管理静默：**
- **查看活跃静默**：切换到 **静默** Tab
- **提前结束**：手动删除未到期的静默规则
- **审核历史**：已过期的静默保留记录供复盘

---

### 5. 事件

事件（Events）是 Kubernetes 资源状态变化的记录，是排查问题的第一手资料。

**事件类型：**

| 资源类型 | 典型事件 | 用途 |
|---------|---------|------|
| Pod | `Started`、`Failed`、`Killing`、`OOMKilled` | 诊断 Pod 生命周期 |
| Deployment | `ScalingReplicaSet`、`NewReplicaSetAvailable` | 跟踪滚动更新 |
| PVC | `Provisioning`、`Bound`、`Failed` | 存储问题排查 |
| Ingress | `Sync`、`Success`、`Failed` | Ingress 配置变更 |

**过滤：**
- 按命名空间（默认当前环境）
- 按资源类型（Pod/Deployment/PVC/...）
- 按事件原因（`Failed`、`Created`、`Started`）
- 按消息关键词（全文搜索）

**事件保留：**
Kubernetes 默认保留 1 小时，KDO 扩展配置可将事件聚合到中央日志系统（可保留更久）。

---

### 6. 日志

日志是应用调试和审计的核心。KDO 聚合所有容器的标准输出到统一日志后端。

**日志源：**
- 容器 stdout/stderr
- 通过 sidecar 采集的文件日志（可选）

**检索功能：**

| 功能 | 说明 |
|------|------|
| 实时流 | 类似 `tail -f`，实时追踪日志输出 |
| 历史查询 | 按时间范围、容器过滤 |
| 全文搜索 | 支持 Lucene 语法、正则表达式 |
| 上下文 | 查看日志前后行（如 `...` 展开更多） |
| 高亮关键词 | 错误信息（ERROR、Exception）自动高亮 |
| 多容器对比 | 并列查看多个容器的日志（微服务调试） |

**使用示例：**

1. 进入日志页面，选择：
   - 命名空间：`myproject-dev`
   - 应用：`myapp`
   - 容器：`myapp`（主容器）或 `sidecar`（辅助容器）
2. 输入搜索：`error OR exception`（查找错误）
3. 点击 **搜索**，结果按时间倒序显示
4. 点击某条日志，显示完整上下文和 JSON 解析（如果结构化日志）

---

## 最佳实践

### 日常监控

- 📊 **每日检查**：早上花 5 分钟查看项目仪表盘，确认 Pod 健康度、资源水位
- 📊 **关注异常**：持续 ↑ 的 CPU/内存使用率、频繁重启的 Pod、Pending 事件
- 📊 **告警响应**：收到企业微信告警后，立即到观测平台定位问题

### 日志管理

- 📝 **结构化日志**：应用输出 JSON 格式日志，便于解析和过滤
- 📝 **日志分级**：区分 `info`、`warn`、`error`，在告警策略中合理使用
- 📝 **敏感信息脱敏**：避免记录密码、Token、用户隐私
- 📝 **日志轮转**：应用日志避免无限增长，使用 logrotate 或外部收集

### 资源优化

- 📈 **及时扩缩**：资源持续 >70% 时考虑提高副本数或资源配额
- 📈 **内存泄漏检测**：内存使用持续增长不降，可能是内存泄漏
- 📈 **优雅关闭**：应用捕获 SIGTERM，完成请求后再退出，避免请求中断

---

## 常见问题

### Q: 指标为何延迟或不完整？

- Prometheus 抓取间隔默认 30s，可能有延迟
- 如果应用刚启动，可能需要第一个抓取周期后才显示
- 检查 Prometheus 是否正常：`kubectl get pods -n monitoring`

### Q: 日志查不到某些 Pod？

- 确认 Pod 处于 Running 状态（Terminating/Pending Pod 可能停止上报日志）
- 检查日志采集器（Fluentd/Fluent Bit）是否捕获该 Pod（查看其配置文件）
- 确保 Pod 没有配置 `log-driver` 非标准输出

### Q: 告警误报太多怎么办？

- 调整规则阈值（如 CPU 从 90% 调到 95%）
- 延长 `for` 持续时间（如 `5m` 改为 `10m`）
- 为临时维护创建 **静默** 规则
- 联系管理员优化规则（可能规则过于敏感）

### Q: 如何导出指标或日志？

**导出指标：**
- Prometheus Web UI → Graph → 执行 PromQL → Download as CSV

**导出日志：**
- 日志搜索结果 → 点击 **导出** 按钮（JSON/CSV）
- 或使用 API：`GET /api/v1/namespaces/{ns}/pods/{pod}/log`

---

## 与管理员观测平台的区别

| 维度 | 开发者视角 | 管理员视角 |
|------|----------|----------|
| **范围** | 单个项目/环境 | 整个集群 |
| **仪表盘** | 项目资源、应用拓扑 | 集群节点、所有命名空间、所有资源 |
| **告警** | 仅查看自己的告警 | 定义规则、管理通知 |
| **日志** | 项目内日志 | 审计日志、系统日志、跨项目日志 |
| **权限** | 仅本项目的资源 | 所有资源 |

**提示：** 如果你需要查看集群级信息，请登录管理员账号或联系集群管理员。

---

## 相关链接

- [管理员观测平台](/admin/observe/) - 集群级监控
- [可观测性组件文档](/observability/)
- [Prometheus 查询语言 (PromQL)](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Kubernetes Events 指南](https://kubernetes.io/docs/concepts/cluster-administration/system-logs/)
