'use strict';
/* ============ 分頁 7：挑戰區 ============ */

const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const mixHex = (a, b, t) => {
  const p = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const A = p(a), B = p(b);
  return rgb(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
};

/* ---------- 7.1 慢慢變的畫（變化盲視） ---------- */
const CHANGES = [
  { name: '左邊房子的屋頂變色', box: [45, 120, 185, 185], apply: (s, t) => { s.roof1 = mixHex('#d64545', '#3f6fd6', t); } },
  { name: '左邊房子右邊的窗戶不見了', box: [126, 192, 168, 230], apply: (s, t) => { s.win1 = 1 - t; } },
  { name: '右邊的樹變成秋天的顏色', box: [470, 165, 552, 262], apply: (s, t) => { s.tree2 = mixHex('#2f8f4a', '#e08a1e', t); } },
  { name: '中間的雲消失了', box: [250, 22, 362, 82], apply: (s, t) => { s.cloud2 = 1 - t; } },
  { name: '汽車從紅色變綠色', box: [240, 276, 346, 338], apply: (s, t) => { s.car = mixHex('#e53935', '#2e9d4b', t); } },
  { name: '風箏往左飄走了', box: [318, 70, 432, 140], apply: (s, t) => { s.kiteX = lerp(410, 345, t); } },
  { name: '一隻小鳥不見了', box: [205, 84, 247, 116], apply: (s, t) => { s.bird2 = 1 - t; } },
  { name: '花從粉紅色變黃色', box: [14, 286, 122, 332], apply: (s, t) => { s.flower = mixHex('#ff6fae', '#ffd400', t); } },
  { name: '右邊房子多了一扇門', box: [390, 214, 432, 264], apply: (s, t) => { s.door2 = t; } },
  { name: '太陽變小了', box: [438, 18, 522, 102], apply: (s, t) => { s.sun = lerp(28, 17, t); } }
];
const Change = {
  cv: null, task: null, plan: [], round: 0, running: false, elapsed: 0, cur: null, t: 0,
  results: [], misses: [], highlight: null, compareT: null,
  init() {
    this.cv = setupCanvas('change-cv', 560, 360);
    this.task = Anim.add('game', dt => this.tick(dt), false);
    this.cv.c.addEventListener('pointerdown', e => this.click(pointerPos(this.cv, e)));
    $('#change-start').addEventListener('click', () => this.startRound());
    $('#change-compare').addEventListener('click', () => {
      this.compareT = this.compareT === 0 ? 1 : 0;
      $('#change-note').textContent = this.compareT === 0 ? '👈 這是一開始的樣子（再按一次看結束時）' : '👉 這是 15 秒後的樣子（再按一次看一開始）';
      this.draw();
    });
    this.draw();
  },
  startRound() {
    if (this.round === 0 || this.round >= 3) { this.plan = shuffle(CHANGES).slice(0, 3); this.round = 0; this.results = []; }
    this.cur = this.plan[this.round];
    this.round++;
    this.elapsed = 0; this.t = 0; this.misses = []; this.highlight = null; this.compareT = null;
    this.running = true; this.task.running = true;
    $('#change-start').disabled = true;
    $('#change-compare').disabled = true;
    $('#change-note').innerHTML = `第 ${this.round} 回合進行中……有一樣東西正在<b>慢慢</b>改變，找到就點它！`;
    this.renderScore();
  },
  tick(dt) {
    if (!this.running) return;
    this.elapsed += dt;
    this.t = Math.min(1, this.elapsed / 15);
    this.misses = this.misses.filter(m => this.elapsed - m.at < 0.8);
    if (this.elapsed > 25) this.finish(false);
    this.draw();
  },
  click(p) {
    if (!this.running) return;
    const [x0, y0, x1, y1] = this.cur.box, pad = 10;
    if (p.x >= x0 - pad && p.x <= x1 + pad && p.y >= y0 - pad && p.y <= y1 + pad) this.finish(true);
    else { this.misses.push({ x: p.x, y: p.y, at: this.elapsed }); this.draw(); }
  },
  finish(found) {
    this.running = false; this.task.running = false;
    this.t = 1; this.highlight = found ? '#2e9d4b' : '#e53935';
    this.results.push({ name: this.cur.name, found, time: this.elapsed });
    $('#change-note').innerHTML = found
      ? `🎉 找到了！是「${this.cur.name}」，你花了 ${this.elapsed.toFixed(1)} 秒。`
      : `⏰ 時間到！答案是「${this.cur.name}」。很多人都完全沒發現！`;
    const startBtn = $('#change-start');
    startBtn.disabled = false;
    startBtn.textContent = this.round >= 3 ? '🔁 再玩一次（換新題目）' : `▶ 開始第 ${this.round + 1} 回合`;
    $('#change-compare').disabled = false;
    this.renderScore();
    if (this.round >= 3) {
      $('#change-why').hidden = false;
      awardStamp('change', this.results.some(r => !r.found));
    }
    this.draw();
  },
  renderScore() {
    const n = this.results.filter(r => r.found).length;
    $('#change-score').innerHTML = this.results.map((r, i) =>
      `<div class="round"><span>第 ${i + 1} 回合：${r.name}</span><span>${r.found ? '✅ ' + r.time.toFixed(1) + ' 秒' : '❌ 沒發現'}</span></div>`
    ).join('') + (this.results.length ? `<p>目前找到 ${n} / ${this.results.length} 個</p>` : '');
  },
  draw() {
    const s = { roof1: '#d64545', win1: 1, tree2: '#2f8f4a', cloud2: 1, car: '#e53935', kiteX: 410, bird2: 1, flower: '#ff6fae', door2: 0, sun: 28 };
    const t = this.compareT !== null ? this.compareT : this.t;
    if (this.cur) this.cur.apply(s, t);
    this.scene(s);
    const { ctx } = this.cv;
    if (this.highlight && this.compareT === null) {
      const [x0, y0, x1, y1] = this.cur.box;
      ctx.strokeStyle = this.highlight; ctx.lineWidth = 4; ctx.setLineDash([8, 5]);
      ctx.beginPath(); ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 12, (y1 - y0) / 2 + 12, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    this.misses.forEach(m => { ctx.beginPath(); ctx.moveTo(m.x - 9, m.y - 9); ctx.lineTo(m.x + 9, m.y + 9); ctx.moveTo(m.x + 9, m.y - 9); ctx.lineTo(m.x - 9, m.y + 9); ctx.stroke(); });
  },
  scene(s) {
    const { ctx, w, h } = this.cv;
    const sky = ctx.createLinearGradient(0, 0, 0, 255);
    sky.addColorStop(0, '#8fcdf5'); sky.addColorStop(1, '#e6f5ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(480, 60, s.sun, 0, Math.PI * 2); ctx.fill();
    const cloud = (x, y, a) => {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.arc(x + 24, y - 8, 24, 0, Math.PI * 2); ctx.arc(x + 50, y, 20, 0, Math.PI * 2); ctx.fill();
    };
    cloud(95, 58, 1); cloud(275, 52, s.cloud2);
    const bird = (x, y, a) => {
      ctx.strokeStyle = `rgba(29,36,51,${a})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 10, y - 5); ctx.quadraticCurveTo(x - 4, y - 6, x, y); ctx.quadraticCurveTo(x + 4, y - 6, x + 10, y - 5); ctx.stroke();
    };
    bird(195, 112, 1); bird(226, 100, s.bird2);
    // 風箏
    ctx.strokeStyle = '#6b6457'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(s.kiteX, 122); ctx.quadraticCurveTo(s.kiteX + 30, 220, 455, 300); ctx.stroke();
    ctx.fillStyle = '#f2711c';
    ctx.beginPath(); ctx.moveTo(s.kiteX, 78); ctx.lineTo(s.kiteX + 18, 100); ctx.lineTo(s.kiteX, 122); ctx.lineTo(s.kiteX - 18, 100); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9b51e0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.kiteX, 122); ctx.quadraticCurveTo(s.kiteX - 10, 132, s.kiteX + 2, 140); ctx.stroke();
    // 草地
    ctx.fillStyle = '#8fd16b'; ctx.fillRect(0, 255, w, h - 255);
    ctx.fillStyle = '#d9c9a3'; ctx.beginPath(); ctx.moveTo(100, 360); ctx.lineTo(113, 260); ctx.lineTo(126, 260); ctx.lineTo(160, 360); ctx.fill();
    // 左邊房子
    ctx.fillStyle = '#f3d9a4'; ctx.fillRect(60, 180, 110, 80);
    ctx.fillStyle = s.roof1; ctx.beginPath(); ctx.moveTo(50, 182); ctx.lineTo(115, 125); ctx.lineTo(180, 182); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a5a3b'; ctx.fillRect(102, 220, 24, 40);
    ctx.fillStyle = '#9fd3f5'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.fillRect(70, 198, 24, 22); ctx.strokeRect(70, 198, 24, 22);
    ctx.globalAlpha = s.win1; ctx.fillRect(136, 198, 24, 22); ctx.strokeRect(136, 198, 24, 22); ctx.globalAlpha = 1;
    // 中間的樹
    ctx.fillStyle = '#7a5230'; ctx.fillRect(219, 212, 12, 48);
    ctx.fillStyle = '#3f9e52'; ctx.beginPath(); ctx.arc(225, 198, 32, 0, Math.PI * 2); ctx.fill();
    // 右邊房子
    ctx.fillStyle = '#c9d6e3'; ctx.fillRect(360, 190, 100, 70);
    ctx.fillStyle = '#8a5a3b'; ctx.beginPath(); ctx.moveTo(352, 192); ctx.lineTo(410, 145); ctx.lineTo(468, 192); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9fd3f5'; ctx.fillRect(370, 205, 20, 20); ctx.fillRect(432, 205, 20, 20);
    ctx.globalAlpha = s.door2; ctx.fillStyle = '#6b4226'; ctx.fillRect(400, 225, 22, 35); ctx.globalAlpha = 1;
    // 右邊的樹
    ctx.fillStyle = '#7a5230'; ctx.fillRect(504, 215, 12, 45);
    ctx.fillStyle = s.tree2; ctx.beginPath(); ctx.arc(510, 202, 34, 0, Math.PI * 2); ctx.fill();
    // 汽車
    ctx.fillStyle = s.car;
    ctx.beginPath(); ctx.moveTo(268, 300); ctx.lineTo(276, 284); ctx.lineTo(312, 284); ctx.lineTo(322, 300); ctx.fill();
    ctx.fillRect(250, 300, 86, 22);
    ctx.fillStyle = '#cfeaff'; ctx.fillRect(280, 288, 12, 11); ctx.fillRect(296, 288, 13, 11);
    ctx.fillStyle = '#1d2433';
    ctx.beginPath(); ctx.arc(268, 324, 9, 0, Math.PI * 2); ctx.arc(318, 324, 9, 0, Math.PI * 2); ctx.fill();
    // 花
    [[30, 305], [55, 316], [80, 305], [105, 316]].forEach(([x, y]) => {
      ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke();
      ctx.fillStyle = s.flower;
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }
};

/* ---------- 7.2 顏色打架（斯楚普） ---------- */
const STROOP_COLORS = { red: ['紅', '#e53935'], yellow: ['黃', '#e0a800'], green: ['綠', '#2e9d4b'], blue: ['藍', '#1e66d0'] };
const Stroop = {
  round: 0, items: [], idx: 0, t0: 0, errors: 0, times: [], active: false,
  init() {
    $('#stroop-start').addEventListener('click', () => this.start());
    $$('#stroop-btns button').forEach(b => b.addEventListener('click', () => this.answer(b.dataset.c)));
  },
  start() {
    if (this.round >= 2) { this.round = 0; this.times = []; }
    const keys = Object.keys(STROOP_COLORS);
    this.items = [];
    for (let i = 0; i < 10; i++) {
      const ink = keys[Math.floor(Math.random() * 4)];
      let word = ink;
      if (this.round === 1) { const others = keys.filter(k => k !== ink); word = others[Math.floor(Math.random() * 3)]; }
      this.items.push({ ink, word });
    }
    this.idx = 0; this.errors = 0; this.active = true;
    $('#stroop-start').disabled = true;
    this.t0 = performance.now();
    this.show();
  },
  show() {
    const it = this.items[this.idx];
    const el = $('#stroop-word');
    el.textContent = STROOP_COLORS[it.word][0];
    el.style.color = STROOP_COLORS[it.ink][1];
    $('#stroop-progress').textContent = `第 ${this.round + 1} 回合　${this.idx + 1} / 10`;
  },
  answer(c) {
    if (!this.active) return;
    if (c !== this.items[this.idx].ink) {
      this.errors++;
      const b = $('#stroop-btns');
      b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad');
    }
    this.idx++;
    if (this.idx < 10) { this.show(); return; }
    this.active = false;
    const sec = (performance.now() - this.t0) / 1000;
    this.times.push({ sec, errors: this.errors });
    this.round++;
    const word = $('#stroop-word');
    word.style.color = '#1d2433';
    const btn = $('#stroop-start');
    btn.disabled = false;
    if (this.round === 1) {
      word.textContent = '第 1 回合完成！';
      btn.textContent = '▶ 第 2 回合（字和顏色會打架！）';
    } else {
      word.textContent = '挑戰完成！';
      btn.textContent = '🔁 再玩一次';
      $('#stroop-why').hidden = false;
      awardStamp('stroop', this.times[1].sec > this.times[0].sec);
    }
    const [a, b] = this.times;
    let html = `<div class="round"><span>第 1 回合（字＝顏色）</span><span>${a.sec.toFixed(1)} 秒，錯 ${a.errors} 題</span></div>`;
    if (b) {
      const diff = b.sec - a.sec;
      html += `<div class="round"><span>第 2 回合（字≠顏色）</span><span>${b.sec.toFixed(1)} 秒，錯 ${b.errors} 題</span></div>`;
      html += `<p>🧠 大腦打架指數：第 2 回合${diff >= 0 ? `慢了 ${diff.toFixed(1)} 秒` : `反而快了 ${(-diff).toFixed(1)} 秒（你的自制力超強！）`}</p>`;
    }
    $('#stroop-score').innerHTML = html;
  }
};

/* ---------- 7.3 錯覺大會考 ---------- */
const QUIZ_BANK = [
  ['棋盤陰影錯覺中，為什麼 B 格看起來比 A 格亮？', ['螢幕上 B 真的比較亮', 'B 在影子裡，大腦自動幫它補亮', '眼睛的水晶體壞了'], 1, '大腦會「扣掉光線的影響」，影子裡的東西會被自動補亮。'],
  ['人眼的盲點在哪裡？', ['視神經離開眼球、沒有感光細胞的地方', '瞳孔的正中央', '水晶體的後面'], 0, '視神經盤沒有感光細胞，所以看不見。'],
  ['看到「上面亮、下面暗」的圓，大腦通常判斷它是？', ['凸起來的', '凹下去的', '平的'], 0, '大腦假設光從上面來，所以上面亮就是凸起。'],
  ['盯著藍綠色圖案很久再看白紙，殘像是什麼顏色？', ['藍綠色', '紅色', '黑色'], 1, '負責藍、綠的細胞累了，沒累的紅色細胞相對比較強。'],
  ['影片中車輪看起來倒轉，主要原因是？', ['攝影機每秒拍的張數是固定的', '車輪真的倒轉', '螢幕太暗'], 0, '拍到的輪輻位置剛好讓大腦配對錯。'],
  ['鐵軌錯覺中，上面的線看起來比較長，是因為大腦以為它？', ['比較近', '比較遠', '比較亮'], 1, '遠的東西看起來一樣長，大腦就判斷它實際上更長。'],
  ['兩隻眼睛為什麼能幫助我們判斷遠近？', ['兩眼看到的畫面有一點不同', '兩眼看到的畫面完全一樣', '一隻眼看顏色、一隻眼看形狀'], 0, '這叫雙眼視差，東西越近，差越多。'],
  ['起霧時開車容易低估車速，跟哪個錯覺的原理最像？', ['踏步方塊：對比越低，看起來越慢', '殘像蘋果', '奈克方塊'], 0, '對比低時，大腦判斷的速度會變慢。'],
  ['關於錯覺，下列哪個說法最正確？', ['會被錯覺騙，代表眼睛有問題', '錯覺是大腦平常很好用的規則，在特殊情況下被誤用', '只有小孩會被錯覺騙'], 1, '錯覺讓我們看到大腦的經驗規則，幾乎每個人都會被騙。'],
  ['赫曼方格的「側抑制」解釋後來被挑戰，是因為科學家發現？', ['把街道改成彎曲的，灰點幾乎消失', '灰點其實真的畫在圖上', '只有色盲的人看得到灰點'], 0, '新證據出現，科學解釋就要修正，這就是科學的本質。']
];
const Quiz = {
  qs: [], i: 0, score: 0,
  init() { $('#quiz-start').addEventListener('click', () => this.start()); },
  start() {
    this.qs = shuffle(QUIZ_BANK).map(([q, opts, ans, why]) => {
      const order = shuffle(opts.map((t, k) => ({ t, ok: k === ans })));
      return { q, order, why };
    });
    this.i = 0; this.score = 0;
    this.show();
  },
  show() {
    const box = $('#quiz-box'), cur = this.qs[this.i];
    box.innerHTML = `<p class="qnum">第 ${this.i + 1} / ${this.qs.length} 題　目前 ${this.score} 分</p>
      <p class="qtext">${cur.q}</p>
      <div class="opts">${cur.order.map((o, k) => `<button class="opt" data-k="${k}">${o.t}</button>`).join('')}</div>
      <div class="result" hidden></div>`;
    $$('.opt', box).forEach(b => b.addEventListener('click', () => {
      const o = cur.order[+b.dataset.k];
      if (o.ok) this.score++;
      $$('.opt', box).forEach((x, k) => { x.disabled = true; if (cur.order[k].ok) x.classList.add('right'); });
      b.classList.add('chosen');
      const res = $('.result', box);
      res.className = 'result ' + (o.ok ? 'ok' : 'fooled');
      res.innerHTML = `${o.ok ? '⭕ 答對了！' : '❌ 再想想！'}<p>${cur.why}</p>`;
      res.hidden = false;
      const next = document.createElement('button');
      next.className = 'btn btn-primary'; next.style.marginTop = '.6rem';
      next.textContent = this.i < this.qs.length - 1 ? '下一題 →' : '看成績 🏁';
      next.addEventListener('click', () => { this.i++; if (this.i < this.qs.length) this.show(); else this.end(); });
      res.appendChild(next);
    }));
  },
  end() {
    const s = this.score;
    const title = s === 10 ? '🏆 首席大腦偵探' : s >= 8 ? '🥇 錯覺破解專家' : s >= 5 ? '🔍 見習偵探' : '🌱 大腦新手';
    const tip = s === 10 ? '全部答對，太厲害了！' : s >= 5 ? '很不錯！回各分頁看看答錯的題目吧。' : '再回各分頁逛一逛，回來一定可以更高分！';
    $('#quiz-box').innerHTML = `<div class="quiz-final"><p>你答對了</p><p class="title">${s} / 10</p><p class="title">${title}</p><p>${tip}</p>
      <button class="btn btn-primary" id="quiz-again">🔁 再考一次</button></div>`;
    $('#quiz-again').addEventListener('click', () => this.start());
    awardStamp('quiz', s < 8);
  }
};

registerTab('game', {
  init() { Change.init(); Stroop.init(); Quiz.init(); }
});
