// 键盘快捷键 — 桌面端完整快捷键支持
// 遵循 YouTube/Netflix 通用约定，降低用户学习成本

import { clamp } from './utils.js';
import { saveVolume } from './storage.js';

const SEEK_STEP = 10;       // 方向键步长（秒）
const SEEK_STEP_BIG = 30;   // Shift+方向键步长（秒）
const VOLUME_STEP = 0.1;    // 音量步长

/**
 * 绑定键盘快捷键
 * @param {import('./gy-player.js').GYPlayer} player
 * @param {AbortSignal} signal
 */
export function bindKeyboard(player, signal) {
    const handler = (e) => {
        // 锁定态或在输入框内时不响应
        if (player._locked) return;
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

        const v = player.video;
        const speeds = player.speeds;

        switch (e.key) {
            case ' ':
            case 'k':
                e.preventDefault();
                player.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                player.seekBy(e.shiftKey ? -SEEK_STEP_BIG : -SEEK_STEP);
                break;
            case 'ArrowRight':
                e.preventDefault();
                player.seekBy(e.shiftKey ? SEEK_STEP_BIG : SEEK_STEP);
                break;
            case 'j':
                player.seekBy(-SEEK_STEP_BIG);
                break;
            case 'l':
                player.seekBy(SEEK_STEP_BIG);
                break;
            case 'ArrowUp':
                e.preventDefault();
                v.volume = clamp(v.volume + VOLUME_STEP, 0, 1);
                v.muted = false;
                saveVolume(v.volume);
                player.showHint(`音量 ${Math.round(v.volume * 100)}%`);
                break;
            case 'ArrowDown':
                e.preventDefault();
                v.volume = clamp(v.volume - VOLUME_STEP, 0, 1);
                saveVolume(v.volume);
                player.showHint(`音量 ${Math.round(v.volume * 100)}%`);
                break;
            case 'm':
                player.toggleMute();
                break;
            case 'f':
                player.toggleFullscreen();
                break;
            case 'p':
                player.togglePiP();
                break;
            case '>':
            case '.':
                changeRate(player, speeds, 1);
                break;
            case '<':
            case ',':
                changeRate(player, speeds, -1);
                break;
            case 'Escape':
                if (player._menuOpen) {
                    player.closeMenu();
                } else if (player._isInFullscreen?.()) {
                    player.toggleFullscreen();
                } else {
                    player.dispatchEvent(new CustomEvent('back'));
                }
                break;
            default:
                // 数字键 0-9：跳转到对应百分比
                if (/^[0-9]$/.test(e.key) && v.duration) {
                    v.currentTime = (parseInt(e.key, 10) / 10) * v.duration;
                }
                break;
        }
    };

    document.addEventListener('keydown', handler, { signal });
}

/**
 * 调整倍速（在预设档位间切换）
 * @param {import('./gy-player.js').GYPlayer} player
 * @param {number[]} speeds 倍速档位
 * @param {number} dir 方向 +1/-1
 */
function changeRate(player, speeds, dir) {
    const cur = player.video.playbackRate;
    let idx = speeds.indexOf(cur);
    if (idx === -1) {
        // 当前倍速不在档位中，找最接近的
        idx = speeds.reduce((best, s, i) =>
            Math.abs(s - cur) < Math.abs(speeds[best] - cur) ? i : best, 0);
    }
    const next = clamp(idx + dir, 0, speeds.length - 1);
    player.setRate(speeds[next]);
    player.showHint(`${speeds[next]}x`);
}
