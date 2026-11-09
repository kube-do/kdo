---
title: DevOps
nav_order: 4
---

KDO DevOps 把应用项目、应用环境与应用组织在一起，围绕源码构建、镜像构建和持续交付提供开箱即用的能力。建议按下面的路径从概念走到多环境交付。

## 能力地图与学习路径

```mermaid
flowchart TD
    A[了解 KDO DevOps 概念] --> B[认识应用项目 应用环境 应用三层模型]
    B --> C[部署第一个应用]
    C --> D{选择构建来源}
    D -->|源码| E[按语言模板构建]
    D -->|镜像或软件包| F[从镜像或软件包创建]
    E --> G[配置分支流水线与环境]
    F --> G
    G --> H[运行流水线并验证应用]
    H --> I[配置源码持续交付]
    I --> J[多环境交付与应用模板]
    J --> K[按 GitFlow 规范协作开发]
```

- 概念与模型：[KDO DevOps介绍](/docs/devops/introduce/)
- 创建组件：[部署应用](/docs/devops/app-deploy/)
- 流水线与交付：[持续交付](/docs/devops/continuous/)
- 项目与环境管理：[项目管理](/docs/devops/project-manage/)
- 分支协作规范：[GitFlow](/docs/devops/gitflow/)


