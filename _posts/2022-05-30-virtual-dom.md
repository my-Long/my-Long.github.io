---
title: "Why Virtual DOM Exists"
description: "The problem virtual DOM solves, how the diffing algorithm works, and why it doesn't always mean better performance."
date: 2022-05-30 00:00:00 +0800
categories: [JS, Base]
tags: [vue, react]
---

为什么要有虚拟 DOM？以前的答案是「减少 DOM 操作，提升性能」。但 `Svelte` 直接操作真实 DOM，性能反而更好——这个答案明显站不住脚。

真正的原因是框架的颗粒度做不到那么细。

最理想的情况是：某个数据变了，框架精确定位到受影响的那个 DOM 节点，改它，完事。但 Vue 和 React 做不到这一点——它们能精确到「组件」这个粒度，但组件内部有多少 DOM 节点，框架不清楚。数据变化时只能重新渲染整个组件树。如果一个组件有几千个 DOM 节点，每次都全量重建，代价太高。

虚拟 DOM 在这里起的作用是：不直接操作真实 DOM，先生成一棵内存里的虚拟树，然后用 diff 算法对比新旧两棵树，只把差异部分更新到真实 DOM 上。比全量重建便宜，虽然比 Svelte 那种「精确到节点」还是贵了一些。

另一个好处是**跨平台**。虚拟 DOM 只是 JS 对象，不是真实的 DOM——这意味着它不强依赖浏览器环境。同一套组件代码，换个渲染器就能输出到小程序、移动端原生组件、甚至 SSR 的 HTML 字符串。Vue 和 React 之所以能同时支持 web 和其他平台，这是原因之一。
