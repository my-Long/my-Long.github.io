---
title: "PicBorder：给截图套一个 macOS 窗口边框"
description: "A Chrome extension that wraps any image in a macOS-style window frame — built with Canvas API and Manifest V3, no backend needed."
date: 2026-05-14 00:00:00 +0800
categories: [Tools]
tags: [chrome-extension, canvas, javascript]
---

在某个网站上看到别人的截图套了一圈 macOS 窗口边框，标题栏、红绿灯、圆角，一下子就比裸图好看很多。想自己也搞一个，找了一圈没找到顺手的工具，干脆自己做一个 Chrome 插件。

## 做了什么

点击插件图标，会在新 Tab 里打开操作界面。把图片拖进去（也支持点击选择和 Cmd+V 粘贴截图），调好参数，点 Download 就能拿到带边框的 PNG。

可调的参数有三个：

- **Style** — Light Bar / Dark Bar，对应 macOS 浅色/深色窗口标题栏
- **Radius Size** — 0 到 40px，控制圆角弧度
- **Border** — 外描边开关

## 技术上的几个决定

**Manifest V3**。Chrome 早就要求 v3 了，Service Worker 替代了 background page。插件的后台逻辑很简单，只做一件事——监听图标点击，打开新 Tab：

```js
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
});
```

**为什么开新 Tab 而不是用 Popup**。Popup 窗口太窄，没法做图片预览。换成完整 Tab 之后，左边放预览区，右边放控制面板，布局随便做。

**Canvas 画边框**。整个 macOS 窗口——标题栏、红绿灯、圆角、描边——全是用 Canvas API 画的，核心在 `drawMacWindow` 这个函数里。思路是先画窗口背景，再画标题栏，然后把图片 clip 进图片区域，最后描外边框：

```js
// 标题栏
ctx.beginPath();
ctx.roundRect(0, 0, imgW, TITLEBAR_H, [radius, radius, 0, 0]);
ctx.fillStyle = titlebarBg;
ctx.fill();

// 红绿灯
[{ x: 16, color: '#ff5f57' }, { x: 36, color: '#ffbd2e' }, { x: 56, color: '#28c840' }]
  .forEach(({ x, color }) => {
    ctx.beginPath();
    ctx.arc(x, dotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
```

**DPR 处理**。不处理的话，Retina 屏上预览会糊。Canvas 物理像素要乘以 `devicePixelRatio`，然后在逻辑坐标里画：

```js
canvas.width  = Math.round(imgW * dpr);
canvas.height = Math.round((imgH + TITLEBAR_H) * dpr);
ctx.scale(dpr, dpr); // 之后都在 CSS px 坐标系里操作
```

预览时传 `window.devicePixelRatio`，下载时传 `1`，导出的是图片原始分辨率。

**预览即导出（WYSIWYG）**。没有做额外的离屏 Canvas，预览用的那块 Canvas 就是最终输出。点 Download 直接 `toBlob()`：

```js
previewCanvas.toBlob((blob) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = currentFileName + '_macos.png';
  a.click();
  URL.revokeObjectURL(a.href);
}, 'image/png');
```

## 一个刻意的设计

标题栏高度固定 40px，不随图片缩放。

macOS 窗口的标题栏视觉上是固定高度的，如果让它跟着图片一起等比缩放，图片越小标题栏就越薄，红绿灯小得不像话。所以预览时只缩放图片区域，标题栏始终 40px：

```js
const TITLEBAR_H = 40; // never scales

const imgScale = Math.min(
  availW / currentImg.width,
  (availH - TITLEBAR_H) / currentImg.height,
  1 // 不放大
);
```

---

目前够用了。后面可能会加背景填充（纯色或渐变）和自定义标题文字，先放着。
