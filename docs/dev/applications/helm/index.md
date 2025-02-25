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
Helm就是一个类似的工具，只不过它不是基于Linux操作系统，它是基于Kubernetes集群的应用包管理工具。
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
点击对应的Helm应用，您可以执行多种管理操作，包括更新或删除该Helm应用。 此外，您还能查看当前Helm应用的详细信息，如版本号、安装时间等重要数据。
对于需要进行版本控制和回滚操作的情况，系统还提供了历史版本的浏览功能。

![](imgs/manageHelm.gif)
