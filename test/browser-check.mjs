// 真实浏览器播放验证 — 用 headless Chrome 经 CDP 加载 demo 页，
// 播放真实 Mux CMAF 流，验证：组件注册、引擎选择、currentTime 推进、画质解析。
//
// 运行前需启动静态服务：python3 -m http.server 8899
// 运行：node test/browser-check.mjs

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_URL = 'http://localhost:8899/test/runtime.html';
const userDataDir = mkdtempSync(join(tmpdir(), 'gyp-chrome-'));

// 1. 启动 headless Chrome，开远程调试端口
const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=9333',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-gpu',
    PAGE_URL,
]);

let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getWsUrl() {
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch('http://localhost:9333/json');
            const targets = await res.json();
            const page = targets.find((t) => t.type === 'page' && t.url.includes('runtime.html'));
            if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
        } catch { /* 还没起来 */ }
        await sleep(300);
    }
    throw new Error('无法连接 Chrome 调试端口\n' + chromeErr);
}

// 极简 CDP 客户端
function cdp(wsUrl) {
    return new Promise((resolve, reject) => {
        import('node:http').then(() => {}); // noop
        const ws = new WebSocket(wsUrl);
        let id = 0;
        const pending = new Map();
        ws.onopen = () => resolve({
            send(method, params = {}) {
                return new Promise((res, rej) => {
                    const msgId = ++id;
                    pending.set(msgId, { res, rej });
                    ws.send(JSON.stringify({ id: msgId, method, params }));
                });
            },
            close() { ws.close(); },
        });
        ws.onerror = (e) => reject(new Error('WS 错误: ' + (e.message || 'unknown')));
        ws.onmessage = (ev) => {
            const msg = JSON.parse(ev.data);
            if (msg.id && pending.has(msg.id)) {
                const { res, rej } = pending.get(msg.id);
                pending.delete(msg.id);
                if (msg.error) rej(new Error(JSON.stringify(msg.error)));
                else res(msg.result);
            }
        };
    });
}

async function evaluate(client, expression) {
    const r = await client.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
    });
    if (r.exceptionDetails) {
        throw new Error('页面异常: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails));
    }
    return r.result.value;
}

async function main() {
    const wsUrl = await getWsUrl();
    const client = await cdp(wsUrl);
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    // 等待组件定义与首帧加载（冷启动含 hls.js CDN 拉取，留足时间）
    await sleep(4000);

    // 检查 1：自定义元素已注册
    const defined = await evaluate(client, `!!customElements.get('gy-player')`);
    // 检查 2：shadowRoot 已渲染 video
    const hasVideo = await evaluate(client, `!!document.getElementById('player')?.shadowRoot?.getElementById('video')`);
    // 检查 3：引擎类型（native / hls.js）
    const engineKind = await evaluate(client, `(() => { const p = document.getElementById('player'); return p?.engine ? (p.engine.native ? 'native' : 'hls.js') : 'none'; })()`);

    // 等待真实播放推进
    await sleep(4000);

    const t0 = await evaluate(client, `document.getElementById('player').video.currentTime`);
    await sleep(2500);
    const t1 = await evaluate(client, `document.getElementById('player').video.currentTime`);
    const levels = await evaluate(client, `(document.getElementById('player').engine?.getLevels?.() || []).length`);
    const duration = await evaluate(client, `document.getElementById('player').video.duration || 0`);
    const readyState = await evaluate(client, `document.getElementById('player').video.readyState`);

    client.close();
    chrome.kill();

    // 汇总结果
    const results = [
        ['自定义元素已注册', defined === true],
        ['Shadow DOM 渲染 video', hasVideo === true],
        ['引擎已选择 (' + engineKind + ')', engineKind === 'hls.js' || engineKind === 'native'],
        ['解析到画质档位 (' + levels + ')', levels > 0],
        ['获取到视频时长 (' + duration.toFixed(1) + 's)', duration > 0],
        ['readyState >= 2 (' + readyState + ')', readyState >= 2],
        ['currentTime 推进 (' + t0.toFixed(2) + ' → ' + t1.toFixed(2) + ')', t1 > t0],
    ];

    let allPass = true;
    console.log('\n===== 浏览器真实播放验证 =====');
    for (const [name, ok] of results) {
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
        if (!ok) allPass = false;
    }
    console.log('==============================\n');
    process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
    console.error('验证失败:', err.message);
    chrome.kill();
    process.exit(1);
});
