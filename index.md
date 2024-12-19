---
title: Home
layout: home
nav_order: 1
---


# kube-do

*KDO*平台基于云原生技术构建的容器云平台


## kdo 是什么

kdo 核心100%开源，Serverless体验，不需要懂 Kubernetes 也能轻松管理容器化应用，可以从传统模式平滑无缝过渡到 Kubernetes，适合私有部署的一体化应用管理平台。

### 亮点

- **不用写 Dockerfile 和 Yaml:**  平台支持自动识别多种开发语言，如 Java、Python、Golang、NodeJS、Php、.NetCore 等，通过向导式流程完成构建和部署，不用写 Dockerfile 和 Yaml 即可完成构建和运行。

- **模块化拼装:**  在 KDO 上运行的业务组件支持一键发布为可复用的应用模版，统一的组件库存储，通过业务组件积木式拼装，实现业务组件的积累和复用。

- **应用一键安装和升级:** 上百应用开箱即用、各类已发布的微服务应用模版，均支持一键安装和升级。

- **丰富的可观测性:** KDO 提供全面的可观测性，涵盖集群监控、节点监控、应用监控、组件监控。

- **应用全生命周期管理:**  Serverless体验，支持应用、组件全生命周期管理和运维，如启动、停止、构建、更新、自动伸缩、网关策略管理等，无侵入微服务架构。

### 体验

1. **代码无需改动，就能变成云原生应用:**  对于新业务或已有业务，代码不需要改动就能将其容器化。不需要懂Docker 、Kubernetes等技术，就能将应用部署起来，具备云原生应用的全部特性。

2. **普通开发者不需要学习就能实现应用运维:**  通过应用级抽象，普通开发者了解应用的相关属性就能实现应用运维，并通过插件扩展监控、性能分析、日志、安全等运维能力，应用运维不再需要专用的SRE。

3. **像安装手机App一样安装云原生应用:**  各类云原生应用以应用模版的形式存放到应用市场，当对接各种基础设施或云资源，实现应用即点即用或一键安装/升级。

4. **复杂应用一键交付客户环境:**  复杂应用发布成应用模版，当客户环境可以联网，对接客户环境一键安装运行，当客户环境不能联网，导出离线应用模版，到客户环境导入并一键安装运行。

## 架构

KDO 底层可以对接各类私有云、公有云、Kubernetes 等基础设施，在基础设施之上，支持了用户管理、多租户、多集群管理、多云迁移等，以应用为中心分配和管理资源，实现了应用级多云管理。

对于开发者而言，不需要关注底层资源和概念。KDO 提供了一个开箱即用的平台，支持管理应用的全生命周期，包括开发、架构、交付和运维等阶段。

同时 KDO 对应用整体进行了包装和抽象，定义出了应用抽象模型。该模型包含应用运行所需的全部运行定义，与底层技术和概念隔离。开发者可以基于该模型实现能力的复用和共享，如组件一键发布、安装、升级等。




## 操作界面
kdo平台的操作界面分为管理员和开发者，只有集群管理员可以访问管理员界面，其他人员都只能访问开发者界面

### 开发者界面
开发者界面专注应用开发流程，页面比较少，对底层原理无需熟悉太多。
![开发者界面](imgs/dev-start.gif)

### 管理员界面
管理员界面能够管理整个平台的所有资源，需要对平台的底层有一定熟悉，主要给运维人员管理。
![管理员界面](imgs/admin-start.gif)



This is a *bare-minimum* template to create a Jekyll site that uses the [Just the Docs] theme. You can easily set the created site to be published on [GitHub Pages] – the [README] file explains how to do that, along with other details.

If [Jekyll] is installed on your computer, you can also build and preview the created site *locally*. This lets you test changes before committing them, and avoids waiting for GitHub Pages.[^1] And you will be able to deploy your local build to a different platform than GitHub Pages.

More specifically, the created site: 1

- uses a gem-based approach, i.e. uses a `Gemfile` and loads the `just-the-docs` gem
- uses the [GitHub Pages / Actions workflow] to build and publish the site on GitHub Pages

Other than that, you're free to customize sites that you create with this template, however you like. You can easily change the versions of `just-the-docs` and Jekyll it uses, as well as adding further plugins.

[Browse our documentation][Just the Docs] to learn more about how to use this theme.

To get started with creating a site, simply:

1. click "[use this template]" to create a GitHub repository
2. go to Settings > Pages > Build and deployment > Source, and select GitHub Actions

If you want to maintain your docs in the `docs` directory of an existing project repo, see [Hosting your docs from an existing project repo](https://github.com/just-the-docs/just-the-docs-template/blob/main/README.md#hosting-your-docs-from-an-existing-project-repo) in the template README.

----

[^1]: [It can take up to 10 minutes for changes to your site to publish after you push the changes to GitHub](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/creating-a-github-pages-site-with-jekyll#creating-your-site).

[Just the Docs]: https://just-the-docs.github.io/just-the-docs/
[GitHub Pages]: https://docs.github.com/en/pages
[README]: https://github.com/just-the-docs/just-the-docs-template/blob/main/README.md
[Jekyll]: https://jekyllrb.com
[GitHub Pages / Actions workflow]: https://github.blog/changelog/2022-07-27-github-pages-custom-github-actions-workflows-beta/
[use this template]: https://github.com/just-the-docs/just-the-docs-template/generate
