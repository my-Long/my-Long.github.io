---
layout: post
title: "vue 的 ui 更新"
subtitle: "vue ui 更新的时机"
author: "My"
header-style: text
catalog: true
tags:
  - vue
---

## 前言

最近写代码的时候发现一个小问题，就是点击提交按钮时，loading 效果的变化。我们一般都会在表单提交、或者列表查询时给按钮添加一个 loading 效果，当用户点击提交按钮时，按钮会变成 loading 状态，当提交成功或者失败时，loading 效果会消失。

但是，我发现有时提交表单时，loading 效果并出现，所以我研究了一下。

## 问题

```ts
const onOk = async () => {
  loading.value = true;
  try {
    await instance?.value?.submit?.();
    unmount();
  } finally {
    loading.value = false;
  }
};
```

这是表单中的一个封装，其中 `submit` 是调用了 `element ui` 的表单验证，通过了才会提交表单，并调用接口。

这上面的逻辑很清楚，点击按钮的时候，loading 效果会变成 true，提交成功或者失败后，loading 效果会变成 false。但是，当表单校验不通过时，按钮的 loading 效果竟然没有出现，换句话说，`loading.value = true` 好像没起作用。

这是为什么呢？ 按照顺序，不应该是点击了，就执行了 `loading.value = true`，然后 loading 效果就出现吗？

## 更新机制

这是我查阅资料然后得出的结论，vue 的更新机制是异步的。也就是说，`loading.value = true` 这是同步代码，vue 记录了这个状态的变更，然后把 `UI` 更新加入了「更新队列」，等到所有同步代码执行完毕，才会去执行更新队列中的 `UI` 更新。

我通俗的理解为，vue规定了一个「时间」，结合异步更新机制，只要事件循环没有被阻塞太久，那么 vue 就会在等待的空隙中去执行更新队列中的 `UI` 更新。

结合以上出现问题，就是 `loading.value = true` 之后，等待 `UI` 更新，但是 `element ui` 的表单验证太快了，立即进入了 `finally` ，导致 `loading.value = false` 。之后 vue 有时间去更新 `UI` 了，但是 loading 的状态已经为 `false` 了，所以 loading 效果没有出现。

## 解决方案

其实并不存在什么解决方案，如果说非要让 `loading` 效果出现，表单验证不通过的时候也出现，那就可以强制的让 vue 更新 `UI`。一种是 `await nextTick()`，另一种是 `await` 的时候加一点时间。也可以一起使用。这样 vue 就会在 `await` 的空隙去更新 `UI`。

同样的，我们在一些列表页面，点击查询按钮的时候，也会出现 loading 效果，接口请求结束之后，loading 效果消失，其实就是接口响应需要时间，给了 vue 时间去更新 `UI`。