---
layout: post
title: "Parameter Normalization"
subtitle: "How to normalize parameters"
author: "My"
header-style: text
tags:
  - Javascript
  - Skills
---

参数归一化（Parameter Normalization）是一种在处理数据时常用的技术，旨在将不同范围或不同单位的数据转换为一个统一的标准，使其在分析和建模时更加有效和一致。那在软件开发中如何实现参数归一化呢？

比如说有一个函数，功能很简单，把传入的一个日期进行格式化，返回一个字符串。

```js
/**
 * @description 格式化日期
 * @param {Date} date 日期
 * @param {string} formatter 格式化字符串
 * @param {boolean} isPad 是否补零
 */
function formate(date, formatter, isPad) {}
```

但是格式化的方式有很多，比如可能调用的方式有：

- 2023-7-10
  传入一个日期，我要得到的仅仅是一个日期
  ```js
  formate(new Date(), "date");
  ```
- 2023-7-10 8:00:30
  传入一个日期，我要得到的既有日期，又有时间
  ```js
  formate(new Date(), "datetime");
  ```
- 2023-07-10
  传入一个日期，我要得到的仅仅是一个日期，并且在前面补零。

  ```js
  formate(new Date(), "date", true);
  ```

- 2023-07-10 08:00:30
  传入一个日期，我要得到的既有日期，又有时间，并且在前面补零。

  ```js
  formate(new Date(), "datetime", true);
  ```

- 2023 年 7 月 10 日 13:12:35
  传入一个日期，我要得到的既有日期，又有时间，并且按照指定的格式进行格式化。

  ```js
  formate(new Date(), "yyyy年MM月dd日 HH:mm:ss");
  ```

- 2023 年 7 月 10 日 13:12:35
  传入一个日期和一个函数，函数对前面的日期进行定制格式化
  ```js
  formate(new Date("2023/7/10"), function (dateInfo) {
    const { year } = dateInfo;
    const thisYear = new Date().getFullYear();
    if (year < thisYear) {
      return `${thisYear - year}年前`;
    } else if (year > thisYear) {
      return `${year - thisYear}年后`;
    } else {
      return "今年";
    }
  });
  ```

`formatter` 参数的格式太多了，如果不处理的话，就需要做很多次判断，代码会变得很冗长，不利于维护。我们可以思考，有没有一种格式是涵盖了其他格式的，又可以很灵活地处理的呢？

很明显，函数，可以把其他的情况都转为函数的形式，这样就可以灵活地处理各种格式了。比如说第一种，是想返回一种格式的日期，那就可以这么处理：

```js
// 2023-7-10
function formate(new Date(), (dateInfo)=>{
  const {...} = dateInfo;
  return `xxx-x-xx`
})
```

同理，其他情况都可以转化为函数的形式，这样就可以灵活地处理各种格式了。因此，我们在函数内部使用一个方法，将所有的情况都转化为函数的形式，这就是「参数归一化」。

```js
/**
 * @description 参数归一化
 * @param {string | Function} formatter 格式化的内容
 * @param {boolean} isPad 是否补零
 * @returns {Function} 格式化函数
 */
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
  //处理字符串，比如"yyyy年MM月dd日 HH:mm:ss"，将对应位置的替换成具体的值
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

到此，参数归一化就完成了。在使用的过程中，传入一个格式化字符串，就可以得到一个格式化函数（上面的），然后就可以使用这个函数进行格式化了。

```js
function formate(date, formatter, isPad) {
  formatter = _formateNormalize(formatter); // 得到的格式化函数

  const dateInfo = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };

  // 字符串化
  dateInfo.yyyy = dateInfo.year.toString();
  dateInfo.MM = dateInfo.month.toString();
  dateInfo.dd = dateInfo.date.toString();
  dateInfo.HH = dateInfo.hours.toString();
  dateInfo.mm = dateInfo.minutes.toString();
  dateInfo.ss = dateInfo.seconds.toString();
  console.log("dateInfo", dateInfo);

  // 补零
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

  // 进行格式化
  return formatter(dateInfo);
}
```

到此，整个日期格式化函数就完成了。

