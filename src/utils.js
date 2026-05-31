// 工具函数集合 — 纯函数，无副作用，无第三方依赖

/**
 * 将秒数格式化为时间字符串
 * @param {number} seconds 秒数
 * @returns {string} 形如 03:45 或 1:03:45
 */
export function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
    const s = Math.floor(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
    return `${pad(m)}:${pad(sec)}`;
}

/**
 * 将数值限制在 [min, max] 区间内
 * @param {number} value 输入值
 * @param {number} min 下界
 * @param {number} max 上界
 * @returns {number} 限制后的值
 */
export function clamp(value, min, max) {
    if (isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
}

/**
 * 节流：在 delay 毫秒内最多执行一次
 * @param {Function} fn 目标函数
 * @param {number} delay 间隔毫秒
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, delay) {
    let last = 0;
    let timer = null;
    return function throttled(...args) {
        const now = Date.now();
        const remaining = delay - (now - last);
        if (remaining <= 0) {
            if (timer) { clearTimeout(timer); timer = null; }
            last = now;
            fn.apply(this, args);
        } else if (!timer) {
            timer = setTimeout(() => {
                last = Date.now();
                timer = null;
                fn.apply(this, args);
            }, remaining);
        }
    };
}

// ===== 设备与能力检测（一次性求值，避免重复读取 UA）=====

const ua = navigator.userAgent || '';

/** 是否为 iOS 设备（含 iPadOS 桌面级 Safari） */
export const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));

/** 是否为移动端（含 Android 与 iOS） */
export const isMobile = isIOS || /Android/i.test(ua);

/** 是否为 Safari 浏览器 */
export const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

/**
 * 是否应使用原生 HLS 播放。
 *
 * 注意：不能只看 canPlayType —— Chrome/Edge 对 HLS 返回 "maybe"（非空），
 * 但桌面 Chrome 实际无法可靠播放 HLS（尤其 TS 切片），且原生路径无法做
 * 多码率画质切换。业界共识：仅 Safari / iOS 信任原生 HLS，其余一律走 hls.js。
 *
 * @returns {boolean} 是否走原生 HLS
 */
export function nativeHlsSupported() {
    // 仅在 Safari（含 iOS/iPadOS）上启用原生 HLS
    if (!isSafari && !isIOS) return false;
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
        video.canPlayType('application/x-mpegURL') !== '';
}

/** 是否支持画中画 */
export const supportsPiP = 'pictureInPictureEnabled' in document &&
    document.pictureInPictureEnabled;

/** 是否支持全屏 API */
export const supportsFullscreen = !!(document.fullscreenEnabled ||
    document.webkitFullscreenEnabled);

/** 是否支持 AirPlay（Safari） */
export function supportsAirPlay() {
    return !!window.WebKitPlaybackTargetAvailabilityEvent;
}
