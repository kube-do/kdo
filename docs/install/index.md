---
title: 在Linux平台安装
nav_order: 8
---


1. TOC
{:toc}


{: .note }
对于在 Linux 上的安装，kdo平台既可以部署在云端，也可以部署在本地环境中，例如 AWS EC2、Azure VM 和裸机等。
安装kdo平台有两种模式，一种是只有一个操作系统，没有Kubernetes集群，需要先安装Kubernetes集群后再安装kdo平台。另外一种有现存的Kubernetes集群，只需要安装kdo平台。




## 在现存的Linux操作系统安装kdo平台

要在现存的Linux操作系统(操作系统建议使用AlmaLinux9或Ubuntu22.04以上，旧版本的内核比较旧，有些特性可能不支持)安装kdo平台，主要分为以下三个部分：


1. [安装Kubernetes集群](kubernetes)
2. [安装OIDC平台KeyCloak](keycloak)
3. [安装kdo平台](kdo)


## 在现存的Kubernetes集群上安装kdo平台


如果已经有Kubernetes集群(v1.28以上)，只需要安装kdo平台，主要有两个部分：
1. [安装OIDC平台KeyCloak](keycloak)或者[根据现有OIDC平台设置Kubernetes](#根据现有oidc平台设置kubernetes)
2. [安装kdo平台](kdo)




## 根据现有OIDC平台设置Kubernetes