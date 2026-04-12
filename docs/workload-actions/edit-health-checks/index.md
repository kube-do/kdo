---
title: 设置健康检查
parent: 工作负载操作
---

## 介绍

健康检查（Health Checks）通过**存活探针（Liveness Probe）**和**就绪探针（Readiness Probe）**监控容器状态，确保 Kubernetes 只在容器健康时才路由流量，并在容器无响应时自动重启。

### 探针类型

| 探针 | 触发动作 | 使用时机 | 失败后果 |
|------|---------|---------|---------|
| **Liveness** | 容器存活检测 | 容器启动后定期执行 | 容器重启 |
| **Readiness** | 容器就绪检测 | 整个生命周期持续执行 | 从 Service 端点移除 |
| **Startup**（可选）| 慢启动检测 | 容器启动初期执行 | 阻止 Liveness/Readiness 过早执行 |

---

## 快速开始

### 添加健康检查

1. 进入目标工作负载（Deployment/StatefulSet）详情页
2. 点击 **操作** → **添加/编辑健康检查**
3. 选择探针类型：
   - **存活探针**：勾选启用
   - **就绪探针**：勾选启用

4. 配置 **检测方式**（三选一）：

#### HTTP GET

- **路径**：`/health` 或 `/ready`
- **端口**：容器端口号（如 `8080`）
- **HTTP 码**：成功状态码（默认 `200`）

**适用场景：** Web 应用、API 服务

#### 容器命令

- **命令**：Shell 命令，返回 `0` 表示成功
- 示例：`/bin/curl -f http://localhost:8080/health`

**适用场景：** 复杂检查逻辑、执行脚本

#### TCP 套接字

- **端口**：检查 TCP 连接是否可建立
- **适用场景：** 非 HTTP 服务（数据库、消息队列）

5. 调整 **探针参数**：

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| **初始延迟** | 容器启动后等待多少秒开始探测 | 10-30s（根据启动时间调整） |
| **检测周期** | 每隔多少秒探测一次 | 10s（默认）|
| **超时时间** | 每次探测超时时间 | 1-5s |
| **成功阈值** | 连续成功多少次视为健康 | 1-2 |
| **失败阈值** | 连续失败多少次视为不健康 | 3（默认）|

6. 点击 **添加** 保存

---

## 详细说明

### 探针执行流程

```
容器启动 → 等待 initialDelaySeconds → 开始周期性探测
  ↓
每次探测：
  - 执行检查（HTTP/命令/TCP）
  - 超时未响应 → 失败
  - 返回错误码/非零退出码 → 失败
  - 成功次数达到 successThreshold → 标记为健康
  - 失败次数达到 failureThreshold → 标记为不健康（触发重启或从 Service 移除）
```

### 探针配置示例

**HTTP GET（Spring Boot 应用）：**
```yaml
livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

**容器命令（数据库检查）：**
```yaml
livenessProbe:
  exec:
    command:
    - sh
    - -c
    - 'pgrep mysqld || exit 1'
  initialDelaySeconds: 20
  periodSeconds: 10
```

**TCP 端口检查（Redis）：**
```yaml
readinessProbe:
  tcpSocket:
    port: 6379
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## 探针选择指南

### 什么时候需要 Liveness Probe？

- 应用可能出现**死锁**（如线程池耗尽、死循环）
- 应用可能**内存泄漏**导致无响应
- 应用需要检测内部状态并重启恢复

**不需要的情况：**
- Deployment 已有 `restartPolicy: Always`，容器崩溃会自动重启
- 应用本身已经处理了重启逻辑（如 Spring Boot Actuator 的 `/restart`）

### 什么时候需要 Readiness Probe？

- 应用启动需要较长时间（加载数据、预热缓存）
- 应用启动后可能短暂不可用（如数据库连接初始化）
- 希望避免 Service 将流量路由到未就绪的 Pod

**强烈建议**：几乎所有生产应用都配置 Readiness Probe。

### Startup Probe（K8s 1.16+）

对于启动时间很长的应用（>30s），避免 Liveness Probe 在启动期间误杀：

```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30  # 允许最多 30 次失败（约 5 分钟）
  periodSeconds: 10
```

配置 Startup Probe 后，Liveness 和 Readiness 会等到 Startup 成功后才开始。

---

## 最佳实践

### 探针设计

- 🎯 **轻量检查**：探针逻辑应快速执行，避免成为性能瓶颈
- 🎯 **独立端点**：健康检查使用独立的 controller/handler，不依赖复杂业务逻辑
- 🎯 **幂等安全**：health 端点应该是只读的，不产生副作用
- 🎯 **区分 L/R**：Readiness 检查应比 Liveness 更严格（确保完全就绪）

### 参数调优

- ⏱️ **initialDelaySeconds**：足够长，让应用完成启动（观察启动日志估算）
- ⏱️ **periodSeconds**：检查不要太频繁（增加负载），也不要太稀疏（延迟发现问题）
- ⏱️ **failureThreshold**：允许短暂波动，避免误判（如 GC 暂停）

### 常见配置模板

**Java Spring Boot：**
```yaml
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 20
  periodSeconds: 5
```

**Node.js Express：**
```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

**数据库（MySQL）：**
```yaml
livenessProbe:
  exec:
    command:
    - mysqladmin
    - ping
    - -h
    - 127.0.0.1
  initialDelaySeconds: 30
  periodSeconds: 10
```

---

## 故障排查

### 场景 1：Pod 不断重启（CrashLoopBackOff）

可能原因：
- Liveness Probe 失败，K8s 不断重启
- 应用本身崩溃

**排查：**
```bash
kubectl logs <pod-name> --previous  # 查看上次容器的日志
kubectl describe pod <pod-name>    # 查看 Liveness 失败事件
```

**解决：**
- 调整 `initialDelaySeconds` 加大等待时间
- 检查应用日志，修复应用 bug
- 临时禁用 Liveness Probe（仅调试）

### 场景 2：Pod 处于 `Pending` 后未调度

Readiness Probe 失败不会影响调度。但如果没有配置 Readiness，Service 可能将流量发给未就绪的 Pod，导致连接失败。

**解决：** 配置合适的 Readiness Probe。

### 场景 3：扩缩容后流量中断

可能是新 Pod 的 Readiness Probe 过慢，导致 Service endpoint 未及时更新。

**解决：** 缩短 `periodSeconds` 和 `failureThreshold`，让新 Pod 更快进入 Ready 状态。

---

## 常见问题

### Q: 探针本身失败会影响应用吗？

探针失败只影响容器状态（重启或从 Service 移除），**不会**影响容器内的应用逻辑。但频繁重启可能导致服务中断。

### Q: 端口号填写错误？

- HTTP 端口必须是容器内部端口（不是 Service 端口）
- 确认容器 spec 中的 `containerPort` 或应用实际监听端口

### Q: Readiness Probe 失败，Pod 一直不 Ready？

- 检查应用是否真的就绪（日志）
- 探针路径是否正确（如 `/health` vs `/healthz`）
- 延迟/超时是否足够

---

## 相关链接

- [Kubernetes Probe 官方文档](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#container-probes)
- [Kubernetes Liveness Probe 指南](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Deployment 更新策略](/workload-actions/edit-update-strategy/)
- [HPA 自动扩缩](/workload-actions/hpa/)
