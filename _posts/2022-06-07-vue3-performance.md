---
layout: post
title: "vue3 性能提升"
subtitle: "vue3 在性能上做了哪些优化？"
author: "My"
header-style: text
tags:
  - Javascript
  - Vue
---

对于 Vue3 的性能提升，涉及到比较多的方面，包括渲染、更新、编译、内存管理等。那就结合官方的介绍与实践，来看看 Vue3 在性能方面的优化。

### 总体优化

- 响应式系统

  Vue 3 使用 Proxy 替代 Vue 2 中的 Object.defineProperty，这使得响应式系统更高效，能更好地追踪依赖。
  进行惰性的计算，只有在需要时才会访问响应式属性，减少不必要的计算和开销

- 更小的包体积

  Vue 3 的体积比 Vue 2 小，尤其是在 tree-shaking 的支持下，未使用的功能可以在构建时被剔除，从而减小最终的包体积

- 快的虚拟 DOM

  虚拟 DOM 渲染算法进行了优化，通过更高效的 diff 算法，提升了组件渲染的速度。

- Teleport 和 Fragments

  Teleport 允许将组件的渲染结果插入到 DOM 的其他位置，提升了灵活性。Fragments 允许组件返回多个根节点，减少了不必要的包裹元素，提高了性能。

- 编译时优化

  Vue 3 对模板进行了编译优化，将一些静态内容在编译时进行分析，减少运行时的计算。

### 编译时优化

Vue 在编译过程，会把模板转换成渲染函数（render function），渲染函数会在每次数据更新时执行，从而更新视图。Vue3 的处理很智能，能区分「静态节点」和「动态节点」。

#### 静态提升

> 静态节点指的是那些不会改变的节点，没有绑定动态属性的节点，比如文本节点、注释节点、元素节点的属性

在 vue2 中是这样创建节点的，不区分「静态节点」和「动态节点」，都在 render 函数中创建。

```js
render(){
  createVNode('h1', null, 'Hello World');
}
```

vue3 会把「静态节点」提升到渲染函数的最前面，这样可以减少运行时计算，提升渲染速度。

```js
const hoisted = createVNode("h1", null, "hello word");
function render() {
  //直接使用
}
```

这就是「静态节点」的提升，另外「静态属性」也是会提升的，

```js
const hoisted = { class: "title" };
function render() {
  createVNode("h1", hoisted, msg);
}
```

在 render 函数中，`class` 不会再被创建，而是直接使用 `hoisted` 中的 `class` 属性。

#### 预字符串化

大多数情况下，单文件组件的模板里，「静态节点」是比「动态节点」还要多的。vue3 的编译器很智能的发现这一点，如果有大量连续的静态元素，他就把这段静态元素编译成一串字符串，即连续的「静态节点」。

```js
const _hoisted = _createStaticVNode( `<div class=\"box\"><ul><li>1</li><li>1</li><li>1</li><li>1</li></ul></div>`;)
```

通过这种方式，可以减少运行时创建节点的开销，提升渲染速度。这在 `ssr` 中的作用是非常明显的。

#### 缓存事件处理函数

比如有这么一个「点击事件」，

```vue
<button @click="Count++">Plus</button>
```

在 vue2 中，每次渲染都会创建一个新的函数，这样会导致性能问题。

```js
render(ctx){
  return createVNode('button',{
    onclick: function($event){
      ctx.count++
    }
  })
}
```

vue3 优化了这一点，他认为函数在渲染过程中是不变的，因此缓存了事件处理函数，这样就不会每次渲染都创建一个新的函数，从而提升性能。

```js
render(ctx,_ceche){
  return createVNode('button',{
    onclick: ceche[0]||(ceche[0] = ($event) => (ctx.count++))
  })
}
```

#### Block Tree

这是为了提升新旧树对比时的效率。vue3 使用了 Block Tree 算法，它将模板转换成一棵树，然后通过树的比较算法，只对变化的部分进行更新，从而提升渲染速度。

比如有这么一个模板，

```vue
<form>
    <div>
      <label>账号</label>
      <input type="text" v-model="user.loginId" />
    </div>
    <div>
      <label>密码</label>
      <input type="text" v-model="user.loginPwd" />
    </div>
  </form>
```

vue2 在对比新旧树的时候，并不知道哪些节点是静态的，哪些是动态的。因此只能一层一层比较，这就浪费了大部分时间在对比「静态节点」上。
![image.png](/img/post-content-tree1.png)

vue3 的编译器就格外强大了，他会对每个节点进行标记，标记出哪些是静态的，哪些是动态的。
![image.png](/img/post-content-tree2.png)

编译器会把所有的「动态节点」提取到根节点form 里。form 节点里有一个数组，记录了后代节点中哪些是动态的。那么在对比的时候，不是整棵树进行对比，而是直接找到根节点，也就是 block 节点。在对比时，循环数组进行对比，即只对比动态节点，越过了静态节点。而树不稳定时，不稳定的那个分支会自动变成一个 block 。

#### patchFlag
vue2 在对比某个节点时，并不知道这个节点哪些相关信息会发生变化，因此只能将所有信息依次比对。

vuu3 觉得在对比某个节点的时候还是在浪费效率，尽管是跳过了所有的静态节点。那在对单个节点对比的时候，就通过这个 patchFlag 来进行优化。它会记录这个节点的属性，样式等信息是不是动态的。有了这个记录，那下次更新的时候，如果属性样式都是静态，那就只比较动态的内容。

