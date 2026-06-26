---
title: "The Gap Between Description and Execution"
description: "Explores why describing a plan feels like progress but often substitutes for the harder work of actually doing it."
date: 2026-06-16 00:00:00 +0800
categories: [Essays]
tags: [thinking, execution, reflection]
---


写表单校验的时候，我一直觉得有什么地方不对劲，但说不清楚。

字段多了之后，`validateForm` 就开始无限膨胀。`name` 要判断，`age` 要判断，`hobby` 要判断——每加一个字段，就往里面多塞一个 `if`：

```ts
const validateForm = (formData) => {
  if (!formData.name) {
    return "请输入姓名";
  }
  if (!formData.age) {
    return "请输入年龄";
  }
  if (!formData.hobby) {
    return "请选择爱好";
  }
  return true;
};
```

功能上没毛病。但哪里不对劲呢？我后来想明白了——**这段代码把「规则是什么」和「怎么执行校验」混在一起写了**。`age` 是必填这件事，是一条规则；但去对象里取值、判断是否为空，是执行动作。两件事搅在一起，规则就没法复用，也没法扩展。

比如我想给 `age` 再加一条「必须是数字、不能超过三位」——只能继续往 `if` 块里堆。这就是症结。

---

想清楚这一点之后，我突然觉得这个问题和函数本身的逻辑很像。**函数定义是描述，函数调用是执行。** 描述说的是"做什么"，执行才是真正在做。两件事要分开，才有复用的可能。

element-plus 的表单校验就是这个思路——先声明 `rules` 对象，这是描述；组件内部的校验器去跑这些规则，这是执行。两件事分得很清楚。

那能不能自己也这么搞？

---

**先把规则描述出来**

最简单的版本，写一个函数，接受字段名，返回一个描述对象：

```ts
const getValidationRules = (field) => {
  return {
    field: field,
    type: "notEmpty",
  };
};
```

调用三次，就得到三条规则描述：

```ts
[
  getValidationRules("name"),
  getValidationRules("age"),
  getValidationRules("hobby"),
]

// 得到：
// [
//   { field: "name", type: "notEmpty" },
//   { field: "age",  type: "notEmpty" },
//   { field: "hobby", type: "notEmpty" },
// ]
```

这些对象什么都不做，就是描述。后面交给真正的校验器去跑。描述和执行，干净地分开了。

---

**但一个字段只能有一条规则，还是不够用**

`age` 可能要同时满足：必填、是数字、不超过三位。一个 `type` 字段放不下。

这时候就需要让描述支持「链式追加规则」。用闭包把规则列表收起来，每个方法往里 push 一条，最后 `exec()` 一次性吐出来：

```ts
const field = (name) => {
  const rules = []

  const api = {
    notEmpty() {
      rules.push({ type: 'notEmpty' })
      return api
    },

    minLength(len) {
      rules.push({ type: 'minLength', len })
      return api
    },

    exec() {
      return { field: name, rules }
    }
  }

  return api
}
```

关键是每个方法都 `return api`，这样才能一直链下去。`exec()` 不再链，它是真正的出口——把攒好的描述吐出来，交给执行层。

用起来就是这个感觉：

```ts
const rules = field("name").notEmpty().minLength(3).exec();

// { field: 'name', rules: [{ type: 'notEmpty' }, { type: 'minLength', len: 3 }] }
```

整个表单的规则集中声明，清晰很多：

```ts
const rules = [
  field("name").notEmpty().minLength(6).exec(),
  field("age").notEmpty().minLength(3).exec(),
  field("hobby").notEmpty().exec(),
]

// [
//   { field: 'name', rules: [{ type: 'notEmpty' }, { type: 'minLength', len: 6 }] },
//   { field: 'age',  rules: [{ type: 'notEmpty' }, { type: 'minLength', len: 3 }] },
//   { field: 'hobby', rules: [{ type: 'notEmpty' }] }
// ]
```

这一坨描述本身不会报错，不会弹提示，什么都不做——它只是数据。后面传给校验器，才真正跑起来。

---

「描述」和「执行」分开，其实就是把"规则是什么"从"怎么跑规则"里剥离出来。前者可以随意组合、复用、扩展，后者只负责按规则办事。一旦想清楚这个边界，很多写起来越堆越乱的逻辑，其实都可以用这个思路重新拆一遍。
