#!/usr/bin/env node
/**
 * 阶段 A 资源治理：
 * 1. 删除站内未引用图片；
 * 2. 合并内容完全相同的图片；
 * 3. GIF 转 MP4 + WebP poster，存到 static/media，并把 Markdown 图片替换为 <video>；
 * 4. PNG 转 WebP 并限宽。
 *
 * 只处理 site-docs/ 和 static/media/，不会修改 docs/ 里的 Jekyll 源内容。
 * 依赖：ffmpeg、sharp。
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const SITE_DIR = path.resolve('site-docs');
const VIDEO_DIR = path.resolve('static/media/docs');
const VIDEO_MAX_WIDTH = 1280;
const VIDEO_CRF = '31';
const POSTER_MAX_WIDTH = 960;
const IMAGE_MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;
const MIN_OPTIMIZE_BYTES = 20 * 1024;
const IMAGE_EXT = new Set(['.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg']);
const TEXT_EXT = new Set(['.md', '.css', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.html']);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function relFrom(fromDir, target) {
  const rel = path.relative(fromDir, target).split(path.sep).join('/');
  return rel || path.basename(target);
}

function stripAngle(uri) {
  const trimmed = uri.trim();
  return trimmed.startsWith('<') && trimmed.endsWith('>') ? trimmed.slice(1, -1) : trimmed;
}

function resolveUri(file, uri) {
  if (!uri) return null;
  const cleaned = stripAngle(uri).split('#')[0].split('?')[0];
  if (!cleaned || /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(cleaned) || cleaned.startsWith('data:') || cleaned.startsWith('#')) {
    return null;
  }
  let decoded;
  try {
    decoded = decodeURIComponent(cleaned);
  } catch {
    decoded = cleaned;
  }
  if (decoded.startsWith('/docs/')) return path.join(SITE_DIR, decoded.slice('/docs/'.length));
  if (decoded.startsWith('/')) return path.join(SITE_DIR, decoded.slice(1));
  return path.resolve(path.dirname(file), decoded);
}

function isImage(file) {
  return IMAGE_EXT.has(path.extname(file).toLowerCase());
}

function collectMarkdownRefs(markdownFiles) {
  const refs = new Map();
  for (const file of markdownFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const add = (uri) => {
      const abs = resolveUri(file, uri);
      if (abs) refs.set(abs, (refs.get(abs) || 0) + 1);
    };
    for (const match of text.matchAll(/!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g)) {
      add(match[1]);
    }
    for (const match of text.matchAll(/\bsrc=(["'])([^"']+)\1/g)) {
      add(match[2]);
    }
  }
  return refs;
}

function collectMentionedBasenames() {
  const mentioned = new Set();
  for (const file of walk(SITE_DIR)) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const name of text.matchAll(/[-\w.]+\.(?:png|gif|jpe?g|webp|svg)/gi)) {
      mentioned.add(name[0].toLowerCase());
    }
  }
  return mentioned;
}

function hashFile(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

function rewriteMarkdownRefs(markdownFiles, mapper) {
  if (mapper.size === 0) return;
  for (const file of markdownFiles) {
    const before = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    const after = before
      .replace(/(!\[[^\]]*\]\()(\s*)(<[^>]+>|[^)\s]+)((?:\s+["'][^"']*["'])?\s*\))/g, (full, prefix, space, uri, suffix) => {
        const abs = resolveUri(file, uri);
        const target = abs && mapper.get(abs);
        return target ? `${prefix}${space}${relFrom(dir, target)}${suffix}` : full;
      })
      .replace(/(\bsrc=)(["'])([^"']+)\2/g, (full, prefix, quote, uri) => {
        const abs = resolveUri(file, uri);
        const target = abs && mapper.get(abs);
        return target ? `${prefix}${quote}${relFrom(dir, target)}${quote}` : full;
      });
    if (after !== before) fs.writeFileSync(file, after);
  }
}

function dedupeAssets(imageFiles, markdownFiles, refs) {
  const groups = new Map();
  for (const file of imageFiles) {
    const key = hashFile(file);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  }

  const dedupeMap = new Map();
  let removed = 0;
  let removedBytes = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => {
      const refDiff = (refs.get(b) || 0) - (refs.get(a) || 0);
      if (refDiff !== 0) return refDiff;
      const depthDiff = a.split(path.sep).length - b.split(path.sep).length;
      return depthDiff !== 0 ? depthDiff : a.length - b.length;
    });
    const canonical = group[0];
    for (const duplicate of group.slice(1)) {
      dedupeMap.set(duplicate, canonical);
      removedBytes += fs.statSync(duplicate).size;
    }
  }

  rewriteMarkdownRefs(markdownFiles, dedupeMap);
  for (const duplicate of dedupeMap.keys()) {
    fs.rmSync(duplicate);
    removed++;
  }
  if (removed > 0) {
    console.log(`[dedupe] 删除重复图片 ${removed} 个，释放 ${formatBytes(removedBytes)}`);
  }
}

function removeUnreferenced(imageFiles, refs) {
  const mentioned = collectMentionedBasenames();
  let removed = 0;
  let removedBytes = 0;
  for (const file of imageFiles) {
    if (!fs.existsSync(file)) continue;
    const base = path.basename(file).toLowerCase();
    if (refs.has(file)) continue;
    if (mentioned.has(base)) continue;
    removedBytes += fs.statSync(file).size;
    fs.rmSync(file);
    removed++;
  }
  if (removed > 0) {
    console.log(`[unused] 删除未引用图片 ${removed} 个，释放 ${formatBytes(removedBytes)}`);
  }
}

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function replaceGifReferences(markdownFiles, gifFile, videoUrl, posterUrl) {
  let count = 0;
  for (const file of markdownFiles) {
    const before = fs.readFileSync(file, 'utf8');
    const after = before.replace(/!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\s*\)/g, (full, alt, uri) => {
      const abs = resolveUri(file, uri);
      if (!abs || abs !== gifFile) return full;
      count++;
      const label = alt.trim() ? ` aria-label="${escapeAttr(alt.trim())}"` : '';
      return `<video class="doc-video" controls muted loop autoplay playsinline preload="metadata" poster="${posterUrl}"${label}><source src="${videoUrl}" type="video/mp4" /></video>`;
    });
    if (after !== before) fs.writeFileSync(file, after);
  }
  return count;
}

function convertGifs(markdownFiles) {
  const gifs = walk(SITE_DIR).filter((file) => path.extname(file).toLowerCase() === '.gif');
  if (gifs.length === 0) return;

  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  let converted = 0;
  let beforeBytes = 0;
  let afterBytes = 0;
  for (const gif of gifs) {
    const rel = path.relative(SITE_DIR, gif).split(path.sep).join('/');
    const outBase = path.join(VIDEO_DIR, rel.slice(0, -4));
    fs.mkdirSync(path.dirname(outBase), { recursive: true });
    const mp4 = `${outBase}.mp4`;
    const poster = `${outBase}-poster.webp`;
    const scale = `scale='min(${VIDEO_MAX_WIDTH},iw)':-2:flags=lanczos`;
    const posterScale = `scale='min(${POSTER_MAX_WIDTH},iw)':-2:flags=lanczos`;
    beforeBytes += fs.statSync(gif).size;
    execFileSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', gif,
      '-vf', scale,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', VIDEO_CRF,
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
      mp4,
    ], { stdio: 'inherit' });
    execFileSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', gif, '-frames:v', '1', '-vf', posterScale,
      '-c:v', 'libwebp', '-lossless', '0', '-q:v', '75',
      poster,
    ], { stdio: 'inherit' });
    const dir = path.posix.dirname(rel);
    const videoUrl = `/media/docs/${dir}/${path.basename(mp4)}`;
    const posterUrl = `/media/docs/${dir}/${path.basename(poster)}`;
    const refs = replaceGifReferences(markdownFiles, gif, videoUrl, posterUrl);
    if (refs === 0) {
      console.warn(`[gif] 未找到 Markdown 引用，保留原文件：${rel}`);
      fs.rmSync(mp4, { force: true });
      fs.rmSync(poster, { force: true });
      continue;
    }
    afterBytes += fs.statSync(mp4).size + fs.statSync(poster).size;
    fs.rmSync(gif);
    converted++;
    console.log(`[gif] ${rel} -> ${videoUrl} (${refs} 处引用)`);
  }
  if (converted > 0) {
    console.log(`[gif] 转换 ${converted} 个，${formatBytes(beforeBytes)} -> ${formatBytes(afterBytes)}`);
  }
}

async function convertPngs(markdownFiles, refs) {
  const pngs = walk(SITE_DIR).filter((file) => path.extname(file).toLowerCase() === '.png');
  let converted = 0;
  let beforeBytes = 0;
  let afterBytes = 0;
  for (const file of pngs) {
    if (!fs.existsSync(file)) continue;
    if (!refs.has(file)) continue;
    const before = fs.statSync(file).size;
    if (before < MIN_OPTIMIZE_BYTES) continue;
    try {
      const webp = file.replace(/\.png$/i, '.webp');
      const meta = await sharp(file, { failOn: 'none' }).metadata();
      let pipeline = sharp(file, { failOn: 'none' });
      if (meta.width && meta.width > IMAGE_MAX_WIDTH) {
        pipeline = pipeline.resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true });
      }
      const buffer = await pipeline.webp({ quality: WEBP_QUALITY, effort: 6 }).toBuffer();
      if (buffer.length >= before * 0.98) continue;
      fs.writeFileSync(webp, buffer);
      rewriteMarkdownRefs(markdownFiles, new Map([[file, webp]]));
      fs.rmSync(file);
      converted++;
      beforeBytes += before;
      afterBytes += buffer.length;
    } catch (error) {
      console.warn(`[png] 跳过 ${path.relative(SITE_DIR, file)}：${error.message}`);
    }
  }
  if (converted > 0) {
    console.log(`[webp] 转换 ${converted} 个 PNG，${formatBytes(beforeBytes)} -> ${formatBytes(afterBytes)}`);
  }
}

async function main() {
  if (!fs.existsSync(SITE_DIR)) {
    throw new Error('site-docs/ 不存在，请先运行 node migration/migrate-stage-a.mjs');
  }
  const beforeSize = walk(SITE_DIR).reduce((sum, file) => sum + fs.statSync(file).size, 0);
  const markdownFiles = walk(SITE_DIR).filter((file) => file.endsWith('.md'));
  const imageFiles = walk(SITE_DIR).filter(isImage);

  console.log(`[start] site-docs: ${formatBytes(beforeSize)}，${markdownFiles.length} 篇 Markdown，${imageFiles.length} 个图片`);

  let refs = collectMarkdownRefs(markdownFiles);
  dedupeAssets(imageFiles, markdownFiles, refs);
  removeUnreferenced(imageFiles, refs);
  convertGifs(markdownFiles);
  refs = collectMarkdownRefs(markdownFiles);
  await convertPngs(markdownFiles, refs);

  const afterSize = walk(SITE_DIR).reduce((sum, file) => sum + fs.statSync(file).size, 0);
  const mediaSize = fs.existsSync(VIDEO_DIR)
    ? walk(VIDEO_DIR).reduce((sum, file) => sum + fs.statSync(file).size, 0)
    : 0;
  console.log(`[done] site-docs: ${formatBytes(afterSize)}（减少 ${formatBytes(beforeSize - afterSize)}）`);
  console.log(`[done] static/media: ${formatBytes(mediaSize)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
