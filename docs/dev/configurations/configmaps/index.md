---
title: 配置映射(ConfigMap)
parent: 配置管理
---

1. TOC
{:toc}

## 介绍

{: .note }
`配置映射(ConfigMap)` 是一种API对象，用于以键值对的形式存储非敏感数据。它可以在容器组中作为环境变量、命令行参数或存储卷内的配置文件使用，从而便于应用程序的配置管理。
`配置映射(ConfigMap)`能够将环境配置信息与容器镜像分离，从而简化应用配置的修改和管理。通过这种方式，不仅可以灵活调整配置参数，还能够在不影响容器镜像的情况下快速响应变化的需求。

![](imgs/configmaps.png)

{: .warning }
`配置映射(ConfigMap)` 并不提供保密或者加密功能。如果你想存储的数据是机密的，请使用[保密字典(Secret)](/docs/dev/configurations/secrets/)， 或者使用其他第三方工具来保证你的数据的私密性，而不是用`配置映射(ConfigMap)`。

## 使用流程

```mermaid
flowchart TD
    A[创建 ConfigMap] --> B{数据录入方式}
    B -->|键值对| C[逐条填写 key 与 value]
    B -->|配置文件| D[粘贴或上传配置文件内容]
    C --> E[保存到当前命名空间]
    D --> E
    E --> F{在容器组中如何使用}
    F -->|环境变量| G[通过 configMapKeyRef 注入]
    F -->|数据卷| H[挂载为容器内文件]
    F -->|命令行参数| I[通过环境变量展开引用]
    G --> J[创建或更新容器组]
    H --> J
    I --> J
    J --> K[容器读取配置并启动]
    K --> L{配置是否更新}
    L -->|是| M[环境变量需重启 挂载文件自动刷新]
    L -->|否| N[保持当前配置]
```

## 查看配置映射
![](imgs/configmap.png)

## 编辑配置映射

{: .note }
`配置映射(ConfigMap)`采用键值对的形式存储数据，提供了灵活的管理方式，您既可以通过直观的图形界面进行编辑，也可以利用YAML文件的形式来进行配置。

![](imgs/edit-configmap.png)



## 使用配置映射

{: .note }
`配置映射(ConfigMap)`可以作为数据卷挂载。`配置映射(ConfigMap)`也可被系统的其他组件使用， 而不一定直接暴露给容器组。
例如，`配置映射(ConfigMap)`可以保存系统中其他组件要使用的配置数据。`配置映射(ConfigMap)`最常见的用法是为同一命名空间里某容器组中运行的容器执行配置。 你也可以单独使用`配置映射(ConfigMap)`。

![](imgs/add-configmap-to-workload.png)