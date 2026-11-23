---
title: "升级与回滚"
description: "介绍 KDO 平台升级前的兼容性检查、升级计划与执行、升级后验证，以及组件和数据回滚策略。"
sidebar_position: 2
doc_type: how-to
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

本页说明如何升级 KDO 平台组件，以及升级失败时如何回到可用状态。升级前必须先完成备份；没有可恢复的备份，不要在生产集群执行升级。

## 适用范围

适用于使用 `kdo-install` 安装的 KDO 平台。当前发布基线为 `2026.11`，支持从 `2026.10` 升级；更早版本先按发布说明逐版本升级，不要直接跳到最新版本。

`kdo-install upgrade` **只升级 KDO 自有组件**：

- KDC、Console、Pipelines as Code
- 项目角色和示例资源
- KDO CRD、Webhook、RBAC

第三方组件（Kubernetes、Keycloak、Harbor、Prometheus、Grafana、Tekton、Kubeapps、Logging/Loki、MinIO、NFS、cert-manager、Shipwright、Lightspeed）保持冻结：

- 升级前，preflight 会校验 Helm 管理的第三方组件实际版本与 `release.yaml` 中的 `thirdParty` 基线一致。
- Tekton、Prometheus、Logging 由 `release.yaml` 与 `versions.env` 的一致性校验覆盖。
- 任一版本漂移都会拒绝升级。
- 升级过程不会调用第三方 Helm upgrade，也不会修改第三方 CR。

需要单独升级第三方组件时，先确认目标版本在平台兼容范围内，并按对应组件的升级文档执行。

## 前置条件

- 已获取目标版本的 `kdo-install` 和发布说明。
- 已有可用的 `kdo-install.yaml`，并与当前集群配置一致。
- 已完成 [备份与恢复](/docs/admin/maintenance/backup-restore/)。
- 已确认维护窗口和业务影响范围。
- 当前集群、节点、存储和关键组件处于健康状态。
- 已保存当前版本的访问信息、配置和镜像版本。

## 升级前检查

```bash
# 安装器与当前安装状态
kdo-install version
kdo-install status -config kdo-install.yaml
kdo-install doctor -config kdo-install.yaml

# 查看升级计划，不执行变更
kdo-install upgrade -config kdo-install.yaml --plan

# 集群与关键组件
kubectl get node
kubectl get pod -A | grep -E 'kubedo|kdc|console|keycloak|harbor|tekton|pipelines-as-code'
kubectl get pvc -A
```

升级前安装器会把状态和 KDC/Console Deployment 备份到目标节点的 `/root/kdo-backup-<时间>/`，便于回滚工作负载。

同时确认：

- 没有正在运行的发布、构建或数据库迁移任务。
- `kubedo-system/console` 配置和凭据 Secret 已备份。
- Prometheus、Loki、Harbor、MinIO 等数据盘有足够空间。
- 升级窗口内不会触发自动扩缩容或定时任务高峰。

## 执行升级

```bash
# 使用目标版本的安装器
./kdo-install upgrade -config kdo-install.yaml --apply -yes

# 镜像拉取较慢时延长超时
./kdo-install upgrade -config kdo-install.yaml --apply -yes -timeout 30m
```

升级过程中不要重复执行 `--apply`，也不要手工修改由安装器管理的 Deployment、ConfigMap 或 Secret。需要中断时，先确认安装器是否支持安全重试。

## 升级后验证

```bash
kdo-install status -config kdo-install.yaml
kdo-install access-info -config kdo-install.yaml

kubectl get pod -A | grep -E 'kubedo|kdc|console|keycloak|harbor|tekton|pipelines-as-code'
kubectl get ingress -A
```

验证清单：

- Console、Keycloak、Harbor、Grafana、PAC 可以正常登录。
- 现有用户、项目、环境、应用和流水线仍在。
- 新建一个测试应用并触发一次构建，确认 PAC、Tekton、Harbor 和 GitOps 写回正常。
- 告警、日志、事件和通知渠道正常。
- 旧 URL 仍按 301 跳转，下载文件可以访问。

## 回滚策略

优先使用安装器自带的回滚：

```bash
kdo-install upgrade -config kdo-install.yaml --rollback -yes
```

`--rollback` 只恢复最近一次升级涉及的工作负载，**不会回滚 CRD**。如果升级还包含 CRD、数据库或存储变更，需要按影响范围继续处理：

1. **组件回滚**：使用 `upgrade --rollback` 恢复 KDC、Console、PAC 等工作负载。
2. **配置回滚**：从 `/root/kdo-backup-<时间>/` 或配置备份中恢复 ConfigMap、Secret、Ingress 和 RBAC。
3. **数据回滚**：当升级包含数据库或存储迁移时，按[备份与恢复](/docs/admin/maintenance/backup-restore/)恢复 Keycloak、Harbor、MinIO、Prometheus/Loki 或 PVC 数据。

注意事项：

- 数据迁移通常不可逆；仅回滚镜像不一定会恢复数据结构。
- CRD 不回滚；如果新版本已经写入新字段，旧版本组件可能无法识别，回滚前必须先确认兼容性。
- 回滚前先停止写入流量，避免新旧版本同时写同一份数据。
- 回滚后重新执行升级后验证清单。
- 保留升级日志、失败 Pod 的日志和事件，便于定位问题。

## 常见问题

**升级计划显示大量组件变更**

先核对 `kdo-install.yaml` 是否与当前集群一致，尤其是域名、OIDC、镜像仓库和存储配置。配置不一致时不要直接执行 `--apply`。

**升级后 Console 无法登录**

检查 Keycloak Pod、OIDC issuer、client secret 和 `kubedo-system/console` 配置。必要时恢复升级前的认证配置。

**升级后流水线无法触发**

检查 PAC 控制器、Webhook、Repository CR 和 Tekton PipelineRun。确认 Git 仓库的 Webhook 地址仍可访问。

**升级卡在镜像拉取**

确认节点可以访问镜像仓库；离线环境先按[离线安装](/docs/install/offline/)导入镜像。

## 相关文档

- [安装 KDO 平台](/docs/install/kdo/)
- [备份与恢复](/docs/admin/maintenance/backup-restore/)
- [版本兼容性](/docs/reference/compatibility/)
- [发布说明](/docs/release-notes/)
- [安全基线](/docs/admin/maintenance/security/)
