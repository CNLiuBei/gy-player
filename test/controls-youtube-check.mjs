// YouTube 式控件显隐 — 真实浏览器 + 触屏模拟验证
// 运行：python3 -m http.server 8899 &  node test/controls-youtube-check.mjs

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_URL = 'http://localhost:8899/test/runtime.html';
const userDataDir = mkdtempSync(join(tmpdir(), 'gyp-controls-'));

const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=9351',
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-gpu',
    '--window-size=390,844',
    '--touch-events=enabled',
    PAGE_URL,
]);

let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
    for (let i = 0; i < 40; i++) {
        try {
            const targets = await (await fetch('http://localhost:9351/json')).json();
            const page = targets.find((t) => t.type === 'page' && t.url.includes('runtime.html'));
            if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
        } catch { /* wait */ }
        await sleep(250);
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
    if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails));
    }
    return r.result.value;
}

async function tapSurface(client, x = 195, y = 400) {
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y }],
    });
    await client.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
    });
}

async function tapElement(client, objectId) {
    const box = await client.send('DOM.getBoxModel', { objectId });
    const quad = box.model.content;
    const x = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
    const y = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;
    await tapSurface(client, x, y);
}

async function getPlayerState(client) {
    return evalJs(client, `(() => {
        const p = document.getElementById('player');
        return {
            immersed: p.classList.contains('gyp-immersed'),
            paused: p.video.paused,
            currentTime: p.video.currentTime,
            menuOpen: !!p._menuOpen,
            hasGestureBinding: typeof p._cancelPendingSurfaceTap === 'function',
        };
    })()`);
}

async function main() {
    const client = await cdp(await getWsUrl());
    await client.send('Runtime.enable');
    await client.send('DOM.enable');
    await client.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await sleep(15000);

    const results = [];

    // 1. 触屏环境：初始沉浸
    let s = await getPlayerState(client);
    results.push(['触屏初始为沉浸态', s.immersed === true]);
    results.push(['手势绑定存在(_cancelPendingSurfaceTap)', s.hasGestureBinding === true]);

    // 2. 单击延迟后显示控件（轮询至 800ms，避免 HLS 起播阻塞事件循环）
    await tapSurface(client);
    await sleep(100);
    s = await getPlayerState(client);
    results.push(['单击 100ms 后仍为沉浸(延迟判定)', s.immersed === true]);
    let shown = false;
    for (let i = 0; i < 14; i++) {
        await sleep(50);
        s = await getPlayerState(client);
        if (!s.immersed) { shown = true; break; }
    }
    results.push(['单击后控件已显示', shown]);

    // 3. 再次单击画面：续期显示，不应立刻收起（对齐顶/底栏 holdShow）
    await tapSurface(client);
    await sleep(650);
    s = await getPlayerState(client);
    results.push(['再次单击后续期显示', s.immersed === false]);

    // 双击测试前须先回到沉浸态（双击只 seek，不负责收起控件）
    await evalJs(client, `document.getElementById('player').video.play().catch(()=>{})`);
    await sleep(3200);
    s = await getPlayerState(client);
    results.push(['续期后 3s 自动回到沉浸', s.immersed === true]);

    // 4. 双击同侧：只 seek，不唤出控件
    await evalJs(client, `(() => {
        const v = document.getElementById('player').video;
        v.currentTime = 30;
        return v.play().catch(() => {});
    })()`);
    await sleep(800);
    const tBefore = await evalJs(client, `document.getElementById('player').video.currentTime`);
    await tapSurface(client, 100, 400);
    await sleep(120);
    await tapSurface(client, 110, 400);
    await sleep(500);
    s = await getPlayerState(client);
    const tAfter = await evalJs(client, `document.getElementById('player').video.currentTime`);
    results.push(['双击后仍保持沉浸', s.immersed === true]);
    results.push(['双击左侧快退 seek', tBefore >= 20 && tAfter <= tBefore - 5]);

    // 5. 播放中显示控件后 3s 自动隐藏
    await tapSurface(client);
    await sleep(600);
    s = await getPlayerState(client);
    results.push(['唤出后控件可见', s.immersed === false]);
    await evalJs(client, `document.getElementById('player').video.play().catch(()=>{})`);
    await sleep(3200);
    s = await getPlayerState(client);
    results.push(['播放中 3.2s 后自动隐藏', s.immersed === true]);

    // 6. 暂停时常显
    await tapSurface(client);
    await sleep(400);
    await evalJs(client, `document.getElementById('player').video.pause()`);
    await sleep(3500);
    s = await getPlayerState(client);
    results.push(['暂停后 3.5s 控件仍可见', s.immersed === false]);

    // 7. 打开菜单阻止自动隐藏
    const { root } = await client.send('DOM.getDocument');
    const { nodeId } = await client.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: '#player',
    });
    const { object } = await client.send('DOM.resolveNode', { nodeId });
    const settingsBtn = await evalJs(client, `(() => {
        const p = document.getElementById('player');
        return p.shadowRoot.getElementById('settingsBtn');
    })()`);
    // open menu via API (reliable)
    await evalJs(client, `document.getElementById('player').toggleMenu('speed')`);
    s = await getPlayerState(client);
    results.push(['打开菜单后控件可见', s.immersed === false && s.menuOpen === true]);
    await evalJs(client, `document.getElementById('player').video.play().catch(()=>{})`);
    await sleep(3500);
    s = await getPlayerState(client);
    results.push(['菜单打开时 3.5s 不自动隐藏', s.immersed === false]);
    await evalJs(client, `document.getElementById('player').closeMenu()`);

    // 8. 控件可见时：surface 已排队单击隐藏，改点底栏应取消隐藏
    await evalJs(client, `document.getElementById('player').video.play().catch(()=>{})`);
    await tapSurface(client);
    await sleep(450);
    const rect = await evalJs(client, `(() => {
        const b = document.getElementById('player').shadowRoot.getElementById('playBtn').getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    })()`);
    await tapSurface(client, 195, 300);
    await sleep(80);
    await tapSurface(client, rect.x, rect.y);
    await sleep(400);
    s = await getPlayerState(client);
    results.push(['底栏触摸取消 pending 单击隐藏', s.immersed === false]);

    client.close();
    chrome.kill();

    let allPass = true;
    console.log('\n===== YouTube 控件逻辑浏览器验证 =====');
    for (const [name, ok] of results) {
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
        if (!ok) allPass = false;
    }
    console.log('======================================\n');
    process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
    console.error('验证失败:', err.message);
    chrome.kill();
    process.exit(1);
});
