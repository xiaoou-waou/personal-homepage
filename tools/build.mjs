/**
 * Build only this new website. The original archive is never written.
 * The reference's public DOM, CSS and shader geometry are preserved;
 * personal facts and links come exclusively from content.js.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { CONTENT, PROFILE } from '../content.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const ref = path.join(root, 'vendor-reference');
const source = await readFile(path.join(ref, 'reference.html'), 'utf8');
const { document: doc } = parseHTML(source);
const $ = (s, scope = doc) => scope.querySelector(s);
const $$ = (s, scope = doc) => [...scope.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const html = (selector, value, scope = doc) => { const node = $(selector, scope); if (!node) throw new Error(`Missing reference element: ${selector}`); node.innerHTML = value; };
const text = (selector, value, scope = doc) => { const node = $(selector, scope); if (!node) throw new Error(`Missing reference element: ${selector}`); node.textContent = value; };
const arrow = $('.ui-arrow').outerHTML;
const link = (label, href, cls = '') => `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} ${arrow}</a>`;
const contact = $('.contact-dialog').cloneNode(true);
const styles = $$('link[rel="stylesheet"]').map(n => n.getAttribute('href'));
const portraitSrc = CONTENT.avatar || './assets/personal/avatar.png';
const portraitAlt = PROFILE.portrait?.alt || `${CONTENT.name}的个人照片`;

// All remote routing, hydration, telemetry and third-party identity are removed.
$$('script, link[rel="modulepreload"], .contact-dialog').forEach(n => n.remove());
doc.head.innerHTML = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0d0c">
<title>个人网站二 · 小欧 XIAOOU｜AI 产品经理</title>
<meta name="description" content="${esc(CONTENT.about.replace(/\n/g, ' '))}">
<meta property="og:title" content="小欧 XIAOOU · 把想法变成产品">
<meta property="og:description" content="${esc(CONTENT.about.replace(/\n/g, ' '))}">
<meta property="og:type" content="website">
<link rel="icon" href="./favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="./styles/reference.css">
<link rel="stylesheet" href="./styles/personal.css">
<link rel="preload" href="./vendor-reference/assets/fonts/manrope-regular.ttf" as="font" type="font/ttf" crossorigin>
<script>window.__dayuEntryOpen=true;document.documentElement.dataset.dayuEntryState='open';</script>`;
doc.documentElement.lang = 'zh-CN';
doc.documentElement.dataset.site = 'xiaoou-personal-website-2';

text('.skip-link', '跳过开场，了解小欧');
html('.wordmark', 'XIAOOU<span>/</span><small>小欧 · AI 产品经理</small>');
$('.wordmark').setAttribute('aria-label', '小欧，返回首页');
html('.world-entry-wordmark', 'XIAOOU<span>/</span>');
text('.world-entry-eyebrow', PROFILE.entry.eyebrow);
text('.world-entry-welcome', PROFILE.entry.welcome);
text('#world-entry-title > span:last-child', PROFILE.entry.title);
text('#world-entry-description', PROFILE.entry.description);
$('.world-entry-button').setAttribute('aria-label', `${PROFILE.entry.welcome}${PROFILE.entry.title}（开启背景音乐）`);
$('.sound-control').setAttribute('aria-label', '进入网站后播放背景音乐');
$('.sound-control').setAttribute('title', '进入网站后播放背景音乐');
html('.desktop-nav', '<a href="#about">关于</a><a href="#works">项目</a><a href="#writing">文章</a>');
text('#menu-title', 'XIAOOU / INDEX');
const nav = [['01', '关于小欧', 'about'], ['02', '精选项目', 'works'], ['03', '创作工具', 'opensource'], ['04', '精选文章', 'writing'], ['05', '全部文章', 'recognition'], ['06', '保持联系', 'contact']];
html('.menu-sheet nav', nav.map(([n, title, id]) => `<a href="#${id}"><span>${n}</span>${title}<span aria-hidden="true">${arrow}</span></a>`).join(''));
text('.menu-sheet > p', CONTENT.tagline + '。');
html('#hero-title', `<span>${esc(PROFILE.heroLines[0])}</span><strong>${esc(PROFILE.heroLines[1].replace(/。$/, ''))}<span class="hero-period">。</span></strong>`);
text('.hero-name', '小欧 / XIAOOU');
text('.hero-intro p', 'AI 产品经理 · Agent · 人机协作');
html('.hero-story h2', '产品的起点，<br>是理解用户。');
html('.hero-story p', '探索 AI，理解用户，<br>把想法变成真正可用的产品。');
text('#about .chapter-label span:last-child', '小欧 · XIAOOU');
text('.profile-copy .chapter-eyebrow', 'PRODUCT. AGENT. EXPLORER.');
html('#about-title', `${esc(PROFILE.aboutLines[0])}<br>${esc(PROFILE.aboutLines[1])}<br><span>${esc(PROFILE.aboutLines[2])}</span>`);
text('.profile-role', 'AI 产品经理 · AI / Agent / 人机协作');
html('.profile-description', esc(CONTENT.about).replace(/\n/g, '<br>'));
const manual = $('.profile-manual');
manual.href = CONTENT.github;
manual.innerHTML = `前往 GitHub，了解我的项目 <span aria-hidden="true">${arrow}</span>`;
const avatar = $('.profile-portrait img');
avatar.src = portraitSrc;
avatar.removeAttribute('srcset');
avatar.alt = portraitAlt;
avatar.setAttribute('width', String(PROFILE.portrait?.width || 400));
avatar.setAttribute('height', String(PROFILE.portrait?.height || 400));
$('.profile-portrait .focus-image').style.setProperty('--photo-position', '50% 50%');
text('.profile-portrait figcaption > span', 'XIAOOU / THE PERSON BEHIND THE IDEAS');
const dimensions = [
  ['01 / PRODUCT', '从用户出发。', '探索 AI、理解用户，把想法变成产品。关注真实需求，也关注一个想法如何走到可用的终点。'],
  ['02 / AGENT', '把任务交给 Agent。', '关注 Agent 的执行、经验治理与验收，思考一个智能体如何可靠地完成真实任务。'],
  ['03 / HUMAN + AI', '让人与 AI 一起工作。', '关注人机协作、控制权与 AI 分身，探索 AI 什么时候行动，什么时候把决定交还给人。'],
];
html('.profile-path', dimensions.map(([label, title, desc]) => `<article><span>${esc(label)}</span><h3>${esc(title)}</h3><p>${esc(desc)}</p></article>`).join(''));
html('.manifesto-message h2', '好想法，<br>值得成为现实。');

// Five image-led projects occupy the exact five original film frames.
const titles = {
  'Snaploom': 'Snaploom',
  'zhaopianfengge-skill': 'Gathered Scenes · 照片海报',
  'xiaoou-material-illustrator': '材质插画生成',
  'xiaoou-cinematic-video-prompt': '电影化视频提示词',
  'image-recon': '参考图逆向分析',
  'xhs-sanhuamao-writer': '小红书原创图文',
  'xiaoou-gzh-layout': '公众号一键排版',
  'xiaoou-ai-article-writer': 'AI 文章共创',
  'agent-reach': 'Agent Reach',
  'ui-devtool': 'UI 设计质量检测',
  'personal-homepage': '个人主页',
};
let personalManifest = [];
try { const data = JSON.parse(await readFile(path.join(root, 'assets/personal/manifest.json'), 'utf8')); personalManifest = Array.isArray(data) ? data : data.assets ?? data.images ?? []; } catch {}
await mkdir(path.join(root, 'assets/project-covers'), { recursive: true });
const featured = ['xiaoou-gzh-layout', 'zhaopianfengge-skill', 'xhs-sanhuamao-writer', 'xiaoou-cinematic-video-prompt', 'image-recon'];
// Explicit typographic covers for projects with no retrievable real image.
// These are source-data title cards, not screenshots or invented product UI.
for (const name of featured) {
  if (personalManifest.some(a => a.project === name)) continue;
  const p = CONTENT.projects.find(p => p.name === name);
  const label = esc(titles[name] ?? name);
  const labelSize = name === 'Snaploom' ? 156 : 116;
  const coverType = name === 'Snaploom' ? 'SIDE PROJECT' : 'AGENT SKILL';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#e7e9e1"/><path d="M100 175H1500M100 734H1500" stroke="#afb5a4"/><g fill="#171b18" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif"><text x="100" y="122" font-size="22" letter-spacing="4">XIAOOU / ${coverType}</text><text x="100" y="455" font-size="${labelSize}" font-weight="700" letter-spacing="-5">${label}</text><text x="107" y="546" font-size="28">${esc(p.desc)}</text><text x="100" y="805" font-size="23">github.com/xiaoou-waou/${name}</text><text x="1496" y="805" text-anchor="end" font-size="20">项目文字封面</text></g><path d="M1380 405l100-100m-100 0h100v100" stroke="#697850" stroke-width="5" fill="none"/></svg>`;
  await writeFile(path.join(root, 'assets/project-covers', name + '.svg'), svg);
}
const projectImage = name => {
  const asset = personalManifest.find(item => item.project === name || item.repository === name || item.repo === name);
  if (!asset) return './assets/project-covers/' + name + '.svg';
  const f = asset.file ?? asset.path ?? asset.filename;
  return f.startsWith('assets/') ? './' + f : './assets/personal/' + f.split('/').pop();
};
text('#works .chapter-label span:first-child', '02 / SELECTED PROJECTS');
text('#works .chapter-label span:last-child', '把想法做出来。');
html('#works .chapter-heading > div p', '工具、创作与一次次探索。<br>每一个项目，都是新的出发。');
$$('.film-item').forEach((item, i) => {
  const p = CONTENT.projects.find(p => p.name === featured[i]);
  const img = $('img', item);
  img.src = projectImage(p.name); img.removeAttribute('srcset');
  img.alt = `${titles[p.name]} · ${personalManifest.some(a => a.project === p.name) ? 'GitHub 仓库卡片' : '项目文字封面（非产品截图）'}`;
  const asset = personalManifest.find(a => (a.project ?? a.repository ?? a.repo) === p.name);
  if (asset?.type === 'github-og' || asset?.kind === 'github-og') item.classList.add('project-og');
  $$('.film-picture, .film-info h3 a', item).forEach(a => a.href = p.href);
  $('.film-picture', item).setAttribute('aria-label', `在 GitHub 查看：${titles[p.name]}`);
  text('.film-info h3 a', titles[p.name], item);
  text('.film-info > span', p.name === 'Snaploom' ? 'macOS · 桌面工具' : 'Agent Skill · 创作工具', item);
  text('.film-description', p.desc, item);
  text('.film-recognition', p.name, item);
  $('.film-recognition', item).classList.remove('film-prize');
  text('.film-index', `${String(i + 1).padStart(2, '0')} / ${p.name === 'Snaploom' ? 'macOS' : 'SKILL'}`, item);
  html('.film-watch', `VIEW PROJECT <span aria-hidden="true">${arrow}</span>`, item);
});
const more = $$('.works-more > a');
more[0].href = '#opensource'; more[0].removeAttribute('aria-haspopup');
text('.works-more-label', 'SKILLS & SIDE PROJECTS', more[0]);
html('strong', '点击查看我的更多<br>Skill 和个人项目', more[0]);
more[1].href = '#writing'; more[1].removeAttribute('target');
text('.works-more-label', 'WRITING / XIAOOU', more[1]);
html('strong', '关于 AI 与产品，<br>也写下一些思考。', more[1]);

const gh = $('#opensource .chapter-label a');
gh.href = CONTENT.github; gh.innerHTML = `GITHUB / XIAOOU-WAOU ${arrow}`;
html('#opensource-title', '让好的方法，<br><span>被更多人使用。</span>');
html('.source-intro > p:not(.chapter-eyebrow)', '有些探索，最后变成了 Skill 和工具。<br>它们在 GitHub，等着下一次被使用。');
$('.source-intro > a').href = CONTENT.github;
const remaining = CONTENT.projects.filter(p => !featured.includes(p.name));
html('.repo-list', remaining.map((p, i) => `<a class="repo" href="${esc(p.href)}" target="_blank" rel="noopener noreferrer" data-reveal="true"><div class="repo-top"><span>${String(i + 1).padStart(2, '0')} / ${['Snaploom', 'agent-reach', 'ui-devtool', 'personal-homepage'].includes(p.name) ? 'Side Project' : 'Agent Skill'}</span><span aria-hidden="true">${arrow}</span></div><h3>${esc(titles[p.name])}</h3><p>${esc(p.desc)}</p><div class="repo-bottom"><span class="repo-name">${esc(p.name)}</span><span>GitHub / 查看项目</span></div></a>`).join('') + '<p class="repo-license">项目代码与使用说明见仓库；具体使用范围以各项目许可为准。</p>');

// The same four flip-card shells now carry published articles, not contact CTAs.
const writing = $('#collaborate');
writing.id = 'writing';
writing.classList.add('writing-section');
writing.setAttribute('aria-labelledby', 'writing-title');
// Preserve previously shared #collaborate links without adding a visible block.
$('.possibilities-heading', writing).id = 'collaborate';
const writingTitle = $('#collaborate-title', writing);
writingTitle.id = 'writing-title';
writingTitle.innerHTML = `${esc(PROFILE.sections.writing.title)}。<br><span>关于 AI 与产品。</span>`;
text('.chapter-label span:first-child', '04 / SELECTED WRITING', writing);
text('.chapter-label span:last-child', 'AI、产品与人机协作。', writing);
text('.chapter-eyebrow', 'THOUGHTS, SHARED.', writing);
const categoryLabels = { Agent: 'AGENT', 'AI 产品': 'AI PRODUCT', 'AI 分身': 'AI IDENTITY', 'AI 社交': 'AI SOCIAL' };
$$('.service-card', writing).forEach((card, i) => {
  const article = CONTENT.articles[i];
  card.classList.add('writing-card');
  const platform = new URL(article.href).hostname === 'mp.weixin.qq.com' ? '微信公众号' : '人人都是产品经理';
  text('.service-card__front .service-card__label span:last-child', article.category, card);
  html('h3', `<a class="writing-title-link" href="${esc(article.href)}" target="_blank" rel="noopener noreferrer">${esc(article.title)}</a>`, card);
  text('.service-card__front > p', article.excerpt, card);
  $('.service-card__front > p', card).classList.add('writing-card-excerpt');
  html('ul', `<li><time datetime="${esc(article.date)}">${esc(article.date)}</time></li><li>${platform}</li>`, card);
  const articleLink = doc.createElement('a');
  articleLink.className = 'line-link';
  articleLink.href = article.href;
  articleLink.target = '_blank';
  articleLink.rel = 'noopener noreferrer';
  articleLink.setAttribute('aria-label', `阅读全文：${article.title}（新窗口打开）`);
  articleLink.innerHTML = `阅读全文 <span aria-hidden="true">${arrow}</span>`;
  $('.line-link', card).replaceWith(articleLink);
  text('.service-card__back .service-card__label span:last-child', 'XIAOOU / WRITING', card);
  text('.service-card__back-title', categoryLabels[article.category] || article.category, card);
  text('.service-card__back-footer span:first-child', `${article.date} / ${article.category}`, card);
});
const allWriting = doc.createElement('a');
allWriting.className = 'line-link writing-all';
allWriting.href = '#recognition';
allWriting.innerHTML = `查看全部 ${CONTENT.articles.length} 篇文章 <span aria-hidden="true">${arrow}</span>`;
writing.appendChild(allWriting);

text('#recognition .chapter-label span:first-child', '05 / WRITING ARCHIVE');
text('#recognition .chapter-label span:last-child', `全部 ${CONTENT.articles.length} 篇文章，持续更新。`);
html('#recognition-title', 'KEEP<br><span>THINKING.</span>');
html('.honors-heading > p', '关注 AI 产品、Agent 与人机协作。<br>偶尔写点思考，持续更新。');
html('.honors-field .glow-field__fallback', '<span>THINK</span><span>BUILD</span><span>KEEP</span><span>EXPLORING</span>');
html('.title-column', `<h3 class="honors-column-title"><span>持续关注</span><span>AREAS OF INTEREST</span></h3><div>${dimensions.map(([, title, desc]) => `<article class="honor-row title-row"><h4>${title}</h4><p>${desc}</p></article>`).join('')}<article class="honor-row title-row"><h4>${CONTENT.articles.length} 篇文章 · ${CONTENT.projects.length} 个项目</h4><p>AI 与产品思考 / Side Projects</p></article></div>${link('进入我的 GitHub', CONTENT.github, 'line-link')}`);
html('.awards-column', `<h3 class="honors-column-title"><span>文章与思考</span><span>SELECTED WRITING</span></h3><div>${CONTENT.articles.map(a => `<a class="honor-row award-row article-row" href="${esc(a.href)}" target="_blank" rel="noopener noreferrer"><span class="honor-year">${a.date.slice(5).replace('-', '.')}<small>${a.date.slice(0, 4)}</small></span><div><h4>${esc(a.title)}</h4><p class="article-category">${esc(a.category)}</p><p class="article-excerpt">${esc(a.excerpt)}</p></div><span class="honor-sign" aria-hidden="true">${arrow}</span></a>`).join('')}</div>`);

html('.contact-invitation h2', '下一个想法，<br><span>一起聊聊。</span>');
html('.contact-social > div', CONTENT.links.map(l => link(l.text, l.href)).join(''));
html('.site-signature > a:first-child', 'XIAOOU<span>/</span>');
// Footer keeps functional contact/navigation elements, without explanatory copy.
$$('footer .chapter-label, footer .chapter-eyebrow, footer .contact-social > p, footer .site-signature > span, footer .site-credit').forEach(node => node.remove());

// One global accessible dialog; no borrowed QR codes or pretend submissions.
contact.id = 'contact-dialog';
contact.setAttribute('aria-labelledby', 'contact-title');
$('h2', contact).id = 'contact-title';
html('.contact-dialog-copy', `<p>聊聊 AI 产品、Agent、人机协作，或者你的下一个想法。</p><a class="contact-profile" href="${CONTENT.github}" target="_blank" rel="noopener noreferrer"><img src="${esc(portraitSrc)}" width="120" height="120" alt="${esc(portraitAlt)}"><span><strong>小欧 / XIAOOU</strong><small>AI 产品经理</small></span>${arrow}</a><p class="contact-qr-note">在 GitHub 看项目，在人人都是产品经理读文章。</p><div class="dialog-socials">${CONTENT.links.map(l => link(l.text, l.href)).join('')}</div>`, contact);
$('textarea', contact).id = 'contact-brief';
$('label', contact).setAttribute('for', 'contact-brief');
text('textarea', '你好小欧，我想聊聊 AI 产品。\n\n我是谁：\n想交流的问题：\n目前的想法：\n我的联系方式：', contact);
text('.brief-status', '可直接编辑并复制。这段文字仅保存在当前页面，不会自动发送。', contact);
doc.body.appendChild(contact);

// The original SSR spells this attribute srcSet; linkedom preserves that case.
// Remove responsive reference candidates after replacing the image itself.
$$('img').forEach(img => {
  for (const attr of [...img.attributes]) {
    if (attr.name.toLowerCase() === 'srcset') img.removeAttribute(attr.name);
  }
});
// Make every referenced asset relative, so this folder also runs as a subpath.
$$('[src], [href], [srcset]').forEach(node => {
  for (const attr of ['src', 'href', 'srcset']) {
    const v = node.getAttribute(attr);
    if (v?.startsWith('/assets/')) node.setAttribute(attr, v.replaceAll('/assets/', './vendor-reference/assets/'));
  }
});
$$('audio').forEach(a => a.setAttribute('preload', 'none'));
$$('a[target="_blank"]').forEach(a => a.setAttribute('rel', 'noopener noreferrer'));
const script = doc.createElement('script'); script.type = 'module'; script.src = './app.js'; doc.body.appendChild(script);
const noScript = doc.createElement('noscript');
noScript.innerHTML = '<style>.world-entry{display:none!important}body:has(dialog[open]){overflow:auto}.hero-journey{height:100svh}.hero-copy{opacity:1!important}.hero-story{display:none}.hero-stage{min-height:600px}</style>';
doc.body.appendChild(noScript);

await mkdir(path.join(root, 'styles'), { recursive: true });
const css = await Promise.all(styles.map(p => readFile(path.join(ref, p), 'utf8')));
await writeFile(path.join(root, 'styles/reference.css'), '/* Reference CSS: dayuai.online; layout, typography and motion unchanged. Asset paths localized. */\n' + css.join('\n').replaceAll('/assets/', '../vendor-reference/assets/'));
const result = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
const forbidden = ['大羽的个人肖像', 'AIPlayerDayu', 'dayu-contact.png', 'space.bilibili', 'wdhsud7eok', '奥斯卡认证', '影视飓风', '你好大羽', 'self.__next', 'cloudflareinsights'];
for (const term of forbidden) if (result.includes(term)) throw new Error(`Reference personal content leaked into output: ${term}`);
await writeFile(path.join(root, 'index.html'), result);
console.log(`Built 个人网站二: ${CONTENT.articles.length} articles, ${CONTENT.projects.length} projects. Original archive untouched.`);
