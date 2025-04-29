---
layout: post
title: "告别 「if-else」"
subtitle: "告别 「if-else」，使用 「return」，让你的代码更简洁"
author: "My"
header-style: text
tags:
  - Javascript
---

> 思路来源于 [CodeQi《告别 "if-else"，改用 "return"！》](https://juejin.cn/post/7431120645981831194?searchId=2025042917553729760CF8F6E31D61A892)

死去的记忆突然刺痛我！ 想起来以前的同事也使用 `v-else` 嵌套，我在版本迭代，修复了一些 bug 时，就把这段「逻辑」给处理了。当时项目负责人还反对我修改，或者说不相信我的写法。

### 原先的 `if-else` 写法

```javascript
if (this.packageInfo.havePackage) {
  // havePackage：是否 有买过套餐
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

先梳理一下这段代码的业务逻辑：

- 如果有买过套餐
  - 如果没有押金，且剩余天数大于 0，则为 1;
  - 如果没有押金，且剩余天数等于 0，剩余小时数大于 0，则为 1;
  - 如果没有押金，且剩余天数等于 0，剩余小时数不大于 0，则为 4;
  - 如果有押金，则为 2;
- 如果没有买过套餐，则为 4;

对于这个逻辑，别说这个嵌套了，就业务逻辑来说，我都有点理不清楚。

### 新的 `return` 写法

封装一个函数，对于各种状态进行提前返回。

```javascript
formatType(packageInfo) {
      if (!packageInfo.havePackage) return 4;
      if (this.hasDeposit) return 2;
      if (packageInfo.residueDay > 0) return 1;
      if (packageInfo.residueHours > 0) return 1;
      return 4;
    },
```

就这样的写法，我觉得更简洁，如果符合，则 `return`，不符合则一直往下走，直到 `return 4`。

这已经是涵盖上面的业务逻辑了，当然负责人还是有点「不理解」。因为没有需求文档，他读这段代码读了半天。
