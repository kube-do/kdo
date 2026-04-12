---
title: 编辑资源限制
parent: 工作负载操作
---

## 介绍

为容器设置 **CPU 和内存的资源请求（requests）和限制（limits）**，是保证集群稳定性和公平性的关键。合理的资源配置可以避免应用相互争抢资源，同时确保关键应用获得足够资源。

---

## 快速开始

### 编辑 Deployment/StatefulSet 的资源限制

1. 进入目标工作负载详情页
2. 点击 **操作** → **编辑资源限制**
3. 在表格中为每个容器设置：

| 字段 | 说明 | 示例 | 必填 |
|------|------|------|------|
| **CPU 请求** | 容器保障的最小 CPU | `500m`（0.5 核） | ❌（但强烈建议） |
| **CPU 限制** | 容器可使用的最大 CPU | `2000m`（2 核） | ❌（建议） |
| **内存请求** | 容器保障的最小内存 | `256Mi` | ❌（强烈建议） |
| **内存限制** | 容器可使用的最大内存 | `1Gi` | ❌（建议） |

4. 点击 **添加** 保存

**注意：** 如果留空，Kubernetes 使用 `BestEffort` QoS，资源紧张时容器可能被杀死。

---

## 详细说明

### Requests vs Limits

| 维度 | Requests | Limits |
|------|----------|--------|
| **作用** | 调度依据，节点必须能提供 | 硬上限，超过可能被 Throttled 或 OOMKilled |
| **CPU** | 可超用（如果节点空闲） | 不能超过，超过被限流（throttling）|
| **内存** | 实际可超过（但风险高） | 不能超过，超过被 OOMKill |

### 资源单位

**CPU：**
- `m` = millicores（毫核），`1000m` = 1 核
- 整数：`1`、`2` 表示核数
- 小数：`0.5`（或 `500m`）

**内存：**
- `Mi` = Mebibyte（2^20），如 `256Mi`、`1Gi`
- `M` / `G` = Megabytes/Gigabytes（10^6/10^9），如 `512M`、`2G`
- 建议使用 `Mi`/`Gi`（K8s 标准）

---

## 最佳实践

### 设置原则

- 🎯 **基于监控设置**：观察应用实际资源使用（Prometheus + Grafana），设置合理的请求值
- 🎯 **Limit = Request × 1.5-2**：预留缓冲应对峰值，但避免过高（资源浪费）
- 🎯 **内存 limit ≥ 请求 × 1.2**：内存不能超卖，limit 应略高于实际峰值
- 🎯 **JVM 应用特殊**：如果使用 Java，`-Xmx` 应与容器 memory limit 匹配（留 10-20% 给堆外）

### 配置示例

**普通 Web 应用（Node.js/Python）：**
```yaml
resources:
  requests:
    cpu: "200m"
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```

**Java 应用（Spring Boot）：**
```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "1000m"
    memory: "2Gi"
  # 同时 JVM 参数：-Xmx1g（小于 container memory limit）
```

**数据库（MySQL/PostgreSQL）：**
```yaml
resources:
  requests:
    cpu: "2000m"
    memory: "4Gi"
  limits:
    cpu: "4000m"
    memory: "8Gi"
```

---

## QoS 等级

Kubernetes 根据 requests 和 limits 设置自动划分 **QoS（服务质量）** 等级：

| 等级 | 条件 | 资源紧张时优先级 |
|------|------|------------------|
| **Guaranteed** | 所有容器都设置了 **相等** 的 requests 和 limits | 最高（最后被驱逐） |
| **Burstable** | 至少一个容器设置了 requests（但 limits > requests） | 中等 |
| **BestEffort** | 所有容器都没设置 requests/limits | 最低（最先被驱逐） |

**建议：** 生产所有应用都应至少达到 `Burstable` 级别（即设置 requests）。

---

## 常见问题

### Q: 不设置资源限制会怎样？

- **QoS = BestEffort**：节点资源不足时，这类 Pod 最先被驱逐
- **资源争抢**：没有 limits 的 Pod 可能占用大量 CPU/内存，影响其他应用
- **调度失败**：如果节点资源严重不足，甚至无法调度

### Q: CPU 设置 limits 后变慢？

CPU limits 超出后，Linux CFS 会对容器进行**限流（throttling）**，导致应用变慢。

**现象：**
- 应用响应延迟增加
- CPU 使用率一直接近 `limit`，但实际 work 做不完

**解决：**
- 提高 CPU limits
- 检查应用是否真的需要这么多 CPU
- 调整应用内部线程池、并发数

### Q: 内存 OOMKilled？

容器尝试使用超过 `limits.memory` 的内存时，K8s 会发送 `SIGKILL` 杀死容器。

**排查：**
```bash
kubectl logs <pod-name> --previous  # 查看被杀死的容器日志
kubectl describe pod <pod-name>     # 查看 OOMKilled 事件
kubectl top pod <pod-name>          # 查看实际内存使用峰值
```

**解决：**
- 提高 memory limits
- 优化应用内存使用（如 JVM 调优、减少缓存）
- 确认 `requests.memory` 是否过小，导致调度到内存不足的节点

### Q: Requests 设置过大会怎样？

- **调度困难**：节点剩余资源不足，Pod 卡在 `Pending`
- **资源浪费**：即使 Pod 只用 10% 的 CPU，K8s 也会预留 `requests.cpu` 给该 Pod，导致节点"假性不足"

**建议：** requests 设置为应用**基线需求**，limits 设置为**峰值需求**。

---

## 与 HPA 的关系

HPA（水平自动扩缩）基于 CPU/内存使用率（相对于 requests 的百分比）触发扩缩容：

```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 80  # 当 CPU 使用率超过 requests 的 80% 时扩容
```

因此，**requests 设置直接影响 HPA 行为**：
- requests 设得太高 → HPA 阈值难以触发（实际使用率低）
- requests 设得太低 → HPA 过早扩容，可能过度

建议设置后通过监控验证 HPA 行为是否符合预期。

---

## 相关链接

- [Kubernetes 资源管理官方文档](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Kubernetes QoS 等级](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)
- [Kubernetes HPA 文档](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Java 应用容器化最佳实践](https://kubernetes.io/docs/tutorials/configuration/configure-java-pod/)
