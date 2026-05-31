// 移动端手势 — 横滑快进/快退、竖滑音量/亮度、长按倍速、双击快进
// 仅在触屏设备绑定，桌面端跳过

import { clamp } from './utils.js';
import { saveVolume } from './storage.js';

const SWIPE_THRESHOLD = 16;       // 判定为有效滑动的最小位移（px）
const SEEK_SECONDS_PER_WIDTH = 90; // 全屏横滑对应的秒数
const LONG_PRESS_DELAY = 500;      // 长按触发延迟（ms）
const LONG_PRESS_RATE = 2;         // 长按倍速
const DOUBLE_TAP_GAP = 300;        // 双击间隔（ms）
const DOUBLE_TAP_SEEK = 10;        // 双击快进/快退秒数

/**
 * 绑定触屏手势
 * @param {import('./gy-player.js').GYPlayer} player
 * @param {AbortSignal} signal
 */
export function bindGestures(player, signal) {
    if (!('ontouchstart' in window)) return;

    const v = player.video;
    const surface = player.els.surface;
    const sig = { signal };

    let startX = 0, startY = 0, startTime = 0, startVol = 0;
    let gesture = null;          // 'seek' | 'volume' | 'brightness'
    let longPressTimer = null;
    let longPressActive = false;
    let originalRate = 1;
    let lastTap = 0, lastTapX = 0;

    const onStart = (e) => {
        if (player._locked || e.touches.length !== 1) return;
        const tch = e.touches[0];
        startX = tch.clientX;
        startY = tch.clientY;
        startTime = v.currentTime;
        startVol = v.volume;
        gesture = null;

        // 长按倍速
        longPressTimer = setTimeout(() => {
            longPressActive = true;
            originalRate = v.playbackRate;
            v.playbackRate = LONG_PRESS_RATE;
            player.showHint(`${LONG_PRESS_RATE}x 快进中`);
        }, LONG_PRESS_DELAY);
    };

    const onMove = (e) => {
        if (player._locked || e.touches.length !== 1) return;
        clearTimeout(longPressTimer);
        if (longPressActive) return;

        const tch = e.touches[0];
        const dx = tch.clientX - startX;
        const dy = tch.clientY - startY;

        if (!gesture) {
            if (Math.abs(dx) > SWIPE_THRESHOLD) {
                gesture = 'seek';
            } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
                gesture = tch.clientX < player.clientWidth / 2 ? 'brightness' : 'volume';
            } else {
                return;
            }
        }

        if (gesture === 'seek') {
            const delta = (dx / player.clientWidth) * SEEK_SECONDS_PER_WIDTH;
            const target = clamp(startTime + delta, 0, v.duration || 0);
            v.currentTime = target;
            player.showHint(`${delta > 0 ? '+' : ''}${Math.round(delta)}s`);
        } else if (gesture === 'volume') {
            const delta = -dy / (player.clientHeight * 0.6);
            v.volume = clamp(startVol + delta, 0, 1);
            v.muted = false;
            saveVolume(v.volume);
            player.showHint(`音量 ${Math.round(v.volume * 100)}%`);
        } else if (gesture === 'brightness') {
            // 亮度：通过 video 滤镜模拟（Web 无法控制系统亮度）
            player._brightness = clamp((player._brightness ?? 1) + (-dy / (player.clientHeight * 0.6)), 0.2, 1.5);
            v.style.filter = `brightness(${player._brightness})`;
            player.showHint(`亮度 ${Math.round(player._brightness * 100)}%`);
        }
    };

    const onEnd = (e) => {
        clearTimeout(longPressTimer);
        if (longPressActive) {
            v.playbackRate = originalRate;
            longPressActive = false;
            return;
        }
        // 双击检测（仅在未发生滑动时）
        if (!gesture) {
            const now = Date.now();
            const x = e.changedTouches[0].clientX;
            if (now - lastTap < DOUBLE_TAP_GAP && Math.abs(x - lastTapX) < 60) {
                const isRight = x > player.clientWidth / 2;
                player.seekBy(isRight ? DOUBLE_TAP_SEEK : -DOUBLE_TAP_SEEK);
                lastTap = 0; // 重置，避免三击误判
            } else {
                lastTap = now;
                lastTapX = x;
            }
        }
        gesture = null;
    };

    surface.addEventListener('touchstart', onStart, { signal, passive: true });
    surface.addEventListener('touchmove', onMove, { signal, passive: true });
    surface.addEventListener('touchend', onEnd, sig);
}
