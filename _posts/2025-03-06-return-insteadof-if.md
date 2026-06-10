---
title: "Replace If-Else with Early Return"
description: "How to simplify nested conditionals using early return and Map structures for cleaner, more readable code."
date: 2025-03-06 00:00:00 +0800
categories: [JS, Base]
tags: [map]
---

> 思路来源于 [CodeQi《告别 "if-else"，改用 "return"！》](https://juejin.cn/post/7431120645981831194?searchId=2025042917553729760CF8F6E31D61A892)

死去的记忆突然刺痛我——想起以前有个同事特别喜欢 `v-else` 嵌套，我在版本迭代修 bug 的时候顺手把那段逻辑改了。项目负责人看到直接反对，说不理解，不相信我的写法是对的。

原来的嵌套大概是这样：

```javascript
if (this.packageInfo.havePackage) {
  if (!this.hasDeposit && this.packageInfo.residueDay > 0) {
    type = 1;
  } else if (!this.hasDeposit && this.packageInfo.residueDay == 0) {
    if (this.packageInfo.residueHours > 0) {
      type = 1;
    } else {
      type = 4;
    }
  } else {
    type = 2;
  }
} else {
  type = 4;
}
```

光是读这段，逻辑就已经绕起来了。梳理一下：

- 没买过套餐 → 4
- 买过套餐，有押金 → 2
- 买过套餐，没押金，有剩余天数 → 1
- 买过套餐，没押金，天数为 0 但有剩余小时 → 1
- 其余 → 4

条件其实没几个，但嵌套把它们搅在一起，每个分支都要记清楚自己在第几层。

用提前 return 改写，把条件打散排开：

```javascript
formatType(packageInfo) {
  if (!packageInfo.havePackage) return 4;
  if (this.hasDeposit) return 2;
  if (packageInfo.residueDay > 0) return 1;
  if (packageInfo.residueHours > 0) return 1;
  return 4;
},
```

每个 `if` 只管一件事：满足就 return，不满足就继续往下走，最后兜底 return 4。读起来是线性的，不需要追踪当前在哪层 `else` 里。

负责人当时的意见是：没有需求文档，他读这段代码读了半天，不确定逻辑对不对。我能理解——嵌套版本虽然乱，但每个分支的意图写得很「显式」，改完之后更简洁，对没见过这种写法的人来说，反而要花时间重新建立映射关系。

说到底是习惯问题。见过提前 return 的人会觉得这很自然，没见过的人第一眼确实会愣一下。
