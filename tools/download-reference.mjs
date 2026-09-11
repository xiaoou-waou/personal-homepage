import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Public, same-origin homepage dependencies only. Never traverses site pages.
const origin = 'https://dayuai.online';
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(project, 'vendor-reference');
const retryMode = process.argv.includes('--retry');
const priorManifest = retryMode ? JSON.parse(await fs.readFile(path.join(destination, 'download-manifest.json'), 'utf8')) : null;
const pending = retryMode ? priorManifest.failures.map(item => item.path) : ['/'];
const seen = new Set();
const files = retryMode ? priorManifest.files : [];
const failures = [];
const ignoredExternal = new Set(priorManifest?.ignoredExternal || []);
if (retryMode) files.forEach(file => seen.add(new URL(file.url).pathname));

function add(candidate, base) {
  const clean = candidate.replaceAll('\\/', '/').replaceAll('&amp;', '&').replace(/\\u0026/g, '&');
  if (!clean || /^(?:data:|blob:|#)/i.test(clean)) return;
  let url;
  try { url = new URL(clean, `${origin}${base}`); } catch { return; }
  if (url.origin !== origin) {
    if (/\.(?:js|css|woff2?|ttf|png|webp|jpe?g|mp3|mp4|svg)(?:\?|$)/i.test(url.href)) ignoredExternal.add(url.href);
    return;
  }
  if (!/^\/(?:_next\/static\/|assets\/|favicon\.svg)/.test(url.pathname)) return;
  if (/\.map$/.test(url.pathname)) return;
  if (!seen.has(url.pathname) && !pending.includes(url.pathname)) pending.push(url.pathname);
}

function dependencies(source, base) {
  const normalized = source.replaceAll('\\/', '/');
  for (const match of normalized.matchAll(/["'`]([^"'`\s<>]+)["'`]/g)) {
    const value = match[1];
    if (/^(?:\.?\.?\/|https?:\/\/)/.test(value) && /(?:\/(?:_next\/static|assets)\/|\.(?:js|css|woff2?|ttf|otf|png|webp|jpe?g|mp3|ogg|wav|mp4|svg|glb|gltf|bin)(?:\?|$))/.test(value)) add(value, base);
  }
  for (const match of normalized.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) add(match[1], base);
  for (const match of normalized.matchAll(/\/(?:_next\/static|assets)\/[A-Za-z0-9_.\-/]+/g)) add(match[0], base);
}

await fs.mkdir(destination, { recursive: true });
while (pending.length > 0) {
  const batch = pending.splice(0, 6).filter(resource => !seen.has(resource));
  batch.forEach(resource => seen.add(resource));
  await Promise.all(batch.map(async resource => {
    const target = resource === '/' ? path.join(destination, 'reference.html') : path.join(destination, resource);
    if (!target.startsWith(`${destination}${path.sep}`)) throw new Error(`Unsafe destination: ${target}`);
    try {
      const response = await fetch(`${origin}${resource}`, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length > 80 * 1024 * 1024) throw new Error('File exceeds 80 MiB homepage-asset limit');
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, data);
      const type = response.headers.get('content-type') || '';
      files.push({ path: path.relative(destination, target), bytes: data.length, contentType: type, url: `${origin}${resource}` });
      console.log(`${resource}\t${data.length}`);
      if (resource === '/' || /\.(?:js|css)$/.test(resource) || /(?:javascript|text\/css)/.test(type)) dependencies(data.toString('utf8'), resource);
    } catch (error) {
      failures.push({ path: resource, error: error.message });
      console.error(`FAILED ${resource}: ${error.message}`);
    }
  }));
}

files.sort((a, b) => a.path.localeCompare(b.path));
const manifest = { source: `${origin}/`, fetchedAt: new Date().toISOString(), totalFiles: files.length, totalBytes: files.reduce((sum, file) => sum + file.bytes, 0), files, failures, ignoredExternal: [...ignoredExternal].sort() };
await fs.writeFile(path.join(destination, 'download-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ totalFiles: manifest.totalFiles, totalBytes: manifest.totalBytes, failures, ignoredExternal: manifest.ignoredExternal }, null, 2));
