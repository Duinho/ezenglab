// 전자공학 110 전압·전류·저항 영상 장면. 장면표.md와 같은 장면 번호를 쓴다.
// 롱폼 무대 1920×920(진행자 오른쪽 아래 x 1700~, y 880~ 비움), 쇼츠 무대 860×680(쇼츠 배치 4판, 가로 가운데 x 430).
// 쇼츠에 쓰는 장면: L04~L06, L11, L12, L15, S1E, S2A, S2E, S3A, S3E. 나머지는 롱폼 전용.
// 색: 전압 빨강, 전류 파랑, 저항 주황(원고 그림과 같음).

const VC = COLOR.red, IC = COLOR.blue, RC = COLOR.orange;
// 페이퍼로지에 없는 기호(Ω, ρ, ⎓)는 글자 대신 도형으로 그린다(글꼴은 페이퍼로지만).
const OM = `<svg viewBox="0 0 100 100" style="height:.74em;width:.74em;vertical-align:-.02em;overflow:visible"><path d="M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92" fill="none" stroke="currentColor" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const RHO = `<svg viewBox="0 0 100 100" style="height:.74em;width:.62em;vertical-align:-.2em;overflow:visible"><path d="M 30 112 L 30 52 A 26 26 0 1 1 30 54" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round"/></svg>`;
const DC = `<svg viewBox="0 0 100 60" style="height:.42em;width:.8em;vertical-align:.12em"><line x1="6" y1="14" x2="94" y2="14" stroke="currentColor" stroke-width="10" stroke-linecap="round"/><path d="M 6 46 H 26 M 40 46 H 60 M 74 46 H 94" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>`;
function svgGlyph(svg, kind, cx, cy, size, color) {          // SVG 안에 Ω 그리기
  const k = size / 100, g = el('g', { transform: `translate(${cx - size / 2} ${cy - size / 2}) scale(${k})` }, svg);
  if (kind === 'Ω') el('path', { d: 'M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92', fill: 'none', stroke: color, 'stroke-width': 13, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  return g;
}


function tag(parent, x, y, w, html, color = COLOR.green) {
  const t = el('div', { class: 'abs center tagp', style: { left: x + 'px', top: y + 'px', width: w + 'px', background: color } }, parent);
  t.innerHTML = html; t.style.opacity = 0; return t;
}
function chip(parent, x, y, w, html, opt = {}) {
  const c = el('div', { class: 'abs center chipx', style: { left: x + 'px', top: y + 'px', width: w + 'px', borderColor: opt.color || COLOR.green, fontSize: (opt.size || 44) + 'px', color: opt.ink || COLOR.ink } }, parent);
  c.innerHTML = html; c.style.opacity = 0; return c;
}
function big(parent, y, html, size, opt = {}) {
  const b = el('div', { class: 'abs center big', style: { left: (opt.x || 0) + 'px', width: (opt.w ? opt.w + 'px' : '100%'), top: y + 'px', fontSize: size + 'px', color: opt.color || COLOR.ink } }, parent);
  b.innerHTML = html; b.style.opacity = 0; return b;
}
function lab(parent, x, y, w, html, size, opt = {}) {
  const d = el('div', { class: 'abs ' + (opt.cls || 'lb'), style: { left: x + 'px', top: y + 'px', width: w + 'px', fontSize: size + 'px', color: opt.color || COLOR.ink } }, parent);
  d.innerHTML = html; d.style.opacity = 0; return d;
}
function svgAt(parent, x, y, w, h, vb) {
  return el('svg', { class: 'abs', width: w, height: h, viewBox: vb || `0 0 ${w} ${h}`, style: { left: x + 'px', top: y + 'px' } }, parent);
}
// 카운트다운(멈춤 시간 동안 3·2·1)
function countdown(ctx, parent, x, y, size) {
  const c = el('div', { class: 'abs center count', style: { left: (x - 150) + 'px', width: '300px', top: y + 'px', fontSize: size + 'px', lineHeight: 1.1, opacity: 0 } }, parent);
  return t => { const h = t - ctx.audioDur, n = Math.round(ctx.dur - ctx.audioDur) - Math.floor(h); if (h > 0 && n >= 1) { const f = h % 1; c.textContent = n; c.style.opacity = 1 - f * .6; c.style.transform = `scale(${1.25 - f * .25})`; } else c.style.opacity = 0; };
}
// 세 단어 카드. kind: v·i·r
function wcard(parent, x, y, w, h, kind, name, en, body, rows, size, row) {
  const d = el('div', { class: 'abs wc ' + kind + (row ? ' row' : ''), style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } }, parent);
  d.innerHTML = `<div class="hd" style="font-size:${size}px">${name}${en ? `<small>${en}</small>` : ''}</div>`
    + `<div class="bd" style="font-size:${Math.round(size * .62)}px">${body}</div>`
    + rows.map(r => `<div class="rw" style="font-size:${Math.round(size * .5)}px"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
  d.style.opacity = 0; return d;
}

// 충전기(뒷면 표기 5V ⎓ 3A). 반환: 5V·3A 글자 노드
function charger(parent, x, y, w) {
  const h = w * 1.45, sv = svgAt(parent, x, y, w, h, '0 0 300 435');
  el('rect', { x: 92, y: 0, width: 26, height: 70, rx: 6, fill: '#9aa4b2' }, sv);
  el('rect', { x: 182, y: 0, width: 26, height: 70, rx: 6, fill: '#9aa4b2' }, sv);
  el('rect', { x: 20, y: 60, width: 260, height: 360, rx: 44, fill: '#fff', stroke: '#cfd8e3', 'stroke-width': 8 }, sv);
  el('rect', { x: 36, y: 200, width: 228, height: 90, rx: 18, fill: '#f2f5f9' }, sv);
  const v = el('text', { x: 86, y: 262, 'text-anchor': 'middle', 'font-size': 50, 'font-weight': 800, fill: COLOR.ink }, sv); v.textContent = '5V';
  el('line', { x1: 136, y1: 236, x2: 164, y2: 236, stroke: COLOR.sub, 'stroke-width': 4 }, sv); el('path', { d: 'M 136 246 H 142 M 147 246 H 153 M 158 246 H 164', stroke: COLOR.sub, 'stroke-width': 4 }, sv);
  const a = el('text', { x: 214, y: 262, 'text-anchor': 'middle', 'font-size': 50, 'font-weight': 800, fill: COLOR.ink }, sv); a.textContent = '3A';
  sv.style.opacity = 0; return { sv, v, a };
}

// 컵과 빨대(원고 v1). ①끌어올리는 힘 ②올라오는 음료 ③빨대 폭
function straw(parent, x, y, w) {
  const h = w * 1.55, sv = svgAt(parent, x, y, w, h, '0 0 300 465');
  el('circle', { cx: 150, cy: 52, r: 44, fill: '#f3d2bd', stroke: '#c9a28c', 'stroke-width': 4 }, sv);
  el('path', { d: 'M 34 210 L 266 210 L 236 450 L 64 450 Z', fill: '#f5f5f5', stroke: '#9aa4b2', 'stroke-width': 5, 'stroke-linejoin': 'round' }, sv);
  el('path', { d: 'M 41 268 L 259 268 L 236 450 L 64 450 Z', fill: '#d9b48f' }, sv);
  el('rect', { x: 138, y: 96, width: 24, height: 340, fill: '#fff', stroke: '#445066', 'stroke-width': 4 }, sv);
  el('rect', { x: 142, y: 160, width: 16, height: 274, fill: '#d9b48f' }, sv);
  const mk = (cx, cy, n, c) => { const g = el('g', {}, sv); el('circle', { cx, cy, r: 20, fill: c }, g); const t = el('text', { x: cx, y: cy + 9, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 800, fill: '#fff' }, g); t.textContent = n; return g; };
  const g1 = el('g', {}, sv); el('line', { x1: 222, y1: 150, x2: 222, y2: 76, stroke: VC, 'stroke-width': 8, 'stroke-linecap': 'round' }, g1);
  el('polygon', { points: '222,52 206,82 238,82', fill: VC }, g1); g1.appendChild(mk(262, 104, '1', VC));
  const g2 = el('g', {}, sv); el('line', { x1: 150, y1: 410, x2: 150, y2: 210, stroke: IC, 'stroke-width': 6, 'stroke-linecap': 'round' }, g2);
  el('polygon', { points: '150,186 139,212 161,212', fill: IC }, g2); g2.appendChild(mk(104, 330, '2', IC));
  const g3 = el('g', {}, sv); el('line', { x1: 98, y1: 130, x2: 202, y2: 130, stroke: RC, 'stroke-width': 6 }, g3);
  el('polygon', { points: '92,130 110,120 110,140', fill: RC }, g3); el('polygon', { points: '208,130 190,120 190,140', fill: RC }, g3);
  g3.appendChild(mk(64, 130, '3', RC));
  [g1, g2, g3].forEach(g => g.setAttribute('opacity', 0));
  sv.style.opacity = 0; return { sv, g: [g1, g2, g3] };
}
// 빨대 장면(L04~L06) 공통 배치: 그림 + 번호 목록 + (L05·L06) 답 칸
const SITEMS = [['끌어올리는 힘', VC, '전압'], ['올라오는 음료의 양', IC, '전류'], ['빨대가 좁은 정도', RC, '저항']];
function strawSet(ctx, withAns) {
  const L = ctx.long, s = ctx.stage, o = {};
  if (L) {
    o.st = straw(s, 260, 90, 470);
    o.li = SITEMS.map((it, i) => { const d = lab(s, withAns ? 830 : 900, 200 + i * 190, 620, `<span class="nb" style="background:${it[1]}">${i + 1}</span>${it[0]}`, 52, { cls: 'li' }); return d; });
    if (withAns) o.ans = SITEMS.map((it, i) => { const d = el('div', { class: 'abs ans', style: { left: '1440px', top: (186 + i * 190) + 'px', width: '260px', height: '104px', fontSize: '50px' } }, s); d.textContent = '?'; d.style.opacity = 0; return d; });
  } else {
    o.st = straw(s, 340, 36, 180);
    o.li = SITEMS.map((it, i) => lab(s, withAns ? 90 : 165, 340 + i * 112, withAns ? 470 : 530, `<span class="nb" style="background:${it[1]}">${i + 1}</span>${it[0]}`, 40, { cls: 'li' }));
    if (withAns) o.ans = SITEMS.map((it, i) => { const d = el('div', { class: 'abs ans', style: { left: '590px', top: (326 + i * 112) + 'px', width: '180px', height: '84px', fontSize: '40px' } }, s); d.textContent = '?'; d.style.opacity = 0; return d; });
  }
  return o;
}

// 전선 속 알갱이(전하)가 흐르는 관. n개, 속도 v(px/초)
function tube(svg, x, y, w, h, n, v, seed) {
  el('rect', { x, y, width: w, height: h, rx: h / 2, fill: '#eef3fb', stroke: IC, 'stroke-width': 5 }, svg);
  const dots = [];
  for (let i = 0; i < n; i++) {
    const r = Math.sin(seed * 97 + i * 13.7) * .5 + .5;
    dots.push({ x0: (i + r * .6) / n * (w - 60), y: y + h * (.28 + .44 * ((Math.sin(seed * 31 + i * 7.3) * .5) + .5)), c: el('circle', { r: Math.min(14, h * .13), fill: IC }, svg) });
  }
  return t => dots.forEach(d => { const xx = ((d.x0 + v * t) % (w - 60) + (w - 60)) % (w - 60); d.c.setAttribute('cx', x + 30 + xx); d.c.setAttribute('cy', d.y); });
}

// 건전지(세로). + 위, − 아래. 반환: sv, plus, minus 노드
function battery(parent, x, y, w, label) {
  const h = w * 2, sv = svgAt(parent, x, y, w, h, '0 0 200 400');
  el('rect', { x: 70, y: 10, width: 60, height: 30, rx: 8, fill: '#9aa4b2' }, sv);
  el('rect', { x: 20, y: 36, width: 160, height: 350, rx: 30, fill: '#fff', stroke: COLOR.ink, 'stroke-width': 8 }, sv);
  el('rect', { x: 28, y: 44, width: 144, height: 120, rx: 22, fill: '#f6dbe0' }, sv);
  const p = el('text', { x: 100, y: 128, 'text-anchor': 'middle', 'font-size': 84, 'font-weight': 800, fill: VC }, sv); p.textContent = '+';
  const m = el('text', { x: 100, y: 352, 'text-anchor': 'middle', 'font-size': 84, 'font-weight': 800, fill: COLOR.sub }, sv); m.textContent = '−';
  let tx = null;
  if (label) { tx = el('text', { x: 100, y: 250, 'text-anchor': 'middle', 'font-size': 52, 'font-weight': 800, fill: COLOR.ink }, sv); tx.textContent = label; }
  sv.style.opacity = 0; return { sv, p, m, tx };
}

// 비탈(원고 v3). 높이 hh(0~1), 공이 위에서 아래로 굴러감
function slope(parent, x, y, w, h, hh) {
  const sv = svgAt(parent, x, y, w, h, '0 0 400 330');
  const top = 300 - 250 * hh;
  el('line', { x1: 10, y1: 300, x2: 390, y2: 300, stroke: '#9aa4b2', 'stroke-width': 4 }, sv);
  el('path', { d: `M 40 300 L 40 ${top} L 110 ${top} L 360 300 Z`, fill: '#f6dbe0', stroke: VC, 'stroke-width': 5, 'stroke-linejoin': 'round' }, sv);
  el('line', { x1: 110, y1: top, x2: 380, y2: top, stroke: VC, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, sv);
  const p = el('text', { x: 16, y: top + 12, 'font-size': 36, 'font-weight': 800, fill: VC }, sv); p.textContent = '+';
  const m = el('text', { x: 368, y: 290, 'font-size': 36, 'font-weight': 800, fill: COLOR.sub }, sv); m.textContent = '−';
  const ball = el('circle', { r: 20, fill: IC }, sv);
  const pos = u => { const k = E.clamp(u); if (k < .15) return [70 + 260 * k, top - 20]; const q = (k - .15) / .85; return [110 + q * 230, top + q * (300 - top) - 20]; };
  sv.style.opacity = 0;
  return { sv, roll(u) { const [bx, by] = pos(u); ball.setAttribute('cx', bx); ball.setAttribute('cy', by); } };
}

// 회로 고리(사각형). 왼쪽 건전지(+ 위), 위쪽 저항. 반환 sv 와 둘레 점 함수
function loop(svg, x0, y0, x1, y1, opt = {}) {
  const g = el('g', {}, svg), ink = COLOR.ink, my = (y0 + y1) / 2, mx = (x0 + x1) / 2;
  const wire = (a, b, c, d) => el('line', { x1: a, y1: b, x2: c, y2: d, stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  wire(x0, y0, mx - 70, y0); wire(mx + 70, y0, x1, y0); wire(x1, y0, x1, y1);
  if (!opt.gapBottom) wire(x1, y1, x0, y1); else { wire(x1, y1, mx + 50, y1); wire(mx - 50, y1, x0, y1); }
  wire(x0, y1, x0, my + 18); wire(x0, my - 18, x0, y0);
  el('line', { x1: x0 - 40, y1: my - 18, x2: x0 + 40, y2: my - 18, stroke: ink, 'stroke-width': 7 }, g);
  el('line', { x1: x0 - 22, y1: my + 18, x2: x0 + 22, y2: my + 18, stroke: ink, 'stroke-width': 12 }, g);
  const pl = el('text', { x: x0 + 34, y: my - 30, 'font-size': 34, 'font-weight': 800, fill: VC }, g); pl.textContent = '+';
  const mn = el('text', { x: x0 + 34, y: my + 58, 'font-size': 34, 'font-weight': 800, fill: COLOR.sub }, g); mn.textContent = '−';
  let d = `M ${mx - 70} ${y0}`; for (let i = 0; i < 6; i++) d += ` L ${mx - 70 + 11.7 + i * 23.3} ${y0 + (i % 2 ? 18 : -18)}`; d += ` L ${mx + 70} ${y0}`;
  el('path', { d, fill: 'none', stroke: ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  return g;
}
function meter(svg, cx, cy, r, ch, color) {
  const g = el('g', {}, svg);
  el('circle', { cx, cy, r, fill: '#fff', stroke: color, 'stroke-width': 6 }, g);
  if (ch === 'Ω') { svgGlyph(g, 'Ω', cx, cy + 2, r * .95, color); return g; }
  const t = el('text', { x: cx, y: cy + r * .36, 'text-anchor': 'middle', 'font-size': r, 'font-weight': 800, fill: color }, g); t.textContent = ch;
  return g;
}
function wireLine(svg, pts, color, wd = 5) { return el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: color, 'stroke-width': wd, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg); }
function zig(svg, x, y, w, color, wd = 6) {
  let d = `M ${x} ${y}`; for (let i = 0; i < 6; i++) d += ` L ${x + w / 12 + i * w / 6} ${y + (i % 2 ? 18 : -18)}`; d += ` L ${x + w} ${y}`;
  return el('path', { d, fill: 'none', stroke: color, 'stroke-width': wd, 'stroke-linejoin': 'round' }, svg);
}
function grow(node, u) { node.setAttribute('opacity', E.clamp(u * 2)); }

// 길이·굵기·재질 막대(원고 v5)
function rodSet(ctx, s, L) {
  const R = [];
  const rows = [['길이', [['짧은 선', .35, 40, '#f5c08a', RC], ['긴 선', 1, 40, '#f5c08a', RC]]],
    ['굵기', [['굵은 선', .62, 78, '#f5c08a', RC], ['가는 선', .62, 22, '#f5c08a', RC]]],
    ['재질', [['구리', .62, 48, '#dfa064', '#b8712e'], ['고무', .62, 48, '#4a4a4a', '#222']]]];
  rows.forEach((r, i) => {
    const o = {};
    if (L) {
      const y = 130 + i * 250;
      o.h = lab(s, 150, y + 34, 200, r[0], 64, { color: RC });
      o.it = r[1].map((it, j) => {
        const x = j ? 1060 : 400, w = 420 * it[1];
        const sv = svgAt(s, x, y, 440, 120); el('rect', { x: 4, y: 60 - it[2] / 2, width: w, height: it[2], rx: it[2] / 2, fill: it[3], stroke: it[4], 'stroke-width': 5 }, sv); sv.style.opacity = 0;
        const c = lab(s, x, y + 124, w + 8, it[0], 38, { cls: 'note' });
        return { sv, c };
      });
      o.tg = [chip(s, 800, y + 30, 220, '저항 작음', { size: 38, color: IC }), chip(s, 1460, y + 30, 220, '저항 큼', { size: 38, color: VC })];
    } else {
      const y = 82 + i * 190;
      o.h = lab(s, 0, y, 860, r[0], 44, { color: RC });
      o.it = r[1].map((it, j) => {
        const x = j ? 470 : 40, w = 330 * it[1];
        const sv = svgAt(s, x, y + 50, 350, 90); el('rect', { x: (350 - w) / 2, y: 45 - it[2] * .8 / 2, width: w, height: it[2] * .8, rx: it[2] * .4, fill: it[3], stroke: it[4], 'stroke-width': 4 }, sv); sv.style.opacity = 0;
        const c = lab(s, x, y + 140, 350, `${it[0]} · <b style="color:${j ? VC : IC}">저항 ${j ? '큼' : '작음'}</b>`, 32, { cls: 'note' });
        return { sv, c };
      });
      o.tg = [];
    }
    R.push(o);
  });
  return R;
}

const SCENES = {
  // ───────── L01 여는 질문: 충전기 숫자 ─────────
  L01: {
    init(ctx) {
      const s = ctx.stage;
      this.ch = charger(s, 470, 120, 400);
      this.q = el('div', { class: 'abs qbig', style: { left: '960px', top: '150px', width: '170px', height: '170px', fontSize: '120px' } }, s); this.q.textContent = '?'; this.q.style.opacity = 0;
      this.ti = big(s, 450, '<span class="vr">전압</span>·<span class="ir">전류</span>·<span class="rr">저항</span>', 110, { x: 940, w: 760 });
      this.sb = lab(s, 940, 610, 760, '전기를 이해하는 세 단어', 48, { cls: 'note' });
      this.t = { ch: .1, n: ctx.w('숫자가') - .1, q: ctx.w('무슨') - .1, ti: ctx.w('단어') - .3 };
    },
    frame(ctx, t) {
      show(this.ch.sv, E.prog(t, this.t.ch, .45), 30);
      const k = E.clamp(Math.sin(E.clamp((t - this.t.n) / .8) * Math.PI));
      [this.ch.v, this.ch.a].forEach(n => { n.setAttribute('fill', k > .3 ? COLOR.orange : COLOR.ink); });
      pop(this.q, E.prog(t, this.t.q, .45), .5);
      pop(this.ti, E.prog(t, this.t.ti, .45), .8); show(this.sb, E.prog(t, this.t.ti + .3, .4), 16);
    },
  },
  L02: INTRO,
  // ───────── L03 세 단어 한 줄씩 ─────────
  L03: {
    init(ctx) {
      const s = ctx.stage;
      const C = [['v', '전압', '전기를<br>미는 힘'], ['i', '전류', '실제로 흐르는<br>전기의 양'], ['r', '저항', '흐름을<br>막는 정도']];
      this.c = C.map((c, i) => wcard(s, 200 + i * 540, 200, 440, 460, c[0], c[1], '', c[2], [], 76));
      this.hd = lab(s, 0, 70, 1920, '세 단어를 한 줄씩', 56, { color: COLOR.green });
      this.t = { c: [ctx.w('전압은') - .1, ctx.w('전류는') - .1, ctx.w('저항은') - .1], sh: ctx.w('헷갈리는') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, .05, .4), 12);
      const sh = E.prog(t, this.t.sh, .9);
      this.c.forEach((c, i) => { c.dataset.base = `rotate(${Math.sin(sh * Math.PI * 4 + i) * 3 * Math.sin(sh * Math.PI)}deg)`; pop(c, E.prog(t, this.t.c[i], .45), .8); });
    },
  },
  // ───────── L04 빨대로 마실 때 (쇼츠 S1) ─────────
  L04: {
    init(ctx) {
      this.o = strawSet(ctx, false);
      this.t = { st: Math.min(ctx.w('빨대로') - .1, .3), g: [ctx.w('끌어올리는') - .1, ctx.w('음료의') - .1, ctx.w('좁은지') - .3] };
    },
    frame(ctx, t) {
      show(this.o.st.sv, E.prog(t, this.t.st, .45), 30);
      this.t.g.forEach((a, i) => { grow(this.o.st.g[i], E.prog(t, a, .35)); show(this.o.li[i], E.prog(t, a, .4), 20); });
    },
  },
  // ───────── L05 전기에서는? (쇼츠 S1) ─────────
  L05: {
    init(ctx) {
      this.o = strawSet(ctx, true);
      this.o.st.sv.style.opacity = 1; this.o.st.g.forEach(g => g.setAttribute('opacity', 1)); this.o.li.forEach(d => d.style.opacity = 1);
      this.cd = ctx.long ? countdown(ctx, ctx.stage, 1570, 690, 120) : countdown(ctx, ctx.stage, 690, 60, 110);
    },
    frame(ctx, t) { this.o.ans.forEach((a, i) => pop(a, E.prog(t, .1 + i * .15, .4), .7)); this.cd(t); },
  },
  // ───────── L06 정답 (쇼츠 S1) ─────────
  L06: {
    init(ctx) {
      this.o = strawSet(ctx, true);
      this.o.st.sv.style.opacity = 1; this.o.st.g.forEach(g => g.setAttribute('opacity', 1)); this.o.li.forEach(d => d.style.opacity = 1); this.o.ans.forEach(a => a.style.opacity = 1);
      this.t = [ctx.w('전압이에요') - .1, ctx.w('전류고요') - .1, ctx.w('저항이에요') - .1];
    },
    frame(ctx, t) {
      this.o.ans.forEach((a, i) => {
        const on = t >= this.t[i]; a.classList.toggle('on', on);
        a.textContent = on ? SITEMS[i][2] : '?'; a.style.background = on ? SITEMS[i][1] : '#fff'; a.style.borderColor = on ? SITEMS[i][1] : '#9aa4b2';
        a.style.transform = `scale(${1 + .12 * Math.sin(E.prog(t, this.t[i], .35) * Math.PI)})`;
      });
    },
  },
  // ───────── L07 이미 몸으로 알아요 ─────────
  L07: {
    init(ctx) {
      const s = ctx.stage, mk = (x, narrow, strong) => {
        const sv = svgAt(s, x, 90, 360, 520, '0 0 300 434');
        el('path', { d: 'M 40 160 L 260 160 L 232 420 L 68 420 Z', fill: '#f5f5f5', stroke: '#9aa4b2', 'stroke-width': 5 }, sv);
        el('path', { d: 'M 46 220 L 254 220 L 232 420 L 68 420 Z', fill: '#d9b48f' }, sv);
        const sw = narrow ? 10 : 30;
        el('rect', { x: 150 - sw / 2, y: 40, width: sw, height: 370, fill: '#fff', stroke: '#445066', 'stroke-width': 4 }, sv);
        el('line', { x1: 150, y1: 380, x2: 150, y2: 70, stroke: IC, 'stroke-width': narrow ? 3 : 14, 'stroke-linecap': 'round' }, sv);
        el('line', { x1: 222, y1: 130, x2: 222, y2: strong ? 30 : 70, stroke: VC, 'stroke-width': strong ? 14 : 6, 'stroke-linecap': 'round' }, sv);
        sv.style.opacity = 0; return sv;
      };
      this.a = mk(380, false, true); this.b = mk(1120, true, false);
      this.ca = chip(s, 260, 650, 600, '<b class="vr">세게</b> 빨면 → <b class="ir">많이</b>', { size: 50, color: VC });
      this.cb = chip(s, 1000, 650, 600, '<b class="rr">좁은</b> 빨대 → <b class="ir">적게</b>', { size: 50, color: RC });
      this.t = { a: ctx.w('세게') - .1, b: ctx.w('좁을수록') - .1 };
    },
    frame(ctx, t) { show(this.a, E.prog(t, this.t.a, .4), 24); pop(this.ca, E.prog(t, this.t.a + .2, .4), .8); show(this.b, E.prog(t, this.t.b, .4), 24); pop(this.cb, E.prog(t, this.t.b + .2, .4), .8); },
  },
  // ───────── L08 전기가 흐른다는 것 ─────────
  L08: {
    init(ctx) {
      const s = ctx.stage;
      this.sv = svgAt(s, 0, 0, 1920, 920); this.sv.style.opacity = 0;
      this.flow = tube(this.sv, 260, 380, 1400, 200, 14, 260, 3);
      this.hd = lab(s, 0, 50, 1920, '전선 속을 들여다보면', 54, { color: IC });
      this.lbl = chip(s, 330, 170, 300, '<b class="ir">전하</b>', { size: 54, color: IC });
      this.ln = el('line', { x1: 480, y1: 290, x2: 480, y2: 400, stroke: IC, 'stroke-width': 4, 'stroke-dasharray': '8 8', opacity: 0 }, this.sv);
      this.dir = chip(s, 1180, 180, 480, '흐르는 방향 →', { size: 48, color: IC, ink: IC });
      this.cap = lab(s, 260, 640, 1400, '알갱이가 한쪽으로 움직이면 = <b style="color:#3b6fb6">전기가 흐른다</b>', 50, { cls: 'note' });
      this.t = { a: ctx.w('알갱이가') - .1, l: ctx.w('전하라고') - .1, m: ctx.w('움직이는') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, .05, .4), 12); this.hd.style.opacity *= 1 - E.prog(t, this.t.l - .4, .3);
      this.sv.style.opacity = E.ease(E.prog(t, this.t.a, .4));
      this.flow(Math.max(0, t - this.t.m) * 1);
      pop(this.lbl, E.prog(t, this.t.l, .4), .7); this.ln.setAttribute('opacity', E.prog(t, this.t.l, .3));
      pop(this.dir, E.prog(t, this.t.m, .4), .8); show(this.cap, E.prog(t, this.t.m + .5, .4), 16);
    },
  },
  // ───────── L09 전류 = 1초에 지나가는 양 ─────────
  L09: {
    init(ctx) {
      const s = ctx.stage;
      this.sv = svgAt(s, 0, 0, 1920, 920);
      this.ga = el('g', { opacity: 0 }, this.sv); this.gb = el('g', { opacity: 0 }, this.sv);
      this.fa = tube(this.ga, 180, 180, 1120, 150, 4, 170, 5);
      this.fb = tube(this.gb, 180, 520, 1120, 150, 14, 170, 9);
      this.cut = el('line', { x1: 740, y1: 140, x2: 740, y2: 710, stroke: COLOR.teal, 'stroke-width': 5, 'stroke-dasharray': '14 10', opacity: 0 }, this.sv);
      this.ct = lab(s, 440, 60, 600, '여기를 1초에 몇 개 지나갈까?', 40, { color: COLOR.teal });
      this.la = lab(s, 1340, 205, 360, '<small>적게 지나간다</small>전류가 작다', 54, { color: IC });
      this.lb = lab(s, 1340, 545, 360, '<small>많이 지나간다</small>전류가 크다', 54, { color: IC });
      this.t = { w: ctx.w('전선의') - .1, c: ctx.eq('한') - .1, m: ctx.w('많이') - .1, f: ctx.w('적게') - .1 };
    },
    frame(ctx, t) {
      const u = E.ease(E.prog(t, this.t.w, .4)); this.ga.setAttribute('opacity', u); this.gb.setAttribute('opacity', u);
      this.fa(t); this.fb(t);
      this.cut.setAttribute('opacity', E.prog(t, this.t.c, .3)); show(this.ct, E.prog(t, this.t.c, .4), 14);
      pop(this.lb, E.prog(t, this.t.m, .4), .8); pop(this.la, E.prog(t, this.t.f, .4), .8);
    },
  },
  // ───────── L10 전류의 단위 ─────────
  L10: {
    init(ctx) {
      const s = ctx.stage;
      this.cd = wcard(s, 220, 120, 560, 620, 'i', '전류', 'Current', '1초 동안 흐르는<br>전기의 양', [['단위', 'A(암페어)'], ['식에 쓰는 기호', 'I']], 80);
      this.rw = [...this.cd.querySelectorAll('.rw')]; this.rw.forEach(r => r.style.opacity = 0);
      this.cv = lab(s, 900, 170, 800, '<small>작은 회로에서는 mA</small>1A = 1,000mA', 84, { color: IC });
      this.ar = chip(s, 940, 500, 720, '아두이노 우노 핀 하나 · <b class="ir">20mA</b> 정도', { size: 46, color: IC });
      this.t = { c: .1, u: ctx.w('암페어') - .1, s: ctx.w('아이로') - .1, m: ctx.w('밀리암페어를') - .1, a: ctx.w('아두이노') - .1 };
    },
    frame(ctx, t) {
      pop(this.cd, E.prog(t, this.t.c, .45), .85);
      show(this.rw[0], E.prog(t, this.t.u, .35), 12); show(this.rw[1], E.prog(t, this.t.s, .35), 12);
      pop(this.cv, E.prog(t, this.t.m, .45), .8); pop(this.ar, E.prog(t, this.t.a, .45), .8);
    },
  },
  // ───────── L11 전압은 높이 차이 (쇼츠 S2) ─────────
  L11: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      if (L) {
        this.a = slope(s, 220, 90, 680, 560, .35); this.b = slope(s, 1000, 90, 680, 560, 1);
        this.la = lab(s, 220, 670, 680, '<small>높이 차가 작다</small>전압이 낮다', 56, { color: VC });
        this.lb = lab(s, 1000, 670, 680, '<small>높이 차가 크다</small>전압이 높다', 56, { color: VC });
      } else {
        this.a = slope(s, 40, 60, 380, 314, .35); this.b = slope(s, 440, 60, 380, 314, 1);
        this.la = lab(s, 40, 420, 380, '<small>높이 차가 작다</small>전압이 낮다', 44, { color: VC });
        this.lb = lab(s, 440, 420, 380, '<small>높이 차가 크다</small>전압이 높다', 44, { color: VC });
      }
      this.t = { s: Math.min(.2, ctx.w('높이') - .1), a: ctx.w('높은') - .1, b: ctx.w('클수록') - .1 };
    },
    frame(ctx, t) {
      show(this.a.sv, E.prog(t, this.t.s, .4), 24); show(this.b.sv, E.prog(t, this.t.s + .15, .4), 24);
      const ra = t < this.t.a ? 0 : ((t - this.t.a) % 2.6) / 1.8, rb = t < this.t.b ? 0 : ((t - this.t.b) % 1.8) / .9;
      this.a.roll(ra); this.b.roll(rb);
      show(this.la, E.prog(t, this.t.a, .4), 16); show(this.lb, E.prog(t, this.t.b, .4), 16);
    },
  },
  // ───────── L12 전압은 두 지점 사이 (쇼츠 S2) ─────────
  L12: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      if (L) {
        this.bt = battery(s, 430, 70, 330, '1.5V');
        this.sv = svgAt(s, 800, 100, 200, 700);
        this.vl = lab(s, 820, 380, 220, '1.5V', 70, { color: VC });
        this.cd = wcard(s, 1080, 150, 560, 560, 'v', '전압', 'Voltage', '두 지점 사이의<br>높이 차이', [['단위', 'V(볼트)'], ['식에 쓰는 기호', 'V']], 80);
        this.arr = arrow(this.sv, 40, 640, 40, 50, VC, 9);
      } else {
        this.bt = battery(s, 70, 30, 200, '1.5V');
        this.sv = svgAt(s, 280, 40, 120, 420);
        this.vl = lab(s, 318, 216, 110, '1.5V', 40, { color: VC });
        this.cd = wcard(s, 430, 40, 360, 400, 'v', '전압', '', '두 지점 사이의<br>높이 차이', [['단위', 'V(볼트)'], ['기호', 'V']], 62);
        this.arr = arrow(this.sv, 24, 390, 24, 20, VC, 7);
        this.ex = lab(s, 0, 500, 860, '+극과 −극 사이의 차이 = <b style="color:#d24a5a">1.5V</b>', 42, { cls: 'note' });
      }
      this.t = { b: Math.min(.2, ctx.w('꼭') - .1), d: ctx.eq('두') - .1, h: ctx.w('높이') - .1, c: ctx.eq('볼트') - .1 };
    },
    frame(ctx, t) {
      show(this.bt.sv, E.prog(t, this.t.b, .4), 24);
      const k = Math.sin(E.prog(t, this.t.d, .7) * Math.PI);
      [this.bt.p, this.bt.m].forEach(n => n.setAttribute('transform', `translate(${100 * (1 - (1 + .25 * k))} ${(n === this.bt.p ? 100 : 324) * (1 - (1 + .25 * k))}) scale(${1 + .25 * k})`));
      this.arr(E.prog(t, this.t.h, .6)); show(this.vl, E.prog(t, this.t.h + .4, .35), 12);
      if (this.ex) show(this.ex, E.prog(t, this.t.h + .4, .4), 14);
      pop(this.cd, E.prog(t, this.t.c, .45), .85);
    },
  },
  // ───────── L13 주변에서 만나는 전압 ─────────
  L13: {
    init(ctx) {
      const s = ctx.stage, X0 = 700, PX = 300;            // 1V에서 시작, 10배마다 300px
      const R = [['AA 건전지', 1.5, '1.5V'], ['아두이노 3.3V 핀', 3.3, '3.3V'], ['USB · 아두이노 5V 핀', 5, '5V'], ['가정용 콘센트', 220, '220V']];
      this.sv = svgAt(s, 0, 0, 1920, 920);
      el('line', { x1: X0, y1: 90, x2: X0, y2: 700, stroke: '#9aa4b2', 'stroke-width': 4 }, this.sv);
      el('line', { x1: X0, y1: 700, x2: X0 + 3 * PX + 20, y2: 700, stroke: '#9aa4b2', 'stroke-width': 4 }, this.sv);
      ['1V', '10V', '100V', '1000V'].forEach((v, i) => { el('line', { x1: X0 + i * PX, y1: 700, x2: X0 + i * PX, y2: 716, stroke: '#9aa4b2', 'stroke-width': 4 }, this.sv); const tx = el('text', { x: X0 + i * PX, y: 756, 'text-anchor': 'middle', 'font-size': 32, 'font-weight': 600, fill: COLOR.sub }, this.sv); tx.textContent = v; });
      const nt = el('text', { x: X0 + 1.5 * PX, y: 806, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 600, fill: COLOR.sub }, this.sv); nt.textContent = '눈금이 한 칸 갈 때마다 10배씩 커져요';
      this.rows = R.map((r, i) => {
        const y = 120 + i * 145, w = Math.log10(r[1]) * PX;
        const n = lab(s, 160, y + 16, 510, r[0], 44, { cls: 'bn' });
        const bar = el('rect', { x: X0, y, width: 0, height: 96, rx: 10, fill: i === 3 ? VC : '#e88f9a' }, this.sv);
        const v = lab(s, X0 + w + 24, y + 18, 220, r[2], 50, { cls: 'bv' });
        return { n, bar, v, w };
      });
      this.wn = chip(s, 1240, 420, 420, '실습 대상 아님', { size: 42, color: VC, ink: VC });
      this.t = [ctx.w('에이에이') - .1, ctx.w('아두이노의') - .1, ctx.w('유에스비와') - .1, ctx.w('우리나라') - .1];
      this.tw = ctx.w('실습') - .1;
    },
    frame(ctx, t) {
      this.rows.forEach((r, i) => { const u = E.ease(E.prog(t, this.t[i], .6)); show(r.n, E.prog(t, this.t[i], .3), 10); r.bar.setAttribute('width', Math.max(0.01, r.w * u)); show(r.v, E.prog(t, this.t[i] + .4, .3), 8); });
      pop(this.wn, E.prog(t, this.tw, .4), .7);
    },
  },
  // ───────── L14 저항 ─────────
  L14: {
    init(ctx) {
      const s = ctx.stage;
      this.cd = wcard(s, 220, 170, 560, 520, 'r', '저항', 'Resistance', '흐름을<br>막는 정도', [], 84);
      this.sv = svgAt(s, 900, 180, 820, 520); this.sv.style.opacity = 0;
      el('rect', { x: 20, y: 60, width: 320, height: 90, rx: 45, fill: '#eef3fb', stroke: COLOR.sub, 'stroke-width': 5 }, this.sv);
      el('line', { x1: 60, y1: 105, x2: 290, y2: 105, stroke: IC, 'stroke-width': 30, 'stroke-linecap': 'round' }, this.sv);
      el('rect', { x: 20, y: 330, width: 760, height: 36, rx: 18, fill: '#eef3fb', stroke: COLOR.sub, 'stroke-width': 5 }, this.sv);
      el('line', { x1: 50, y1: 348, x2: 750, y2: 348, stroke: IC, 'stroke-width': 6, 'stroke-linecap': 'round' }, this.sv);
      this.la = lab(s, 1280, 240, 400, '짧고 넓은 빨대<br><b style="color:#3b6fb6">마시기 쉬움</b>', 42, { cls: 'note' });
      this.lb = lab(s, 920, 580, 760, '좁고 긴 빨대 → <b style="color:#d24a5a">마시기 힘듦</b>', 42, { cls: 'note' });
      this.t = { c: .1, p: ctx.w('좁고') - .1 };
    },
    frame(ctx, t) { pop(this.cd, E.prog(t, this.t.c, .45), .85); show(this.sv, E.prog(t, this.t.p, .4), 20); show(this.la, E.prog(t, this.t.p + .2, .4), 12); show(this.lb, E.prog(t, this.t.p + .4, .4), 12); },
  },
  // ───────── L15 저항을 바꾸는 세 가지 (쇼츠 S3) ─────────
  L15: {
    init(ctx) {
      const L = ctx.long;
      this.hd = lab(ctx.stage, 0, 30, L ? 1920 : 860, '저항을 바꾸는 세 가지', L ? 52 : 36, { color: RC });
      this.R = rodSet(ctx, ctx.stage, L);
      this.t = {
        row: [ctx.w('길이예요') - .1, ctx.w('굵기예요') - .1, ctx.w('재질이에요') - .1],
        it: [[ctx.w('길수록') - .1, ctx.w('길수록') + .2], [ctx.w('가늘수록') - .1, ctx.w('가늘수록') + .2], [ctx.w('구리처럼') - .1, ctx.w('고무처럼') - .1]],
        tg: [[ctx.w('커져요', 1) - .1, ctx.w('커져요', 1) - .1], [ctx.w('커져요', 2) - .1, ctx.w('커져요', 2) - .1], [ctx.w('작고') - .1, ctx.w('아주') - .1]],
      };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, .05, .4), 12);
      this.R.forEach((r, i) => {
        show(r.h, E.prog(t, this.t.row[i], .35), 12);
        r.it.forEach((it, j) => { show(it.sv, E.prog(t, this.t.it[i][j], .4), 16); show(it.c, E.prog(t, ctx.long ? this.t.it[i][j] : this.t.tg[i][j], .35), 10); });
        r.tg.forEach((g, j) => pop(g, E.prog(t, this.t.tg[i][j], .4), .7));
      });
    },
  },
  // ───────── L16 식으로 쓰면 ─────────
  L16: {
    init(ctx) {
      const s = ctx.stage;
      this.hd = lab(s, 0, 30, 1920, '저항을 식으로 쓰면', 52, { color: RC });
      this.fx = lab(s, 0, 110, 1920, '<span class="rr">R</span> = ' + RHO + ' × L ÷ A', 150, { cls: 'fx' });
      const G = [[RHO + '(로)', '재질마다 정해진 값'], ['L', '길이'], ['A', '단면적']];
      this.g = G.map((g, i) => chip(s, 200 + i * 520, 400, 480, `<b style="color:#e0701b">${g[0]}</b>  ${g[1]}`, { size: 46, color: RC }));
      this.fn = big(s, 620, '길면 저항 <span class="vr">↑</span>　·　굵으면 저항 <span class="ir">↓</span>', 64);
      this.t = { f: ctx.w('알은') - .1, g: [ctx.w('로는') - .1, ctx.w('엘은') - .1, ctx.w('에이는') - .1], n: ctx.w('길면') - .1 };
    },
    frame(ctx, t) { show(this.hd, E.prog(t, .05, .4), 12); pop(this.fx, E.prog(t, this.t.f, .45), .85); this.g.forEach((g, i) => pop(g, E.prog(t, this.t.g[i], .4), .75)); show(this.fn, E.prog(t, this.t.n, .4), 18); },
  },
  // ───────── L17 저항의 단위와 쓰임 ─────────
  L17: {
    init(ctx) {
      const s = ctx.stage;
      this.cd = wcard(s, 220, 120, 560, 620, 'r', '저항', 'Resistance', '흐름을<br>막는 정도', [['단위', OM + '(옴)'], ['식에 쓰는 기호', 'R']], 80);
      this.rw = [...this.cd.querySelectorAll('.rw')]; this.rw.forEach(r => r.style.opacity = 0);
      this.cv = lab(s, 900, 130, 800, '1,000' + OM + ' = 1k' + OM, 90, { color: RC });
      this.sv = svgAt(s, 960, 330, 680, 420); this.sv.style.opacity = 0;
      wireLine(this.sv, [[80, 200], [80, 60], [230, 60]], COLOR.ink, 6); zig(this.sv, 230, 60, 160, RC, 7); wireLine(this.sv, [[390, 60], [600, 60], [600, 200]], COLOR.ink, 6);
      wireLine(this.sv, [[80, 240], [80, 360], [600, 360], [600, 330]], COLOR.ink, 6);
      el('line', { x1: 40, y1: 200, x2: 120, y2: 200, stroke: COLOR.ink, 'stroke-width': 7 }, this.sv); el('line', { x1: 58, y1: 240, x2: 102, y2: 240, stroke: COLOR.ink, 'stroke-width': 12 }, this.sv);
      el('polygon', { points: '570,200 630,200 600,250', fill: VC }, this.sv); el('line', { x1: 568, y1: 252, x2: 632, y2: 252, stroke: VC, 'stroke-width': 7 }, this.sv);
      wireLine(this.sv, [[600, 252], [600, 330]], COLOR.ink, 6);
      const t1 = el('text', { x: 310, y: 130, 'text-anchor': 'middle', 'font-size': 38, 'font-weight': 800, fill: RC }, this.sv); t1.textContent = '저항';
      const t2 = el('text', { x: 520, y: 236, 'text-anchor': 'end', 'font-size': 38, 'font-weight': 800, fill: VC }, this.sv); t2.textContent = 'LED';
      this.t = { c: .1, u: ctx.w('옴이고') - .1, s: ctx.w('알로') - .1, k: ctx.eq('천') - .1, l: ctx.w('엘이디에') - .1 };
    },
    frame(ctx, t) {
      pop(this.cd, E.prog(t, this.t.c, .45), .85);
      show(this.rw[0], E.prog(t, this.t.u, .35), 12); show(this.rw[1], E.prog(t, this.t.s, .35), 12);
      pop(this.cv, E.prog(t, this.t.k, .45), .8); show(this.sv, E.prog(t, this.t.l, .45), 20);
    },
  },
  // ───────── L18 세 단어 한눈에(원고 v6) ─────────
  L18: {
    init(ctx) {
      const s = ctx.stage;
      const C = [['v', '전압', 'Voltage', '전기를 미는 힘<br>(두 지점의 높이 차이)', 'V(볼트)', 'V'], ['i', '전류', 'Current', '1초 동안 흐르는<br>전기의 양', 'A(암페어)', 'I'], ['r', '저항', 'Resistance', '흐름을<br>막는 정도', OM + '(옴)', 'R']];
      this.hd = lab(s, 0, 32, 1920, '세 단어 한눈에', 54, { color: COLOR.green });
      this.c = C.map((c, i) => wcard(s, 180 + i * 540, 110, 480, 640, c[0], c[1], c[2], c[3], [['단위', c[4]], ['식에 쓰는 기호', c[5]]], 74));
      this.t = [ctx.w('전압은') - .1, ctx.w('전류는') - .1, ctx.w('저항은') - .1];
    },
    frame(ctx, t) { show(this.hd, E.prog(t, .05, .4), 12); this.c.forEach((c, i) => pop(c, E.prog(t, this.t[i], .45), .8)); },
  },
  // ───────── L19 멀티미터: 전압 재기 ─────────
  L19: {
    init(ctx) { meterPanels(this, ctx); this.t = { p: ctx.w('멀티미터') - .1, v: ctx.w('양쪽') - .1 }; },
    frame(ctx, t) {
      this.P.forEach((p, i) => { show(p.box, E.prog(t, this.t.p + i * .12, .4), 16); p.box.classList.toggle('on', i === 0 && t >= this.t.v); p.box.style.opacity *= i === 0 || t < this.t.v ? 1 : .5; });
      this.P[0].lead(E.prog(t, this.t.v, .8)); grow(this.P[0].m, E.prog(t, this.t.v + .5, .3));
    },
  },
  // ───────── L20 전류·저항 재기 ─────────
  L20: {
    init(ctx) {
      meterPanels(this, ctx); this.P[0].lead(1); this.P[0].m.setAttribute('opacity', 1); this.P.forEach(p => p.box.style.opacity = 1);
      this.warn = chip(ctx.stage, 690, 770, 500, '양쪽에 대면 퓨즈가 끊어짐', { size: 36, color: VC, ink: VC });
      this.t = { c: ctx.w('끊고') - .1, m: ctx.w('끼워서') - .1, f: ctx.w('퓨즈가') - .2, r: ctx.w('전원을') - .1, d: ctx.w('떼어') - .1 };
    },
    frame(ctx, t) {
      const on = t < this.t.r ? 1 : 2;
      this.P.forEach((p, i) => { p.box.classList.toggle('on', i === on && t >= this.t.c); p.box.style.opacity = (i === on || t < this.t.c) ? 1 : .5; });
      this.P[1].gap(E.prog(t, this.t.c, .4)); grow(this.P[1].m, E.prog(t, this.t.m, .35)); pop(this.warn, E.prog(t, this.t.f, .4), .8);
      if (t >= this.t.r) this.warn.style.opacity = E.clamp(1 - (t - this.t.r) / .3);
      this.P[2].lead(E.prog(t, this.t.r, .7)); grow(this.P[2].m, E.prog(t, this.t.r + .4, .3)); show(this.P[2].nt, E.prog(t, this.t.d, .4), 10);
    },
  },
  // ───────── L21 전압은 흐르지 않아요 ─────────
  L21: {
    init(ctx) {
      const s = ctx.stage;
      this.hd = tag(s, 760, 40, 400, '자주 헷갈리는 점', COLOR.orange);
      this.x = chip(s, 220, 170, 760, '<span style="color:#d24a5a">×</span>  전압이 흐른다', { size: 64, color: VC });
      this.o = chip(s, 220, 400, 760, '<span style="color:#14936a">○</span>  <b class="ir">전류</b>가 흐른다', { size: 64, color: COLOR.green });
      this.st = straw(s, 1160, 90, 380); this.st.g.forEach((g, i) => g.setAttribute('opacity', i < 2 ? 1 : 0));
      this.la = lab(s, 1100, 690, 260, '빠는 힘<br>= <span class="vr">전압</span>', 40, { cls: 'note' });
      this.lb = lab(s, 1380, 690, 300, '흐르는 음료<br>= <span class="ir">전류</span>', 40, { cls: 'note' });
      this.t = { x: ctx.w('틀린') - .3, o: ctx.w('흐르는') - .1, s: ctx.w('빨대로') - .1 };
    },
    frame(ctx, t) { pop(this.hd, E.prog(t, .05, .4), .8); pop(this.x, E.prog(t, this.t.x, .4), .8); pop(this.o, E.prog(t, this.t.o, .4), .8); show(this.st.sv, E.prog(t, this.t.s, .4), 20); show(this.la, E.prog(t, this.t.s + .4, .4), 12); show(this.lb, E.prog(t, this.t.s + .9, .4), 12); },
  },
  // ───────── L22 전류의 방향과 전자의 방향(원고 v8) ─────────
  L22: {
    init(ctx) {
      const s = ctx.stage, x0 = 560, y0 = 190, x1 = 1360, y1 = 720;
      this.sv = svgAt(s, 0, 0, 1920, 920); this.sv.style.opacity = 0;
      loop(this.sv, x0, y0, x1, y1);
      this.k = { x0, y0, x1, y1 };
      const per = 2 * (x1 - x0 + y1 - y0);
      this.pt = u => { let d = ((u % 1) + 1) % 1 * per; const w = x1 - x0, h = y1 - y0;
        if (d < w) return [x0 + d, y0, 0]; d -= w; if (d < h) return [x1, y0 + d, 90]; d -= h; if (d < w) return [x1 - d, y1, 180]; d -= w; return [x0, y1 - d, 270]; };
      this.ra = [0, 1, 2, 3].map(() => el('polygon', { points: '-22,-16 18,0 -22,16', fill: VC, opacity: 0 }, this.sv));
      this.eb = [0, 1, 2, 3, 4, 5].map(() => el('circle', { r: 16, fill: IC, opacity: 0 }, this.sv));
      this.lr = lab(s, 560, 70, 800, '전류의 방향 (+ → −)', 54, { color: VC });
      this.le = lab(s, 600, 420, 720, '전자가 실제로 움직이는 방향', 46, { color: IC });
      this.t = { c: ctx.w('전류') - .2, e: ctx.w('전자는') - .1, k: ctx.w('계산할') - .1 };
    },
    frame(ctx, t) {
      this.sv.style.opacity = E.ease(E.prog(t, this.t.c, .4));
      const ra = E.prog(t, this.t.c + .2, .3), hi = t >= this.t.k ? 1.25 + .1 * Math.sin((t - this.t.k) * 6) : 1;
      this.ra.forEach((a, i) => { const [x, y, r] = this.pt(i / 4 + .08 + (t - this.t.c) * .07); a.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${hi})`); a.setAttribute('opacity', ra); });
      const eo = E.prog(t, this.t.e, .3);
      this.eb.forEach((b, i) => { const [x, y] = this.pt(i / 6 - Math.max(0, t - this.t.e) * .06); b.setAttribute('cx', x); b.setAttribute('cy', y); b.setAttribute('opacity', eo); });
      show(this.lr, E.prog(t, this.t.c + .2, .4), 14); show(this.le, E.prog(t, this.t.e, .4), 14);
    },
  },
  // ───────── L23 단위 섞기와 합선 ─────────
  L23: {
    init(ctx) {
      const s = ctx.stage;
      this.u = lab(s, 160, 200, 760, '<small>단위는 하나로</small>20mA = 0.02A', 90, { color: IC });
      this.u2 = chip(s, 220, 470, 640, '안 맞추면 답이 1,000배 틀어짐', { size: 38, color: VC, ink: VC });
      this.bt = battery(s, 1120, 120, 230);
      this.sv = svgAt(s, 1000, 100, 700, 620);
      this.w = el('path', { d: 'M 230 60 L 500 60 L 500 470 L 230 470', fill: 'none', stroke: COLOR.ink, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, this.sv);
      this.sc = chip(s, 1080, 650, 520, '합선(쇼트)', { size: 52, color: VC, ink: VC });
      this.ht = chip(s, 1500, 300, 220, '뜨거워짐', { size: 40, color: VC, ink: VC });
      this.t = { a: ctx.w('이십') - .1, b: ctx.eq('천') - .1, c: ctx.w('바로') - .1, d: ctx.w('합선이라고') - .1, h: ctx.w('뜨거워지고') - .1 };
    },
    frame(ctx, t) {
      pop(this.u, E.prog(t, this.t.a, .45), .8); pop(this.u2, E.prog(t, this.t.b, .4), .8);
      show(this.bt.sv, E.prog(t, this.t.c - .4, .4), 20);
      const w = E.prog(t, this.t.c, .5); this.w.setAttribute('opacity', w);
      const hot = E.prog(t, this.t.d, .6); this.w.setAttribute('stroke', hot > .5 ? VC : COLOR.ink);
      pop(this.sc, E.prog(t, this.t.d, .4), .8); pop(this.ht, E.prog(t, this.t.h, .4), .6);
    },
  },
  // ───────── L24 충전기 숫자 읽기 ─────────
  L24: {
    init(ctx) {
      const s = ctx.stage;
      this.ch = charger(s, 330, 140, 360); this.ch.sv.style.opacity = 1;
      this.v = lab(s, 820, 170, 380, '5V', 150, { color: VC }); this.v.style.opacity = 1;
      this.m = lab(s, 1140, 200, 120, DC, 110, { color: COLOR.sub }); this.m.style.opacity = 1;
      this.a = lab(s, 1240, 170, 380, '3A', 150, { color: IC }); this.a.style.opacity = 1;
      this.lv = chip(s, 760, 420, 500, '충전기가 내보내는 <b class="vr">전압</b>', { size: 40, color: VC });
      this.la = chip(s, 1180, 560, 500, '보낼 수 있는 <b class="ir">최대 전류</b>', { size: 40, color: IC });
      this.t = { v: ctx.w('볼트') - .1, a: ctx.w('암페어') - .1 };
    },
    frame(ctx, t) {
      const kv = Math.sin(E.prog(t, this.t.v, .5) * Math.PI), ka = Math.sin(E.prog(t, this.t.a, .5) * Math.PI);
      this.v.style.transform = `scale(${1 + .12 * kv})`; this.a.style.transform = `scale(${1 + .12 * ka})`;
      this.ch.v.setAttribute('fill', t >= this.t.v ? VC : COLOR.ink); this.ch.a.setAttribute('fill', t >= this.t.a ? IC : COLOR.ink);
      pop(this.lv, E.prog(t, this.t.v, .4), .8); pop(this.la, E.prog(t, this.t.a, .4), .8);
    },
  },
  // ───────── L25 생활 속 저항 ─────────
  L25: {
    init(ctx) {
      const s = ctx.stage;
      this.hd = lab(s, 0, 30, 1920, '생활 속 저항', 54, { color: RC });
      this.pa = el('div', { class: 'abs pane noqa', style: { left: '300px', top: '120px', width: '600px', height: '680px' } }, s);
      this.pb = el('div', { class: 'abs pane noqa', style: { left: '1020px', top: '120px', width: '600px', height: '680px' } }, s);
      this.sa = svgAt(s, 360, 170, 480, 330, '0 0 480 330');
      el('rect', { x: 40, y: 40, width: 300, height: 150, rx: 75, fill: RC }, this.sa); el('rect', { x: 150, y: 170, width: 80, height: 150, rx: 24, fill: RC }, this.sa);
      this.coil = zig(this.sa, 90, 115, 200, '#fff', 8);
      this.wv = [0, 1, 2].map(i => el('line', { x1: 360, y1: 80 + i * 35, x2: 450, y2: 80 + i * 35, stroke: VC, 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, this.sa));
      this.ta = lab(s, 300, 530, 600, '헤어드라이어 열선<small style="margin-top:14px">저항이 큰 선에 전류가 흐르면 열</small>', 50, { cls: 'pt', color: RC });
      this.sb = svgAt(s, 1150, 160, 340, 340, '0 0 340 340');
      [...Array(9)].forEach((_, i) => { const a = (-135 + i * 33.75) * Math.PI / 180; el('line', { x1: 170 + Math.cos(a) * 140, y1: 170 + Math.sin(a) * 140, x2: 170 + Math.cos(a) * 160, y2: 170 + Math.sin(a) * 160, stroke: COLOR.sub, 'stroke-width': 6, 'stroke-linecap': 'round' }, this.sb); });
      el('circle', { cx: 170, cy: 170, r: 115, fill: RC }, this.sb);
      this.nd = el('line', { x1: 170, y1: 170, x2: 170, y2: 85, stroke: '#fff', 'stroke-width': 14, 'stroke-linecap': 'round' }, this.sb);
      this.tb = lab(s, 1020, 530, 600, '볼륨 손잡이<small style="margin-top:14px">돌리면 길이가 바뀌어 저항이 달라짐</small>', 50, { cls: 'pt', color: RC });
      [this.pa, this.pb, this.sa, this.sb].forEach(n => n.style.opacity = 0);
      this.t = { a: ctx.w('헤어드라이어') - .1, h: ctx.w('열이') - .1, b: ctx.w('볼륨') - .1, r: ctx.w('돌릴') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, .05, .4), 12);
      [this.pa, this.sa].forEach(n => show(n, E.prog(t, this.t.a, .4), 20)); show(this.ta, E.prog(t, this.t.a + .2, .4), 12);
      const h = E.prog(t, this.t.h, .5); this.coil.setAttribute('stroke', h > .5 ? '#ffd54a' : '#fff'); this.wv.forEach((w, i) => w.setAttribute('opacity', E.clamp(h * 2 - i * .3)));
      [this.pb, this.sb].forEach(n => show(n, E.prog(t, this.t.b, .4), 20)); show(this.tb, E.prog(t, this.t.b + .2, .4), 12);
      const r = E.ease(E.prog(t, this.t.r, 1.2)); this.nd.setAttribute('transform', `rotate(${-120 + 200 * r} 170 170)`);
    },
  },
  // ───────── L26 퀴즈 ─────────
  L26: {
    init(ctx) { quizSet(this, ctx); this.cd = countdown(ctx, ctx.stage, 1640, 380, 150); this.t = { w: ctx.w('구리선을') - .1, d: ctx.eq('두') - .1, q: ctx.w('저항은') - .1 }; },
    frame(ctx, t) {
      pop(this.tg, E.prog(t, 0, .4), .8); show(this.a, E.prog(t, this.t.w, .4), 16); show(this.la, E.prog(t, this.t.w, .4), 12);
      const g = E.ease(E.prog(t, this.t.d, .8)); show(this.b, E.prog(t, this.t.d, .3), 0); this.bw.setAttribute('width', 400 + 400 * g); show(this.lb, E.prog(t, this.t.d + .5, .4), 12);
      pop(this.q, E.prog(t, this.t.q, .4), .8); this.cd(t);
    },
  },
  L26B: {
    init(ctx) {
      quizSet(this, ctx); [this.tg, this.a, this.la, this.b, this.lb].forEach(n => n.style.opacity = 1); this.bw.setAttribute('width', 800);
      this.x2 = chip(ctx.stage, 1400, 405, 300, '저항 × 2', { size: 52, color: RC, ink: RC });
      this.fn = big(ctx.stage, 720, '저항은 길이에 <b>비례</b>', 64);
      this.t = { d: ctx.eq('두') - .1, p: ctx.w('비례하기') - .3 };
    },
    frame(ctx, t) { pop(this.x2, E.prog(t, this.t.d, .4), .7); show(this.fn, E.prog(t, this.t.p, .4), 16); },
  },
  // ───────── L27 마무리와 블로그 안내 ─────────
  L27: {
    init(ctx) {
      const s = ctx.stage;
      this.done = big(s, 50, '오늘은 <span class="vr">전압</span>, <span class="ir">전류</span>, <span class="rr">저항</span>이 각각 무엇인지', 60);
      this.blog = el('div', { class: 'abs blogc', style: { left: '200px', top: '200px', width: '720px' } }, s);
      this.blog.innerHTML = '<div class="bh">블로그 · 눈바공 연구소</div><div class="bt2">전압·전류·저항</div><div class="bl">· 멀티미터로 재는 법<br>· 자주 헷갈리는 점</div><div class="bd">설명란 링크 ↓</div>';
      this.next = el('div', { class: 'abs blogc nx', style: { left: '1000px', top: '200px', width: '720px' } }, s);
      this.next.innerHTML = '<div class="bh">다음 영상</div><div class="bt2">옴의 법칙</div><div class="bl">V = I × R<br>셋은 서로 어떻게 움직일까?</div>';
      this.q = chip(s, 1000, 640, 720, '전압을 올리면 전류는?', { size: 48, color: IC });
      this.blog.style.opacity = 0; this.next.style.opacity = 0;
      this.t = { b: ctx.w('표와') - .1, q: ctx.w('그럼') - .1, n: ctx.w('다음') - .1 };
    },
    frame(ctx, t) { show(this.done, E.prog(t, 0, .4), 20); pop(this.blog, E.prog(t, this.t.b, .4), .9); pop(this.q, E.prog(t, this.t.q, .4), .85); pop(this.next, E.prog(t, this.t.n, .4), .9); },
  },
  L28: OUTRO,

  // ════════ 쇼츠 전용 장면(무대 860×680, 가운데 x 430) ════════
  S1E: {
    init(ctx) {
      const s = ctx.stage;
      this.a = big(s, 60, '전압이 <b class="vr" style="color:#d24a5a">흐른다</b>?', 84);
      this.q = el('div', { class: 'abs qbig', style: { left: '340px', top: '260px', width: '180px', height: '180px', fontSize: '130px' } }, s); this.q.textContent = '?'; this.q.style.opacity = 0;
      this.t = { a: ctx.w('전압이') - .1, q: ctx.w('맞는') - .1 };
    },
    frame(ctx, t) { pop(this.a, E.prog(t, this.t.a, .45), .8); pop(this.q, E.prog(t, this.t.q, .45), .5); },
  },
  S2A: {
    init(ctx) {
      const s = ctx.stage;
      this.bt = battery(s, 325, 30, 210, '1.5V');
      this.ring = el('div', { class: 'abs noqa', style: { left: '448px', top: '232px', width: '74px', height: '74px', border: '7px solid #d24a5a', borderRadius: '50%', opacity: 0 } }, s);
      this.c = chip(s, 230, 500, 400, '<b class="vr">V(볼트)</b> = 전압의 단위', { size: 40, color: VC });
      this.t = { b: Math.min(.2, ctx.w('건전지에') - .1), v: ctx.w('볼트가') - .1 };
    },
    frame(ctx, t) { show(this.bt.sv, E.prog(t, this.t.b, .4), 24); pop(this.ring, E.prog(t, this.t.v, .35), .5); pop(this.c, E.prog(t, this.t.v + .2, .4), .8); },
  },
  S2E: {
    init(ctx) {
      const s = ctx.stage;
      this.sv = svgAt(s, 280, 20, 300, 300, '0 0 300 300'); this.sv.style.opacity = 0;
      el('rect', { x: 10, y: 10, width: 280, height: 280, rx: 50, fill: '#fff', stroke: '#cfd8e3', 'stroke-width': 8 }, this.sv);
      el('circle', { cx: 150, cy: 150, r: 100, fill: '#f2f5f9', stroke: '#9aa4b2', 'stroke-width': 6 }, this.sv);
      el('circle', { cx: 110, cy: 150, r: 18, fill: COLOR.ink }, this.sv); el('circle', { cx: 190, cy: 150, r: 18, fill: COLOR.ink }, this.sv);
      this.c = chip(s, 160, 380, 540, '우리 집 콘센트 = <b class="vr">? V</b>', { size: 44, color: VC });
      this.t = { a: Math.min(.2, ctx.w('우리') - .1), c: ctx.w('몇') - .1 };
    },
    frame(ctx, t) { show(this.sv, E.prog(t, this.t.a, .4), 24); pop(this.c, E.prog(t, this.t.c, .4), .8); },
  },
  S3A: {
    init(ctx) {
      const s = ctx.stage;
      this.cd = wcard(s, 180, 30, 500, 270, 'r', '저항', '', '흐름을 막는 정도', [], 60);
      this.sv = svgAt(s, 130, 350, 600, 160); this.sv.style.opacity = 0;
      el('rect', { x: 0, y: 30, width: 600, height: 40, rx: 20, fill: '#dfa064', stroke: '#b8712e', 'stroke-width': 4 }, this.sv);
      el('rect', { x: 0, y: 110, width: 600, height: 40, rx: 20, fill: '#dfa064', stroke: '#b8712e', 'stroke-width': 4 }, this.sv);
      this.q = chip(s, 230, 530, 400, '저항이 다를까?', { size: 44, color: RC });
      this.t = { c: Math.min(.2, ctx.w('저항은') - .1), w: ctx.w('같은') - .1, q: ctx.w('달라질') - .1 };
    },
    frame(ctx, t) { pop(this.cd, E.prog(t, this.t.c, .45), .85); show(this.sv, E.prog(t, this.t.w, .4), 16); pop(this.q, E.prog(t, this.t.q, .4), .8); },
  },
  S3E: {
    init(ctx) {
      const s = ctx.stage;
      this.sv = svgAt(s, 30, 120, 800, 200); this.sv.style.opacity = 0;
      el('rect', { x: 0, y: 20, width: 380, height: 44, rx: 22, fill: '#dfa064', stroke: '#b8712e', 'stroke-width': 4 }, this.sv);
      this.bw = el('rect', { x: 0, y: 120, width: 380, height: 44, rx: 22, fill: '#dfa064', stroke: '#b8712e', 'stroke-width': 4 }, this.sv);
      this.la = lab(s, 30, 40, 380, '길이 L', 40, { color: COLOR.sub }); this.lb = lab(s, 30, 330, 800, '길이 2L', 40, { color: COLOR.sub });
      this.c = chip(s, 230, 460, 400, '저항 × <b class="rr">?</b>', { size: 56, color: RC });
      this.t = { w: Math.min(.2, ctx.w('구리선') - .1), d: ctx.eq('두') - .1, c: ctx.w('몇') - .1 };
    },
    frame(ctx, t) {
      show(this.sv, E.prog(t, this.t.w, .4), 16); show(this.la, E.prog(t, this.t.w, .4), 10);
      this.bw.setAttribute('width', 380 + 380 * E.ease(E.prog(t, this.t.d, .8))); show(this.lb, E.prog(t, this.t.d + .5, .4), 10);
      pop(this.c, E.prog(t, this.t.c, .4), .8);
    },
  },
};

// 멀티미터 세 칸(원고 v7). P[i] = { box, m(계기), lead(u), gap(u), nt }
function meterPanels(self, ctx) {
  const s = ctx.stage, T = [['전압 재기', '두 지점에 나란히 대기', VC, 'V'], ['전류 재기', '길을 끊고 그 사이에 끼우기', IC, 'A'], ['저항 재기', '전원을 끄고 부품만 따로', RC, 'Ω']];
  self.P = T.map((p, i) => {
    const x = 150 + i * 540, o = {};
    o.box = el('div', { class: 'abs pane', style: { left: x + 'px', top: '60px', width: '500px', height: '690px' } }, s);
    el('div', { class: 'pt', html: `${p[0]}<small>${p[1]}</small>`, style: { marginTop: '30px', fontSize: '50px', color: p[2] } }, o.box);
    const sv = el('svg', { width: 500, height: 520, viewBox: '0 0 500 520', style: { display: 'block' } }, o.box);
    if (i < 2) {
      const g = loop(sv, 90, 70, 410, 360, { gapBottom: i === 1 });
      if (i === 1) {
        o.cover = el('line', { x1: 200, y1: 360, x2: 300, y2: 360, stroke: COLOR.ink, 'stroke-width': 6 }, sv);
        o.gap = u => o.cover.setAttribute('opacity', 1 - E.clamp(u));
        o.m = meter(sv, 250, 360, 46, p[3], p[2]); o.m.setAttribute('opacity', 0);
        o.lead = () => 0;
      } else {
        const w1 = wireLine(sv, [[180, 70], [180, 230], [204, 230]], p[2]), w2 = wireLine(sv, [[320, 70], [320, 230], [296, 230]], p[2]);
        [w1, w2].forEach(w => { w.setAttribute('stroke-dasharray', 260); w.setAttribute('stroke-dashoffset', 260); });
        o.lead = u => [w1, w2].forEach(w => w.setAttribute('stroke-dashoffset', 260 * (1 - E.clamp(u))));
        o.m = meter(sv, 250, 230, 46, p[3], p[2]); o.m.setAttribute('opacity', 0);
        o.gap = () => 0;
      }
    } else {
      zig(sv, 180, 120, 140, COLOR.ink, 6);
      wireLine(sv, [[150, 120], [180, 120]], COLOR.ink, 6); wireLine(sv, [[320, 120], [350, 120]], COLOR.ink, 6);
      const w1 = wireLine(sv, [[150, 120], [150, 280], [204, 280]], p[2]), w2 = wireLine(sv, [[350, 120], [350, 280], [296, 280]], p[2]);
      [w1, w2].forEach(w => { w.setAttribute('stroke-dasharray', 260); w.setAttribute('stroke-dashoffset', 260); });
      o.lead = u => [w1, w2].forEach(w => w.setAttribute('stroke-dashoffset', 260 * (1 - E.clamp(u))));
      o.m = meter(sv, 250, 280, 46, p[3], p[2]); o.m.setAttribute('opacity', 0);
      o.gap = () => 0;
      o.nt = el('div', { class: 'note', html: '회로에서 떼어 낸 저항', style: { fontSize: '34px', marginTop: '-80px', opacity: 0 } }, o.box);
    }
    o.box.style.opacity = 0;
    return o;
  });
}
// 퀴즈 공통 배치
function quizSet(self, ctx) {
  const s = ctx.stage;
  self.tg = tag(s, 760, 30, 400, '퀴즈', COLOR.orange);
  self.a = svgAt(s, 560, 200, 840, 80); el('rect', { x: 0, y: 18, width: 400, height: 44, rx: 22, fill: '#dfa064', stroke: '#b8712e', 'stroke-width': 4 }, self.a); self.a.style.opacity = 0;
  self.la = lab(s, 560, 140, 400, '구리선 · 길이 L', 40, { color: COLOR.sub });
  self.b = svgAt(s, 560, 400, 840, 80); self.bw = el('rect', { x: 0, y: 18, width: 400, height: 44, rx: 22, fill: '#dfa064', stroke: '#b8712e', 'stroke-width': 4 }, self.b); self.b.style.opacity = 0;
  self.lb = lab(s, 560, 340, 800, '굵기는 그대로 · 길이 2L', 40, { color: COLOR.sub });
  self.q = chip(s, 660, 580, 600, '저항은 어떻게 될까?', { size: 52, color: RC });
}
