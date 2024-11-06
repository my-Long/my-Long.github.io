---
layout: post
title: "关于 Vue 响应式原理的思考"
subtitle: "什么是响应式？谁和谁之间的关系？"
author: "My"
header-style: text
tags:
  - Javascript
  - Vue
---

## 前言

响应式最直观的解释就是：数据变化时，视图会自动更新，也就是「数据驱动视图」。换一句话说，响应式里的关系是 「数据」 和「视图」 之间的关系。

### 视图

什么是视图？应该是用户看到的页面，也确实如此。但是，在计算机里，并没有所谓的「页面」。在「web」中，我们看到视图，就是 dom 元素，不仅如此，页面上的数字，文字也是视图的一部分。在 vue 中，是使用 虚拟 dom 来映射成 dom 的，而虚拟 dom 本身就是 js 对象。

因此，我们所说的页面，包含了字符串、对象、数字等等东西，而数据变动后，恰恰就是这些东西发生了变化。而这些「东西」我们也称为「数据」。

这似乎是数据与数据之间的关系。在表格中，我们可以看到数据与数据之间的关系，比如说 D 列 求和，像是 D 列数据与求和结果的关系，但仔细想想，求和是有公式进行的，所以说：「在表格中，是数据与求和公式之间的关系」更为恰当。

求和公式还有另一种叫法 —— 求和函数。因此是「数据」与「函数」之间的关系」。这样，如果非得说「视图」，但视图是 render 函数渲染出来的，所以单单谈某个响应数据，比如说 name 改变了，页面上的 name 自动更新，那就可以说：「数据与 render 函数之间的关系」。

但是，响应式不一定是体现在页面上，有些数据并不渲染在页面上。所以广义的说，还是 「数据」 和「函数」 之间的关系。所以响应式里说的「视图」，应该是「函数」。

### 数据

在 Vue 中，如一个 `.vue` 组件里，有很多的数据，那「数据与视图之间的关系」中的「数据」是指全部数据吗？

如 name 改变了，页面上的 name 自动更新，那 name 就是数据。 也就是说，用到的数据才是响应式概念里所说的数据。而对于「用到」的理解，也很容易明白，如一个函数用有 `if` 判断，那个被用到的数据，才能称为「响应式数据」。所以可以这么说，一个函数与什么样的数据产生关联，取决于函数的运行过程。

这是从函数执行过程去分析的，但是这种机制并不合理，函数是固定的，而里面的数据也是固定的，响应式数据的判定并不灵活。响应式数据应该由用户决定，让用户决定什么样的数据与函数产生关联，而不是由函数自身去判断。

如，用户把 name 打上标记，意为「响应式数据」，让这个 name 与函数产生关联。那么在 `vue` 内部可以这样来实现：

```javascript
let a = true,
  b,
  c;

  tag(b)；//打标记

  function fn(){
    if(a){
      b
    }else{
      c
    }
  }

```

这样，函数 `fn` 就知道 `b` 是一个响应式数据，当 `a` 改变时，`fn` 也会自动更新。

所以，响应式的理解应该是：「函数」与「函数运行过程中用到的`标记数据`」之间的关联。

## 正文

知晓了响应式的概念，那数据与函数之间是如何发生关联的，又是如何影响到视图的更新呢？。

不仅如此，虽然已经给数据打上标记了，但是如何知晓这个数据被读了或者被修改了？另外，这个数据被修改了，如何通知到函数呢？函数又如何从新执行呢？

### 数据的读写介绍

在 js 中，有两种方式可以对数据进行监听，分别是 `Object.defineProperty` 和 `Proxy`。

`Object.defineProperty` 是 ES5 中新增的方法，可以用来监听对象的属性变化。

```javascript
let obj = {
  name: "My",
};

Object.defineProperty(obj, "name", {
  get() {
    console.log("get name");
    return this._name;
  },
  set(newVal) {
    console.log("set name");
    this._name = newVal;
  },
});

obj.name = "Your";
```

`Proxy` 是 ES6 中新增的方法，可以用来监听对象的属性变化。能代理一个对象，拦截这个对象的基本操作。

```javascript
let obj = {
  name: "My",
};

let handler = {
  get(target, key) {
    console.log("get", key);
    return target[key];
  },
  set(target, key, value) {
    console.log("set", key, value);
    target[key] = value;
  },
};

let proxy = new Proxy(obj, handler);

proxy.name = "Your";
```

这两种方式都可以用来监听对象的属性变化，但是它们的实现方式不同。

`Object.defineProperty` 监听的是对象的属性，而 `Proxy` 监听的是整个对象。

`Object.defineProperty` 监听的是对象的属性，但是只能监听对象的属性，不能监听数组的索引。

`Proxy` 监听的是整个对象，可以监听数组的索引。

#### `reactive` 基本实现

`Vue3` 在「标记函数」内部使用 `proxy` 来监听数据变化：

```javascript
function tag(target) {
  return new Proxy(target, {
    get(target, key) {},
    set(target, key, value) {},
  });
}
```

在页面上使用时，即使用代理后的对象，

```javascript
const proxy = tag(b); //打标记

function fn() {
  if (a) {
    proxy; //代理对象
  } else {
    c;
  }
}
```

`Vue` 把这个标记函数声明为 `reactive` ，把 `reactive` 函数返回的对象称为 `响应式数据`。所以这个「标记函数」的雏形是：

```javascript
function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      return target[key]; //返回对象属性值
    },
    set(target, key, value) {
      return Reflect.set(target, key, value); //设置对象的响应属性
    },
  });
}
```

> [Reflect.set](/2022/06/18/reflect/) 是 `ES6` 新增的方法，用来设置对象的响应属性。

- 依赖收集

  哪个函数读取了这个数据，把这个函数记录下来，这一过程在 `Vue` 中称为「依赖收集」。

  ```javascript
  //effect.js

  /**
   * @description: 依赖收集（建立对应关系）
   * @param {* object} target
   * @param {* string} key
   * @return {*}
   */
  export function track(target, key) {
    console.log("依赖收集", key);
  }
  ```

- 派发更新
  当数据变化时，通知所有依赖这个数据的函数，让它们重新执行。这一过程在 `Vue` 中称为「派发更新」。

  ```javascript
  //effect.js

  /**
   * @description: 派发更新
   * @param {* object} target
   * @param {* stirng} key
   * @return {*}
   */
  export function trigger(target, key) {
    console.log("派发更新", key);
  }
  ```

因此，在 `reactive` 函数中应该是这样的，当数据变化时，调用 `track` 函数，把函数记录下来，然后调用 `trigger` 函数，通知所有依赖这个数据的函数，让它们重新执行。

```javascript
function reactive(target) {
  return new Proxy(target, {
    get(target, key) {
      track(target, key); //依赖收集
      return target[key]; //返回对象属性值
    },
    set(target, key, value) {
      trigger(target, key); //派发更新
      return Reflect.set(target, key, value); //设置对象的响应属性
    },
  });
}
```

页面上的基本使用：

```javascript
import { reactive } from "./reactive.js";

const state = reactive({ a: 1, b: 2 });

function fn() {
  state.a;
  state.b; //读取
}
fn();

state.a = "gag"; //修改
```

![image.png](/img/vue/post-pic1.png)

#### `Proxy` 边界处理

前面已经是把 `reactive` 函数的实现分析了，但是还没有考虑到 `Proxy` 的一些边界情况。

- 参数非对象

  `Proxy` 要求第一个参数必须是对象，如果不是对象，则返回原始数据。

  ```javascript
  // reactive.js

  export function reactive(target) {
    if (!isObject(target)) {
      return target;
    }
    // 其他代码
  }
  ```

- 同一个对象

  在 `reactive` 函数中，使用 `new` 关键字，因此返回的都是新的对象实例，也就说，监听的是同一个对象，但是拿到的是不同的代理对象。监听的目的是给对象打标记，同一个对象应该只有一个标记才是合理的。

  需要将被监听的对象与代理之间形成一种关联， 一个对象对应一个代理，如果将来再传入同一个对象，那直接把代理返回。使用 `map` 结构做映射关系。

  > map，那当这个对象不再使用时，对象的引用在 map 里还存在，就造成内存泄漏，回收不掉。
  >
  > weakmap 的 key 值是弱引用，外边不再使用这个对象时，可以把它整个键值对回收掉，不会造成内存泄漏。

  ```javascript
  // reactive.js

  const targetMap = new WeakMap();

  export function reactive(target) {
    if (!isObject(target)) {
      return target;
    }

    if (targetMap.has(target)) {
      return targetMap.get(target); //如果代理过 直接返回
    }

    const proxy = new Proxy(target, {
      get(target, key) {
        track(target, key);
        return target[key];
      },
      set(target, key, value) {
        trigger(target, key);
        return Reflect.set(target, key, value);
      },
    });

    target.set(target, proxy); //存储 proxy
    return proxy;
  }
  ```

到此，边界条件基本处理完毕，考虑到 `reactive` 函数比较臃肿，可以把 `Proxy` 部分抽离出来：

```javascript
// handlers.js

import { track, trigger } from "./effect.js";

export const handlers = {
  get(target, key) {
    track(target, key); //依赖收集
    return target[key]; //返回对象属性值
  },
  set(target, key, value) {
    trigger(target, key); //派发更新
    return Reflect.set(target, key, value); //设置对象的响应属性
  },
};
```

```javascript
//reactive.js

import { handlers } from "./handlers.js";

const targetMap = new WeakMap();

export function reactive(target) {
  if (!isObject(target)) {
    return target; // 如果不是对象， 返回原始数据
  }

  if (targetMap.has(target)) {
    return targetMap.get(target); //如果代理过 直接返回
  }
  const proxy = new Proxy(target, handlers); //处理
  targetMap.set(target, proxy); //存储 proxy
  return proxy;
}
```

### 对象的「读」与「写」

响应式是基于对象的，现在来看看对象「读」与「写」的情况。

#### 对象的「读」

对于「读」，目前是在 [handlers](#proxy-边界处理) 函数实现的。在「读」中，使用的是 `Reflect.get` 方法，但没考虑全面。即如果代理的对象是这样的：

```javascript
const obj = {
  a: 1,
  b: 2,
  get c() {
    return this.a + this.b;
  },
};
```

其中 `this` 的指向和对象嵌套对象等，这如何处理？ 前面的文章[Reflect](/2022/06/18/reflect/)有提到 `reflect` t 的一些方法。

因此优化 `get` 方法：

```javascript
// handlers.js

import { reactive } from "./reactive.js";
import { track, trigger } from "./effect.js";

export const handlers = {
  get(target, key, receiver) {
    track(target, key);
    const result = Reflect.get(target, key, receiver); //返回对象属性值
    if (isObject(result)) {
      return reactive(result);
    }
    return result;
  },
  has(target, key) {
    track(target, key);
    return Reflect.has(target, key); //判断属性是否存在
  },
  set(target, key, value) {
    trigger(target, key);
    return Reflect.set(target, key, value);
  },
};
```

现在思考一个问题，「读」是不是仅仅指代「读取属性」？其实不是，`obj.c` 仅仅是读取某个属性的值，但是如判断属性存不存在，这也是属于「读」。所以，「读」应该是读取属性的信息，包括属性值、属性是否存在、属性是否可枚举等。

例如 `for...in` 循环，判断属性是否存在等，都要进行依赖收集，进而触发更新。所以在 `Proxy` 中，仅仅一个 `get` 方法还无法满足「读」的需求。通过[ECMAScript 262](https://262.ecma-international.org/13.0/?_gl=1*4nk8ib*_ga*OTIzOTY1Mjc0LjE3MDk3NDA1MjU.*_ga_TDCK4DWEPP*MTcwOTc0MDUyNS4xLjEuMTcwOTc0MDg5NS4wLjAuMA..#sec-object-internal-methods-and-internal-slots)可以看到其他的方法，如 `[[HasProperty]]` 用来判断属性是否存在。而[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)中对应的捕获器就是 `has()` 方法。

因此，`handlers` 方法里还应该有 `has` 方法：

```javascript
// handlers.js

import { track, trigger } from "./effect.js";

export const handlers = {
  get(target, key, receiver) {
    track(target, key);
    const result = Reflect.get(target, key, receiver); //返回对象属性值
    if (isObject(result)) {
      return reactive(result);
    }
    return result;
  },
  has(target, key) {
    track(target, key);
    return Reflect.has(target, key); //判断属性是否存在
  },
  set(target, key, value) {
    trigger(target, key);
    return Reflect.set(target, key, value);
  },
};
```

> PS:说个抽象的哲学问题：
> 比如说之前判断一个属性是否存在，会触发「依赖收集」，后面修改属性值，会触发「派发更新」，这是很合理的。 但是如果属性本来就存在，后面修改属性值，是否还应该触发`has()` 进行「依赖收集」呢？ 这理解起来比较抽象。 那还有一种情况，比如说 「添加」和「删除」都会进行「派发更新」，但是在 `trigger` 中，如何知道是什么操作呢？在之前的处理中，只是简单的调用了方法，并没有将「操作」传递进去。

应该有操作类型，记录下来，然后在 `trigger` 中根据操作类型进行不同的处理。

```javascript
//operation.js

export const TrackOpTypes = {
  GET: "get", //读取属性值
  HAS: "has", //潘丹属性是否存在
  INTERATE: "interate", //迭代对象
};

export const TriggerOpTypes = {
  SET: "set", //设置属性
  ADD: "add", //添加属性
  DELETE: "delete", //删除属性
};
```

到此，完善一下 `handlers` 方法：

```javascript
// handlers.js

import { track, trigger } from "./effect.js";
import { TrackOpTypes, TriggerOpTypes } from "./operation.js";

export const handlers = {
  get(target, key, receiver) {
    track(target, TrackOpTypes.GET, key);
    const result = Reflect.get(target, key, receiver); //返回对象属性值
    if (isObject(result)) {
      return reactive(result);
    }
    return result;
  },
  has(target, key) {
    track(target, TrackOpTypes, HAS, key);
    return Reflect.has(target, key);
  },
  ownKeys(target) {
    track(target, TrackOpTypes.INTERATE);
    return Reflect.ownKeys(target);
  },
  set(target, key, value) {
    trigger(target, TriggerOpTypes.SET, key);
    return Reflect.set(target, key, value);
  },
  // deleteProperty(target, key) {
  //   trigger(target, TriggerOpTypes.DELETE, key);
  //   return Reflect.deleteProperty(target, key);
  // },
};
```

响应的应该在 `effect.js` 中对 `track` 、`trigger` 函数中进行处理。

#### 对象的「写」

「写」不仅仅是 `set()` 方法，还包括 `deleteProperty()` 方法，另外修改属性和添加属性，都需要触发 `set()`。因此，需要完善 `trigger` 方法：

```javascript
// handlers.js

import { track, trigger } from "./effect.js";
import { TrackOpTypes, TriggerOpTypes } from "./operation.js";

export const handlers = {
  //...读取...

  set(target, key, value, receiver) {
    const type = target.hasOwnProperty(key)
      ? TriggerOpTypes.SET
      : TriggerOpTypes.ADD;
    trigger(target, type, key);
    return Reflect.set(target, key, value);
  },
  deleteProperty(target, key) {
    trigger(target, TriggerOpTypes.DELETE, key);
    return Reflect.deleteProperty(target, key);
  },
};
```

处理边界条件，如果修改一个不存在的属性，或者修改属性值为原来的值，都不应该进行「派发更新」。

```javascript
/**
 * @description: 判断两个值是否相等
 * @param {* string | number} oldValue
 * @param {* string | number} newValue
 * @return {* boolean}
 */
export function hasChange(oldValue, newValue) {
  return !Object.is(oldValue, newValue);
}
```

```javascript
export const handlers = {
  //...其他方法...

  set(target, key, value, receiver) {
    const type = target.hasOwnProperty(key)
      ? TriggerOpTypes.SET
      : TriggerOpTypes.ADD;

    const oldValue = target[key]; //仅获取值 不用Reflect，因为会收集依赖

    const result = Reflect.set(target, key, value, receiver); //设置对象的响应属性

    if (!result) {
      return result;
    }

    //当属性值发生变化 或 新增属性 时
    if (hasChange(oldValue, value) || type === TriggerOpTypes.ADD) {
      trigger(target, type, key); //派发更新
    }
    return result;
  },

  deleteProperty(target, key) {
    const hasKey = target.hasOwnProperty(key); // 判断属性是否存在
    const result = Reflect.deleteProperty(target, key); // 属性是否删除成功
    if (hasKey && result) {
      trigger(target, TriggerOpTypes.DELETE, key);
    }
    return result;
  },
};
```

### 数组的「读」与「写」

前面对「读」和「写」的处理，都是针对对象，但是数组的索引也是可以访问的，因此需要对数组的「读」和「写」进行处理。

#### 读数组的索引

```javascript
function fn() {
  state[1];
}
fn(); //【get】 1
```

#### 读数组的长度

```javascript
function fn() {
  state.length;
}
fn(); //【get】 2
```

#### 数组的 for...循环

```javascript
function fn() {
  for (let i = 0; i < state.length; i++) {
    state[i];
  }
}
fn();
```

![image.png](/img/vue/post-pic2.png)

读到了 `length` 和 `数组索引`，没问题。依赖重复收集的事后面再说。

#### 数组的 for...in 循环

```javascript
for (const item of state) {
}
```

![image.png](/img/vue/post-pic3.png)

#### 数组的 `includes()`

```javascript
function fn() {
  state.includes(1);
}
fn();
```

![image.png](/img/vue/post-pic4.png)

#### 数组的 `lastIndexOf()`

```javascript
function fn() {
  state.lastIndexOf(1);
}
fn();
```

![image.png](/img/vue/post-pic5.png)

#### 数组中含有对象

```javascript
const obj = {};
const arr = [1, {}, 3];
const state = reactive(arr);

function fn() {
  const i = state.indexOf(obj); // -1
}
fn();
```

![image.png](/img/vue/post-pic6.png)

按理说应该是能找到 `{}` 的，但是实际上并没有。在查找的时候，是在源对象 `arr` 里查找还是在响应对象 `state` 里查找？ 答案是：在源对象 `arr` 里查找。 但是这里明显是在 `state` 里查找。

```javascript
function fn() {
  var i = state.indexOf(obj);
  console.log("state[1]", state[1]); // Proxy(Object) {}
  console.log("arr[1]", arr[1]); // {}
}
```

前面有一项操作是，如果属性值是对象，则把该对象变成响应式对象。因此，才会如上方显示，`state[1]` 是一个响应式对象。

```javascript
function get(target, key, receiver) {
  track(target, TrackOpTypes.GET, key);
  const result = Reflect.get(target, key, receiver);
  if (isObject(result)) {
    return reactive(result); // 这里会把数组中的对象变成响应式对象
  }
  return result;
}
```

**因此，如果有嵌套，或者说数组中含有对象，当在代理对象里查不到的时候，我们有两种方案。**

- 将查找的对象变为响应式对象
- 当在代理对象里找不到时，再去原始数组里找一次

`Vue` 使用的是第二种方式，现在我们来修改 `includes()` 等方法，使得执行类似方法的时候，能从原始对象 `arr` 里查找。

因此，在 `get()` 中，如果读到了数组的方法，就执行我们我们自定义的方法。

```javascript
//handlers.js

const arrayInstrumentations = {
  includes: () => {},
  indexOf: () => {},
  lastIndexOf: () => {},
};

//读取
function get(target, key, receiver) {
  track(target, TrackOpTypes.GET, key); //依赖收集

  //如果是数组，且调用了数组方法
  if (arrayInstrumentations.hasOwnProperty(key) && Array.isArray(target)) {
    return arrayInstrumentations[key]; //返回修改后的方法
  }

  const result = Reflect.get(target, key, receiver); //返回对象属性值
  if (isObject(result)) {
    return reactive(result);
  }
  return result;
}
```

修改我们数组方法，使得能从原始对象 `arr` 里查找。这里分两个步骤，一是正常在代理对象 `state` 里找，如果找不到，再从原始对象里找。

```javascript
const arrayInstrumentations = {};

// 假设先只有这几个方法
["includes", "indexOf", "lastIndexOf"].forEach((key) => {
  arrayInstrumentations[key] = function (...args) {
    //1.正常查找 在原型上找
    //2.找不到 在原始对象上找
  };
});
```

1. 正常查找
   `this` 指向了「代理对象」。

```javascript
["includes", "indexOf", "lastIndexOf"].forEach((key) => {
  arrayInstrumentations[key] = function (...args) {
    //1.正常查找 在原型上找
    const res = Array.prototype[key].apply(this, args);
    return res;
  };
});
```

2. 原始对象

如果在「代理对象」上找不到，这在原始对象上找。需要修改 `this` 的指向，应该指向 「原始对象」。

> 声明一个 `RAW` 符号，用来标识原始对象。

```javascript
const arrayInstrumentations = {};
const RAW = Symbol("raw");

["includes", "indexOf", "lastIndexOf"].forEach((key) => {
  arrayInstrumentations[key] = function (...args) {
    console.log("args", args);
    //1.正常查找 在原型上找
    const res = Array.prototype[key].apply(this, args);

    //找不到 在原始对象上找
    if (res < 0 || res === false) {
      return Array.prototype[key].apply(this[sy], args); //读属性 触发`get`
    }
    return res;
  };
});

//读取
function get(target, key, receiver) {
  if (key === sy) {
    return target;
  }
}
```

到此，如果 `state.includes({})` 则会走进 arrayInstrumentations 的 `includes()` 方法，然后从原始对象里去找。

#### 数组的「写」

改动数组的方式有很多，例如修改某一项的值，`push()`、`pop()` 等等。因此，在修改数组时，到底应该触发哪些操作，都需要进行特定的处理。

#### 写数组的索引

```javascript
// 正常修改数组
function fn() {
  state[0] = 4; // set 0
}

// 数组越界
function fn() {
  state[5] = 4; // add 0
}
```

当数组越界时，数组长度发生了变化，为什么没有触发 `set length` 呢？在官方文档中这样描述，如果设置的的下标大于数组的长度，那就会执行`Object.defineProperty(obj,'length',value)`，这并没触发 length 属性，而是隐式修改，所以不会触发 `set()` 的执行。

因此需要手动触发，当然触发的条件必须满足以下条件：

- 设置的对象是一个数组。
- 设置前后数组的 length 有变化。
- 设置的不是 length 属性。

```javascript
//修改
function set(target, key, value, receiver) {
  const type = target.hasOwnProperty(key)
    ? TriggerOpTypes.SET
    : TriggerOpTypes.ADD;

  const oldValue = target[key];
  const oldLen = Array.isArray(target) ? target.length : undefined; //获取旧数组长度

  const result = Reflect.set(target, key, value, receiver);

  //赋值失败
  if (!result) {
    return result;
  }

  const newLen = Array.isArray(target) ? target.length : undefined;

  //当属性值发生变化 或 新增属性 时
  if (hasChange(oldValue, value) || type === TriggerOpTypes.ADD) {
    trigger(target, type, key); //派发更新

    //手动触发更新 set
    if (Array.isArray(target) && oldLen !== newLen) {
      if (key !== "length") {
        trigger(target, TriggerOpTypes.SET, "length");
      }
    }
  }
  return result;
}
```

上面是通过「修改某一项的值」导致 length 发生变化，进而手动触发 `set()` 。现在处理直接修改 `length` 属性。当 `length` 变大时，得到的是「稀疏数组」。当 `length` 变小时，即删除了后几项，但是没有触发 `delete` 操作，因此需要手动触发。

```javascript
//修改
//手动触发更新 set
if (Array.isArray(target) && oldLen !== newLen) {
  if (key !== "length") {
    trigger(target, TriggerOpTypes.SET, "length");
  } else {
    //找到哪些被删除的下标，依次触发配发更新
    for (let i = newLen; i < oldLen; i++) {
      trigger(target, TriggerOpTypes.DELETE, i.toString());
    }
  }
}
```

#### 数组的一些边界情况

正如上面说的，需要处理的情况很多，需要根据特定的方法处理边界条件。现在说说 `push()` 方法。在调用 `push(3)` 时，派发更新是合理的，触发了 `add 3` 和 `set length` 。但进行了两个依赖收集 `get push`和 `get length`。

这样看似很合理，但是开发者的目的就是为了改动数组，进而触发「派发更新」。开发者并不需要知道内部是怎么实现的，也就是说数组一变动就要「派发更新」，但现在却进行了「依赖收集」，这超出了开发者的预期。

如数组变动时，只进行「派发更新」，有两种方法：

- 把会对数组产生改动的方法全部重写
- 调用这些会改动数组的方法期间，停止依赖收集

`Vue` 使用的是第二种，第一种重写是完全的重写，不现实。因此，我们需要在 `push()` 方法中，手动停止「依赖收集」。

```javascript
["pop", "push", "shift", "unshift", "splice"].forEach((key) => {
  arrayInstrumentations[key] = function (...args) {
    pauseTracking(); //暂停依赖收集
    let res = Array.prototype[key].apply(this, args);
    resumeTracking(); //回复依赖收集
    return res;
  };
});
```

```javascript
//effect.js

let shouldTrack = true;

export function pauseTracking() {
  shouldTrack = false;
}

export function resumeTracking() {
  shouldTrack = true;
}

export function track(target, type, key) {
  //停止依赖收集
  if (!shouldTrack) {
    return;
  }

  if (type === TrackOpTypes.INTERATE) {
    console.log(`【${type}】`);
    return;
  }
  console.log(`【${type}】`, key);
}
```

到此，基本的数组的「读」和「写」的处理就完成了。

### 依赖收集与派发更新

前面部分已经实现了监听数据的「读」和「写」，涉及了「依赖收集」和「派发更新」，但是这两个方法并没有实现。

#### 准备

需要建立一个数据和函数的对应关系。这个对应关系是一个数据结构，使用 `Map` 实现。

这个数据结构与 `Vue` 有些不同。简单说明一下每个 `Map` 的含义。

> - targetMap
>
>   键就是我们代理的对象，每个对象的属性又对应一个 map，保存对象的属性。
>
> - propMap
>
>   键是对象的属性，值是对应的操作类型。
>
> - typeMap
>
>   这里的键呢就是操作行为，每个操作里边是一个集合，这里的集合称之为 dep，表示依赖。

读起来就是，哪个函数依赖哪个对象的哪个属性的读取行为，那 dep 是一个集合，就会保留很多个函数。

![image.png](/img/vue/post-pic7.png)

在 `effect.js` 中实现 `map`，进而处理依赖收集和派发更新。

```javascript
//effect.js

const targetMap = new WeakMap();
const INTERATE_KEY = Symbol("iterate"); //迭代时的属性
```

明确了「数据结构」的映射关系，「依赖收集」就是根据这些结构去建立这些对应的关系。「派发更新」就是根据这些关系去执行对应的函数。

在 `effect.js`，能拿到对象、属性、操作类型，但缺少了函数。现在需要明确是哪个函数使用了这个数据。

先做个分析：

```javascript
function fn() {
  state.a;
}
fn();
```

这里的 「函数」指的是什么？很明显，是 `fn` 。

```javascript
function fn() {
  function fn1() {
    state.a;
  }
  fn1();
}
fn();
```

这种情况下，「函数」指的是哪个？或者说将哪个函数存入集合？这里同前面的「标记数据」一样，把决定权交给用户，给需要进行依赖收集的函数打上个标记。比如有这么个函数 `effect` ，这个函数帮你运行函数。

```javascript
function fn1() {
  state.a;
}
fn1();

effecty(fn); //运行函数
```

所以这么认为，不管「响应式数据」位于何处，只要是运行 `fn` 的期间，用到了某个响应式数据，那这个响应式数据要关联的函数就是 `fn`。

声明副作用函数：

```javascript
/**
 * @description: 副作用函数。运行fn函数期间，将用到的所有响应式数据与fn进行关联
 * @param {* function} fn 要执行的函数
 */
export function effect(fn) {}
```

> 在依赖收集的时候，`shouldTrack` 用来判断是否需要进行依赖收集。现在还需要一个变量，当缺少函数时，不进行依赖收集。

```javascript
//effect.js

export function track(target, type, key) {
  //不应该进行依赖收集 或 缺少函数 则不进行依赖收集
  if (!shouldTrack || !activeEffect) {
    return;
  }
...
}
```

对 `activeEffect` 进行赋值处理。刚开始把 `fn` 赋值给 `activeEffect`，然后执行 `fn()`，这就能保证在函数运行期间，`activeEffect` 是有值的，函数运行结束之后，`activeEffect` 设置为 `null` 。而 `fn` 运行期间有可能用到了响应式数据，如果用到就会触发 `track` 函数，也就是说在 `track` 运行期间，`activeEffect` 是有值的。

```javascript
//effect.js
export function effect(fn) {
  activeEffect = fn;
  fn();
  activeEffect = null;
}
```

> 当某个数据发生改变了，函数内部的逻辑发生改变，要重新进行依赖收集和派发更新。

按照之前的逻辑，`fn()` 用到了响应式数据 `state.a` ，因此在在触发 `effect` 函数后，`activeEffect` 就被赋值为 `fn` 。`fn` 运行，进而根据条件，进行依赖收集。在「数据结构」里的体现就是 `state`、`state.a`、`state.b`、操作类型和 `fn` 之间的关系。

现在如果修改 `state.a` 的值，即改变了 `fn` 的逻辑。

```javascript
if (state.a === 1) {
  state.b;
} else {
  state.c;
}
```

这时候，`state.a` 发生了改变，`fn` 内部的逻辑发生了改变，通过「数据结构」找到了 `fn`，将 `fn` 重新运行。

**注意**：这里是重新运行 `fn`，而不是重新运行 `effect` 函数。因此，没有了 `activeEffect = fn` 的操作，`tract`函数也就不会执行，不会进行依赖收集。

因此，在 `effect` 内部，需要关联 `activeEffect` 到 `fn` 之间的关系，保存 `activeEffect` 的状态。原先是同步处理，`fn` 执行后直接修改 `activeEffect` 为 `null` 。现在使用 `try...catch` 包裹，将环境保存起来。

```javascript
export function effect(fn) {
  const effectFn = () => {
    try {
      activeEffect = fn;
      return fn();
    } finally {
      activeEffect = null;
    }
  };
  effectFn();
}
```

#### 依赖收集

现在进行依赖收集，对 `track` 函数进行处理，建立 `map` 结构。

- 建立 `targetMap` 里的关系

  ```javascript
  // 依赖收集
  export function track(target, type, key) {
    if (!shouldTrack || !activeEffect) {
      return;
    }
    let propMap = targetMap.get(target);
    if (!propMap) {
      propMap = new Map();
      targetMap.set(target, propMap); //建立关系
    }
  }
  ```

  现在 `targetMap` 已经有了 `state` 对象，`propMap` 为空。

- 建立 `propMap` 里的关系

  ```javascript
  // 依赖收集
  export function track(target, type, key) {
    if (!shouldTrack || !activeEffect) {
      return;
    }
    let propMap = targetMap.get(target);
    if (!propMap) {
      propMap = new Map();
      targetMap.set(target, propMap);
    }
    if (type === TrackOpTypes.ITERATE) {
      key = ITERATE_KEY;
    }

    let typeMap = propMap.get(key);
    if (!typeMap) {
      typeMap = new Map();
      propMap.set(key, typeMap); //建立关系
    }
  }
  ```

  现在 `propMap` 已经有了 `state.a` 属性，`typeMap` 为空。

- 建立 `typeMap` 里的关系

  ```javascript
  // 依赖收集
  export function track(target, type, key) {
    if (!shouldTrack || !activeEffect) {
      return;
    }
    let propMap = targetMap.get(target);
    if (!propMap) {
      propMap = new Map();
      targetMap.set(target, propMap);
    }
    if (type === TrackOpTypes.ITERATE) {
      key = ITERATE_KEY;
    }

    let typeMap = propMap.get(key);
    if (!typeMap) {
      typeMap = new Map();
      propMap.set(key, typeMap); //建立关系
    }

    let depSet = typeMap.get(type);
    if (!depSet) {
      depSet = new Set();
      typeMap.set(type, depSet); //建立关系
    }

    // 将 函数 存起来
    if (!depSet.has(activeEffect)) {
      depSet.add(activeEffect);
    }
  }
  ```

到此，一个基本的数据结构就建立好了。当响应式数据被读取时，会触发 `track` 函数，建设「数据结构」。

![image.png](/img/vue/post-pic8.png)

#### 派发更新

修改了哪个对象，哪个属性，哪个操作，就会触发 `trigger` 函数，执行依赖收集里的函数。现在需要一个辅助函数，用来查找依赖收集里的函数，并执行。

```javascript
/**
 * @description: 处理函数，找到对应的函数
 * @param {* object} target 源对象
 * @param {* stirng} type 操作类型
 * @param {* stirng} key 属性
 */
function getEffectFns(target, type, key) {
  const propMap = targetMap.get(target);
  if (!propMap) {
    return;
  }
}
```

有一些细节，当有「迭代」和「修改」属性一起时，可能有多个属性要拿，比如说 `add`触发，那`get`、`has`、`interate`都要拿。

```javascript
const keys = [key];
if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
  keys.push(INTERATE_KEY);
}

const effectFn = new Set();
for (const key of keys) {
  const typeMap = propMap.get(key);
  if (!typeMap) {
    continue;
  }
  console.log("typeMap", typeMap);
}
return effectFn;
```

这是基本的一个结构，收集和派发的属性是相对应的，比如说之前是 `get` 动作，存了一些函数在 A 集合。现在是 `add` 动作，那应该去哪个集合拿函数呢？`add` 动作也触发了 `has`，`has` 也存了一些函数在 B 集合。

因此，不确定集合，就得有个映射关系，把这些函数集合都拿到，然后遍历，找到里面的函数，依次执行。
![image.png](/img/vue/post-pic9.png)

派发更新时，需要根据操作类型，找到对应的依赖收集的函数集合。

```javascript
const triggerTypeMap = {
  [TriggerOpTypes.SET]: [TrackOpTypes.GET],
  [TriggerOpTypes.ADD]: [
    TrackOpTypes.GET,
    TrackOpTypes.HAS,
    TrackOpTypes.ITERATE,
  ],
  [TriggerOpTypes.DELETE]: [
    TrackOpTypes.GET,
    TrackOpTypes.HAS,
    TrackOpTypes.ITERATE,
  ],
};
```

把对应的函数拿出来，然后执行。

```javascript
function getEffectFns(target, type, key) {
  const propMap = targetMap.get(target);
  if (!propMap) {
    return;
  }

  const keys = [key];
  if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
    keys.push(ITERATE_KEY);
  }

  const effectFns = new Set(); //用来存储函数的集合

  const triggerTypeMap = {
    [TriggerOpTypes.SET]: [TrackOpTypes.GET],
    [TriggerOpTypes.ADD]: [
      TrackOpTypes.GET,
      TrackOpTypes.HAS,
      TrackOpTypes.ITERATE,
    ],
    [TriggerOpTypes.DELETE]: [
      TrackOpTypes.GET,
      TrackOpTypes.HAS,
      TrackOpTypes.ITERATE,
    ],
  };

  //循环所有属性，比如 a interate
  for (const key of keys) {
    const typeMap = propMap.get(key); //拿到属性对应的操作, 比如 get
    if (!typeMap) {
      continue; //拿不到这个 操作 就继续
    }

    const trackTypes = triggerTypeMap[type]; //派发操作对应的依赖操作集合

    //对操作集合 比如 get has iterate 进行循环
    for (const trckType of trackTypes) {
      const dep = typeMap.get(trckType); //拿出这个操作类型的函数集合
      if (!dep) {
        continue;
      }
      for (const effectFn of dep) {
        effectFns.add(effectFn); //将函数集合存起来
      }
    }
  }
  return effectFns;
}
```

紧接着就是实现 `trigger` 函数，执行依赖收集里的函数。

```javascript
/**
 * @description: 派发更新
 * @param {* object} target 代理的源对象
 * @param {* stirng} key 属性
 * @param {* stirng} type 写的操作类型
 * @return {*}
 */
export function trigger(target, type, key) {
  const effectFns = getEffectFns(target, type, key);
  for (const effectFn of effectFns) {
    effectFn(); //依次执行函数
  }
}
```

### 补丁

#### 非必要运行

在运行过程中，发现了一些毛病。

```javascript
function fn() {
  console.log("fn");
  if (state.a == 1) {
    state.b;
  } else {
    state.c;
  }
}
effect(fn); //运行函数
state.a = 2;
state.b = 4;
```

- 第一次：运行 `fn`, 打印 fn，收集依赖 `a` 和 `b`。
- 第二次：修改 `a` 的值，运行 `fn`，打印 fn，条件不成立，收集依赖 `a` 和 `c` 。
- 第三次：修改 `b` 的值，运行 `fn`，打印 fn，条件不成立，收集依赖 `a` 、 `b`、 `c` 。

这么一看，好像没啥问题，但是修改了 `a` 的值以后，收集的依赖是 `a` 和 `c`，和 `b` 没有关系。也就是说，修改了 `b` 没必要重新运行 `fn`。

现在回顾一下 `map` 结构图，有个属性 `b` ，有操作类型如 `set`，后面对应一个 `deps` 函数集合，里面有 `fn` 函数。那现在要做的就是把这个 `fn`函数给移除掉。

方案是记录给 `fn` 函数打的标记，记录他在哪个集合，后续在派发更新的时候，删掉这个函数。

```javascript
export function effect(fn) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      clearFn(effectFn); //清除函数所在集合
      return fn();
    } finally {
      activeEffect = null;
    }
  };
  effectFn.deps = []; // 存放函数集合
  effectFn();
}
```

```javascript
// effect.js

// track()
if (!depsSet.has(activeEffect)) {
  depsSet.add(activeEffect);
  activeEffect.deps.push(depsSet); //往属性里添加 函数集合
}
```

```javascript
/**
 * @description: 辅助函数，用来清除 fn 所在集合
 * @param {Function} effectFn fn 函数
 */
export function clearFn(effectFn) {
  const { deps } = effectFn; // 解构出函数集合

  if (!deps.length) {
    return;
  }

  for (const dep of deps) {
    dep.delete(effectFn); //把fn 从dep函数集合里删掉
  }
  deps.length = 0;
}
```

#### 函数嵌套

到此，「重新收集依赖」的 bug 就搞定了，还有存在一个问题 —— 函数嵌套。

```javascript
function fn() {
  console.log("fn");
  effect(() => {
    console.log("inner");
    state.a;
  });
  state.b;
}
effect(fn);
state.b = 4;
```

第一次执行，打印 `fn`，打印 `inner`。修改值之后，应该是会执行 `fn` 的，可是并没有打印 `fn`。

```javascript
export function effect(fn) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      clearFn(effectFn);
      return fn();
    } finally {
      activeEffect = null;
    }
  };
  effectFn.deps = [];
  effectFn();
}
```

如上，`activeEffect` 刚开始是没有的，运行 `fn` 的时候，它被赋值为 `fn` 所在的环境，在这个 `fn` 运行的期间呢，又运行了 「inner」，然后又把「inner」所在的环境赋值给 `activeEffect`，然后「inner」运行结束，`activeEffect` 变为 `null`，这时 `fn` 还没运行完，但是因为 `activeEffect` 是 `null`，这时已经无法触发 `trigger`函数进行派发更新了。

这是执行栈的问题，属于是「先进后出」了。准备一个执行栈

```javascript
//effect.js

...
const effectStack = [];
...

export function effect(fn) {
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(effectFn); //把函数加入栈
      clearFn(effectFn); //清除函数所在集合
      return fn();
    } finally {
      effectStack.pop();//把函数推出
      activeEffect = effectStack[effectStack.length - 1];//取栈顶
    }
  };
  effectFn.deps = []; // 存放函数集合
  effectFn();
}

```

`effect` 嵌套，无限递归会导致栈溢出，因此需要限制递归深度。

```javascript
export function trigger(target, type, key) {
  const effectFns = getEffectFns(target, type, key);
  for (const effectFn of effectFns) {
    if (effectFn === activeEffect) {
      continue;
    }
    effectFn();
  }
}
```

#### 函数执行时机

目前的 `effect` 函数是立即执行的，需要将函数的执行时间交给用户，让用户决定何时执行。

```javascript
//index.js

const effectFn = effect(fn, {
  lazy: true,
});
```

最基本的一个配置。另外 `Vue` 的数据的更新可以理解为 「异步」的，不是数据一变动，直接更新，而是会等所有的数据都变动之后，再一起更新。这个可以避免一些不必要的更新。 在 `Vue` 中，可以通过 `nextTick` 函数拿到立即更新的数据。

现在我们将这个「执行权」交给客户，配置一个调度器，把要执行的函数交给调度器，然后由调度器决定要不要执行。

```javascript
export function effect(fn, optitons) {
  const { lazy = false } = optitons;
  const effectFn = () => {
    try {
      activeEffect = effectFn;
      effectStack.push(effectFn);
      clearFn(effectFn);
      return fn();
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  };
  effectFn.deps = [];
  effectFn.optitons = optitons; //保存配置项

  if (!lazy) {
    effectFn();
  }
  return effectFn;
}
```

```javascript
export function trigger(target, type, key) {
  const effectFns = getEffectFns(target, type, key);
  for (const effectFn of effectFns) {
    if (effectFn === activeEffect) {
      continue;
    }
    //如果有配置 让用户自行决定
    if (effectFn.optitons.scheduler) {
      effectFn.optitons.scheduler(effectFn);
    } else {
      effectFn();
    }
  }
}
```

看看是如何调用的，

```javascript
// index.js

import { reactive } from "./reactive.js";
import { effect } from "./effect.js";
const obj = {
  a: 1,
  b: 2,
};
const state = reactive(obj);

function fn() {
  console.log("fn");
  state.a = state.a + 1;
}
// 运行函数fn1，运行期间用到的所有响应式数据，都会收集为对应关系
let isRun = false;
const effectFn = effect(fn, {
  lazy: true,
  scheduler: (eff) => {
    Promise.resolve().then(() => {
      if (!isRun) {
        isRun = true;
        eff();
      }
    });
  },
});
effectFn();

state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
state.a++;
```

### Ref 的实现

基本上已经实现了响应式的核心功能，但是还差一个 `Ref` 功能。

把 `effect` 里的函数跟 `ref` 关联起来哈。

```javascript
import { reactive } from "./reactive.js";
import { effect } from "./effect.js";
import { ref } from "./ref.js";

const state = ref(1);

effect(() => {
  console.log("effect", state.value);
});
```

`ref` 返回一个对象，对象有个属性是 `value`。当访问这个属性的时候，进行「依赖收集」，当修改属性值的时候，进行「派发更新」。

```javascript
//ref.js

export function ref(value) {
  return {
    get value() {
      track(this, TrackOpTypes.GET, "value");
      return value;
    },
    set(newValue) {
      value = newValue;
      trigger(this, TriggerOpTypes.SET, "value");
    },
  };
}
```

### computed 的实现

`computed` 的基本使用，

```javascript
//index.js

const state = reactive({
  a: 1,
  b: 2,
});

const sum = computed(() => {
  console.log("computed");
  return state.a + state.b;
});

sum.value;
```

`computed` 可以接收一个对象，也可以接收一个函数，因此先对参数进行[参数归一化](/2023/07/10/parameter-normalization)。

```javascript
//computed.js

//参数可能是函数也可能是对象，对参数进行归一化
function normalizeParameter(getterOrOptions) {
  let getter, setter;
  if (typeof getterOrOptions === "function") {
    getter = getterOrOptions;
    setter = () => {
      console.warn(`Computed property was assigned to but it has no setter`);
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return { getter, setter };
}

export function computed(getterOrOptions) {
  const { setter, getter } = normalizeParameter(getterOrOptions);
  effect(getter); //把函数交个 effect
}
```

目前 `computed` 是立即执行，需改修正为访问它的值的时候才执行。

```javascript
export function computed(getterOrOptions) {
  const { setter, getter } = normalizeParameter(getterOrOptions);
  const effceFn = effect(getter, {
    lazy: true,
  });

  const obj = {
    get value() {
      return effceFn();
    },
  };
  return obj;
}
```

`computed` 是具有「缓存」功能的，当它的值没有变化的时候，不会重新执行函数。

```javascript
//index.js
export function computed(getterOrOptions) {
  const { setter, getter } = normalizeParameter(getterOrOptions);

  let value = null;
  let dirty = true;

  const effceFn = effect(getter, {
    lazy: true,
  });

  const obj = {
    get value() {
      //第一次 赋值
      if (dirty) {
        value = effceFn();
        dirty = false;
      }
      return value;
    },
  };
  return obj;
}
```

目前实现了值缓存，但是没有实现「依赖收集」。

```javascript
const sum = computed(() => {
  console.log("computed");
  return state.a + state.b;
});

console.log("sum.value", sum.value);
console.log("sum.value", sum.value);
console.log("sum.value", sum.value);

state.a++;
state.a++;
state.a++;
state.a++;
console.log("sum.value", sum.value);
```

![image.png](/img/vue/post-pic10.png)
`state.a`的值变化后，依赖发生变化，但是值却还是之前的值。因为`dirty`变量变为`false`，不再依赖收集。依赖发生变化后，`dirty`应该变为`true`。

```javascript
const effceFn = effect(getter, {
  lazy: true,
  scheduler: () => {
    dirty = true; // 变为true 进入get 进行依赖收集
    effceFn();
  },
});
```

通过以上修改，`computed` 实现了「依赖收集」。但是观察「打印」，即第一行，没有使用 `computed` 的值，但却运行了函数。因此，需要调整为：依赖发生变化后，只进行标记，说明数据是「脏」的，不需要重新执行函数。

```javascript
const effceFn = effect(getter, {
  lazy: true,
  scheduler: () => {
    dirty = true;
    // effceFn(); 不用运行
  },
});
```

模拟一下在模板中使用，模版最终是编译成`render函数`。

```javascript
function render() {
  console.log("render", sum.value);
}
effect(render);
```

当我们去修改`state.a`的值的时候，并没有重新运行函数。当`state.a` 变化时，要派发更新，但是进入`effceFn`，发现有`scheduler`，那就执行`scheduler`，而`scheduler` 并没有将数据与函数进行关联，所以需要手动地加上「派发更新」。

```javascript
const effceFn = effect(getter, {
  lazy: true,
  scheduler: () => {
    dirty = true;
    trigger(obj, TriggerOpTypes.SET, "value");
  },
});
```

`get` 进行手动进行「依赖收集」

```javascript
 get value() {
      track(obj, TrackOpTypes.GET, "value");
      if (dirty) {
        value = effceFn();
        dirty = false;
      }
      return value;
    },

```

到此，`computed` 就基本实现了。

```javascript
import { effect, track, trigger } from "./effect.js";
import { TrackOpTypes, TriggerOpTypes } from "./operations.js";

function normalizeParameter(getterOrOptions) {
  let getter, setter;
  if (typeof getterOrOptions === "function") {
    getter = getterOrOptions;
    setter = () => {
      console.warn(`Computed property was assigned to but it has no setter.`);
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return { getter, setter };
}

export function computed(getterOrOptions) {
  const { getter, setter } = normalizeParameter(getterOrOptions);
  let value,
    dirty = true;
  const effetcFn = effect(getter, {
    lazy: true,
    scheduler() {
      dirty = true;
      trigger(obj, TriggerOpTypes.SET, "value");
    },
  });
  const obj = {
    get value() {
      track(obj, TrackOpTypes.GET, "value");
      if (dirty) {
        value = effetcFn();
        dirty = false;
      }
      return value;
    },
    set value(newValue) {
      setter(newValue);
    },
  };
  return obj;
}
```
