// 集成出入口验证 — startTime 起播、progress 事件、disableStorage 不写本地
// 需先启动静态服务：python3 -m http.server 8899

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_URL = 'http://localhost:8899/test/integration.html';
const userDataDir = mkdtempSync(join(tmpdir(), 'gyp-int-'));

const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=9341',
    `--user-data-dir=${userDataDir}`, '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--disable-gpu', PAGE_URL,
]);
let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
    for (let i = 0; i < 30; i++) {
        try {
            const targets = await (await fetch('http://localhost:9341/json')).json();
            const page = targets.find((t) => t.type === 'page' && t.url.includes('integration.html'));
            if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
        } catch { /* not ready */ }
        await sleep(300);
    }
    throw new Error('无法连接 Chrome\n' + chromeErr);
}

function cdp(wsUrl) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        let id = 0;
        const pending = new Map();
        ws.onopen = () => resolve({
            send: (method, params = {}) => new Promise((res, rej) => {
                const msgId = ++id;
                pending.set(msgId, { res, rej });
                ws.send(JSON.stringify({ id: msgId, method, params }));
            }),
            close: () => ws.close(),
        });
        ws.onerror = (e) => reject(new Error('WS: ' + (e.message || '?')));
        ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.id && pending.has(msg.id)) {
                const { res, rej } = pending.get(msg.id);
                pending.delete(msg.id);
                msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
            }
        };
    });
}

async function evalJs(client, expression) {
    const r = await client.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('页面异常: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    return r.result.value;
}

async function main() {
    const client = await cdp(await getWsUrl());
    await client.send('Runtime.enable');
    await sleep(8000); // 从头播放，等足够时间累积多次 progress（SAVE_INTERVAL=5s）

    // progress 事件已抛出（从头播放 8 秒应至少 1 次），且 detail 字段完整
    const progressOk = await evalJs(client, `(() => {
        const arr = window.__progressEvents || [];
        if (arr.length === 0) return false;
        const d = arr[arr.length - 1];
        return typeof d.currentTime === 'number'
            && typeof d.duration === 'number'
            && typeof d.percent === 'number'
            && d.videoId === 'integration-test';
    })()`);

    // disableStorage：localStorage 不应写入该视频的进度键
    const noLocalWrite = await evalJs(client, `localStorage.getItem('gyp_time_integration-test') === null`);

    // 单独验证 startTime：二次加载并检查 video.currentTime 被设到 ~30
    await evalJs(client, `window.__loadWithStartTime()`);
    await sleep(2500);
    const startedAt30 = await evalJs(client, `window.__player.video.currentTime >= 28`);

    client.close();
    chrome.kill();

    const results = [
        ['startTime 起播位置生效', startedAt30 === true],
        ['progress 事件抛出且字段完整', progressOk === true],
        ['disableStorage 时不写本地存储', noLocalWrite === true],
    ];
    let allPass = true;
    console.log('\n===== 集成出入口验证 =====');
    for (const [name, ok] of results) {
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
        if (!ok) allPass = false;
    }
    console.log('==========================\n');
    process.exit(allPass ? 0 : 1);
}

main().catch((err) => { console.error('验证失败:', err.message); chrome.kill(); process.exit(1); });
