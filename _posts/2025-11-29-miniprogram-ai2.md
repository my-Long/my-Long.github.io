---
title: "AI Chat in Mini Program (2)"
description: "Continued exploration of AI chat in Mini Program: refining the interaction and handling edge cases."
date: 2025-11-29 00:00:00 +0800
categories: [MiniApp]
tags: [uniapp, ai]
---

[上一篇](https://my-long.github.io/2025/11/20/miniprogram-ai/)把基本布局和数据获取跑通了，但 AI 返回的内容都是 markdown 字符串，直接展示就是一堆 `**加粗**`、`## 标题` 这类符号——要想办法解析渲染出来。

## 先把空数据和加载状态处理了

![post-ai-7.png](/images/post-ai-7.png){: .rounded-10 w='884' h='412' .w-50 .right}

这两件事比较简单，顺手做了。

空数据页面抽成独立组件 `ai-empty`，当 `chatList` 为空时展示：

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

```vue
<template>
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
</template>
```

加载状态也抽了个 `ai-loading` 组件，用弹跳动画表示「等待回复中」。发消息后显示，收到第一条数据后隐藏：

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

```js
const isWaiting = ref(false);

const sendMessage = (message) => {
  isWaiting.value = true;
  // 其他代码
};

if (requestTask.onChunkReceived) {
  requestTask.onChunkReceived(async (res) => {
    isWaiting.value = false;
    // 其他代码
  });
}
```

## markdown 渲染，以及两个绕不过去的 bug

模拟的数据是流式输出的 markdown 片段：

```json
'{"role": "ai", "delta": "## 岳阳楼记\\n\\n"}',
'{"role": "ai", "delta": "**庆历四年春**，滕子京谪守巴陵郡。"}',
'{"role": "ai", "delta": "越明年，政通人和，百废具兴。"}',
'{"role": "ai", "delta": "乃重修岳阳楼，增其旧制，刻唐贤今人诗赋于其上，属予作文以记之。\\n\\n"}',
```

解析用 `marked`，渲染用 `mp-html`，两个依赖一起装：

```bash
pnpm add marked mp-html
```

在 `ai-sys-text` 组件里，打字机每输出一个字符就调一次 `marked` 转成 HTML，塞给 `mp-html` 渲染：

```js
import marked from "marked";
import mpHtml from "mp-html/dist/uni-app/components/mp-html/mp-html.vue";

const typingText = (text) => {
  if (!text) return;
  clearTimeout(timer);
  const step = () => {
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      htmlContent.value = marked(content.value);
      timer = setTimeout(step, 20);
    } else {
      needTypingEffect.value = false;
    }
  };
  step();
};
```

```vue
<template>
  <view class="ai-sys-text">
    <mp-html :tag-style="style" :content="htmlContent" />
  </view>
</template>
```

样式做了简单定制，避免纯黑文本贴着默认行间距太难看：

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

跑起来之后发现两个渲染 bug。第一个是加粗的问题：打字机逐字输出，遇到 `**加粗**` 时，输到第一个 `**` 时 `marked` 还没看到闭合符，就直接把 `**` 显示出来，等后面的 `**` 到了内容才突然变粗。第二个是列表前的内容会被误判成标题：有序/无序列表前面有文字时，`marked` 会把前面那段错误解析成 `h1`、`h2` 之类，字体突然变大再变回来，一闪一闪。

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/post-ai-8.mp4" controls autoplay muted loop width="300"></video>

**两个 bug 都出在「字符串不完整就送去解析」这件事上。** 借助 AI 写了一个 `completeMarkdown` 工具函数，在交给 `marked` 之前先把未闭合的 markdown 标记补全（完整实现在源码里）。打字机改成先预处理再渲染：

```js
import { completeMarkdown } from "@/utils/completeMarkdown";

const typingText = (text) => {
  if (!text) return;
  clearTimeout(timer);
  const step = () => {
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      const completedContent = completeMarkdown(content.value);
      htmlContent.value = marked(completedContent);
      timer = setTimeout(step, 60);
    } else {
      needTypingEffect.value = false;
    }
  };
  step();
};
```

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/post-ai-9.mp4" controls autoplay muted loop width="300"></video>

## 「打断回复」该打断什么

加完打字机之后，想着把「打断」功能也加上——发消息后按钮变成「停止」，点了就打断 AI 的回复。

看起来简单，仔细想不对：**到底是打断接口，还是打断打字机？**

两个不是一回事，因为打字机始终比接口慢。

如果打断的是接口：接口停了，但打字机还在跑。比如《静夜思》，接口被打断在「举头望明月」，但页面刚打到「疑是地上霜」，画面上内容还会继续往下走——用户会懵：「我不是已经打断了吗？」

如果打断的是打字机：又有另一个问题。假如接口已经全部输出完，打字机才跑到一半，用户这时候打断——页面是停了，但如果之前是「接口完成就保存记录」，历史记录里早就存了完整内容。下次进聊天一看，打断没生效。

**这两个方案都有问题，但换个角度，「前端打印」恰好给了一个出路**：不在接口完成时保存记录，改在打字机完成时保存——打断了就保存截止那一刻已经显示的内容，没打断就打字完了再保存。两种情况都对得上用户实际看到的内容。

这是下一篇要实现的部分，这里先把按钮状态切换做了。

从发消息到打字结束这整个过程，用 `isReplying` 来表示。`ai-sys-text` 组件双向绑定它，打字过程中维持 `true`，打字完成置 `false`：

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

发消息时主动置 `true`，把状态传给 `ai-keyboard` 控制按钮显示：

```js
const sendMessage = (message) => {
  isReplying.value = true;
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

`ai-keyboard` 里 `isReplying` 为 `true` 时发送逻辑直接 return，图标切成停止样式：

```js
const sendMessage = () => {
  if (props.isReplying) {
    return;
  }
  // 其他代码
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

目前效果如下，[源代码](https://github.com/my-Long/miniProgram-ai)在 `dev` 和 `main` 分支：

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/post-ai-10.mp4" controls autoplay muted loop width="300"></video>
