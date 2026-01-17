---
layout: post
title: "小程序 AI 聊天(2)"
subtitle: "「markdown语法&&流式数据」"
author: "My"
header-img: "img/js/ai-chat.png"
header-mask: 0.4
tags:
  - 小程序
  - AI
  - 流式数据
---

> 前面已经实现了 [ai 聊天页面的布局 与 数据获取](https://my-long.github.io/2025/11/20/miniprogram-ai/)，考虑到一般的数据都是 「markdown」 语法，现在对 ai 数据的展示进行一些优化处理。

## 一、空数据

页面一开始，肯定是没数据的，现在添加个「空数据」页面，算是优化了。

抽离出一个空数据页面，当没有数据时，展示这个页面。

```vue
<template>
  <view class="ai-empty">
    <image class="img" src="@/static/chat.png" mode="widthFix"></image>
    <view class="text">让我们开始聊天吧</view>
  </view>
</template>

<style lang="scss" scoped>
.ai-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  .img {
    width: 450rpx;
  }
  .text {
    font-size: 60rpx;
    margin-top: 50rpx;
    color: #e467b2;
    font-weight: bold;
  }
}
</style>
```

在聊天页面中，引入这个空数据页面并使用。

```vue
<template>
  <!-- 其他代码 -->
  <view class="chat-container">
    <scroll-view
      v-if="chatList.length > 0"
      class="chat-content"
      :scroll-top="scrollTop"
      scroll-y
      :lower-threshold="100"
      @scrolltolower="onScrollToLower"
    >
      <!-- 其他代码 -->
    </scroll-view>
    <ai-empty v-else></ai-empty>
  </view>
  <!-- 其他代码 -->
</template>
```

<img src="/img/post-ai-7.png" width="300" />

## 二、处理 mardown 数据

后端返回的数据大差不差，都是 markdown 语法的字符串。我这边模拟的数据是这样的：

```json
    '{"role": "ai", "delta": "## 岳阳楼记\\n\\n"}',
    '{"role": "ai", "delta": "**庆历四年春**，滕子京谪守巴陵郡。"}',
    '{"role": "ai", "delta": "越明年，政通人和，百废具兴。"}',
    '{"role": "ai", "delta": "乃重修岳阳楼，增其旧制，刻唐贤今人诗赋于其上，属予作文以记之。\\n\\n"}',
```

在小程序端，主要需要进行两个步骤处理这些数据，分别是：

1. 解析 markdown 语法
2. 渲染 markdown 语法

这里需要用到两个插件 `marked` 和 `mp-html` 。

### 1. 解析 markdown 语法

- 安装依赖：

  ```bash
  $ pnpm add marked
  ```

- 引入插件：

  ```js
  import marked from "marked";
  ```

- 解析 markdown 语法

  ```js
  const html = marked(text); // 将 markdown 语法转换为 html 字符串
  ```

### 2. 渲染 markdown 语法

- 安装依赖：

  ```bash
  $ pnpm add mp-html
  ```

- 引入组件：

  ```js
  import mpHtml from "mp-html/dist/uni-app/components/mp-html/mp-html.vue";
  ```

- 渲染 markdown 语法

  ```vue
  <template>
    <view class="ai-sys-text">
      <mp-html :content="html" />
    </view>
  </template>
  ```

### 3. 组件应用

在 `ai-sys-text` 组件中，引入 `mp-html` 和 `marked` 组件并使用。

```js
const typingText = (text) => {
  if (!text) return;
  clearTimeout(timer);
  // 继续从当前位置打字
  const step = () => {
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      htmlContent.value = marked(content.value); // 将 markdown 语法转换为 html 字符串
      timer = setTimeout(step, 20);
    } else {
      // 打字完成后，标记不再需要打字效果
      needTypingEffect.value = false;
    }
  };
  step();
};
```

```vue
<template>
  <view class="ai-sys-text">
    <mp-html :content="htmlContent" />
  </view>
</template>
```

### 4. 样式优化

现在渲染出来的是纯黑文本、且行间距是默认的，不太协调，这里对于一些常用标签就行一些处理。

```js
const style = {
  h1: "line-height:1.5;color:#FE2BC2;margin:30rpx 0",
  h2: "line-height:1.5;color:#ff37c6;margin:30rpx 0",
  h3: "line-height:1.5;color:#ff45ca;margin:20rpx 0",
  h4: "line-height:1.5;color:#ff54ce;margin:15rpx 0",
  h5: "line-height:1.5;color:#ff67d4;margin:15rpx 0",
  ul: "padding-top:10rpx; padding-bottom:10rpx",
  ol: "padding-top:10rpx; padding-bottom:10rpx",
  li: "line-height:1.8;color:#333",
  p: "line-height:1.8;color:#333",
  strong: "color:#FD4E30;",
  hr: "border: none; border-top: 1px solid #EFEFEF; margin: 15px 0;",
};
```

```vue
<template>
  <view class="ai-sys-text">
    <mp-html :tag-style="style" :content="htmlContent" />
  </view>
</template>
```

### 5. 渲染优化

目前已经可以是进行 「markdown」语法的渲染了，但是有些显示的 bug:

> 字符串是循环输出的，然后交给 `marked` 解析成标签，但是在遇到如 「加粗」 这样的格式时（`**加粗**`），会有问题。当接收到前面的 `**` 时，还没有形成有效的 `strong` 标签，因此会在页面上输出 `**` ，当解析到后面的 `**`后，形成闭合，才会将文本加粗。

> 在下个渲染内容是 无序列表或有序列表时，会将前面的内容错误的识别成标题（h1、h2 等），导致突然变大，造成闪动。

以上两个显示 bug 如下：

<video src="/img/post-ai-8.mp4" controls autoplay muted loop width="300"></video>

**基于以上问题，需要对 `marked` 解析出来的 html 字符串进行一些处理，以解决这些显示 bug。**

> 借用强大的 ai，对数据先进行预处理，在交给 `marked` 解析(文件在源代码中)。

```js
import { completeMarkdown } from "@/utils/completeMarkdown";

const typingText = (text) => {
  if (!text) return;
  clearTimeout(timer);
  const step = () => {
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      // 补全未闭合的标记后再渲染
      const completedContent = completeMarkdown(content.value); // 预处理 markdown 字符串
      htmlContent.value = marked(completedContent);
      timer = setTimeout(step, 60);
    } else {
      // 打字完成后，标记不再需要打字效果
      needTypingEffect.value = false;
    }
  };
  step();
};
```

<video src="/img/post-ai-9.mp4" controls autoplay muted loop width="300"></video>

## 三、加载状态

先简单的做一些反馈优化，在发送消息后，等待 ai 回复，期间显示加载状态。

自定义一个 `loading` 组件，用于显示加载状态。

```vue
<template>
  <view class="loading">
    <view class="loading-item"></view>
    <view class="loading-item"></view>
    <view class="loading-item"></view>
    <view class="loading-item"></view>
  </view>
</template>

<style lang="scss" scoped>
.loading {
  display: flex;
  align-items: center;
  width: 700rpx;
  height: 56rpx;
  padding: 0 15rpx;
}

.loading {
  .loading-item {
    border-radius: 50%;
    position: relative;
    width: 30rpx;
    height: 30rpx;
    margin: 0 6rpx;
    animation: loading 800ms infinite;
    &:nth-child(1) {
      background-color: #ec2e8b;
    }
    &:nth-child(2) {
      animation-delay: 100ms;
      background-color: #5dddd8;
    }
    &:nth-child(3) {
      animation-delay: 200ms;
      background-color: #fafafa;
    }
    &:nth-child(4) {
      animation-delay: 300ms;
      background-color: #8bc34a;
    }
    &:nth-child(5) {
      animation-delay: 400ms;
      background-color: #ffeb3b;
    }
  }
}

@keyframes loading {
  0% {
    top: 0;
  }
  25% {
    top: 5rpx;
  }
  50% {
    top: -15rpx;
  }
  75% {
    top: 5rpx;
  }
  100% {
    top: -1rpx;
  }
}
</style>
```

声明一个状态，用于控制是否显示加载状态。

```js
const isWaiting = ref(false); // 是否正在等待(从发送到接收消息)

const sendMessage = (message) => {
  isWaiting.value = true; // 发送消息后，显示加载状态
  //   其他代码
};

// 监听数据返回
if (requestTask.onChunkReceived) {
  requestTask.onChunkReceived(async (res) => {
    isWaiting.value = false; // 接收数据后，隐藏加载状态
    // 其他代码
  });
}
```

```vue
<template>
  <!-- 其他代码 -->
  <view class="chat-list">
    <ai-loading v-if="isWaiting"></ai-loading>
    <view
      class="chat-item"
      v-for="(item, index) in chatList"
      :key="item.id"
      :class="{ user: item.role === 'user', ai: item.role === 'sys' }"
    >
      <ai-user-text v-if="item.role === 'user'" :text="item.delta" />
      <ai-sys-text
        v-if="item.role === 'ai'"
        v-model:is-replying="isReplying"
        :text="item.delta"
        :is-receiving="item.id === currentReceivingId"
      />
    </view>
  </view>
  <!-- 其他代码 -->
</template>
```

## 四、禁用发送（打断）

### 1. 需求分析

这里的需求应该是这样的：

- 当用户点击发送按钮后，发送按钮变成「可打断」状态，此时无法发送消息。
- 当用户点击「打断」按钮后，可打断 ai 的消息回复，然后可重新发送消息。

因此，需要添加一个状态，用于控制是否可打断。

我的设计是：当用户发送消息后，我就默认将发送按钮设置为「可打断」状态。但是这里有个需求上的问题，就是 `打断回复`。

到底是打断「接口的回复」还是「打字机的显示」。因为我原先的设计是前端进行打字显示，所以页面上的内容输出**始终是比接口完成的慢**。而对于聊天记录的保存，我的设计也是在 ai 回复完成后，直接把 ai 回复的内容保存到聊天记录中，所以，「保存记录」是与「打断回复」密切相关的。

### （1） 假设是打断接口的回复

因为打字机始终是比接口输出慢的，所以如果打断的是「接口」，那在视图上其实内容还在输出。比如《静夜思》，在接口输出「举头望明月」后就打断了，但是页面上刚渲染到「疑是地上霜」，因此页面上还会继续输出「举头望明月」，那在用户看来，就会有「我已经打断了，怎么还继续回复的疑惑」

### （2） 假设是打断打字机的显示

同理，打字机始终比接口输出的慢，所以如果打断的是「打字机」，那在某种状态下，接口是已经完成了输出，只是打字机还在继续输出。比如《静夜思》，接口已经完成所有内容的输出，但是打字刚执行到「举头望明月」，此时用户打断内容输出，在用户的直观感受来看，内容确实是已经停止输出了，但是在接口完成的那一刻，已经在该条内容存入了记录。所以，在下次进入聊天界面，获取历史记录的时候，就会发现会输出全部内容，之前的「打断操作」并没有生效。

### 2. 方案思考

**我没有进行真正的打断操作**，只是添加了切换了按钮的状态而已。

如果要真的实现这个功能，基于前面的「前端进行打印」和「前端进行保存记录」，那可以将错就错。

调整一下，不在「接口完成」后保存记录，而是在「打字机完成」后保存记录。

那就是在打字机完成输出后，将已经输出的内容调用接口，保存记录。

此种方法，应该是比其他方案更方便了，因为如果不用「前端进行打印」，那为了实现流畅的打字机效果，那接口就得控制每一个流式数据的大小，保证每一条数据只有 2 个字符左右，才能让内容输出有流畅的效果。反之，如果不处理数据大小，那一条有 10 个字符，一条有 20 个字符，在页面上就会一块一块的显示，太突兀。

### 3. 按钮状态切换

话说回来，我把「发送消息」到 「打字结束」这一过程称为 「消息回复的过程」，用 `isReplying` 来表示。

在 `ai-sys-text` 组件中，双向绑定一个 `is-replying` 变量，用于表示是否正在回复消息。

```js
const isReplying = defineModel("isReplying");

const typingText = (text) => {
  if (!text) return;
  clearTimeout(timer);
  const step = () => {
    isReplying.value = true;
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      const completedContent = completeMarkdown(content.value);
      htmlContent.value = marked(completedContent);
      timer = setTimeout(step, 20);
    } else {
      needTypingEffect.value = false;
      isReplying.value = false;
    }
  };
  step();
};
```

在发送消息后，就将 `isReplying` 设置为 `true`，表示正在回复消息，并传递给 `ai-keyboard`，控制发送按钮的状态。

```js
const sendMessage = (message) => {
  isReplying.value = true; // 表示正在回复消息
  isWaiting.value = true;
  chatMessage.value = message;
  const obj = {
    id: Date.now(),
    role: "user",
    delta: message,
  };
  addMessage(obj);
  onFetch();
};
```

```vue
<template>
  <!-- 其他代码 -->
  <ai-keyboard :is-replying="isReplying" @send="sendMessage" />
</template>
```

在 `ai-keyboard` 组件中，当 `is-replying` 变化为 `true` 时，按钮切换为「打断」状态。

```js
const sendMessage = () => {
  if (props.isReplying) {
    return;
  }
  //   其他代码
};
```

```vue
<template>
  <view class="ai-keyboard">
    <view class="ai-keyboard__input">
      <input
        type="text"
        placeholder="请输入内容"
        v-model="inputValue"
        @confirm="sendMessage"
        placeholder-style="color: #79A5BE;"
      />
      <view class="ai-keyboard__input-send" @click="sendMessage">
        <text class="iconfont icon-tingzhi" v-if="isReplying"></text>
        <text class="iconfont icon-send-s" v-else></text>
      </view>
    </view>
  </view>
</template>
```

## 五、项目效果

<video src="/img/post-ai-10.mp4" controls autoplay muted loop width="300"></video>

可访问 [miniprogram-ai](https://github.com/my-Long/miniProgram-ai) 查看源代码，目前代码在 `dev` 和 `main` 中。
