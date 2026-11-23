---
title: "运维与安全"
description: "KDO 平台的升级、备份恢复、证书和安全基线等运维任务入口。"
sidebar_position: 0
doc_type: explanation
audience: [admin]
owner: docs-admin
last_reviewed: 2026-11-23
status: stable
---

本栏目汇总平台上线后的日常运维任务。升级、备份恢复和安全变更都会影响运行中的应用，执行前请先阅读对应页面的前置检查和回滚说明。

## 运维任务

| 任务 | 适用场景 | 入口 |
|------|----------|------|
| 证书管理 | Ingress TLS 证书自动签发、分发和替换 | [证书管理](/docs/admin/maintenance/certificates/) |
| 平台升级 | 升级 KDO 组件、验证版本和回滚 | [升级与回滚](/docs/admin/maintenance/upgrade/) |
| 备份与恢复 | 升级前备份、故障恢复和迁移 | [备份与恢复](/docs/admin/maintenance/backup-restore/) |
| 安全基线 | 上线前检查身份、网络、密钥和供应链 | [安全基线](/docs/admin/maintenance/security/) |

## 推荐顺序

1. 先完成 [安全基线](/docs/admin/maintenance/security/) 检查，确认身份、网络和密钥配置。
2. 升级前按 [备份与恢复](/docs/admin/maintenance/backup-restore/) 完成备份并验证恢复流程。
3. 按 [升级与回滚](/docs/admin/maintenance/upgrade/) 执行升级，观察组件和业务状态。
4. 证书到期或替换时，参考 [证书管理](/docs/admin/maintenance/certificates/)。

## 相关文档

- [任务索引](/docs/reference/task-index/)：按问题查找运维入口。
- [排障索引](/docs/reference/troubleshooting/)：从现象定位到具体组件。
- [兼容性矩阵](/docs/reference/compatibility/)：升级前确认版本组合。
