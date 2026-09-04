---
title: "Injecting Environment Variables Into The Browser"
description: "Comparing build-time and runtime strategies for getting server-side environment variables safely into client-side JavaScript."
date: 2026-07-08 00:00:00 +0800
categories: [JS, Engineering]
tags: [Tools,web,chrome-extension,thinking]
---

我好像爱上了浏览器插件，之前就开发了一个给图片加边框的 [PicBorder](https://my-long.github.io/posts/picborder-chrome-extension) 插件，后面还为了方便上传图片到静态资源服务器，也开发了插件。现在又着手开发插件了......

事情回到 h5项目的架构过程，以往接触的项目中，在开发环境或者联调时，是通过浏览器插件，修改 Header 的cookie 来实现用户登录的，而本次项目用的是 Authorization 进行验证，当然也可以通过修改 Header 来实现，不过文档中还需要 os、lang、deviceId、secret加密后的sign参数等，这种情况下，单单注入header就不太行了，至少 sign 是没办法注入的......  那 APP 是通过 window 注入这些变量，那在开发的时候，能不能也通过window注入变量呢，手动注入比较麻烦，那利用浏览器插件是不是可行.....

试了一下最直接的思路：content script 里直接塞一段 `<script>window.__AUTH_CONFIG__ = {...}</script>` 插进页面，本地跑起来，一切正常。切到测试环境域名上，直接被 CSP 拦了，Console 里一堆红色的 `Refused to execute inline script because it violates the following Content Security Policy directive`。也是，App 能往 WebView 里注入变量，是因为它是 native 层在管这个页面；浏览器插件再怎么"外挂"，跑起来还是页面里的一段脚本，页面自己的 CSP 规矩它躲不掉。

放弃插 `<script>` 标签这条路。想起 Manifest V3 里 content script 是分"世界"（world）的：默认跑在 isolated world，能拿到 `chrome.storage`，但摸不到页面真实的 `window`；想改页面自己的 `window`，得显式声明 `world: 'MAIN'`，这样才跟页面脚本共享同一个全局对象——但主世界里又没法直接读 `chrome.storage`，extension API 在那边不可用。两头占不全，只能想办法让这两个世界互相"传话"。

最后选的办法是拿 DOM 当中间人：isolated world 的脚本读完 `chrome.storage`，把值挑出来序列化，写进 `document.documentElement` 上一个自定义属性；main world 的脚本用 `MutationObserver` 盯着这个属性，一发现变化就读出来 `JSON.parse`，赋给 `window.__AUTH_CONFIG__`。全程没插入任何一行 `<script>`，DOM 属性变更不算"执行脚本"，CSP 的 `script-src` 自然管不着。

```js
// content-inject.js —— isolated world，能读 chrome.storage，摸不到真实 window
;(async () => {
  const { config } = await chrome.storage.local.get('config')
  if (!config) return

  const payload = {}
  for (const [field, entry] of Object.entries(config)) {
    const value = entry?.value?.trim?.() ?? entry?.value
    if (entry?.enabled && value) payload[field] = value
  }

  document.documentElement.setAttribute('data-bridge-config', JSON.stringify(payload))
})()
```

```js
// inject-main.js —— world: 'MAIN'，共享页面真实 window，读不到 chrome.storage
;(() => {
  const ATTR = 'data-bridge-config'
  const root = document.documentElement

  function apply() {
    const raw = root.getAttribute(ATTR)
    if (!raw) return
    try {
      window.__AUTH_CONFIG__ = JSON.parse(raw)
    } catch {}
  }

  apply()
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: [ATTR] })
})()
```

两个脚本用固定 id（`bridge-isolated` / `bridge-main`）通过 `chrome.scripting.registerContentScripts` 常驻注册，`matches` 就是插件面板里维护的一份站点 filter 数组；`runAt: 'document_start'`、`allFrames: true`、`persistAcrossSessions: true` 全开着，尽量赶在页面自己的脚本跑之前把值挂上去，浏览器重启也不用重新配置一遍。不过后来翻项目里 `@heya/request` 的 `getBridgeAuthConfig` 才发现，`token`/`sign` 这些字段都是懒执行的 getter，请求真正发出去那一刻才会读 `window.__AUTH_CONFIG__`，所以注入时机其实没我一开始想得那么紧张，`document_start` 更多是图一个保险。

权限声明这块也纠结了一阵。想让插件在任意站点都能加进 filter，又不想每加一个站点就弹一次授权框，最省事的办法是 manifest 里直接写 `host_permissions: ["<all_urls>"]`——但一个能读写所有网站的插件，看着就很不安。后来想通了：权限只是"有没有能力"，真正"会不会往这个页面塞东西"完全由代码里自己维护的 `filters` 数组说了算，不在这份 match pattern 列表里的站点，两个 content script 压根不会被注册进去。`<all_urls>` 换来的只是"加站点时不用反复弹权限确认框"的方便，实际生效范围还是收得很窄。这是我第一次真切意识到，manifest 里的权限声明和运行时的行为是两层东西，看一个插件危不危险，不能只看它声明了什么权限，还得看代码怎么用这份权限。

secret 这种敏感字段就没让它离开过 `chrome.storage` 半步——插件本身也写死了不发布到应用商店，只在本地加载已解压的扩展程序用；配置是长期存着的，不会因为刷新页面就清空（这是特意做的，图的是调试体验），代价是用完得自己养成把 checkbox 取消勾选的习惯，不然一份鉴权信息会一直摊在本地存储里。

回头看，这东西说到底就是给 h5 项目搭了一层"假的 App WebView"：以前联调鉴权得指望 App 同事帮忙配一个能跑通签名的包，现在本地开发环境里开个插件面板，填上 token、lang、deviceId、secret，勾上 checkbox，刷新页面就能让请求库以为自己正跑在真的 App 里。会不会有更"正规"的做法，比如让 mock server 直接顶掉 sign 校验？大概率有，但这插件写起来成本低、改起来也快，先能用起来再说——工程上很多时候要的不是最优解，是现在就能跑起来的那个。
