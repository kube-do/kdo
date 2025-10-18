---
title: 安装Kubernetes
parent: 在Linux平台安装
nav_order: 1
---


1. TOC
{:toc}

{: .note }
我们是通过[KubeKey](https://github.com/kubesphere/kubekey/releases/download/v3.1.11/kubekey-v3.1.11-linux-amd64.tar.gz)安装Kubernetes平台。
在安装过程中，首先需要配置环境变量**export KKZONE=cn**，以确保镜像从国内镜像仓库高效拉取，避免因默认从docker.io拉取而可能导致的镜像拉取失败及安装中断。
随后，只需执行命令`./kk create cluster -f config.yaml`，即可根据预设的配置文件启动集群的创建。
如需了解更多详细信息，请访问[KubeKey官方文档](https://github.com/kubesphere/kubekey)获取全面指导。




## 下载KubeKey

以确保您从正确的区域下载 KubeKey，运行以下命令来下载 KubeKey：
```shell
export KKZONE=cn
curl -O https://github.com/kubesphere/kubekey/releases/download/v3.1.11/kubekey-v3.1.11-linux-amd64.tar.gz
```



## Kubernetes单节点模式

如果只有一个节点，通过参照下面这个配置文件进行安装，比如这个节点IP是**10.255.1.32**，在APIServer参数和镜像仓库参数要结合实际情况进行配置。

```yaml
apiVersion: kubekey.kubesphere.io/v1alpha2
kind: Cluster
metadata:
  name: sample
spec:
  hosts:
    - {name: node32, address: 10.255.1.32, internalAddress: 10.255.1.32, port: 22, user: root, password: "password"}
  roleGroups:
    etcd:
    - node32
    control-plane:
    - node32
    worker:
    - node32
  controlPlaneEndpoint:
  kubernetes:
    version: v1.31.2
    clusterName: cluster.local
    autoRenewCerts: true
    containerManager: containerd
    apiserverArgs:
      # kubenretes采用oidc的认证方式，apiserverArgs必须要配置好oidc参数，这里默认配置kdo平台内置的keycloak, 
      # 如果已经有oidc认证平台，需要修改对应参数，查看文档https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/#openid-connect-tokens  
      - oidc-client-id=kdo
      - oidc-groups-claim=groups
      - oidc-issuer-url=https://10.255.1.32:30443/realms/kdo
      - oidc-ca-file=/etc/kubernetes/pki/ca.crt
      - oidc-username-claim=email
      - oidc-username-prefix=-
      # 事件保存24小时
      - event-ttl=24h0m0s      
    kubeletConfiguration:
      # 支持并行拉取镜像
      serializeImagePulls: false      
  etcd:
    type: kubeadm
  network:
    plugin: calico
    kubePodsCIDR: 10.10.11.0/22
    kubeServiceCIDR: 10.10.0.0/22
  registry:
    privateRegistry: ""
    namespaceOverride: ""
    # docker.io仓库的镜像地址，这个地址经常需要更新
    registryMirrors: ["https://docker.1ms.run"]
    # 这里默认采用内置的镜像仓库，如果已经有认证的harbor镜像仓库，这里可以不需要配置
    insecureRegistries: ["10.255.1.32:30002"]
  addons: []
```

## Kubernetes多节点模式

如果有多个节点，通过参照下面这个配置文件进行安装。

```yaml
apiVersion: kubekey.kubesphere.io/v1alpha2
kind: Cluster
metadata:
  name: sample
spec:
  hosts:
    - {name: node31, address: 10.255.1.31, internalAddress: 10.255.1.31, port: 16202, user: root, password: "password"}
    - {name: node32, address: 10.255.1.32, internalAddress: 10.255.1.32, port: 16202, user: root, password: "password"}
    - {name: node33, address: 10.255.1.33, internalAddress: 10.255.1.33, port: 16202, user: root, password: "password"}
  roleGroups:
    etcd:
    - node31
    - node32
    - node33
    control-plane:
    - node31
    - node32
    - node33
    worker:
    - node31
    - node32
    - node33
  controlPlaneEndpoint:
    ## Internal loadbalancer for apiservers 
    internalLoadbalancer: haproxy
    domain: lb.kubesphere.local
    address: ""
    port: 6443
  kubernetes:
    version: v1.31.2
    clusterName: cluster.local
    autoRenewCerts: true
    containerManager: containerd
    # 节点子网大小
    nodeCidrMaskSize: 25
    apiserverArgs:
      # kubenretes采用oidc的认证方式，apiserver Args必须要配置好oidc参数，这里默认配置kdo平台内置的keycloak, 
      # 如果已经有oidc认证平台，需要修改对应参数，查看文档https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/#openid-connect-tokens
      - oidc-client-id=kdo
      - oidc-groups-claim=groups
      - oidc-issuer-url=https://10.255.1.31:30443/realms/kdo
      - oidc-ca-file=/etc/kubernetes/pki/ca.crt
      - oidc-username-claim=email
      - oidc-username-prefix=-
      # 事件保存24小时
      - event-ttl=24h0m0s
    kubeletConfiguration:
      # 支持并行拉取镜像，提高拉取速度
      serializeImagePulls: false
  etcd:
    type: kubeadm
  network:
    plugin: calico
    kubePodsCIDR: 10.10.11.0/22
    kubeServiceCIDR: 10.10.0.0/22
  registry:
    privateRegistry: ""
    namespaceOverride: ""
    # docker.io仓库的国内镜像地址，这个地址经常需要更新
    registryMirrors: ["https://docker.1ms.run"]
    # 这里默认采用内置的镜像仓库，如果已经有认证的harbor镜像仓库，这里可以不需要配置
    insecureRegistries: ["10.255.1.31:30002"]
  addons: []
```


## Containerd配置文件

containerd的配置文件默认是`/etc/containerd/config.toml`这个文件，如果节点已经配置了containerd，需要参考以下这个配置文件。

```yaml
version = 2
# 容器镜像存储的目录，可以根据节点情况修改
root = "/var/lib/containerd"
state = "/run/containerd"

[plugins]
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
    runtime_type = "io.containerd.runc.v2"
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
      SystemdCgroup = true
  [plugins."io.containerd.grpc.v1.cri"]
    # 镜像同时拉取通道数，默认是3，比较小
    max_concurrent_downloads = 200
    sandbox_image = "registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.10"
    [plugins."io.containerd.grpc.v1.cri".cni]
      bin_dir = "/opt/cni/bin"
      conf_dir = "/etc/cni/net.d"
      max_conf_num = 1
      conf_template = ""
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        # docker.io仓库的国内加速地址，，和kubernetes安装配置文件一致。
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://docker.1ms.run", "https://registry-1.docker.io"]
        # 自建镜像仓库，和kubernetes安装配置文件一致，如果已经有认证的harbor镜像仓库，这里可以不需要配置。
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."10.255.1.32:30002"]
          endpoint = ["http://10.255.1.32:30002"]
```

安装好Kubernetes后，就可以去[安装KDO平台](../kdo)了。
