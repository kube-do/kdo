---
title: "版本兼容性"
description: "KDO 平台与 Kubernetes、Keycloak、Tekton、Harbor 等组件的兼容性判断方法。"
sidebar_position: 3
doc_type: reference
audience: [developer, admin]
owner: docs-team
last_reviewed: 2026-11-23
status: stable
---

本页说明如何判断 KDO 文档、平台版本和依赖组件是否兼容。具体版本支持范围以对应版本的发布说明和安装器校验结果为准。

## 版本维度

| 维度 | 说明 | 确认方式 |
| --- | --- | --- |
| KDO 平台 | Console、KDC、PAC、安装器 | 发布说明、`kdo-install --version` |
| Kubernetes | API 版本、kubelet、etcd、CNI、CSI | `kubectl version`、`kubectl get node` |
| 身份 | Keycloak/OIDC、realm、client | `kdo-install apiserver-check` |
| 流水线 | Tekton、Pipelines as Code | `kubectl get pod -n tekton-pipelines` |
| 镜像仓库 | Harbor、项目、机器人账号 | Harbor 版本页和登录测试 |
| 可观测性 | Prometheus、Grafana、Loki | Pod 镜像 tag 和 Grafana 关于页 |
| 存储 | StorageClass、CSI、NFS | `kubectl get storageclass`、PVC 绑定 |

## 文档适用版本

页面通过 `applies_to` 标注适用版本，例如：

```yaml
applies_to: ">= v2026.11"
```

- 没有 `applies_to` 的页面默认适用于当前最新版本。
- 参考手册和发布说明将优先做版本化；指南类页面保持最新版本。
- 升级后如果页面描述与界面不一致，以发布说明和实际组件版本为准，并提交文档修正。

## Kubernetes 兼容性

- 控制面与 kubelet 的版本偏差遵循 Kubernetes 官方支持的 skew 策略。
- 升级 Kubernetes 前先确认 CSI、CNI、Ingress Controller 和 KDO 组件支持目标版本。
- 不要跨多个次版本直接升级；按 Kubernetes 官方升级路径逐级升级。
- 升级后检查 CRD、准入 Webhook、Aggregated APIServer 和存储插件。

## 身份兼容性

- `kube-apiserver` 的 `--oidc-issuer-url` 必须与 Keycloak issuer 完全一致。
- `--oidc-client-id`、`--oidc-username-claim=preferred_username`、`--oidc-groups-claim=groups` 必须与平台配置一致。
- 更换 Keycloak 域名或证书后，需要同步更新 kube-apiserver 和 Console 配置。
- OIDC 对系统时间敏感，节点时间偏差会导致登录失败。

参考：[安装 Keycloak](/docs/install/keycloak/)、[平台配置](/docs/admin/platform-config/)。

## 流水线与镜像仓库

- Tekton、PAC 和 KDO 版本需要一起升级；不要只升级其中一个组件。
- 升级 PAC 前确认 Repository CR、Webhook、Secret 和 PipelineRun 模板兼容。
- Harbor 升级前确认机器人账号、项目配额、扫描策略和镜像保留策略。
- 构建节点需要能访问 Git 仓库、Harbor 和依赖镜像源。

参考：[Pipelines as Code](/docs/developer/delivery/pac/)、[流水线](/docs/developer/delivery/pipelines/)、[镜像构建](/docs/developer/applications/image-builds/)。

## 升级路径

1. 阅读目标版本发布说明和本页。
2. 执行 `kdo-install upgrade --plan`，确认组件变更范围。
3. 完成[备份与恢复](/docs/admin/maintenance/backup-restore/)。
4. 在维护窗口内升级，按[升级与回滚](/docs/admin/maintenance/upgrade/)验证。
5. 如果跨多个版本，按发布说明要求逐版本升级，不直接跳到最新版本。

## 兼容性判断清单

- [ ] KDO 安装器版本与目标版本一致。
- [ ] Kubernetes 在支持范围内，且未跨多个次版本升级。
- [ ] Keycloak/OIDC issuer、client、claim 与 apiserver 一致。
- [ ] Tekton、PAC、Harbor 版本与 KDO 版本匹配。
- [ ] StorageClass、CSI、Ingress Controller 支持目标 Kubernetes。
- [ ] 备份、回滚和验证步骤已准备。
- [ ] 发布说明中的已知问题已评估。

## 相关文档

- [发布说明](/docs/release-notes/)
- [升级与回滚](/docs/admin/maintenance/upgrade/)
- [备份与恢复](/docs/admin/maintenance/backup-restore/)
- [安装 KDO 平台](/docs/install/kdo/)
- [安全基线](/docs/admin/maintenance/security/)
