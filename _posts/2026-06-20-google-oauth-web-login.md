---
title: "Google OAuth Login Integration for Web Apps"
description: "Covers how to implement Google Sign-In on the web using the Google Identity Services SDK, including token handling and backend verification."
date: 2026-06-20 00:00:00 +0800
categories: [React]
tags: [google, oauth, web]
---

最近刷了几个 AI 工具的网站，sign in 页面基本都有那个 Google 按钮——四色的 G，点一下跳转，回来就登录好了。看着看着突然想起来，之前做海外 web 的时候也接过这个东西，折腾了一下午。

趁这个机会重新写一个demo复习一下。

---

**先去 Google Cloud 把配置搞定**

接 Google 登录，代码之前得先去 [Google Cloud Console](https://console.cloud.google.com/) 创建项目、配置 OAuth 客户端 ID——这步跳不过。

填写应用信息，名称随意。

![google-login1](/images/post-google-login1-light.png){: .light}
![google-login1](/images/post-google-login1-dark.png){: .dark}
_填写应用信息_

![google-login2](/images/post-google-login2-light.png){: .light}
![google-login2](/images/post-google-login2-dark.png){: .dark}
_确认信息_

然后创建 OAuth 客户端，类型选「Web 应用」。

![google-login3](/images/post-google-login3-light.png){: .light}
![google-login3](/images/post-google-login3-dark.png){: .dark}
_创建 OAuth 客户端_

这里有两个地址要填。第一个是「已授权的 JavaScript 来源」，填你的页面 URL。

![google-login4](/images/post-google-login4-light.png){: .light}
![google-login4](/images/post-google-login4-dark.png){: .dark}
_填写页面 URL_

第二个是「已授权的重定向 URI」——Google 授权完之后把用户送回来的地址。**这个地址必须和后面代码里的 `redirect_uri` 一个字符都不差**，多个斜杠、少个路径都会直接报错，我在这里卡了挺久。

![google-login5](/images/post-google-login5-light.png){: .light}
![google-login5](/images/post-google-login5-dark.png){: .dark}
_登录后的重定向地址_

创建完拿到 `Client ID`，放进环境变量，后面要用。

---

**两种 flow，选哪个**

Google OAuth 有两种方式，一种是 implicit flow，直接在前端拿到 `access_token`；另一种是 authorization code flow，前端只拿到一个临时的 `code`，再由后端去换 token。

implicit flow 看起来简单，但 access_token 直接暴露在前端，而且没办法 refresh，用户关掉页面重新来就得重新登录。海外产品大多还是选 auth-code flow，安全性好一些，后端拿到 token 之后可以自己管理 session。

这里用的是 `@react-oauth/google`，`useGoogleLogin` 直接支持配 `flow`：

```ts
const login = useGoogleLogin({
  flow: "auth-code",
  ux_mode: "redirect",
  redirect_uri: `${window.location.origin}${window.location.pathname}`,
});
```

`ux_mode` 选 `redirect` 而不是 `popup`，原因很简单——popup 在移动端经常被拦截，redirect 更稳。`redirect_uri` 就填上面 Console 里配的那个地址，保持一致。

---

**回调回来之后**

用户授权完，Google 会把页面重定向回来，URL 上带着一个 `code` 参数。这个 code 是一次性的，用完就失效，所以拿到之后要立刻发给后端换 token。

但在发请求之前，有一步很容易漏掉——**先把 URL 里的 code 清掉**。不清的话，用户刷新页面会再触发一次登录流程，code 已经失效，请求会报错。

```ts
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return;

  // 先清 URL，再发请求
  window.history.replaceState({}, "", window.location.pathname);

  fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "google", code }),
  })
    .then((res) => res.json())
    .then((data: { token: string }) => {
      localStorage.setItem("auth_token", data.token);
      onLogin();
    })
    .catch(() => setError("登录失败，请重试"));
}, [onLogin]);
```

后端拿到 `code` 之后，去调 Google 的 token 接口换回 `access_token` 和用户信息，再生成自己的 session token 返回给前端。前端存到 localStorage，后续请求带上就行。

> 本地开发有个很迷惑的坑：code 发给后端，后端去换 token，一直报网络错误，前端看起来没问题，后端日志也没说清楚。折腾了一会儿才反应过来——Node.js 没走代理，连不上 Google 的服务器。开了代理立刻好了。
>
> ![google-login6](/images/post-google-login6-light.png){: .light}
> ![google-login6](/images/post-google-login6-dark.png){: .dark}

---

**闪烁问题**

还有一个小细节。页面加载时，需要先读 localStorage 判断是否已经登录——但这个读取是异步的（useEffect 在 render 之后才跑），如果直接用 `isAuthenticated` 的初始值 `false` 来渲染，会先闪一下登录页，再切到正常内容。

加一个 `checking` 状态，读完之前什么都不渲染：

```ts
const [checking, setChecking] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("auth_token");
  if (token) setIsAuthenticated(true);
  setChecking(false);
}, []);

if (checking) return null;
```

`return null` 比渲染一个空壳 loading 好——不会有布局跳动，用户感知不到。

---

流程本身不难理解，难的是这些不写在文档里的细节——redirect_uri 差一个字符就报错、code 不及时清会重复提交、首屏不处理会闪。踩过一遍倒也还好，下次再接就顺了。
