# Vite 快速使用指南

## ✅ 已完成配置

Vite 已成功配置，可以编译 LESS 到 CSS。

## 🚀 常用命令

```bash
# 编译 LESS → CSS（生产环境）
npm run build

# 监听 LESS 变化自动编译（开发时使用）
npm run watch:css

# 启动 Jekyll 服务器
npm start
```

## 📝 修改样式的工作流程

```bash
# 1. 修改 LESS 源文件
vim less/hux-blog.less

# 2. 编译为 CSS
npm run build

# 3. 提交更改
git add css/hux-blog.css less/
git commit -m "更新样式"
git push
```

## 📁 重要文件

| 文件/目录 | 说明 |
|----------|------|
| `less/hux-blog.less` | LESS 源文件（修改这里） |
| `css/hux-blog.css` | Vite 生成的 CSS（自动创建） |
| `css/hux-blog.min.css` | 旧版 Grunt 生成的 CSS |
| `vite.config.js` | Vite 配置文件 |

## ⚠️ 注意事项

### 关于 CSS 压缩版本

目前你的网站引用的是 `hux-blog.min.css`（Grunt 生成的压缩版）。

**如果你想切换到 Vite 版本：**

需要修改 `_includes/head.html`，将：
```html
<link rel="stylesheet" href="/css/hux-blog.min.css">
```

改为：
```html
<link rel="stylesheet" href="/css/hux-blog.css">
```

### 不切换也可以

你可以继续使用 `hux-blog.min.css`，Vite 配置作为备用。当你需要修改样式时再切换。

## 🆘 故障排除

### 问题 1：构建报错 "less not found"

**解决：**
```bash
npm install
```

### 问题 2：样式没有生效

**检查：**
1. `npm run build` 是否成功
2. `css/hux-blog.css` 是否生成
3. HTML 中引用的路径是否正确

### 问题 3：热更新不工作

**解决：**
- 确保使用现代浏览器
- 检查浏览器控制台是否有 WebSocket 错误
- 尝试刷新页面或重启 `npm run watch:css`

## 📚 延伸阅读

- [Vite 官方文档](https://vitejs.dev/)
- [LESS 官方文档](https://lesscss.org/)

---

**配置完成！** 🎉

现在你可以使用 Vite 替代 Grunt 来编译 LESS 文件了。
