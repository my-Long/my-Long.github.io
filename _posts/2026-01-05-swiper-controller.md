---
title: "Two-way Swiper Control"
description: "How to implement timeline and tab-switching carousel effects using Swiper Controller for bidirectional sync."
date: 2026-01-05 00:00:00 +0800
categories: [JS]
tags: [swiper,vue,react,component]
image:
  path: /images/swiper-bg.png
  alt: "Two-way control swiper"
pin: true
---

> 一言难尽。研究了好多天，走了好几条弯路，最后靠一个「意外发现」解决的。

有一种很常见的效果：上面是「时间轴」，下面是「内容区」，两者联动——点击时间轴某一年，内容区跟着跳；拖动内容区，时间轴也跟着走。这种效果在「tab 切换」里也很常见。

产品给了我参考图的时候，我第一反应是：这不就是老插件 [Swiper](https://www.swiperjs.net/swiper-doc) 吗？

# 开始想错了

最初的思路是：时间轴用 Swiper，内容区用普通元素，监听时间轴的 `slideNextTransitionStart`，在回调里手动切换内容区的「激活项」。

然后我看了产品给的参考视频，发现情况不是这样。

不是「先切换时间轴，再触发内容区切换」那种有先后感的联动，而是两边**同时**在移动。拖动任意一边，另一边实时跟随——那种丝滑程度，让你感觉它们本来就是一个整体。

于是我去文档里开始探索。

# 第一条弯路：监听回调手动切换

既然要「一边切换，另一边跟上」，最直接的想法就是各自监听对方的回调，然后调用 `slideToLoop` 切过去：

```js
const initSwiper = () => {
  if (!cardSwiperRef.current) return;
  cardSwiperInstance.current = new Swiper(cardSwiperRef.current, {
    grabCursor: true,
    loop: true,
  });
  if (!dateSwiperRef.current) return;
  dateSwiperInstance.current = new Swiper(dateSwiperRef.current, {
    modules: [Navigation],
    slidesPerView: 5,
    spaceBetween: 10,
    centeredSlides: true,
    slideToClickedSlide: true,
    loop: true,
    navigation: {
      prevEl: ".swiper-button-prev",
      nextEl: ".swiper-button-next",
    },
    on: {
      slideNextTransitionStart: (e) => {
        cardSwiperInstance.current?.slideToLoop(e.realIndex);
      },
    },
  });
};
```

切换确实能做到，但问题藏在 `loop` 模式里。在循环模式下，`slideToLoop` 会寻找「最近的下标」——所以当你从 2025 走到 2015 时，它不会往前继续走，而是往回倒退，找到前面那个复制出来的 2015。这种交互体验很糟糕，感官上就是「走错方向了」。

两边各自互相监听还有另一个问题：循环引用，以及先后顺序导致的不同步感。这和我想要的「实时跟随」差太远了。

# 第二条弯路：手动同步 translate

既然回调切换太粗糙，那干脆监听位移，调用 `setTranslate` 手动同步？

实操下来，普通情况勉强能做，但只要涉及到 loop 的边界——比如从 2024 滑到 2025 再到循环回来的 2015——就彻底乱了。放弃。

# 第三条弯路：Controller

文档里有个叫 [Controller](https://www.swiperjs.net/swiper-doc/controller.html) 的功能，看起来就是为「双向控制」设计的，两个实例互相 `.controller.control` 指向对方：

```js
const initSwiper = () => {
  if (!cardSwiperRef.current) return;
  cardSwiperInstance.current = new Swiper(cardSwiperRef.current, {
    modules: [Controller],
    slidesPerView: 1,
    spaceBetween: 10,
    grabCursor: true,
    loop: true,
  });
  if (!dateSwiperRef.current) return;
  dateSwiperInstance.current = new Swiper(dateSwiperRef.current, {
    modules: [Navigation, Controller],
    slidesPerView: 5,
    spaceBetween: 10,
    centeredSlides: true,
    slideToClickedSlide: true,
    loop: true,
    navigation: {
      prevEl: ".swiper-button-prev",
      nextEl: ".swiper-button-next",
    },
  });
  if (cardSwiperInstance.current && dateSwiperInstance.current) {
    cardSwiperInstance.current.controller.control = dateSwiperInstance.current;
    dateSwiperInstance.current.controller.control = cardSwiperInstance.current;
  }
};
```

互相控制是实现了，但「激活项」不同步。两边的 `slidesPerView` 不一样，一个是 `1`，一个是 `5`，虽然文档里说默认的 `by: 'slide'` 是「自身切换一项，被控制方也切换一项」，但实际效果就是不同步。反复试了几次，我接受了这个现实。

# 第四条弯路：缩略图（Thumbs）

再往下翻文档，发现 [Thumbs](https://www.swiperjs.net/swiper-doc/thumbs.html) 功能，官方明确推荐用于「时间轴 + 内容区」这类多对一场景。

用下来才发现不是我想要的。Thumbs 的逻辑是「激活项同步」：点击缩略图，内容区跳过去——但缩略图自己不会滚动。拖动内容区时，缩略图同样不动。这和那种「两边实时跟随」的效果完全是两回事。

# 好几天下来，毫无头绪

此刻我的状态大概就是标题说的「抓耳挠腮」。上面这几种是最有代表性的，但踩到的坑还不止这些：

- `slidesPerView: 7` 时，原数据条数太少导致无法继续切换；
- 开启居中后，左右两边出现空白；
- 还有一些「邪修」方案——比如时间轴不居中，内容区也用普通模式，但通过把数据顺序错开让它们在视觉上「看起来」是居中的：

```js
const list1 = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"];
const list2 = ["2020", "2021", "2022", "2023", "2024", "2018", "2019"];
```

弊端也很明显：第一项无法点击，点击其他项也无法正确滚动到中间，还要做假的高亮……越补越多，越多越乱。

# 最后靠一个「意外发现」解决

还是回到 Controller 方案，但这次发现了两个之前没注意到的属性：`slidesOffsetBefore` 和 `slidesOffsetAfter`，[预设偏移量](https://www.swiperjs.net/swiper-doc/slides-offset-before.html)。

> 说实话是不小心看到的。

核心思路是：**让两边的 `slidesPerView` 保持一致**，然后对内容区使用偏移量，把多余的项「挤出」可视区域，只让中间一项可见。

先验证偏移量能达到这个效果：

```js
const initSwiper = () => {
  if (!cardSwiperRef.current) return;
  cardSwiperInstance.current = new Swiper(cardSwiperRef.current, {
    modules: [Controller],
    slidesPerView: 5,
    spaceBetween: 10,
    grabCursor: true,
    centeredSlides: true,
    loop: true,
    slidesOffsetBefore: 100,
    slidesOffsetAfter: 100,
  });
  // ...
};
```

![swiper-demo.png](/images/swiper-demo-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![swiper-demo-dark](/images/swiper-demo-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

如果偏移量足够大，大到把两侧的内容都挤出去，就只剩中间一项可见了。

`slidesPerView` 是 `5`，中间那项两侧各有 `2` 张，所以把两边各偏移 **2 个 Swiper 容器宽度**就够了：

```js
const initSwiper = () => {
  if (!cardSwiperRef.current) return;
  const w = cardSwiperRef.current.clientWidth;
  const x = -w * 2;
  cardSwiperInstance.current = new Swiper(cardSwiperRef.current, {
    modules: [Controller],
    slidesPerView: 5,
    spaceBetween: 10,
    grabCursor: true,
    centeredSlides: true,
    loop: true,
    slidesOffsetBefore: x,
    slidesOffsetAfter: x,
  });
  if (!dateSwiperRef.current) return;
  dateSwiperInstance.current = new Swiper(dateSwiperRef.current, {
    modules: [Navigation, Controller],
    slidesPerView: 5,
    spaceBetween: 10,
    centeredSlides: true,
    slideToClickedSlide: true,
    loop: true,
    navigation: {
      prevEl: ".swiper-button-prev",
      nextEl: ".swiper-button-next",
    },
  });
  if (cardSwiperInstance.current && dateSwiperInstance.current) {
    cardSwiperInstance.current.controller.control = dateSwiperInstance.current;
    dateSwiperInstance.current.controller.control = cardSwiperInstance.current;
  }
};
```

<video src="https://cdn.jsdelivr.net/gh/my-Long/blog-assets/videos/swiper-demo1.mp4" controls autoplay muted loop width="800"></video>

这也算是一种「邪修」做法，我查过不少社区帖子和 AI 的回答，都没找到什么「官方正统」的路子。但至少它能很好地实现需求，Loop 边界也没问题，同步也是真正的实时同步。

值得一提的是，这种方案不只适用于「时间轴」，凡是「tab 切换 + 内容区跟随」的场景，都能套用同样的思路。
