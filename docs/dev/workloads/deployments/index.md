---
title: 无状态应用
parent: 工作负载
nav_order: 3
---

1. TOC
{:toc}

## 介绍

{: .note }
无状态应用（Deployment）用于管理运行一个应用负载的一组容器组，通常适用于不需要保持状态的负载，比如：Web服务，微服务。
[更多信息](https://kubernetes.io/zh-cn/docs/concepts/workloads/controllers/deployment)

[Pod信息](../pods)

## 操作菜单

![](imgs/deployments.png)

- 在无状态列表上有个四个按钮，可以批量化操作无状态应用。
 

| 菜单                               | 说明                                           |
|:---------------------------------|:---------------------------------------------|
| [启动](){: .btn  }                 | 批量启动无状态应用，默认是启动两个副本，如果是通过批量停止， 启动会恢复到停止前的副本数 |
| 重启<br/>{: .label .label-blue }   | 批量重启无状态应用，                                   |
| 停止<br/>{: .label .label-yellow } | 批量停止无状态应用                                    |
| [删除](){: .btn.label-red}         | 批量删除无状态应用，需要键入`confirmed`进行确认                |

- 操作无状态应用
