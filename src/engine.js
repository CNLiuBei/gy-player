// 播放引擎层 — HLS/DASH 加载与画质/音轨/字幕抽象
//
// 体积策略：
//   - MP4 等渐进式直链 → 直接 video.src，零依赖
//   - HLS / DASH → 仅在真正播放时动态加载 Shaka Player（按需加载，不进首屏）
//
// 对外暴露统一接口，让 UI 层不关心底层用的是原生还是 Shaka。

import { bufferedAheadSeconds, nativeHlsSupported } from './utils.js';

// 首屏至少预缓冲这么多秒再通知 UI「可播放」（避免只缓冲 1 个分片就起播）
const MIN_READY_BUFFER_SECONDS = 4;
const READY_FALLBACK_MS = 12000;

// 向前缓冲目标（与旧 hls.js 策略对齐）
const TARGET_BUFFER_SECONDS = 60;
const REBUFFER_GOAL_SECONDS = 4;
const BUFFER_BEHIND_SECONDS = 15;

// 错误恢复上限，超限即上报致命，避免无限重试死循环
const MAX_NETWORK_RETRIES = 6;
const MAX_MEDIA_RETRIES = 3;

// Shaka Player CDN 地址列表（按顺序降级；可被 window.GYP_SHAKA_URL / GYP_HLS_URL 覆盖）
const SHAKA_VERSION = '4.16.37';
const SHAKA_CDNS = [
    `https://cdn.jsdelivr.net/npm/shaka-player@${SHAKA_VERSION}/dist/shaka-player.compiled.js`,
    `https://unpkg.com/shaka-player@${SHAKA_VERSION}/dist/shaka-player.compiled.js`,
    `https://fastly.jsdelivr.net/npm/shaka-player@${SHAKA_VERSION}/dist/shaka-player.compiled.js`,
];

let shakaModulePromise = null;

/**
 * 注入单个脚本
 * @param {string} url 脚本地址
 * @returns {Promise<void>}
 */
function injectScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
            script.remove();
            reject(new Error('脚本加载失败：' + url));
        };
        document.head.appendChild(script);
    });
}

/**
 * 按需加载 Shaka Player（全局单例，多个播放器实例共享同一次加载）
 * @returns {Promise<typeof shaka>}
 */
function loadShakaPlayer() {
    if (window.shaka) return Promise.resolve(window.shaka);
    if (shakaModulePromise) return shakaModulePromise;

    const override = window.GYP_SHAKA_URL || window.GYP_HLS_URL;
    const sources = override ? [override] : SHAKA_CDNS;

    shakaModulePromise = (async () => {
        let lastErr = null;
        for (const url of sources) {
            try {
                await injectScript(url);
                if (window.shaka) {
                    window.shaka.polyfill.installAll();
                    return window.shaka;
                }
                lastErr = new Error('Shaka Player 已加载但未挂载到 window.shaka：' + url);
            } catch (err) {
                lastErr = err;
            }
        }
        shakaModulePromise = null;
        throw lastErr || new Error('Shaka Player 加载失败：所有 CDN 均不可用');
    })();

    return shakaModulePromise;
}

function isStreamingUrl(url) {
    return /\.m3u8(\?|$)/i.test(url) ||
        /\.mpd(\?|$)/i.test(url) ||
        /application\/(vnd\.apple\.mpegurl|x-mpegURL|dash\+xml)/i.test(url);
}

/**
 * 播放引擎：封装原生直链与 Shaka Player 两种后端
 *
 * 事件回调（构造时传入 callbacks）：
 *   onReady()                 引擎就绪，可读取画质列表
 *   onError(detail, fatal)    出错，fatal 表示是否致命
 *   onLevelSwitched(level)    画质切换完成
 */
export class PlaybackEngine {
    /**
     * @param {HTMLVideoElement} video 目标 video 元素
     * @param {Object} callbacks 事件回调
     */
    constructor(video, callbacks = {}, options = {}) {
        this.video = video;
        this.callbacks = callbacks;
        this.options = options;
        this.shaka = null;
        this.native = false;
        this._destroyed = false;
        this._netRetries = 0;
        this._mediaRetries = 0;
        this._abrEnabled = true;
        this._shakaGlobal = null;
        this._hlsCompat = this._createHlsCompat();
    }

    /** gy-player 仍通过 engine.hls.subtitleTrack 禁用内嵌字幕，保留兼容层 */
    get hls() {
        return this._hlsCompat;
    }

    _createHlsCompat() {
        const engine = this;
        return {
            get subtitleTracks() {
                if (!engine.shaka) return [];
                try {
                    return engine.shaka.getTextTracks() || [];
                } catch {
                    return [];
                }
            },
            set subtitleTrack(idx) {
                if (!engine.shaka) return;
                try {
                    if (idx === -1) engine.shaka.setTextTrackVisibility(false);
                } catch { /* ignore */ }
            },
        };
    }

    /**
     * 加载并附加一个流媒体或直链源
     * @param {string} url 播放地址
     * @returns {Promise<void>}
     */
    async load(url, options = {}) {
        await this.detach();
        this._destroyed = false;
        this._url = url;
        this._fallbackTried = false;
        this._nativeFallbackTried = false;
        this._startPosition = typeof options.startPosition === 'number' && options.startPosition > 0
            ? options.startPosition
            : 0;
        clearTimeout(this._readyFallbackTimer);

        this._isStream = isStreamingUrl(url);

        if (!this._isStream) {
            this._loadNative(url);
            return;
        }

        await this._loadShaka(url);
    }

    /** 原生 video 播放路径（MP4 直链，或 Shaka 不可用时的 HLS 兜底） */
    _loadNative(url) {
        this.native = true;
        this.video.src = url;
        const startPos = this._startPosition || 0;
        this.video.addEventListener('loadedmetadata', () => {
            if (this._destroyed) return;
            if (startPos > 0) this.video.currentTime = startPos;
        }, { once: true });
        this.video.addEventListener('canplay', () => {
            if (this._destroyed) return;
            this._emitReadyOnce();
        }, { once: true });
        this.video.addEventListener('error', this._onNativeError, { once: true });
        this._readyFallbackTimer = setTimeout(() => this._emitReadyOnce(), READY_FALLBACK_MS);
    }

    _emitReadyOnce() {
        if (this._readyEmitted || this._destroyed) return;
        this._readyEmitted = true;
        clearTimeout(this._readyFallbackTimer);
        this.callbacks.onReady?.();
    }

    _maybeEmitReadyFromBuffer() {
        if (this._readyEmitted || this._destroyed) return;
        const ahead = bufferedAheadSeconds(this.video);
        if (ahead >= MIN_READY_BUFFER_SECONDS) {
            this._emitReadyOnce();
        }
    }

    _buildShakaConfig() {
        const preferHDR = this.options.preferHDR === true;
        const allowedVideoRanges = this.options.allowedVideoRanges || ['SDR', 'PQ', 'HLG'];
        const config = {
            streaming: {
                bufferingGoal: TARGET_BUFFER_SECONDS,
                rebufferingGoal: REBUFFER_GOAL_SECONDS,
                bufferBehind: BUFFER_BEHIND_SECONDS,
            },
            abr: { enabled: true },
            manifest: {
                hls: { useSafariBehaviorForLive: true },
            },
        };
        if (preferHDR) {
            config.preferredVideoCodecs = ['hev1', 'hvc1', 'dvh1', 'dvhe', 'avc1'];
        } else {
            config.preferredVideoCodecs = ['avc1', 'hev1', 'hvc1'];
        }
        if (Array.isArray(allowedVideoRanges) && allowedVideoRanges.length > 0 && !allowedVideoRanges.includes('SDR')) {
            config.preferredVideoCodecs = ['hev1', 'hvc1', 'dvh1', 'dvhe', ...(config.preferredVideoCodecs || [])];
        }
        return config;
    }

    /** Shaka Player（HLS/DASH）播放路径 */
    async _loadShaka(url) {
        let shaka;
        try {
            shaka = await loadShakaPlayer();
        } catch (err) {
            if (this._isStream && nativeHlsSupported()) {
                this._loadNative(url);
                return;
            }
            this.callbacks.onError?.(err, true);
            return;
        }
        if (this._destroyed) return;
        this._shakaGlobal = shaka;

        if (!shaka.Player.isBrowserSupported()) {
            if (nativeHlsSupported()) {
                this._loadNative(url);
                return;
            }
            this.callbacks.onError?.(new Error('浏览器不支持 Shaka Player'), true);
            return;
        }

        this.native = false;
        this._readyEmitted = false;
        this._abrEnabled = true;

        try {
            this.shaka = new shaka.Player();
            await this.shaka.attach(this.video);
            this.shaka.configure(this._buildShakaConfig());
            this.shaka.addEventListener('error', this._onShakaError);
            this.shaka.addEventListener('buffering', this._onShakaBuffering);
            this.shaka.addEventListener('adaptation', this._onShakaAdaptation);

            await this.shaka.load(url, this._startPosition || 0);
            if (this._destroyed) return;

            try { this.shaka.setTextTrackVisibility(false); } catch { /* ignore */ }
            this._netRetries = 0;
            this._mediaRetries = 0;
            this._maybeEmitReadyFromBuffer();
            this._readyFallbackTimer = setTimeout(() => this._emitReadyOnce(), READY_FALLBACK_MS);
        } catch (err) {
            if (this._destroyed) return;
            await this._fallbackFromShakaFailure(url, err);
        }
    }

    async _fallbackFromShakaFailure(url, err) {
        if (this._isStream && nativeHlsSupported() && !this._nativeFallbackTried) {
            this._nativeFallbackTried = true;
            try {
                if (this.shaka) {
                    await this.shaka.destroy();
                    this.shaka = null;
                }
            } catch { /* ignore */ }
            this._loadNative(url);
            return;
        }
        this.callbacks.onError?.(this._normalizeShakaError(err), true);
    }

    _onShakaBuffering = (event) => {
        if (this._destroyed) return;
        if (!event.buffering) {
            this._netRetries = 0;
            this._mediaRetries = 0;
            this._maybeEmitReadyFromBuffer();
        }
    };

    _onShakaAdaptation = () => {
        if (this._destroyed) return;
        this.callbacks.onLevelSwitched?.(this.getCurrentLevel());
    };

    _normalizeShakaError(error) {
        const shaka = this._shakaGlobal;
        const category = error?.category;
        if (shaka?.util?.Error?.Category) {
            if (category === shaka.util.Error.Category.NETWORK) {
                return { type: 'networkError', message: error.message, code: error.code };
            }
            if (category === shaka.util.Error.Category.MEDIA) {
                return { type: 'mediaError', message: error.message, code: error.code };
            }
        }
        if (error?.code === 2) return { type: 'networkError', code: 2, message: error.message };
        if (error?.code === 3) return { type: 'mediaError', code: 3, message: error.message };
        return error || { message: '播放出错' };
    }

    _isShakaFatal(error) {
        const shaka = this._shakaGlobal;
        if (!error || !shaka?.util?.Error?.Severity) return true;
        return error.severity === shaka.util.Error.Severity.CRITICAL;
    }

    _onShakaError = (event) => {
        if (this._destroyed) return;
        const error = event.detail;
        const shaka = this._shakaGlobal;
        const fatal = this._isShakaFatal(error);
        const normalized = this._normalizeShakaError(error);

        if (!fatal) {
            this.callbacks.onError?.(normalized, false);
            return;
        }

        if (shaka && error?.category === shaka.util.Error.Category.NETWORK) {
            if (this._netRetries < MAX_NETWORK_RETRIES) {
                this._netRetries++;
                const delay = Math.min(1000 * this._netRetries, 5000);
                const resumeAt = this.video?.currentTime || 0;
                this._retryTimer = setTimeout(async () => {
                    if (this._destroyed || !this.shaka) return;
                    try {
                        await this.shaka.load(this._url, resumeAt);
                    } catch (retryErr) {
                        if (!this._destroyed) {
                            this.callbacks.onError?.(this._normalizeShakaError(retryErr), true);
                        }
                    }
                }, delay);
                this.callbacks.onError?.(normalized, false);
                return;
            }
        }

        if (shaka && error?.category === shaka.util.Error.Category.MEDIA) {
            if (this._mediaRetries < MAX_MEDIA_RETRIES) {
                this._mediaRetries++;
                const resumeAt = this.video?.currentTime || 0;
                this._retryTimer = setTimeout(async () => {
                    if (this._destroyed || !this.shaka) return;
                    try {
                        await this.shaka.load(this._url, resumeAt);
                    } catch (retryErr) {
                        if (!this._destroyed) {
                            this.callbacks.onError?.(this._normalizeShakaError(retryErr), true);
                        }
                    }
                }, 500);
                this.callbacks.onError?.(normalized, false);
                return;
            }
        }

        this.callbacks.onError?.(normalized, true);
    };

    /**
     * 原生模式错误处理。
     * Safari 原生对部分 fMP4/CMAF 流解码会失败（MEDIA_ERR_DECODE），
     * 此时自动回退到 Shaka Player（关键兼容性保障）。
     */
    _onNativeError = async () => {
        if (this._destroyed) return;
        const err = this.video.error;

        if (this.native && this._isStream && !this._fallbackTried) {
            this._fallbackTried = true;
            try {
                const shaka = await loadShakaPlayer();
                if (this._destroyed) return;
                if (shaka.Player.isBrowserSupported()) {
                    this.video.removeAttribute('src');
                    this.video.load();
                    await this._loadShaka(this._url);
                    return;
                }
            } catch { /* 回退失败，按原错误上报 */ }
        }

        this.callbacks.onError?.(err || new Error('原生播放出错'), true);
    };

    /**
     * 跳转到指定时间
     * @param {number} seconds
     */
    seekTo(seconds) {
        if (this._destroyed || !this.video) return;
        const duration = Number.isFinite(this.video.duration) ? this.video.duration : seconds;
        const target = Math.max(0, Math.min(seconds, duration || seconds));
        this.video.currentTime = target;
    }

    _getVariantLevelList() {
        if (!this.shaka) return [];
        const variants = this.shaka.getVariantTracks().filter((track) => track.height > 0);
        const byHeight = new Map();
        for (const track of variants) {
            const existing = byHeight.get(track.height);
            if (!existing || (track.bandwidth || 0) > (existing.bandwidth || 0)) {
                byHeight.set(track.height, track);
            }
        }
        return Array.from(byHeight.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([height, track], index) => ({
                index,
                height,
                bitrate: track.bandwidth || 0,
                name: `${height}p`,
                trackId: track.id,
            }));
    }

    /**
     * 获取画质列表
     * @returns {Array<{index:number, height:number, bitrate:number, name:string}>}
     */
    getLevels() {
        if (this.native || !this.shaka) return [];
        return this._getVariantLevelList().map(({ trackId, ...rest }) => rest);
    }

    /**
     * 获取当前画质索引（-1 表示自动）
     * @returns {number}
     */
    getCurrentLevel() {
        if (this.native || !this.shaka) return -1;
        if (this._abrEnabled) return -1;
        const active = this.shaka.getVariantTracks().find((track) => track.active);
        if (!active?.height) return -1;
        const match = this._getVariantLevelList().find((level) => level.height === active.height);
        return match ? match.index : -1;
    }

    /**
     * 设置画质
     * @param {number} index 画质索引，-1 表示自动（ABR）
     */
    setLevel(index) {
        if (this.native || !this.shaka) return;
        if (index === -1) {
            this.shaka.configure({ abr: { enabled: true } });
            this._abrEnabled = true;
            return;
        }
        const level = this._getVariantLevelList().find((item) => item.index === index);
        if (!level) return;
        this.shaka.configure({ abr: { enabled: false } });
        this._abrEnabled = false;
        const track = this.shaka.getVariantTracks().find((item) => item.id === level.trackId);
        if (track) {
            this.shaka.selectVariantTrack(track, true);
            this.callbacks.onLevelSwitched?.(index);
        }
    }

    /**
     * 获取音轨列表
     * @returns {Array<{id:(number|string), name:string, lang:string}>}
     */
    getAudioTracks() {
        if (this.shaka) {
            const items = this.shaka.getAudioLanguagesAndRoles() || [];
            return items.map((item, index) => ({
                id: index,
                name: item.label || item.language || `音轨 ${index + 1}`,
                lang: item.language || '',
                role: item.role || '',
            }));
        }
        const native = this.video.audioTracks;
        if (native && native.length > 1) {
            return Array.from(native).map((tr, i) => ({
                id: i,
                name: tr.label || tr.language || `音轨 ${i + 1}`,
                lang: tr.language || '',
            }));
        }
        return [];
    }

    /** 获取当前音轨 id */
    getCurrentAudioTrack() {
        if (this.shaka) {
            const active = this.shaka.getVariantTracks().find((track) => track.active);
            if (!active) return -1;
            const tracks = this.getAudioTracks();
            const index = tracks.findIndex((track) =>
                track.lang === (active.language || '') &&
                (track.role || '') === (active.audioRole || ''));
            return index >= 0 ? index : -1;
        }
        const native = this.video.audioTracks;
        if (native && native.length > 1) {
            for (let i = 0; i < native.length; i++) {
                if (native[i].enabled) return i;
            }
        }
        return -1;
    }

    /**
     * 切换音轨
     * @param {number} id 音轨 id
     */
    setAudioTrack(id) {
        if (this.shaka) {
            const track = this.getAudioTracks()[id];
            if (!track) return;
            this.shaka.selectAudioLanguage(track.lang, track.role || '');
            return;
        }
        const native = this.video.audioTracks;
        if (native && native.length > 1) {
            for (let i = 0; i < native.length; i++) {
                native[i].enabled = (i === id);
            }
        }
    }

    /**
     * 分离并销毁当前引擎，释放资源
     * @returns {Promise<void>}
     */
    async detach() {
        this._destroyed = true;
        clearTimeout(this._retryTimer);
        clearTimeout(this._readyFallbackTimer);
        this._readyEmitted = false;
        this._netRetries = 0;
        this._mediaRetries = 0;
        if (this.shaka) {
            try { await this.shaka.destroy(); } catch { /* 忽略销毁异常 */ }
            this.shaka = null;
        }
        if (this.video) {
            this.video.removeEventListener('error', this._onNativeError);
            try {
                this.video.removeAttribute('src');
                this.video.load();
            } catch { /* 忽略 */ }
        }
        this.native = false;
        this._abrEnabled = true;
    }
}
