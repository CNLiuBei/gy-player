/** 弹幕：按时间窗口拉取、同步渲染、发送与举报 */

const WINDOW_SEC = 120;
const WINDOW_PAD_SEC = 60;
const MAX_SHOW_PER_TICK = 8;

function normalizeColor(color) {
    return /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#ffffff';
}

export function itemKey(item) {
    return String(item.id || `${item.timeMs}:${item.content}`);
}

function windowStartSec(timeSec) {
    return Math.max(0, Math.floor(Math.max(0, Number(timeSec) || 0) / WINDOW_SEC) * WINDOW_SEC);
}

export async function fetchDanmakuWindow(apiBase, videoId, { start = 0, end = 120, limit = 300, credentials = 'include' } = {}) {
    const safeVideoId = String(videoId || '').trim();
    if (!safeVideoId) return { items: [], danmakuEnabled: false };
    const params = new URLSearchParams({
        videoId: safeVideoId,
        start: String(Math.max(0, Number(start) || 0)),
        end: String(Math.max(0, Number(end) || 120)),
        limit: String(Math.min(800, Math.max(1, Number(limit) || 300))),
    });
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/danmaku?${params}`, { credentials });
    if (!res.ok) throw new Error('弹幕加载失败');
    return res.json();
}

export async function postDanmaku(apiBase, payload, { credentials = 'include' } = {}) {
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/danmaku`, {
        method: 'POST',
        credentials,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            videoId: payload.videoId,
            time: Math.max(0, Number(payload.time || 0)),
            content: String(payload.content || '').trim(),
            color: payload.color || '#ffffff',
            mode: payload.mode || 'scroll',
        }),
    });
    if (!res.ok) {
        let data = null;
        try { data = await res.json(); } catch { /* ignore */ }
        const error = new Error(res.status === 401 ? '登录后发送弹幕' : (data?.message || '弹幕发送失败'));
        error.status = res.status;
        error.data = data;
        throw error;
    }
    return res.json();
}

export async function reportDanmakuItem(apiBase, id, reason = 'user_report', { credentials = 'include' } = {}) {
    const safeId = String(id || '').trim();
    if (!safeId) throw new Error('请选择要举报的弹幕');
    const res = await fetch(`${apiBase.replace(/\/$/, '')}/danmaku/${encodeURIComponent(safeId)}/report`, {
        method: 'POST',
        credentials,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
        const error = new Error(res.status === 401 ? '登录后举报弹幕' : '弹幕举报失败');
        error.status = res.status;
        throw error;
    }
    return res.json();
}

export function nextDanmakuWindowEnd(currentTime) {
    return windowStartSec(currentTime) + WINDOW_SEC + WINDOW_PAD_SEC;
}

export class DanmakuController {
    /**
     * @param {import('./gy-player.js').GYPlayer} player
     * @param {{ apiBase?: string, credentials?: RequestCredentials }} [options]
     */
    constructor(player, options = {}) {
        this.player = player;
        this.apiBase = options.apiBase || '/api/v1';
        this.credentials = options.credentials || 'include';
        this.videoId = '';
        this.disabled = false;
        this.enabled = true;
        this.serverEnabled = true;
        this.items = [];
        this.itemIds = new Set();
        this.shownIds = new Set();
        this.loadedWindows = new Set();
        this.lastReportable = null;
        this.lastTime = 0;
        this.lane = 0;
        this.layer = null;
        this.bar = null;
        this._loadGen = 0;
    }

    attach({ layer, bar }) {
        this.layer = layer;
        this.bar = bar;
    }

    configure({ videoId, disabled, apiBase, enabled } = {}) {
        if (apiBase) this.apiBase = apiBase;
        if (typeof enabled === 'boolean') this.enabled = enabled;
        this.disabled = disabled === true;
        this.reset(videoId || '');
    }

    reset(videoId) {
        this._loadGen += 1;
        this.videoId = String(videoId || '').trim();
        this.items = [];
        this.itemIds = new Set();
        this.shownIds = new Set();
        this.loadedWindows = new Set();
        this.serverEnabled = true;
        this.lastReportable = null;
        this.lastTime = 0;
        this.lane = 0;
        if (this.layer) this.layer.innerHTML = '';
        this._syncUiVisibility();
        this._updateInputState();
        if (this.videoId && !this.disabled) {
            this.loadWindow(0).catch(() => {});
        }
    }

    setEnabled(enabled) {
        this.enabled = !!enabled;
        if (this.layer) this.layer.classList.toggle('hidden', !this.enabled);
    }

    destroy() {
        this._loadGen += 1;
        this.layer = null;
        this.bar = null;
    }

    async loadWindow(currentTime) {
        if (!this.videoId || this.disabled) return;
        const gen = this._loadGen;
        const startSec = windowStartSec(currentTime);
        const key = String(startSec);
        if (this.loadedWindows.has(key)) return;
        this.loadedWindows.add(key);
        const data = await fetchDanmakuWindow(this.apiBase, this.videoId, {
            start: startSec,
            end: startSec + WINDOW_SEC + WINDOW_PAD_SEC,
            limit: 500,
            credentials: this.credentials,
        });
        if (gen !== this._loadGen) return;
        if (data.danmakuEnabled === false) {
            this.serverEnabled = false;
            this._updateInputState();
            return;
        }
        this.serverEnabled = true;
        this._updateInputState();
        this.addItems(data.items || []);
    }

    addItems(items) {
        for (const item of items || []) {
            const key = itemKey(item);
            if (this.itemIds.has(key)) continue;
            this.itemIds.add(key);
            this.items.push({ ...item, _key: key });
        }
        this.items.sort((a, b) => Number(a.timeMs || 0) - Number(b.timeMs || 0));
    }

    sync(currentTime) {
        if (!this.enabled || !this.videoId || this.disabled || !this.layer) return;
        const time = Math.max(0, Number(currentTime) || 0);
        if (time + 45 > nextDanmakuWindowEnd(time)) {
            this.loadWindow(time + WINDOW_PAD_SEC).catch(() => {});
        }
        if (time < this.lastTime - 2) {
            this.shownIds = new Set();
            this.layer.innerHTML = '';
        }
        const fromMs = Math.max(0, Math.floor((this.lastTime - 0.4) * 1000));
        const toMs = Math.floor((time + 0.8) * 1000);
        this.items
            .filter((item) => {
                const key = item._key || itemKey(item);
                const timeMs = Number(item.timeMs || 0);
                return !this.shownIds.has(key) && timeMs >= fromMs && timeMs <= toMs;
            })
            .slice(0, MAX_SHOW_PER_TICK)
            .forEach((item) => this.showItem(item));
        this.lastTime = time;
    }

    showItem(item, options = {}) {
        if (!this.enabled || !this.layer) return;
        const key = item._key || itemKey(item);
        this.shownIds.add(key);
        const node = document.createElement('span');
        const mode = item.mode === 'top' || item.mode === 'bottom' ? item.mode : 'scroll';
        node.className = `gyp-danmaku-item is-${mode}`;
        node.textContent = String(item.content || '').slice(0, 80);
        node.style.color = normalizeColor(item.color);
        const lane = this.lane % 6;
        this.lane += 1;
        if (mode === 'bottom') {
            node.style.bottom = `${14 + lane * 8}%`;
        } else {
            node.style.top = `${8 + lane * 11}%`;
        }
        if (options.immediate) node.classList.add('is-local');
        const travel = Math.max(this.layer.clientWidth || 320, 240);
        node.style.setProperty('--gyp-danmaku-travel', `${travel}px`);
        this.layer.appendChild(node);
        if (item.id && !String(item.id).startsWith('local:')) {
            this.lastReportable = item;
        }
        setTimeout(() => node.remove(), mode === 'scroll' ? 7600 : 3600);
    }

    async send(content) {
        if (!this.videoId || this.disabled || !this.serverEnabled) return null;
        const currentTime = Number.isFinite(this.player.video?.currentTime)
            ? this.player.video.currentTime
            : 0;
        const data = await postDanmaku(this.apiBase, {
            videoId: this.videoId,
            time: currentTime,
            content,
        }, { credentials: this.credentials });
        const item = data.item || {
            id: `local:${Date.now()}`,
            content,
            time: currentTime,
            timeMs: Math.round(currentTime * 1000),
            color: '#ffffff',
            mode: 'scroll',
        };
        this.addItems([item]);
        this.showItem(item, { immediate: true });
        return item;
    }

    async reportLast() {
        const item = this.lastReportable;
        if (!item?.id || String(item.id).startsWith('local:')) {
            throw new Error('暂无可举报弹幕');
        }
        await reportDanmakuItem(this.apiBase, item.id, 'user_report', { credentials: this.credentials });
        this.items = this.items.filter((entry) => entry.id !== item.id);
        this.lastReportable = null;
    }

    _syncUiVisibility() {
        const active = !!this.videoId && !this.disabled;
        this.bar?.classList.toggle('hidden', !active);
        this.layer?.classList.toggle('hidden', !active || !this.enabled);
    }

    _updateInputState() {
        const input = this.bar?.querySelector('#danmakuInput');
        const send = this.bar?.querySelector('#danmakuSend');
        if (!input || !send) return;
        const disabled = this.serverEnabled === false;
        input.disabled = disabled;
        send.disabled = disabled;
        if (disabled) {
            input.placeholder = '创作者已关闭本视频弹幕';
        } else {
            const compact = typeof window !== 'undefined'
                && window.matchMedia?.('(max-width: 640px)').matches;
            input.placeholder = compact ? '发弹幕…' : '发一条友善弹幕';
        }
    }
}
