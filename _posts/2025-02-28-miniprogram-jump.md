---
layout: post
title: "uniapp 小程序跳转"
subtitle: "uniapp 支付宝小程序之间跳转？"
author: "My"
header-img: img/post-bg-mini.webp
catalog: true
tags:
  - uniapp
  - miniprogram
  - 跳转
---

## 前言

目前遇到这么一个需求，在业务中，需要对接第三方平台的功能，使用他们的插件。在调用他们插件时，需要提供 `userId`，但随着支付宝小程序版本的迭代，新申请的支付宝小程序都默认是返回 `openId`，因此，针对这个问题，有几种不同的方案。

- 方案一： 第三方插件使用 `openId` 进行用户鉴权。

- 方案二： 使用 `userId` 接入第三方插件。 将当前小程序进行降级回退处理，后续都使用 `userId` 进行鉴权。

- 方案三： 使用 `userId` 接入第三方插件。 再申请一个同主体的旧版小程序，在处理业务时，跳到到旧版小程序获取 `userId`，再返回当前下程序进行相关业务处理。

经过多方讨论，决定采用方案二。

## 准备工作

### 1.小程序准备

在支付宝开发平台重新申请一个旧版小程序，并拉入开发人员和配置好域名白名单等信息。

### 2.小程序配置

一些 `uniapp` 项目的基本配置，如 `appid` 等。

#### 1. appId 配置

使用 `HBuilderX` 创建一个 ``项目，并在`manifest.json`文件中配置`appid` 。

#### 2. 自定义运行配置

新增 `package.json` 文件。

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

开发时，在 `HBuilderX` 中，点击 「运行」 就可以看到自定义运行的路径。
![image.png](/img/post-bg-mini-h.png)

#### 3. 简单的 api 环境配置

正常情况下，应该封装一个 `request` 方法，用来处理请求，并根据环境变量配置不同的请求地址。但这里只是为了为了获取 `userId`，因此仅一个接口，就不需要封装了，简单判断一下即可。

```js
// config.js
const enObj = {
  dev: "https://dev.hldian.cn/cloud-user",
  prod: "https://prod.hldian.cn/cloud-user",
};
const env = process.env.ENV_TYPE;
export const apiUrl = enObj[env] || enObj.dev;
```

## 实现

需要从当前小程序（以下称为 A 程序）跳转到旧版小程序（以下称为 B 程序），并获取 `userId`，然后返回到 A 程序进行相关业务处理。

### 1. 跳转到 B 程序

根据[支付宝开发文档](https://opendocs.alipay.com/mini/api/yz6gnx?pathHash=36bd7c7c)提供的 api 进行跳转。因为是【同主体】下的两个小程序，因此不需要再做额外的跳转申请。

```vue
<script setup>

const getUserId = () => {
     my.navigateToMiniProgram({
        appId: "233222111000xxxx",
        success: (res) => {},
  });
}
<script>
```

> 注意： 如果是使用开发者工具进行模拟，那将无法跳转，需要使用【真机调试】。

如果已经真机调试并且跳转了，你会发现，还是无法跳转，错误提示如下：

![image.jpeg](/img/post-mini-error.jpeg)

### 2. 跳转配置与方案

需要同时启动 A 程序和 B 程序。A 程序为了方便后续查看参数，可使用【真机调试】。B 程序使用 【预览】。

在小程序被打开后，点击右上角的胶囊【...】，在弹出来的弹窗中，点击【[联调设置](https://opendocs.alipay.com/mini/api/yz6gnx?pathHash=36bd7c7c)】，把「联调扫码版本」的开关打开。

### 3. B 程序获取 userId 并返回

B 程序在启动时，会触发 `onLoad` 方法，在这里可以获取 `userId`，并调用 [navigateBackMiniProgram](https://opendocs.alipay.com/mini/api/open-miniprogram?pathHash=d0213066) 方法返回 A 程序。

```vue
<script setup>
 const  getCode = ()=> {
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
                extraData: {
                  result: id,
                },
                success: (res) => {
                  console.log("返回 A 小程序成功", res);
                },
              });
            },
          });
        },
      });
    },
<script>
```

### 4. A 程序获取返回值

在[官方文档](https://opendocs.alipay.com/mini/0ebk4g?pathHash=d9dc9fcb)和一些 ai 的回答中，都是说在 `onShow` 的 「options」 中可以获取到返回值，但实际测试发现，并没有获取到。

经过测试发现，还是得调用 `my.getEnterOptionsSync` api 来获取返回值。

```vue
<script setup>
onShow() {
    const options = my.getEnterOptionsSync();
      if (options?.referrerInfo?.extraData) {
      const { result } = options.referrerInfo.extraData;
      // 拿到 userId 进行相关业务处理
    }
}
<script>

```

## 总结

到此，同个主体间的小程序之间的跳转就完成了，比较简单，但是还会有些坑，主要是由信息差异造成的。比如说需要在联调设置中打开开关，获取返回参数需要手动调用 `my.getEnterOptionsSync` 方法。