---
title: "Python 项目部署"
description: "介绍 KDO 如何识别 Python 项目、安装 requirements、选择 Python 版本、配置启动命令并构建镜像。"
sidebar_position: 3
doc_type: explanation
audience: [developer]
owner: docs-ops
last_reviewed: 2026-11-23
status: stable
---

## 概述

KDO 支持从 Python 源码构建应用。平台根据仓库根目录的 `requirements.txt` 自动识别 Python 项目，并提供 Django 等常用应用模板。

## 识别与构建规则

| 项目 | 说明 |
|---|---|
| 识别文件 | 仓库根目录的 `requirements.txt` |
| 开发语言 | `Python` |
| 应用模板 | `python-django` 等 Python 应用模板 |
| 默认端口 | `8080` |
| 构建任务 | 拉取代码、安装依赖、构建运行镜像、部署镜像 |
| 依赖安装 | `pip install` |
| Python 版本 | 在应用模板或构建任务中选择 |

## 语言特定配置

1. **源码根目录**：填写包含 `requirements.txt` 的目录。如果依赖文件在子目录，需要调整源码根目录或构建命令。
2. **应用模板**：Django 项目选择 `python-django` 等匹配模板；模板决定启动命令、WSGI/ASGI 入口和默认端口。
3. **Python 版本**：选择与项目依赖兼容的版本。部分二进制依赖对 Python 小版本敏感，升级前先在本地验证。
4. **依赖源**：默认使用公共 PyPI。内网或需要加速时，可在流水线中配置 `PIP_INDEX_URL` 和信任主机。
5. **启动命令**：确认 `gunicorn`、`uvicorn` 或其他启动命令与模板一致，并监听 `0.0.0.0` 和配置的端口。
6. **构建缓存**：平台会缓存 pip 依赖；首次构建较慢，后续会复用缓存。

## 创建与运行

按 [创建并运行语言应用](/docs/developer/applications/languages/create-application/) 完成创建应用、触发构建、查看工作负载和创建路由。

## 相关链接

- [流水线](/docs/developer/delivery/pipelines/)
- [Git 应用](/docs/developer/applications/git/)
- [无状态应用（Deployment）](/docs/developer/workloads/deployments/)
