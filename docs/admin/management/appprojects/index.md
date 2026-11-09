---
title: 应用项目(AppProject)
parent: 管理
nav_order: 3
---


### [访问应用项目详情](/docs/devops/project-manage#项目管理)

**AppProject** 是 KDO 的项目模型：创建项目时会生成同名命名空间，并按启用的环境创建对应的环境命名空间。项目成员、角色与资源配额都围绕这些命名空间生效。

![应用项目列表与创建表单](imgs/appproject-page.svg)

*图：应用项目列表与新建应用项目表单。*

## 组件关系

```mermaid
flowchart TD
    A[AppProject 应用项目] --> B[同名命名空间]
    A --> C[项目成员与角色]
    A --> D[AppEnv 环境]
    D --> E[dev 环境命名空间]
    D --> F[test 环境命名空间]
    D --> G[stage 环境命名空间]
    D --> H[prod 环境命名空间]
    A --> I[Repository 代码仓库]
    I --> J[应用与分支流水线]
    J --> E
    J --> F
    J --> G
    J --> H
    B --> K[ResourceQuota 与 LimitRange]
```

项目的管理员可管理成员与环境，普通成员只能操作被授权的环境；每个环境命名空间独立承载应用、构建与工作负载。
