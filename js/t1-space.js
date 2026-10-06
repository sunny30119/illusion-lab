'use strict';
/* ============ 分頁 1：空間深度 ============ */

QUIZ.crater = {
  q: '畫面上這 9 個圓，是凸起來的球，還是凹下去的坑？',
  opts: [{ t: '凸起來的球' }, { t: '凹下去的坑' }, { t: '都是平的，只是漸層', ok: true }],
  truth: '螢幕是平的！這些圓只是「一邊亮、一邊暗」的漸層，凹凸是大腦自己決定的。'
};
QUIZ.mask = {
  q: '畫面上這張臉，是凸出來的，還是凹進去的？',
  opts: [{ t: '凸出來的（像一般的臉）' }, { t: '凹進去的（面具的內側）', ok: true }],
  truth: '你現在看到的是面具的「內側」，它其實是凹進去的！按「開始旋轉」看看。'
};
QUIZ.opart = {
  q: '螢幕明明是平的，為什麼中間看起來鼓起來？',
  opts: [
    { t: '螢幕真的被凸起來了' },
    { t: '格子在中間變大、旁邊變小，大腦把它當成曲面', ok: true },
    { t: '因為中間的顏色比較亮' }
  ],
  truth: '格子只是在平面上被拉大、壓扁。大腦看到「中間大、旁邊小」，就自動腦補成鼓起來的曲面。'
};
QUIZ.necker = {
  q: '這個透明方塊，哪一面在前面（比較靠近你）？',
  any: true,
  opts: [
    { t: '左下那一面', msg: '也對！再盯久一點，它會突然「翻」過去，變成右上那面在前。' },
    { t: '右上那一面', msg: '也對！再盯久一點，它會突然「翻」過去，變成左下那面在前。' },
    { t: '兩種都可以，它會一直翻', msg: '沒錯！這張圖兩種看法都合理，大腦會在兩者之間切換。' }
  ]
};
QUIZ.chromo = {
  q: '紅色和藍色，哪一個看起來比較靠近你、像浮起來？',
  any: true,
  opts: [
    { t: '紅色比較近', msg: '大多數人都和你一樣！' },
    { t: '藍色比較近', msg: '你屬於少數派！有一部分人看到的剛好相反，這不是看錯，是眼睛構造的個人差異。' },
    { t: '看起來一樣平', msg: '有些人感覺不明顯，很正常。試試離螢幕遠一點、或把房間燈關暗一點再看。' }
  ]
};

/* ---------- 1.1 光影凹凸 ---------- */
const Crater = {
  cv: null, angle: 0, flipped: false, mixed: false, sun: false,
  init() {
    this.cv = setupCanvas('crater-cv', 360, 360);
    const out = $('#crater-angle-out');
    const fmt = v => {
      const n = ((v % 360) + 360) % 360;
      const name = n <= 20 || n >= 340 ? '（正上方）' : Math.abs(n - 180) <= 20 ? '（正下方）' : '';
      return `${Math.round(n)}°${name}`;
    };
    bindRange($('#crater-angle'), out, fmt, v => { this.angle = v; this.draw(); });
    $$('[data-crater]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.crater;
      if (act === 'top' || act === 'bottom') {
        this.angle = act === 'top' ? 0 : 180;
        $('#crater-angle').value = this.angle;
        out.textContent = fmt(this.angle);
      }
      if (act === 'flip') { this.flipped = !this.flipped; $('#crater-wrap').classList.toggle('flipped', this.flipped); }
      if (act === 'mix') { this.mixed = !this.mixed; b.classList.toggle('on', this.mixed); }
      if (act === 'sun') { this.sun = !this.sun; b.classList.toggle('on', this.sun); }
      this.draw();
    }));
    this.draw();
  },
  draw() {
    const { ctx } = this.cv;
    fillCanvas(this.cv, '#8a8f99');
    const a = this.angle * Math.PI / 180;
    const lx = Math.sin(a), ly = -Math.cos(a); // 光的方向（0° = 上方）
    const R = 38;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = 80 + col * 100, cy = 80 + row * 100;
        const rev = this.mixed && row === 1 ? -1 : 1;
        const g = ctx.createLinearGradient(cx - lx * R * rev, cy - ly * R * rev, cx + lx * R * rev, cy + ly * R * rev);
        g.addColorStop(0, '#383c44');
        g.addColorStop(1, '#eceff3');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (this.sun) {
      const sx = 180 + lx * 166, sy = 180 + ly * 166;
      ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx, sy, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // 大部分人會看到什麼
    const eff = (((this.angle + (this.flipped ? 180 : 0)) % 360) + 360) % 360;
    const d = Math.min(eff, 360 - eff); // 離正上方幾度
    let txt;
    if (d <= 60) txt = '凸起來的球';
    else if (d >= 120) txt = '凹下去的坑';
    else txt = '光從側面來，很難判斷凹凸';
    if (this.mixed && (d <= 60 || d >= 120)) txt += '（中間那排相反）';
    $('#crater-note').textContent = '大部分人會看到：' + txt;
  }
};

/* ---------- 1.2 空心面具（3D） ---------- */
const Mask = {
  ok: false, spinTask: null, speed: 1,
  init() {
    const box = $('#mask-box');
    if (typeof THREE === 'undefined') {
      box.innerHTML = '<p>⚠️ 3D 面具需要網路才能載入。<br>請連上網路後重新整理頁面。</p>';
      return;
    }
    this.ok = true;
    const w = box.clientWidth || 600, h = box.clientHeight || 340;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 5.4);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(DPR);
    this.renderer.setSize(w, h);
    box.appendChild(this.renderer.domElement);

    const geom = this.buildFace();
    this.mat = new THREE.MeshStandardMaterial({ color: 0xf1e3d3, roughness: 0.65, metalness: 0, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geom, this.mat);
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    this.group.rotation.y = Math.PI; // 一開始讓學生看到「內側」
    this.scene.add(this.group);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 0.95);
    key.position.set(0.6, 2.5, 3);
    this.scene.add(key);

    // 拖曳旋轉
    let px = 0, py = 0;
    onPointer(this.renderer.domElement, (e, type) => {
      if (type === 'down') { px = e.clientX; py = e.clientY; }
      if (type === 'move') {
        this.group.rotation.y += (e.clientX - px) * 0.01;
        this.group.rotation.x = clamp(this.group.rotation.x + (e.clientY - py) * 0.01, -0.8, 0.8);
        px = e.clientX; py = e.clientY;
        this.render();
      }
    });

    this.spinTask = Anim.add('space', dt => {
      this.group.rotation.y += dt * 0.9 * this.speed;
      this.render();
    }, false);
    bindPlayButton($('#mask-spin'), this.spinTask, ['⏸ 停止旋轉', '▶ 開始旋轉']);
    bindRange($('#mask-speed'), $('#mask-speed-out'), v => v.toFixed(1) + ' 倍', v => { this.speed = v; });

    $$('[data-mask]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.mask;
      if (act === 'top') { this.camera.position.set(0, 5.2, 0.8); this.camera.lookAt(0, 0, 0); }
      if (act === 'front' || act === 'back') {
        this.camera.position.set(0, 0, 5.4); this.camera.lookAt(0, 0, 0);
        this.group.rotation.set(0, act === 'front' ? 0 : Math.PI, 0);
      }
      if (act === 'wire') { this.mat.wireframe = !this.mat.wireframe; b.classList.toggle('on', this.mat.wireframe); }
      this.render();
    }));
    window.addEventListener('resize', () => this.resize());
    $('#c-mask').addEventListener('unlock', () => this.render());
    this.render();
  },
  /* 用數學函數「捏」出一張臉 */
  buildFace() {
    const g = (x, y, x0, y0, sx, sy) => Math.exp(-(((x - x0) / sx) ** 2 + ((y - y0) / sy) ** 2));
    const height = (x, y) => {
      const e = 1 - (x / 0.95) ** 2 - ((y - 0.05) / 1.25) ** 2;
      if (e <= 0) return null;
      let h = 0.55 * Math.sqrt(e);
      h += 0.07 * (g(x, y, -0.36, 0.43, 0.24, 0.07) + g(x, y, 0.36, 0.43, 0.24, 0.07));   // 眉骨
      h -= 0.14 * (g(x, y, -0.36, 0.24, 0.17, 0.11) + g(x, y, 0.36, 0.24, 0.17, 0.11));   // 眼窩
      h += 0.06 * (g(x, y, -0.36, 0.23, 0.08, 0.055) + g(x, y, 0.36, 0.23, 0.08, 0.055)); // 眼球
      h += 0.13 * g(x, y, 0, 0.12, 0.07, 0.26);                                            // 鼻樑
      h += 0.24 * g(x, y, 0, -0.13, 0.11, 0.11);                                           // 鼻頭
      h += 0.05 * (g(x, y, -0.1, -0.18, 0.06, 0.05) + g(x, y, 0.1, -0.18, 0.06, 0.05));   // 鼻翼
      h -= 0.03 * g(x, y, 0, -0.31, 0.08, 0.03);                                           // 人中
      h += 0.06 * (g(x, y, -0.43, -0.12, 0.2, 0.18) + g(x, y, 0.43, -0.12, 0.2, 0.18));   // 臉頰
      h += 0.05 * g(x, y, 0, -0.45, 0.2, 0.04);                                            // 上唇
      h += 0.06 * g(x, y, 0, -0.56, 0.18, 0.05);                                           // 下唇
      h -= 0.035 * g(x, y, 0, -0.505, 0.2, 0.015);                                         // 嘴縫
      h += 0.06 * g(x, y, 0, -0.86, 0.2, 0.1);                                             // 下巴
      return h;
    };
    // 用「一圈一圈」的橢圓網格，邊緣才會平滑
    const rings = 110, segs = 180, verts = [], index = [];
    for (let i = 0; i <= rings; i++) {
      const rho = (i / rings) * 0.995;
      for (let j = 0; j < segs; j++) {
        const th = j / segs * Math.PI * 2;
        const x = 0.95 * rho * Math.cos(th), y = 0.05 + 1.25 * rho * Math.sin(th);
        verts.push(x, y, height(x, y) || 0);
      }
    }
    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < segs; j++) {
        const a = i * segs + j, b = i * segs + (j + 1) % segs, c = a + segs, d = b + segs;
        index.push(a, c, b, b, c, d);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geom.setIndex(index);
    geom.computeVertexNormals();
    return geom;
  },
  resize() {
    if (!this.ok) return;
    const box = $('#mask-box');
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.render();
  },
  render() {
    if (!this.ok) return;
    const front = Math.cos(this.group.rotation.y) > 0;
    const label = $('#mask-label');
    if (!isUnlocked($('#c-mask'))) label.textContent = '這張臉是凸的還是凹的？先在右邊猜猜看';
    else label.textContent = front ? '目前看到：面具正面（真的凸出來）' : '目前看到：面具內側（其實是凹進去的！）';
    this.renderer.render(this.scene, this.camera);
  }
};

/* ---------- 1.3 網格鼓起 ---------- */
const OpArt = {
  cv: null, cx: 200, cy: 200, strength: 70, density: 20, guide: false,
  init() {
    this.cv = setupCanvas('opart-cv', 400, 400);
    onPointer(this.cv.c, (e, type) => {
      if (type === 'up') return;
      const p = pointerPos(this.cv, e);
      this.cx = p.x; this.cy = p.y;
      this.draw();
    });
    const fmt = v => `${v > 0 ? '+' : ''}${v}%（${v >= 0 ? '鼓起' : '凹陷'}）`;
    bindRange($('#opart-str'), $('#opart-str-out'), fmt, v => { this.strength = v; this.draw(); });
    bindRange($('#opart-den'), $('#opart-den-out'), v => `${v} × ${v}`, v => { this.density = v; this.draw(); });
    $('#opart-guide').addEventListener('click', e => { this.guide = !this.guide; e.currentTarget.classList.toggle('on', this.guide); this.draw(); });
    $('#opart-center').addEventListener('click', () => { this.cx = 200; this.cy = 200; this.draw(); });
    this.draw();
  },
  warp(px, py) {
    const dx = px - this.cx, dy = py - this.cy;
    const R = 150, f = this.strength / 100;
    const dist = Math.hypot(dx, dy);
    if (dist >= R) return [px, py];
    const n = dist / R;
    const s = f >= 0 ? 1 + f * Math.sin(Math.PI * (1 - n)) * 0.7 : 1 + f * Math.sin(Math.PI * n) * 0.7;
    return [this.cx + dx * s, this.cy + dy * s];
  },
  draw() {
    const { ctx, w, h } = this.cv;
    fillCanvas(this.cv, '#1d2433');
    const n = this.density, cw = w / n, ch = h / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#1d2433';
        // 每條邊切成 4 段，彎曲處才不會有鋸齒
        const x0 = i * cw, y0 = j * ch, x1 = x0 + cw, y1 = y0 + ch, S = 4;
        const path = [];
        for (let k = 0; k < S; k++) path.push([lerp(x0, x1, k / S), y0]);
        for (let k = 0; k < S; k++) path.push([x1, lerp(y0, y1, k / S)]);
        for (let k = 0; k < S; k++) path.push([lerp(x1, x0, k / S), y1]);
        for (let k = 0; k < S; k++) path.push([x0, lerp(y1, y0, k / S)]);
        ctx.beginPath();
        path.forEach(([px, py], k) => { const [qx, qy] = this.warp(px, py); if (k === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy); });
        ctx.closePath();
        ctx.fill();
      }
    }
    if (this.guide) {
      ctx.strokeStyle = '#ff3b5c'; ctx.lineWidth = 1.5;
      for (let i = 0; i <= n; i += 2) {
        ctx.beginPath(); ctx.moveTo(i * cw, 0); ctx.lineTo(i * cw, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * ch); ctx.lineTo(w, i * ch); ctx.stroke();
      }
    }
  }
};

/* ---------- 1.4 奈克方塊 ---------- */
const Necker = {
  cv: null, mode: 'none', count: 0, timer: null,
  init() {
    this.cv = setupCanvas('necker-cv', 240, 240);
    $$('[data-necker]').forEach(b => b.addEventListener('click', () => { this.mode = b.dataset.necker; this.draw(); }));
    const hit = $('#necker-hit'), res = $('#necker-result');
    $('#necker-start').addEventListener('click', e => {
      const startBtn = e.currentTarget;
      this.count = 0; this.mode = 'none'; this.draw();
      hit.disabled = false; startBtn.disabled = true;
      let left = 20;
      res.textContent = `剩下 ${left} 秒，翻了 0 次`;
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        left--;
        res.textContent = `剩下 ${left} 秒，翻了 ${this.count} 次`;
        if (left <= 0) {
          clearInterval(this.timer);
          hit.disabled = true; startBtn.disabled = false;
          res.textContent = `時間到！20 秒內你翻了 ${this.count} 次。每個人的速度都不一樣，跟同學比比看！`;
        }
      }, 1000);
    });
    hit.addEventListener('click', () => { this.count++; });
    this.draw();
  },
  draw() {
    const { ctx } = this.cv;
    fillCanvas(this.cv, '#f6f2ea');
    const s = 110, x1 = 45, y1 = 85, dx = 55, dy = -45;
    const F = { tl: [x1, y1], tr: [x1 + s, y1], bl: [x1, y1 + s], br: [x1 + s, y1 + s] };
    const B = {}; for (const k in F) B[k] = [F[k][0] + dx, F[k][1] + dy];
    const edges = [
      ['F', 'tl', 'F', 'tr'], ['F', 'tr', 'F', 'br'], ['F', 'br', 'F', 'bl'], ['F', 'bl', 'F', 'tl'],
      ['B', 'tl', 'B', 'tr'], ['B', 'tr', 'B', 'br'], ['B', 'br', 'B', 'bl'], ['B', 'bl', 'B', 'tl'],
      ['F', 'tl', 'B', 'tl'], ['F', 'tr', 'B', 'tr'], ['F', 'bl', 'B', 'bl'], ['F', 'br', 'B', 'br']
    ];
    // 被擋住的那個角
    const hidden = this.mode === 'A' ? ['B', 'bl'] : this.mode === 'B' ? ['F', 'tr'] : null;
    const P = { F, B };
    if (this.mode !== 'none') {
      const face = this.mode === 'A' ? F : B;
      ctx.fillStyle = this.mode === 'A' ? 'rgba(91,91,214,.22)' : 'rgba(39,174,96,.22)';
      ctx.fillRect(face.tl[0], face.tl[1], s, s);
    }
    ctx.lineCap = 'round';
    for (const [a, ka, b, kb] of edges) {
      const isHidden = hidden && ((a === hidden[0] && ka === hidden[1]) || (b === hidden[0] && kb === hidden[1]));
      ctx.setLineDash(isHidden ? [5, 6] : []);
      ctx.strokeStyle = isHidden ? '#b9b2a5' : '#1d2433';
      ctx.lineWidth = isHidden ? 2 : 3;
      ctx.beginPath(); ctx.moveTo(...P[a][ka]); ctx.lineTo(...P[b][kb]); ctx.stroke();
    }
    ctx.setLineDash([]);
  }
};

/* ---------- 1.5 紅藍立體 ---------- */
function initChromo() {
  $('#chromo-gray').addEventListener('click', e => {
    const on = $('#chromo-stage').classList.toggle('gray');
    e.currentTarget.textContent = on ? '🌈 恢復紅藍色' : '⚫ 轉成黑白';
  });
}

registerTab('space', {
  init() { Crater.init(); Mask.init(); OpArt.init(); Necker.init(); initChromo(); },
  show() { Mask.resize(); }
});
