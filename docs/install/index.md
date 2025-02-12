---
title: 在Linux平台安装
nav_order: 8
---


1. TOC
{:toc}


{: .note }
对于在 Linux 上的安装，kdo平台既可以部署在云端，也可以部署在本地环境中，例如 AWS EC2、Azure VM 和裸机等。
安装kdo平台有两种模式，一种是只Linux操作系统，没有Kubernetes集群，需要先安装Kubernetes集群后再安装kdo平台 。
另外一种有现存的Kubernetes集群，只需要安装kdo平台。


## 在现存的Linux操作系统安装kdo平台

要在现存的Linux操作系统(操作系统建议使用AlmaLinux9或Ubuntu22.04以上，旧版本操作系统的内核比较旧，有些特性可能不支持)安装kdo平台，主要分为以下三个部分：

1. [安装Kubernetes集群](kubernetes)
2. [安装OIDC平台KeyCloak](keycloak)
3. [安装kdo平台](kdo)


## 在现存的Kubernetes集群上安装kdo平台

如果已经有Kubernetes集群(v1.28以上)，只需要安装kdo平台，主要有两个部分：
1. 先安装[OIDC平台KeyCloak](keycloak)然后[根据OIDC平台设置Kubernetes](#根据oidc平台设置kubernetes)
2. [安装kdo平台](kdo)


## 根据OIDC平台设置Kubernetes

{: .note }
通过vim打开/etc/kubernetes/manifests/kube-apiserver.yaml这个文件，在`spec->containers->command`添加对应的oidc的参数。
假如是采用内置的KeyCloak OIDC认证平台，可以参照以下内容，只需要改`oidc-issuer-url`这个参数，把${NodeIP}改为对应节点IP，比如节点是10.128.0.100
如果是其他OIDC Provider，可以根据其提供的参数进行修改。

```shell
vim /etc/kubernetes/manifests/kube-apiserver.yaml
```

### 修改前

```yaml 
spec:
  containers:
  - command:
    # 在末尾添加以下参数，
    - --oidc-ca-file=/etc/kubernetes/pki/ca.crt
    - --oidc-client-id=kdo
    - --oidc-groups-claim=groups
    - --oidc-issuer-url=https://${NodeIP}:30443/realms/kdo
    - --oidc-username-claim=email
    - --oidc-username-prefix=-
```

### 修改后

```yaml 
spec:
  containers:
  - command:
    # 在末尾添加以下参数，
    - --oidc-ca-file=/etc/kubernetes/pki/ca.crt
    - --oidc-client-id=kdo
    - --oidc-groups-claim=groups
    - --oidc-issuer-url=https://10.255.0.100:30443/realms/kdo
    - --oidc-username-claim=email
    - --oidc-username-prefix=-
```

{: .warning }
如果有多个Master节点，那每个Master节点都需要更改。


