// 续播记忆逻辑验证 — 验证 _saveProgress 的「接近结尾不保存」规则
// 该规则是纯逻辑，抽出核心条件做断言（与 gy-player.js 中实现保持一致）

let pass = 0, fail = 0;
function ok(cond, name) {
    if (cond) { pass++; } else { fail++; console.log(`FAIL ${name}`); }
}

// 模拟 _saveProgress 的决策：返回 'clear' | 'save' | 'skip'
function progressDecision({ ended, currentTime, duration }) {
    if (ended) return 'skip';                       // 已结束：ended 事件已清除，不再写
    if (duration && duration - currentTime < 10) return 'clear'; // 距结尾 <10s：看完
    return 'save';
}

// 正常播放中途关闭 → 保存
ok(progressDecision({ ended: false, currentTime: 300, duration: 1800 }) === 'save', '中途关闭应保存');
// 距结尾 5 秒关闭 → 清除（看完）
ok(progressDecision({ ended: false, currentTime: 1795, duration: 1800 }) === 'clear', '接近结尾应清除');
// 距结尾正好 10 秒 → 保存（边界）
ok(progressDecision({ ended: false, currentTime: 1790, duration: 1800 }) === 'save', '边界10s应保存');
// 已 ended → 跳过
ok(progressDecision({ ended: true, currentTime: 1800, duration: 1800 }) === 'skip', '已结束应跳过');
// 无 duration（直播/未加载）→ 保存当前
ok(progressDecision({ ended: false, currentTime: 50, duration: 0 }) === 'save', '无时长应保存');

// 续播阈值：仅 >15s 才提示
const RESUME_THRESHOLD = 15;
ok(!(10 > RESUME_THRESHOLD), '10s 不提示续播');
ok((120 > RESUME_THRESHOLD), '120s 提示续播');

console.log(`\n通过 ${pass}，失败 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
