// 播放器样式 — 注入 Shadow DOM，样式隔离，不污染宿主页面
// 设计：iOS 26 Liquid Glass（液态玻璃）— 浮起胶囊面板 + 背景折射模糊
//       + 高光描边 + 凸起质感，移动优先，尊重 reduced-motion / reduced-transparency

export const styles = `
:host {
    --gyp-accent: #ff453a;
    --gyp-bg: #000;
    --gyp-text: #fff;

    /* 液态玻璃材质变量 */
    --gyp-glass-bg: linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04));
    --gyp-glass-bg-solid: rgba(30,30,32,0.92);
    --gyp-glass-blur: blur(28px) saturate(190%) brightness(1.08);
    --gyp-glass-border: rgba(255,255,255,0.10);
    --gyp-glass-rim: inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 1px rgba(0,0,0,0.18);
    --gyp-glass-shadow: 0 10px 40px rgba(0,0,0,0.45);

    --gyp-track: rgba(255, 255, 255, 0.28);
    --gyp-buffered: rgba(255, 255, 255, 0.45);

    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    background: var(--gyp-bg);
    color: var(--gyp-text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    user-select: none;
    -webkit-user-select: none;
    overflow: hidden;
    contain: layout style;
}

:host(.gyp-fullscreen) {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    width: 100vw;
    height: 100vh;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.gyp-video {
    width: 100%;
    height: 100%;
    display: block;
    background: #000;
    object-fit: var(--gyp-fit, contain);
}

.hidden { display: none !important; }

/* ===== 点击捕获层 ===== */
.gyp-surface {
    position: absolute;
    inset: 0;
    z-index: 1;
}

/* ===== 顶部栏 ===== */
.gyp-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    padding-top: calc(14px + env(safe-area-inset-top, 0px));
    background: linear-gradient(to bottom, rgba(0,0,0,0.45), transparent);
    z-index: 10;
    transition: opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.gyp-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    opacity: 0.98;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 4px rgba(0,0,0,0.55);
}

/* ===== 底部区域：进度条 + 按钮，靠底部 scrim 渐变保证可读（dock 透明）===== */
.gyp-bottom {
    position: absolute;
    left: 12px; right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom, 0px));
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 10;
    transition: opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
/* 底部 scrim：横贯整宽的渐变遮罩，从底部黑到透明，托住进度条和按钮 */
.gyp-scrim {
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 26%;
    min-height: 110px;
    z-index: 9;
    pointer-events: none;
    background: linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0.18) 45%, transparent);
    opacity: 1;
    transition: opacity 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

/* 进度条行：横贯宽度，独立于按钮之上 */
.gyp-progress-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 6px;
}
.gyp-progress-bar .gyp-time {
    flex: 0 0 auto;
    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
}

/* 按钮 dock：液态玻璃（SVG 置换折射 + 染色 + 边缘高光，对标 macOS / iOS 26）*/
.gyp-btns {
    display: flex;
    align-items: center;
    gap: 2px;
    position: relative;
    padding: 6px 10px;
    border-radius: 24px;
    isolation: isolate;
    box-shadow: 0 6px 18px rgba(0,0,0,0.28), 0 0 24px rgba(0,0,0,0.12);
}
/* 玻璃三层：铺满 dock，圆角继承 */
.gyp-glass, .gyp-glass > div {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
}
/* 折射层：背景模糊 + SVG 置换扭曲（仅 Chromium 系生效，Safari 自动退化为纯模糊）*/
.gyp-glass-effect {
    z-index: 0;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    filter: url(#gyp-glass-distortion);
    overflow: hidden;
}
/* 染色层：深色半透明，适配视频上的深色场景 */
.gyp-glass-tint {
    z-index: 1;
    background: rgba(28,28,30,0.42);
}
/* 高光层：玻璃边缘内描边光泽 */
.gyp-glass-shine {
    z-index: 2;
    box-shadow:
        inset 1px 1px 1px 0 rgba(255,255,255,0.30),
        inset -1px -1px 1px 1px rgba(255,255,255,0.12);
}
/* dock 内的按钮等内容浮在玻璃之上 */
.gyp-btns > .gyp-btn,
.gyp-btns > .gyp-volume,
.gyp-btns > .gyp-spacer { position: relative; z-index: 3; }
/* SVG 滤镜容器：不占布局 */
.gyp-glass-svg { position: absolute; width: 0; height: 0; pointer-events: none; }

/* 隐藏控件（沉浸态）：dock 下滑淡出，scrim 同步淡出 */
:host(.gyp-immersed) .gyp-top { opacity: 0; pointer-events: none; transform: translateY(-10px); }
:host(.gyp-immersed) .gyp-bottom { opacity: 0; pointer-events: none; transform: translateY(18px); }
:host(.gyp-immersed) .gyp-scrim { opacity: 0; }
:host(.gyp-immersed) .gyp-mini { opacity: 1; }

/* 锁定态：隐藏所有控件，只留解锁按钮 */
:host(.gyp-locked) .gyp-top,
:host(.gyp-locked) .gyp-scrim,
:host(.gyp-locked) .gyp-bottom { opacity: 0; pointer-events: none; }

/* ===== 进度条 ===== */
.gyp-progress {
    position: relative;
    flex: 1;
    height: 20px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
}
.gyp-progress-track {
    position: absolute;
    left: 0; right: 0;
    height: 5px;
    background: var(--gyp-track);
    border-radius: 5px;
    overflow: hidden;
    transition: height 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}
.gyp-progress:hover .gyp-progress-track,
.gyp-progress.dragging .gyp-progress-track { height: 7px; }

.gyp-progress-buffered {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    background: var(--gyp-buffered);
    border-radius: 5px;
    width: 0;
    transition: width 0.2s ease;
}
.gyp-progress-played {
    position: absolute;
    left: 0; top: 0; bottom: 0;
    background: var(--gyp-accent);
    background: linear-gradient(90deg, var(--gyp-accent), color-mix(in srgb, var(--gyp-accent) 70%, #fff));
    border-radius: 5px;
    width: 0;
    box-shadow: 0 0 8px rgba(255,69,58,0.5);
    box-shadow: 0 0 8px color-mix(in srgb, var(--gyp-accent) 60%, transparent);
}
.gyp-progress-thumb {
    position: absolute;
    top: 50%;
    width: 15px; height: 15px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    box-shadow: 0 1px 6px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.06);
    transition: transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
    pointer-events: none;
}
.gyp-progress:hover .gyp-progress-thumb,
.gyp-progress.dragging .gyp-progress-thumb { transform: translate(-50%, -50%) scale(1); }

/* hover 时间气泡（液态玻璃小卡片，浮于 dock 上方）*/
.gyp-progress-tip {
    position: absolute;
    bottom: 30px;
    transform: translateX(-50%);
    padding: 5px 11px;
    border-radius: 10px;
    background: rgba(20,20,22,0.6);
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 6px 20px rgba(0,0,0,0.5);
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 12;
}
.gyp-progress:hover .gyp-progress-tip { opacity: 1; }

/* 迷你进度条（沉浸态可见） */
.gyp-mini {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 3px;
    background: rgba(255,255,255,0.18);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 9;
}
.gyp-mini-bar {
    height: 100%;
    width: 0;
    background: var(--gyp-accent);
}

/* ===== 按钮 ===== */
.gyp-btn {
    flex: 0 0 auto;
    width: 40px; height: 40px;
    display: grid;
    place-items: center;
    border: none;
    background: transparent;
    color: var(--gyp-text);
    cursor: pointer;
    border-radius: 50%;
    transition: background 0.18s ease, transform 0.12s ease;
    -webkit-tap-highlight-color: transparent;
}
.gyp-btn:hover { background: rgba(255,255,255,0.18); }
.gyp-btn:active { transform: scale(0.9); }
.gyp-btn:focus-visible { outline: 2px solid var(--gyp-accent); outline-offset: 1px; }
.gyp-btn svg { width: 22px; height: 22px; display: block; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.25)); }
.gyp-btn.gyp-btn-text {
    width: auto;
    min-width: 46px;
    padding: 0 12px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}
.gyp-spacer { flex: 1; }

.gyp-time {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.92;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 0 8px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.gyp-time-sep { opacity: 0.45; margin: 0 2px; }

/* ===== 音量组（hover 展开横向滑条）===== */
.gyp-volume {
    display: flex;
    align-items: center;
    overflow: hidden;
}
.gyp-volume-slider {
    width: 0;
    opacity: 0;
    height: 5px;
    margin: 0;
    transition: width 0.22s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease, margin 0.22s cubic-bezier(0.32, 0.72, 0, 1);
    position: relative;
    cursor: pointer;
    touch-action: none;
    flex: 0 0 auto;
}
.gyp-volume:hover .gyp-volume-slider,
.gyp-volume.expanded .gyp-volume-slider {
    width: 72px;
    opacity: 1;
    margin: 0 8px 0 2px;
}
.gyp-volume-track {
    position: absolute;
    top: 50%; left: 0; right: 0;
    height: 5px;
    transform: translateY(-50%);
    background: var(--gyp-track);
    border-radius: 5px;
}
.gyp-volume-fill {
    position: absolute;
    top: 50%; left: 0;
    height: 5px;
    transform: translateY(-50%);
    background: #fff;
    border-radius: 5px;
    width: 100%;
}
.gyp-volume-thumb {
    position: absolute;
    top: 50%; left: 100%;
    width: 12px; height: 12px;
    background: #fff;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 1px 4px rgba(0,0,0,0.45);
}

/* ===== 中央大按钮（播放/暂停回显，液态玻璃圆）===== */
.gyp-center {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 6;
    pointer-events: none;
}
.gyp-center-btn {
    width: 72px; height: 72px;
    display: grid;
    place-items: center;
    border: 0.5px solid var(--gyp-glass-border);
    border-radius: 50%;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    box-shadow: var(--gyp-glass-rim), 0 6px 24px rgba(0,0,0,0.4);
    color: #fff;
    opacity: 0;
    transform: scale(0.8);
    transition: opacity 0.35s ease, transform 0.35s ease;
}
.gyp-center-btn svg { width: 34px; height: 34px; }
.gyp-center.flash .gyp-center-btn {
    animation: gyp-flash 0.5s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}
@keyframes gyp-flash {
    0% { opacity: 0.95; transform: scale(0.85); }
    100% { opacity: 0; transform: scale(1.35); }
}

/* ===== 中央提示（手势反馈，液态玻璃胶囊）===== */
.gyp-hint {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    padding: 12px 22px;
    border-radius: 16px;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 6px 24px rgba(0,0,0,0.4);
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    z-index: 20;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    white-space: nowrap;
}
.gyp-hint.visible { opacity: 1; }

/* ===== 缓冲转圈 ===== */
.gyp-buffering {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 15;
    pointer-events: none;
}

/* ===== 首屏加载态 ===== */
.gyp-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 16;
    pointer-events: none;
}
.gyp-spinner {
    width: 48px; height: 48px;
    border: 3px solid rgba(255,255,255,0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: gyp-spin 0.8s linear infinite;
}
@keyframes gyp-spin { to { transform: rotate(360deg); } }

/* ===== 锁定按钮（液态玻璃圆）===== */
.gyp-lock {
    position: absolute;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 25;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 4px 16px rgba(0,0,0,0.35);
    opacity: 0;
    transition: opacity 0.3s ease;
}
:host(.gyp-locked) .gyp-lock,
:host(:not(.gyp-immersed)) .gyp-lock { opacity: 1; }

/* ===== 选集面板（与设置菜单统一：右下浮起玻璃面板）===== */
.gyp-ep-panel {
    position: absolute;
    right: 16px;
    bottom: 78px;
    width: 300px; max-width: calc(100% - 32px);
    max-height: 56%;
    z-index: 30;
    display: flex; flex-direction: column;
    padding: 8px;
    border-radius: 20px;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 12px 40px rgba(0,0,0,0.5);
    animation: gyp-pop 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
.gyp-ep-panel.hidden { display: none; }

.gyp-ep-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px 6px;
}
.gyp-ep-title {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.5;
}
.gyp-ep-header .gyp-btn { width: 28px; height: 28px; transform: rotate(180deg); }
.gyp-ep-header .gyp-btn svg { width: 16px; height: 16px; }

.gyp-ep-seasons {
    display: flex; gap: 6px; flex-wrap: wrap;
    padding: 4px 8px 8px;
}
.gyp-ep-seasons.hidden { display: none; }
.gyp-ep-season {
    padding: 5px 14px; border-radius: 2rem; border: none;
    background: rgba(255,255,255,0.12); color: #fff;
    font-size: 12px; font-weight: 600; cursor: pointer;
    transition: background 0.14s ease;
}
.gyp-ep-season:hover { background: rgba(255,255,255,0.2); }
.gyp-ep-season.active { background: var(--gyp-accent); }

/* 分段 chip（集多时按段切换）*/
.gyp-ep-segments {
    display: flex; gap: 6px; flex-wrap: wrap;
    padding: 0 8px 8px;
    max-height: 92px; overflow-y: auto; overscroll-behavior: contain;
    scrollbar-width: none;
}
.gyp-ep-segments::-webkit-scrollbar { display: none; }
.gyp-ep-segments.hidden { display: none; }
.gyp-ep-seg {
    padding: 4px 12px; border-radius: 8px; border: none;
    background: rgba(255,255,255,0.1); color: #fff;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-variant-numeric: tabular-nums;
    transition: background 0.14s ease;
}
.gyp-ep-seg:hover { background: rgba(255,255,255,0.18); }
.gyp-ep-seg.active { background: var(--gyp-accent); }

/* 集列表：单列排布，菜单项风格 */
.gyp-ep-list {
    flex: 1; overflow-y: auto; overscroll-behavior: contain;
    padding: 0 4px 4px;
    display: flex; flex-direction: column;
    gap: 4px;
    scrollbar-width: none; -ms-overflow-style: none;
}
.gyp-ep-list::-webkit-scrollbar { display: none; }
.gyp-ep-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 10px; border-radius: 12px;
    border: none; background: transparent;
    color: #fff; text-align: left; cursor: pointer; width: 100%;
    transition: background 0.14s ease;
}
.gyp-ep-item:hover { background: rgba(255,255,255,0.16); }
.gyp-ep-item.active { background: rgba(255,255,255,0.1); font-weight: 600; }
.gyp-ep-num {
    flex: 0 0 auto; width: 24px; height: 24px;
    display: grid; place-items: center; border-radius: 7px;
    background: rgba(255,255,255,0.12); font-size: 12px; font-weight: 600;
}
.gyp-ep-item.active .gyp-ep-num { background: var(--gyp-accent); }
.gyp-ep-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ===== 设置菜单（液态玻璃面板）===== */
.gyp-menu {
    position: absolute;
    right: 16px;
    bottom: 78px;
    min-width: 190px;
    max-height: 56%;
    overflow-y: auto;
    padding: 8px;
    border-radius: 20px;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 12px 40px rgba(0,0,0,0.5);
    z-index: 30;
    animation: gyp-pop 0.2s cubic-bezier(0.32, 0.72, 0, 1);
    scrollbar-width: none; -ms-overflow-style: none;
}
.gyp-menu::-webkit-scrollbar { display: none; }
@keyframes gyp-pop { from { opacity: 0; transform: translateY(8px) scale(0.96); } }
.gyp-menu-title {
    padding: 8px 12px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    opacity: 0.5;
}
.gyp-menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.14s ease;
}
.gyp-menu-item:hover,
.gyp-menu-item:focus-visible { background: rgba(255,255,255,0.16); outline: none; }
.gyp-menu-item .gyp-menu-check {
    width: 16px; height: 16px;
    opacity: 0;
    flex: 0 0 auto;
    color: var(--gyp-accent);
}
.gyp-menu-item.active .gyp-menu-check { opacity: 1; }
.gyp-menu-item.active { color: #fff; font-weight: 600; }

/* ===== 续播提示条（液态玻璃胶囊）===== */
.gyp-resume {
    position: absolute;
    bottom: 92px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px;
    border-radius: 18px;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 10px 32px rgba(0,0,0,0.45);
    z-index: 22;
    white-space: nowrap;
    animation: gyp-slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes gyp-slide-up { from { opacity: 0; transform: translate(-50%, 12px); } }
.gyp-resume-text { font-size: 13px; font-weight: 500; opacity: 0.96; }
.gyp-resume-btn {
    padding: 7px 16px;
    border-radius: 14px;
    border: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.12s ease, opacity 0.15s ease;
}
.gyp-resume-btn:active { transform: scale(0.94); }
.gyp-resume-yes { background: var(--gyp-accent); color: #fff; box-shadow: 0 2px 8px rgba(255,69,58,0.4); box-shadow: 0 2px 8px color-mix(in srgb, var(--gyp-accent) 50%, transparent); }
.gyp-resume-no { background: rgba(255,255,255,0.2); color: #fff; }

/* ===== 错误覆盖层 ===== */
.gyp-error {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    background: rgba(0,0,0,0.78);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 40;
    text-align: center;
    padding: 24px;
}
.gyp-error-msg { font-size: 15px; font-weight: 500; opacity: 0.92; max-width: 400px; line-height: 1.5; }
.gyp-error-btn {
    padding: 11px 28px;
    border-radius: 16px;
    border: none;
    background: var(--gyp-accent);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(255,69,58,0.4);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--gyp-accent) 45%, transparent);
    transition: transform 0.12s ease;
}
.gyp-error-btn:active { transform: scale(0.95); }
/* ===== 移动端适配 ===== */
@media (max-width: 640px) {
    .gyp-volume-slider { display: none; }
    .gyp-btn { width: 42px; height: 42px; }
    .gyp-time { font-size: 12px; }
    .gyp-top { padding: 12px 14px; padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
    .gyp-bottom { left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); gap: 8px; }
    .gyp-btns { padding: 5px 8px; border-radius: 22px; }
    .gyp-progress-bar { gap: 8px; padding: 0 4px; }
}

/* 触屏设备始终显示解锁按钮 */
@media (hover: none) {
    :host(.gyp-locked) .gyp-lock { opacity: 0.75; pointer-events: auto; }
}

/* 无障碍：用户偏好减少透明度 → 回退实色，关闭模糊 */
@media (prefers-reduced-transparency: reduce) {
    .gyp-menu, .gyp-ep-panel, .gyp-hint, .gyp-resume,
    .gyp-center-btn, .gyp-lock, .gyp-progress-tip {
        background: var(--gyp-glass-bg-solid) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
    }
    /* dock 玻璃：关闭折射与模糊，加深染色保证可读 */
    .gyp-glass-effect { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    .gyp-glass-tint { background: var(--gyp-glass-bg-solid) !important; }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
`;
