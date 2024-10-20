---
layout: post
title: Prototype and prototype chain ?
subtitle: 原型与原型链之间错杂的关系
date: 2022-05-22
author: My
header-img: img/post-bg-js-version.jpg
catalog: true
tags:
  - 基础
  - 对象
  - javascript
---

原型和原型链看起来错综复杂，但是如果把其中的关系分开理清楚，还是很好理解的，但也不是一句话就能够说清楚，还是需要从几个点依次去分析的。

### 对象

> 所有对象都是 new 一个函数出来的。{}只是语法糖。

通过老师的讲解，可以先理解他们之间的关系

<iframe width="966" height="543" src="https://www.youtube.com/embed/0D0Vk1rBpsc" title="7 分鐘圖解搞懂原型鏈" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

下面我们开始对他们的关系进行梳理，看这张图，理解 new。
![image.png](/img/post-prototype1.png)

比如说我们有一个普通函数 `obj`，我们将通过 new 这个函数，创造一个对象（实例）。

```js
function obj() {
  return {};
}
const newObj = new obj();
```

我们解读一下这个过程，现在实例产生了，我们都知道通过 new 一个构造函数可以生成「实例」，那这个「构造函数」是 `obj`吗？

因为这个函数是有返回值，因此函数调用相当于调用函数体，通过控制台调试你会发现 `constructor:f Object()`，也就意为着， newObj 实例的产生是调用了「构造函数」Object。就是说 `return {} `等价于 `return new Object()`。从而说明了 `{}`是语法糖。

如果函数没有返回值，即

```js
function obj() {}
const newObj = new obj();
```

那此时，构造函数就是 `obj`。

### 函数

> 函数的本质也是对象

函数是通过 new 一个 「Function」构造函数产生的。

那对象是通过 new 一个构造函数，函数也是 通过 new 一个构造函数。那构造函数哪来？这就涉及到「先有鸡还是先有蛋」问话题了，「Function」可以理解为「根函数」，它不是通过 new 出来的，而是在 js 引擎启动的时候，直接存在内存里的[[1]](#引用)。例如我们常见的 「Object」「Array」「String」，就是通过 new Function() 生成的构造函数（实例对象）。而 `{}`、`[]`则是字面量，是通过 new Object() 和 new Array() 得到的。
### 原型
>原型，通常也称做「prototype」

所有的函数都有一个属性叫做「prototype」，被称为「函数原型」。不管是构造函数「Object」、「Number」还是自己写的普通函数，都有这个「函数原型」。

默认情况下，「prototype」对象有一个属性「constructor」，它也是一个对象，指向了「构造函数」本身。

「**原型，即 prototype 是一个普通的 Object 对象**」
![image.png](/img/post-prototype2.png)

比如 `text` 函数，它的原型（暂且称为 obj），即伪代码`obj = test.prototype`，`obj.constructor = test`

```js
function test() {}
console.log(test.prototype);
console.log(test.prototype.constructor);
console.log(test.prototype.constructor === test);
```
![image.png](/img/post-prototype3.png)

### 隐式原型
>隐式原型，通常写成 「__proto__」，在浏览器调试中显示未 [[Prototype]]

这个有 「两个下划线」的变量都表示的是「系统变量」，不要轻易地去使用。

**所有的对象**都有一个属性叫做「__proto__」，被称之为「隐式原型」。只要是个对象，就有这个属性。

默认情况下，「隐式原型」指向创建该对象的函数的原型。对象是通过 new 一个函数产生的，因此这个实例对象的「隐式原型」指向的就是这个构造函数的「原型」。
```js
const a = new Object();
console.log("a", a.__proto__ === Object.prototype);//true
```

得到实例对象和构造函数之间的关系后，我们可以做一些方便的操作。先看一个图。
![image.png](/img/post-prototype4.png)

通过「构造函数add」new 出来了两个实例对象 对象1 和 对象2 。这两个实例对象的「__proto__」都指向「构造函数add」的原型。同一个构造函数可以创建多个不同的对象，这些对象的隐式原型指向的原型是一样的，所以该内存空间是共用的。

因此，当我们创建公共类时，如果 `User`，都要执行一个一个 `sayHi` 方法，如果这个方法是普通的，那多个实例对象在调用这个方法时，将会重新构建这个函数，非常浪费资源。从上面发现的特点来看，多个实例对象的隐式原型都指向构造函数的原型，因此我们可以把公共方法作为构造函数原型的一个属性，以实现复用的效果。
```js
function User(name, age) {
  this.name = name;
  this.age = age;
  User.prototype.sayHi = function (message) {
    console.log(`${this.name}说了${message}！`);
  };
}
const a = new User("张三", 20);
const b = new User("李四", 40);

console.log(a.__proto__.sayHi === b.__proto__.sayHi); // true
```
>我们发现，a 对象本身是没有 sayHi 这个方法的（存在构造函数原型里），但是能访问到。那我们可不可以这么推，用a调用一个方法，a本身没有，就去构造函数的原型（User.prototype）里去找，如果找不到就往上找，User 的构造函数的原型（Object.prototype）里去找。

像这种把方法绑在原型上的形式，我们平常是经常使用的。比如我们声明一个数组（数组也是对象），数组本身没有 「push」之类的方法，但是我们能访问到，窥其原因，就是这个方法绑定在了 arr 的构造函数(Array)的原型上了。

方便是方便，但是如果每个人都轻易地向原型中添加方法，那将会造成很大的隐患，这种行为是「扩展内置对象」[[2]](#引用)

### 原型链

通过上面 「__proto__」和构造函数的关系，其实已经是就引出原型链了。

![image.png](/img/post-prototype5.png)

```js
function Obj() {}
const obj = new Obj();

console.log(obj.__proto__ === Obj.prototype); // ture 普通函数的隐式原型 指向构造函数原型
console.log(Obj.__proto__ === Function.prototype); // true 构造函数的隐式原型 指向 Function的原型

console.log(Obj.prototype.__proto__ === Object.prototype); //true 构造函数的原型对象 是一个普通对象，它的隐式原型指向 Object的原型
console.log(Function.prototype.__proto__ === Object.prototype); //true Function的原型对象 是一个普通对象，它的隐式原型指向 Object的原型

console.log(Object.prototype.__proto__ === null); //true Object的原型对象 指向 null

console.log(obj.__proto__.__proto__.__proto__ === null); //true 第一条 第三条 第五条 合并
```
> PS: Function 的 隐式原型 指向 自身的 原型。Object的 隐式原型指向 null。

哦对了，如果你在浏览器控制台看到一个函数是这样的 `ƒ () { [native code] }`，说明这是 js 引擎提供的原生函数。
### 引用

 1. [Function 对象](https://262.ecma-international.org/13.0/?_gl=1*4nk8ib*_ga*OTIzOTY1Mjc0LjE3MDk3NDA1MjU.*_ga_TDCK4DWEPP*MTcwOTc0MDUyNS4xLjEuMTcwOTc0MDg5NS4wLjAuMA..#sec-fundamental-objects)是在 JavaScript 引擎启动时加载到内存中的。
 2. 扩展内置对象是[猴子补丁：](https://juejin.cn/post/7142856679976075271?searchId=20241020202947149F3714A6514617D99C)的用法之一，在函数原型加入成员，以增强对象的功能。猴子补丁会造成原型污染。
