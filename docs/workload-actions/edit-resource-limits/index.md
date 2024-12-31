---
title: 编辑资源限制
parent: 工作负载操作
---

1. TOC
{:toc}

## 介绍
为了实现 K8s 集群中资源的有效调度和充分利用， K8s 采用要求(requests)和限制(limits)两种限制类型来对资源进行容器粒度的分配。
每一个容器都可以独立地设定相应的requests和limits。这 2 个参数是通过每个容器 containerSpec 的 resources 字段进行设置的。
一般来说，在调度的时候requests比较重要，在运行时limits比较重要。

## 编辑资源限制
- **要求(requests)** 定义了对应容器需要的最小资源量。这句话的含义是，举例来讲，比如对于一个 Spring Boot 业务容器，这里的requests必须是容器镜像中 JVM 虚拟机需要占用的最少资源。如果这里把 pod 的内存requests指定为 10Mi ，显然是不合理的，JVM 实际占用的内存 Xms 超出了 K8s 分配给 pod 的内存，导致 pod 内存溢出，从而 K8s 不断重启 pod 。

- **限制(limits)** 定义了这个容器最大可以消耗的资源上限，防止过量消耗资源导致资源短缺甚至宕机。特别的，设置为 0 表示对使用的资源不做限制。值得一提的是，当设置limits而没有设置requests时，Kubernetes 默认令requests等于limits。

- 进一步可以把requests和limits描述的资源分为 2 类：可压缩资源（例如 CPU ）和不可压缩资源（例如内存）。合理地设置limits参数对于不可压缩资源来讲尤为重要。

![](imgs/edit-resource-limits.png)