# GY Player

极致轻量的自研 Web 播放器，专为 HLS / CMAF 设计，零框架，发布到 R2 CDN（`cdn.guangying.org`）。

> 完整对接 API 参考见 **[API.md](./API.md)**。

## 特性

- **体积极小**：UI 皮肤打包后 **14 KB gzip**，含全部交互逻辑
- **引擎按需加载**：MP4 直链走原生（**零额外依赖**），HLS/DASH 才动态加载 Shaka Player
- **零框架**：原生 Web Component + Shadow DOM，样式隔离，可嵌入任意页面
- **无 rAF 轮询**：只监听原生 `video` 事件更新 UI，CPU 占用低

## 功能

| 分类 | 能力 |
|------|------|
| 播放控制 | 播放/暂停、进度拖拽、缓冲显示、续播记忆、错误重试（带上限+指数退避）、首屏加载态、海报封面 |
| 音画 | 音量滑条/滚轮/静音、倍速（0.5x~3x）、多码率画质切换、外挂字幕、多音轨 |
| 视图 | 全屏、画中画（PiP）、锁屏、沉浸式自动隐藏控件、迷你进度条 |
| 桌面快捷键 | 空格/K 播放、←→ 快进退、↑↓ 音量、F 全屏、M 静音、P 画中画、`<` `>` 倍速、0-9 跳转 |
| 移动手势 | 单击暂停、双击两侧快进退（涟漪反馈）、横滑进度、竖滑亮度/音量（可视指示条）、长按 2 倍速 |
| 移动适配 | 安全区避让（刘海/圆角）、全屏自动横屏、底部抽屉式菜单/选集、加大触摸命中区、首次手势引导 |
| 系统集成 | Media Session（锁屏/耳机媒体控制）|

## 快速使用

### 直接用 ES 模块

```html
<gy-player src="https://example.com/video.m3u8" title="标题" poster="封面图.jpg" autoplay></gy-player>
<script type="module" src="./dist/gy-player.js"></script>
```

### 用 JS 控制

```js
import './dist/gy-player.js';

const player = document.querySelector('gy-player');
player.loadStream('https://example.com/video.m3u8', {
    title: '第一集',
    videoId: 'ep-1',            // 用于续播记忆
    startTime: 320,             // 可选：从指定秒数起播（跨设备续播，覆盖本地记忆）
    disableStorage: false,      // 可选：true 则关闭内置 localStorage，由前端自管进度
    subtitles: [
        { url: '/subs/zh.vtt', lang: 'zh', label: '中文', default: true },
    ],
});

// 剧集联动
player.showNextButton(true);
player.addEventListener('next', () => loadNextEpisode());
player.addEventListener('ended', (e) => markWatched(e.detail.videoId));
player.addEventListener('back', () => history.back());
```

### 接管续播 / 跨设备同步 / 观看历史（业务侧）

播放器内置 localStorage 续播开箱即用（单机）。若要做**登录后跨设备续播**或**首页"继续观看"**，
由前端通过事件接管：播放器负责「记录与恢复位置」，前端负责「存哪、怎么同步」。

```js
// 1) 关闭内置存储，避免与服务端双写
// 2) 监听 progress 事件，节流（默认每 5s）上报服务端
player.addEventListener('progress', (e) => {
    const { videoId, currentTime, duration, percent, final } = e.detail;
    syncToServer(videoId, currentTime);   // 业务：写服务端
    // final=true 表示这是关闭/卸载时的最终上报
});

// 3) 下次播放时，把服务端进度通过 startTime 传入（跨设备续播）
const serverPos = await fetchProgress('ep-1');
player.loadStream(url, { videoId: 'ep-1', startTime: serverPos, disableStorage: true });
```

**职责边界**：播放器管「播放位置的记录与恢复」；Web 前端管「历史列表、跨设备同步、继续观看模块、追剧收藏」。

### 自托管 Shaka Player（不走 CDN）

```html
<script>window.GYP_SHAKA_URL = '/vendor/shaka-player.compiled.js';</script>
```

## 自定义主题

通过 CSS 变量覆盖（在宿主页面设置即可穿透 Shadow DOM）：

```css
gy-player {
    --gyp-accent: #ff4d4f;   /* 进度条/高亮色 */
    --gyp-fit: contain;      /* 视频填充模式 contain/cover */
}
```

## 开发

```bash
npm install          # 安装 esbuild（仅构建用）
npm run dev          # 构建后用 python3 本地预览 index.html
npm run demo         # 联调 guangying.org 片源（先 build）
npm run build        # 打包到 dist/
npm test             # 纯逻辑单测
npm run test:browser # headless Chrome 真实播放验证（需先启动静态服务）
```

> 本仓库是播放器的**唯一源**。`src/` 下是拆分模块（开发用），`npm run build`
> 会打包成单文件 `dist/gy-player.js`（自包含，含 CSS），`npm run deploy` 编译发布。
>
> `800-web` 在运行时会先请求 CDN 的 `manifest.json`，然后动态 `import()` 最新哈希的播放器文件。
> 修改播放器流程：改 `src/` → `npm run deploy`（或 push main 触发 CI）。Web 端完全无需做任何修改，即可秒级生效最新版本。

## 发布到 R2 CDN

```bash
npm run build
npm run publish   # 上传带哈希的播放器及更新 manifest.json
npm run deploy    # build + publish 一键部署
```

每次发布会上传两个文件到 R2 桶 `flix-800-assets`：
1. `static/player/gy-player.<hash>.js`（强缓存：`max-age=31536000, immutable`）
2. `static/player/manifest.json`（无缓存：`no-cache, no-store`，记录最新哈希地址及构建时间）


## 体积构成

```
UI 皮肤（全部交互）   14 KB gzip   ← 始终加载
Shaka Player（按需）  ~180 KB gzip  ← HLS/DASH 播放时加载
MP4 直链                           ← 原生播放，仅 14 KB
```

## 浏览器支持

| 浏览器 | 引擎 | 画质切换 |
|--------|------|---------|
| 全平台 HLS/DASH | Shaka Player | ✅ 手动 + 自动 |
| MP4 直链 | 原生 video | 由源决定 |
| Shaka 不可用（Safari 兜底） | 原生 HLS | 由系统自适应 |

## License

MIT
