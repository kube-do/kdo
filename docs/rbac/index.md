---
title: Kubernetes权限管理
nav_order: 4
---

1. TOC
{:toc}

## 介绍

{: .note }
API Server作为Kubernetes集群系统的网关，是访问及管理资源对象的唯一入口，其余所有需要访问集群资源的组件，包括kube-controller-manager、kube-scheduler、kubelet和kube-proxy等集群基础组件、CoreDNS等集群的附加组件以及此前使用的kubectl命令等都要经由此网关进行集群访问和管理。
API Server会对每一次的访问请求进行合法性检验，包括用户身份鉴别、操作权限验证以及操作是否符合全局规范的约束等。


## Kubernetes 认证和授权
{: .note }
Kubernetes 的访问控制包括三个核心环节：认证、授权 和 准入控制。这三部分就像三道防线，层层守护你的集群。

![kubernetes-aac.webp](imgs/kubernetes-aac.webp)

### Kubernetes认证

身份验证插件负责对API请求的认证，支持的认证方式有：
- 令牌（Token）：常用于服务账户。
- X.509 客户端证书：适合用户通过`kubectl`访问集群。
- OpenID Connect（OIDC）：常用于集成第三方身份提供商，比如`Google`或`Keycloak`，这也是kdo平台使用的认证方式。
- Webhook：可以自定义认证逻辑。

API Server接收到访问请求时，它将调用认证插件尝试提取如下信息：
- Username：用户名，如kubernetes-admin等。
- UID：用户的数字标签符，用于确保用户身份的唯一性。
- Groups：用户所属的组，用于权限指派和继承。
- Extra：键值数据类型的字符串，用于提供认证时需要用到的额外信息。

### Kubernetes授权

{: .note }
成功通过身份认证后的操作请求还需要转交给授权插件进行许可权限检查，以确保其拥有执行相应的操作的许可。主要支持使用四类内建的授权

1. **Node:** 一种特殊的授权模块，基于 Node 上运行的 容器组 为 Kubelet 授权
2. **ABAC:** 基于属性的访问控制
3. **RBAC:** 基于角色的访问控制，这是现在主要的授权方式
4. **Webhook:** HTTP 请求回调，通过一个 WEB 应用鉴定是否有权限进行某项操作



## Kubernetes RBAC概念

{: .note }
Kubernetes的RBAC（Role-Based Access Control，基于角色的访问控制）是一种权限控制机制，它允许管理员通过定义角色来限制用户对集群资源的访问权限。
RBAC是Kubernetes中一个核心的授权策略，通过它，管理员可以实施精细化的权限管理，确保只有经过授权的用户或用户组才能执行特定的操作。

![kubernetes-rbac.png](imgs/kubernetes-rbac.png)

### Kubernetes RBAC的三要素
1. **Subjects**，也就是主体。可以是开发人员、集群管理员这样的自然人，也可以是- 系统组件进程，或者是 Pod 中的逻辑进程；在k8s中有以下三种类型：
   `User Account`：用户，这是有外部独立服务进行管理的。
   `Group`：组，这是用来关联多个账户的，集群中有一些默认创建的组，比如cluster-admin。
   `Service Account`：服务帐号，通过Kubernetes API 来管理的一些用户帐号，和 namespace 进行关联的，适用于集群内部运行的应用程序，需要通过 API 来完成权限认证，所以在集群内部进行权限操作，都需要使用到 ServiceAccount。
2. **API Resource**，也就是请求对应的访问目标。在 Kubernetes 集群中也就是各类资源，Pod，Deployment等；
3. **Verbs**，对应为请求对象资源可以进行哪些操作，包括但不限于"get", "list", "watch", "create", "update", "patch", "delete","deletecollection"等。

### Kubernetes RBAC的四个关键组件

{: .note }
RBAC在Kubernetes中主要由四个关键组件构成：Role、ClusterRole、RoleBinding和ClusterRoleBinding。

1. **Role:** 用于定义对命名空间内资源的访问权限。Role只能用于授予对某个特定命名空间中资源的访问权限。
2. **ClusterRole:** 与Role类似，但用于定义对集群范围内资源的访问权限。ClusterRole可以授予对集群中所有命名空间的资源或非资源端点的访问权限。
3. **RoleBinding:** 用于将Role绑定到一个或多个用户、服务账户或用户组，从而控制这些实体对命名空间内资源的访问。
4. **ClusterRoleBinding:** 用于将ClusterRole绑定到一个或多个用户、服务账户或用户组，控制这些实体对集群范围内资源的访问。


## Role/ClusterRole管理

{: .note }
Kubernetes RBAC 的角色(Role)或 集群角色(ClusterRole) 中包含一组代表相关权限的规则。

### Role/ClusterRole区别
- Role 总是用来在某个名字空间内设置访问权限； 在你创建 Role 时，你必须指定该 Role 所属的名字空间。
- 与之相对，ClusterRole 则是一个集群作用域的资源。这两种资源的名字不同（Role 和 ClusterRole） 是因为 Kubernetes 对象要么是名字空间作用域的，要么是集群作用域的，不可两者兼具。
- ClusterRole 有若干用法。你可以用它来：
定义对某名字空间域对象的访问权限，并将在个别名字空间内被授予访问权限；
为名字空间作用域的对象设置访问权限，并被授予跨所有名字空间的访问权限；
- 为集群作用域的资源定义访问权限。
如果你希望在名字空间内定义角色，应该使用 Role； 如果你希望定义集群范围的角色，应该使用 ClusterRole。

![](imgs/roles.png)

### 角色说明
![](imgs/role.png)



## RoleBinding/ClusterRoleBinding管理 

{: .note }
角色绑定（Role Binding）是将角色中定义的权限赋予一个或者一组用户。 它包含若干主体（Subject）（用户、组或服务账户）的列表和对这些主体所获得的角色的引用。 

### RoleBinding/ClusterRoleBinding区别
- RoleBinding 在指定的名字空间中执行授权，而 ClusterRoleBinding 在集群范围执行授权。
- 一个 RoleBinding 可以引用同一的名字空间中的任何 Role。 或者，一个 RoleBinding 可以引用某 ClusterRole 并将该 ClusterRole 绑定到 RoleBinding 所在的名字空间。
- 如果你希望将某 ClusterRole 绑定到集群中所有名字空间，你要使用 ClusterRoleBinding。 RoleBinding 或 ClusterRoleBinding 对象的名称必须是合法的 路径分段名称。

![](imgs/rolebindings.png)

### 角色绑定说明

![](imgs/rolebinding.png)

### 创建角色绑定








