// GY Player — 极致轻量自研 Web 播放器
//
// 设计原则：
//   - 零框架，原生 Web Component + Shadow DOM
//   - 引擎按需加载（Safari/iOS 原生零依赖，其他浏览器才拉 hls.js）
//   - 不使用 requestAnimationFrame 轮询，只监听原生 video 事件更新 UI
//   - 所有功能纯 JS 实现，体积全花在引擎上
//
// 用法：
//   <gy-player src="x.m3u8" title="标题" video-id="vid123" autoplay></gy-player>
//   或 JS：player.loadStream(url, { subtitles, title, videoId })

export const GY_PLAYER_MODULE_VERSION = '140';
console.log('GY-Player loaded dynamically: v1.0.2-verify');

import { styles } from './styles.js';
import { icons } from './icons.js';
import { PlaybackEngine } from './engine.js';
import { formatTime, clamp, supportsPiP, supportsFullscreen, isMobile, isIOS, isCompactControlsViewport, hasTouchInput, bufferedAheadSeconds } from './utils.js';
import {
    savePlaybackTime, getPlaybackTime, clearPlaybackTime,
    saveVolume, getVolume, saveMuted, getMuted, saveRate, getRate,
    saveQualityPreference, getQualityPreference,
    saveSubtitlePreference, getSubtitlePreference,
    saveAudioPreference, getAudioPreference,
    markGestureGuideSeen, getGestureGuideSeen,
    saveDanmakuEnabled, getDanmakuEnabled,
} from './storage.js';
import { bindControls } from './controls.js';
import { bindGestures } from './gestures.js';
import { bindKeyboard } from './keyboard.js';
import { fetchVttContent, layoutVideoBox, buildVttBlobUrl, findPreferredSimplifiedChineseSubtitleIndex, sortSubtitleInputs } from './subtitles.js';
import { DanmakuController } from './danmaku.js';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const RESUME_THRESHOLD = 15;   // 超过此秒数才提示续播
const SAVE_INTERVAL = 5;       // 进度保存间隔（秒）
const AUTOPLAY_MIN_BUFFER_SECONDS = 3; // 自动播放前至少再攒这么多秒缓冲
const AUTOPLAY_BUFFER_WAIT_MS = 12000;
const HIDE_DELAY = 3000;       // 播放中自动隐藏（对齐 YouTube ~3s）
const HIDE_DELAY_INLINE = 5000; // 详情页内嵌：略长便于操作
const SEEK_STEP = 10;          // 快进/快退步长（秒）
const EP_SEG_SIZE = 60;        // 选集分段容量（超过则分段，对标 B站长剧）

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[ch]);
}

function normalizeSources(sources, fallbackUrl, activeUrl) {
    const rows = Array.isArray(sources) ? sources : [];
    const normalized = rows
        .filter((source) => source && typeof source.url === 'string' && source.url)
        .map((source, index) => ({
            url: source.url,
            label: source.label || source.title || source.quality || `播放源 ${index + 1}`,
            quality: source.quality || source.label || source.title || '',
            subtitles: Array.isArray(source.subtitles) ? source.subtitles : undefined,
        }));
    if (!fallbackUrl) return normalized;
    if (normalized.some((source) => source.url === fallbackUrl)) return normalized;
    return [{
        url: fallbackUrl,
        label: activeUrl === fallbackUrl ? '当前播放源' : '播放源',
        quality: activeUrl === fallbackUrl ? '当前' : '',
    }, ...normalized];
}

function sourcePreferenceValue(source) {
    return String(source?.quality || source?.label || source?.title || '').trim().toLowerCase();
}

function sourcePreferenceLabel(source, fallback = '') {
    return source?.quality || source?.label || source?.title || fallback || '';
}

function normalizeErrorActions(actions) {
    const rows = Array.isArray(actions) ? actions : [];
    const normalized = rows
        .filter((action) => action && action.id && action.label)
        .slice(0, 3)
        .map((action) => ({
            id: String(action.id),
            label: String(action.label),
            variant: action.variant === 'secondary' ? 'secondary' : 'primary',
        }));
    return normalized.length > 0 ? normalized : [{ id: 'retry', label: '重试', variant: 'primary' }];
}

// 选集日期格式化（与 web 详情页保持一致：zh-CN 长日期）
function fmtEpDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return ''; }
}

export class GYPlayer extends HTMLElement {
    static get observedAttributes() {
        return ['src', 'title', 'video-id', 'autoplay', 'poster'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.engine = null;
        this._videoId = null;
        this._hideTimer = null;
        this._hintTimer = null;
        this._loadGen = 0;       // 加载代号，防止异步竞态
        this._lastSaveTime = -1;
        this._locked = false;
        this._menuOpen = false;
        this._suppressSurfaceClickUntil = 0; // 触屏：吞掉 touchend 之后合成的 click
        this._controlsShownAt = 0; // 最近一次唤出控件的时间（防连触闪灭）
        this._layoutInline = false;
        this._layoutFullscreen = false;
        this._ac = null;         // AbortController：统一卸载事件
        this._subtitleTracks = [];
        this._activeSubtitleIndex = -1;
        this._nativeTrackEl = null;
        this._nativeTrackBlobUrl = null;
        this._iosNativeFullscreen = false;
        this._pipActive = false;
        this._docPipWindow = null;     // Document PiP 窗口引用（Chrome）
        this._docPipSubOverlay = null; // Document PiP 内的字幕容器
        this._docPipCueHandler = null; // cuechange 监听器引用，用于清理
        this._pseudoFullscreen = false;
        this._pseudoScrollY = 0;
        this._subtitleScale = 1;
        this._danmakuApiBase = '/api/v1';
        this._danmaku = null;
    }

    connectedCallback() {
        this._ac = new AbortController();
        this._render();
        this._cacheEls();
        this._initState();
        // 绑定各交互模块（拆分到独立文件，保持单文件精简）
        bindControls(this, this._ac.signal);
        bindGestures(this, this._ac.signal);
        bindKeyboard(this, this._ac.signal);
        this._setupVideoEvents();
        this._setupAutoHide();
        this._setupMediaSession();
        this._initDanmaku();

        this._ensureNativeSubtitleStyle();

        const src = this.getAttribute('src');
        if (src) this.loadStream(src);
    }

    disconnectedCallback() {
        this.destroy();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'title' && this._titleEl) {
            this._titleEl.textContent = newVal || '';
        } else if (name === 'src' && newVal && this.engine) {
            this.loadStream(newVal);
        } else if (name === 'poster' && this.video) {
            if (newVal) this.video.setAttribute('poster', newVal);
            else this.video.removeAttribute('poster');
        }
    }

    // ===== 渲染骨架 =====
    _render() {
        const poster = this.getAttribute('poster');
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            <div class="gyp-media" id="media">
                <div class="gyp-video-box" id="videoBox">
                    <video class="gyp-video" id="video" playsinline webkit-playsinline preload="auto" ${poster ? `poster="${poster}"` : ''}></video>
                    <div class="gyp-danmaku-layer hidden" id="danmakuLayer"></div>
                </div>
            </div>
            <div class="gyp-subtitle-overlay hidden" id="subtitleOverlay"></div>
            <div class="gyp-brightness-overlay" id="brightnessOverlay"></div>
            <div class="gyp-surface" id="surface"></div>

            <div class="gyp-center" id="center"><div class="gyp-center-btn" id="centerBtn">${icons.play}</div></div>
            <div class="gyp-hint" id="hint" aria-live="polite"></div>

            <!-- 移动端竖滑亮度/音量可视化指示（中央胶囊 + 进度）-->
            <div class="gyp-vslide hidden" id="vslide">
                <div class="gyp-vslide-icon" id="vslideIcon"></div>
                <div class="gyp-vslide-track"><div class="gyp-vslide-fill" id="vslideFill"></div></div>
            </div>

            <!-- 移动端双击快进/快退涟漪反馈（左右两侧）-->
            <div class="gyp-dbltap gyp-dbltap-left hidden" id="dblTapLeft">
                <div class="gyp-dbltap-icon">${icons.rewind}</div>
                <span class="gyp-dbltap-text">10 秒</span>
            </div>
            <div class="gyp-dbltap gyp-dbltap-right hidden" id="dblTapRight">
                <div class="gyp-dbltap-icon">${icons.forward}</div>
                <span class="gyp-dbltap-text">10 秒</span>
            </div>
            <div class="gyp-buffering hidden" id="buffering"><div class="gyp-spinner"></div></div>
            <div class="gyp-loading hidden" id="loading">
                <img class="gyp-loading-logo hidden" id="loadingLogo" alt="" draggable="false">
                <div class="gyp-spinner"></div>
            </div>

            <div class="gyp-top" id="top">
                <button class="gyp-btn" id="backBtn" aria-label="返回">${icons.back}</button>
                <span class="gyp-title" id="title">${this.getAttribute('title') || ''}</span>
            </div>

            <button class="gyp-btn gyp-lock" id="lockBtn" aria-label="锁定">${icons.lock}</button>

            <div class="gyp-resume hidden" id="resume">
                <span class="gyp-resume-text" id="resumeText"></span>
                <button class="gyp-resume-btn gyp-resume-yes" id="resumeYes">继续播放</button>
                <button class="gyp-resume-btn gyp-resume-no" id="resumeNo">从头开始</button>
            </div>

            <!-- 移动端首次手势引导（仅触屏首次播放显示一次）-->
            <div class="gyp-guide hidden" id="guide">
                <div class="gyp-guide-card">
                    <div class="gyp-guide-title">手势操作</div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${icons.forward}</span><span>横滑快进 / 快退</span></div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${icons.volumeHigh}</span><span>左侧竖滑调亮度 · 右侧竖滑调音量</span></div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${icons.rewind}</span><span>双击两侧快退 / 快进 10 秒</span></div>
                    <div class="gyp-guide-row"><span class="gyp-guide-ico">${icons.play}</span><span>长按 2 倍速播放</span></div>
                    <button class="gyp-guide-btn" id="guideBtn">知道了</button>
                </div>
            </div>

            <div class="gyp-menu hidden" id="menu"></div>

            <!-- 移动端抽屉遮罩：打开菜单/选集时点击关闭 -->
            <div class="gyp-sheet-mask hidden" id="sheetMask"></div>

            <div class="gyp-mini" id="mini"><div class="gyp-mini-bar" id="miniBar"></div></div>

            <div class="gyp-scrim" id="scrim"></div>

            <div class="gyp-bottom" id="bottom">
                <div class="gyp-progress-bar">
                    <span class="gyp-time gyp-time-cur"><span id="timeCurrent">00:00</span></span>
                    <div class="gyp-progress" id="progress" role="slider" tabindex="0"
                         aria-label="播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
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
                    <!-- 液态玻璃层（effect 折射 / tint 染色 / shine 边缘高光），内容在其上 -->
                    <div class="gyp-glass" aria-hidden="true">
                        <div class="gyp-glass-effect"></div>
                        <div class="gyp-glass-tint"></div>
                        <div class="gyp-glass-shine"></div>
                    </div>
                    <div class="gyp-btns-leading">
                        <button class="gyp-btn" id="playBtn" aria-label="播放/暂停">${icons.play}</button>
                        <button class="gyp-btn hidden" id="prevBtn" aria-label="上一集">${icons.prev}</button>
                        <button class="gyp-btn hidden" id="nextBtn" aria-label="下一集">${icons.next}</button>
                        <div class="gyp-volume" id="volume">
                            <button class="gyp-btn" id="volumeBtn" aria-label="静音">${icons.volumeHigh}</button>
                            <div class="gyp-volume-slider" id="volumeSlider">
                                <div class="gyp-volume-track"></div>
                                <div class="gyp-volume-fill" id="volumeFill"></div>
                                <div class="gyp-volume-thumb" id="volumeThumb"></div>
                            </div>
                        </div>
                    </div>
                    <form class="gyp-danmaku-inline hidden" id="danmakuBar">
                        <input class="gyp-danmaku-input" id="danmakuInput" type="text" maxlength="80" autocomplete="off" placeholder="发一条友善弹幕">
                        <button type="submit" class="gyp-danmaku-send" id="danmakuSend">发送</button>
                    </form>
                    <div class="gyp-btns-trailing">
                        <button class="gyp-btn" id="settingsBtn" aria-label="设置">${icons.settings}</button>
                        <button class="gyp-btn gyp-btn-text hidden" id="episodesBtn" aria-label="选集">选集</button>
                        <button class="gyp-btn gyp-btn-text" id="speedBtn" aria-label="倍速">1x</button>
                        <button class="gyp-btn gyp-btn-text" id="qualityBtn" aria-label="画质">自动</button>
                        <button class="gyp-btn hidden" id="subtitleBtn" aria-label="字幕">${icons.subtitle}</button>
                        <button class="gyp-btn ${supportsPiP ? '' : 'hidden'}" id="pipBtn" aria-label="画中画">${icons.pip}</button>
                        <button class="gyp-btn ${supportsFullscreen ? '' : 'hidden'}" id="fsBtn" aria-label="全屏">${icons.fullscreen}</button>
                    </div>
                </div>
            </div>

            <!-- 液态玻璃 SVG 置换滤镜（注入 Shadow DOM，供 dock 折射引用）-->
            <svg class="gyp-glass-svg" aria-hidden="true" width="0" height="0">
                <filter id="gyp-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="5" result="turbulence"/>
                    <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap"/>
                    <feDisplacementMap in="SourceGraphic" in2="softMap" scale="60" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <!-- 进度条 thumb 液态透镜：拖动时放大折射下方轨道 -->
                <filter id="gyp-thumb-lens" x="-50%" y="-50%" width="200%" height="200%">
                    <feImage x="0" y="0" result="thumbNormal" xlink:href="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><radialGradient id='m' cx='50%25' cy='50%25' r='75%25'><stop offset='0%25' stop-color='rgb(128,128,255)'/><stop offset='90%25' stop-color='rgb(255,255,255)'/></radialGradient><rect width='100%25' height='100%25' fill='url(%23m)'/></svg>"/>
                    <feDisplacementMap in="SourceGraphic" in2="thumbNormal" scale="-90" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
            </svg>

            <!-- 选集侧滑面板 -->
            <div class="gyp-ep-panel hidden" id="epPanel">
                <div class="gyp-ep-header">
                    <span class="gyp-ep-title">选集</span>
                    <button class="gyp-btn" id="epClose" aria-label="关闭">${icons.back}</button>
                </div>
                <div class="gyp-ep-nav hidden" id="epNav">
                    <button class="gyp-ep-arrow" id="epPrevSeason" data-dir="-1" aria-label="上一季">${icons.chevronLeft}</button>
                    <button class="gyp-ep-current" id="epSeasonCurrent">
                        <span class="gyp-ep-season-label"></span>
                        <span class="gyp-ep-caret">${icons.chevronDown}</span>
                    </button>
                    <button class="gyp-ep-arrow" id="epNextSeason" data-dir="1" aria-label="下一季">${icons.chevronRight}</button>
                </div>
                <div class="gyp-ep-dropdown hidden" id="epSeasons" role="listbox"></div>
                <div class="gyp-ep-segments hidden" id="epSegments"></div>
                <div class="gyp-ep-list" id="epList"></div>
            </div>
        `;
    }

    // ===== 缓存 DOM 引用 =====
    _cacheEls() {
        const $ = (id) => this.shadowRoot.getElementById(id);
        this.video = $('video');
        this.els = {
            media: $('media'), videoBox: $('videoBox'), subtitleOverlay: $('subtitleOverlay'),
            surface: $('surface'), top: $('top'), bottom: $('bottom'),
            brightnessOverlay: $('brightnessOverlay'),
            center: $('center'), centerBtn: $('centerBtn'),
            hint: $('hint'), buffering: $('buffering'), loading: $('loading'),
            loadingLogo: $('loadingLogo'),
            backBtn: $('backBtn'), lockBtn: $('lockBtn'),
            playBtn: $('playBtn'), prevBtn: $('prevBtn'), nextBtn: $('nextBtn'),
            volume: $('volume'), volumeBtn: $('volumeBtn'), volumeSlider: $('volumeSlider'),
            volumeFill: $('volumeFill'), volumeThumb: $('volumeThumb'),
            speedBtn: $('speedBtn'), qualityBtn: $('qualityBtn'),
            subtitleBtn: $('subtitleBtn'), pipBtn: $('pipBtn'), fsBtn: $('fsBtn'), settingsBtn: $('settingsBtn'),
            episodesBtn: $('episodesBtn'), epPanel: $('epPanel'),
            epClose: $('epClose'), epSeasons: $('epSeasons'),
            epNav: $('epNav'), epSeasonCurrent: $('epSeasonCurrent'),
            epPrevSeason: $('epPrevSeason'), epNextSeason: $('epNextSeason'),
            epSegments: $('epSegments'), epList: $('epList'),
            progress: $('progress'), played: $('played'), buffered: $('buffered'),
            thumb: $('thumb'), tip: $('tip'),
            timeCurrent: $('timeCurrent'), timeDuration: $('timeDuration'),
            mini: $('mini'), miniBar: $('miniBar'), menu: $('menu'),
            resume: $('resume'), resumeText: $('resumeText'),
            resumeYes: $('resumeYes'), resumeNo: $('resumeNo'),
            dblTapLeft: $('dblTapLeft'), dblTapRight: $('dblTapRight'),
            sheetMask: $('sheetMask'),
            vslide: $('vslide'), vslideIcon: $('vslideIcon'), vslideFill: $('vslideFill'),
            guide: $('guide'), guideBtn: $('guideBtn'),
            danmakuLayer: $('danmakuLayer'), danmakuBar: $('danmakuBar'),
        };
        this._titleEl = $('title');
    }

    // ===== 初始化音量/倍速等持久化状态 =====
    _initState() {
        const vol = getVolume();
        const muted = getMuted();
        this.video.volume = vol;
        this.video.muted = muted;
        this._rate = getRate();
        this.video.playbackRate = this._rate;
        this.els.speedBtn.textContent = `${this._rate}x`;
        this._updateVolumeUI();
    }

    // ===== video 原生事件 → UI 更新（无 rAF 轮询）=====
    _setupVideoEvents() {
        const v = this.video;
        const sig = { signal: this._ac.signal };

        v.addEventListener('play', () => {
            this.els.playBtn.innerHTML = icons.pause;
            this._flashCenter(icons.play);
            this._maybeShowGuide();   // 首次播放展示移动端手势引导
        }, sig);
        v.addEventListener('pause', () => {
            this.els.playBtn.innerHTML = icons.play;
            this._flashCenter(icons.pause);
        }, sig);
        let bufferingShowTimer = null;
        const showBuffering = () => {
            clearTimeout(bufferingShowTimer);
            bufferingShowTimer = setTimeout(() => {
                if (!this._seeking) this.els.buffering.classList.remove('hidden');
            }, 320);
        };
        const hideBuffering = () => {
            clearTimeout(bufferingShowTimer);
            this.els.buffering.classList.add('hidden');
        };
        v.addEventListener('waiting', showBuffering, sig);
        v.addEventListener('playing', hideBuffering, sig);
        v.addEventListener('canplay', hideBuffering, sig);
        v.addEventListener('seeking', () => { this._seeking = true; }, sig);
        v.addEventListener('seeked', () => { this._seeking = false; }, sig);
        const layout = () => this._layoutVideoBox();
        v.addEventListener('loadedmetadata', () => {
            this.els.timeDuration.textContent = formatTime(v.duration);
            layout();
        }, sig);
        v.addEventListener('resize', layout, sig);
        window.addEventListener('resize', layout, sig);
        document.addEventListener('fullscreenchange', () => {
            layout();
            this._updateFullscreenUI();
        }, sig);
        document.addEventListener('webkitfullscreenchange', () => {
            layout();
            this._updateFullscreenUI();
        }, sig);
        const onIosNativeFsEnter = () => {
            this._iosNativeFullscreen = true;
            this.classList.add('gyp-ios-native-fs');
            this._updateFullscreenUI();
            this._onEnterIsolatedPlayback();
        };
        const onIosNativeFsExit = () => {
            this._iosNativeFullscreen = false;
            this.classList.remove('gyp-ios-native-fs');
            this._onExitIsolatedPlayback();
            this._updateFullscreenUI();
            layout();
        };
        v.addEventListener('webkitbeginfullscreen', onIosNativeFsEnter, sig);
        v.addEventListener('webkitendfullscreen', onIosNativeFsExit, sig);
        v.addEventListener('enterpictureinpicture', () => {
            this._pipActive = true;
            this.classList.add('gyp-pip-active');
            this._onEnterIsolatedPlayback();
        }, sig);
        v.addEventListener('leavepictureinpicture', () => {
            this._pipActive = false;
            this.classList.remove('gyp-pip-active');
            this._onExitIsolatedPlayback();
        }, sig);
        if ('webkitPresentationMode' in v) {
            v.addEventListener('webkitpresentationmodechanged', () => {
                const pip = v.webkitPresentationMode === 'picture-in-picture';
                this._pipActive = pip;
                this.classList.toggle('gyp-pip-active', pip);
                if (pip) this._onEnterIsolatedPlayback();
                else this._onExitIsolatedPlayback();
            }, sig);
        }
        if (typeof ResizeObserver !== 'undefined' && this.els.media) {
            this._mediaResizeObserver = new ResizeObserver(layout);
            this._mediaResizeObserver.observe(this.els.media);
        }
        v.addEventListener('timeupdate', () => this._onTimeUpdate(), sig);
        v.addEventListener('addtrack', (event) => {
            const track = event.track;
            if (!track || (track.kind !== 'subtitles' && track.kind !== 'captions')) return;
            if (this._isNativeSubtitleTextTrack(track)) return;
            track.mode = 'disabled';
        }, sig);
        v.addEventListener('progress', () => this._onBufferUpdate(), sig);
        v.addEventListener('ended', () => {
            this._ended = true;
            if (!this._disableStorage) clearPlaybackTime(this._videoId);
            this.els.playBtn.innerHTML = icons.replay;
            this.dispatchEvent(new CustomEvent('ended', {
                detail: { videoId: this._videoId },
            }));
        }, sig);
        v.addEventListener('volumechange', () => this._updateVolumeUI(), sig);
    }

    /** 播放进度更新：进度条 + 时间 + 节流保存 + progress 事件 */
    _onTimeUpdate() {
        const v = this.video;
        if (!v.duration) return;
        const pct = (v.currentTime / v.duration) * 100;
        this.els.played.style.width = `${pct}%`;
        this.els.thumb.style.left = `${pct}%`;
        this.els.miniBar.style.width = `${pct}%`;
        this.els.timeCurrent.textContent = formatTime(v.currentTime);
        this.els.progress.setAttribute('aria-valuenow', Math.round(pct));
        this._updateSubtitleOverlay();
        this._disableEmbeddedSubtitleTracks();
        this._danmaku?.sync(v.currentTime);

        // 距上次保存满 SAVE_INTERVAL 秒就触发：本地存储 + 抛 progress 事件给前端
        // 用时间差判断（而非整除秒），避免从非整数秒起播时首次间隔过长
        const now = v.currentTime;
        if (this._lastSaveTime < 0 || Math.abs(now - this._lastSaveTime) >= SAVE_INTERVAL) {
            this._lastSaveTime = now;
            if (!this._disableStorage) {
                savePlaybackTime(this._videoId, now);
            }
            // 抛事件让前端可同步到服务端（跨设备续播/观看历史）
            this.dispatchEvent(new CustomEvent('progress', {
                detail: {
                    videoId: this._videoId,
                    currentTime: now,
                    duration: v.duration,
                    percent: pct,
                },
            }));
        }
    }

    /** 缓冲进度更新 */
    _onBufferUpdate() {
        const v = this.video;
        if (v.buffered.length > 0 && v.duration) {
            const end = v.buffered.end(v.buffered.length - 1);
            this.els.buffered.style.width = `${(end / v.duration) * 100}%`;
        }
    }

    // ===== 加载视频流 =====
    /**
     * @param {string} url m3u8 / mp4 地址
     * @param {Object} [opts]
     * @param {Array} [opts.subtitles] 外挂字幕 [{url, lang, label, default}]
     * @param {string} [opts.title] 标题
     * @param {string} [opts.videoId] 视频唯一 id（用于续播记忆）
     * @param {number} [opts.startTime] 初始播放位置（秒）。传入则直接从此处播放，
     *                                  用于跨设备续播（覆盖本地记忆，不弹续播提示）。
     * @param {boolean} [opts.disableStorage] 关闭播放器内置 localStorage 续播，
     *                                        由前端通过 progress 事件自行管理存储。
     * @param {Array} [opts.sources] 同一视频的外部播放源/清晰度列表
     *                               [{url,label,quality,subtitles}]
     * @param {string} [opts.sourceUrl] 当前播放源 url（用于菜单高亮）
     * @param {boolean} [opts.playAfterLoad] 加载完成后立即播放（切清晰度时保留播放状态）
     * @param {'inline'|'fullscreen'} [opts.layout] inline=详情页内嵌（隐藏顶栏、延长控件停留）
     * @param {Array} [opts.errorActions] 播放失败时展示的操作 [{id,label,variant}]
     */
    async loadStream(url, opts = {}) {
        const gen = ++this._loadGen;
        this._ended = false;
        this._lastSaveTime = -1;
        this._disableStorage = !!opts.disableStorage;
        this._layoutInline = opts.layout === 'inline';
        this._layoutFullscreen = opts.layout === 'fullscreen';
        this.classList.toggle('gyp-layout-inline', this._layoutInline);
        this.els.loading.classList.remove('hidden'); // 显示首屏加载态
        if (opts.title != null) this.setTitle(opts.title);
        this._videoId = opts.videoId || this.getAttribute('video-id') || url;
        this._loadOptions = { ...opts, sources: opts.sources };
        this._qualitySources = normalizeSources(opts.sources, url, opts.sourceUrl);
        this._activeSourceUrl = opts.sourceUrl || url;
        this._refreshQualityLabel();
        this._hideError();

        // 起播位置：优先用前端传入的 startTime（跨设备续播），否则查本地记忆
        let startTime = 0;
        if (typeof opts.startTime === 'number' && opts.startTime > 0) {
            startTime = opts.startTime; // 前端接管：直接续播，不弹提示
        } else if (!this._disableStorage) {
            const saved = getPlaybackTime(this._videoId);
            if (saved > RESUME_THRESHOLD) {
                startTime = await this._promptResume(saved);
                if (gen !== this._loadGen) return; // 期间切换了视频
            }
        }

        // 销毁旧引擎，创建新引擎
        if (this.engine) await this.engine.detach();
        this.engine = new PlaybackEngine(this.video, {
            onReady: () => {
                if (gen !== this._loadGen) return;
                this.els.loading.classList.add('hidden'); // 隐藏首屏加载态
                this._disableEmbeddedSubtitleTracks();
                this._applySavedQualityLevel();
                this._applySavedAudioTrack();
                this._refreshQualityLabel();
                this._refreshTrackButton();
                if (this.hasAttribute('autoplay') || opts.playAfterLoad) {
                    this._playWhenBuffered(gen, AUTOPLAY_MIN_BUFFER_SECONDS);
                }
            },
            onError: (detail, fatal) => {
                if (gen !== this._loadGen) return;
                const eventDetail = typeof detail === 'object' && detail
                    ? {
                        ...detail,
                        code: detail.code,
                        type: detail.type,
                        message: detail.message,
                        reason: detail.reason,
                        fatal,
                    }
                    : { message: String(detail || ''), fatal };
                if (fatal) {
                    this.els.loading.classList.add('hidden');
                    this._showError(this._errorMessage(detail), this._loadOptions?.errorActions);
                }
                this.dispatchEvent(new CustomEvent('error', { detail: eventDetail }));
            },
            onLevelSwitched: () => this._refreshQualityLabel(),
        }, {
            preferHDR: opts.preferHDR === true,
            allowedVideoRanges: opts.allowedVideoRanges,
        });

        await this.engine.load(url, { startPosition: startTime });
        if (gen !== this._loadGen) return;
        await this._loadSubtitles(opts.subtitles || []);
        this._configureDanmaku(opts);
    }

    /** 等预缓冲足够后再 play，避免「播完一小段才开始拉下一批」 */
    _playWhenBuffered(gen, minSeconds = AUTOPLAY_MIN_BUFFER_SECONDS) {
        const startedAt = Date.now();
        const tick = () => {
            if (gen !== this._loadGen || this._ended) return;
            const ahead = bufferedAheadSeconds(this.video);
            const ready = ahead >= minSeconds
                || this.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
            if (ready || Date.now() - startedAt >= AUTOPLAY_BUFFER_WAIT_MS) {
                this.video.play().catch(() => {});
                return;
            }
            setTimeout(tick, 80);
        };
        tick();
    }

    /** 配置弹幕（videoId / API / 预览禁用） */
    _configureDanmaku(opts = {}) {
        if (!this._danmaku) return;
        if (opts.danmaku === false) {
            this._danmaku.configure({ videoId: '', disabled: true });
            return;
        }
        const dm = typeof opts.danmaku === 'object' && opts.danmaku ? opts.danmaku : {};
        if (dm.apiBase) this._danmakuApiBase = dm.apiBase;
        const videoId = dm.videoId || opts.danmakuVideoId || this._videoId || '';
        this._danmaku.configure({
            videoId,
            apiBase: dm.apiBase || this._danmakuApiBase,
            disabled: dm.disabled === true,
            enabled: typeof dm.enabled === 'boolean' ? dm.enabled : getDanmakuEnabled(),
        });
    }

    _initDanmaku() {
        this._danmaku = new DanmakuController(this, { apiBase: this._danmakuApiBase });
        this._danmaku.attach({
            layer: this.els.danmakuLayer,
            bar: this.els.danmakuBar,
        });
        const sig = { signal: this._ac.signal };
        const bar = this.els.danmakuBar;
        bar.addEventListener('submit', async (event) => {
            event.preventDefault();
            const input = bar.querySelector('#danmakuInput');
            const content = input?.value?.trim() || '';
            if (!content) return;
            const button = bar.querySelector('#danmakuSend');
            button.disabled = true;
            try {
                await this._danmaku.send(content);
                input.value = '';
                this.showHint('弹幕已发送');
            } catch (error) {
                this.showHint(error?.message || '弹幕发送失败');
                if (error?.status === 409) {
                    this._danmaku.serverEnabled = false;
                    this._danmaku._updateInputState();
                }
                if (error?.status === 401) {
                    this.dispatchEvent(new CustomEvent('danmaku-login', { detail: { action: 'send' } }));
                }
            } finally {
                button.disabled = this._danmaku.serverEnabled === false;
            }
        }, sig);
    }

    /** 设置弹幕 API 根路径（默认 /api/v1） */
    setDanmakuApiBase(apiBase) {
        this._danmakuApiBase = String(apiBase || '/api/v1');
        if (this._danmaku) this._danmaku.apiBase = this._danmakuApiBase;
    }

    /** 运行时切换弹幕 videoId（切集时也可走 loadStream opts.danmaku） */
    setDanmakuVideoId(videoId, options = {}) {
        this._configureDanmaku({
            danmaku: {
                videoId,
                disabled: options.disabled,
                apiBase: options.apiBase,
                enabled: options.enabled,
            },
        });
    }

    /** 系统全屏 / 画中画：DOM overlay 不可见，必须用原生 <track> */
    _isolatedVideoPlayback() {
        const doc = document;
        return this._iosNativeFullscreen
            || this._pipActive
            || doc.pictureInPictureElement === this.video
            || this.video?.webkitPresentationMode === 'picture-in-picture';
    }

    _usesNativeSubtitleRender() {
        return this._isolatedVideoPlayback();
    }

    _isNativeSubtitleTextTrack(track) {
        const el = this._nativeTrackEl;
        if (!el || !track) return false;
        return el.track === track;
    }

    _onEnterIsolatedPlayback() {
        const mount = () => {
            this._mountNativeSubtitleTrack();
            this._syncSubtitleDisplay({ forceNative: true });
        };
        mount();
        requestAnimationFrame(mount);
        setTimeout(mount, 120);
    }

    _onExitIsolatedPlayback() {
        if (this._isolatedVideoPlayback()) return;
        this._teardownNativeSubtitleTrack();
        this._syncSubtitleDisplay();
    }

    _absoluteSubtitleUrl(url) {
        if (!url || typeof url !== 'string') return url;
        if (/^https?:\/\//i.test(url)) return url;
        if (url.startsWith('/')) return `${window.location.origin}${url}`;
        return url;
    }

    _teardownNativeSubtitleTrack() {
        if (this._nativeTrackEl) {
            if (this._nativeTrackEl.track) this._nativeTrackEl.track.mode = 'disabled';
            this._nativeTrackEl.remove();
            this._nativeTrackEl = null;
        }
        if (this._nativeTrackBlobUrl) {
            try { URL.revokeObjectURL(this._nativeTrackBlobUrl); } catch { /* ignore */ }
            this._nativeTrackBlobUrl = null;
        }
    }

    /** 进入系统全屏 / PiP 时挂载 <track>（sharebox 验证过的模式） */
    _mountNativeSubtitleTrack() {
        this._teardownNativeSubtitleTrack();

        const idx = this._activeSubtitleIndex;
        const meta = idx >= 0 ? this._subtitleTracks[idx] : null;
        if (!meta?.cues?.length) return;

        this._nativeTrackBlobUrl = buildVttBlobUrl(meta.cues, meta.vttText);
        const trackEl = document.createElement('track');
        trackEl.kind = 'subtitles';
        trackEl.label = meta.label || meta.lang || '字幕';
        trackEl.srclang = meta.lang || 'und';
        trackEl.default = true;
        trackEl.src = this._nativeTrackBlobUrl;
        // 须在 append 前赋值，避免 addtrack 同步触发时把原生轨误禁用
        this._nativeTrackEl = trackEl;
        this.video.appendChild(trackEl);

        const enable = () => {
            if (!this._isolatedVideoPlayback() || !trackEl.track) return;
            trackEl.track.mode = 'showing';
        };
        trackEl.addEventListener('load', enable, { once: true });
        trackEl.addEventListener('error', () => {
            const fallback = meta.trackUrl;
            if (fallback && trackEl.getAttribute('src') !== fallback) {
                trackEl.src = fallback;
            }
        }, { once: true });
        enable();
        requestAnimationFrame(enable);
        setTimeout(enable, 80);
        setTimeout(enable, 240);
    }

    _ensureNativeSubtitleStyle() {
        if (document.getElementById('gyp-native-subtitle-style')) return;
        const style = document.createElement('style');
        style.id = 'gyp-native-subtitle-style';
        style.textContent = `
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
}`;
        document.head.appendChild(style);
    }

    /** 加载外挂字幕：fetch + overlay；iOS 额外缓存 blob VTT 供系统全屏 */
    async _loadSubtitles(subtitles) {
        this._teardownNativeSubtitleTrack();
        this.video.querySelectorAll('track').forEach((tr) => tr.remove());
        this._subtitleTracks = [];
        this._activeSubtitleIndex = -1;
        if (this.els.subtitleOverlay) {
            this.els.subtitleOverlay.textContent = '';
            this.els.subtitleOverlay.classList.add('hidden');
        }

        const list = sortSubtitleInputs(subtitles || []);
        let defaultIndex = -1;

        for (let i = 0; i < list.length; i++) {
            const sub = list[i];
            const label = sub.label || sub.lang || '字幕';
            const lang = sub.lang || 'und';
            const { cues, text } = await fetchVttContent(sub.url);
            this._subtitleTracks.push({
                label,
                lang,
                url: sub.url,
                trackUrl: this._absoluteSubtitleUrl(sub.url),
                cues,
                vttText: text,
            });
            if (sub.default && defaultIndex < 0) defaultIndex = i;
        }

        this.els.subtitleBtn.classList.toggle('hidden', list.length === 0);
        this._hasSubtitles = list.length > 0;
        this._refreshTrackButton();

        this._disableEmbeddedSubtitleTracks();
        this._applyInitialSubtitle(defaultIndex);
        this._layoutVideoBox();
    }

    /** 禁用 m3u8 内嵌字幕轨，只使用外挂 VTT overlay */
    _disableEmbeddedSubtitleTracks() {
        if (this.engine?.hls && this.engine.hls.subtitleTracks?.length) {
            try { this.engine.hls.subtitleTrack = -1; } catch { /* ignore */ }
        }
        Array.from(this.video?.textTracks || []).forEach((track) => {
            if (this._isNativeSubtitleTextTrack(track)) return;
            if (track.kind === 'subtitles' || track.kind === 'captions') {
                track.mode = 'disabled';
            }
        });
    }

    _applyInitialSubtitle(defaultIndex = -1) {
        const tracks = this._subtitleTracks || [];
        const simplifiedIndex = findPreferredSimplifiedChineseSubtitleIndex(tracks);

        if (simplifiedIndex >= 0) {
            this._applySubtitle(simplifiedIndex);
            return;
        }

        if (this._applySavedSubtitle()) return;
        if (defaultIndex >= 0) this._applySubtitle(defaultIndex);
    }

    _subtitleIndexForPreference(pref) {
        const tracks = this._subtitleTracks || [];
        if (!pref || tracks.length === 0) return -1;
        const wantedLang = String(pref.lang || '').toLowerCase();
        const wantedLabel = String(pref.label || '').toLowerCase();
        return tracks.findIndex((track) =>
            (wantedLang && String(track.lang || '').toLowerCase() === wantedLang) ||
            (wantedLabel && String(track.label || '').toLowerCase() === wantedLabel)
        );
    }

    _updateSubtitleOverlay() {
        if (this._usesNativeSubtitleRender()) return;
        const overlay = this.els.subtitleOverlay;
        if (!overlay) return;
        const idx = this._activeSubtitleIndex;
        if (idx < 0 || !this._subtitleTracks[idx]) {
            overlay.textContent = '';
            overlay.classList.add('hidden');
            return;
        }
        const t = this.video.currentTime;
        const track = this._subtitleTracks[idx];
        const cue = track.cues.find((c) => t >= c.start && t < c.end);
        if (cue) {
            overlay.textContent = cue.text;
            overlay.classList.remove('hidden');
        } else {
            overlay.textContent = '';
            overlay.classList.add('hidden');
        }
    }

    /** 平时 overlay；iOS 系统全屏时 native <track> */
    _syncSubtitleDisplay({ forceNative = false } = {}) {
        const overlay = this.els.subtitleOverlay;
        const useNative = forceNative || this._usesNativeSubtitleRender();

        if (this._nativeTrackEl?.track) {
            const showMirror = useNative && this._activeSubtitleIndex >= 0;
            this._nativeTrackEl.track.mode = showMirror ? 'showing' : 'hidden';
        }
        Array.from(this.video.textTracks || []).forEach((tr) => {
            if (tr !== this._nativeTrackEl?.track) {
                if (tr.kind === 'subtitles' || tr.kind === 'captions') tr.mode = 'disabled';
            }
        });

        if (useNative) {
            if (overlay) {
                overlay.textContent = '';
                overlay.classList.add('hidden');
            }
            return;
        }
        this._updateSubtitleOverlay();
    }

    _shouldFillScreen() {
        return !!this._layoutFullscreen || this._isInFullscreen();
    }

    _layoutVideoBox() {
        const fillScreen = this._shouldFillScreen();
        this.classList.toggle('gyp-fill-screen', fillScreen);
        layoutVideoBox({
            video: this.video,
            mediaEl: this.els.media,
            videoBoxEl: this.els.videoBox,
            overlayEl: this.els.subtitleOverlay,
            hostEl: this,
            bottomEl: this.els.bottom,
            menuEl: this.els.menu,
            scale: this._subtitleScale || 1,
            immersed: this.classList.contains('gyp-immersed'),
            menuOpen: !!this._menuOpen,
            locked: this._locked,
            fillScreen,
        });
    }

    /** 根据字幕 + 音轨情况决定是否显示「字幕/音轨」按钮 */
    _refreshTrackButton() {
        const hasSubs = (this._subtitleTracks?.length || 0) > 0;
        const multiAudio = this.engine ? this.engine.getAudioTracks().length > 1 : false;
        this.els.subtitleBtn.classList.toggle('hidden', !hasSubs && !multiAudio);
    }

    // ===== 续播提示 =====
    _promptResume(savedTime) {
        return new Promise((resolve) => {
            const { resume, resumeText, resumeYes, resumeNo } = this.els;
            resumeText.textContent = `上次看到 ${formatTime(savedTime)}`;
            resume.classList.remove('hidden');
            let done = false;
            const finish = (val) => {
                if (done) return;
                done = true;
                resume.classList.add('hidden');
                resolve(val);
            };
            resumeYes.onclick = () => finish(savedTime);
            resumeNo.onclick = () => finish(0);
            // 6 秒无操作默认续播
            setTimeout(() => finish(savedTime), 6000);
        });
    }

    // ===== 自动隐藏控件（YouTube 式：播放中 ~3s 无操作收起；暂停常显；单击切换）=====
    _hideDelayMs() {
        if (this._layoutInline) return HIDE_DELAY_INLINE;
        return HIDE_DELAY;
    }

    _controlsAreVisible() {
        return !this.classList.contains('gyp-immersed');
    }

    _canAutoHideControls() {
        return !this.video.paused
            && !this._menuOpen
            && !this._controlsHovered
            && !this._locked
            && this.els.epPanel.classList.contains('hidden');
    }

    _revealControls() {
        if (this._locked) return;
        this.classList.remove('gyp-immersed');
        this._controlsShownAt = Date.now();
        this._layoutVideoBox();
    }

    _immerseControls() {
        clearTimeout(this._hideTimer);
        this.classList.add('gyp-immersed');
        this._layoutVideoBox();
    }

    _setupAutoHide() {
        const scheduleHide = () => {
            clearTimeout(this._hideTimer);
            if (!this._controlsAreVisible()) return;
            this._hideTimer = setTimeout(() => {
                if (!this._canAutoHideControls()) return;
                this._immerseControls();
            }, this._hideDelayMs());
        };

        const show = () => {
            this._revealControls();
            if (!this.video.paused) scheduleHide();
        };

        const onPlaying = () => {
            if (!this._controlsAreVisible()) return;
            scheduleHide();
        };

        this._showControls = show;
        this._scheduleAutoHide = scheduleHide;

        const sig = { signal: this._ac.signal };
        // 桌面：鼠标移动唤出；触屏不监听 mousemove（避免与 touchend 竞态）
        if (!hasTouchInput()) {
            this.shadowRoot.addEventListener('mousemove', show, sig);
        }
        this.video.addEventListener('pause', () => {
            clearTimeout(this._hideTimer);
            show();
        }, sig);
        this.video.addEventListener('playing', onPlaying, sig);

        if (hasTouchInput()) {
            this._immerseControls();
        } else {
            show();
        }
    }

    /** 切换控件显隐（仅 API / 键盘等外部调用；画面单击走 _onSurfaceTap） */
    toggleControls() {
        if (this._locked) return;
        if (this._controlsAreVisible()) {
            if (Date.now() - (this._controlsShownAt || 0) < 500) return;
            this._immerseControls();
        } else {
            this._showControls?.();
        }
    }

    /**
     * 触屏画面单击（gestures 延迟触发，避免与双击快进冲突）。
     * 对齐 YouTube：点画面唤出/续期控件并重置自动隐藏；顶/底栏交互同理。
     * 不用「再点一次画面就收起」，避免中间区域闪一下；收起靠 3s 无操作自动隐藏。
     */
    _onSurfaceTap() {
        if (this._locked) return;
        if (this._menuOpen) {
            this.closeMenu();
            return;
        }
        if (!this.els.epPanel.classList.contains('hidden')) {
            this.toggleEpisodePanel(false);
            return;
        }
        this._suppressSurfaceClickUntil = Date.now() + 500;
        this._showControls?.();
    }

    // ===== Media Session（锁屏/系统媒体控制）=====
    _setupMediaSession() {
        if (!('mediaSession' in navigator)) return;
        const ms = navigator.mediaSession;
        const v = this.video;
        v.addEventListener('play', () => {
            ms.metadata = new MediaMetadata({
                title: this.getAttribute('title') || 'Video',
            });
            ms.playbackState = 'playing';
        }, { signal: this._ac.signal });
        v.addEventListener('pause', () => { ms.playbackState = 'paused'; }, { signal: this._ac.signal });
        ms.setActionHandler('play', () => v.play());
        ms.setActionHandler('pause', () => v.pause());
        ms.setActionHandler('seekbackward', () => this.seekBy(-SEEK_STEP));
        ms.setActionHandler('seekforward', () => this.seekBy(SEEK_STEP));
        ms.setActionHandler('previoustrack', () => this.dispatchEvent(new CustomEvent('prev')));
        ms.setActionHandler('nexttrack', () => this.dispatchEvent(new CustomEvent('next')));
    }

    // ===== 公共 API =====
    togglePlay() {
        if (this._locked) return;
        if (this.video.paused) this.video.play().catch(() => {});
        else this.video.pause();
    }
    play() { return this.video.play(); }
    pause() { this.video.pause(); }
    seek(time) {
        const target = clamp(time, 0, this.video.duration || 0);
        if (this.engine) this.engine.seekTo(target);
        else this.video.currentTime = target;
    }
    seekBy(delta) {
        const target = clamp(this.video.currentTime + delta, 0, this.video.duration || 0);
        this.seek(target);
        this.showHint(`${delta > 0 ? '+' : ''}${delta}s`);
    }
    setVolume(vol) {
        this.video.volume = clamp(vol, 0, 1);
        this.video.muted = false;
        saveVolume(this.video.volume);
        saveMuted(false);
    }
    toggleMute() {
        this.video.muted = !this.video.muted;
        saveMuted(this.video.muted);
    }
    setRate(rate) {
        this._rate = rate;
        this.video.playbackRate = rate;
        this.els.speedBtn.textContent = `${rate}x`;
        saveRate(rate);
    }
    setTitle(title) {
        this.setAttribute('title', title);
        if (this._titleEl) this._titleEl.textContent = title;
    }
    showNextButton(visible) { this.els.nextBtn.classList.toggle('hidden', !visible); }
    showPrevButton(visible) { this.els.prevBtn.classList.toggle('hidden', !visible); }

    /**
     * 设置加载态 logo（剧集 logo 优先，无则用网站 logo）
     * @param {string} url logo 图片地址
     */
    setLogo(url) {
        const el = this.els.loadingLogo;
        if (!el) return;
        if (url) {
            el.src = url;
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    }

    /** 播放页进入后、尚未 loadStream 前展示首屏加载态 */
    showBootLoading() {
        this.els.loading?.classList.remove('hidden');
    }

    /**
     * 设置剧集列表（启用播放器内选集面板）
     * @param {Array} episodes [{id, title, season, episode}]
     * @param {string} currentId 当前播放集 id
     */
    setEpisodes(episodes, currentId) {
        this._episodes = Array.isArray(episodes) ? episodes : [];
        this._currentEpId = currentId || null;
        const has = this._episodes.length > 0;
        this.els.episodesBtn.classList.toggle('hidden', !has);
        if (has) this._renderEpisodePanel();
    }

    /** 更新当前集高亮（切集后调用） */
    setCurrentEpisode(currentId) {
        this._currentEpId = currentId;
        if (this._episodes?.length) this._renderEpisodePanel();
    }

    /** 渲染选集面板（季分组 + 分段 + 当前段集列表，扛千集）*/
    _renderEpisodePanel() {
        const eps = this._episodes;
        // 按季分组
        const seasons = {};
        eps.forEach((v) => { const s = v.season || 1; (seasons[s] ||= []).push(v); });
        const keys = Object.keys(seasons).sort((a, b) => a - b);
        const multi = keys.length > 1;
        // 当前集所在季
        const curEp = eps.find((v) => v.id === this._currentEpId);
        const activeSeason = this._activeSeason || (curEp ? String(curEp.season || 1) : keys[0]);
        this._activeSeason = activeSeason;
        this._seasonKeys = keys; // 供上/下一季箭头导航

        // 季导航（箭头 + 当前季 + 下拉），仅多季时显示
        this.els.epNav.classList.toggle('hidden', !multi);
        if (multi) {
            const idx = keys.indexOf(activeSeason);
            const label = this.els.epSeasonCurrent.querySelector('.gyp-ep-season-label');
            if (label) label.textContent = `第${activeSeason}季`;
            this.els.epPrevSeason.disabled = idx <= 0;
            this.els.epNextSeason.disabled = idx >= keys.length - 1;
            this.els.epSeasons.innerHTML = keys.map((s) =>
                `<button class="gyp-ep-option ${s === activeSeason ? 'active' : ''}" data-season="${s}" role="option">第${s}季</button>`).join('');
        } else {
            this.els.epSeasons.classList.add('hidden');
        }

        // 当前季全部集（排序）
        const all = (seasons[activeSeason] || []).slice().sort((a, b) => (a.episode || 0) - (b.episode || 0));
        this._epSeasonList = all;

        // 分段：超过阈值才分段
        const segCount = Math.ceil(all.length / EP_SEG_SIZE);
        const needSeg = segCount > 1;
        // 当前段：默认定位到正在播放的那一集所在段
        if (this._activeSegSeason !== activeSeason) {
            const curIdx = all.findIndex((v) => v.id === this._currentEpId);
            this._activeSeg = curIdx >= 0 ? Math.floor(curIdx / EP_SEG_SIZE) : 0;
            this._activeSegSeason = activeSeason;
        }
        if (this._activeSeg >= segCount) this._activeSeg = 0;

        // 分段 chip
        this.els.epSegments.classList.toggle('hidden', !needSeg);
        if (needSeg) {
            let segHtml = '';
            for (let i = 0; i < segCount; i++) {
                const from = i * EP_SEG_SIZE;
                const to = Math.min(from + EP_SEG_SIZE, all.length);
                const a = all[from]?.episode ?? (from + 1);
                const b = all[to - 1]?.episode ?? to;
                segHtml += `<button class="gyp-ep-seg ${i === this._activeSeg ? 'active' : ''}" data-seg="${i}">${a}-${b}</button>`;
            }
            this.els.epSegments.innerHTML = segHtml;
        }

        // 只渲染当前段的集（DOM 控制在 EP_SEG_SIZE 内）
        this._renderEpisodeItems();
    }

    /** 渲染当前段的集号项（结构对齐 web 详情页剧集列表）*/
    _renderEpisodeItems() {
        const all = this._epSeasonList || [];
        const from = (this._activeSeg || 0) * EP_SEG_SIZE;
        const list = all.slice(from, from + EP_SEG_SIZE);
        this.els.epList.innerHTML = list.map((v) => {
            const active = v.id === this._currentEpId ? 'active' : '';
            const hasSource = v.available ? 'has-source' : '';
            const label = (v.title || `第${v.episode}集`).replace(/</g, '&lt;');
            const date = fmtEpDate(v.released);
            return `<button class="gyp-ep-item ${active} ${hasSource}" data-id="${String(v.id).replace(/"/g, '&quot;')}" title="${label.replace(/"/g, '&quot;')}">
                <span class="gyp-ep-line">
                    <span class="gyp-ep-num">${v.episode || ''}.</span>
                    <span class="gyp-ep-name">${label}</span>
                    ${v.available ? '<span class="gyp-ep-dot" title="可播放"></span>' : ''}
                </span>
                ${date ? `<span class="gyp-ep-date">${date}</span>` : ''}
            </button>`;
        }).join('');
    }

    /** 打开/关闭选集面板 */
    toggleEpisodePanel(open) {
        const show = open ?? this.els.epPanel.classList.contains('hidden');
        if (show) this.closeMenu?.(); // 与设置菜单互斥
        this.els.epPanel.classList.toggle('hidden', !show);
        if (show) {
            this._showControls?.();
            this._showSheetMask();
            // 滚动到当前集
            const active = this.els.epList.querySelector('.gyp-ep-item.active');
            active?.scrollIntoView({ block: 'center' });
        }
        this._syncSheetMask();
        if (!show) this._scheduleAutoHide?.();
    }

    toggleFullscreen() {
        if (this._isInFullscreen()) {
            if (this._pseudoFullscreen) {
                this._exitPseudoFullscreen();
            } else if (this._iosNativeFullscreen && this.video.webkitExitFullscreen) {
                this.video.webkitExitFullscreen();
            } else {
                const doc = document;
                (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc);
            }
            return;
        }

        // iOS：系统原生全屏；字幕 track 在 webkitbeginfullscreen 里挂载
        if (isIOS) {
            if (this._iosNativeFullscreen) return;
            if (this.video.webkitEnterFullscreen) this.video.webkitEnterFullscreen();
            return;
        }

        const enter = this.requestFullscreen || this.webkitRequestFullscreen;
        if (enter) {
            enter.call(this)
                .then(() => {
                    this._updateFullscreenUI();
                    this._lockLandscape();
                })
                .catch(() => {
                    if (isMobile) this._enterPseudoFullscreen();
                });
            return;
        }
        if (isMobile) {
            this._enterPseudoFullscreen();
        }
    }

    _isInFullscreen() {
        const doc = document;
        return this._iosNativeFullscreen
            || this._pseudoFullscreen
            || doc.fullscreenElement === this
            || doc.webkitFullscreenElement === this;
    }

    _ensureFullscreenLockStyle() {
        if (document.getElementById('gyp-fs-lock-style')) return;
        const style = document.createElement('style');
        style.id = 'gyp-fs-lock-style';
        style.textContent = 'html.gyp-player-fs-lock, html.gyp-player-fs-lock body { overflow: hidden !important; height: 100% !important; touch-action: none; }';
        document.head.appendChild(style);
    }

    _enterPseudoFullscreen() {
        if (this._pseudoFullscreen) return;
        this._pseudoScrollY = window.scrollY || 0;
        this._pseudoFullscreen = true;
        this._ensureFullscreenLockStyle();
        document.documentElement.classList.add('gyp-player-fs-lock');
        this._updateFullscreenUI();
        this._lockLandscape();
        window.scrollTo(0, 0);
    }

    _exitPseudoFullscreen() {
        if (!this._pseudoFullscreen) return;
        this._pseudoFullscreen = false;
        document.documentElement.classList.remove('gyp-player-fs-lock');
        this._updateFullscreenUI();
        if (this._pseudoScrollY) {
            window.scrollTo(0, this._pseudoScrollY);
        }
        this._pseudoScrollY = 0;
    }

    _updateFullscreenUI() {
        const isFs = this._isInFullscreen();
        this.classList.toggle('gyp-fullscreen', isFs && this._pseudoFullscreen);
        if (this.els?.fsBtn) {
            this.els.fsBtn.innerHTML = isFs ? icons.exitFullscreen : icons.fullscreen;
        }
        if (!isFs) this._unlockOrientation();
        this._layoutVideoBox();
    }

    /** @deprecated 保留 Android 伪全屏回退 */
    _iosFullscreen() {
        if (this.video.webkitEnterFullscreen) this.video.webkitEnterFullscreen();
    }

    /**
     * 进入全屏时锁定横屏（仅移动端、竖向视频除外）。
     * Screen Orientation lock 仅在部分 Android 浏览器支持，iOS Safari 不支持，
     * 失败静默忽略（用户仍可手动旋转）。
     */
    _lockLandscape() {
        if (!isMobile) return;
        const so = screen.orientation;
        if (!so || typeof so.lock !== 'function') return;
        // 竖向视频（高>宽）不强制横屏，避免竖屏短视频被旋转
        const vw = this.video.videoWidth || 16;
        const vh = this.video.videoHeight || 9;
        if (vh > vw) return;
        so.lock('landscape').catch(() => {}); // 不支持则静默
    }
    /** 退出全屏时解除方向锁定 */
    _unlockOrientation() {
        const so = screen.orientation;
        if (so && typeof so.unlock === 'function') {
            try { so.unlock(); } catch { /* 忽略不支持 */ }
        }
    }

    _isInPiP() {
        return this._pipActive
            || !!this._docPipWindow
            || document.pictureInPictureElement === this.video
            || this.video?.webkitPresentationMode === 'picture-in-picture';
    }

    togglePiP() {
        const v = this.video;
        if (!supportsPiP || !v) return;
        if (this._isInPiP()) {
            // 退出画中画
            if (this._docPipWindow) {
                this._exitDocumentPiP();
            } else if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => {});
            } else if (v.webkitSetPresentationMode) {
                v.webkitSetPresentationMode('inline');
            }
            return;
        }
        // 进入画中画：Chrome 优先使用 Document PiP（支持字幕渲染）
        if (typeof window.documentPictureInPicture?.requestWindow === 'function') {
            this._enterDocumentPiP().catch(() => {
                // Document PiP 失败（用户拒绝权限等），降级到标准 PiP
                if (typeof v.requestPictureInPicture === 'function') {
                    v.requestPictureInPicture().catch(() => {});
                }
            });
            return;
        }
        if (typeof v.requestPictureInPicture === 'function') {
            v.requestPictureInPicture().catch(() => {
                if (v.webkitSetPresentationMode
                    && v.webkitSupportsPresentationMode?.('picture-in-picture')) {
                    v.webkitSetPresentationMode('picture-in-picture');
                }
            });
            return;
        }
        if (v.webkitSetPresentationMode
            && v.webkitSupportsPresentationMode?.('picture-in-picture')) {
            v.webkitSetPresentationMode('picture-in-picture');
        }
    }

    /** Document Picture-in-Picture（Chrome 116+）：把 video 移入 PiP 窗口并同步字幕 */
    async _enterDocumentPiP() {
        const v = this.video;
        if (!v) return;

        const pipWin = await window.documentPictureInPicture.requestWindow({
            width: Math.min(v.videoWidth || 640, 640),
            height: Math.min(v.videoHeight || 360, 360),
            disallowReturnToOpener: false,
        });
        this._docPipWindow = pipWin;
        this._pipActive = true;
        this.classList.add('gyp-pip-active');

        // 注入基础样式
        const style = pipWin.document.createElement('style');
        style.textContent = `
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
        `;
        pipWin.document.head.appendChild(style);

        // 把 video 节点 move 到 PiP 文档（不克隆，保持播放状态）
        pipWin.document.body.appendChild(v);

        // 创建字幕 overlay
        const subEl = pipWin.document.createElement('div');
        subEl.id = 'pip-sub';
        pipWin.document.body.appendChild(subEl);
        this._docPipSubOverlay = subEl;

        // 绑定字幕同步：用 cuechange（TextTrack）或 timeupdate 轮询
        this._startDocPipSubtitleSync(subEl);

        // PiP 窗口关闭时自动还原
        pipWin.addEventListener('pagehide', () => this._exitDocumentPiP(), { once: true });
    }

    /** 同步字幕到 Document PiP 覆盖层 */
    _startDocPipSubtitleSync(subEl) {
        // 清理旧监听器
        this._stopDocPipSubtitleSync();
        const v = this.video;

        const renderCue = () => {
            if (!this._docPipSubOverlay) return;
            const idx = this._activeSubtitleIndex;
            const track = idx >= 0 ? this._subtitleTracks[idx] : null;
            if (!track?.cues?.length) {
                this._docPipSubOverlay.textContent = '';
                return;
            }
            const t = v.currentTime;
            const cue = track.cues.find((c) => t >= c.start && t < c.end);
            this._docPipSubOverlay.textContent = cue ? cue.text : '';
        };

        this._docPipCueHandler = renderCue;
        v.addEventListener('timeupdate', renderCue);
        // 立即渲染当前帧字幕
        renderCue();
    }

    _stopDocPipSubtitleSync() {
        if (this._docPipCueHandler) {
            this.video?.removeEventListener('timeupdate', this._docPipCueHandler);
            this._docPipCueHandler = null;
        }
    }

    /** 退出 Document PiP，把 video 移回 Shadow DOM */
    _exitDocumentPiP() {
        this._stopDocPipSubtitleSync();
        this._docPipSubOverlay = null;

        const v = this.video;
        const videoBox = this.els?.videoBox;
        if (v && videoBox && !videoBox.contains(v)) {
            // 把 video 移回原来的位置（gyp-video-box 的第一个子节点）
            videoBox.insertBefore(v, videoBox.firstChild);
        }

        if (this._docPipWindow && !this._docPipWindow.closed) {
            try { this._docPipWindow.close(); } catch { /* ignore */ }
        }
        this._docPipWindow = null;
        this._pipActive = false;
        this.classList.remove('gyp-pip-active');

        // 触发 leavepictureinpicture 兼容逻辑
        this._onExitIsolatedPlayback();
    }

    toggleLock() {
        this._locked = !this._locked;
        this.classList.toggle('gyp-locked', this._locked);
        this.els.lockBtn.innerHTML = this._locked ? icons.unlock : icons.lock;
        if (!this._locked) this._showControls?.();
    }

    get speeds() { return SPEEDS; }

    // ===== UI 辅助 =====
    _updateVolumeUI() {
        const vol = this.video.muted ? 0 : this.video.volume;
        this.els.volumeFill.style.width = `${vol * 100}%`;
        this.els.volumeThumb.style.left = `${vol * 100}%`;
        // 仅在图标档位变化时才重写 SVG，避免拖动时频繁解析
        const tier = vol === 0 ? 'mute' : vol < 0.5 ? 'low' : 'high';
        if (tier !== this._volTier) {
            this._volTier = tier;
            this.els.volumeBtn.innerHTML = tier === 'mute' ? icons.volumeMute
                : tier === 'low' ? icons.volumeLow : icons.volumeHigh;
        }
    }
    _refreshQualityLabel() {
        if (this._qualitySources?.length > 1) {
            const source = this._currentSource();
            this.els.qualityBtn.textContent = source?.quality || source?.label || '清晰度';
            return;
        }
        if (!this.engine) return;
        const cur = this.engine.getCurrentLevel();
        if (cur === -1) {
            this.els.qualityBtn.textContent = '自动';
        } else {
            const lvl = this.engine.getLevels()[cur];
            this.els.qualityBtn.textContent = lvl ? lvl.name : '自动';
        }
    }
    showHint(text) {
        this.els.hint.textContent = text;
        this.els.hint.classList.add('visible');
        clearTimeout(this._hintTimer);
        this._hintTimer = setTimeout(() => this.els.hint.classList.remove('visible'), 700);
    }
    /** 常驻提示（长按倍速等持续手势用）：显示后不自动消失，需手动 hideHint */
    showHintHold(text) {
        clearTimeout(this._hintTimer);
        this.els.hint.textContent = text;
        this.els.hint.classList.add('visible');
    }
    /** 隐藏常驻提示 */
    hideHint() {
        clearTimeout(this._hintTimer);
        this.els.hint.classList.remove('visible');
    }

    /**
     * 展示可操作的错误恢复面板。业务页可用它在所有备用源失败后提供“重新取流/返回详情”等操作。
     * @param {string} message 错误提示文案
     * @param {Array} actions [{id,label,variant}]
     */
    showErrorActions(message, actions = []) {
        this.els.loading?.classList.add('hidden');
        this._showError(message || '视频加载失败，请重试', actions);
    }

    hideErrorActions() {
        this._hideError();
    }

    /**
     * 双击快进/快退涟漪反馈（移动端）。连续双击累加秒数，对标 YouTube/Bilibili。
     * @param {'left'|'right'} side 触发侧
     * @param {number} seconds 本次步进秒数（正数）
     */
    flashDoubleTap(side, seconds) {
        const el = side === 'left' ? this.els.dblTapLeft : this.els.dblTapRight;
        const other = side === 'left' ? this.els.dblTapRight : this.els.dblTapLeft;
        other.classList.add('hidden');
        other.classList.remove('active');
        // 同侧连续触发则累加秒数
        if (this._dblTapSide === side && this._dblTapTimer) {
            this._dblTapAccum += seconds;
        } else {
            this._dblTapAccum = seconds;
        }
        this._dblTapSide = side;
        el.querySelector('.gyp-dbltap-text').textContent = `${this._dblTapAccum} 秒`;
        el.classList.remove('hidden');
        // 重启动画
        el.classList.remove('active');
        void el.offsetWidth;
        el.classList.add('active');
        clearTimeout(this._dblTapTimer);
        this._dblTapTimer = setTimeout(() => {
            el.classList.add('hidden');
            el.classList.remove('active');
            this._dblTapTimer = null;
            this._dblTapSide = null;
        }, 600);
    }

    /**
     * 竖滑亮度/音量可视化指示（移动端）。显示中央胶囊 + 进度条。
     * @param {'volume'|'brightness'} kind 类型
     * @param {number} ratio 0~1 比例（亮度可超过 1，内部夹紧到 0~1 显示）
     * @param {string} iconHtml 图标 SVG
     */
    showVSlide(kind, ratio, iconHtml) {
        const pct = clamp(ratio, 0, 1) * 100;
        this.els.vslideIcon.innerHTML = iconHtml;
        this.els.vslideFill.style.width = `${pct}%`;
        this.els.vslide.classList.remove('hidden');
        clearTimeout(this._vslideTimer);
        this._vslideTimer = setTimeout(() => {
            this.els.vslide.classList.add('hidden');
        }, 600);
    }
    /** 立即隐藏竖滑指示 */
    hideVSlide() {
        clearTimeout(this._vslideTimer);
        this.els.vslide.classList.add('hidden');
    }

    /**
     * 移动端首次手势引导：仅触屏设备、未展示过时显示一次。
     * 由首次播放触发，点击「知道了」或 5 秒后自动消失。
     */
    _maybeShowGuide() {
        if (this._guideShown) return;
        if (!('ontouchstart' in window)) return;       // 仅触屏
        if (getGestureGuideSeen()) return;              // 已看过
        this._guideShown = true;
        markGestureGuideSeen();
        this.els.guide.classList.remove('hidden');
        const close = () => {
            this.els.guide.classList.add('hidden');
            clearTimeout(this._guideTimer);
        };
        this.els.guideBtn.addEventListener('click', close, { once: true, signal: this._ac?.signal });
        this._guideTimer = setTimeout(close, 5000);
    }
    _flashCenter(iconHtml) {
        this.els.centerBtn.innerHTML = iconHtml;
        this.els.center.classList.remove('flash');
        void this.els.center.offsetWidth; // 强制重排以重启动画
        this.els.center.classList.add('flash');
    }
    _showError(msg, actions = null) {
        let el = this.shadowRoot.querySelector('.gyp-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'gyp-error';
            el.innerHTML = `<div class="gyp-error-msg"></div><div class="gyp-error-actions"></div>`;
            this.shadowRoot.appendChild(el);
        }
        el.querySelector('.gyp-error-msg').textContent = msg;
        const actionList = normalizeErrorActions(actions);
        const actionWrap = el.querySelector('.gyp-error-actions');
        actionWrap.innerHTML = actionList.map((action) => (
            `<button class="gyp-error-btn ${action.variant === 'secondary' ? 'secondary' : ''}" data-action="${escapeHtml(action.id)}">${escapeHtml(action.label)}</button>`
        )).join('');
        actionWrap.querySelectorAll('.gyp-error-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const id = button.dataset.action || 'retry';
                if (id === 'retry') {
                    this._hideError();
                    const src = this._activeSourceUrl || this.getAttribute('src');
                    if (src) this.loadStream(src, { ...(this._loadOptions || {}), sourceUrl: src, videoId: this._videoId });
                }
                this.dispatchEvent(new CustomEvent('erroraction', { detail: { id } }));
            });
        });
        el.classList.remove('hidden');
    }
    _hideError() {
        const el = this.shadowRoot.querySelector('.gyp-error');
        if (el) el.classList.add('hidden');
    }

    /** 根据错误详情给出更具体的中文提示 */
    _errorMessage(detail) {
        // hls.js 错误带 type 字段；原生错误是 MediaError（带 code）
        const type = detail?.type;
        if (type && /network/i.test(type)) return '网络连接中断，无法加载视频';
        if (type && /media/i.test(type)) return '视频解码失败，格式可能不受支持';
        const code = detail?.code;
        if (code === 2) return '网络连接中断，无法加载视频';   // MEDIA_ERR_NETWORK
        if (code === 3) return '视频解码失败，格式可能不受支持'; // MEDIA_ERR_DECODE
        if (code === 4) return '视频源不可用或格式不支持';      // MEDIA_ERR_SRC_NOT_SUPPORTED
        return '视频加载失败，请重试';
    }

    // ===== 菜单（倍速/画质/字幕/音轨）=====
    toggleMenu(type) {
        if (this._menuOpen === type) { this.closeMenu(); return; }
        this.toggleEpisodePanel(false); // 与选集面板互斥
        this._menuOpen = type;
        this._showControls?.();
        this.els.menu.classList.remove('hidden');
        this._showSheetMask();
        this.els.menu.innerHTML = this._buildMenu(type);
        this._bindMenuItems(type);
        // 焦点移到首个菜单项，支持键盘导航
        const first = this.els.menu.querySelector('.gyp-menu-item');
        if (first) { first.tabIndex = 0; first.focus(); }
        this._bindMenuKeys();
        this._layoutVideoBox();
    }
    closeMenu() {
        if (!this._menuOpen) return;
        this._menuOpen = false;
        this.els.menu.classList.add('hidden');
        this._syncSheetMask();
        this._layoutVideoBox();
        this._scheduleAutoHide?.();
    }

    /** 显示抽屉遮罩（移动端底部抽屉用，CSS 控制是否可见）*/
    _showSheetMask() {
        this.els.sheetMask?.classList.remove('hidden');
    }
    /** 根据菜单/选集面板是否打开，决定遮罩显隐 */
    _syncSheetMask() {
        const epOpen = !this.els.epPanel.classList.contains('hidden');
        const menuOpen = !this.els.menu.classList.contains('hidden');
        this.els.sheetMask?.classList.toggle('hidden', !epOpen && !menuOpen);
    }
    /** 菜单内方向键导航 + Enter 选择 + Esc 关闭 */
    _bindMenuKeys() {
        const items = Array.from(this.els.menu.querySelectorAll('.gyp-menu-item'));
        items.forEach((item, i) => {
            item.tabIndex = 0;
            item.onkeydown = (e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
                else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
            };
        });
    }
    _buildMenu(type) {
        if (type === 'speed') return this._menuSpeed();
        if (type === 'quality') return this._menuQuality();
        if (type === 'subtitle') return this._menuSubtitle();
        if (type === 'settings') return this._menuSettings();
        return '';
    }
    _menuSpeed() {
        const cur = this.video.playbackRate;
        return `<div class="gyp-menu-title">播放速度</div>` + SPEEDS.map((s) =>
            `<div class="gyp-menu-item ${s === cur ? 'active' : ''}" data-speed="${s}">
                <span>${s === 1 ? '正常' : s + 'x'}</span>${icons.check.replace('<svg', '<svg class="gyp-menu-check"')}
            </div>`).join('');
    }
    _menuQuality() {
        const sources = this._qualitySources || [];
        if (sources.length > 1) {
            const check = icons.check.replace('<svg', '<svg class="gyp-menu-check"');
            let html = `<div class="gyp-menu-title">清晰度</div>`;
            html += sources.map((source, index) =>
                `<div class="gyp-menu-item ${source.url === this._activeSourceUrl ? 'active' : ''}" data-source="${index}">
                    <span>${escapeHtml(source.quality || source.label || `源 ${index + 1}`)}</span>${check}
                </div>`).join('');
            return html;
        }
        const levels = this.engine ? this.engine.getLevels() : [];
        if (levels.length === 0) return `<div class="gyp-menu-title">画质</div><div class="gyp-menu-item active"><span>自动</span></div>`;
        const cur = this.engine.getCurrentLevel();
        const sorted = [...levels].sort((a, b) => b.height - a.height);
        const check = icons.check.replace('<svg', '<svg class="gyp-menu-check"');
        let html = `<div class="gyp-menu-title">画质</div>`;
        html += `<div class="gyp-menu-item ${cur === -1 ? 'active' : ''}" data-level="-1"><span>自动</span>${check}</div>`;
        html += sorted.map((lvl) =>
            `<div class="gyp-menu-item ${cur === lvl.index ? 'active' : ''}" data-level="${lvl.index}">
                <span>${lvl.name}</span>${check}
            </div>`).join('');
        return html;
    }
    _menuSettings() {
        const check = icons.check.replace('<svg', '<svg class="gyp-menu-check"');
        let html = `<div class="gyp-menu-title">设置</div>`;
        const compact = isCompactControlsViewport();
        if (compact) {
            if (!this.els.episodesBtn.classList.contains('hidden')) {
                html += `<div class="gyp-menu-item" data-action="episodes"><span>选集</span></div>`;
            }
            if (!this.els.prevBtn.classList.contains('hidden')) {
                html += `<div class="gyp-menu-item" data-action="prev"><span>上一集</span></div>`;
            }
            if (!this.els.nextBtn.classList.contains('hidden')) {
                html += `<div class="gyp-menu-item" data-action="next"><span>下一集</span></div>`;
            }
        }
        const dmActive = !!this._danmaku?.videoId && !this._danmaku?.disabled;
        if (dmActive) {
            const enabled = this._danmaku.enabled;
            html += `<div class="gyp-menu-title">弹幕</div>`;
            html += `<div class="gyp-menu-item ${enabled ? 'active' : ''}" data-danmaku="1"><span>显示弹幕</span>${check}</div>`;
            html += `<div class="gyp-menu-item ${!enabled ? 'active' : ''}" data-danmaku="0"><span>关闭弹幕</span>${check}</div>`;
            const item = this._danmaku.lastReportable;
            const canReport = item?.id && !String(item.id).startsWith('local:');
            html += `<div class="gyp-menu-item ${canReport ? '' : 'is-disabled'}" data-danmaku-report="1"><span>举报最近弹幕</span></div>`;
        }
        html += `<div class="gyp-menu-title">播放</div>`;
        html += `<div class="gyp-menu-item" data-open-menu="speed"><span>播放速度</span></div>`;
        html += `<div class="gyp-menu-item" data-open-menu="quality"><span>画质</span></div>`;
        if (!this.els.subtitleBtn.classList.contains('hidden')) {
            html += `<div class="gyp-menu-item" data-open-menu="subtitle"><span>字幕 / 音轨</span></div>`;
        }
        return html;
    }
    _menuSubtitle() {
        const tracks = this._subtitleTracks || [];
        const check = icons.check.replace('<svg', '<svg class="gyp-menu-check"');
        const active = this._activeSubtitleIndex;
        let html = `<div class="gyp-menu-title">字幕</div>`;
        html += `<div class="gyp-menu-item ${active < 0 ? 'active' : ''}" data-sub="-1"><span>关闭</span>${check}</div>`;
        html += tracks.map((tr, i) =>
            `<div class="gyp-menu-item ${active === i ? 'active' : ''}" data-sub="${i}">
                <span>${tr.label || tr.lang || `字幕 ${i + 1}`}</span>${check}
            </div>`).join('');

        // 多音轨切换（hls.js 提供）
        const audioTracks = this.engine ? this.engine.getAudioTracks() : [];
        if (audioTracks.length > 1) {
            const curAudio = this.engine.getCurrentAudioTrack();
            html += `<div class="gyp-menu-title">音轨</div>`;
            html += audioTracks.map((tr) =>
                `<div class="gyp-menu-item ${tr.id === curAudio ? 'active' : ''}" data-audio="${tr.id}">
                    <span>${tr.name}</span>${check}
                </div>`).join('');
        }
        return html;
    }
    _bindMenuItems(type) {
        this.els.menu.querySelectorAll('.gyp-menu-item').forEach((item) => {
            item.addEventListener('click', () => {
                if (type === 'speed') this.setRate(parseFloat(item.dataset.speed));
                else if (type === 'quality') {
                    if (item.dataset.source != null) this._applySourceQuality(parseInt(item.dataset.source, 10));
                    else this._applyQuality(parseInt(item.dataset.level, 10));
                }
                else if (type === 'subtitle') {
                    if (item.dataset.audio != null) {
                        this._applyAudioTrack(parseInt(item.dataset.audio, 10));
                        return; // 切音轨不关菜单，方便对比
                    }
                    this._applySubtitle(parseInt(item.dataset.sub, 10));
                }
                else if (type === 'settings') {
                    if (item.classList.contains('is-disabled')) return;
                    if (item.dataset.action === 'prev') {
                        this.dispatchEvent(new CustomEvent('prev'));
                        this.closeMenu();
                        return;
                    }
                    if (item.dataset.action === 'next') {
                        this.dispatchEvent(new CustomEvent('next'));
                        this.closeMenu();
                        return;
                    }
                    if (item.dataset.action === 'episodes') {
                        this.closeMenu();
                        this.toggleEpisodePanel(true);
                        return;
                    }
                    if (item.dataset.openMenu) {
                        this.toggleMenu(item.dataset.openMenu);
                        return;
                    }
                    if (item.dataset.danmaku != null) {
                        const on = item.dataset.danmaku === '1';
                        this._danmaku.setEnabled(on);
                        saveDanmakuEnabled(on);
                        this.els.menu.innerHTML = this._buildMenu('settings');
                        this._bindMenuItems('settings');
                        this._bindMenuKeys();
                        return;
                    }
                    if (item.dataset.danmakuReport != null) {
                        this._reportDanmakuFromMenu();
                    }
                }
                this.closeMenu();
            });
        });
    }
    async _reportDanmakuFromMenu() {
        try {
            await this._danmaku.reportLast();
            this.showHint('已提交弹幕举报');
        } catch (error) {
            this.showHint(error?.message || '弹幕举报失败');
            if (error?.status === 401) {
                this.dispatchEvent(new CustomEvent('danmaku-login', { detail: { action: 'report' } }));
            }
        }
        this.closeMenu();
    }
    _applyQuality(level) {
        if (this.engine) this.engine.setLevel(level);
        const pref = level === -1
            ? { kind: 'hls-level', value: 'auto', label: '自动' }
            : this.engine?.getLevels().find((item) => item.index === level);
        if (pref) {
            saveQualityPreference(pref.kind ? pref : {
                kind: 'hls-level',
                value: String(pref.height || pref.name || level),
                label: pref.name || `${pref.height}p`,
            });
        }
        this._refreshQualityLabel();
    }
    _currentSource() {
        return (this._qualitySources || []).find((source) => source.url === this._activeSourceUrl) || null;
    }
    _applySourceQuality(index) {
        const source = this._qualitySources?.[index];
        if (!source || source.url === this._activeSourceUrl) return;
        const startTime = this.video?.currentTime || 0;
        const wasPlaying = this.video && !this.video.paused && !this.video.ended;
        const opts = {
            ...(this._loadOptions || {}),
            sourceUrl: source.url,
            subtitles: source.subtitles || this._loadOptions?.subtitles || [],
            startTime,
            playAfterLoad: wasPlaying,
        };
        saveQualityPreference({
            kind: 'source',
            value: sourcePreferenceValue(source),
            label: sourcePreferenceLabel(source, '播放源'),
        });
        this.dispatchEvent(new CustomEvent('sourcechange', {
            detail: {
                source,
                sourceUrl: source.url,
                quality: source.quality || source.label || '',
                currentTime: startTime,
                wasPlaying,
            },
        }));
        this.showHint(`切换到 ${source.quality || source.label || '新清晰度'}`);
        this.loadStream(source.url, opts);
    }
    _applySubtitle(idx) {
        this._activeSubtitleIndex = idx;
        if (idx < 0) {
            saveSubtitlePreference({ off: true });
        } else {
            const selected = this._subtitleTracks[idx];
            if (selected) {
                saveSubtitlePreference({
                    lang: selected.lang || '',
                    label: selected.label || '',
                });
            }
        }
        if (this._isolatedVideoPlayback()) this._mountNativeSubtitleTrack();
        else this._syncSubtitleDisplay();
        this._layoutVideoBox();
    }
    _applyAudioTrack(id) {
        if (this.engine) this.engine.setAudioTrack(id);
        const selected = this.engine?.getAudioTracks().find((track) => track.id === id);
        if (selected) {
            saveAudioPreference({
                id: selected.id,
                lang: selected.lang || '',
                name: selected.name || '',
            });
        }
        // 刷新菜单高亮
        if (this._menuOpen === 'subtitle') {
            this.els.menu.innerHTML = this._buildMenu('subtitle');
            this._bindMenuItems('subtitle');
        }
    }

    _applySavedQualityLevel() {
        if (!this.engine || (this._qualitySources || []).length > 1) return;
        const pref = getQualityPreference();
        if (!pref || pref.kind !== 'hls-level') return;
        if (pref.value === 'auto') {
            this.engine.setLevel(-1);
            return;
        }
        const levels = this.engine.getLevels();
        const wanted = String(pref.value || '').toLowerCase();
        const match = levels.find((level) =>
            String(level.height || '').toLowerCase() === wanted ||
            String(level.name || '').toLowerCase() === wanted ||
            String(level.index) === wanted
        );
        if (match) this.engine.setLevel(match.index);
    }

    _applySavedSubtitle() {
        const pref = getSubtitlePreference();
        const tracks = this._subtitleTracks || [];
        if (!pref || tracks.length === 0) return false;
        if (pref.off) {
            this._applySubtitle(-1);
            return true;
        }
        const index = this._subtitleIndexForPreference(pref);
        if (index >= 0) {
            this._applySubtitle(index);
            return true;
        }
        return false;
    }

    _applyPreferredChineseSubtitle() {
        const index = findPreferredSimplifiedChineseSubtitleIndex(this._subtitleTracks || []);
        if (index >= 0) this._applySubtitle(index);
    }

    _applySavedAudioTrack() {
        if (!this.engine) return;
        const pref = getAudioPreference();
        if (!pref) return;
        const tracks = this.engine.getAudioTracks();
        if (tracks.length <= 1) return;
        const wantedLang = String(pref.lang || '').toLowerCase();
        const wantedName = String(pref.name || '').toLowerCase();
        const match = tracks.find((track) =>
            (wantedLang && String(track.lang || '').toLowerCase() === wantedLang) ||
            (wantedName && String(track.name || '').toLowerCase() === wantedName) ||
            Number(track.id) === Number(pref.id)
        );
        if (match) this.engine.setAudioTrack(match.id);
    }

    // ===== 销毁 =====
    destroy() {
        this._saveProgress();
        if (this._pseudoFullscreen) this._exitPseudoFullscreen();
        if (this._mediaResizeObserver) {
            this._mediaResizeObserver.disconnect();
            this._mediaResizeObserver = null;
        }
        if (this._danmaku) {
            this._danmaku.destroy();
            this._danmaku = null;
        }
        if (this.engine) { this.engine.detach(); this.engine = null; }
        if (this._ac) { this._ac.abort(); this._ac = null; }
        this._teardownNativeSubtitleTrack();
        clearTimeout(this._hideTimer);
        clearTimeout(this._hintTimer);
    }

    /** 保存当前进度（已结束或接近结尾时不保存，避免下次误提示从结尾续播） */
    _saveProgress() {
        if (!this.video || this._ended) return;
        const { currentTime, duration } = this.video;
        const nearEnd = duration && duration - currentTime < 10;

        // 抛最终进度事件，让前端在关闭/卸载时也能持久化（看完则 currentTime 归 0）
        this.dispatchEvent(new CustomEvent('progress', {
            detail: {
                videoId: this._videoId,
                currentTime: nearEnd ? 0 : currentTime,
                duration: duration || 0,
                percent: duration ? (currentTime / duration) * 100 : 0,
                final: true,
            },
        }));

        if (this._disableStorage) return; // 前端自管存储
        if (nearEnd) {
            clearPlaybackTime(this._videoId); // 距结尾 <10s 视为看完
            return;
        }
        savePlaybackTime(this._videoId, currentTime);
    }
}

if (!customElements.get('gy-player')) {
    customElements.define('gy-player', GYPlayer);
}

export default GYPlayer;
