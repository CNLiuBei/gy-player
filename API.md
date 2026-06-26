# GY Player 对接文档

面向**接入方**的完整 API 参考。播放器是一个零框架的自定义元素 `<gy-player>`，
通过 HTML 属性、JS 方法、事件三种方式对接。

---

## 1. 引入

### 生产环境（CDN）

```html
<gy-player id="player"></gy-player>
<script type="module">
  await import('https://cdn.guangying.org/static/player/gy-player.js?v=128');
</script>
```

### 本地构建产物（ES 模块）

```html
<gy-player id="player"></gy-player>
<script type="module" src="/dist/gy-player.js"></script>
```

### IIFE（无模块系统环境）

```html
<gy-player id="player"></gy-player>
<script src="/dist/gy-player.global.js"></script>
```

引入后浏览器自动注册 `<gy-player>` 自定义元素，无需手动 `customElements.define`。

---

## 2. HTML 属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `src` | string | 视频地址（`.m3u8` 或 `.mp4`）。设置后自动加载播放 |
| `title` | string | 顶部标题 |
| `video-id` | string | 视频唯一标识，用于续播记忆。不传则用 url 兜底 |
| `poster` | string | 封面图地址，首帧前显示 |
| `autoplay` | boolean | 存在则加载完成后自动播放 |

> 简单场景可纯声明式使用；复杂场景（字幕、剧集联动、跨设备续播）用 `loadStream()` 方法。

```html
<gy-player src="https://cdn.example.com/a.m3u8" title="示例" video-id="v1" autoplay></gy-player>
```

---

## 3. 核心方法

### `loadStream(url, options?)`

加载并播放一个视频流。这是最常用的入口。

```js
player.loadStream('https://cdn.example.com/movie.m3u8', {
    title: '复仇者联盟',
    videoId: 'movie-123',
    poster: 'https://cdn.example.com/poster.jpg',
    startTime: 320,
    disableStorage: false,
    subtitles: [
        { url: '/subs/zhs.vtt', lang: 'zhs', label: '简体中文', default: true },
        { url: '/subs/eng.vtt', lang: 'eng', label: 'English' },
    ],
    sources: [
        { url: 'https://cdn.example.com/movie-720p.m3u8', quality: '720p' },
        { url: 'https://cdn.example.com/movie-1080p.m3u8', quality: '1080p' },
    ],
    sourceUrl: 'https://cdn.example.com/movie-1080p.m3u8',
});
```

**options 字段：**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `title` | string | — | 标题 |
| `videoId` | string | url | 续播记忆的 key |
| `poster` | string | — | 封面图 |
| `startTime` | number | — | 起播秒数。传入则直接续播、不弹提示（用于跨设备续播） |
| `disableStorage` | boolean | false | true 时关闭内置 localStorage，进度交由前端管理 |
| `subtitles` | Array | `[]` | 外挂字幕，见下方格式 |
| `sources` | Array | `[]` | 同一视频的多播放源/清晰度列表，见下方格式 |
| `sourceUrl` | string | 当前 url | 当前播放源 url，用于清晰度菜单高亮 |
| `playAfterLoad` | boolean | false | 加载完成后立即播放，通常用于切换清晰度后恢复播放 |

**字幕对象格式：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 字幕文件地址（WebVTT，`.vtt`） |
| `lang` | string | 语言代码，如 `zhs` / `eng` |
| `label` | string | 显示名，如「简体中文」 |
| `default` | boolean | 是否默认选中 |

**播放源对象格式：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 视频地址（`.m3u8` 或 `.mp4`） |
| `quality` | string | 清晰度显示名，如 `720p` / `1080p` / `4K` |
| `label` | string | 备用显示名，如「原画」「备用线路」 |
| `subtitles` | Array | 可选。该源专属字幕；不传则沿用当前 `subtitles` |

传入多条 `sources` 后，底部「画质」按钮会显示为清晰度切换菜单。切换时播放器会保留
当前播放秒数，若切换前正在播放，会在新源就绪后继续播放。

### 播放控制

| 方法 | 说明 |
|------|------|
| `play()` | 播放，返回 Promise |
| `pause()` | 暂停 |
| `togglePlay()` | 切换播放/暂停 |
| `seek(seconds)` | 跳转到指定秒数 |
| `seekBy(delta)` | 相对快进/快退，如 `seekBy(10)` / `seekBy(-10)` |
| `setRate(rate)` | 设置倍速，如 `setRate(1.5)` |
| `setVolume(0~1)` | 设置音量 |
| `toggleMute()` | 切换静音 |

### 视图控制

| 方法 | 说明 |
|------|------|
| `toggleFullscreen()` | 切换全屏（iOS 自动回退 video 原生全屏） |
| `togglePiP()` | 切换画中画 |
| `toggleLock()` | 切换锁屏（防误触） |
| `toggleControls()` | 切换控件显隐 |

### 剧集联动

| 方法 | 说明 |
|------|------|
| `showNextButton(visible)` | 显示/隐藏「下一集」按钮 |
| `showPrevButton(visible)` | 显示/隐藏「上一集」按钮 |
| `setTitle(title)` | 更新标题 |

### 生命周期

| 方法 | 说明 |
|------|------|
| `destroy()` | 销毁播放器，释放引擎与事件监听（保存最终进度） |

> 作为 Web Component，元素从 DOM 移除时（`disconnectedCallback`）会自动调用 `destroy()`。
> 在 SPA 中手动卸载时建议显式调用以确保进度保存。

---

## 4. 事件

全部通过标准 `addEventListener` 监听，部分带 `event.detail`。

| 事件 | detail | 触发时机 |
|------|--------|---------|
| `progress` | `{ videoId, currentTime, duration, percent, final? }` | 播放中每 5 秒；关闭时带 `final: true` |
| `ended` | `{ videoId }` | 播放结束 |
| `next` | — | 点「下一集」或系统媒体键 next |
| `prev` | — | 点「上一集」或系统媒体键 prev |
| `back` | — | 点返回按钮或 Esc（非全屏/非菜单时） |
| `error` | `{ code? , type? }` | 致命错误（已尝试自动恢复/回退后仍失败） |

```js
player.addEventListener('progress', (e) => {
    const { videoId, currentTime, duration, percent, final } = e.detail;
    // 同步进度到服务端
});
player.addEventListener('ended',  (e) => loadNext(e.detail.videoId));
player.addEventListener('next',   () => loadNext());
player.addEventListener('prev',   () => loadPrev());
player.addEventListener('back',   () => history.back());
player.addEventListener('error',  (e) => console.warn('播放失败', e.detail));
```

---

## 5. 续播 / 观看历史对接

播放器内置 localStorage 续播**开箱即用**（单机、单浏览器）。
若要做**登录后跨设备续播**或首页**「继续观看」**，由前端接管：

```js
// 1) 关闭内置存储，避免与服务端双写
// 2) 监听 progress 事件上报服务端（默认每 5 秒节流一次）
player.addEventListener('progress', (e) => {
    const { videoId, currentTime, final } = e.detail;
    syncToServer(videoId, currentTime);
});

// 3) 下次播放时把服务端进度通过 startTime 传入
const pos = await fetchProgressFromServer('movie-123');
player.loadStream(url, {
    videoId: 'movie-123',
    startTime: pos,
    disableStorage: true,
});
```

**职责边界：**

| 归属 | 负责 |
|------|------|
| 播放器 | 记录与恢复播放位置、续播提示 UI、单机记忆 |
| 业务前端 | 观看历史列表、跨设备同步、继续观看模块、追剧收藏 |

---

## 6. 多音轨 / 多字幕

- **外挂字幕**：通过 `loadStream` 的 `subtitles` 传入，自动出现在「字幕」菜单。
- **内嵌多音轨**：HLS manifest 内的多音轨（`EXT-X-MEDIA:TYPE=AUDIO`）由播放器自动识别，
  多于一条时「字幕」按钮菜单内出现「音轨」分组。
- 用户点底部字幕按钮即可切换字幕与音轨，无需额外对接代码。

> 注意：Safari 走原生 HLS，多音轨依赖 Safari 对该流的支持情况；
> 其他浏览器走 hls.js，多音轨切换完整可控。

---

## 7. 主题定制

通过 CSS 变量覆盖（在宿主页面设置即可穿透 Shadow DOM）：

```css
gy-player {
    --gyp-accent: #ff453a;   /* 进度条 / 高亮主色 */
    --gyp-fit: contain;      /* 视频填充：contain（默认）| cover */
}
```

液态玻璃材质相关变量（高级定制）：`--gyp-glass-bg`、`--gyp-glass-blur`、
`--gyp-glass-border`、`--gyp-glass-shadow`。

---

## 8. 引擎配置

### 自托管 hls.js（不走 CDN）

默认按需从 jsDelivr/unpkg 加载 hls.js。如需自托管：

```html
<script>window.GYP_HLS_URL = '/vendor/hls.min.js';</script>
```

### 引擎选择策略

| 浏览器 | 引擎 | 依赖 |
|--------|------|------|
| Safari / iOS | 原生 HLS | 0（不加载 hls.js） |
| Chrome / Edge / Firefox / Android | hls.js | 播放时按需动态加载 |

原生 HLS 解码失败时（如部分 HEVC/CMAF 流），**自动回退到 hls.js**。

---

## 9. 完整对接示例

```html
<gy-player id="player"></gy-player>
<script type="module" src="/dist/gy-player.js"></script>
<script type="module">
    const player = document.getElementById('player');
    let episodes = [];   // 剧集列表
    let index = 0;

    async function playEpisode(i) {
        index = i;
        const ep = episodes[i];
        const pos = await fetch(`/api/progress/${ep.id}`).then(r => r.json()).then(d => d.position || 0);
        player.loadStream(ep.url, {
            title: ep.title,
            videoId: ep.id,
            poster: ep.poster,
            startTime: pos,
            disableStorage: true,
            subtitles: ep.subtitles,
        });
        player.showPrevButton(i > 0);
        player.showNextButton(i < episodes.length - 1);
    }

    player.addEventListener('progress', (e) => {
        navigator.sendBeacon(`/api/progress/${e.detail.videoId}`,
            JSON.stringify({ position: e.detail.currentTime }));
    });
    player.addEventListener('next', () => playEpisode(index + 1));
    player.addEventListener('prev', () => playEpisode(index - 1));
    player.addEventListener('ended', () => {
        if (index < episodes.length - 1) playEpisode(index + 1);
    });
    player.addEventListener('back', () => history.back());

    // 初始化
    episodes = await fetch('/api/episodes/series-1').then(r => r.json());
    playEpisode(0);
</script>
```

---

## 10. 浏览器支持

| 浏览器 | 状态 |
|--------|------|
| Safari 15+ / iOS 15+ | ✅ 原生 HLS |
| Chrome / Edge 111+ | ✅ hls.js |
| Firefox 113+ | ✅ hls.js |
| Android Chrome | ✅ hls.js |

> HEVC（H.265）编码的播放依赖浏览器/系统解码能力（Safari 支持，部分 Chrome 需硬件支持，Firefox 多不支持）。
