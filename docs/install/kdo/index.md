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
wget https://gitee.com/kube-do/docs/releases/download/latest/install.zip
# 解压文件,进入安装目录
unzip -x install.zip && cd install
# 设置安装脚本为可执行 
chmod +x kdo-install.sh
```


## 运行安装脚本

### 安装前检查
如果是其他的OIDC认证平台，需要通过`vim`手动修改这个`kdo-install.sh`脚本，把OIDC对应环境变量修改为对应OIDC认证平台的信息。
![](imgs/setup-oidc.png)
```shell
vim kdo-install.sh
#如果是其他OIDC平台，需要设置这些环境变量
export OIDC_CLIENT_ID=kdo
export OIDC_CLIENT_SECRET=kubedo
export OIDC_ISSUER_URL=https://$NODE_IP:30443/realms/kdo
```

### 开始安装
![](imgs/install-help.png)
这个脚本自动化安装脚化，一般只需要两个参数就可以运行了，节点IP和默认域名后缀，如果采用的内置KeyCloak作为认证平台，
这两个参数需要和[安装KeyCloak](../keycloak#安装keycloak)的保持一致。
```shell
# 根据环境变量运行，NODE_IP和DEFAULT_DOMAIN这两个环境在安装KeyCloak已经设置过
./kdo-install.sh $NODE_IP $DEFAULT_DOMAIN
# 直接添加参数运行
./kdo-install.sh 10.22.1.20 abc.com
```
这里由于nodeIP和defaultDomain已经在环境变量设置过，可以直接获取，也可以手动输入这两个参数。
![](imgs/start-install.png)

### 中途确认
![](imgs/wait-install.png)
由于安装的组件比较多，有些组件需要等其他组件初始化完成后才能继续安装，这里另外打开一个Terminal，
在Master节点运行 kubectl get pod -A 确认所有Pod已经正常运行（ready）
![all-pods-ready.png](imgs/all-pods-ready.png)


### 安装验证 
![](imgs/after-install.png)
1. 安装完成后，根据提示确认console已经启动，就可以访问平台了, kdo平台默认访问地址是`http://$NODE_IP:30080`
2. 如果需要增加/修改/删除用户和组，则访问KeyCloak进行操作，KeyCloak默认的访问地址是`https://$NODE_IP:30443`


