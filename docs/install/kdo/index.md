---
title: 安装kdo组件
parent: 在Linux平台安装
---

1. TOC
{:toc}




## kdo配置文件说明

```yaml
apiVersion: console.kube-do.cn/v1
kind: ConsoleConfig
servingInfo:
  bindAddress: http://0.0.0.0:9000
clusterInfo:
  consoleBaseAddress: http://10.255.1.31:30080
  k8sModeOffClusterEndpoint: https://10.255.1.31:6443
  k8sMode: off-cluster
  publicDir: /opt/bridge/static
auth:
  clientID: kdo
  clientSecret: kubedo
  issuerURL: https://10.255.1.31:30443/realms/kdo
  k8sAuth: oidc
  userAuth: oidc
  oidcProvider: Keycloak
customization:
  branding: kdo
monitoringInfo:
  k8sModeOffClusterAlertmanager: http://alertmanager-main.monitoring.svc:9093
  k8sModeOffClusterThanos: http://prometheus-k8s.monitoring.svc:9090
registry:
 registryURL: 
 registryPassword: 
```