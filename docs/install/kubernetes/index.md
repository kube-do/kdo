---
title: 安装Kubernetes
parent: 安装平台
---


1. TOC
{:toc}

如果现在只安装了操作系统，


## 安装Kubernetes

我们通过[KubeKey](https://www.kubesphere.io/zh/docs/v3.3/installing-on-linux/introduction/kubekey/)安装Kubernetes平台
安装时需要先设置环境变量**export KKZONE=cn**，这样拉取镜像就会从国内镜像仓库拉取，设置好配置文件后
运行./kk create cluster -f config.yaml即可。
更多信息参考[KubeKey官方文档](https://www.kubesphere.io/zh/docs/v3.3/installing-on-linux/introduction/intro/)



### Kubernetes单节点模式
如果只有一个节点，通过参照这边这个配置文件进行安装，比如这个节点IP是**10.255.1.32**，在APIServer参数和镜像仓库参数要结合实际情况进行配置。

```yaml
apiVersion: kubekey.kubesphere.io/v1alpha2
kind: Cluster
metadata:
  name: sample
spec:
  hosts:
    - {name: node32, address: 10.255.1.32, internalAddress: 10.255.1.32, port: 22, user: root, password: "password"}
  roleGroups:
    ha:
    - node32
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
    # kubenretes采用oidc的认证方式，apiserverArgs必须要配置好oidc参数，这里默认配置kdo平台内置的keycloak, 
    # 如果已经有oidc认证平台，需要对应参数
    apiserverArgs:
      - oidc-client-id=kdo
      - oidc-groups-claim=groups
      - oidc-issuer-url=https://10.255.1.32:30443/realms/kdo
      - oidc-ca-file=/etc/kubernetes/pki/ca.crt
      - oidc-username-claim=email
      - oidc-username-prefix=-
  etcd:
    type: kubeadm
  network:
    plugin: calico
    kubePodsCIDR: 10.10.11.0/22
    kubeServiceCIDR: 10.10.0.0/22
    multusCNI:
      enabled: false
  registry:
    privateRegistry: ""
    namespaceOverride: ""
    registryMirrors: ["https://docker.rainbond.cc"]
    # 这里默认采用内置的镜像仓库，如果已经有认证的harbor镜像仓库，这里可以不需要配置
    insecureRegistries: ["10.255.1.32:30002"]
  addons: []
```

### Kubernetes多节点模式


### containerd配置文件

```editorconfig
version = 2
root = "/var/lib/containerd"
state = "/run/containerd"

[grpc]
  address = "/run/containerd/containerd.sock"
  uid = 0
  gid = 0
  max_recv_message_size = 16777216
  max_send_message_size = 16777216


[plugins]
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
    runtime_type = "io.containerd.runc.v2"
    [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
      SystemdCgroup = true
  [plugins."io.containerd.grpc.v1.cri"]
    max_concurrent_downloads = 200
    sandbox_image = "registry.cn-beijing.aliyuncs.com/kubesphereio/pause:3.9"
    [plugins."io.containerd.grpc.v1.cri".cni]
      bin_dir = "/opt/cni/bin"
      conf_dir = "/etc/cni/net.d"
      max_conf_num = 1
      conf_template = ""
    [plugins."io.containerd.grpc.v1.cri".registry]
      [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
          endpoint = ["https://docker.rainbond.cc", "https://registry-1.docker.io"]

        [plugins."io.containerd.grpc.v1.cri".registry.mirrors."10.255.1.31:30002"]
          endpoint = ["http://10.255.1.31:30002"]
```
