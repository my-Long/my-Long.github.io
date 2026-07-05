---
title: "Claude Code Writes the Demo, But the UI Is Ugly"
description: "How to stop Claude Code from generating functional-but-ugly demos by prompting for design quality upfront."
date: 2026-06-26 00:00:00 +0800
categories: [Essays]
tags: [claude-code, design]
---

「屠龙者终成恶龙」

以前在公司，boss 让我做一个页面，我会反问：布局是什么样的？主色用哪个？有没有设计图？不确定就做出来不太对，改起来很费劲。

现在身份反转了。我是 boss，Claude Code 是以前的我——正在接受一条模糊到离谱的 prompt。

---

### 毛坯房时代

最开始让 Claude Code 写活动中心页面，prompt 大概就是「帮我写一个活动中心页面」。出来的是毛坯房：有布局，有基本结构，配色是那种灰白加纯蓝的默认组合，按钮没有任何设计感。能跑，但完全不像个产品。

我当时想，是不是 prompt 不够具体？

### 加了 skill 也没好到哪去

顺着社区推荐，试了官方的 `frontend-design` skill。原理是 Claude Code 识别到「写页面」「创建组件」之类的指令，就会自动套这个 skill 来生成带设计的页面。

确实有变化，不再是纯毛坯了——但换了一种丑法。不是土豪金配色就是深邃蓝，要么清新绿。**有风格，但是那种让你一眼认出「这是 AI 生成的」的风格**。布局也很一般，感觉像是从某个通用模板库里随机 pick 了一个。

我去搜了一圈，想找更好的 UI skill 或者开源的设计规范，没找到什么有用的。搜索结果推荐的都是「用 Figma 画阿里风格的设计图」，然后再给 AI 看。

好，那就去找设计图。

### 试了一下 Claude Design

以前工作里接触 UI 设计就只有 Figma，自己写 demo 不会专门去画图。不过既然都试到这一步了，就去看看 Claude Design 是什么东西——在 web 版 Claude 里进入 design 页面就能用。

![claude_design](/images/claude_design1-light.png){: .light}
![claude_design](/images/claude_design1-dark.png){: .dark}
_Claude Design 设计页面_

体验比我预期的好。如果需求描述不够清晰，它会主动来问你：风格是什么？主题色？布局方向？这个交互反而把我自己也逼着想清楚了，而不是一股脑扔给它去猜。出来的设计比 skill 那套好不少，至少那个黑白简约的配色比什么土豪金好看多了。

### MCP 下线了，导出 HTML 凑合

有了设计图，下一步是怎么喂给 Claude Code。正常路线是通过 Share 导出，然后用 `Send to Claude Code` 把设计图引用进去——这需要在 Claude Code 里连接 Claude Design MCP 并授权。

但六月下旬去连的时候发现 MCP 已经下线了，授权页面直接给了提示。

![claude_design2](/images/claude_design2.png){: w='3156' h='1812' }
_MCP 下线_

没办法，只能退而求其次，把设计图导出成 HTML，再让 Claude Code 根据 HTML 来还原成真正的页面。麻烦了一步，但至少方向是对的。

最终的活动中心页面和活动抽奖页面：

![post-dragon](/images/post-dragon-activity-dark.png){: .w-50 .dark}
![post-dragon](/images/post-dragon-activity-light.png){: .w-50 .light}
_活动中心页面_

![post-dragon](/images/post-dragon-activity1-dark.png){: .w-50 .dark}
![post-dragon](/images/post-dragon-activity1-light.png){: .w-50 .light}
_活动抽奖页面_

比最开始的毛坯房好多了。

---

绕了一圈，发现问题的根源不是 Claude Code 能力不行，是我一开始就没想清楚要什么。以前作为开发，会逼着 boss 说清楚设计要求；现在自己做 demo，反而跳过了这一步直接往下冲，结果就是让 AI 去猜，猜出来当然是最安全、最无聊的那个答案。

先设计，再写代码——这不是什么新道理，只是之前不觉得 demo 值得这么做。
