// 控件绑定 — 按钮点击、进度条拖拽、音量滑条
// 从主组件拆出，保持 gy-player.js 精简

import { clamp, formatTime, supportsPiP } from './utils.js';
import { saveVolume, saveMuted } from './storage.js';
import { icons } from './icons.js';

/**
 * 绑定所有控件交互
 * @param {import('./gy-player.js').GYPlayer} player 播放器实例
 * @param {AbortSignal} signal 卸载信号
 */
export function bindControls(player, signal) {
    const sig = { signal };
    const els = player.els;

    // 基础按钮
    els.playBtn.addEventListener('click', () => player.togglePlay(), sig);
    els.backBtn.addEventListener('click', () => {
        player.dispatchEvent(new CustomEvent('back'));
    }, sig);
    els.prevBtn.addEventListener('click', () => player.dispatchEvent(new CustomEvent('prev')), sig);
    els.nextBtn.addEventListener('click', () => player.dispatchEvent(new CustomEvent('next')), sig);
    els.fsBtn.addEventListener('click', () => player.toggleFullscreen(), sig);
    els.lockBtn.addEventListener('click', () => player.toggleLock(), sig);

    if (supportsPiP) {
        els.pipBtn.addEventListener('click', () => player.togglePiP(), sig);
    }

    // 菜单类按钮
    els.speedBtn.addEventListener('click', () => player.toggleMenu('speed'), sig);
    els.qualityBtn.addEventListener('click', () => player.toggleMenu('quality'), sig);
    els.subtitleBtn.addEventListener('click', () => player.toggleMenu('subtitle'), sig);

    // 选集面板
    els.episodesBtn.addEventListener('click', () => player.toggleEpisodePanel(), sig);
    els.epClose.addEventListener('click', () => player.toggleEpisodePanel(false), sig);
    // 抽屉遮罩点击：关闭菜单与选集面板
    els.sheetMask.addEventListener('click', () => {
        player.closeMenu();
        player.toggleEpisodePanel(false);
    }, sig);
    // 季下拉开关
    els.epSeasonCurrent.addEventListener('click', (e) => {
        e.stopPropagation();
        els.epSeasons.classList.toggle('hidden');
    }, sig);
    // 季选项点击（事件委托）
    els.epSeasons.addEventListener('click', (e) => {
        const opt = e.target.closest('.gyp-ep-option');
        if (!opt) return;
        player._activeSeason = opt.dataset.season;
        els.epSeasons.classList.add('hidden');
        player._renderEpisodePanel();
    }, sig);
    // 上/下一季箭头
    const stepSeason = (dir) => {
        const keys = player._seasonKeys || [];
        const idx = keys.indexOf(player._activeSeason);
        const next = keys[idx + dir];
        if (!next) return;
        player._activeSeason = next;
        player._renderEpisodePanel();
    };
    els.epPrevSeason.addEventListener('click', () => stepSeason(-1), sig);
    els.epNextSeason.addEventListener('click', () => stepSeason(1), sig);
    // 点面板内其他位置关闭季下拉
    els.epPanel.addEventListener('click', (e) => {
        if (!els.epSeasons.contains(e.target) && !els.epSeasonCurrent.contains(e.target)) {
            els.epSeasons.classList.add('hidden');
        }
    }, sig);
    // 分段切换（事件委托）
    els.epSegments.addEventListener('click', (e) => {
        const seg = e.target.closest('.gyp-ep-seg');
        if (!seg) return;
        player._activeSeg = parseInt(seg.dataset.seg, 10);
        // 更新 chip 高亮 + 重渲当前段
        els.epSegments.querySelectorAll('.gyp-ep-seg').forEach((c) => c.classList.toggle('active', c === seg));
        player._renderEpisodeItems();
        player.els.epList.scrollTop = 0;
    }, sig);
    // 选某集 → 抛事件给外部切流，并关闭面板
    els.epList.addEventListener('click', (e) => {
        const item = e.target.closest('.gyp-ep-item');
        if (!item) return;
        player.dispatchEvent(new CustomEvent('selectepisode', { detail: { id: item.dataset.id } }));
        player.toggleEpisodePanel(false);
    }, sig);

    // 点击行为：
    //   桌面端 — 单击播放/暂停，双击全屏。用延时区分单/双击，避免双击时
    //            误触两次 togglePlay 导致画面闪烁。
    //   移动端 — 单击仅切换控件显隐（播放/暂停与双击快进由手势模块处理）。
    const isTouch = 'ontouchstart' in window;
    let clickTimer = null;
    els.surface.addEventListener('click', () => {
        if (player._menuOpen) { player.closeMenu(); return; }
        if (isTouch) {
            player.toggleControls();
            return;
        }
        if (clickTimer) return;
        clickTimer = setTimeout(() => {
            clickTimer = null;
            player.togglePlay();
        }, 220);
    }, sig);
    els.surface.addEventListener('dblclick', () => {
        if (isTouch) return;
        if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
        player.toggleFullscreen();
    }, sig);

    // 全屏状态变化 → 更新图标
    const onFsChange = () => {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        player.classList.toggle('gyp-fullscreen', isFs);
        els.fsBtn.innerHTML = isFs ? icons.exitFullscreen : icons.fullscreen;
        // 退出全屏时解除横屏锁定
        if (!isFs) player._unlockOrientation?.();
    };
    document.addEventListener('fullscreenchange', onFsChange, sig);
    document.addEventListener('webkitfullscreenchange', onFsChange, sig);

    bindProgressDrag(player, signal);
    bindVolume(player, signal);

    // 鼠标悬停在控制栏上时，暂停自动隐藏（避免操作中控件消失）
    const holdShow = () => { player._controlsHovered = true; player._showControls?.(); };
    const releaseShow = () => { player._controlsHovered = false; player._showControls?.(); };
    els.bottom.addEventListener('mouseenter', holdShow, sig);
    els.bottom.addEventListener('mouseleave', releaseShow, sig);
    els.top.addEventListener('mouseenter', holdShow, sig);
    els.top.addEventListener('mouseleave', releaseShow, sig);
}

/**
 * 进度条拖拽与 hover 预览
 * @param {import('./gy-player.js').GYPlayer} player
 * @param {AbortSignal} signal
 */
function bindProgressDrag(player, signal) {
    const sig = { signal };
    const v = player.video;
    const wrap = player.els.progress;
    let dragging = false;

    const pctFromX = (clientX) => {
        const rect = wrap.getBoundingClientRect();
        return clamp((clientX - rect.left) / rect.width, 0, 1);
    };
    const preview = (clientX) => {
        const pct = pctFromX(clientX);
        player.els.played.style.width = `${pct * 100}%`;
        player.els.thumb.style.left = `${pct * 100}%`;
        if (v.duration) player.els.timeCurrent.textContent = formatTime(pct * v.duration);
        return pct;
    };
    const commit = (clientX) => {
        const pct = pctFromX(clientX);
        if (v.duration) v.currentTime = pct * v.duration;
    };

    // 鼠标拖拽
    wrap.addEventListener('mousedown', (e) => {
        dragging = true;
        wrap.classList.add('dragging');
        preview(e.clientX);
        const onMove = (ev) => { if (dragging) preview(ev.clientX); };
        const onUp = (ev) => {
            dragging = false;
            wrap.classList.remove('dragging');
            commit(ev.clientX);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, sig);

    // 触摸拖拽
    wrap.addEventListener('touchstart', (e) => {
        dragging = true;
        wrap.classList.add('dragging');
        preview(e.touches[0].clientX);
        const onMove = (ev) => { if (dragging) preview(ev.touches[0].clientX); };
        const onEnd = (ev) => {
            dragging = false;
            wrap.classList.remove('dragging');
            commit(ev.changedTouches[0].clientX);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('touchend', onEnd);
    }, { signal, passive: true });

    // hover 时间气泡（边缘处夹紧，避免气泡溢出容器）
    wrap.addEventListener('mousemove', (e) => {
        if (!v.duration) return;
        const pct = pctFromX(e.clientX);
        player.els.tip.textContent = formatTime(pct * v.duration);
        // 气泡宽度的一半占容器的百分比，用于边缘夹紧
        const rect = wrap.getBoundingClientRect();
        const halfTip = (player.els.tip.offsetWidth / 2) / rect.width * 100;
        const left = clamp(pct * 100, halfTip, 100 - halfTip);
        player.els.tip.style.left = `${left}%`;
    }, sig);

    // 键盘可达：左右方向键调整进度
    wrap.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { player.seekBy(-5); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { player.seekBy(5); e.preventDefault(); }
    }, sig);
}

/**
 * 音量滑条拖拽 + 静音按钮 + 滚轮
 * @param {import('./gy-player.js').GYPlayer} player
 * @param {AbortSignal} signal
 */
function bindVolume(player, signal) {
    const sig = { signal };
    const v = player.video;
    const slider = player.els.volumeSlider;

    player.els.volumeBtn.addEventListener('click', () => player.toggleMute(), sig);

    const setFromX = (clientX) => {
        const rect = slider.getBoundingClientRect();
        const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
        v.volume = pct;
        v.muted = false;
        saveVolume(pct);
        saveMuted(false);
    };

    slider.addEventListener('mousedown', (e) => {
        setFromX(e.clientX);
        const onMove = (ev) => setFromX(ev.clientX);
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        e.stopPropagation();
    }, sig);

    slider.addEventListener('touchstart', (e) => {
        setFromX(e.touches[0].clientX);
        const onMove = (ev) => setFromX(ev.touches[0].clientX);
        const onEnd = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('touchend', onEnd);
    }, { signal, passive: true });

    // 滚轮调音量
    player.els.volume.addEventListener('wheel', (e) => {
        e.preventDefault();
        v.volume = clamp(v.volume + (e.deltaY > 0 ? -0.05 : 0.05), 0, 1);
        v.muted = false;
        saveVolume(v.volume);
        player.showHint(`音量 ${Math.round(v.volume * 100)}%`);
    }, { signal, passive: false });
}
