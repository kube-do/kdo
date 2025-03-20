---
title: Java 项目部署
parent: 部署应用
description: 在 KDO 上通过源码部署 Java 项目
---


## 概述

KDO 支持构建 SpringBoot 单模块和多模块的项目，并自动识别。同时也支持通过 Gradle 构建的项目。

### Java Maven 单模块

当源代码根目录下存在 `pom.xml` 文件，KDO 会将源代码识别为 Java Maven 单模块项目。

## 部署 Java SpringBoot 单模块项目

进入到团队下，新建应用选择**基于源码示例**进行构建，选中 Java Maven Demo 并默认全部下一步即可。

## 部署 Java Gradle 项目
1. 基于源码部署组件，填写以下信息：



|        | 内容                                                |
|--------|---------------------------------------------------|
| 组件名称   | 自定义                                               |
| 组件英文名称 | 自定义                                               |
| 仓库地址   | `https://gitee.com/rainbond/java-gradle-demo.git` |
| 代码版本   | Master                                            |

2. 下一步全部默认，等待构建完成。

