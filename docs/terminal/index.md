---
title: 命令行模式
---

1. TOC
{:toc}


{: .note }
相比其他的容器云平台，kdo平台命令行的功能非常强大，可以支持CloudShell和LocalShell两种，对运维人员和开发人员来都非常的方便快捷。


## CloudShell模式
cloudshell主要用于kubernetes比较熟悉的开发者和运维人员，通过命令行非常快速的处理问题，还可以通过定制化一些脚本实现批量操作，提高效率。

### cloudshell命令行界面优势
kdo Cloud Shell 是一种基于云的命令行界面（CLI），kdo Cloud Shell可以为用户提供一系列优势，主要包括：
1. **无需安装和配置：** 用户不需要在本地计算机上安装Kubernetes CLI工具(kubectl、oc、helm、istioctl、tkn等)或其他依赖项。这节省了设置环境的时间，特别是在需要快速访问集群进行管理和故障排查时。
2. **随时随地访问：** 只要有浏览器和互联网连接，就可以从任何地方访问您的Kubernetes集群。这对于远程工作或处理紧急问题非常有用。
3. **安全性高：** 由于Cloud Shell是直接与您的kdo账户集成的，因此它继承了kdo平台安全措施。这意味着您不需要担心密钥管理或SSH访问的问题。
4. **即时性：** 由于它是基于云的，所以能够立即反映最新的状态和更新，确保您总是使用最新版本的工具和访问最新的集群数据。
5. **内置认证：** 自动与您的kdo账户进行身份验证，省去了手动配置kubectl以连接到不同集群的麻烦。
6. **便捷的多集群管理：** 对于管理多个Kubernetes集群的用户来说，Cloud Shell提供了一种简单的方法来切换不同的上下文，而无需重新配置本地环境。
总的来说，kdo Cloud Shell为开发者和运维人员提供了便捷、高效且安全的方式来管理和操作Kubernetes集群，尤其适合那些希望减少本地环境配置复杂性的用户

### 访问cloudshell命令行界面
kdo Cloud Shell 集成在kdo的管理控制台中，点击kdo页面右上角的这个图标就可以访问
![](img/open-terminal.png)
如果是集群管理员，默认会创建`kubernetes-terminal`这个命名空间，其他用户可以选择对应[项目的命名空间](../devops/project-manage)
![](img/create-terminal.png)

### 日常操作
![](img/run-terminal.png)


### 数据存储
由于kdo Cloud Shell本身也应该一个容器组，当容器重启后，里面的状态就会丢失，如果需要存储持久化数据，只需要把数据放到`/data`目录即可，这个目录已经挂载一个[持久化存储卷](../storage)。


## LocalShell模式
localshell主要用于本地需要和kdo平台互通的功能，比如本地通过kubectl操作平台，本地IDE和kdo平台的关联。

### 打开localshell
LocalShell集成在kdo的管理控制台中，访问kdo页面右上角用户菜单，点击`复制登录命令`
![](img/open-local-shell.png)


### 下载命令行工具
打开页面，里面`Windows`、`Linux`、`Mac`各种操作系统的命令行工具，访问对应操作系统的链接，下载对应的命令行工具oc，确保有可执行的权限，放置到对应的目录（注意：这里需要用到管理员的权限）
比如:Windows是`C:\Windows\System32\`,Linux和Mac是 `/usr/bin/` 。 然后点击下面复制登录命令，可以通过命令行访问kdo平台。
![local-shell.png](img/local-shell.png)

{: .note }
oc是一个兼容kubectl的命令行工具，oc get pod 和kubectl get pod是一样的，其他的kubectl命令也是同样。