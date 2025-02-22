---
layout: post
title: "uniapp 主题切换的实践"
subtitle: "如何更方便的实现uniapp-小程序的主题切换？"
author: "My"
header-style: text
tags:
  - uniapp
  - theme
---

## 前言

「主题切换」在我的认知里有两种方法，一是使用类名，二是自定义变量。

- 类名

  即 `.light` 和 `.dark` 是不同颜色的两套样式文件，根据当前的主题，给根元素添加对应的类名。

- 自定义变量

  即声明自定义变量，在 「style」中直接使用自定义变量。

我更加青睐于「自定义变量」，在网页端的项目里，曾有过实践。

## 网页端主题

核心是 「同一个自定义属性」，两种不同的颜色，在进行主题切换时，加载对应的颜色变量。

```css
html[data-theme="dark"] {
  --main-text-color: #ffffff;
}

:root {
  --main-text-color: #333333;
}
```

这里使用的是 `css` 自定义变量，通过 `var` 来使用。 我也忘了当初为什么不用 `scss` 变量，应该是可以的。 例如，主题切换到 `dark` 时，给 `html` 添加 自定义属性 `data-theme="dark"` , 就能使用此设置下自定义变量。 而在 「style」中，使用更加方便，如

```css
.text {
  color: var(--main-text-color);
}
```

## uniapp 主题

在 「uniapp」 没有自定义属性，因此哪怕说通过控制按钮，手动地或者通过 api 拿到系统的主题，「uniapp」都无法加载这个环境，都很难给 「uniapp」添加主题。比如说，使用缓存，已经将「theme」设置为 `dark` ，那「uniapp」如何使用这个状态的样式。在官方文档中，[主题切换有两方面的设计](https://uniapp.dcloud.net.cn/tutorial/darkmode.html)，一是「page.json」 中使用对应的颜色变量，而针对 `css` 则使用 「媒体查询」结合类名。

在此，「uniapp」的这一套设计，已经是限制了主题是跟随系统的，没有所谓的「白天、黑夜、跟随系统」三种模式。

### 初始方案

因为本项目微信小程序，使用了 「自定义 tabbar」和「自定义 navbar」，因此对于「page.json」的配置关注并不多，主要是针对 `css` 的。开始的方案也是使用了类名，样式如下：

```scss
@media (prefers-color-scheme: dark) {
  .main-text {
    color: #cdcdcd;
  }
}
@media (prefers-color-scheme: light) {
  .main-text {
    color: #333;
  }
}
```

这种情况下是完全 「跟随系统」的，当系统主题发生变化时，这一属性 `prefers-color-scheme` 会识别到系统的主题，并加载对应的设置，因此在此配置中，很难手动地去设置主题。比如说，系统主题是 `dark`，这时手动的设置 `theme=dark`, 那程序是如何识别这个变量并使用对应的配置，这是个难点。

回归正传，此次的主题切换，也默认使用了跟随主题，那来看看如何使用此配置的，在 `.vue` 中使用。

```vue
<text class="main-text">GPS编号</text>
```

给对应的标签加上所需要用到类名即可，也就是说，这种主题配置方案，主要是作用于 「template」 而与 「style」 关系不大。

随着方案的使用，逐渐发现了一种弊端：无法设置组件的样式。很容易理解，我们是通过给元素添加类名以达到颜色替换的效果，但是无法给组件添加类名，哪怕添加了类名，组件里的具体元素也无法识别到。

因此，我的思绪又回到以前 ———— 使用自定义变量。这时候，变量是作用于 「style」的，更加方便的使用。

### 最终方案

刚才是想使用 `scss` 变量，即

```scss
@media (prefers-color-scheme: dark) {
  $mian-text: #fff;
}
@media (prefers-color-scheme: dark) {
  $mian-text: #333;
}
```

在 `App.vue` 的 「style」中引入后，即可在任意 `.vue`文件里使用，如

在 「style」中使用

```scss
.text {
  color: $main-text;
}
```

理想是美好的，现实是残酷的，无法使用该变量。
![image.png](/img/vue/uniapp-error.png)

查阅相应资料后，得出结论：

> 在 uniapp 中，@media (prefers-color-scheme: dark) 和 @media (prefers-color-scheme: light) 的 CSS 媒体查询内定义的 SCSS 变量 `只能在其定义的作用域内使用`，因此作用域是局限的，在外部无法访问。

因此，方案是使用 「css 自定义属性」来代替 「scss 变量」。

```scss
:root {
  --main-text: #333;
}

/* 根据暗黑模式调整颜色 */
@media (prefers-color-scheme: dark) {
  :root {
    --main-text: #cdcdcd;
  }
}
```

在 `uni.scss` 中导入此文件（在`App.vue`中导入无效）。 此时，已经能在 「style」中使用了

```scss
.text {
  color: var(--main-text);
}
```

当然了，如果不习惯通过 `var` 变量来使用，可以再包一层。

```scss
$bg: var(--bg);
$cell-bg: var(--cell-bg);
$color: var(--color);
$value-color: var(--value-color);
$label-color: var(--label-color);
$border: var(--border);
$input-bg: var(--input-bg);
$placeholder-color: var(--placeholder-color);
```

```scss
.text {
  color: $color;
}
```

### 问题

回来之前疑问，如果手动配置主题呢？ 即跟随系统时，此时的主题是「dark」，在 `@media (prefers-color-scheme: dark)` 下如何使用 「light」主题
