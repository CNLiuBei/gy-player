#!/usr/bin/env node
/**
 * 线上片源联调：静态文件 + 代理 guangying.org API
 * 在服务端保存 Better Auth 会话 Cookie（Secure / __Secure- 无法在 HTTP localhost 写入浏览器）。
 *
 * 用法：npm run demo
 * 打开：http://localhost:5173/demo/demo.html
 */
import { createServer, request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const UPSTREAM = process.env.UPSTREAM || 'https://guangying.org';

/** @type {Map<string, string>} */
const upstreamCookieJar = new Map();

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.vtt': 'text/vtt; charset=utf-8',
    '.png': 'image/png',
    '.webp': 'image/webp',
};

function ingestSetCookie(headers) {
    const raw = headers['set-cookie'];
    if (!raw) return;
    for (const item of (Array.isArray(raw) ? raw : [raw])) {
        const pair = item.split(';')[0]?.trim();
        if (!pair) continue;
        const eq = pair.indexOf('=');
        if (eq <= 0) continue;
        upstreamCookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
}

function upstreamCookieHeader() {
    return [...upstreamCookieJar.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function serveStatic(urlPath, res) {
    let filePath = normalize(join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    try {
        const info = await stat(filePath);
        if (info.isDirectory()) filePath = join(filePath, 'index.html');
    } catch {
        filePath = join(ROOT, 'index.html');
    }
    try {
        const body = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
        res.end(body);
    } catch {
        res.writeHead(404);
        res.end('Not Found');
    }
}

function proxyApi(req, res) {
    const target = new URL(req.url, UPSTREAM);
    const clientOrigin = req.headers.origin;
    const headers = { ...req.headers, host: target.host };
    headers.origin = UPSTREAM;
    headers.referer = `${UPSTREAM}/`;
    const jarCookie = upstreamCookieHeader();
    if (jarCookie) headers.cookie = jarCookie;

    const upstreamRequest = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const upstream = upstreamRequest(
        target,
        {
            method: req.method,
            headers,
        },
        (upRes) => {
            ingestSetCookie(upRes.headers);
            const outHeaders = { ...upRes.headers };
            delete outHeaders['set-cookie'];
            if (clientOrigin) {
                outHeaders['access-control-allow-origin'] = clientOrigin;
                outHeaders['access-control-allow-credentials'] = 'true';
                outHeaders.vary = 'Origin';
            }
            res.writeHead(upRes.statusCode || 502, outHeaders);
            upRes.pipe(res);
        },
    );

    upstream.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Proxy error: ${err.message}`);
    });

    if (req.method === 'GET' || req.method === 'HEAD') {
        upstream.end();
    } else {
        req.pipe(upstream);
    }
}

const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (req.method === 'OPTIONS' && urlPath.startsWith('/api/')) {
        const origin = req.headers.origin || '*';
        res.writeHead(204, {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'Content-Type',
            Vary: 'Origin',
        });
        res.end();
        return;
    }
    if (urlPath.startsWith('/api/')) {
        proxyApi(req, res);
        return;
    }
    serveStatic(urlPath, res);
});

server.listen(PORT, () => {
    console.log(`\nGY Player 联调服务已启动`);
    console.log(`  页面: http://localhost:${PORT}/demo/demo.html`);
    console.log(`  API 代理 → ${UPSTREAM}\n`);
});
