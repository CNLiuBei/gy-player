// HLS 分片并行预取 — 只预取 hls.js 尚未请求的后续分片（跳过紧邻下一个），
// 避免与 xhr-loader 抢同一 URL 导致大量 canceled。

/** @typedef {{ response: { data: ArrayBuffer, url: string }, stats: object }} PrefetchEntry */

const DEFAULT_PREFETCH_AHEAD = 2;
const MAX_CACHE_ENTRIES = 16;
/** hls.js 会加载的「下一个」分片，预取从 +2 开始 */
const PREFETCH_START_OFFSET = 2;

/** @type {Map<string, PrefetchEntry>} */
const prefetchCache = new Map();
/** @type {Set<string>} */
const prefetchInflight = new Set();
/** @type {Map<string, AbortController>} */
const prefetchAbort = new Map();
/** @type {Set<string>} */
const hlsLoadingUrls = new Set();

let lastPrefetchKey = '';
let lastPrefetchAt = 0;

/**
 * @param {string} url
 * @returns {PrefetchEntry | null}
 */
function takeFromCache(url) {
    const hit = prefetchCache.get(url);
    if (!hit) return null;
    prefetchCache.delete(url);
    return hit;
}

function evictOldestCacheEntry() {
    const first = prefetchCache.keys().next().value;
    if (first) prefetchCache.delete(first);
}

/**
 * hls 主加载器开始请求时，取消对该 URL 的预取，避免双通道竞争
 * @param {string} url
 */
function cancelPrefetchForUrl(url) {
    if (!url) return;
    prefetchCache.delete(url);
    const ac = prefetchAbort.get(url);
    if (ac) {
        try { ac.abort(); } catch { /* ignore */ }
        prefetchAbort.delete(url);
    }
    prefetchInflight.delete(url);
}

/**
 * @param {import('hls.js').default | null | undefined} hls
 * @param {{ sn?: number, level?: number } | null | undefined} currentFrag
 * @param {number} [count]
 * @param {number} [startOffset] 从当前分片后第几个开始（默认 2 = 跳过 hls 正在拉的下一个）
 * @returns {string[]}
 */
export function getUpcomingFragmentUrls(
    hls,
    currentFrag,
    count = DEFAULT_PREFETCH_AHEAD,
    startOffset = PREFETCH_START_OFFSET,
) {
    if (!hls || !currentFrag || typeof currentFrag.sn !== 'number') return [];
    const levelIndex = currentFrag.level;
    if (typeof levelIndex !== 'number' || levelIndex < 0) return [];
    const frags = hls.levels?.[levelIndex]?.details?.fragments;
    if (!Array.isArray(frags) || frags.length === 0) return [];

    const idx = frags.findIndex((f) => f.sn === currentFrag.sn);
    if (idx < 0) return [];

    const urls = [];
    for (let i = 0; i < count; i++) {
        const fragIdx = idx + startOffset + i;
        if (fragIdx >= frags.length) break;
        const url = frags[fragIdx]?.url;
        if (url && typeof url === 'string') urls.push(url);
    }
    return urls;
}

/**
 * @param {string} url
 */
function prefetchFragmentUrl(url) {
    if (!url || prefetchCache.has(url) || prefetchInflight.has(url) || hlsLoadingUrls.has(url)) return;

    prefetchInflight.add(url);
    const ac = new AbortController();
    prefetchAbort.set(url, ac);
    const start = performance.now();

    fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: ac.signal,
    })
        .then((res) => {
            if (!res.ok) throw new Error(`prefetch ${res.status}`);
            return res.arrayBuffer();
        })
        .then((data) => {
            if (hlsLoadingUrls.has(url)) return;
            if (prefetchCache.size >= MAX_CACHE_ENTRIES) evictOldestCacheEntry();
            const end = performance.now();
            prefetchCache.set(url, {
                response: { data, url },
                stats: {
                    loading: { start, first: start, end },
                    loaded: data.byteLength,
                    total: data.byteLength,
                    retry: 0,
                    chunkCount: 1,
                },
            });
        })
        .catch(() => {
            // 预取失败不影响主流程
        })
        .finally(() => {
            prefetchInflight.delete(url);
            prefetchAbort.delete(url);
        });
}

/**
 * @param {import('hls.js').default | null | undefined} hls
 * @param {{ sn?: number, level?: number } | null | undefined} currentFrag
 * @param {number} [count]
 */
export function scheduleFragmentPrefetch(hls, currentFrag, count = DEFAULT_PREFETCH_AHEAD) {
    if (!currentFrag || typeof currentFrag.sn !== 'number') return;
    const key = `${currentFrag.level}-${currentFrag.sn}`;
    const now = Date.now();
    if (key === lastPrefetchKey && now - lastPrefetchAt < 800) return;
    lastPrefetchKey = key;
    lastPrefetchAt = now;

    for (const url of getUpcomingFragmentUrls(hls, currentFrag, count)) {
        prefetchFragmentUrl(url);
    }
}

export function clearFragmentPrefetchCache() {
    for (const ac of prefetchAbort.values()) {
        try { ac.abort(); } catch { /* ignore */ }
    }
    prefetchAbort.clear();
    prefetchInflight.clear();
    prefetchCache.clear();
    hlsLoadingUrls.clear();
    lastPrefetchKey = '';
    lastPrefetchAt = 0;
}

/**
 * @param {typeof import('hls.js').default} Hls
 * @param {{ current: import('hls.js').default | null }} hlsRef
 * @param {number} [prefetchAhead]
 */
export function createParallelPrefetchLoader(Hls, hlsRef, prefetchAhead = DEFAULT_PREFETCH_AHEAD) {
    const BaseLoader = Hls.DefaultConfig.loader;

    return class ParallelPrefetchLoader extends BaseLoader {
        load(context, config, callbacks) {
            if (context?.frag) {
                cancelPrefetchForUrl(context.url);
                hlsLoadingUrls.add(context.url);

                const cached = takeFromCache(context.url);
                if (cached) {
                    queueMicrotask(() => {
                        hlsLoadingUrls.delete(context.url);
                        callbacks.onSuccess(cached.response, cached.stats, context);
                        scheduleFragmentPrefetch(hlsRef.current, context.frag, prefetchAhead);
                    });
                    return;
                }

                const origSuccess = callbacks.onSuccess;
                const origError = callbacks.onError;
                callbacks.onSuccess = (response, stats, ctx) => {
                    hlsLoadingUrls.delete(context.url);
                    origSuccess(response, stats, ctx);
                    if (ctx?.frag) scheduleFragmentPrefetch(hlsRef.current, ctx.frag, prefetchAhead);
                };
                callbacks.onError = (error, stats, ctx) => {
                    hlsLoadingUrls.delete(context.url);
                    origError(error, stats, ctx);
                };
            }

            super.load(context, config, callbacks);
        }

        abort() {
            if (this.context?.url) hlsLoadingUrls.delete(this.context.url);
            super.abort();
        }
    };
}
