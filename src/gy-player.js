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

import { styles } from './styles.js';
import { icons } from './icons.js';
import { PlaybackEngine } from './engine.js';
import { formatTime, clamp, supportsPiP, supportsFullscreen, isMobile } from './utils.js';
import {
    savePlaybackTime, getPlaybackTime, clearPlaybackTime,
    saveVolume, getVolume, saveMuted, getMuted, saveRate, getRate,
    markGestureGuideSeen, getGestureGuideSeen,
} from './storage.js';
import { bindControls } from './controls.js';
import { bindGestures } from './gestures.js';
import { bindKeyboard } from './keyboard.js';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const RESUME_THRESHOLD = 15;   // 超过此秒数才提示续播
const SAVE_INTERVAL = 5;       // 进度保存间隔（秒）
const HIDE_DELAY = 3000;       // 控件自动隐藏延迟（毫秒）
const SEEK_STEP = 10;          // 快进/快退步长（秒）
const EP_SEG_SIZE = 60;        // 选集分段容量（超过则分段，对标 B站长剧）

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
        this._ac = null;         // AbortController：统一卸载事件
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
            <video class="gyp-video" id="video" playsinline webkit-playsinline ${poster ? `poster="${poster}"` : ''}></video>
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
                    <div class="gyp-spacer"></div>
                    <button class="gyp-btn gyp-btn-text hidden" id="episodesBtn" aria-label="选集">选集</button>
                    <button class="gyp-btn gyp-btn-text" id="speedBtn" aria-label="倍速">1x</button>
                    <button class="gyp-btn gyp-btn-text" id="qualityBtn" aria-label="画质">自动</button>
                    <button class="gyp-btn hidden" id="subtitleBtn" aria-label="字幕">${icons.subtitle}</button>
                    <button class="gyp-btn ${supportsPiP ? '' : 'hidden'}" id="pipBtn" aria-label="画中画">${icons.pip}</button>
                    <button class="gyp-btn ${supportsFullscreen ? '' : 'hidden'}" id="fsBtn" aria-label="全屏">${icons.fullscreen}</button>
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
            subtitleBtn: $('subtitleBtn'), pipBtn: $('pipBtn'), fsBtn: $('fsBtn'),
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
        v.addEventListener('waiting', () => this.els.buffering.classList.remove('hidden'), sig);
        v.addEventListener('playing', () => this.els.buffering.classList.add('hidden'), sig);
        v.addEventListener('canplay', () => this.els.buffering.classList.add('hidden'), sig);
        v.addEventListener('loadedmetadata', () => {
            this.els.timeDuration.textContent = formatTime(v.duration);
        }, sig);
        v.addEventListener('timeupdate', () => this._onTimeUpdate(), sig);
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
     */
    async loadStream(url, opts = {}) {
        const gen = ++this._loadGen;
        this._ended = false;
        this._lastSaveTime = -1;
        this._disableStorage = !!opts.disableStorage;
        this.els.loading.classList.remove('hidden'); // 显示首屏加载态
        if (opts.title != null) this.setTitle(opts.title);
        this._videoId = opts.videoId || this.getAttribute('video-id') || url;
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
                if (startTime > 0) this.video.currentTime = startTime;
                if (this.hasAttribute('autoplay')) this.video.play().catch(() => {});
                this._refreshQualityLabel();
                this._refreshTrackButton();
            },
            onError: (detail, fatal) => {
                if (gen !== this._loadGen) return;
                if (fatal) {
                    this.els.loading.classList.add('hidden');
                    this._showError(this._errorMessage(detail));
                }
                this.dispatchEvent(new CustomEvent('error', { detail }));
            },
            onLevelSwitched: () => this._refreshQualityLabel(),
        }, {
            preferHDR: opts.preferHDR === true,
            allowedVideoRanges: opts.allowedVideoRanges,
        });

        await this.engine.load(url);
        if (gen !== this._loadGen) return;
        this._loadSubtitles(opts.subtitles || []);
    }

    /** 加载外挂字幕轨道 */
    _loadSubtitles(subtitles) {
        this.video.querySelectorAll('track').forEach((tr) => tr.remove());
        subtitles.forEach((sub) => {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = sub.label || sub.lang || '字幕';
            track.srclang = sub.lang || 'und';
            track.src = sub.url;
            if (sub.default) track.default = true;
            this.video.appendChild(track);
        });
        this.els.subtitleBtn.classList.toggle('hidden', subtitles.length === 0);
        this._hasSubtitles = subtitles.length > 0;
    }

    /** 根据字幕 + 音轨情况决定是否显示「字幕/音轨」按钮 */
    _refreshTrackButton() {
        const hasSubs = (this.video.textTracks?.length || 0) > 0;
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

    // ===== 自动隐藏控件 =====
    _setupAutoHide() {
        const show = () => {
            if (this._locked) return;
            this.classList.remove('gyp-immersed');
            clearTimeout(this._hideTimer);
            this._hideTimer = setTimeout(() => {
                // 暂停态 / 菜单打开 / 鼠标悬停控制栏时不隐藏
                if (!this.video.paused && !this._menuOpen && !this._controlsHovered) {
                    this.classList.add('gyp-immersed');
                }
            }, HIDE_DELAY);
        };
        this._showControls = show;
        const sig = { signal: this._ac.signal };
        this.shadowRoot.addEventListener('mousemove', show, sig);
        this.video.addEventListener('pause', show, sig);
        show();
    }

    /** 切换控件显隐（移动端单击触发） */
    toggleControls() {
        if (this._locked) return;
        if (this.classList.contains('gyp-immersed')) {
            this._showControls?.();
        } else {
            clearTimeout(this._hideTimer);
            this.classList.add('gyp-immersed');
        }
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
    seek(time) { this.video.currentTime = clamp(time, 0, this.video.duration || 0); }
    seekBy(delta) {
        this.video.currentTime = clamp(this.video.currentTime + delta, 0, this.video.duration || 0);
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
            this._showSheetMask();
            // 滚动到当前集
            const active = this.els.epList.querySelector('.gyp-ep-item.active');
            active?.scrollIntoView({ block: 'center' });
        }
        this._syncSheetMask();
    }

    toggleFullscreen() {
        const doc = document;
        if (doc.fullscreenElement || doc.webkitFullscreenElement) {
            (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
        } else if (this.requestFullscreen) {
            this.requestFullscreen()
                .then(() => this._lockLandscape())
                .catch(() => this._iosFullscreen());
        } else {
            this._iosFullscreen();
        }
    }
    /** iOS 不支持元素全屏，回退到 video 原生全屏 */
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

    togglePiP() {
        if (!supportsPiP) return;
        if (document.pictureInPictureElement) document.exitPictureInPicture();
        else this.video.requestPictureInPicture().catch(() => {});
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
    _showError(msg) {
        let el = this.shadowRoot.querySelector('.gyp-error');
        if (!el) {
            el = document.createElement('div');
            el.className = 'gyp-error';
            el.innerHTML = `<div class="gyp-error-msg"></div><button class="gyp-error-btn">重试</button>`;
            el.querySelector('.gyp-error-btn').onclick = () => {
                this._hideError();
                const src = this.getAttribute('src');
                if (src) this.loadStream(src, { videoId: this._videoId });
            };
            this.shadowRoot.appendChild(el);
        }
        el.querySelector('.gyp-error-msg').textContent = msg;
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
        this.els.menu.classList.remove('hidden');
        this._showSheetMask();
        this.els.menu.innerHTML = this._buildMenu(type);
        this._bindMenuItems(type);
        // 焦点移到首个菜单项，支持键盘导航
        const first = this.els.menu.querySelector('.gyp-menu-item');
        if (first) { first.tabIndex = 0; first.focus(); }
        this._bindMenuKeys();
    }
    closeMenu() {
        if (!this._menuOpen) return;
        this._menuOpen = false;
        this.els.menu.classList.add('hidden');
        this._syncSheetMask();
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
    _menuSubtitle() {
        const tracks = Array.from(this.video.textTracks || []);
        const check = icons.check.replace('<svg', '<svg class="gyp-menu-check"');
        const anyShowing = tracks.some((tr) => tr.mode === 'showing');
        let html = `<div class="gyp-menu-title">字幕</div>`;
        html += `<div class="gyp-menu-item ${!anyShowing ? 'active' : ''}" data-sub="-1"><span>关闭</span>${check}</div>`;
        html += tracks.map((tr, i) =>
            `<div class="gyp-menu-item ${tr.mode === 'showing' ? 'active' : ''}" data-sub="${i}">
                <span>${tr.label || tr.language || `字幕 ${i + 1}`}</span>${check}
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
                else if (type === 'quality') this._applyQuality(parseInt(item.dataset.level, 10));
                else if (type === 'subtitle') {
                    if (item.dataset.audio != null) {
                        this._applyAudioTrack(parseInt(item.dataset.audio, 10));
                        return; // 切音轨不关菜单，方便对比
                    }
                    this._applySubtitle(parseInt(item.dataset.sub, 10));
                }
                this.closeMenu();
            });
        });
    }
    _applyQuality(level) {
        if (this.engine) this.engine.setLevel(level);
        this._refreshQualityLabel();
    }
    _applySubtitle(idx) {
        const tracks = Array.from(this.video.textTracks || []);
        tracks.forEach((tr, i) => { tr.mode = i === idx ? 'showing' : 'hidden'; });
    }
    _applyAudioTrack(id) {
        if (this.engine) this.engine.setAudioTrack(id);
        // 刷新菜单高亮
        if (this._menuOpen === 'subtitle') {
            this.els.menu.innerHTML = this._buildMenu('subtitle');
            this._bindMenuItems('subtitle');
        }
    }

    // ===== 销毁 =====
    destroy() {
        this._saveProgress();
        if (this.engine) { this.engine.detach(); this.engine = null; }
        if (this._ac) { this._ac.abort(); this._ac = null; }
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
