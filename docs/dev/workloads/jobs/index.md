---
title: 任务(Job)
parent: 工作负载
nav_order: 6
---

## 介绍

**Job** 是 Kubernetes 中用于执行一次性任务的 Workload。与长期运行的 Deployment 不同，Job 会创建一个或多个 Pod，运行到成功完成为止，然后停止。适用于批处理、数据迁移、初始化任务等场景。

### 典型用例

- ✅ **数据库迁移**：升级 Schema、初始化数据
- ✅ **批处理计算**：ETL 作业、报表生成
- ✅ **一次性服务**：临时爬虫、数据同步
- ✅ **初始化任务**：集群首次启动的配置任务

---

## 快速开始

### 创建 Job

1. 进入 **开发者界面 → 工作负载 → 任务**
2. 点击 **新建任务**
3. 填写配置：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | Job 标识 | `db-migrate` |
| **并行数** | 同时运行多少个 Pod | `1`（默认） |
| **完成数** | 需要成功多少个 Pod 才算 Job 完成 | `1` |
| **容器镜像** | 任务使用的镜像 | `mysql:8.0` |
| **命令** | 容器启动命令（如不需要可空） | `["sh", "-c", "mysql -h db < schema.sql"]` |
| **参数** | 命令参数 | `["-e", "ENV=prod"]` |
| **环境变量** | 注入配置 | `DB_HOST=mysql.prod.svc` |
| **资源限制** | CPU/Memory 请求和限制 | 默认 100m/128Mi |

4. 点击 **添加**

### 查看 Job 状态

在 **任务** 列表页：

- **状态**：`Running`、`Succeeded`、`Failed`
- **成功数/并行数**：如 `1/1` 表示已完成
- **完成时间**：Job 结束时间

点击 Job 名称进入详情，可以：
- 查看 **Pod 列表**（Job 创建的 Pod）
- 查看 **日志**（Pod 的标准输出）
- 查看 **事件**（调度、启动、完成记录）

---

## 详细说明

### Job 工作原理

Job 控制器持续监控，确保指定数量的 Pod 成功终止：

1. **创建 Pod**：根据 `parallelism` 并行创建指定数量的 Pod
2. **监控执行**：Pod 运行任务命令
3. **成功判定**：Pod 以退出码 `0` 结束视为成功
4. **重试机制**：失败 Pod 会根据 `backoffLimit` 重试（默认 6 次）
5. **完成标记**：成功 Pod 数量达到 `completions` 后，Job 标记为 `Complete`

### 关键配置

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: example-job
spec:
  # 并行执行的 Pod 数量
  parallelism: 1
  # 总共需要成功多少个 Pod
  completions: 1
  # 失败重试次数上限
  backoffLimit: 6
  # Pod 模板
  template:
    spec:
      restartPolicy: OnFailure  # Job 必须是 OnFailure 或 Never
      containers:
      - name: main
        image: alpine
        command: ["sh", "-c", "echo Hello; sleep 5"]
```

### 重启策略

Job 的 `restartPolicy` 只能是：

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| `OnFailure` | 容器失败时重启（默认） | 大多数任务，容忍临时故障 |
| `Never` | 无论成功失败都不重启 | 只需运行一次的任务，日志留存 |

**注意：** `Always` 不允许用于 Job，那是 Deployment 用的。

---

## 高级用法

### 1. 并行 Job

设置 `parallelism > 1` 可同时运行多个 Pod：

```yaml
parallelism: 3  # 同时运行 3 个 Pod
completions: 10  # 总共需要 10 个成功
```

效果：每次启动 3 个 Pod，直到累计成功 10 个。

**适用场景：**
- 分片处理大数据集
- 压力测试并发请求
- 分布式计算（如 Spark on K8s）

### 2. 带索引的 Pod

Kubernetes 1.21+ 支持 `index` 字段：

```yaml
spec:
  completions: 5
  template:
    spec:
      containers:
      - name: worker
        image: my-worker
        command: ["sh", "-c", "echo Processing index $JOB_COMPLETION_INDEX"]
```

Pod 名称会带有索引：`example-job-9cx2l` → 环境变量 `JOB_COMPLETION_INDEX=0`

### 3. 定时任务 (CronJob)

如果需要周期性执行，使用 [CronJob](/dev/workloads/cronjobs/) 而非手动创建 Job。

---

## 最佳实践

### 任务设计

- 🎯 **幂等性**：任务应可重复执行而不产生副作用（或已处理副作用）
- 🎯 **资源限制**：设置合理的 CPU/Memory，避免资源争抢
- 🎯 **超时控制**：使用 `activeDeadlineSeconds` 防止任务卡死
- 🎯 **优雅退出**：处理 `SIGTERM` 信号，完成当前步骤再退出

### 监控与排查

- 📊 **查看日志**：Job 详情的 Pod 列表 → 点击 Pod → 日志
- 📊 **失败分析**：`kubectl describe job <name>` 查看事件
- 📊 **清理策略**：Job 完成后，Pod 默认保留，可手动删除或设置 TTL

### 清理策略

Kubernetes 1.21+ 支持 **TTL（Time To Live）**：

```yaml
spec:
  ttlSecondsAfterFinished: 3600  # Job 完成后 1 小时自动删除
```

避免 Job 积累占用资源。

---

## 常见问题

### Q: Job 卡在 `Running` 状态？

- Pod 可能仍在运行，检查 Pod 日志：`kubectl logs job/<job-name>`
- Pod 可能 `Pending`（调度问题）：`kubectl get pod -o wide`
- 确认容器命令是否前台运行（如果是后台进程，Pod 会立即退出，Job 认为成功）

### Q: Job 失败重试次数太多？

检查 `backoffLimit`（默认 6 次）。如果任务不稳定，可以：

- 提高 `backoffLimit`（如 10）
- 或修复任务本身的错误（查看失败 Pod 日志）

### Q: Job 完成后 Pod 一直存在？

默认 Job 的 Pod 不会自动删除，以便查看日志。可以：

- 手动删除：`kubectl delete pod --jobs-name=<job-name>`
- 设置 TTL：`spec.ttlSecondsAfterFinished: 300`
- 使用 `kubectl delete job --cascade=orphan` 保留 Pod 只删除 Job 对象

### Q: Job 能同时运行多个副本吗？

可以，通过 `parallelism` 控制并发数，`completions` 控制总成功数。例如：

- `parallelism: 2`, `completions: 5` → 同时 2 个 Pod，总共成功 5 个后 Job 完成

### Q: Job 和 CronJob 区别？

- **Job**：一次性执行，手动或触发器创建
- **CronJob**：基于 Cron 表达式定时创建 Job

---

## 相关链接

- [Kubernetes Job 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [Kubernetes CronJob 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/cron-job/)
- [工作负载操作（扩缩、更新、健康检查）](/workload-actions/)
- [Pod 生命周期](/dev/workloads/pods/)
