---
title: 监控(Monitoring)
parent: 观测平台
nav_order: 1
---

1. TOC
{:toc}


## 介绍
{: .note }
可观测性中心旨在提供全面的监控和可观测性支持，以确保系统的稳定性、性能和安全性。可观测性中心为企业提供了一个集中化的平台，使用户能够实时监控、分析和管理系统的运行状态和关键指标。它包括观测中心面板、监控大屏、全局日志、报警等功能，帮助用户快速发现和解决潜在的问题，提高系统的可靠性和可用性。
在本章节中，您将了解可观测性中心的各个组成部分的功能和优势，如何配置和使用这些功能，以及最佳实践和建议。

Grafana是一个非常强大的开源监控和可视化工具，用于监控和可视化各种类型的数据，如应用程序、服务器、网络、数据库等。
具体操作文档，请参考：[Grafana官方文档](https://grafana.org.cn/docs/grafana/latest/).


## 登录
![](imgs/login.png)
Grafana的登录地址默认是 `http://grafana.${DEFAULT_DOMAIN}` 比如： http://grafana.kube-do.dev。
可以选择管理员账号登录，默认账号密码是`admin/KdoGrafana2025`。
也选择通过`OAuth`登录，这个和`KDO`平台的登录方式一致。


## KDO告警模块
KDO的告警模块基于Grafana，提供了告警规则、告警通知和告警状态等信息。
监控模块已经对接prometheus和alertmanager，可以配置告警规则和告警通知。
日志模块已经对接loki，可以配置日志查询和日志告警规则。


### [配置告警规则](https://grafana.org.cn/docs/grafana/latest/alerting/alerting-rules/)

### [配置通知](https://grafana.org.cn/docs/grafana/latest/alerting/configure-notifications/)

### [监控警报](https://grafana.org.cn/docs/grafana/latest/alerting/monitor-status/)
