---
title: 主页
parent: 开发者界面
nav_order: 1
---

1. TOC
{:toc}

## 项目概览

{: .note }
在**项目概览**页面，可以对当前项目有个整体认识，包括基本信息，资源使用，监控信息，事件等。

![](imgs/env.gif)


## 环境概览

{: .note }
在**环境概览**页面，可以对当前项目的当前环境有个整体认识，包括基本信息，资源使用，监控信息，事件等，点击对应链接可以直接访问对应的资源。

![](imgs/env.gif)


## 资源搜索

{: .note }
在**资源搜索**页面，可以通过资源的`名字`或`IP`搜索对应的资源，包括:容器组，无状态应用，有状态应用，配置文件，服务，路由等， `名字`或`IP`需要输入完整的名字或IP地址。

{: .warning }
由于KDO平台是基于[Kubernetes RBAC的权限模型](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/rbac/)，有些资源虽然可以搜索到，但是却没有权限可以访问，所以不用担心有安全问题。

![](imgs/search.gif)