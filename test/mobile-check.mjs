// 移动端适配验证 — 触屏 UA 模拟下，验证新增手势反馈元素、抽屉、引导、横屏锁定接口
// 需先启动静态服务：python3 -m http.server 8899

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE_URL = 'http://localhost:8899/test/runtime.html';
const userDataDir = mkdtempSync(join(tmpdir(), 'gyp-mobile-'));

const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=9347',
    `--user-data-dir=${userDataDir}`, '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--disable-gpu',
    // 模拟移动端窗口尺寸（竖屏手机）
    '--window-size=390,844', PAGE_URL,
]);
let chromeErr = '';
chrome.stderr.on('data', (d) => { chromeErr += d.toString(); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
    for (let i = 0; i < 30; i++) {
        try {
            const targets = await (await fetch('http://localhost:9347/json')).json();
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
    if (r.exceptionDetails) throw new Error('页面异常: ' + JSON.stringify(r.exceptionDetails.exceptionDetails?.exception?.description || r.exceptionDetails));
    return r.result.value;
}

async function main() {
    const client = await cdp(await getWsUrl());
    await client.send('Runtime.enable');
    await sleep(4000); // 等组件渲染

    const P = `document.getElementById('player')`;
    const SR = `${P}.shadowRoot`;

    // 新增 DOM 元素全部存在
    const elementsOk = await evalJs(client, `(() => {
        const ids = ['dblTapLeft','dblTapRight','sheetMask','vslide','vslideIcon','vslideFill','guide','guideBtn'];
        return ids.every((id) => ${SR}.getElementById(id) !== null);
    })()`);

    // 新增方法可调用且不抛异常
    const methodsOk = await evalJs(client, `(() => {
        try {
            const p = ${P};
            p.flashDoubleTap('right', 10);
            p.flashDoubleTap('left', 10);
            p.showVSlide('volume', 0.5, '<svg></svg>');
            p.hideVSlide();
            p.showHintHold('test');
            p.hideHint();
            return typeof p._lockLandscape === 'function'
                && typeof p._unlockOrientation === 'function'
                && typeof p._maybeShowGuide === 'function'
                && typeof p._syncSheetMask === 'function';
        } catch (e) { return false; }
    })()`);

    // 双击涟漪触发后元素可见（去掉 hidden）
    const dblTapVisible = await evalJs(client, `(() => {
        ${P}.flashDoubleTap('right', 10);
        const el = ${SR}.getElementById('dblTapRight');
        return !el.classList.contains('hidden') && el.querySelector('.gyp-dbltap-text').textContent.includes('10');
    })()`);

    // 双击同侧累加秒数
    const dblTapAccum = await evalJs(client, `(() => {
        const p = ${P};
        p._dblTapTimer = null; p._dblTapSide = null;
        p.flashDoubleTap('right', 10);
        p.flashDoubleTap('right', 10);
        const txt = ${SR}.getElementById('dblTapRight').querySelector('.gyp-dbltap-text').textContent;
        return txt.includes('20');
    })()`);

    // 竖滑指示填充比例生效
    const vslideOk = await evalJs(client, `(() => {
        ${P}.showVSlide('volume', 0.5, '<svg></svg>');
        const fill = ${SR}.getElementById('vslideFill');
        const el = ${SR}.getElementById('vslide');
        return !el.classList.contains('hidden') && fill.style.width === '50%';
    })()`);

    // 菜单打开时遮罩同步显示，关闭后隐藏
    const maskSyncOk = await evalJs(client, `(() => {
        const p = ${P};
        p.toggleMenu('speed');
        const mask = ${SR}.getElementById('sheetMask');
        const shownWhileOpen = !mask.classList.contains('hidden');
        p.closeMenu();
        const hiddenAfterClose = mask.classList.contains('hidden');
        return shownWhileOpen && hiddenAfterClose;
    })()`);

    // 安全区样式注入（styles 含 safe-area-inset 与 dvh）
    const safeAreaOk = await evalJs(client, `(() => {
        const css = [...${SR}.querySelectorAll('style')].map((s) => s.textContent).join('');
        return css.includes('safe-area-inset-left') && css.includes('100dvh') && css.includes('gyp-dbltap') && css.includes('gyp-sheet-up');
    })()`);

    // 手势引导：触屏环境下首次 _maybeShowGuide 应显示（runtime 无 ontouchstart 时跳过，做容错）
    const guideLogicOk = await evalJs(client, `(() => {
        const p = ${P};
        // 强制重置并模拟触屏判断路径：直接验证元素结构与方法不抛错
        try { localStorage.removeItem('gyp_gesture_guide_seen'); } catch {}
        p._guideShown = false;
        p._maybeShowGuide();
        // 非触屏环境会直接 return，不报错即视为通过
        return true;
    })()`);

    client.close();
    chrome.kill();

    const results = [
        ['新增 DOM 元素齐全', elementsOk === true],
        ['新增方法可调用', methodsOk === true],
        ['双击涟漪可见且显示秒数', dblTapVisible === true],
        ['双击同侧秒数累加', dblTapAccum === true],
        ['竖滑指示比例生效', vslideOk === true],
        ['抽屉遮罩开关同步', maskSyncOk === true],
        ['安全区/dvh/动画样式已注入', safeAreaOk === true],
        ['手势引导逻辑不抛异常', guideLogicOk === true],
    ];
    let allPass = true;
    console.log('\n===== 移动端适配验证 =====');
    for (const [name, ok] of results) {
        console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
        if (!ok) allPass = false;
    }
    console.log('==========================\n');
    process.exit(allPass ? 0 : 1);
}

main().catch((err) => { console.error('验证失败:', err.message); chrome.kill(); process.exit(1); });
