---
title: 应用
parent: DevOps
nav_order: 1
---

## 介绍 
在kdo平台里面，应用服务是满足用户某些需求的程序代码的集合，可以是某个解耦的微服务或是某个单体应用，所有功能都会围绕应用服务进行。

kdo 支持对接 Git 代码仓库，从源代码仓库直接创建组件，目前 kdo 支持 `GitHub GitLab Gitee` 三种支持Git仓库对接，只需git URL和token就可以直接生成流水线，流水线支持**自动构建与自动部署**。

#### 自动构建

表示每次提交代码时，会触发自动触发CI

#### 自动部署

表示每次生成镜像时，会触发自动触发CD。第一次须进行手动部署方可开启自动部署。


### 创建应用

![创建应用](imgs/createApplication.gif)

### 管理分支流水线
![管理分支流水线](imgs/manageBranch.gif)