---
title: "When Does Vue Update the DOM"
description: "Understanding Vue's asynchronous DOM update mechanism and why UI changes don't always happen immediately after data changes."
date: 2023-08-24 00:00:00 +0800
categories: [Vue]
tags: [vue,component]
---

发现了一个让我想了一会儿的现象：点击提交按钮，loading 没出现。

逻辑很清楚：

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

`loading.value = true` 在最前面，按理应该先出现 loading，然后走后面的逻辑。但当表单校验失败时，loading 一次都没出现过——好像 `loading.value = true` 根本没执行。

原因在于 Vue 的更新机制是异步的。`loading.value = true` 是同步代码，执行完之后 Vue 不会立即更新 DOM，它把这次更新放进一个队列，等当前的同步代码全跑完，才去处理队列里的 UI 更新。

而 element-ui 的表单校验是同步的，校验不通过会立刻抛出，进入 `finally`，`loading.value` 马上被改回 `false`。Vue 等到有空处理更新队列时，loading 已经是 false 了，根本来不及渲染 true 的状态。

**Vue 在同步代码里的多次 state 变化，最终只渲染最后一次的结果。**

接口请求之所以没这个问题，是因为 `await fetch()` 会让出主线程，Vue 趁这个空档更新 UI。表单校验太快，没给 Vue 任何机会。

如果确实需要让 loading 出现，可以在设置之后加 `await nextTick()`，强制 Vue 先渲染一次再继续：

```ts
const onOk = async () => {
  loading.value = true;
  await nextTick();
  try {
    await instance?.value?.submit?.();
    unmount();
  } finally {
    loading.value = false;
  }
};
```

不过多数情况下，校验失败不显示 loading 也完全可以接受——反正用户马上就看到报错了。知道这个机制，比知道 workaround 更重要。
