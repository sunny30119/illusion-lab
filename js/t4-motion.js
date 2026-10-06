'use strict';
/* ============ 分頁 4：動起來了（＋首頁的旋轉蛇） ============ */

QUIZ.snakes = {
  q: '這張圖有沒有在動？',
  opts: [{ t: '有，在轉！' }, { t: '完全靜止', ok: true }],
  truth: '這是一張完全靜止的圖片，沒有任何動畫程式！轉動是你的大腦「算」出來的。'
};
QUIZ.footstep = {
  q: '藍色和黃色方塊往右走，它們的速度怎麼樣？',
  opts: [
    { t: '一停一走，像在輪流踏步' },
    { t: '一樣快，而且一直等速前進', ok: true },
    { t: '黃色比藍色快' }
  ],
  truth: '兩個方塊一直都是等速、同步前進！拿掉條紋就看得出來。'
};
QUIZ.mae = {
  q: '盯著「向內縮」的螺旋 15 秒後，再看一張靜止的風景圖，風景會怎樣？',
  opts: [{ t: '好像在往外膨脹', ok: true }, { t: '好像也在往內縮' }, { t: '沒有任何變化' }],
  truth: '靜止的風景會好像在往外膨脹！按「開始 15 秒凝視」親自驗證。'
};

/* ---------- 旋轉蛇（北岡明佳式）：四個圓盤，每圈方向相反 ---------- */
function drawSnakes(cv, colorful, fixation) {
  const { ctx, w } = cv;
  fillCanvas(cv, '#7f7f7f');
  const cols = colorful ? ['#000000', '#1f3fa6', '#ffffff', '#e8d22c'] : ['#000000', '#555555', '#ffffff', '#aaaaaa'];
  const parts = [0.34, 0.16, 0.34, 0.16];
  const R = w / 4 - 4;
  const rings = 4, inner = R * 0.18, thick = (R - inner) / rings;
  [[1, 1], [3, 1], [1, 3], [3, 3]].forEach(([gx, gy], di) => {
    const cx = gx * w / 4, cy = gy * w / 4;
    const discDir = (di === 0 || di === 3) ? 1 : -1;
    for (let k = 0; k < rings; k++) {
      const r1 = R - k * thick, r0 = r1 - thick;
      const n = Math.max(8, Math.round(2 * Math.PI * (r0 + r1) / 2 / (thick * 2.1)));
      const dir = discDir * (k % 2 === 0 ? 1 : -1);
      for (let i = 0; i < n; i++) {
        let a = i / n * Math.PI * 2;
        const span = Math.PI * 2 / n;
        for (let j = 0; j < 4; j++) {
          const jj = dir > 0 ? j : 3 - j;
          const da = span * parts[jj];
          ctx.fillStyle = cols[jj];
          ctx.beginPath();
          ctx.arc(cx, cy, r1, a, a + da + 0.003);
          ctx.arc(cx, cy, r0, a + da + 0.003, a, true);
          ctx.closePath();
          ctx.fill();
          a += da;
        }
      }
    }
    ctx.fillStyle = '#7f7f7f';
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();
  });
  if (fixation) {
    ctx.fillStyle = '#ff2d55'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w / 2, w / 2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
}

const Snakes = {
  cv: null, colorful: true, fix: false,
  init() {
    this.cv = setupCanvas('snakes-cv', 420, 420);
    $('#snakes-fix').addEventListener('click', e => { this.fix = !this.fix; e.currentTarget.classList.toggle('on', this.fix); this.draw(); });
    $('#snakes-color').addEventListener('click', e => {
      this.colorful = !this.colorful;
      e.currentTarget.textContent = this.colorful ? '🎨 切換黑白版' : '🎨 切換彩色版';
      this.draw();
    });
    this.draw();
  },
  draw() { drawSnakes(this.cv, this.colorful, this.fix); }
};

/* ---------- 4.2 踏步方塊 ---------- */
const Footstep = {
  cv: null, x: 10, speed: 1, stripes: true, task: null,
  init() {
    this.cv = setupCanvas('footstep-cv', 340, 200);
    this.task = Anim.add('motion', dt => { this.x += 45 * this.speed * dt; if (this.x > this.cv.w) this.x = -40; this.draw(); });
    bindPlayButton($('#footstep-play'), this.task);
    $('#footstep-stripes').addEventListener('click', e => {
      this.stripes = !this.stripes;
      e.currentTarget.textContent = this.stripes ? '🦓 拿掉條紋' : '🦓 放回條紋';
      this.draw();
    });
    bindRange($('#footstep-speed'), $('#footstep-out'), v => v.toFixed(1) + ' 倍', v => { this.speed = v; });
    this.draw();
  },
  draw() {
    const { ctx, w, h } = this.cv;
    if (this.stripes) {
      for (let x = 0; x < w; x += 20) {
        ctx.fillStyle = '#000'; ctx.fillRect(x, 0, 10, h);
        ctx.fillStyle = '#fff'; ctx.fillRect(x + 10, 0, 10, h);
      }
    } else {
      fillCanvas(this.cv, '#808080');
    }
    ctx.fillStyle = '#1e3a8a'; ctx.fillRect(this.x, 50, 40, 30);
    ctx.fillStyle = '#fef08a'; ctx.fillRect(this.x, 120, 40, 30);
  }
};

/* ---------- 4.3 螺旋後效 ---------- */
const Mae = {
  cv: null, phase: 0, dir: 'in', state: 'idle', task: null, key: null, img: null, timer: null,
  init() {
    this.cv = setupCanvas('mae-cv', 260, 260);
    const { c } = this.cv;
    // 先算好每個像素的角度與半徑，之後每一格畫面只要查表
    this.key = new Float32Array(c.width * c.height);
    this.inside = new Uint8Array(c.width * c.height);
    const cx = c.width / 2, R = 125 * DPR;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const dx = x - cx, dy = y - cx, r = Math.hypot(dx, dy);
      const i = y * c.width + x;
      this.inside[i] = r < R ? 1 : 0;
      this.key[i] = 3 * Math.atan2(dy, dx) + 0.25 * (r / DPR);
    }
    this.img = this.cv.ctx.createImageData(c.width, c.height);
    this.task = Anim.add('motion', dt => {
      if (this.state !== 'stare') return;
      this.phase += (this.dir === 'in' ? 1 : -1) * 4 * dt;
      this.drawSpiral();
    }, false);
    bindSeg($('#mae-dir'), v => { this.dir = v; });
    $('#mae-start').addEventListener('click', () => this.start());
    this.drawSpiral();
  },
  start() {
    const btn = $('#mae-start');
    clearInterval(this.timer);
    this.state = 'stare'; this.task.running = true;
    let left = 15;
    btn.disabled = true; btn.textContent = `盯著中心紅點……${left}`;
    this.timer = setInterval(() => {
      left--;
      btn.textContent = `盯著中心紅點……${left}`;
      if (left <= 0) {
        clearInterval(this.timer);
        this.state = 'test'; this.task.running = false;
        btn.disabled = false; btn.textContent = '↺ 再做一次';
        this.drawScene();
      }
    }, 1000);
  },
  drawSpiral() {
    const d = this.img.data, n = this.key.length, ph = this.phase;
    for (let i = 0; i < n; i++) {
      let v = 17;
      if (this.inside[i]) v = Math.sin(this.key[i] + ph) > 0 ? 245 : 15;
      const j = i * 4;
      d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255;
    }
    this.cv.ctx.putImageData(this.img, 0, 0);
    this.dot();
  },
  dot() {
    const { ctx, w } = this.cv;
    ctx.fillStyle = '#ff2d55';
    ctx.beginPath(); ctx.arc(w / 2, w / 2, 5, 0, Math.PI * 2); ctx.fill();
  },
  /* 靜止的風景（用來測試後效） */
  drawScene() {
    const { ctx, w, h } = this.cv;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#6ec3f4'); sky.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(200, 55, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a8fa6';
    ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(70, 95); ctx.lineTo(130, 160); ctx.lineTo(190, 100); ctx.lineTo(260, 165); ctx.lineTo(260, 260); ctx.lineTo(0, 260); ctx.fill();
    ctx.fillStyle = '#7cc56b'; ctx.fillRect(0, 175, w, h - 175);
    for (const [tx, ty, s] of [[40, 190, 1], [215, 200, 1.2], [120, 215, 0.9]]) {
      ctx.fillStyle = '#7a5230'; ctx.fillRect(tx - 4 * s, ty, 8 * s, 26 * s);
      ctx.fillStyle = '#2f8f4a'; ctx.beginPath(); ctx.arc(tx, ty, 20 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#e04f6f'; ctx.fillRect(150, 150, 46, 34);
    ctx.fillStyle = '#9b2c47'; ctx.beginPath(); ctx.moveTo(144, 152); ctx.lineTo(173, 128); ctx.lineTo(202, 152); ctx.fill();
    this.dot();
  }
};

/* 首頁的旋轉蛇 */
registerTab('home', {
  init() { this.cv = setupCanvas('home-snakes', 300, 300); },
  show() { drawSnakes(this.cv, true, false); }
});
registerTab('motion', {
  init() { Snakes.init(); Footstep.init(); Mae.init(); }
});
