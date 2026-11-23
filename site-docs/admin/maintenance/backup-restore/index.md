---
title: "备份与恢复"
description: "KDO 平台的备份范围、备份方法、恢复顺序和验证清单。"
sidebar_position: 10
doc_type: how-to
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

备份的目标不是“导出 YAML”，而是在集群、组件或数据损坏后，能在可接受时间内恢复到一个已知可用的状态。升级、迁移、权限调整和存储变更前都必须备份。

## 备份范围

| 范围 | 内容 | 建议方式 |
| --- | --- | --- |
| Kubernetes 集群 | etcd、CRD、命名空间、RBAC、Ingress、StorageClass | etcd 快照 + 资源清单 |
| KDO 控制面 | `kubedo-system` 下的 ConfigMap、Secret、Deployment | `kubectl get -o yaml` |
| 平台模型 | AppProject、Repository、PipelineRun、ApprovalTask 等 CR | 按 CRD 导出 |
| 身份 | Keycloak realm、client、用户和组 | Keycloak 数据库或 realm 导出 |
| 镜像与制品 | Harbor 项目、镜像、机器人账号 | Harbor 备份或对象存储快照 |
| 对象存储 | MinIO bucket、制品和构建缓存 | 对象存储快照/同步 |
| 监控日志 | Prometheus TSDB、Loki 数据 | 持久卷快照或对象存储备份 |
| 应用数据 | PVC、数据库、文件存储 | 存储快照或应用级备份 |

## 备份前检查

```bash
kubectl get node
kubectl get pod -A | grep -E 'kubedo|kdc|console|keycloak|harbor|tekton|pipelines-as-code'
kubectl get pvc -A
kubectl get storageclass
```

确认：

- 备份窗口内没有升级、发布或大批量构建。
- 备份存储与集群故障域分离。
- 备份账号只具备必要的读取权限。
- 备份文件加密，并记录校验和。

## 备份 Kubernetes 与 KDO 资源

etcd 快照由集群管理员执行，具体参数取决于 etcd 部署方式。单机或 kubeadm 环境示例：

```bash
ETCDCTL_API=3 etcdctl snapshot save /backup/etcd-$(date +%F-%H%M).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key

ETCDCTL_API=3 etcdctl snapshot status /backup/etcd-$(date +%F-%H%M).db -w table
```

导出 KDO 命名空间和平台资源：

```bash
kubectl get all,configmap,secret,ingress,pvc -n kubedo-system -o yaml \
  > /backup/kubedo-system-$(date +%F).yaml

kubectl get appprojects,repositories,pipelineruns,approvaltasks -A -o yaml \
  > /backup/kdo-cr-$(date +%F).yaml
```

如果某个 CRD 不存在，`kubectl` 会报错；先用 `kubectl api-resources | grep -E 'kdo|tekton|pipelines'` 确认实际资源类型，再分别导出。

## 备份身份、镜像与数据

- **Keycloak**：备份数据库，或使用 realm 导出；同时保存 client secret、OIDC issuer 和证书。
- **Harbor**：备份数据库、对象存储和镜像仓库；确认 robot account 和项目配额。
- **MinIO**：对 bucket 做快照或跨站点同步。
- **Prometheus/Loki**：优先使用持久卷快照；确认快照与 Pod 写入的一致性。
- **PVC**：使用 StorageClass 支持的 VolumeSnapshot，或应用层导出。

不要只备份 Kubernetes Secret 的引用；Secret 的实际内容、证书私钥和加密材料必须一起备份，并限制访问。

## 恢复顺序

1. **恢复基础设施**：节点、网络、存储、etcd 或集群。
2. **恢复 CRD 和平台组件**：KDC、Console、PAC、Tekton、Keycloak、Harbor。
3. **恢复配置和凭据**：`kubedo-system` ConfigMap、Secret、OIDC、镜像仓库配置。
4. **恢复平台模型**：AppProject、Repository、Pipeline、ApprovalTask。
5. **恢复数据**：Keycloak、Harbor、MinIO、Prometheus/Loki、PVC。
6. **恢复入口**：Ingress、DNS、证书和通知渠道。
7. **验证业务**：登录、构建、部署、访问、告警和日志。

恢复时先恢复控制面，再恢复数据面；不要在新旧版本同时写入同一份数据。

## 恢复后验证

```bash
kdo-install status -config kdo-install.yaml
kubectl get pod -A | grep -E 'kubedo|kdc|console|keycloak|harbor|tekton|pipelines-as-code'
kubectl get ingress -A
```

- 管理员和普通用户可以登录。
- 项目、环境、应用、流水线和发布历史存在。
- 新建测试应用可以完成构建、写回和部署。
- Harbor 可以拉取镜像，PAC Webhook 可以触发。
- Grafana、日志、事件和告警正常。
- 旧 URL 仍按 301 跳转。

## 常见问题

**备份文件很大**

优先使用存储快照，避免反复导出全量 YAML；对日志和监控数据设置保留策略。

**恢复后 Pod 启动但数据为空**

确认 PVC、对象存储和数据库都已恢复，并检查 StorageClass 的绑定关系。

**恢复后无法登录**

检查 Keycloak realm、OIDC issuer、client secret 和系统时间；OIDC 对时间偏差敏感。

**恢复后流水线重复触发**

恢复期间暂停 Webhook 或 PAC 控制器，恢复完成并核对 Repository 后再启用。

## 相关文档

- [升级与回滚](/docs/admin/maintenance/upgrade/)
- [安装 KDO 平台](/docs/install/kdo/)
- [证书管理](/docs/admin/maintenance/certificates/)
- [安全基线](/docs/admin/maintenance/security/)
- [版本兼容性](/docs/reference/compatibility/)
