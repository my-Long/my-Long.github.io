---
title: "i18n Setup in Vue Projects"
description: "Step-by-step guide to configuring internationalization in a Vue project using vue-i18n with dynamic locale switching."
date: 2023-08-19 00:00:00 +0800
categories: [JS, Engineering]
tags: [vue, i18n]
---

项目要支持中英文切换，先想清楚用哪种方案。

能想到的有三种：把语言存到 localStorage，下次打开直接读；多域名，`cn.example.com` 加载中文，`en.example.com` 加载英文；或者把语言塞进路由路径，`/cn/home`、`/en/home` 这种。

localStorage 最简单，但刷新页面会有短暂的语言闪烁。多域名成本高，这个项目用不着。最后选的路由方案——不需要额外缓存，语言状态直接反映在 URL 里，分享链接也能保持语言设置。

## 语言包和 i18n 配置

在 `src` 下建 `lang` 目录：

```
src
├── lang
│   ├── en.json
│   ├── cn.json
│   └── index.ts
```

`index.ts` 里创建 `vue-i18n` 实例，默认语言从路径里读，读不到就看浏览器语言，再兜底 `en`：

```ts
import { createI18n } from "vue-i18n";
import cn from "./cn.json";
import en from "./en.json";

const messages = {
  en: { ...en },
  cn: { ...cn },
};

const getLang = () => {
  const lang =
    location.pathname.split("/")[1] || navigator.language.split("-")[0] || "en";
  if (lang == "zh") {
    return "cn";
  }
  return lang;
};

const i18n = createI18n({
  legacy: false,
  locale: getLang(),
  messages,
});

export default i18n;
```

`main.ts` 里挂上：

```ts
import i18n from "./lang";
app.use(i18n);
```

## 路由配置

路径加了语言前缀，路由表得配合：

```ts
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

每次跳转都要带语言前缀，写成 `router.push("/en/home")` 这种太繁琐。用路由守卫统一处理，跳转时自动补上：

```ts
router.beforeEach((to, from, next) => {
  const lang = i18n.global.locale.value;
  const path = to.path;

  if (!path.startsWith(`/${lang}`)) {
    next({ path: `/${lang}${path}` });
  } else {
    next();
  }
});
```

这样 `router.push("/home")` 就够了，不用每次手动拼语言前缀。

## 语言切换组件

用 ant-design-vue 的 `a-dropdown` 做下拉切换。`setRoute` 里的 `route.path.slice(3)` 是把路径头三个字符（比如 `/cn`）切掉，换成新的语言前缀：

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
  router.push(`/${lang}${route.path.slice(3)}`);
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

## 语言文件怎么写——i18n Ally

碰到过一些老项目，语言文件的 key 长这样：

```js
// en.js
export default {
  h: {
    'h-t': 'Home'
  },
}
```

模板里 `{{ $t("h.h-t") }}` ，完全看不出来对应什么文案，维护靠猜。改成语义化的英文 key 会好一点，但设置 key 时就得先翻译一遍，又麻烦。

i18n Ally 是个 VS Code 插件，解决了这个流程问题。鼠标经过模板里的中文文案，点「快速修复」→「提取文案到 i18n」，会让你设定 key，然后自动把这段文案写进语言文件。接了翻译平台（Google、百度等）还能自动翻译，最有用的是：模板里直接显示翻译结果，不用来回切文件对比。

![效果图](/images/post-lang-i18n-light.png){: .shadow .rounded-10 w='2402' h='1164' .light}
![效果图](/images/post-lang-i18n-dark.png){: .shadow .rounded-10 w='2402' h='1164' .dark}


做完路由方案之后翻文档翻到这个插件，装上之后才发现之前手写 key 那段时间是在浪费生命。
