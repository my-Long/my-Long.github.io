import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// 确保 src 目录和入口文件存在
const srcDir = resolve(process.cwd(), 'src');
const entryFile = resolve(srcDir, 'main.js');
const entryContent = `import '../less/hux-blog.less';`;

if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}
if (!fs.existsSync(entryFile)) {
  fs.writeFileSync(entryFile, entryContent);
}

// 自定义插件：复制 CSS 到 css/ 目录
function copyCssPlugin() {
  return {
    name: 'copy-css',
    writeBundle(options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && chunk.type === 'asset') {
          const sourcePath = resolve(options.dir, fileName);
          const targetPath = resolve(process.cwd(), 'css', 'hux-blog.css');

          if (!fs.existsSync(resolve(process.cwd(), 'css'))) {
            fs.mkdirSync(resolve(process.cwd(), 'css'), { recursive: true });
          }

          fs.copyFileSync(sourcePath, targetPath);
          console.log(`✓ CSS built: css/hux-blog.css`);
        }
      }
    }
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: entryFile,
      output: {
        entryFileNames: 'dist/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'dist/css/[name][extname]';
          }
          return 'dist/assets/[name][extname]';
        },
      },
    },
    outDir: '.',
    emptyOutDir: false,
    cssMinify: false,
    sourcemap: false,
  },
  css: {
    preprocessorOptions: {
      less: {
        math: 'always',
        paths: [resolve(__dirname, 'less')],
      },
    },
  },
  plugins: [copyCssPlugin()],
});
