---
title: "Replacing Colors in Images at the Pixel Level"
description: "How to programmatically replace specific colors in an image and output the result as a new file, using Canvas or Node.js image libraries."
date: 2026-06-13 00:00:00 +0800
categories: [JS]
tags: [image, canvas]
---

最近一直在复习，准备面试之类的，偶然打开了我之前的博客，鬼使神差或兴致来潮地想升级（换个主题），于是就升级了。现在的主题是支持 「白天/黑夜」模式的，而图片是准备两份，但是我以前的博客的图片大都是白天主题，所以想着怎么把图片中的颜色优化....

不知天高地厚的我直接让 Claude 根据图片生成 「暗色」 主题的图片 ———— 我本应该想到的，Claude 并没有这么智能 ———— 不知道色值的映射关系。所以这个还是 UI 语义层与程序层的问题。在我们的网页主题中，我们是手动进行配色，一种主题对应一种配色方案，但是这里处理图片时，「程序」并不知道应该改为什么颜色。

回顾之前的操作...

### 第一次直接修改

图片生成了，但是配色乱七八糟，色彩文字（红、绿、蓝、紫...）都变了，甚至文字边缘出现了描边。其实我只想「色彩」内容保持不变，而 白-灰-黑 这些颜色自动调整，奈何缺少颜色、图形这方面的知识，所以根本无法进行描述。

> 这时候才知道 数字图像处理 是多么重要了

我把关注点放在色彩文字描边问题上（就算背景处理完美，文字描边没处理，也是不合格）

opus 4.8，把五小时的额度都快耗完了，描边问题还是解决不了，甚至整张图片出现大面积白、大面积灰的情况，直接宣告失败，我 &^\*#.%...

### 第二次修改

算了，我无法修建地基，那就踩在别人的肩膀上。

通过ai查了，推荐了几个库，如

-  [pinetools](https://pinetools.com/). 最直接的功能就是使用 `invert` 命令，实现图片的反色处理。

-  [photopea](https://www.photopea.com/). 提供了在线的图片处理功能(类PS)，包括反色处理。

-  [imagemagick](https://www.imagemagick.org/). 提供了命令行的图片处理功能，16.7 Star。


整体分析下来，反差色把所有的颜色都反了（文字没有描边了），直接 pass 。 在线编辑图片，也许能解决这个问题，但是需要手动调整，太麻烦了，pass。

最后选择使用 `imagemagick` 来处理图片。

命令行工具，先安装 `imagemagick`。

```bash
brew install imagemagick
```

然后交给 Claude 写一个简单的脚本，实现图片的反色处理（我又忽略了一个问题，imagemagick需要明确的颜色替换关系），所以就想着维护手动维护一张颜色映射表：

```json
{
  "lightToDark": [
    { "from": "#000000", "to": "#E8E8E8" },
    { "from": "#9AA5BB", "to": "#E8E8E8" },
    { "from": "#ffffff", "to": "#202124" },
    { "from": "#F0F0FE", "to": "#E7E7E8" },
    { "from": "#FBFBFC", "to": "#292A2D" },
    { "from": "#E4E4E7", "to": "#E4E4E7" },
    { "from": "#E7E7E8", "to": "#393939" },
    { "from": "#E4E4E7", "to": "#E4E4E7" },
    { "from": "#F0F0F3", "to": "#393939" },
    { "from": "#FAFAFA", "to": "#21222C" }
  ],
  "darkToLight": [
    { "from": "#40EAEC", "to": "#FDEAEC", "fuzz": 25 },
    { "from": "#000000", "to": "#FAFAFA" },
    { "from": "#21222C", "to": "#F7F8FA" },
    { "from": "#353746", "to": "#F3F3F3" },
    { "from": "#282A36", "to": "#F3F3F3" },
    { "from": "#FFFFFF", "to": "#1A1A1A" }
  ]
}
```

是的，我依然是天真的，这手动添加得处理到什么时候，能不能根据某个色值区间，自动处理呢？ `RGB` 三原色哪个对应哪个都不知道，怎么自动处理？黑-灰-白 在 `RGB` 中的区间是？

搞到后面依然是面目全非... 文字描边、大面积颜色映射错误依然存在

### 第三次修改，从ps的到灵感

我还是手痒去操作了 [photopea](https://www.photopea.com/) ，还是走反差的路线... (其实我不满意的就是大黑色背景)

导入图片后，点击 <kbd>图像</kbd> -> <kbd>调整</kbd> -> <kbd>反相</kbd>，即可实现反差处理，也就是 `invert(1)` 命令。

再将色彩文字恢复，点击 <kbd>图像</kbd> -> <kbd>调整</kbd> -> <kbd>色相/饱和度/亮度</kbd>，把 「色相」 拉到 180，即可实现色彩文字恢复。

最后一步再让 imagemagick 将主背景换个色，基本上就完成了。


通过指定的图片，输出处理后的图片。将 `xxxx.png` 生成 `xxxx-dark.png` 暗色模式。

```bash
./theme xxxx.png dark
```

这篇文章以前的图片都是用这个方法处理的，博客中的图片都存在于 [blog-assets](https://github.com/my-Long/blog-assets)，而脚本也在项目里。


### 还是写个GUI方便使用吧

然后吭哧吭哧地写了个项目，实现图片的反色处理，简单的图形界面。一般简单的 「文字+背景」 图片是可以处理的，如果图片色彩太多了，那还是不行的。

![recolor-light.png](/images/renderings-light.png){: w='3156' h='1812' .light }
![recolor-dark.png](/images/renderings-dark.png){: w='3156' h='1812' .dark }
_图片颜色修改界面_