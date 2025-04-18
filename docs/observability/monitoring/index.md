---
title: 监控(Monitoring)
parent: 观测平台
nav_order: 1
---

1. TOC
{:toc}


## 介绍
{: .note }
可观测性中心旨在提供全面的监控和可观测性支持，以确保系统的稳定性、性能和安全性。可观测性中心为企业提供了一个集中化的平台，使用户能够实时监控、分析和管理系统的运行状态和关键指标。
它包括观测中心面板、监控大屏、全局日志、报警等功能，帮助用户快速发现和解决潜在的问题，提高系统的可靠性和可用性。
可观测性中心的监控报警功能，主要对服务进行实时监控并预警提醒，能够及时发现系统、应用组件、服务等问题，避免故障扩大化从而对业务造成影响。
在本章节中，您将了解可观测性中心的各个组成部分的功能和优势，如何配置和使用这些功能，以及最佳实践和建议。

## 主要功能

可以连接多种数据源，例如Prometheus、Elasticsearch、Loki等，来获取监控数据。

Dashboard 是一个可视化界面，展示各种指标的数据，在界面上可以根据需求设置图标、面板来展示监控数据。

通过 Alerting 功能来配置报警规则，可以在 Dashboard 上某个面板中创建报警规则，在创建报警规则的时候需要设置报警条件和触发方式。可以设置触发邮件、钉钉、Slack 通知、Webhook 等多种方式进行报警。

创建过报警规则后，需要进行测试并优化，可以通过手动修改数据、模拟异常情况等方式来测试报警规则的触发情况，并对规则作出优化和调整

### 作用
1. **数据可视化：** 可以将各种数据源的监控数据进行可视化展示，让用户可以一目了然地了解监控指标的状态和变化趋势。

2. **多种数据源支持：** 支持多种数据源的监控，包括时序数据、日志数据、关系型数据库等，可以满足不同业务的监控需求。

3. **灵活的报警设置：** 报警设置非常灵活，可以根据各种条件和规则进行设置，例如设置阈值、时间段、数据聚合等，还可以根据不同的报警级别进行不同的处理操作。

4. **集成方便：** 可以集成多种报警工具和服务，方便用户选择适合自己的报警方式。

5. **自动化处理：** 报警可以自动触发一些处理操作，例如自动重启服务、发送消息通知等，减轻人工干预的负担，提高故障处理的效率。



## 监控告警架构
![](imgs/prometheus-architecture.gif)

从上图可以看到，整个 监控告警模块 可以分为四大部分，分别是：

1. **Prometheus 服务器：** `Prometheus Server` 是 `Prometheus`组件中的核心部分，负责实现对监控数据的获取，存储以及查询。
2. **Exporter 业务数据源：** 业务数据源通过 `Pull/Push` 两种方式推送数据到 `Prometheus Server`。
3. **AlertManager 报警管理器：** `Prometheus` 通过配置报警规则，如果符合报警规则，那么就将报警推送到 `AlertManager`，由其进行报警处理。
4. **可视化监控界面：** `Prometheus` 收集到数据之后，由 `WebUI` 界面进行可视化图标展示。目前我们可以通过自定义的 API 客户端进行调用数据展示，也可以直接使用 `Grafana` 解决方案来展示。


## Grafana登录

`Grafana`是一个非常强大的开源监控和可视化工具，用于监控和可视化各种类型的数据，如应用程序、服务器、网络、数据库等。
具体操作文档，请参考：[Grafana官方文档](https://grafana.org.cn/docs/grafana/latest/).

![](imgs/login.png)

`Grafana` 的登录地址默认是 `http://grafana.${DEFAULT_DOMAIN}` 比如： http://grafana.kube-do.dev。
管理员账号密码是`admin/KdoGrafana2025`，登录后，建议修改管理员密码。
普通用户需要通过`OAuth`登录，这个和`KDO`平台的登录方式一致，默认`Oauth`登录都是`Viewer`权限，可以通过管理员设置更多权限。


## KDO告警模块
KDO的告警模块基于`Grafana`，提供了告警规则、告警通知和告警状态等信息，它同时支持监控告警和日志告警。 
1. **监控告警：** 监控模块已经对接`Prometheus`和`Alertmanager`，可以配置告警规则和告警通知。
2. **日志告警：** [日志模块](../logging)已经对接`Loki`，可以配置日志查询和日志告警规则。

### Grafana报警架构
Grafana 警报定期查询数据源并评估警报规则中定义的条件
如果条件被违反，则会触发警报实例
触发（和已解决）的警报实例将发送以进行通知，可以直接发送到联系点，也可以通过通知策略发送以获得更大的灵活性
![](imgs/how-notification-templates-works.png)

### 设置报警规则
警报规则由一个或多个查询和表达式组成，用于选择您要测量的数据。它包含触发警报的条件、确定规则评估频率的评估周期以及用于管理警报事件及其通知的其他选项


1. 设置查询和告警条件，选择数据源，可以添加多种查询条件和表达式，通过预览或运行来查看结果。

2. 警报评估行为，适用于组内的每条规则，可以覆盖现有报警规则的时间间隔。配置无数据和和错误处理的警报状态。

3. 为警告添加详细信息，编写摘要并添加标签，帮助用户更好管理警报。

4. 通过添加一些自定义标签来处理警报通知，这些标签将警报连接到具有匹配标签的接触点和静默警报实例。

### [如何配置报警规则](https://grafana.org.cn/docs/grafana/latest/alerting/alerting-rules/)


### 通知发送

Grafana提供了多种通知方式，如邮件、企业微信、钉钉、Webhook、PagerDuty等。
1. 选择报警管理程序，在消息模版中新增模版并保存，想要了解更多关于模板的信息，可以查看 [模版文档](https://grafana.org.cn/docs/grafana/latest/alerting/fundamentals/templates/)

2. 创建联络点，定义通知将会发送到哪里，联络点类型有很多种，这里主要介绍如何使用Email、钉钉来接收报警信息。

    - 选择钉钉，需要配置钉钉的自定义机器人获取POST地址 作为请求的URL，具体配置方法可查看 [钉钉自定义机器人使用](https://open.dingtalk.com/document/orgapp/custom-bot-creation-and-installation)
   
    - 选择Email，在地址选项中填写邮箱地址，可以使用 ";" 分隔符输入多个邮箱地址。

   可以通过测试来检查报警是否生效

![](imgs/notification-routing.png)

### [如何配置通知](https://grafana.org.cn/docs/grafana/latest/alerting/configure-notifications/)

#### 通知策略
1. 配置基本策略，所有警报都将转到默认的联络点，除非在特定的路由中设置了额外的匹配器区域。

2. 配置特定路由，根据匹配条件向选定的联络点发送特定警报。

3. 静默时间是一个指定的时间间隔，可以在通知策略树中引用，以便在一天中的特定时间静默特定的通知策略。

### 管理警报
`Grafana` 警报功能提供监控警报和管理警报设置的功能。您可以获得警报的概览，跟踪警报状态的历史记录，并监控通知状态。
这些可以帮助您开始在 `Grafana` 中调查警报问题，并提高警报实施的可靠性
![](imgs/alert-history-page.png)

[如何管理警报](https://grafana.org.cn/docs/grafana/latest/alerting/monitor-status/)





