// 构建脚本 — 用 esbuild 将所有模块打包压缩为单文件
// 产出：
// - dist/gy-player.js：ESM，R2 发布源（cdn.guangying.org/static/player/gy-player.js）
// - dist/gy-player.global.js：IIFE，无模块系统环境

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

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
