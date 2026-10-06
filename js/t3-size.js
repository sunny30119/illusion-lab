'use strict';
/* ============ 分頁 3：長度大小 ============ */

QUIZ.muller = {
  q: '上下兩條線段（不算箭頭的部分），哪一條比較長？',
  opts: [{ t: '上面比較長' }, { t: '下面比較長' }, { t: '一樣長', ok: true }],
  truth: '兩條線一模一樣，都是 200 像素！按「顯示尺規」驗證。'
};
QUIZ.ebbing = {
  q: '兩個橘色的圓，哪一個比較大？',
  opts: [{ t: '左邊比較大' }, { t: '右邊比較大' }, { t: '一樣大', ok: true }],
  truth: '兩個橘色圓完全一樣大！把右邊的圓疊過去看看。'
};
QUIZ.ponzo = {
  q: '兩條紅色橫線，哪一條比較長？',
  opts: [{ t: '上面比較長' }, { t: '下面比較長' }, { t: '一樣長', ok: true }],
  truth: '兩條紅線一樣長！把上面那條移下來比比看。'
};
QUIZ.cafe = {
  q: '磚塊之間的灰色橫線（縫），是互相平行的嗎？',
  opts: [{ t: '是平行的', ok: true }, { t: '是歪斜的' }],
  truth: '每一條灰縫都是完全水平、互相平行的！畫出參考線就知道。'
};

/* 畫一條帶箭頭的線：type = in（<—>）、out（>—<）、none */
function drawFinLine(ctx, cx, y, len, type, finLen = 30, angleDeg = 36) {
  const a = angleDeg * Math.PI / 180;
  const fx = finLen * Math.cos(a), fy = finLen * Math.sin(a);
  const L = cx - len / 2, R = cx + len / 2;
  ctx.beginPath();
  ctx.moveTo(L, y); ctx.lineTo(R, y);
  if (type === 'in') {
    ctx.moveTo(L + fx, y - fy); ctx.lineTo(L, y); ctx.lineTo(L + fx, y + fy);
    ctx.moveTo(R - fx, y - fy); ctx.lineTo(R, y); ctx.lineTo(R - fx, y + fy);
  } else if (type === 'out') {
    ctx.moveTo(L - fx, y - fy); ctx.lineTo(L, y); ctx.lineTo(L - fx, y + fy);
    ctx.moveTo(R + fx, y - fy); ctx.lineTo(R, y); ctx.lineTo(R + fx, y + fy);
  }
  ctx.stroke();
}

/* ---------- 3.1 繆勒-萊爾 ---------- */
const Muller = {
  cv: null, top: 200, bot: 200, ruler: false, finsOff: false, challenge: false,
  init() {
    this.cv = setupCanvas('muller-cv', 520, 260);
    $('#muller-ruler').addEventListener('click', e => { this.ruler = !this.ruler; e.currentTarget.classList.toggle('on', this.ruler); this.draw(); });
    $('#muller-fins').addEventListener('click', e => { this.finsOff = !this.finsOff; e.currentTarget.classList.toggle('on', this.finsOff); this.draw(); });
    const slider = $('#muller-len'), res = $('#muller-result');
    bindRange(slider, $('#muller-len-out'), v => v + ' px', v => { this.bot = v; this.draw(); });
    $('#muller-new').addEventListener('click', () => {
      this.challenge = true; this.ruler = false; this.finsOff = false;
      $('#muller-ruler').classList.remove('on'); $('#muller-fins').classList.remove('on');
      this.bot = 150 + Math.round(Math.random() * 100);
      slider.value = this.bot; $('#muller-len-out').textContent = this.bot + ' px';
      res.textContent = '開始調整吧！';
      this.draw();
    });
    $('#muller-check').addEventListener('click', () => {
      const err = (this.bot - this.top) / this.top * 100;
      const abs = Math.abs(err);
      const best = Store.data.best.muller;
      if (best === undefined || abs < best) { Store.data.best.muller = abs; Store.save(); }
      let msg;
      if (abs < 3) msg = '🎯 超準！你的大腦幾乎沒被騙。';
      else if (err > 0) msg = '你把下面調得太長了，代表你覺得 &gt;—&lt; 比較短？少見喔！';
      else msg = '你把下面調得太短了，因為 &gt;—&lt; 看起來比較長，大腦被騙了！';
      res.innerHTML = `誤差 ${err > 0 ? '+' : ''}${err.toFixed(1)}%（你調 ${this.bot} px，真正是 ${this.top} px）<br>${msg}<br><span class="small muted">你的最佳紀錄：誤差 ${Store.data.best.muller.toFixed(1)}%</span>`;
      this.ruler = true; $('#muller-ruler').classList.add('on');
      this.draw();
    });
    this.draw();
  },
  draw() {
    const { ctx, w } = this.cv;
    fillCanvas(this.cv, '#fffdf8');
    const cx = w / 2, yT = 80, yB = 180;
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2f80ed';
    drawFinLine(ctx, cx, yT, this.top, this.finsOff ? 'none' : 'in');
    ctx.strokeStyle = '#e04f6f';
    drawFinLine(ctx, cx, yB, this.bot, this.finsOff ? 'none' : 'out');
    if (this.ruler) {
      ctx.strokeStyle = '#d98e04'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      for (const x of [cx - this.top / 2, cx + this.top / 2]) {
        ctx.beginPath(); ctx.moveTo(x, yT - 30); ctx.lineTo(x, yB + 40); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = '#b07300'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`上：${this.top} px`, cx, yT - 36);
      ctx.fillText(`下：${this.bot} px`, cx, yB + 56);
    }
    $('#muller-note').textContent = this.challenge ? '挑戰中：把下面的線調到和上面一樣長' : '藍線：箭頭向內 <—>　紅線：箭頭向外 >—<';
  }
};

/* ---------- 3.2 艾賓浩斯 ---------- */
const Ebbing = {
  cv: null, scale: 1, p: 0, off: false, moved: false,
  init() {
    this.cv = setupCanvas('ebbing-cv', 300, 220);
    bindRange($('#ebbing-scale'), $('#ebbing-out'), v => v.toFixed(1) + ' 倍', v => { this.scale = v; this.draw(); });
    $('#ebbing-off').addEventListener('click', e => { this.off = !this.off; e.currentTarget.classList.toggle('on', this.off); this.draw(); });
    $('#ebbing-move').addEventListener('click', e => {
      const btn = e.currentTarget;
      const from = this.p, to = this.moved ? 0 : 1;
      this.moved = !this.moved;
      btn.textContent = this.moved ? '⬅️ 移回原位' : '➡️ 把右邊的圓疊過去';
      tween(900, t => { this.p = lerp(from, to, t); this.draw(); });
    });
    this.draw();
  },
  draw() {
    const { ctx } = this.cv;
    fillCanvas(this.cv, '#fffdf8');
    const cy = 110, lx = 80, rx = 220, r0 = 16;
    if (!this.off) {
      ctx.fillStyle = '#9aa3b2';
      const bigR = 24 * this.scale, bigOrbit = r0 + 8 + bigR;
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2;
        ctx.beginPath(); ctx.arc(lx + Math.cos(a) * bigOrbit, cy + Math.sin(a) * bigOrbit, bigR, 0, Math.PI * 2); ctx.fill();
      }
      const smR = 7 * this.scale, smOrbit = r0 + 6 + smR;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        ctx.beginPath(); ctx.arc(rx + Math.cos(a) * smOrbit, cy + Math.sin(a) * smOrbit, smR, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = '#f2711c';
    ctx.beginPath(); ctx.arc(lx, cy, r0, 0, Math.PI * 2); ctx.fill();
    const mx = lerp(rx, lx, this.p);
    ctx.fillStyle = this.p > 0 ? 'rgba(47,128,237,.75)' : '#f2711c';
    ctx.beginPath(); ctx.arc(mx, cy, r0, 0, Math.PI * 2); ctx.fill();
  }
};

/* ---------- 3.3 龐佐 ---------- */
const Ponzo = {
  cv: null, track: true, p: 0, moved: false,
  init() {
    this.cv = setupCanvas('ponzo-cv', 260, 240);
    $('#ponzo-off').addEventListener('click', e => { this.track = !this.track; e.currentTarget.classList.toggle('on', !this.track); this.draw(); });
    $('#ponzo-move').addEventListener('click', e => {
      const btn = e.currentTarget, from = this.p, to = this.moved ? 0 : 1;
      this.moved = !this.moved;
      btn.textContent = this.moved ? '⬆️ 移回原位' : '⬇️ 把上面的線移下來比';
      tween(900, t => { this.p = lerp(from, to, t); this.draw(); });
    });
    this.draw();
  },
  draw() {
    const { ctx } = this.cv;
    fillCanvas(this.cv, '#fffdf8');
    if (this.track) {
      ctx.strokeStyle = '#6b6457'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(108, 8); ctx.lineTo(28, 236); ctx.moveTo(152, 8); ctx.lineTo(232, 236); ctx.stroke();
      // 枕木：越近間隔越大（透視）
      ctx.lineWidth = 2; ctx.strokeStyle = '#b9b2a5';
      for (let k = 0; k < 14; k++) {
        const y = 8 + 228 * Math.pow(k / 13, 1.6);
        const t = (y - 8) / 228;
        ctx.beginPath(); ctx.moveTo(lerp(108, 28, t), y); ctx.lineTo(lerp(152, 232, t), y); ctx.stroke();
      }
    }
    const len = 64, cx = 130;
    ctx.strokeStyle = '#e53935'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - len / 2, 175); ctx.lineTo(cx + len / 2, 175); ctx.stroke();
    const yTop = lerp(62, 198, this.p);
    ctx.strokeStyle = this.p > 0 ? 'rgba(47,128,237,.9)' : '#e53935';
    ctx.beginPath(); ctx.moveTo(cx - len / 2, yTop); ctx.lineTo(cx + len / 2, yTop); ctx.stroke();
  }
};

/* ---------- 3.4 咖啡館牆 ---------- */
const Cafe = {
  cv: null, offset: 50, mortar: '#8c8c8c', ref: false,
  init() {
    this.cv = setupCanvas('cafe-cv', 300, 230);
    $('#cafe-ref').addEventListener('click', e => { this.ref = !this.ref; e.currentTarget.classList.toggle('on', this.ref); this.draw(); });
    bindSeg($('#cafe-mortar'), v => { this.mortar = v; this.draw(); });
    bindRange($('#cafe-offset'), $('#cafe-out'), v => v + '%', v => { this.offset = v; this.draw(); });
    this.draw();
  },
  draw() {
    const { ctx, w } = this.cv;
    fillCanvas(this.cv, '#fffdf8');
    const rows = 8, rowH = 24, mortar = 3, tile = 30, top = 6;
    for (let r = 0; r < rows; r++) {
      const y = top + r * (rowH + mortar);
      const shift = r % 2 === 1 ? this.offset / 100 * tile : 0;
      for (let k = -2; k * tile < w + tile; k++) {
        ctx.fillStyle = ((k % 2) + 2) % 2 === 0 ? '#000' : '#fff';
        ctx.fillRect(k * tile + shift, y, tile, rowH);
      }
      if (r < rows - 1) { ctx.fillStyle = this.mortar; ctx.fillRect(0, y + rowH, w, mortar); }
    }
    if (this.ref) {
      ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = 1.2; ctx.setLineDash([6, 4]);
      for (let r = 0; r < rows - 1; r++) {
        const y = top + r * (rowH + mortar) + rowH + mortar / 2;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }
};

registerTab('size', {
  init() { Muller.init(); Ebbing.init(); Ponzo.init(); Cafe.init(); }
});
