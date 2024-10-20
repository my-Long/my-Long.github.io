---
layout: post
title: 高阶函数（HOF）
subtitle: What are higher-order functions and how to use them
date: 2022-02-05
author: My
header-style: text
catalog: true
tags:
  - 基础
  - javascript
  - HOF
---

## 引言

函数就是自变量与因变量之间的映射关系，在编程里，函数增强代码的可维护性、可读性，进行逻辑抽象和解耦等，其作用不可谓不大。那「高阶函数」又是什么，[维基百科](https://en.wikipedia.org/wiki/Higher-order_function)是这么介绍的，核心就两点：

- takes one or more functions as arguments.
- returns a function or value as its result.

「只要满足了其中一点」，就属于高阶函数了，高阶函数常用于[函数式编程](https://en.wikipedia.org/wiki/Functional_programming)，发挥着举足轻重的作用。

在 js 基础中，数组的常用方法，如 `arr.map()`、`arr.filter()`等等，还有 `bind（)` 都属于高阶函数。

## 高阶函数的表达

那高阶函数有什么用呢? 在函数式编程里把每个函数看作是一个 `运算`，而高阶函数表达则是运算的「缺失」和「延续」。

### 缺失

可以把「How」理解成 「缺失」，即如何运算。看以下例子，

```js
function map() {
  const result = [];
  for (let i = 0; i < resourceArr.length; i++) {
    resourceArr[i]-- > newValue; //旧的值转化为新的值
    result.push(newValue);
  }
  return result;
}
```

需要把「旧值」转换为「新值」，但是这一部分的操作 missing 。倒回去，你可以写`resourceArr[i] = 12` 等等，但是这种运算固定了，缺乏了灵活性。换言之，这是运算，而运算的本质就是一个函数，因此，我需要一个函数来处理这个运算，当然这个运算不能固定，运算的方法应该是灵活的，由操作者决定。

so，该函数需要接收一个函数（运算）：

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

### 延续

可以理解成传递，给车子加满油或改装后，将「车的意义」传递下去。当有些函数功能不足，我们需要给这个函数加装功能，让其更加强大。我们看以下例子，

```js
function bind(thisArg) {
  const fn = function () {}; //绑定了 this 的函数
  return fn;
}
```

生成了一个函数，使用传进来的参数通过「改造」，让这个函数变得更加强大，最后把函数返回。那在将来的任何时候都可以调用这个函数。

## 结语

在运算「缺失」的时候，需要函数作为参数。在对运算进行「延续」的时候，需要返回一个函数。

高阶函数它常常出现在公共的模块，公共的代码里。高阶函数有两个层面的学习「使用」和「编写」。

使用就是去使用常见的高阶函数，比如数组的`reduce`等常见方法。编写才是核心，如何编写一个高阶函数，那才是最重要的。

高阶组件则是利用了高阶函数的思想，接收一个组件，对这个组件进行改造，复用了某些逻辑，进而将原来的组件升级，最后返回一个加强后的组件。从高阶函数的表达上来看，高阶组件更像是 「对功能的延续」。

## 动画函数

我们可以通过高阶函数的形式，编写一个 js 动画。任何时候只要需要使用 js 动画，就可以使用这个函数来完成。

动画的本质，就是在一个时间之内，从一个数字到另一个数字。现在我们实现一个价格的变化。

```js
/**
 * @description: js 动画函数
 * @param {* number} duration 间隔时间
 * @param {* number} from 起始时间
 * @param {* number} to 结束时间
 * @return {*}
 */
function animation(duration, from, to) {
  const dis = to - from; //时间
  const speed = dis / duration; //速度
  const startTime = Date.now();
  let value = from; //当前值
  console.log("from", value);
}
```

每隔一小段时间发生变化。

```js
function _run() {
  const now = Date.now();
  const time = now - startTime; // 起始时间到现在的时间
  const d = time * speed; //运动的距离
  value = from + d; //当前的距离
  console.log("value", value);
}
```

然后开始动起来。

```js
function animation(duration, from, to) {
  const dis = to - from; //时间
  const speed = dis / duration; //速度
  const startTime = Date.now();
  let value = from; //当前值
  console.log("from", value);

  function _run() {
    const now = Date.now();
    const time = now - startTime; // 起始时间到现在的时间

    if (time >= duration) {
      value = to;
      console.log("value", value);
      return;
    }
    const d = time * speed; //运动的距离
    value = from + d; //当前的距离
    console.log("value", value);

    requestAnimationFrame(_run);
  }
  requestAnimationFrame(_run);
}
```

启用函数之后，数字就是从`from`减少到`to`。在效果上是数字是能变化，但是和页面没有关系，缺少了一种联系，这就是高阶函数的「缺失」，渲染数字到页面上，这是一个步骤，也是运算。

```js
function animation(duration, from, to, onProgress) {
  const dis = to - from; //时间
  const speed = dis / duration; //速度
  const startTime = Date.now();
  let value = from; //当前值
  onProgress(value);

  function _run() {
    const now = Date.now();
    const time = now - startTime; // 起始时间到现在的时间

    if (time >= duration) {
      value = to;
      onProgress(value);
      return;
    }
    const d = time * speed; //运动的距离
    value = from + d; //当前的距离
    onProgress(value);
    requestAnimationFrame(_run);
  }
  requestAnimationFrame(_run);
}
```

使用这个高阶函数，实现点击后价格变动的效果：

```js
const label = document.querySelector("div");
const btn = document.querySelector("button");
btn.addEventListener("click", () => {
  animation(1000, 2999, 299, (value) => {
    label.innerHTML = `价格:${value.toFixed(2)}`;
  });
});
```

- 分析一下，在实现逻辑里，从一个值到另一个值，计算的是匀速（`const speed = dis / duration;`），那就可以借用这个特点来实现「倒计时」。

合理的参数，5 秒时间内，从 5 变动到 0。

```js
animation(5000, 5, 0, (value) => {
  const str = value === 0 ? "验证码" : `${value.toFixed(1)} S`;
  label.innerHTML = str;
});
```

## 防抖节流。

设计思路，比如是「防抖」。在页面尺寸变化，或者是 input 框内容变动时，触发 `debounce`（加强后）。函数触发后，则要处理逻辑，即如何进行运算。这是一个很完美的「高阶函数」。

大概的结构是这样的：

```js
const debounce = utils.debounce(function (val) {
  console.log("val", val);
}, 1000);

const onSearch = () => {
  debounce(searchValue.value);
};
```
