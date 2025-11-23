---
layout: post
title: "小程序 AI 聊天"
subtitle: "「小程序别出心裁的更简单的 AI 聊天功能」"
author: "My"
header-style: text
tags:
  - 小程序
  - AI
  - 流式数据
---

> 之前在开发小程序的时候，写了篇笔记 [uniapp - AI 聊天页面布局的实现](https://juejin.cn/post/7527869985344028672)，参杂了些许业务，也说的不全，现在稍微有空了，重新梳理了一些这种聊天方式的心得。

## 一、实现功能&&框架

这是在小程序里实现的，结合之前的经验，在数据请求上，我选择了 `uni.request` 这个 API，并启用 `enableChunked: true,`。为了方便数据请求，启动了本地 nodeJs 服务，对于「历史记录」，使用本地缓存。

这是一个 uniapp 的简单项目，为了使页面美观等，引入了一些「自定义组件」，如头部、底部输入框等。

从总体上来看，要实现的功能就是 ai 聊天，大致有以下几个点：

- 发送消息的时候，消息内容 **自定向上推** 。
- AI 回复的消息是流式输出，并内容也是向上推。
- 历史记录加载的时候不卡顿，能衔接流畅。

## 二、项目结构

我这是新的项目，简单介绍项目结构，如下：

```
├───components
│   ├───ai-keyboard // 底部输入框
│   ├───ai-navbar // 头部
│   ├───ai-user-text // 用户消息
│   └───ai-sys-text // 系统消息
├───pages
│   ├───ai // 聊天页面
│   └───index
├───store // 状态管理
├───hooks // 状态管理
├───serve // 本地服务
├───utils
├───App.vue
├───main.js
├───manifest.json
├───pages.json
└───uni.scss
```

其中 `ai-navbar` 是自定义头部组件，其实用处不大，而 `hooks` 里目前只有一个功能，就是计算头部安全区的距离，用处也不大。`serve` 是为了实现功能而模拟的后端服务，`npm start` 运行在 `http://localhost:3000` 的服务，真实开发时，并不需要这个模块。

## 三、功能实现

整体上包括布局和逻辑两个部分。

### 1. 页面布局

其实就是一个简单的布局，头部、聊天内容区域、底部输入框。

核心还是 `chat-container` 这个聊天容器，对聊天内容进行了反转，然后包含了 `scroll-view`,用于滚动、加载。根据条件，分别渲染 `ai-user-text` 和 `ai-sys-text` 两个消息内容组件。

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

TIP:为什么要反转聊天内容？

> 容器的默认行为是 1. 内容会从上面自然地向下输出 2.上拉加载内容时，内容能流畅的衔接起来。

> 这是由我的需求是 1. 消息向上推出 2. 加载记录时，消息从上面能流畅衔接。 基于此，我才用反转容器的方法来实现。

> 不用这种方法的弊端，后面讲。

现在布局页面如下：

<img src="/img/post-ai-1.png" width="300" />

### 2. 发送&&接收消息

我简单的分为发送消息、接收消息、拼接消息三个部分。 发送消息时，发送消息到后端，并将消息插入到 `chatList` 中。 接收消息时，从后端接收流式数据，并将数据拼接起来，插入到 `chatList` 中。

#### (1). 发送消息

```vue
<ai-keyboard @send="sendMessage" />
```

```js
// 发送消息时，将消息插入到 chatList 中
const addMessage = (messageItem) => {
  chatList.value.unshift(messageItem); // 因为反转了聊天内容，所以要插入到数组的开头
};

// 发送消息
const sendMessage = (message) => {
  chatMessage.value = message;
  const obj = {
    id: Date.now(),
    role: "user",
    delta: message,
  };
  addMessage(obj); // 插入用户消息
  onFetch(); // 发送请求
};
```

#### (2). 接收消息

其实这一块是很简单的，这个只是请求数据而已，有些人把「数据请求」和「数据处理」封装成一个方法，完全是把业务逻辑耦合在一起了，对于我来说，不太喜欢这种方式。 函数编程，我更喜欢抽离各种模块...

在微信小程序中，不支持 `sse` ,但是提供了 `enableChunked: true`, [(详见文档)](https://uniapp.dcloud.net.cn/api/request/request.html#requesttask-values)。

```js
const onFetch = () => {
  console.log("开始请求，API地址:", apiUrl);

  // 创建一个唯一 ID 用于标识这次对话
  const messageId = Date.now();
  currentReceivingId.value = messageId;

  // 先创建一个空的 AI 消息占位
  const aiMessage = {
    id: messageId,
    role: "ai",
    delta: "",
  };
  addMessage(aiMessage);

  const requestTask = wx.request({
    url: `${apiUrl}/chat`,
    method: "POST",
    enableChunked: true, // 启用分块传输
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
      // 请求结束后，清除当前接收状态
      // 但打字机效果会在组件内部继续完成
      currentReceivingId.value = null;
      saveMessage("chatMessages", chatList.value);
    },
  });

  // 监听数据返回
  if (requestTask.onChunkReceived) {
    requestTask.onChunkReceived(async (res) => {
      console.log("收到分块数据:", res);
    });
  }
};
```

如上，完全是一个很简单的请求，只做请求处理。

> currentReceivingId.value 是当前正在接收消息的 ID，用于标识当前正在接收的消息, 区分当前消息和历史消息，为「打字机」效果提供判断依据。

#### (3). 拼接消息

这里需要做一些准备，主要是将后端返回的流式数据拼接起来，输出完整的内容。我这里分为两个过程，一是将 `buffer` 转为 `string`, 二是将内容拼接。

涉及到两个方法，`arrayBufferToString` 和 `processor.value.enqueue` 。以前的业务中，AI 那边不能很好的处理流式数据，存在多条数据“合并”在一起的情况，导致前端显示异常，因此封装了 `processor.value.enqueue` 来处理。 AI 返回的数据可能如下：

```json
 // 1. [{...},{...}]
 // 2. {...}
 // 3. {...},{...}
 // 4. {...}{...}
```

所以，如果你们的 AI 那边能很好的处理流式数据，就不需要封装 `processor.value.enqueue` 了。

> 两个方法，详见源代码

接收到「分块数据」后，就应该处理数据。

```js
// 注册对象
const processor = ref(new ChunkProcessor(onHandleChunk));

// 处理分块数据
const onHandleChunk = (chunk) => {
  const { delta, role = "ai" } = chunk; // 设置默认 role 为 "ai"
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
  console.log(chatList.value);
};

const onFetch = () => {
  // .... 其他代码

  // 监听数据返回
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

到这里，整个流程就已经实现了，能发送消息、接收消息，并把消息拼接起来渲染到页面上。

### 3. 打字机效果

#### (1). 打字机效果实现

在 `ai-sys-text` 组件中，实现打字机效果。

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
    default: false, // 是否正在接收中（需要打字效果）
  },
});

const content = ref("");
let timer = null;
const typingIndex = ref(0);
const needTypingEffect = ref(false); // 标记是否需要打字效果

const typingText = (text) => {
  clearTimeout(timer);
  // 继续从当前位置打字
  const step = () => {
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      timer = setTimeout(step, 30);
    } else {
      // 打字完成后，标记不再需要打字效果
      needTypingEffect.value = false;
    }
  };
  step();
};

const handlerText = (text) => {
  // 历史消息直接显示全部内容
  content.value = text;
  typingIndex.value = text.length;
};

watch(
  () => props.text,
  (newVal) => {
    if (props.isReceiving || needTypingEffect.value) {
      // 正在接收中或需要继续打字效果
      typingText(newVal);
    } else {
      // 历史消息，直接显示
      handlerText(newVal);
    }
  },
  { immediate: true }
);

// 监听 isReceiving 变化
watch(
  () => props.isReceiving,
  (newVal, oldVal) => {
    console.log("isReceiving 变化:", oldVal, "->", newVal);
    if (!newVal && oldVal) {
      // 从接收中变成接收完成，继续保持打字效果直到完成
      needTypingEffect.value = true;
      typingText(props.text);
    } else if (newVal && !oldVal) {
      // 重新开始接收
      needTypingEffect.value = true;
      typingIndex.value = 0;
      typingText(props.text);
    }
  }
);

// 组件卸载时清除定时器
onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
});
</script>
```

对于打字机，目前我有两个观点或者说思路。

- 前端实现

前端拿到拼接的数据后，如上，通过定时器或延时器，制定一个时间间隔，依次显示每个字符，实现打字机效果。不过有个弊端，即这个时间间隔是固定的，那么会出现流式数据已经「请求结束」，触发了 `complate` 方法，但是前端还在「打印」的现象。

- 后端实现

即不处理，后端返回什么，前端直接显示什么。但这种有一种「卡顿」的弊端，如果依次返回的数据是 `你好，`、`这是模拟的`、`数据。`，则在页面上「突现」3 个、5 个、3 个字符，会有一种卡吨的效果。如果能让后端将数据处理成均匀的，即每条流式数据的内容都是差不多且精简的，如只有一到两个字，那才不会出现卡顿的现象。

但是，一般情况下，后端都是调用 AI 模型，只做数据的转发，因此「后端实现」的这种方法，并不太理想。

#### (2). 输出与打字效果预览

<video src="/img/post-ai-2.mp4" controls autoplay muted loop width="300"></video>

### 4. 加载历史消息

使用「页面反转」最重要的一点就是要实现「历史消息」的加载。

因为这里是演示效果，所以我封装了 `mockAPI` 来模拟后端返回数据的过程，包括获取历史消息和保存消息。

#### (1). 保存消息

由于业务和技术的不同，保存消息有不同的方式，这里我简单介绍一下。

比如是由后端进行的，那后端接收到用户发送的消息后，就保存记录，向用户发送消息后，就保存记录，这样就保存了一组 `user/ai` 的消息内容，但就是用户发送失败的消息不回存在记录中。

如果是前端保存，差异也是用户消息这一块，到底是用户一发送消息就调用方法保存记录，还是等待接口响应了再调用方法保存记录。这其实就是业务决定的，这里不搞那么复杂了。

我这里是在 `complate` 方法中保存消息的，即一来一回后才保存消息。

```js
const onFetch = () => {
  // ... 其他代码
  const requestTask = wx.request({
    url: `${apiUrl}/chat`,
    method: "POST",
    enableChunked: true, // 启用分块传输
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
      currentReceivingId.value = null;
      saveMessage("chatMessages", chatList.value); // 保存消息
    },
  });

  // ... 其他代码
};
```

> 注意：这里的 `saveMessage` 方法是我封装的一个方法，用于保存消息到本地存储。

#### (2). 加载历史消息

主要是在 「页面初始化」和「手动加载」 时加载历史消息。

```js
const getMessageList = async (isLoadMore = false) => {
  // 防止重复加载
  if (loading.value) return;

  // 如果是加载更多，检查是否还有更多数据
  if (isLoadMore && !pagination.value.hasMore) {
    console.log("没有更多数据了");
    return;
  }

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
    console.log("result", result.data);

    if (result.code === 200) {
      // 更新分页信息
      pagination.value.total = result.data.total;
      pagination.value.hasMore = result.data.hasMore;

      if (isLoadMore) {
        // 加载更多：追加到列表末尾
        chatList.value.push(...result.data.list);
      } else {
        // 初次加载：替换列表
        chatList.value = result.data.list;
      }
    }
  } catch (error) {
    // 加载失败时回退页码
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

> 注意：由于页面翻转了，所以顶部的加载使用 `onScrollToLower` 方法。

> 注意：这里的 `getMessage` 方法是我封装的一个方法，用于从本地存储获取消息。

> 我的数据结构中，是使用 `hasMore` 来判断是否还有更多数据的。

### 5.整体功能预览

其实到这里，AI 聊天的基本功能已经实现完成了，就跟 第一点 说的那样，实现消息上推，历史消息加载，打字机效果。

<video src="/img/post-ai-3.mp4" controls autoplay muted loop width="700"></video>

## 四、布局分析

在之前的开发中，我也是试错了好几遍，才找到一个比较合适的布局。那为什么使用「翻转」，不使用的弊端是什么？

### 1. 上推

第一种想法应该是「滚动」，即一添加消息，就让页面滚动到最底部，可用[`scroll-into-view`](https://uniapp.dcloud.net.cn/component/scroll-view.html)和[`scroll-top`](https://uniapp.dcloud.net.cn/component/scroll-view.html#scroll-top),那在实操过程中发现， `scroll-top` 的值必须是最大的一个动态值，且在用户消息这点是可以实现上推的，但是在 AI 消息这点，会出现「吞消息」的现象，即有部分消息是在聊天容器之外的，尤其是当「打字机」和「md」语法结合时，这种情况异常明显，会有部分内容被吃掉，上推不自然。

### 2. 下拉

这是历史消息的加载，当上滑到这一页的「最后一条」时，需要加载消息，如果不做处理，直接加载第二页，往数组里插入数据，那这是会「突变」的，第一页的数据直接被下推，所以想法就是「记录」第一页最后一条数据的「位置」，当向数组插入第二页数据时，马上滚动到记录的那个「位置」，这样就不会突变了。

基于此逻辑，在实操过程中，突变到那个「位置」时，页面会闪动一下，无论如何我都无法处理这个闪动，所以并不能很流畅地衔接第一页和第二页之间的数据。

### 3. 初始化

当进入页面获取第一页历史数据时，使用 `scroll-top` 滚动到最后，会出现一个短暂的滚动现象，给人一种「这是滚动过来」的感觉。

### 4. 总结

综上，有这样的差异：

| 功能   | 普通方式                      | 翻转              |
| ------ | ----------------------------- | ----------------- |
| 上推   | ❌ 需要用 id 记录位置，并滚动 | ✅ 不需要做处理   |
| 下拉   | ❌ 会有突变现象               | ✅ 自然衔接       |
| 初始化 | ❌ 会有短暂的滚动现象         | ✅ 直接出现在底部 |

所以，多次试验之后，采用 「翻转」 这种方法，需要做处理的地方，仅仅是数据插入的时候，使用 `unshift` 插入到前面。


当然了，我是基于这三种情况，才采用的「翻转」这种方法。有的业务需求是不需要加载历史记录，或者说历史记录保存在本地，只有几条，并需要加载、分页请求，那这种情况下，处理好一点，还是能用「滚动」的方式去实现视图定位的。
