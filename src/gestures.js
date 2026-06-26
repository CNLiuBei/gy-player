// 移动端手势 — 横滑快进/快退、竖滑音量/亮度、长按倍速、双击快进
// 仅在触屏设备绑定，桌面端跳过

import { clamp, hasTouchInput } from './utils.js';
import { saveVolume } from './storage.js';
import { icons } from './icons.js';

const SWIPE_THRESHOLD = 16;       // 判定为有效滑动的最小位移（px）
const SEEK_SECONDS_PER_WIDTH = 90; // 全屏横滑对应的秒数
const LONG_PRESS_DELAY = 500;      // 长按触发延迟（ms）
const LONG_PRESS_RATE = 2;         // 长按倍速
const DOUBLE_TAP_GAP = 300;        // 双击间隔（ms，对齐 YouTube）
const DOUBLE_TAP_SEEK = 10;        // 双击快进/快退秒数
const DOUBLE_TAP_X_TOLERANCE = 80; // 同侧双击允许的水平偏移（px）

/**
 * 绑定触屏手势
 * @param {import('./gy-player.js').GYPlayer} player
 * @param {AbortSignal} signal
 */
export function bindGestures(player, signal) {
    if (!hasTouchInput()) return;

    const v = player.video;
    const surface = player.els.surface;
    const sig = { signal };

    let startX = 0, startY = 0, startTime = 0, startVol = 0;
    let gesture = null;          // 'seek' | 'volume' | 'brightness'
    let seekPreviewTarget = null;
    let longPressTimer = null;
    let longPressActive = false;
    let originalRate = 1;
    let lastTap = 0, lastTapX = 0;
    let singleTapTimer = null;

    const cancelSingleTap = () => {
        if (singleTapTimer) {
            clearTimeout(singleTapTimer);
            singleTapTimer = null;
        }
    };

    const scheduleSingleTap = () => {
        cancelSingleTap();
        singleTapTimer = setTimeout(() => {
            singleTapTimer = null;
            player._onSurfaceTap?.();
        }, DOUBLE_TAP_GAP);
    };

    player._cancelPendingSurfaceTap = cancelSingleTap;

    const isRightHalf = (x) => x > player.clientWidth / 2;

    const onStart = (e) => {
        if (player._locked || e.touches.length !== 1) return;
        cancelSingleTap();
        const tch = e.touches[0];
        startX = tch.clientX;
        startY = tch.clientY;
        startTime = v.currentTime;
        startVol = v.volume;
        gesture = null;
        seekPreviewTarget = null;

        // 长按倍速
        longPressTimer = setTimeout(() => {
            longPressActive = true;
            originalRate = v.playbackRate;
            v.playbackRate = LONG_PRESS_RATE;
            player.showHintHold(`▶▶ ${LONG_PRESS_RATE}x 快进中`);
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
                cancelSingleTap();
            } else if (Math.abs(dy) > SWIPE_THRESHOLD) {
                gesture = tch.clientX < player.clientWidth / 2 ? 'brightness' : 'volume';
                cancelSingleTap();
            } else {
                return;
            }
        }

        if (gesture === 'seek') {
            const delta = (dx / player.clientWidth) * SEEK_SECONDS_PER_WIDTH;
            seekPreviewTarget = clamp(startTime + delta, 0, v.duration || 0);
            player.showHint(`${delta > 0 ? '+' : ''}${Math.round(delta)}s`);
        } else if (gesture === 'volume') {
            const delta = -dy / (player.clientHeight * 0.6);
            v.volume = clamp(startVol + delta, 0, 1);
            v.muted = false;
            saveVolume(v.volume);
            const icon = v.volume === 0 ? icons.volumeMute
                : v.volume < 0.5 ? icons.volumeLow : icons.volumeHigh;
            player.showVSlide('volume', v.volume, icon);
        } else if (gesture === 'brightness') {
            // 亮度：用覆盖层模拟，不给 video 加 CSS filter，避免破坏 HDR/广色域合成。
            player._brightness = clamp((player._brightness ?? 1) + (-dy / (player.clientHeight * 0.6)), 0.2, 1.5);
            if (player.els.brightnessOverlay) {
                const dim = player._brightness < 1;
                player.els.brightnessOverlay.style.background = dim ? '#000' : '#fff';
                player.els.brightnessOverlay.style.opacity = dim
                    ? String(((1 - player._brightness) / 0.8) * 0.75)
                    : String(((player._brightness - 1) / 0.5) * 0.18);
            }
            // 显示比例：0.2~1.5 映射到 0~1
            player.showVSlide('brightness', (player._brightness - 0.2) / 1.3, icons.brightness);
        }
    };

    const onEnd = (e) => {
        clearTimeout(longPressTimer);
        if (longPressActive) {
            v.playbackRate = originalRate;
            longPressActive = false;
            player.hideHint();
            if (gesture === 'seek' && seekPreviewTarget != null) {
                player.seek(seekPreviewTarget);
            }
            seekPreviewTarget = null;
            gesture = null;
            return;
        }

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const totalDx = endX - startX;
        const totalDy = endY - startY;

        // 轻微抖动不算滑动，仍走单击/双击（避免 CDP/真机微移导致控件唤不出）
        if (gesture === 'seek' && Math.abs(totalDx) <= SWIPE_THRESHOLD * 2) {
            gesture = null;
            seekPreviewTarget = null;
        } else if (gesture === 'volume' || gesture === 'brightness') {
            if (Math.abs(totalDy) <= SWIPE_THRESHOLD * 2) gesture = null;
        }

        if (gesture === 'seek' && seekPreviewTarget != null) {
            player.seek(seekPreviewTarget);
            seekPreviewTarget = null;
        }
        // YouTube 式双击：同侧连点 seek，不切换控件；单击延迟判定避免误触
        if (!gesture) {
            const now = Date.now();
            const x = endX;
            const sameSide = isRightHalf(x) === isRightHalf(lastTapX);
            if (now - lastTap < DOUBLE_TAP_GAP && Math.abs(x - lastTapX) < DOUBLE_TAP_X_TOLERANCE && sameSide) {
                cancelSingleTap();
                const isRight = isRightHalf(x);
                player.seek(player.video.currentTime + (isRight ? DOUBLE_TAP_SEEK : -DOUBLE_TAP_SEEK));
                player.flashDoubleTap(isRight ? 'right' : 'left', DOUBLE_TAP_SEEK);
                lastTap = 0;
                player._suppressSurfaceClickUntil = Date.now() + 500;
            } else {
                lastTap = now;
                lastTapX = x;
                player._suppressSurfaceClickUntil = Date.now() + DOUBLE_TAP_GAP + 250;
                scheduleSingleTap();
            }
        }
        gesture = null;
        seekPreviewTarget = null;
    };

    surface.addEventListener('touchstart', onStart, { signal, passive: true });
    surface.addEventListener('touchmove', onMove, { signal, passive: true });
    surface.addEventListener('touchend', onEnd, sig);
    // 触摸被系统中断（来电、通知、多指）时复位长按倍速，避免速率卡住
    surface.addEventListener('touchcancel', () => {
        clearTimeout(longPressTimer);
        cancelSingleTap();
        if (longPressActive) {
            v.playbackRate = originalRate;
            longPressActive = false;
            player.hideHint();
        }
        gesture = null;
        seekPreviewTarget = null;
    }, sig);
}
