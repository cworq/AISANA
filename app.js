(() => {
'use strict';
const DATA = window.MENTOR_DATA;
const DISC = DATA.disciplines, DIRS = DATA.directions, CITIES = DATA.cities;
const TOPIC = {};
Object.values(DISC).forEach(d => d.topics.forEach(t => { t.disc = d.id; TOPIC[t.id] = t; }));
const F = '```';

/* ================= state ================= */
const KEY = 'aimentor.v2';
const blank = () => ({ lang: 'ru', profile: null, answers: [], results: null, plan: null, done: {}, chat: [] });
let S = (() => { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && typeof v === 'object') return Object.assign(blank(), v); } catch (e) { } return blank(); })();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
let LANG = S.lang || 'ru';
function setLang(l) { LANG = S.lang = l; save(); document.documentElement.lang = l === 'kk' ? 'kk' : l; route(true); }
document.documentElement.lang = LANG;

/* ================= i18n ================= */
const tr = (ru, kk, en) => LANG === 'kk' ? kk : LANG === 'en' ? en : ru;
const L = o => o == null ? '' : typeof o === 'string' ? o : (o[LANG] != null ? o[LANG] : o.ru);
const TL = t => t.L[LANG] || t.L.ru;
const tn = id => TL(TOPIC[id]).n;
const curDir = () => (S.results && S.results.dir) || (S.profile && S.profile.dir) || OB.dir || 'phys';
const dname = (id, dir) => { const D = DIRS[dir || curDir()]; return L((D && D.nm && D.nm[id]) || DISC[id].name); };
const dn = id => dname(id);
const dshort = (id, dir) => { const n = dname(id, dir); return n.length > 14 ? n.split(' ')[0].replace(/[,.]$/, '') : n; };
const semcr = (id, dir) => { const D = DIRS[dir || curDir()]; return (D && D.sc && D.sc[id]) || [DISC[id].sem, DISC[id].cr]; };
const TYPE = () => ({ learn: tr('Разбор', 'Талдау', 'Learn'), practice: tr('Практика', 'Практика', 'Practice'), check: tr('Самопроверка', 'Тексеру', 'Self-check'), review: tr('Повторение', 'Қайталау', 'Review'), test: tr('Мини-тест', 'Мини-тест', 'Mini-test') });
const Q = x => LANG === 'en' ? `“${x}”` : `«${x}»`;
function pl(n, ru, kk, en) {
  if (LANG === 'kk') return kk;
  if (LANG === 'en') return n === 1 ? en[0] : en[1];
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? ru[0] : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? ru[1] : ru[2];
}
const num = (x, d = 1) => { const s = x.toFixed(d); return LANG === 'en' ? s : s.replace('.', ','); };
const SEC = () => tr('с', 'с', 's');
const MIN = () => tr('мин', 'мин', 'min');
const LVL = () => ({ e: tr('Запоминание', 'Есте сақтау', 'Remember'), m: tr('Понимание', 'Түсіну', 'Understand'), h: tr('Применение', 'Қолдану', 'Apply') });
const CYC = { BD: { ru: 'БД', kk: 'БП', en: 'Core' }, PD: { ru: 'ПД', kk: 'КП', en: 'Major' }, GE: { ru: 'ООД', kk: 'ЖБП', en: 'Gen. ed.' } };
const MON = { ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'], kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
const DOW = { ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'], kk: ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'], en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] };
const fmtDate = d => LANG === 'en' ? `${MON.en[d.getMonth()]} ${d.getDate()}` : `${d.getDate()} ${MON[LANG][d.getMonth()]}`;
const dow = d => DOW[LANG][d.getDay()];

/* ================= utils ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const pct = v => Math.round(v * 100);
const dayMs = 864e5;
let RUN = 0, TIMERS = [], OBS = [], SCROLLERS = [];
const every = (fn, ms) => { const id = setInterval(fn, ms); TIMERS.push(id); return id; };
const later = (fn, ms) => { const id = setTimeout(fn, ms); TIMERS.push(id); return id; };
function killAll() { TIMERS.forEach(id => { clearInterval(id); clearTimeout(id); }); TIMERS = []; OBS.forEach(o => o.disconnect()); OBS = []; SCROLLERS = []; }
window.addEventListener('scroll', () => SCROLLERS.forEach(f => f()), { passive: true });
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }
const go = h => { if (location.hash.slice(1) === h) route(); else location.hash = h; };
const statusOf = v => v == null ? 'none' : v >= .75 ? 'ok' : v >= .5 ? 'mid' : 'gap';
const colorOf = v => ({ ok: 'var(--ok)', mid: 'var(--mid)', gap: 'var(--gap)', none: 'var(--none)' })[statusOf(v)];
const raf = fn => { const tok = RUN; const loop = t => { if (tok !== RUN) return; if (fn(t) !== false) requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
function observe(nodes, cb, opt) { const o = new IntersectionObserver(es => es.forEach(e => cb(e.target, e.isIntersecting)), opt || { threshold: .25 }); nodes.forEach(n => o.observe(n)); OBS.push(o); return o; }

const ICON = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  checkc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  chev: '<svg class="think-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5"/></svg>'
};
const LOGO = `<svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="currentColor" opacity=".08"/><path d="M16 25V15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M16 17c4-.5 7-3.8 7-9.5-5 0-7 3.8-7 9.5z" fill="currentColor"/><path d="M16 15c-3.2-.4-6-3-6-7.5 4.1 0 6 3 6 7.5z" fill="currentColor" opacity=".55"/></svg>`;

/* ================= markdown ================= */
function highlight(code) {
  return code.replace(/(\d+(?:[.,]\d+)?)|([=→+−·\/√∫])|([^\d=→+−·\/√∫]+)/g, (m, n, k, o) => n ? `<span class="n">${n}</span>` : k ? `<span class="k">${esc(k)}</span>` : esc(o));
}
function codeBlock(code, lang) {
  const lab = lang === 'calc' ? tr('Решение', 'Шешуі', 'Solution') : (lang || 'code');
  return `<div class="code"><div class="code-h"><span>${lab}</span><button data-copy>${tr('Копировать', 'Көшіру', 'Copy')}</button></div><pre><code>${highlight(code)}</code></pre></div>`;
}
const inline = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
function md(src) {
  const lines = src.split('\n'); let out = '', i = 0, list = null;
  const closeList = () => { if (list) { out += `</${list}>`; list = null; } };
  while (i < lines.length) {
    const ln = lines[i]; let m;
    if (ln.startsWith(F)) { closeList(); const lang = ln.slice(3).trim(); const buf = []; i++; while (i < lines.length && !lines[i].startsWith(F)) { buf.push(lines[i]); i++; } i++; out += codeBlock(buf.join('\n'), lang); continue; }
    if ((m = ln.match(/^(#{1,3}) (.*)/))) { closeList(); const n = m[1].length + 2; out += `<h${n} class="md-h">${inline(m[2])}</h${n}>`; i++; continue; }
    if (ln.startsWith('$$')) { closeList(); out += `<div class="md-f">${inline(ln.replace(/\$\$/g, ''))}</div>`; i++; continue; }
    if (ln.startsWith('> ')) { closeList(); out += `<blockquote>${inline(ln.slice(2))}</blockquote>`; i++; continue; }
    if ((m = ln.match(/^\d+\. (.*)/)) || (m = ln.match(/^- (.*)/))) { const type = /^\d/.test(ln) ? 'ol' : 'ul'; if (list !== type) { closeList(); out += `<${type}>`; list = type; } out += `<li>${inline(m[1])}</li>`; i++; continue; }
    if (!ln.trim()) { closeList(); i++; continue; }
    closeList(); out += `<p>${inline(ln)}</p>`; i++;
  }
  closeList(); return out;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-copy]');
  if (b) {
    const code = b.closest('.code').querySelector('code').innerText;
    try { navigator.clipboard.writeText(code).then(() => { b.textContent = '✓'; setTimeout(() => b.textContent = tr('Копировать', 'Көшіру', 'Copy'), 1400); }, () => toast('—')); } catch (err) { }
  }
  $$('.menu.open').forEach(m => m.classList.remove('open'));
  const tg = e.target.closest('[data-tog]'); if (tg) tg.parentNode.classList.toggle('open');
});

/* ================= streaming + thinking ================= */
function placeCaret(box) {
  $$('.caret', box).forEach(c => c.remove());
  let tgt = box.lastElementChild || box;
  while (tgt && tgt.lastElementChild && !['BR', 'SPAN'].includes(tgt.lastElementChild.tagName) && tgt.tagName !== 'CODE') tgt = tgt.lastElementChild;
  (tgt || box).appendChild(el('<span class="caret"></span>'));
}
async function stream(box, text, tok, speed = 1) {
  const parts = text.match(/\s+|[^\s]{1,5}/g) || [];
  let acc = '', inCode = false, n = 0;
  for (const p of parts) {
    if (tok !== RUN) return false;
    acc += p;
    if (p.includes(F)) inCode = (acc.split(F).length - 1) % 2 === 1;
    if (++n % 2 === 0 || /[.!?:\n]/.test(p)) { box.innerHTML = md(inCode ? acc + '\n' + F : acc); placeCaret(box); }
    let d = inCode ? rnd(6, 14) : rnd(12, 30);
    if (/[.!?]$/.test(p)) d += rnd(80, 180); else if (/[,:;]$/.test(p)) d += rnd(25, 60);
    if (p.includes('\n\n')) d += 90;
    await sleep(d / speed);
  }
  box.innerHTML = md(text); return true;
}
async function typeInto(node, text, tok, ms = 10) {
  for (let i = 0; i <= text.length; i += 2) { if (tok !== RUN) return; node.textContent = text.slice(0, i); await sleep(ms); }
  node.textContent = text;
}
const stepsWord = n => `${n} ${pl(n, ['шаг', 'шага', 'шагов'], 'қадам', ['step', 'steps'])}`;
function Think(parent, label, tok) {
  const box = el(`<div class="think open"><button class="think-h" type="button"><span class="think-dot"></span><span class="think-l shimmer">${label}</span><span class="think-t mono">0.0 ${SEC()}</span>${ICON.chev}</button><div class="think-b"><div><ol class="think-steps"></ol></div></div></div>`);
  parent.appendChild(box);
  const steps = $('.think-steps', box), tEl = $('.think-t', box), lEl = $('.think-l', box);
  box.querySelector('.think-h').onclick = () => box.classList.toggle('open');
  const t0 = performance.now();
  const timer = every(() => { tEl.textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' ' + SEC(); }, 100);
  return {
    el: box,
    async step(text, detail, hold = 420) {
      if (tok !== RUN) return;
      const li = el('<li class="run"><div class="st"></div><div class="sd"></div></li>');
      steps.appendChild(li);
      await typeInto($('.st', li), text, tok, 9);
      if (detail) { const lines = [].concat(detail); const sd = $('.sd', li); let acc = ''; for (const ln of lines) { if (tok !== RUN) return; await sleep(rnd(120, 260)); acc += (acc ? '\n' : '') + ln; sd.textContent = acc; } }
      await sleep(hold + rnd(0, 380));
      li.classList.remove('run'); li.classList.add('ok');
    },
    finish(word) {
      clearInterval(timer);
      const s = num((performance.now() - t0) / 1000);
      lEl.classList.remove('shimmer'); lEl.textContent = `${word || tr('Обдумано', 'Ойластырылды', 'Thought')} ${tr('за', '—', 'for')} ${s} ${SEC()}`;
      tEl.textContent = stepsWord(steps.children.length);
      box.classList.add('done'); box.classList.remove('open');
      return s;
    }
  };
}
const thinkStatic = (steps, secs) => `<div class="think done"><button class="think-h" type="button" data-tog><span class="think-dot"></span><span class="think-l">${tr('Обдумано за', 'Ойластырылды —', 'Thought for')} ${secs} ${SEC()}</span><span class="think-t mono">${stepsWord(steps.length)}</span>${ICON.chev}</button><div class="think-b"><div><ol class="think-steps">${steps.map(s => `<li class="ok"><div class="st">${esc(s[0])}</div><div class="sd">${esc([].concat(s[1] || []).join('\n'))}</div></li>`).join('')}</ol></div></div></div>`;

/* ================= garden imagery ================= */
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const PAL = {
  light: { sky: ['#f6f3ea', '#e9ecdf', '#c7d3b2', '#8ea476'], green: ['#5f7f45', '#87a36a', '#3f5d2e', '#a9be8b', '#6f8f52', '#c3d1a6', '#4f6e3a'], white: '#ffffff', blue: '#9ab9e6' },
  dark: { sky: ['#3a4a2c', '#2f3d24', '#25321c', '#161f10'], green: ['#4f6b3c', '#30442a', '#6d8a52', '#22301b', '#5b7a46', '#3d5530', '#7f9a62'], white: '#e7ecdd', blue: '#86a6cf' }
};
function flower(c, x, y, s, col) { c.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * 1.2566; c.beginPath(); c.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * .85, 0, 7); c.fill(); } c.fillStyle = '#ead47c'; c.beginPath(); c.arc(x, y, s * .45, 0, 7); c.fill(); }
function paintLayer(cv, kind, seed, dark) {
  const W = cv.width = 900, H = cv.height = 560, c = cv.getContext('2d'), r = mulberry(seed), P = dark ? PAL.dark : PAL.light;
  c.clearRect(0, 0, W, H);
  if (kind === 'far') {
    const g = c.createLinearGradient(0, 0, 0, H); P.sky.forEach((s, i) => g.addColorStop(i / (P.sky.length - 1), s)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { c.globalAlpha = rnd(.25, .55); c.fillStyle = P.green[i % P.green.length]; c.beginPath(); c.ellipse(r() * W, H * .2 + r() * H * .6, 60 + r() * 140, 40 + r() * 90, r() * 3, 0, 7); c.fill(); }
    const b = c.createRadialGradient(W * .78, H * .12, 10, W * .78, H * .12, W * .45); b.addColorStop(0, dark ? 'rgba(255,248,220,.25)' : 'rgba(255,252,236,.95)'); b.addColorStop(1, 'rgba(255,255,255,0)'); c.globalAlpha = 1; c.fillStyle = b; c.fillRect(0, 0, W, H);
  } else if (kind === 'mid') {
    for (let i = 0; i < 50; i++) { c.globalAlpha = rnd(.35, .7); c.fillStyle = P.green[i % P.green.length]; c.beginPath(); c.ellipse(r() * W, H * .42 + r() * H * .6, 30 + r() * 80, 18 + r() * 50, r() * 3, 0, 7); c.fill(); }
    for (let i = 0; i < 420; i++) {
      const x = r() * W, h = 70 + r() * 260, base = H + 10, lean = (r() - .5) * 110;
      c.globalAlpha = rnd(.4, .9); c.strokeStyle = P.green[(i * 7) % P.green.length]; c.lineWidth = 1.2 + r() * 3.5;
      c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + lean * .3, base - h * .6, x + lean, base - h); c.stroke();
    }
    for (let i = 0; i < 46; i++) { const cx = r() * W, cy = H * .38 + r() * H * .55, n = 5 + (r() * 11 | 0); for (let k = 0; k < n; k++) { c.globalAlpha = rnd(.8, 1); flower(c, cx + (r() - .5) * 70, cy + (r() - .5) * 44, 2.5 + r() * 4, P.white); } }
    for (let i = 0; i < 90; i++) { c.globalAlpha = rnd(.6, .95); flower(c, r() * W, H * .5 + r() * H * .48, 1.8 + r() * 2.2, P.blue); }
  } else {
    for (let i = 0; i < 60; i++) { const x = r() < .5 ? r() * W * .3 : W * .7 + r() * W * .3; c.globalAlpha = rnd(.5, .9); c.strokeStyle = P.green[i % P.green.length]; c.lineWidth = 5 + r() * 9; c.beginPath(); c.moveTo(x, H + 20); c.quadraticCurveTo(x + (r() - .5) * 60, H - 120, x + (r() - .5) * 160, H - 160 - r() * 200); c.stroke(); }
    for (let i = 0; i < 16; i++) { const x = r() < .5 ? r() * W * .28 : W * .72 + r() * W * .28; c.globalAlpha = rnd(.75, 1); flower(c, x, H * .72 + r() * H * .3, 10 + r() * 12, P.white); }
  }
  c.globalAlpha = 1;
}
function gardenScene(seed, opts = {}) {
  const dark = !!opts.dark;
  const g = el(`<div class="garden ${dark ? 'dark' : ''}"><div class="kb"><canvas class="lay far"></canvas><canvas class="lay mid"></canvas><canvas class="lay near"></canvas></div>${opts.rays ? '<div class="rays r1"></div><div class="rays r2"></div>' : ''}${opts.pollen ? '<canvas class="pollen"></canvas>' : ''}<div class="fade"></div></div>`);
  ['far', 'mid', 'near'].forEach((k, i) => paintLayer($('.' + k, g), k, seed + i * 31, dark));
  if (opts.pollen) startPollen($('.pollen', g));
  if (opts.parallax) {
    const lays = $$('.lay', g), k = [6, 14, 28];
    const host = opts.parallax;
    host.addEventListener('mousemove', e => { const r = host.getBoundingClientRect(); const mx = (e.clientX - r.left) / r.width - .5, my = (e.clientY - r.top) / r.height - .5; lays.forEach((l, i) => l.style.transform = `translate3d(${-mx * k[i]}px, ${-my * k[i] * .6}px, 0)`); });
  }
  return g;
}
function startPollen(cv) {
  const c = cv.getContext('2d'); let W = 0, H = 0;
  const fit = () => { W = cv.width = cv.clientWidth || 1200; H = cv.height = cv.clientHeight || 800; };
  setTimeout(fit, 30);
  const ps = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(.6, 2.2), s: rnd(.00004, .00016), ph: rnd(0, 6.28), a: rnd(.3, .9) }));
  raf(t => {
    if (!cv.isConnected) return false;
    if (!W) return;
    c.clearRect(0, 0, W, H);
    ps.forEach(p => {
      p.y -= p.s * 16; if (p.y < -.02) { p.y = 1.02; p.x = Math.random(); }
      const x = (p.x + Math.sin(t / 2400 + p.ph) * .012) * W, y = p.y * H;
      c.globalAlpha = p.a * (.55 + .45 * Math.sin(t / 700 + p.ph));
      c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(x, y, p.r, 0, 7); c.fill();
    });
  });
}
function glassOrb(seed, opts = {}) {
  const o = el(`<div class="orb ${opts.cls || ''}"><div class="orb-glow"></div><div class="orb-ball"><canvas class="orb-c"></canvas><div class="orb-hl"></div>${opts.inner || ''}</div></div>`);
  const cv = $('.orb-c', o), c = cv.getContext('2d'); const N = 420; cv.width = cv.height = N;
  const far = document.createElement('canvas'), mid = document.createElement('canvas');
  paintLayer(far, 'far', seed, !!opts.dark); paintLayer(mid, 'mid', seed + 31, !!opts.dark);
  raf(t => {
    if (!o.isConnected && t > 3000) return false;
    const a = Math.sin(t / 5200) * .05, sx = Math.sin(t / 7000) * 18;
    c.clearRect(0, 0, N, N); c.save(); c.beginPath(); c.arc(N / 2, N / 2, N / 2, 0, 7); c.clip();
    c.translate(N / 2, N / 2); c.rotate(Math.PI + a); c.scale(1.05, 1.05);
    c.drawImage(far, -N * .9 + sx, -N * .62, N * 1.8, N * 1.12); c.drawImage(mid, -N * .9 + sx * 1.6, -N * .62, N * 1.8, N * 1.12);
    c.restore();
  });
  return o;
}

/* ================= analysis engine ================= */
function analyze(profile, answers) {
  const dir = DIRS[profile.dir], topicM = {}, disc = {};
  dir.disc.forEach(did => {
    const d = DISC[did], ans = answers.filter(a => a.disc === did), by = {};
    ans.forEach(a => by[a.lvl] = a);
    const tE = d.topics.find(t => t.lvl === 'e'), tH = d.topics.find(t => t.lvl === 'h');
    let base;
    if (by.m && by.m.ok) { base = by.h && by.h.ok ? 91 : 67; topicM[tE.id] = { v: .88, src: 'inferred' }; }
    else { base = by.e && by.e.ok ? 43 : 16; topicM[tH.id] = { v: by.e && by.e.ok ? .3 : .14, src: 'inferred' }; }
    ans.forEach(a => topicM[a.topic] = { v: a.ok ? (a.lvl === 'h' ? .92 : .86) : (a.idk ? .1 : .24), src: 'tested' });
    const avgMs = ans.reduce((s, a) => s + a.ms, 0) / Math.max(1, ans.length);
    const adj = clamp(Math.round((16000 - avgMs) / 3500), -5, 5);
    disc[did] = { v: clamp(base + adj - ans.filter(a => a.idk).length * 3, 4, 98) / 100, avgMs };
  });
  const gaps = Object.keys(topicM).filter(id => topicM[id].v < .5), gs = new Set(gaps);
  const roots = gaps.filter(id => !TOPIC[id].pre.some(p => gs.has(p)));
  const desc = r => { const out = [], q = [r]; while (q.length) { const c = q.shift(); gaps.forEach(id => { if (!out.includes(id) && TOPIC[id].pre.includes(c)) { out.push(id); q.push(id); } }); } return out; };
  const groups = roots.map(r => ({ root: r, affects: desc(r) })).sort((a, b) => b.affects.length - a.affects.length || disc[TOPIC[a.root].disc].v - disc[TOPIC[b.root].disc].v);
  const vals = Object.values(disc).map(d => d.v);
  return { dir: dir.id, date: Date.now(), topicM, disc, gaps, roots, groups, overall: vals.reduce((s, v) => s + v, 0) / vals.length };
}
function gapLevel(id, gs, memo = {}) { if (memo[id] != null) return memo[id]; const ps = TOPIC[id].pre.filter(p => gs.has(p)); return memo[id] = ps.length ? 1 + Math.max(...ps.map(p => gapLevel(p, gs, memo))) : 0; }
function gradeOf(p) { const t = [[95, 'A'], [90, 'A−'], [85, 'B+'], [80, 'B'], [75, 'B−'], [70, 'C+'], [65, 'C'], [60, 'C−'], [55, 'D+'], [50, 'D']]; for (const [v, g] of t) if (p >= v) return g; return 'F'; }
const forecast = R => clamp(Math.round(R.overall * 100 * .55 + 38 - R.groups.length), 30, 99);
function buildPlan(profile, R) {
  const per = profile.minutes, days = profile.weeks * 7, gs = new Set(R.gaps), memo = {};
  const order = R.gaps.slice().sort((a, b) => gapLevel(a, gs, memo) - gapLevel(b, gs, memo) || R.disc[TOPIC[a].disc].v - R.disc[TOPIC[b].disc].v || R.topicM[a].v - R.topicM[b].v);
  const M = per >= 90 ? { l: 15, p: 20, c: 5, n: 2, k: 8 } : per >= 60 ? { l: 15, p: 25, c: 10, n: 1, k: 10 } : { l: 10, p: 15, c: 5, n: 1, k: 6 };
  const items = [], learned = {}, weak = DIRS[R.dir].disc.slice().sort((a, b) => R.disc[a].v - R.disc[b].v);
  let qi = 0, deep = 0;
  for (let d = 0; d < days; d++) {
    if (d % 7 === 6) { items.push({ id: `test-${d}`, day: d, type: 'test', min: 20 }); continue; }
    let added = 0;
    while (added < M.n && qi < order.length) {
      const t = order[qi++]; learned[t] = d; added++;
      items.push({ id: `learn-${t}-${d}`, day: d, type: 'learn', topic: t, min: M.l });
      items.push({ id: `practice-${t}-${d}`, day: d, type: 'practice', topic: t, min: M.p, k: M.k });
      items.push({ id: `check-${t}-${d}`, day: d, type: 'check', topic: t, min: M.c });
    }
    if (!added) { const did = weak[deep++ % weak.length], ht = DISC[did].topics.find(t => t.lvl === 'h'); items.push({ id: `deep-${ht.id}-${d}`, day: d, type: 'practice', topic: ht.id, deep: did, min: per - 10 }); }
  }
  Object.entries(learned).forEach(([t, d]) => [2, 6, 13].forEach(o => { if (d + o < days) items.push({ id: `review-${t}-${d + o}`, day: d + o, type: 'review', topic: t, o, min: 5 }); }));
  const ord = { learn: 0, practice: 1, check: 2, review: 3, test: 4 };
  items.sort((a, b) => a.day - b.day || ord[a.type] - ord[b.type]);
  const s = new Date(); s.setHours(0, 0, 0, 0);
  return { start: s.getTime(), days, per, weeks: profile.weeks, items, topics: order.length };
}
const planDay = P => clamp(Math.floor((Date.now() - P.start) / dayMs), 0, P.days - 1);
function itemTitle(i) {
  const n = i.topic ? tn(i.topic) : '';
  switch (i.type) {
    case 'learn': return tr(`Разбор темы «${n}» с ментором`, `«${n}» тақырыбын тәлімгермен талдау`, `Walk through “${n}” with Mentor`);
    case 'practice': return i.deep ? tr(`Углубление: задачи повышенной сложности — ${dn(i.deep)}`, `Тереңдету: күрделі есептер — ${dn(i.deep)}`, `Going deeper: advanced problems — ${dn(i.deep)}`) : tr(`Практика: ${i.k} задач по «${n}»`, `Практика: «${n}» бойынша ${i.k} есеп`, `Practice: ${i.k} problems on “${n}”`);
    case 'check': return tr(`Самопроверка: «${n}»`, `Өзін-өзі тексеру: «${n}»`, `Self-check: “${n}”`);
    case 'review': return tr(`Повторение «${n}» · интервал +${i.o} дн.`, `«${n}» қайталау · аралық +${i.o} күн`, `Review “${n}” · interval +${i.o} d`);
    default: return tr('Мини-диагностика недели · 6 вопросов', 'Апталық мини-диагностика · 6 сұрақ', 'Weekly mini-diagnostic · 6 questions');
  }
}

/* ================= header / footer ================= */
function langSwitch(cls = '') {
  return `<div class="lang ${cls}">${[['kk', 'ҚАЗ'], ['ru', 'РУС'], ['en', 'ENG']].map(([k, l]) => `<button data-lang="${k}" class="${LANG === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
}
function wireLang(root) { $$('[data-lang]', root).forEach(b => b.onclick = e => { e.stopPropagation(); if (b.dataset.lang !== LANG) setLang(b.dataset.lang); }); }
function planLeft() { if (!S.plan) return ''; const d = planDay(S.plan); return S.plan.items.filter(i => i.day === d && !S.done[i.id]).length || '✓'; }
function renderHeader(mode, active) {
  const top = $('#top'); top.className = 'top ' + mode;
  const P = S.profile, R = S.results;
  const nav = mode === 'land'
    ? `<nav class="pill-nav"><a href="#home" data-scroll="how">${tr('Как работает', 'Қалай жұмыс істейді', 'How it works')}</a><a href="#home" data-scroll="unite">${tr('Возможности', 'Мүмкіндіктер', 'Features')}</a><a href="#home" data-scroll="progs">${tr('Программы', 'Бағдарламалар', 'Programmes')}</a></nav>`
    : `<nav class="pill-nav">${R ? `<a href="#dashboard" class="${active === 'dashboard' ? 'on' : ''}">${tr('Обзор', 'Шолу', 'Overview')}</a><a href="#plan" class="${active === 'plan' ? 'on' : ''}">${tr('План', 'Жоспар', 'Plan')} <span class="cnt">${planLeft()}</span></a><a href="#mentor" class="${active === 'mentor' ? 'on' : ''}">${tr('Ментор', 'Тәлімгер', 'Mentor')}</a>` : ''}<a href="#start" class="${['start', 'test'].includes(active) ? 'on' : ''}">${tr('Диагностика', 'Диагностика', 'Diagnostic')}</a></nav>`;
  const right = P && R
    ? `<div class="menu"><button class="avatar" id="av">${esc((P.name || 'S')[0].toUpperCase())}</button><div class="menu-pop"><div class="mh"><b>${esc(P.name)}</b><span>${DIRS[P.dir].code} · ${P.course} ${tr('курс', 'курс', 'year')}</span></div><button data-act="dash">${tr('Карта знаний', 'Білім картасы', 'Knowledge map')}</button><button data-act="retest">${tr('Пройти диагностику заново', 'Диагностиканы қайта өту', 'Retake the diagnostic')}</button><button data-act="reset">${tr('Сбросить прогресс', 'Прогресті тазарту', 'Reset progress')}</button></div></div>`
    : (['start', 'test'].includes(active) ? '' : `<a class="btn sm ${mode === 'land' ? 'frost' : ''}" href="#start">${tr('Начать', 'Бастау', 'Start')}</a>`);
  top.innerHTML = `<div class="top-in"><a class="brand" href="#home">${LOGO}Mentor<small>beta</small></a>${nav}<div class="top-r">${langSwitch()}${right}</div></div>`;
  wireLang(top);
  $$('[data-scroll]', top).forEach(a => a.onclick = e => { e.preventDefault(); const t = document.getElementById(a.dataset.scroll); t && t.scrollIntoView({ behavior: 'smooth' }); });
  const av = $('#av', top);
  if (av) {
    av.onclick = e => { e.stopPropagation(); av.parentNode.classList.toggle('open'); };
    $$('[data-act]', top).forEach(b => b.onclick = () => {
      if (b.dataset.act === 'dash') go('dashboard');
      else if (b.dataset.act === 'retest') { TEST = null; go('test'); }
      else { const l = LANG; S = blank(); S.lang = l; save(); TEST = null; toast(tr('Прогресс сброшен', 'Прогресс тазартылды', 'Progress reset')); go('home'); }
    });
  }
}
function renderFooter() {
  $('#foot').innerHTML = `<div class="wrap"><a class="brand" href="#home">${LOGO}Mentor</a><nav><a href="#start">${tr('Диагностика', 'Диагностика', 'Diagnostic')}</a><a href="#mentor">${tr('Ментор', 'Тәлімгер', 'Mentor')}</a><a href="#plan">${tr('План', 'Жоспар', 'Plan')}</a></nav><span>© 2026 AI Mentor · ${tr('Павлодар · Астана', 'Павлодар · Астана', 'Pavlodar · Astana')}</span></div>`;
}

/* ================= landing ================= */
const VERBS = () => tr(['объясняет', 'диагностирует', 'находит пробелы', 'строит план', 'проверяет'], ['түсіндіреді', 'диагностикалайды', 'олқылықты табады', 'жоспар құрады', 'тексереді'], ['explains', 'diagnoses', 'finds gaps', 'builds plans', 'checks']);
const QUERIES = () => tr(
  ['Почему в лифте, который разгоняется вверх, я тяжелее?', 'Объясни закон Ома так, чтобы я понял к завтрашнему коллоквиуму', 'Где у меня пробелы перед сессией по механике?', 'Составь план на 2 недели до экзамена по термодинамике', 'Почему КПД тепловой машины не может быть 100%?', 'Дай 5 задач на законы сохранения — от простой к сложной', 'Я путаю последовательное и параллельное соединение. Помоги', 'Что такое фотоэффект простыми словами?'],
  ['Жоғары үдейтін лифтте неге ауырырақ боламын?', 'Ертеңгі коллоквиумға дейін түсінетіндей Ом заңын түсіндір', 'Механикадан сессия алдында қай жерде олқылықтарым бар?', 'Термодинамика емтиханына дейін 2 аптаға жоспар құр', 'Жылу машинасының ПӘК-і неге 100% бола алмайды?', 'Сақталу заңдарына 5 есеп бер — жеңілден күрделіге', 'Тізбектей және параллель жалғауды шатастырамын. Көмектес', 'Фотоэффект деген не, қарапайым тілмен?'],
  ['Why do I feel heavier in a lift accelerating upward?', "Explain Ohm's law so I get it before tomorrow's quiz", 'Where are my gaps in mechanics before exams?', 'Make a 2-week plan for my thermodynamics exam', "Why can't a heat engine be 100% efficient?", 'Give me 5 conservation-law problems, easy to hard', 'I mix up series and parallel circuits. Help', 'What is the photoelectric effect, in plain words?']);
const STATUSES = () => tr(['Читает учебный план', 'Строит граф тем', 'Ищет корневую причину', 'Готовит объяснение', 'Подбирает задачи'], ['Оқу жоспарын оқып жатыр', 'Тақырыптар графын құрып жатыр', 'Түпкі себебін іздеп жатыр', 'Түсіндірме дайындап жатыр', 'Есептер іріктеп жатыр'], ['Reading the curriculum', 'Building the topic graph', 'Finding the root cause', 'Preparing an explanation', 'Picking practice problems']);
function pageHome() {
  renderHeader('land');
  const v = $('#view');
  const manifesto = tr('Mentor — это не чат-бот, который просто отвечает на вопросы. Это наставник, который знает твою программу, видит, где ты ошибаешься, и строит путь к сессии. Чат отвечает. Репетитор объясняет. Mentor ведёт.',
    'Mentor — сұрақтарға жай жауап беретін чат-бот емес. Бұл сенің бағдарламаңды білетін, қай жерде қателесетініңді көретін және сессияға жол салатын тәлімгер. Чат жауап береді. Репетитор түсіндіреді. Mentor бастап жүреді.',
    "Mentor isn't a chatbot that just answers questions. It's a mentor that knows your programme, sees where you go wrong and builds your path to exams. A chat answers. A tutor explains. Mentor leads.");
  const steps = [
    ['01', '/diagnose', tr('Адаптивная диагностика', 'Бейімделгіш диагностика', 'Adaptive diagnostic'), tr('По 2 вопроса на дисциплину. Ответил верно — следующий сложнее, ошибся — Mentor проверяет базу. Около 7 минут.', 'Әр пәнге 2 сұрақтан. Дұрыс жауап берсең — келесісі қиынырақ, қателессең — Mentor негізін тексереді. Шамамен 7 минут.', 'Two questions per course. Answer right and the next one gets harder; miss one and Mentor checks the basics. About 7 minutes.'), 'diag'],
    ['02', '/analyze', tr('Карта пробелов', 'Олқылықтар картасы', 'Gap map'), tr('Граф тем с пререквизитами: видно не только что ты не знаешь, но и из-за чего. Ошибки в индукции часто растут из производной.', 'Пререквизиттері бар тақырыптар графы: нені білмейтініңді ғана емес, неліктен екенін де көресің. Индукциядағы қателер көбіне туындыдан басталады.', "A topic graph with prerequisites shows not just what you don't know, but why. Mistakes in induction often grow out of derivatives."), 'graph'],
    ['03', '/explain', tr('План и объяснения', 'Жоспар және түсіндірмелер', 'Plan and explanations'), tr('Сначала база, потом то, что на ней строится. Объяснения простым языком, интервальные повторения и самопроверка.', 'Алдымен негіз, содан кейін соның үстіне құрылатын тақырыптар. Қарапайым тілмен түсіндіру, аралықты қайталау және өзін-өзі тексеру.', 'Basics first, then what builds on them. Plain-language explanations, spaced repetition and self-checks.'), 'explain']
  ];
  v.innerHTML = `
  <section class="hero" id="hero">
    <div class="qstack-wrap"><div class="qstack" id="qstack"></div></div>
    <div class="hero-c">
      <h1 class="hl"><span class="hl-a">Mentor</span><span class="hl-w" id="hlw"></span></h1>
      <p class="hero-sub">${tr('Персональный ИИ-наставник по всем дисциплинам твоей образовательной программы. Находит, где именно ты отстаёшь, и ведёт к сессии.', 'Білім беру бағдарламаңның барлық пәндері бойынша жеке ЖИ-тәлімгер. Қай жерде артта қалғаныңды дәл тауып, сессияға дейін бастап барады.', "A personal AI mentor for every course in your degree programme. It finds exactly where you're behind and guides you to your exams.")}</p>
      <div class="hero-ctas"><a class="btn" href="#start">${tr('Пройти диагностику', 'Диагностикадан өту', 'Take the diagnostic')} ${ICON.arrow}</a><button class="btn frost" data-demo>${tr('Демо-профиль', 'Демо-профиль', 'Demo profile')}</button></div>
    </div>
    <div class="hstatus" id="hstatus"><span class="hs-dot"></span><span class="hs-a">${tr('Mentor думает', 'Mentor ойланып жатыр', 'Mentor is thinking')}</span><span class="hs-b" id="hsb"></span><span class="hs-dots"><i></i><i></i><i></i></span></div>
    <div class="scroll-cue"><span></span></div>
  </section>
  <section class="manifesto" id="manif"><div class="wrap"><p class="mf" id="mf">${manifesto.split(' ').map(w => `<span>${esc(w)}</span>`).join(' ')}</p></div></section>
  <section class="unite" id="unite"><svg class="ribbon" viewBox="0 0 1440 820" preserveAspectRatio="xMidYMid slice"></svg><div class="unite-c"><h2 class="h-sec">${tr('Mentor объединяет', 'Mentor біріктіреді', 'Mentor brings together')}</h2></div></section>
  <section class="sec how" id="how"><div class="wrap">
    <div class="sec-h rv"><h2 class="h-sec">${tr('Как это работает', 'Бұл қалай жұмыс істейді', 'How it works')}</h2><p class="lead" style="max-width:420px;margin:0">${tr('Три шага от «не понимаю» до плана на каждый день.', '«Түсінбеймін»-нен күнделікті жоспарға дейін үш қадам.', "Three steps from “I don't get it” to a plan for every day.")}</p></div>
    ${steps.map(s => `<div class="step rv"><div class="step-t"><span class="num">${s[0]}</span><h3>${s[2]}</h3><p>${s[3]}</p></div><div class="demo" data-demo-kind="${s[4]}"><div class="win"><div class="win-h"><i></i><i></i><i></i><span class="mono">Mentor · ${s[2]}</span></div><div class="win-b"></div></div></div></div>`).join('')}
  </div></section>
  <section class="sec" id="progs"><div class="wrap">
    <div class="sec-h rv"><h2 class="h-sec">${tr('Знает твою программу', 'Бағдарламаңды біледі', 'Knows your programme')}</h2><p class="lead" style="max-width:420px;margin:0">${tr('Дисциплины, семестры и кредиты — из учебных планов программ Торайгыров университета, Павлодар.', 'Пәндер, семестрлер мен кредиттер — Торайғыров университеті (Павлодар) бағдарламаларының оқу жоспарларынан.', 'Courses, semesters and credits come from the curricula of Toraighyrov University programmes in Pavlodar.')}</p></div>
    <div class="prog-list">${Object.values(DIRS).map(d => `<div class="prog rv"><span class="mono muted" style="font-size:12px">${d.code} · ${L(d.group)} · ${L(DATA.university)}</span><h3 class="serif" style="font-size:26px;margin:0;font-weight:400">${L(d.name)}</h3><div class="tags">${d.disc.map(x => `<span class="tag">${dname(x, d.id)} · ${semcr(x, d.id)[0]} ${tr('сем.', 'сем.', 'sem.')}</span>`).join('')}</div></div>`).join('')}</div>
    <div class="facts rv"><div><b>${Object.keys(DIRS).length}</b><span>${tr('образовательные программы', 'білім беру бағдарламасы', 'degree programmes')}</span></div><div><b>${Object.keys(DISC).length}</b><span>${tr('профильных дисциплин', 'бейіндік пән', 'core courses')}</span></div><div><b>${Object.keys(TOPIC).length}</b><span>${tr('тема в графе знаний', 'тақырып білім графында', 'topics in the graph')}</span></div><div><b>3</b><span>${tr('языка: қазақша, русский, English', 'тіл: қазақша, русский, English', 'languages: Kazakh, Russian, English')}</span></div></div>
  </div></section>
  <section class="final" id="final"><div class="wrap final-in"><div class="final-orb" id="forb"></div><div><h2 class="h-sec">${tr('Начни с семи минут честной диагностики', 'Жеті минуттық адал диагностикадан баста', 'Start with seven minutes of honest diagnostics')}</h2><p class="lead" style="color:rgba(250,248,245,.7);margin:18px 0 28px">${tr('Казахский, русский или английский — Mentor говорит на языке, на котором ты учишься.', 'Қазақша, орысша немесе ағылшынша — Mentor сен оқитын тілде сөйлейді.', 'Kazakh, Russian or English — Mentor speaks the language you study in.')}</p><a class="btn light" href="#start">${tr('Пройти диагностику', 'Диагностикадан өту', 'Take the diagnostic')} ${ICON.arrow}</a></div></div></section>`;
  const hero = $('#hero');
  hero.prepend(gardenScene(11, { rays: true, pollen: true, parallax: hero }));
  hero.appendChild(glassOrb(11, { cls: 'hero-orb' }));
  $('#unite').prepend(gardenScene(5, { dark: true, pollen: true }));
  $('#final').prepend(gardenScene(23, { dark: true, rays: true }));
  $('#forb').appendChild(glassOrb(41, { dark: true, cls: 'small', inner: `<div class="orb-logo">${LOGO}</div>` }));
  $$('[data-demo]', v).forEach(b => b.onclick = loadDemo);
  heroHeadline(); heroQueries(); heroStatus(); manifestoScroll(); ribbon(); demos();
  observe($$('.rv'), (n, on) => on && n.classList.add('in'), { threshold: .15 });
  const onScroll = () => { const y = window.scrollY; $('#top').classList.toggle('scrolled', y > window.innerHeight * .75); const o = $('.hero-orb'); if (o) o.style.setProperty('--sy', (y * .25) + 'px'); };
  SCROLLERS.push(onScroll); onScroll();
}
function heroHeadline() {
  const w = $('#hlw'), verbs = VERBS();
  w.innerHTML = verbs.map((x, i) => `<span class="w ${i === 0 ? 'on' : ''}">${x}</span>`).join('');
  let i = 0;
  every(() => { const ws = $$('.w', w); if (!ws.length) return; ws[i].classList.remove('on'); ws[i].classList.add('out'); const prev = ws[i]; later(() => prev.classList.remove('out'), 700); i = (i + 1) % ws.length; ws[i].classList.add('on'); }, 2600);
}
function heroQueries() {
  const box = $('#qstack'), qs = QUERIES(); let n = 0;
  const card = () => {
    const txt = qs[n % qs.length]; n++;
    const c = el(`<div class="hq"><span class="q-num mono">${String(n).padStart(2, '0')}</span><p class="q-text">${txt.split('').map((ch, k) => `<span style="animation-delay:${k * 14}ms">${ch === ' ' ? ' ' : esc(ch)}</span>`).join('')}</p></div>`);
    box.appendChild(c); return c;
  };
  for (let k = 0; k < 3; k++) card();
  every(() => {
    if (!box.isConnected) return;
    const first = box.firstElementChild; if (!first) return;
    const h = first.offsetHeight + 10;
    card();
    box.style.transition = 'transform 1000ms cubic-bezier(.72,0,.24,1)'; box.style.transform = `translate3d(0,${-h}px,0)`;
    first.classList.add('gone');
    later(() => { first.remove(); box.style.transition = 'none'; box.style.transform = 'none'; }, 1050);
  }, 3400);
}
function heroStatus() {
  const b = $('#hsb'), st = STATUSES(); let i = 0;
  const set = () => { b.classList.remove('flash'); void b.offsetWidth; b.textContent = '· ' + st[i++ % st.length]; b.classList.add('flash'); };
  set(); every(set, 2200);
}
function manifestoScroll() {
  const sec = $('#manif'), ws = $$('#mf span');
  const f = () => { const r = sec.getBoundingClientRect(); const p = clamp((window.innerHeight * .85 - r.top) / (r.height * .9), 0, 1); const k = Math.round(p * ws.length); ws.forEach((w, i) => w.classList.toggle('lit', i < k)); };
  SCROLLERS.push(f); f();
}
function ribbon() {
  const svg = $('.ribbon'), items = tr(['Адаптивная диагностика', 'Граф пререквизитов', 'Корневые причины', 'Интервальные повторения', 'Объяснения простым языком', 'Қазақша · Русский · English', 'План на каждый день', 'Механика', 'Термодинамика', 'Оптика', 'Электричество', 'Атомная физика'],
    ['Бейімделгіш диагностика', 'Пререквизиттер графы', 'Түпкі себептер', 'Аралықты қайталау', 'Қарапайым тілмен түсіндіру', 'Қазақша · Русский · English', 'Күнделікті жоспар', 'Механика', 'Термодинамика', 'Оптика', 'Электр', 'Атом физикасы'],
    ['Adaptive diagnostics', 'Prerequisite graph', 'Root causes', 'Spaced repetition', 'Plain-language explanations', 'Қазақша · Русский · English', 'A plan for every day', 'Mechanics', 'Thermodynamics', 'Optics', 'Electricity', 'Atomic physics']);
  const one = items.join('  ✦  ') + '  ✦  ';
  const paths = ['M -300 640 C 120 360, 520 820, 900 540 S 1480 180, 1760 300', 'M -300 250 C 260 60, 640 520, 1060 300 S 1500 80, 1760 170'];
  svg.innerHTML = `<defs>${paths.map((d, i) => `<path id="rp${i}" d="${d}"/>`).join('')}<linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".5" stop-color="#fff" stop-opacity=".92"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient></defs>
    ${paths.map((d, i) => `<path d="${d}" fill="none" stroke="url(#rg)" stroke-width="${i ? 40 : 56}" stroke-linecap="round" opacity="${i ? .7 : .9}"/><text class="rt" font-size="${i ? 19 : 25}" dy="${i ? 6.5 : 8.5}"><textPath href="#rp${i}" startOffset="0">${esc(one.repeat(4))}</textPath></text>`).join('')}`;
  const tps = $$('textPath', svg), texts = $$('text', svg);
  let len = [0, 0];
  setTimeout(() => { texts.forEach((t, i) => { try { len[i] = t.getComputedTextLength() / 4; } catch (e) { len[i] = 2000; } }); }, 100);
  raf(t => { if (!svg.isConnected) return false; tps.forEach((tp, i) => { if (!len[i]) return; const sp = i ? .045 : .06; tp.setAttribute('startOffset', -((t * sp) % len[i])); }); });
}
function demos() {
  const nodes = $$('.demo');
  nodes.forEach((d, i) => d.prepend(gardenScene(60 + i * 17)));
  const running = new WeakMap();
  observe(nodes, (n, on) => { n.dataset.vis = on ? '1' : ''; if (on && !running.get(n)) { running.set(n, 1); ({ diag: demoDiag, graph: demoGraph, explain: demoExplain })[n.dataset.demoKind](n); } }, { threshold: .3 });
}
const visible = n => n.dataset.vis === '1';
async function demoDiag(node) {
  const tok = RUN, b = $('.win-b', node), t = TOPIC.newton, T0 = TL(t), d = DISC.mech;
  let round = 0;
  while (tok === RUN && node.isConnected) {
    if (!visible(node)) { await sleep(400); continue; }
    const wrong = round++ % 2 === 1, pick = wrong ? 1 : 0;
    b.innerHTML = `<div class="dq"><div class="dq-m"><span class="badge dk">${dname('mech', 'phys')}</span><span class="badge dk">${LVL().m}</span><span class="dq-seg"><i class="ok"></i><i class="cur"></i><i></i><i></i></span></div><p class="dq-t">${esc(T0.q)}</p><div class="dq-o">${T0.o.map((o, k) => `<div class="dq-op" data-k="${k}"><span>${'ABCD'[k]}</span>${esc(o)}</div>`).join('')}</div><div class="dq-log mono"></div></div>`;
    const ops = $$('.dq-op', b);
    await sleep(900);
    for (let k = 0; k <= Math.max(pick, 2); k++) { if (tok !== RUN) return; ops.forEach(o => o.classList.remove('hv')); ops[k].classList.add('hv'); await sleep(380); }
    ops.forEach(o => o.classList.remove('hv')); ops[pick].classList.add('sel'); await sleep(500);
    $('.dq-seg .cur', b).className = wrong ? 'no' : 'ok';
    const tE = TL(TOPIC.kin).n, tH = TL(TOPIC.cons).n;
    const msg = wrong ? tr(`Ошибка: путаешь вес и силу тяжести → проверяю базу «${tE}»`, `Қате: салмақ пен ауырлық күшін шатастырасың → негізін тексеремін «${tE}»`, `Mistake: weight confused with gravity → checking the basics “${tE}”`) : tr(`Верно за 6,2 с → усложняю: «${tH}»`, `6,2 с ішінде дұрыс → күрделендіремін: «${tH}»`, `Correct in 6.2 s → stepping up: “${tH}”`);
    await typeInto($('.dq-log', b), '› ' + msg, tok, 14);
    await sleep(2600);
  }
}
async function demoGraph(node) {
  const tok = RUN, b = $('.win-b', node);
  const N = [['xlim', 70, 60], ['xder', 70, 150], ['xint', 70, 240], ['kin', 230, 60], ['newton', 230, 150], ['ohm', 390, 60], ['induct', 390, 240]];
  const E = [['xder', 'xint'], ['xder', 'induct'], ['ohm', 'induct'], ['kin', 'newton'], ['xlim', 'xder']];
  const P = Object.fromEntries(N.map(n => [n[0], [n[1], n[2]]]));
  b.innerHTML = `<svg viewBox="0 0 460 300" class="dg">${E.map(([a, c]) => { const [x1, y1] = P[a], [x2, y2] = P[c], mx = (x1 + x2) / 2; return `<path data-e="${a}-${c}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="#4a5240" stroke-width="1.4" stroke-dasharray="3 4"/>`; }).join('')}${N.map(([id, x, y]) => `<g data-n="${id}"><circle class="ring" cx="${x}" cy="${y}" r="14" fill="none" stroke="#9fd3c7" opacity="0"/><circle class="core" cx="${x}" cy="${y}" r="13" fill="#2b3124" stroke="#4a5240" stroke-width="1.5"/><text x="${x}" y="${y + 30}" text-anchor="middle" font-size="10.5" fill="#cfd2c4" font-family="Inter">${esc(tn(id))}</text></g>`).join('')}</svg><div class="dg-cap mono"></div>`;
  const svg = $('svg', b), cap = $('.dg-cap', b);
  const lit = (id, col) => { const g = $(`[data-n="${id}"]`, svg); $('.core', g).setAttribute('fill', col); $('.core', g).setAttribute('stroke', col); const r = $('.ring', g); r.setAttribute('stroke', col); r.classList.remove('ping'); void r.getBBox(); r.classList.add('ping'); };
  while (tok === RUN && node.isConnected) {
    if (!visible(node)) { await sleep(400); continue; }
    $$('.core', svg).forEach(c => { c.setAttribute('fill', '#2b3124'); c.setAttribute('stroke', '#4a5240'); });
    $$('path', svg).forEach(p => { p.setAttribute('stroke', '#4a5240'); p.setAttribute('stroke-dasharray', '3 4'); });
    cap.textContent = '';
    for (const id of ['xlim', 'kin', 'newton', 'ohm']) { if (tok !== RUN) return; lit(id, '#4f8f86'); await sleep(420); }
    await sleep(300);
    for (const id of ['xint', 'induct']) { lit(id, '#b8583a'); await sleep(420); }
    await sleep(400); lit('xder', '#d0653f');
    ['xder-xint', 'xder-induct'].forEach(e => { const p = $(`[data-e="${e}"]`, svg); p.setAttribute('stroke', '#d0653f'); p.setAttribute('stroke-dasharray', '0'); });
    await typeInto(cap, '› ' + tr(`Корневая причина: «${tn('xder')}» → «${tn('induct')}», «${tn('xint')}»`, `Түпкі себеп: «${tn('xder')}» → «${tn('induct')}», «${tn('xint')}»`, `Root cause: “${tn('xder')}” → “${tn('induct')}”, “${tn('xint')}”`), tok, 14);
    await sleep(3200);
  }
}
async function demoExplain(node) {
  const tok = RUN, b = $('.win-b', node), t = TOPIC.induct, T0 = TL(t);
  while (tok === RUN && node.isConnected) {
    if (!visible(node)) { await sleep(400); continue; }
    b.innerHTML = `<div class="dx"><div class="dx-u">${esc(tr('Объясни индукцию простыми словами', 'Индукцияны қарапайым тілмен түсіндір', 'Explain induction in plain words'))}</div><div class="dx-th mono"></div><div class="md dx-out"></div></div>`;
    const th = $('.dx-th', b);
    const st = [tr('Смотрю профиль · индукция 24%', 'Профильді қараймын · индукция 24%', 'Checking profile · induction 24%'), tr(`Пререквизит «${tn('xder')}» — пробел`, `«${tn('xder')}» пререквизиті — олқылық`, `Prerequisite “${tn('xder')}” — gap`), tr('Подбираю аналогию', 'Ұқсастық іздеймін', 'Choosing an analogy')];
    for (const s of st) { if (tok !== RUN) return; const li = el(`<div class="dx-s run">${esc(s)}</div>`); th.appendChild(li); await sleep(650); li.classList.replace('run', 'ok'); }
    await stream($('.dx-out', b), `**${T0.n}.** ${T0.s}\n\n${T0.an}\n\n$$${L(t.f)}$$`, tok, 1.2);
    await sleep(3600);
  }
}

/* ================= onboarding ================= */
let OB = { step: 0, name: '', city: 'pvl', uni: 0, course: 1, dir: null, goal: 0, minutes: 60, weeks: 4 };
const GOALS = () => tr(['Подготовка к сессии', 'Закрыть пробелы', 'Подготовка к ЕНТ / магистратуре', 'Углубиться в специальность'], ['Сессияға дайындық', 'Олқылықтарды жабу', 'Магистратураға дайындық', 'Мамандықты тереңдету'], ['Exam preparation', 'Close the gaps', 'Prepare for a master’s', 'Go deeper into my major']);
const cityOf = id => CITIES.find(c => c.id === id) || CITIES[0];
const uniName = P => { const c = cityOf(P.city); return P.uni >= 0 && c.unis[P.uni] ? L(c.unis[P.uni]) : L(DATA.otherUni); };
function pageStart() {
  renderHeader('app', 'start');
  if (S.profile && !OB.name) OB = Object.assign(OB, S.profile, { step: OB.step });
  $('#view').innerHTML = `<div class="page"><div class="wrap"><div class="ob"><div class="ob-steps">${[0, 1, 2, 3].map(i => `<i class="${i <= OB.step ? 'on' : ''}"></i>`).join('')}</div><div id="obBody"></div></div></div></div>`;
  [obName, obDir, obProgram, obGoals][OB.step]();
}
const stepOf = n => tr(`Шаг ${n} из 4`, `${n}-қадам / 4`, `Step ${n} of 4`);
function obSet(step) { OB.step = step; pageStart(); window.scrollTo(0, 0); }
function obName() {
  const b = $('#obBody'), city = cityOf(OB.city);
  b.innerHTML = `<span class="eyebrow">${stepOf(1)}</span><h1 class="h-page" style="margin:12px 0 30px">${tr('Давай познакомимся', 'Танысайық', "Let's get to know you")}</h1>
  <div class="card">
    <div class="field"><label>${tr('Язык обучения', 'Оқу тілі', 'Language of study')}</label>${langSwitch('big')}</div>
    <div class="field"><label>${tr('Как к тебе обращаться', 'Саған қалай жүгінейін', 'What should I call you')}</label><input class="input" id="nm" placeholder="${tr('Имя', 'Есімің', 'Name')}" value="${esc(OB.name)}" maxlength="30" autocomplete="off"></div>
    <div class="field"><label>${tr('Город', 'Қала', 'City')}</label><div class="chips" id="cty">${CITIES.map(c => `<button class="chip ${c.id === OB.city ? 'on' : ''}" data-c="${c.id}">${L(c.name)} <span class="mono" style="font-size:10.5px;opacity:.6">${c.unis.length}</span></button>`).join('')}</div></div>
    <div class="field"><label>${tr('Университет', 'Университет', 'University')}</label><div class="unis" id="uni">${city.unis.map((u, i) => `<button class="uni ${i === OB.uni ? 'on' : ''}" data-u="${i}">${L(u)}</button>`).join('')}<button class="uni ${OB.uni === -1 ? 'on' : ''}" data-u="-1">${L(DATA.otherUni)}</button></div></div>
    <div class="field" style="margin:0"><label>${tr('Курс', 'Курс', 'Year')}</label><div class="chips" id="crs">${[1, 2, 3, 4].map(c => `<button class="chip ${c === OB.course ? 'on' : ''}">${c} ${tr('курс', 'курс', 'year')}</button>`).join('')}</div></div>
  </div>
  <div class="ob-nav"><button class="link" data-demo>${tr('Пропустить и открыть демо-профиль', 'Өткізіп, демо-профильді ашу', 'Skip and open the demo profile')}</button><button class="btn" id="nx" ${OB.name.trim() ? '' : 'disabled'}>${tr('Дальше', 'Әрі қарай', 'Next')} ${ICON.arrow}</button></div>`;
  wireLang(b);
  const nm = $('#nm'), nx = $('#nx');
  nm.oninput = () => { OB.name = nm.value; nx.disabled = !nm.value.trim(); };
  nm.onkeydown = e => { if (e.key === 'Enter' && nm.value.trim()) obSet(1); };
  $$('#cty .chip').forEach(c => c.onclick = () => { OB.city = c.dataset.c; OB.uni = 0; obName(); });
  $$('#uni .uni').forEach(c => c.onclick = () => { OB.uni = +c.dataset.u; $$('#uni .uni').forEach(x => x.classList.toggle('on', x === c)); });
  $$('#crs .chip').forEach((c, i) => c.onclick = () => { OB.course = i + 1; $$('#crs .chip').forEach(x => x.classList.toggle('on', x === c)); });
  nx.onclick = () => obSet(1);
  $('[data-demo]', b).onclick = loadDemo;
  setTimeout(() => { nm.focus(); nm.setSelectionRange(nm.value.length, nm.value.length); }, 50);
}
function obDir() {
  const b = $('#obBody');
  b.innerHTML = `<span class="eyebrow">${stepOf(2)}</span><h1 class="h-page" style="margin:12px 0 10px">${esc(OB.name.trim())}, ${tr('какое у тебя направление?', 'бағытың қандай?', "what's your programme?")}</h1><p class="lead" style="margin:0 0 28px">${tr('Mentor загрузит учебный план и построит граф тем по всем профильным дисциплинам.', 'Mentor оқу жоспарын жүктеп, барлық бейіндік пәндер бойынша тақырыптар графын құрады.', 'Mentor will load the curriculum and build a topic graph across all core courses.')}</p>
  <div class="dirs">${Object.values(DIRS).map(d => `<button class="dir ${OB.dir === d.id ? 'on' : ''}" data-id="${d.id}"><span class="mono muted" style="font-size:12px">${d.code}</span><span class="serif">${L(d.name)}</span><span class="meta"><span>${L(d.group)} · ${L(DATA.university)}</span><span>${d.disc.length} ${tr('дисц.', 'пән', 'courses')}</span></span></button>`).join('')}</div>
  <div class="ob-nav"><button class="btn ghost" id="bk">${ICON.back} ${tr('Назад', 'Артқа', 'Back')}</button><button class="btn" id="nx" ${OB.dir ? '' : 'disabled'}>${tr('Дальше', 'Әрі қарай', 'Next')} ${ICON.arrow}</button></div>`;
  $$('.dir', b).forEach(d => d.onclick = () => { OB.dir = d.dataset.id; $$('.dir', b).forEach(x => x.classList.toggle('on', x === d)); $('#nx').disabled = false; });
  $('#bk').onclick = () => obSet(0); $('#nx').onclick = () => obSet(2);
}
async function obProgram() {
  const tok = RUN, d = DIRS[OB.dir], b = $('#obBody'), disc = d.disc.map(x => DISC[x]);
  const topics = disc.reduce((s, x) => s + x.topics.length, 0), ids = new Set(disc.flatMap(x => x.topics.map(t => t.id)));
  const edges = disc.flatMap(x => x.topics).reduce((s, t) => s + t.pre.filter(p => ids.has(p)).length, 0);
  const cr = DATA.general.reduce((s, g) => s + g.cr, 0) + disc.reduce((s, x) => s + semcr(x.id, d.id)[1], 0);
  b.innerHTML = `<span class="eyebrow">${stepOf(3)}</span><h1 class="h-page" style="margin:12px 0 26px">${tr('Изучаю твою программу', 'Бағдарламаңды зерттеп жатырмын', 'Studying your programme')}</h1><div id="thk"></div><div id="tbl"></div><div class="ob-nav hidden" id="nav"><button class="btn ghost" id="bk">${ICON.back} ${tr('Назад', 'Артқа', 'Back')}</button><button class="btn" id="nx">${tr('Дальше', 'Әрі қарай', 'Next')} ${ICON.arrow}</button></div>`;
  const th = Think($('#thk'), tr('Анализирую учебный план', 'Оқу жоспарын талдап жатырмын', 'Analysing the curriculum'), tok);
  const cyc = k => L(CYC[k]);
  await th.step(tr(`Загружаю учебный план ${d.code}`, `${d.code} оқу жоспарын жүктеп жатырмын`, `Loading curriculum ${d.code}`), [Q(L(d.name)) + ' · ' + L(DATA.university), `${DATA.general.length + disc.length} ${tr('дисциплин', 'пән', 'courses')} · ${cr} ${tr('кредитов', 'кредит', 'credits')}`]);
  await th.step(tr('Разделяю дисциплины по циклам', 'Пәндерді циклдарға бөлемін', 'Splitting courses into cycles'), `${cyc('GE')} ${DATA.general.length} · ${cyc('BD')} ${disc.filter(x => x.cycle === 'BD').length} · ${cyc('PD')} ${disc.filter(x => x.cycle === 'PD').length}`);
  await th.step(tr('Строю граф тем', 'Тақырыптар графын құрамын', 'Building the topic graph'), `${topics} ${tr('тем', 'тақырып', 'topics')} · ${edges} ${tr('связей пререквизитов', 'пререквизит байланысы', 'prerequisite links')}`);
  await th.step(tr('Отбираю дисциплины для диагностики', 'Диагностикаға пәндерді іріктеймін', 'Selecting courses for the diagnostic'), `${disc.length} → ${disc.length * 2} ${tr('адаптивных вопросов', 'бейімделгіш сұрақ', 'adaptive questions')}`);
  if (tok !== RUN) return;
  th.finish(tr('Программа изучена', 'Бағдарлама зерттелді', 'Programme analysed'));
  const row = (n, c, extra, i) => `<li style="animation-delay:${i * .05}s"><span>${n}</span><span class="r">${extra || ''}<span>${c} ${tr('кр.', 'кр.', 'cr.')}</span></span></li>`;
  $('#tbl').innerHTML = `<div class="card prog-table">
    <div class="cycle"><h4><span>${tr('Базовые и профилирующие дисциплины', 'Базалық және бейіндік пәндер', 'Core and major courses')}</span><span class="muted mono" style="font-size:12px">${tr('в диагностике', 'диагностикада', 'in the diagnostic')}</span></h4><ul>${disc.map((x, i) => row(dname(x.id, d.id), semcr(x.id, d.id)[1], `<span class="badge ok dot">${cyc(x.cycle)} · ${semcr(x.id, d.id)[0]} ${tr('сем.', 'сем.', 'sem.')}</span>`, i)).join('')}</ul></div>
    <div class="cycle"><h4><span>${tr('Общеобязательные дисциплины', 'Жалпы міндетті пәндер', 'General education')}</span><span class="muted mono" style="font-size:12px">${tr('не диагностируются', 'диагностикаланбайды', 'not diagnosed')}</span></h4><ul>${DATA.general.map((g, i) => row(L(g.name), g.cr, `<span class="badge">${cyc('GE')}</span>`, i)).join('')}</ul></div>
  </div>`;
  $('#nav').classList.remove('hidden');
  $('#bk').onclick = () => obSet(1); $('#nx').onclick = () => obSet(3);
}
function obGoals() {
  const b = $('#obBody'), goals = GOALS();
  b.innerHTML = `<span class="eyebrow">${stepOf(4)}</span><h1 class="h-page" style="margin:12px 0 30px">${tr('Под какую цель строим план?', 'Жоспарды қандай мақсатқа құрамыз?', 'What goal should the plan serve?')}</h1>
  <div class="card">
    <div class="field"><label>${tr('Цель', 'Мақсат', 'Goal')}</label><div class="chips" id="g1">${goals.map((g, i) => `<button class="chip ${i === OB.goal ? 'on' : ''}">${g}</button>`).join('')}</div></div>
    <div class="field"><label>${tr('Сколько времени в день готов уделять', 'Күніне қанша уақыт бөлуге дайынсың', 'How much time per day can you give')}</label><div class="chips" id="g2">${[30, 60, 90].map(m => `<button class="chip ${m === OB.minutes ? 'on' : ''}">${m} ${MIN()}</button>`).join('')}</div></div>
    <div class="field" style="margin:0"><label>${tr('Срок', 'Мерзімі', 'Timeframe')}</label><div class="chips" id="g3">${[2, 4, 6].map(w => `<button class="chip ${w === OB.weeks ? 'on' : ''}">${w} ${pl(w, ['неделя', 'недели', 'недель'], 'апта', ['week', 'weeks'])}</button>`).join('')}</div></div>
  </div>
  <div class="ob-nav"><button class="btn ghost" id="bk">${ICON.back} ${tr('Назад', 'Артқа', 'Back')}</button><button class="btn" id="nx">${tr('Начать диагностику', 'Диагностиканы бастау', 'Start the diagnostic')} ${ICON.arrow}</button></div>`;
  const pick = (sel, arr, key) => $$(sel + ' .chip').forEach((c, i) => c.onclick = () => { OB[key] = arr[i]; $$(sel + ' .chip').forEach(x => x.classList.toggle('on', x === c)); });
  pick('#g1', [0, 1, 2, 3], 'goal'); pick('#g2', [30, 60, 90], 'minutes'); pick('#g3', [2, 4, 6], 'weeks');
  $('#bk').onclick = () => obSet(2);
  $('#nx').onclick = () => { S.profile = { name: OB.name.trim(), city: OB.city, uni: OB.uni, course: OB.course, dir: OB.dir, goal: OB.goal, minutes: OB.minutes, weeks: OB.weeks }; save(); TEST = null; OB.step = 0; go('test'); };
}

/* ================= diagnostic ================= */
let TEST = null;
function pageTest() {
  if (!S.profile) return go('start');
  renderHeader('app', 'test');
  const dir = DIRS[S.profile.dir];
  if (!TEST || TEST.dir !== dir.id) TEST = { dir: dir.id, di: 0, stage: 'm', answers: [], sel: null, t0: 0, busy: false, log: [] };
  $('#view').innerHTML = `<div class="page"><div class="wrap">
    <div class="test-top"><div><span class="eyebrow">${tr('Диагностика', 'Диагностика', 'Diagnostic')} · ${dir.code}</span><h1 class="h-page" style="font-size:34px;margin-top:6px">${tr('Покажи, что знаешь', 'Не білетініңді көрсет', 'Show what you know')}</h1></div><div class="segs" id="segs"></div></div>
    <div class="test-grid"><div class="card qcard" id="qc"></div>
    <aside class="side-log"><h4><span>${tr('Ход мыслей ментора', 'Тәлімгердің ой барысы', "Mentor's reasoning")}</span><span class="badge dot ok">live</span></h4><div class="log" id="log"><div class="log-i"><span class="mono">${tr('старт', 'бастау', 'start')}</span>${tr('Начинаю с вопросов среднего уровня по каждой дисциплине. Сложность подстраивается под твои ответы.', 'Әр пән бойынша орта деңгейлі сұрақтардан бастаймын. Күрделілік жауаптарыңа бейімделеді.', 'Starting with intermediate questions in each course. Difficulty adapts to your answers.')}</div>${TEST.log.map(l => `<div class="log-i"><span class="mono">${l[0]}</span>${esc(l[1])}</div>`).join('')}</div></aside></div>
  </div></div>`;
  drawSegs(); showQ(true);
}
function drawSegs() {
  const dir = DIRS[TEST.dir];
  $('#segs').innerHTML = dir.disc.map((did, i) => { const a = TEST.answers.filter(x => x.disc === did); return `<div class="seg" title="${esc(dn(did))}"><div class="bars">${[0, 1].map(k => a[k] ? `<i class="${a[k].ok ? 'ok' : 'no'}"></i>` : (i === TEST.di && k === a.length ? '<i class="cur"></i>' : '<i></i>')).join('')}</div><span>${dshort(did)}</span></div>`; }).join('');
}
function permFor(id) { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; const r = mulberry(h), p = [0, 1, 2, 3]; for (let i = 3; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; }
const curTopic = () => DISC[DIRS[TEST.dir].disc[TEST.di]].topics.find(t => t.lvl === TEST.stage);
async function showQ(first) {
  const tok = RUN, qc = $('#qc'), dir = DIRS[TEST.dir], t = curTopic(), d = DISC[t.disc], T0 = TL(t);
  const n = TEST.answers.length + 1, total = dir.disc.length * 2;
  if (!first) {
    qc.appendChild(el(`<div class="qgen"><span class="think-l shimmer" style="font-weight:500;font-size:14px">${tr('Подбираю следующий вопрос…', 'Келесі сұрақты іріктеп жатырмын…', 'Picking the next question…')}</span><div class="skel" style="width:40%"></div><div class="skel" style="width:85%;height:22px;margin-top:10px"></div><div class="skel" style="width:70%;height:22px"></div><div style="height:16px"></div>${'<div class="skel" style="height:48px"></div>'.repeat(4)}</div>`));
    await sleep(rnd(650, 1100)); if (tok !== RUN) return;
  }
  TEST.sel = null; TEST.busy = false;
  const perm = permFor(t.id); TEST.perm = perm;
  qc.innerHTML = `<div class="fade-in"><div class="qmeta"><span class="badge">${tr('вопрос', 'сұрақ', 'question')} ${n} / ${total}</span><span class="badge ${t.lvl === 'h' ? 'gap' : t.lvl === 'e' ? 'ok' : 'mid'}">${LVL()[t.lvl]}</span></div>
    <div class="muted" style="font-size:13px;margin-bottom:8px">${dn(d.id)} · ${T0.n}</div>
    <p class="qtext">${esc(T0.q)}</p>
    <div class="opts">${perm.map((oi, i) => `<button class="opt" data-i="${i}"><span class="k">${'ABCD'[i]}</span><span>${esc(T0.o[oi])}</span></button>`).join('')}</div>
    <div class="qfoot"><button class="link" id="idk">${tr('Не знаю', 'Білмеймін', "I don't know")}</button><button class="btn" id="ok" disabled>${tr('Ответить', 'Жауап беру', 'Answer')} ${ICON.arrow}</button></div></div>`;
  $$('.opt', qc).forEach(b => b.onclick = () => pickOpt(+b.dataset.i));
  $('#ok').onclick = () => answer(TEST.sel); $('#idk').onclick = () => answer(null);
  TEST.t0 = performance.now(); drawSegs();
}
function pickOpt(i) { TEST.sel = i; $$('#qc .opt').forEach((b, k) => b.classList.toggle('on', k === i)); $('#ok').disabled = false; }
document.addEventListener('keydown', e => {
  if (location.hash !== '#test' || !TEST || TEST.busy || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  const k = e.key.toLowerCase(), idx = ['1', '2', '3', '4'].indexOf(k) >= 0 ? +k - 1 : ['a', 'b', 'c', 'd'].indexOf(k);
  if (idx >= 0 && $('#qc .opt')) pickOpt(idx);
  if (e.key === 'Enter' && TEST.sel != null) answer(TEST.sel);
});
async function answer(sel) {
  if (TEST.busy) return; TEST.busy = true;
  const tok = RUN, t = curTopic(), d = DISC[t.disc], dir = DIRS[TEST.dir];
  if (sel != null) sel = TEST.perm[sel];
  const ms = Math.round(performance.now() - TEST.t0), ok = sel === t.a, idk = sel == null;
  TEST.answers.push({ topic: t.id, disc: d.id, lvl: t.lvl, chosen: sel, ok, idk, ms });
  const nE = tn(d.topics.find(x => x.lvl === 'e').id), nH = tn(d.topics.find(x => x.lvl === 'h').id), nM = tn(d.topics.find(x => x.lvl === 'm').id), nT = tn(t.id), nD = dn(d.id);
  const nd = dir.disc[TEST.di + 1], sec = num(ms / 1000);
  let msg;
  if (t.lvl === 'm') msg = ok ? tr(`Верно за ${sec} с. Средний уровень по ${Q(nD)} подтверждён — усложняю: ${Q(nH)}.`, `${sec} с ішінде дұрыс. ${Q(nD)} бойынша орта деңгей расталды — күрделендіремін: ${Q(nH)}.`, `Correct in ${sec} s. Intermediate level in ${Q(nD)} confirmed — stepping up: ${Q(nH)}.`) : tr(`Ошибка в теме ${Q(nT)}. Проверяю, есть ли база: ${Q(nE)}.`, `${Q(nT)} тақырыбында қате. Негізі бар-жоғын тексеремін: ${Q(nE)}.`, `Mistake in ${Q(nT)}. Checking the basics: ${Q(nE)}.`);
  else if (t.lvl === 'h') msg = ok ? tr(`Верно. ${Q(nD)} — сильная сторона.`, `Дұрыс. ${Q(nD)} — күшті жағың.`, `Correct. ${Q(nD)} is a strength.`) + (nd ? tr(` Перехожу к ${Q(dn(nd))}.`, ` ${Q(dn(nd))} пәніне өтемін.`, ` Moving on to ${Q(dn(nd))}.`) : '') : tr(`Средний уровень есть, продвинутого пока нет. Отмечаю ${Q(nT)} как пробел.`, `Орта деңгей бар, жоғары деңгей әзірге жоқ. ${Q(nT)} тақырыбын олқылық деп белгілеймін.`, `Intermediate level is there, advanced isn't yet. Marking ${Q(nT)} as a gap.`);
  else msg = ok ? tr(`База есть, пробел точечный — ${Q(nM)}. Тему ${Q(nH)} добавлю в план.`, `Негіз бар, олқылық нүктелік — ${Q(nM)}. ${Q(nH)} тақырыбын жоспарға қосамын.`, `The basics are there; the gap is specific — ${Q(nM)}. I'll add ${Q(nH)} to the plan.`) : tr(`Пробел на уровне основ. ${Q(nD)} пойдёт в начало плана.`, `Негіз деңгейінде олқылық. ${Q(nD)} жоспардың басына қойылады.`, `Gap at the foundation level. ${Q(nD)} goes to the start of the plan.`);
  if (idk) msg = tr('«Не знаю» — честный ответ, так диагностика точнее. ', '«Білмеймін» — адал жауап, осылай диагностика дәлірек. ', '“I don’t know” is an honest answer — it makes the diagnostic more accurate. ') + msg;
  const head = `${TEST.answers.length} · ${dshort(d.id)} · ${sec} ${SEC()}`;
  TEST.log.push([head, msg]);
  const log = $('#log'), li = el(`<div class="log-i"><span class="mono">${head}</span><span class="think-l shimmer">${tr('Анализирую ответ…', 'Жауапты талдап жатырмын…', 'Analysing the answer…')}</span></div>`);
  log.appendChild(li); log.scrollTop = log.scrollHeight;
  if (t.lvl === 'm') TEST.stage = ok ? 'h' : 'e'; else { TEST.di++; TEST.stage = 'm'; }
  const done = TEST.di >= dir.disc.length;
  later(async () => { if (tok !== RUN) return; const s = $('.think-l', li); s.classList.remove('shimmer'); s.textContent = ''; await typeInto(s, msg, tok, 8); log.scrollTop = log.scrollHeight; }, rnd(400, 800));
  if (done) { await sleep(900); if (tok !== RUN) return; finishTest(); } else showQ();
}
function finishTest() {
  S.answers = TEST.answers; S.results = analyze(S.profile, S.answers); S.plan = buildPlan(S.profile, S.results);
  S.done = {}; S.chat = []; save(); TEST = null; go('analysis');
}
function loadDemo() {
  const l = LANG; S = blank(); S.lang = l;
  S.profile = { name: tr('Алихан', 'Әлихан', 'Alikhan'), city: 'pvl', uni: 0, course: 2, dir: 'phys', goal: 0, minutes: 60, weeks: 4, demo: true };
  const plan = { math: [0, 1], mech: [0, 1], molec: [1, 1], elmag: [1, 0], optics: [0, 1], atomic: [1, 0], method: [1, 1] };
  const ans = [];
  DIRS.phys.disc.forEach(did => {
    const d = DISC[did], [m, x] = plan[did], tm = d.topics.find(t => t.lvl === 'm'), t2 = d.topics.find(t => t.lvl === (m ? 'h' : 'e'));
    const wrong = t => t.a === 0 ? 1 : 0;
    ans.push({ topic: tm.id, disc: did, lvl: 'm', chosen: m ? tm.a : wrong(tm), ok: !!m, idk: false, ms: Math.round(rnd(7000, 21000)) });
    ans.push({ topic: t2.id, disc: did, lvl: t2.lvl, chosen: x ? t2.a : wrong(t2), ok: !!x, idk: false, ms: Math.round(rnd(8000, 24000)) });
  });
  S.answers = ans; S.results = analyze(S.profile, ans); S.plan = buildPlan(S.profile, S.results); save();
  go('analysis');
}

/* ================= analysis ================= */
async function pageAnalysis() {
  if (!S.results) return go('start');
  renderHeader('app', '');
  const tok = RUN, R = S.results, dir = DIRS[R.dir], A = S.answers, PL = S.plan;
  $('#view').innerHTML = `<section class="an" id="an"><div class="wrap"><div class="an-orb" id="anorb"></div><div class="an-card"><span class="eyebrow">${tr('Анализ', 'Талдау', 'Analysis')} · ${dir.code}</span><h1 class="h-page" style="margin:10px 0 24px">${tr('Разбираю твои ответы', 'Жауаптарыңды талдап жатырмын', 'Reviewing your answers')}</h1><div id="thk"></div><div id="res"></div></div></div></section>`;
  $('#an').prepend(gardenScene(23, { rays: true, pollen: true }));
  const orb = glassOrb(23, { cls: 'small thinking', inner: `<div class="orb-logo">${LOGO}</div>` }); $('#anorb').appendChild(orb);
  const th = Think($('#thk'), tr('Ментор анализирует результаты', 'Тәлімгер нәтижелерді талдап жатыр', 'Mentor is analysing the results'), tok);
  const avg = num(A.reduce((s, a) => s + a.ms, 0) / A.length / 1000), idk = A.filter(a => a.idk).length;
  const allT = dir.disc.flatMap(x => DISC[x].topics), ids = new Set(allT.map(t => t.id)), edges = allT.reduce((s, t) => s + t.pre.filter(p => ids.has(p)).length, 0);
  await th.step(tr('Собираю ответы диагностики', 'Диагностика жауаптарын жинаймын', 'Collecting diagnostic answers'), `${A.length} ${tr('ответов', 'жауап', 'answers')} · ${tr('среднее время', 'орташа уақыт', 'average time')} ${avg} ${SEC()} · ${tr('«не знаю»', '«білмеймін»', '“don’t know”')}: ${idk}`);
  await th.step(tr('Оцениваю освоение по дисциплинам', 'Пәндер бойынша меңгеруді бағалаймын', 'Estimating mastery per course'), dir.disc.map(x => { const n = dn(x), nm = n.length > 26 ? n.slice(0, 25) + '…' : n; return `${nm.padEnd(27, ' ')} ${String(pct(R.disc[x].v)).padStart(3)}%`; }), 300);
  await th.step(tr('Строю граф пререквизитов', 'Пререквизиттер графын құрамын', 'Building the prerequisite graph'), `${allT.length} ${tr('тем', 'тақырып', 'topics')} · ${edges} ${tr('связей', 'байланыс', 'links')} · ${tr('выведено по ответам', 'жауаптар бойынша шығарылды', 'inferred from answers')}: ${Object.values(R.topicM).filter(x => x.src === 'inferred').length}`);
  const rc = R.groups.filter(g => g.affects.length);
  await th.step(tr('Ищу корневые причины', 'Түпкі себептерді іздеймін', 'Looking for root causes'), rc.length ? rc.map(g => `${Q(tn(g.root))} → ${g.affects.map(a => Q(tn(a))).join(', ')}`) : tr('связанных цепочек нет — пробелы независимые', 'байланысқан тізбектер жоқ — олқылықтар тәуелсіз', 'no linked chains — gaps are independent'));
  const nRev = PL.items.filter(i => i.type === 'review').length;
  await th.step(tr('Составляю индивидуальный план', 'Жеке жоспар құрамын', 'Building your personal plan'), `${PL.weeks} ${tr('нед.', 'апта', 'wk')} · ${PL.per} ${MIN()}/${tr('день', 'күн', 'day')} · ${PL.topics} ${tr('тем', 'тақырып', 'topics')} · ${nRev} ${tr('повторений', 'қайталау', 'reviews')}`);
  const peak = Math.max(...Array.from({ length: PL.days }, (_, d) => PL.items.filter(i => i.day === d).reduce((s, i) => s + i.min, 0)));
  await th.step(tr('Проверяю план на перегрузку', 'Жоспарды шамадан тыс жүктемеге тексеремін', 'Checking the plan for overload'), `${tr('пиковая нагрузка', 'ең жоғары жүктеме', 'peak load')} ${peak} ${MIN()} · ${tr('лимит', 'шегі', 'limit')} ${PL.per + 15} ${MIN()} — OK`);
  if (tok !== RUN) return;
  th.finish(tr('Анализ готов', 'Талдау дайын', 'Analysis ready'));
  orb.classList.remove('thinking'); orb.classList.add('done');
  $('#res').innerHTML = `<div class="an-res fade-in"><div><b data-cnt="${pct(R.overall)}">0</b><span>% ${tr('готовность к сессии', 'сессияға дайындық', 'exam readiness')}</span></div><div><b data-cnt="${R.gaps.length}">0</b><span>${tr('пробелов в темах', 'тақырыптардағы олқылық', 'topic gaps')}</span></div><div><b data-cnt="${rc.length || R.roots.length}">0</b><span>${tr('корневые причины', 'түпкі себеп', 'root causes')}</span></div></div><div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#dashboard">${tr('Открыть карту знаний', 'Білім картасын ашу', 'Open the knowledge map')} ${ICON.arrow}</a><a class="btn ghost" href="#plan">${tr('Сразу к плану', 'Бірден жоспарға', 'Go to the plan')}</a></div>`;
  countUp($('#res'));
}
function countUp(root) { $$('[data-cnt]', root).forEach(b => { const to = +b.dataset.cnt, t0 = performance.now(); const f = () => { const k = Math.min(1, (performance.now() - t0) / 900); b.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); }; f(); }); }

/* ================= dashboard ================= */
const answerFor = tid => S.answers.find(a => a.topic === tid);
const optText = (t, i) => i == null ? Q(tr('Не знаю', 'Білмеймін', "I don't know")) : Q(TL(t).o[i]);
function pageDashboard() {
  if (!S.results) return go('start');
  renderHeader('app', 'dashboard');
  const R = S.results, P = S.profile, dir = DIRS[R.dir], PL = S.plan, fc = forecast(R), today = planDay(PL);
  const todayItems = PL.items.filter(i => i.day === today), rc = R.groups, date = new Date(R.date);
  const advice = rc.length && rc[0].affects.length ? tr(`Начни с «${tn(rc[0].root)}». Этот пробел тянет за собой: ${rc[0].affects.map(a => '«' + tn(a) + '»').join(', ')}.`, `«${tn(rc[0].root)}» тақырыбынан баста. Бұл олқылық мыналарға әсер етеді: ${rc[0].affects.map(a => '«' + tn(a) + '»').join(', ')}.`, `Start with “${tn(rc[0].root)}”. This gap drags down: ${rc[0].affects.map(a => '“' + tn(a) + '”').join(', ')}.`)
    : R.gaps.length ? tr('Пробелы независимые — иди по плану сверху вниз.', 'Олқылықтар тәуелсіз — жоспар бойынша жоғарыдан төмен қарай жүр.', 'The gaps are independent — work through the plan from the top.') : tr('Сильный результат. План построен на углубление.', 'Күшті нәтиже. Жоспар тереңдетуге құрылған.', 'Strong result. The plan focuses on going deeper.');
  $('#view').innerHTML = `<div class="page"><div class="wrap">
  <div class="page-h"><div><span class="eyebrow">${dir.code} · ${esc(uniName(P))} · ${P.course} ${tr('курс', 'курс', 'year')}</span><h1 class="h-page" style="margin-top:10px">${esc(P.name)}, ${tr('вот твоя карта знаний', 'міне сенің білім картаң', "here's your knowledge map")}</h1><p>${tr('Диагностика от', 'Диагностика күні:', 'Diagnostic from')} ${fmtDate(date)} · ${S.answers.length} ${tr('вопросов', 'сұрақ', 'questions')} · ${dir.disc.length} ${tr('дисциплин', 'пән', 'courses')}</p></div><a class="btn" href="#mentor">${ICON.spark} ${tr('Спросить ментора', 'Тәлімгерден сұрау', 'Ask Mentor')}</a></div>
  <div class="stats">
    <div class="stat"><span class="eyebrow">${tr('Готовность', 'Дайындық', 'Readiness')}</span><b><span data-cnt="${pct(R.overall)}">0</span>%</b><span>${tr('средний уровень освоения', 'орташа меңгеру деңгейі', 'average mastery')}</span></div>
    <div class="stat"><span class="eyebrow">${tr('Прогноз на сессию', 'Сессия болжамы', 'Exam forecast')}</span><b>${gradeOf(fc)}</b><span>≈ ${fc}% ${tr('при выполнении плана', 'жоспар орындалса', 'if you follow the plan')}</span></div>
    <div class="stat"><span class="eyebrow">${tr('Пробелы', 'Олқылықтар', 'Gaps')}</span><b data-cnt="${R.gaps.length}">0</b><span>${tr('тем ниже 50%', '50%-дан төмен тақырып', 'topics below 50%')}</span></div>
    <div class="stat"><span class="eyebrow">${tr('План', 'Жоспар', 'Plan')}</span><b data-cnt="${PL.weeks}">0</b><span>${pl(PL.weeks, ['неделя', 'недели', 'недель'], 'апта', ['week', 'weeks'])} · ${PL.per} ${MIN()} / ${tr('день', 'күн', 'day')}</span></div>
  </div>
  <div class="dash-grid">
    <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3>${tr('Дисциплины', 'Пәндер', 'Courses')}</h3><span class="legend"><span><i style="background:var(--ok)"></i>${tr('сильно', 'күшті', 'strong')}</span><span><i style="background:var(--mid)"></i>${tr('средне', 'орташа', 'medium')}</span><span><i style="background:var(--gap)"></i>${tr('пробел', 'олқылық', 'gap')}</span></span></div>
      <div class="dlist">${dir.disc.slice().sort((a, b) => R.disc[a].v - R.disc[b].v).map(x => { const v = R.disc[x].v, gs = DISC[x].topics.filter(t => R.gaps.includes(t.id)); return `<div class="drow"><div class="nm">${dn(x)}<small>${gs.length ? tr('пробелы: ', 'олқылықтар: ', 'gaps: ') + gs.map(t => tn(t.id)).join(', ') : tr('пробелов не найдено', 'олқылық табылмады', 'no gaps found')}</small></div><div class="bar"><i style="background:${colorOf(v)}" data-w="${pct(v)}"></i></div><div class="pct">${pct(v)}%</div></div>`; }).join('')}</div>
    </div>
    <div style="display:grid;gap:24px;align-content:start">
      <div class="card"><span class="eyebrow">${tr('Сегодня', 'Бүгін', 'Today')} · ${dow(new Date())}</span><h3 style="margin-top:8px">${todayItems.reduce((s, i) => s + i.min, 0)} ${tr('минут по плану', 'минут жоспар бойынша', 'minutes planned')}</h3>
        <div class="today-list">${todayItems.map(i => `<a class="ti" href="${i.topic ? '#lesson-' + i.topic : '#plan'}"><span class="tyb ty-${i.type}">${TYPE()[i.type]}</span><span>${esc(i.topic ? tn(i.topic) : itemTitle(i))}</span><span class="m">${i.min} ${MIN()}</span></a>`).join('')}</div>
        <a class="btn sm ghost" href="#plan">${tr('Весь план', 'Толық жоспар', 'Full plan')} ${ICON.arrow}</a></div>
      <div class="card pad-s" style="background:var(--forest);color:var(--parch)"><span class="eyebrow" style="color:rgba(250,248,245,.5)">${tr('Совет ментора', 'Тәлімгер кеңесі', "Mentor's advice")}</span><p style="margin:10px 0 0;font-size:15px;line-height:1.55">${advice}</p></div>
    </div>
  </div>
  ${R.gaps.length ? `<div style="margin:40px 0 0"><h2 class="h-sec" style="font-size:36px">${tr('Корневые причины', 'Түпкі себептер', 'Root causes')}</h2><p class="muted" style="margin:8px 0 0">${tr('Почему ты ошибаешься — с опорой на твои ответы в диагностике.', 'Неліктен қателесетінің — диагностикадағы жауаптарыңа сүйене отырып.', 'Why you make mistakes — based on your diagnostic answers.')}</p><div class="roots">${rc.map(rootCard).join('')}</div></div>` : ''}
  <div class="card" style="margin-top:24px"><div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap"><div><h3>${tr('Граф знаний', 'Білім графы', 'Knowledge graph')}</h3><span class="muted" style="font-size:13.5px">${tr('Темы по уровням сложности. Линии — пререквизиты. Нажми на тему, чтобы открыть объяснение.', 'Тақырыптар күрделілік деңгейі бойынша. Сызықтар — пререквизиттер. Түсіндірмені ашу үшін тақырыпты бас.', 'Topics by difficulty. Lines are prerequisites. Click a topic to open its explanation.')}</span></div><span class="legend"><span><i style="background:var(--ok)"></i>${tr('освоено', 'меңгерілді', 'mastered')}</span><span><i style="background:var(--gap)"></i>${tr('пробел', 'олқылық', 'gap')}</span><span><i style="background:#fff;border:1.5px dashed var(--moss)"></i>${tr('выведено по ответам', 'жауаптар бойынша шығарылды', 'inferred')}</span></span></div><div class="graph-wrap">${graphSvg(R, dir)}</div></div>
  <details class="card ans"><summary><h3 style="margin:0">${tr('Ответы диагностики', 'Диагностика жауаптары', 'Diagnostic answers')}</h3><span class="badge">${S.answers.filter(a => a.ok).length} / ${S.answers.length} ${tr('верно', 'дұрыс', 'correct')}</span></summary>
    <table class="atable"><tr><th>${tr('Дисциплина / тема', 'Пән / тақырып', 'Course / topic')}</th><th>${tr('Твой ответ', 'Сенің жауабың', 'Your answer')}</th><th>${tr('Верный', 'Дұрысы', 'Correct')}</th><th>${tr('Время', 'Уақыт', 'Time')}</th></tr>${S.answers.map(a => { const t = TOPIC[a.topic]; return `<tr><td>${dn(a.disc)}<br><span class="muted">${tn(t.id)} · ${LVL()[a.lvl]}</span></td><td style="color:${a.ok ? 'var(--ok)' : 'var(--gap)'}">${esc(optText(t, a.chosen))}</td><td>${esc(Q(TL(t).o[t.a]))}</td><td class="mono">${num(a.ms / 1000)} ${SEC()}</td></tr>`; }).join('')}</table></details>
  </div></div>`;
  countUp($('#view'));
  requestAnimationFrame(() => $$('[data-w]').forEach(b => b.style.width = b.dataset.w + '%'));
  $$('.gnode').forEach(n => n.onclick = () => go('lesson-' + n.dataset.id));
}
function rootCard(g) {
  const R = S.results, r = TOPIC[g.root], all = [g.root, ...g.affects];
  const chain = `<div class="chain">${all.map((id, i) => `${i ? '<span class="ar">→</span>' : ''}<span class="node ${i ? 'gap' : 'root'}">${tn(id)}</span>`).join('')}</div>`;
  const ev = all.map(id => { const a = answerFor(id), t = TOPIC[id], q = TL(t).q; return a ? `<span>• ${esc(q.length > 62 ? q.slice(0, 60) + '…' : q)} — ${tr('ты ответил', 'сенің жауабың', 'you answered')} ${esc(optText(t, a.chosen))}</span>` : `<span>• ${Q(tn(id))} — ${R.topicM[id].v < .2 ? tr('выведено: не решена база дисциплины', 'шығарылды: пәннің негізі шешілмеді', 'inferred: the basics were not solved') : tr('выведено: не подтверждён средний уровень', 'шығарылды: орта деңгей расталмады', 'inferred: intermediate level not confirmed')}</span>`; }).join('');
  const txt = g.affects.length
    ? tr(`«${tn(r.id)}» (${dn(r.disc)}) — пререквизит для ${g.affects.map(a => '«' + tn(a) + '»').join(', ')}. Пока не закрыта база, ошибки в зависимых темах будут повторяться.`, `«${tn(r.id)}» (${dn(r.disc)}) — ${g.affects.map(a => '«' + tn(a) + '»').join(', ')} үшін пререквизит. Негіз жабылмайынша, тәуелді тақырыптардағы қателер қайталана береді.`, `“${tn(r.id)}” (${dn(r.disc)}) is a prerequisite for ${g.affects.map(a => '“' + tn(a) + '”').join(', ')}. Until the basics are fixed, mistakes in dependent topics will keep coming back.`)
    : tr(`Изолированный пробел в дисциплине «${dn(r.disc)}». Закрывается одним занятием и практикой.`, `«${dn(r.disc)}» пәніндегі оқшау олқылық. Бір сабақ пен практика арқылы жабылады.`, `An isolated gap in “${dn(r.disc)}”. One session plus practice will close it.`);
  return `<div class="root"><span class="eyebrow">${g.affects.length ? tr('Корневая причина', 'Түпкі себеп', 'Root cause') : tr('Точечный пробел', 'Нүктелік олқылық', 'Isolated gap')} · ${pct(R.topicM[g.root].v)}%</span>${chain}<p>${txt}</p><div class="ev">${ev}</div><a class="btn sm ghost" style="align-self:flex-start" href="#lesson-${g.root}">${tr('Разобрать', 'Талдау', 'Study')} ${Q(tn(r.id))} ${ICON.arrow}</a></div>`;
}
function graphSvg(R, dir) {
  const cols = dir.disc, cw = 140, rh = 108, padX = 70, padY = 46;
  const W = padX * 2 + cw * (cols.length - 1), H = padY + rh * 2 + 76, pos = {};
  cols.forEach((did, ci) => ['e', 'm', 'h'].forEach((l, ri) => { const t = DISC[did].topics.find(x => x.lvl === l); pos[t.id] = [padX + ci * cw, padY + 18 + ri * rh]; }));
  let edges = '';
  Object.keys(pos).forEach(id => TOPIC[id].pre.forEach(p => { if (!pos[p]) return; const [x1, y1] = pos[p], [x2, y2] = pos[id], hot = R.gaps.includes(p) && R.gaps.includes(id), mx = (x1 + x2) / 2; edges += `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" fill="none" stroke="${hot ? 'var(--gap)' : 'rgba(39,26,0,.16)'}" stroke-width="${hot ? 1.8 : 1.2}" ${hot ? '' : 'stroke-dasharray="3 4"'}/>`; }));
  const lines = s => { const w = s.split(' '); if (s.length < 16) return [s]; let a = '', i = 0; while (i < w.length && (a + ' ' + w[i]).trim().length <= 16) { a = (a + ' ' + w[i]).trim(); i++; } if (!a) { a = w[0]; i = 1; } return [a, w.slice(i).join(' ')]; };
  let nodes = '';
  Object.entries(pos).forEach(([id, [x, y]]) => {
    const m = R.topicM[id], v = m ? m.v : null, inf = m && m.src === 'inferred', c = colorOf(v);
    nodes += `<g class="gnode" data-id="${id}"><title>${esc(tn(id))}: ${v == null ? '—' : pct(v) + '%'}</title><circle cx="${x}" cy="${y}" r="15" fill="${inf ? '#fff' : c}" stroke="${inf ? c : '#fff'}" stroke-width="${inf ? 2 : 3}" ${inf ? 'stroke-dasharray="3 3"' : ''}/>${v != null ? `<text x="${x}" y="${y + 3.5}" text-anchor="middle" font-family="JetBrains Mono" font-size="9" fill="${inf ? c : '#fff'}">${pct(v)}</text>` : ''}${lines(tn(id)).map((ln, k) => `<text x="${x}" y="${y + 32 + k * 13}" text-anchor="middle" font-size="11" fill="#271a00" font-family="Inter">${esc(ln)}</text>`).join('')}</g>`;
  });
  const heads = cols.map((did, ci) => `<text x="${padX + ci * cw}" y="16" text-anchor="middle" font-family="Inter" font-size="11" fill="#7c7464">${esc(dshort(did))}</text>`).join('');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="min-width:${W}px;width:100%;height:auto">${heads}${edges}${nodes}</svg>`;
}

/* ================= plan ================= */
let PLANSEL = null;
const DOWS = { ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], kk: ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'], en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] };
const TYICON = {
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/></svg>',
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 4.5l4 4L9 19H5v-4z"/><path d="M13 7l4 4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  test: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>'
};
function itemName(i) { return i.type === 'test' ? tr('Мини-диагностика недели', 'Апталық мини-диагностика', 'Weekly mini-diagnostic') : i.deep ? dn(i.deep) : tn(i.topic); }
function itemDesc(i) {
  switch (i.type) {
    case 'learn': return tr('Объяснение простым языком, формула, пример решения и разбор твоей ошибки из диагностики', 'Қарапайым түсіндірме, формула, шешу мысалы және диагностикадағы қатеңді талдау', 'Plain-language explanation, formula, worked example and a look at your diagnostic mistake');
    case 'practice': return i.deep ? tr('Задачи уровня экзамена, чтобы сильная дисциплина не просела', 'Сильный пән төмендемеуі үшін емтихан деңгейіндегі есептер', 'Exam-level problems so a strong course stays strong') : tr(`${i.k} задач: сначала на понимание, потом на применение`, `${i.k} есеп: алдымен түсінуге, содан кейін қолдануға`, `${i.k} problems: understanding first, then applying`);
    case 'check': return tr('Контрольный вопрос — засчитывается только при верном ответе', 'Бақылау сұрағы — тек дұрыс жауап берсең есептеледі', 'One check question — counts only when answered correctly');
    case 'review': return tr(`Короткое интервальное повторение, чтобы тема не забылась · +${i.o} дн. после разбора`, `Тақырып ұмытылмауы үшін қысқа аралықты қайталау · талдаудан кейін +${i.o} күн`, `A quick spaced review so the topic sticks · +${i.o} days after learning`);
    default: return tr('6 вопросов по темам недели — Mentor пересчитает освоение и поправит план', 'Апта тақырыптары бойынша 6 сұрақ — Mentor меңгеруді қайта есептеп, жоспарды түзетеді', "6 questions on this week's topics — Mentor recalculates mastery and adjusts the plan");
  }
}
function ring(p, size = 84) { const r = size / 2 - 6, c = 2 * Math.PI * r; return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ash)" stroke-width="6"/><circle class="ring-v" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--teal)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - p)}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="54%" text-anchor="middle" font-family="Newsreader, Georgia" font-size="${size * .3}" fill="#271a00">${Math.round(p * 100)}%</text></svg>`; }
function pagePlan() {
  if (!S.plan) return go('start');
  renderHeader('app', 'plan');
  const PL = S.plan, P = S.profile, R = S.results, today = planDay(PL);
  if (PLANSEL == null || PLANSEL >= PL.days) PLANSEL = today;
  const sel = PLANSEL, wk = Math.floor(sel / 7);
  const dd = d => new Date(PL.start + d * dayMs), its = d => PL.items.filter(i => i.day === d), sumMin = a => a.reduce((x, i) => x + i.min, 0), isDone = i => !!S.done[i.id];
  const total = PL.items.length, done = PL.items.filter(isDone).length;
  let streak = 0; for (let d = today; d >= 0; d--) { const x = its(d); if (x.length && x.every(isDone)) streak++; else if (d !== today) break; }
  const wkDays = [0, 1, 2, 3, 4, 5, 6].map(k => wk * 7 + k).filter(d => d < PL.days);
  const wkMin = wkDays.reduce((x, d) => x + sumMin(its(d)), 0), wkDone = wkDays.reduce((x, d) => x + sumMin(its(d).filter(isDone)), 0);
  const nextTest = PL.items.find(i => i.type === 'test' && i.day >= today);
  const learns = PL.items.filter(i => i.type === 'learn'), cur = learns.findIndex(i => !isDone(i));
  const maxMin = Math.max(PL.per + 15, ...wkDays.map(d => sumMin(its(d))));
  const x = its(sel), xMin = sumMin(x), xDone = sumMin(x.filter(isDone));
  const firstLearn = x.find(i => i.type === 'learn');
  let why = '';
  if (firstLearn) {
    const t = TOPIC[firstLearn.topic], deps = learns.filter(l => TOPIC[l.topic].pre.includes(t.id)).map(l => tn(l.topic)), weakPre = t.pre.filter(p => R.topicM[p] && R.topicM[p].v < .5);
    why = deps.length ? tr(`Сегодня «${tn(t.id)}» — на этой теме строятся ${deps.map(n => '«' + n + '»').join(', ')}. Закроешь её — дальше пойдёт быстрее.`, `Бүгін «${tn(t.id)}» — бұл тақырыпқа ${deps.map(n => '«' + n + '»').join(', ')} негізделеді. Оны жапсаң — әрі қарай жылдамырақ болады.`, `Today is “${tn(t.id)}” — ${deps.map(n => '“' + n + '”').join(', ')} build on it. Fix it and the rest gets easier.`)
      : weakPre.length ? tr(`«${tn(t.id)}» стоит после «${tn(weakPre[0])}», потому что опирается на неё.`, `«${tn(t.id)}» «${tn(weakPre[0])}» тақырыбынан кейін тұр, өйткені соған негізделеді.`, `“${tn(t.id)}” comes after “${tn(weakPre[0])}” because it builds on it.`)
      : tr(`«${tn(t.id)}» — точечный пробел. Одного занятия и практики хватит, чтобы его закрыть.`, `«${tn(t.id)}» — нүктелік олқылық. Оны жабуға бір сабақ пен практика жеткілікті.`, `“${tn(t.id)}” is an isolated gap. One session plus practice is enough to close it.`);
  } else if (x.some(i => i.type === 'review')) why = tr('Сегодня в основном повторения: они короткие, но без них тема забывается за неделю.', 'Бүгін негізінен қайталау: олар қысқа, бірақ оларсыз тақырып бір аптада ұмытылады.', 'Mostly reviews today: they are short, but without them a topic fades within a week.');
  const reviews = PL.items.filter(i => i.type === 'review' && i.day >= today && !isDone(i)).slice(0, 4);
  const chains = R.groups.filter(g => g.affects.length);
  $('#view').innerHTML = `<div class="page plan"><div class="wrap">
  <div class="page-h"><div><span class="eyebrow">${tr('Индивидуальный план', 'Жеке жоспар', 'Personal plan')} · ${DIRS[P.dir].code} · ${esc(L(DIRS[P.dir].name))}</span><h1 class="h-page" style="margin-top:10px">${tr('План до сессии', 'Сессияға дейінгі жоспар', 'Your plan to exams')}</h1><p>${GOALS()[P.goal] || ''} · ${PL.weeks} ${pl(PL.weeks, ['неделя', 'недели', 'недель'], 'апта', ['week', 'weeks'])} · ${PL.per} ${MIN()} / ${tr('день', 'күн', 'day')}</p></div><button class="btn ghost" id="rb">${ICON.spark} ${tr('Перестроить план', 'Жоспарды қайта құру', 'Rebuild the plan')}</button></div>
  <div id="rbThink"></div>
  <div class="psum">
    <div class="ps ps-ring">${ring(done / total)}<div><b>${done} / ${total}</b><span>${tr('заданий выполнено', 'тапсырма орындалды', 'tasks done')}</span></div></div>
    <div class="ps"><span class="eyebrow">${tr('Сегодня', 'Бүгін', 'Today')}</span><b>${sumMin(its(today).filter(i => !isDone(i)))} ${MIN()}</b><span>${tr('осталось', 'қалды', 'left')} · ${tr('серия', 'қатарынан', 'streak')} ${streak} ${pl(streak, ['день', 'дня', 'дней'], 'күн', ['day', 'days'])}</span></div>
    <div class="ps"><span class="eyebrow">${tr('Неделя', 'Апта', 'Week')} ${wk + 1}</span><b>${wkDone} / ${wkMin} ${MIN()}</b><div class="bar" style="margin-top:8px"><i style="background:var(--teal)" data-w="${wkMin ? Math.round(wkDone / wkMin * 100) : 0}"></i></div></div>
    <div class="ps"><span class="eyebrow">${tr('Ближайший мини-тест', 'Жақын мини-тест', 'Next mini-test')}</span><b>${nextTest ? fmtDate(dd(nextTest.day)) : '—'}</b><span>${nextTest ? (nextTest.day === today ? tr('сегодня', 'бүгін', 'today') : tr(`через ${nextTest.day - today} ${pl(nextTest.day - today, ['день', 'дня', 'дней'], 'күн', ['day', 'days'])}`, `${nextTest.day - today} күннен кейін`, `in ${nextTest.day - today} ${pl(nextTest.day - today, '', '', ['day', 'days'])}`)) : ''}</span></div>
  </div>
  ${learns.length ? `<div class="card road-c"><div class="rc-h"><h3>${tr('Маршрут по темам', 'Тақырыптар бойынша бағыт', 'Topic route')}</h3><span class="muted" style="font-size:13.5px">${tr('Порядок построен по пререквизитам: сначала база, потом то, что на ней держится.', 'Рет пререквизиттер бойынша құрылған: алдымен негіз, содан кейін соған сүйенетіндер.', 'Ordered by prerequisites: basics first, then what rests on them.')}</span></div>
    <div class="road">${learns.map((it, k) => { const st = isDone(it) ? 'done' : k === cur ? 'cur' : 'next', t = TOPIC[it.topic], pre = t.pre.filter(p => learns.some(l => l.topic === p)); return `${k ? '<span class="rn-line ' + (isDone(learns[k - 1]) ? 'on' : '') + '"></span>' : ''}<button class="rn ${st} ${it.day === sel ? 'sel' : ''}" data-d="${it.day}"><span class="rn-dot">${st === 'done' ? ICON.check : k + 1}</span><span class="rn-n">${esc(tn(it.topic))}</span><span class="rn-d">${esc(dshort(t.disc))} · ${fmtDate(dd(it.day))}</span>${pre.length ? `<span class="rn-pre">↳ ${tr('после', 'кейін:', 'after')} ${pre.map(p => esc(tn(p))).join(', ')}</span>` : ''}</button>`; }).join('')}</div></div>` : ''}
  <div class="plan-grid">
    <div>
      <div class="wk-h"><button class="wk-a" data-wk="${wk - 1}" ${wk ? '' : 'disabled'}>‹</button><div><b>${tr('Неделя', 'Апта', 'Week')} ${wk + 1} ${tr('из', '/', 'of')} ${PL.weeks}</b><span>${fmtDate(dd(wkDays[0]))} — ${fmtDate(dd(wkDays[wkDays.length - 1]))}</span></div><button class="wk-a" data-wk="${wk + 1}" ${wk + 1 < PL.weeks ? '' : 'disabled'}>›</button></div>
      <div class="wk">${wkDays.map(d => { const y = its(d), m = sumMin(y), md = sumMin(y.filter(isDone)), full = y.length && y.every(isDone); return `<button class="wd ${d === sel ? 'sel' : ''} ${d === today ? 'today' : ''} ${full ? 'full' : ''}" data-d="${d}"><span class="wd-w">${DOWS[LANG][dd(d).getDay()]}</span><b>${dd(d).getDate()}</b><span class="wd-bar"><i style="height:${m / maxMin * 100}%"></i><i class="dn" style="height:${md / maxMin * 100}%"></i></span><span class="wd-m">${m}′</span>${y.some(i => i.type === 'test') ? '<span class="wd-flag"></span>' : ''}</button>`; }).join('')}</div>
      <div class="card dayc">
        <div class="dayc-h"><div><span class="eyebrow">${dow(dd(sel))}${sel === today ? ' · ' + tr('сегодня', 'бүгін', 'today') : ''}</span><h3>${fmtDate(dd(sel))}</h3></div><div class="dayc-p"><span class="mono">${xDone} / ${xMin} ${MIN()}</span><div class="bar"><i style="background:var(--teal)" data-w="${xMin ? Math.round(xDone / xMin * 100) : 0}"></i></div></div></div>
        ${why ? `<div class="why"><span class="why-ic">${LOGO}</span><p>${esc(why)}</p></div>` : ''}
        <div class="tks">${x.map(i => `<div class="tk2 ${isDone(i) ? 'done' : ''}" data-id="${i.id}"><button class="cb" aria-label="✓">${ICON.check}</button><span class="tk-ic ty-${i.type}">${TYICON[i.type]}</span><div class="tk-b"><div class="tk-t"><span class="tyb ty-${i.type}">${TYPE()[i.type]}</span><b>${esc(itemName(i))}</b></div><p>${esc(itemDesc(i))}</p></div><span class="tk-min">${i.min} ${MIN()}</span><button class="btn sm ghost tk-go">${isDone(i) ? tr('Ещё раз', 'Қайта', 'Again') : tr('Начать', 'Бастау', 'Start')}</button></div>`).join('') || `<p class="muted">${tr('В этот день заданий нет.', 'Бұл күні тапсырма жоқ.', 'Nothing planned for this day.')}</p>`}</div>
      </div>
    </div>
    <aside class="plan-side">
      <div class="card"><h3 style="font-size:20px">${tr('Нагрузка недели', 'Апталық жүктеме', 'Weekly load')}</h3><div class="load">${wkDays.map(d => { const y = its(d), m = sumMin(y), md = sumMin(y.filter(isDone)); return `<div class="ld ${d === sel ? 'sel' : ''}"><div class="ld-col"><i style="height:${m / maxMin * 100}%"></i><i class="dn" style="height:${md / maxMin * 100}%"></i></div><span>${DOWS[LANG][dd(d).getDay()]}</span></div>`; }).join('')}<div class="ld-lim" style="bottom:${22 + PL.per / maxMin * 120}px"><span>${PL.per} ${MIN()}</span></div></div><div class="legend" style="margin-top:10px"><span><i style="background:var(--fog)"></i>${tr('запланировано', 'жоспарланды', 'planned')}</span><span><i style="background:var(--teal)"></i>${tr('сделано', 'орындалды', 'done')}</span></div></div>
      ${chains.length ? `<div class="card"><h3 style="font-size:20px">${tr('Почему такой порядок', 'Неге мұндай рет', 'Why this order')}</h3><div class="chains">${chains.map(g => `<div class="chain">${[g.root, ...g.affects].map((id, k) => `${k ? '<span class="ar">→</span>' : ''}<span class="node ${k ? 'gap' : 'root'}">${esc(tn(id))}</span>`).join('')}</div>`).join('')}</div><p class="muted" style="font-size:13.5px;margin:12px 0 0">${tr('Корневая тема стоит первой: пока она не закрыта, ошибки в зависимых темах возвращаются.', 'Түпкі тақырып бірінші тұр: ол жабылмайынша, тәуелді тақырыптардағы қателер қайталанады.', 'The root topic comes first: until it is fixed, mistakes in dependent topics keep coming back.')}</p></div>` : ''}
      <div class="card"><h3 style="font-size:20px">${tr('Интервальные повторения', 'Аралықты қайталау', 'Spaced reviews')}</h3><div class="revs">${reviews.map(i => `<button class="rv-i" data-d="${i.day}"><span class="rv-dots">${[2, 6, 13].map(o => `<i class="${o <= i.o ? 'on' : ''}"></i>`).join('')}</span><span class="rv-n">${esc(tn(i.topic))}</span><span class="rv-d">${fmtDate(dd(i.day))} · +${i.o}</span></button>`).join('') || `<span class="muted" style="font-size:13.5px">—</span>`}</div><p class="muted" style="font-size:12.5px;margin:10px 0 0">${tr('Каждую тему Mentor возвращает через 2, 6 и 13 дней.', 'Mentor әр тақырыпты 2, 6 және 13 күннен кейін қайтарады.', 'Mentor brings each topic back after 2, 6 and 13 days.')}</p></div>
      <div class="card"><h3 style="font-size:20px">${tr('Все недели', 'Барлық апталар', 'All weeks')}</h3><div class="heat">${Array.from({ length: PL.weeks }, (_, w) => `<div class="hrow"><span>${tr('Н', 'А', 'W')}${w + 1}</span>${[0, 1, 2, 3, 4, 5, 6].map(k => { const d = w * 7 + k; if (d >= PL.days) return '<i></i>'; const y = its(d), m = sumMin(y), full = y.length && y.every(isDone), some = y.some(isDone); return `<button class="hc ${full ? 'full' : some ? 'some' : ''} ${d === today ? 'today' : ''} ${d === sel ? 'sel' : ''}" data-d="${d}" style="--a:${(m / maxMin).toFixed(2)}" title="${fmtDate(dd(d))} · ${m} ${MIN()}"></button>`; }).join('')}</div>`).join('')}</div></div>
    </aside>
  </div></div></div>`;
  requestAnimationFrame(() => { $$('[data-w]').forEach(b => b.style.width = b.dataset.w + '%'); $$('.ring-v').forEach(c => c.style.strokeDashoffset = c.dataset.off); });
  $$('[data-d]').forEach(b => b.onclick = () => { PLANSEL = +b.dataset.d; pagePlan(); });
  $$('[data-wk]').forEach(b => b.onclick = () => { PLANSEL = Math.min(PL.days - 1, +b.dataset.wk * 7 + (+b.dataset.wk === Math.floor(today / 7) ? today % 7 : 0)); pagePlan(); });
  $$('.tk2').forEach(row => {
    const it = PL.items.find(i => i.id === row.dataset.id);
    $('.cb', row).onclick = () => { if (S.done[it.id]) delete S.done[it.id]; else { S.done[it.id] = true; row.classList.add('pop'); } save(); later(() => pagePlan(), 260); };
    $('.tk-go', row).onclick = () => {
      if (it.type === 'practice') { PENDING = tr('Дай задачи по теме ', 'Мына тақырып бойынша есеп бер: ', 'Give me problems on ') + itemName(it).toLowerCase(); go('mentor'); }
      else if (it.type === 'test') { if (it.day > today) toast(tr(`Мини-тест откроется ${fmtDate(dd(it.day))}`, `Мини-тест ${fmtDate(dd(it.day))} ашылады`, `The mini-test opens on ${fmtDate(dd(it.day))}`)); else { S.done[it.id] = true; save(); toast(tr('Мини-тест засчитан', 'Мини-тест есептелді', 'Mini-test counted')); pagePlan(); } }
      else go('lesson-' + it.topic);
    };
  });
  $('#rb').onclick = rebuildPlan;
}
async function rebuildPlan() {
  const tok = RUN, PL = S.plan, today = planDay(PL);
  $('#rb').disabled = true;
  const th = Think($('#rbThink'), tr('Перестраиваю план', 'Жоспарды қайта құрып жатырмын', 'Rebuilding the plan'), tok);
  const doneN = PL.items.filter(i => S.done[i.id]).length, missed = PL.items.filter(i => i.day < today && !S.done[i.id]);
  await th.step(tr('Учитываю выполненные задания', 'Орындалған тапсырмаларды ескеремін', 'Counting completed tasks'), `${doneN} / ${PL.items.length}`);
  await th.step(tr('Ищу пропущенное', 'Өткізілгенді іздеймін', 'Looking for missed tasks'), missed.length ? `${missed.length} → ${tr('переношу на ближайшие дни', 'жақын күндерге ауыстырамын', 'moving to the next days')}` : tr('пропусков нет', 'өткізілген жоқ', 'nothing missed'));
  await th.step(tr('Пересчитываю интервалы повторений', 'Қайталау аралықтарын қайта есептеймін', 'Recomputing review intervals'), '+2 · +6 · +13');
  await th.step(tr('Проверяю нагрузку', 'Жүктемені тексеремін', 'Checking the load'), `≤ ${PL.per + 15} ${MIN()} / ${tr('день', 'күн', 'day')}`);
  if (tok !== RUN) return;
  th.finish(tr('План обновлён', 'Жоспар жаңартылды', 'Plan updated'));
  missed.forEach((i, k) => { i.day = Math.min(PL.days - 1, today + (k % 3)); });
  PL.items.sort((a, b) => a.day - b.day); save(); toast(tr('План обновлён', 'Жоспар жаңартылды', 'Plan updated'));
  await sleep(700); if (tok !== RUN) return; pagePlan();
}

/* ================= lesson ================= */
function lessonMd(t, intro) {
  const a = answerFor(t.id), T0 = TL(t);
  let s = `### ${T0.n} — ${tr('простыми словами', 'қарапайым тілмен', 'in plain words')}\n\n${intro ? intro + '\n\n' : ''}${T0.s}\n\n**${tr('Аналогия', 'Ұқсастық', 'Analogy')}.** ${T0.an}\n\n`;
  s += `### ${tr('Формула', 'Формула', 'Formula')}\n\n$$${L(t.f)}$$\n\n`;
  s += `### ${tr('Пример решения', 'Шешу мысалы', 'Worked example')}\n\n${F}calc\n${L(t.calc)}\n${F}\n\n`;
  s += `### ${tr('Где обычно ошибаются', 'Әдетте қай жерде қателеседі', 'Common mistakes')}\n\n${T0.pf}\n\n`;
  if (a && !a.ok) s += `> ${tr(`В диагностике ты ответил ${optText(t, a.chosen)}. Правильно — ${Q(T0.o[t.a])}: ${T0.why}`, `Диагностикада сенің жауабың — ${optText(t, a.chosen)}. Дұрысы — ${Q(T0.o[t.a])}: ${T0.why}`, `In the diagnostic you answered ${optText(t, a.chosen)}. The right answer is ${Q(T0.o[t.a])}: ${T0.why}`)}\n\n`;
  s += `### ${tr('Закрепи', 'Бекіт', 'Practice')}\n\n${T0.pr.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
  return s;
}
const INTROS = () => tr(['Разберём без лишней теории — только то, что нужно, чтобы решать задачи.', 'Начну с главной идеи, потом формула, пример и типичная ловушка.', 'Объясню так, чтобы это можно было пересказать одногруппнику за минуту.'], ['Артық теориясыз талдайық — тек есеп шығаруға керегін ғана.', 'Басты идеядан бастаймын, содан кейін формула, мысал және жиі кездесетін қате.', 'Топтасыңа бір минутта айтып бере алатындай түсіндіремін.'], ['No extra theory — just what you need to solve problems.', "I'll start with the key idea, then the formula, an example and the usual trap.", "I'll explain it so you could retell it to a classmate in a minute."]);
async function pageLesson(id) {
  const t = TOPIC[id]; if (!t || !S.results) return go(S.results ? 'dashboard' : 'start');
  renderHeader('app', '');
  const tok = RUN, R = S.results, d = DISC[t.disc], m = R.topicM[id], v = m ? m.v : null, a = answerFor(id), T0 = TL(t);
  const planIt = S.plan.items.find(i => i.topic === id && i.type === 'learn');
  $('#view').innerHTML = `<div class="page"><div class="wrap">
    <a class="link" href="#dashboard" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:18px;text-decoration:none">${ICON.back.replace('<svg', '<svg width="14" height="14"')} ${tr('Карта знаний', 'Білім картасы', 'Knowledge map')}</a>
    <div class="lesson"><div class="card"><span class="eyebrow">${tr('Объяснение', 'Түсіндірме', 'Explanation')} · ${esc(dn(d.id))}</span><h1 class="h-page" style="margin:10px 0 24px">${T0.n}</h1><div id="thk"></div><div class="md" id="out"></div><div id="chk"></div></div>
    <aside class="lesson-side"><div class="card"><span class="eyebrow">${tr('Тема', 'Тақырып', 'Topic')}</span><div class="kv"><div><span>${tr('Дисциплина', 'Пән', 'Course')}</span><b style="font-weight:500;text-align:right">${dn(d.id)}</b></div><div><span>${tr('Уровень', 'Деңгей', 'Level')}</span><b style="font-weight:500">${LVL()[t.lvl]}</b></div><div><span>${tr('В плане', 'Жоспарда', 'In the plan')}</span><b style="font-weight:500">${planIt ? fmtDate(new Date(S.plan.start + planIt.day * dayMs)) : tr('углубление', 'тереңдету', 'going deeper')}</b></div></div>
      <div class="mbar"><div class="bar"><i id="mb" style="background:${colorOf(v)};width:${v == null ? 0 : pct(v)}%"></i></div><span class="pct" id="mp">${v == null ? '—' : pct(v) + '%'}</span></div></div>
      ${t.pre.length ? `<div class="card"><span class="eyebrow">${tr('Опирается на', 'Негізделеді', 'Builds on')}</span><div class="pre-l">${t.pre.map(p => { const pv = R.topicM[p]; return `<a href="#lesson-${p}"><span>${tn(p)}</span><span class="mono" style="color:${colorOf(pv ? pv.v : null)}">${pv ? pct(pv.v) + '%' : '—'}</span></a>`; }).join('')}</div></div>` : ''}
      <a class="btn ghost" href="#mentor">${tr('Задать вопрос по теме', 'Тақырып бойынша сұрақ қою', 'Ask about this topic')}</a></aside></div></div></div>`;
  const th = Think($('#thk'), tr('Готовлю объяснение', 'Түсіндірме дайындап жатырмын', 'Preparing an explanation'), tok);
  await th.step(tr('Открываю профиль по теме', 'Тақырып бойынша профильді ашамын', 'Opening your profile for this topic'), `${dn(d.id)}: ${pct(R.disc[d.id] ? R.disc[d.id].v : .5)}% · ${Q(T0.n)}: ${v == null ? '—' : pct(v) + '%'}`);
  if (a) await th.step(a.ok ? tr('Сверяюсь с диагностикой', 'Диагностикамен салыстырамын', 'Checking against the diagnostic') : tr('Нахожу ошибку в диагностике', 'Диагностикадағы қатені табамын', 'Finding the diagnostic mistake'), a.ok ? tr('ответ был верным — делаю акцент на применении', 'жауап дұрыс болды — қолдануға мән беремін', 'the answer was right — focusing on application') : `${optText(t, a.chosen)} → ${Q(T0.o[t.a])}`);
  if (t.pre.length) await th.step(tr('Проверяю пререквизиты', 'Пререквизиттерді тексеремін', 'Checking prerequisites'), t.pre.map(p => { const pv = R.topicM[p]; return `${Q(tn(p))} — ${pv ? pct(pv.v) + '%' + (pv.v < .5 ? tr(' · пробел', ' · олқылық', ' · gap') : ' · ok') : tr('вне программы', 'бағдарламадан тыс', 'outside the programme')}`; }));
  await th.step(tr('Подбираю формат объяснения', 'Түсіндіру форматын таңдаймын', 'Choosing the explanation format'), `${LVL()[t.lvl]} · ${tr('аналогия + формула + решение', 'ұқсастық + формула + шешу', 'analogy + formula + solution')}`);
  if (tok !== RUN) return;
  th.finish();
  const weakPre = t.pre.filter(p => R.topicM[p] && R.topicM[p].v < .5), intros = INTROS();
  const intro = weakPre.length ? tr(`Сначала короткое напоминание: эта тема опирается на «${tn(weakPre[0])}», а там у тебя тоже пробел. Если что-то ниже будет непонятно — открой сначала её.`, `Алдымен қысқа ескерту: бұл тақырып «${tn(weakPre[0])}» тақырыбына негізделеді, ал онда да олқылығың бар. Төмендегі бір нәрсе түсініксіз болса — алдымен соны аш.`, `A quick note first: this topic builds on “${tn(weakPre[0])}”, where you also have a gap. If anything below is unclear, open that one first.`) : intros[Math.floor(Math.random() * intros.length)];
  if (!await stream($('#out'), lessonMd(t, intro), tok, 1.15)) return;
  const opts = T0.o.map((o, i) => ({ o, i })).sort(() => Math.random() - .5);
  $('#chk').innerHTML = `<div class="check"><span class="eyebrow">${tr('Проверь себя', 'Өзіңді тексер', 'Check yourself')}</span><p class="qtext" style="font-size:19px;margin-top:10px">${esc(T0.q)}</p><div class="opts">${opts.map((x, k) => `<button class="opt" data-i="${x.i}"><span class="k">${'ABCD'[k]}</span><span>${esc(x.o)}</span></button>`).join('')}</div><div id="cres"></div></div>`;
  $$('#chk .opt').forEach(b => b.onclick = () => {
    const i = +b.dataset.i, ok = i === t.a;
    $$('#chk .opt').forEach(x => x.classList.toggle('on', x === b));
    if (ok) {
      const old = R.topicM[id] ? R.topicM[id].v : .3, nv = Math.max(old, .82);
      R.topicM[id] = { v: nv, src: 'tested' };
      if (R.disc[d.id]) R.disc[d.id].v = clamp(R.disc[d.id].v + (nv - old) / 3, 0, .98);
      R.gaps = Object.keys(R.topicM).filter(k => R.topicM[k].v < .5);
      const vals = Object.values(R.disc).map(x => x.v); R.overall = vals.reduce((s, x) => s + x, 0) / vals.length;
      ['learn', 'check'].forEach(ty => { const it = S.plan.items.find(x => x.topic === id && x.type === ty); if (it) S.done[it.id] = true; });
      save();
      const nx = nextGap(id);
      $('#cres').innerHTML = `<div class="res ok"><b style="font-weight:600">${tr('Верно.', 'Дұрыс.', 'Correct.')}</b> ${esc(T0.why)}<div class="mbar"><span class="muted" style="font-size:13px">${tr('Освоение темы', 'Тақырыпты меңгеру', 'Topic mastery')}</span><div class="bar"><i style="background:var(--ok);width:${pct(old)}%"></i></div><span class="pct">${pct(old)}% → ${pct(nv)}%</span></div></div><div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap"><a class="btn sm" href="#plan">${tr('Отмечено в плане · открыть план', 'Жоспарда белгіленді · жоспарды ашу', 'Marked in the plan · open plan')}</a>${nx ? `<a class="btn sm ghost" href="#lesson-${nx}">${tr('Следующая тема:', 'Келесі тақырып:', 'Next topic:')} ${Q(tn(nx))}</a>` : ''}</div>`;
      setTimeout(() => { const bi = $('#cres .bar i'); if (bi) bi.style.width = pct(nv) + '%'; const mb = $('#mb'); if (mb) { mb.style.width = pct(nv) + '%'; mb.style.background = colorOf(nv); $('#mp').textContent = pct(nv) + '%'; } }, 80);
    } else $('#cres').innerHTML = `<div class="res no"><b style="font-weight:600">${tr('Пока нет.', 'Әзірге жоқ.', 'Not yet.')}</b> ${tr('Посмотри ещё раз раздел «Где обычно ошибаются» и попробуй снова.', '«Әдетте қай жерде қателеседі» бөлімін тағы қарап, қайта көр.', 'Look at “Common mistakes” again and try once more.')}</div>`;
  });
}
function nextGap(id) { const it = S.plan.items.filter(i => i.type === 'learn'); const k = it.findIndex(i => i.topic === id); return it[k + 1] ? it[k + 1].topic : null; }

/* ================= mentor chat ================= */
function findTopic(q) {
  let best = null, score = 0;
  Object.values(TOPIC).forEach(t => {
    let s = 0;
    ['ru', 'kk', 'en'].forEach(l => { const X = t.L[l]; X.kw.forEach(k => { if (q.includes(k)) s += k.length > 3 ? 2 : 1; }); if (q.includes(X.n.toLowerCase())) s += 3; });
    if (s > score) { score = s; best = t; }
  });
  return best;
}
const sortedGaps = () => { const R = S.results; return R.gaps.slice().sort((a, b) => R.topicM[a].v - R.topicM[b].v); };
function firstPlanTopic() { const PL = S.plan, d = planDay(PL); const it = PL.items.find(i => i.day >= d && i.type === 'learn' && !S.done[i.id]); return it ? TOPIC[it.topic] : sortedGaps()[0] ? TOPIC[sortedGaps()[0]] : DISC[DIRS[S.results.dir].disc[0]].topics[2]; }
function mentorReply(raw) {
  const q = raw.toLowerCase().trim(), t = findTopic(q);
  if (/^\/plan/.test(q) || (!t && /план|сегодня|расписан|с чего начать|жоспар|бүгін|plan|today|schedule/.test(q))) return replyPlan();
  if (/^\/practice|задач|практик|упражнен|есеп|тапсырма|жаттығу|practice|problem|exercise/.test(q)) return replyPractice(t || firstPlanTopic());
  if (/ошиб|қате|mistake|wrong/.test(q) && !t) return replyMistakes();
  if (t || /^\/explain|объясни|что такое|түсіндір|деген не|explain|what is/.test(q)) return replyExplain(t || firstPlanTopic());
  if (/привет|сәлем|салем|салам|здравств|hello|^hi\b|^hey/.test(q)) return replyHello();
  return replyGeneric();
}
const profLine = t => { const R = S.results, m = R.topicM[t.id]; return `${dn(t.disc)}: ${R.disc[t.disc] ? pct(R.disc[t.disc].v) + '%' : '—'} · ${Q(tn(t.id))}: ${m ? pct(m.v) + '%' : tr('не в программе', 'бағдарламада жоқ', 'not in your programme')}`; };
function replyExplain(t) {
  const R = S.results, a = answerFor(t.id), T0 = TL(t);
  const steps = [[tr('Определяю тему вопроса', 'Сұрақтың тақырыбын анықтаймын', 'Identifying the topic'), `${dn(t.disc)} → ${Q(T0.n)}`], [tr('Смотрю твой профиль', 'Профиліңді қараймын', 'Checking your profile'), profLine(t)]];
  if (a && !a.ok) steps.push([tr('Нахожу связанную ошибку в диагностике', 'Диагностикадағы байланысты қатені табамын', 'Finding the related diagnostic mistake'), `${optText(t, a.chosen)} → ${Q(T0.o[t.a])}`]);
  if (t.pre.length) steps.push([tr('Проверяю пререквизиты', 'Пререквизиттерді тексеремін', 'Checking prerequisites'), t.pre.map(p => { const pv = R.topicM[p]; return `${Q(tn(p))} — ${pv ? pct(pv.v) + '%' : '—'}`; })]);
  steps.push([tr('Подбираю уровень объяснения', 'Түсіндіру деңгейін таңдаймын', 'Choosing the explanation level'), `${LVL()[t.lvl]} · ${tr('аналогия + формула', 'ұқсастық + формула', 'analogy + formula')}`]);
  const weak = t.pre.filter(p => R.topicM[p] && R.topicM[p].v < .5);
  const intro = weak.length ? tr(`Короткая ремарка: тема опирается на «${tn(weak[0])}», а там у тебя пробел. Объясню с учётом этого.`, `Қысқа ескерту: тақырып «${tn(weak[0])}» тақырыбына негізделеді, ал онда олқылығың бар. Соны ескеріп түсіндіремін.`, `Quick note: this topic builds on “${tn(weak[0])}”, where you have a gap. I'll explain with that in mind.`) : '';
  const nx = nextGap(t.id);
  return { steps, md: lessonMd(t, intro) + '\n\n' + tr(`Хочешь — дам ещё задач на закрепление${nx ? ` или перейдём к следующей теме из плана: «${tn(nx)}»` : ''}.`, `Қаласаң — бекітуге тағы есеп берейін${nx ? ` немесе жоспардағы келесі тақырыпқа өтейік: «${tn(nx)}»` : ''}.`, `Want more practice problems${nx ? `, or shall we move on to the next topic in your plan: “${tn(nx)}”` : ''}?`), topic: t.id };
}
function replyPlan() {
  const PL = S.plan, d = planDay(PL), its = PL.items.filter(i => i.day === d), left = its.filter(i => !S.done[i.id]), min = left.reduce((s, i) => s + i.min, 0);
  const steps = [[tr('Открываю индивидуальный план', 'Жеке жоспарды ашамын', 'Opening your personal plan'), `${tr('неделя', 'апта', 'week')} ${Math.floor(d / 7) + 1} · ${tr('день', 'күн', 'day')} ${d + 1} / ${PL.days}`], [tr('Учитываю выполненное', 'Орындалғанды ескеремін', 'Counting what is done'), `${its.length - left.length} / ${its.length}`], [tr('Оцениваю нагрузку', 'Жүктемені бағалаймын', 'Checking the load'), `${min} ${MIN()} · ${tr('лимит', 'шегі', 'limit')} ${PL.per} ${MIN()}`]];
  if (!left.length) return { steps, md: `### ${tr('На сегодня всё сделано', 'Бүгінге бәрі орындалды', 'All done for today')}\n\n${tr('Отличная работа. Если есть силы — открой задачи следующего дня.', 'Тамаша жұмыс. Күшің болса — келесі күннің тапсырмаларын аш.', "Great work. If you still have energy, open tomorrow's tasks.")}` };
  const first = left.find(i => i.topic);
  const why = first && TOPIC[first.topic].pre.length ? ' ' + tr(`Она опирается на «${tn(TOPIC[first.topic].pre[0])}», поэтому порядок важен.`, `Ол «${tn(TOPIC[first.topic].pre[0])}» тақырыбына негізделеді, сондықтан рет маңызды.`, `It builds on “${tn(TOPIC[first.topic].pre[0])}”, so the order matters.`) : '';
  return { steps, md: `### ${tr('План на сегодня', 'Бүгінгі жоспар', "Today's plan")} · ${min} ${MIN()}\n\n${left.map((i, k) => `${k + 1}. **${TYPE()[i.type]}.** ${i.topic ? tn(i.topic) : itemTitle(i)} — ${i.min} ${MIN()}`).join('\n')}\n\n${first ? tr(`Начни с «${tn(first.topic)}».`, `«${tn(first.topic)}» тақырыбынан баста.`, `Start with “${tn(first.topic)}”.`) + why : ''}` };
}
function replyPractice(t) {
  const T0 = TL(t);
  const steps = [[tr('Выбираю тему для практики', 'Практикаға тақырып таңдаймын', 'Picking a topic to practise'), profLine(t)], [tr('Генерирую задачи по уровням Блума', 'Блум деңгейлері бойынша есептер жасаймын', 'Generating problems by Bloom level'), tr('понимание → применение → анализ', 'түсіну → қолдану → талдау', 'understand → apply → analyse')], [tr('Проверяю, что задачи не повторяют диагностику', 'Есептердің диагностиканы қайталамайтынын тексеремін', 'Making sure problems differ from the diagnostic'), tr('3 новые задачи', '3 жаңа есеп', '3 new problems')]];
  const md2 = `### ${tr('Практика', 'Практика', 'Practice')}: ${T0.n}\n\n1. **${tr('Разминка', 'Жаттығу', 'Warm-up')}.** ${tr(`Объясни своими словами в 1–2 предложениях, что такое «${T0.n.toLowerCase()}», и придумай свой пример.`, `«${T0.n.toLowerCase()}» дегеннің не екенін 1–2 сөйлеммен өз сөзіңмен түсіндіріп, өз мысалыңды ойлап тап.`, `In 1–2 sentences, explain “${T0.n.toLowerCase()}” in your own words and come up with your own example.`)}\n${T0.pr.map((p, i) => `${i + 2}. **${i ? tr('Применение', 'Қолдану', 'Apply') : tr('Понимание', 'Түсіну', 'Understand')}.** ${p}`).join('\n')}\n\n${tr('Решай по порядку и присылай ответы сюда — проверю и объясню ошибки.', 'Ретімен шығарып, жауаптарыңды осында жібер — тексеріп, қателерді түсіндіремін.', "Solve them in order and send your answers here — I'll check them and explain any mistakes.")}\n\n$$${L(t.f)}$$`;
  return { steps, md: md2, topic: t.id };
}
function replyMistakes() {
  const wrong = S.answers.filter(a => !a.ok);
  const steps = [[tr('Загружаю ответы диагностики', 'Диагностика жауаптарын жүктеймін', 'Loading diagnostic answers'), `${wrong.length} / ${S.answers.length}`], [tr('Группирую по корневым причинам', 'Түпкі себептер бойынша топтаймын', 'Grouping by root cause'), S.results.groups.filter(g => g.affects.length).map(g => `${Q(tn(g.root))} → ${g.affects.length}`).concat([tr('остальные — точечные', 'қалғаны — нүктелік', 'the rest are isolated')]).slice(0, 4)]];
  if (!wrong.length) return { steps, md: tr('Ошибок в диагностике не было. Напиши «дай задачи» — подберу задачи повышенной сложности.', 'Диагностикада қате болған жоқ. «Есеп бер» деп жаз — күрделі есептер іріктеймін.', 'No mistakes in the diagnostic. Type “give me problems” and I will pick advanced ones.') };
  const g = S.results.groups.find(x => x.affects.length);
  return { steps, md: `### ${tr('Разбор ошибок', 'Қателерді талдау', 'Mistake review')}\n\n${wrong.map(a => { const t = TOPIC[a.topic], T0 = TL(t); return `- **${T0.n}** (${dn(a.disc)}). ${tr('Ты ответил', 'Сенің жауабың', 'You answered')} ${optText(t, a.chosen)}, ${tr('верно —', 'дұрысы —', 'correct is')} ${Q(T0.o[t.a])}. ${T0.why}`; }).join('\n')}\n\n${g ? tr(`**Закономерность:** «${tn(g.root)}» — пререквизит для ${g.affects.map(x => '«' + tn(x) + '»').join(', ')}. Закроешь эту базу — часть ошибок уйдёт сама.`, `**Заңдылық:** «${tn(g.root)}» — ${g.affects.map(x => '«' + tn(x) + '»').join(', ')} үшін пререквизит. Осы негізді жапсаң — қателердің бір бөлігі өзінен-өзі кетеді.`, `**Pattern:** “${tn(g.root)}” is a prerequisite for ${g.affects.map(x => '“' + tn(x) + '”').join(', ')}. Fix that base and some mistakes will go away on their own.`) : tr('Ошибки не связаны между собой — их можно закрывать в любом порядке.', 'Қателер бір-бірімен байланыспаған — оларды кез келген ретпен жабуға болады.', 'The mistakes are unrelated — you can fix them in any order.')}` };
}
function replyHello() {
  const P = S.profile, t = firstPlanTopic(), R = S.results;
  return { steps: [[tr('Открываю профиль', 'Профильді ашамын', 'Opening your profile'), `${DIRS[P.dir].code} · ${pct(R.overall)}% · ${GOALS()[P.goal]}`]], md: tr(`Привет, ${P.name}! Сейчас главная тема по плану — «${tn(t.id)}» (${dn(t.disc)}).\n\nМогу:\n- объяснить её простым языком;\n- дать задачи на практику;\n- разобрать твои ошибки из диагностики.\n\nС чего начнём?`, `Сәлем, ${P.name}! Қазір жоспар бойынша басты тақырып — «${tn(t.id)}» (${dn(t.disc)}).\n\nМен:\n- оны қарапайым тілмен түсіндіре аламын;\n- практикаға есептер бере аламын;\n- диагностикадағы қателеріңді талдай аламын.\n\nНеден бастаймыз?`, `Hi, ${P.name}! Your main topic right now is “${tn(t.id)}” (${dn(t.disc)}).\n\nI can:\n- explain it in plain words;\n- give you practice problems;\n- go through your diagnostic mistakes.\n\nWhere shall we start?`) };
}
function replyGeneric() {
  const t = firstPlanTopic(), P = S.profile, T0 = TL(t);
  return {
    steps: [[tr('Анализирую вопрос', 'Сұрақты талдаймын', 'Analysing the question'), tr('ищу связь с дисциплинами программы ', 'бағдарлама пәндерімен байланысын іздеймін ', 'looking for a link to programme courses ') + DIRS[P.dir].code], [tr('Сопоставляю с графом тем', 'Тақырыптар графымен салыстырамын', 'Matching against the topic graph'), tr('ближайшая тема по плану: ', 'жоспар бойынша ең жақын тақырып: ', 'closest topic in your plan: ') + Q(T0.n)]],
    md: tr(`Понял вопрос. Отвечаю в контексте твоей программы, поэтому уточни: к какой дисциплине он относится?\n\nПока подскажу, что сейчас важнее всего по плану — «${T0.n}». ${T0.s}\n\nМожно написать, например:\n- «объясни ${T0.n.toLowerCase()}»\n- «дай задачи по теме ${T0.n.toLowerCase()}»\n- «что у меня на сегодня»`,
      `Сұрағыңды түсіндім. Бағдарламаң аясында жауап беремін, сондықтан нақтыла: бұл қай пәнге қатысты?\n\nӘзірге айтайын: қазір жоспар бойынша ең маңыздысы — «${T0.n}». ${T0.s}\n\nМысалы, былай жазуға болады:\n- «${T0.n.toLowerCase()} түсіндір»\n- «${T0.n.toLowerCase()} бойынша есеп бер»\n- «бүгін не істеймін»`,
      `Got it. I answer in the context of your programme, so tell me: which course is this about?\n\nMeanwhile, the most important topic in your plan right now is “${T0.n}”. ${T0.s}\n\nYou can type, for example:\n- “explain ${T0.n.toLowerCase()}”\n- “give me problems on ${T0.n.toLowerCase()}”\n- “what's on today”`)
  };
}
function suggestions() {
  const t = firstPlanTopic(), g = sortedGaps()[1] ? TOPIC[sortedGaps()[1]] : t;
  return [[tr('Объяснение', 'Түсіндірме', 'Explain'), tr(`Объясни «${tn(t.id)}» как новичку`, `«${tn(t.id)}» тақырыбын жаңадан бастаушыға түсіндір`, `Explain “${tn(t.id)}” like I'm new to it`)], [tr('Практика', 'Практика', 'Practice'), tr(`Дай задачи по теме «${tn(g.id)}»`, `«${tn(g.id)}» бойынша есеп бер`, `Give me problems on “${tn(g.id)}”`)], [tr('План', 'Жоспар', 'Plan'), tr('Что у меня на сегодня?', 'Бүгін не істеймін?', "What's on today?")], [tr('Разбор ошибок', 'Қателерді талдау', 'Mistakes'), tr('Почему я ошибся в диагностике?', 'Диагностикада неге қателестім?', 'Why did I get things wrong in the diagnostic?')]];
}
let CHATBUSY = false;
function pageMentor() {
  if (!S.results) return go('start');
  renderHeader('app', 'mentor');
  const R = S.results, dir = DIRS[R.dir];
  $('#view').innerHTML = `<div class="page" style="padding-bottom:0"><div class="wrap"><div class="chat">
    <aside class="chat-side"><div class="card"><span class="eyebrow">${tr('Контекст ментора', 'Тәлімгер контексі', "Mentor's context")}</span><div class="kv"><div><span>${tr('Программа', 'Бағдарлама', 'Programme')}</span><b style="font-weight:500">${dir.code}</b></div><div><span>${tr('Готовность', 'Дайындық', 'Readiness')}</span><b style="font-weight:500">${pct(R.overall)}%</b></div><div><span>${tr('Пробелы', 'Олқылықтар', 'Gaps')}</span><b style="font-weight:500">${R.gaps.length}</b></div></div></div>
      <div class="card"><span class="eyebrow">${tr('Слабые темы', 'Әлсіз тақырыптар', 'Weak topics')}</span><div class="ctx-list">${sortedGaps().slice(0, 6).map(id => `<button class="ctx" data-q="${esc(tr('Объясни ', 'Түсіндір: ', 'Explain ') + tn(id).toLowerCase())}"><span>${tn(id)}</span><span class="mono">${pct(R.topicM[id].v)}%</span></button>`).join('') || '<span class="muted" style="font-size:13px">—</span>'}</div></div>
      <button class="btn sm ghost" id="clr">${tr('Новый диалог', 'Жаңа диалог', 'New chat')}</button></aside>
    <div class="chat-main"><div class="msgs" id="msgs"></div>
      <div class="composer"><div class="comp-in"><textarea id="ta" rows="1" placeholder="${tr('Спроси ментора о любой теме программы…', 'Тәлімгерден бағдарламаның кез келген тақырыбы туралы сұра…', 'Ask Mentor about any topic in your programme…')}"></textarea><div class="comp-row"><div class="l"><span class="model">mentor-2 · ${tr('глубокое мышление', 'терең ойлау', 'deep thinking')}</span></div><button class="send" id="snd" disabled>${ICON.send}</button></div></div></div>
    </div></div></div></div>`;
  $('#foot').classList.add('hidden');
  const msgs = $('#msgs'), ta = $('#ta'), snd = $('#snd');
  if (!S.chat.length) drawEmpty(); else S.chat.forEach(m => msgs.appendChild(m.role === 'u' ? userBubble(m.text) : asstStatic(m)));
  ta.oninput = () => { snd.disabled = !ta.value.trim() || CHATBUSY; ta.style.height = 'auto'; ta.style.height = Math.min(180, ta.scrollHeight) + 'px'; };
  ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (ta.value.trim() && !CHATBUSY) send(ta.value); } };
  snd.onclick = () => send(ta.value);
  $$('.ctx').forEach(b => b.onclick = () => send(b.dataset.q));
  $('#clr').onclick = () => { S.chat = []; save(); pageMentor(); };
  window.scrollTo(0, document.body.scrollHeight); ta.focus();
  if (PENDING) { const q = PENDING; PENDING = null; setTimeout(() => send(q), 350); }
}
let PENDING = null;
function drawEmpty() {
  const msgs = $('#msgs'), P = S.profile;
  msgs.innerHTML = `<div class="empty fade-in"><div class="empty-orb" id="eorb"></div><span class="eyebrow">${tr('Ментор знает твою программу и пробелы', 'Тәлімгер бағдарламаң мен олқылықтарыңды біледі', 'Mentor knows your programme and your gaps')}</span><h1 class="h-page" style="margin-top:12px">${esc(P.name)}, ${tr('с чем разберёмся?', 'немен айналысамыз?', 'what shall we work on?')}</h1><p class="muted">${tr('Объяснения, задачи и план — с учётом твоей диагностики.', 'Түсіндірмелер, есептер және жоспар — диагностикаңды ескере отырып.', 'Explanations, problems and plans — based on your diagnostic.')}</p><div class="sugg">${suggestions().map(s => `<button data-q="${esc(s[1])}"><span class="mono">${s[0]}</span>${esc(s[1])}</button>`).join('')}</div></div>`;
  $('#eorb').appendChild(glassOrb(77, { cls: 'tiny', inner: `<div class="orb-logo">${LOGO}</div>` }));
  $$('.sugg button', msgs).forEach(b => b.onclick = () => send(b.dataset.q));
}
const userBubble = text => el(`<div class="msg-u fade-in">${esc(text)}</div>`);
const asstShell = () => el(`<div class="msg-a fade-in"><div class="ava" style="color:var(--parch)">${LOGO}</div><div class="body"><div class="tk"></div><div class="md out"></div><div class="msg-tools"><button data-c>${tr('Копировать', 'Көшіру', 'Copy')}</button><button data-r>${tr('Ещё проще', 'Одан да қарапайым', 'Even simpler')}</button></div></div></div>`);
function asstStatic(m) { const n = asstShell(); n.querySelector('.tk').innerHTML = thinkStatic(m.steps, m.secs); n.querySelector('.out').innerHTML = md(m.md); n.querySelector('.msg-tools').classList.add('show'); wireTools(n, m); return n; }
function wireTools(n, m) {
  n.querySelector('[data-c]').onclick = () => { try { navigator.clipboard.writeText(m.md).then(() => toast('✓'), () => toast('—')); } catch (e) { } };
  n.querySelector('[data-r]').onclick = () => { const t = m.topic ? TOPIC[m.topic] : firstPlanTopic(); send(tr('Объясни ещё проще: ', 'Одан да қарапайым түсіндір: ', 'Explain even more simply: ') + tn(t.id).toLowerCase(), { simpler: t }); };
}
async function send(text, opt = {}) {
  text = text.trim(); if (!text || CHATBUSY) return;
  const tok = RUN, msgs = $('#msgs'), ta = $('#ta');
  CHATBUSY = true; ta.value = ''; ta.style.height = 'auto'; $('#snd').disabled = true;
  if (!S.chat.length) msgs.innerHTML = '';
  msgs.appendChild(userBubble(text)); S.chat.push({ role: 'u', text });
  let rep = mentorReply(text);
  if (opt.simpler) { const t = opt.simpler, T0 = TL(t); rep = { steps: [[tr('Упрощаю объяснение', 'Түсіндірмені жеңілдетемін', 'Simplifying the explanation'), `${Q(T0.n)} · ${tr('только суть и аналогия', 'тек мәні мен ұқсастық', 'just the core idea and an analogy')}`], [tr('Убираю термины', 'Терминдерді алып тастаймын', 'Removing jargon'), tr('максимум 4 предложения', 'ең көбі 4 сөйлем', '4 sentences max')]], md: `${tr('Совсем коротко.', 'Өте қысқаша.', 'Very briefly.')}\n\n${T0.an}\n\n${tr('То же самое на языке предмета:', 'Пән тілімен дәл осы:', 'The same in subject terms:')} ${T0.s}\n\n${tr('Главное не перепутать:', 'Ең бастысы — шатастырмау:', "The main thing not to mix up:")} ${T0.pf}`, topic: t.id }; }
  const n = asstShell(); msgs.appendChild(n);
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  const th = Think(n.querySelector('.tk'), tr('Размышляю', 'Ойланып жатырмын', 'Thinking'), tok);
  for (const [a, b] of rep.steps) { await th.step(a, b, 260); if (tok !== RUN) { CHATBUSY = false; return; } }
  const secs = th.finish();
  const follow = every(() => { if (window.innerHeight + window.scrollY > document.body.scrollHeight - 260) window.scrollTo(0, document.body.scrollHeight); }, 250);
  await stream(n.querySelector('.out'), rep.md, tok, 1.3);
  clearInterval(follow); CHATBUSY = false;
  if (tok !== RUN) return;
  const m = { role: 'a', steps: rep.steps, secs, md: rep.md, topic: rep.topic };
  S.chat.push(m); save();
  n.querySelector('.msg-tools').classList.add('show'); wireTools(n, m);
  $('#snd').disabled = !ta.value.trim();
}

/* ================= router ================= */
const ROUTES = { home: pageHome, start: pageStart, test: pageTest, analysis: pageAnalysis, dashboard: pageDashboard, plan: pagePlan, mentor: pageMentor };
function route(keepScroll) {
  RUN++; killAll(); CHATBUSY = false;
  $('#foot').classList.remove('hidden'); renderFooter();
  const h = location.hash.slice(1) || 'home';
  if (h !== 'plan') PLANSEL = null;
  const y = window.scrollY;
  if (h.startsWith('lesson-')) pageLesson(h.slice(7)); else (ROUTES[h] || pageHome)();
  window.scrollTo(0, keepScroll === true ? y : 0);
}
window.addEventListener('hashchange', () => route());
route();
})();
