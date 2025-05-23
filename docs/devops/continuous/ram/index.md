---
title: 应用模版持续交付
parent: 持续交付
description: 本节将会介绍如何在 kdo 上实现应用模版持续交付
keywords:
- 应用模版
- 持续交付
---


## kdo 应用模版持续交付流程图

如下图所示，我们以`后台管理系统`为例，利用 kdo 应用模版实现持续交付，通常需要以下流程。

1. 用户提交代码到源码仓库，此时在开发环境中构建和进行自动化测试流程，测试完成后，如果不通过则反馈到开发人员进行调整，从而保证代码质量。

2. 当开发人员功能基本开发完成后，此时将开发的`后台管理系统`发布到应用市场，作为 `1.0` 版本，接下来测试人员从应用市场一键安装 `1.0` 版本，即可部署出完整的测试环境用于测试。而开发者基于开发环境继续开发，而测试人员则进行完整功能测试。如果功能测试失败，则继续反馈给开发人员。

3. 开发人员修改完代码自测完成后，再次发布`后台管理系统`的 `2.0` 版本，此时测试人员可以在测试环境一键升级，升级完成后继续测试。

3. 当 `3.0` 版本测试通过以后，我们就可以认为已经有了高质量可交付的版本。接下来可以在应用市场标记该版本已经 Release，后续在生产环境部署时，直接从应用市场部署 `3.0` 版本即可。

<!-- ![ram-delivery](https://grstatic.oss-cn-shanghai.aliyuncs.com/docs/5.10/delivery/ram-delivery.jpg) -->
![](https://static.goodrain.com/docs/5.11/delivery/continuous/source-code/template-delivery.png)

## 操作步骤

### 准备工作

1. 拥有一套 kdo 集群，参考[快速安装](/docs/quick-start/quick-install)，多个团队/项目(用于模拟开发环境、测试环境、生产环境)。

### 部署开发环境

1. 参考[基于源代码创建组件](/docs/devops/app-deploy/)，根据你的代码语言部署你的各个业务模块。

2. 各个业务部署完成后，参考[微服务架构指南](/docs/micro-service/overview)进行服务编排，此时你就得到了一个在 kdo 上完整运行的应用。

3. 在你的 Git 仓库配置[自动部署](/docs/devops/continuous-deploy/gitops)，完成该步骤后，可以通过提交代码触发开发环境的自动构建以及自动化测试，再根据构建结果完成代码调整。

### 制作应用模版

1. 在应用拓扑图页面左侧，选择`发布->发布到组件库`， 即可进入模版设置页面。各个参数详细说明参考[附录1: 模版设置页面参数说明](/docs/delivery/app-model-parameters)

2. 新建一个应用模版`后台管理系统`，可选择发布范围为企业，设定好发布的版本 `1.0`，点击`提交`，接下来将会同步所有组件的镜像，推送到本地镜像仓库中。同步完成后，点击`确认发布`，即发布完成。接下来在 `平台管理->应用市场->本地组件库`，即可看到发布好的应用模版。


注：仅有企业管理员可以看到平台管理按钮。


### 

### 部署测试环境

1. 新建一个`测试环境`的团队，在该团队中新建应用`后台管理系统`，在应用页面中，点击`添加组件->本地组件库`，选择你刚刚发布的`后台管理系统`模版，选择 `1.0`  版本安装，即可完成测试环境的部署。

2. 测试人员在这个环境中进行测试，测试完成后，将问题反馈到开发人员。开发人员进行修改自测完成后，再次发布 `2.0` 版本。

3. 此时，测试人员可以在测试环境的`后台管理系统`应用中，选择`升级`，可以看到 `2.0` 版本和 `1.0` 版本的差异，测试人员可以一键完成应用升级后，再次进行测试。

4. 最终，开发人员发布的 `3.0` 版本，通过了完整的测试，此时我们可以去 `平台管理->应用市场->本地组件库-后台管理系统`，即可看到该模版下所有版本，我们可以点击`设置为 Release 状态`，标记该版本是高质量可交付的版本。

### 部署生产环境

1. 具有生产环境部署权限的用户，可以在`平台管理->应用市场->本地组件库`，看到应用的 Release 状态。此时，可以看到`后台管理系统`的 `3.0` 版本是 Release 状态，用户就可以放心的用该版本进行交付。

2. 点击`后台管理系统`模版右侧的安装，团队选择`生产环境`，以及要安装的应用和版本，即可一键部署出生产环境。

3. 后续如果有问题，仍然是开发人员发布 `3.1` 版本，测试人员测试通过后，运维人员在`生产环境`的应用中，选择`升级`，即可完成上线。

