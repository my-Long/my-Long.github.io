---
layout:     post
title:      普通构造函数特点？
subtitle:   把 class 转为 function 怎么处理👀
date:       2023-03-06
author:     MY
header-img: img/post-bg-unix-linux.jpg
catalog: true
tags:
    - 基础
    - javascript
---
## 前言
以前写 `构造函数` 都是约定的，可以 `new` 的就是构造函数。 `class` 出来后，越来越多的人喜欢用 `class` 的方式来创建构造函数。 那如果书写一个效果和 `class` 一样的 普通构造函数呢？

## 正文
 class 声明的格式如下：
 ```js
 class Example {
  constructor(msg) {
    this.msg = msg;
  }
  func() {
    console.log(this.msg);
  }
}
 ```
通过阅读文档，发现 class 创建的函数有以下几个特点：

> - 严格模式
> - new 调用
> - 枚举
> - 方法的调用

因此，我们将从这四点出发

### 1、严格模式
`ES6` 的类是整个处于 严格模式 下的，所以转化后的 `普通函数` 也是处于严格模式下的。

```js
"use strict";

function Example() {}
```
### 2、 new 调用
`class` 必须使用 `new` 关键字来调用，如果不用则会报错.

![图片不见了](/img/class-error.jpg)

因此，转换为 `普通构造函数` 后，如果普通调用，也要报一样的错误。
```js
function Example(msg) {
  //是否使用 `new` 关键字在调用
  if (!new.target) {
    //undefined 则是一般调用
    throw new TypeError(
      `Class constructor Example cannot be invoked without 'new'`
    );
  }
  this.msg = msg;
}
Example.prototype.func = function () {
  console.log("this.msg", this.msg);
};

```

### 3、枚举
通过 `class` 声明 `new` 出来的 对象，**只有属性是可以枚举的**，方法是不可枚举的。因此，需要通过 `属性描述符` 将方法设为不可枚举。

```js
Object.defineProperty(Example.prototype, "func", {
  value: function () {
    console.log("this.msg", this.msg);
  },
  enumerable: false,//不可枚举
});
```

### 4、方法的调用
`class` 类里的方法不能通过 `new` 关键字来调用，否则报错。转化后的 普通构造函数 也应如此。
```js
Object.defineProperty(Example.prototype, "func", {
  value: function () {
    //不能使用 `new` 来调用
    if (new.target) {
      throw new TypeError(`example.prototype.func is not a constructor`);
    }
    console.log("this.msg", this.msg);
  },
  enumerable: false,
});

```
### 完整的代码🤖
```js
//xxx.js

"use strict";

function Example(msg) {
  //是否使用 `new` 关键字在调用
  if (!new.target) {
    //undefined 则是一般调用
    throw new TypeError(
      `Class constructor Example cannot be invoked without 'new'`
    );
  }
  this.msg = msg;
}
Object.defineProperty(Example.prototype, "func", {
  value: function () {
    //不能使用 `new` 来调用
    if (new.target) {
      throw new TypeError(`example.prototype.func is not a constructor`);
    }
    console.log("this.msg", this.msg);
  },
  enumerable: false,
});

export default Example;

```