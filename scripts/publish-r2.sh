#!/usr/bin/env bash
# Publish gy-player bundle to R2 with content-hash versioning.
#
# 发布流程：
#   1. 计算 dist/gy-player.js 的 SHA-256 前 12 位作为内容哈希
#   2. 上传带哈希的版本文件：static/player/gy-player.<hash>.js（永久强缓存）
#   3. 更新 manifest：static/player/manifest.json（no-cache，始终指向最新版）
#
# Web 端读取 manifest.json，得到最新播放器的精确 URL，无需修改任何代码。
#
# Usage:
#   ./scripts/publish-r2.sh
#   ./scripts/publish-r2.sh /path/to/gy-player.js
#
# Requires CLOUDFLARE_API_TOKEN (or wrangler login) and access to flix-800-assets.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUCKET="${R2_BUCKET:-flix-800-assets}"
CDN_BASE="${CDN_BASE:-https://cdn.guangying.org}"
SOURCE="${1:-$ROOT/dist/gy-player.js}"
MANIFEST_KEY="static/player/manifest.json"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required to run wrangler" >&2
  exit 1
fi

if [[ ! -f "$SOURCE" ]]; then
  echo "Player bundle not found: $SOURCE" >&2
  echo "Run npm run build first." >&2
  exit 1
fi

# ── 1. 计算内容哈希（SHA-256 取前 12 位，足够唯一且 URL 友好） ──
if command -v sha256sum >/dev/null 2>&1; then
  HASH=$(sha256sum "$SOURCE" | cut -c1-12)
elif command -v shasum >/dev/null 2>&1; then
  HASH=$(shasum -a 256 "$SOURCE" | cut -c1-12)
else
  echo "sha256sum / shasum not found" >&2
  exit 1
fi

VERSIONED_KEY="static/player/gy-player.${HASH}.js"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Hash:    ${HASH}"
echo "Source:  ${SOURCE}"

# ── 2. 上传带哈希的播放器文件（永久强缓存，内容不变 URL 不变） ──
upload() {
  local key="$1" file="$2" cache="$3"
  local attempts=0
  while true; do
    attempts=$((attempts + 1))
    if npx wrangler r2 object put "${BUCKET}/${key}" \
        --remote \
        --file "$file" \
        --content-type "application/javascript; charset=utf-8" \
        --cache-control "$cache"; then
      echo "  ✓ r2://${BUCKET}/${key}"
      return 0
    fi
    if [[ $attempts -ge 4 ]]; then
      echo "  ✘ Failed after ${attempts} attempts: ${key}" >&2
      exit 1
    fi
    echo "  ↩ Retry ${attempts}/3 after 5s..."
    sleep 5
  done
}

upload_json() {
  local key="$1" content="$2" cache="$3"
  local tmp
  tmp=$(mktemp /tmp/gy-manifest-XXXXXX.json)
  echo "$content" > "$tmp"
  local attempts=0
  while true; do
    attempts=$((attempts + 1))
    if npx wrangler r2 object put "${BUCKET}/${key}" \
        --remote \
        --file "$tmp" \
        --content-type "application/json; charset=utf-8" \
        --cache-control "$cache"; then
      echo "  ✓ r2://${BUCKET}/${key}"
      rm -f "$tmp"
      return 0
    fi
    if [[ $attempts -ge 4 ]]; then
      rm -f "$tmp"
      echo "  ✘ Failed after ${attempts} attempts: ${key}" >&2
      exit 1
    fi
    echo "  ↩ Retry ${attempts}/3 after 5s..."
    sleep 5
  done
}

echo ""
echo "── 上传播放器（永久强缓存）──"
upload "$VERSIONED_KEY" "$SOURCE" "public, max-age=31536000, immutable"

# ── 3. 更新 manifest.json（no-cache，web 每次都能拿到最新版） ──
MANIFEST=$(cat <<EOF
{
  "url": "${CDN_BASE}/${VERSIONED_KEY}",
  "hash": "${HASH}",
  "buildTime": "${BUILD_TIME}"
}
EOF
)

echo ""
echo "── 更新 manifest.json（no-cache）──"
upload_json "$MANIFEST_KEY" "$MANIFEST" "no-cache, no-store, must-revalidate"

echo ""
echo "── 完成 ──"
echo "  播放器 : ${CDN_BASE}/${VERSIONED_KEY}"
echo "  Manifest: ${CDN_BASE}/${MANIFEST_KEY}"
echo ""
