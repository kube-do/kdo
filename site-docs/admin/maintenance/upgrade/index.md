---
title: "升级与回滚"
description: "KDO 平台升级前的检查、升级步骤、验证方法和回滚策略。"
sidebar_position: 9
doc_type: how-to
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

本页说明如何升级 KDO 平台组件，以及升级失败时如何回到可用状态。升级前必须先完成备份；没有可恢复的备份，不要在生产集群执行升级。

## 适用范围

适用于使用 `kdo-install` 安装的 KDO 平台，包括 Console、KDC、Pipelines as Code、Tekton、Keycloak、Harbor、Prometheus、Logging 等组件。

第三方组件（Kubernetes、Keycloak、Harbor、Tekton 等）默认随平台版本冻结；如需单独升级，先确认版本兼容性。

## 前置条件

- 已获取目标版本的 `kdo-install` 和发布说明。
- 已有可用的 `kdo-install.yaml`，并与当前集群配置一致。
- 已完成 [备份与恢复](/docs/admin/maintenance/backup-restore/)。
- 已确认维护窗口和业务影响范围。
- 当前集群、节点、存储和关键组件处于健康状态。
- 已保存当前版本的访问信息、配置和镜像版本。

## 升级前检查

```bash
# 当前安装状态
kdo-install status -config kdo-install.yaml

# 查看升级计划，不执行变更
kdo-install upgrade -config kdo-install.yaml --plan

# 集群与关键组件
kubectl get node
kubectl get pod -A | grep -E 'kubedo|kdc|console|keycloak|harbor|tekton|pipelines-as-code'
kubectl get pvc -A
```

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

升级回滚分为三层，按影响范围从小到大选择：

1. **组件回滚**：使用上一版本的 `kdo-install` 和原配置重新执行升级，把 KDO 组件恢复到上一版本。
2. **配置回滚**：恢复升级前的 ConfigMap、Secret、Ingress 和 RBAC 清单。
3. **数据回滚**：当升级包含数据库或存储迁移时，按[备份与恢复](/docs/admin/maintenance/backup-restore/)恢复 Keycloak、Harbor、MinIO、Prometheus/Loki 或 PVC 数据。

注意事项：

- 数据迁移通常不可逆；仅回滚镜像不一定会恢复数据结构。
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
