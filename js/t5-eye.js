'use strict';
/* ============ 分頁 5：眼睛的祕密 ============ */

QUIZ.blind = {
  q: '照著上面的步驟做，右邊的紅點會發生什麼事？',
  opts: [{ t: '在某個距離突然消失', ok: true }, { t: '變成兩個' }, { t: '一直看得到，沒變化' }],
  truth: '在某個距離，紅點會完全消失！那個位置剛好落在你右眼的盲點上。'
};
QUIZ.stereo = {
  q: '伸出一根手指放在眼前，輪流閉左眼、閉右眼，手指會怎樣？',
  opts: [{ t: '左右跳來跳去', ok: true }, { t: '完全不動' }, { t: '上下跳來跳去' }],
  truth: '手指會左右跳！因為兩隻眼睛站的位置不同，看到的畫面也不同。'
};
QUIZ.wheel = {
  q: '影片裡汽車開動時，輪子有時候看起來「倒著轉」，為什麼？',
  opts: [
    { t: '輪子真的在倒轉' },
    { t: '攝影機每秒只拍固定張數，拍到的位置讓大腦誤會了', ok: true },
    { t: '觀眾的眼睛太累了' }
  ],
  truth: '影片是一張張照片。拍到的輪輻位置剛好讓大腦配對錯，才看起來倒轉。'
};
QUIZ.moon = {
  q: '真實的天空中，剛升起的月亮（在地平線）和高掛的月亮，哪個比較大？',
  opts: [{ t: '地平線的月亮比較大' }, { t: '高掛的月亮比較大' }, { t: '幾乎一樣大', ok: true }],
  truth: '在天空中的大小幾乎一樣！地平線的月亮看起來特別大，是大腦造成的錯覺。'
};

/* ---------- 5.1 盲點 ---------- */
const Blind = {
  cv: null, mode: 'dot', dist: 400,
  init() {
    this.cv = setupCanvas('blind-cv', 640, 220);
    bindSeg($('#blind-mode'), v => { this.mode = v; this.draw(); });
    bindRange($('#blind-dist'), $('#blind-out'), v => v + ' px', v => { this.dist = v; this.draw(); });
    this.draw();
  },
  draw() {
    const { ctx, w } = this.cv;
    fillCanvas(this.cv, '#ffffff');
    const fx = 70, y = 110, tx = fx + this.dist;
    if (this.mode === 'stripe') {
      ctx.save();
      ctx.beginPath(); ctx.rect(tx - 110, 20, 220, 180); ctx.clip();
      for (let k = -30; k < 40; k++) {
        ctx.fillStyle = k % 2 === 0 ? '#2f80ed' : '#ffd84d';
        ctx.beginPath();
        const x0 = tx - 220 + k * 12;
        ctx.moveTo(x0, 20); ctx.lineTo(x0 + 12, 20); ctx.lineTo(x0 + 12 + 180, 200); ctx.lineTo(x0 + 180, 200); ctx.fill();
      }
      ctx.restore();
    }
    // ＋號
    ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(fx - 14, y); ctx.lineTo(fx + 14, y); ctx.moveTo(fx, y - 14); ctx.lineTo(fx, y + 14); ctx.stroke();
    if (this.mode === 'line') {
      ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 6; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(fx + 50, y); ctx.lineTo(tx - 22, y); ctx.moveTo(tx + 22, y); ctx.lineTo(w - 10, y); ctx.stroke();
    } else {
      ctx.fillStyle = '#e53935';
      ctx.beginPath(); ctx.arc(tx, y, 16, 0, Math.PI * 2); ctx.fill();
    }
  }
};

/* ---------- 5.2 雙眼視差 ---------- */
const Stereo = {
  cv: null, L: null, R: null, d: 110,
  init() {
    this.cv = setupCanvas('stereo-cv', 520, 300);
    this.L = setupCanvas('stereo-l', 240, 70);
    this.R = setupCanvas('stereo-r', 240, 70);
    const name = v => v < 70 ? '很近' : v > 180 ? '很遠' : '中間';
    bindRange($('#stereo-d'), $('#stereo-out'), name, v => { this.d = v; this.draw(); });
    this.draw();
  },
  hit(ex) { // 從眼睛穿過手指，打到牆上的位置
    const fx = 260, eyeY = 270, wallY = 30;
    return ex + (fx - ex) * (eyeY - wallY) / this.d;
  },
  draw() {
    const { ctx, w } = this.cv;
    fillCanvas(this.cv, '#f4f8ff');
    const eyeY = 270, wallY = 30, eL = 230, eR = 290, fx = 260, fy = eyeY - this.d;
    const colors = ['#e53935', '#f2711c', '#e0a800', '#2e9d4b', '#0f9d8f', '#2f80ed', '#5b5bd6', '#9b51e0', '#e04f6f', '#6b6457', '#1d2433', '#e53935', '#2e9d4b'];
    // 牆和記號
    ctx.fillStyle = '#d9d3c7'; ctx.fillRect(0, wallY - 12, w, 12);
    colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * 40 + 14, wallY - 12, 12, 12); });
    ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#5b6474'; ctx.textAlign = 'left';
    ctx.fillText('遠處的牆', 6, wallY + 16);
    // 視線
    const hl = this.hit(eL), hr = this.hit(eR);
    ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.strokeStyle = '#2f80ed'; ctx.beginPath(); ctx.moveTo(eL, eyeY); ctx.lineTo(hl, wallY); ctx.stroke();
    ctx.strokeStyle = '#f2711c'; ctx.beginPath(); ctx.moveTo(eR, eyeY); ctx.lineTo(hr, wallY); ctx.stroke();
    ctx.setLineDash([]);
    // 手指
    ctx.fillStyle = '#f0b48a'; ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(fx, fy, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1d2433'; ctx.textAlign = 'center'; ctx.fillText('手指', fx + 30, fy + 4);
    // 眼睛
    for (const [ex, c, t] of [[eL, '#2f80ed', '左眼'], [eR, '#f2711c', '右眼']]) {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1d2433';
      ctx.beginPath(); ctx.ellipse(ex, eyeY, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(ex, eyeY - 2, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d2433'; ctx.fillText(t, ex, eyeY + 26);
    }
    // 兩眼各自看到的畫面
    const panel = (cv, hx) => {
      const pc = cv.ctx;
      fillCanvas(cv, '#d9d3c7');
      const k = cv.w / w;
      colors.forEach((c, i) => { pc.fillStyle = c; pc.fillRect((i * 40 + 14) * k, 10, 12 * k, cv.h - 20); });
      const r = clamp(5 + 900 / this.d / 6, 6, 26);
      pc.fillStyle = '#f0b48a'; pc.strokeStyle = '#1d2433'; pc.lineWidth = 2;
      pc.beginPath(); pc.arc(hx * k, cv.h / 2, r, 0, Math.PI * 2); pc.fill(); pc.stroke();
    };
    panel(this.L, hl);
    panel(this.R, hr);
    const diff = Math.abs(hl - hr) / 40;
    $('#stereo-note').textContent = `兩眼看到手指的位置差了約 ${diff.toFixed(1)} 個色塊。手指越近，差越多！`;
  }
};

/* ---------- 5.3 車輪倒轉 ---------- */
const Wheel = {
  cv: null, phi: null, rps: 1, fps: 24, red: false, ang: 0, shown: 0, acc: 0, task: null,
  phiMs: 250, phiAcc: 0, phiSide: 0,
  init() {
    this.cv = setupCanvas('wheel-cv', 300, 300);
    this.phi = setupCanvas('phi-cv', 300, 110);
    bindRange($('#wheel-rps'), $('#wheel-out'), v => v.toFixed(2) + ' 圈／秒', v => { this.rps = v; this.note(); });
    bindSeg($('#wheel-fps'), v => { this.fps = +v; this.note(); });
    $('#wheel-red').addEventListener('click', e => { this.red = !this.red; e.currentTarget.classList.toggle('on', this.red); this.draw(); });
    this.task = Anim.add('eye', dt => {
      this.ang += this.rps * Math.PI * 2 * dt;
      if (this.fps === 0) { this.shown = this.ang; }
      else {
        this.acc += dt;
        if (this.acc >= 1 / this.fps) { this.acc %= 1 / this.fps; this.shown = this.ang; }
      }
      this.draw();
    });
    bindPlayButton($('#wheel-play'), this.task);
    const phiTask = Anim.add('eye', dt => {
      this.phiAcc += dt * 1000;
      if (this.phiAcc >= this.phiMs) { this.phiAcc = 0; this.phiSide = 1 - this.phiSide; this.drawPhi(); }
    });
    bindRange($('#phi-ms'), $('#phi-out'), v => v + ' 毫秒', v => { this.phiMs = v; });
    this.note(); this.draw(); this.drawPhi();
    if (!phiTask.running) this.drawPhi();
  },
  note() {
    const spacing = 45;
    let txt;
    if (this.fps === 0) {
      txt = '直接用眼睛看：輪子照實際方向轉。';
    } else {
      const adv = 360 * this.rps / this.fps;
      const m = ((adv % spacing) + spacing) % spacing;
      let look;
      if (this.rps === 0) look = '停住';
      else if (m < 1 || m > spacing - 1) look = '好像停住了！';
      else if (m < spacing / 2) look = '往前轉';
      else look = '好像在倒轉！';
      txt = `每拍一張，輪子轉 ${adv.toFixed(1)}°（輪輻間隔 45°）→ 看起來：${look}`;
    }
    $('#wheel-note').textContent = txt;
  },
  draw() {
    const { ctx } = this.cv;
    fillCanvas(this.cv, '#1d2433');
    const cx = 150, cy = 150, R = 120;
    ctx.strokeStyle = '#e9e4da'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const a = this.shown + i * Math.PI / 4;
      ctx.strokeStyle = this.red && i === 0 ? '#ff3b3b' : '#e9e4da';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)); ctx.stroke();
    }
    ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  },
  drawPhi() {
    const { ctx } = this.phi;
    fillCanvas(this.phi, '#1d2433');
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath(); ctx.arc(this.phiSide === 0 ? 90 : 210, 55, 14, 0, Math.PI * 2); ctx.fill();
  }
};

/* ---------- 5.4 月亮錯覺 ---------- */
const Moon = {
  cv: null, ground: true, p: 0, moved: false,
  init() {
    this.cv = setupCanvas('moon-cv', 520, 340);
    $('#moon-ground').addEventListener('click', e => {
      this.ground = !this.ground;
      e.currentTarget.textContent = this.ground ? '🏙 拿掉地面景物' : '🏙 放回地面景物';
      this.draw();
    });
    $('#moon-move').addEventListener('click', e => {
      const btn = e.currentTarget, from = this.p, to = this.moved ? 0 : 1;
      this.moved = !this.moved;
      btn.textContent = this.moved ? '⬆️ 送回高空' : '⬇️ 把高空的月亮拉下來比';
      tween(1100, t => { this.p = lerp(from, to, t); this.draw(); });
    });
    this.draw();
  },
  moonAt(x, y) {
    const { ctx } = this.cv;
    const g = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, 24);
    g.addColorStop(0, '#fff8de'); g.addColorStop(1, '#f1dc96');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(180,160,100,.35)';
    ctx.beginPath(); ctx.arc(x + 6, y - 4, 5, 0, Math.PI * 2); ctx.arc(x - 7, y + 7, 4, 0, Math.PI * 2); ctx.fill();
  },
  draw() {
    const { ctx, w, h } = this.cv;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#071029'); sky.addColorStop(0.75, '#1b2f5e'); sky.addColorStop(1, '#3a4f80');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    [[40, 40], [90, 120], [170, 30], [250, 80], [300, 20], [470, 140], [500, 40], [350, 150], [60, 190]].forEach(([x, y]) => ctx.fillRect(x, y, 2, 2));
    const horizon = 290;
    this.moonAt(150, 262);
    this.moonAt(lerp(400, 150, this.p), lerp(70, 205, this.p));
    if (this.ground) {
      ctx.fillStyle = '#0a0f1c';
      const b = [[0, 250, 40], [40, 232, 34], [74, 268, 26], [175, 240, 30], [205, 258, 42], [247, 226, 28], [275, 262, 50], [325, 236, 36], [361, 255, 60], [421, 230, 30], [451, 260, 69]];
      b.forEach(([x, y, bw]) => ctx.fillRect(x, y, bw, h - y));
      ctx.fillStyle = '#ffd84d';
      [[50, 245], [60, 262], [184, 252], [256, 240], [334, 250], [430, 246], [466, 272]].forEach(([x, y]) => ctx.fillRect(x, y, 5, 6));
      ctx.fillStyle = '#0a0f1c';
      for (const tx of [110, 135, 160]) { ctx.beginPath(); ctx.arc(tx, 282, 16, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillRect(0, horizon, w, h - horizon);
    } else {
      ctx.fillStyle = '#0a0f1c'; ctx.fillRect(0, horizon, w, h - horizon);
    }
  }
};

registerTab('eye', {
  init() { Blind.init(); Stereo.init(); Wheel.init(); Moon.init(); }
});
