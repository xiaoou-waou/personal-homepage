import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.WEBSITE_PORT || 4178);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + pathname);
    if (!(filename === root || filename.startsWith(root + path.sep)) || pathname.split('/').some(p => p.startsWith('.') || p === 'node_modules')) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    const target = (await stat(filename)).isDirectory() ? path.join(filename, 'index.html') : filename;
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('页面不存在。请返回首页 /'); }
});
server.on('error', err => { console.error(err.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`个人网站二 → ${url}`);
  if (process.argv.includes('--open') && process.platform === 'darwin') spawn('open', [url], { stdio: 'ignore' });
});
