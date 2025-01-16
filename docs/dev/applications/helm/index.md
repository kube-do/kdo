---
title: Helm应用
parent: 应用管理
nav_order: 4
---

1. TOC
{:toc}

   
## 介绍

{: .note }
很多人都使用过Ubuntu下的`apt-get`或者CentOS下的`yum`, 这两者都是Linux系统下的包管理工具。采用apt-get/yum，应用开发者可以管理应用包之间的依赖关系，发布应用。
用户则可以以简单的方式查找、安装、升级、卸载应用程序，Helm可以非常方便的部署一些组件，比如：MySQL、Redis，Kafka这些应用。
下面是 Helm 的架构图。

![Helm 架构图](imgs/helm-chart.png)


## 创建Helm应用


1. 访问Helm菜单，点击`新建`；
2. 搜索对应组件名，查看说明内容后，选择`创建`；
3. 设置Helm名字(一般使用默认即可)，选择对应版本，配置组件参数后，选择`创建`，一个Helm应用就创建好了。

![](imgs/createHelm.gif)



## 管理Helm应用

{: .note }
点击对应Helm应用，可以更新或者删除Helm应用，也可以查看当前Helm应用的信息，包括：版本，安装时间等，还可以查看历史版本，可以选择回滚。

![](imgs/manageHelm.gif)
