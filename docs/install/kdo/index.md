---
title: 安装KDO平台
parent: 在Linux平台安装
nav_order: 2
---


1. TOC
{:toc}


## 安装步骤
kdo平台的安装主要分为三个步骤：
1. **下载安装脚本**
2. **安装前检查**
3. **运行安装脚本**

## 下载安装脚本
首先下载KDO安装脚本到Kubernetes的Master节点，linux平台可以通过`wget`或`curl`下载。
[KDO平台安装脚本](https://gitee.com/kube-do/docs/releases/download/latest/install.zip)

```shell
#下载安装脚本
wget https://gitee.com/kube-do/docs/releases/download/latest/install.zip
# 解压文件,进入安装目录
unzip -x install.zip && cd install
# 设置安装脚本为可执行 
chmod +x kdo-install.sh
```

## 定制安装脚本
1. 可以通过调整脚本的环境变量`KC_PASS`来修改管理员的密码，默认为`Kdo@Pass#2025`
2. 如果是其他的OIDC认证平台，需要把OIDC对应环境变量修改为对应OIDC认证平台的信息，这里需要[Kubernetes的ODIC参数](../index.md#根据oidc平台设置kubernetes)保持一致。
![](imgs/setup-oidc.png)

```shell
vim kdo-install.sh
# 平台管理员的密码
export KC_PASS=Kdo@Pass#2025

# 如果是其他OIDC平台，需要设置这些环境变量
export OIDC_CLIENT_ID=kdo
export OIDC_CLIENT_SECRET=kubedo
export OIDC_ISSUER_URL=https://$NODE_IP:30443/realms/kdo
```

## 运行安装脚本
![](imgs/install-help.png)
这个脚本自动化安装脚化，一般只需要两个参数就可以运行了，节点IP（注意：这个IP必须能被客户端访问到）和默认平台域名后缀（这个域名后缀是部署在KDO平台的应用的域名后缀）。
```shell
# 直接添加参数运行
./kdo-install.sh 10.22.1.20 kube-do.dev
```
这里由于NODE_IP和DEFAULT_DOMAIN已经在环境变量设置过，可以直接获取，当然也可以手动输入这两个参数。
![](imgs/start-install.png)

### 中途确认
![](imgs/wait-install.png)
由于安装的组件比较多，有些组件需要等其他组件初始化完成后才能继续安装，这里另外打开一个Linux Terminal，
在Master节点运行 `kubectl get pod -A`确认所有Pod已经正常运行（ready）
![all-pods-ready.png](imgs/all-pods-ready.png)


### 安装验证
![](imgs/console-is-ready.png)

1. 安装完成后，运行`kubectl get pod -n kubedo-system`，根据提示确认console组件已经启动，就可以访问平台了, KDO平台默认访问地址是`http://$NODE_IP:30080`
2. 已经创建默认的项目kdo, 里面有4个环境：`开发(dev)`、`测试(test)`、`预发(stage)`、`生产(prod)`。 
3. 如果是内置的KeyCloak平台，已经创建四个用户: 项目管理员： `pa1`，项目开发者: `dev1`，项目测试人员: `qa1`, 项目运维人员: `ops1`, 他们的默认密码都是: `Kdo#2025`
   现在就可以通过这些用户来体验KDO平台了。

   
        

