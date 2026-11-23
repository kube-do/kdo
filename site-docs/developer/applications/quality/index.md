---
title: "代码质量"
description: "在 KDO 流水线中接入 SonarQube 等代码质量检查。"
sidebar_position: 0
doc_type: explanation
audience: [developer]
owner: docs-dev
last_reviewed: 2026-11-23
status: stable
---

代码质量检查通常放在构建流水线中，在镜像构建和部署之前执行。检查失败时终止 PipelineRun，避免有问题的代码进入环境。

## 质量检查入口

| 能力 | 说明 | 入口 |
|------|------|------|
| SonarQube | 静态代码分析、质量门禁和覆盖率报告 | [SonarQube](/docs/developer/applications/quality/sonarqube/) |

## 接入建议

1. 先在流水线中单独运行质量检查，确认扫描命令和凭据可用。
2. 把质量检查放在构建镜像之前，失败时直接终止 PipelineRun。
3. 使用 Secret 保存 SonarQube Token，不要把令牌写进仓库或流水线 YAML。
4. 质量门禁阈值应随团队成熟度逐步收紧，避免一次性阻断所有历史代码。

## 相关文档

- [流水线](/docs/developer/delivery/pipelines/)：在标准流水线中加入检查任务。
- [Pipelines as Code](/docs/developer/delivery/pac/)：在仓库内维护流水线定义。
- [配置管理](/docs/developer/configuration/secrets/)：创建和使用 Secret。
