---
title: "Closures and Memory Leaks"
description: "How closures can unintentionally hold references and cause memory leaks, with patterns to avoid them."
date: 2022-04-27 00:00:00 +0800
categories: [JS, Base]
tags: [javascript]
---

闭包会引起内存泄漏吗？要回答这个问题，得先搞清楚「垃圾」和「内存泄漏」是什么。

**什么是垃圾？** 没有明确的定义，但有个共识：不再需要的内存。「需不需要」是由开发者决定的。垃圾回收器不知道你的意图，它只能做一个大胆的假设——**你访问不到的东西，那就是你不需要的**。

```js
let arr = [1, 2, 3, 4, 5];
arr = [4, 5, 6, 7, 8, 9];
```

`arr` 重新赋值后，原来那个 `[1, 2, 3, 4, 5]` 没有任何引用能访问到它了，垃圾回收器就把它清掉。

**内存泄漏**就是那些你不再需要、但回收器还能访问到的内存——游离在外，清不掉。泄漏积累多了会严重影响程序运行。

解法是主动让它变得不可访问：

```js
let arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((total, num) => total + num, 0);
arr = null; // 让 [1,2,3,4,5] 变得不可触达，等待回收
```

---

那闭包和内存泄漏的关系是什么？

直接关系没那么强。看这个例子：

```js
function createIncrease() {
  const doms = new Array(100).fill(0).map((_, index) => {
    const dom = document.createElement("div");
    dom.innerHTML = index;
    return dom;
  });

  return function increase() {
    doms.forEach((dom) => {
      dom.innerHTML = Number(dom.innerHTML) + 1;
    });
  };
}
const increase = createIncrease();
document.querySelector("button").addEventListener("click", increase);
```

这是标准闭包，`increase` 持有 `doms` 的引用。但这里 `doms` 不是垃圾——每次点击都要用到它。没有内存泄漏，只是内存被正常使用了。

**「垃圾与占用内存空间的大小无关」**，关键是你还需不需要它。

真正的问题是：**闭包会让你放松警惕**。使用完一个闭包后，你以为把它设为 `null` 就结束了，但没想到闭包的词法环境里还有其他东西没被回收。

更微妙的情况——多个子函数共享词法环境：

```js
function createIncrease() {
  const doms = new Array(100).fill(0).map((_, index) => {
    const dom = document.createElement("div");
    dom.innerHTML = index;
    return dom;
  });

  function increase() {} // increase 本身没用到 doms
  function tem() {
    doms; // 但 tem 用到了
  }

  return increase;
}
```

`increase` 返回后，看起来 `doms` 没有被用到，应该被回收。但 `tem` 也在同一个词法环境里，引用了 `doms`。浏览器发现词法环境里还有函数在用 `doms`，就不敢回收。`increase` 和 `tem` 共享了词法环境，`increase` 活着，`doms` 就一直活着。

这就是所谓的「闭包导致内存泄漏」——不是闭包本身的问题，而是多个子函数共享词法环境时，某个变量可能比你预期的活得更长。

所以那句「慎用闭包」的真实含义是：用闭包时，清楚词法环境里有什么，确认不需要后主动断掉引用。有没有习惯在用完之后把不需要的变量设为 null？
