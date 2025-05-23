---
title: 路由(Ingress)
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

| 菜单   | 说明                                                           |
|:-----|:-------------------------------------------------------------|
| 名称   | 这个资源对象的名字                                                    |
| 路由类型 | 路由类型(IngressClass) 资源用于定义和区分不同类型的路由控制器，现在默认使用的是nginx-ingress |
| 主机名  | 应用的域名，要确保已经配置hosts文件或者设置了DNS，把域名指向了路由控制器的IP                  |
| 路径   | 应用的根路径，一般为`/`                                                |
| 服务   | 要对外暴露的服务名                                                    |
| 目标端口 | 服务的监听端口                                                      |



## 编辑路由

![](imgs/edit-ingress.png)

{: .note }
在图形化界面中，用户只能进行一些基础的配置。若需使用更多高级特性，则需要手动编辑路由的YAML配置文件，主要是通过修改路由资源的注解来实现。
这种方式允许用户根据具体需求定制路由规则，解锁更复杂的配置选项和功能，如细粒度的流量管理、定制化的负载均衡策略以及更高级的安全设置等。
请参考[路由高级特性](https://www.w3ccoo.com/nginx/nginx_ingress_annotations.html)。

