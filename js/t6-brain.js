'use strict';
/* ============ 分頁 6：大腦愛腦補 ============ */

QUIZ.vase = {
  q: '你第一眼看到的是什麼？',
  any: true,
  opts: [
    { t: '一個黑色花瓶', msg: '你的大腦把「黑色」當成主角。再看久一點，能不能看到兩張面對面的側臉？' },
    { t: '兩張面對面的側臉', msg: '你的大腦把「白色」當成主角。再看久一點，能不能看到中間的花瓶？' }
  ]
};
QUIZ.kanizsa = {
  q: '這張圖裡，總共「畫」了幾個三角形？',
  opts: [{ t: '1 個' }, { t: '2 個' }, { t: '0 個', ok: true }],
  truth: '一個三角形都沒有畫！只有三個缺了一角的黑圓（小精靈）和三個「V」字。'
};
QUIZ.penrose = {
  q: '這個三角形，真的能用積木做出來嗎？',
  opts: [
    { t: '不可能，它違反了物理' },
    { t: '可以，但只有從某個角度看才像', ok: true }
  ],
  truth: '真的做得出來，只是要「作弊」：從特定角度看才會接起來。拖動拉桿換個角度就穿幫了！'
};

/* ---------- 6.1 魯賓花瓶 ---------- */
const Vase = {
  cv: null, mode: 'plain', invert: false,
  // 左側臉的輪廓（由上到下），右側是鏡像
  prof: [[104, 60], [106, 90], [110, 115], [117, 135], [111, 150], [118, 168], [137, 190], [123, 203], [125, 213],
    [132, 222], [123, 231], [129, 240], [119, 255], [125, 272], [110, 288], [104, 310], [102, 340]],
  init() {
    this.cv = setupCanvas('vase-cv', 320, 340);
    $$('[data-vase]').forEach(b => b.addEventListener('click', () => {
      const v = b.dataset.vase;
      if (v === 'invert') this.invert = !this.invert;
      else this.mode = v;
      this.draw();
    }));
    this.draw();
  },
  curve(ctx, pts) {
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.lineTo(...pts[pts.length - 1]);
  },
  draw() {
    const { ctx, w } = this.cv;
    const fg = this.invert ? '#ffffff' : '#1d2433', bg = this.invert ? '#1d2433' : '#ffffff';
    fillCanvas(this.cv, bg);
    const L = this.prof, Rt = L.map(([x, y]) => [w - x, y]).reverse();
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(...L[0]);
    this.curve(ctx, L);
    ctx.lineTo(...Rt[0]);
    this.curve(ctx, Rt);
    ctx.closePath();
    ctx.fill();
    if (this.mode === 'face') {
      for (const s of [1, -1]) {
        const ex = s > 0 ? 86 : w - 86;
        ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ex - 14 * s, 124); ctx.quadraticCurveTo(ex, 116, ex + 14 * s, 122); ctx.stroke(); // 眉毛
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.ellipse(ex, 138, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(ex + 3 * s, 138, 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = fg; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s > 0 ? 55 : w - 55, 160, 14, -Math.PI / 2, Math.PI / 2, s < 0); ctx.stroke(); // 耳朵
      }
    }
    if (this.mode === 'vase') {
      const flowers = [[132, 22, '#e53935'], [160, 12, '#ffd84d'], [188, 22, '#e04f6f'], [146, 34, '#9b51e0'], [176, 36, '#2f80ed']];
      ctx.strokeStyle = '#2e9d4b'; ctx.lineWidth = 3;
      flowers.forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(160, 62); ctx.quadraticCurveTo((x + 160) / 2, y + 20, x, y); ctx.stroke(); });
      flowers.forEach(([x, y, c]) => {
        ctx.fillStyle = c;
        for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      });
      ctx.strokeStyle = this.invert ? '#c9a227' : '#d98e04'; ctx.lineWidth = 3;
      for (const y of [78, 300]) { ctx.beginPath(); ctx.moveTo(126, y); ctx.lineTo(194, y); ctx.stroke(); }
    }
  }
};

/* ---------- 6.2 卡尼薩三角形 ---------- */
const Kanizsa = {
  cv: null, rot: 0, show: false,
  init() {
    this.cv = setupCanvas('kanizsa-cv', 320, 310);
    bindRange($('#kanizsa-rot'), $('#kanizsa-out'), v => v + '°', v => { this.rot = v; this.draw(); });
    $('#kanizsa-show').addEventListener('click', e => { this.show = !this.show; e.currentTarget.classList.toggle('on', this.show); this.draw(); });
    this.draw();
  },
  draw() {
    const { ctx } = this.cv;
    fillCanvas(this.cv, '#ffffff');
    const P = [[160, 60], [60, 235], [260, 235]];
    const C = [160, (60 + 235 + 235) / 3];
    const Q = [90, 210, 330].map(d => [C[0] + 105 * Math.cos(d * Math.PI / 180), C[1] + 105 * Math.sin(d * Math.PI / 180)]);
    // 倒三角形的外框，中間被「看不見的白三角形」擋住
    ctx.strokeStyle = this.show ? '#2f80ed' : '#1d2433'; ctx.lineWidth = 3; ctx.lineJoin = 'miter';
    ctx.beginPath(); ctx.moveTo(...Q[0]); ctx.lineTo(...Q[1]); ctx.lineTo(...Q[2]); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(...P[0]); ctx.lineTo(...P[1]); ctx.lineTo(...P[2]); ctx.closePath(); ctx.fill();
    // 三個小精靈
    const r = 30, rot = this.rot * Math.PI / 180;
    P.forEach(([x, y], i) => {
      const dir = Math.atan2(C[1] - y, C[0] - x) + (i % 2 === 0 ? rot : -rot);
      ctx.fillStyle = '#1d2433';
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.arc(x, y, r, dir + Math.PI / 6, dir - Math.PI / 6 + Math.PI * 2);
      ctx.closePath(); ctx.fill();
      if (this.show) { ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3; ctx.stroke(); }
    });
    if (this.show) {
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#e53935'; ctx.fillText('紅框：3 個小精靈', 160, 290);
      ctx.fillStyle = '#2f80ed'; ctx.fillText('藍線：3 個 V 字', 160, 306);
    }
  }
};

/* ---------- 6.3 不可能三角（積木版，轉個角度就穿幫） ---------- */
const Penrose = {
  cv: null, phi: 45, N: 6, cubes: [],
  init() {
    this.cv = setupCanvas('penrose-cv', 380, 340);
    const N = this.N;
    for (let i = 0; i < N; i++) this.cubes.push({ p: [i, 0, 0], beam: 0 });
    for (let j = 1; j < N; j++) this.cubes.push({ p: [N - 1, j, 0], beam: 1 });
    for (let k = 1; k < N - 1; k++) {
      // 靠近起點那一半，排順序時假裝它在「起點正下方」，才能和起點完美接上
      const virt = k > (N - 1) / 2 ? [0, 0, k - (N - 1)] : null;
      this.cubes.push({ p: [N - 1, N - 1, k], beam: 2, virt });
    }
    this.set = new Set(this.cubes.map(c => c.p.join(',')));
    const fmt = v => Math.abs(v - 45) < 0.6 ? '神奇角度' : `${v > 45 ? '右' : '左'}轉 ${Math.abs(v - 45).toFixed(1)}°`;
    const range = $('#penrose-ang');
    bindRange(range, $('#penrose-out'), fmt, v => { this.phi = v; this.draw(); });
    $('#penrose-reset').addEventListener('click', () => {
      const from = this.phi;
      tween(700, t => { this.phi = lerp(from, 45, t); range.value = this.phi; $('#penrose-out').textContent = fmt(this.phi); this.draw(); });
    });
    this.draw();
  },
  has(x, y, z) { return this.set.has(`${x},${y},${z}`); },
  draw() {
    const { ctx, w, h } = this.cv;
    fillCanvas(this.cv, '#f6f2ea');
    const iso = Math.abs(this.phi - 45) < 0.6;
    const f = (iso ? 45 : this.phi) * Math.PI / 180;
    const al = Math.atan(1 / Math.SQRT2);
    const r = [-Math.sin(f), Math.cos(f), 0];
    const u = [-Math.sin(al) * Math.cos(f), -Math.sin(al) * Math.sin(f), Math.cos(al)];
    const v = [Math.cos(al) * Math.cos(f), Math.cos(al) * Math.sin(f), Math.sin(al)];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const s = 30;
    // 讓整個圖形置中
    let mx = 0, my = 0;
    this.cubes.forEach(c => { const m = [c.p[0] + .5, c.p[1] + .5, c.p[2] + .5]; mx += dot(m, r); my += dot(m, u); });
    mx /= this.cubes.length; my /= this.cubes.length;
    const proj = P => [w / 2 + s * (dot(P, r) - mx), h / 2 - s * (dot(P, u) - my)];
    const base = ['#5b5bd6', '#f2711c', '#0f9d8f'];
    const shade = (hex, k) => {
      const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
      return rgb(...c.map(x => k > 0 ? lerp(x, 255, k) : lerp(x, 0, -k)));
    };
    const N = this.N;
    const list = this.cubes.map(c => {
      const ref = iso && c.virt ? c.virt : c.p;
      return { c, depth: dot([ref[0] + .5, ref[1] + .5, ref[2] + .5], v) };
    }).sort((a, b) => a.depth - b.depth);
    ctx.lineJoin = 'round';
    for (const { c } of list) {
      const [x, y, z] = c.p;
      const faces = [];
      const lastZ = c.beam === 2 && z === N - 2;
      if (!this.has(x, y, z + 1) && !(iso && lastZ)) faces.push([[[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], 0.35]);
      if (!this.has(x + 1, y, z)) faces.push([[[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]], 0]);
      if (!this.has(x, y + 1, z)) faces.push([[[x, y + 1, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]], -0.3]);
      for (const [pts, k] of faces) {
        ctx.fillStyle = shade(base[c.beam], k);
        ctx.strokeStyle = 'rgba(29,36,51,.55)'; ctx.lineWidth = 1;
        ctx.beginPath();
        pts.forEach((P, i) => { const [X, Y] = proj(P); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); });
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    $('#penrose-note').textContent = iso ? '✨ 神奇角度：三根積木好像首尾相接了！' : '🙈 穿幫了！其實第三根積木根本沒有接上第一根。';
  }
};

registerTab('brain', {
  init() { Vase.init(); Kanizsa.init(); Penrose.init(); }
});
