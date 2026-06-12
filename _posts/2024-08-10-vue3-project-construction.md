---
title: "Building a Vue3 Project from Scratch"
description: "A full walkthrough of setting up a Vue3 project: tooling, routing, state management, UI library, i18n, and more."
date: 2024-08-10 00:00:00 +0800
categories: [Vue]
tags: [vue]
---

搭过不少项目了，每次都是查一圈资料、东拼西凑跑起来，但从来没认真把整个过程记下来。下次再起项目，还是得重新去翻别人的博客。

这次官网项目，打算边做边记——不只是步骤，也把为什么这么选记进来，省得以后只剩一堆代码，自己都不知道当初在想什么。

## 先定技术栈

Vite + Vue3 没什么好说的，新项目没有理由不用 Vite。TypeScript 这次也打算认真用，之前都是凑合。预处理器还是 SCSS，习惯了。UI 库之前用的都是 Element-UI 或者 Vant，这次换一个——ant-design-vue，看着不错，试试。状态管理用 Pinia，Vue3 的标配。请求直接用 fetch，没必要引 axios，官网项目接口不多。

```
项目名称：official-website
技术栈：vue3 + vite + typescript + ant-design-vue + scss + pinia + fetch
```

创建项目，初始化依赖，关联远程仓库：

```bash
pnpm create vite@latest vue3-ts-app --template vue-ts
pnpm install
```

![vue3-template.png](/images/vue3-template-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![vue3-template-dark](/images/vue3-template-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

## 布局：layout 组件 + router-view

官网是上中下结构——顶部导航、中间内容区、底部信息。内容区用 `<router-view>` 占位，不同页面在这里切换。抽成 Layout 组件，让路由决定里面渲染什么：

```vue
<template>
  <Header></Header>
  <div class="main">
    <router-view></router-view>
  </div>
  <Footer></Footer>
</template>
```

路由表里 Layout 作为父路由，各页面作为子路由：

```js
{
  path: '/',
  redirect: '/home',
},
{
  path: '/',
  component: Layout,
  children: [
    {
      path: 'home',
      name: 'home',
      component: () => import("@/views/home/index.vue"),
    },
    {
      path: 'profile',
      name: 'profile',
      component: () => import("@/views/profile/index.vue"),
    }
  ]
}
```

![vue3-layout.png](/images/vue3-layout-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![vue3-layout-dark](/images/vue3-layout-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

## 路由配置，以及 @ 别名的坑

安装：`pnpm install vue-router@4`。

在 `src/router/index.ts` 里创建路由实例：

```js
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/",
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

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

在 `main.ts` 里 use 进去：

```js
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);
app.use(router);
app.mount("#app");
```

路由配起来没问题，但 `component: () => import("@/layout/index.vue")` 这种写法在 TS 里会报错：「找不到模块"@/layout/index.vue"或其相应的类型声明」。

`@` 别名和 `.vue` 文件类型 TS 都不认识，需要三个地方改一下。

**vite.config.ts**——配置路径别名，让 `@` 指向 `src`：

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**tsconfig.app.json**——告诉 TS 编译器 `@/*` 对应哪里：

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**shims-vue.d.ts**——声明 `.vue` 文件的类型：

```ts
declare module "*.vue" {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

这个文件要在 `src` 目录下创建，不是根目录。AI 给的答案是根目录，实际上不生效，折腾了一会才发现放错地方了。

到这里，路由相关的文件结构是这样：

```
├── src
│   ├── components
│           ├── Header/index.vue
│           ├── Footer/index.vue
│   ├── layout/index.vue
│   ├── router/index.ts
│   ├── shims-vue.d.ts
│   ├── App.vue
│   ├── main.ts
│   └── views
│           ├── home/index.vue
│           ├── profile/index.vue
├── tsconfig.app.json
├── vite.config.ts
```

## SCSS

安装：`pnpm install sass -D`，style 标签加 `lang="scss"` 就能用。

全局样式放 `assets/styles/global.scss`，reset、字体、常用工具类都在这里：

```scss
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0;
  padding: 0;
  font-size: 16px;
}

* {
  box-sizing: border-box;
}

.df {
  display: flex;
}

@for $i from 1 through 100 {
  .fs#{$i} {
    font-size: $i + px;
  }
}
```

在 `main.ts` 里 import 进来。

## Pinia 状态管理

安装：`pnpm add pinia`。直接在 `main.ts` 里创建实例并注册：

```ts
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);
app.mount("#app");
```

store 模块用组合式风格写，跟 Vue3 的 setup 保持一致，比 options 式更顺手：

```ts
// src/stores/useUserStore.ts
import { defineStore } from "pinia";
import { reactive } from "vue";

export const useUserStore = defineStore("user", () => {
  const user = reactive({
    name: "Lmy",
  });

  const changeName = (name: string) => {
    user.name = name;
  };

  return {
    user,
    changeName,
  };
});
```

组件里直接用：

```vue
// Home.vue
<script setup lang="ts">
import { useUserStore } from "@/stores/useUserStore";
const userStore = useUserStore();
</script>
<template>
  <div class="home">
    <div class="name">姓名：{{ userStore.user.name }}</div>
  </div>
</template>

// Profile.vue
<script setup lang="ts">
import { useUserStore } from "@/stores/useUserStore";
const userStore = useUserStore();

const changeName = () => {
  userStore.changeName("张三");
};
</script>
```

持久化没用插件，直接 watch 同步到 localStorage——够用：

```ts
const storedUser = localStorage.getItem("user");
const user = reactive({
  name: storedUser ? JSON.parse(storedUser).name : "Lmy",
});

watch(
  user,
  (newUser) => {
    localStorage.setItem("user", JSON.stringify(newUser));
  },
  { deep: true }
);
```

## UI 库：ant-design-vue

安装：`pnpm add ant-design-vue@4.x`，图标包单独装：`pnpm add @ant-design/icons-vue`。

全局注册。官网项目规模不大，按需引入反而麻烦，直接全量：

```ts
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

app.use(Antd);
```

组件直接用标签名：

```vue
<script setup lang="ts">
import { h } from "vue";
import { QuestionCircleOutlined } from "@ant-design/icons-vue";
</script>
<template>
  <a-button type="primary" :icon="h(QuestionCircleOutlined)">按钮</a-button>
</template>
```

## 主题切换：auto/dark/light 三种状态

这里多想了一下。

通常主题只有暗/亮两个状态，但"跟随系统"的需求很常见——白天自动亮，晚上自动暗。所以实际上需要三种状态：`light`、`dark`、`auto`。

逻辑是：
- 默认 `auto`，监听 `prefers-color-scheme` 媒体查询，系统切了就跟着切
- 用户手动切换后，改成 `dark` 或 `light`，不再跟系统走
- 状态保存在 pinia 里（key 是 `hld-theme-appearance`）

切换的表现是给 `<html>` 加减 `dark` 类，CSS 变量根据这个类决定颜色。

把这套逻辑封装成 `useTheme` hook：

```ts
import { ref, watch, watchEffect, onMounted } from "vue";
import { useSettingStore } from "@/stores/useSettingStore.ts";

export const useTheme = () => {
  const localTheme = ref("light");
  const settingStore = useSettingStore();
  const systemTheme = ref("light");

  const getLocalTheme = (theme: string) => {
    systemTheme.value = theme;
    const storeTheme = settingStore.hldThemeAppearance;
    if (storeTheme === "auto") {
      localTheme.value = systemTheme.value;
    } else {
      localTheme.value = storeTheme;
    }
    setSystemTheme(localTheme.value);
  };

  const setSystemTheme = (theme: string) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setLocalTheme = (checked: boolean) => {
    if (checked) {
      if (systemTheme.value === "dark") {
        settingStore.setHldThemeAppearance("auto");
      } else {
        settingStore.setHldThemeAppearance("dark");
      }
      getLocalTheme("dark");
    } else {
      if (systemTheme.value === "dark") {
        settingStore.setHldThemeAppearance("light");
      } else {
        settingStore.setHldThemeAppearance("auto");
      }
      getLocalTheme("light");
    }
  };

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  onMounted(() => {
    const theme = mediaQuery.matches ? "dark" : "light";
    getLocalTheme(theme);
  });

  watch(
    () => systemTheme.value,
    (newTheme) => {
      getLocalTheme(newTheme);
    },
    { immediate: true }
  );

  watch(
    () => settingStore.hldThemeAppearance,
    () => {
      getLocalTheme(systemTheme.value);
    }
  );

  watchEffect(() => {
    const handleChange = (e: any) => {
      const theme = e.matches ? "dark" : "light";
      getLocalTheme(theme);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  });

  return {
    localTheme,
    setLocalTheme,
  };
};
```

CSS 变量分两套，`.dark` 类覆盖 `:root` 里的默认值：

```css
:root {
  --hl-m-text: var(--hl-b-text-light-1);
  --hl-m-bg: var(--hl-b-white);
}
html.dark {
  color-scheme: dark;
}
.dark {
  --hl-m-text: var(--hl-b-text-dark-1);
  --hl-m-bg: var(--hl-b-black);
}
:root {
  --hl-b-white: #fff;
  --hl-b-black: #1a1a1a;
  --hl-b-text-light-1: #213547;
  --hl-b-text-light-2: rgba(60, 60, 60, 0.7);
  --hl-b-text-light-3: rgba(60, 60, 60, 0.33);
  --hl-b-text-light-4: rgba(60, 60, 60, 0.18);
  --hl-b-text-dark-1: rgba(255, 255, 255, 0.87);
  --hl-b-text-dark-2: rgba(235, 235, 235, 0.6);
  --hl-b-text-dark-3: rgba(235, 235, 235, 0.38);
  --hl-b-text-dark-4: rgba(235, 235, 235, 0.18);
}
```

ant-design-vue 的主题跟着 `localTheme` 走，在 `App.vue` 里用 `a-config-provider` 包一层：

```vue
<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#F84F9F',
      },
      algorithm:
        localTheme == 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
    }"
  >
    <router-view />
  </a-config-provider>
</template>
```

## 国际化：选了 URL 路径方案，发现细节挺多

国际化方案我想了三种：

- **子域名**：`en.example.com` / `cn.example.com`，需要 DNS 和服务端配合，成本高
- **URL 路径**：`example.com/en/` / `example.com/cn/`，前端完整控制，SEO 也友好
- **缓存**：语言不体现在 URL 里，靠 localStorage 记住

选了 URL 路径方案。好处是语言信息在 URL 里可见，分享链接语言也跟着走。坏处是后面发现了一些副作用，后面说。

安装：`pnpm add vue-i18n`。

在 `src/lang/index.ts` 创建实例，语言从 URL 路径第一段读，读不到看浏览器语言，兜底是 `en`：

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

语言文件就是普通 JSON：

```json
// cn.json
{
  "home": {
    "title": "首页"
  }
}
```

在 `main.ts` 里把所有插件注册进来：

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import i18n from "./lang";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";
import "./assets/styles/style.css";
import "./assets/styles/index.scss";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(Antd);
app.use(i18n);
app.mount("#app");
```

ant-design-vue 的组件自身也有需要国际化的文案（分页、时间选择器这类），靠 `a-config-provider` 的 `locale` 属性控制。时间类组件还需要单独给 `dayjs` 设语言（`pnpm add dayjs`）：

```vue
<script setup lang="ts">
import { theme } from "ant-design-vue";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "vue-i18n";
import enUS from "ant-design-vue/es/locale/en_US";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

const { localTheme } = useTheme();
const { locale } = useI18n();

dayjs.locale("en");
</script>
<template>
  <a-config-provider
    :locale="locale === 'en' ? enUS : zhCN"
    :theme="{
      token: {
        colorPrimary: '#663399',
        colorBgContainer: 'var(--hl-m-input)',
      },
      algorithm:
        localTheme == 'light' ? theme.defaultAlgorithm : theme.darkAlgorithm,
    }"
  >
    <router-view />
  </a-config-provider>
</template>
```

语言切换组件，先用 switch 做个最简单的版本——切语言的同时更新 URL：

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const router = useRouter();
const { locale } = useI18n();

const checked = ref(false);
const onLangChange = (value: boolean) => {
  const lang = value ? "en" : "cn";
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
  <a-switch
    v-model:checked="checked"
    checked-children="en"
    un-checked-children="zh"
    @change="onLangChange"
  />
</template>
```

刷新后语言不丢，因为 `getLang` 是从 URL 读的，不依赖 localStorage。

**路由守卫**——访问 `/home` 这种不带语言前缀的路径，守卫自动补上：

```ts
import i18n from "@/lang";

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

有个副作用：**`<router-link to="/home">` 会触发警告**——路径不带语言前缀，守卫跳转后找不到匹配。用 `router.push` 写声明式导航就没这个问题，所以项目里干脆不用 `router-link` 了。

**i18n Ally 插件**——这是整个国际化里最省力的一环，是 VSCode 插件。

不用插件的话，template 里写 `{{ $t('home.title') }}`，完全不知道这个 key 对应什么内容，时间长了根本不知道在维护什么：

![lang-temp.png](/images/lang-temp-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-temp-dark](/images/lang-temp-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

装了 i18n Ally 之后：

捕捉需要翻译的内容：

![lang-tem1.png](/images/lang-tem1-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem1-dark](/images/lang-tem1-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

提取文案，生成 key：

![lang-tem2.png](/images/lang-tem2-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem2-dark](/images/lang-tem2-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

生成路径（我用模块区分，手动改成 `home.ni-hao`）：

![lang-tem3.png](/images/lang-tem3-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem3-dark](/images/lang-tem3-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

替换内容，template 里选第一个：

![lang-tem4.png](/images/lang-tem4-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem4-dark](/images/lang-tem4-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

配置基准语言和可视语言（我都设成 `cn`，代码里直接看到中文而不是 key）：

![lang-tem5.png](/images/lang-tem5-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem5-dark](/images/lang-tem5-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

效果：

![lang-tem6.png](/images/lang-tem6-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem6-dark](/images/lang-tem6-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }
![lang-tem7.png](/images/lang-tem7-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem7-dark](/images/lang-tem7-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }
![lang-tem8.png](/images/lang-tem8-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem8-dark](/images/lang-tem8-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

插件面板里可以看到哪些 key 还没有对应的翻译：

![lang-tem9.png](/images/lang-tem9-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![lang-tem9-dark](/images/lang-tem9-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

鼠标放到未翻译的字段上，弹窗里点编辑直接填英文，不需要自己在 JSON 文件里找对应位置。
