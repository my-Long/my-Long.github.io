---
layout: post
title: "swiper的控制！！！"
subtitle: "如何做「时间轴」&&「tab切换」这种轮播图效果？？"
author: "My"
header-img: "img/js/swiper-bg.png"
header-mask: 0.4
tags:
  - js
  - swiper
---

> 一言难尽！！！ 有一种很常见的效果，即一部分是「时间轴」，另一部分是「内容区」，他们之间相互控制。这种效果也常常出现在「tab」切换中。

# 思考 🧐

首先就是想到了老插件 [Swiper](https://www.swiperjs.net/swiper-doc)。原先我脑子里还没有「双向控制」的画面，最初的思路是 ———— 时间轴使用「swiper」，而内容区使用普通的元素，通过「激活项」切换内容。

看到了产品给的例子，慢慢发现不是这么简单。。。 不是单纯的内容切换，不是一个切换后另一个再切换，不是设置 activeIndex，是「极致」的同步。 👋 因此在文档里踏上了探索之路。。。。。。

# 目标 🎯

点击 「时间轴」的项、拖动、左右按钮和拖动时，「内容区」则同步滚动；拖动「内容区」，则「时间轴」也同步滚动。

<video src="/img/miniapp-mobile/js/swiper-demo.mp4" controls style="width: 100%; max-width: 800px;"></video>

在探索过程中，走了好多「弯路」，如下面的

# 设置活动项 ❌

思路是在「时间轴」切换后，通过 `slideNextTransitionStart` 回调来设置「内容区」的活动项。

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

这种方式确实能实现内容的切换，但是有个弊端和瑕疵

- 弊端

  在 `loop` 模式下，`slideToLoop` 会寻找最近的「下标」，即当到达源数组的最后一项时（2025），下一步要进入 2015，此时「内容区」不会往下走进入 2015，而是会往后走，回到前面的 2015。这种交互体验上并不友好，当然有「邪修」的做法，就想**苹果的时钟**一样，做个假的循环，复制多份数据数据 🙊

- 瑕疵

  内容区也要监听 `slideNextTransitionStart` 设置 「时间轴」的活动项，因此就进入了循环引用、数据不同步等问题，另外这是自身切换后，再让另一个切换，即有先后顺序，并不是期望的同步。

# 设置位移 ❌

通过监听自身的位移，然后使用方法如 `setTranslate` 设置对方的位移等，在实操过程过，普通项之间还基本能实现，但是对于「循环」时，如【2024】-> 【2025】-> 【2015】，则是实现不了。

# 双向控制 ❌

查阅文档，发现 [双向控制](https://www.swiperjs.net/swiper-doc/controller.html) 这个功能很满足要求，也是进行了试验。

```js
const initSwiper = () => {
  if (!cardSwiperRef.current) return;
  const w = cardSwiperRef.current.clientWidth;
  const x = -w * 2;
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

发现当两个 `swiper` 的 `slidesPerView` 不相等的情况下，虽然能互相控制，但是「活动项」并不同步。文档中说明了 `by` 属性，明明是默认 `slide` ，即自身切换一项，被控制方也切换一项，但是实际就是不同步。

# 缩略图 ❌

再往下查文档，双向控制的例子是 **一对一**，那**多对一**的模式则是使用 [缩略图](https://www.swiperjs.net/swiper-doc/thumbs.html)，官网也是推荐使用这种模式。

但是在观察例子和实操过程中，发现这种方式并不是我所需要的。缩略图强调的是「激活项」同步，在点击缩略图时，缩略图并不会移动，拖动内容区时，缩略图也不会移动。同时拖动缩略图时，也不会激活某一项。

# 抓耳挠腮 ❓❓

说实话，我已经研究了好多天了，毫无头绪，上面几种是最突出的方式，另外还有其他瑕疵。

- `slidesPerView:7`时，原数据过少导致无法下一步；
- 开启「居中」时，左边或者右边空白等;

还有一些邪修做法，如使用最普通的模式，「时间轴」不居中，而内容区也是普通的，但是数据的顺序不同。

```js
const list1 = ["2018", "2019", "2020", "2021", "2022", "2023", "2024"];
const list2 = ["2020", "2021", "2022", "2023", "2024", "2018", "2019"];
```

在视图上让他们看起来是居中的，但是时间轴的激活项还是在左边第一个，但是弊端也多，需要做个假的激活项，让中间项高亮，另外第一个无法点击，点击其他的项无法滚动到中间等等。。。

😫😫😫 难道就到此为止了吗？？？？？

# 最后的方案 ✅

还是使用 `Controller` 这个模式，依然遵循 `slidesPerView` 相同的原则，不过有两个属性至关重要： `slidesOffsetBefore` 和 `slidesOffsetBefore`，[设定预设偏移量](https://www.swiperjs.net/swiper-doc/slides-offset-before.html)。

> 这是我不小心发现的

一样的结构，使用「居中」，对内容区使用偏移量的效果

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
    slidesOffsetBefore: 100, // 偏移量
    slidesOffsetAfter: 100, // 偏移量
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

<img src="/img/miniapp-mobile/js/swiper-demo.png" width="800" />

那如果偏移量足够大，把两边的内容都「挤走」，只留下中间的一项呢？？

通过调试后发现，可视数量是 `5` 张，两边的张数是 `2`，而当中间只有一张时（整个 swiper 的宽度），则需要偏移 **2 个 swiper 的宽度**。

```js
const initSwiper = () => {
  if (!cardSwiperRef.current) return;
  const w = cardSwiperRef.current.clientWidth; // 一个内容区的宽度
  const x = -w * 2; // 偏移量
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
  // ...其他代码
};
```

<video src="/img/miniapp-mobile/js/swiper-demo1.mp4" controls style="width: 100%; max-width: 800px;"></video>

> 说实话，这也算是「邪修」做法了，但至少能很好地实现需求。我查过很多社区，包括ai等，都找不到「官方正统」的做法...
>
> 那这种方式，不仅仅是在「时间轴」上，在一些「tab」切换内容区的需求上，也是能很好适用的。
