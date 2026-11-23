---
title: ".NET 项目部署"
description: "在 KDO 上通过源码部署 .NET 项目"
sidebar_position: 6
doc_type: explanation
audience: [developer]
owner: docs-ops
last_reviewed: 2026-11-23
status: stable
---

## 概述

KDO 支持从 .NET 源码构建应用。平台根据仓库根目录的 `*.csproj` 或 `*.sln` 自动识别 .NET 项目，使用 .NET 应用模板完成还原、发布、镜像构建和部署。

## 识别与构建规则

| 项目 | 说明 |
|---|---|
| 识别文件 | 仓库根目录的 `*.csproj` 或 `*.sln` |
| 开发语言 | `.NetCore` |
| 应用模板 | .NET 应用模板 |
| 默认端口 | `8080` |
| 构建任务 | 拉取代码、dotnet 还原、dotnet 发布、构建镜像、部署镜像 |
| 默认包源 | NuGet 官方源，可在流水线中替换为私有源 |
| .NET SDK | 在应用模板和构建任务中选择 |

## 语言特定配置

1. **源码根目录**：填写包含 `*.csproj` 或 `*.sln` 的目录。多项目解决方案需要确认启动项目能被正确发布。
2. **SDK 版本**：应用模板、构建任务和项目目标框架必须保持一致。版本不匹配会导致 `restore` 或 `publish` 失败。
3. **私有 NuGet 源**：在流水线中配置 NuGet 源地址和凭据；需要认证的源使用 Secret 保存令牌。
4. **应用端口**：ASP.NET Core 默认监听 `8080`。如果修改了 `ASPNETCORE_URLS`，需要同步调整模板和 Service 端口。
5. **发布产物**：默认执行 `dotnet publish` 生成发布目录，再放入 ASP.NET Core 运行镜像。
6. **构建缓存**：平台会在项目内创建持久卷缓存 NuGet 包；首次构建较慢，后续会复用缓存。

## 创建与运行

按 [创建并运行语言应用](/docs/developer/applications/languages/create-application/) 完成创建应用、触发构建、查看工作负载和创建路由。

## 相关链接

- [流水线](/docs/developer/delivery/pipelines/)
- [Git 应用](/docs/developer/applications/git/)
- [无状态应用（Deployment）](/docs/developer/workloads/deployments/)
