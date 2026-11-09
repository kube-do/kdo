---
title: 静态HTML
parent: 部署应用
nav_order: 8
description: 在 KDO 上通过源代码部署静态HTML项目
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

进入到团队下，新建应用选择**基于源码示例**进行构建，选中 `2048 Demo` 并默认全部下一步即可。
