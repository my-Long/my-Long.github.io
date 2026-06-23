---
title: "Data Processing Philosophy and Layered Architecture"
description: "Covers the core ideas behind data processing and the layered warehouse model (ODS, DWD, DWS, ADS), explaining how raw data is progressively cleaned, aggregated, and served as business insights."
date: 2026-06-23 00:00:00 +0800
categories: [Essays]
tags: [data, architecture]
---

在看面试题的时候，突然想到以前一个项目中出现的问题：

后端把 `name` 改成了 `userName`。

我以为改一处就完了，全局搜了一下，十几个文件里都有 `userStore.userInfo.name`。改完又发现有几个地方用了解构，改漏了，测试报错。

这件事让我开始想：**为什么一个字段改名，要动这么多文件？**

不是因为代码量大，是因为数据的消费者太分散——store、页面组件、子组件，每一层都直接读原始字段。任何一个「上游」的改动，都变成了一次全局搜索替换。

这就是「过程式」的数据处理：想到哪写到哪，拿到数据直接用，没有人专门负责把服务端字段翻译成前端语义。

---

**从一条请求说起**

前端拿数据的路径大概是这样：调用接口 → 拿到响应 → 处理/渲染。

接口调用这一段，大多数项目都做了分层。最原始的写法是在组件里直接 axios，再往后是封装一个 `request` 实例，最后演变成现在常见的结构——`utils/request.ts` 处理拦截，`api/` 目录按业务拆分：

```ts
import { request } from "@/utils/request";

export const getList = () =>
  request({
    url: "/list",
    method: "get",
  });
```

有人还会再抽一层 composables，把请求逻辑和响应状态一起封装成 hook：

```ts
import { getList } from "@/api";
import { ref } from "vue";

export const useList = () => {
  const list = ref([]);

  const getListData = () => {
    getList().then((res) => {
      console.log(res);
      list.value = res.data;
    });
  };
  return {
    list,
    getList: getListData,
  };
};
```

```vue
<script setup lang="ts">
import { useList } from "@/hooks/useList";
const { list, getList } = useList();
</script>
```

到这里，「请求分层」基本算做到了。

但数据拿到之后呢？大多数项目是这样：

```js
const res = await fetch("/api/recharge/info");
const data = await res.json();
packages.value = data.data.chargeList.map((item) => {
  return {
    ...item,
    hot: item.hot ?? false,
  };
});
```

处理逻辑和请求逻辑混在一起，或者跟渲染逻辑混在一起。也有人会抽成一个函数：

```js
const processData = (data) => {
  return data.data.chargeList.map((item) => {
    return {
      ...item,
      hot: item.hot ?? false,
    };
  });
};

// 调用处理函数
packages.value = processData(data);
```

这个方向是对的，但停在了「能抽就抽」的层面，还没有形成系统性的分层意识。

---

**问题的核心：谁来负责「翻译」**

用户信息的例子最典型。项目有封装好的 `getUserInfo` 请求，数据存进 Pinia store，各页面直接取：

```vue
<template>
  <div>{{ userStore.userInfo.name }}</div>
</template>

<script setup lang="ts">
import { useUserStore } from "@/store/user";
const userStore = useUserStore();
</script>
```

> 所以，如果服务器下发的 `name` 改为了 `userName` 呢？
> {: .prompt-warning}

要么全局搜 `.name` 挨个改，要么在 store 里加一个映射。两种方法都能跑，但都不对——**改的是 store 或组件，而这件事本来应该只动「数据处理」那一层**。

这就是「只有请求分层，没有数据分层」的副作用：服务端字段直接穿透到了渲染层，中间没有任何人负责翻译和隔离。

---

**数据分层要做什么**

思路无非两个方向：一是在前端项目里专门建一个 transform 层，服务端字段进，前端语义字段出；二是上 BFF，在中间层把这件事做掉，前端只跟 BFF 通信，服务端的改动跟前端彻底解耦。

BFF 的方案更彻底。以一个充值页为例——前端需要展示用户信息和充值套餐，后端是两个独立的服务。BFF 需要聚合这两个接口，把数据按前端的消费方式拼好再吐出来。

借用数据仓库里的 ODS / DWD / DWS / ADS 分层思想来设计这个 BFF，边界会更清晰。

![data-process](/images/data-process-light.webp){: w='3156' h='1812' .w-50 .light}
![data-process](/images/data-process-dark.webp){: w='3156' h='1812' .w-50 .dark}
_前端数据与布局_

在进入分层之前，有些基础设施要先独立出来——config（配置）、logger（日志）、status（状态码）这些跟业务数据无关，但每一层都会用到。

---

**ODS：唯一的网络出口**

ODS 的职责是保留原始数据，不做任何业务加工。对应到 BFF 里，就是 HTTP client 和 repository。

http-client 封装 axios 实例，统一处理拦截、日志、错误映射——它是整个 BFF 里唯一发出网络请求的地方：

```js
const axios = require("axios");
const config = require("../config");
const logger = require("./logger");

const client = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((req) => {
  logger.debug(`→ ${req.method.toUpperCase()} ${req.baseURL}${req.url}`);
  return req;
});

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    logger.error(`HTTP error ${status}: ${msg}`);
    const error = new Error(msg);
    error.statusCode = status || 502;
    return Promise.reject(error);
  },
);

module.exports = client;
```

repository 对应具体的上游服务，`user.repository.js` 只管调 `/user/info`，返回原始字段，不做任何处理：

```js
// user.repository.js
const http = require("../utils/http-client");

const getInfo = async () => {
  const { data } = await http.get("/user/info");
  return data;
};

module.exports = { getInfo };
```

---

**DWD：字段翻译发生在这里**

DWD 是数据清洗和转换层。对应到 BFF 里，就是 transformer——纯函数，无 I/O，按消费方命名。

`name` 改成 `userName` 这件事，以后只要动这一个文件：

```js
// user.transform.js
const formatBalance = (balance) =>
  new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

const toRechargeUser = (raw) => ({
  id: raw.id,
  name: raw.name,
  avatar: raw.avatar + raw.id,
  memberLevel: raw.vip,
  balance: formatBalance(raw.balance),
});

module.exports = { toRechargeUser };
```

`vip` 映射成 `memberLevel`，`balance` 从数值格式化成展示字符串——这些决策都在这里，调用方不需要知道。

---

**DWS：按页面聚合**

DWS 是汇总层。充值页需要用户信息和套餐列表，service 层并行拉两个 repository，分别 transform，合并成一个对象：

```js
//recharge.service.js
const userRepo = require('../repositories/user.repository');
const chargeRepo = require('../repositories/charge.repository');
const { toRechargeUser } = require('../transformers/user.transformer');
const { toRechargeChargeList } = require('../transformers/charge.transformer');

const getRechargeInfo = async () => {
  const [userRaw, chargeRaw] = await Promise.all([
    userRepo.getInfo(),
    chargeRepo.getChargeList(),
  ]);
  return {
    userInfo: toRechargeUser(userRaw),
    chargeList: toRechargeChargeList(chargeRaw),
  };
};

module.exports = { getRechargeInfo };
```

service 层只做数据聚合，不知道 HTTP，不知道路由，不知道响应格式。

---

**ADS：暴露给前端的接口层**

数据准备好了，还需要一个出口。service 不能直接面向前端，中间要经过 controller 和 route。

先定义响应协议，所有接口的输出格式在这里统一：

```js
// response.js
const success = (ctx, data) => {
  ctx.body = {
    code: 0,
    message: "success",
    data,
  };
};
```

controller 调 service，把结果用 `success()` 包一层，错误交给 `next(err)`：

```js
// recharge.controller.js
const rechargeService = require('../services/recharge.service');
const { success } = require('../utils/response');

const getRechargeInfo = async (ctx) => {
  const data = await rechargeService.getRechargeInfo();
  success(ctx, data);
};

module.exports = { getRechargeInfo };
```

route 声明路径，绑定 controller，挂鉴权中间件：

```js
// recharge.routes.js
const Router = require('@koa/router');
const rechargeCtrl = require('../controllers/recharge.controller');
const { auth } = require('../middlewares/auth.middleware');

const router = new Router();

router.get('/info', auth, rechargeCtrl.getRechargeInfo);

module.exports = router;
```

入口文件汇总所有路由，统一挂载前缀 `/recharge`：

```js
// routes/index.js
const Router = require('@koa/router');
const rechargeRoutes = require('./recharge.routes');

const router = new Router({ prefix: '/recharge' });
router.use(rechargeRoutes.routes());

module.exports = router;
```

---

整个链路下来，每一层只知道自己上下游的接口。后端字段改名，改 transformer；聚合逻辑变了，改 service；接口路径变了，改 route。每次改动都有一个明确的落点。

这和「过程式」的区别不在于代码量，在于**每一行代码知道自己属于哪一层，负责哪件事**。那十几个文件的全局替换，本来可以是一处改动。
