---
title: "AI Chat in Mini Program"
description: "Integrating LLM into WeChat Mini Program with a page-flip animation to build an AI chat experience."
date: 2025-11-20 00:00:00 +0800
categories: [MiniApp]
tags: [uniapp,ai]
---

做 AI 聊天页面时，第一个绕不开的问题是「消息怎么往上推」。

最直观的想法是：每次新消息来了，用 `scroll-top` 滚到底部。我也是这么试的，用户消息能正常上推，但 AI 消息不行——尤其是结合打字机效果和 markdown 渲染的时候，会把部分内容「吃掉」，推上去不自然。`scroll-into-view` 也试了，效果也差。

然后是历史消息加载：上拉到顶触发分页，新数据插入数组，页面会突变——第一页内容直接被往下压。「记录当前位置再滚回去」这个思路在实操里怎么做都有一个肉眼可见的闪动，衔接不流畅。还有初始化进页面的时候，用 `scroll-top` 定位到最后一条，会有一段短暂的滚动动画，一进来就能感觉到页面在动。

这三个问题加在一起，「靠滚动定位」这套思路在这个场景下走不通。

后来换了个思路：**把整个聊天容器翻转（`rotateX(180deg)`）**。

容器翻转之后，视觉上「底部」变成了渲染上的「顶部」，新消息 `unshift` 到数组头部，自然就出现在页面底部，不需要任何滚动处理。上拉加载历史消息时，`push` 到数组尾部，在翻转后的视图里刚好是往上插入，内容从哪条延续就从哪里自然衔接，不会突变。初始化时也不需要定位，第一页数据渲染出来直接就在底部。

| 问题 | 滚动方式 | 翻转方式 |
| ------ | ----------------------------- | ----------------- |
| 上推 | 需要 id 记录位置再滚动，打字机场景容易吃内容 | 不需要处理，自然上推 |
| 历史加载 | 插入数据会突变，闪动无法消除 | 自然衔接 |
| 初始化 | 有短暂滚动动画 | 直接出现在底部 |

代价就是：数组操作全改成 `unshift`，历史消息加载时从 `push` 追加到末尾。仅此而已。

## 项目结构

这是一个 uniapp 项目，主要用到以下几个自定义组件：

```
├───components
│   ├───ai-keyboard // 底部输入框
│   ├───ai-navbar // 头部
│   ├───ai-user-text // 用户消息
│   └───ai-sys-text // 系统消息
├───pages
│   ├───ai // 聊天页面
│   └───index
├───store
├───hooks
├───server // 本地 node 服务，模拟后端
├───utils
```

`server` 是为了跑通流程临时起的本地 Node.js 服务，真实开发时不需要这个模块。数据请求用 `uni.request`，启用 `enableChunked: true`，历史记录用本地缓存。

## 页面布局

整体是头部、聊天内容区、底部输入框三段式。核心是 `chat-container` 里的 `scroll-view`——容器、`scroll-view`、`chat-item` 都做了 `rotateX(180deg)` 翻转，这样子元素的内容显示方向才能正确：

```vue
<template>
  <view class="container">
    <ai-navbar title="AI聊天"> </ai-navbar>
    <view class="chat-container">
      <scroll-view
        class="chat-content"
        scroll-y
        :lower-threshold="100"
        @scrolltolower="onScrollToLower"
      >
        <view class="chat-list">
          <view
            class="chat-item"
            v-for="(item, index) in chatList"
            :key="item.id"
            :class="{ user: item.role === 'user', ai: item.role === 'sys' }"
          >
            <ai-user-text v-if="item.role === 'user'" :text="item.delta" />
            <ai-sys-text
              v-if="item.role === 'ai'"
              :text="item.delta"
              :is-receiving="item.id === currentReceivingId"
            />
          </view>
        </view>
      </scroll-view>
    </view>
    <ai-keyboard @send="sendMessage" />
  </view>
</template>

<style lang="scss" scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #f07e88 0%, #d6ebfb 61.76%, #fff 100%);
  padding-bottom: env(safe-area-inset-bottom);

  .chat-item {
    width: 700rpx;
    transform: rotateX(180deg);
    &.user {
      display: flex;
      justify-content: flex-end;
    }
    &.ai {
      display: flex;
      justify-content: flex-start;
    }
  }
  .loading-tip {
    width: 100%;
    padding: 20rpx 0;
    display: flex;
    justify-content: center;
    align-items: center;
    transform: rotateX(180deg);
    .loading-text {
      font-size: 24rpx;
      color: #999;
    }
  }
  .chat-container {
    flex: 1;
    overflow: hidden;
    .chat-content {
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
      height: 100%;
      overflow-y: auto;
      transform: rotateX(180deg);
      .chat-list {
        width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        gap: 20rpx;
      }
    }
  }
}
</style>
```

布局完成后的效果：

![post-ai-1.png](/images/post-ai-1.png){: .shadow .rounded-10 w='884' h='412' .w-50 }

## 发送消息和接收流式数据

发送时把用户消息 `unshift` 到数组头部（翻转后等于追加到「底部」），然后发请求：

```js
const addMessage = (messageItem) => {
  chatList.value.unshift(messageItem);
};

const sendMessage = (message) => {
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

微信小程序不支持 SSE，但提供了 `enableChunked: true`，[详见文档](https://uniapp.dcloud.net.cn/api/request/request.html#requesttask-values)。先给 AI 回复创建一个空的占位消息，再通过 `onChunkReceived` 监听流式数据填进来。`currentReceivingId` 标识当前正在接收的那条消息，打字机组件靠它区分「需要逐字输出」和「历史消息直接显示」：

```js
const onFetch = () => {
  const messageId = Date.now();
  currentReceivingId.value = messageId;

  const aiMessage = {
    id: messageId,
    role: "ai",
    delta: "",
  };
  addMessage(aiMessage);

  const requestTask = wx.request({
    url: `${apiUrl}/chat`,
    method: "POST",
    enableChunked: true,
    data: {
      message: chatMessage.value,
    },
    success: (res) => {
      console.log("✅ 请求完成", res);
    },
    fail: (err) => {
      console.error("❌ 请求失败", err);
    },
    complete: () => {
      console.log("⭕ 请求结束");
      currentReceivingId.value = null;
      saveMessage("chatMessages", chatList.value);
    },
  });

  if (requestTask.onChunkReceived) {
    requestTask.onChunkReceived(async (res) => {
      try {
        const text = await arrayBufferToString(res.data);
        await processor.value.enqueue(text);
      } catch (error) {
        console.error("❌ 解析失败", error);
      }
    });
  }
};
```

流式数据到前端后需要拼接处理。实际项目里碰到过多条数据「合并」在一起传来的情况，所以封装了 `ChunkProcessor` 处理。AI 返回的 chunk 可能是这几种格式：

```json
// 1. [{...},{...}]
// 2. {...}
// 3. {...},{...}
// 4. {...}{...}
```

如果对接的 AI 能保证格式规范，这层处理可以省掉。拼接好之后，同 `role` 的内容追加到最新一条消息，不同 `role` 则新建一条：

```js
const processor = ref(new ChunkProcessor(onHandleChunk));

const onHandleChunk = (chunk) => {
  const { delta, role = "ai" } = chunk;
  if (typeof delta === "string" && !delta?.trim()) return;
  const last = chatList.value[0];
  if (last && last.role === role) {
    last.delta += delta;
  } else {
    chatList.value.unshift({
      delta,
      role,
    });
  }
};
```

## 打字机效果

后端直接推内容、前端原样显示，看起来是最省事的做法。但实际跑起来会发现：每条流式数据的字符数不均匀，一次来十几个字，页面上就一块一块地「突现」，很突兀。除非后端能控制每条数据只有一两个字，才不会出现这个效果——一般 AI 接口只做数据转发，不处理这个粒度，所以这条路走不通。

**前端打字**就是我选的方案：拿到拼接好的内容之后，用 `setTimeout` 每隔固定时间输出一个字符。弊端是接口可能已经全部返回完了，但前端还在慢慢「打」，这段时间差需要用 `isReceiving` 区分「正在接收数据」和「接口结束、打字机还在跑」两种状态：

```js
<script setup>
import { ref, watch, onBeforeUnmount } from "vue";

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  isReceiving: {
    type: Boolean,
    default: false,
  },
});

const content = ref("");
let timer = null;
const typingIndex = ref(0);
const needTypingEffect = ref(false);

const typingText = (text) => {
  clearTimeout(timer);
  const step = () => {
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      timer = setTimeout(step, 30);
    } else {
      needTypingEffect.value = false;
    }
  };
  step();
};

const handlerText = (text) => {
  content.value = text;
  typingIndex.value = text.length;
};

watch(
  () => props.text,
  (newVal) => {
    if (props.isReceiving || needTypingEffect.value) {
      typingText(newVal);
    } else {
      handlerText(newVal);
    }
  },
  { immediate: true }
);

watch(
  () => props.isReceiving,
  (newVal, oldVal) => {
    if (!newVal && oldVal) {
      // 接口结束，但打字机继续跑完
      needTypingEffect.value = true;
      typingText(props.text);
    } else if (newVal && !oldVal) {
      needTypingEffect.value = true;
      typingIndex.value = 0;
      typingText(props.text);
    }
  }
);

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
});
</script>
```

效果如下：

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/post-ai-2.mp4" controls autoplay muted loop width="300"></video>

## 历史消息加载

保存时机选在 `complete` 回调里，一来一回都结束之后再保存。前端保存还是后端保存、用户消息是发送时保存还是响应后保存，这些是业务决定的，这里不展开。

加载分初始化和上拉两种情况。翻转之后，滚动到「顶部」对应的是 `onScrollToLower`，这点要注意：

```js
const getMessageList = async (isLoadMore = false) => {
  if (loading.value) return;
  if (isLoadMore && !pagination.value.hasMore) return;

  try {
    if (isLoadMore) {
      pagination.value.page += 1;
    } else {
      loading.value = true;
      pagination.value.page = 1;
    }

    const result = await getMessage("chatMessages", {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    });

    if (result.code === 200) {
      pagination.value.total = result.data.total;
      pagination.value.hasMore = result.data.hasMore;

      if (isLoadMore) {
        chatList.value.push(...result.data.list);
      } else {
        chatList.value = result.data.list;
      }
    }
  } catch (error) {
    if (isLoadMore) {
      pagination.value.page -= 1;
    }
  } finally {
    loading.value = false;
  }
};

const onScrollToLower = () => {
  getMessageList(true);
};

onLoad(() => {
  getMessageList();
});
```

基本功能到这里完整了：

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/post-ai-3.mp4" controls autoplay muted loop width="700"></video>

## 几个值得继续做的地方

**复制消息**是其中难点最多的一个。长按弹出复制按钮，弹窗的定位要处理三种情况：消息被顶部截断时弹窗要在消息内部靠上，消息较短时弹窗要在消息上方或下方，消息较长且点击位置在中间时弹窗要悬在内部。

![post-ai-4.png](/images/post-ai-4.png){: .shadow .rounded-10 w='884' h='412' .w-50 }
_弹窗在消息内部顶部_

![post-ai-5.png](/images/post-ai-5.png){: .shadow .rounded-10 w='884' h='412' .w-50 }
_弹窗在消息底部_

![post-ai-6.png](/images/post-ai-6.png){: .shadow .rounded-10 w='884' h='412' .w-50 }
_弹窗在消息内部_

**禁用发送**：AI 还没回复时禁用发送按钮，否则可能出现多条 AI 消息几乎同时在跑的情况。

**重新生成**：给最后一条 AI 消息加「重新生成」入口。重新发送的消息不要插入消息数组，也不要写入历史记录；两次生成的内容是都展示还是只展示最新的，需要提前定好。

源代码在 [miniprogram-ai](https://github.com/my-Long/miniProgram-ai)，有兴趣可以下载看看。
