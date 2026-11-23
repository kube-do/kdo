---
title: "Node.js 前后端项目部署"
description: "在 KDO 上通过源代码部署 Node.js 前端项目和后端项目。例如 Vue、React 等前端项目和 Express、Koa 等后端项目。"
sidebar_position: 5
doc_type: explanation
audience: [developer]
owner: docs-ops
last_reviewed: 2026-11-23
status: stable
---

## 概述

KDO 支持 Node.js 前端和后端项目。平台根据仓库根目录的 `package.json` 自动识别 Node.js 项目，可选择 `npm` 或 `yarn` 构建方式。

## 识别与构建规则

| 项目 | 说明 |
|---|---|
| 识别文件 | 仓库根目录的 `package.json` |
| 开发语言 | `nodejs` |
| 应用模板 | Node.js 应用模板，按前端或后端选择 |
| 默认端口 | `8080` |
| 构建任务 | 拉取代码、安装依赖、构建、构建镜像、部署镜像 |
| 默认 npm 源 | `https://registry.npmmirror.com` |
| 默认 Node.js 版本 | `18`，可选 `12`、`14`、`16`、`20`、`22` |

## 语言特定配置

1. **源码根目录**：填写包含 `package.json` 的目录。Monorepo 需要把源码根目录指向具体应用子目录，或调整构建命令。
2. **构建方式**：模板支持 `npm` 和 `yarn`。选择与仓库锁文件一致的包管理器，避免依赖版本漂移。
3. **Node.js 版本**：在构建任务中选择与项目引擎要求一致的版本。版本不匹配可能导致依赖安装失败或构建产物无法运行。
4. **前端项目**：Vue、React 等前端项目通常先执行 `npm run build` 生成静态文件，再由 Nginx 运行镜像提供服务。默认端口 `8080` 由模板中的 Nginx 监听。
5. **后端项目**：Express、Koa 等后端项目直接运行 Node 进程。确认启动命令、端口和环境变量与模板一致。
6. **依赖缓存**：平台会缓存 Node 模块和构建缓存；首次构建较慢，后续会复用缓存。

## 创建与运行

按 [创建并运行语言应用](/docs/developer/applications/languages/create-application/) 完成创建应用、触发构建、查看工作负载和创建路由。

## 相关链接

- [流水线](/docs/developer/delivery/pipelines/)
- [Git 应用](/docs/developer/applications/git/)
- [无状态应用（Deployment）](/docs/developer/workloads/deployments/)
