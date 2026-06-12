---
title: "Theme Switching in UniApp"
description: "Two approaches to implement theme switching in UniApp: CSS class toggling and CSS custom variables."
date: 2025-02-11 00:00:00 +0800
categories: [MiniApp]
tags: [uniapp]
---

给小程序加暗黑主题，我脑子里一开始就两种思路：类名切换，或者 CSS 自定义变量。

类名方案直接，两套样式分别挂 `.dark` 和 `.light`，切换主题就是切换根元素上的类名。自定义变量方案更灵活：声明一个 `--main-text` 之类的变量，所有用到颜色的地方统一用 `var(--main-text)` 引用，换主题只需要改变量的值，样式本身不用动。

我更偏向变量这套。网页端项目里用过，体验很好：

```css
:root {
  --main-text-color: #333333;
}

html[data-theme="dark"] {
  --main-text-color: #ffffff;
}
```

给 `<html>` 加上 `data-theme="dark"` 属性，所有用了 `var(--main-text-color)` 的地方就自动切过去了。还能手动控制，不用死绑着系统主题。

但 uniapp 没有 `html` 元素，这套逻辑没法直接照搬。

## 媒体查询——走到了死角

uniapp 官方推荐的方案是媒体查询 + 类名：

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

在模板里给元素加上对应的类名，颜色就跟着系统走。跑起来没问题，但很快撞墙了——**组件里的样式没法靠这种方式覆盖**。

项目里用了自定义 tabbar 和 navbar，这些组件里的颜色想用媒体查询控制，做不到。类名挂到组件标签上，但组件内部的元素认不到外部的类名，穿不进去。

媒体查询 + 类名这套，只适合纯页面结构。涉及自定义组件就不够用了。

## 想用 SCSS 变量，想多了

既然变量在 style 里更方便，能不能用 SCSS 变量？试了一下：

```scss
@media (prefers-color-scheme: dark) {
  $main-text: #fff;
}
@media (prefers-color-scheme: dark) {
  $main-text: #333;
}
```

直接报错。

![uniapp-error.png](/images/uniapp-error-light.png){: .shadow .rounded-10 w='1696' h='384' .light }
![uniapp-error-dark](/images/uniapp-error-dark.png){: .shadow .rounded-10 w='1696' h='384' .dark }

查了一下，原因很简单：SCSS 变量是编译时处理的，媒体查询里定义的变量，作用域就锁死在那个块里，外部访问不到。

## CSS 自定义属性——最终跑通的方案

把 SCSS 变量换成 CSS 自定义属性，作用域问题就消失了。CSS 自定义属性是运行时的，通过 `:root` 定义之后，整个文档都能用：

```scss
:root {
  --main-text: #333;
}

@media (prefers-color-scheme: dark) {
  :root {
    --main-text: #cdcdcd;
  }
}
```

有一个坑：这个文件得在 `uni.scss` 里 import，不能在 `App.vue` 的 style 里引。我一开始在 `App.vue` 里 import，变量完全不生效，换到 `uni.scss` 就好了。

在 style 里用起来和网页端一样：

```scss
.text {
  color: var(--main-text);
}
```

如果不想到处写 `var()`，可以在 `uni.scss` 里再包一层 SCSS 变量，之后直接用 `$color`、`$bg` 这些更简洁的写法：

```scss
$bg: var(--bg);
$color: var(--color);
$border: var(--border);
$input-bg: var(--input-bg);
$placeholder-color: var(--placeholder-color);
```

---

这套方案目前只解决了「跟随系统」的场景。如果要做「白天 / 黑夜 / 跟随系统」三档手动切换，媒体查询就不够了——系统是 dark 时，手动选了 light，没有干净的方法去覆盖。还没找到特别顺手的解法。
