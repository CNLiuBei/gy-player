/* GY Player v1.0.0 | MIT License */
(()=>{var it=Object.defineProperty;var st=(s,e,t)=>e in s?it(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var H=(s,e,t)=>st(s,typeof e!="symbol"?e+"":e,t);var me=`
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

    /* \u5B57\u5E55\u5B57\u53F7\u7531 layoutVideoBox \u6309\u753B\u9762\u9AD8\u5EA6\u5199\u5165 --gyp-subtitle-size */
    --gyp-subtitle-scale: 1;
    --gyp-subtitle-size: clamp(0.75rem, 0.42rem + 1.1vw, 1rem);

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
}

:host(.gyp-fullscreen) {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    width: 100vw;
    height: 100vh;
    height: 100dvh;   /* \u52A8\u6001\u89C6\u53E3\uFF1A\u907F\u5F00\u79FB\u52A8\u6D4F\u89C8\u5668\u5730\u5740\u680F\u4F38\u7F29\u5BFC\u81F4\u7684\u9AD8\u5EA6\u8DF3\u53D8 */
    max-width: none;
    max-height: none;
    background: #000;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.gyp-media {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
}

.gyp-video-box {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    container-type: size;
}

.gyp-video {
    width: 100%;
    height: 100%;
    display: block;
    background: transparent;
    object-fit: contain;
}



.gyp-subtitle-overlay {
    position: absolute;
    z-index: 8;
    left: 50%;
    transform: translateX(-50%);
    width: max-content;
    max-width: 92%;
    padding: 0.15em 0.55em;
    border-radius: 0.25em;
    font-size: var(--gyp-subtitle-size, clamp(0.75rem, calc(4.2cqh + 0.35rem), 1.35rem));
    line-height: 1.25;
    color: #fff;
    background: rgba(0, 0, 0, 0.42);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
    text-align: center;
    white-space: pre-wrap;
    pointer-events: none;
    box-sizing: border-box;
    transition: top 0.3s cubic-bezier(0.32, 0.72, 0, 1), bottom 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

/* \u975E\u7CFB\u7EDF\u5168\u5C4F/\u753B\u4E2D\u753B\uFF1A\u5F31\u5316\u539F\u751F track\uFF0C\u8D70 overlay\uFF08\u52FF display:none\uFF0C\u4F1A\u963B\u6B62 WebKit \u52A0\u8F7D cues\uFF09 */
:host(:not(.gyp-ios-native-fs):not(.gyp-pip-active)) .gyp-video::cue {
    opacity: 0;
}
:host(:not(.gyp-ios-native-fs):not(.gyp-pip-active)) .gyp-video::-webkit-media-text-track-container {
    visibility: hidden;
    opacity: 0;
    pointer-events: none;
}

.gyp-danmaku-layer {
    position: absolute;
    inset: 0;
    z-index: 4;
    overflow: hidden;
    pointer-events: none;
}

.gyp-danmaku-item {
    position: absolute;
    left: 100%;
    max-width: 92%;
    padding: 0.12rem 0.45rem;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.28);
    color: #fff;
    font-size: clamp(0.75rem, calc(3.8cqh + 0.25rem), 1.05rem);
    font-weight: 700;
    line-height: 1.35;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
    white-space: nowrap;
    will-change: transform;
}

.gyp-danmaku-item.is-scroll {
    animation: gyp-danmaku-scroll 7.2s linear forwards;
}

.gyp-danmaku-item.is-top,
.gyp-danmaku-item.is-bottom {
    left: 50%;
    transform: translateX(-50%);
    animation: gyp-danmaku-fixed 3.4s ease forwards;
}

.gyp-danmaku-item.is-local {
    background: rgba(10, 132, 255, 0.35);
}

@keyframes gyp-danmaku-scroll {
    from { transform: translateX(0); }
    to { transform: translateX(calc(-100% - var(--gyp-danmaku-travel, 100%))); }
}

@keyframes gyp-danmaku-fixed {
    0%, 82% { opacity: 1; }
    100% { opacity: 0; }
}

.gyp-danmaku-inline {
    flex: 0 1 min(420px, 40vw);
    min-width: 0;
    width: min(420px, 40vw);
    display: flex;
    align-items: center;
    gap: 6px;
    position: relative;
    z-index: 3;
}

.gyp-danmaku-inline input,
.gyp-danmaku-inline button {
    min-height: 32px;
    border: 0;
    border-radius: 999px;
    font: inherit;
    color: #fff;
}

.gyp-danmaku-inline button {
    flex: 0 0 auto;
    padding: 0 12px;
    font-weight: 600;
    cursor: pointer;
}

.gyp-danmaku-send {
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim);
    font-weight: 600;
    transition: background 0.16s ease, transform 0.12s ease;
}

.gyp-danmaku-send:hover {
    background: rgba(255, 255, 255, 0.16);
}

.gyp-danmaku-send:active {
    transform: scale(0.96);
    background: rgba(255, 255, 255, 0.2);
}

.gyp-danmaku-inline button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.gyp-danmaku-input {
    flex: 1;
    min-width: 0;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.14);
    outline: none;
}

.gyp-danmaku-input::placeholder {
    color: rgba(255, 255, 255, 0.62);
}

.gyp-danmaku-input:disabled {
    opacity: 0.5;
}

.gyp-brightness-overlay {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    background: #000;
    transition: opacity 0.12s ease;
}

.hidden { display: none !important; }

/* ===== \u70B9\u51FB\u6355\u83B7\u5C42 ===== */
.gyp-surface {
    position: absolute;
    inset: 0;
    z-index: 1;
    /* \u89E6\u5C4F\u624B\u52BF\uFF08\u6A2A\u6ED1\u8FDB\u5EA6/\u7AD6\u6ED1\u97F3\u91CF\u4EAE\u5EA6\uFF09\u671F\u95F4\u963B\u6B62\u9875\u9762\u8DDF\u968F\u6EDA\u52A8\u4E0E\u6D4F\u89C8\u5668\u624B\u52BF */
    touch-action: none;
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
    padding-left: calc(18px + env(safe-area-inset-left, 0px));
    padding-right: calc(18px + env(safe-area-inset-right, 0px));
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
    left: calc(12px + env(safe-area-inset-left, 0px));
    right: calc(12px + env(safe-area-inset-right, 0px));
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
    gap: 8px;
    position: relative;
    padding: 6px 10px;
    border-radius: 24px;
    isolation: isolate;
    box-shadow: 0 6px 18px rgba(0,0,0,0.28), 0 0 24px rgba(0,0,0,0.12);
}

.gyp-btns-leading,
.gyp-btns-trailing {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1 1 0;
    min-width: 0;
    position: relative;
    z-index: 3;
}

.gyp-btns-leading { justify-content: flex-start; }
.gyp-btns-trailing { justify-content: flex-end; }
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
.gyp-btns > .gyp-btns-leading,
.gyp-btns > .gyp-btns-trailing,
.gyp-btns > .gyp-danmaku-inline { position: relative; z-index: 3; }
.gyp-btns-leading > .gyp-btn,
.gyp-btns-leading > .gyp-volume,
.gyp-btns-trailing > .gyp-btn { position: relative; z-index: 3; }
/* SVG \u6EE4\u955C\u5BB9\u5668\uFF1A\u4E0D\u5360\u5E03\u5C40 */
.gyp-glass-svg { position: absolute; width: 0; height: 0; pointer-events: none; }

/* \u9690\u85CF\u63A7\u4EF6\uFF08\u6C89\u6D78\u6001\uFF09\uFF1Adock \u4E0B\u6ED1\u6DE1\u51FA\uFF0Cscrim \u540C\u6B65\u6DE1\u51FA\uFF1B\u7981\u7528\u547D\u4E2D\u4E0E\u53EF\u89C1\u6027 */
:host(.gyp-immersed) .gyp-top,
:host(.gyp-immersed) .gyp-bottom {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transform: translateY(-10px);
}
:host(.gyp-immersed) .gyp-bottom { transform: translateY(18px); }
:host(.gyp-immersed) .gyp-scrim { opacity: 0; pointer-events: none; }
:host(.gyp-immersed) .gyp-mini { opacity: 1; pointer-events: none; }
/* \u6C89\u6D78\u6001\uFF1A\u5168\u5C4F\u70B9\u51FB\u5C42\u7F6E\u9876\uFF0C\u4EFB\u610F\u533A\u57DF\u53EF\u5524\u51FA\u63A7\u4EF6\uFF08\u907F\u514D\u70B9\u5230\u900F\u660E\u63A7\u4EF6\uFF09 */
:host(.gyp-immersed) .gyp-surface { z-index: 30; }
:host(.gyp-locked.gyp-immersed) .gyp-surface { z-index: 8; }
:host(.gyp-immersed:not(.gyp-locked)) .gyp-lock {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
}

/* \u8BE6\u60C5\u9875\u5185\u5D4C\uFF1A\u9690\u85CF\u9876\u680F\uFF08\u9875\u9762\u81EA\u6709\u6807\u9898/\u5BFC\u822A\uFF09\uFF0C\u6C89\u6D78\u65F6\u4FDD\u7559\u8FF7\u4F60\u8FDB\u5EA6\u6761 */
:host(.gyp-layout-inline) .gyp-top { display: none; }
:host(.gyp-layout-inline.gyp-immersed) .gyp-mini {
    height: 4px;
    opacity: 1;
    z-index: 11;
}

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
    background: #fff;
    border-radius: 5px;
    width: 0;
    box-shadow: 0 0 6px rgba(255,255,255,0.45);
}
.gyp-progress-thumb {
    position: absolute;
    top: 50%;
    left: 0;
    width: 28px; height: 16px;
    border-radius: 999px;
    transform: translate(-50%, -50%) scale(0);
    transform-origin: center;
    transition: transform 0.18s cubic-bezier(0.32, 0.72, 0, 1), height 0.15s ease;
    pointer-events: none;
    overflow: hidden;
    /* \u5E73\u65F6\uFF1A\u767D\u8272\u836F\u4E38 */
    background: #fff;
    box-shadow: 0 1px 8px rgba(0,0,0,0.35), 0 0 2px rgba(0,0,0,0.2);
}
.gyp-progress:hover .gyp-progress-thumb,
.gyp-progress.dragging .gyp-progress-thumb { transform: translate(-50%, -50%) scale(1); }

/* \u6DB2\u6001\u73BB\u7483\u900F\u955C\u4E09\u5C42\uFF08\u9ED8\u8BA4\u9690\u85CF\uFF0C\u62D6\u52A8\u65F6\u663E\u73B0\uFF09*/
.gyp-thumb-lens, .gyp-thumb-overlay, .gyp-thumb-specular {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
}
.gyp-thumb-lens {
    z-index: 0;
    backdrop-filter: blur(0.6px);
    -webkit-backdrop-filter: blur(0.6px);
    filter: url(#gyp-thumb-lens);
}
.gyp-thumb-overlay {
    z-index: 1;
    background: rgba(255,255,255,0.10);
}
.gyp-thumb-specular {
    z-index: 2;
    box-shadow:
        inset 1px 1px 0 rgba(255,255,255,0.35),
        inset 0 0 14px rgba(255,255,255,0.45),
        inset -1px -1px 0 rgba(255,255,255,0.18);
}
/* \u62D6\u52A8\u65F6\uFF1A\u836F\u4E38\u53D8\u900F\u660E\u73BB\u7483\u900F\u955C\uFF0C\u4E09\u5C42\u663E\u73B0 */
.gyp-progress.dragging .gyp-progress-thumb {
    background: transparent;
    box-shadow: none;
}
.gyp-progress.dragging .gyp-thumb-lens,
.gyp-progress.dragging .gyp-thumb-overlay,
.gyp-progress.dragging .gyp-thumb-specular { opacity: 1; }

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
    background: #fff;
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
.gyp-btn:focus { outline: none; }
.gyp-btn:focus-visible { outline: none; }
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
    width: 16px; height: 12px;
    background: #fff;
    border-radius: 999px;
    transform: translate(-50%, -50%);
    box-shadow: 0 1px 6px rgba(0,0,0,0.4), 0 0 2px rgba(0,0,0,0.2);
    transition: transform 0.12s ease;
}
.gyp-volume-slider:active .gyp-volume-thumb { transform: translate(-50%, -50%) scaleY(0.92) scaleX(1.12); }

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

/* ===== \u53CC\u51FB\u5FEB\u8FDB/\u5FEB\u9000\u6D9F\u6F2A\u53CD\u9988\uFF08\u79FB\u52A8\u7AEF\u4E24\u4FA7\uFF09===== */
.gyp-dbltap {
    position: absolute;
    top: 0; bottom: 0;
    width: 38%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    z-index: 14;
    pointer-events: none;
    color: #fff;
    /* \u534A\u692D\u5706\u6C34\u6CE2\u7EB9\u5E95\u8272\uFF0C\u5411\u4E2D\u5FC3\u6536\u62E2 */
    background: radial-gradient(circle at center, rgba(255,255,255,0.18), rgba(255,255,255,0.06) 45%, transparent 70%);
    opacity: 0;
}
.gyp-dbltap.hidden { display: none; }
.gyp-dbltap-left { left: 0; border-radius: 0 50% 50% 0 / 0 50% 50% 0; }
.gyp-dbltap-right { right: 0; border-radius: 50% 0 0 50% / 50% 0 0 50%; }
.gyp-dbltap-icon { display: grid; place-items: center; }
.gyp-dbltap-icon svg { width: 38px; height: 38px; filter: drop-shadow(0 1px 4px rgba(0,0,0,0.5)); }
/* \u4E24\u4E2A\u7BAD\u5934\u8FDE\u7EED\u95EA\u52A8\uFF0C\u6A21\u62DF\u65B9\u5411\u6D41\u52A8 */
.gyp-dbltap-icon svg:nth-child(2) { margin-left: -10px; }
.gyp-dbltap-text {
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 3px rgba(0,0,0,0.6);
}
.gyp-dbltap.active {
    animation: gyp-dbltap-pulse 0.6s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes gyp-dbltap-pulse {
    0% { opacity: 0; }
    25% { opacity: 1; }
    100% { opacity: 0; }
}
/* \u7BAD\u5934\u5FAE\u52A8 */
.gyp-dbltap.active .gyp-dbltap-icon {
    animation: gyp-dbltap-nudge 0.5s ease;
}
@keyframes gyp-dbltap-nudge {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(var(--gyp-nudge, 4px)); }
}
.gyp-dbltap-left .gyp-dbltap-icon { --gyp-nudge: -4px; }
.gyp-dbltap-right .gyp-dbltap-icon { --gyp-nudge: 4px; }

/* ===== \u7AD6\u6ED1\u4EAE\u5EA6/\u97F3\u91CF\u53EF\u89C6\u5316\u6307\u793A\uFF08\u4E2D\u592E\u6DB2\u6001\u73BB\u7483\u80F6\u56CA\uFF09===== */
.gyp-vslide {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px;
    border-radius: 16px;
    background: var(--gyp-glass-bg);
    backdrop-filter: var(--gyp-glass-blur);
    -webkit-backdrop-filter: var(--gyp-glass-blur);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 6px 24px rgba(0,0,0,0.4);
    z-index: 20;
    pointer-events: none;
}
.gyp-vslide.hidden { display: none; }
.gyp-vslide-icon { flex: 0 0 auto; display: grid; place-items: center; }
.gyp-vslide-icon svg { width: 22px; height: 22px; display: block; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4)); }
.gyp-vslide-track {
    flex: 0 0 auto;
    width: 120px; height: 5px;
    border-radius: 5px;
    background: rgba(255,255,255,0.28);
    overflow: hidden;
}
.gyp-vslide-fill {
    height: 100%;
    width: 0;
    background: #fff;
    border-radius: 5px;
    box-shadow: 0 0 6px rgba(255,255,255,0.45);
}

/* ===== \u79FB\u52A8\u7AEF\u9996\u6B21\u624B\u52BF\u5F15\u5BFC ===== */
.gyp-guide {
    position: absolute;
    inset: 0;
    z-index: 35;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: gyp-mask-in 0.25s ease;
}
.gyp-guide.hidden { display: none; }
.gyp-guide-card {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 22px 24px;
    margin: 0 24px;
    max-width: 360px;
    border-radius: 20px;
    background: var(--gyp-glass-bg-solid);
    border: 0.5px solid var(--gyp-glass-border);
    box-shadow: var(--gyp-glass-rim), 0 12px 40px rgba(0,0,0,0.5);
}
.gyp-guide-title {
    font-size: 15px; font-weight: 700;
    letter-spacing: 0.02em; opacity: 0.95;
    text-align: center;
}
.gyp-guide-row {
    display: flex; align-items: center; gap: 14px;
    font-size: 14px; font-weight: 500; opacity: 0.92;
}
.gyp-guide-ico {
    flex: 0 0 auto;
    width: 30px; height: 30px;
    display: grid; place-items: center;
    color: var(--gyp-accent);
}
.gyp-guide-ico svg { width: 24px; height: 24px; display: block; }
.gyp-guide-btn {
    margin-top: 4px;
    padding: 11px 0;
    border: none; border-radius: 14px;
    background: var(--gyp-accent); color: #fff;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: transform 0.12s ease, opacity 0.15s ease;
}
.gyp-guide-btn:active { transform: scale(0.96); }

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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    background: rgba(0,0,0,0.35);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 16;
    pointer-events: none;
}
.gyp-loading-logo {
    max-height: 6rem; max-width: 60%;
    object-fit: contain;
    filter: drop-shadow(0 2px 12px rgba(0,0,0,0.5));
    animation: gyp-logo-pulse 2s ease-in-out infinite;
}
.gyp-loading-logo.hidden { display: none; }
@keyframes gyp-logo-pulse {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.03); }
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
    right: calc(18px + env(safe-area-inset-right, 0px));
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
:host(:not(.gyp-immersed)) .gyp-lock { opacity: 1; visibility: visible; pointer-events: auto; }

/* ===== \u9009\u96C6\u9762\u677F\uFF08\u4E0E\u8BBE\u7F6E\u83DC\u5355\u7EDF\u4E00\uFF1A\u53F3\u4E0B\u6D6E\u8D77\u73BB\u7483\u9762\u677F\uFF09===== */
.gyp-ep-panel {
    position: absolute;
    right: 16px;
    right: calc(16px + env(safe-area-inset-right, 0px));
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

/* \u5B63\u5BFC\u822A\uFF1A\u2039 \u7B2CN\u5B63 \u2304 \u203A\uFF08\u5BF9\u9F50 web \u8BE6\u60C5\u9875\uFF09*/
.gyp-ep-nav {
    display: flex; align-items: center; gap: 6px;
    padding: 4px 8px 8px;
}
.gyp-ep-nav.hidden { display: none; }
.gyp-ep-arrow {
    flex: 0 0 auto; width: 30px; height: 30px;
    display: grid; place-items: center;
    border: none; border-radius: 50%;
    background: rgba(255,255,255,0.12); color: #fff; cursor: pointer;
    transition: background 0.14s ease;
}
.gyp-ep-arrow:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
.gyp-ep-arrow:disabled { opacity: 0.3; cursor: default; }
.gyp-ep-arrow svg { width: 16px; height: 16px; display: block; }
.gyp-ep-current {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px;
    padding: 6px 12px; border: none; border-radius: 9px;
    background: rgba(255,255,255,0.12); color: #fff;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background 0.14s ease;
}
.gyp-ep-current:hover { background: rgba(255,255,255,0.2); }
.gyp-ep-caret { display: inline-flex; opacity: 0.7; }
.gyp-ep-caret svg { width: 14px; height: 14px; display: block; }

/* \u5B63\u4E0B\u62C9\u83DC\u5355\uFF08\u7EDD\u5BF9\u5B9A\u4F4D\u6D6E\u5C42\uFF09*/
.gyp-ep-dropdown {
    position: absolute; left: 8px; right: 8px; top: 76px; z-index: 5;
    background: var(--gyp-glass-bg-solid);
    border: 0.5px solid var(--gyp-glass-border); border-radius: 12px;
    box-shadow: var(--gyp-glass-rim), 0 12px 32px rgba(0,0,0,0.5);
    padding: 5px; max-height: 220px; overflow-y: auto;
    scrollbar-width: none; -ms-overflow-style: none;
}
.gyp-ep-dropdown::-webkit-scrollbar { display: none; }
.gyp-ep-dropdown.hidden { display: none; }
.gyp-ep-option {
    display: block; width: 100%; text-align: left;
    padding: 8px 11px; border: none; border-radius: 8px;
    background: transparent; color: #fff; font-size: 13px; cursor: pointer;
    transition: background 0.14s ease;
}
.gyp-ep-option:hover { background: rgba(255,255,255,0.16); }
.gyp-ep-option.active { background: var(--gyp-accent); }

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
    display: flex; flex-direction: column; gap: 2px;
    padding: 10px 11px; border-radius: 10px;
    border: none; background: transparent;
    color: #fff; text-align: left; cursor: pointer; width: 100%;
    transition: background 0.14s ease;
}
.gyp-ep-item:hover { background: rgba(255,255,255,0.16); }
.gyp-ep-item.active { background: rgba(255,255,255,0.1); }
.gyp-ep-line { display: flex; align-items: center; gap: 8px; }
.gyp-ep-num {
    flex: 0 0 auto; font-size: 13px; font-weight: 600;
    opacity: 0.55; font-variant-numeric: tabular-nums;
}
.gyp-ep-item.has-source .gyp-ep-num { opacity: 1; }
.gyp-ep-item.active .gyp-ep-num { opacity: 1; color: var(--gyp-accent); }
.gyp-ep-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gyp-ep-item.active .gyp-ep-name { font-weight: 600; }
/* \u6709\u6E90\u6807\u8BB0\uFF1A\u7EFF\u70B9 */
.gyp-ep-dot {
    flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%;
    background: #34c759; box-shadow: 0 0 6px rgba(52,199,89,0.5);
}
.gyp-ep-date { font-size: 11px; opacity: 0.45; padding-left: 2px; }

/* ===== \u8BBE\u7F6E\u83DC\u5355\uFF08\u6DB2\u6001\u73BB\u7483\u9762\u677F\uFF09===== */
.gyp-menu {
    position: absolute;
    right: 16px;
    right: calc(16px + env(safe-area-inset-right, 0px));
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

/* \u62BD\u5C49\u906E\u7F69\uFF1A\u684C\u9762\u7AEF\u4E0D\u663E\u793A\uFF08\u9762\u677F\u4E3A\u89D2\u843D\u5C0F\u6D6E\u5C42\uFF09\uFF0C\u4EC5\u79FB\u52A8\u7AEF\u5E95\u90E8\u62BD\u5C49\u65F6\u663E\u793A\u5E76\u53EF\u70B9\u51FB\u5173\u95ED */
.gyp-sheet-mask {
    position: absolute;
    inset: 0;
    z-index: 29;
    background: rgba(0,0,0,0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease;
}
.gyp-sheet-mask.hidden { display: none; }
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
.gyp-menu-item.is-disabled {
    opacity: 0.42;
    cursor: not-allowed;
    pointer-events: none;
}

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
.gyp-error-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    max-width: min(520px, 100%);
}
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
    white-space: nowrap;
}
.gyp-error-btn.secondary {
    background: rgba(255,255,255,0.14);
    color: #fff;
    border: 0.5px solid rgba(255,255,255,0.18);
    box-shadow: none;
}
.gyp-error-btn:active { transform: scale(0.95); }
/* ===== \u79FB\u52A8\u7AEF\u9002\u914D ===== */
@media (max-width: 640px) {
    .gyp-volume-slider { display: none; }
    /* \u7CBE\u7B80 dock\uFF1A\u4EC5\u4FDD\u7559\u64AD\u653E / \u8BBE\u7F6E / \u753B\u4E2D\u753B / \u5168\u5C4F */
    .gyp-btns-leading #prevBtn,
    .gyp-btns-leading #nextBtn,
    .gyp-btns-leading .gyp-volume,
    .gyp-btns-trailing #episodesBtn,
    .gyp-btns-trailing #speedBtn,
    .gyp-btns-trailing #qualityBtn,
    .gyp-btns-trailing #subtitleBtn {
        display: none !important;
    }
    .gyp-btns-leading,
    .gyp-btns-trailing {
        flex: 0 0 auto;
    }
    .gyp-btn { width: 40px; height: 40px; }
    .gyp-time { font-size: 12px; }
    .gyp-top {
        padding: 12px 14px;
        padding-top: calc(12px + env(safe-area-inset-top, 0px));
        padding-left: calc(14px + env(safe-area-inset-left, 0px));
        padding-right: calc(14px + env(safe-area-inset-right, 0px));
    }
    /* \u4FDD\u7559\u5B89\u5168\u533A\uFF0C\u907F\u514D\u6A2A\u5C4F\u5218\u6D77\u906E\u6321 */
    .gyp-bottom {
        left: calc(8px + env(safe-area-inset-left, 0px));
        right: calc(8px + env(safe-area-inset-right, 0px));
        bottom: calc(8px + env(safe-area-inset-bottom, 0px));
        gap: 8px;
    }
    .gyp-btns { padding: 5px 8px; border-radius: 22px; }
    .gyp-progress-bar { gap: 8px; padding: 0 4px; }
    .gyp-danmaku-inline {
        flex: 1 1 0;
        width: auto;
        min-width: 0;
        max-width: none;
        gap: 4px;
    }
    .gyp-danmaku-inline input,
    .gyp-danmaku-inline button {
        min-height: 30px;
        font-size: 12px;
    }
    .gyp-danmaku-input {
        padding: 0 8px;
    }
    .gyp-danmaku-send {
        padding: 0 8px;
        font-size: 12px;
        flex-shrink: 0;
    }

    /* \u8BBE\u7F6E\u83DC\u5355 \u2192 \u5E95\u90E8\u5168\u5BBD\u62BD\u5C49\uFF08bottom sheet\uFF09\uFF0C\u66F4\u6613\u62C7\u6307\u70B9\u6309 */
    .gyp-menu {
        left: 0; right: 0; bottom: 0;
        min-width: 0;
        width: 100%;
        max-height: 60%;
        padding: 8px 12px calc(16px + env(safe-area-inset-bottom, 0px));
        padding-left: calc(12px + env(safe-area-inset-left, 0px));
        padding-right: calc(12px + env(safe-area-inset-right, 0px));
        border-radius: 20px 20px 0 0;
        animation: gyp-sheet-up 0.26s cubic-bezier(0.32, 0.72, 0, 1);
    }
    /* \u62BD\u5C49\u9876\u90E8\u6293\u624B */
    .gyp-menu::before {
        content: '';
        display: block;
        width: 40px; height: 4px;
        margin: 2px auto 8px;
        border-radius: 999px;
        background: rgba(255,255,255,0.28);
    }
    .gyp-menu-item { padding: 13px 14px; font-size: 15px; }
    .gyp-error-actions {
        width: 100%;
        max-width: 280px;
        flex-direction: column;
    }
    .gyp-error-btn {
        width: 100%;
        min-height: 44px;
    }

    /* \u9009\u96C6\u9762\u677F \u2192 \u5E95\u90E8\u5168\u5BBD\u62BD\u5C49 */
    .gyp-ep-panel {
        left: 0; right: 0; bottom: 0;
        width: 100%; max-width: 100%;
        max-height: 72%;
        padding: 8px 10px calc(12px + env(safe-area-inset-bottom, 0px));
        padding-left: calc(10px + env(safe-area-inset-left, 0px));
        padding-right: calc(10px + env(safe-area-inset-right, 0px));
        border-radius: 20px 20px 0 0;
        animation: gyp-sheet-up 0.26s cubic-bezier(0.32, 0.72, 0, 1);
    }
    .gyp-ep-panel::before {
        content: '';
        display: block;
        width: 40px; height: 4px;
        margin: 2px auto 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.28);
    }
    /* \u96C6\u5217\u8868\u9879\u79FB\u52A8\u7AEF\u52A0\u5927\u70B9\u6309\u9AD8\u5EA6 */
    .gyp-ep-item { padding: 13px 12px; }
    .gyp-ep-name { font-size: 14px; }
    /* \u5B63\u4E0B\u62C9\u79FB\u52A8\u7AEF\u8DDF\u968F\u62BD\u5C49\u5BBD\u5EA6 */
    .gyp-ep-dropdown { left: 10px; right: 10px; top: 84px; }

    /* \u79FB\u52A8\u7AEF\uFF1A\u62BD\u5C49\u906E\u7F69\u53EF\u89C1\u4E14\u53EF\u70B9\u51FB\u5173\u95ED */
    .gyp-sheet-mask:not(.hidden) { opacity: 1; pointer-events: auto; }

    /* \u79FB\u52A8\u7AEF dock \u9632\u6EA2\u51FA\uFF1A\u7F29\u5C0F\u6309\u94AE\u95F4\u8DDD\uFF0C\u6587\u5B57\u6309\u94AE\u7D27\u51D1 */
    .gyp-btns { gap: 0; }
    .gyp-btn.gyp-btn-text { min-width: 40px; padding: 0 8px; }
    /* \u6807\u9898\u5B57\u53F7\u7565\u51CF\uFF0C\u907F\u514D\u6324\u5360\u8FD4\u56DE\u6309\u94AE */
    .gyp-title { font-size: 15px; }
}

/* ===== \u7AD6\u5C4F\u7A84\u5C4F\uFF08\u624B\u673A\u7AD6\u5C4F\uFF09\uFF1A\u8FDB\u4E00\u6B65\u538B\u7F29\u5F39\u5E55\u4E0E\u6309\u94AE\u95F4\u8DDD ===== */
@media (max-width: 480px) and (orientation: portrait) {
    .gyp-btns { padding: 4px 5px; }
    .gyp-btn { width: 38px; height: 38px; }
    .gyp-danmaku-inline input,
    .gyp-danmaku-inline button {
        min-height: 28px;
        font-size: 11px;
    }
    .gyp-danmaku-input { padding: 0 6px; }
    .gyp-danmaku-send { padding: 0 6px; }
}

/* \u5E95\u90E8\u62BD\u5C49\u4E0A\u6ED1\u52A8\u753B */
@keyframes gyp-sheet-up { from { opacity: 0.4; transform: translateY(100%); } }

/* ===== \u89E6\u5C4F\u8BBE\u5907\uFF1A\u589E\u5927\u89E6\u6478\u547D\u4E2D\u533A\u3001\u5E38\u663E\u8FDB\u5EA6\u6ED1\u5757 ===== */
@media (hover: none) {
    /* \u8FDB\u5EA6\u6761\u547D\u4E2D\u533A\u52A0\u9AD8\u5230 28px\uFF08\u89C6\u89C9\u8F68\u9053\u4E0D\u53D8\uFF09\uFF0C\u65B9\u4FBF\u624B\u6307\u62D6\u52A8 */
    .gyp-progress { height: 28px; }
    /* \u89E6\u5C4F\u6CA1\u6709 hover\uFF0C\u6ED1\u5757\u9ED8\u8BA4\u5E38\u663E\uFF08\u5C0F\u5C3A\u5BF8\uFF09\uFF0C\u62D6\u52A8\u65F6\u653E\u5927 */
    .gyp-progress-thumb { transform: translate(-50%, -50%) scale(0.5); }
    .gyp-progress.dragging .gyp-progress-thumb { transform: translate(-50%, -50%) scale(1.15); }
    /* \u89E6\u5C4F\u8F68\u9053\u7565\u52A0\u539A\uFF0C\u63D0\u5347\u53EF\u89C1\u6027\u4E0E\u53EF\u64CD\u4F5C\u6027 */
    .gyp-progress-track { height: 6px; }
    .gyp-progress.dragging .gyp-progress-track { height: 8px; }
    /* \u89E6\u5C4F\u6CA1\u6709\u6307\u9488 hover\uFF0C\u6C14\u6CE1\u4EC5\u5728\u62D6\u52A8\u65F6\u663E\u793A */
    .gyp-progress-tip { display: none; }
    .gyp-progress.dragging .gyp-progress-tip { display: block; opacity: 1; }
    /* \u6309\u94AE :active \u7F29\u653E\u5728\u89E6\u5C4F\u4E0A\u4FDD\u7559\u5373\u65F6\u53CD\u9988\uFF0C\u4F46\u53BB\u6389 hover \u80CC\u666F\u5E38\u9A7B */
    .gyp-btn:hover { background: transparent; }
    .gyp-btn:active { background: rgba(255,255,255,0.18); }
    /* \u89E6\u5C4F\u8BBE\u5907\u9501\u5B9A\u65F6\u59CB\u7EC8\u4FDD\u7559\u89E3\u9501\u6309\u94AE\u53EF\u70B9 */
    :host(.gyp-locked) .gyp-lock { opacity: 0.75; pointer-events: auto; }
}

/* \u65E0\u969C\u788D\uFF1A\u7528\u6237\u504F\u597D\u51CF\u5C11\u900F\u660E\u5EA6 \u2192 \u56DE\u9000\u5B9E\u8272\uFF0C\u5173\u95ED\u6A21\u7CCA */
@media (prefers-reduced-transparency: reduce) {
    .gyp-menu, .gyp-ep-panel, .gyp-hint, .gyp-resume,
    .gyp-center-btn, .gyp-lock, .gyp-progress-tip, .gyp-vslide,
    .gyp-danmaku-send {
        background: var(--gyp-glass-bg-solid) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
    }
    /* dock \u73BB\u7483\uFF1A\u5173\u95ED\u6298\u5C04\u4E0E\u6A21\u7CCA\uFF0C\u52A0\u6DF1\u67D3\u8272\u4FDD\u8BC1\u53EF\u8BFB */
    .gyp-glass-effect { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    .gyp-glass-tint { background: var(--gyp-glass-bg-solid) !important; }
    /* \u8FDB\u5EA6\u6761 thumb\uFF1A\u62D6\u52A8\u65F6\u4E5F\u7528\u767D\u8272\u836F\u4E38\uFF0C\u4E0D\u8D70\u73BB\u7483\u900F\u955C */
    .gyp-progress.dragging .gyp-progress-thumb { background: #fff !important; box-shadow: 0 1px 8px rgba(0,0,0,0.35) !important; }
    .gyp-thumb-lens { filter: none !important; backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
}

/* \u5C0A\u91CD\u51CF\u5C11\u52A8\u6548\u504F\u597D */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
`;var u={play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 4.65C4.5 3.4 5.86 2.62 6.94 3.25l13.5 7.35a1.6 1.6 0 0 1 0 2.8l-13.5 7.35C5.86 21.38 4.5 20.6 4.5 19.35V4.65Z"/></svg>',pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1.5"/><rect x="14" y="4" width="4" height="16" rx="1.5"/></svg>',replay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/><path d="M3 3v5h5"/></svg>',prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5.14v13.72a1 1 0 0 1-1.5.87l-9-6.86a1 1 0 0 1 0-1.74l9-6.86a1 1 0 0 1 1.5.87Z"/><rect x="4" y="4" width="3" height="16" rx="1.3"/></svg>',next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.87l9-6.86a1 1 0 0 0 0-1.74l-9-6.86A1 1 0 0 0 8 5.14Z"/><rect x="17" y="4" width="3" height="16" rx="1.3"/></svg>',back:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',volumeHigh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',volumeLow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',volumeMute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z" fill="currentColor"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>',fullscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',exitFullscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>',pip:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6"/><rect x="2" y="13" width="10" height="7" rx="1.5" fill="currentColor" stroke="none"/></svg>',subtitle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M6 13h6M16 13h2M6 16h3M13 16h5" stroke-width="2.2"/></svg>',settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>',lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',unlock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.9-.9"/></svg>',airplay:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"/><path d="m12 15 5 6H7l5-6Z" fill="currentColor"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',forward:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a8 8 0 1 0 8 8"/><path d="M12 4 9 1m3 3-3 3"/><text x="12" y="15" font-size="7" fill="currentColor" stroke="none" text-anchor="middle" font-weight="700">10</text></svg>',rewind:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 4l3-3m-3 3 3 3"/><text x="12" y="15" font-size="7" fill="currentColor" stroke="none" text-anchor="middle" font-weight="700">10</text></svg>',chevronLeft:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',chevronRight:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',chevronDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',brightness:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'};function R(s){if(!s||isNaN(s)||!isFinite(s)||s<0)return"00:00";let e=Math.floor(s),t=Math.floor(e/3600),i=Math.floor(e%3600/60),n=e%60,a=r=>r.toString().padStart(2,"0");return t>0?`${t}:${a(i)}:${a(n)}`:`${a(i)}:${a(n)}`}function f(s,e,t){return isNaN(s)?e:Math.min(t,Math.max(e,s))}var j=navigator.userAgent||"",O=/iPhone|iPad|iPod/i.test(j)||navigator.maxTouchPoints>1&&/Macintosh/i.test(j),q=O||/Android/i.test(j),nt=/^((?!chrome|android).)*safari/i.test(j);function G(){if(!nt&&!O)return!1;let s=document.createElement("video");return s.canPlayType("application/vnd.apple.mpegurl")!==""||s.canPlayType("application/x-mpegURL")!==""}function at(s=document.createElement("video")){return typeof document<"u"&&document.pictureInPictureEnabled&&typeof s.requestPictureInPicture=="function"?!0:typeof s.webkitSupportsPresentationMode=="function"&&s.webkitSupportsPresentationMode("picture-in-picture")}var V=typeof document<"u"&&at(),fe=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled||O||typeof document.createElement("video").webkitEnterFullscreen=="function");function be(){return typeof window>"u"||!window.matchMedia?!1:window.matchMedia("(max-width: 640px)").matches}function C(){return typeof window<"u"&&("ontouchstart"in window||(navigator.maxTouchPoints??0)>0)}var Wt=C();function Y(s){if(!s?.buffered?.length)return 0;let e=s.currentTime;for(let t=0;t<s.buffered.length;t++)if(e>=s.buffered.start(t)&&e<=s.buffered.end(t))return Math.max(0,s.buffered.end(t)-e);for(let t=0;t<s.buffered.length;t++)if(s.buffered.start(t)>e)return Math.max(0,s.buffered.end(t)-e);return 0}var rt=4,ve=12e3,ot=60,lt=4,dt=15,ct=6,pt=3,ie="4.16.37",ut=[`https://cdn.jsdelivr.net/npm/shaka-player@${ie}/dist/shaka-player.compiled.js`,`https://unpkg.com/shaka-player@${ie}/dist/shaka-player.compiled.js`,`https://fastly.jsdelivr.net/npm/shaka-player@${ie}/dist/shaka-player.compiled.js`],W=null;function ht(s){return new Promise((e,t)=>{let i=document.createElement("script");i.src=s,i.async=!0,i.onload=()=>e(),i.onerror=()=>{i.remove(),t(new Error("\u811A\u672C\u52A0\u8F7D\u5931\u8D25\uFF1A"+s))},document.head.appendChild(i)})}function ye(){if(window.shaka)return Promise.resolve(window.shaka);if(W)return W;let s=window.GYP_SHAKA_URL||window.GYP_HLS_URL,e=s?[s]:ut;return W=(async()=>{let t=null;for(let i of e)try{if(await ht(i),window.shaka)return window.shaka.polyfill.installAll(),window.shaka;t=new Error("Shaka Player \u5DF2\u52A0\u8F7D\u4F46\u672A\u6302\u8F7D\u5230 window.shaka\uFF1A"+i)}catch(n){t=n}throw W=null,t||new Error("Shaka Player \u52A0\u8F7D\u5931\u8D25\uFF1A\u6240\u6709 CDN \u5747\u4E0D\u53EF\u7528")})(),W}function gt(s){return/\.m3u8(\?|$)/i.test(s)||/\.mpd(\?|$)/i.test(s)||/application\/(vnd\.apple\.mpegurl|x-mpegURL|dash\+xml)/i.test(s)}var X=class{constructor(e,t={},i={}){H(this,"_onShakaBuffering",e=>{this._destroyed||e.buffering||(this._netRetries=0,this._mediaRetries=0,this._maybeEmitReadyFromBuffer())});H(this,"_onShakaAdaptation",()=>{this._destroyed||this.callbacks.onLevelSwitched?.(this.getCurrentLevel())});H(this,"_onShakaError",e=>{if(this._destroyed)return;let t=e.detail,i=this._shakaGlobal,n=this._isShakaFatal(t),a=this._normalizeShakaError(t);if(!n){this.callbacks.onError?.(a,!1);return}if(i&&t?.category===i.util.Error.Category.NETWORK&&this._netRetries<ct){this._netRetries++;let r=Math.min(1e3*this._netRetries,5e3),o=this.video?.currentTime||0;this._retryTimer=setTimeout(async()=>{if(!(this._destroyed||!this.shaka))try{await this.shaka.load(this._url,o)}catch(c){this._destroyed||this.callbacks.onError?.(this._normalizeShakaError(c),!0)}},r),this.callbacks.onError?.(a,!1);return}if(i&&t?.category===i.util.Error.Category.MEDIA&&this._mediaRetries<pt){this._mediaRetries++;let r=this.video?.currentTime||0;this._retryTimer=setTimeout(async()=>{if(!(this._destroyed||!this.shaka))try{await this.shaka.load(this._url,r)}catch(o){this._destroyed||this.callbacks.onError?.(this._normalizeShakaError(o),!0)}},500),this.callbacks.onError?.(a,!1);return}this.callbacks.onError?.(a,!0)});H(this,"_onNativeError",async()=>{if(this._destroyed)return;let e=this.video.error;if(this.native&&this._isStream&&!this._fallbackTried){this._fallbackTried=!0;try{let t=await ye();if(this._destroyed)return;if(t.Player.isBrowserSupported()){this.video.removeAttribute("src"),this.video.load(),await this._loadShaka(this._url);return}}catch{}}this.callbacks.onError?.(e||new Error("\u539F\u751F\u64AD\u653E\u51FA\u9519"),!0)});this.video=e,this.callbacks=t,this.options=i,this.shaka=null,this.native=!1,this._destroyed=!1,this._netRetries=0,this._mediaRetries=0,this._abrEnabled=!0,this._shakaGlobal=null,this._hlsCompat=this._createHlsCompat()}get hls(){return this._hlsCompat}_createHlsCompat(){let e=this;return{get subtitleTracks(){if(!e.shaka)return[];try{return e.shaka.getTextTracks()||[]}catch{return[]}},set subtitleTrack(t){if(e.shaka)try{t===-1&&e.shaka.setTextTrackVisibility(!1)}catch{}}}}async load(e,t={}){if(await this.detach(),this._destroyed=!1,this._url=e,this._fallbackTried=!1,this._nativeFallbackTried=!1,this._startPosition=typeof t.startPosition=="number"&&t.startPosition>0?t.startPosition:0,clearTimeout(this._readyFallbackTimer),this._isStream=gt(e),!this._isStream){this._loadNative(e);return}await this._loadShaka(e)}_loadNative(e){this.native=!0,this.video.src=e;let t=this._startPosition||0;this.video.addEventListener("loadedmetadata",()=>{this._destroyed||t>0&&(this.video.currentTime=t)},{once:!0}),this.video.addEventListener("canplay",()=>{this._destroyed||this._emitReadyOnce()},{once:!0}),this.video.addEventListener("error",this._onNativeError,{once:!0}),this._readyFallbackTimer=setTimeout(()=>this._emitReadyOnce(),ve)}_emitReadyOnce(){this._readyEmitted||this._destroyed||(this._readyEmitted=!0,clearTimeout(this._readyFallbackTimer),this.callbacks.onReady?.())}_maybeEmitReadyFromBuffer(){if(this._readyEmitted||this._destroyed)return;Y(this.video)>=rt&&this._emitReadyOnce()}_buildShakaConfig(){let e=this.options.preferHDR===!0,t=this.options.allowedVideoRanges||["SDR","PQ","HLG"],i={streaming:{bufferingGoal:ot,rebufferingGoal:lt,bufferBehind:dt},abr:{enabled:!0},manifest:{hls:{useSafariBehaviorForLive:!0}}};return e?i.preferredVideoCodecs=["hev1","hvc1","dvh1","dvhe","avc1"]:i.preferredVideoCodecs=["avc1","hev1","hvc1"],Array.isArray(t)&&t.length>0&&!t.includes("SDR")&&(i.preferredVideoCodecs=["hev1","hvc1","dvh1","dvhe",...i.preferredVideoCodecs||[]]),i}async _loadShaka(e){let t;try{t=await ye()}catch(i){if(this._isStream&&G()){this._loadNative(e);return}this.callbacks.onError?.(i,!0);return}if(!this._destroyed){if(this._shakaGlobal=t,!t.Player.isBrowserSupported()){if(G()){this._loadNative(e);return}this.callbacks.onError?.(new Error("\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 Shaka Player"),!0);return}this.native=!1,this._readyEmitted=!1,this._abrEnabled=!0;try{if(this.shaka=new t.Player,await this.shaka.attach(this.video),this.shaka.configure(this._buildShakaConfig()),this.shaka.addEventListener("error",this._onShakaError),this.shaka.addEventListener("buffering",this._onShakaBuffering),this.shaka.addEventListener("adaptation",this._onShakaAdaptation),await this.shaka.load(e,this._startPosition||0),this._destroyed)return;try{this.shaka.setTextTrackVisibility(!1)}catch{}this._netRetries=0,this._mediaRetries=0,this._maybeEmitReadyFromBuffer(),this._readyFallbackTimer=setTimeout(()=>this._emitReadyOnce(),ve)}catch(i){if(this._destroyed)return;await this._fallbackFromShakaFailure(e,i)}}}async _fallbackFromShakaFailure(e,t){if(this._isStream&&G()&&!this._nativeFallbackTried){this._nativeFallbackTried=!0;try{this.shaka&&(await this.shaka.destroy(),this.shaka=null)}catch{}this._loadNative(e);return}this.callbacks.onError?.(this._normalizeShakaError(t),!0)}_normalizeShakaError(e){let t=this._shakaGlobal,i=e?.category;if(t?.util?.Error?.Category){if(i===t.util.Error.Category.NETWORK)return{type:"networkError",message:e.message,code:e.code};if(i===t.util.Error.Category.MEDIA)return{type:"mediaError",message:e.message,code:e.code}}return e?.code===2?{type:"networkError",code:2,message:e.message}:e?.code===3?{type:"mediaError",code:3,message:e.message}:e||{message:"\u64AD\u653E\u51FA\u9519"}}_isShakaFatal(e){let t=this._shakaGlobal;return!e||!t?.util?.Error?.Severity?!0:e.severity===t.util.Error.Severity.CRITICAL}seekTo(e){if(this._destroyed||!this.video)return;let t=Number.isFinite(this.video.duration)?this.video.duration:e,i=Math.max(0,Math.min(e,t||e));this.video.currentTime=i}_getVariantLevelList(){if(!this.shaka)return[];let e=this.shaka.getVariantTracks().filter(i=>i.height>0),t=new Map;for(let i of e){let n=t.get(i.height);(!n||(i.bandwidth||0)>(n.bandwidth||0))&&t.set(i.height,i)}return Array.from(t.entries()).sort((i,n)=>i[0]-n[0]).map(([i,n],a)=>({index:a,height:i,bitrate:n.bandwidth||0,name:`${i}p`,trackId:n.id}))}getLevels(){return this.native||!this.shaka?[]:this._getVariantLevelList().map(({trackId:e,...t})=>t)}getCurrentLevel(){if(this.native||!this.shaka||this._abrEnabled)return-1;let e=this.shaka.getVariantTracks().find(i=>i.active);if(!e?.height)return-1;let t=this._getVariantLevelList().find(i=>i.height===e.height);return t?t.index:-1}setLevel(e){if(this.native||!this.shaka)return;if(e===-1){this.shaka.configure({abr:{enabled:!0}}),this._abrEnabled=!0;return}let t=this._getVariantLevelList().find(n=>n.index===e);if(!t)return;this.shaka.configure({abr:{enabled:!1}}),this._abrEnabled=!1;let i=this.shaka.getVariantTracks().find(n=>n.id===t.trackId);i&&(this.shaka.selectVariantTrack(i,!0),this.callbacks.onLevelSwitched?.(e))}getAudioTracks(){if(this.shaka)return(this.shaka.getAudioLanguagesAndRoles()||[]).map((i,n)=>({id:n,name:i.label||i.language||`\u97F3\u8F68 ${n+1}`,lang:i.language||"",role:i.role||""}));let e=this.video.audioTracks;return e&&e.length>1?Array.from(e).map((t,i)=>({id:i,name:t.label||t.language||`\u97F3\u8F68 ${i+1}`,lang:t.language||""})):[]}getCurrentAudioTrack(){if(this.shaka){let t=this.shaka.getVariantTracks().find(a=>a.active);if(!t)return-1;let n=this.getAudioTracks().findIndex(a=>a.lang===(t.language||"")&&(a.role||"")===(t.audioRole||""));return n>=0?n:-1}let e=this.video.audioTracks;if(e&&e.length>1){for(let t=0;t<e.length;t++)if(e[t].enabled)return t}return-1}setAudioTrack(e){if(this.shaka){let i=this.getAudioTracks()[e];if(!i)return;this.shaka.selectAudioLanguage(i.lang,i.role||"");return}let t=this.video.audioTracks;if(t&&t.length>1)for(let i=0;i<t.length;i++)t[i].enabled=i===e}async detach(){if(this._destroyed=!0,clearTimeout(this._retryTimer),clearTimeout(this._readyFallbackTimer),this._readyEmitted=!1,this._netRetries=0,this._mediaRetries=0,this.shaka){try{await this.shaka.destroy()}catch{}this.shaka=null}if(this.video){this.video.removeEventListener("error",this._onNativeError);try{this.video.removeAttribute("src"),this.video.load()}catch{}}this.native=!1,this._abrEnabled=!0}};var se="gyp_";function M(s,e){try{localStorage.setItem(se+s,e)}catch{}}function B(s){try{return localStorage.getItem(se+s)}catch{return null}}function mt(s){try{localStorage.removeItem(se+s)}catch{}}function ne(s,e){!s||!isFinite(e)||M("time_"+s,String(Math.floor(e)))}function xe(s){if(!s)return 0;let e=B("time_"+s),t=e?parseFloat(e):0;return isFinite(t)?t:0}function ae(s){s&&mt("time_"+s)}function T(s){isFinite(s)&&M("volume",String(s))}function ke(){let s=B("volume");if(s===null)return 1;let e=parseFloat(s);return isFinite(e)?Math.min(1,Math.max(0,e)):1}function U(s){M("muted",s?"1":"0")}function _e(){return B("muted")==="1"}function we(s){isFinite(s)&&M("rate",String(s))}function Se(){let s=B("rate");if(s===null)return 1;let e=parseFloat(s);return isFinite(e)&&e>0?e:1}function re(s){!s||!s.kind||!s.value||M("quality_pref",JSON.stringify({kind:String(s.kind),value:String(s.value),label:s.label?String(s.label):""}))}function Ee(){try{let s=B("quality_pref");return s?JSON.parse(s):null}catch{return null}}function oe(s){s&&M("subtitle_pref",JSON.stringify({off:s.off===!0,lang:s.lang?String(s.lang):"",label:s.label?String(s.label):""}))}function Te(){try{let s=B("subtitle_pref");return s?JSON.parse(s):null}catch{return null}}function Le(s){s&&M("audio_pref",JSON.stringify({id:Number.isFinite(Number(s.id))?Number(s.id):-1,lang:s.lang?String(s.lang):"",name:s.name?String(s.name):""}))}function Pe(){try{let s=B("audio_pref");return s?JSON.parse(s):null}catch{return null}}function Ce(){M("gesture_guide_seen","1")}function Me(){return B("gesture_guide_seen")==="1"}function Be(s){M("danmaku_enabled",s?"1":"0")}function Ie(){let s=B("danmaku_enabled");return s===null?!0:s==="1"}function Ae(s,e){let t={signal:e},i=s.els;i.playBtn.addEventListener("click",()=>s.togglePlay(),t),i.backBtn.addEventListener("click",()=>{s.dispatchEvent(new CustomEvent("back"))},t),i.prevBtn.addEventListener("click",()=>s.dispatchEvent(new CustomEvent("prev")),t),i.nextBtn.addEventListener("click",()=>s.dispatchEvent(new CustomEvent("next")),t),i.fsBtn.addEventListener("click",()=>s.toggleFullscreen(),t),i.lockBtn.addEventListener("click",()=>s.toggleLock(),t),V&&i.pipBtn.addEventListener("click",()=>s.togglePiP(),t),i.speedBtn.addEventListener("click",()=>s.toggleMenu("speed"),t),i.qualityBtn.addEventListener("click",()=>s.toggleMenu("quality"),t),i.subtitleBtn.addEventListener("click",()=>s.toggleMenu("subtitle"),t),i.settingsBtn.addEventListener("click",()=>s.toggleMenu("settings"),t),i.episodesBtn.addEventListener("click",()=>s.toggleEpisodePanel(),t),i.epClose.addEventListener("click",()=>s.toggleEpisodePanel(!1),t),i.sheetMask.addEventListener("click",()=>{s.closeMenu(),s.toggleEpisodePanel(!1)},t),i.epSeasonCurrent.addEventListener("click",l=>{l.stopPropagation(),i.epSeasons.classList.toggle("hidden")},t),i.epSeasons.addEventListener("click",l=>{let p=l.target.closest(".gyp-ep-option");p&&(s._activeSeason=p.dataset.season,i.epSeasons.classList.add("hidden"),s._renderEpisodePanel())},t);let n=l=>{let p=s._seasonKeys||[],h=p.indexOf(s._activeSeason),b=p[h+l];b&&(s._activeSeason=b,s._renderEpisodePanel())};i.epPrevSeason.addEventListener("click",()=>n(-1),t),i.epNextSeason.addEventListener("click",()=>n(1),t),i.epPanel.addEventListener("click",l=>{!i.epSeasons.contains(l.target)&&!i.epSeasonCurrent.contains(l.target)&&i.epSeasons.classList.add("hidden")},t),i.epSegments.addEventListener("click",l=>{let p=l.target.closest(".gyp-ep-seg");p&&(s._activeSeg=parseInt(p.dataset.seg,10),i.epSegments.querySelectorAll(".gyp-ep-seg").forEach(h=>h.classList.toggle("active",h===p)),s._renderEpisodeItems(),s.els.epList.scrollTop=0)},t),i.epList.addEventListener("click",l=>{let p=l.target.closest(".gyp-ep-item");p&&(s.dispatchEvent(new CustomEvent("selectepisode",{detail:{id:p.dataset.id}})),s.toggleEpisodePanel(!1))},t);let a=null,r=()=>{if(C())return Date.now()<(s._suppressSurfaceClickUntil||0),void 0;if(s._menuOpen){s.closeMenu();return}if(s.classList.contains("gyp-immersed")){s._showControls?.();return}a||(a=setTimeout(()=>{a=null,s.togglePlay()},220))};i.surface.addEventListener("click",r,t),i.surface.addEventListener("dblclick",()=>{C()||(a&&(clearTimeout(a),a=null),s.toggleFullscreen())},t);let o=()=>s._updateFullscreenUI?.();document.addEventListener("fullscreenchange",o,t),document.addEventListener("webkitfullscreenchange",o,t),ft(s,e),bt(s,e);let c=()=>{s._cancelPendingSurfaceTap?.(),s._controlsHovered=!0,s._showControls?.()},d=()=>{s._controlsHovered=!1,s._scheduleAutoHide?.()};for(let l of[i.bottom,i.top,i.menu,i.epPanel])l.addEventListener("mouseenter",c,t),l.addEventListener("mouseleave",d,t),l.addEventListener("touchstart",c,{signal:e,passive:!0}),l.addEventListener("touchend",d,t),l.addEventListener("touchcancel",d,t)}function ft(s,e){let t={signal:e},i=s.video,n=s.els.progress,a=!1,r=d=>{let l=n.getBoundingClientRect();return f((d-l.left)/l.width,0,1)},o=d=>{let l=r(d);return s.els.played.style.width=`${l*100}%`,s.els.thumb.style.left=`${l*100}%`,i.duration&&(s.els.timeCurrent.textContent=R(l*i.duration)),l},c=d=>{let l=r(d);i.duration&&s.seek(l*i.duration)};n.addEventListener("mousedown",d=>{a=!0,n.classList.add("dragging"),o(d.clientX);let l=h=>{a&&o(h.clientX)},p=h=>{a=!1,n.classList.remove("dragging"),c(h.clientX),document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",p)};document.addEventListener("mousemove",l),document.addEventListener("mouseup",p)},t),n.addEventListener("touchstart",d=>{a=!0,n.classList.add("dragging"),o(d.touches[0].clientX);let l=h=>{a&&o(h.touches[0].clientX)},p=h=>{a=!1,n.classList.remove("dragging"),c(h.changedTouches[0].clientX),document.removeEventListener("touchmove",l),document.removeEventListener("touchend",p)};document.addEventListener("touchmove",l,{passive:!0}),document.addEventListener("touchend",p)},{signal:e,passive:!0}),n.addEventListener("mousemove",d=>{if(!i.duration)return;let l=r(d.clientX);s.els.tip.textContent=R(l*i.duration);let p=n.getBoundingClientRect(),h=s.els.tip.offsetWidth/2/p.width*100,b=f(l*100,h,100-h);s.els.tip.style.left=`${b}%`},t),n.addEventListener("keydown",d=>{d.key==="ArrowLeft"?(s.seekBy(-5),d.preventDefault()):d.key==="ArrowRight"&&(s.seekBy(5),d.preventDefault())},t)}function bt(s,e){let t={signal:e},i=s.video,n=s.els.volumeSlider;s.els.volumeBtn.addEventListener("click",()=>s.toggleMute(),t);let a=r=>{let o=n.getBoundingClientRect(),c=f((r-o.left)/o.width,0,1);i.volume=c,i.muted=!1,T(c),U(!1)};n.addEventListener("mousedown",r=>{a(r.clientX);let o=d=>a(d.clientX),c=()=>{document.removeEventListener("mousemove",o),document.removeEventListener("mouseup",c)};document.addEventListener("mousemove",o),document.addEventListener("mouseup",c),r.stopPropagation()},t),n.addEventListener("touchstart",r=>{a(r.touches[0].clientX);let o=d=>a(d.touches[0].clientX),c=()=>{document.removeEventListener("touchmove",o),document.removeEventListener("touchend",c)};document.addEventListener("touchmove",o,{passive:!0}),document.addEventListener("touchend",c)},{signal:e,passive:!0}),s.els.volume.addEventListener("wheel",r=>{r.preventDefault(),i.volume=f(i.volume+(r.deltaY>0?-.05:.05),0,1),i.muted=!1,T(i.volume),s.showHint(`\u97F3\u91CF ${Math.round(i.volume*100)}%`)},{signal:e,passive:!1})}var K=16,vt=90,yt=500,$e=2,le=300,de=10,xt=80;function Re(s,e){if(!C())return;let t=s.video,i=s.els.surface,n={signal:e},a=0,r=0,o=0,c=0,d=null,l=null,p=null,h=!1,b=1,x=0,v=0,I=null,L=()=>{I&&(clearTimeout(I),I=null)},D=()=>{L(),I=setTimeout(()=>{I=null,s._onSurfaceTap?.()},le)};s._cancelPendingSurfaceTap=L;let N=y=>y>s.clientWidth/2,A=y=>{if(s._locked||y.touches.length!==1)return;L();let g=y.touches[0];a=g.clientX,r=g.clientY,o=t.currentTime,c=t.volume,d=null,l=null,p=setTimeout(()=>{h=!0,b=t.playbackRate,t.playbackRate=$e,s.showHintHold(`\u25B6\u25B6 ${$e}x \u5FEB\u8FDB\u4E2D`)},yt)},P=y=>{if(s._locked||y.touches.length!==1||(clearTimeout(p),h))return;let g=y.touches[0],k=g.clientX-a,_=g.clientY-r;if(!d)if(Math.abs(k)>K)d="seek",L();else if(Math.abs(_)>K)d=g.clientX<s.clientWidth/2?"brightness":"volume",L();else return;if(d==="seek"){let m=k/s.clientWidth*vt;l=f(o+m,0,t.duration||0),s.showHint(`${m>0?"+":""}${Math.round(m)}s`)}else if(d==="volume"){let m=-_/(s.clientHeight*.6);t.volume=f(c+m,0,1),t.muted=!1,T(t.volume);let w=t.volume===0?u.volumeMute:t.volume<.5?u.volumeLow:u.volumeHigh;s.showVSlide("volume",t.volume,w)}else if(d==="brightness"){if(s._brightness=f((s._brightness??1)+-_/(s.clientHeight*.6),.2,1.5),s.els.brightnessOverlay){let m=s._brightness<1;s.els.brightnessOverlay.style.background=m?"#000":"#fff",s.els.brightnessOverlay.style.opacity=String(m?(1-s._brightness)/.8*.75:(s._brightness-1)/.5*.18)}s.showVSlide("brightness",(s._brightness-.2)/1.3,u.brightness)}},F=y=>{if(clearTimeout(p),h){t.playbackRate=b,h=!1,s.hideHint(),d==="seek"&&l!=null&&s.seek(l),l=null,d=null;return}let g=y.changedTouches[0].clientX,k=y.changedTouches[0].clientY,_=g-a,m=k-r;if(d==="seek"&&Math.abs(_)<=K*2?(d=null,l=null):(d==="volume"||d==="brightness")&&Math.abs(m)<=K*2&&(d=null),d==="seek"&&l!=null&&(s.seek(l),l=null),!d){let w=Date.now(),S=g,$=N(S)===N(v);if(w-x<le&&Math.abs(S-v)<xt&&$){L();let E=N(S);s.seek(s.video.currentTime+(E?de:-de)),s.flashDoubleTap(E?"right":"left",de),x=0,s._suppressSurfaceClickUntil=Date.now()+500}else x=w,v=S,s._suppressSurfaceClickUntil=Date.now()+le+250,D()}d=null,l=null};i.addEventListener("touchstart",A,{signal:e,passive:!0}),i.addEventListener("touchmove",P,{signal:e,passive:!0}),i.addEventListener("touchend",F,n),i.addEventListener("touchcancel",()=>{clearTimeout(p),L(),h&&(t.playbackRate=b,h=!1,s.hideHint()),d=null,l=null},n)}var Fe=10,Q=30,ze=.1;function Ne(s,e){let t=i=>{if(s._locked)return;let n=i.target.tagName;if(n==="INPUT"||n==="TEXTAREA"||i.target.isContentEditable)return;let a=s.video,r=s.speeds;switch(i.key){case" ":case"k":i.preventDefault(),s.togglePlay();break;case"ArrowLeft":i.preventDefault(),s.seekBy(i.shiftKey?-Q:-Fe);break;case"ArrowRight":i.preventDefault(),s.seekBy(i.shiftKey?Q:Fe);break;case"j":s.seekBy(-Q);break;case"l":s.seekBy(Q);break;case"ArrowUp":i.preventDefault(),a.volume=f(a.volume+ze,0,1),a.muted=!1,T(a.volume),s.showHint(`\u97F3\u91CF ${Math.round(a.volume*100)}%`);break;case"ArrowDown":i.preventDefault(),a.volume=f(a.volume-ze,0,1),T(a.volume),s.showHint(`\u97F3\u91CF ${Math.round(a.volume*100)}%`);break;case"m":s.toggleMute();break;case"f":s.toggleFullscreen();break;case"p":s.togglePiP();break;case">":case".":De(s,r,1);break;case"<":case",":De(s,r,-1);break;case"Escape":s._menuOpen?s.closeMenu():s._isInFullscreen?.()?s.toggleFullscreen():s.dispatchEvent(new CustomEvent("back"));break;default:/^[0-9]$/.test(i.key)&&a.duration&&(a.currentTime=parseInt(i.key,10)/10*a.duration);break}};document.addEventListener("keydown",t,{signal:e})}function De(s,e,t){let i=s.video.playbackRate,n=e.indexOf(i);n===-1&&(n=e.reduce((r,o,c)=>Math.abs(o-i)<Math.abs(e[r]-i)?c:r,0));let a=f(n+t,0,e.length-1);s.setRate(e[a]),s.showHint(`${e[a]}x`)}function He(s){if(!s)return 0;let e=String(s).trim().split(":"),t=0,i=0,n=0;return e.length===3?(t=+e[0],i=+e[1],n=parseFloat(e[2])):e.length===2?(i=+e[0],n=parseFloat(e[1])):n=parseFloat(e[0]),t*3600+i*60+n}function kt(s){let e=[],t=s.replace(/\r/g,`
`).split(`
`),i=0;for(;i<t.length;){let n=t[i].trim();if(!n||n==="WEBVTT"||n.startsWith("NOTE")||n.startsWith("X-TIMESTAMP")){i+=1;continue}let a=n;if(a.includes("-->")||(i+=1,a=(t[i]||"").trim()),!a.includes("-->")){i+=1;continue}let[r,o]=a.split("-->"),c=He(r),d=He(o);i+=1;let l=[];for(;i<t.length&&t[i].trim();)l.push(t[i].trim()),i+=1;e.push({start:c,end:d,text:l.join(`
`)}),i+=1}return e}async function We(s){if(!s)return{cues:[],text:""};try{let e=await fetch(s);if(!e.ok)return{cues:[],text:""};let t=await e.text();return{cues:kt(t),text:t}}catch{return{cues:[],text:""}}}function Oe(s){let e=Math.max(0,Number(s)||0),t=Math.floor(e/3600),i=Math.floor(e%3600/60),n=e%60;return`${String(t).padStart(2,"0")}:${String(i).padStart(2,"0")}:${n.toFixed(3).padStart(6,"0")}`}function Ue(s,e=""){let t=typeof e=="string"&&e.trim()?e:(()=>{let i=["WEBVTT",""];for(let n of _t(s))i.push(`${Oe(n.start)} --> ${Oe(n.end)}`),i.push(n.text),i.push("");return i.join(`
`)})();return URL.createObjectURL(new Blob([t],{type:"text/vtt"}))}function _t(s){return!Array.isArray(s)||s.length===0?[]:s.map((e,t)=>{let i=t+1<s.length?s[t+1].start:null,n=e.end;return i!=null&&n>i&&(n=i),n<=e.start&&(n=e.start+.001),{start:e.start,end:n,text:e.text}})}function wt(s,e=1){return Math.max(13,Math.min(26,Math.round(s*.042)))*e}function Z(s,e){if(!s||!e)return null;let t=s.getBoundingClientRect(),i=e.getBoundingClientRect();return t.width===0&&t.height===0?null:t.top-i.top}function Ve({menuEl:s,hostEl:e,centerX:t,bottomY:i,regionHalfWidth:n=0}){if(!s||!e)return!1;let a=s.getBoundingClientRect(),r=e.getBoundingClientRect();if(a.width<1||a.height<1)return!1;let o=Math.max(72,Number(n)||0),c=a.left-r.left,d=c+a.width,l=a.top-r.top,p=l+a.height,h=t-o,b=t+o,x=i-56,v=i+4;return h<d&&b>c&&x<p&&v>l}function St({videoBottom:s,videoHeight:e,controlsTop:t=null,menuTop:i=null,menuOverlaps:n=!1,controlsVisible:a=!1,gap:r=12}){let o=s-e*.05;return n&&i!=null&&o>i-r?i-r:a&&t!=null&&o>t-r?t-r:o}function je({video:s,mediaEl:e,videoBoxEl:t,overlayEl:i,hostEl:n,bottomEl:a,menuEl:r,scale:o=1,immersed:c=!1,menuOpen:d=!1,locked:l=!1,fillScreen:p=!1}){if(!s||!e||!t)return;let h=s.videoWidth,b=s.videoHeight,x=e.clientWidth,v=e.clientHeight,I=g=>{let k=wt(g,o);t.style.setProperty("--gyp-subtitle-size",`${k}px`),i&&(i.style.fontSize=`${k}px`)},L=(g,k,_,m)=>{if(!i)return;let w=k+m,S=w-m*.05,$=g+_/2,E=d&&Ve({menuEl:r,hostEl:n,centerX:$,bottomY:S,regionHalfWidth:_*.46}),te=!c&&!l&&(!d||!E),Je=te?Z(a,n):null,et=E?Z(r,n):null,tt=St({videoBottom:w,videoHeight:m,controlsTop:Je,menuTop:et,menuOverlaps:E,controlsVisible:te});i.style.left=`${$}px`,i.style.transform="translateX(-50%) translateY(-100%)",i.style.top=`${tt}px`,i.style.bottom="auto",i.style.maxWidth=`${_*.92}px`,i.style.width="max-content"};if(!h||!b){if(t.style.left="0",t.style.top="0",t.style.width="100%",t.style.height="100%",I(v),i){let g=Math.round(v*.05),k=v-g,_=x/2,m=d&&Ve({menuEl:r,hostEl:n,centerX:_,bottomY:k,regionHalfWidth:x*.46}),w=!c&&!l&&(!d||!m),S=w?Z(a,n):null,$=m?Z(r,n):null,E=g;m&&$!=null?k>$-12&&(E=Math.max(g,v-$+12)):w&&S!=null&&k>S-12&&(E=Math.max(g,v-S+12)),i.style.left="50%",i.style.maxWidth="92%",i.style.width="max-content",i.style.transform="translateX(-50%)",i.style.top="auto",i.style.bottom=`${E}px`}return}s.style.objectFit="";let D=h/b,N=x/v,A,P,F,y;N>D?(P=v,A=P*D,F=(x-A)/2,y=0):(A=x,P=A/D,F=0,y=(v-P)/2),t.style.left=`${F}px`,t.style.top=`${y}px`,t.style.width=`${A}px`,t.style.height=`${P}px`,I(P),L(F,y,A,P)}function qe(s=""){return String(s).trim().replace(/_/g,"-").toLowerCase()}function ce(s="",e=""){let t=qe(s),i=String(e).trim().toLowerCase();return["zht","cht","yue","can"].includes(t)||t.startsWith("zh-hant")||t.startsWith("zh-tw")||t.startsWith("zh-hk")||t.startsWith("zh-mo")?!0:i.includes("\u7E41\u4F53")||i.includes("\u7E41\u9AD4")||i.includes("\u7CA4\u8BED")||i.includes("\u7CB5\u8A9E")}function pe(s="",e=""){if(ce(s,e))return!1;let t=qe(s),i=String(e).trim().toLowerCase();return t==="zhs"||t==="cmn-hans"||["zh","chi","zho","cmn"].includes(t)||t.startsWith("zh-hans")||t.startsWith("zh-cn")||t.startsWith("zh-sg")||t.startsWith("zh")&&!t.includes("hant")?!0:i.includes("\u7B80\u4F53")||i.includes("\u4E2D\u6587")||i.includes("chinese")}function Ge(s="",e=""){return pe(s,e)||ce(s,e)}function Ye(s=[]){return[...s].sort((e,t)=>{let i=n=>{let a=n.label||n.name||"",r=n.lang||"";return pe(r,a)?0:ce(r,a)?1:Ge(r,a)?2:3};return i(e)-i(t)})}function ue(s=[]){let e=s.findIndex(t=>pe(t.lang,t.label));return e>=0?e:s.findIndex(t=>Ge(t.lang,t.label))}function Et(s){return/^#[0-9a-fA-F]{6}$/.test(s||"")?s:"#ffffff"}function he(s){return String(s.id||`${s.timeMs}:${s.content}`)}function Xe(s){return Math.max(0,Math.floor(Math.max(0,Number(s)||0)/120)*120)}async function Tt(s,e,{start:t=0,end:i=120,limit:n=300,credentials:a="include"}={}){let r=String(e||"").trim();if(!r)return{items:[],danmakuEnabled:!1};let o=new URLSearchParams({videoId:r,start:String(Math.max(0,Number(t)||0)),end:String(Math.max(0,Number(i)||120)),limit:String(Math.min(800,Math.max(1,Number(n)||300)))}),c=await fetch(`${s.replace(/\/$/,"")}/danmaku?${o}`,{credentials:a});if(!c.ok)throw new Error("\u5F39\u5E55\u52A0\u8F7D\u5931\u8D25");return c.json()}async function Lt(s,e,{credentials:t="include"}={}){let i=await fetch(`${s.replace(/\/$/,"")}/danmaku`,{method:"POST",credentials:t,headers:{"Content-Type":"application/json"},body:JSON.stringify({videoId:e.videoId,time:Math.max(0,Number(e.time||0)),content:String(e.content||"").trim(),color:e.color||"#ffffff",mode:e.mode||"scroll"})});if(!i.ok){let n=null;try{n=await i.json()}catch{}let a=new Error(i.status===401?"\u767B\u5F55\u540E\u53D1\u9001\u5F39\u5E55":n?.message||"\u5F39\u5E55\u53D1\u9001\u5931\u8D25");throw a.status=i.status,a.data=n,a}return i.json()}async function Pt(s,e,t="user_report",{credentials:i="include"}={}){let n=String(e||"").trim();if(!n)throw new Error("\u8BF7\u9009\u62E9\u8981\u4E3E\u62A5\u7684\u5F39\u5E55");let a=await fetch(`${s.replace(/\/$/,"")}/danmaku/${encodeURIComponent(n)}/report`,{method:"POST",credentials:i,headers:{"Content-Type":"application/json"},body:JSON.stringify({reason:t})});if(!a.ok){let r=new Error(a.status===401?"\u767B\u5F55\u540E\u4E3E\u62A5\u5F39\u5E55":"\u5F39\u5E55\u4E3E\u62A5\u5931\u8D25");throw r.status=a.status,r}return a.json()}function Ct(s){return Xe(s)+120+60}var J=class{constructor(e,t={}){this.player=e,this.apiBase=t.apiBase||"/api/v1",this.credentials=t.credentials||"include",this.videoId="",this.disabled=!1,this.enabled=!0,this.serverEnabled=!0,this.items=[],this.itemIds=new Set,this.shownIds=new Set,this.loadedWindows=new Set,this.lastReportable=null,this.lastTime=0,this.lane=0,this.layer=null,this.bar=null,this._loadGen=0}attach({layer:e,bar:t}){this.layer=e,this.bar=t}configure({videoId:e,disabled:t,apiBase:i,enabled:n}={}){i&&(this.apiBase=i),typeof n=="boolean"&&(this.enabled=n),this.disabled=t===!0,this.reset(e||"")}reset(e){this._loadGen+=1,this.videoId=String(e||"").trim(),this.items=[],this.itemIds=new Set,this.shownIds=new Set,this.loadedWindows=new Set,this.serverEnabled=!0,this.lastReportable=null,this.lastTime=0,this.lane=0,this.layer&&(this.layer.innerHTML=""),this._syncUiVisibility(),this._updateInputState(),this.videoId&&!this.disabled&&this.loadWindow(0).catch(()=>{})}setEnabled(e){this.enabled=!!e,this.layer&&this.layer.classList.toggle("hidden",!this.enabled)}destroy(){this._loadGen+=1,this.layer=null,this.bar=null}async loadWindow(e){if(!this.videoId||this.disabled)return;let t=this._loadGen,i=Xe(e),n=String(i);if(this.loadedWindows.has(n))return;this.loadedWindows.add(n);let a=await Tt(this.apiBase,this.videoId,{start:i,end:i+120+60,limit:500,credentials:this.credentials});if(t===this._loadGen){if(a.danmakuEnabled===!1){this.serverEnabled=!1,this._updateInputState();return}this.serverEnabled=!0,this._updateInputState(),this.addItems(a.items||[])}}addItems(e){for(let t of e||[]){let i=he(t);this.itemIds.has(i)||(this.itemIds.add(i),this.items.push({...t,_key:i}))}this.items.sort((t,i)=>Number(t.timeMs||0)-Number(i.timeMs||0))}sync(e){if(!this.enabled||!this.videoId||this.disabled||!this.layer)return;let t=Math.max(0,Number(e)||0);t+45>Ct(t)&&this.loadWindow(t+60).catch(()=>{}),t<this.lastTime-2&&(this.shownIds=new Set,this.layer.innerHTML="");let i=Math.max(0,Math.floor((this.lastTime-.4)*1e3)),n=Math.floor((t+.8)*1e3);this.items.filter(a=>{let r=a._key||he(a),o=Number(a.timeMs||0);return!this.shownIds.has(r)&&o>=i&&o<=n}).slice(0,8).forEach(a=>this.showItem(a)),this.lastTime=t}showItem(e,t={}){if(!this.enabled||!this.layer)return;let i=e._key||he(e);this.shownIds.add(i);let n=document.createElement("span"),a=e.mode==="top"||e.mode==="bottom"?e.mode:"scroll";n.className=`gyp-danmaku-item is-${a}`,n.textContent=String(e.content||"").slice(0,80),n.style.color=Et(e.color);let r=this.lane%6;this.lane+=1,a==="bottom"?n.style.bottom=`${14+r*8}%`:n.style.top=`${8+r*11}%`,t.immediate&&n.classList.add("is-local");let o=Math.max(this.layer.clientWidth||320,240);n.style.setProperty("--gyp-danmaku-travel",`${o}px`),this.layer.appendChild(n),e.id&&!String(e.id).startsWith("local:")&&(this.lastReportable=e),setTimeout(()=>n.remove(),a==="scroll"?7600:3600)}async send(e){if(!this.videoId||this.disabled||!this.serverEnabled)return null;let t=Number.isFinite(this.player.video?.currentTime)?this.player.video.currentTime:0,n=(await Lt(this.apiBase,{videoId:this.videoId,time:t,content:e},{credentials:this.credentials})).item||{id:`local:${Date.now()}`,content:e,time:t,timeMs:Math.round(t*1e3),color:"#ffffff",mode:"scroll"};return this.addItems([n]),this.showItem(n,{immediate:!0}),n}async reportLast(){let e=this.lastReportable;if(!e?.id||String(e.id).startsWith("local:"))throw new Error("\u6682\u65E0\u53EF\u4E3E\u62A5\u5F39\u5E55");await Pt(this.apiBase,e.id,"user_report",{credentials:this.credentials}),this.items=this.items.filter(t=>t.id!==e.id),this.lastReportable=null}_syncUiVisibility(){let e=!!this.videoId&&!this.disabled;this.bar?.classList.toggle("hidden",!e),this.layer?.classList.toggle("hidden",!e||!this.enabled)}_updateInputState(){let e=this.bar?.querySelector("#danmakuInput"),t=this.bar?.querySelector("#danmakuSend");if(!e||!t)return;let i=this.serverEnabled===!1;if(e.disabled=i,t.disabled=i,i)e.placeholder="\u521B\u4F5C\u8005\u5DF2\u5173\u95ED\u672C\u89C6\u9891\u5F39\u5E55";else{let n=typeof window<"u"&&window.matchMedia?.("(max-width: 640px)").matches;e.placeholder=n?"\u53D1\u5F39\u5E55\u2026":"\u53D1\u4E00\u6761\u53CB\u5584\u5F39\u5E55"}}};var di="140";console.log("GY-Player loaded dynamically: v1.0.2-verify");var Ke=[.5,.75,1,1.25,1.5,2,3],Mt=15,Bt=5,Qe=3,It=12e3,At=3e3,$t=5e3,Ze=10,z=60;function ge(s){return String(s??"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Rt(s,e,t){let n=(Array.isArray(s)?s:[]).filter(a=>a&&typeof a.url=="string"&&a.url).map((a,r)=>({url:a.url,label:a.label||a.title||a.quality||`\u64AD\u653E\u6E90 ${r+1}`,quality:a.quality||a.label||a.title||"",subtitles:Array.isArray(a.subtitles)?a.subtitles:void 0}));return!e||n.some(a=>a.url===e)?n:[{url:e,label:t===e?"\u5F53\u524D\u64AD\u653E\u6E90":"\u64AD\u653E\u6E90",quality:t===e?"\u5F53\u524D":""},...n]}function Ft(s){return String(s?.quality||s?.label||s?.title||"").trim().toLowerCase()}function zt(s,e=""){return s?.quality||s?.label||s?.title||e||""}function Dt(s){let t=(Array.isArray(s)?s:[]).filter(i=>i&&i.id&&i.label).slice(0,3).map(i=>({id:String(i.id),label:String(i.label),variant:i.variant==="secondary"?"secondary":"primary"}));return t.length>0?t:[{id:"retry",label:"\u91CD\u8BD5",variant:"primary"}]}function Nt(s){if(!s)return"";try{return new Date(s).toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"})}catch{return""}}var ee=class extends HTMLElement{static get observedAttributes(){return["src","title","video-id","autoplay","poster"]}constructor(){super(),this.attachShadow({mode:"open"}),this.engine=null,this._videoId=null,this._hideTimer=null,this._hintTimer=null,this._loadGen=0,this._lastSaveTime=-1,this._locked=!1,this._menuOpen=!1,this._suppressSurfaceClickUntil=0,this._controlsShownAt=0,this._layoutInline=!1,this._layoutFullscreen=!1,this._ac=null,this._subtitleTracks=[],this._activeSubtitleIndex=-1,this._nativeTrackEl=null,this._nativeTrackBlobUrl=null,this._iosNativeFullscreen=!1,this._pipActive=!1,this._docPipWindow=null,this._docPipSubOverlay=null,this._docPipCueHandler=null,this._pseudoFullscreen=!1,this._pseudoScrollY=0,this._subtitleScale=1,this._danmakuApiBase="/api/v1",this._danmaku=null}connectedCallback(){this._ac=new AbortController,this._render(),this._cacheEls(),this._initState(),Ae(this,this._ac.signal),Re(this,this._ac.signal),Ne(this,this._ac.signal),this._setupVideoEvents(),this._setupAutoHide(),this._setupMediaSession(),this._initDanmaku(),this._ensureNativeSubtitleStyle();let e=this.getAttribute("src");e&&this.loadStream(e)}disconnectedCallback(){this.destroy()}attributeChangedCallback(e,t,i){t!==i&&(e==="title"&&this._titleEl?this._titleEl.textContent=i||"":e==="src"&&i&&this.engine?this.loadStream(i):e==="poster"&&this.video&&(i?this.video.setAttribute("poster",i):this.video.removeAttribute("poster")))}_render(){let e=this.getAttribute("poster");this.shadowRoot.innerHTML=`
            <style>${me}</style>
            <div class="gyp-media" id="media">
                <div class="gyp-video-box" id="videoBox">
                    <video class="gyp-video" id="video" playsinline webkit-playsinline preload="auto" ${e?`poster="${e}"`:""}></video>
                    <div class="gyp-danmaku-layer hidden" id="danmakuLayer"></div>
                </div>
            </div>
            <div class="gyp-subtitle-overlay hidden" id="subtitleOverlay"></div>
            <div class="gyp-brightness-overlay" id="brightnessOverlay"></div>
            <div class="gyp-surface" id="surface"></div>

            <div class="gyp-center" id="center"><div class="gyp-center-btn" id="centerBtn">${u.play}</div></div>
            <div class="gyp-hint" id="hint" aria-live="polite"></div>

            <!-- \u79FB\u52A8\u7AEF\u7AD6\u6ED1\u4EAE\u5EA6/\u97F3\u91CF\u53EF\u89C6\u5316\u6307\u793A\uFF08\u4E2D\u592E\u80F6\u56CA + \u8FDB\u5EA6\uFF09-->
            <div class="gyp-vslide hidden" id="vslide">
                <div class="gyp-vslide-icon" id="vslideIcon"></div>
                <div class="gyp-vslide-track"><div class="gyp-vslide-fill" id="vslideFill"></div></div>
            </div>

            <!-- \u79FB\u52A8\u7AEF\u53CC\u51FB\u5FEB\u8FDB/\u5FEB\u9000\u6D9F\u6F2A\u53CD\u9988\uFF08\u5DE6\u53F3\u4E24\u4FA7\uFF09-->
            <div class="gyp-dbltap gyp-dbltap-left hidden" id="dblTapLeft">
                <div class="gyp-dbltap-icon">${u.rewind}</div>
                <span class="gyp-dbltap-text">10 \u79D2</span>
            </div>
            <div class="gyp-dbltap gyp-dbltap-right hidden" id="dblTapRight">
                <div class="gyp-dbltap-icon">${u.forward}</div>
                <span class="gyp-dbltap-text">10 \u79D2</span>
            </div>
            <div class="gyp-buffering hidden" id="buffering"><div class="gyp-spinner"></div></div>
            <div class="gyp-loading hidden" id="loading">
                <img class="gyp-loading-logo hidden" id="loadingLogo" alt="" draggable="false">
                <div class="gyp-spinner"></div>
            </div>

            <div class="gyp-top" id="top">
                <button class="gyp-btn" id="backBtn" aria-label="\u8FD4\u56DE">${u.back}</button>
                <span class="gyp-title" id="title">${this.getAttribute("title")||""}</span>
            </div>

            <button class="gyp-btn gyp-lock" id="lockBtn" aria-label="\u9501\u5B9A">${u.lock}</button>

            <div class="gyp-resume hidden" id="resume">
                <span class="gyp-resume-text" id="resumeText"></span>
                <button class="gyp-resume-btn gyp-resume-yes" id="resumeYes">\u7EE7\u7EED\u64AD\u653E</button>
                <button class="gyp-resume-btn gyp-resume-no" id="resumeNo">\u4ECE\u5934\u5F00\u59CB</button>
            </div>

            <!-- \u79FB\u52A8\u7AEF\u9996\u6B21\u624B\u52BF\u5F15\u5BFC\uFF08\u4EC5\u89E6\u5C4F\u9996\u6B21\u64AD\u653E\u663E\u793A\u4E00\u6B21\uFF09-->
            <div class="gyp-guide hidden" id="guide">
                <div class="gyp-guide-card">
                    <div class="gyp-guide-title">\u624B\u52BF\u64CD\u4F5C</div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${u.forward}</span><span>\u6A2A\u6ED1\u5FEB\u8FDB / \u5FEB\u9000</span></div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${u.volumeHigh}</span><span>\u5DE6\u4FA7\u7AD6\u6ED1\u8C03\u4EAE\u5EA6 \xB7 \u53F3\u4FA7\u7AD6\u6ED1\u8C03\u97F3\u91CF</span></div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${u.rewind}</span><span>\u53CC\u51FB\u4E24\u4FA7\u5FEB\u9000 / \u5FEB\u8FDB 10 \u79D2</span></div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${u.play}</span><span>\u957F\u6309 2 \u500D\u901F\u64AD\u653E</span></div>
                    <button class="gyp-guide-btn" id="guideBtn">\u77E5\u9053\u4E86</button>
                </div>
            </div>

            <div class="gyp-menu hidden" id="menu"></div>

            <!-- \u79FB\u52A8\u7AEF\u62BD\u5C49\u906E\u7F69\uFF1A\u6253\u5F00\u83DC\u5355/\u9009\u96C6\u65F6\u70B9\u51FB\u5173\u95ED -->
            <div class="gyp-sheet-mask hidden" id="sheetMask"></div>

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
                        <div class="gyp-progress-thumb" id="thumb">
                            <div class="gyp-thumb-lens"></div>
                            <div class="gyp-thumb-overlay"></div>
                            <div class="gyp-thumb-specular"></div>
                        </div>
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
                    <div class="gyp-btns-leading">
                        <button class="gyp-btn" id="playBtn" aria-label="\u64AD\u653E/\u6682\u505C">${u.play}</button>
                        <button class="gyp-btn hidden" id="prevBtn" aria-label="\u4E0A\u4E00\u96C6">${u.prev}</button>
                        <button class="gyp-btn hidden" id="nextBtn" aria-label="\u4E0B\u4E00\u96C6">${u.next}</button>
                        <div class="gyp-volume" id="volume">
                            <button class="gyp-btn" id="volumeBtn" aria-label="\u9759\u97F3">${u.volumeHigh}</button>
                            <div class="gyp-volume-slider" id="volumeSlider">
                                <div class="gyp-volume-track"></div>
                                <div class="gyp-volume-fill" id="volumeFill"></div>
                                <div class="gyp-volume-thumb" id="volumeThumb"></div>
                            </div>
                        </div>
                    </div>
                    <form class="gyp-danmaku-inline hidden" id="danmakuBar">
                        <input class="gyp-danmaku-input" id="danmakuInput" type="text" maxlength="80" autocomplete="off" placeholder="\u53D1\u4E00\u6761\u53CB\u5584\u5F39\u5E55">
                        <button type="submit" class="gyp-danmaku-send" id="danmakuSend">\u53D1\u9001</button>
                    </form>
                    <div class="gyp-btns-trailing">
                        <button class="gyp-btn" id="settingsBtn" aria-label="\u8BBE\u7F6E">${u.settings}</button>
                        <button class="gyp-btn gyp-btn-text hidden" id="episodesBtn" aria-label="\u9009\u96C6">\u9009\u96C6</button>
                        <button class="gyp-btn gyp-btn-text" id="speedBtn" aria-label="\u500D\u901F">1x</button>
                        <button class="gyp-btn gyp-btn-text" id="qualityBtn" aria-label="\u753B\u8D28">\u81EA\u52A8</button>
                        <button class="gyp-btn hidden" id="subtitleBtn" aria-label="\u5B57\u5E55">${u.subtitle}</button>
                        <button class="gyp-btn ${V?"":"hidden"}" id="pipBtn" aria-label="\u753B\u4E2D\u753B">${u.pip}</button>
                        <button class="gyp-btn ${fe?"":"hidden"}" id="fsBtn" aria-label="\u5168\u5C4F">${u.fullscreen}</button>
                    </div>
                </div>
            </div>

            <!-- \u6DB2\u6001\u73BB\u7483 SVG \u7F6E\u6362\u6EE4\u955C\uFF08\u6CE8\u5165 Shadow DOM\uFF0C\u4F9B dock \u6298\u5C04\u5F15\u7528\uFF09-->
            <svg class="gyp-glass-svg" aria-hidden="true" width="0" height="0">
                <filter id="gyp-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="5" result="turbulence"/>
                    <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap"/>
                    <feDisplacementMap in="SourceGraphic" in2="softMap" scale="60" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <!-- \u8FDB\u5EA6\u6761 thumb \u6DB2\u6001\u900F\u955C\uFF1A\u62D6\u52A8\u65F6\u653E\u5927\u6298\u5C04\u4E0B\u65B9\u8F68\u9053 -->
                <filter id="gyp-thumb-lens" x="-50%" y="-50%" width="200%" height="200%">
                    <feImage x="0" y="0" result="thumbNormal" xlink:href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><radialGradient id='m' cx='50%25' cy='50%25' r='75%25'><stop offset='0%25' stop-color='rgb(128,128,255)'/><stop offset='90%25' stop-color='rgb(255,255,255)'/></radialGradient><rect width='100%25' height='100%25' fill='url(%23m)'/></svg>"/>
                    <feDisplacementMap in="SourceGraphic" in2="thumbNormal" scale="-90" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
            </svg>

            <!-- \u9009\u96C6\u4FA7\u6ED1\u9762\u677F -->
            <div class="gyp-ep-panel hidden" id="epPanel">
                <div class="gyp-ep-header">
                    <span class="gyp-ep-title">\u9009\u96C6</span>
                    <button class="gyp-btn" id="epClose" aria-label="\u5173\u95ED">${u.back}</button>
                </div>
                <div class="gyp-ep-nav hidden" id="epNav">
                    <button class="gyp-ep-arrow" id="epPrevSeason" data-dir="-1" aria-label="\u4E0A\u4E00\u5B63">${u.chevronLeft}</button>
                    <button class="gyp-ep-current" id="epSeasonCurrent">
                        <span class="gyp-ep-season-label"></span>
                        <span class="gyp-ep-caret">${u.chevronDown}</span>
                    </button>
                    <button class="gyp-ep-arrow" id="epNextSeason" data-dir="1" aria-label="\u4E0B\u4E00\u5B63">${u.chevronRight}</button>
                </div>
                <div class="gyp-ep-dropdown hidden" id="epSeasons" role="listbox"></div>
                <div class="gyp-ep-segments hidden" id="epSegments"></div>
                <div class="gyp-ep-list" id="epList"></div>
            </div>
        `}_cacheEls(){let e=t=>this.shadowRoot.getElementById(t);this.video=e("video"),this.els={media:e("media"),videoBox:e("videoBox"),subtitleOverlay:e("subtitleOverlay"),surface:e("surface"),top:e("top"),bottom:e("bottom"),brightnessOverlay:e("brightnessOverlay"),center:e("center"),centerBtn:e("centerBtn"),hint:e("hint"),buffering:e("buffering"),loading:e("loading"),loadingLogo:e("loadingLogo"),backBtn:e("backBtn"),lockBtn:e("lockBtn"),playBtn:e("playBtn"),prevBtn:e("prevBtn"),nextBtn:e("nextBtn"),volume:e("volume"),volumeBtn:e("volumeBtn"),volumeSlider:e("volumeSlider"),volumeFill:e("volumeFill"),volumeThumb:e("volumeThumb"),speedBtn:e("speedBtn"),qualityBtn:e("qualityBtn"),subtitleBtn:e("subtitleBtn"),pipBtn:e("pipBtn"),fsBtn:e("fsBtn"),settingsBtn:e("settingsBtn"),episodesBtn:e("episodesBtn"),epPanel:e("epPanel"),epClose:e("epClose"),epSeasons:e("epSeasons"),epNav:e("epNav"),epSeasonCurrent:e("epSeasonCurrent"),epPrevSeason:e("epPrevSeason"),epNextSeason:e("epNextSeason"),epSegments:e("epSegments"),epList:e("epList"),progress:e("progress"),played:e("played"),buffered:e("buffered"),thumb:e("thumb"),tip:e("tip"),timeCurrent:e("timeCurrent"),timeDuration:e("timeDuration"),mini:e("mini"),miniBar:e("miniBar"),menu:e("menu"),resume:e("resume"),resumeText:e("resumeText"),resumeYes:e("resumeYes"),resumeNo:e("resumeNo"),dblTapLeft:e("dblTapLeft"),dblTapRight:e("dblTapRight"),sheetMask:e("sheetMask"),vslide:e("vslide"),vslideIcon:e("vslideIcon"),vslideFill:e("vslideFill"),guide:e("guide"),guideBtn:e("guideBtn"),danmakuLayer:e("danmakuLayer"),danmakuBar:e("danmakuBar")},this._titleEl=e("title")}_initState(){let e=ke(),t=_e();this.video.volume=e,this.video.muted=t,this._rate=Se(),this.video.playbackRate=this._rate,this.els.speedBtn.textContent=`${this._rate}x`,this._updateVolumeUI()}_setupVideoEvents(){let e=this.video,t={signal:this._ac.signal};e.addEventListener("play",()=>{this.els.playBtn.innerHTML=u.pause,this._flashCenter(u.play),this._maybeShowGuide()},t),e.addEventListener("pause",()=>{this.els.playBtn.innerHTML=u.play,this._flashCenter(u.pause)},t);let i=null,n=()=>{clearTimeout(i),i=setTimeout(()=>{this._seeking||this.els.buffering.classList.remove("hidden")},320)},a=()=>{clearTimeout(i),this.els.buffering.classList.add("hidden")};e.addEventListener("waiting",n,t),e.addEventListener("playing",a,t),e.addEventListener("canplay",a,t),e.addEventListener("seeking",()=>{this._seeking=!0},t),e.addEventListener("seeked",()=>{this._seeking=!1},t);let r=()=>this._layoutVideoBox();e.addEventListener("loadedmetadata",()=>{this.els.timeDuration.textContent=R(e.duration),r()},t),e.addEventListener("resize",r,t),window.addEventListener("resize",r,t),document.addEventListener("fullscreenchange",()=>{r(),this._updateFullscreenUI()},t),document.addEventListener("webkitfullscreenchange",()=>{r(),this._updateFullscreenUI()},t);let o=()=>{this._iosNativeFullscreen=!0,this.classList.add("gyp-ios-native-fs"),this._updateFullscreenUI(),this._onEnterIsolatedPlayback()},c=()=>{this._iosNativeFullscreen=!1,this.classList.remove("gyp-ios-native-fs"),this._onExitIsolatedPlayback(),this._updateFullscreenUI(),r()};e.addEventListener("webkitbeginfullscreen",o,t),e.addEventListener("webkitendfullscreen",c,t),e.addEventListener("enterpictureinpicture",()=>{this._pipActive=!0,this.classList.add("gyp-pip-active"),this._onEnterIsolatedPlayback()},t),e.addEventListener("leavepictureinpicture",()=>{this._pipActive=!1,this.classList.remove("gyp-pip-active"),this._onExitIsolatedPlayback()},t),"webkitPresentationMode"in e&&e.addEventListener("webkitpresentationmodechanged",()=>{let d=e.webkitPresentationMode==="picture-in-picture";this._pipActive=d,this.classList.toggle("gyp-pip-active",d),d?this._onEnterIsolatedPlayback():this._onExitIsolatedPlayback()},t),typeof ResizeObserver<"u"&&this.els.media&&(this._mediaResizeObserver=new ResizeObserver(r),this._mediaResizeObserver.observe(this.els.media)),e.addEventListener("timeupdate",()=>this._onTimeUpdate(),t),e.addEventListener("addtrack",d=>{let l=d.track;!l||l.kind!=="subtitles"&&l.kind!=="captions"||this._isNativeSubtitleTextTrack(l)||(l.mode="disabled")},t),e.addEventListener("progress",()=>this._onBufferUpdate(),t),e.addEventListener("ended",()=>{this._ended=!0,this._disableStorage||ae(this._videoId),this.els.playBtn.innerHTML=u.replay,this.dispatchEvent(new CustomEvent("ended",{detail:{videoId:this._videoId}}))},t),e.addEventListener("volumechange",()=>this._updateVolumeUI(),t)}_onTimeUpdate(){let e=this.video;if(!e.duration)return;let t=e.currentTime/e.duration*100;this.els.played.style.width=`${t}%`,this.els.thumb.style.left=`${t}%`,this.els.miniBar.style.width=`${t}%`,this.els.timeCurrent.textContent=R(e.currentTime),this.els.progress.setAttribute("aria-valuenow",Math.round(t)),this._updateSubtitleOverlay(),this._disableEmbeddedSubtitleTracks(),this._danmaku?.sync(e.currentTime);let i=e.currentTime;(this._lastSaveTime<0||Math.abs(i-this._lastSaveTime)>=Bt)&&(this._lastSaveTime=i,this._disableStorage||ne(this._videoId,i),this.dispatchEvent(new CustomEvent("progress",{detail:{videoId:this._videoId,currentTime:i,duration:e.duration,percent:t}})))}_onBufferUpdate(){let e=this.video;if(e.buffered.length>0&&e.duration){let t=e.buffered.end(e.buffered.length-1);this.els.buffered.style.width=`${t/e.duration*100}%`}}async loadStream(e,t={}){let i=++this._loadGen;this._ended=!1,this._lastSaveTime=-1,this._disableStorage=!!t.disableStorage,this._layoutInline=t.layout==="inline",this._layoutFullscreen=t.layout==="fullscreen",this.classList.toggle("gyp-layout-inline",this._layoutInline),this.els.loading.classList.remove("hidden"),t.title!=null&&this.setTitle(t.title),this._videoId=t.videoId||this.getAttribute("video-id")||e,this._loadOptions={...t,sources:t.sources},this._qualitySources=Rt(t.sources,e,t.sourceUrl),this._activeSourceUrl=t.sourceUrl||e,this._refreshQualityLabel(),this._hideError();let n=0;if(typeof t.startTime=="number"&&t.startTime>0)n=t.startTime;else if(!this._disableStorage){let a=xe(this._videoId);if(a>Mt&&(n=await this._promptResume(a),i!==this._loadGen))return}this.engine&&await this.engine.detach(),this.engine=new X(this.video,{onReady:()=>{i===this._loadGen&&(this.els.loading.classList.add("hidden"),this._disableEmbeddedSubtitleTracks(),this._applySavedQualityLevel(),this._applySavedAudioTrack(),this._refreshQualityLabel(),this._refreshTrackButton(),(this.hasAttribute("autoplay")||t.playAfterLoad)&&this._playWhenBuffered(i,Qe))},onError:(a,r)=>{if(i!==this._loadGen)return;let o=typeof a=="object"&&a?{...a,code:a.code,type:a.type,message:a.message,reason:a.reason,fatal:r}:{message:String(a||""),fatal:r};r&&(this.els.loading.classList.add("hidden"),this._showError(this._errorMessage(a),this._loadOptions?.errorActions)),this.dispatchEvent(new CustomEvent("error",{detail:o}))},onLevelSwitched:()=>this._refreshQualityLabel()},{preferHDR:t.preferHDR===!0,allowedVideoRanges:t.allowedVideoRanges}),await this.engine.load(e,{startPosition:n}),i===this._loadGen&&(await this._loadSubtitles(t.subtitles||[]),this._configureDanmaku(t))}_playWhenBuffered(e,t=Qe){let i=Date.now(),n=()=>{if(e!==this._loadGen||this._ended)return;if(Y(this.video)>=t||this.video.readyState>=HTMLMediaElement.HAVE_FUTURE_DATA||Date.now()-i>=It){this.video.play().catch(()=>{});return}setTimeout(n,80)};n()}_configureDanmaku(e={}){if(!this._danmaku)return;if(e.danmaku===!1){this._danmaku.configure({videoId:"",disabled:!0});return}let t=typeof e.danmaku=="object"&&e.danmaku?e.danmaku:{};t.apiBase&&(this._danmakuApiBase=t.apiBase);let i=t.videoId||e.danmakuVideoId||this._videoId||"";this._danmaku.configure({videoId:i,apiBase:t.apiBase||this._danmakuApiBase,disabled:t.disabled===!0,enabled:typeof t.enabled=="boolean"?t.enabled:Ie()})}_initDanmaku(){this._danmaku=new J(this,{apiBase:this._danmakuApiBase}),this._danmaku.attach({layer:this.els.danmakuLayer,bar:this.els.danmakuBar});let e={signal:this._ac.signal},t=this.els.danmakuBar;t.addEventListener("submit",async i=>{i.preventDefault();let n=t.querySelector("#danmakuInput"),a=n?.value?.trim()||"";if(!a)return;let r=t.querySelector("#danmakuSend");r.disabled=!0;try{await this._danmaku.send(a),n.value="",this.showHint("\u5F39\u5E55\u5DF2\u53D1\u9001")}catch(o){this.showHint(o?.message||"\u5F39\u5E55\u53D1\u9001\u5931\u8D25"),o?.status===409&&(this._danmaku.serverEnabled=!1,this._danmaku._updateInputState()),o?.status===401&&this.dispatchEvent(new CustomEvent("danmaku-login",{detail:{action:"send"}}))}finally{r.disabled=this._danmaku.serverEnabled===!1}},e)}setDanmakuApiBase(e){this._danmakuApiBase=String(e||"/api/v1"),this._danmaku&&(this._danmaku.apiBase=this._danmakuApiBase)}setDanmakuVideoId(e,t={}){this._configureDanmaku({danmaku:{videoId:e,disabled:t.disabled,apiBase:t.apiBase,enabled:t.enabled}})}_isolatedVideoPlayback(){let e=document;return this._iosNativeFullscreen||this._pipActive||e.pictureInPictureElement===this.video||this.video?.webkitPresentationMode==="picture-in-picture"}_usesNativeSubtitleRender(){return this._isolatedVideoPlayback()}_isNativeSubtitleTextTrack(e){let t=this._nativeTrackEl;return!t||!e?!1:t.track===e}_onEnterIsolatedPlayback(){let e=()=>{this._mountNativeSubtitleTrack(),this._syncSubtitleDisplay({forceNative:!0})};e(),requestAnimationFrame(e),setTimeout(e,120)}_onExitIsolatedPlayback(){this._isolatedVideoPlayback()||(this._teardownNativeSubtitleTrack(),this._syncSubtitleDisplay())}_absoluteSubtitleUrl(e){return!e||typeof e!="string"||/^https?:\/\//i.test(e)?e:e.startsWith("/")?`${window.location.origin}${e}`:e}_teardownNativeSubtitleTrack(){if(this._nativeTrackEl&&(this._nativeTrackEl.track&&(this._nativeTrackEl.track.mode="disabled"),this._nativeTrackEl.remove(),this._nativeTrackEl=null),this._nativeTrackBlobUrl){try{URL.revokeObjectURL(this._nativeTrackBlobUrl)}catch{}this._nativeTrackBlobUrl=null}}_mountNativeSubtitleTrack(){this._teardownNativeSubtitleTrack();let e=this._activeSubtitleIndex,t=e>=0?this._subtitleTracks[e]:null;if(!t?.cues?.length)return;this._nativeTrackBlobUrl=Ue(t.cues,t.vttText);let i=document.createElement("track");i.kind="subtitles",i.label=t.label||t.lang||"\u5B57\u5E55",i.srclang=t.lang||"und",i.default=!0,i.src=this._nativeTrackBlobUrl,this._nativeTrackEl=i,this.video.appendChild(i);let n=()=>{!this._isolatedVideoPlayback()||!i.track||(i.track.mode="showing")};i.addEventListener("load",n,{once:!0}),i.addEventListener("error",()=>{let a=t.trackUrl;a&&i.getAttribute("src")!==a&&(i.src=a)},{once:!0}),n(),requestAnimationFrame(n),setTimeout(n,80),setTimeout(n,240)}_ensureNativeSubtitleStyle(){if(document.getElementById("gyp-native-subtitle-style"))return;let e=document.createElement("style");e.id="gyp-native-subtitle-style",e.textContent=`
video:-webkit-full-screen::-webkit-media-text-track-container,
video:picture-in-picture::-webkit-media-text-track-container {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
}
video:-webkit-full-screen::cue,
video:picture-in-picture::cue {
    opacity: 1 !important;
    color: #fff !important;
    background-color: rgba(0, 0, 0, 0.72) !important;
    font-size: 1.05em !important;
    line-height: 1.3 !important;
}
video::cue {
    opacity: 1;
    color: #fff;
    background-color: rgba(0, 0, 0, 0.72);
}`,document.head.appendChild(e)}async _loadSubtitles(e){this._teardownNativeSubtitleTrack(),this.video.querySelectorAll("track").forEach(n=>n.remove()),this._subtitleTracks=[],this._activeSubtitleIndex=-1,this.els.subtitleOverlay&&(this.els.subtitleOverlay.textContent="",this.els.subtitleOverlay.classList.add("hidden"));let t=Ye(e||[]),i=-1;for(let n=0;n<t.length;n++){let a=t[n],r=a.label||a.lang||"\u5B57\u5E55",o=a.lang||"und",{cues:c,text:d}=await We(a.url);this._subtitleTracks.push({label:r,lang:o,url:a.url,trackUrl:this._absoluteSubtitleUrl(a.url),cues:c,vttText:d}),a.default&&i<0&&(i=n)}this.els.subtitleBtn.classList.toggle("hidden",t.length===0),this._hasSubtitles=t.length>0,this._refreshTrackButton(),this._disableEmbeddedSubtitleTracks(),this._applyInitialSubtitle(i),this._layoutVideoBox()}_disableEmbeddedSubtitleTracks(){if(this.engine?.hls&&this.engine.hls.subtitleTracks?.length)try{this.engine.hls.subtitleTrack=-1}catch{}Array.from(this.video?.textTracks||[]).forEach(e=>{this._isNativeSubtitleTextTrack(e)||(e.kind==="subtitles"||e.kind==="captions")&&(e.mode="disabled")})}_applyInitialSubtitle(e=-1){let t=this._subtitleTracks||[],i=ue(t);if(i>=0){this._applySubtitle(i);return}this._applySavedSubtitle()||e>=0&&this._applySubtitle(e)}_subtitleIndexForPreference(e){let t=this._subtitleTracks||[];if(!e||t.length===0)return-1;let i=String(e.lang||"").toLowerCase(),n=String(e.label||"").toLowerCase();return t.findIndex(a=>i&&String(a.lang||"").toLowerCase()===i||n&&String(a.label||"").toLowerCase()===n)}_updateSubtitleOverlay(){if(this._usesNativeSubtitleRender())return;let e=this.els.subtitleOverlay;if(!e)return;let t=this._activeSubtitleIndex;if(t<0||!this._subtitleTracks[t]){e.textContent="",e.classList.add("hidden");return}let i=this.video.currentTime,a=this._subtitleTracks[t].cues.find(r=>i>=r.start&&i<r.end);a?(e.textContent=a.text,e.classList.remove("hidden")):(e.textContent="",e.classList.add("hidden"))}_syncSubtitleDisplay({forceNative:e=!1}={}){let t=this.els.subtitleOverlay,i=e||this._usesNativeSubtitleRender();if(this._nativeTrackEl?.track){let n=i&&this._activeSubtitleIndex>=0;this._nativeTrackEl.track.mode=n?"showing":"hidden"}if(Array.from(this.video.textTracks||[]).forEach(n=>{n!==this._nativeTrackEl?.track&&(n.kind==="subtitles"||n.kind==="captions")&&(n.mode="disabled")}),i){t&&(t.textContent="",t.classList.add("hidden"));return}this._updateSubtitleOverlay()}_shouldFillScreen(){return!!this._layoutFullscreen||this._isInFullscreen()}_layoutVideoBox(){let e=this._shouldFillScreen();this.classList.toggle("gyp-fill-screen",e),je({video:this.video,mediaEl:this.els.media,videoBoxEl:this.els.videoBox,overlayEl:this.els.subtitleOverlay,hostEl:this,bottomEl:this.els.bottom,menuEl:this.els.menu,scale:this._subtitleScale||1,immersed:this.classList.contains("gyp-immersed"),menuOpen:!!this._menuOpen,locked:this._locked,fillScreen:e})}_refreshTrackButton(){let e=(this._subtitleTracks?.length||0)>0,t=this.engine?this.engine.getAudioTracks().length>1:!1;this.els.subtitleBtn.classList.toggle("hidden",!e&&!t)}_promptResume(e){return new Promise(t=>{let{resume:i,resumeText:n,resumeYes:a,resumeNo:r}=this.els;n.textContent=`\u4E0A\u6B21\u770B\u5230 ${R(e)}`,i.classList.remove("hidden");let o=!1,c=d=>{o||(o=!0,i.classList.add("hidden"),t(d))};a.onclick=()=>c(e),r.onclick=()=>c(0),setTimeout(()=>c(e),6e3)})}_hideDelayMs(){return this._layoutInline?$t:At}_controlsAreVisible(){return!this.classList.contains("gyp-immersed")}_canAutoHideControls(){return!this.video.paused&&!this._menuOpen&&!this._controlsHovered&&!this._locked&&this.els.epPanel.classList.contains("hidden")}_revealControls(){this._locked||(this.classList.remove("gyp-immersed"),this._controlsShownAt=Date.now(),this._layoutVideoBox())}_immerseControls(){clearTimeout(this._hideTimer),this.classList.add("gyp-immersed"),this._layoutVideoBox()}_setupAutoHide(){let e=()=>{clearTimeout(this._hideTimer),this._controlsAreVisible()&&(this._hideTimer=setTimeout(()=>{this._canAutoHideControls()&&this._immerseControls()},this._hideDelayMs()))},t=()=>{this._revealControls(),this.video.paused||e()},i=()=>{this._controlsAreVisible()&&e()};this._showControls=t,this._scheduleAutoHide=e;let n={signal:this._ac.signal};C()||this.shadowRoot.addEventListener("mousemove",t,n),this.video.addEventListener("pause",()=>{clearTimeout(this._hideTimer),t()},n),this.video.addEventListener("playing",i,n),C()?this._immerseControls():t()}toggleControls(){if(!this._locked)if(this._controlsAreVisible()){if(Date.now()-(this._controlsShownAt||0)<500)return;this._immerseControls()}else this._showControls?.()}_onSurfaceTap(){if(!this._locked){if(this._menuOpen){this.closeMenu();return}if(!this.els.epPanel.classList.contains("hidden")){this.toggleEpisodePanel(!1);return}this._suppressSurfaceClickUntil=Date.now()+500,this._showControls?.()}}_setupMediaSession(){if(!("mediaSession"in navigator))return;let e=navigator.mediaSession,t=this.video;t.addEventListener("play",()=>{e.metadata=new MediaMetadata({title:this.getAttribute("title")||"Video"}),e.playbackState="playing"},{signal:this._ac.signal}),t.addEventListener("pause",()=>{e.playbackState="paused"},{signal:this._ac.signal}),e.setActionHandler("play",()=>t.play()),e.setActionHandler("pause",()=>t.pause()),e.setActionHandler("seekbackward",()=>this.seekBy(-Ze)),e.setActionHandler("seekforward",()=>this.seekBy(Ze)),e.setActionHandler("previoustrack",()=>this.dispatchEvent(new CustomEvent("prev"))),e.setActionHandler("nexttrack",()=>this.dispatchEvent(new CustomEvent("next")))}togglePlay(){this._locked||(this.video.paused?this.video.play().catch(()=>{}):this.video.pause())}play(){return this.video.play()}pause(){this.video.pause()}seek(e){let t=f(e,0,this.video.duration||0);this.engine?this.engine.seekTo(t):this.video.currentTime=t}seekBy(e){let t=f(this.video.currentTime+e,0,this.video.duration||0);this.seek(t),this.showHint(`${e>0?"+":""}${e}s`)}setVolume(e){this.video.volume=f(e,0,1),this.video.muted=!1,T(this.video.volume),U(!1)}toggleMute(){this.video.muted=!this.video.muted,U(this.video.muted)}setRate(e){this._rate=e,this.video.playbackRate=e,this.els.speedBtn.textContent=`${e}x`,we(e)}setTitle(e){this.setAttribute("title",e),this._titleEl&&(this._titleEl.textContent=e)}showNextButton(e){this.els.nextBtn.classList.toggle("hidden",!e)}showPrevButton(e){this.els.prevBtn.classList.toggle("hidden",!e)}setLogo(e){let t=this.els.loadingLogo;t&&(e?(t.src=e,t.classList.remove("hidden")):t.classList.add("hidden"))}showBootLoading(){this.els.loading?.classList.remove("hidden")}setEpisodes(e,t){this._episodes=Array.isArray(e)?e:[],this._currentEpId=t||null;let i=this._episodes.length>0;this.els.episodesBtn.classList.toggle("hidden",!i),i&&this._renderEpisodePanel()}setCurrentEpisode(e){this._currentEpId=e,this._episodes?.length&&this._renderEpisodePanel()}_renderEpisodePanel(){let e=this._episodes,t={};e.forEach(l=>{let p=l.season||1;(t[p]||(t[p]=[])).push(l)});let i=Object.keys(t).sort((l,p)=>l-p),n=i.length>1,a=e.find(l=>l.id===this._currentEpId),r=this._activeSeason||(a?String(a.season||1):i[0]);if(this._activeSeason=r,this._seasonKeys=i,this.els.epNav.classList.toggle("hidden",!n),n){let l=i.indexOf(r),p=this.els.epSeasonCurrent.querySelector(".gyp-ep-season-label");p&&(p.textContent=`\u7B2C${r}\u5B63`),this.els.epPrevSeason.disabled=l<=0,this.els.epNextSeason.disabled=l>=i.length-1,this.els.epSeasons.innerHTML=i.map(h=>`<button class="gyp-ep-option ${h===r?"active":""}" data-season="${h}" role="option">\u7B2C${h}\u5B63</button>`).join("")}else this.els.epSeasons.classList.add("hidden");let o=(t[r]||[]).slice().sort((l,p)=>(l.episode||0)-(p.episode||0));this._epSeasonList=o;let c=Math.ceil(o.length/z),d=c>1;if(this._activeSegSeason!==r){let l=o.findIndex(p=>p.id===this._currentEpId);this._activeSeg=l>=0?Math.floor(l/z):0,this._activeSegSeason=r}if(this._activeSeg>=c&&(this._activeSeg=0),this.els.epSegments.classList.toggle("hidden",!d),d){let l="";for(let p=0;p<c;p++){let h=p*z,b=Math.min(h+z,o.length),x=o[h]?.episode??h+1,v=o[b-1]?.episode??b;l+=`<button class="gyp-ep-seg ${p===this._activeSeg?"active":""}" data-seg="${p}">${x}-${v}</button>`}this.els.epSegments.innerHTML=l}this._renderEpisodeItems()}_renderEpisodeItems(){let e=this._epSeasonList||[],t=(this._activeSeg||0)*z,i=e.slice(t,t+z);this.els.epList.innerHTML=i.map(n=>{let a=n.id===this._currentEpId?"active":"",r=n.available?"has-source":"",o=(n.title||`\u7B2C${n.episode}\u96C6`).replace(/</g,"&lt;"),c=Nt(n.released);return`<button class="gyp-ep-item ${a} ${r}" data-id="${String(n.id).replace(/"/g,"&quot;")}" title="${o.replace(/"/g,"&quot;")}">
                <span class="gyp-ep-line">
                    <span class="gyp-ep-num">${n.episode||""}.</span>
                    <span class="gyp-ep-name">${o}</span>
                    ${n.available?'<span class="gyp-ep-dot" title="\u53EF\u64AD\u653E"></span>':""}
                </span>
                ${c?`<span class="gyp-ep-date">${c}</span>`:""}
            </button>`}).join("")}toggleEpisodePanel(e){let t=e??this.els.epPanel.classList.contains("hidden");t&&this.closeMenu?.(),this.els.epPanel.classList.toggle("hidden",!t),t&&(this._showControls?.(),this._showSheetMask(),this.els.epList.querySelector(".gyp-ep-item.active")?.scrollIntoView({block:"center"})),this._syncSheetMask(),t||this._scheduleAutoHide?.()}toggleFullscreen(){if(this._isInFullscreen()){if(this._pseudoFullscreen)this._exitPseudoFullscreen();else if(this._iosNativeFullscreen&&this.video.webkitExitFullscreen)this.video.webkitExitFullscreen();else{let t=document;(t.exitFullscreen||t.webkitExitFullscreen)?.call(t)}return}if(O){if(this._iosNativeFullscreen)return;this.video.webkitEnterFullscreen&&this.video.webkitEnterFullscreen();return}let e=this.requestFullscreen||this.webkitRequestFullscreen;if(e){e.call(this).then(()=>{this._updateFullscreenUI(),this._lockLandscape()}).catch(()=>{q&&this._enterPseudoFullscreen()});return}q&&this._enterPseudoFullscreen()}_isInFullscreen(){let e=document;return this._iosNativeFullscreen||this._pseudoFullscreen||e.fullscreenElement===this||e.webkitFullscreenElement===this}_ensureFullscreenLockStyle(){if(document.getElementById("gyp-fs-lock-style"))return;let e=document.createElement("style");e.id="gyp-fs-lock-style",e.textContent="html.gyp-player-fs-lock, html.gyp-player-fs-lock body { overflow: hidden !important; height: 100% !important; touch-action: none; }",document.head.appendChild(e)}_enterPseudoFullscreen(){this._pseudoFullscreen||(this._pseudoScrollY=window.scrollY||0,this._pseudoFullscreen=!0,this._ensureFullscreenLockStyle(),document.documentElement.classList.add("gyp-player-fs-lock"),this._updateFullscreenUI(),this._lockLandscape(),window.scrollTo(0,0))}_exitPseudoFullscreen(){this._pseudoFullscreen&&(this._pseudoFullscreen=!1,document.documentElement.classList.remove("gyp-player-fs-lock"),this._updateFullscreenUI(),this._pseudoScrollY&&window.scrollTo(0,this._pseudoScrollY),this._pseudoScrollY=0)}_updateFullscreenUI(){let e=this._isInFullscreen();this.classList.toggle("gyp-fullscreen",e&&this._pseudoFullscreen),this.els?.fsBtn&&(this.els.fsBtn.innerHTML=e?u.exitFullscreen:u.fullscreen),e||this._unlockOrientation(),this._layoutVideoBox()}_iosFullscreen(){this.video.webkitEnterFullscreen&&this.video.webkitEnterFullscreen()}_lockLandscape(){if(!q)return;let e=screen.orientation;if(!e||typeof e.lock!="function")return;let t=this.video.videoWidth||16;(this.video.videoHeight||9)>t||e.lock("landscape").catch(()=>{})}_unlockOrientation(){let e=screen.orientation;if(e&&typeof e.unlock=="function")try{e.unlock()}catch{}}_isInPiP(){return this._pipActive||!!this._docPipWindow||document.pictureInPictureElement===this.video||this.video?.webkitPresentationMode==="picture-in-picture"}togglePiP(){let e=this.video;if(!(!V||!e)){if(this._isInPiP()){this._docPipWindow?this._exitDocumentPiP():document.pictureInPictureElement?document.exitPictureInPicture().catch(()=>{}):e.webkitSetPresentationMode&&e.webkitSetPresentationMode("inline");return}if(typeof window.documentPictureInPicture?.requestWindow=="function"){this._enterDocumentPiP().catch(()=>{typeof e.requestPictureInPicture=="function"&&e.requestPictureInPicture().catch(()=>{})});return}if(typeof e.requestPictureInPicture=="function"){e.requestPictureInPicture().catch(()=>{e.webkitSetPresentationMode&&e.webkitSupportsPresentationMode?.("picture-in-picture")&&e.webkitSetPresentationMode("picture-in-picture")});return}e.webkitSetPresentationMode&&e.webkitSupportsPresentationMode?.("picture-in-picture")&&e.webkitSetPresentationMode("picture-in-picture")}}async _enterDocumentPiP(){let e=this.video;if(!e)return;let t=await window.documentPictureInPicture.requestWindow({width:Math.min(e.videoWidth||640,640),height:Math.min(e.videoHeight||360,360),disallowReturnToOpener:!1});this._docPipWindow=t,this._pipActive=!0,this.classList.add("gyp-pip-active");let i=t.document.createElement("style");i.textContent=`
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: #000; width: 100%; height: 100dvh; overflow: hidden; display: flex; align-items: center; justify-content: center; position: relative; }
            video { width: 100%; height: 100%; object-fit: contain; display: block; }
            #pip-sub {
                position: absolute;
                bottom: 8%;
                left: 50%;
                transform: translateX(-50%);
                color: #fff;
                font-size: clamp(12px, 2.5vw, 18px);
                line-height: 1.3;
                text-align: center;
                white-space: pre-wrap;
                word-break: break-word;
                background: rgba(0,0,0,0.72);
                padding: 0.15em 0.5em;
                border-radius: 4px;
                max-width: 92%;
                pointer-events: none;
            }
            #pip-sub:empty { display: none; }
        `,t.document.head.appendChild(i),t.document.body.appendChild(e);let n=t.document.createElement("div");n.id="pip-sub",t.document.body.appendChild(n),this._docPipSubOverlay=n,this._startDocPipSubtitleSync(n),t.addEventListener("pagehide",()=>this._exitDocumentPiP(),{once:!0})}_startDocPipSubtitleSync(e){this._stopDocPipSubtitleSync();let t=this.video,i=()=>{if(!this._docPipSubOverlay)return;let n=this._activeSubtitleIndex,a=n>=0?this._subtitleTracks[n]:null;if(!a?.cues?.length){this._docPipSubOverlay.textContent="";return}let r=t.currentTime,o=a.cues.find(c=>r>=c.start&&r<c.end);this._docPipSubOverlay.textContent=o?o.text:""};this._docPipCueHandler=i,t.addEventListener("timeupdate",i),i()}_stopDocPipSubtitleSync(){this._docPipCueHandler&&(this.video?.removeEventListener("timeupdate",this._docPipCueHandler),this._docPipCueHandler=null)}_exitDocumentPiP(){this._stopDocPipSubtitleSync(),this._docPipSubOverlay=null;let e=this.video,t=this.els?.videoBox;if(e&&t&&!t.contains(e)&&t.insertBefore(e,t.firstChild),this._docPipWindow&&!this._docPipWindow.closed)try{this._docPipWindow.close()}catch{}this._docPipWindow=null,this._pipActive=!1,this.classList.remove("gyp-pip-active"),this._onExitIsolatedPlayback()}toggleLock(){this._locked=!this._locked,this.classList.toggle("gyp-locked",this._locked),this.els.lockBtn.innerHTML=this._locked?u.unlock:u.lock,this._locked||this._showControls?.()}get speeds(){return Ke}_updateVolumeUI(){let e=this.video.muted?0:this.video.volume;this.els.volumeFill.style.width=`${e*100}%`,this.els.volumeThumb.style.left=`${e*100}%`;let t=e===0?"mute":e<.5?"low":"high";t!==this._volTier&&(this._volTier=t,this.els.volumeBtn.innerHTML=t==="mute"?u.volumeMute:t==="low"?u.volumeLow:u.volumeHigh)}_refreshQualityLabel(){if(this._qualitySources?.length>1){let t=this._currentSource();this.els.qualityBtn.textContent=t?.quality||t?.label||"\u6E05\u6670\u5EA6";return}if(!this.engine)return;let e=this.engine.getCurrentLevel();if(e===-1)this.els.qualityBtn.textContent="\u81EA\u52A8";else{let t=this.engine.getLevels()[e];this.els.qualityBtn.textContent=t?t.name:"\u81EA\u52A8"}}showHint(e){this.els.hint.textContent=e,this.els.hint.classList.add("visible"),clearTimeout(this._hintTimer),this._hintTimer=setTimeout(()=>this.els.hint.classList.remove("visible"),700)}showHintHold(e){clearTimeout(this._hintTimer),this.els.hint.textContent=e,this.els.hint.classList.add("visible")}hideHint(){clearTimeout(this._hintTimer),this.els.hint.classList.remove("visible")}showErrorActions(e,t=[]){this.els.loading?.classList.add("hidden"),this._showError(e||"\u89C6\u9891\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",t)}hideErrorActions(){this._hideError()}flashDoubleTap(e,t){let i=e==="left"?this.els.dblTapLeft:this.els.dblTapRight,n=e==="left"?this.els.dblTapRight:this.els.dblTapLeft;n.classList.add("hidden"),n.classList.remove("active"),this._dblTapSide===e&&this._dblTapTimer?this._dblTapAccum+=t:this._dblTapAccum=t,this._dblTapSide=e,i.querySelector(".gyp-dbltap-text").textContent=`${this._dblTapAccum} \u79D2`,i.classList.remove("hidden"),i.classList.remove("active"),i.offsetWidth,i.classList.add("active"),clearTimeout(this._dblTapTimer),this._dblTapTimer=setTimeout(()=>{i.classList.add("hidden"),i.classList.remove("active"),this._dblTapTimer=null,this._dblTapSide=null},600)}showVSlide(e,t,i){let n=f(t,0,1)*100;this.els.vslideIcon.innerHTML=i,this.els.vslideFill.style.width=`${n}%`,this.els.vslide.classList.remove("hidden"),clearTimeout(this._vslideTimer),this._vslideTimer=setTimeout(()=>{this.els.vslide.classList.add("hidden")},600)}hideVSlide(){clearTimeout(this._vslideTimer),this.els.vslide.classList.add("hidden")}_maybeShowGuide(){if(this._guideShown||!("ontouchstart"in window)||Me())return;this._guideShown=!0,Ce(),this.els.guide.classList.remove("hidden");let e=()=>{this.els.guide.classList.add("hidden"),clearTimeout(this._guideTimer)};this.els.guideBtn.addEventListener("click",e,{once:!0,signal:this._ac?.signal}),this._guideTimer=setTimeout(e,5e3)}_flashCenter(e){this.els.centerBtn.innerHTML=e,this.els.center.classList.remove("flash"),this.els.center.offsetWidth,this.els.center.classList.add("flash")}_showError(e,t=null){let i=this.shadowRoot.querySelector(".gyp-error");i||(i=document.createElement("div"),i.className="gyp-error",i.innerHTML='<div class="gyp-error-msg"></div><div class="gyp-error-actions"></div>',this.shadowRoot.appendChild(i)),i.querySelector(".gyp-error-msg").textContent=e;let n=Dt(t),a=i.querySelector(".gyp-error-actions");a.innerHTML=n.map(r=>`<button class="gyp-error-btn ${r.variant==="secondary"?"secondary":""}" data-action="${ge(r.id)}">${ge(r.label)}</button>`).join(""),a.querySelectorAll(".gyp-error-btn").forEach(r=>{r.addEventListener("click",()=>{let o=r.dataset.action||"retry";if(o==="retry"){this._hideError();let c=this._activeSourceUrl||this.getAttribute("src");c&&this.loadStream(c,{...this._loadOptions||{},sourceUrl:c,videoId:this._videoId})}this.dispatchEvent(new CustomEvent("erroraction",{detail:{id:o}}))})}),i.classList.remove("hidden")}_hideError(){let e=this.shadowRoot.querySelector(".gyp-error");e&&e.classList.add("hidden")}_errorMessage(e){let t=e?.type;if(t&&/network/i.test(t))return"\u7F51\u7EDC\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u65E0\u6CD5\u52A0\u8F7D\u89C6\u9891";if(t&&/media/i.test(t))return"\u89C6\u9891\u89E3\u7801\u5931\u8D25\uFF0C\u683C\u5F0F\u53EF\u80FD\u4E0D\u53D7\u652F\u6301";let i=e?.code;return i===2?"\u7F51\u7EDC\u8FDE\u63A5\u4E2D\u65AD\uFF0C\u65E0\u6CD5\u52A0\u8F7D\u89C6\u9891":i===3?"\u89C6\u9891\u89E3\u7801\u5931\u8D25\uFF0C\u683C\u5F0F\u53EF\u80FD\u4E0D\u53D7\u652F\u6301":i===4?"\u89C6\u9891\u6E90\u4E0D\u53EF\u7528\u6216\u683C\u5F0F\u4E0D\u652F\u6301":"\u89C6\u9891\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"}toggleMenu(e){if(this._menuOpen===e){this.closeMenu();return}this.toggleEpisodePanel(!1),this._menuOpen=e,this._showControls?.(),this.els.menu.classList.remove("hidden"),this._showSheetMask(),this.els.menu.innerHTML=this._buildMenu(e),this._bindMenuItems(e);let t=this.els.menu.querySelector(".gyp-menu-item");t&&(t.tabIndex=0,t.focus()),this._bindMenuKeys(),this._layoutVideoBox()}closeMenu(){this._menuOpen&&(this._menuOpen=!1,this.els.menu.classList.add("hidden"),this._syncSheetMask(),this._layoutVideoBox(),this._scheduleAutoHide?.())}_showSheetMask(){this.els.sheetMask?.classList.remove("hidden")}_syncSheetMask(){let e=!this.els.epPanel.classList.contains("hidden"),t=!this.els.menu.classList.contains("hidden");this.els.sheetMask?.classList.toggle("hidden",!e&&!t)}_bindMenuKeys(){let e=Array.from(this.els.menu.querySelectorAll(".gyp-menu-item"));e.forEach((t,i)=>{t.tabIndex=0,t.onkeydown=n=>{n.key==="ArrowDown"?(n.preventDefault(),e[(i+1)%e.length].focus()):n.key==="ArrowUp"?(n.preventDefault(),e[(i-1+e.length)%e.length].focus()):(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),t.click())}})}_buildMenu(e){return e==="speed"?this._menuSpeed():e==="quality"?this._menuQuality():e==="subtitle"?this._menuSubtitle():e==="settings"?this._menuSettings():""}_menuSpeed(){let e=this.video.playbackRate;return'<div class="gyp-menu-title">\u64AD\u653E\u901F\u5EA6</div>'+Ke.map(t=>`<div class="gyp-menu-item ${t===e?"active":""}" data-speed="${t}">
                <span>${t===1?"\u6B63\u5E38":t+"x"}</span>${u.check.replace("<svg",'<svg class="gyp-menu-check"')}
            </div>`).join("")}_menuQuality(){let e=this._qualitySources||[];if(e.length>1){let o=u.check.replace("<svg",'<svg class="gyp-menu-check"'),c='<div class="gyp-menu-title">\u6E05\u6670\u5EA6</div>';return c+=e.map((d,l)=>`<div class="gyp-menu-item ${d.url===this._activeSourceUrl?"active":""}" data-source="${l}">
                    <span>${ge(d.quality||d.label||`\u6E90 ${l+1}`)}</span>${o}
                </div>`).join(""),c}let t=this.engine?this.engine.getLevels():[];if(t.length===0)return'<div class="gyp-menu-title">\u753B\u8D28</div><div class="gyp-menu-item active"><span>\u81EA\u52A8</span></div>';let i=this.engine.getCurrentLevel(),n=[...t].sort((o,c)=>c.height-o.height),a=u.check.replace("<svg",'<svg class="gyp-menu-check"'),r='<div class="gyp-menu-title">\u753B\u8D28</div>';return r+=`<div class="gyp-menu-item ${i===-1?"active":""}" data-level="-1"><span>\u81EA\u52A8</span>${a}</div>`,r+=n.map(o=>`<div class="gyp-menu-item ${i===o.index?"active":""}" data-level="${o.index}">
                <span>${o.name}</span>${a}
            </div>`).join(""),r}_menuSettings(){let e=u.check.replace("<svg",'<svg class="gyp-menu-check"'),t='<div class="gyp-menu-title">\u8BBE\u7F6E</div>';if(be()&&(this.els.episodesBtn.classList.contains("hidden")||(t+='<div class="gyp-menu-item" data-action="episodes"><span>\u9009\u96C6</span></div>'),this.els.prevBtn.classList.contains("hidden")||(t+='<div class="gyp-menu-item" data-action="prev"><span>\u4E0A\u4E00\u96C6</span></div>'),this.els.nextBtn.classList.contains("hidden")||(t+='<div class="gyp-menu-item" data-action="next"><span>\u4E0B\u4E00\u96C6</span></div>')),!!this._danmaku?.videoId&&!this._danmaku?.disabled){let a=this._danmaku.enabled;t+='<div class="gyp-menu-title">\u5F39\u5E55</div>',t+=`<div class="gyp-menu-item ${a?"active":""}" data-danmaku="1"><span>\u663E\u793A\u5F39\u5E55</span>${e}</div>`,t+=`<div class="gyp-menu-item ${a?"":"active"}" data-danmaku="0"><span>\u5173\u95ED\u5F39\u5E55</span>${e}</div>`;let r=this._danmaku.lastReportable,o=r?.id&&!String(r.id).startsWith("local:");t+=`<div class="gyp-menu-item ${o?"":"is-disabled"}" data-danmaku-report="1"><span>\u4E3E\u62A5\u6700\u8FD1\u5F39\u5E55</span></div>`}return t+='<div class="gyp-menu-title">\u64AD\u653E</div>',t+='<div class="gyp-menu-item" data-open-menu="speed"><span>\u64AD\u653E\u901F\u5EA6</span></div>',t+='<div class="gyp-menu-item" data-open-menu="quality"><span>\u753B\u8D28</span></div>',this.els.subtitleBtn.classList.contains("hidden")||(t+='<div class="gyp-menu-item" data-open-menu="subtitle"><span>\u5B57\u5E55 / \u97F3\u8F68</span></div>'),t}_menuSubtitle(){let e=this._subtitleTracks||[],t=u.check.replace("<svg",'<svg class="gyp-menu-check"'),i=this._activeSubtitleIndex,n='<div class="gyp-menu-title">\u5B57\u5E55</div>';n+=`<div class="gyp-menu-item ${i<0?"active":""}" data-sub="-1"><span>\u5173\u95ED</span>${t}</div>`,n+=e.map((r,o)=>`<div class="gyp-menu-item ${i===o?"active":""}" data-sub="${o}">
                <span>${r.label||r.lang||`\u5B57\u5E55 ${o+1}`}</span>${t}
            </div>`).join("");let a=this.engine?this.engine.getAudioTracks():[];if(a.length>1){let r=this.engine.getCurrentAudioTrack();n+='<div class="gyp-menu-title">\u97F3\u8F68</div>',n+=a.map(o=>`<div class="gyp-menu-item ${o.id===r?"active":""}" data-audio="${o.id}">
                    <span>${o.name}</span>${t}
                </div>`).join("")}return n}_bindMenuItems(e){this.els.menu.querySelectorAll(".gyp-menu-item").forEach(t=>{t.addEventListener("click",()=>{if(e==="speed")this.setRate(parseFloat(t.dataset.speed));else if(e==="quality")t.dataset.source!=null?this._applySourceQuality(parseInt(t.dataset.source,10)):this._applyQuality(parseInt(t.dataset.level,10));else if(e==="subtitle"){if(t.dataset.audio!=null){this._applyAudioTrack(parseInt(t.dataset.audio,10));return}this._applySubtitle(parseInt(t.dataset.sub,10))}else if(e==="settings"){if(t.classList.contains("is-disabled"))return;if(t.dataset.action==="prev"){this.dispatchEvent(new CustomEvent("prev")),this.closeMenu();return}if(t.dataset.action==="next"){this.dispatchEvent(new CustomEvent("next")),this.closeMenu();return}if(t.dataset.action==="episodes"){this.closeMenu(),this.toggleEpisodePanel(!0);return}if(t.dataset.openMenu){this.toggleMenu(t.dataset.openMenu);return}if(t.dataset.danmaku!=null){let i=t.dataset.danmaku==="1";this._danmaku.setEnabled(i),Be(i),this.els.menu.innerHTML=this._buildMenu("settings"),this._bindMenuItems("settings"),this._bindMenuKeys();return}t.dataset.danmakuReport!=null&&this._reportDanmakuFromMenu()}this.closeMenu()})})}async _reportDanmakuFromMenu(){try{await this._danmaku.reportLast(),this.showHint("\u5DF2\u63D0\u4EA4\u5F39\u5E55\u4E3E\u62A5")}catch(e){this.showHint(e?.message||"\u5F39\u5E55\u4E3E\u62A5\u5931\u8D25"),e?.status===401&&this.dispatchEvent(new CustomEvent("danmaku-login",{detail:{action:"report"}}))}this.closeMenu()}_applyQuality(e){this.engine&&this.engine.setLevel(e);let t=e===-1?{kind:"hls-level",value:"auto",label:"\u81EA\u52A8"}:this.engine?.getLevels().find(i=>i.index===e);t&&re(t.kind?t:{kind:"hls-level",value:String(t.height||t.name||e),label:t.name||`${t.height}p`}),this._refreshQualityLabel()}_currentSource(){return(this._qualitySources||[]).find(e=>e.url===this._activeSourceUrl)||null}_applySourceQuality(e){let t=this._qualitySources?.[e];if(!t||t.url===this._activeSourceUrl)return;let i=this.video?.currentTime||0,n=this.video&&!this.video.paused&&!this.video.ended,a={...this._loadOptions||{},sourceUrl:t.url,subtitles:t.subtitles||this._loadOptions?.subtitles||[],startTime:i,playAfterLoad:n};re({kind:"source",value:Ft(t),label:zt(t,"\u64AD\u653E\u6E90")}),this.dispatchEvent(new CustomEvent("sourcechange",{detail:{source:t,sourceUrl:t.url,quality:t.quality||t.label||"",currentTime:i,wasPlaying:n}})),this.showHint(`\u5207\u6362\u5230 ${t.quality||t.label||"\u65B0\u6E05\u6670\u5EA6"}`),this.loadStream(t.url,a)}_applySubtitle(e){if(this._activeSubtitleIndex=e,e<0)oe({off:!0});else{let t=this._subtitleTracks[e];t&&oe({lang:t.lang||"",label:t.label||""})}this._isolatedVideoPlayback()?this._mountNativeSubtitleTrack():this._syncSubtitleDisplay(),this._layoutVideoBox()}_applyAudioTrack(e){this.engine&&this.engine.setAudioTrack(e);let t=this.engine?.getAudioTracks().find(i=>i.id===e);t&&Le({id:t.id,lang:t.lang||"",name:t.name||""}),this._menuOpen==="subtitle"&&(this.els.menu.innerHTML=this._buildMenu("subtitle"),this._bindMenuItems("subtitle"))}_applySavedQualityLevel(){if(!this.engine||(this._qualitySources||[]).length>1)return;let e=Ee();if(!e||e.kind!=="hls-level")return;if(e.value==="auto"){this.engine.setLevel(-1);return}let t=this.engine.getLevels(),i=String(e.value||"").toLowerCase(),n=t.find(a=>String(a.height||"").toLowerCase()===i||String(a.name||"").toLowerCase()===i||String(a.index)===i);n&&this.engine.setLevel(n.index)}_applySavedSubtitle(){let e=Te(),t=this._subtitleTracks||[];if(!e||t.length===0)return!1;if(e.off)return this._applySubtitle(-1),!0;let i=this._subtitleIndexForPreference(e);return i>=0?(this._applySubtitle(i),!0):!1}_applyPreferredChineseSubtitle(){let e=ue(this._subtitleTracks||[]);e>=0&&this._applySubtitle(e)}_applySavedAudioTrack(){if(!this.engine)return;let e=Pe();if(!e)return;let t=this.engine.getAudioTracks();if(t.length<=1)return;let i=String(e.lang||"").toLowerCase(),n=String(e.name||"").toLowerCase(),a=t.find(r=>i&&String(r.lang||"").toLowerCase()===i||n&&String(r.name||"").toLowerCase()===n||Number(r.id)===Number(e.id));a&&this.engine.setAudioTrack(a.id)}destroy(){this._saveProgress(),this._pseudoFullscreen&&this._exitPseudoFullscreen(),this._mediaResizeObserver&&(this._mediaResizeObserver.disconnect(),this._mediaResizeObserver=null),this._danmaku&&(this._danmaku.destroy(),this._danmaku=null),this.engine&&(this.engine.detach(),this.engine=null),this._ac&&(this._ac.abort(),this._ac=null),this._teardownNativeSubtitleTrack(),clearTimeout(this._hideTimer),clearTimeout(this._hintTimer)}_saveProgress(){if(!this.video||this._ended)return;let{currentTime:e,duration:t}=this.video,i=t&&t-e<10;if(this.dispatchEvent(new CustomEvent("progress",{detail:{videoId:this._videoId,currentTime:i?0:e,duration:t||0,percent:t?e/t*100:0,final:!0}})),!this._disableStorage){if(i){ae(this._videoId);return}ne(this._videoId,e)}}};customElements.get("gy-player")||customElements.define("gy-player",ee);var xi=ee;})();
