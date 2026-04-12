---
title: 守护进程集(DaemonSet)
parent: 工作负载(管理员)
nav_order: 1
---

## 介绍

**DaemonSet** 确保每个（或部分）集群节点上都运行一个 Pod 副本。当新节点加入集群时，会自动部署 Pod；节点移除时，Pod 被回收。适用于需要在每个节点上运行的守护进程。

### 典型用例

- ✅ **日志收集**：Fluentd、Fluent Bit 在每个节点采集日志
- ✅ **监控**：Prometheus Node Exporter、Datadog Agent
- ✅ **网络插件**：Calico、Cilium 的 agent 组件
- ✅ **存储**：Ceph OSD、Glusterd
- ✅ **安全**：漏洞扫描 agent、入侵检测

---

## 快速开始

### 创建 DaemonSet

KDO 管理员界面提供 DaemonSet 管理功能：

1. 进入 **管理员界面 → 工作负载 → 守护进程集**
2. 点击 **新建守护进程集**
3. 填写表单：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | DaemonSet 标识 | `fluentd-agent` |
| **节点选择器** | 指定哪些节点运该 Pod（留空=所有节点） | `node-role.kubernetes.io/worker=` |
| **容忍度** | 容忍哪些节点的污点（如 master 节点） | `key: node-role.kubernetes.io/master, operator: Exists` |
| **容器镜像** | 守护进程镜像 | `fluent/fluentd:v1.14` |
| **端口** | Pod 暴露的端口（可选） | `24224` |
| **环境变量** | 配置注入 | `FLUENTD_CONF=fluent.conf` |
| **资源限制** | CPU/Memory 请求和限制 | 200m/256Mi |

4. 点击 **添加**

### 编辑 DaemonSet

1. DaemonSet 列表 → 点击名称进入详情
2. 点击 **编辑**（YAML 模式）
3. 修改配置后保存

**支持的修改：**
- ✅ 镜像版本（触发滚动更新）
- ✅ 环境变量、资源限制
- ✅ 节点选择器、容忍度

**不支持的修改：**
- ❌ `selector` 标签选择器（创建后不可更改）
- ❌ 某些卷配置（可能需要删除重建）

### 删除 DaemonSet

1. 列表页勾选 → **删除**
2. 确认是否保留 Pod：
   - **删除 DaemonSet 并清理 Pod**（默认）
   - **仅删除 DaemonSet，保留 Pod**（特殊情况）

---

## 详细说明

### DaemonSet 结构

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: my-agent
spec:
  selector:
    matchLabels:
      app: my-agent  # 必须匹配 template.metadata.labels
  template:
    metadata:
      labels:
        app: my-agent
    spec:
      containers:
      - name: agent
        image: my-agent:latest
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 200m
            memory: 512Mi
      tolerations:
      - key: node-role.kubernetes.io/master
        operator: Exists
      nodeSelector:
        node-type: worker
```

### 更新策略

DaemonSet 支持两种更新策略：

| 策略 | 行为 | 使用场景 |
|------|------|----------|
| `RollingUpdate`（默认） | 逐个节点滚动更新，控制 `maxUnavailable` | 大多数场景，保证服务不中断 |
| `OnDelete` | 仅手动删除 Pod 时才更新 | 需要精确控制更新时间 |

**RollingUpdate 参数：**

- `maxUnavailable`：更新期间最多不可用的 Pod 数量（可以是百分比或绝对值）
- `minReadySeconds`：新 Pod 就绪后等待多少秒才算真正就绪

### 节点选择与容忍

- **nodeSelector**：Pod 只会调度到标签匹配的节点
- **tolerations**：Pod 可以容忍节点的污点（taint），从而调度到对应节点

**常见组合：**

```yaml
# 运行在所有非 master 节点
nodeSelector:
  node-role.kubernetes.io/worker: ""
tolerations:
- key: node-role.kubernetes.io/master
  operator: Exists
  effect: NoSchedule
```

---

## 最佳实践

### 设计原则

- 🎯 **必要性判断**：是否真的需要每个节点都运行？某些场景用 Deployment + HPA 更合适
- 🎯 **轻量设计**：DaemonSet Pod 应占用资源少，避免影响在线业务
- 🎯 **高可用**：重要守护进程应支持多副本（但 DaemonSet 本身是每个节点一个）
- 🎯 **优雅退出**：处理 `SIGTERM`，完成数据 flush 后再退出

### 资源管理

- 📊 **资源限制**：设置合理的 requests/limits，避免节点资源耗尽
- 📊 **节点亲和/反亲和**：如果 DaemonSet 资源消耗大，可反亲和避免同节点多个 Intensive Pod

### 运维

- 🛠️ **监控**：DaemonSet Pod 健康度、资源使用率
- 🛠️ **滚动更新**：分批更新节点，观察稳定性
- 🛠️ **日志集中**：确保 DaemonSet 日志能采集到中央日志系统
- 🛠️ **版本控制**：DaemonSet YAML 纳入 Git

---

## 常见问题

### Q: DaemonSet 没有在新节点上创建 Pod？

- 检查节点标签：`kubectl get nodes --show-labels`，是否匹配 `nodeSelector`
- 检查节点污点：`kubectl describe node <node>`，DaemonSet 需要匹配的 `tolerations`
- 查看 DaemonSet 状态：`kubectl describe daemonset <name>`，看是否有调度失败的 Desired/Current 差异
- 事件：`kubectl get events --field-selector involvedObject.name=<daemonset-name>`

### Q: DaemonSet Pod 无法启动？

可能原因：
- 镜像拉取失败（网络/Secret）
- 资源不足（节点剩余 CPU/内存不足）
- 端口冲突（DaemonSet 使用 HostPort 时）
- 容器命令失败（检查日志：`kubectl logs -n <namespace> <pod-name>`）

### Q: 如何限制 DaemonSet 只运行在特定节点？

使用 `nodeSelector` 和 `tolerations`：

```yaml
spec:
  template:
    spec:
      nodeSelector:
        node-role.kubernetes.io/worker: ""
      tolerations:
      - key: "worker-only"
        operator: "Exists"
```

然后在目标节点打上对应标签和污点。

### Q: DaemonSet 更新不触发滚动更新？

DaemonSet 的 ` RollingUpdate` 仅在以下情况触发：
- Pod 模板变更（镜像、命令等）
- 节点加入/移除

如果修改了 `nodeSelector`，已存在的 Pod 不会立即迁移，需要手动删除 Pod 触发重建。

### Q: DaemonSet 占用资源太多怎么办？

- 优化应用资源使用
- 调整 `resources.requests/limits`
- 考虑是否真的需要 DaemonSet，还是用 Deployment + Node Affinity 更合适
- 对于数据密集型 DaemonSet（如存储），使用专用节点组

### Q: 可以设置 DaemonSet Pod 的优先级吗？

可以，在 Pod 模板中添加 `priorityClassName`：

```yaml
spec:
  template:
    spec:
      priorityClassName: high-priority  # 需要提前创建 PriorityClass
```

---

## 相关链接

- [Kubernetes DaemonSet 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)
- [Kubernetes 节点管理](/admin/management/nodes/)
- [Kubernetes 污点与容忍](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- [工作负载操作（Pod、Deployment 等）](/dev/workloads/)
