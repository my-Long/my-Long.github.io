---
title: "webpack optimization"
date: 2022-07-18 00:00:00 +0800
categories: [JS, Engineering]
tags: [optimization]
---

## 前言

对于前端性能优化，大致可以分为「浏览器部分」和「代码部分」。其中代码部分又可以分为「构建优化」和「代码优化」。「代码优化」理解起来就是代码的规范了，比如减少无用的注释，减少代码的复杂度，使用更高效的算法，删除无用的文件和代码等等。「构建优化」则是指 webpack 的配置优化，比如减少 bundle 大小，提升构建速度，使用更好的压缩算法等等。

本文将介绍 webpack 优化的一些常用方法。

## 构建优化

在构建方面，webpack 太强大了，涉及的知识点很多，这里只介绍一些常用的优化方法。大致可以分为「时间的优化」和「空间的优化」。

### 时间的优化

这个优化主要是针对构建时间的，通过一些配置和规则，减少构建的时间，提升构建速度。

#### 缩小构建范围

在使用加载器 loader 的时候，可以只加载需要的资源，缩小文件的搜索范围，减少构建的时间。如依赖包 `node_modules` 的体积非常大，可以将其排除在外。

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.(|ts|tsx|js|jsx)$/, // 只解析 src 文件夹下的 ts、tsx、js、jsx 文件
        include: path.resolve(__dirname, "../src"), // include 可以是数组，表示多个文件夹下的模块都要解析
        use: ["thread-loader", "babel-loader"],
        exclude: /node_modules/, //表示 loader 解析时不会编译这部分文件，也可以是数组
      },
    ],
  },
};
```

#### 拓展名

也可以叫做「文件后缀」。我们在使用 `import` 导入文件时，一般是 `import Home from './Home'`，其中 `Home` 是一个 `.vue` 文件，而 `./Home` 只是一个文件夹，但是这种写法能被识别，是因为在 webpack 里进行了配置，导致 webpack 能识别 `.vue` 文件。

```javascript
module.exports = {
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
};
```

如果项目中没有指定扩展名，webpack 会依次尝试解析 `.js`、`.jsx`、`.ts`、`.tsx` 文件，直到找到匹配的模块。

这样配置后，如果你有一个 App.tsx 文件，可以直接这样导入：

```javascript
import App from "./App"; // Webpack 会自动尝试解析为 './App.tsx'
```

这些尝试解析会耗费时间，虽然导入文件的时候方便了，但是在一定程度上影响了构建速度。因此，最好是在引入文件的时候能**指定扩展名**，webpack 的配置用来兜底。

#### 别名

这一项很多开发者已经使用炉火纯青了，甚至当新项目中没有这个功能时，都会抱怨不方便。

`resolve.alias` 用于创建模块路径的别名，可以为特定路径配置简写，简化模块导入路径，并提高可读性和维护性。

```javascript
module.exports = {
  resolve: {
    alias: {
      "@": path.join(__dirname, "src"), // @ 表示 src 文件夹
      "@assets": path.join(__dirname, "src/assets"), // @assets 表示 src/assets 文件夹
    },
  },
};

// 引入 src 下的某个模块时
import XXX from "@/xxx/xxx.tsx";
```

在性能上，`resolve.alias` 大致有以下几种优点：

- 减少文件查找和解析时间

  当 Webpack 解析模块时，通常会根据配置的 `resolve.extensions` 和 `resolve.modules`（如 node_modules）逐层查找文件。使用 `alias` 时，Webpack 可以直接定位到指定的路径，从而跳过递归查找过程，加快模块解析速度。

- 减少路径的计算和拼接

  使用相对路径（如 ../../../utils/helper）时，Webpack 需要根据模块的相对位置不断计算最终的文件路径。`resolve.alias` 提供绝对路径，可以减少这部分计算开销。

- 优化大型项目的构建

  在大型项目中，模块和路径的复杂度更高。通过 `alias` 设置常用路径，Webpack 在构建过程中不必每次从根目录查找，能够减少重复的解析过程，从而在一定程度上提升构建性能。

#### 缓存

缓存是 webpack 构建过程中的一个重要优化点。通过缓存，webpack 可以避免重复构建相同的模块，从而加快构建速度。

webpack 提供了 `cache` 配置项，可以开启缓存功能。

```javascript
module.exports = {
  cache: {
    type: "filesystem", // 缓存类型，默认是 memory，可选 filesystem
    cacheDirectory: path.resolve(__dirname, "node_modules/.cache/webpack"), // 缓存目录
    store: "pack", // 缓存压缩类型，默认是 pack，可选 memory
  },
};
```

`cache.type: "filesystem"`：指定缓存类型为文件系统（filesystem），将缓存内容存储到磁盘上。这比默认的内存缓存（memory）更持久，适合在多次构建之间保持缓存，减少构建时间。

`cache.cacheDirectory`：指定缓存存储的具体路径。

`cache.store: "pack"`：指定缓存的压缩类型。`pack` 会对缓存进行打包和压缩，可以减小缓存体积。

#### 定向查找第三方模块

其实 Webpack 已经默认开启了 `resolve.modules` 配置项，默认情况下，Webpack 会在 `node_modules` 文件夹下查找第三方模块。但是，在依赖较多的大型项目中，为了加快构建速度，可以显式指定 `resolve.modules`，减少不必要的路径查找。

```javascript
const path = require("path");

module.exports = {
  resolve: {
    modules: [path.resolve(__dirname, "node_modules")],
  },
};
```

还可以指定其他文件夹，

```javascript
const path = require("path");

module.exports = {
  resolve: {
    modules: [path.resolve(__dirname, "src"), "node_modules"],
  },
};
```

在 `src` 下一般都有一个 `components` 文件夹，存放公共组件。resolver 会优先查找 `src/components` 文件夹，再查找 `node_modules` 文件夹。

### 空间的优化

空间优化主要是针对构建后的文件体积的，通过一些配置和规则，减少文件体积，提升加载速度。

#### 压缩

主要是针对 JavaScript 、 CSS 文件和图片的压缩。

- JavaScript 压缩

  Webpack5 内置了 `terser-webpack-plugin` 插件，可以对 JavaScript 代码进行压缩。这个配置已经是默认开启了，当然也可以手动配置。

  ```javascript
  const TerserPlugin = require("terser-webpack-plugin");
  module.exports = {
    mode: "production",
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
            mangle: true,
            output: {
              comments: false,
            },
          },
          parallel: true,
        }),
      ],
    },
  };
  ```

- CSS 压缩

  我们项目一般是使用 `Sass`，但最终还是会编译为 `CSS`。在 Webpack 配置文件中，使用 `sass-loader` 编译 `Sass` 文件，使用 `mini-css-extract-plugin` 提取 `CSS` 文件，并使用 `css-minimizer-webpack-plugin` 压缩 `CSS`。

  ```javascript
  const MiniCssExtractPlugin = require("mini-css-extract-plugin");
  const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

  module.exports = {
    mode: "production",
    module: {
      rules: [
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            "sass-loader",
          ],
        },
      ],
    },
    optimization: {
      minimizer: [
        `...`,
        new CssMinimizerPlugin(),
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
    ],
  };
  ```

- 图片压缩

  在 Webpack 配置文件中，使用 `image-minimizer-webpack-plugin` 并配置具体的图像压缩选项。

  ```javascript
  const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

  module.exports = {
    mode: "production",
    optimization: {
      minimizer: [
        new ImageMinimizerPlugin({
          minimizerOptions: {
            plugins: [
              ["mozjpeg", { quality: 75 }],
              ["pngquant", { quality: [0.65, 0.8] }],
              ["svgo"],
            ],
          },
        }),
      ],
    },
  };
  ```

#### 按需加载

按需加载是一种常见的优化方式，即在运行时动态加载模块。Webpack 提供了 `import()` 语法，可以实现按需加载。

```javascript
const List = lazyComponent("list", () =>
  import(/* webpackChunkName: "list" */ "@/pages/list")
);
```

比如以上的 `/* webpackChunkName: "list" */`，很多人就理解不对。如果是删除了这个注释，确实是能实现了「按需加载」，即每个模块会单独打包成一个文件，文件名是随机的，比如 `src_pages_list_js.chunk.js`。而如果使用了这个注释，那打包的文件就会使用 `list` 作为文件名，比如 `list.js`。

但是会存在这么一种情况，开发者在写新的路由时，向下复制以求方便，导致了后面的路由都使用了同一个注释，即文件名相同，打包的时候会把相同的 `webpackChunkName` 打包成一个文件，导致文件体积过大。

```javascript
const List = lazyComponent("list", () =>
  import(/* webpackChunkName: "list" */ "@/pages/list")
);
const Edit = lazyComponent("edit", () =>
  import(/* webpackChunkName: "list" */ "@/pages/edit")
);
```

如上面的路由信息，在访问 `list` 页面时，还会加载 `edit` 模块。

另外有这么一种情况，当我在 `list` 页面时，这时候页面空闲了，可不可以趁这个时间加载 `edit` 页面？答案是可以的。可以使用 `webpackPrefetch`，它会在浏览器空闲时，提前加载 `edit` 页面的资源。

```javascript
const Edit = lazyComponent("edit", () =>
  import(
    /* webpackChunkName: "edit" */ /* webpackPrefetch: true*/ "@/pages/edit"
  )
);
```

#### 代码分割

代码分割是 webpack 最强大的功能之一，它可以将代码分割成多个 bundle，然后按需加载。比如我们在不同页面都用了 `element ui` 的 `table` 组件，然而我们组件是按需加载的，在访问不同组件时，都会重复地加载 `element ui` 的 `table` 组件。所以我们可以这么设想，把一些第三方或者公共的模块拆分成 `chunk`，在访问页面的时候就可以使用浏览器缓存，减少请求次数。

webpack 里面通过 `splitChunks` 来分割代码。

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: "async",
      minSize: 20000,
      minRemainingSize: 0,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      enforceSizeThreshold: 50000,
      cacheGroups: {
        defaultVendors: {
          test: /[\/]node_modules[\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        utilVendors: {
          test: /[\/]utils[\/]/,
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

#### Tree Shaking

Tree Shaking 是 webpack 4.x 版本之后引入的新特性，它可以自动删除没有使用的代码，减少 bundle 体积。Tree Shaking 适用于 ES6 模块导出形式（如 export 和 import），因为这些模块的导出是静态的、可以在编译时分析的。webpack 5 已经默认开启了 Tree Shaking，不需要额外配置。

设置 `usedExports`，可以更细致地控制优化效果。

```javascript
module.exports = {
  optimization: {
    usedExports: true,
  },
};
```

为了确保 Tree Shaking 生效，需要满足以下条件：

- 只对 ESM 生效
- 只能是静态声明和引用的 ES6 模块，不能是动态引入和声明的。
- 只能处理模块级别，不能处理函数级别的冗余。
- 只能处理 JS 相关冗余代码，不能处理 CSS 冗余代码。

```javascript
// utils.js
export function method1() {
  /* ... */
}
export function method2() {
  /* ... */
}
```

如果在其他文件中仅引用了 `method1`，打包工具（如 Webpack）会知道 `method2` 未被使用，因此可以通过 Tree Shaking 将 `method2` 从打包结果中移除。

有时 CSS 里也有很多未使用的代码，我们可以使用 `purgecss-webpack-plugin` 来自动清除未使用的 CSS 代码。

```javascript
const PurgeCSSPlugin = require("purgecss-webpack-plugin");
const glob = require("glob");
const path = require("path");

const PATHS = {
  src: path.join(__dirname, "src"),
};

module.exports = {
  plugins: [
    new PurgeCSSPlugin({
      paths: glob.sync(`${PATHS.src}/**/*`, { nodir: true }),
      safelist: ["whitelisted-class"],
    }),
  ],
};
```

#### gzip 压缩

Webpack 可以通过 compression-webpack-plugin 插件来实现 Gzip 压缩。在构建时，Webpack 会生成压缩后的 .gz 文件，部署到服务器后可以直接提供 Gzip 文件给客户端。

```javascript
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  plugins: [
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
  ],
};
```

#### 作用域提升

`Scope Hoisting`（作用域提升）是一种优化 `JavaScript` 打包的技术，用于减小打包后的代码体积并提升执行性能。Webpack 在 `production` 模式下启用的 `Module Concatenation Plugin` 就是实现 `Scope Hoisting` 的一种方式。

`Scope Hoisting` 去掉不必要的函数包装后，打包文件变得更小。减少了作用域查找的层级，减少了闭包调用，有助于提高执行性能。

Webpack 4 及以后版本在生产模式下默认启用 `Module Concatenation Plugin`，从而支持 `Scope Hoisting`。当然也可以手动配置。

```javascript
const webpack = require("webpack");

module.exports = {
  mode: "production",
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};
```

`Scope Hoisting` 主要对小模块有效，如果模块非常大或依赖复杂，`Scope Hoisting` 可能无法生效。而且还是只对 `import` 和 `export` 语法有效。所以这部分是内置的一个优化，了解就可以了，遇到合适的场景，它就生效。
