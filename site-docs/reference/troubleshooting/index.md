---
title: "排障索引"
description: "按现象快速定位安装、登录、构建、部署、访问、存储和可观测性问题。"
sidebar_position: 4
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页按“看到的现象”组织排障入口。先确认影响范围，再收集事件、日志和配置，避免直接修改生产资源。

## 通用排查步骤

1. **确认范围**：单个应用、单个环境、单个命名空间，还是整个集群。
2. **确认时间点**：最近是否有发布、升级、配置变更、证书轮换或容量变化。
3. **看事件**：`kubectl get event -A --sort-by=.lastTimestamp`，或 Console 的事件页面。
4. **看状态**：Pod、Deployment、PVC、Ingress、PipelineRun 的 conditions 和 events。
5. **看日志**：应用日志、控制器日志、Ingress Controller 日志、节点日志。
6. **最小复现**：用测试应用或测试命名空间复现，避免影响生产。
7. **记录与回滚**：保留现场，必要时按备份回滚。

## 按现象查找

| 现象 | 优先检查 | 文档 |
| --- | --- | --- |
| 安装失败、镜像拉取失败 | 镜像仓库、网络、节点、存储 | [离线安装](/docs/install/offline/)、[安装 KDO](/docs/install/kdo/) |
| 无法登录、OIDC 报错 | Keycloak、issuer、client、系统时间 | [Keycloak](/docs/install/keycloak/)、[平台配置](/docs/admin/platform-config/) |
| 没有权限、看不到项目 | RBAC、项目成员、命名空间绑定 | [RBAC](/docs/admin/access-control/rbac/)、[用户管理](/docs/admin/access-control/) |
| 创建应用失败 | Git 仓库、令牌、分支、模板 | [创建 Git 应用](/docs/developer/applications/git/) |
| 流水线没有触发 | Webhook、Repository、PAC 控制器 | [PAC](/docs/developer/delivery/pac/)、[PAC 排障](/docs/developer/delivery/pac/manage/troubleshooting/) |
| 流水线一直 Running | Pod、Task、PVC、镜像拉取 | [流水线](/docs/developer/delivery/pipelines/)、[PipelineRun](/docs/developer/delivery/pac/repository-and-pipelinerun/pipelinerun/) |
| 构建成功但部署失败 | GitOps 写回、部署 PipelineRun、目标集群 | [持续交付](/docs/developer/best-practices/continuous-delivery/) |
| Pod Pending / CrashLoop / OOM | 调度、镜像、探针、资源限制 | [Pod](/docs/developer/workloads/pods/) |
| 服务访问 404/502/503 | Service、Endpoints、Ingress、证书 | [Service](/docs/developer/network-storage/service/)、[Ingress](/docs/developer/network-storage/ingress/) |
| PVC Pending、挂载失败 | StorageClass、CSI、容量、访问模式 | [PVC](/docs/developer/network-storage/pvc/)、[存储](/docs/admin/storage/) |
| 没有监控、日志或告警 | 采集组件、数据源、通知渠道 | [监控](/docs/observability/monitoring/)、[日志](/docs/observability/logging/)、[告警](/docs/observability/alerting/) |
| 终端无法连接 | kubeconfig、代理、Pod 状态 | [终端](/docs/developer/dev-environments/terminal/) |
| 升级后异常 | 组件版本、配置、数据迁移 | [升级与回滚](/docs/admin/maintenance/upgrade/) |

## 常用命令

```bash
# 节点和 Pod
kubectl get node
kubectl get pod -A -o wide
kubectl describe pod <pod> -n <namespace>
kubectl logs <pod> -n <namespace> --previous

# 事件
kubectl get event -A --sort-by=.lastTimestamp

# 工作负载与存储
kubectl get deploy,statefulset,pvc,ingress -n <namespace>
kubectl describe pvc <pvc> -n <namespace>

# KDO 组件
kubectl get pod -n kubedo-system
kubectl logs -n kubedo-system deploy/kdc-controller-manager
kubectl get repository,pipelinerun -A
```

## 收集信息

提交问题或请求支持时，至少提供：

- 发生时间和时区。
- 影响范围：用户、项目、环境、应用或集群。
- 复现步骤和预期结果。
- 相关资源的 YAML（脱敏）。
- Pod 事件、容器日志和控制器日志。
- 最近变更：发布、升级、配置、证书、网络或配额。
- 已尝试的规避方式和结果。

不要在工单或聊天中粘贴明文密码、token、私钥和完整 Secret。

## 相关文档

- [事件](/docs/observability/events/)
- [日志](/docs/observability/logging/)
- [监控与告警](/docs/observability/monitoring/)
- [版本兼容性](/docs/reference/compatibility/)
- [升级与回滚](/docs/admin/maintenance/upgrade/)
- [备份与恢复](/docs/admin/maintenance/backup-restore/)
