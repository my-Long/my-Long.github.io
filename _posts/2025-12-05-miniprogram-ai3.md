---
title: "AI Chat in Mini Program (3)"
description: "Integrating iFlytek LLM with streaming API response and optimizing the chat interaction experience."
date: 2025-12-05 00:00:00 +0800
categories: [MiniApp]
tags: [uniapp, ai]
---

打字机效果跑得挺好，消息也能发出去，但每次测试都是假数据在那里自演自答——[前端部分的交互](https://my-long.github.io/2025/11/29/miniprogram-ai2/)看起来像那么回事，心里清楚差得远。

想接真实的大模型。先想到调公司内部的接口，但要登录拿 `appName` 和 `sessionId`，麻烦，算了。然后在各大社区转了一圈，好多都要付费，跳过。`Gemini` 免费，文档也齐全，试了一下能拿到数据，但跑起来不稳定，放弃。最后选了 [科大讯飞的 Spark Lite](https://console.xfyun.cn/services/cbm)——实名认证后免费调用，token 无限量。说是大模型，更像个检索机器人，不过接口能跑通就够了。

## 接入讯飞：用 readline 处理流式数据

在 [控制台](https://console.xfyun.cn/services/cbm) 创建应用，拿到 `APIPassword`：

![keda.png](/images/keda-light.png){: .macos .shadow  w='884' h='412' .light }
![keda.png](/images/keda-dark.png){: .macos .shadow  w='884' h='412' .dark }

依赖很简单：`node-fetch` 发请求，`readline` 处理数据流，`dotenv` 读环境变量。环境变量放 `.env`：

```js
URL=https://spark-api-open.xf-yun.com/v1/chat/completions
APIKEY= 你的 APIPassword
PORT=8080
```

用 `node-fetch` 而不是原生 `fetch`，是因为它返回的 `response.body` 是 Node.js 原生的 `Readable`，可以直接丢给 `readline` 按行解析——处理 SSE 数据流就靠这一点：

```js
import fetch from "node-fetch";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const KEY = process.env.GEMINI_API_KEY;
const URL = process.env.URL;

export const chatStream = async (messages, res) => {
  console.log(messages);
  const body = {
    model: "lite",
    user: "",
    messages: [messages],
    stream: true,
  };
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify(body),
  });

  const rl = readline.createInterface({
    input: response.body,
    crlfDelay: Infinity,
  });
  rl.on("line", (line) => {
    line = line.trim();
    if (line.startsWith("data:")) {
      const jsonStr = line.replace(/^data:\s*/, "");
      if (jsonStr === "[DONE]") return;
      try {
        const data = JSON.parse(jsonStr);
        console.log(data.choices[0].delta);
        if (data.choices[0].delta.content) {
          res.write(JSON.stringify(data.choices[0].delta));
        }
      } catch (e) {
        // 忽略解析错误
      }
    }
  });
  rl.on("close", () => {
    console.log("流处理完成");
    res.end();
  });
};
```

每次 `rl.on("line")` 触发，拿到的 `data.choices[0].delta` 长这样：

```js
{ role: 'user', content: '你好啊' }
{ role: 'assistant', content: '你好' }
{ role: 'assistant', content: '！有什么' }
{ role: 'assistant', content: '我可以帮助你的' }
{ role: 'assistant', content: '吗？' }
```

在 `index.js` 里挂路由，把 `messages` 和 `res` 传给 `chatStream` 就行：

```js
import { chatStream } from "./chat.js";

app.post("/api/chat/stream", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages) {
      return res.status(400).json({ error: "message参数必填" });
    }
    await chatStream(messages, res);
  } catch (error) {
    console.error("API错误:", error);
  }
});
```

## 顺手把数据结构对齐了

接入真实接口的同时，把之前的数据格式也改了。原来图方便用的是 `{role:'sys', delta:'你好'}`，跟主流 AI 格式差太远，统一改成 `{role:'assistant', content:'你好'}`。

消息合并逻辑对应调整，核心是判断最新一条消息的 `role`——相同就追加 `content`，不同就新增一条：

```js
const onHandleChunk = (chunk) => {
  const { content, role = "assistant" } = chunk;
  if (typeof content === "string" && !content?.trim()) return;
  const last = chatList.value[0];
  if (last && last.role === role) {
    last.content += content;
  } else {
    chatList.value.unshift({
      content,
      role,
    });
  }
};
```

聊天记录的读取用分页，小程序端传 `page` 和 `pageSize`，server 端读 `messages.json` 做切片：

```js
const result = await getMessage({
  page: pagination.value.page,
  pageSize: pagination.value.pageSize,
  userId: "xx123",
});
```

```js
// chat.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "data", "messages.json");

export const getMessage = async (params, res) => {
  const { page, pageSize } = params;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8")).reverse();
  const total = data.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const list = data.slice(startIndex, endIndex);
  res.json({ list, total, hasMore: endIndex < total });
};
```

## 「打断」比想象中麻烦一点

[上一篇](https://my-long.github.io/2025/11/29/miniprogram-ai2/#%E5%9B%9B%E7%A6%81%E7%94%A8%E5%8F%91%E9%80%81%E6%89%93%E6%96%AD)说要同时打断两件事：打字机动画和接口请求。打断接口相对简单，调一个「中止接口」就行，后端处理。

打断打字机才是真正要想清楚的地方。在 `ai-keyboard` 组件里，用户点「打断」时只抛出 `stop` 事件，不做其他处理：

```js
const emit = defineEmits(["send", "stop"]);
const sendMessage = () => {
  if (props.isReplying) {
    emit("stop");
    return;
  }
  if (!inputValue.value.trim()) {
    uni.showToast({ title: "请输入内容", icon: "none" });
    return;
  }
  emit("send", inputValue.value);
  inputValue.value = "";
};
```

父组件收到 `stop`，只把 `isStop` 标记为 `true`，**不能直接改 `isReplying`**：

```js
const isStop = ref(false);
const onStop = () => {
  isStop.value = true;
  // isReplying.value = false; // ❌ 不能执行
};

requestTask = wx.request({
  // 其他代码...
  complete: () => {
    console.log("请求结束");
    currentReceivingId.value = null;
    isReplying.value = false; // ✅ 在这里修改
  },
});
```

原因是：点了「打断」只是说「我不想看了」，但接口还在跑。如果这时候直接把 `isReplying` 改成 `false`，发送按钮就恢复可用，用户能发新消息——上一条还没结束，下一条又来了，状态就乱掉了。打断接口的响应也有延迟，所以等 `requestTask` 的 `complete` 回调才是最合适的时机。

`ai-sys-text` 组件收到 `isStop` 后，打字机直接退出并把当前内容抛出去：

```js
const emits = defineEmits(["stopSuccess"]);
const typingText = (text) => {
  if (!text) return;
  if (props.isStop) return;

  clearTimeout(timer);
  const step = () => {
    if (props.isStop) {
      emits("stopSuccess", content.value); // 打断时，把当前已渲染内容抛出
      return;
    }
    isReplying.value = true;
    if (typingIndex.value < text.length) {
      content.value = text.slice(0, ++typingIndex.value);
      const completedContent = completeMarkdown(content.value);
      htmlContent.value = marked(completedContent);
      timer = setTimeout(step, 30);
    } else {
      if (!props.isReceiving) {
        needTypingEffect.value = false;
        isReplying.value = false;
        emits("stopSuccess", content.value); // 打字完成，也抛出内容
      }
    }
  };
  step();
};
```

无论是打断还是打字完成，`stopSuccess` 都会触发。父组件在这里保存记录：

```js
const sendMessage = (message) => {
  isReplying.value = true;
  isWaiting.value = true;
  chatMessage.value = message;
  const obj = { id: Date.now(), role: "user", content: message };
  addMessage(obj);
  saveMessage(obj); // 保存用户发送的内容
  onFetch();
};

const onStopSuccess = (text) => {
  const messages = { role: "assistant", content: text };
  saveMessage(messages); // 保存系统回复的内容
};
```

## 键盘上移这个坑

![page.png](/images/page-light.png){: .rounded-10 w='884' h='412' .w-50 .right .light }
![page.png](/images/page-dark.png){: .rounded-10 w='884' h='412' .w-50 .right .dark }

`input` 组件默认 `adjust-position` 为 `true`，键盘弹起时会把整个页面往上推——推出容器，布局就乱了。改成 `false` 呢，键盘直接盖住输入框，也不行。

换个思路：既然键盘会盖住页面底部，那就给 `ai-keyboard` 组件动态加 `padding-bottom`，让内容主动给键盘让位。

监听 `@keyboardheightchange` 拿高度，减掉 `safe-area-inset-bottom` 避免 iPhone 底部双重留白：

```js
const keyboardHeight = ref("");
const onKeyboardheightchange = (e) => {
  const height = e.detail.height ?? 0;
  if (height) {
    keyboardHeight.value = `calc(${height}px - env(safe-area-inset-bottom))`;
  } else {
    keyboardHeight.value = "0px";
  }
};
```

组件模板里把 `padding-bottom` 绑上去，`adjust-position` 设为 `false`：

```vue
<template>
  <view class="ai-keyboard" :style="{ 'padding-bottom': `${keyboardHeight}` }">
    <view class="ai-keyboard__input">
      <input
        type="text"
        :focus="focus"
        placeholder="请输入内容"
        v-model="inputValue"
        @confirm="sendMessage"
        :adjust-position="false"
        @keyboardheightchange="onKeyboardheightchange"
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

打断接口的完整实现见[源代码](https://github.com/my-Long/miniProgram-ai)，效果如下：

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/effect.mp4" controls autoplay muted loop width="300"></video>
