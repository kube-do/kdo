---
title: "静态HTML"
description: "介绍 KDO 如何识别静态 HTML 项目、选择 Nginx 运行镜像、配置构建产物目录并发布为可访问的静态站点。"
sidebar_position: 9
doc_type: how-to
audience: [developer]
owner: docs-ops
last_reviewed: 2026-11-23
status: stable
---

## 概述

平台默认会根据源码根目录是否有`index.html`文件来识别为静态语言项目.

如需自定义请在源码根目录定义 `web.conf` 配置文件，默认配置文件如下:

```conf
server {
  listen       80;
  location / {
      root   /app/www;
      index  index.html index.htm;
  }
}
```

## 构建与部署流程

```mermaid
flowchart TD
    A[提交静态站点源码] --> B{根目录是否存在 index.html}
    B -->|是| C[识别为静态 HTML 项目]
    B -->|否| D[补充 index.html 或改用其他构建类型]
    C --> E{是否提供 web.conf}
    E -->|是| F[使用自定义 Nginx 配置]
    E -->|否| G[使用默认 web.conf]
    F --> H[打包静态资源到 /app/www]
    G --> H
    H --> I[构建 Nginx 运行镜像]
    I --> J[推送镜像到仓库]
    J --> K[生成 Deployment 与 Service]
    K --> L[部署到环境并创建路由]
    L --> M[通过域名访问页面]
```

## 部署示例

进入到项目下，新建应用选择**基于源码示例**进行构建，选中 `2048 Demo` 并默认全部下一步即可。

创建、构建、查看工作负载和创建路由的通用步骤见 [创建并运行语言应用](/docs/developer/applications/languages/create-application/)。
