---
title: 安装kdo组件
parent: 在Linux平台安装
---


1. TOC
{:toc}


{: .note }
kdo组件的安装主要分为两个步骤：


## 下载安装脚本
首先下载kdo安装脚本到Kubernetes的Master节点，linux平台可以通过wget或curl下载。
[kdo平台安装脚本](https://gitee.com/kube-do/docs/releases/download/latest/install.zip)

```shell
#下载安装脚本
wget https://gitee.com/kube-do/docs/releases/download/v0.1/install.zip

# 解压文件
unzip -x install.zip

# 进入安装目录
cd install

# 设置安装脚本为可执行 
chmod +x kdo-install.sh  
```


## 运行安装脚本
![](imgs/install-help.png)
这个脚本自动化安装脚化，一般只需要两个参数就可以运行了，节点IP和默认域名后缀，如果采用的内置KeyCloak作为认证平台，
这两个参数需要和[安装KeyCloak](../keycloak#安装keycloak)的保持一致。

如果是其他的OIDC认证平台，需要手动修改这个脚本，把oidc对应环境变量修改为对应OIDC认证平台的信息。

```shell
export OIDC_CLIENT_ID=kdo
export OIDC_CLIENT_SECRET=kubedo
export OIDC_ISSUER_URL=https://$NODE_IP:30443/realms/kdo
```




