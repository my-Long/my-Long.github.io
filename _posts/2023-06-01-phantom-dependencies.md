---
title: "Understanding Phantom Dependencies"
description: "What phantom dependencies are, why they cause hidden bugs, and how pnpm eliminates them by design."
date: 2023-06-01 00:00:00 +0800
categories: [JS, Engineering]
tags: [pnpm]
---

从 npm 换到 pnpm，幻影依赖（phantom dependency）是让我下定决心的原因之一。

所谓幻影依赖，就是你在 `package.json` 里只声明了 A，但代码里直接用到了 B——而 B 是 A 的依赖，不是你显式安装的。能用，但用得心虚。

**为什么 npm 里会出这个问题？** npm（以及 yarn）为了避免依赖嵌套导致的路径过长和包重复，会把所有依赖——不管层级多深——全部平铺到 `node_modules` 的一级目录下。A 依赖 B，B 就和 A 并排放在那里。结果就是你虽然没有声明 B，但 B 在 `node_modules` 里，当然可以直接 import。

![image.png](/images/post-content-dependent.png){: .shadow .rounded-10  .w-75 w="2220" h="818" }

这带来两个潜在的问题。

**版本不受控**：你在用 B `1.0.0`，但 B 的版本是 A 决定的。哪天升级了 A，A 依赖的 B 变成了 `2.0.0`，API 不兼容，代码开始报错，而你甚至不知道 B 是从哪来的。

**生产环境缺包**：开发依赖和生产依赖分开的时候，如果某个 devDep 恰好带了你用到的 B，生产环境不安装 devDep，B 就没了。开发正常，生产挂掉。

pnpm 从根上解决了这个问题。它在 `node_modules` 里建一个 `.pnpm` 仓库，所有依赖（直接的和间接的）都存在这里，但这个仓库不是 `node_modules` 的子文件夹，代码里没法直接引用它。然后 pnpm 重新生成一个树形目录，只把 `package.json` 里声明的依赖放到顶层，以符号链接的形式，不占额外磁盘空间。你能引用什么，完全由自己的依赖声明决定。

![image.png](/images/post-content-dependent2.png){: .shadow .rounded-10  .w-75 w="2180" h="714" }

换 pnpm 的第一天，几个项目跑起来就报错——缺了一堆之前没有显式声明但一直在偷用的包。装上去，问题都解决了。现在反而觉得这是好事：逼着你把依赖声明清楚，不再靠运气。
