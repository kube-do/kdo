---
title: "Golang 项目部署"
description: "在 KDO 上通过源代码部署 Golang 项目"
sidebar_position: 3
doc_type: explanation
audience: [developer]
owner: docs-ops
last_reviewed: 2026-11-23
status: stable
---

## 概述

Go（Golang）适合构建高并发、可静态编译的服务端应用。KDO 会根据仓库根目录的 `go.mod` 自动识别 Golang 项目，并使用 Golang 应用模板完成构建、镜像打包和部署。

## 识别与构建规则

| 项目 | 说明 |
|---|---|
| 识别文件 | 仓库根目录的 `go.mod` |
| 开发语言 | `golang` |
| 应用模板 | Golang 应用模板 |
| 默认端口 | `8080` |
| 构建任务 | 拉取代码、Golang 构建、构建镜像、部署镜像 |
| 默认 GOPROXY | `https://goproxy.cn,direct` |
| 默认 Go 版本 | `1.24`，可选 `1.15`、`1.18`、`1.20`、`1.22`、`1.24` |

## 语言特定配置

1. **源码根目录**：填写包含 `go.mod` 的目录。多模块仓库不要把仓库根目录误填为模块子目录。
2. **应用端口**：Gin 等常见框架默认监听 `8080`。如果应用监听其他端口，需要同步修改模板端口和 Service 端口。
3. **Go 版本**：在 `golang-build` 任务中选择与项目 `go.mod` 兼容的版本。版本过低会导致泛型、标准库或依赖编译失败。
4. **依赖代理**：默认使用 `https://goproxy.cn,direct`。私有模块需要在流水线中配置 `GOPRIVATE`、`GONOSUMDB` 和访问凭据。
5. **构建缓存**：平台会在项目内创建持久卷，用于缓存 Go 模块和构建产物；首次构建较慢，后续会复用缓存。
6. **静态编译**：模板通常使用静态编译生成二进制，再放入轻量运行镜像。需要 CGO 时，确认运行镜像包含对应系统库。

## 创建与运行

按 [创建并运行语言应用](/docs/developer/applications/languages/create-application/) 完成创建应用、触发构建、查看工作负载和创建路由。

## 相关链接

- [流水线](/docs/developer/delivery/pipelines/)
- [Git 应用](/docs/developer/applications/git/)
- [无状态应用（Deployment）](/docs/developer/workloads/deployments/)
