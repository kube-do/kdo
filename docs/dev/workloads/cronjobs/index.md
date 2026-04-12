---
title: 计划任务(CronJob)
parent: 工作负载
nav_order: 5
---

## 介绍

**CronJob** 基于 Cron 定时器周期性地创建 Job 来执行任务。适用于定时备份、数据同步、定时报告、周期性清理等自动化运维场景。

### 典型用例

- ✅ **定时备份**：每天凌晨 2 点备份数据库到对象存储
- ✅ **数据同步**：每小时从外部 API 拉取数据同步到内部
- ✅ **报表生成**：每周一早上生成业务报表发送邮件
- ✅ **资源清理**：每天删除过期的日志、临时文件
- ✅ **健康检查**：每 5 分钟执行一次服务健康探测

---

## 快速开始

### 创建 CronJob

1. 进入 **开发者界面 → 工作负载 → 计划任务**
2. 点击 **新建计划任务**
3. 填写表单：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | CronJob 标识 | `daily-backup` |
| **Cron 表达式** | 调度时间（分 时 日 月 周） | `0 2 * * *`（每天 2 点）|
| **时区** | 可选，默认 UTC | `Asia/Shanghai` |
| **并发策略** | `Allow` / `Forbid` / `Replace` | `Forbid`（禁止并发） |
| **任务超时** | Job 最长运行时间 | `3600`（秒）|
| **历史保留** | 保留多少成功/失败 Job | `3` |
| **容器镜像** | 任务使用的镜像 | `mysql:8.0` |
| **命令** | 启动命令 | `["sh", "-c", "mysqldump ..."]` |
| **环境变量** | 配置注入 | `BACKUP_DIR=/backup` |
| **资源限制** | CPU/Memory | 默认 100m/128Mi |

4. 点击 **添加**

### Cron 表达式语法

CronJob 使用标准的 5 位 Cron 格式：

```
* * * * *
│ │ │ │ │
│ │ │ │ └── 周的某天 (0-6) (0=周日)
│ │ │ └──── 月份 (1-12)
│ │ └────── 月的某天 (1-31)
│ └──────── 小时 (0-23)
└────────── 分钟 (0-59)
```

**常用示例：**

| 表达式 | 含义 |
|--------|------|
| `0 * * * *` | 每小时整点 |
| `*/5 * * * *` | 每 5 分钟 |
| `0 0 * * *` | 每天午夜 00:00 |
| `0 2 * * *` | 每天凌晨 2 点 |
| `0 2 1 * *` | 每月 1 号凌晨 2 点 |
| `0 9 * * 1` | 每周一 9 点 |
| `@daily` | 每天午夜（等价于 `0 0 * * *`） |
| `@hourly` | 每小时整点（等价于 `0 * * * *`） |

**在线工具推荐：** [crontab.guru](https://crontab.guru/) 验证表达式。

---

## 详细说明

### 1. 起始时间（Starting Deadline）

CronJob 有一个 `startingDeadlineSeconds` 参数（默认无限制），表示如果定时触发后多少秒内 Job 还没启动，则跳过本次执行。

**用途：**
- 避免上一个执行还没完成，下一个就开始了（配合并发策略）
- 如果 Job 创建失败（镜像拉取慢），超时后放弃本次

### 2. 并发策略

控制同一 CronJob 的前后执行是否允许重叠：

| 策略 | 行为 |
|------|------|
| `Allow`（默认） | 允许并发，上一个 Job 还在运行，下一个时间点会再创建新 Job |
| `Forbid` | 禁止并发，如果上一个 Job 还在运行，本次跳过 |
| `Replace` | 替换，如果上一个 Job 还在运行，先删除它，创建新 Job |

**建议：** 任务执行时间不确定时使用 `Forbid`，避免资源竞争。

### 3. Job 历史保留

CronJob 会自动清理旧的 Job 对象：

- `spec.successfulJobsHistoryLimit`：保留最近 N 个成功的 Job（默认 3）
- `spec.failedJobsHistoryLimit`：保留最近 N 个失败的 Job（默认 1）

及时清理避免资源浪费。

---

## 常见操作

### 查看 CronJob 状态

**列表页**：
- **下次运行**：下次触发时间
- **上次运行**：上次触发时间
- **状态**：`Enabled` / `Suspend`（挂起）

**详情页**：
- 查看 **Job 列表**：CronJob 自动创建的所有 Job
- 点击 Job → 查看 Pod 日志、事件

### 手动触发

立即执行一次（不等定时）：

1. CronJob 详情页 → **运行一次**
2. 或命令行：
   ```bash
   kubectl create job --from=cronjob/<cronjob-name> manual-run-$(date +%s)
   ```

### 暂停/恢复

- **暂停**：CronJob 详情 → **暂停**（停止创建新 Job，已创建的继续运行）
- **恢复**：**启用**

### 编辑/删除

- **编辑**：修改 Cron 表达式、命令等，保存后下次执行生效
- **删除**：删除 CronJob，可选择是否同时删除关联的 Job

---

## 最佳实践

### 任务设计

- ⏱️ **执行时间可预测**：任务应在调度周期内完成，避免累积
- 🧹 **幂等清理**：任务失败后可安全重试，不产生副作用
- 📦 **资源明确**：设置 CPU/Memory 限制，避免资源争抢
- 🛡️ **错误处理**：任务脚本捕获异常，返回非零退出码触发告警

### 调度策略

- 📅 **避开业务高峰**：备份、清理类任务放在低峰期（如凌晨）
- 🕐 **时区设置**：如果业务在特定时区，设置 `spec.timeZone`（K8s 1.25+）
- 🚦 **并发控制**：使用 `Forbid` 策略确保同一时间只有一个实例运行
- 📈 **监控超时**：设置 `activeDeadlineSeconds`，防止任务卡死

### 运维管理

- 🔍 **日志集中**：CronJob 日志输出到标准输出，便于收集
- 📊 **失败告警**：配置 Alertmanager 对 `Failed` 状态的 Job 发送通知
- 🗑️ **及时清理**：调整 `successfulJobsHistoryLimit` 和 `failedJobsHistoryLimit`
- 📝 **YAML 化管理**：使用 GitOps 管理 CronJob 定义

---

## 常见问题

### Q: CronJob 没按时执行？

- 检查 Cron 表达式：[crontab.guru](https://crontab.guru/) 验证
- 检查时区：`kubectl get cronjob -o yaml` 看是否设置了 `timeZone`
- 检查 `startingDeadlineSeconds`：如果上一轮执行超时，本轮可能被跳过
- 查看事件：`kubectl describe cronjob <name>` 看是否有错误

### Q: 并发执行导致冲突？

- 确认并发策略是 `Forbid` 或 `Replace`
- 如果任务执行时间不可控，增加调度间隔（如每 30 分钟一次改为每小时一次）
- 使用锁机制（如设置 ConfigMap 锁，任务开始时加锁，结束时释放）

### Q: Job 失败后 CronJob 不再执行？

CronJob 本身不受 Job 失败影响，只要调度时间到了就会创建新 Job。但如果：

- `startingDeadlineSeconds` 内 Job 一直失败，下一轮可能被跳过（取决于 `failedJobsHistoryLimit` 和 Kubernetes 版本）
- 检查 `kubectl get cronjob` 的 `AGE` 和 `LAST SCHEDULE` 时间

### Q: 如何查看所有历史 Job？

```bash
# 列出 CronJob 创建的所有 Job
kubectl get jobs --selector=job-name=<cronjob-name>

# 详细查看
kubectl get jobs --all-namespaces --field-selector=metadata.ownerReferences.name=<cronjob-name>
```

### Q: 任务执行时间太长怎么办？

如果任务超过调度周期：

1. 考虑拆分任务（分布式处理）
2. 或者设置 `concurrencyPolicy: Forbid`，让下一轮等待
3. 或者调整调度间隔，避免重叠

---

## 安全建议

- 🔒 **最小权限**：CronJob 使用的 ServiceAccount 只授予必要权限
- 🔒 **Secret 管理**：任务需要的密码、Token 使用 Secret 注入
- 🔒 **资源隔离**：为定时任务创建独立命名空间，避免影响在线服务
- 🔒 **镜像安全**：使用受信任的镜像，定期更新安全补丁

---

## 相关链接

- [Kubernetes CronJob 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [Job 使用指南](/dev/workloads/jobs/)
- [时间表达式工具](https://crontab.guru/)
- [Kubernetes 工作负载最佳实践](https://kubernetes.io/docs/concepts/workloads/)
