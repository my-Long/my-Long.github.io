---
title: "Primitives vs Objects in JavaScript, Revisited"
description: "A deeper look at how JavaScript primitives and objects actually differ — value types, reference types, and the traps that come with each."
date: 2026-05-12 00:00:00 +0800
categories: [JS, Base]
tags: [javascript, primitives, objects, types]
---

一直以为 primitives 存在 stack 上，objects 存在 heap 上——这个说法在各种教程里出现得太频繁了，我从来没怀疑过。直到认真翻了一遍 ECMAScript 规范，才发现这个说法压根就不在规范里。规范只定义了**两种东西：primitive values 和 objects**，从没提过 stack 或 heap，那是引擎的实现细节，不同引擎可以随便搞。

那真正的区别是什么？**可变性（mutability）**。

## 不可变的 primitives，可变的 objects

JS 的 7 种 primitive：`string`、`number`、`bigint`、`boolean`、`undefined`、`null`、`symbol`，它们有一个共同点——**你没有办法修改它，只能替换它**。

```js
let greeting = "hello";
let shout = greeting.toUpperCase();

console.log(greeting);  // "hello" — 原值没动
console.log(shout);     // "HELLO" — 新的字符串
```

`toUpperCase()` 返回的是一个新字符串，不是在原来那个上面改。所有 string 方法都是这个逻辑，没有一个是 in-place 修改的。

Objects 完全相反——它是可变的，你可以随时改它的内容，而且多个变量可以指向同一个 object：

```js
const original = { name: "Alice" };
const copy = original;
copy.name = "Bob";

console.log(original.name);  // "Bob" — 被改了
```

这里 `copy` 和 `original` 指向的是**同一个对象**。改了 `copy.name`，`original.name` 当然也变了。

## Call by sharing，不是 pass by reference

这里很多人（包括我）会搞混。传参的时候，object 是「pass by reference」吗？

不是。JS 用的是 **call by sharing**（也叫 call by object sharing）。

区别在这里：

```js
// mutation 能影响原始对象
function rename(person) {
  person.name = "Bob";
}
const user = { name: "Alice" };
rename(user);
console.log(user.name);  // "Bob" — 改了
```

```js
// 但 reassignment 影响不了
function replace(person) {
  person = { name: "Charlie" };  // 只是改了局部变量
}
const user = { name: "Alice" };
replace(user);
console.log(user.name);  // "Alice" — 没动
```

传进去的是对象的引用的一份拷贝，不是变量本身。在函数里 mutate 对象的属性，原对象会受影响；但如果直接把参数 reassign 给一个新对象，只是改了函数内部那个局部变量，外面的 `user` 还是指向原来那个对象。

如果是真正的 pass by reference（比如 C++ 的引用），函数内的 reassignment 会影响外面的变量。JS 不会——这就是 call by sharing 的核心。

primitives 也遵循同样的规则，只是因为 primitives 本身不可变，根本没法 mutate，所以这个区别不那么明显。

## mutation 和 reassignment 不是一回事

这两个概念放在一起说是因为很多 bug 都出在这里。

**mutation** 是改对象内部的内容：

```js
const arr = [1, 2, 3];
arr.push(4);    // mutation — 改了数组本身
arr[0] = 99;    // mutation

const obj = { name: "Alice" };
obj.name = "Bob";  // mutation
```

**reassignment** 是让变量指向另一个东西：

```js
let arr = [1, 2, 3];
arr = [4, 5, 6];   // reassignment — 换了一个新数组

let obj = { name: "Alice" };
obj = { name: "Bob" };  // reassignment
```

**`const` 阻止的是 reassignment，不是 mutation。** 这个搞混的人真的很多。

```js
const arr = [1, 2, 3];
arr.push(4);    // 完全合法
arr = [4, 5, 6]; // TypeError — 不行
```

`const` 声明的 object 或 array，里面的内容随时可以改，只是不能让这个变量指向别的东西。

如果真的需要不可变对象，用 `Object.freeze()`：

```js
const user = Object.freeze({ name: "Alice", age: 25 });
user.name = "Bob";  // 静默失败（strict mode 下会报错）
console.log(user.name);  // "Alice"
```

但 `Object.freeze()` 是浅的——只冻结第一层，嵌套的对象还是可以改：

```js
const user = Object.freeze({ name: "Alice", address: { city: "NYC" } });
user.address.city = "LA";  // 能改
console.log(user.address.city);  // "LA"
```

## 对象比较的是「是不是同一个」

primitives 按值比较，`"hello" === "hello"` 是 `true`，这没什么意外的。

objects 比较的是**引用是否相同**，也就是「是不是同一个对象」，不是「内容是否一样」：

```js
let obj1 = { name: "Alice" };
let obj2 = { name: "Alice" };
console.log(obj1 === obj2);  // false — 两个不同的对象

let obj3 = obj1;
console.log(obj1 === obj3);  // true — 同一个对象
```

所以这些会让人一愣：

```js
console.log({} === {});     // false
console.log([] === []);     // false
```

要按内容比较，可以用 `JSON.stringify()`（简单对象可以，但有坑：属性顺序、`undefined`、`Date`、循环引用都会出问题），或者用 Lodash 的 `_.isEqual()`。

## 拷贝对象时要想清楚深浅

这是 bug 最爱藏的地方。

spread 和 `Object.assign` 都是浅拷贝——只复制第一层，嵌套的对象还是共享的：

```js
const original = { name: "Alice", address: { city: "NYC" } };
const copy = { ...original };

copy.name = "Bob";
console.log(original.name);  // "Alice" — 没事

copy.address.city = "LA";
console.log(original.address.city);  // "LA" — 被改了
```

`address` 这层是同一个对象，`copy.address` 和 `original.address` 指向同一个地方。

深拷贝用 `structuredClone()`，ES2022 原生支持，主流浏览器和 Node.js 18+ 都有：

```js
const deep = structuredClone(original);
deep.address.city = "LA";
console.log(original.address.city);  // "NYC" — 完全独立
```

旧方案 `JSON.parse(JSON.stringify())` 的问题太多了，除非场景非常简单不然别用。

## 顺带一提：V8 里 primitives 也在堆上

最后说一下「primitives 在 stack」这个说法有多不准确。

V8（Chrome、Node.js 用的引擎）里，只有一类值是「直接存」的——**Smi（Small Integer）**，大约是 -2³¹ 到 2³¹-1 范围内的整数，用一个 tag bit 标记区分。其他所有值，包括字符串、大数字、BigInt，都存在堆上，变量里存的是一个指向堆的指针。V8 官方博客在 [Pointer Compression in V8](https://v8.dev/blog/pointer-compression) 里直接说了：「JavaScript values in V8 are represented as objects and allocated on the V8 heap, no matter if they are objects, arrays, numbers or strings.」

也就是说，`"hello"` 和一个百万字符的字符串，在 V8 里都在堆上。stack/heap 那套说法描述的是**行为**，不是存储事实。用来建立直觉没问题，但当成规范就错了。

---

重新过一遍这些之后，感觉之前很多模糊的地方说不清楚，原因就是把「行为模型」当成了「实现事实」。ECMAScript 只管定义行为，怎么存是引擎自己的事。搞清楚这层之后，很多「奇怪」的现象就不奇怪了。

> 想直接翻规范的话，ECMAScript 262 有中文版：[GitCode 仓库](https://gitcode.com/Premium-Resources/970a4)。
