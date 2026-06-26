/** VTT 解析与自定义字幕层布局（YouTube 式：跟画面高度 + 控制栏显隐） */

export function parseVttTime(raw) {
    if (!raw) return 0;
    const parts = String(raw).trim().split(':');
    let h = 0;
    let m = 0;
    let s = 0;
    if (parts.length === 3) {
        h = +parts[0];
        m = +parts[1];
        s = parseFloat(parts[2]);
    } else if (parts.length === 2) {
        m = +parts[0];
        s = parseFloat(parts[1]);
    } else {
        s = parseFloat(parts[0]);
    }
    return h * 3600 + m * 60 + s;
}

export function parseVtt(text) {
    const cues = [];
    const lines = text.replace(/\r/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length) {
        let line = lines[i].trim();
        if (!line || line === 'WEBVTT' || line.startsWith('NOTE') || line.startsWith('X-TIMESTAMP')) {
            i += 1;
            continue;
        }
        let timeLine = line;
        if (!timeLine.includes('-->')) {
            i += 1;
            timeLine = (lines[i] || '').trim();
        }
        if (!timeLine.includes('-->')) {
            i += 1;
            continue;
        }
        const [startRaw, endRaw] = timeLine.split('-->');
        const start = parseVttTime(startRaw);
        const end = parseVttTime(endRaw);
        i += 1;
        const textLines = [];
        while (i < lines.length && lines[i].trim()) {
            textLines.push(lines[i].trim());
            i += 1;
        }
        cues.push({ start, end, text: textLines.join('\n') });
        i += 1;
    }
    return cues;
}

export async function fetchVttCues(url) {
    const { cues } = await fetchVttContent(url);
    return cues;
}

export async function fetchVttContent(url) {
    if (!url) return { cues: [], text: '' };
    try {
        const res = await fetch(url);
        if (!res.ok) return { cues: [], text: '' };
        const text = await res.text();
        return { cues: parseVtt(text), text };
    } catch {
        return { cues: [], text: '' };
    }
}

export function formatVttTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}`;
}

export function buildVttBlobUrl(cues, vttText = '') {
    const body = (typeof vttText === 'string' && vttText.trim())
        ? vttText
        : (() => {
            const lines = ['WEBVTT', ''];
            for (const cue of normalizeCueTimeline(cues)) {
                lines.push(`${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}`);
                lines.push(cue.text);
                lines.push('');
            }
            return lines.join('\n');
        })();
    return URL.createObjectURL(new Blob([body], { type: 'text/vtt' }));
}

export function normalizeCueTimeline(cues) {
    if (!Array.isArray(cues) || cues.length === 0) return [];
    return cues.map((cue, index) => {
        const nextStart = index + 1 < cues.length ? cues[index + 1].start : null;
        let end = cue.end;
        if (nextStart != null && end > nextStart) end = nextStart;
        if (end <= cue.start) end = cue.start + 0.001;
        return { start: cue.start, end, text: cue.text };
    });
}

export function subtitleFontSize(videoHeight, scale = 1) {
    return Math.max(13, Math.min(26, Math.round(videoHeight * 0.042))) * scale;
}

/** 元素顶边相对 host 的 Y（px），不可见时返回 null */
export function elementTopRelativeToHost(el, hostEl) {
    if (!el || !hostEl) return null;
    const er = el.getBoundingClientRect();
    const hr = hostEl.getBoundingClientRect();
    if (er.width === 0 && er.height === 0) return null;
    return er.top - hr.top;
}

/** 菜单是否与字幕区域（画面底部居中）发生重叠 */
export function menuOverlapsSubtitle({
    menuEl,
    hostEl,
    centerX,
    bottomY,
    regionHalfWidth = 0,
}) {
    if (!menuEl || !hostEl) return false;
    const mr = menuEl.getBoundingClientRect();
    const hr = hostEl.getBoundingClientRect();
    if (mr.width < 1 || mr.height < 1) return false;
    const half = Math.max(72, Number(regionHalfWidth) || 0);
    const menuLeft = mr.left - hr.left;
    const menuRight = menuLeft + mr.width;
    const menuTop = mr.top - hr.top;
    const menuBottom = menuTop + mr.height;
    const subLeft = centerX - half;
    const subRight = centerX + half;
    const subTop = bottomY - 56;
    const subBottom = bottomY + 4;
    return subLeft < menuRight && subRight > menuLeft && subTop < menuBottom && subBottom > menuTop;
}

/**
 * 字幕锚点 Y（overlay 的 top，配合 translateY(-100%) 即字幕底边）。
 * 默认贴在画面底边；仅当会与控制栏/菜单重叠时才上移。
 */
export function computeSubtitleAnchorY({
    videoBottom,
    videoHeight,
    controlsTop = null,
    menuTop = null,
    menuOverlaps = false,
    controlsVisible = false,
    gap = 12,
}) {
    const naturalY = videoBottom - videoHeight * 0.05;

    if (menuOverlaps && menuTop != null && naturalY > menuTop - gap) {
        return menuTop - gap;
    }
    if (controlsVisible && controlsTop != null && naturalY > controlsTop - gap) {
        return controlsTop - gap;
    }
    return naturalY;
}

/**
 * 计算 letterbox（contain）或裁切铺满（cover）时的画面区域。
 */
export function computeVideoBoxRect({ vw, vh, cw, ch, fillScreen = false }) {
    if (!vw || !vh || !cw || !ch) {
        return { left: 0, top: 0, width: cw, height: ch };
    }

    const ar = vw / vh;
    const car = cw / ch;
    if (fillScreen) {
        if (car > ar) {
            const width = cw;
            const height = width / ar;
            return { left: 0, top: (ch - height) / 2, width, height };
        }
        const height = ch;
        const width = height * ar;
        return { left: (cw - width) / 2, top: 0, width, height };
    }

    if (car > ar) {
        const height = ch;
        const width = height * ar;
        return { left: (cw - width) / 2, top: 0, width, height };
    }
    const width = cw;
    const height = width / ar;
    return { left: 0, top: (ch - height) / 2, width, height };
}

/**
 * 计算 letterbox 画面区域，并定位自定义字幕层。
 * 控制栏可见时仅在与字幕重叠才上移；沉浸态时贴近画面底边。
 */
export function layoutVideoBox({
    video,
    mediaEl,
    videoBoxEl,
    overlayEl,
    hostEl,
    bottomEl,
    menuEl,
    scale = 1,
    immersed = false,
    menuOpen = false,
    locked = false,
    fillScreen = false,
}) {
    if (!video || !mediaEl || !videoBoxEl) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cw = mediaEl.clientWidth;
    const ch = mediaEl.clientHeight;

    const applyFont = (height) => {
        const px = subtitleFontSize(height, scale);
        videoBoxEl.style.setProperty('--gyp-subtitle-size', `${px}px`);
        if (overlayEl) overlayEl.style.fontSize = `${px}px`;
    };

    const positionOverlay = (left, top, width, height) => {
        if (!overlayEl) return;
        const videoBottom = top + height;
        const naturalY = videoBottom - height * 0.05;
        const centerX = left + width / 2;
        const overlapsMenu = menuOpen && menuOverlapsSubtitle({
            menuEl,
            hostEl,
            centerX,
            bottomY: naturalY,
            regionHalfWidth: width * 0.46,
        });
        const controlsVisible = !immersed && !locked && (!menuOpen || !overlapsMenu);
        const controlsTop = controlsVisible
            ? elementTopRelativeToHost(bottomEl, hostEl)
            : null;
        const menuTop = overlapsMenu ? elementTopRelativeToHost(menuEl, hostEl) : null;
        const anchorY = computeSubtitleAnchorY({
            videoBottom,
            videoHeight: height,
            controlsTop,
            menuTop,
            menuOverlaps: overlapsMenu,
            controlsVisible,
        });

        overlayEl.style.left = `${centerX}px`;
        overlayEl.style.transform = 'translateX(-50%) translateY(-100%)';
        overlayEl.style.top = `${anchorY}px`;
        overlayEl.style.bottom = 'auto';
        overlayEl.style.maxWidth = `${width * 0.92}px`;
        overlayEl.style.width = 'max-content';
    };

    if (!vw || !vh) {
        videoBoxEl.style.left = '0';
        videoBoxEl.style.top = '0';
        videoBoxEl.style.width = '100%';
        videoBoxEl.style.height = '100%';
        applyFont(ch);
        if (overlayEl) {
            const naturalBottom = Math.round(ch * 0.05);
            const naturalAnchorY = ch - naturalBottom;
            const centerX = cw / 2;
            const overlapsMenu = menuOpen && menuOverlapsSubtitle({
                menuEl,
                hostEl,
                centerX,
                bottomY: naturalAnchorY,
                regionHalfWidth: cw * 0.46,
            });
            const controlsVisible = !immersed && !locked && (!menuOpen || !overlapsMenu);
            const controlsTop = controlsVisible
                ? elementTopRelativeToHost(bottomEl, hostEl)
                : null;
            const menuTop = overlapsMenu ? elementTopRelativeToHost(menuEl, hostEl) : null;
            let bottomPx = naturalBottom;
            if (overlapsMenu && menuTop != null) {
                const overlap = naturalAnchorY > menuTop - 12;
                if (overlap) bottomPx = Math.max(naturalBottom, ch - menuTop + 12);
            } else if (controlsVisible && controlsTop != null) {
                if (naturalAnchorY > controlsTop - 12) {
                    bottomPx = Math.max(naturalBottom, ch - controlsTop + 12);
                }
            }
            overlayEl.style.left = '50%';
            overlayEl.style.maxWidth = '92%';
            overlayEl.style.width = 'max-content';
            overlayEl.style.transform = 'translateX(-50%)';
            overlayEl.style.top = 'auto';
            overlayEl.style.bottom = `${bottomPx}px`;
        }
        return;
    }

    // 计算视频画面在容器内的精确位置（contain 语义：始终贴满至少两边，不裁剪）
    // fillScreen 模式也使用相同逻辑，放弃 cover 裁剪，确保四周不同时出现黑边
    video.style.objectFit = '';

    const ar = vw / vh;
    const car = cw / ch;
    let width;
    let height;
    let left;
    let top;
    if (car > ar) {
        // 容器比视频更宽 → 高度填满，左右留黑边
        height = ch;
        width = height * ar;
        left = (cw - width) / 2;
        top = 0;
    } else {
        // 容器比视频更高（或等比）→ 宽度填满，上下留黑边
        width = cw;
        height = width / ar;
        left = 0;
        top = (ch - height) / 2;
    }

    videoBoxEl.style.left = `${left}px`;
    videoBoxEl.style.top = `${top}px`;
    videoBoxEl.style.width = `${width}px`;
    videoBoxEl.style.height = `${height}px`;
    applyFont(height);
    positionOverlay(left, top, width, height);
}

export function normalizeSubtitleLang(lang = '') {
    return String(lang).trim().replace(/_/g, '-').toLowerCase();
}

export function isTraditionalChineseSubtitle(lang = '', label = '') {
    const normalizedLang = normalizeSubtitleLang(lang);
    const normalizedLabel = String(label).trim().toLowerCase();
    if (['zht', 'cht', 'yue', 'can'].includes(normalizedLang)) return true;
    if (
        normalizedLang.startsWith('zh-hant')
        || normalizedLang.startsWith('zh-tw')
        || normalizedLang.startsWith('zh-hk')
        || normalizedLang.startsWith('zh-mo')
    ) return true;
    return normalizedLabel.includes('繁体')
        || normalizedLabel.includes('繁體')
        || normalizedLabel.includes('粤语')
        || normalizedLabel.includes('粵語');
}

export function isSimplifiedChineseSubtitle(lang = '', label = '') {
    if (isTraditionalChineseSubtitle(lang, label)) return false;
    const normalizedLang = normalizeSubtitleLang(lang);
    const normalizedLabel = String(label).trim().toLowerCase();
    if (normalizedLang === 'zhs' || normalizedLang === 'cmn-hans') return true;
    if (['zh', 'chi', 'zho', 'cmn'].includes(normalizedLang)) return true;
    if (
        normalizedLang.startsWith('zh-hans')
        || normalizedLang.startsWith('zh-cn')
        || normalizedLang.startsWith('zh-sg')
    ) return true;
    if (normalizedLang.startsWith('zh') && !normalizedLang.includes('hant')) return true;
    return normalizedLabel.includes('简体')
        || normalizedLabel.includes('中文')
        || normalizedLabel.includes('chinese');
}

function isChineseSubtitleLang(lang = '', label = '') {
    return isSimplifiedChineseSubtitle(lang, label) || isTraditionalChineseSubtitle(lang, label);
}

export function isAnyChineseSubtitle(lang = '', label = '') {
    return isSimplifiedChineseSubtitle(lang, label) || isTraditionalChineseSubtitle(lang, label);
}

export function sortSubtitleInputs(subs = []) {
    return [...subs].sort((a, b) => {
        const rank = (sub) => {
            const label = sub.label || sub.name || '';
            const lang = sub.lang || '';
            if (isSimplifiedChineseSubtitle(lang, label)) return 0;
            if (isTraditionalChineseSubtitle(lang, label)) return 1;
            if (isChineseSubtitleLang(lang, label)) return 2;
            return 3;
        };
        return rank(a) - rank(b);
    });
}

export function findPreferredSimplifiedChineseSubtitleIndex(tracks = []) {
    const simplified = tracks.findIndex((track) => isSimplifiedChineseSubtitle(track.lang, track.label));
    if (simplified >= 0) return simplified;
    return tracks.findIndex((track) => isChineseSubtitleLang(track.lang, track.label));
}

export function findPreferredChineseSubtitleIndex(tracks = []) {
    return findPreferredSimplifiedChineseSubtitleIndex(tracks);
}
