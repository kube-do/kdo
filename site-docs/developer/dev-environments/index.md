---
title: "开发环境"
description: "CloudShell、LocalShell、云开发环境和个人访问令牌入口。"
sidebar_position: 0
doc_type: explanation
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

KDO 提供多种开发环境：浏览器内的 CloudShell、本地终端 LocalShell，以及基于 Eclipse Che 的云开发环境。它们共享集群访问和项目权限，但适用场景不同。

## 环境对比

| 环境 | 适用场景 | 入口 |
|------|----------|------|
| CloudShell | 在浏览器内执行命令、上传下载文件、使用 AI Agent | [CloudShell](/docs/developer/dev-environments/terminal/cloudshell/) |
| LocalShell | 在本地终端通过 `oc` 或 `kubectl` 访问集群 | [LocalShell](/docs/developer/dev-environments/terminal/localshell/) |
| 云开发环境 | 在浏览器内使用完整 IDE 和持久化工作区 | [云开发环境](/docs/developer/dev-environments/che/) |
| 个人访问令牌 | 为 CLI、IDE 或自动化创建访问凭据 | [个人访问令牌](/docs/developer/dev-environments/tokens/) |

## 选择建议

- 只需要临时执行命令时，使用 CloudShell，避免在本地保存集群凭据。
- 需要本地脚本、IDE 或长期开发时，使用 LocalShell 和个人访问令牌。
- 需要团队共享、可持久化的开发工作区时，使用云开发环境。
- 无论使用哪种环境，都应遵循最小权限原则，定期清理不再使用的令牌。

## 相关文档

- [终端总览](/docs/developer/dev-environments/terminal/)：CloudShell 与 LocalShell 的能力边界。
- [工作负载](/docs/developer/workloads/)：查看和调试运行中的应用。
- [配置管理](/docs/developer/configuration/)：ConfigMap 和 Secret。
