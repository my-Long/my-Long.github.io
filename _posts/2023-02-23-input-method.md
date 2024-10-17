---
layout:     post
title:      中文输入法
subtitle:   中文输入法导致的高频问题
date:       2023-02-23
author:     MY
header-img: img/post-bg-keybord.jpg
catalog: true
tags:
    - 基础 
    - javascript
---

## 前言
我们经常会给 `input` 绑定事件监听内容的变化，然后做出一些处理。但是如果你注意了，你就会发现在中文下，你还没有确定内容，但是绑定的方法已经触发了。

## 正文

你的绑定是这样的，
```js
   <input type="text" @input="onSearch" v-model="msg">
```
结果就是在中文输入法下，你还没选择文字，`onSearch`就触发了。

> event !!!
> 
>compositionstart (合成开始)
>
>compositionend （合成结束）

我们要使用到两个事件 `compositionstart`、`compositionend`，并调整 `input`输入框的事件监听。

```js
//通过这种js的方式获取元素并绑定事件
const bindFun = () => {
  const inp = document.querySelector("input");

  inp.addEventListener("input", () => {
    onSearch();
  });
};

onMounted(() => {
  bindFun();
});

```

现在实现一下 `bindFun`方法，
```js
const bindFun = () => {
  const inp = document.querySelector("input");
  let isCompsing = false; // 是否合成

  inp.addEventListener("input", () => {
    if (isCompsing) return; //合成时，不触发搜索
    onSearch();
  });

  // 合成开始和结束
  inp.addEventListener("compositionstart", () => {
    isCompsing = true;
  });
  inp.addEventListener("compositionend", () => {
    isCompsing = false;
    onSearch();
  });
};
```

哈哈哈`😄`，大功告成，快去试试吧