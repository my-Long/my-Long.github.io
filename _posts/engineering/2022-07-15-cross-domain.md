---
layout: post
title: "Cross-domain"
subtitle: "What is cross-domain and how to solve it?"
author: "My"
header-style: text
tags:
  - javascript
  - 基础
---

## 前言

「跨域」是个基础又严重的问题，但是在现代前端开发中，并没有多少人真正意识到它的存在。比如 `Vue` 项目，脚手架搭建起来后，配置了几个参数，就可以正常使用了。至于为什么能正常使用，里面有没有跨域问题，就没有深入的去了解过，甚至什么是跨域，都很难说清楚。

```javascript
  <script>
    fetch('https://pvp.qq.com/web201605/js/herolist.json').then(res=>res.json).then(done=>{
      console.log('done',done);
    })
  </script>
```

![image.png](/img/js/post-content-cross.png)

这就是很典型的「跨域」问题。

## 同源策略和跨域问题

「同源策略」是一套浏览器安全机制，当一个源的文档和脚本，与另一个源的资源进行通讯时，同源策略就会对这个通信做出不同程度的限制。

简单来说，「同源策略」是对同源资源放行，对异源资源限制。因此限制造成的开发问题，称之为**跨域（异源）问题**。

### 同源和异源

「源(origin) = 协议（schema）+ 域名（domain）+ 端口（port）」。

### 跨域出现的场景

跨域可能出现在以下三种场景：

- 网络通信
  a 元素的跳转；加载 css、js、图片等；AJAX 等。

- 脚本操作
  window.open()、ifram.contentWindow（）、WebSocket 等等。

- 存储
  WebStorage、IndexedDB 等。

对于不同的跨域场景，以及每个场景中的不同跨域方式，同源策略都有不同的限制。

### 网络中的跨域

当浏览器运行页面后，会发现很多的网络请求，例如 css、js、图片、Ajax 等等。请求页面的源称之为「页面源」，在该页面中发起的请求称之为「目标源」。当「页面源」与「目标源」一致时，则为同源请求，否则为**异源请求（跨域请求）**。

### 浏览器如何限制异源的请求

浏览器出于多方面的考量，制定了非常繁杂的规则来限制各种跨域请求，但总体的原则非常简单：

- 对标签发出的跨域请求轻微限制
- 对脚本发出的跨域请求严格限制
- 对不同源的请求，浏览器会做出不同的限制策略

![image.png](/img/js/post-content-cross2.png)

## 跨域解决方案

### CORS（Cross-Origin Resource Sharing）

CORS（Cross-Origin Resource Sharing）是一种机制，它使用额外的 HTTP 头来告诉浏览器，让运行在一个 origin (domain) 上的 Web 应用被允许访问来自不同源服务器上的指定的资源。

它是正统的跨域解决方案，同时也是浏览器推荐的解决方案。

![image.png](/img/js/post-content-cross3.png)

**使用 CORS 解决跨域，必须要保证服务器是「自己人」**

> 只要服务器明确表示允许，则校验通过。
>
> 服务器明确拒绝或没有表示，则校验不通过。

CORS 将请求分为两类：「简单请求」和「预检请求」，对不同种类的请求它的规则有所区别。

#### 简单请求

> 具体的判定规则，请参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CORS#%E7%AE%80%E5%8D%95%E8%AF%B7%E6%B1%82)。

总结起来就两点：

- 请求方法：只限于 GET、HEAD、POST。

- 头部字段满足 CORS 安全规范，详见 [W3C](https://fetch.spec.whatwg.org/#cors-safelisted-request-header)。浏览器默认自带的头部字段都是满足安全规范的，只要开发者不改动和新增头部，就不会打破此条规则。

- 如果有 `Content-Type`，必须是 `application/x-www-form-urlencoded、multipart/form-data、text/plain` 其中一个。

符合简单请求的请求，浏览器会直接发出请求，不用发起预检请求。

![image.png](/img/js/post-content-cross4.png)

> 浏览器会把这个「源」发给服务器，说 hi，bro，你看这个人有点头脑简单，没啥威胁，要不就让他过了吧。服务器说这个人确实头脑简单，我给你发个通行证，你对一下，如果是他就放他进来吧。

> 通行证：Access-Control-Allow-Origin:源

#### 预检请求

预检请求是为了更精细化地控制跨域请求，比如请求方法、头部字段等。

不是「简单请求」的，就属于「预检请求」。

![image.png](/img/js/post-content-cross5.png)

> 预检请求时，我们可以这么理解：浏览器发现你这个人偷偷摸摸，贼眉鼠眼，一股匪气，因此不会电话联系服务器，而是直接把你拦在外面。意识到事情可能很严重，于是亲自到服务器那里去确定，表明这个人穿着怎么样，举止怎么样，样貌如何。服务器经过严格地评定，如果允许通过，就返回通行证，通行证里包含着那个人的所有信息，如衣服颜色，身高，戴不戴眼镜，还有通行证的有效期。
>
> 但是如果在有效期内，那个人上个厕所回来，把眼镜摘掉了，那对不起，虽然是同个人，但是当前信息不符合通行证上的规定，不给过！

- 关于 cookie

  默认情况下，Ajax 的跨域请求并不会附带 cookie，这样一来，某些需要权限的操作就无法进行。不过可以通过简单的配置就可以实现附带 cookie。

  ```javascript
  // xhr
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;
  // fetch api
  fetch(url, {
    credentials: "include",
  });
  ```

  这样一来，该跨域的 Ajax 请求就是一个附带身份凭证的请求。当一个请求需要附带 cookie 时，无论它是简单请求，还是预检请求，都会在请求头中添加 cookie 字段。而服务器响应时，需要明确告知客户端：服务器允许这样的凭据。告知的方式也非常的简单，只需要在响应头中添加：`Access-Control-Allow-Credentials: true` 即可。

  对于一个附带身份凭证的请求，若服务器没有明确告知，浏览器仍然视为跨域被拒绝。 另外要特别注意的是：对于附带身份凭证的请求，服务器不得设置 `Access-Control-Allow-Origin：*`。这就是不推荐使用 `*` 的原因。

- 关于跨域获取响应头

  在跨域访问时，JS 只能拿到一些最基本的响应头，如：Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma，如果要访问其他头，则需要服务器设置本响应头。

  `Access-Control-Expose-Headers` 让服务器把允许浏览器访问的「响应头」放入白名单，例如：

  ```javascript
  Access-Control-Expose-Headers: authorization, a, b
  ```

  这样 JS 就可以通过 `xhr.getResponseHeader()` 或 `fetch().headers.get()` 访问这些响应头。

### JSONP（JSON with Padding）

在很久很久以前...并没有 CORS 方案。
![image.png](/img/js/post-content-cross6.png)

没有规则，Ajax 无法工作，只能用 JSONP。

JSONP（JSON with Padding）是一种利用 `<script>` 标签的跨域请求。它通过 `<script>` 标签的 `src` 属性，向服务器请求数据，服务器把数据放在一个回调函数的参数中返回，这样就可以在不影响页面的情况下，获取服务器端的数据。

![image.png](/img/js/post-content-cross7.png)

`JSONP` 的使用格式：

```javascript
   <script>
      function callback(res){
        console.log('来自服务器的响应：',res);
      }
    </script>

    <script src="http://localhost:9527/jsonp"></script>

```

封装请求函数：

```javascript
function request(url) {
  return new Promise((resolve, reject) => {
    const reName = `_c_${Math.random().toString(32)}_${Date.now()}`; //函数名，防止重名

    window[reName] = function (res) {
      delete window[reName]; //删除属性
      script.remove();
      resolve(res);
    };

    const script = document.createElement("script");
    script.src = `${url}?callback=${reName}`; //将名字传给服务器
    document.body.appendChild(script);
  });
}
```

虽然使用 JSONP 可以解决问题，但 JSONP 有着明显的缺陷：

- 仅能使用 GET 请求。
- 只能请求文本格式的数据。
- 容易产生安全隐患。恶意攻击者可能利用 `callback=恶意函数` 的方式实现 XSS 攻击。
- 容易被非法站点恶意调用。

因此，除非是某些特殊的原因，否则永远不应该使用 JSONP。现代前端开发中，更推荐使用 CORS 方案。

### 代理

CORS 和 JSONP 均要求服务器是「自己人」，如果不是，可以使用「代理」方案。

这是一个普通的请求，因为是异源，因此会产生跨域问题。
![image.png](/img/js/post-content-cross8.png)

我们可以找一个中间人做「代理」。注意跨域请求时可以发送的，只不过是在响应的时候被拦住了。

![image.png](/img/js/post-content-cross9.png)

```javascript
// proxy
app.get("/hero", async (req, res) => {
  const axios = require("axios");
  const resp = await axios.get("https://pvp.qq.com/web201605/js/herolist.json");

  // 使用CORS解决对代理服务器的跨域
  res.header("access-control-allow-origin", "*");
  res.send(resp.data);
});
```

## 方案的选择

开发的目的是为了上线，所以要对标「生产环境」，如果「生产环境」有问题，「开发环境」再怎么顺利都没有意义。

因此，跨域的方案要保持在「开发环境」和「生产环境」是一致的。

![image.png](/img/js/post-content-cross10.png)

所以一切标准从 「生产环境」出发。

- 生产环境**跨域**
  ![image.png](/img/js/post-content-cross11.png)

  图片、js、页面等静态资源放到了「静态资源服务器」，通过 a.com 去访问静态资源服务器，所以页面源是 a.com。另一个是「数据服务器」，后端接口资源就在这个服务器，所以请求源是 b.com。源不同，产生跨域，所以只能选择 JSONP 或者 CORS 。

  生产环境使用 CORS，开发环境也得使用 CORS，不过这种模式似乎不是很常见。

  总的来说，只要用到了 CORS，那就是后端问题，他不解决那就打一架，打完了还得他解决。

- 生产环境**没有跨域**
  ![image.png](/img/js/post-content-cross12.png)

  前端打包后，把 dist 包给运维，运维放到服务器的某个目录下。后端打包后，也把包给运维，运维启动一个服务器。这种情况，浏览器不能直接访问到静态目录或者测试服务器，需要启动 web 服务，一般使用 Nginx 反向代理。浏览器访问时，使用同一个源访问这个 Nginx，只是 path 不一样。这时 path 有个标识，如果是以 api 开头的，就连到测试服务器。如果没有 api 开头，那就访问静态资源。

  在开发环境中，也有一个服务器 ———— `dev-server`。这时我们访问页面 localhost:8080/index，而数据在 192.168.0.14。此时可以利用 `dev-server` 做代理，通过向 `dev-server`发请求。在发 Ajax 请求时，拼接 api 前缀，这时 `dev-server` 就可以去向测试服务发请求。

代理是最常用的跨域方案。

### Vue 的代理

配置目标源，

```javascript
// 本地联调
const proxyAPI = "http://172.16.1.218";
const proxyAPI = "http://192.168.0.14";
const proxyAPI = "http://172.16.1.121";
```

配置代理，

```javascript
 devServer: {
    proxy: {
      '/api': {
        target: proxyAPI + ':16000',
        changeOrigin: true
      }
    },
  },

```

### React 的代理

使用 `http-proxy-middleware` 自定义代理配置，在 `src` 目录下创建 `proxy.js` 文件，用于配置代理。

```javascript
// proxy.js

const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://192.168.0.14:5000", // 目标服务器地址
      changeOrigin: true,
      pathRewrite: { "^/api": "" }, // 如果你想移除 `/api` 前缀
    })
  );
};
```

## 后话

在公司中有一种这样的场景，后端是微服务，使用了统一的文件存储服务。就比如说有表格的文件下载，那前端通过参数请求，后端返回一个在线的链接地址，前端通过这个链接地址去下载文件。

但是，源不同，前端的请求是跨域的。

之前的同事的方法是这样：

```javascript
export function downloadFile(url, fileName) {
  let x = new XMLHttpRequest();
  x.open("GET", url + "?t=" + new Date().getTime(), true);
  x.responseType = "blob";
  x.onload = function () {
    let url = window.URL.createObjectURL(x.response);
    let a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
  };
  x.send();
}
```

url 是异源的（即不同源的 URL），使用 XMLHttpRequest 发起请求会触发 跨域限制，除非服务器允许跨域请求。跨域请求会检查 CORS 头，如果服务器没有正确设置 CORS 头，浏览器会阻止请求，并抛出跨域错误。

发生跨域错误是预期的事，因此就这个问题还和后端「友好的沟通」了。最终是让后端将文件所在的服务器配置 CORS 头，允许前端域名访问。

（偷偷说一下，后面仔细研究了这个下载文件的方法，发现毛病太多）。

在一个交易列表中，我尝试一下下载文件，发现点击了，却毫无反应，下载的弹窗一直不出现，后面发现 Ajax 请求会影响文件下载。

> XMLHttpRequest 会将整个文件加载到内存中作为 blob 对象。如果文件很大，这会占用大量内存。window.URL.createObjectURL 会创建一个临时的本地 URL，供浏览器访问 blob 对象。浏览器需要分配内存并将 blob 转换为本地 URL，这个过程对大文件可能很耗时，导致下载弹窗延迟或无响应。

**解决方法**

直接通过 `<a>` 标签的 href 指向 URL 进行下载，这种方法不会在内存中加载整个文件，适合大文件下载。浏览器直接将文件流处理为下载，不受内存限制和跨域问题影响。

```javascript
export function downloadFile(url) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank"; // 防止拦截
  a.download = "";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
```
