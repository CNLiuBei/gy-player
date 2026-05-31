// 纯逻辑单元测试（无 DOM）— 验证工具函数与关键判定
// 运行：node test/logic.test.mjs
// 注：utils.js 顶层读取 navigator，Node 环境先注入最小桩

// Node 25 的 navigator 为只读全局，直接复用；仅补齐 document/window 桩
if (!globalThis.document) globalThis.document = { createElement: () => ({ canPlayType: () => '' }) };
if (!globalThis.window) globalThis.window = {};

const { formatTime, clamp } = await import('../src/utils.js');

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

console.log(`\n通过 ${pass}，失败 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
