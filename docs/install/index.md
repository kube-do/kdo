---
title: 在Linux平台安装
nav_order: 8
---


1. TOC
{:toc}


{: .note }
对于Linux环境下的安装，KDO平台既支持云端部署也支持本地部署，包括虚拟机和物理服务器等多种形式。
安装KDO平台有两种主要模式：
无现有Kubernetes集群的情况：如果您的环境中没有现成的Kubernetes集群，首先需要在Linux操作系统上安装Kubernetes集群。完成这一步骤后，再进行KDO平台的安装。这种方式适合希望从零开始构建整个云原生基础设施的用户。
已有Kubernetes集群的情况：如果您已经有了一套运行中的Kubernetes集群，则可以直接在其上安装KDO平台。这种方式简化了部署流程，使得您能够迅速利用现有的资源来管理和扩展应用


## 在现存的Linux操作系统安装kdo平台

要在现有的Linux操作系统上安装KDO平台，推荐使用REHL9(AlmaLinux 9/Rockey 9)或Ubuntu 22.04及以上版本。旧版本的操作系统由于内核较老，可能无法支持某些新特性。主要分为以下三个部分：

1. [安装Kubernetes集群](./kubernetes)
2. [安装OIDC平台KeyCloak](./keycloak)
3. [安装kdo平台](./kdo)


## 在现存的Kubernetes集群上安装kdo平台

如果已经有Kubernetes集群(v1.28以上)，只需要安装kdo平台，主要有两个部分：
1. 先安装[OIDC平台KeyCloak](./keycloak)然后[根据OIDC平台设置Kubernetes](#根据oidc平台设置kubernetes)
2. [安装kdo平台](./kdo)


## 根据OIDC平台设置Kubernetes

{: .note }
通过vim打开`/etc/kubernetes/manifests/kube-apiserver.yaml`这个文件，在`spec->containers->command`添加对应的oidc的参数。
如果是其他OIDC Provider，可以根据其提供的参数进行修改。
```shell
vim /etc/kubernetes/manifests/kube-apiserver.yaml
```

![](imgs/update-apiserver.png)
### 修改API Server参数

```yaml 
spec:
  containers:
  - command:
    # 在末尾添加以下参数，如果已经存在，需要修改这些参数
    - --oidc-ca-file=/etc/kubernetes/pki/ca.crt
    - --oidc-client-id=kdo
    - --oidc-groups-claim=groups
    - --oidc-issuer-url=https://${NodeIP}:30443/realms/kdo
    - --oidc-username-claim=email
    - --oidc-username-prefix=-
```


{: .warning }
如果有多个Master节点，那每个Master节点都需要更改。


