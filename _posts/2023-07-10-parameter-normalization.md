---
title: "Parameter Normalization Pattern"
description: "A pattern for handling flexible function parameters that accept both shorthand and full-form inputs."
date: 2023-07-10 00:00:00 +0800
categories: [JS, Base]
---

写一个日期格式化函数，第二个参数 `formatter` 想支持好几种传法：

```js
formate(new Date(), "date");              // 2023-7-10
formate(new Date(), "datetime");          // 2023-7-10 8:00:30
formate(new Date(), "date", true);        // 2023-07-10（补零）
formate(new Date(), "datetime", true);    // 2023-07-10 08:00:30（补零）
formate(new Date(), "yyyy年MM月dd日 HH:mm:ss");  // 自定义格式
formate(new Date("2023/7/10"), function(dateInfo) {  // 完全自定义逻辑
  const { year } = dateInfo;
  const thisYear = new Date().getFullYear();
  if (year < thisYear) return `${thisYear - year}年前`;
  if (year > thisYear) return `${year - thisYear}年后`;
  return "今年";
});
```

`formatter` 可以是字符串简写、自定义格式模板、或者一个函数。如果在函数内部把这几种情况全用 if/else 铺开处理，代码会很乱。

想了一下，有没有某种形式能涵盖所有情况？**函数可以。** 字符串简写 `"date"` 可以转成函数，自定义格式模板也可以转成函数，函数本身就是函数。如果先把所有传入的格式统一转成函数，再执行，后面的逻辑就不用管参数是什么形式进来的了。这就是「参数归一化」：在函数入口把各种形式收敛成一种内部表示。

转换逻辑放在独立的 `_formateNormalize` 里：

```js
function _formateNormalize(formatter) {
  if (typeof formatter === "function") {
    return formatter;
  }
  if (typeof formatter !== "string") {
    return new TypeError("formatter must be a string or a function");
  }

  if (formatter === "date") {
    formatter = "yyyy-MM-dd";
  }
  if (formatter === "datetime") {
    formatter = "yyyy-MM-dd HH:mm:ss";
  }

  // 字符串模板转函数：把 yyyy、MM 等占位符替换成实际值
  function formatFun(dateInfo) {
    const { yyyy, MM, dd, HH, mm, ss } = dateInfo;
    return formatter
      .replaceAll("yyyy", yyyy)
      .replaceAll("MM", MM)
      .replaceAll("dd", dd)
      .replaceAll("HH", HH)
      .replaceAll("mm", mm)
      .replaceAll("ss", ss);
  }
  return formatFun;
}
```

主函数入口先调归一化，拿到统一的函数形式，后面只跟这一种形式打交道：

```js
function formate(date, formatter, isPad) {
  formatter = _formateNormalize(formatter);

  const dateInfo = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };

  dateInfo.yyyy = dateInfo.year.toString();
  dateInfo.MM = dateInfo.month.toString();
  dateInfo.dd = dateInfo.date.toString();
  dateInfo.HH = dateInfo.hours.toString();
  dateInfo.mm = dateInfo.minutes.toString();
  dateInfo.ss = dateInfo.seconds.toString();

  function pad(prop, len) {
    dateInfo[prop] = dateInfo[prop].padStart(len, "0");
  }
  if (isPad) {
    pad("yyyy", 4);
    pad("MM", 2);
    pad("dd", 2);
    pad("HH", 2);
    pad("mm", 2);
    pad("ss", 2);
  }

  return formatter(dateInfo);
}
```

`computed` 的参数处理也是同样的思路——它可以接收函数或者对象 `{ get, set }`，入口先归一化成 getter/setter，后面只用 getter 就行，不再管外面传进来的是什么形式。
