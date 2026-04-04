#!/usr/bin/env node

/**
 * 博客启动脚本 - 美化 Jekyll 启动输出
 */

const { spawn } = require('child_process');
const net = require('net');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function printBanner() {
  console.log(`
${colors.bright}${colors.cyan}┌──────────────────────────────────────────────┐${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}              🚀 启动 Jekyll 博客               ${colors.bright}${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}└──────────────────────────────────────────────┘${colors.reset}
`);
}

function printServerInfo(host, port) {
  const localUrl = `http://${host}:${port}`;
  const boxWidth = 48;
  const line1 = '✓ 博客已启动！';
  const line2 = `本地地址: ${localUrl}`;

  console.log(`
${colors.bright}${colors.green}╔${'═'.repeat(boxWidth)}╗${colors.reset}
${colors.bright}${colors.green}║${colors.reset}  ${colors.bright}${line1.padEnd(boxWidth - 2)}${colors.reset}${colors.bright}${colors.green}║${colors.reset}
${colors.bright}${colors.green}╠${'═'.repeat(boxWidth)}╣${colors.reset}
${colors.bright}${colors.green}║${colors.reset}  ${colors.cyan}➜${colors.reset}  ${line2.padEnd(boxWidth - 6)}${colors.bright}${colors.green}║${colors.reset}
${colors.bright}${colors.green}╚${'═'.repeat(boxWidth)}╝${colors.reset}
${colors.dim}按 Ctrl+C 停止服务${colors.reset}
`);
}

function logInfo(msg) {
  console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (port < startPort + 100) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
    port++;
  }
  throw new Error('无法找到可用端口');
}

async function main() {
  printBanner();

  const port = await findAvailablePort(4000);
  const host = '127.0.0.1';

  if (port !== 4000) {
    logInfo(`端口 4000 被占用，自动使用端口 ${port}`);
  }

  logInfo('正在启动 Jekyll 服务...');

  const jekyll = spawn('bundle', ['exec', 'jekyll', 'serve', '--host', host, '--port', String(port)], {
    stdio: 'pipe',
  });

  let serverStarted = false;

  jekyll.stdout.on('data', (data) => {
    const output = data.toString();

    if (output.includes('Server address') || output.includes('Serving')) {
      if (!serverStarted) {
        serverStarted = true;
        printServerInfo(host, port);
      }
    }
  });

  jekyll.stderr.on('data', (data) => {
    const output = data.toString();
    const lowerOutput = output.toLowerCase();

    if (lowerOutput.includes('error') || lowerOutput.includes('fatal')) {
      logError(output.trim());
    }
  });

  jekyll.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`
${colors.red}服务异常退出，退出码: ${code}${colors.reset}
`);
    }
    process.exit(code || 0);
  });

  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}正在停止服务...${colors.reset}`);
    jekyll.kill('SIGTERM');
  });
}

main().catch((err) => {
  logError(err.message);
  process.exit(1);
});
