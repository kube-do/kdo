---
title: 环境概览
parent: 开发者主页
nav_order: 2
---

1. TOC
{:toc}



## 介绍

{: .note }
在kdo平台，开发者页面的**应用环境**是对应Kubernetes的[命名空间](../../../admin/management/namespaces)。
在**环境概览**页面，可以对当前项目的当前环境有个整体认识，主要有六个页面：[详情(1)](#详情)、[库存(2)](#库存)、[状态(3)](#状态)、[使用率(4)](#使用率)、[资源配额(5)](#资源配额)、[事件(6)](#事件)。
点击对应链接可以直接访问对应的资源。

![namespace.jpg](imgs/namespace.jpg)

## 详情
在详情子页面，您可以查看当前环境的基本信息，如名称、标签和描述等。
这些信息为您提供了一个快速了解环境配置的途径。若需获取更详尽的信息，只需点击“查看所有”按钮，即可深入探索该环境的更多细节，包括配置参数、关联资源及状态等。

![detail.png](imgs/detail.png)

## 库存

在库存子页面，可以获取当前环境内的各类资源，包括: [容器组](../../workloads/pods)、[无状态](../../workloads/deployments)、[有状态](../../workloads/statefulsets)、
[配置映射](../../configurations/configmaps)、[服务](../../network-stroage/services)、[持久化声明](../../network-stroage/persistent-volume-claims)等。点击对应的资源链接，可以直接跳转资源类型页面。

![inventory.png](imgs/inventory.png)

## 状态
在状态子页面，您可以一目了然地查看当前环境是否正常以及应用是否存在异常告警。
如果检测到任何问题，可以通过点击告警中的“查看详情”链接，深入查看具体的告警详情。

![status.png](imgs/status.png)

## 使用率
在使用率子页面，您可以获取环境中资源使用情况的详细概览。
这里提供了选择不同时间段的功能，以便您查看特定时间范围内的资源消耗情况。
点击进入具体的时间段，可以进一步查看详情，包括但不限于CPU、内存、存储等资源的使用率

![utilization.png](imgs/utilization.png)

## 资源配额

如果管理员设置了[资源配额](../../../admin/management/resourcequotas)，可以查看当资源的使用情况，如果资源不足，可以联系管理员进行扩容。

![resource-quotas.png](imgs/resource-quotas.png)

## 事件

可以查看这个环境内所有资源的事件。关于事件，请访问[更多信息](../../../observability/events)。

![events.png](imgs/events.png)

