---
title: "寻找一种实用的方法来上传项目的 CDN 资源"
description: "Manually uploading to a company server or borrowing an admin panel's avatar upload feature are both clunky ways to get an online image URL, so this post looks at adapting a resource upload approach that actually fits the project."
date: 2026-07-17 00:00:00 +0800
categories: [JS, Engineering]
tags: [upload, cdn, workflow]
published: true
---

这是在公司项目一开始就想的问题。

然后我发现，以前接触到的上传资源的方式五花八门。有用 SVN 管理的，把图片扔进对应目录直接提交仓库；有靠人肉的，把图片发给负责人，让他手动传到服务器；还有蹭后台某个业务功能的，比如个人信息编辑页的头像上传，借用它拿一个图片的在线地址……

都是这么凑合过来的，甚至没有一个正经的上传页面。

项目刚开始的时候，我问了一句"我们图片资源在哪上传"，leader 说"后面把 oss 的 key 给你"（那一刻我是懵的，我只是想知道在哪上传而已）。后来他把 oss 相关信息一股脑甩给我——好家伙，这意思不就是让我自己搭一套上传方式吗。

想过几个方案：

1. 找后端同事写个接口，我随便写个页面调用一下，糊弄过去。
2. 自己起个项目，前后端都自己写，前端做个页面。

第二种方案确实动手做了，前后端一起跑起来，图片上传功能也实现了，但用起来很别扭——每次都得手动启动前端项目，不方便。

放弃。

最终定下来的方式：做成浏览器插件。还是沿用之前的 monorepo 结构，新增一个 extension 项目。

后端服务用 pm2 挂在本地，开机之后就一直跑着，不用管；前端就是这个浏览器插件，装上之后随时点开就能用，不用再手动 npm run dev 一遍。这下总算摆脱了之前那种"先启动项目才能上传图片"的别扭感。

项目形态定了，接下来要解决的是怎么跟现有项目集成——不是单纯"上传一张图拿个地址"这么简单，而是要让插件跟项目产生关联，用起来才顺手。

![upload-strategy](/images/upload-strategy.png)
_上传资源插件_

手上有两个项目，资源路径和资源类型必须区分开，面板上要能控制上传到哪个项目。

### 用项目前缀区分资源归属

每个项目的资源路径前缀不一样，比如 `/project1/` 或 `/project2/`。所以在插件面板里加了个切换按钮：

```html
<div class="segment-options" aria-label="上传项目">
    <button class="segment-option is-active" type="button" data-project="heya" aria-pressed="true">HEYA</button>
    <button class="segment-option" type="button" data-project="hafa" aria-pressed="false">HAFA</button>
</div>
```
把选中的类型传给后端，后端根据类型返回对应的资源路径。

### 版本冲突：调试时不能覆盖线上资源

这一步其实是为了调试。线上跑的可能是某个版本，比如 v1.0.0，一旦有 bug 或者要调试新功能，就不能用同名文件上传，否则线上资源直接被覆盖。

手动改文件名区分是个办法，但太麻烦，索性用原文件名 + 日期的方式命名。插件里加了个"是否固定文件名"的开关，默认不固定，上传后文件名就是原文件名加日期，比如 `image-20260726100000.png`；固定之后，文件名就是原样，比如 `image.png`。

### 真正的难点：图片路径要跟着语言切换

这才是跟项目集成的关键。项目是多语言的，阿拉伯语和英文，渲染图片的时候要根据语言加载对应资源。

如果只是单纯上传拿路径，我完全可以手动把文件重命名成 `en-image.png` 或 `ar-image.png` 再传，本身没什么问题。但我之前封装了一个 `Image` 组件，专门用来在项目里渲染图片——这就麻烦了，为了让插件跟 `Image` 组件对上，图片格式必须统一。

不然的话，每次切换语言都得在业务代码里手动判断：

```js
import Image from './Image.tsx'

return (
    {
        lang === 'en' ? <Image src={enImage} alt={alt} /> : <Image src={arImage} alt={alt} />
    }
)
```
太麻烦了。所以我把语言切换这件事塞进 `Image` 组件内部，让它自己根据语言换路径。这就要求图片命名格式固定下来，我定了 `_en.` 和 `_ar.` 这两个前缀，如 `_en.image.png` 或 `_ar.image.png`，组件内部根据当前语言拼出这个**前缀**。

```tsx
const langSegment = formatLang ? `_${i18n.language}.` : ''

function resolveSrc(src: string | undefined, prefix: string, langSegment: string) {
  if (!src || /^(https?:)?\/\//.test(src)) return src
  return `${baseUrl}${prefix}${langSegment}${src}`
}
```

这样图片路径就能跟着语言自动切换了。考虑到有些图片压根不需要区分语言，又加了个 `formatLang` 参数来控制要不要走这套逻辑：

```tsx
<Image src="demo-banner.png" alt="" formatLang />
```

因为前缀格式定死了 `_${i18n.language}.`，插件那边也得照着这个规则拼。选 `en` 的时候，原文件名 `demo-banner.png` 上传后就变成 `https://xxxxx/_en.demo-banner.png`。

一套流程走下来，插件、后端、组件三边的约定算是对上了。就是不知道下次再加一种语言，或者项目从两个变成三个、四个的时候，这套前缀 + 开关的土办法还扛不扛得住——先这样吧，遇到再说。