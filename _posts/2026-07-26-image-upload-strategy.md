---
title: "寻找一种实用的方法来上传项目的 CDN 资源"
description: "Manually uploading to a company server or borrowing an admin panel's avatar upload feature are both clunky ways to get an online image URL, so this post looks at adapting a resource upload approach that actually fits the project."
date: 2026-07-26 00:00:00 +0800
categories: [JS, Engineering]
tags: [upload, cdn, workflow]
published: true
---

这是在公司项目一开始就想的问题。

然而，我遇到的上传资源的方式都不一样。有的是用SVN管理，直接把图片资源扔到对应目录下，然后提交到SVN仓库就行。有的是的是把图片资源发给负责人，由他手动手动上传到服务器。有的是借用后台的某项业务，如个人信息编辑功能，利用上传头像功能来上传图片，获取该图片的在线地址......

都是这么过来的，甚至一个正经的上传页面都没有。

时间拨回项目开始的时候，我问了一句，我们图片资源在哪里上传，leader 说后面把 oss 的 key 给你（当时有点懵，我就想知道在哪上传而已）。。。  后面是直接把 oss 的相关信息都给我了，那意思不就是我自己创建上传方式咯。

当时想过几个方案，比如：

1. 找后端的同事写个接口，我简单写个页面调用接口，上传图片。

2. 我自己创建个项目，前后端自己写，前端是一个页面。

开始确实是创建了个项目，前后端同时启动，实现了图片的上传功能，但是不方便，得访问本机的地址。

最终的方法：做成 浏览器插件。

依然是之前的 monorepo 结构，新增了一个extension 项目。


项目方式结构确定了，下一步重点是怎么与当前的项目集成，不是简单的上传图片，而是要与项目有一定的关联，方便项目使用。

考虑到有两个项目，所以资源路径和资源类型必须区分，在面板能控制上传到哪个项目的。