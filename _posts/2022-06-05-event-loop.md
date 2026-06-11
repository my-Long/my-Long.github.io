---
title: "JavaScript Event Loop"
description: "How the call stack, task queue, and microtask queue interact to make JavaScript's single-threaded async model work."
date: 2022-06-05 00:00:00 +0800
categories: [JS, Base]
tags: [event-loop]
---

这个问题很难说清楚，我就记录自己的理解。

JavaScript 是单线程的，同一时刻只能干一件事。「事件循环」是浏览器渲染主线程的工作方式，协调同步代码和异步回调的执行顺序。它的组成部分：

**执行栈（Call Stack）**：当前正在运行的代码所在的地方。函数调用入栈，执行完出栈。栈清空之前，事件循环不会处理其他任务。

**任务队列（Task Queue）**：`setTimeout`、`setInterval`、I/O 操作的回调在这里排队，等执行栈空了才会被取出执行。

**微任务队列（Microtask Queue）**：`Promise.then()`、`MutationObserver` 的回调在这里。优先级比任务队列高——**每次执行栈清空后，先把微任务队列清空，再去取下一个普通任务**。

> W3C 已经不再使用「宏任务」这个词，直接叫「任务」。

---

几个例子过一遍，顺序就清楚了。

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

同步代码先跑：打印 `Start`，`setTimeout` 回调入任务队列，`Promise.then` 回调入微任务队列，打印 `End`。栈清空后先清微任务队列：打印 `Micro Task`。再取任务队列：打印 `Timeout Task`。

输出：`Start` → `End` → `Micro Task` → `Timeout Task`

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

同步：`A`、`E`。微任务队列清空：`C`（`.then` 返回的新 Promise 又入微任务队列）→ `D`。任务队列：`B`。

输出：`A` → `E` → `C` → `D` → `B`

**例子 3**（嵌套）：

```js
console.log("A");

setTimeout(() => {
  console.log("B");

  Promise.resolve()
    .then(() => { console.log("C"); })
    .then(() => { console.log("D"); });
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

同步：`A`、`I`。清微任务：`E`（顺带把 F 的 setTimeout 放进任务队列，G 的 Promise 入微任务队列）→ `G` → `H`。取第一个任务（B 的 setTimeout）：`B`，执行时产生 C/D 的微任务，先清微任务：`C` → `D`。再取任务：`F`。

输出：`A` → `I` → `E` → `G` → `H` → `B` → `C` → `D` → `F`

**例子 4**：

```js
console.log("1");

function asyncFunction() {
  console.log("2");

  setTimeout(() => {
    console.log("3");
    Promise.resolve().then(() => { console.log("4"); });
  }, 0);

  Promise.resolve().then(() => { console.log("5"); });
}

asyncFunction();

Promise.resolve().then(() => { console.log("6"); });

console.log("7");
```

同步：`1`、`2`（asyncFunction 内）、`7`。清微任务：`5`（asyncFunction 内的 Promise）→ `6`（外部的 Promise）。取任务（3 的 setTimeout）：`3`，清微任务：`4`。

输出：`1` → `2` → `7` → `5` → `6` → `3` → `4`

---

规律就是：同步代码跑完 → 清空微任务 → 取一个普通任务 → 清空微任务 → 再取下一个普通任务……如此循环。微任务在每次任务之间都会被完全清空，这是它优先级高于普通任务的本质原因。
