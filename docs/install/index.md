---
title: 安装平台
nav_order: 8
---



## 安装kdo平台
安装kdo平台有两种模式，一种是只有一个操作系统，没有Kubernetes集群，需要先安装Kubernetes集群后再安装kdo平台，另外一种有现存的Kubernetes集群，只需要安装kdo平台。



### 1.使用IP地址

由于KeyCloak是通过web通过服务的，需要先确认对应的域名，比如:`sso.kube-do.cn`，如果有dns服务器，需要把这个域名指向kdo的master节点
如果需要在的master和集群coredns进行设置

