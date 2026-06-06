// 本地存储封装 — 续播位置、音量、倍速等偏好持久化
// 所有读写都做异常保护（隐私模式 / 存储满 / 禁用 localStorage 时不崩溃）

const PREFIX = 'gyp_';

/**
 * 安全写入 localStorage
 * @param {string} key 键（自动加前缀）
 * @param {string} value 值
 */
function safeSet(key, value) {
    try {
        localStorage.setItem(PREFIX + key, value);
    } catch {
        // 隐私模式或配额超限：静默忽略，不影响播放
    }
}

/**
 * 安全读取 localStorage
 * @param {string} key 键（自动加前缀）
 * @returns {string|null} 值，读取失败返回 null
 */
function safeGet(key) {
    try {
        return localStorage.getItem(PREFIX + key);
    } catch {
        return null;
    }
}

/**
 * 安全删除 localStorage
 * @param {string} key 键（自动加前缀）
 */
function safeRemove(key) {
    try {
        localStorage.removeItem(PREFIX + key);
    } catch {
        // 静默忽略
    }
}

/**
 * 保存某视频的播放进度
 * @param {string} videoId 视频唯一标识
 * @param {number} time 当前播放秒数
 */
export function savePlaybackTime(videoId, time) {
    if (!videoId || !isFinite(time)) return;
    safeSet('time_' + videoId, String(Math.floor(time)));
}

/**
 * 读取某视频的播放进度
 * @param {string} videoId 视频唯一标识
 * @returns {number} 上次播放秒数，无记录返回 0
 */
export function getPlaybackTime(videoId) {
    if (!videoId) return 0;
    const val = safeGet('time_' + videoId);
    const num = val ? parseFloat(val) : 0;
    return isFinite(num) ? num : 0;
}

/**
 * 清除某视频的播放进度（播放结束时调用）
 * @param {string} videoId 视频唯一标识
 */
export function clearPlaybackTime(videoId) {
    if (!videoId) return;
    safeRemove('time_' + videoId);
}

/**
 * 保存音量（0~1）
 * @param {number} vol 音量
 */
export function saveVolume(vol) {
    if (!isFinite(vol)) return;
    safeSet('volume', String(vol));
}

/**
 * 读取音量
 * @returns {number} 音量 0~1，无记录返回 1
 */
export function getVolume() {
    const val = safeGet('volume');
    if (val === null) return 1;
    const num = parseFloat(val);
    return isFinite(num) ? Math.min(1, Math.max(0, num)) : 1;
}

/**
 * 保存静音状态
 * @param {boolean} muted 是否静音
 */
export function saveMuted(muted) {
    safeSet('muted', muted ? '1' : '0');
}

/**
 * 读取静音状态
 * @returns {boolean} 是否静音
 */
export function getMuted() {
    return safeGet('muted') === '1';
}

/**
 * 保存播放倍速
 * @param {number} rate 倍速
 */
export function saveRate(rate) {
    if (!isFinite(rate)) return;
    safeSet('rate', String(rate));
}

/**
 * 读取播放倍速
 * @returns {number} 倍速，无记录返回 1
 */
export function getRate() {
    const val = safeGet('rate');
    if (val === null) return 1;
    const num = parseFloat(val);
    return isFinite(num) && num > 0 ? num : 1;
}

/**
 * 标记移动端手势引导已展示（只展示一次）
 */
export function markGestureGuideSeen() {
    safeSet('gesture_guide_seen', '1');
}

/**
 * 是否已展示过移动端手势引导
 * @returns {boolean} 已展示返回 true
 */
export function getGestureGuideSeen() {
    return safeGet('gesture_guide_seen') === '1';
}
