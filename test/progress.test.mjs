// 进度节流逻辑验证 — 用「时间差 ≥ 间隔」判断，而非「整除秒」
// 修复点：从非整数秒起播时，首次 progress 不应被延迟到下一个整除秒

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; } else { fail++; console.log(`FAIL ${name}`); }
}

const SAVE_INTERVAL = 5;

// 模拟 _onTimeUpdate 的节流决策：返回是否应触发保存/抛事件
function shouldFire(lastSaveTime, now) {
    return lastSaveTime < 0 || Math.abs(now - lastSaveTime) >= SAVE_INTERVAL;
}

// 首次（lastSaveTime=-1）必触发，无论 now 是多少
ok(shouldFire(-1, 0) === true, '首帧即触发(now=0)');
ok(shouldFire(-1, 30.4) === true, '从30.4起播首帧即触发');

// 未到间隔不触发
ok(shouldFire(30, 32.8) === false, '距上次2.8s不触发');
ok(shouldFire(30, 34.9) === false, '距上次4.9s不触发');

// 达到间隔触发
ok(shouldFire(30, 35) === true, '距上次5s触发');
ok(shouldFire(30, 36.2) === true, '距上次6.2s触发');

// 回退（seek 倒退）也触发，记录新位置
ok(shouldFire(60, 50) === true, 'seek回退10s触发');

// 旧的「整除秒」方式在 30.4 起播会漏报，验证新方式不会
// 整除秒：Math.floor(30.4)=30, 30%5===0 → 但下一次 31,32,33,34 都不触发，35 才触发
// 时间差：首帧就触发，更及时
const oldWay = (sec) => sec % SAVE_INTERVAL === 0;
ok(oldWay(Math.floor(31.0)) === false && shouldFire(-1, 31.0) === true, '新方式修复非整除秒起播漏报');

console.log(`\n通过 ${pass}，失败 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
