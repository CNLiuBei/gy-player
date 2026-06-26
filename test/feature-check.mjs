// 新增功能浏览器验证 — 多音轨 API、字幕/音轨按钮显隐、菜单构建、续播 API
// 需先启动静态服务：python3 -m http.server 8899

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_URL = 'http://localhost:8899/test/runtime.html';
const userDataDir = mkdtempSync(join(tmpdir(), 'gyp-feat-'));

const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=9335',
    `--user-data-dir=${userDataDir}`, '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--disable-gpu', PAGE_URL,
]);
let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
    for (let i = 0; i < 30; i++) {
        try {
            const targets = await (await fetch('http://localhost:9335/json')).json();
            const page = targets.find((t) => t.type === 'page' && t.url.includes('runtime.html'));
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
    await sleep(10000); // 等 Shaka Player 加载 + manifest 解析

    const P = `document.getElementById('player')`;

    // 多音轨 API 不抛异常
    const audioApiOk = await evalJs(client, `(() => {
        try {
            const e = ${P}.engine;
            const tracks = e.getAudioTracks();
            const cur = e.getCurrentAudioTrack();
            return Array.isArray(tracks) && typeof cur === 'number';
        } catch { return false; }
    })()`);

    // 画质菜单构建不抛异常且含「自动」项
    const qualityMenuOk = await evalJs(client, `(() => {
        try {
            const html = ${P}._buildMenu('quality');
            return html.includes('自动') && html.includes('data-level');
        } catch { return false; }
    })()`);

    // 字幕菜单构建不抛异常
    const subMenuOk = await evalJs(client, `(() => {
        try {
            const html = ${P}._buildMenu('subtitle');
            return html.includes('字幕') && html.includes('关闭');
        } catch { return false; }
    })()`);

    // 外部多清晰度源优先进入清晰度菜单，并正确高亮当前源
    const externalSourceMenuOk = await evalJs(client, `(() => {
        try {
            const p = ${P};
            p._qualitySources = [
                { url: 'https://cdn.example.test/720.m3u8', quality: '720p' },
                { url: 'https://cdn.example.test/1080.m3u8', quality: '1080p' },
            ];
            p._activeSourceUrl = 'https://cdn.example.test/1080.m3u8';
            const html = p._buildMenu('quality');
            p._qualitySources = [];
            return html.includes('清晰度') && html.includes('data-source="1"') && html.includes('1080p');
        } catch { return false; }
    })()`);

    // toggleControls 存在且可调用
    const toggleControlsOk = await evalJs(client, `(() => {
        try { ${P}.toggleControls(); ${P}.toggleControls(); return true; } catch { return false; }
    })()`);

    // _saveProgress 存在
    const saveProgressOk = await evalJs(client, `typeof ${P}._saveProgress === 'function'`);

    // 设置画质不抛异常，等异步切换稳定后验证（Shaka 切档为异步）
    const setQualityOk = await evalJs(client, `(async () => {
        try {
            const e = ${P}.engine;
            const lvls = e.getLevels();
            if (lvls.length === 0) return false;
            const target = lvls[0].index;
            e.setLevel(target);
            // Shaka 异步加载目标分片后才更新 currentLevel，需等待足够时间稳定
            await new Promise((r) => setTimeout(r, 3000));
            const fixed = e.getCurrentLevel();
            e.setLevel(-1);
            const auto = e.getCurrentLevel();
            return fixed === target && auto === -1;
        } catch { return false; }
    })()`);

    // 首屏加载态在就绪后已隐藏
    const loadingHidden = await evalJs(client, `${P}.shadowRoot.getElementById('loading').classList.contains('hidden')`);

    // 错误信息分类正确
    const errMsgOk = await evalJs(client, `(() => {
        const p = ${P};
        return p._errorMessage({ type: 'networkError' }).includes('网络')
            && p._errorMessage({ code: 3 }).includes('解码')
            && p._errorMessage({ code: 4 }).includes('不支持')
            && p._errorMessage({}) === '视频加载失败，请重试';
    })()`);

    // 菜单键盘导航已绑定（打开菜单后首项可聚焦）
    const menuKbdOk = await evalJs(client, `(() => {
        try {
            ${P}.toggleMenu('speed');
            const first = ${P}.shadowRoot.querySelector('.gyp-menu-item');
            const ok = first && first.tabIndex === 0 && typeof first.onkeydown === 'function';
            ${P}.closeMenu();
            return ok;
        } catch { return false; }
    })()`);

    // 网络重试上限常量生效（引擎在超限后会上报致命）— 验证计数字段存在
    const retryGuardOk = await evalJs(client, `(() => {
        const e = ${P}.engine;
        return typeof e._netRetries === 'number' && typeof e._mediaRetries === 'number';
    })()`);

    client.close();
    chrome.kill();

    const results = [
        ['多音轨 API 正常', audioApiOk === true],
        ['画质菜单构建正常', qualityMenuOk === true],
        ['字幕菜单构建正常', subMenuOk === true],
        ['外部清晰度源菜单正常', externalSourceMenuOk === true],
        ['toggleControls 可用', toggleControlsOk === true],
        ['_saveProgress 存在', saveProgressOk === true],
        ['画质切换与恢复自动', setQualityOk === true],
        ['首屏加载态已隐藏', loadingHidden === true],
        ['错误信息分类正确', errMsgOk === true],
        ['菜单键盘导航已绑定', menuKbdOk === true],
        ['网络重试上限字段存在', retryGuardOk === true],
    ];
    let allPass = true;
    console.log('\n===== 新增功能验证 =====');
    for (const [name, ok] of results) {
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
        if (!ok) allPass = false;
    }
    console.log('========================\n');
    process.exit(allPass ? 0 : 1);
}

main().catch((err) => { console.error('验证失败:', err.message); chrome.kill(); process.exit(1); });
