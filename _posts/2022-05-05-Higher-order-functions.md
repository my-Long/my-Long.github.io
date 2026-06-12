---
title: "Higher-Order Functions in JavaScript"
description: "What higher-order functions are, how map, filter, and reduce work under the hood, and how to write your own."
date: 2022-05-05 00:00:00 +0800
categories: [JS, Base]
tags: [hof]
---

高阶函数（higher-order function）的定义很简单：接收函数作为参数，或者返回一个函数，满足其中一个就算。`Array.map()`、`Array.filter()`、`Function.bind()` 都是高阶函数。

但定义不是重点，重点是它解决了什么问题。

## 运算缺失——把「怎么做」留给调用方

`map` 这个函数，做的事是遍历数组，把每个元素变成新的值，然后收集起来。但「怎么变」是缺失的，这一步由外部传入：

```js
function map(fn) {
  const result = [];
  for (let i = 0; i < resourceArr.length; i++) {
    const newValue = fn(resourceArr[i]);
    result.push(newValue);
  }
  return result;
}
```

如果把「怎么变」写死在里面，这个函数就只能做一件事。接收一个函数参数，它就能做任何变换。运算的「缺失」部分由外部填补。

## 运算延续——改造函数，返回更强的版本

`bind` 就是这种模式——接收一个 `this` 值，返回一个绑定了 `this` 的新函数：

```js
function bind(thisArg) {
  const fn = function () {}; // 改造后的函数
  return fn;
}
```

把它理解成「给车加装备」：原来的函数能力不够，改造一下，把改造好的版本返回出去。将来任何时候调用的都是加强版。

高阶组件（HOC）就是这个思路用在了组件上——接收一个组件，加装某些逻辑（权限、数据注入等），返回一个增强过的组件。

## 动画函数

高阶函数的实际用途之一：写一个 JS 动画函数，让数字从 A 变到 B，至于变化时「怎么展示」留给调用方。

核心逻辑：在指定时间内匀速变化：

```js
function animation(duration, from, to, onProgress) {
  const dis = to - from;
  const speed = dis / duration;
  const startTime = Date.now();
  let value = from;
  onProgress(value);

  function _run() {
    const now = Date.now();
    const time = now - startTime;

    if (time >= duration) {
      value = to;
      onProgress(value);
      return;
    }
    const d = time * speed;
    value = from + d;
    onProgress(value);
    requestAnimationFrame(_run);
  }
  requestAnimationFrame(_run);
}
```

`onProgress` 是缺失的那部分——每次数字更新时做什么，调用方自己决定。点击按钮触发价格变化：

```js
const label = document.querySelector("div");
const btn = document.querySelector("button");
btn.addEventListener("click", () => {
  animation(1000, 2999, 299, (value) => {
    label.innerHTML = `价格:${value.toFixed(2)}`;
  });
});
```

同样的函数做倒计时，参数换一下：

```js
animation(5000, 5, 0, (value) => {
  const str = value === 0 ? "验证码" : `${value.toFixed(1)} S`;
  label.innerHTML = str;
});
```

防抖、节流也是一样的结构——接收「原函数」和「时间间隔」，返回一个经过改造的版本。那是「运算延续」的典型例子。
