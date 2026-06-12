---
title: "Cross Mini Program Navigation"
description: "How to navigate between different mini programs and pass user identity data during the handoff."
date: 2025-02-28 00:00:00 +0800
categories: [MiniApp]
tags: [uniapp]
---

需求是这样的：对接第三方插件，插件用 `userId` 鉴权，但我们的支付宝小程序是新版本，只能拿到 `openId`。

讨论了几轮，最后决定：再申请一个同主体的旧版支付宝小程序（以下叫 B 程序），从当前小程序（A 程序）跳过去，B 程序拿到 `userId` 之后再跳回来，A 程序继续处理后续业务。绕了一圈，但比其他方案的改动代价小，能接受。

## setup

B 程序用 `HBuilderX` 新建，在 `manifest.json` 里配 `appId`。环境变量走 `package.json`：

```json
{
  "uni-app": {
    "scripts": {
      "dev": {
        "title": "租车-开发环境",
        "env": {
          "ENV_TYPE": "dev",
          "UNI_PLATFORM": "mp-alipay"
        }
      },
      "prod": {
        "title": "租车-生产环境",
        "env": {
          "ENV_TYPE": "prod",
          "UNI_PLATFORM": "mp-alipay"
        }
      }
    }
  }
}
```

配好之后，在 `HBuilderX` 的「运行」菜单里就能看到自定义的路径：

![post-bg-mini-h.png](/images/post-bg-mini-h-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![post-bg-mini-h.png](/images/post-bg-mini-h-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

B 程序只有一个接口——用 `authCode` 换 `userId`——没必要封装 request，简单判断一下环境就行：

```js
const enObj = {
  dev: "https://dev.hldian.cn/cloud-user",
  prod: "https://prod.hldian.cn/cloud-user",
};
const env = process.env.ENV_TYPE;
export const apiUrl = enObj[env] || enObj.dev;
```

## 跳转

A 程序用支付宝的 `my.navigateToMiniProgram` api 跳到 B 程序：

```vue
<script setup>
const getUserId = () => {
  my.navigateToMiniProgram({
    appId: "233222111000xxxx",
    success: (res) => {},
  });
};
</script>
```

> 开发者工具里模拟不了跨程序跳转，必须用**真机调试**。
{: .prompt-danger}

第一次真机调试，直接报错：

![错误](/images/post-mini-error-light.png){: .shadow .rounded-10 w='1167' h='1607' .w-50 .light }
![错误](/images/post-mini-error-dark.png){: .shadow .rounded-10 w='1167' h='1607' .w-50 .dark }

原因是漏了一个容易忽略的 setup：需要同时打开 A 和 B 两个程序，在各自右上角胶囊的「联调设置」里把开关打开，才能跳转。A 程序用真机调试，B 程序用预览。

跳过去之后，B 程序在 `onLoad` 里拿 `authCode`，请求接口换 `userId`，再通过 `my.navigateBackMiniProgram` 带数据跳回来：

```vue
<script setup>
const getCode = () => {
  my.getAuthCode({
    scopes: "auth_user",
    success: (res) => {
      const authCode = res.authCode;
      uni.request({
        url: apiUrl + "/yourapi/apli?authCode=" + authCode,
        method: "POST",
        success: (res) => {
          const id = res.data.result;
          my.navigateBackMiniProgram({
            extraData: { result: id },
            success: (res) => {
              console.log("返回 A 小程序成功", res);
            },
          });
        },
      });
    },
  });
};
</script>
```

## 拿返回值，有个坑

A 程序在 `onShow` 里接收返回值。官方文档和 AI 的回答都是说在 `onShow` 的 `options` 参数里能拿到，但实际测试拿不到，`options` 是空的。

翻了一圈，最后用 `my.getEnterOptionsSync` 才拿到：

```vue
<script setup>
onShow() {
  const options = my.getEnterOptionsSync();
  if (options?.referrerInfo?.extraData) {
    const { result } = options.referrerInfo.extraData;
    // 拿到 userId，继续处理
  }
}
</script>
```

整个流程在 iOS 上跑通了，挺顺的。

## Android 一直跑不通

切到 Android 测，跳转失败，报错和之前一样。查了社区、问了 AI、翻了官方文档，唯一稍微可信的说法是「需要发布体验版」。把 A、B 都发成体验版之后，iOS 还是正常，Android 还是不行。

多次测试下来，发现有一种奇怪的操作顺序可以让它跑通：

- 打开 B 程序体验版，打开联调设置。
- 从 A 程序跳——失败。
- 打开 B 程序开发版做真机预览，打开联调设置。
- 从 A 程序跳——失败。
- 把 B 程序开发版的联调设置关掉，清除缓存。打开 B 程序体验版，打开联调设置。
- 从 A 程序跳——成功。

为什么必须是这个顺序，我也不知道。感觉核心点是「先进过开发版，再进体验版」，但这说不通，也没法给别人解释。目前这个问题还悬着。
