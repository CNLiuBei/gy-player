// 播放引擎层 — HLS 加载与画质/音轨/字幕抽象
//
// 体积策略：
//   - Safari / iOS 原生支持 HLS → 直接 video.src，零依赖，不加载 hls.js
//   - 其他浏览器 → 仅在真正播放时动态 import hls.js（按需加载，不进首屏）
//
// 对外暴露统一接口，让 UI 层不关心底层用的是原生还是 hls.js。

import { nativeHlsSupported } from './utils.js';

// 错误恢复上限，超限即上报致命，避免无限重试死循环
const MAX_NETWORK_RETRIES = 6;
const MAX_MEDIA_RETRIES = 3;

// hls.js CDN 地址列表（按顺序降级；可被 window.GYP_HLS_URL 覆盖为自托管地址）
const HLS_VERSION = '1.6.16';
const HLS_CDNS = [
    `https://cdn.jsdelivr.net/npm/hls.js@${HLS_VERSION}/dist/hls.min.js`,
    `https://unpkg.com/hls.js@${HLS_VERSION}/dist/hls.min.js`,
    `https://fastly.jsdelivr.net/npm/hls.js@${HLS_VERSION}/dist/hls.min.js`,
];

let hlsModulePromise = null;

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
 * 按需加载 hls.js（全局单例，多个播放器实例共享同一次加载）
 * 优先使用已存在的 window.Hls；否则依次尝试多个 CDN，全部失败才报错。
 * @returns {Promise<any>} hls.js 的 Hls 构造器
 */
function loadHlsJs() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (hlsModulePromise) return hlsModulePromise;

    const sources = window.GYP_HLS_URL ? [window.GYP_HLS_URL] : HLS_CDNS;

    hlsModulePromise = (async () => {
        let lastErr = null;
        for (const url of sources) {
            try {
                await injectScript(url);
                if (window.Hls) return window.Hls;
                lastErr = new Error('hls.js 已加载但未挂载到 window.Hls：' + url);
            } catch (err) {
                lastErr = err;
                // 继续尝试下一个 CDN
            }
        }
        // 全部失败：重置缓存，允许下次重试
        hlsModulePromise = null;
        throw lastErr || new Error('hls.js 加载失败：所有 CDN 均不可用');
    })();

    return hlsModulePromise;
}

/**
 * 播放引擎：封装原生 HLS 与 hls.js 两种后端
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
        this.hls = null;          // hls.js 实例（原生模式下为 null）
        this.native = false;      // 是否走原生 HLS
        this._destroyed = false;
        this._netRetries = 0;     // 网络错误恢复计数
        this._mediaRetries = 0;   // 媒体错误恢复计数
    }

    /**
     * 加载并附加一个 HLS 源
     * @param {string} url m3u8 地址
     * @returns {Promise<void>}
     */
    async load(url) {
        await this.detach();
        this._destroyed = false;
        this._url = url;
        this._fallbackTried = false;

        const isHls = /\.m3u8(\?|$)/i.test(url) ||
            /application\/(vnd\.apple\.mpegurl|x-mpegURL)/i.test(url);
        this._isHls = isHls;

        // 非 HLS（如 MP4 直链）或原生支持 HLS → 优先走原生 video
        if (!isHls || nativeHlsSupported()) {
            this._loadNative(url);
            return;
        }
        // 其他浏览器：走 hls.js
        await this._loadHls(url);
    }

    /** 原生 video 播放路径（Safari/iOS HLS，或 MP4 直链） */
    _loadNative(url) {
        this.native = true;
        this.video.src = url;
        const onMeta = () => {
            if (this._destroyed) return;
            this.callbacks.onReady?.();
        };
        this.video.addEventListener('loadedmetadata', onMeta, { once: true });
        this.video.addEventListener('error', this._onNativeError, { once: true });
    }

    /** hls.js（MSE）播放路径 */
    async _loadHls(url) {
        let Hls;
        try {
            Hls = await loadHlsJs();
        } catch (err) {
            this.callbacks.onError?.(err, true);
            return;
        }
        if (this._destroyed) return;

        if (!Hls.isSupported()) {
            // 既不支持 MSE 又走到这里：兜底交给原生
            this._loadNative(url);
            return;
        }

        this.native = false;
        this.hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 120,
            backBufferLength: 30,
            abrEwmaDefaultEstimate: 5_000_000,
            fragLoadingMaxRetry: 6,
            manifestLoadingMaxRetry: 4,
            levelLoadingMaxRetry: 4,
            lowLatencyMode: false,
            // HDR 在浏览器/MSE 下兼容性不稳定；有 SDR 轨道时默认优先 SDR，避免偏色。
            // 如果业务确认终端支持 HDR，可在 loadStream(url, { preferHDR: true }) 中开启优先 HDR。
            videoPreference: {
                preferHDR: this.options.preferHDR === true,
                allowedVideoRanges: this.options.allowedVideoRanges || ['SDR', 'PQ', 'HLG'],
            },
        });
        this._Hls = Hls;

        this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (this._destroyed) return;
            this.callbacks.onReady?.();
        });
        // 分片成功缓冲 → 网络/媒体已恢复，重置重试计数
        this.hls.on(Hls.Events.FRAG_BUFFERED, () => {
            this._netRetries = 0;
            this._mediaRetries = 0;
        });
        this.hls.on(Hls.Events.LEVEL_SWITCHED, (_evt, data) => {
            if (this._destroyed) return;
            this.callbacks.onLevelSwitched?.(data.level);
        });
        this.hls.on(Hls.Events.ERROR, (_evt, data) => {
            if (this._destroyed) return;
            this._handleHlsError(data);
        });

        this.hls.loadSource(url);
        this.hls.attachMedia(this.video);
    }

    /**
     * 原生模式错误处理。
     * Safari 原生对部分 fMP4/CMAF 流解码会失败（MEDIA_ERR_DECODE），
     * 此时若是 HLS 且 MSE 可用，自动回退到 hls.js（关键兼容性保障）。
     */
    _onNativeError = async () => {
        if (this._destroyed) return;
        const err = this.video.error;

        // 原生 HLS 失败 → 尝试回退 hls.js（仅一次）
        if (this.native && this._isHls && !this._fallbackTried) {
            this._fallbackTried = true;
            try {
                const Hls = await loadHlsJs();
                if (this._destroyed) return;
                if (Hls.isSupported()) {
                    // 清理原生 src 后用 hls.js 重新加载
                    this.video.removeAttribute('src');
                    this.video.load();
                    await this._loadHls(this._url);
                    return;
                }
            } catch { /* 回退失败，按原错误上报 */ }
        }

        this.callbacks.onError?.(err || new Error('原生播放出错'), true);
    };

    /**
     * hls.js 错误处理：网络/媒体错误带上限地自动恢复，超限或其他错误上报为致命
     * @param {Object} data hls.js 错误数据
     */
    _handleHlsError(data) {
        const Hls = this._Hls;
        if (!data.fatal) {
            // 非致命错误：交给 hls.js 自行恢复，不打扰用户
            return;
        }
        switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                if (this._netRetries < MAX_NETWORK_RETRIES) {
                    this._netRetries++;
                    // 指数退避后重新加载，避免瞬时网络抖动时疯狂重试
                    const delay = Math.min(1000 * this._netRetries, 5000);
                    this._retryTimer = setTimeout(() => {
                        if (!this._destroyed && this.hls) this.hls.startLoad();
                    }, delay);
                    this.callbacks.onError?.(data, false);
                } else {
                    this.callbacks.onError?.(data, true); // 超过上限：上报致命
                }
                break;
            case Hls.ErrorTypes.MEDIA_ERROR:
                if (this._mediaRetries < MAX_MEDIA_RETRIES) {
                    this._mediaRetries++;
                    this.hls.recoverMediaError();
                    this.callbacks.onError?.(data, false);
                } else {
                    this.callbacks.onError?.(data, true);
                }
                break;
            default:
                // 其他致命错误：无法恢复，上报
                this.callbacks.onError?.(data, true);
                break;
        }
    }

    /**
     * 获取画质列表
     * @returns {Array<{index:number, height:number, bitrate:number, name:string}>}
     */
    getLevels() {
        if (this.native || !this.hls) return [];
        return this.hls.levels.map((lvl, index) => ({
            index,
            height: lvl.height || 0,
            bitrate: lvl.bitrate || 0,
            name: lvl.height ? `${lvl.height}p` : `${Math.round((lvl.bitrate || 0) / 1000)}k`,
        }));
    }

    /**
     * 获取当前画质索引（-1 表示自动）
     * @returns {number}
     */
    getCurrentLevel() {
        if (this.native || !this.hls) return -1;
        return this.hls.autoLevelEnabled ? -1 : this.hls.currentLevel;
    }

    /**
     * 设置画质
     * @param {number} index 画质索引，-1 表示自动（ABR）
     */
    setLevel(index) {
        if (this.native || !this.hls) return;
        this.hls.currentLevel = index; // -1 即恢复自动
    }

    /**
     * 获取音轨列表（同时支持 hls.js 与 Safari 原生 video.audioTracks）
     * @returns {Array<{id:(number|string), name:string, lang:string}>}
     */
    getAudioTracks() {
        // hls.js 模式
        if (this.hls) {
            return (this.hls.audioTracks || []).map((tr) => ({
                id: tr.id,
                name: tr.name || tr.lang || `音轨 ${tr.id + 1}`,
                lang: tr.lang || '',
            }));
        }
        // 原生模式（Safari/iOS）：读 video.audioTracks（AudioTrackList）
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
        if (this.hls) return this.hls.audioTrack;
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
     * @param {number} id 音轨 id（hls.js 为 trackId，原生为索引）
     */
    setAudioTrack(id) {
        if (this.hls) { this.hls.audioTrack = id; return; }
        // 原生：AudioTrackList 同一时刻只能一条 enabled
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
        this._netRetries = 0;
        this._mediaRetries = 0;
        if (this.hls) {
            try { this.hls.destroy(); } catch { /* 忽略销毁异常 */ }
            this.hls = null;
        }
        if (this.video) {
            this.video.removeEventListener('error', this._onNativeError);
            try {
                this.video.removeAttribute('src');
                this.video.load();
            } catch { /* 忽略 */ }
        }
        this.native = false;
    }
}
