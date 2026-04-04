---
layout: post
title: "debounce and throttle"
subtitle: "对防抖和节流的简单理解"
author: "My"
header-style: text
tags:
  - javascript
  - 基础
---

「防抖」和「节流」或多或少在项目中都会使用，技术并不是很复杂，主要是「设计思路」和对函数的理解与运用。

### 防抖

「防抖」是指在一个函数被多次调用时，只有在停止调用一段时间后才会执行，也就是说，函数在被调用时，会将之前的调用记录下来，如果在这段时间内又被调用，则会将之前的调用清除，只执行最后一次调用。

举个例子：就像是电梯门，如果电梯门即将关闭，这时候你按下了开门按钮，电梯就会重置关门时间。

在项目中，常用的场景就是搜索框的输入，当用户输入时，会触发搜索请求，如果用户输入的速度过快，则会触发多次请求，这时候就可以使用防抖函数，在用户停止输入一段时间后才会触发请求。

防抖函数的关键点就是「延迟」和「执行一次」。

```javascript
export const debounce = function (callback, delay) {
  setTimeout(() => {
    callback();
  }, delay);
};
```

上诉代码是基本架子，实现了「延迟」功能，但是没有实现「执行一次」功能。可以在每次调用函数 `debounce` 时，将 `setTimeout` 清除，这样就能保证始终都只有一个延迟执行的 `setTimeout` 实例。

```javascript
var timer;
export const debounce = function (callback, delay) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    callback();
  }, delay);
};
```

到此，两个核心核心功能完成，但是使用了全局变量 `timer`，这在多人开发时，可能会造成冲突，所以可以考虑使用「闭包」的方式来实现。

```javascript
export const debounce = function (callback, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      callback();
    }, delay);
  };
};
```

在搜索时使用该防抖函数，

```javascript
//高阶函数：函数内部返回一个新的函数
const debounce = utils.debounce(function () {
  console.log("searchValue", searchValue.value);
}, 1000);

const onSearch = () => {
  debounce(); //调用防抖函数
};
```

这里面还缺少了「参数的传递」，即在触发 `onSearch` 调用 `debounce` 时，应该把参数传递给 `debounce` 函数，然后在防抖函数的回调中传出该参数。

```javascript
//debounce.js

export const debounce = function (callback, delay) {
  let timer;
  return function () {
    clearTimeout(timer);
    let args = arguments;
    timer = setTimeout(() => {
      callback.apply(null, args);
    }, delay);
  };
};
```

js 中 `apply` 方法的作用是将 `this` 绑定到 `null`，并将参数列表 `args` 作为参数传入 `callback` 函数。

在页面上使用，

```javascript
const debounce = utils.debounce(function (val) {
  console.log("val", val); // 接收的参数，输入框的值 searchValue.value
}, 1000);

const onSearch = () => {
  debounce(searchValue.value);
};
```

### 节流

「节流」是指在一个函数被多次调用时，每隔一段时间才会执行，也就是说，函数在被调用时，会记录下来当前时间，如果在这段时间内又被调用，则会判断是否到达了规定的时间间隔，如果到了，则执行函数，否则就忽略。

节流函数的关键点就是「时间间隔」和「执行一次」。强调的是**时间间隔**。

#### 延迟触发

这里可以理解为，触发函数后，会延迟一段时间再执行，而不是立即执行。即是在时间延迟后才执行。如果多次触发函数，则不进入函数体，保证函数只执行一次。

```javascript
export const throttle = function (callback, delay) {
  let timer;
  return function () {
    if (timer) return;
    let args = arguments;
    timer = setTimeout(() => {
      callback.apply(null, args);
      timer = null;
    }, delay);
  };
};
```

这是一个完整的延迟触发的节流函数，在页面上使用，

```javascript
const throttle = utils.throttle(function (val) {
  console.log("val", val);
}, 1000);

const onSearch = () => {
  throttle(searchValue.value);
};
```

#### 立即触发

这里可以理解为，触发函数后，会立即执行，然后在规定的时间间隔内，不会再次执行。

这里使用的是「时刻比较」法。

```javascript
export const throttle = function (callback, delay) {
  let t;
  return function () {
    if (!t || Date.now() - t >= delay) {
      //之前没有及时 或 距离上次执行的时间大于规定时间
      callback.apply(null, arguments);
      t = Date.now(); //得到当前时间搓
    }
  };
};
```

通过条件判断，就能保证「初次」会进入函数体，执行函数。第二次进入，若 `Date.now() - t >= delay`，则说明距离上次执行的时间间隔到了，则执行函数。

#### 立即触发 + 延迟触发

通过参数限制，可以选择立即触发还是延迟触发。

```javascript
//throttle.js

export const throttle = function (callback, delay, immediately = true) {
  if (immediately) {
    let t;
    return function () {
      if (!t || Date.now() - t >= delay) {
        //之前没有及时 或 距离上次执行的时间大于规定时间
        callback.apply(null, arguments);
        t = Date.now(); //得到当前时间搓
      }
    };
  } else {
    let timer;
    return function () {
      if (timer) return;
      let args = arguments;
      timer = setTimeout(() => {
        callback.apply(null, args);
        timer = null;
      }, delay);
    };
  }
};
```

默认选择的类型是立即触发，可以传入 `immediately` 参数来选择。
