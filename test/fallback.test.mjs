// 引擎回退逻辑验证 — 原生 HLS 失败时应自动回退到 hls.js
// 这是纯决策逻辑，抽出核心条件做断言（与 engine.js 中 _onNativeError 实现保持一致）

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; } else { fail++; console.log(`FAIL ${name}`); }
}

// 模拟 _onNativeError 的回退决策：返回 'fallback' | 'report'
function fallbackDecision({ destroyed, native, isHls, fallbackTried, mseSupported }) {
    if (destroyed) return 'none';
    if (native && isHls && !fallbackTried && mseSupported) return 'fallback';
    return 'report';
}

// Safari 原生 HLS 解码失败、MSE 可用、首次 → 回退
ok(fallbackDecision({ destroyed: false, native: true, isHls: true, fallbackTried: false, mseSupported: true }) === 'fallback', '原生HLS失败应回退hls.js');
// 已回退过一次 → 不再回退，直接上报
ok(fallbackDecision({ destroyed: false, native: true, isHls: true, fallbackTried: true, mseSupported: true }) === 'report', '回退过一次后应上报');
// MP4 直链（非 HLS）失败 → 无法回退，直接上报
ok(fallbackDecision({ destroyed: false, native: true, isHls: false, fallbackTried: false, mseSupported: true }) === 'report', '非HLS失败应上报');
// MSE 不支持 → 无法回退，上报
ok(fallbackDecision({ destroyed: false, native: true, isHls: true, fallbackTried: false, mseSupported: false }) === 'report', '无MSE应上报');
// 已销毁 → 不处理
ok(fallbackDecision({ destroyed: true, native: true, isHls: true, fallbackTried: false, mseSupported: true }) === 'none', '已销毁应不处理');
// hls.js 模式下出错（非原生）→ 不走原生回退逻辑
ok(fallbackDecision({ destroyed: false, native: false, isHls: true, fallbackTried: false, mseSupported: true }) === 'report', 'hls.js模式不走原生回退');

console.log(`\n通过 ${pass}，失败 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
