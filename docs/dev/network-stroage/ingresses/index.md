---
title: 路由(Ingresses)
parent: 网络存储
nav_order: 2
---

1. TOC
{:toc}

## 介绍

{: .note }
路由(Ingress)概念允许你通过 Kubernetes API 定义的规则将流量映射到不同后端。路由使用一种能感知协议配置的机制来解析 URI、主机名称、路径等 Web 概念， 让你的 HTTP（或 HTTPS）网络服务可被访问。
[更多资料](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress/)

![](imgs/ingress.png)


## 新增路由

{: .note }
新增/路由编辑有表单视图和YAML视图，默认一些简单路由可以使用表单视图，如果要一些高级能力，需要使用YAML编辑。
在添加路由，只需要选择对应的服务和端口，其他的选项都可以自动生成，需要自定义，可以手动修改。

![create-ingress.gif](imgs/create-ingress.gif)

 ### 常用字段 

| 菜单   | 说明                                                                          |
|:-----|:----------------------------------------------------------------------------|
| 详情   | 容器组的详细信息                                                                    |
| 指标   | 容器组的监控指标，包括CPU, 内存，网络，磁盘                                                    |
| YAML | 容器组资源对象的YAML                                                                |
| 环境变量 | 容器组的环境变量，继承它的拥有者（Owner），一般为[无状态应用](../deployments)或[有状态应用](../statefulsets) |
| 日志   | 容器组打印到标准输出的日志内容                                                             |
| 事件   | 容器组的事件（事件包含了Kubernetes里面非常重要的信息，对排查问题非常有帮助）                                 |
| 终端   | 容器组的访问终端，并且支持上传和下载文件                                                        |
| 聚合日志 | 存储在日志平台的日志，可以访问更久时间的日志                                                      |



## 编辑路由




![](imgs/edit-ingress.png)
