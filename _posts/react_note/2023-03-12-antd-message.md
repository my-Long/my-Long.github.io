---
title: "「Ant design」 - message"
subtitle: "Record the basic usage of the message component"
layout: post
author: "My"
header-style: text
hidden: true
tags:
  - ant design
  - 笔记
---

## Introduction

对于消息「成功」「失败」的提示，`message` 组件使用起来非常方便。它的使用方法有「静态方法」和「Hooks 调用」两种方法。这里记录的是「Hooks 调用」，因为「静态方法」无法消费 Context。而我也是更加青睐于 react hooks 。

## Content

对于 `message`、`notification` 和 `Modal` 的使用，在 `5.1.0` (2022-12)增加了 App 包裹组件的 的方式。而传统的方式是使用 `contextHolder`。我分别记录了这个两种方式的基本使用。

### ContextHolder

通过 [message.useMessage](https://ant.design/components/message-cn) 创建支持读取 context 的 contextHolder。

> - contextHolder 允许你将消息显示与 React 的渲染过程更好地结合，并且解决了 React 并发模式或服务器端渲染（SSR）时一些常见的问题。
> - contextHolder 常用于需要在 React 组件中灵活控制消息显示的场景，而不需要将消息组件挂载到全局的顶层组件外。
> - 通过 contextHolder，你可以在局部组件中调用消息方法而不会打破 React 的渲染规则，尤其是和 React 18 并发模式相兼容。
> - 它是一个实际的 DOM 元素，可以确保所有弹出的消息在当前组件的上下文中被挂载和显示。这样做不仅解决了在并发模式下调用副作用函数的问题，还避免了与全局挂载消息的冲突。

```tsx
// MyComponent.tsx

import { Button, message } from "antd";

const MyComponent = () => {
  const [messageApi, contextHolder] = message.useMessage(); // 创建 contextHolder
  const showMessage = () => {
    messageApi.open({
      type: "success",
      content: "messageApi.open",
    });
  };
  return (
    <>
      <div className="mypage">
        {contextHolder /** 使用 contextHolder 以实现 message 的 context */}
        <div className="card">
          <Button type="primary" onClick={showMessage}>
            open message
          </Button>
        </div>
      </div>
    </>
  );
};
export default MyComponent;
```

如果没有在 `return`中 使用 `contextHolder` ，则控制台会报错 「Warning: [antd: Message] You are calling notice in render which will break in React 18 concurrent mode. Please trigger in effect instead.」

> 有同学说 `contextHolder` 在 `return` 中的不同位置会影响效果，大家可以试试

### App

通过使用 [`App` 包裹组件](https://ant.design/components/app-cn)，可以解决 `contextHolder` 在 `18` 并发模式下无法使用的问题，并且简化了 useMessage 等方法需要手动植入 contextHolder 的问题。

使用 `<App></App>` 包裹页面的组件，即可使用。

```tsx
// MyComponent.tsx

import { Button, App } from "antd";

const MyComponent = () => {
  const { message } = App.useApp(); //导入 message
  const showMessage = () => {
    message.open({
      type: "success",
      content: "messageApi.open",
    });
  };
  return (
    <>
      <div className="mypage">
        <div className="card">
          <Button type="primary" onClick={showMessage}>
            open message
          </Button>
        </div>
      </div>
    </>
  );
};
export default () => (
  <App>
    <MyComponent />
  </App>
);
```

如我们需要让 `message` 只弹一次，可以在 App 上对 [message](https://ant.design/components/message-cn#messageconfig) 进行配置。

>ps: 解析不出双花括号。 就是传一个对象，属性 maxCount:1

```tsx
export default () => (
  <App message={{ maxCount: 1 }}>
    <MyComponent />
  </App>
);
```

### API 

`messageApi` 提供很多 [API](https://ant.design/components/message-cn#api)，如「info」、「success」和「open」等，可以根据需要来使用，ts 的内置方便了我们开发，只需要写 `.` 就会有其所有属性提示。
