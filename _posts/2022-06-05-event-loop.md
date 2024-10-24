---
layout: post
title: Event loop
subtitle: 怎么去理解 js 的事件循环机制？
date: 2022-06-05
author: My
header-img: img/post-bg-hacker.jpg
catalog: true
tags:
  - 基础
  - javascript
---

这个问题想回答得很好，很难。我就简单记录一下我自己的理解。

「事件循环」是浏览器渲染主线程的工作方式。同时，事件循环机制是 js 异步编程的核心，目的是协调 JavaScript 的执行和异步操作的回调，确保它们在适当的顺序中被处理。JavaScript 是单线程的，这意味着它在任何时刻只能执行一个任务。事件循环通过管理「执行栈」和「任务队列」来处理这一限制。

在 [W3C](https://html.spec.whatwg.org/multipage/webappapis.html#perform-a-microtask-checkpoint) 中，给出了 JavaScript 的事件循环机制的一些基本概念，组成部分有 「执行栈」、「任务队列」、「微任务队列」。

**执行栈（Call Stack）**

- 这是一个用于存放当前执行的代码的栈结构。当一个函数被调用时，它被推入栈中；执行完成后则从栈中弹出。
- 只有执行栈为空时，事件循环才会处理任务队列中的任务。

**任务队列（Task Queue）**

- 当异步操作（如 setTimeout、I/O 操作等）完成时，它们的回调会被放入任务队列。
- 这些任务将在执行栈为空时被依次执行。

**微任务队列（Microtask Queue）**

- 包括 Promise 的 .then() 和 MutationObserver 的回调。
- 微任务在当前执行栈完成后、下一次事件循环之前执行，优先级高于普通任务。

> W3C 已经摒弃了宏任务（Macro Task）这个术语，而是将其称为“任务”，这一变化主要是为了简化概念和表述，减少术语的复杂性。

> 微任务没有明确的定义，但一般认为它是指那些可以被放入微任务队列的任务，比如 Promise 的 .then() 和 MutationObserver 的回调。

事件循环的工作流程主要如下：

1. 「执行栈」中的同步代码首先被执行。
2. 当「执行栈」为空时，事件循环会检查「微任务队列」，如果微任务队列中有任务，执行所有微任务，直到队列为空。
3. 接下来，从「任务队列」中取出一个任务，推入「执行栈」执行。
4. 重复步骤 2 和 3，直到没有更多的任务和微任务。

**例子 1**：

```js
console.log("Start");

setTimeout(() => {
  console.log("Timeout Task");
}, 0);

Promise.resolve().then(() => {
  console.log("Micro Task");
});

console.log("End");
```

解析：

1 . console.log('Start') 和 console.log('End') 是同步代码，直接在执行栈中执行。

2 . setTimeout 是一个异步操作，它将回调函数放入「任务队列」中，并将控制权移交给事件循环。

3 . Promise.resolve().then() 是一个微任务，它将回调函数放入「微任务队列」中，并将控制权移交给事件循环。

4 . 事件循环开始执行，执行栈为空，开始执行微任务队列中的任务，即 console.log('Micro Task')。

6 . 微任务执行完成后，执行任务队列中的任务。

综上，输出的顺序是：`Start`、`End`、`Micro Task`、`Timeout Task`。

**例子 2**：

```js
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

Promise.resolve()
  .then(() => {
    console.log("C");
  })
  .then(() => {
    console.log("D");
  });

console.log("E");
```

解析：

- 执行栈中的同步代码首先执行：

  1. console.log('A') 输出 A。
  2. setTimeout 的回调被添加到任务队列。
  3. Promise.resolve().then() 的回调被添加到微任务队列。
  4. console.log('E') 输出 E。

- 执行栈现在为空，事件循环检查微任务队列：

  1. 首先执行微任务队列中的第一个任务，输出 C。
  2. 继续执行微任务队列中的下一个任务，输出 D。

现在，事件循环转向任务队列，执行 setTimeout 的回调，输出 B。

综上，输出的顺序是：`A`、`E`、`C`、`D`、`B`。

**例子 3**

```js
console.log("A");

setTimeout(() => {
  console.log("B");

  Promise.resolve()
    .then(() => {
      console.log("C");
    })
    .then(() => {
      console.log("D");
    });
}, 0);

Promise.resolve()
  .then(() => {
    console.log("E");

    setTimeout(() => {
      console.log("F");
    }, 0);

    Promise.resolve().then(() => {
      console.log("G");
    });
  })
  .then(() => {
    console.log("H");
  });

console.log("I");
```

解析：

- 执行栈中的同步代码：
  1.  console.log('A') 输出 A。
  2.  第一个 setTimeout 的回调被放入任务队列。
  3.  第一个 Promise.resolve().then() 的回调被放入微任务队列（等待执行栈为空）。
  4.  console.log('I') 输出 I。

- 执行栈为空，处理微任务：
  1. 微任务队列中的第一个任务执行，输出 E。
  2. 在这个微任务中，另一个 setTimeout 被放入任务队列。
  3. 创建另一个微任务，放入微任务队列。

- 继续处理微任务：
1.  执行下一个微任务，放入微任务队列。

- 任务对列还有任务，还要检查微队列
  1.  微任务队列中的第一个任务执行，输出 G。
  2.  微任务队列中的第二个任务执行，输出 H。

- 执行栈再次为空，微队列执行完毕处理任务队列：
  1. 首先执行第一个 setTimeout 的回调，输出 B。
  2. 在这个回调中，创建两个新的微任务，依次放入微任务队列。

- 继续处理微任务：
  1. 继续处理微任务队列，输出 C，然后输出 D。

- 最后处理第二个 setTimeout 的回调： 
  1. 任务队列中的第二个 setTimeout 回调被执行，输出 F。

综上，输出的顺序是 `A`、`I`、`E`、`C`、`G`、`H`、`B`、`C`、`D`、`F`。

**例子 4：**

```js
console.log("1");

function asyncFunction() {
  console.log("2");

  setTimeout(() => {
    console.log("3");

    Promise.resolve().then(() => {
      console.log("4");
    });
  }, 0);

  Promise.resolve().then(() => {
    console.log("5");
  });
}

asyncFunction();

Promise.resolve().then(() => {
  console.log("6");
});

console.log("7");
```
解析

- 执行栈中的同步代码：
  1. console.log('1') 输出 1。
  2. 调用 asyncFunction()。
  3. 在 asyncFunction 中，输出 2。
  4. 创建一个 setTimeout 的回调，被放入任务队列。
  5. 创建第一个 Promise.resolve().then() 的回调，被放入微任务队列（等待栈清空）。

- 继续执行 asyncFunction：
  1. 退出 asyncFunction 后，继续执行后面的同步代码。

- 执行栈中的剩余代码：
  1. Promise.resolve().then(() => { console.log('6'); }); 的回调被放入微任务队列（等待栈清空）。
  2. console.log('7') 输出 7。

- 处理微任务：
  1. 此时栈清空了，执行微任务队列中的第一个任务，输出 5。
  2. 继续执行微任务队列中的第二个任务，输出 6。

- 执行任务队列中的任务：
  1. 执行第一个 setTimeout 的回调，输出 3。
  2. 在这个回调中，创建另一个微任务，放入微任务队列。

- 最后处理微任务：
  1. 此时栈已经清空了，执行微任务，输出 4。

综上，输出的顺序是 `1`、`2`、`7`、`5`、`6`、`3`、`4`。


最后，总结一下，「事件循环」会先执行「执行栈」里的同步代码，遇到异步操作（如 setTimeout、I/O 操作等）时，将它们的回调放入「任务队列」，当「执行栈」为空时（即到底了，最后一个同步函数执行完毕），事件循环会检查「微任务队列」，执行所有微任务。然后再从「任务队列」中取出一个任务，推入「执行栈」执行。当「执行栈」为空且「任务队列」和「微任务队列」都为空时，程序结束。

事件循环是 JavaScript 处理异步操作的机制，使得在单线程环境中，能够高效地执行任务。通过将任务和微任务区分开，事件循环能够确保微任务在每个任务之前执行，从而实现更加顺畅和高效的异步编程。理解事件循环对于编写高效和无错的异步代码至关重要。