'use strict';
/* ============ 分頁 2：明暗顏色 ============ */

QUIZ.checker = {
  q: '棋盤上的 A 格和 B 格，哪一格顏色比較深？',
  opts: [{ t: 'A 比較深' }, { t: 'B 比較深' }, { t: '一模一樣', ok: true }],
  truth: 'A 和 B 在螢幕上是完全相同的灰色：RGB(120, 120, 120)。用下面的取色器點點看！'
};
QUIZ.dress = {
  q: '這件洋裝，你第一眼看到的是什麼顏色？',
  any: true,
  opts: [
    { t: '藍色＋黑色', msg: '你的大腦猜「洋裝在偏黃的燈光下」，所以把黃色扣掉了。拉動下面的拉桿，看看換個光線會怎樣。' },
    { t: '白色＋金色', msg: '你的大腦猜「洋裝在偏藍的陰影裡」，所以把藍色扣掉了。拉動下面的拉桿，看看換個光線會怎樣。' },
    { t: '其他顏色', msg: '每個人的大腦對光線的猜測不同，看到的顏色也不同。拉動下面的拉桿試試看！' }
  ]
};
QUIZ.hermann = {
  q: '白色線條的交叉點上，你有看到什麼嗎？',
  any: true,
  opts: [
    { t: '有灰灰的影子', msg: '你和大部分人一樣！可是這些灰點根本沒有畫出來。' },
    { t: '什麼都沒有', msg: '有些人比較不明顯。試試用眼角餘光看，或離螢幕遠一點。' },
    { t: '黑點一閃一閃', msg: '那是「閃爍版」才特別明顯的效果，等一下可以切換看看！' }
  ]
};
QUIZ.after = {
  q: '盯著藍綠色的蘋果 15 秒，再看白色的地方，會看到什麼？',
  opts: [{ t: '藍綠色的蘋果' }, { t: '紅色的蘋果', ok: true }, { t: '什麼都看不到' }],
  truth: '你會看到一顆紅色的蘋果（葉子變綠色）！按下面的按鈕親自驗證。'
};

/* ---------- 2.1 棋盤陰影 ---------- */
const Checker = {
  cv: null, img: null, mask: false, bridge: false,
  W: 50, H: 25, sx: 260, sy: 55,
  A: [0, 1], B: [2, 2], // [欄, 列]
  init() {
    this.cv = setupCanvas('checker-cv', 520, 340);
    this.renderBoard();
    this.draw();
    $('#checker-mask').addEventListener('click', e => { this.mask = !this.mask; e.currentTarget.classList.toggle('on', this.mask); this.draw(); });
    $('#checker-bridge').addEventListener('click', e => { this.bridge = !this.bridge; e.currentTarget.classList.toggle('on', this.bridge); this.draw(); });
    const card = $('#c-checker');
    this.cv.c.addEventListener('pointerdown', e => {
      if (!isUnlocked(card)) return;
      const p = pointerPos(this.cv, e);
      const t = this.tileAt(p.x, p.y);
      let name = '這一格';
      if (t && t[0] === this.A[0] && t[1] === this.A[1]) name = 'A 格';
      if (t && t[0] === this.B[0] && t[1] === this.B[1]) name = 'B 格';
      const ix = Math.floor(p.x * DPR), iy = Math.floor(p.y * DPR);
      let d;
      if (name !== '這一格') {
        // A、B 上面有白色字母，直接讀棋盤本身的顏色
        const i = (iy * this.img.width + ix) * 4;
        d = this.img.data.slice(i, i + 3);
      } else {
        d = this.cv.ctx.getImageData(ix, iy, 1, 1).data;
      }
      $('#checker-probe').hidden = false;
      $('#probe-swatch').style.background = rgb(d[0], d[1], d[2]);
      $('#probe-text').textContent = `${name}：RGB(${d[0]}, ${d[1]}, ${d[2]})`;
    });
  },
  tileAt(x, y) {
    const a = (x - this.sx) / this.W, b = (y - this.sy) / this.H;
    const u = (a + b) / 2, v = (b - a) / 2;
    if (u < 0 || v < 0 || u >= 5 || v >= 5) return null;
    return [Math.floor(u), Math.floor(v), u, v];
  },
  /* 一個像素一個像素算出棋盤和影子，保證 A、B 完全同色 */
  renderBoard() {
    const { c } = this.cv;
    const img = this.cv.ctx.createImageData(c.width, c.height);
    const data = img.data;
    for (let py = 0; py < c.height; py++) {
      for (let px = 0; px < c.width; px++) {
        const x = (px + 0.5) / DPR, y = (py + 0.5) / DPR;
        const t = this.tileAt(x, y);
        let r = 226, g = 221, b = 211;
        if (t) {
          const [col, row, u, v] = t;
          const dark = (col + row) % 2 === 1;
          let val = dark ? 120 : 205;
          // 圓柱的影子：沿著 v 方向延伸的一條帶狀區域，邊緣柔和
          const across = 1 - smoothstep(1.05, 1.35, Math.abs(u - 3));
          const along = smoothstep(0.3, 0.8, v);
          val *= 1 - 0.415 * across * along;
          if ((col === this.A[0] && row === this.A[1]) || (col === this.B[0] && row === this.B[1])) val = 120;
          r = g = b = Math.round(val);
        }
        const i = (py * c.width + px) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
    this.img = img;
  },
  center(col, row) {
    return [this.sx + (col - row) * this.W, this.sy + (col + row + 1) * this.H];
  },
  draw() {
    const { ctx } = this.cv;
    ctx.putImageData(this.img, 0, 0);
    // 綠色圓柱
    const cx = 385, cy = 142, ax = 39, ay = 19, hgt = 120;
    const grad = ctx.createLinearGradient(cx - ax, 0, cx + ax, 0);
    grad.addColorStop(0, '#2f8f5b'); grad.addColorStop(0.35, '#6fd39a'); grad.addColorStop(1, '#14522f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - ax, cy);
    ctx.lineTo(cx - ax, cy - hgt);
    ctx.ellipse(cx, cy - hgt, ax, ay, 0, Math.PI, 0, true);
    ctx.lineTo(cx + ax, cy);
    ctx.ellipse(cx, cy, ax, ay, 0, 0, Math.PI, false);
    ctx.fill();
    ctx.fillStyle = '#8ee0b2';
    ctx.beginPath(); ctx.ellipse(cx, cy - hgt, ax, ay, 0, 0, Math.PI * 2); ctx.fill();

    const [axA, ayA] = this.center(...this.A), [axB, ayB] = this.center(...this.B);
    if (this.bridge) {
      ctx.strokeStyle = 'rgb(120,120,120)'; ctx.lineWidth = 18; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(axA, ayA); ctx.lineTo(axB, ayB); ctx.stroke();
    }
    if (this.mask) {
      ctx.fillStyle = '#e2ddd3';
      ctx.beginPath();
      ctx.rect(0, 0, this.cv.w, this.cv.h);
      for (const [mx, my] of [[axA, ayA], [axB, ayB]]) {
        const sW = this.W * 0.55, sH = this.H * 0.55;
        ctx.moveTo(mx, my - sH); ctx.lineTo(mx - sW, my); ctx.lineTo(mx, my + sH); ctx.lineTo(mx + sW, my); ctx.closePath();
      }
      ctx.fill('evenodd');
    }
    ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    if (!this.mask) {
      ctx.fillText('A', axA, ayA);
      ctx.fillText('B', axB, ayB);
    } else {
      ctx.fillStyle = '#1d2433';
      ctx.fillText('A', axA, ayA - 26);
      ctx.fillText('B', axB, ayB - 26);
    }
  }
};

/* ---------- 2.2 洋裝 ---------- */
const Dress = {
  cv: null, t: 0.5, neutral: false,
  init() {
    this.cv = setupCanvas('dress-cv', 280, 320);
    const name = v => v < 35 ? '偏暖黃燈光' : v > 65 ? '偏藍色陰影' : '中間';
    bindRange($('#dress-light'), $('#dress-out'), name, v => { this.t = v / 100; this.neutral = false; $('#dress-neutral').classList.remove('on'); this.draw(); });
    $('#dress-neutral').addEventListener('click', e => { this.neutral = !this.neutral; e.currentTarget.classList.toggle('on', this.neutral); this.draw(); });
    this.draw();
  },
  draw() {
    const { ctx, w, h } = this.cv;
    // 環境光線：只改背景，洋裝本身的顏色固定
    const warm = [255, 196, 110], cool = [118, 146, 214];
    const L = this.neutral ? [160, 160, 160] : warm.map((c, i) => lerp(c, cool[i], this.t));
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, rgb(L[0], L[1], L[2]));
    bg.addColorStop(1, rgb(L[0] * 0.55, L[1] * 0.55, L[2] * 0.55));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    if (!this.neutral) {
      // 光源提示：暖光是燈泡光暈，冷光是窗戶
      const glow = ctx.createRadialGradient(40, 30, 5, 40, 30, 140);
      glow.addColorStop(0, `rgba(${Math.round(L[0])},${Math.round(L[1])},${Math.round(L[2])},.9)`);
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    }
    // 衣架
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(140, 22, 8, Math.PI, Math.PI * 2.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(140, 30); ctx.lineTo(90, 52); ctx.moveTo(140, 30); ctx.lineTo(190, 52); ctx.stroke();
    // 洋裝外形
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(105, 48); ctx.lineTo(118, 48); ctx.quadraticCurveTo(140, 70, 162, 48); ctx.lineTo(175, 48);
    ctx.lineTo(182, 120); ctx.quadraticCurveTo(172, 140, 180, 150);
    ctx.lineTo(232, 300); ctx.quadraticCurveTo(140, 315, 48, 300);
    ctx.lineTo(100, 150); ctx.quadraticCurveTo(108, 140, 98, 120);
    ctx.closePath();
    ctx.clip();
    const blue = rgb(132, 140, 186), gold = rgb(112, 90, 55);
    let y = 40;
    const bands = [26, 12, 40, 14, 44, 14, 46, 14, 50, 18];
    bands.forEach((bh, i) => {
      ctx.fillStyle = i % 2 === 0 ? blue : gold;
      ctx.fillRect(0, y, w, bh + 1);
      y += bh;
    });
    ctx.fillStyle = blue; ctx.fillRect(0, y, w, h - y);
    ctx.restore();
  }
};

/* ---------- 2.3 赫曼方格 ---------- */
const Hermann = {
  cv: null, mode: 'classic', dot: false,
  init() {
    this.cv = setupCanvas('hermann-cv', 272, 272);
    $('#hermann-dot').addEventListener('click', e => { this.dot = !this.dot; e.currentTarget.classList.toggle('on', this.dot); this.draw(); });
    bindSeg($('#hermann-mode'), v => { this.mode = v; this.draw(); });
    this.draw();
  },
  draw() {
    const { ctx, w, h } = this.cv;
    const cell = 52, off = 6;
    fillCanvas(this.cv, '#000');
    const amp = this.mode === 'wavy' ? 6 : 0;
    const street = this.mode === 'scint' ? 8 : 12;
    ctx.strokeStyle = this.mode === 'scint' ? '#808080' : '#ffffff';
    ctx.lineWidth = street; ctx.lineCap = 'butt';
    for (let k = 0; k < 6; k++) {
      const c = off + k * cell;
      ctx.beginPath();
      for (let x = -4; x <= w + 4; x += 2) {
        const yy = c + amp * Math.sin(2 * Math.PI * x / cell);
        if (x === -4) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let y = -4; y <= h + 4; y += 2) {
        const xx = c + amp * Math.sin(2 * Math.PI * y / cell);
        if (y === -4) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
      }
      ctx.stroke();
    }
    if (this.mode === 'scint') {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
        ctx.beginPath(); ctx.arc(off + i * cell, off + j * cell, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (this.dot) {
      ctx.fillStyle = '#ff2d2d';
      ctx.beginPath(); ctx.arc(off + 3 * cell, off + 2 * cell, 4.5, 0, Math.PI * 2); ctx.fill();
    }
  }
};

/* ---------- 2.4 殘像蘋果 ---------- */
const After = {
  cv: null, state: 'idle', left: 15, timer: null,
  init() {
    this.cv = setupCanvas('after-cv', 300, 260);
    $('#after-start').addEventListener('click', () => this.start());
    this.draw();
  },
  start() {
    const btn = $('#after-start'), note = $('#after-note');
    clearInterval(this.timer);
    this.state = 'stare'; this.left = 15; btn.disabled = true;
    note.textContent = '一直盯著中間的黑點，不要移開視線……';
    this.draw();
    this.timer = setInterval(() => {
      this.left--;
      if (this.left <= 0) {
        clearInterval(this.timer);
        this.state = 'test'; btn.disabled = false;
        btn.textContent = '↺ 再做一次';
        note.textContent = '繼續盯著黑點！你看到什麼顏色的蘋果？';
      }
      this.draw();
    }, 1000);
  },
  draw() {
    const { ctx, w } = this.cv;
    fillCanvas(this.cv, '#ffffff');
    const cx = 150, cy = 140;
    if (this.state !== 'test') {
      // 藍綠色蘋果（殘像會變紅）＋洋紅色葉子（殘像會變綠）
      ctx.fillStyle = 'rgb(0,200,210)';
      ctx.beginPath();
      ctx.arc(cx - 20, cy + 8, 64, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy + 8, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy - 50); ctx.quadraticCurveTo(cx + 4, cy - 75, cx + 12, cy - 92); ctx.stroke();
      ctx.fillStyle = 'rgb(220,0,190)';
      ctx.save(); ctx.translate(cx + 40, cy - 80); ctx.rotate(-0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
    if (this.state === 'stare') {
      ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#999'; ctx.fillText(this.left, w - 10, 8);
    }
  }
};

registerTab('light', {
  init() { Checker.init(); Dress.init(); Hermann.init(); After.init(); }
});
