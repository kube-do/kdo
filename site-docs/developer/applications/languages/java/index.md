---
title: "Java 项目部署"
description: "在 KDO 上通过源码部署 Java 项目"
sidebar_position: 1
doc_type: explanation
audience: [developer]
owner: docs-ops
last_reviewed: 2026-11-23
status: stable
---

## 概述

KDO 支持从 Maven 源码构建 Java 应用。平台根据仓库根目录的 `pom.xml` 自动识别 Java Maven 项目，使用 Java 应用模板完成依赖下载、编译、镜像构建和部署。

## 识别与构建规则

| 项目 | 说明 |
|---|---|
| 识别文件 | 仓库根目录的 `pom.xml` |
| 开发语言 | `Java` |
| 应用模板 | Java 应用模板 |
| 默认端口 | `8080` |
| 构建任务 | 拉取代码、Maven 构建、构建镜像、部署镜像 |
| 默认 Maven 仓库 | `https://maven.aliyun.com/repository/public` |
| 默认 Java 版本 | `11`，可选 `8`、`17`、`21` |

## 语言特定配置

1. **源码根目录**：填写包含 `pom.xml` 的目录。多模块项目需要确认根 `pom.xml` 能正确聚合子模块。
2. **Java 版本**：在 Maven 构建任务中选择与项目 `pom.xml` 的 `maven.compiler.source/target` 一致的版本。版本不匹配会导致编译失败或运行时 `UnsupportedClassVersionError`。
3. **Maven 仓库**：默认使用阿里云公共仓库。使用私服或需要认证时，在流水线中配置 `settings.xml` 或仓库凭据。
4. **应用端口**：Spring Boot 等框架默认监听 `8080`。如果修改了 `server.port`，需要同步调整模板端口和 Service 端口。
5. **构建缓存**：平台会在项目内创建持久卷缓存 Maven 依赖，首次构建较慢，后续会明显加快。
6. **产物类型**：默认构建可执行 Jar 并放入运行镜像；War 包部署需要确认运行镜像和容器运行时支持。

## 创建与运行

按 [创建并运行语言应用](/docs/developer/applications/languages/create-application/) 完成创建应用、触发构建、查看工作负载和创建路由。

## 相关链接

- [流水线](/docs/developer/delivery/pipelines/)
- [Git 应用](/docs/developer/applications/git/)
- [无状态应用（Deployment）](/docs/developer/workloads/deployments/)
