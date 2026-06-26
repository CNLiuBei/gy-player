// 纯逻辑单元测试（无 DOM）— 验证工具函数与关键判定
// 运行：node test/logic.test.mjs
// 注：utils.js 顶层读取 navigator，Node 环境先注入最小桩

// Node 25 的 navigator 为只读全局，直接复用；仅补齐 document/window 桩
if (!globalThis.document) globalThis.document = { createElement: () => ({ canPlayType: () => '' }) };
if (!globalThis.window) globalThis.window = {};

const { formatTime, clamp, bufferedAheadSeconds } = await import('../src/utils.js');
const { getUpcomingFragmentUrls } = await import('../src/parallel-prefetch-loader.js');
const { parseVttTime, parseVtt, subtitleFontSize, computeSubtitleAnchorY, menuOverlapsSubtitle, normalizeCueTimeline, formatVttTime, findPreferredSimplifiedChineseSubtitleIndex, isSimplifiedChineseSubtitle, isAnyChineseSubtitle, sortSubtitleInputs, computeVideoBoxRect } = await import('../src/subtitles.js');

let pass = 0, fail = 0;
function eq(actual, expected, name) {
    if (actual === expected) { pass++; }
    else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}

// formatTime
eq(formatTime(0), '00:00', 'formatTime(0)');
eq(formatTime(5), '00:05', 'formatTime(5)');
eq(formatTime(65), '01:05', 'formatTime(65)');
eq(formatTime(600), '10:00', 'formatTime(600)');
eq(formatTime(3661), '1:01:01', 'formatTime(3661)');
eq(formatTime(NaN), '00:00', 'formatTime(NaN)');
eq(formatTime(-5), '00:00', 'formatTime(-5)');
eq(formatTime(Infinity), '00:00', 'formatTime(Infinity)');

// clamp
eq(clamp(5, 0, 10), 5, 'clamp mid');
eq(clamp(-3, 0, 10), 0, 'clamp low');
eq(clamp(20, 0, 10), 10, 'clamp high');
eq(clamp(NaN, 0, 10), 0, 'clamp NaN');

// HLS 判定正则（与 engine.js 保持一致）
const isHls = (url) => /\.m3u8(\?|$)/i.test(url);
eq(isHls('https://x.com/a.m3u8'), true, 'm3u8');
eq(isHls('https://x.com/a.m3u8?token=1'), true, 'm3u8 with query');
eq(isHls('https://x.com/a.mp4'), false, 'mp4');
eq(isHls('https://x.com/a.M3U8'), true, 'M3U8 uppercase');

// VTT 时间解析（MM:SS.mmm 不能走 isNaN 整串判断）
eq(parseVttTime('00:56.120'), 56.12, 'parseVttTime mm:ss.mmm');
eq(parseVttTime('01:02:03.500'), 3723.5, 'parseVttTime hh:mm:ss');

const cues = parseVtt(`WEBVTT

00:00.000 --> 00:01.000
Hello

00:01.000 --> 00:02.000
World
`);
eq(cues.length, 2, 'parseVtt cue count');
eq(cues[0].text, 'Hello', 'parseVtt first cue');
eq(Math.abs(cues[1].start - 1) < 0.001, true, 'parseVtt second start');

eq(subtitleFontSize(400), 17, 'subtitleFontSize 400px');
eq(subtitleFontSize(100), 13, 'subtitleFontSize min clamp');
eq(subtitleFontSize(800), 26, 'subtitleFontSize max clamp');

const { nextDanmakuWindowEnd, itemKey } = await import('../src/danmaku.js');
eq(nextDanmakuWindowEnd(0), 180, 'danmaku window end at start');
eq(nextDanmakuWindowEnd(130), 300, 'danmaku window end mid playback');
eq(itemKey({ id: 'a1', content: 'hi' }), 'a1', 'danmaku item key prefers id');

// 字幕仅在与控制栏重叠时才上移
eq(computeSubtitleAnchorY({
    videoBottom: 300,
    videoHeight: 300,
    controlsTop: 520,
    controlsVisible: true,
}), 285, 'subtitle stays when controls sit in letterbox below video');
eq(computeSubtitleAnchorY({
    videoBottom: 600,
    videoHeight: 600,
    controlsTop: 520,
    controlsVisible: true,
}), 508, 'subtitle lifts when controls overlap picture');

const mirrored = normalizeCueTimeline([
    { start: 0, end: 5, text: 'a' },
    { start: 2, end: 4, text: 'b' },
]);
eq(mirrored.length, 2, 'normalizeCueTimeline count');
eq(mirrored[0].end, 2, 'normalizeCueTimeline clamps end to next start');
eq(formatVttTime(65.5), '00:01:05.500', 'formatVttTime mm:ss.mmm');
eq(computeSubtitleAnchorY({
    videoBottom: 400,
    videoHeight: 360,
    menuTop: 350,
    menuOverlaps: true,
}), 338, 'subtitle lifts for menu overlap');
eq(computeSubtitleAnchorY({
    videoBottom: 800,
    videoHeight: 720,
    menuTop: 420,
    menuOverlaps: false,
    controlsTop: 820,
    controlsVisible: true,
}), 764, 'subtitle ignores side menu when it does not overlap');

eq(menuOverlapsSubtitle({
    menuEl: { getBoundingClientRect: () => ({ left: 1100, top: 420, width: 180, height: 360 }) },
    hostEl: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 900 }) },
    centerX: 640,
    bottomY: 810,
    regionHalfWidth: 320,
}), false, 'corner menu on the right does not overlap centered subtitles');
eq(menuOverlapsSubtitle({
    menuEl: { getBoundingClientRect: () => ({ left: 0, top: 520, width: 390, height: 280 }) },
    hostEl: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 390, height: 800 }) },
    centerX: 195,
    bottomY: 760,
    regionHalfWidth: 180,
}), true, 'bottom sheet menu overlaps centered subtitles');

// bufferedAheadSeconds
const mockVideo = {
    currentTime: 10,
    buffered: {
        length: 1,
        start: (i) => (i === 0 ? 0 : 0),
        end: (i) => (i === 0 ? 25 : 0),
    },
};
eq(bufferedAheadSeconds(mockVideo), 15, 'buffered ahead from current time');
mockVideo.currentTime = 30;
eq(bufferedAheadSeconds(mockVideo), 0, 'no buffer at playhead');

// getUpcomingFragmentUrls
const mockHls = {
    levels: [{
        details: {
            fragments: [
                { sn: 1, url: 'https://cdn/a-1.m4s' },
                { sn: 2, url: 'https://cdn/a-2.m4s' },
                { sn: 3, url: 'https://cdn/a-3.m4s' },
                { sn: 4, url: 'https://cdn/a-4.m4s' },
            ],
        },
    }],
};
eq(JSON.stringify(getUpcomingFragmentUrls(mockHls, { sn: 1, level: 0 }, 2)),
    JSON.stringify(['https://cdn/a-3.m4s', 'https://cdn/a-4.m4s']),
    'prefetch skips immediate next fragment');
eq(getUpcomingFragmentUrls(mockHls, { sn: 4, level: 0 }, 3).length, 0, 'no urls after last frag');

eq(isSimplifiedChineseSubtitle('chi', '中文'), true, 'chi + 中文 => simplified');
eq(isSimplifiedChineseSubtitle('zho', 'Chinese'), true, 'zho => simplified');
eq(isSimplifiedChineseSubtitle('zhs', ''), true, 'zhs => simplified');
eq(isSimplifiedChineseSubtitle('zh-Hant', '繁体中文'), false, 'traditional not simplified');
eq(findPreferredSimplifiedChineseSubtitleIndex([
    { lang: 'en', label: 'English' },
    { lang: 'zh-Hant', label: '繁体中文' },
    { lang: 'chi', label: '简体中文' },
]), 2, 'prefer simplified over traditional');

eq(isSimplifiedChineseSubtitle('und', '简体'), true, 'label 简体 without lang');
eq(isAnyChineseSubtitle('ko', '한국어'), false, 'korean is not chinese');
eq(isAnyChineseSubtitle('zh-Hans', '简体'), true, '简体 label is chinese');

const sorted = sortSubtitleInputs([
    { lang: 'ko', label: '한국어' },
    { lang: 'en', label: 'English' },
    { lang: 'zh-Hans', label: '简体' },
    { lang: 'zh-Hant', label: '繁體' },
]);
eq(sorted[0].label, '简体', 'sort puts simplified first');
eq(sorted[1].label, '繁體', 'sort puts traditional second');

const containPortrait = computeVideoBoxRect({ vw: 1920, vh: 1080, cw: 390, ch: 844, fillScreen: false });
eq(containPortrait.left, 0, 'contain portrait letterbox left');
eq(Math.round(containPortrait.top), 312, 'contain portrait letterbox top');

const coverPortrait = computeVideoBoxRect({ vw: 1920, vh: 1080, cw: 390, ch: 844, fillScreen: true });
eq(Math.round(coverPortrait.left) < 0, true, 'cover portrait crops horizontal overflow');
eq(coverPortrait.top, 0, 'cover portrait fills height');

console.log(`\n通过 ${pass}，失败 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
