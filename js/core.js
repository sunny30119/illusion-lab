'use strict';
/* ============ 共用工具：畫布、分頁、印章、猜猜看、動畫 ============ */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rgb = (r, g, b) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;

/* ---------- 畫布：自動支援高解析螢幕 ---------- */
function setupCanvas(id, w, h) {
  const c = typeof id === 'string' ? document.getElementById(id) : id;
  c.width = Math.round(w * DPR);
  c.height = Math.round(h * DPR);
  c.style.width = w + 'px';
  const ctx = c.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  return { c, ctx, w, h };
}
function fillCanvas(cv, color) {
  cv.ctx.fillStyle = color;
  cv.ctx.fillRect(0, 0, cv.w, cv.h);
}
function pointerPos(cv, e) {
  const r = cv.c.getBoundingClientRect();
  return { x: (e.clientX - r.left) * cv.w / r.width, y: (e.clientY - r.top) * cv.h / r.height };
}
/* 滑鼠與手指都能用的拖曳 */
function onPointer(el, handler) {
  let down = false;
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', e => {
    down = true;
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* 舊瀏覽器 */ }
    handler(e, 'down');
  });
  el.addEventListener('pointermove', e => {
    if (down) handler(e, 'move');
    else if (e.pointerType === 'mouse') handler(e, 'hover');
  });
  const up = e => { if (down) { down = false; handler(e, 'up'); } };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
/* 小段補間動畫（用於「移過去比比看」） */
function tween(ms, fn, done) {
  if (REDUCED) { fn(1); if (done) done(); return; }
  const t0 = performance.now();
  const step = now => {
    const t = clamp((now - t0) / ms, 0, 1);
    fn(t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    if (t < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}

/* ---------- 錯覺清單（圖鑑與印章用） ---------- */
const TABS = [
  { id: 'space', name: '空間深度', emoji: '🧊' },
  { id: 'light', name: '明暗顏色', emoji: '🌗' },
  { id: 'size', name: '長度大小', emoji: '📏' },
  { id: 'motion', name: '動起來了', emoji: '🌀' },
  { id: 'eye', name: '眼睛的祕密', emoji: '👀' },
  { id: 'brain', name: '大腦愛腦補', emoji: '🧩' },
  { id: 'game', name: '挑戰區', emoji: '🎮' },
  { id: 'lab', name: '探究實驗', emoji: '🧪' }
];
const ILLUSIONS = [
  ['crater', 'space', '光影凹凸', '🌗'], ['mask', 'space', '空心面具', '🎭'], ['opart', 'space', '網格鼓起', '🕸️'],
  ['necker', 'space', '奈克方塊', '🧊'], ['chromo', 'space', '紅藍立體', '🔴'],
  ['checker', 'light', '棋盤陰影', '♟️'], ['dress', 'light', '洋裝之謎', '👗'], ['hermann', 'light', '幽靈灰點', '⬛'],
  ['after', 'light', '殘像蘋果', '🍎'],
  ['muller', 'size', '箭頭長短', '↔️'], ['ebbing', 'size', '圓圈大小', '🟠'], ['ponzo', 'size', '鐵軌透視', '🛤️'],
  ['cafe', 'size', '咖啡館牆', '🧱'],
  ['snakes', 'motion', '旋轉蛇', '🐍'], ['footstep', 'motion', '踏步方塊', '👣'], ['mae', 'motion', '螺旋後效', '🌀'],
  ['blind', 'eye', '盲點', '🙈'], ['stereo', 'eye', '雙眼視差', '✌️'], ['wheel', 'eye', '車輪倒轉', '🎡'],
  ['moon', 'eye', '月亮錯覺', '🌕'],
  ['vase', 'brain', '花瓶與臉', '🏺'], ['kanizsa', 'brain', '隱形三角形', '🔺'], ['penrose', 'brain', '不可能三角', '♾️'],
  ['change', 'game', '慢慢變的畫', '🕵️'], ['stroop', 'game', '顏色打架', '🎨'], ['quiz', 'game', '錯覺大會考', '📝'],
  ['lab', 'lab', '箭頭角度實驗', '🧪']
].map(([id, tab, name, emoji]) => ({ id, tab, name, emoji }));

/* ---------- 進度存檔（只存在這台電腦的瀏覽器） ---------- */
const Store = {
  key: 'illusionLab.v3',
  data: { stamps: {}, big: false, best: {} },
  load() {
    try {
      const s = localStorage.getItem(this.key);
      if (s) this.data = Object.assign(this.data, JSON.parse(s));
    } catch (e) { /* 私密模式等情況，直接用預設值 */ }
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* 忽略 */ }
  }
};

/* ---------- 提示訊息 ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- 印章 ---------- */
function awardStamp(id, fooled) {
  const had = !!Store.data.stamps[id];
  Store.data.stamps[id] = { fooled: !!fooled, t: Date.now() };
  Store.save();
  updateProgress();
  if (!had) {
    const ill = ILLUSIONS.find(i => i.id === id);
    toast(`🏅 收集到印章：${ill ? ill.emoji + ' ' + ill.name : id}！`);
    const pill = $('.stamp-pill');
    pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
  }
}
function updateProgress() {
  const got = ILLUSIONS.filter(i => Store.data.stamps[i.id]).length;
  $('#stamp-count').textContent = got;
  $('#stamp-total').textContent = ILLUSIONS.length;
  $('#hero-total').textContent = ILLUSIONS.length;
  TABS.forEach(t => {
    const btn = $(`.tab-btn[data-tab="${t.id}"]`);
    if (!btn) return;
    const list = ILLUSIONS.filter(i => i.tab === t.id);
    const n = list.filter(i => Store.data.stamps[i.id]).length;
    let badge = btn.querySelector('.badge');
    if (!badge) { badge = document.createElement('span'); badge.className = 'badge'; btn.appendChild(badge); }
    badge.textContent = `${n}/${list.length}`;
    btn.classList.toggle('done', n === list.length);
  });
  renderDex();
}
function renderDex() {
  const dex = $('#dex');
  if (!dex) return;
  dex.innerHTML = TABS.map(t => {
    const items = ILLUSIONS.filter(i => i.tab === t.id).map(i => {
      const s = Store.data.stamps[i.id];
      const stamp = s ? `<span class="stamp ${s.fooled ? '' : 'ok'}">${s.fooled ? '被騙了' : '過關'}</span>` : '';
      return `<button class="dex-item ${s ? 'got' : ''}" data-jump="${i.id}" data-tab="${i.tab}"><span class="em">${i.emoji}</span><span class="nm">${i.name}</span>${stamp}</button>`;
    }).join('');
    return `<div class="dex-group"><h4>${t.emoji} ${t.name}</h4><div class="dex-grid">${items}</div></div>`;
  }).join('');
}

/* ---------- 猜猜看系統 ----------
   QUIZ[id] = { q, opts: [{ t, ok, msg }], any, truth }
   any：沒有標準答案（每個人看到的不同） */
const QUIZ = {};
function renderGuess(box) {
  const id = box.dataset.for;
  const q = QUIZ[id];
  if (!q) return;
  box.innerHTML = `<h4><span class="step">1</span>猜猜看</h4>
    <p class="q">${q.q}</p>
    <div class="opts">${q.opts.map((o, i) => `<button class="opt" data-i="${i}">${o.t}</button>`).join('')}</div>
    <div class="result" hidden></div>
    <button class="linkish skip" type="button">先不猜，直接動手 →</button>`;
  const card = box.closest('.ill');
  $$('.opt', box).forEach(btn => btn.addEventListener('click', () => {
    const o = q.opts[+btn.dataset.i];
    $$('.opt', box).forEach((b, i) => {
      b.disabled = true;
      if (!q.any && q.opts[i].ok) b.classList.add('right');
    });
    btn.classList.add('chosen');
    const res = $('.result', box);
    let cls, head;
    if (q.any) { cls = 'any'; head = '👍 收到！'; }
    else if (o.ok) { cls = 'ok'; head = '👏 答對了！你沒被騙。'; }
    else { cls = 'fooled'; head = '😵 你被騙了！'; }
    res.className = 'result ' + cls;
    res.innerHTML = `${head}<p>${o.msg || q.truth || ''}</p><button class="linkish retry" type="button">↺ 再猜一次</button>`;
    res.hidden = false;
    $('.retry', res).addEventListener('click', () => renderGuess(box));
    $('.skip', box).hidden = true;
    unlockCard(card);
    awardStamp(id, !q.any && !o.ok);
  }));
  $('.skip', box).addEventListener('click', () => unlockCard(card));
  if (Store.data.stamps[id]) unlockCard(card);
}
function unlockCard(card) {
  if (!card) return;
  $$('.locked', card).forEach(el => el.classList.remove('locked'));
  card.dispatchEvent(new CustomEvent('unlock'));
}
function isUnlocked(card) { return !$('.reveal.locked', card); }

/* ---------- 動畫管理：只播放目前分頁的動畫 ---------- */
const Anim = {
  tasks: [],
  paused: false,
  add(tab, fn, autostart = true) {
    const task = { tab, fn, running: autostart && !REDUCED };
    this.tasks.push(task);
    return task;
  }
};
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!Anim.paused) {
    for (const t of Anim.tasks) {
      if (t.running && t.tab === currentTab) {
        try { t.fn(dt, now / 1000); } catch (err) { console.error(err); t.running = false; }
      }
    }
  }
  requestAnimationFrame(frame);
}
/* 播放／暫停按鈕 */
function bindPlayButton(btn, task, labels = ['⏸ 暫停', '▶ 播放']) {
  const sync = () => { btn.textContent = task.running ? labels[0] : labels[1]; };
  btn.addEventListener('click', () => { task.running = !task.running; sync(); });
  sync();
  return sync;
}
/* 分段按鈕（seg） */
function bindSeg(el, fn) {
  $$('button', el).forEach(b => b.addEventListener('click', () => {
    $$('button', el).forEach(x => x.classList.toggle('on', x === b));
    fn(b.dataset.v);
  }));
}
function bindRange(el, out, fmt, fn) {
  const go = () => { const v = parseFloat(el.value); if (out) out.textContent = fmt(v); fn(v); };
  el.addEventListener('input', go);
  if (out) out.textContent = fmt(parseFloat(el.value));
}

/* ---------- 分頁切換 ---------- */
let currentTab = 'home';
const TabHooks = {};
const tabInited = {};
function registerTab(id, hooks) { TabHooks[id] = hooks; }
function switchTab(id, scrollTo) {
  if (!document.getElementById('tab-' + id)) id = 'home';
  currentTab = id;
  document.body.dataset.tab = id;
  $$('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + id; });
  $$('.tab-btn').forEach(b => {
    const on = b.dataset.tab === id;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
  const h = TabHooks[id];
  if (h) {
    if (!tabInited[id] && h.init) {
      tabInited[id] = true;
      try { h.init(); } catch (err) { console.error('分頁初始化失敗', id, err); }
    }
    if (h.show) { try { h.show(); } catch (err) { console.error(err); } }
  }
  try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// 可能不允許 */ }
  if (scrollTo) {
    const el = document.getElementById(scrollTo);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' }), 40);
  } else {
    window.scrollTo(0, 0);
  }
}

/* ---------- 啟動 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Store.load();
  if (Store.data.big) document.documentElement.classList.add('big');

  $$('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (go) { e.preventDefault(); switchTab(go.dataset.goto); return; }
    const jump = e.target.closest('[data-jump]');
    if (jump) switchTab(jump.dataset.tab, 'c-' + jump.dataset.jump);
  });

  $('#btn-big').addEventListener('click', () => {
    Store.data.big = document.documentElement.classList.toggle('big');
    Store.save();
  });
  const pauseBtn = $('#btn-pause');
  pauseBtn.addEventListener('click', () => {
    Anim.paused = !Anim.paused;
    pauseBtn.textContent = Anim.paused ? '▶ 恢復動畫' : '⏸ 暫停動畫';
    pauseBtn.classList.toggle('on', Anim.paused);
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('確定要清除所有印章和紀錄嗎？清除後無法復原。')) return;
    Store.data = { stamps: {}, big: Store.data.big, best: {} };
    Store.save();
    location.reload();
  });

  $$('.guess[data-for]').forEach(renderGuess);
  updateProgress();

  const start = (location.hash || '#home').slice(1);
  switchTab(start);
  window.addEventListener('hashchange', () => {
    const id = (location.hash || '#home').slice(1);
    if (id !== currentTab) switchTab(id);
  });
  requestAnimationFrame(frame);
});
