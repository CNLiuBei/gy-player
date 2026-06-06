// 构建脚本 — 用 esbuild 将所有模块打包压缩为单文件
// 产出：
// - dist/gy-player.js：ESM，可直接 <script type=module> 引入或 npm 使用
// - player/gy-player.js：线上稳定路径 /player/gy-player.js，供 800-web 引用

import { build } from 'esbuild';
import { readFileSync, mkdirSync, copyFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

await build({
    entryPoints: ['src/gy-player.js'],
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    outfile: 'dist/gy-player.js',
    banner: { js: `/* GY Player v${pkg.version} | MIT License | 自研轻量 HLS 播放器 */` },
    legalComments: 'none',
});

// 同时产出 IIFE 版（无模块系统环境直接用 <script src>）
await build({
    entryPoints: ['src/gy-player.js'],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    outfile: 'dist/gy-player.global.js',
    banner: { js: `/* GY Player v${pkg.version} | MIT License */` },
    legalComments: 'none',
});

console.log('构建完成：dist/gy-player.js (ESM) + dist/gy-player.global.js (IIFE)');

mkdirSync('player', { recursive: true });
copyFileSync('dist/gy-player.js', 'player/gy-player.js');
console.log('已发布到：player/gy-player.js（线上路径 /player/gy-player.js）');
