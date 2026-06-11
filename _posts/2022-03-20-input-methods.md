---
title: "Chinese IME Input Issues in Web"
description: "Common bugs triggered by Chinese input methods in browser text fields and how to handle compositionstart and compositionend events."
date: 2022-03-20 00:00:00 +0800
categories: [JS, Base]
tags: [input,component]
---

给搜索框绑了 `@input`，结果发现在中文输入法下，还没选字，`onSearch` 就已经触发了。你的键盘才敲到 `w`，准备输入「我」，搜索就先跑了一次。

问题在于 `@input` 监听的是所有键盘输入，包括中文输入法拼音阶段的每一个字母。这时候文字还在「合成中」（composing），用户还没确定选哪个字。

浏览器提供了两个事件来标记这个过程：

- `compositionstart`：开始合成，比如你开始打拼音的那一刻
- `compositionend`：合成结束，选了汉字或按 Esc 退出

用一个 flag 跟踪合成状态，合成期间跳过 `onSearch`：

```js
const bindFun = () => {
  const inp = document.querySelector("input");
  let isComposing = false;

  inp.addEventListener("input", () => {
    if (isComposing) return; // 合成中，不触发
    onSearch();
  });

  inp.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  inp.addEventListener("compositionend", () => {
    isComposing = false;
    onSearch(); // 选完汉字后触发一次
  });
};

onMounted(() => {
  bindFun();
});
```

`compositionend` 里补一次 `onSearch()`，保证选完字之后该触发的还是会触发。

如果页面有多个这样的输入框，封装成组件是更好的做法——在 Vue 里做成普通组件，React 里你们会倾向于普通组件还是 HOC？
