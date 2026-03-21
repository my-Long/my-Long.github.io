---
layout: post
title: "web 国际化语言配置"
subtitle: "vue开发中国际化的一些方法"
author: "My"
header-img: img/post-bg-mini.webp
catalog: true
tags:
  - web
  - vue
  - i18n
---

## 一、国际化

其实，我们平常说的 「国际化」配置，也就是语言配置而已，不包括地区的宗教信仰、生活习惯等等。而语言配置，一般都是结合文件，使用变量替换的方式实现的，我相信很多人也都做过 「国际化」，都有一定的经验。

## 二、切换方案

目前，我所了解到的方案有以下三种：

- 本地缓存：

  点击「切换」按钮后，将当前的语言，如 `en` 缓存到本地，下次打开页面时，直接读取缓存的语言。

- 基于 域名：

  这是一些大的网站使用的方式，就是有多个语言的域名，如 `cn.example.com`、`en.example.com`。当用户访问 `cn.example.com` 时，默认显示中文，访问 `en.example.com` 时，默认显示英文。

- 基于 路由

  这种方式，就是在路由中，根据当前的语言，动态的加载对应的语言包。比如，当用户访问 `example.com/cn` 时，加载中文语言包，访问 `example.com/en` 时，加载英文语言包。

经过考虑，我觉得「基于路由」这样方式更好，这种方式的好处是，不需要在本地缓存语言，也不需要在域名上做特殊处理，只需要在路由中做好配置即可。

## 实现

基于路由的实现，需要用到 `vue-router` 和 `vue-i18n` 两个库。

### i18n 配置

首先，我们需要在 `src` 下创建 `lang` 目录。

```
src
├── lang
│   ├── en.json
│   ├── cn.json
│   └── index.ts
```

在 `index.ts` 中创建 `vue-i18n` , 并配置好语言包。获取路由的语言标识，作为默认语言。

```ts
import { createI18n } from "vue-i18n";
import cn from "./cn.json";
import en from "./en.json";

const messages = {
  en: {
    ...en,
  },
  cn: {
    ...cn,
  },
};
const getLang = () => {
  const lang =
    location.pathname.split("/")[1] || navigator.language.split("-")[0] || "en"; // 获取路由的语言标识，作为默认语言
  if (lang == "zh") {
    return "cn";
  }
  return lang;
};

const i18n = createI18n({
  legacy: false,
  locale: getLang(), // 默认语言
  messages,
});

export default i18n;
```

在 `main.ts` 中，导入 `i18n` 并挂载到 `Vue` 实例上。

```ts
import i18n from "./lang";

app.use(i18n);
```

### 路由配置

在 `router` 目录下，创建 `index.ts` 文件，配置路由。

默认情况下，通过 `/home` 就能访问首页，但是现在路由加了「前缀」，所以就不能什么都不配置，就如 `router.push("/home")` 一样直接跳转。

- 处理路由表

  通过 `/:lang(en|cn)/` 来匹配语言标识，并将其作为 `params` 传递给各个组件。

  ```ts
  // router/index.ts
  import i18n from "@/lang";
  const routes = [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/:lang(en|cn)/",
      component: () => import("@/layout/index.vue"),
      children: [
        {
          path: "home",
          name: "home",
          component: () => import("@/views/home/index.vue"),
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/profile/index.vue"),
        },
      ],
    },
  ];
  ```

- 路由守卫

  要跳转到某个页面，使用 `path` 必须写完整路径，因此每次跳转都得带上语言标识，如 `router.push("/en/home")`。首先还要获取到当前语言，再拼接路径，最后跳转，这是非常麻烦的，因此我们可以用 `beforeEach` 路由守卫来处理。

  ```ts
  // router/index.ts
  router.beforeEach((to, from, next) => {
    const lang = i18n.global.locale.value;
    const path = to.path;

    // 检查路由是否包含语言前缀，如果没有，则添加
    if (!path.startsWith(`/${lang}`)) {
      next({ path: `/${lang}${path}` }); // 添加当前语言前缀并跳转
      console.log(`Redirected to: /${lang}${path}`);
    } else {
      next(); // 否则直接跳转
    }
  });
  ```

### 语言切换组件

在 `components` 目录下，创建 `LanguageSwitch.vue` 文件，实现语言切换功能。

使用 `a-dropdown` 组件结合 自定义图标 实现该组件，结构部分如下：

```vue
<template>
  <a-dropdown>
    <IconFont type="h-guojihua" />
    <template #overlay>
      <a-menu @click="onLangChange">
        <a-menu-item key="cn" v-if="locale == 'en'"> 简体中文 </a-menu-item>
        <a-menu-item key="en" v-if="locale == 'cn'"> English </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>
```

在 `script` 部分，我们需要获取到 `i18n` 实例，并监听 `locale` 变化，根据当前语言显示不同的文字，并刷新路由。

```ts
onMounted(() => {
  checked.value = locale.value === "en";
  setRoute(locale.value);
});
```

切换语言的时候，我们需要修改 `locale` 值，并刷新路由。

```ts
const onLangChange = (value: any) => {
  const lang = value.key;
  locale.value = lang;
  setRoute(lang);
};
```

全部的代码如下：

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { createFromIconfontCN } from "@ant-design/icons-vue";

const IconFont = createFromIconfontCN({
  scriptUrl: "//at.alicdn.com/t/c/font_4843082_t8jko617iv.js",
});
const route = useRoute();
const router = useRouter();
const { locale } = useI18n();

const checked = ref(false);
const onLangChange = (value: any) => {
  const lang = value.key;
  locale.value = lang;
  setRoute(lang);
};
const setRoute = (lang: string) => {
  router.push(`/${lang}${route.path.slice(3)}`); // 刷新路由
};
onMounted(() => {
  setRoute(locale.value);
  checked.value = locale.value === "en";
});
</script>
<template>
  <a-dropdown>
    <IconFont type="h-guojihua" />
    <template #overlay>
      <a-menu @click="onLangChange">
        <a-menu-item key="cn" v-if="locale == 'en'"> 简体中文 </a-menu-item>
        <a-menu-item key="en" v-if="locale == 'cn'"> English </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>
```

> 到此，我们完成了基于路由的国际化方案，正常的路由跳转，刷新页面都没有问题。

## 效率

这里涉及大一个语言配置的问题，接触到的一些古老的项目，使用 `js` 文件来存储语言配置，且对于语言配置是这样的:

```js
// en.js
export default {
  h: {
    'h-t':'Home'
  },
  ...
}

// cn.js
export default {
  h: {
    'h-t':'首页'
  },
  ...
}
```
在页面上是这么使用的：
```vue
<template>
 <div class="title">{ { $t("h.h-t") } }</div>
</template>
```

这种方式有两个弊端，一需要手动在其中一个文件中书写 `key` ，而是 `key` 是无法语义话的字符串，模板中使用时，无法读取，难以维护。有的改良方案时使 `key` 语义化，用英文代替，如：

```js
// en.js
export default {
  home: {
    title: 'Home'
  },
  ...
}
```
但是这种方式在设置 `key` 时就需要先翻译一遍，而且如一些难的单词，有些开发者也不认识。

### i18n Ally 插件

这是一款 vscode 插件，可以自动生成 `i18n` 配置，并支持多种语言，还可以自动翻译 `key` 到其他语言。最基本的功能是可以自定义生成 `key` ，然后通过面板来配置其他语言。而且如果对接了翻译平台，如谷歌、百度等，可以自动翻译。

说一下基本的流程，鼠标经过模板上的文字，如中文时，点击「快速修复」—— 「提取文案到i18n」，这就是设置 `key` 的过程，这个 `key` 的形式可以进行配置，如 「首页」的 `key` 可以在默认配置了设置为 `shou-ye`，这种「横杠连接」的形式。确定 `key` 之后，就是填写「源语言」的文本了，如「源语言」是中文，那填写的文本 —— 首页，就是中文下的文本。 

这时候对于其他语言的配置有三种做法，一是手动填写文本，二是点击「翻译」使用自动翻译，三是复制 `cn.json` 文件，翻译完之后，以原格式粘贴到 `en.json` 文件中。

总的来说，i18n Ally 是一个很好的工具，可以自动生成 `i18n` 配置，并支持多种语言，还可以自动翻译 `key` 到其他语言，最重要的一点是可以在模板中显示翻译结果，这就大大增了开发效率。

![效果图](/img/post-lang-i18n.png)
