---
title: 主页
layout: home
nav_order: 1
---

## KDO 是什么
KDO是基于 Kubernetes 内核的分布式多租户商用云原生操作系统。
KDO是一个云原生应用管理平台，使用简单，不需要懂容器、Kubernetes和底层复杂技术，支持管理多个Kubernetes集群，和管理企业应用全生命周期。
主要功能包括应用开发环境、应用市场、微服务架构、应用交付、应用运维、应用级多云管理等。
KDO在开源能力的基础上，在多云集群管理、微服务治理、应用管理等多个核心业务场景进行功能延伸。

- KDO 不需要懂 Kubernetes 也能轻松管理容器化应用，可以从传统模式平滑无缝过渡到 Kubernetes，适合私有部署的一体化应用管理平台。
- KDO 底层可以对接各类私有云、公有云、Kubernetes 等基础设施，在基础设施之上，支持了用户管理、多租户、多集群管理、多云迁移等，以应用为中心分配和管理资源，实现了应用级多云管理。
- KDO 对应用整体进行了包装和抽象，定义出了应用抽象模型。该模型包含应用运行所需的全部运行定义，与底层技术和概念隔离。开发者可以基于该模型实现能力的复用和共享，如组件一键发布、安装、升级等。

### 亮点

- **不用写 Dockerfile 和 Yaml:**  平台支持自动识别多种开发语言，如 Java、Python、Golang、NodeJS、Php、.NetCore 等，通过向导式流程完成构建和部署，不用写 Dockerfile 和 Yaml 即可完成构建和运行。
  
- **支持云端一体:** 可以同时在IDE和KDO平台对应用进行操作，这样开发者大部分操作可以在IDE进行，提高了开发者的能效。 

- **模块化拼装:**  在 KDO 上运行的业务组件支持一键发布为可复用的应用模版，统一的组件库存储，通过业务组件积木式拼装，实现业务组件的积累和复用。

- **应用一键安装和升级:** 上百应用开箱即用、各类已发布的微服务应用模版，均支持一键安装和升级。

- **丰富地可观测性:** KDO 提供全面的可观测性，涵盖集群监控、节点监控、应用监控、组件监控。

- **应用全生命周期管理:** 支持应用、组件全生命周期管理和运维，如启动、停止、构建、更新、自动伸缩、网关策略管理等，无侵入微服务架构。

### 体验

1. **一键应用自动化:**  只需要一个Git URL，就可以实现应用的云原生化，支持多环境、多集群。

2. **代码无需改动，就能变成云原生应用:**  对于新业务或已有业务，代码不需要改动就能将其容器化。不需要懂Docker 、Kubernetes等技术，就能将应用部署起来，具备云原生应用的全部特性。

3. **普通开发者不需要学习就能实现应用运维:**  通过应用级抽象，普通开发者了解应用的相关属性就能实现应用运维，并通过插件扩展监控、性能分析、日志、安全等运维能力，应用运维不再需要专用的SRE。

4. **像安装手机App一样安装云原生应用:**  各类云原生应用以应用模版的形式存放到应用市场，当对接各种基础设施或云资源，实现应用即点即用或一键安装/升级。

5. **复杂应用一键交付客户环境:**  复杂应用发布成应用模版，当客户环境可以联网，对接客户环境一键安装运行，当客户环境不能联网，导出离线应用模版，到客户环境导入并一键安装运行。



