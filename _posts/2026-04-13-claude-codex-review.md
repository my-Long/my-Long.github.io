---
title: "Claude vs Codex: A Practical Comparison"
description: "A hands-on comparison of Claude and Codex from real usage experience, covering coding assistance, context handling, and workflow integration."
date: 2026-04-12 14:00:00 +0800
categories: [Essays]
tags: [ai, claude, codex]
---

> 在出租屋里看着电视，突然想到 Claude 这个工具，而且大家谈它，正好在使用中，那就来简单聊聊...

2025 年一整年，我都在用 `ChatGPT`，刷 `YouTube`、刷 `X`，但对 `Claude` 和 `Codex` 的发展几乎一无所知。直到 2026 年过年，才开始认真关注这两个工具。

最开始试的是 `VS Code` 里的 `Codex` 插件，直观感受就两个字：「很慢」。经常卡住，用了几次就放弃了。

后来通过「中转」接触到 `Claude`，当时价格还便宜，也是走 `VS Code` 插件，感觉是真的打开了新世界的大门——那种兴奋感，我记得很清楚。

## 用 SKILL 把重复任务变成一句话的过程

那段时间中转价格还算合理，一次简单会话也就几分钱。我主要结合 `SKILL` 做了三类重复性任务，用下来觉得非常顺手。

**项目启动。** 我们的 `h5` 项目是多页面应用，每个目录是一个独立页面，启动时需要在配置文件里手动指定 `entryWork`，比如 `entryWork: home`。我把目录映射关系写进 `SKILL`，之后只需要说一句「启动首页」，`Claude` 就会读取对应的 `skill`，找到目录，执行脚本。

**打包部署**也是类似的路子。以前的流程很繁琐：手动打包，把 `css`、`js` 等静态资源扔进一个 `SVN` 目录，把 `html` 扔到另一个目录，再手动更新、提交。后来把这套流程也交给 `SKILL` 处理，输入「打包部署 首页」，剩下的它全包了。

**单位格式化**是用下来感受最明显的场景。小程序里标签用 `view`、`text`，但我习惯在 `VS Code` 里先写 `div`、`span`，写完再替换；`Figma` 设计稿是 `375px` 基准，而小程序要用 `rpx`。以前每次都要单独开窗口，一个文件一个文件地下指令。定义好 `skill` 之后，开发完直接说「单位格式化」，相关文件一起处理掉，省了大量来回。

## 中转涨价，切到 Codex

用了一段时间，中转开始涨价，实在顶不住，就转向了 `Codex`。

`Codex` 也有 `skill`，但更多是官方预设的技巧，不是我这种「自定义规范」式的能力，所以这部分在我这里优势不大。用了一个多月下来，最直观的感受是人机交互更自由——它可以读取项目里的 `.md` 文件，然后根据要求执行命令，整个过程更像直接跟工具对话，而不是跟一个有 persona 的 AI 打交道。

但有几个地方一直让我不满意。历史记录是混在一起的，不管在哪个项目里打开 `Codex`，看到的都是所有项目的沟通记录，而不只是当前项目的。终端里的文本格式也比 `Claude` 差很多：表格渲染不出来，文字容易挤成一团，代码没有高亮。还有一个偶发问题——编辑文件时会把中文弄成乱码，不知道是不是我这边才有。

## 两个工具的差异，我怎么看

如果不只停留在感受，正经拆开来比一比：

**对话体验**上，两边都能正常接住问题、展开追问，但 `Claude` 的回答结构更分明，读起来更像整理过的结果；`Codex` 更倾向「直接干活」，信息够用，但呈现层面没那么舒服。

**代码能力**上，我觉得各有偏向。`Codex` 在逻辑链路、工程化问题上更稳，`Claude` 在 UI 相关任务上更讨喜，处理页面文案和布局细节时，输出更容易让我觉得「像那么回事」。但这里有个很现实的问题：`Claude` 的 `skill` 能力要发挥出来，最好用它自己的模型；换成第三方模型，很多时候并不会稳定地读 `skill`，那套优势就明显打折了。`Codex` 的问题则是另一面——它能做，但规则必须限制得更死。不然约束不够明确，它就容易开始自由发挥。

**准确性**上，说实话两边差距没那么大，都不是可以让我完全不复查的工具。`Codex` 贴着项目上下文做事时更稳一点；`Claude` 在表达和整理上更强，但有时候也会因为太会「组织语言」——看起来很对，实际上还是要再核对一下。两边都「能用，但都不能盲信」。

**效率**这件事，要分阶段看。一旦 `Claude` 的 `SKILL` 配好了，很多重复任务直接调用现成流程，不用一句句地临时下指令，整体效率很高。`Codex` 更像「边聊边做」，上手很直接，但面对高频可模板化的任务时，我还是会觉得 `Claude` 那套更省力。

**上手门槛**上，我反而会把票投给 `Codex`。直接打开就能用，不需要先折腾 `skill`、命令、规则这些东西。`Claude` 是「前期多投入，后期提效率」的路线——需要先把 skill、命令、规则这些 setup 好。如果只是「拿来就用」，`Codex` 更容易进入状态；如果是长期深度使用，`Claude` 的想象空间更大。

## 转盘抽奖 Demo

光靠主观感受说不清楚，我又补了一个简单 demo 做横向对比。翻出几年前的一道面试题——做一个「转盘抽奖」功能，顺手拿它来看看两边的表现。

![lottery_img.jpeg](/images/lottery_img.jpeg){: .shadow .rounded-10 w='300' }

测试环境：`Claude` 用中转的 `Sonnet 4.6`，`Codex` 用 `OpenAI` 的 `GPT-5.4`，两边都是新建目录，目录里只有一张参考图，另外补了一个简单的 `prd.md` 说明页面内容和交互要求。不是在现成项目里做增量修改，而是看它们从零 build 一个小页面时各自怎么完成任务。

`Codex` 大概 1 分钟就完成了，终端格式如下：

![codex1.png](/images/codex1-light.png){: .macos w='884' h='412' .light }
![codex1-dark](/images/codex1-dark.png){: .macos  w='884' h='412' .dark }

只生成一个 `index.html`，倒计时结束后通过条件渲染展示表单：

![codex2.png](/images/codex2-light.png){: .shadow .rounded-10 w='300' .light }
![codex2-dark](/images/codex2-dark.png){: .shadow .rounded-10 w='300' .dark }

![codex3.png](/images/codex3-light.png){: .shadow .rounded-10 w='300' .light }
![codex3-dark](/images/codex3-dark.png){: .shadow .rounded-10 w='300' .dark }

有两个小问题：表单页一开始无法滚动，是我提醒之后才补上的；验证码的提示弹窗出现在页面下方，交互细节不太自然。整体风格是先快速做出来，iterate 着改。

`Claude` 花了大概 8 分钟，终端格式如下：

![claude1.png](/images/claude1-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![claude1-dark](/images/claude1-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

按要求生成了两个页面，`index.html` 和 `form.html`，倒计时结束后跳转到 `form.html`：

![claude2.png](/images/claude2-light.png){: .shadow .rounded-10 w='300' .light }
![claude2-dark](/images/claude2-dark.png){: .shadow .rounded-10 w='300' .dark }

![claude3.png](/images/claude3-light.png){: .shadow .rounded-10 w='300' .light }
![claude3-dark](/images/claude3-dark.png){: .shadow .rounded-10 w='300' .dark }

页面和逻辑上没发现明显缺陷，基本符合需求。

**两边都没有真正去解析参考图，UI 都是自己重新 design 了一版。** `Codex` 更快，偏向把逻辑和页面直接落下来；`Claude` 更慢，但 UI 表现更好，文件结构也更符合我的预期。某种程度上可以理解为，`Claude` 在这类任务里更愿意多花时间组织结果。

当然，这里用的是中转版 `Sonnet 4.6`，不排除有降智的可能，正版效果理论上会更好一些。

## 用不起

说到底，我放弃 `Claude` 的核心原因还是钱。

现在 `OpenRouter` 里还有一点余额，偶尔用来解释某些方法时会开 `Claude`，但模型就不选 `Sonnet` 了，真的太贵。下面这个例子，只是一个很简单的需求——「创建加入我们页面，暂时添加一些示例内容」，然后读取 `skill`，执行对应命令：

![post_claude_vscode.png](/images/post_claude_vscode-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![post_claude_vscode-dark](/images/post_claude_vscode-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }

几个文件，每个文件百行左右，就消耗了七块钱左右：

![post_openrouter_cost.png](/images/post_openrouter_cost-light.png){: .shadow .rounded-10 w='884' h='412' .light }
![post_openrouter_cost.png](/images/post_openrouter_cost-dark.png){: .shadow .rounded-10 w='884' h='412' .dark }


用不起。还是老老实实用 `Codex`。

但心里还是一直很向往 `Claude`。

> 之前就因为支付方式、网络等一大堆问题，还担心封号，所以迟迟没有开通订阅。本来打算这个月用完 `Codex` 之后就订阅的，但又来了 `KYC` 这一出，真的是麻了......

> 我还想心存一下侥幸心理，开个 `Pro` 看看会不会被封......
