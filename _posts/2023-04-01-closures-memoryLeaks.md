---
layout: post
title: 闭包与内存泄漏的纠葛
subtitle: 闭包与内存泄漏有什么关系，如何理解垃圾回收
date: 2023-04-01
author: My
header-img: img/post-bg-art.jpg
catalog: true
tags:
  - 基础
  - javascript
---

经常会被问到什么是闭包，说说你对闭包的理解，闭包会引起内存泄漏吗等等问题。要清楚闭包与内存泄漏的关系，则得先了解什么是「垃圾回收」。

那什么是「垃圾」呢？一直以来也没有明确的定义，但都形成了一个共识，那就是「不再需要的内存」，这些内存里的数据就是「垃圾」。那什么又是「不再需要」呢？这个是由开发者决定的，需不需要取决于你。
比如说：

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

这个 `createIncrease` 创建了 100 个 div，原来的 div 的内容是「下标」，从 0 开始。里面有个子函数 `increase` ，循环所有的「div」把其内容 +1。

这个很标准的「闭包」了，拿到子函数，也拿到了上面声明的 doms，从运行过程来看，每次点击按钮，使用这个 `increase` 时，是需要这个 doms 的。那这些 doms 是不是垃圾？很明显不是，因为我要使用它。

「垃圾与占用内容空间的大小无关」

再比如说：

```js
const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((total, num) => total + num, 0);
console.log("sum", sum);
```

对数组进行求和，第一次运行结束之后，那 `[1, 2, 3, 4, 5]` 数组是否还被需要？It depends on you.

so，现在有一些你认为的不再需要的内容，那它们就是「垃圾」。js 语言里面有个 「垃圾回收器」，它可以帮助我们回收那些不再需要的内容。问题来了，「它怎么知道我们不再需要了」，它不知道，但是它还是很大胆地做出假设，「**你访问不了的东西，那就是你不需要的**」。比如上面的例子，

```js
let arr = [1, 2, 3, 4, 5];
arr = [4, 5, 6, 7, 8, 9];
const sum = arr.reduce((total, num) => total + num, 0);
console.log("sum", sum);
```

现在对 arr 重新赋值，那初始化的那内容空间还有机会访问吗？明显不能了，所以 「垃圾回收机制」就认为这个就是你不需要的。

所以「垃圾回收器」回收的是那些我们认为不想要的，且「无法触达的内存空间」。但是，从主观上看，不想要的（内容）很多，但「无法触达」的只是其中的一小部分，仍有一部分游离在外，因此「垃圾回收器」无法回收，这就是 `内存泄漏`。

那当这个内存泄漏变大了之后，就会严重影响我们程序的运行，那`如何解决内存泄漏`？就是让这些内容变得「不可触达。比如说，

```js
let arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((total, num) => total + num, 0);
console.log("sum", sum);
arr = null;
```

在程序运行结束后，令 arr = null ，那 `[1, 2, 3, 4, 5]` 内存空间就变得「不可触达」，就能被「垃圾回收器」处理了。

又比如第一个，点击第一次之后该方法就不再需要了。

```js
const btn = document.querySelector("button");
let increase = createIncrease();

function handle() {
  increase();
  btn.removeEventListener("click");
  increase = null;
}
btn.addEventListener("click", handle);
```

点击过后，就移除监听器，然后令 increase = null，之前的函数 `increase` 就变得不可触达，然后被回收。

说到这里，怎么都是垃圾回收和内存泄漏，那内存泄漏和闭包的关系呢？

从上面的例子看，好像没有什么直接的关系，「只是闭包会让我们`放松警惕`」。如例 2，只需要在操作后令 arr = null，语义和流程都很清晰。

但是，「闭包」得绕一下，因为调用函数结束后，你只是认为以后不会再使用这个函数，因此设为 null ，到此就结束了。但是如果没有考虑到闭包所关联的词法环境，如 `doms` 被保留下来了，那就无法被回收。「基于这种情况，就有可能存在某种闭包会导致内存泄漏的情况」。这取决于闭包所关联的词法环境。

所以这才会流传着那句话 「闭包容易引起内存泄漏，慎用闭包」。

**闭包的内存泄漏和其他内存泄漏没有啥本质的区别：**

1.持有了不再需要的函数引用，会导致函数关联的词法环境无法销毁，从而导致「内存泄漏」。

2.当多个函数共享词法环境时，会导致词法环境膨胀，从而导致无法触达也无法回收的内容空间。

```js
function createIncrease() {
  const doms = new Array(100).fill(0).map((_, index) => {
    const dom = document.createElement("div");
    dom.innerHTML = index;
    return dom;
  });

  function increase() {}
  function tem() {
    doms;
  }

  return increase;
}

const btn = document.querySelector("button");
let increase;
btn.addEventListener("click", () => {
  increase = createIncrease();
});
```

如此操作，点击按钮 btn，但是 `increase` 没有用到闭包环境里的 doms，doms 被另一个子函数(tem)使用了。

点击按钮后，在控制台手动「垃圾回收」，再比较前后的内存，发现**内存没被回收**。

这就是因为 `tem` 函数的存在，它们的闭包环境都是一样的，共享一个词法环境。如果说只有一个子函数，该函数没有用到词法环境中的变量，浏览器就会把该变量(doms)优化掉，这就不会造成内存泄漏。但是如果有其他子函数使用了变量(doms)，那浏览器就不会回收。

因此上例，`increase` 没用到 doms，但 `tem`使用了，因此词法环境保留了这个 doms ，浏览器不会回收，造成了内容泄漏。

### 提问
既然如此，大家有没有习惯性的把不需要的变量设为 null 呢？如果使用这种方式，那在ts中是不是都得初始化至少两种类型呢？那既然重新赋值，那 const 关键字怎么处理？