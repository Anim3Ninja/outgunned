(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let site = { title: 'The Case Office', year: '', books: [] };
  let chars = [];
  let cur = 0;
  let tab = 'backstory';

  const CLIP = `<svg class="clip" viewBox="0 0 40 96" xmlns="http://www.w3.org/2000/svg"><path d="M13 66V22a8 8 0 0 1 16 0v50a13 13 0 0 1-26 0V30" fill="none" stroke="#7d8890" stroke-width="3.4" stroke-linecap="round"/><path d="M13 66V22a8 8 0 0 1 16 0v50a13 13 0 0 1-26 0V30" fill="none" stroke="#dfe6ea" stroke-width="1.3" stroke-linecap="round"/></svg>`;

  /* ================= helpers ================= */
  async function fetchText(u) {
    if (!u) return null;
    try {
      const r = await fetch(u, { cache: 'no-cache' });
      if (!r.ok) return null;
      const t = await r.text();
      if (/^\s*<(!doctype|html)/i.test(t)) return null;
      return t.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    } catch { return null; }
  }
  const isPdf = (p) => /\.pdf($|[?#])/i.test(p || '');

  /* ================= sound ================= */
  let ac = null, soundOn = false;
  try { soundOn = localStorage.getItem('caseOfficeSound') === '1'; } catch {}
  function paintSound() {
    const b = $('#soundBtn');
    b.setAttribute('aria-pressed', soundOn);
    b.setAttribute('aria-label', soundOn ? 'Typewriter sound on' : 'Typewriter sound off');
    $('span', b).textContent = soundOn ? 'sound on' : 'sound off';
  }
  function tick(big) {
    if (!soundOn) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const len = Math.floor(ac.sampleRate * (big ? 0.07 : 0.028));
      const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const s = ac.createBufferSource(); s.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = (big ? 900 : 1700) + Math.random() * 900;
      const g = ac.createGain(); g.gain.value = big ? 0.35 : 0.22;
      s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
    } catch {}
  }
  $('#soundBtn').addEventListener('click', () => {
    soundOn = !soundOn; paintSound();
    try { localStorage.setItem('caseOfficeSound', soundOn ? '1' : '0'); } catch {}
    if (soundOn) tick(true);
  });
  paintSound();

  /* ================= scene decoration ================= */
  function buildScene() {
    // venetian blind
    let slats = '';
    for (let y = 14; y < 118; y += 11) slats += `<rect x="14" y="${y}" width="332" height="9" fill="url(#slat)"/>`;
    slats += `<rect x="14" y="118" width="332" height="7" fill="#b9a67a"/><path d="M300 125 V190" stroke="#d8c9a0" stroke-width="2"/><circle cx="300" cy="194" r="5" fill="#c9a34a"/>`;
    $('#blind').innerHTML = slats;

    // clock
    let t = '';
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 * Math.PI) / 180, r1 = i % 3 === 0 ? 52 : 58, r2 = 63;
      t += `<line x1="${80 + Math.sin(a) * r1}" y1="${80 - Math.cos(a) * r1}" x2="${80 + Math.sin(a) * r2}" y2="${80 - Math.cos(a) * r2}" stroke-width="${i % 3 === 0 ? 3 : 1.6}"/>`;
    }
    $('#ticks').innerHTML = t;
    const hh = $('#hHand'), mm = $('#mHand'), ss = $('#sHand');
    const run = () => {
      const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
      hh.setAttribute('transform', `rotate(${h * 30} 80 80)`);
      mm.setAttribute('transform', `rotate(${m * 6} 80 80)`);
      ss.setAttribute('transform', `rotate(${s * 6} 80 80)`);
    };
    run(); setInterval(run, 1000);

    // dust motes in the lamp light
    for (const dust of [$('#dust'), $('#dust2')]) for (let i = 0; i < 22; i++) {
      const p = el('i');
      p.style.left = Math.random() * 100 + '%'; p.style.top = 20 + Math.random() * 80 + '%';
      p.style.setProperty('--t', 8 + Math.random() * 10 + 's');
      p.style.setProperty('--x', (Math.random() * 70 - 20) + 'px');
      p.style.setProperty('--y', -(30 + Math.random() * 110) + 'px');
      p.style.animationDelay = -Math.random() * 12 + 's';
      dust.appendChild(p);
    }

    // typewriter
    $('#typeSvg').innerHTML = typewriterSVG();
  }

  function typewriterSVG() {
    const rows = [['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['Z','X','C','V','B','N','M']];
    const ys = [322, 350, 378], x0 = [107, 124, 158], step = 34;
    let keys = '';
    rows.forEach((r, ri) => r.forEach((ch, i) => {
      const cx = x0[ri] + i * step, cy = ys[ri];
      keys += `<g><circle cx="${cx}" cy="${cy + 2}" r="14" fill="rgba(0,0,0,.5)"/><circle cx="${cx}" cy="${cy}" r="14" fill="#101010" stroke="#c7ccd0" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="10" fill="#ebe2c8"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" font-family="Special Elite,monospace" font-size="11" fill="#222">${ch}</text></g>`;
    }));
    return `<svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg">
<defs>
 <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34453c"/><stop offset=".5" stop-color="#1f2b25"/><stop offset="1" stop-color="#0f1612"/></linearGradient>
 <linearGradient id="rubber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a4a"/><stop offset=".4" stop-color="#171717"/><stop offset="1" stop-color="#050505"/></linearGradient>
 <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f6f7"/><stop offset=".5" stop-color="#9aa2a8"/><stop offset="1" stop-color="#d9dee1"/></linearGradient>
</defs>
<ellipse cx="260" cy="410" rx="240" ry="12" fill="rgba(0,0,0,.5)"/>
<g class="sheet">
 <g transform="rotate(-1.2 260 90)">
  <rect x="148" y="-14" width="224" height="196" fill="#f1e8cb"/>
  <rect x="148" y="-14" width="224" height="196" fill="url(#tb)" opacity=".05"/>
  <text x="260" y="22" text-anchor="middle" font-family="Special Elite,monospace" font-size="15" fill="#2a241c">NOTICE BOARD</text>
  <path d="M170 30 H350" stroke="#2a241c" stroke-width="1.4"/>
  <g stroke="#3b342a" stroke-width="3" opacity=".55" stroke-linecap="round"><path d="M168 52 H336"/><path d="M168 70 H318"/><path d="M168 88 H344"/><path d="M168 106 H300"/><path d="M168 124 H338"/><path d="M168 142 H284"/></g>
 </g>
</g>
<path d="M60 236 L460 236 L494 396 Q496 414 474 414 L46 414 Q24 414 26 396 Z" fill="url(#tb)"/>
<path d="M60 236 L460 236" stroke="url(#chrome)" stroke-width="5"/>
<path d="M44 306 L476 306" stroke="rgba(255,255,255,.14)" stroke-width="2"/>
<ellipse cx="150" cy="238" rx="38" ry="12" fill="#151515" stroke="url(#chrome)" stroke-width="3"/>
<ellipse cx="370" cy="238" rx="38" ry="12" fill="#151515" stroke="url(#chrome)" stroke-width="3"/>
<rect x="40" y="196" width="440" height="28" rx="14" fill="#111"/>
<rect x="40" y="196" width="440" height="9" rx="4.5" fill="rgba(255,255,255,.18)"/>
<rect x="64" y="166" width="392" height="34" rx="17" fill="url(#rubber)"/>
<rect x="76" y="170" width="368" height="5" rx="2.5" fill="rgba(255,255,255,.2)"/>
<circle cx="36" cy="183" r="17" fill="url(#chrome)"/><circle cx="36" cy="183" r="9" fill="#222"/>
<circle cx="484" cy="183" r="17" fill="url(#chrome)"/><circle cx="484" cy="183" r="9" fill="#222"/>
<path d="M54 172 L16 150" stroke="url(#chrome)" stroke-width="5" stroke-linecap="round"/><circle cx="14" cy="149" r="6" fill="#111"/>
<rect x="206" y="252" width="108" height="30" rx="3" fill="#c9a34a"/><rect x="209" y="255" width="102" height="24" rx="2" fill="none" stroke="#7a5a22"/>
<text x="260" y="272" text-anchor="middle" font-family="Playfair Display,serif" font-weight="700" font-size="13" letter-spacing="3" fill="#3a2a0c">No. 7</text>
${keys}
<rect x="170" y="396" width="180" height="14" rx="7" fill="#101010" stroke="url(#chrome)" stroke-width="3"/>
</svg>`;
  }


  /* ================= lay props flat on the desk (perspective) ================= */
  function homog(w, h, q) { // maps the rectangle (0,0),(w,0),(w,h),(0,h) onto quad q
    const src = [[0, 0], [w, 0], [w, h], [0, h]], A = [], B = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [X, Y] = q[i];
      A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]); B.push(X);
      A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]); B.push(Y);
    }
    const n = 8;
    for (let i = 0; i < n; i++) {
      let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]]; [B[i], B[p]] = [B[p], B[i]];
      for (let r = i + 1; r < n; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < n; c++) A[r][c] -= f * A[i][c]; B[r] -= f * B[i]; }
    }
    const k = new Array(n);
    for (let i = n - 1; i >= 0; i--) { let s = B[i]; for (let c = i + 1; c < n; c++) s -= A[i][c] * k[c]; k[i] = s / A[i][i]; }
    return `matrix3d(${k[0]},${k[3]},0,${k[6]},${k[1]},${k[4]},0,${k[7]},0,0,1,0,${k[2]},${k[5]},0,1)`;
  }
  // corners (stage units 1600x900) of the desk plane where each prop lies: top-left, top-right, bottom-right, bottom-left
  const FOLDER_QUAD = [[384, 578], [704, 512], [836, 584], [440, 690]];
  const LETTER_QUAD = [[440, 700], [648, 656], [758, 736], [534, 792]];

  /* ================= stage fit + parallax ================= */
  const stage = $('#stage'), viewport = $('#viewport');
  function fit() {
    const vw = innerWidth, vh = innerHeight;
    const tall = vw / vh < 0.9;
    const W = tall ? 900 : 1600;
    stage.dataset.mode = tall ? 'tall' : 'wide';
    stage.dataset.scene = tall ? 'office' : 'photo';
    const hint = $('#hint'); if (hint && !hint.classList.contains('gone')) hint.textContent = tall ? 'Click the typewriter, the letter, the files and the books.' : 'Click the newspaper, the letter, the files and the books.';
    if (tall) {
      const s = vw / W, vhh = Math.max(vh, Math.ceil(1620 * s));
      viewport.style.height = vhh + 'px';
      stage.style.width = W + 'px'; stage.style.height = Math.ceil(vhh / s) + 'px';
      stage.style.transformOrigin = 'top center'; stage.style.top = '0';
      stage.style.transform = `translateX(-50%) scale(${s})`;
    } else {
      const H = 900, s = Math.min(Math.max(vw / W, vh / H), vw / (0.84 * W));
      viewport.style.height = vh + 'px';
      stage.style.width = W + 'px'; stage.style.height = H + 'px';
      stage.style.transformOrigin = 'center'; stage.style.top = '50%';
      stage.style.transform = `translate(-50%,-50%) scale(${s})`;
    }
  }
  addEventListener('resize', fit); fit();

  if (!reduced && matchMedia('(pointer: fine)').matches) {
    let raf = 0;
    viewport.addEventListener('mousemove', (e) => {
      if (raf || stage.dataset.scene === 'photo' || document.body.classList.contains('viewing')) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        stage.style.setProperty('--mx', ((e.clientX / innerWidth - 0.5) * 2).toFixed(3));
        stage.style.setProperty('--my', ((e.clientY / innerHeight - 0.5) * 2).toFixed(3));
      });
    });
  }

  /* ================= floating views ================= */
  const floatEl = $('#float');
  const views = [];
  let hintHidden = false;

  function openView({ from, card, rot = -4, onClose, key }) {
    if (!hintHidden) { $('#hint').classList.add('gone'); hintHidden = true; }
    const wrap = el('div', 'float-wrap');
    wrap.appendChild(card);
    floatEl.hidden = false; floatEl.appendChild(wrap);
    document.body.classList.add('viewing');
    const view = { wrap, card, from, rot, onClose, key, opener: document.activeElement };
    views.push(view);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) closeTop(); });
    const x = $('.x', card);
    if (x) x.addEventListener('click', () => closeTop());
    requestAnimationFrame(() => {
      flyIn(view);
      const focusTarget = x || card; if (focusTarget.focus) focusTarget.focus({ preventScroll: true });
    });
    return view;
  }
  function deltas(view) {
    const f = view.card.getBoundingClientRect();
    const s = view.from ? view.from.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight + 40, width: f.width * .3, height: f.height * .3 };
    return {
      dx: s.left + s.width / 2 - (f.left + f.width / 2),
      dy: s.top + s.height / 2 - (f.top + f.height / 2),
      k: Math.max(0.1, Math.min(1, s.width / Math.max(1, f.width))),
    };
  }
  function flyIn(view) {
    if (reduced) return;
    const { dx, dy, k } = deltas(view), r = view.rot;
    view.wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
    view.card.animate([
      { transform: `translate(${dx}px,${dy}px) scale(${k}) rotate(${r}deg)`, opacity: 0.1, offset: 0 },
      { opacity: 1, offset: 0.18 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 80}px) scale(${(1 + k) / 2.3}) rotate(${r / 2}deg)`, offset: 0.5 },
      { transform: 'none', opacity: 1, offset: 1 },
    ], { duration: 720, easing: 'cubic-bezier(.22,.78,.24,1)' });
  }
  function closeTop() {
    const view = views.pop();
    if (!view) return;
    const done = () => {
      view.wrap.remove();
      if (view.onClose) view.onClose();
      if (!views.length) {
        floatEl.hidden = true; document.body.classList.remove('viewing');
        if (view.opener && view.opener.focus) view.opener.focus({ preventScroll: true });
      }
    };
    if (reduced) return done();
    const { dx, dy, k } = deltas(view), r = view.rot;
    view.wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards', easing: 'ease-in' });
    const a = view.card.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(${k}) rotate(${r}deg)`, opacity: 0.1 },
    ], { duration: 460, fill: 'forwards', easing: 'cubic-bezier(.5,0,.75,.4)' });
    a.onfinish = done;
  }
  document.addEventListener('keydown', (e) => {
    if (!views.length) return;
    const top = views[views.length - 1];
    if (e.key === 'Escape') { closeTop(); return; }
    if (top && top.key === 'dossier' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('iframe')) go(e.key === 'ArrowRight' ? 1 : -1);
  });

  /* ================= typed text engine ================= */
  const typedSeen = new Set();
  let activeTyping = null;
  // Turns the author's plain/markdown text into typed segments. Margin notes and
  // "> quoted" annotations become handwritten segments; everything else is typed.
  function toSegments(raw) {
    const lines = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n').map((l) =>
      l.replace(/\*\*/g, '').replace(/☑/g, '[X]').replace(/◩/g, '[~]').replace(/☐/g, '[ ]')
        .replace(/^(Candidate|Age and nationality|Present occupation|Proposed appointment)[\s ]+(?!:)/, '$1:  ')
        .replace(/[ \t]+$/, ''));
    const segs = []; let pend = false;
    const push = (hand, t) => { const last = segs[segs.length - 1]; if (last && last.hand === hand) last.lines.push(t); else segs.push({ hand, lines: [t] }); };
    const unwrap = (t) => t.replace(/^\s*[\[*]+\s*/, '').replace(/\s*[\]*]+\s*$/, '');
    lines.forEach((l) => {
      if (/^[\s*\[]*handwritten\b[^\n]*$/i.test(l) && l.trim().length < 48) { pend = true; return; }
      if (pend && l.trim()) { pend = false; push(true, unwrap(l)); return; }
      const q = l.match(/^>\s?(.*)$/);
      if (q) { push(true, q[1]); return; }
      const m = l.match(/^#+\s+(.*)$/);
      if (m) { push(false, m[1].toUpperCase()); push(false, '='.repeat(Math.min(m[1].length, 42))); return; }
      if (pend) return;
      push(false, l);
    });
    return segs.map((g) => ({ hand: g.hand, text: g.lines.join('\n').replace(/^\n+|\n+$/g, '') })).filter((g) => g.text);
  }
  function typeInto(host, raw, key) {
    if (activeTyping) activeTyping.stop();
    const segs = toSegments(raw);
    const box = el('div', 'typed'), cur = el('span', 'cur');
    let off = 0;
    segs.forEach((g) => {
      g.off = off; off += g.text.length;
      g.box = el('div', 'seg' + (g.hand ? ' hand' : ''));
      g.vis = el('span'); g.rest = el('span', 'rest'); g.rest.textContent = g.text;
      g.box.append(g.vis, g.rest); box.appendChild(g.box);
    });
    host.appendChild(box);
    const total = off;
    const paint = (n) => segs.forEach((g) => {
      const k = Math.max(0, Math.min(g.text.length, n - g.off));
      g.vis.textContent = g.text.slice(0, k); g.rest.textContent = g.text.slice(k);
      if (n > g.off && n <= g.off + g.text.length) g.vis.after(cur);
    });
    const allText = segs.map((g) => g.text).join('');
    let i = 0, raf = 0, last = performance.now(), acc = 0, over = false;
    const ctl = {
      stop() { over = true; cancelAnimationFrame(raf); box.removeEventListener('click', ctl.skip); document.removeEventListener('keydown', onKey); if (activeTyping === ctl) activeTyping = null; },
      skip() { if (over) return; paint(total + 1); box.classList.add('done'); typedSeen.add(key); ctl.stop(); },
    };
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ctl.skip(); } };
    paint(0); if (segs[0]) segs[0].vis.after(cur);
    if (typedSeen.has(key) || reduced) { ctl.skip(); return ctl; }
    activeTyping = ctl;
    box.addEventListener('click', ctl.skip); document.addEventListener('keydown', onKey);
    const handSpeed = (n) => { const g = segs.find((x) => n > x.off && n <= x.off + x.text.length); return g && g.hand ? 0.55 : 1; };
    const cps = Math.max(55, total / 16);
    (function step(now) {
      if (over) return;
      acc += ((now - last) * cps * handSpeed(i + 1)) / 1000; last = now;
      const n = Math.floor(acc);
      if (n > 0) {
        acc -= n;
        const nx = Math.min(total, i + n);
        paint(nx);
        const inHand = handSpeed(nx) < 1;
        if (allText[nx - 1] === '\n') { if (!inHand) tick(true); } else if (nx % 2 === 0 && allText[nx - 1] !== ' ') { if (!inHand) tick(false); }
        i = nx;
        if (cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
        if (i >= total) { ctl.skip(); return; }
      }
      raf = requestAnimationFrame(step);
    })(performance.now());
    return ctl;
  }

  /* ================= LETTER ================= */
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, '$1<i>$2</i>');
  function renderLetter(txt) {
    const blocks = txt.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((b) => b.trim().replace(/[ \t]+\n/g, '\n')).filter(Boolean);
    let head = '';
    if (/^\*\*[^*]+\*\*/.test(blocks[0] || '') && !/[a-z]/.test((blocks[0].match(/^\*\*([^*]+)\*\*/) || [, ''])[1])) {
      const [l1, ...rest] = blocks.shift().split('\n');
      head = `<div class="lh"><b>${esc(l1.replace(/\*\*/g, ''))}</b>${rest.length ? `<i>${esc(rest.join(' ').replace(/\*/g, ''))}</i>` : ''}</div>`;
    }
    const body = blocks.map((b, k) => {
      if (b.startsWith('# ')) return `<h2>${esc(b.slice(2))}</h2>`;
      if (b.startsWith('>')) return `<p class="r">${inline(b.replace(/^>\s?/gm, '')).replace(/\n/g, '<br>')}</p>`;
      const sig = b.match(/^\*([^*\n]+)\*$/);
      if (sig && blocks[k + 1] && blocks[k + 1].startsWith(sig[1])) return `<p class="sig">${esc(sig[1])}</p>`;
      return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
    }).join('');
    return { head, body };
  }
  async function openLetter() {
    const txt = (await fetchText(site.letter)) || '# Dear Friend,\n\nThe letter has not been written yet. Edit data/letter.txt.';
    const L = renderLetter(txt);
    const head = L.head || `<div class="head">${esc((site.title || '').toUpperCase())}</div>`;
    const card = el('div', 'card letter-card', `<button class="x" aria-label="Close the letter">×</button><article class="letter-paper">${head}${L.body}</article>`);
    const o = $('.o-letter'); o.classList.add('lifted');
    openView({ from: $('.env'), card, rot: -5, onClose: () => o.classList.remove('lifted') });
  }

  /* ================= NOTICE BOARD (typewriter) ================= */
  async function openNotice() {
    const txt = (await fetchText(site.messages)) || '# NOTICE BOARD\n\nNothing has been typed yet. Edit data/messages.txt.';
    const card = el('div', 'card notice-card', `<button class="x" aria-label="Close the notice">×</button><div class="sheet-paper"><div class="host"></div></div><span class="hint-skip">click or press space to skip the typing</span>`);
    const o = $('.o-type'); o.classList.add('lifted');
    const v = openView({ from: stage.dataset.scene === 'photo' ? $('#newsBtn') : $('#typeSvg .sheet'), card, rot: 3, onClose: () => { if (activeTyping) activeTyping.stop(); o.classList.remove('lifted'); } });
    setTimeout(() => { if (views.includes(v)) typeInto($('.host', card), txt, 'notice'); }, reduced ? 0 : 650);
  }

  /* ================= DOSSIERS ================= */
  function renderStack() {
    const n = chars.length, s = $('#stack'); if (!n) return;
    s.innerHTML = '';
    for (let k = Math.min(3, n - 1); k >= 0; k--) {
      const c = chars[(cur + k) % n];
      const f = el('span', `folder f${k}`);
      f.innerHTML = `<span class="ftab">${k === 0 ? 'Confidential' : esc(c.short || c.name)}</span>` +
        (k === 0 ? `<span class="photo"><img src="${esc(c.portrait)}" alt=""></span>${CLIP}<span class="slabel">${esc(c.name.toUpperCase())}</span>` : '');
      s.appendChild(f);
    }
    const c0 = chars[cur], ff = el('span', 'flat-folder');
    ff.innerHTML = `<span class="ff-under u2"></span><span class="ff-under u1"></span><span class="ff-top"><span class="ff-tab">CONFIDENTIAL</span><span class="ff-photo"><img src="${esc(c0.portrait)}" alt="">${CLIP}</span><span class="ff-label"><b>${esc(c0.name.toUpperCase())}</b><i>${esc(c0.role || '')}</i></span></span>`;
    ff.style.setProperty('--mf', homog(340, 250, FOLDER_QUAD));
    s.appendChild(ff);
    $('#stackBtn').setAttribute('aria-label', `Open the character files. Top file: ${chars[cur].name}`);
  }

  let fileCard = null, coverOpen = false, pageToken = 0;
  const TABS = [['backstory', 'Backstory'], ['assessment', 'Recruitment Assessment'], ['photos', 'Photographs'], ['docs', 'Documents'], ['sheet', 'Character Sheet']];

  function openDossier() {
    const card = el('div', 'card file-card');
    card.innerHTML = `<button class="x" aria-label="Close the file">×</button>
      <div class="file-in">
        <div class="file-head"><h3></h3><span></span><button class="linkbtn close-cover" style="margin-left:auto;font-family:var(--type);font-size:13px;background:none;border:0;text-decoration:underline;cursor:pointer;color:var(--red)">↩ close the file</button></div>
        <div class="tabs" role="tablist"></div><div class="pages"></div>
      </div>
      <div class="cover"><div class="face front"></div><div class="face back"><p style="position:absolute;left:0;right:0;top:46%;text-align:center;font-family:var(--type);letter-spacing:.3em;color:rgba(70,45,15,.5);font-size:13px">PROPERTY OF THE CASE OFFICE</p></div></div>
      <div class="chips" role="group" aria-label="Choose a file"></div>`;
    fileCard = card; coverOpen = false;
    const prev = el('button', 'nav prev', '‹'), next = el('button', 'nav next', '›');
    prev.setAttribute('aria-label', 'Previous file'); next.setAttribute('aria-label', 'Next file');
    prev.addEventListener('click', () => go(-1)); next.addEventListener('click', () => go(1));
    $('.close-cover', card).addEventListener('click', () => setCover(false));
    const stack = $('#stack'); stack.classList.add('lifted');
    const v = openView({
      from: $(stage.dataset.scene === 'photo' ? '#stack .flat-folder' : '#stack .f0'), card, rot: -3, key: 'dossier',
      onClose: () => { renderStack(); stack.classList.remove('lifted'); prev.remove(); next.remove(); fileCard = null; },
    });
    v.wrap.append(prev, next);
    renderFile();
  }

  function setCover(open) {
    coverOpen = open;
    if (!fileCard) return;
    $('.cover', fileCard).classList.toggle('open', open);
    $('.close-cover', fileCard).style.visibility = open ? 'visible' : 'hidden';
    if (!open && activeTyping) activeTyping.stop();
  }

  function renderFile() {
    const c = chars[cur], card = fileCard; if (!card) return;
    const num = String(c.number || cur + 1).padStart(2, '0');
    // cover
    $('.face.front', card).innerHTML = `
      <div class="cover-tab">CONFIDENTIAL</div>
      <figure class="cover-photo"><img src="${esc(c.portrait)}" alt="Portrait of ${esc(c.name)}">${CLIP}</figure>
      <div class="cover-label">
        <p class="no">FILE No. ${num} · ${esc(site.year || '')}</p>
        <h2>${esc(c.name)}</h2>
        <p class="role">${esc(c.role || 'Role to be assigned')}</p>
        <p class="blurb${c.blurb ? '' : ' blank'}">${esc(c.blurb || '[ Description to be filed. ]')}</p>
      </div>
      <div class="cover-stamp">CONFIDENTIAL</div>
      <button class="open-btn">Open the file</button>`;
    $('.open-btn', card).addEventListener('click', () => { setCover(true); tick(true); });
    // header
    $('.file-head h3', card).textContent = c.name;
    $('.file-head span', card).textContent = c.role || '';
    // tabs
    const tabs = $('.tabs', card); tabs.innerHTML = '';
    TABS.forEach(([id, label]) => {
      const b = el('button', id === tab ? 'on' : '', esc(label)); b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', id === tab);
      b.addEventListener('click', () => { tab = id; renderFile(); });
      tabs.appendChild(b);
    });
    // chips
    const chips = $('.chips', card); chips.innerHTML = '';
    chars.forEach((ch, i) => {
      const b = el('button', i === cur ? 'on' : '', String(i + 1)); b.title = ch.name; b.setAttribute('aria-label', ch.name);
      b.addEventListener('click', () => { if (i !== cur) go(i - cur, i); });
      chips.appendChild(b);
    });
    setCover(coverOpen);
    renderPage();
  }

  async function renderPage() {
    const c = chars[cur], host = $('.pages', fileCard), my = ++pageToken;
    if (activeTyping) activeTyping.stop();
    host.scrollTop = 0; host.innerHTML = '';
    const page = el('div', 'page'); host.appendChild(page);
    const empty = (h, m) => { page.innerHTML = `<p class="empty"><b>${h}</b><br>${m}</p>`; };

    if (tab === 'backstory' || tab === 'assessment') {
      const isB = tab === 'backstory';
      const txt = await fetchText(isB ? c.backstory : c.assessment);
      if (my !== pageToken) return;
      if (!txt) return empty('NOT YET FILED', `This part of ${esc(c.short || c.name)}’s file is still being typed up.`);
      const sheet = el('div', 'sheet-paper');
      sheet.innerHTML = `<div class="page-head"><span>${isB ? 'Personnel file — Background' : 'Recruitment assessment'}</span><span>Subject: ${esc(c.name)}</span></div><div class="stampmark">CONFIDENTIAL</div><div class="host"></div>`;
      page.appendChild(sheet);
      typeInto($('.host', sheet), txt, `${c.slug}:${tab}`);
    } else if (tab === 'photos' || tab === 'docs') {
      const items = tab === 'photos' ? c.photos : c.documents;
      if (!items || !items.length) return empty('NOTHING FILED', 'No items have been placed in this folder.');
      const g = el('div', 'gallery' + (tab === 'docs' ? ' docs' : ''));
      items.forEach((it) => {
        const f = el('figure'); f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', `View: ${it.title}`);
        f.innerHTML = `<div class="pic"><img loading="lazy" src="${esc(it.src)}" alt="${esc(it.title)}"></div><figcaption>${esc(it.title)}</figcaption>`;
        const open = () => lightbox(it, $('img', f), tab === 'docs');
        f.addEventListener('click', open); f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        g.appendChild(f);
      });
      page.appendChild(g);
    } else {
      if (!c.sheet) return empty('CHARACTER SHEET', 'To be issued.');
      const wrap = el('div', 'sheet-view');
      if (isPdf(c.sheet)) { wrap.innerHTML = `<iframe title="${esc(c.name)} character sheet" src="${esc(c.sheet)}"></iframe>`; page.style.padding = '0'; page.style.height = '100%'; wrap.style.height = '100%'; }
      else { wrap.innerHTML = `<img src="${esc(c.sheet)}" alt="Character sheet for ${esc(c.name)}" style="cursor:zoom-in">`; $('img', wrap).addEventListener('click', (e) => lightbox({ src: c.sheet, title: `${c.name} — Character Sheet` }, e.target, true)); }
      page.appendChild(wrap);
    }
  }

  function go(delta, absolute) {
    const n = chars.length; if (!fileCard || !n) return;
    cur = absolute != null ? absolute : (cur + delta + n) % n;
    renderFile();
    if (!reduced) fileCard.animate([{ opacity: 0, transform: `translateX(${delta > 0 ? 60 : -60}px) rotate(${delta > 0 ? 1.5 : -1.5}deg)` }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'ease-out' });
  }

  function lightbox(it, fromEl, isDoc) {
    const card = el('div', 'card lightbox' + (isDoc ? ' doc' : ''), `<button class="x" aria-label="Close the picture">×</button><img class="lb-img" src="${esc(it.src)}" alt="${esc(it.title)}"><p class="lb-cap">${esc(it.title)}</p>`);
    openView({ from: fromEl, card, rot: 2 });
  }

  /* ================= BOOKS ================= */
  function renderBooks() {
    const wrap = $('#books'); wrap.innerHTML = '';
    (site.books || []).forEach((bk) => {
      const b = el('button', 'book', `<span>${esc(bk.title)}${bk.subtitle ? `<small>${esc(bk.subtitle)}</small>` : ''}</span><i></i>`);
      b.style.setProperty('--bc', bk.color || '#444'); b.setAttribute('aria-label', `Open ${bk.title}`);
      b.addEventListener('click', () => openBook(bk, b));
      wrap.appendChild(b);
      wrap.appendChild(el('span', 'bk-label l' + wrap.querySelectorAll('.book').length, esc(bk.title)));
    });
    wrap.appendChild(el('span', 'books-tag', 'Rulebooks'));
  }
  async function openBook(bk, from) {
    const card = el('div', 'card pdf-card');
    card.innerHTML = `<button class="x" aria-label="Close the book">×</button><div class="pdf-head"><h2>${esc(bk.title)}</h2><a target="_blank" rel="noopener" href="${esc(bk.pdf)}">Open in new tab ↗</a><a download href="${esc(bk.pdf)}">Download</a></div><div class="pdf-body" style="flex:1;display:flex;min-height:0"></div><p class="pdf-note">If the book doesn’t show (some phones can’t display PDFs here), use “Open in new tab”.</p>`;
    const body = $('.pdf-body', card);
    let ok = true;
    try { const r = await fetch(bk.pdf, { method: 'HEAD' }); ok = r.ok; } catch { ok = true; }
    if (ok) body.innerHTML = `<iframe title="${esc(bk.title)}" src="${esc(bk.pdf)}" style="flex:1"></iframe>`;
    else body.innerHTML = `<p class="empty"><b>NOT YET SHELVED</b><br>This book hasn’t been added to the office yet.</p>`;
    openView({ from, card, rot: 3 });
  }

  /* ================= boot ================= */
  $('#letterBtn').addEventListener('click', openLetter);
  $('#typeBtn').addEventListener('click', openNotice);
  $('#newsBtn').addEventListener('click', openNotice);
  $('.env').style.setProperty('--me', homog(300, 190, LETTER_QUAD));
  $('#stackBtn').addEventListener('click', () => { if (chars.length) openDossier(); });
  buildScene();

  Promise.all([
    fetch('data/site.json').then((r) => r.json()).catch(() => ({})),
    fetch('data/characters.json').then((r) => r.json()).catch(() => ({ characters: [] })),
  ]).then(([s, d]) => {
    site = Object.assign(site, s); chars = d.characters || [];
    $('#plateTitle').textContent = (site.title || 'The Case Office').toUpperCase();
    $('#plateYear').textContent = site.year || '';
    document.title = `${site.title} — Outgunned Adventure`;
    renderStack(); renderBooks();
  }).catch((e) => { console.error(e); $('#hint').textContent = 'Could not load the data files. If testing locally, serve the folder (python -m http.server) rather than opening index.html directly.'; });
})();
