/* GY Player v1.0.0 | MIT License */
"use strict";(()=>{var ce=Object.defineProperty;var pe=(i,e,t)=>e in i?ce(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var D=(i,e,t)=>pe(i,typeof e!="symbol"?e+"":e,t);var j=`
:host {
    --gyp-accent: #ff453a;
    --gyp-bg: #000;
    --gyp-text: #fff;

    /* \u6DB2\u6001\u73BB\u7483\u6750\u8D28\u53D8\u91CF */
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

/* ===== \u70B9\u51FB\u6355\u83B7\u5C42 ===== */
.gyp-surface {
    position: absolute;
    inset: 0;
    z-index: 1;
}

/* ===== \u9876\u90E8\u680F ===== */
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

/* ===== \u5E95\u90E8\u533A\u57DF\uFF1A\u8FDB\u5EA6\u6761 + \u6309\u94AE\uFF0C\u9760\u5E95\u90E8 scrim \u6E10\u53D8\u4FDD\u8BC1\u53EF\u8BFB\uFF08dock \u900F\u660E\uFF09===== */
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
/* \u5E95\u90E8 scrim\uFF1A\u6A2A\u8D2F\u6574\u5BBD\u7684\u6E10\u53D8\u906E\u7F69\uFF0C\u4ECE\u5E95\u90E8\u9ED1\u5230\u900F\u660E\uFF0C\u6258\u4F4F\u8FDB\u5EA6\u6761\u548C\u6309\u94AE */
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

/* \u8FDB\u5EA6\u6761\u884C\uFF1A\u6A2A\u8D2F\u5BBD\u5EA6\uFF0C\u72EC\u7ACB\u4E8E\u6309\u94AE\u4E4B\u4E0A */
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

/* \u6309\u94AE dock\uFF1A\u6DB2\u6001\u73BB\u7483\uFF08SVG \u7F6E\u6362\u6298\u5C04 + \u67D3\u8272 + \u8FB9\u7F18\u9AD8\u5149\uFF0C\u5BF9\u6807 macOS / iOS 26\uFF09*/
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
/* \u73BB\u7483\u4E09\u5C42\uFF1A\u94FA\u6EE1 dock\uFF0C\u5706\u89D2\u7EE7\u627F */
.gyp-glass, .gyp-glass > div {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
}
/* \u6298\u5C04\u5C42\uFF1A\u80CC\u666F\u6A21\u7CCA + SVG \u7F6E\u6362\u626D\u66F2\uFF08\u4EC5 Chromium \u7CFB\u751F\u6548\uFF0CSafari \u81EA\u52A8\u9000\u5316\u4E3A\u7EAF\u6A21\u7CCA\uFF09*/
.gyp-glass-effect {
    z-index: 0;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    filter: url(#gyp-glass-distortion);
    overflow: hidden;
}
/* \u67D3\u8272\u5C42\uFF1A\u6DF1\u8272\u534A\u900F\u660E\uFF0C\u9002\u914D\u89C6\u9891\u4E0A\u7684\u6DF1\u8272\u573A\u666F */
.gyp-glass-tint {
    z-index: 1;
    background: rgba(28,28,30,0.42);
}
/* \u9AD8\u5149\u5C42\uFF1A\u73BB\u7483\u8FB9\u7F18\u5185\u63CF\u8FB9\u5149\u6CFD */
.gyp-glass-shine {
    z-index: 2;
    box-shadow:
        inset 1px 1px 1px 0 rgba(255,255,255,0.30),
        inset -1px -1px 1px 1px rgba(255,255,255,0.12);
}
/* dock \u5185\u7684\u6309\u94AE\u7B49\u5185\u5BB9\u6D6E\u5728\u73BB\u7483\u4E4B\u4E0A */
.gyp-btns > .gyp-btn,
.gyp-btns > .gyp-volume,
.gyp-btns > .gyp-spacer { position: relative; z-index: 3; }
/* SVG \u6EE4\u955C\u5BB9\u5668\uFF1A\u4E0D\u5360\u5E03\u5C40 */
.gyp-glass-svg { position: absolute; width: 0; height: 0; pointer-events: none; }

/* \u9690\u85CF\u63A7\u4EF6\uFF08\u6C89\u6D78\u6001\uFF09\uFF1Adock \u4E0B\u6ED1\u6DE1\u51FA\uFF0Cscrim \u540C\u6B65\u6DE1\u51FA */
:host(.gyp-immersed) .gyp-top { opacity: 0; pointer-events: none; transform: translateY(-10px); }
:host(.gyp-immersed) .gyp-bottom { opacity: 0; pointer-events: none; transform: translateY(18px); }
:host(.gyp-immersed) .gyp-scrim { opacity: 0; }
:host(.gyp-immersed) .gyp-mini { opacity: 1; }

/* \u9501\u5B9A\u6001\uFF1A\u9690\u85CF\u6240\u6709\u63A7\u4EF6\uFF0C\u53EA\u7559\u89E3\u9501\u6309\u94AE */
:host(.gyp-locked) .gyp-top,
:host(.gyp-locked) .gyp-scrim,
:host(.gyp-locked) .gyp-bottom { opacity: 0; pointer-events: none; }

/* ===== \u8FDB\u5EA6\u6761 ===== */
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

/* hover \u65F6\u95F4\u6C14\u6CE1\uFF08\u6DB2\u6001\u73BB\u7483\u5C0F\u5361\u7247\uFF0C\u6D6E\u4E8E dock \u4E0A\u65B9\uFF09*/
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

/* \u8FF7\u4F60\u8FDB\u5EA6\u6761\uFF08\u6C89\u6D78\u6001\u53EF\u89C1\uFF09 */
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

/* ===== \u6309\u94AE ===== */
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

/* ===== \u97F3\u91CF\u7EC4\uFF08hover \u5C55\u5F00\u6A2A\u5411\u6ED1\u6761\uFF09===== */
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

/* ===== \u4E2D\u592E\u5927\u6309\u94AE\uFF08\u64AD\u653E/\u6682\u505C\u56DE\u663E\uFF0C\u6DB2\u6001\u73BB\u7483\u5706\uFF09===== */
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

/* ===== \u4E2D\u592E\u63D0\u793A\uFF08\u624B\u52BF\u53CD\u9988\uFF0C\u6DB2\u6001\u73BB\u7483\u80F6\u56CA\uFF09===== */
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

/* ===== \u7F13\u51B2\u8F6C\u5708 ===== */
.gyp-buffering {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    z-index: 15;
    pointer-events: none;
}

/* ===== \u9996\u5C4F\u52A0\u8F7D\u6001 ===== */
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

/* ===== \u9501\u5B9A\u6309\u94AE\uFF08\u6DB2\u6001\u73BB\u7483\u5706\uFF09===== */
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

/* ===== \u9009\u96C6\u9762\u677F\uFF08\u4E0E\u8BBE\u7F6E\u83DC\u5355\u7EDF\u4E00\uFF1A\u53F3\u4E0B\u6D6E\u8D77\u73BB\u7483\u9762\u677F\uFF09===== */
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

/* \u5206\u6BB5 chip\uFF08\u96C6\u591A\u65F6\u6309\u6BB5\u5207\u6362\uFF09*/
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

/* \u96C6\u5217\u8868\uFF1A\u5355\u5217\u6392\u5E03\uFF0C\u83DC\u5355\u9879\u98CE\u683C */
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

/* ===== \u8BBE\u7F6E\u83DC\u5355\uFF08\u6DB2\u6001\u73BB\u7483\u9762\u677F\uFF09===== */
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

/* ===== \u7EED\u64AD\u63D0\u793A\u6761\uFF08\u6DB2\u6001\u73BB\u7483\u80F6\u56CA\uFF09===== */
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

/* ===== \u9519\u8BEF\u8986\u76D6\u5C42 ===== */
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
/* ===== \u79FB\u52A8\u7AEF\u9002\u914D ===== */
@media (max-width: 640px) {
    .gyp-volume-slider { display: none; }
    .gyp-btn { width: 42px; height: 42px; }
    .gyp-time { font-size: 12px; }
    .gyp-top { padding: 12px 14px; padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
    .gyp-bottom { left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); gap: 8px; }
    .gyp-btns { padding: 5px 8px; border-radius: 22px; }
    .gyp-progress-bar { gap: 8px; padding: 0 4px; }
}

/* \u89E6\u5C4F\u8BBE\u5907\u59CB\u7EC8\u663E\u793A\u89E3\u9501\u6309\u94AE */
@media (hover: none) {
    :host(.gyp-locked) .gyp-lock { opacity: 0.75; pointer-events: auto; }
}

/* \u65E0\u969C\u788D\uFF1A\u7528\u6237\u504F\u597D\u51CF\u5C11\u900F\u660E\u5EA6 \u2192 \u56DE\u9000\u5B9E\u8272\uFF0C\u5173\u95ED\u6A21\u7CCA */
@media (prefers-reduced-transparency: reduce) {
    .gyp-menu, .gyp-ep-panel, .gyp-hint, .gyp-resume,
    .gyp-center-btn, .gyp-lock, .gyp-progress-tip {
        background: var(--gyp-glass-bg-solid) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
    }
    /* dock \u73BB\u7483\uFF1A\u5173\u95ED\u6298\u5C04\u4E0E\u6A21\u7CCA\uFF0C\u52A0\u6DF1\u67D3\u8272\u4FDD\u8BC1\u53EF\u8BFB */
    .gyp-glass-effect { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    .gyp-glass-tint { background: var(--gyp-glass-bg-solid) !important; }
}

/* \u5C0A\u91CD\u51CF\u5C11\u52A8\u6548\u504F\u597D */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
`;var p={play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.87l11-6.86a1 1 0 0 0 0-1.74l-11-6.86A1 1 0 0 0 8 5.14Z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>',replay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/><path d="M3 3v5h5"/></svg>',prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5.14v13.72a1 1 0 0 1-1.5.87l-9-6.86a1 1 0 0 1 0-1.74l9-6.86a1 1 0 0 1 1.5.87Z"/><rect x="4" y="4" width="3" height="16" rx="1.3"/></svg>',next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.87l9-6.86a1 1 0 0 0 0-1.74l-9-6.86A1 1 0 0 0 8 5.14Z"/><rect x="17" y="4" width="3" height="16" rx="1.3"/></svg>',back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',volumeHigh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',volumeLow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',volumeMute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>',fullscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',exitFullscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>',pip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6"/><rect x="2" y="13" width="10" height="7" rx="1.5" fill="currentColor" stroke="none"/></svg>',subtitle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 13h6M16 13h2M6 16h3M13 16h5" stroke-width="2.2"/></svg>',settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',unlock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-.9"/></svg>',airplay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><path d="m12 15 5 6H7l5-6Z" fill="currentColor"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',forward:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a8 8 0 1 0 8 8"/><path d="M12 4 9 1m3 3-3 3"/><text x="12" y="15" font-size="7" fill="currentColor" stroke="none" text-anchor="middle" font-weight="700">10</text></svg>',rewind:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 4l3-3m-3 3 3 3"/><text x="12" y="15" font-size="7" fill="currentColor" stroke="none" text-anchor="middle" font-weight="700">10</text></svg>'};function y(i){if(!i||isNaN(i)||!isFinite(i)||i<0)return"00:00";let e=Math.floor(i),t=Math.floor(e/3600),s=Math.floor(e%3600/60),n=e%60,o=r=>r.toString().padStart(2,"0");return t>0?`${t}:${o(s)}:${o(n)}`:`${o(s)}:${o(n)}`}function h(i,e,t){return isNaN(i)?e:Math.min(t,Math.max(e,i))}var M=navigator.userAgent||"",V=/iPhone|iPad|iPod/i.test(M)||navigator.maxTouchPoints>1&&/Macintosh/i.test(M),Be=V||/Android/i.test(M),ue=/^((?!chrome|android).)*safari/i.test(M);function O(){if(!ue&&!V)return!1;let i=document.createElement("video");return i.canPlayType("application/vnd.apple.mpegurl")!==""||i.canPlayType("application/x-mpegURL")!==""}var E="pictureInPictureEnabled"in document&&document.pictureInPictureEnabled,N=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);var ge=6,he=3,A="1.6.16",me=[`https://cdn.jsdelivr.net/npm/hls.js@${A}/dist/hls.min.js`,`https://unpkg.com/hls.js@${A}/dist/hls.min.js`,`https://fastly.jsdelivr.net/npm/hls.js@${A}/dist/hls.min.js`],L=null;function ve(i){return new Promise((e,t)=>{let s=document.createElement("script");s.src=i,s.async=!0,s.onload=()=>e(),s.onerror=()=>{s.remove(),t(new Error("\u811A\u672C\u52A0\u8F7D\u5931\u8D25\uFF1A"+i))},document.head.appendChild(s)})}function q(){if(window.Hls)return Promise.resolve(window.Hls);if(L)return L;let i=window.GYP_HLS_URL?[window.GYP_HLS_URL]:me;return L=(async()=>{let e=null;for(let t of i)try{if(await ve(t),window.Hls)return window.Hls;e=new Error("hls.js \u5DF2\u52A0\u8F7D\u4F46\u672A\u6302\u8F7D\u5230 window.Hls\uFF1A"+t)}catch(s){e=s}throw L=null,e||new Error("hls.js \u52A0\u8F7D\u5931\u8D25\uFF1A\u6240\u6709 CDN \u5747\u4E0D\u53EF\u7528")})(),L}var B=class{constructor(e,t={}){D(this,"_onNativeError",async()=>{if(this._destroyed)return;let e=this.video.error;if(this.native&&this._isHls&&!this._fallbackTried){this._fallbackTried=!0;try{let t=await q();if(this._destroyed)return;if(t.isSupported()){this.video.removeAttribute("src"),this.video.load(),await this._loadHls(this._url);return}}catch{}}this.callbacks.onError?.(e||new Error("\u539F\u751F\u64AD\u653E\u51FA\u9519"),!0)});this.video=e,this.callbacks=t,this.hls=null,this.native=!1,this._destroyed=!1,this._netRetries=0,this._mediaRetries=0}async load(e){await this.detach(),this._destroyed=!1,this._url=e,this._fallbackTried=!1;let t=/\.m3u8(\?|$)/i.test(e)||/application\/(vnd\.apple\.mpegurl|x-mpegURL)/i.test(e);if(this._isHls=t,!t||O()){this._loadNative(e);return}await this._loadHls(e)}_loadNative(e){this.native=!0,this.video.src=e;let t=()=>{this._destroyed||this.callbacks.onReady?.()};this.video.addEventListener("loadedmetadata",t,{once:!0}),this.video.addEventListener("error",this._onNativeError,{once:!0})}async _loadHls(e){let t;try{t=await q()}catch(s){this.callbacks.onError?.(s,!0);return}if(!this._destroyed){if(!t.isSupported()){this._loadNative(e);return}this.native=!1,this.hls=new t({maxBufferLength:30,maxMaxBufferLength:120,backBufferLength:30,abrEwmaDefaultEstimate:5e6,fragLoadingMaxRetry:6,manifestLoadingMaxRetry:4,levelLoadingMaxRetry:4,lowLatencyMode:!1}),this._Hls=t,this.hls.on(t.Events.MANIFEST_PARSED,()=>{this._destroyed||this.callbacks.onReady?.()}),this.hls.on(t.Events.FRAG_BUFFERED,()=>{this._netRetries=0,this._mediaRetries=0}),this.hls.on(t.Events.LEVEL_SWITCHED,(s,n)=>{this._destroyed||this.callbacks.onLevelSwitched?.(n.level)}),this.hls.on(t.Events.ERROR,(s,n)=>{this._destroyed||this._handleHlsError(n)}),this.hls.loadSource(e),this.hls.attachMedia(this.video)}}_handleHlsError(e){let t=this._Hls;if(e.fatal)switch(e.type){case t.ErrorTypes.NETWORK_ERROR:if(this._netRetries<ge){this._netRetries++;let s=Math.min(1e3*this._netRetries,5e3);this._retryTimer=setTimeout(()=>{!this._destroyed&&this.hls&&this.hls.startLoad()},s),this.callbacks.onError?.(e,!1)}else this.callbacks.onError?.(e,!0);break;case t.ErrorTypes.MEDIA_ERROR:this._mediaRetries<he?(this._mediaRetries++,this.hls.recoverMediaError(),this.callbacks.onError?.(e,!1)):this.callbacks.onError?.(e,!0);break;default:this.callbacks.onError?.(e,!0);break}}getLevels(){return this.native||!this.hls?[]:this.hls.levels.map((e,t)=>({index:t,height:e.height||0,bitrate:e.bitrate||0,name:e.height?`${e.height}p`:`${Math.round((e.bitrate||0)/1e3)}k`}))}getCurrentLevel(){return this.native||!this.hls||this.hls.autoLevelEnabled?-1:this.hls.currentLevel}setLevel(e){this.native||!this.hls||(this.hls.currentLevel=e)}getAudioTracks(){if(this.hls)return(this.hls.audioTracks||[]).map(t=>({id:t.id,name:t.name||t.lang||`\u97F3\u8F68 ${t.id+1}`,lang:t.lang||""}));let e=this.video.audioTracks;return e&&e.length>1?Array.from(e).map((t,s)=>({id:s,name:t.label||t.language||`\u97F3\u8F68 ${s+1}`,lang:t.language||""})):[]}getCurrentAudioTrack(){if(this.hls)return this.hls.audioTrack;let e=this.video.audioTracks;if(e&&e.length>1){for(let t=0;t<e.length;t++)if(e[t].enabled)return t}return-1}setAudioTrack(e){if(this.hls){this.hls.audioTrack=e;return}let t=this.video.audioTracks;if(t&&t.length>1)for(let s=0;s<t.length;s++)t[s].enabled=s===e}async detach(){if(this._destroyed=!0,clearTimeout(this._retryTimer),this._netRetries=0,this._mediaRetries=0,this.hls){try{this.hls.destroy()}catch{}this.hls=null}if(this.video){this.video.removeEventListener("error",this._onNativeError);try{this.video.removeAttribute("src"),this.video.load()}catch{}}this.native=!1}};var I="gyp_";function C(i,e){try{localStorage.setItem(I+i,e)}catch{}}function $(i){try{return localStorage.getItem(I+i)}catch{return null}}function fe(i){try{localStorage.removeItem(I+i)}catch{}}function z(i,e){!i||!isFinite(e)||C("time_"+i,String(Math.floor(e)))}function X(i){if(!i)return 0;let e=$("time_"+i),t=e?parseFloat(e):0;return isFinite(t)?t:0}function F(i){i&&fe("time_"+i)}function m(i){isFinite(i)&&C("volume",String(i))}function G(){let i=$("volume");if(i===null)return 1;let e=parseFloat(i);return isFinite(e)?Math.min(1,Math.max(0,e)):1}function S(i){C("muted",i?"1":"0")}function U(){return $("muted")==="1"}function Y(i){isFinite(i)&&C("rate",String(i))}function K(){let i=$("rate");if(i===null)return 1;let e=parseFloat(i);return isFinite(e)&&e>0?e:1}function W(i,e){let t={signal:e},s=i.els;s.playBtn.addEventListener("click",()=>i.togglePlay(),t),s.backBtn.addEventListener("click",()=>{i.dispatchEvent(new CustomEvent("back"))},t),s.prevBtn.addEventListener("click",()=>i.dispatchEvent(new CustomEvent("prev")),t),s.nextBtn.addEventListener("click",()=>i.dispatchEvent(new CustomEvent("next")),t),s.fsBtn.addEventListener("click",()=>i.toggleFullscreen(),t),s.lockBtn.addEventListener("click",()=>i.toggleLock(),t),E&&s.pipBtn.addEventListener("click",()=>i.togglePiP(),t),s.speedBtn.addEventListener("click",()=>i.toggleMenu("speed"),t),s.qualityBtn.addEventListener("click",()=>i.toggleMenu("quality"),t),s.subtitleBtn.addEventListener("click",()=>i.toggleMenu("subtitle"),t),s.episodesBtn.addEventListener("click",()=>i.toggleEpisodePanel(),t),s.epClose.addEventListener("click",()=>i.toggleEpisodePanel(!1),t),s.epSeasons.addEventListener("click",l=>{let a=l.target.closest(".gyp-ep-season");a&&(i._activeSeason=a.dataset.season,i._renderEpisodePanel())},t),s.epSegments.addEventListener("click",l=>{let a=l.target.closest(".gyp-ep-seg");a&&(i._activeSeg=parseInt(a.dataset.seg,10),s.epSegments.querySelectorAll(".gyp-ep-seg").forEach(c=>c.classList.toggle("active",c===a)),i._renderEpisodeItems(),i.els.epList.scrollTop=0)},t),s.epList.addEventListener("click",l=>{let a=l.target.closest(".gyp-ep-item");a&&(i.dispatchEvent(new CustomEvent("selectepisode",{detail:{id:a.dataset.id}})),i.toggleEpisodePanel(!1))},t);let n="ontouchstart"in window,o=null;s.surface.addEventListener("click",()=>{if(i._menuOpen){i.closeMenu();return}if(n){i.toggleControls();return}o||(o=setTimeout(()=>{o=null,i.togglePlay()},220))},t),s.surface.addEventListener("dblclick",()=>{n||(o&&(clearTimeout(o),o=null),i.toggleFullscreen())},t);let r=()=>{let l=!!(document.fullscreenElement||document.webkitFullscreenElement);i.classList.toggle("gyp-fullscreen",l),s.fsBtn.innerHTML=l?p.exitFullscreen:p.fullscreen};document.addEventListener("fullscreenchange",r,t),document.addEventListener("webkitfullscreenchange",r,t),be(i,e),ye(i,e);let d=()=>{i._controlsHovered=!0,i._showControls?.()},u=()=>{i._controlsHovered=!1,i._showControls?.()};s.bottom.addEventListener("mouseenter",d,t),s.bottom.addEventListener("mouseleave",u,t),s.top.addEventListener("mouseenter",d,t),s.top.addEventListener("mouseleave",u,t)}function be(i,e){let t={signal:e},s=i.video,n=i.els.progress,o=!1,r=l=>{let a=n.getBoundingClientRect();return h((l-a.left)/a.width,0,1)},d=l=>{let a=r(l);return i.els.played.style.width=`${a*100}%`,i.els.thumb.style.left=`${a*100}%`,s.duration&&(i.els.timeCurrent.textContent=y(a*s.duration)),a},u=l=>{let a=r(l);s.duration&&(s.currentTime=a*s.duration)};n.addEventListener("mousedown",l=>{o=!0,n.classList.add("dragging"),d(l.clientX);let a=g=>{o&&d(g.clientX)},c=g=>{o=!1,n.classList.remove("dragging"),u(g.clientX),document.removeEventListener("mousemove",a),document.removeEventListener("mouseup",c)};document.addEventListener("mousemove",a),document.addEventListener("mouseup",c)},t),n.addEventListener("touchstart",l=>{o=!0,n.classList.add("dragging"),d(l.touches[0].clientX);let a=g=>{o&&d(g.touches[0].clientX)},c=g=>{o=!1,n.classList.remove("dragging"),u(g.changedTouches[0].clientX),document.removeEventListener("touchmove",a),document.removeEventListener("touchend",c)};document.addEventListener("touchmove",a,{passive:!0}),document.addEventListener("touchend",c)},{signal:e,passive:!0}),n.addEventListener("mousemove",l=>{if(!s.duration)return;let a=r(l.clientX);i.els.tip.textContent=y(a*s.duration);let c=n.getBoundingClientRect(),g=i.els.tip.offsetWidth/2/c.width*100,f=h(a*100,g,100-g);i.els.tip.style.left=`${f}%`},t),n.addEventListener("keydown",l=>{l.key==="ArrowLeft"?(i.seekBy(-5),l.preventDefault()):l.key==="ArrowRight"&&(i.seekBy(5),l.preventDefault())},t)}function ye(i,e){let t={signal:e},s=i.video,n=i.els.volumeSlider;i.els.volumeBtn.addEventListener("click",()=>i.toggleMute(),t);let o=r=>{let d=n.getBoundingClientRect(),u=h((r-d.left)/d.width,0,1);s.volume=u,s.muted=!1,m(u),S(!1)};n.addEventListener("mousedown",r=>{o(r.clientX);let d=l=>o(l.clientX),u=()=>{document.removeEventListener("mousemove",d),document.removeEventListener("mouseup",u)};document.addEventListener("mousemove",d),document.addEventListener("mouseup",u),r.stopPropagation()},t),n.addEventListener("touchstart",r=>{o(r.touches[0].clientX);let d=l=>o(l.touches[0].clientX),u=()=>{document.removeEventListener("touchmove",d),document.removeEventListener("touchend",u)};document.addEventListener("touchmove",d,{passive:!0}),document.addEventListener("touchend",u)},{signal:e,passive:!0}),i.els.volume.addEventListener("wheel",r=>{r.preventDefault(),s.volume=h(s.volume+(r.deltaY>0?-.05:.05),0,1),s.muted=!1,m(s.volume),i.showHint(`\u97F3\u91CF ${Math.round(s.volume*100)}%`)},{signal:e,passive:!1})}var Z=16,xe=90,ke=500,Q=2,we=300,J=10;function ee(i,e){if(!("ontouchstart"in window))return;let t=i.video,s=i.els.surface,n={signal:e},o=0,r=0,d=0,u=0,l=null,a=null,c=!1,g=1,f=0,T=0,P=b=>{if(i._locked||b.touches.length!==1)return;let v=b.touches[0];o=v.clientX,r=v.clientY,d=t.currentTime,u=t.volume,l=null,a=setTimeout(()=>{c=!0,g=t.playbackRate,t.playbackRate=Q,i.showHint(`${Q}x \u5FEB\u8FDB\u4E2D`)},ke)},ae=b=>{if(i._locked||b.touches.length!==1||(clearTimeout(a),c))return;let v=b.touches[0],x=v.clientX-o,w=v.clientY-r;if(!l)if(Math.abs(x)>Z)l="seek";else if(Math.abs(w)>Z)l=v.clientX<i.clientWidth/2?"brightness":"volume";else return;if(l==="seek"){let _=x/i.clientWidth*xe,de=h(d+_,0,t.duration||0);t.currentTime=de,i.showHint(`${_>0?"+":""}${Math.round(_)}s`)}else if(l==="volume"){let _=-w/(i.clientHeight*.6);t.volume=h(u+_,0,1),t.muted=!1,m(t.volume),i.showHint(`\u97F3\u91CF ${Math.round(t.volume*100)}%`)}else l==="brightness"&&(i._brightness=h((i._brightness??1)+-w/(i.clientHeight*.6),.2,1.5),t.style.filter=`brightness(${i._brightness})`,i.showHint(`\u4EAE\u5EA6 ${Math.round(i._brightness*100)}%`))},le=b=>{if(clearTimeout(a),c){t.playbackRate=g,c=!1;return}if(!l){let v=Date.now(),x=b.changedTouches[0].clientX;if(v-f<we&&Math.abs(x-T)<60){let w=x>i.clientWidth/2;i.seekBy(w?J:-J),f=0}else f=v,T=x}l=null};s.addEventListener("touchstart",P,{signal:e,passive:!0}),s.addEventListener("touchmove",ae,{signal:e,passive:!0}),s.addEventListener("touchend",le,n)}var te=10,H=30,ie=.1;function ne(i,e){let t=s=>{if(i._locked)return;let n=s.target.tagName;if(n==="INPUT"||n==="TEXTAREA"||s.target.isContentEditable)return;let o=i.video,r=i.speeds;switch(s.key){case" ":case"k":s.preventDefault(),i.togglePlay();break;case"ArrowLeft":s.preventDefault(),i.seekBy(s.shiftKey?-H:-te);break;case"ArrowRight":s.preventDefault(),i.seekBy(s.shiftKey?H:te);break;case"j":i.seekBy(-H);break;case"l":i.seekBy(H);break;case"ArrowUp":s.preventDefault(),o.volume=h(o.volume+ie,0,1),o.muted=!1,m(o.volume),i.showHint(`\u97F3\u91CF ${Math.round(o.volume*100)}%`);break;case"ArrowDown":s.preventDefault(),o.volume=h(o.volume-ie,0,1),m(o.volume),i.showHint(`\u97F3\u91CF ${Math.round(o.volume*100)}%`);break;case"m":i.toggleMute();break;case"f":i.toggleFullscreen();break;case"p":i.togglePiP();break;case">":case".":se(i,r,1);break;case"<":case",":se(i,r,-1);break;case"Escape":i._menuOpen?i.closeMenu():document.fullscreenElement||document.webkitFullscreenElement?i.toggleFullscreen():i.dispatchEvent(new CustomEvent("back"));break;default:/^[0-9]$/.test(s.key)&&o.duration&&(o.currentTime=parseInt(s.key,10)/10*o.duration);break}};document.addEventListener("keydown",t,{signal:e})}function se(i,e,t){let s=i.video.playbackRate,n=e.indexOf(s);n===-1&&(n=e.reduce((r,d,u)=>Math.abs(d-s)<Math.abs(e[r]-s)?u:r,0));let o=h(n+t,0,e.length-1);i.setRate(e[o]),i.showHint(`${e[o]}x`)}var oe=[.5,.75,1,1.25,1.5,2,3],_e=15,Ee=5,Le=3e3,re=10,k=60,R=class extends HTMLElement{static get observedAttributes(){return["src","title","video-id","autoplay","poster"]}constructor(){super(),this.attachShadow({mode:"open"}),this.engine=null,this._videoId=null,this._hideTimer=null,this._hintTimer=null,this._loadGen=0,this._lastSaveTime=-1,this._locked=!1,this._menuOpen=!1,this._ac=null}connectedCallback(){this._ac=new AbortController,this._render(),this._cacheEls(),this._initState(),W(this,this._ac.signal),ee(this,this._ac.signal),ne(this,this._ac.signal),this._setupVideoEvents(),this._setupAutoHide(),this._setupMediaSession();let e=this.getAttribute("src");e&&this.loadStream(e)}disconnectedCallback(){this.destroy()}attributeChangedCallback(e,t,s){t!==s&&(e==="title"&&this._titleEl?this._titleEl.textContent=s||"":e==="src"&&s&&this.engine?this.loadStream(s):e==="poster"&&this.video&&(s?this.video.setAttribute("poster",s):this.video.removeAttribute("poster")))}_render(){let e=this.getAttribute("poster");this.shadowRoot.innerHTML=`
            <style>${j}</style>
            <video class="gyp-video" id="video" playsinline webkit-playsinline ${e?`poster="${e}"`:""}></video>
            <div class="gyp-surface" id="surface"></div>

            <div class="gyp-center" id="center"><div class="gyp-center-btn" id="centerBtn">${p.play}</div></div>
            <div class="gyp-hint" id="hint" aria-live="polite"></div>
            <div class="gyp-buffering hidden" id="buffering"><div class="gyp-spinner"></div></div>
            <div class="gyp-loading hidden" id="loading"><div class="gyp-spinner"></div></div>

            <div class="gyp-top" id="top">
                <button class="gyp-btn" id="backBtn" aria-label="\u8FD4\u56DE">${p.back}</button>
                <span class="gyp-title" id="title">${this.getAttribute("title")||""}</span>
            </div>

            <button class="gyp-btn gyp-lock" id="lockBtn" aria-label="\u9501\u5B9A">${p.lock}</button>

            <div class="gyp-resume hidden" id="resume">
                <span class="gyp-resume-text" id="resumeText"></span>
                <button class="gyp-resume-btn gyp-resume-yes" id="resumeYes">\u7EE7\u7EED\u64AD\u653E</button>
                <button class="gyp-resume-btn gyp-resume-no" id="resumeNo">\u4ECE\u5934\u5F00\u59CB</button>
            </div>

            <div class="gyp-menu hidden" id="menu"></div>

            <div class="gyp-mini" id="mini"><div class="gyp-mini-bar" id="miniBar"></div></div>

            <div class="gyp-scrim" id="scrim"></div>

            <div class="gyp-bottom" id="bottom">
                <div class="gyp-progress-bar">
                    <span class="gyp-time gyp-time-cur"><span id="timeCurrent">00:00</span></span>
                    <div class="gyp-progress" id="progress" role="slider" tabindex="0"
                         aria-label="\u64AD\u653E\u8FDB\u5EA6" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                        <div class="gyp-progress-track">
                            <div class="gyp-progress-buffered" id="buffered"></div>
                            <div class="gyp-progress-played" id="played"></div>
                        </div>
                        <div class="gyp-progress-thumb" id="thumb"></div>
                        <div class="gyp-progress-tip" id="tip">00:00</div>
                    </div>
                    <span class="gyp-time gyp-time-dur"><span id="timeDuration">00:00</span></span>
                </div>
                <div class="gyp-btns">
                    <!-- \u6DB2\u6001\u73BB\u7483\u5C42\uFF08effect \u6298\u5C04 / tint \u67D3\u8272 / shine \u8FB9\u7F18\u9AD8\u5149\uFF09\uFF0C\u5185\u5BB9\u5728\u5176\u4E0A -->
                    <div class="gyp-glass" aria-hidden="true">
                        <div class="gyp-glass-effect"></div>
                        <div class="gyp-glass-tint"></div>
                        <div class="gyp-glass-shine"></div>
                    </div>
                    <button class="gyp-btn" id="playBtn" aria-label="\u64AD\u653E/\u6682\u505C">${p.play}</button>
                    <button class="gyp-btn hidden" id="prevBtn" aria-label="\u4E0A\u4E00\u96C6">${p.prev}</button>
                    <button class="gyp-btn hidden" id="nextBtn" aria-label="\u4E0B\u4E00\u96C6">${p.next}</button>
                    <div class="gyp-volume" id="volume">
                        <button class="gyp-btn" id="volumeBtn" aria-label="\u9759\u97F3">${p.volumeHigh}</button>
                        <div class="gyp-volume-slider" id="volumeSlider">
                            <div class="gyp-volume-track"></div>
                            <div class="gyp-volume-fill" id="volumeFill"></div>
                            <div class="gyp-volume-thumb" id="volumeThumb"></div>
                        </div>
                    </div>
                    <div class="gyp-spacer"></div>
                    <button class="gyp-btn gyp-btn-text hidden" id="episodesBtn" aria-label="\u9009\u96C6">\u9009\u96C6</button>
                    <button class="gyp-btn gyp-btn-text" id="speedBtn" aria-label="\u500D\u901F">1x</button>
                    <button class="gyp-btn gyp-btn-text" id="qualityBtn" aria-label="\u753B\u8D28">\u81EA\u52A8</button>
                    <button class="gyp-btn hidden" id="subtitleBtn" aria-label="\u5B57\u5E55">${p.subtitle}</button>
                    <button class="gyp-btn ${E?"":"hidden"}" id="pipBtn" aria-label="\u753B\u4E2D\u753B">${p.pip}</button>
                    <button class="gyp-btn ${N?"":"hidden"}" id="fsBtn" aria-label="\u5168\u5C4F">${p.fullscreen}</button>
                </div>
            </div>

            <!-- \u6DB2\u6001\u73BB\u7483 SVG \u7F6E\u6362\u6EE4\u955C\uFF08\u6CE8\u5165 Shadow DOM\uFF0C\u4F9B dock \u6298\u5C04\u5F15\u7528\uFF09-->
            <svg class="gyp-glass-svg" aria-hidden="true" width="0" height="0">
                <filter id="gyp-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="5" result="turbulence"/>
                    <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap"/>
                    <feDisplacementMap in="SourceGraphic" in2="softMap" scale="60" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
            </svg>

            <!-- \u9009\u96C6\u4FA7\u6ED1\u9762\u677F -->
            <div class="gyp-ep-panel hidden" id="epPanel">
                <div class="gyp-ep-header">
                    <span class="gyp-ep-title">\u9009\u96C6</span>
                    <button class="gyp-btn" id="epClose" aria-label="\u5173\u95ED">${p.back}</button>
                </div>
                <div class="gyp-ep-seasons" id="epSeasons"></div>
                <div class="gyp-ep-segments hidden" id="epSegments"></div>
                <div class="gyp-ep-list" id="epList"></div>
            </div>
        `}_cacheEls(){let e=t=>this.shadowRoot.getElementById(t);this.video=e("video"),this.els={surface:e("surface"),top:e("top"),bottom:e("bottom"),center:e("center"),centerBtn:e("centerBtn"),hint:e("hint"),buffering:e("buffering"),loading:e("loading"),backBtn:e("backBtn"),lockBtn:e("lockBtn"),playBtn:e("playBtn"),prevBtn:e("prevBtn"),nextBtn:e("nextBtn"),volume:e("volume"),volumeBtn:e("volumeBtn"),volumeSlider:e("volumeSlider"),volumeFill:e("volumeFill"),volumeThumb:e("volumeThumb"),speedBtn:e("speedBtn"),qualityBtn:e("qualityBtn"),subtitleBtn:e("subtitleBtn"),pipBtn:e("pipBtn"),fsBtn:e("fsBtn"),episodesBtn:e("episodesBtn"),epPanel:e("epPanel"),epClose:e("epClose"),epSeasons:e("epSeasons"),epSegments:e("epSegments"),epList:e("epList"),progress:e("progress"),played:e("played"),buffered:e("buffered"),thumb:e("thumb"),tip:e("tip"),timeCurrent:e("timeCurrent"),timeDuration:e("timeDuration"),mini:e("mini"),miniBar:e("miniBar"),menu:e("menu"),resume:e("resume"),resumeText:e("resumeText"),resumeYes:e("resumeYes"),resumeNo:e("resumeNo")},this._titleEl=e("title")}_initState(){let e=G(),t=U();this.video.volume=e,this.video.muted=t,this._rate=K(),this.video.playbackRate=this._rate,this.els.speedBtn.textContent=`${this._rate}x`,this._updateVolumeUI()}_setupVideoEvents(){let e=this.video,t={signal:this._ac.signal};e.addEventListener("play",()=>{this.els.playBtn.innerHTML=p.pause,this._flashCenter(p.play)},t),e.addEventListener("pause",()=>{this.els.playBtn.innerHTML=p.play,this._flashCenter(p.pause)},t),e.addEventListener("waiting",()=>this.els.buffering.classList.remove("hidden"),t),e.addEventListener("playing",()=>this.els.buffering.classList.add("hidden"),t),e.addEventListener("canplay",()=>this.els.buffering.classList.add("hidden"),t),e.addEventListener("loadedmetadata",()=>{this.els.timeDuration.textContent=y(e.duration)},t),e.addEventListener("timeupdate",()=>this._onTimeUpdate(),t),e.addEventListener("progress",()=>this._onBufferUpdate(),t),e.addEventListener("ended",()=>{this._ended=!0,this._disableStorage||F(this._videoId),this.els.playBtn.innerHTML=p.replay,this.dispatchEvent(new CustomEvent("ended",{detail:{videoId:this._videoId}}))},t),e.addEventListener("volumechange",()=>this._updateVolumeUI(),t)}_onTimeUpdate(){let e=this.video;if(!e.duration)return;let t=e.currentTime/e.duration*100;this.els.played.style.width=`${t}%`,this.els.thumb.style.left=`${t}%`,this.els.miniBar.style.width=`${t}%`,this.els.timeCurrent.textContent=y(e.currentTime),this.els.progress.setAttribute("aria-valuenow",Math.round(t));let s=e.currentTime;(this._lastSaveTime<0||Math.abs(s-this._lastSaveTime)>=Ee)&&(this._lastSaveTime=s,this._disableStorage||z(this._videoId,s),this.dispatchEvent(new CustomEvent("progress",{detail:{videoId:this._videoId,currentTime:s,duration:e.duration,percent:t}})))}_onBufferUpdate(){let e=this.video;if(e.buffered.length>0&&e.duration){let t=e.buffered.end(e.buffered.length-1);this.els.buffered.style.width=`${t/e.duration*100}%`}}async loadStream(e,t={}){let s=++this._loadGen;this._ended=!1,this._lastSaveTime=-1,this._disableStorage=!!t.disableStorage,this.els.loading.classList.remove("hidden"),t.title!=null&&this.setTitle(t.title),this._videoId=t.videoId||this.getAttribute("video-id")||e,this._hideError();let n=0;if(typeof t.startTime=="number"&&t.startTime>0)n=t.startTime;else if(!this._disableStorage){let o=X(this._videoId);if(o>_e&&(n=await this._promptResume(o),s!==this._loadGen))return}this.engine&&await this.engine.detach(),this.engine=new B(this.video,{onReady:()=>{s===this._loadGen&&(this.els.loading.classList.add("hidden"),n>0&&(this.video.currentTime=n),this.hasAttribute("autoplay")&&this.video.play().catch(()=>{}),this._refreshQualityLabel(),this._refreshTrackButton())},onError:(o,r)=>{s===this._loadGen&&(r&&(this.els.loading.classList.add("hidden"),this._showError(this._errorMessage(o))),this.dispatchEvent(new CustomEvent("error",{detail:o})))},onLevelSwitched:()=>this._refreshQualityLabel()}),await this.engine.load(e),s===this._loadGen&&this._loadSubtitles(t.subtitles||[])}_loadSubtitles(e){this.video.querySelectorAll("track").forEach(t=>t.remove()),e.forEach(t=>{let s=document.createElement("track");s.kind="subtitles",s.label=t.label||t.lang||"\u5B57\u5E55",s.srclang=t.lang||"und",s.src=t.url,t.default&&(s.default=!0),this.video.appendChild(s)}),this.els.subtitleBtn.classList.toggle("hidden",e.length===0),this._hasSubtitles=e.length>0}_refreshTrackButton(){let e=(this.video.textTracks?.length||0)>0,t=this.engine?this.engine.getAudioTracks().length>1:!1;this.els.subtitleBtn.classList.toggle("hidden",!e&&!t)}_promptResume(e){return new Promise(t=>{let{resume:s,resumeText:n,resumeYes:o,resumeNo:r}=this.els;n.textContent=`\u4E0A\u6B21\u770B\u5230 ${y(e)}`,s.classList.remove("hidden");let d=!1,u=l=>{d||(d=!0,s.classList.add("hidden"),t(l))};o.onclick=()=>u(e),r.onclick=()=>u(0),setTimeout(()=>u(e),6e3)})}_setupAutoHide(){let e=()=>{this._locked||(this.classList.remove("gyp-immersed"),clearTimeout(this._hideTimer),this._hideTimer=setTimeout(()=>{!this.video.paused&&!this._menuOpen&&!this._controlsHovered&&this.classList.add("gyp-immersed")},Le))};this._showControls=e;let t={signal:this._ac.signal};this.shadowRoot.addEventListener("mousemove",e,t),this.video.addEventListener("pause",e,t),e()}toggleControls(){this._locked||(this.classList.contains("gyp-immersed")?this._showControls?.():(clearTimeout(this._hideTimer),this.classList.add("gyp-immersed")))}_setupMediaSession(){if(!("mediaSession"in navigator))return;let e=navigator.mediaSession,t=this.video;t.addEventListener("play",()=>{e.metadata=new MediaMetadata({title:this.getAttribute("title")||"Video"}),e.playbackState="playing"},{signal:this._ac.signal}),t.addEventListener("pause",()=>{e.playbackState="paused"},{signal:this._ac.signal}),e.setActionHandler("play",()=>t.play()),e.setActionHandler("pause",()=>t.pause()),e.setActionHandler("seekbackward",()=>this.seekBy(-re)),e.setActionHandler("seekforward",()=>this.seekBy(re)),e.setActionHandler("previoustrack",()=>this.dispatchEvent(new CustomEvent("prev"))),e.setActionHandler("nexttrack",()=>this.dispatchEvent(new CustomEvent("next")))}togglePlay(){this._locked||(this.video.paused?this.video.play().catch(()=>{}):this.video.pause())}play(){return this.video.play()}pause(){this.video.pause()}seek(e){this.video.currentTime=h(e,0,this.video.duration||0)}seekBy(e){this.video.currentTime=h(this.video.currentTime+e,0,this.video.duration||0),this.showHint(`${e>0?"+":""}${e}s`)}setVolume(e){this.video.volume=h(e,0,1),this.video.muted=!1,m(this.video.volume),S(!1)}toggleMute(){this.video.muted=!this.video.muted,S(this.video.muted)}setRate(e){this._rate=e,this.video.playbackRate=e,this.els.speedBtn.textContent=`${e}x`,Y(e)}setTitle(e){this.setAttribute("title",e),this._titleEl&&(this._titleEl.textContent=e)}showNextButton(e){this.els.nextBtn.classList.toggle("hidden",!e)}showPrevButton(e){this.els.prevBtn.classList.toggle("hidden",!e)}setEpisodes(e,t){this._episodes=Array.isArray(e)?e:[],this._currentEpId=t||null;let s=this._episodes.length>0;this.els.episodesBtn.classList.toggle("hidden",!s),s&&this._renderEpisodePanel()}setCurrentEpisode(e){this._currentEpId=e,this._episodes?.length&&this._renderEpisodePanel()}_renderEpisodePanel(){let e=this._episodes,t={};e.forEach(a=>{let c=a.season||1;(t[c]||(t[c]=[])).push(a)});let s=Object.keys(t).sort((a,c)=>a-c),n=s.length>1,o=e.find(a=>a.id===this._currentEpId),r=this._activeSeason||(o?String(o.season||1):s[0]);this._activeSeason=r,this.els.epSeasons.classList.toggle("hidden",!n),n&&(this.els.epSeasons.innerHTML=s.map(a=>`<button class="gyp-ep-season ${a===r?"active":""}" data-season="${a}">\u7B2C${a}\u5B63</button>`).join(""));let d=(t[r]||[]).slice().sort((a,c)=>(a.episode||0)-(c.episode||0));this._epSeasonList=d;let u=Math.ceil(d.length/k),l=u>1;if(this._activeSegSeason!==r){let a=d.findIndex(c=>c.id===this._currentEpId);this._activeSeg=a>=0?Math.floor(a/k):0,this._activeSegSeason=r}if(this._activeSeg>=u&&(this._activeSeg=0),this.els.epSegments.classList.toggle("hidden",!l),l){let a="";for(let c=0;c<u;c++){let g=c*k,f=Math.min(g+k,d.length),T=d[g]?.episode??g+1,P=d[f-1]?.episode??f;a+=`<button class="gyp-ep-seg ${c===this._activeSeg?"active":""}" data-seg="${c}">${T}-${P}</button>`}this.els.epSegments.innerHTML=a}this._renderEpisodeItems()}_renderEpisodeItems(){let e=this._epSeasonList||[],t=(this._activeSeg||0)*k,s=e.slice(t,t+k);this.els.epList.innerHTML=s.map(n=>{let o=n.id===this._currentEpId?"active":"",r=(n.title||`\u7B2C${n.episode}\u96C6`).replace(/</g,"&lt;");return`<button class="gyp-ep-item ${o}" data-id="${String(n.id).replace(/"/g,"&quot;")}" title="${r.replace(/"/g,"&quot;")}">
                <span class="gyp-ep-num">${n.episode||""}</span>
                <span class="gyp-ep-name">${r}</span>
            </button>`}).join("")}toggleEpisodePanel(e){let t=e??this.els.epPanel.classList.contains("hidden");t&&this.closeMenu?.(),this.els.epPanel.classList.toggle("hidden",!t),t&&this.els.epList.querySelector(".gyp-ep-item.active")?.scrollIntoView({block:"center"})}toggleFullscreen(){let e=document;e.fullscreenElement||e.webkitFullscreenElement?(e.exitFullscreen||e.webkitExitFullscreen).call(e):this.requestFullscreen?this.requestFullscreen().catch(()=>this._iosFullscreen()):this._iosFullscreen()}_iosFullscreen(){this.video.webkitEnterFullscreen&&this.video.webkitEnterFullscreen()}togglePiP(){E&&(document.pictureInPictureElement?document.exitPictureInPicture():this.video.requestPictureInPicture().catch(()=>{}))}toggleLock(){this._locked=!this._locked,this.classList.toggle("gyp-locked",this._locked),this.els.lockBtn.innerHTML=this._locked?p.unlock:p.lock,this._locked||this._showControls?.()}get speeds(){return oe}_updateVolumeUI(){let e=this.video.muted?0:this.video.volume;this.els.volumeFill.style.width=`${e*100}%`,this.els.volumeThumb.style.left=`${e*100}%`;let t=e===0?"mute":e<.5?"low":"high";t!==this._volTier&&(this._volTier=t,this.els.volumeBtn.innerHTML=t==="mute"?p.volumeMute:t==="low"?p.volumeLow:p.volumeHigh)}_refreshQualityLabel(){if(!this.engine)return;let e=this.engine.getCurrentLevel();if(e===-1)this.els.qualityBtn.textContent="\u81EA\u52A8";else{let t=this.engine.getLevels()[e];this.els.qualityBtn.textContent=t?t.name:"\u81EA\u52A8"}}showHint(e){this.els.hint.textContent=e,this.els.hint.classList.add("visible"),clearTimeout(this._hintTimer),this._hintTimer=setTimeout(()=>this.els.hint.classList.remove("visible"),700)}_flashCenter(e){this.els.centerBtn.innerHTML=e,this.els.center.classList.remove("flash"),this.els.center.offsetWidth,this.els.center.classList.add("flash")}_showError(e){let t=this.shadowRoot.querySelector(".gyp-error");t||(t=document.createElement("div"),t.className="gyp-error",t.innerHTML='<div class="gyp-error-msg"></div><button class="gyp-error-btn">\u91CD\u8BD5</button>',t.querySelector(".gyp-error-btn").onclick=()=>{this._hideError();let s=this.getAttribute("src");s&&this.loadStream(s,{videoId:this._videoId})},this.shadowRoot.appendChild(t)),t.querySelector(".gyp-error-msg").textContent=e,t.classList.remove("hidden")}_hideError(){let e=this.shadowRoot.querySelector(".gyp-error");e&&e.classList.add("hidden")}_errorMessage(e){let t=e?.type;if(t&&/network/i.test(t))return"\u7F51\u7EDC\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u65E0\u6CD5\u52A0\u8F7D\u89C6\u9891";if(t&&/media/i.test(t))return"\u89C6\u9891\u89E3\u7801\u5931\u8D25\uFF0C\u683C\u5F0F\u53EF\u80FD\u4E0D\u53D7\u652F\u6301";let s=e?.code;return s===2?"\u7F51\u7EDC\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u65E0\u6CD5\u52A0\u8F7D\u89C6\u9891":s===3?"\u89C6\u9891\u89E3\u7801\u5931\u8D25\uFF0C\u683C\u5F0F\u53EF\u80FD\u4E0D\u53D7\u652F\u6301":s===4?"\u89C6\u9891\u6E90\u4E0D\u53EF\u7528\u6216\u683C\u5F0F\u4E0D\u652F\u6301":"\u89C6\u9891\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"}toggleMenu(e){if(this._menuOpen===e){this.closeMenu();return}this.toggleEpisodePanel(!1),this._menuOpen=e,this.els.menu.classList.remove("hidden"),this.els.menu.innerHTML=this._buildMenu(e),this._bindMenuItems(e);let t=this.els.menu.querySelector(".gyp-menu-item");t&&(t.tabIndex=0,t.focus()),this._bindMenuKeys()}closeMenu(){this._menuOpen&&(this._menuOpen=!1,this.els.menu.classList.add("hidden"))}_bindMenuKeys(){let e=Array.from(this.els.menu.querySelectorAll(".gyp-menu-item"));e.forEach((t,s)=>{t.tabIndex=0,t.onkeydown=n=>{n.key==="ArrowDown"?(n.preventDefault(),e[(s+1)%e.length].focus()):n.key==="ArrowUp"?(n.preventDefault(),e[(s-1+e.length)%e.length].focus()):(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t.click())}})}_buildMenu(e){return e==="speed"?this._menuSpeed():e==="quality"?this._menuQuality():e==="subtitle"?this._menuSubtitle():""}_menuSpeed(){let e=this.video.playbackRate;return'<div class="gyp-menu-title">\u64AD\u653E\u901F\u5EA6</div>'+oe.map(t=>`<div class="gyp-menu-item ${t===e?"active":""}" data-speed="${t}">
                <span>${t===1?"\u6B63\u5E38":t+"x"}</span>${p.check.replace("<svg",'<svg class="gyp-menu-check"')}
            </div>`).join("")}_menuQuality(){let e=this.engine?this.engine.getLevels():[];if(e.length===0)return'<div class="gyp-menu-title">\u753B\u8D28</div><div class="gyp-menu-item active"><span>\u81EA\u52A8</span></div>';let t=this.engine.getCurrentLevel(),s=[...e].sort((r,d)=>d.height-r.height),n=p.check.replace("<svg",'<svg class="gyp-menu-check"'),o='<div class="gyp-menu-title">\u753B\u8D28</div>';return o+=`<div class="gyp-menu-item ${t===-1?"active":""}" data-level="-1"><span>\u81EA\u52A8</span>${n}</div>`,o+=s.map(r=>`<div class="gyp-menu-item ${t===r.index?"active":""}" data-level="${r.index}">
                <span>${r.name}</span>${n}
            </div>`).join(""),o}_menuSubtitle(){let e=Array.from(this.video.textTracks||[]),t=p.check.replace("<svg",'<svg class="gyp-menu-check"'),s=e.some(r=>r.mode==="showing"),n='<div class="gyp-menu-title">\u5B57\u5E55</div>';n+=`<div class="gyp-menu-item ${s?"":"active"}" data-sub="-1"><span>\u5173\u95ED</span>${t}</div>`,n+=e.map((r,d)=>`<div class="gyp-menu-item ${r.mode==="showing"?"active":""}" data-sub="${d}">
                <span>${r.label||r.language||`\u5B57\u5E55 ${d+1}`}</span>${t}
            </div>`).join("");let o=this.engine?this.engine.getAudioTracks():[];if(o.length>1){let r=this.engine.getCurrentAudioTrack();n+='<div class="gyp-menu-title">\u97F3\u8F68</div>',n+=o.map(d=>`<div class="gyp-menu-item ${d.id===r?"active":""}" data-audio="${d.id}">
                    <span>${d.name}</span>${t}
                </div>`).join("")}return n}_bindMenuItems(e){this.els.menu.querySelectorAll(".gyp-menu-item").forEach(t=>{t.addEventListener("click",()=>{if(e==="speed")this.setRate(parseFloat(t.dataset.speed));else if(e==="quality")this._applyQuality(parseInt(t.dataset.level,10));else if(e==="subtitle"){if(t.dataset.audio!=null){this._applyAudioTrack(parseInt(t.dataset.audio,10));return}this._applySubtitle(parseInt(t.dataset.sub,10))}this.closeMenu()})})}_applyQuality(e){this.engine&&this.engine.setLevel(e),this._refreshQualityLabel()}_applySubtitle(e){Array.from(this.video.textTracks||[]).forEach((s,n)=>{s.mode=n===e?"showing":"hidden"})}_applyAudioTrack(e){this.engine&&this.engine.setAudioTrack(e),this._menuOpen==="subtitle"&&(this.els.menu.innerHTML=this._buildMenu("subtitle"),this._bindMenuItems("subtitle"))}destroy(){this._saveProgress(),this.engine&&(this.engine.detach(),this.engine=null),this._ac&&(this._ac.abort(),this._ac=null),clearTimeout(this._hideTimer),clearTimeout(this._hintTimer)}_saveProgress(){if(!this.video||this._ended)return;let{currentTime:e,duration:t}=this.video,s=t&&t-e<10;if(this.dispatchEvent(new CustomEvent("progress",{detail:{videoId:this._videoId,currentTime:s?0:e,duration:t||0,percent:t?e/t*100:0,final:!0}})),!this._disableStorage){if(s){F(this._videoId);return}z(this._videoId,e)}}};customElements.get("gy-player")||customElements.define("gy-player",R);var Je=R;})();
