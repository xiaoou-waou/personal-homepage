import assert from 'node:assert/strict';
import { readFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { CONTENT, PROFILE } from '../content.js';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = await readFile(path.join(root, 'index.html'), 'utf8');
const { document } = parseHTML(source);
const failures = [];
const passes = [];
function check(name, fn) {
  return Promise.resolve().then(fn).then(() => passes.push(name), error => failures.push(`${name}: ${error.message}`));
}
await check('原存档 SHA256 全部不变', async () => {
  const baseline = JSON.parse(await readFile(path.join(root, 'archive-baseline.json'), 'utf8'));
  for (const item of baseline.files) {
    const file = await readFile(path.resolve(root, '..', item.path));
    assert.equal(createHash('sha256').update(file).digest('hex'), item.sha256, item.path);
  }
});
await check('欢迎语匹配小欧的AI产品定位，入场和声音入口保留', async () => {
  const entry = document.querySelector('.world-entry');
  assert(entry);
  assert.equal(entry.querySelector('#world-entry-title').textContent, PROFILE.entry.welcome + PROFILE.entry.title);
  assert.equal(entry.querySelector('#world-entry-description').textContent, PROFILE.entry.description);
  assert.equal(entry.querySelector('.world-entry-eyebrow').textContent, PROFILE.entry.eyebrow);
  assert(entry.querySelector('.world-entry-button').getAttribute('aria-label').includes('开启背景音乐'));
  assert(entry.querySelector('.world-entry-quiet'));
  assert(!source.includes('视听世界'));
  assert(!source.includes('伴随声音，开启探索'));
  const header = await readFile(path.join(root, 'runtime/header.js'), 'utf8');
  assert(!header.includes('视听世界'));
  assert(header.includes('进入网站后播放背景音乐'));
});
await check('5篇文章、11个项目全部有真实链接', () => {
  const hrefs = new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
  assert.equal(CONTENT.articles.length, 5);
  assert.equal(CONTENT.projects.length, 11);
  for (const item of [...CONTENT.articles, ...CONTENT.projects, ...CONTENT.links]) assert(hrefs.has(item.href), item.href);
  for (const article of CONTENT.articles) assert(document.body.textContent.includes(article.title), article.title);
});
await check('文章导航统一定位到四张文章卡片', () => {
  const writing = document.querySelector('section#writing');
  assert(writing, '缺少文章卡片区域 #writing');
  assert.equal(writing.querySelectorAll('.service-card').length, 4);
  const nav = [...document.querySelectorAll('.desktop-nav a')].find(a => a.textContent === '文章');
  assert.equal(nav?.getAttribute('href'), '#writing');
  assert(document.querySelector('.menu-sheet a[href="#writing"]'));
  assert.equal(document.querySelectorAll('.works-more > a')[1].getAttribute('href'), '#writing');
  assert(writing.querySelector('a[href="#recognition"]'), '缺少全部文章入口');
});
await check('文章卡片标题和按钮指向各自原文，不再打开联系弹窗', () => {
  const cards = [...document.querySelectorAll('#writing .service-card')];
  assert.equal(cards.length, 4);
  cards.forEach((card, i) => {
    const article = CONTENT.articles[i];
    const title = card.querySelector('h3 a');
    const cta = card.querySelector('a.line-link');
    assert.equal(title?.textContent, article.title);
    for (const anchor of [title, cta]) {
      assert(anchor);
      assert.equal(anchor.getAttribute('href'), article.href, article.title);
      assert.equal(anchor.getAttribute('target'), '_blank');
      assert(!anchor.hasAttribute('data-contact-trigger'));
      assert(!anchor.hasAttribute('aria-haspopup'));
    }
    assert(!card.querySelector('button, [data-topic], dialog'));
    assert(card.textContent.includes(article.date));
    assert(card.textContent.includes(article.excerpt));
    assert(card.querySelector('.service-card__body .service-card__back'));
  });
  assert.equal(document.querySelectorAll('#recognition .article-row').length, CONTENT.articles.length);
});
await check('两处个人照片使用用户指定图片，保留彩色与模糊对焦', async () => {
  const portraits = [...document.querySelectorAll('.profile-portrait img, .contact-profile img')];
  assert.equal(portraits.length, 2);
  for (const image of portraits) {
    assert.equal(image.getAttribute('src'), CONTENT.avatar);
    assert.equal(image.getAttribute('alt'), '小欧的个人照片');
  }
  const image = await readFile(path.resolve(root, CONTENT.avatar));
  assert.equal(image[0], 0xff);
  assert.equal(image[1], 0xd8);
  assert(document.querySelector('.profile-portrait .focus-image img'));
  const css = await readFile(path.join(root, 'styles/personal.css'), 'utf8');
  assert.match(css, /\.portfolio \.profile-photo,[\s\S]*?\{\s*filter:\s*none;/);
  const app = await readFile(path.join(root, 'app.js'), 'utf8');
  assert(app.includes('mountFocusImage(host, image)'));
});
await check('公众号排版置顶，Snaploom保留在其他项目，截图页脚文案已删除', async () => {
  const first = document.querySelector('.film-feature');
  assert.equal(first.querySelector('.film-info h3 a').textContent, '公众号一键排版');
  assert.equal(first.querySelector('.film-picture').getAttribute('href'), 'https://github.com/xiaoou-waou/xiaoou-gzh-layout');
  const cover = first.querySelector('img').getAttribute('src');
  assert(cover.includes('/xiaoou-gzh-layout.'));
  if (cover.endsWith('.svg')) assert((await readFile(path.resolve(root, cover), 'utf8')).includes('公众号一键排版'));
  assert(document.querySelector('.repo-list a[href="https://github.com/xiaoou-waou/Snaploom"]'));
  assert(!document.querySelector('.site-credit'));
  for (const phrase of ['视觉与交互复刻自', '原站灵感来自', '个人内容来自小欧的原网站存档']) {
    assert(!document.body.textContent.includes(phrase), phrase);
  }
});
await check('页脚说明和版权小字全部删除，联系及返回顶部入口保留', () => {
  const footer = document.querySelector('footer#contact');
  assert(footer);
  assert.equal(footer.querySelectorAll('p, .chapter-label, .site-credit, .site-signature > span').length, 0);
  assert(!footer.textContent.includes('©'));
  assert(!source.includes('noscript-note'));
  assert(footer.querySelector('.world-contact'));
  assert(footer.querySelector('.site-signature a[href="#top"]'));
  for (const link of CONTENT.links) assert(footer.querySelector(`.contact-social a[href="${link.href}"]`));
});
await check('页面本地资源和锚点全部存在', async () => {
  const urls = [...document.querySelectorAll('[href], [src]')].flatMap(e => ['href', 'src'].map(a => e.getAttribute(a)).filter(Boolean));
  for (const url of urls) {
    if (/^(https?:|data:|mailto:)/.test(url)) continue;
    if (url.startsWith('#')) { assert(document.getElementById(url.slice(1)), url); continue; }
    const target = path.resolve(root, url.split(/[?#]/)[0]);
    assert(target.startsWith(root + path.sep));
    assert((await stat(target)).isFile(), url);
  }
  for (const image of document.querySelectorAll('img')) {
    assert(![...image.attributes].some(a => a.name.toLowerCase() === 'srcset'), '遗留参考站 responsive image 候选');
  }
  const css = await readFile(path.join(root, 'styles/reference.css'), 'utf8');
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (/^(data:|https?:|#)/.test(match[1])) continue;
    assert((await stat(path.resolve(root, 'styles', match[1]))).isFile(), match[1]);
  }
});
await check('未保留参考作者的履历、私信、作品链接或追踪脚本', () => {
  for (const text of ['AIPlayerDayu', '大羽的个人肖像', 'dayu-contact.png', 'space.bilibili', 'wdhsud7eok', '奥斯卡认证', '影视飓风', '你好大羽', 'cloudflareinsights', 'vinext.navigationRuntime']) assert(!source.includes(text), text);
  assert.equal(document.querySelectorAll('.contact-dialog').length, 1);
  assert(!document.querySelector('form[action]'));
});
await check('键盘导航、图片描述、表单标签和唯一ID', () => {
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
  assert.equal(ids.length, new Set(ids).size, '重复 ID');
  for (const img of document.querySelectorAll('img')) assert(img.getAttribute('alt'), '图片没有alt');
  for (const input of document.querySelectorAll('textarea,input')) assert(document.querySelector(`label[for="${input.id}"]`), input.id);
  for (const a of document.querySelectorAll('a[target="_blank"]')) assert(a.getAttribute('rel').includes('noopener'));
});
await check('JavaScript 语法、原 shader 和减弱动态支持', async () => {
  const runtime = (await readdir(path.join(root, 'runtime'))).filter(f => f.endsWith('.js')).map(f => 'runtime/' + f);
  for (const file of ['app.js', 'content.js', ...runtime, 'tools/build.mjs', 'tools/serve.mjs', 'tools/check.mjs']) execFileSync(process.execPath, ['--check', path.join(root, file)]);
  const code = await Promise.all(['app.js', ...runtime].map(f => readFile(path.join(root, f), 'utf8')));
  assert(code.join('\n').includes('mountScene'));
  assert(code.join('\n').includes('mountFooterFluid'));
  assert(code.join('\n').includes('prefers-reduced-motion'));
});
console.log(JSON.stringify({ passed: passes.length, failed: failures.length, passes, failures }, null, 2));
if (failures.length) process.exitCode = 1;
