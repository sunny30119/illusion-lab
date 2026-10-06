'use strict';
/* ============ 分頁 8：探究實驗（箭頭角度 vs 錯覺強度） ============ */

const Lab = {
  cv: null, chart: null, angle: 40, len: 200, data: {},
  init() {
    this.cv = setupCanvas('lab-cv', 520, 240);
    this.chart = setupCanvas('lab-chart', 420, 240);
    this.data = Store.data.lab || {};
    bindSeg($('#lab-angle'), v => { this.angle = +v; this.newTrial(); });
    bindRange($('#lab-len'), $('#lab-len-out'), v => v + ' px', v => { this.len = v; this.draw(); });
    $('#lab-record').addEventListener('click', () => this.record());
    $('#lab-clear').addEventListener('click', () => {
      if (!confirm('確定要清除所有實驗紀錄嗎？')) return;
      this.data = {}; this.save(); this.renderResults();
    });
    // 結論文字也記住，不怕重新整理
    ['claim', 'evidence', 'reason'].forEach(k => {
      const el = $('#lab-' + k);
      el.value = (Store.data.labText || {})[k] || '';
      el.addEventListener('input', () => {
        Store.data.labText = Store.data.labText || {};
        Store.data.labText[k] = el.value;
        Store.save();
      });
    });
    this.newTrial();
    this.renderResults();
  },
  newTrial() {
    // 每次從隨機長度開始，避免受上一次影響
    this.len = 150 + Math.round(Math.random() * 120);
    $('#lab-len').value = this.len;
    $('#lab-len-out').textContent = this.len + ' px';
    this.draw();
  },
  save() { Store.data.lab = this.data; Store.save(); },
  record() {
    const err = (this.len - 200) / 200 * 100;
    (this.data[this.angle] = this.data[this.angle] || []).push(err);
    this.save();
    const n = Object.keys(this.data).filter(k => this.data[k].length).length;
    toast(`已記錄：${this.angle}° 誤差 ${err > 0 ? '+' : ''}${err.toFixed(1)}%`);
    if (n >= 3) awardStamp('lab', false);
    this.renderResults();
    this.newTrial();
  },
  draw() {
    const { ctx, w } = this.cv;
    fillCanvas(this.cv, '#fffdf8');
    ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e04f6f';
    drawFinLine(ctx, w / 2, 80, 200, 'out', 30, this.angle);
    ctx.strokeStyle = '#2f80ed';
    drawFinLine(ctx, w / 2, 170, this.len, 'none');
    ctx.fillStyle = '#5b6474'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`箭頭夾角 ${this.angle}°`, 12, 22);
  },
  renderResults() {
    const angles = [20, 40, 60, 90];
    const avg = a => { const d = this.data[a] || []; return d.length ? d.reduce((s, x) => s + x, 0) / d.length : null; };
    $('#lab-table tbody').innerHTML = angles.map(a => {
      const d = this.data[a] || [], m = avg(a);
      return `<tr><td>${a}°</td><td>${d.length}</td><td>${m === null ? '—' : (m > 0 ? '+' : '') + m.toFixed(1) + '%'}</td></tr>`;
    }).join('');
    // 長條圖
    const { ctx, w, h } = this.chart;
    fillCanvas(this.chart, '#ffffff');
    const vals = angles.map(avg);
    const maxAbs = Math.max(10, ...vals.filter(v => v !== null).map(Math.abs));
    const left = 46, right = 12, top = 16, bottom = 36;
    const zeroY = top + (h - top - bottom) / 2;
    const scale = (h - top - bottom) / 2 / maxAbs;
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1; ctx.fillStyle = '#5b6474'; ctx.font = '12px sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (const v of [maxAbs, maxAbs / 2, 0, -maxAbs / 2, -maxAbs]) {
      const y = zeroY - v * scale;
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(w - right, y); ctx.stroke();
      ctx.fillText(`${v > 0 ? '+' : ''}${v.toFixed(0)}%`, left - 6, y);
    }
    ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, zeroY); ctx.lineTo(w - right, zeroY); ctx.stroke();
    const bw = (w - left - right) / angles.length;
    ctx.textAlign = 'center';
    angles.forEach((a, i) => {
      const x = left + i * bw + bw / 2;
      ctx.fillStyle = '#1d2433'; ctx.textBaseline = 'top';
      ctx.fillText(`${a}°`, x, h - bottom + 10);
      const v = vals[i];
      if (v === null) return;
      ctx.fillStyle = '#27ae60';
      const y = zeroY - v * scale;
      ctx.fillRect(x - bw * 0.28, Math.min(y, zeroY), bw * 0.56, Math.max(2, Math.abs(y - zeroY)));
      ctx.fillStyle = '#1d2433'; ctx.textBaseline = v >= 0 ? 'bottom' : 'top';
      ctx.fillText(`${v > 0 ? '+' : ''}${v.toFixed(1)}`, x, v >= 0 ? y - 3 : y + 3);
    });
  }
};

registerTab('lab', { init() { Lab.init(); } });
