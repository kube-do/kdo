---
title: "安全基线"
description: "KDO 平台上线前应完成的最小安全检查清单。"
sidebar_position: 11
doc_type: how-to
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

本页给出 KDO 平台的最小安全基线。它不是完整的安全合规方案，但可以作为上线前检查和定期复核的起点。

## 身份与访问

- 使用 OIDC 登录，禁用或轮换默认管理员密码。
- 为人员建立独立账号，不共享管理员账号。
- 按最小权限分配角色，定期复核 `ClusterRoleBinding`、`RoleBinding` 和项目成员。
- 为自动化任务使用独立 ServiceAccount，不使用个人账号。
- 开启 Keycloak 的强密码、会话超时和登录审计策略。
- 关键操作保留审计日志，日志保存时间满足组织要求。

参考：[RBAC](/docs/admin/access-control/rbac/)、[Keycloak](/docs/admin/access-control/keycloak/)、[用户管理](/docs/admin/access-control/)。

## 网络与入口

- Console、Keycloak、Harbor、Grafana、PAC 只暴露必要入口。
- 生产环境使用 TLS；证书由可信 CA 或集群 CA 签发，并监控到期时间。
- 为命名空间配置 NetworkPolicy，默认拒绝不必要的跨命名空间流量。
- Ingress 只开放必要路径和主机名，管理入口限制来源 IP 或 VPN。
- 不把 Kubernetes API、etcd、数据库和对象存储直接暴露到公网。

参考：[路由](/docs/developer/network-storage/ingress/)、[网络策略](/docs/admin/networking/network-policies/)、[证书管理](/docs/admin/maintenance/certificates/)。

## 密钥与配置

- Secret 不写入 Git、镜像或普通 ConfigMap。
- 镜像仓库、OIDC、Webhook、通知渠道使用独立凭据，并定期轮换。
- 限制 Secret 的读取权限；导出备份时加密并限制访问。
- 平台配置变更前先预览和校验，保留变更记录。
- 不在日志中输出 token、密码、私钥和完整请求头。

参考：[Secret](/docs/developer/configuration/secrets/)、[平台配置](/docs/admin/platform-config/)。

## 镜像与供应链

- 只允许从受信任仓库拉取镜像。
- 为 Harbor 项目配置漏洞扫描和保留策略。
- 生产镜像使用不可变 tag 或 digest，不使用 `latest`。
- 限制流水线的镜像构建权限，定期清理机器人账号。
- 对第三方镜像和 Helm Chart 做来源核验。

参考：[镜像构建](/docs/developer/applications/image-builds/)、[Harbor 与镜像仓库](/docs/admin/platform-config/)、[流水线](/docs/developer/delivery/pipelines/)。

## 运行时与集群

- 为容器设置 resource requests/limits，避免资源耗尽。
- 配置 readiness/liveness 探针和 PodDisruptionBudget。
- 限制 privileged、hostNetwork、hostPath 等高风险配置。
- 开启节点和容器运行时安全补丁，定期升级 Kubernetes。
- 对关键命名空间设置 ResourceQuota 和 LimitRange。
- 使用 Pod Security Standards 或等价策略限制 Pod 权限。

参考：[资源限制](/docs/developer/workload-operations/resource-limits/)、[健康检查](/docs/developer/workload-operations/health-checks/)、[PDB](/docs/developer/workload-operations/pdb/)、[ResourceQuota](/docs/admin/namespaces/resource-quotas/)。

## 可观测性与响应

- 配置集群、节点、控制面和关键组件告警。
- 将告警接入邮件、企业微信、钉钉或 Webhook，并设置值班责任人。
- 保留审计日志、事件和关键操作记录。
- 定期演练备份恢复、证书轮换和升级回滚。
- 对异常登录、权限变更、镜像拉取失败和大量 Pod 重启设置告警。

参考：[监控与告警](/docs/observability/monitoring/)、[告警配置](/docs/observability/alerting/)、[日志](/docs/observability/logging/)、[事件](/docs/observability/events/)。

## 上线前检查表

- [ ] 默认密码已修改，OIDC 登录可用。
- [ ] 管理员、项目成员和 ServiceAccount 权限已复核。
- [ ] Console、Harbor、Grafana、PAC 已启用 TLS。
- [ ] 管理入口未直接暴露公网。
- [ ] Secret 未进入 Git，备份已加密。
- [ ] Harbor 扫描和镜像保留策略已配置。
- [ ] 关键命名空间已设置配额和限制。
- [ ] 告警和通知渠道已验证。
- [ ] 备份恢复演练已通过。
- [ ] 升级和回滚步骤已确认。

## 相关文档

- [升级与回滚](/docs/admin/maintenance/upgrade/)
- [备份与恢复](/docs/admin/maintenance/backup-restore/)
- [平台配置](/docs/admin/platform-config/)
- [版本兼容性](/docs/reference/compatibility/)
