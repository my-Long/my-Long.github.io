---
title: "「Ant design」 - modal"
subtitle: "Record the basic usage of the modal component"
layout: post
author: "My"
header-style: text
hidden: true
tags:
  - ant design
  - 笔记
---

## Introduction

弹窗是经常使用的组件。结合业务，记录「Modal」作为组件的时候的使用方式。这是最基本的使用方式，直接在组件中使用就可以。

```tsx
import React, { useState } from "react";
import { Modal, Button } from "antd";

const Mymodal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card">
        <Button onClick={() => setIsModalOpen(true)}>打开弹窗</Button>
        <Modal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          title="my modal"
        >
          <p>hello</p>
          <p>hello</p>
        </Modal>
      </div>
    </>
  );
};

export default Mymodal;
```

## Content

从基本用法上看，需要再弹窗里写内容，即直接在组件里写，利用了 `props.children` 属性的特点。

「Modal」能直接在在「父组件」中使用，但是如果当弹窗内容过多，而「父组件」又不仅仅有弹窗时，父组件就会显得很臃肿，变得难以维护。

因此，当有较多的状态需要管理和逻辑需要交互时，我们可以将其封装成一个「容器组件」。

（对于 `Modal` 来说，该组件是「容器组件」， Modal 是 「展示组件」；对于使用该组件的「父组件」来说，该组件是「子组件」 ）

### How to use Child component

将「子组件」导入，并传一个「变量」给它，控制组件显示与隐藏。传一个「方法」，在「子组件」调用的时候，关闭弹窗。

这是在父组件中，最基本的使用。

```tsx
<div className="card">
  <Button onClick={() => setIsModalOpen(true)}>打开弹窗</Button>
  <Mymodal show={isModalOpen} onCancel={() => setIsModalOpen(false)} />
</div>
```

### How to design subcomponents

「子组件」 也是一个简单的函数组件，使用「父组件」传过来的 `props` ，在合适的地方使用就可以了。

```tsx
import React from "react";
import { Modal } from "antd";
const Mymodal = ({ show, onCancel }) => {
  return (
    <>
      <div className="card">
        <Modal open={show} onCancel={onCancel} title="my modal">
          <p>hello</p>
          <p>hello</p>
        </Modal>
      </div>
    </>
  );
};

export default Mymodal;
```

### Type checking

到这里，基本功能是能实现了，但是这是使用 ts 开发，最重要的一点就是要体现 ts 强大的类型标注。从那上面写法来看，`show` 的类型是 「any」，填什么都可以（虽然说在初始化数据的时候会进行类型推断），但是先定义一个变量，肯定是不合理的，因为你不知道给谁用。因此，「我们应该根据 「Mymodal」组件所规定的参数与定义变量。」

#### 参数类型

定义参数接口，

```tsx
interface MyComponentProps {
  show: boolean;
  onCancel: () => void;
}
```

使用参数接口，

```tsx
const Mymodal: React.FC<MyComponentProps> = ({ show, onCancel }) => {
  return (
    <>
      <div className="card">
        <Modal open={show} onCancel={onCancel} title="my modal">
          <p>hello</p>
          <p>hello</p>
        </Modal>
      </div>
    </>
  );
};
```

到此，「子组件」就规定了接收两个参数，这两个参数都是必传的且规定了类型。在「父组件」调用「子组件」的时候，如果没传参数，则会报错。

```tsx
{
  /* 类型“{}”缺少类型“MyComponentProps”中的以下属性: show, onCancel */
}
<Mymodal />;
```

#### 标注方式

组件的类型标注有两种，

React.FC

React.FC（或 React.FunctionComponent）是 TypeScript 中用于定义函数组件的一个类型别名。它提供了一些类型检查和自动补全的功能，能更好地管理组件的 Props 和返回值。

使用 React.FC 的好处包括：

1. 类型检查：自动检查组件的 props 类型，确保传递的 props 类型正确。
2. children 属性：自动包含 children 属性的类型，允许在组件中使用子元素。
3. 返回值类型：确保组件返回的是有效的 React 元素。

```tsx
const Mymodal: React.FC<MyComponentProps> = ({ show, onCancel }) => {
  return (
    <>
      <div className="card">
        <Modal open={show} onCancel={onCancel} title="my modal">
          <p>hello</p>
          <p>hello</p>
        </Modal>
      </div>
    </>
  );
};
```

自定义

```tsx
const Mymodal = ({ show, onCancel }: MyComponentProps): JSX.Element => {
  return (
    <>
      <div className="card">
        <Modal open={show} onCancel={onCancel} title="my modal">
          <p>hello</p>
          <p>hello</p>
        </Modal>
      </div>
    </>
  );
};
```

到此，一个简单的组件应该就算是封装好了，包括了「参数传递」和「事件传递」。

## Optimization

这是父子组件间通信涉及到的一个点 ———— 重新渲染带来的优化问题。如果「子组件」有接收「父组件」传递的参数，那「父组件」在修改 `otherState` 时，将会重新渲染「子组件」。没错，哪怕「子组件」的参数没有任何变化，修改了其他 state ，该组件也会重新渲染。

在「父组件」中有这么一个方法，修改 num 的值，num 在页面上渲染。

```tsx
const changeNum = () => {
  setNum(num++); // 修改 num
};
return (
  <div className="home-page">
    {/* 其他。。。 */}
    <div className="card">
      <Button onClick={changeNum}>改变数字</Button>
    </div>
    <div className="card">
      <Button onClick={() => setIsModalOpen(true)}>打开弹窗</Button>
      <Mymodal show={isModalOpen} onCancel={() => setIsModalOpen(false)} />
    </div>
  </div>
);
```

> setNum(num + 1) 的这种方法虽然可以达到修改 值 的效果，但存在弊端

这种写法直接使用当前的 num 值来计算新的状态。问题在于，React 的状态更新是异步的，这意味着如果在短时间内多次调用 setNum(num + 1);，它可能会使用到相同的 num 值，从而导致状态更新不正确。

```tsx
setNum(num + 1);
setNum(num + 1); // 这两个调用可能都使用相同的 num 值
```

这会导致 num 只增加一次，而不是预期的增加两次。

> setNum(prevNum => prevNum + 1)

这种写法使用了函数式更新，它接受当前状态的值 prevNum 作为参数，并返回新的状态。这确保了即使在多次调用的情况下，setNum 总是使用最新的状态值进行更新。

```tsx
setNum((prevNum) => prevNum + 1);
setNum((prevNum) => prevNum + 1); // 每个调用都使用最新的 prevNum
```

这将确保状态正确增加，预期会增加两次。「在处理依赖于先前状态的更新时，建议使用函数式更新的写法」

ok，当 num 被修改，「父组件」重新渲染时，「Mymodal」也是重新渲染。因此，我们需要保证其他 state 改变时，传给「Mymodal」的 props 在 「父组件」渲染时是保持稳定的。

因此，针对参数类型不为 function 时，「子组件」使用 memo 钩子包住。

```tsx
import React, { memo } from "react";
import { Modal } from "antd";

interface MyComponentProps {
  show: boolean;
  onCancel?: () => void;
}
const Mymodal: React.FC<MyComponentProps> = ({ show, onCancel }) => {
  return (
    <>
      <div className="card">
        <Modal open={show} onCancel={onCancel} title="my modal">
          <p>hello</p>
          <p>hello</p>
        </Modal>
      </div>
    </>
  );
};

export default memo(Mymodal);
```

而对于如果参数类型是 function 的，单靠使用 memo 是不能解决的，还得使用 useCallback 来稳定「回调函数」引用。

```tsx
// 使用 useCallback 来稳定 onCancel 不会在每次渲染时重新创建
const handleCancel = useCallback(() => {
  setIsModalOpen(false);
}, []);
return (
  <div className="home-page">
    <div className="card">
      <Button onClick={changeNum}>改变数字</Button>
    </div>

    <div className="card">
      <Button onClick={() => setIsModalOpen(true)}>打开弹窗</Button>
      <Mymodal show={isModalOpen} onCancel={handleCancel} />
    </div>
  </div>
);
```

## Ask a Question

像这种 memo 、 useCallback 来阻止组件的重新渲染的方式，我觉得出发点是好的。那「怎么去量化优化前后的成果呢」，比如说这个组件重新渲染了，那重新渲染不好的点在哪，是页面卡顿了吗？或者说这个组件的重新然后带来的后果是不是可以忽略不计，这种判定的标准是什么？

如果要求一定要使用，那前后的效果怎么去量化，减少1秒的时间还是2秒，多少秒合适？我觉得这种颗粒度的优化是非常难进行的，太精细了，一方面很难把握标准，另一方面投入的人力物力比较重。那话说回来，每次这种父子组件间的通信，都得使用 memo 、 useCallback 吗？
