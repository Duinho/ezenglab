// 생활 기기 110 냉장고와 에어컨 영상 장면. 장면표.md와 같은 장면 번호를 쓴다.
// 롱폼 무대 1920×920(진행자 오른쪽 아래 x 1700~, y 880~ 비움), 쇼츠 무대 860×680(쇼츠 배치 4판, 가로 가운데 x 430).
// 쇼츠에 쓰는 장면: S1A, L04, L05, S1E, L27, L28, S2E, S3A, L24, L25, S3E. 나머지는 롱폼 전용.
// 생활 기기 시리즈: 분해 없이 기기 그림 위에 센서·액추에이터·원리를 이름표로 띄운다.
// 색: 차가움·열 빼앗기 파랑, 뜨거움·열 버리기 빨강, 센서 청록, 압축 보라, 팽창 주황.

const CO = COLOR.blue, HO = COLOR.red, SE = COLOR.teal, PU = '#8c6fb0', OR = COLOR.orange, GR = '#7d8798', PIPEG = '#b8c1cd';

// ───── 공통 그리기 도구 ─────
function tw(text, fs) {            // 글자 폭 어림(한글 1, 나머지 0.6)
  let w = 0; for (const c of text) w += /[가-힣]/.test(c) ? 1 : (c === ' ' ? .32 : .62); return w * fs;
}
// SVG 안 이름표(둥근 상자 + 흰 글자). setText로 글·색을 바꿀 수 있음
function badge(svg, cx, cy, text, color, fs = 40) {
  const g = el('g', { opacity: 0 }, svg);
  const r = el('rect', { rx: fs * .42, fill: color }, g);
  const t = el('text', { x: cx, y: cy + fs * .36, 'text-anchor': 'middle', 'font-size': fs, 'font-weight': 800, fill: '#fff' }, g);
  const set = (s, c) => { t.textContent = s; const w = tw(s, fs) + fs * 1.1; r.setAttribute('x', cx - w / 2); r.setAttribute('y', cy - fs * .78); r.setAttribute('width', w); r.setAttribute('height', fs * 1.56); if (c) r.setAttribute('fill', c); };
  set(text); g.setText = set; return g;
}
function stxt(svg, x, y, text, fs, color, anchor = 'middle', weight = 600) {
  const t = el('text', { x, y, 'text-anchor': anchor, 'font-size': fs, 'font-weight': weight, fill: color }, svg); t.textContent = text; return t;
}
// 열 물결(세로). 반환 g
function waves(svg, x, y, color, n = 3, h = 90, gap = 30, sw = 7) {
  const g = el('g', { opacity: 0 }, svg);
  for (let i = 0; i < n; i++) el('path', { d: `M ${x + i * gap} ${y + h} q 14 ${-h / 4} 0 ${-h / 2} q -14 ${-h / 4} 0 ${-h / 2}`, fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round' }, g);
  return g;
}
function op(node, v) { node.setAttribute('opacity', E.clamp(v)); }
function grow(node, u) { op(node, u * 1.6); }
function svgAt(parent, x, y, w, h, vb, cls = 'abs') {
  return el('svg', { class: cls, width: w, height: h, viewBox: vb || `0 0 ${w} ${h}`, style: { left: x + 'px', top: y + 'px' } }, parent);
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
function qmark(parent, x, y, size) {
  const q = el('div', { class: 'abs qbig', style: { left: x + 'px', top: y + 'px', width: size + 'px', height: size + 'px', fontSize: Math.round(size * .72) + 'px' } }, parent);
  q.textContent = '?'; q.style.opacity = 0; return q;
}
function countdown(ctx, parent, x, y, size) {
  const c = el('div', { class: 'abs center count', style: { left: (x - 150) + 'px', width: '300px', top: y + 'px', fontSize: size + 'px', lineHeight: 1.1, opacity: 0 } }, parent);
  return t => { const h = t - ctx.audioDur, n = Math.round(ctx.dur - ctx.audioDur) - Math.floor(h); if (h > 0 && n >= 1) { const f = h % 1; c.textContent = n; c.style.opacity = 1 - f * .6; c.style.transform = `scale(${1.25 - f * .25})`; } else c.style.opacity = 0; };
}

// ───── 냉장고(앞모습) viewBox 0 0 420 520: 몸체 x 40~280, y 30~450, 옆면 물결 x 300~ ─────
function fridgeFront(parent, x, y, w, opt = {}) {
  const h = w * 520 / 420, sv = svgAt(parent, x, y, w, h, '0 0 420 520');
  const inner = el('rect', { x: 52, y: 42, width: 216, height: 396, rx: 16, fill: '#dbe8fb', opacity: 0 }, sv);
  el('rect', { x: 40, y: 30, width: 240, height: 420, rx: 24, fill: 'none', stroke: GR, 'stroke-width': 8 }, sv);
  el('rect', { x: 40, y: 30, width: 240, height: 420, rx: 24, fill: '#f4f6f9', opacity: .55 }, sv);
  el('line', { x1: 40, y1: 190, x2: 280, y2: 190, stroke: GR, 'stroke-width': 7 }, sv);
  el('line', { x1: 252, y1: 80, x2: 252, y2: 150, stroke: GR, 'stroke-width': 10, 'stroke-linecap': 'round' }, sv);
  el('line', { x1: 252, y1: 230, x2: 252, y2: 320, stroke: GR, 'stroke-width': 10, 'stroke-linecap': 'round' }, sv);
  el('rect', { x: 62, y: 450, width: 34, height: 18, fill: GR }, sv); el('rect', { x: 224, y: 450, width: 34, height: 18, fill: GR }, sv);
  const wv = waves(sv, 312, 170, HO, 3, 150, 32, 8);
  let hand = null;
  if (opt.hand) {          // 옆면에 대 보는 손(손바닥 + 손가락)
    hand = el('g', { opacity: 0 }, sv);
    el('rect', { x: 330, y: 360, width: 66, height: 86, rx: 26, fill: '#f3d2bd', stroke: '#c9a28c', 'stroke-width': 4 }, hand);
    for (let i = 0; i < 4; i++) el('rect', { x: 296, y: 364 + i * 20, width: 50, height: 16, rx: 8, fill: '#f3d2bd', stroke: '#c9a28c', 'stroke-width': 3 }, hand);
  }
  sv.style.opacity = 0; return { sv, inner, wv, hand };
}

// ───── 열 옮기는 곳 판(원고 c1) viewBox 0 0 800 380 ─────
function heatPanel(parent, x, y, w, kind) {
  const h = w * 380 / 800, sv = svgAt(parent, x, y, w, h, '0 0 800 380');
  el('rect', { x: 4, y: 4, width: 792, height: 372, rx: 30, fill: '#fbfcfe', stroke: '#d6dde8', 'stroke-width': 5 }, sv);
  const o = { sv };
  if (kind === 'f') {
    stxt(sv, 400, 52, '냉장고 · 냉장고 안 → 방', 34, COLOR.ink, 'middle', 800);
    o.inner = el('rect', { x: 92, y: 92, width: 136, height: 206, rx: 10, fill: '#dbe8fb', opacity: 0 }, sv);
    el('rect', { x: 80, y: 80, width: 160, height: 230, rx: 16, fill: 'none', stroke: GR, 'stroke-width': 6 }, sv);
    el('line', { x1: 80, y1: 168, x2: 240, y2: 168, stroke: GR, 'stroke-width': 5 }, sv);
    el('line', { x1: 220, y1: 110, x2: 220, y2: 150, stroke: GR, 'stroke-width': 7, 'stroke-linecap': 'round' }, sv);
    el('line', { x1: 220, y1: 190, x2: 220, y2: 240, stroke: GR, 'stroke-width': 7, 'stroke-linecap': 'round' }, sv);
    o.ag = el('g', { opacity: 0 }, sv); o.ar = arrow(o.ag, 262, 200, 520, 200, HO, 12); stxt(o.ag, 390, 160, '열', 34, HO, 'middle', 800);
    o.wv = waves(sv, 560, 130, HO, 3, 140, 36, 8);
    o.cold = badge(sv, 160, 344, '차가워짐', CO, 30); o.warm = badge(sv, 596, 344, '따뜻해짐', HO, 30);
  } else {
    stxt(sv, 400, 52, '에어컨 · 방 → 집 밖', 34, COLOR.ink, 'middle', 800);
    el('rect', { x: 470, y: 76, width: 28, height: 300, fill: '#c9ced8' }, sv);
    stxt(sv, 60, 100, '방 안', 26, COLOR.sub, 'start'); stxt(sv, 760, 100, '집 밖', 26, COLOR.sub, 'end');
    o.inner = el('rect', { x: 66, y: 126, width: 288, height: 66, rx: 22, fill: '#dbe8fb', opacity: 0 }, sv);
    el('rect', { x: 60, y: 120, width: 300, height: 78, rx: 28, fill: 'none', stroke: GR, 'stroke-width': 6 }, sv);
    el('line', { x1: 86, y1: 176, x2: 334, y2: 176, stroke: '#9aa6bb', 'stroke-width': 5 }, sv);
    el('circle', { cx: 330, cy: 142, r: 7, fill: '#2bb673' }, sv);
    el('rect', { x: 560, y: 196, width: 200, height: 130, rx: 14, fill: '#eef1f5', stroke: GR, 'stroke-width': 6 }, sv);
    el('circle', { cx: 630, cy: 261, r: 46, fill: '#fff', stroke: GR, 'stroke-width': 5 }, sv);
    for (let a = 0; a < 180; a += 45) { const r = Math.PI * a / 180; el('line', { x1: 630 - 38 * Math.cos(r), y1: 261 - 38 * Math.sin(r), x2: 630 + 38 * Math.cos(r), y2: 261 + 38 * Math.sin(r), stroke: '#9aa6bb', 'stroke-width': 4 }, sv); }
    for (let k = 0; k < 4; k++) el('line', { x1: 700, y1: 226 + k * 24, x2: 740, y2: 226 + k * 24, stroke: '#9aa6bb', 'stroke-width': 4 }, sv);
    o.ag = el('g', { opacity: 0 }, sv); o.ar = arrow(o.ag, 300, 236, 548, 236, HO, 12); stxt(o.ag, 410, 196, '열', 34, HO, 'middle', 800);
    o.wv = waves(sv, 600, 90, HO, 3, 90, 36, 8);
    o.cold = badge(sv, 210, 280, '차가워짐', CO, 30); o.warm = badge(sv, 660, 352, '따뜻해짐', HO, 30);
  }
  sv.style.opacity = 0; return o;
}
function heatPanels(ctx) {
  const s = ctx.stage;
  return ctx.long ? [heatPanel(s, 60, 190, 860, 'f'), heatPanel(s, 1000, 190, 860, 'a')]
                  : [heatPanel(s, 115, 32, 630, 'f'), heatPanel(s, 115, 345, 630, 'a')];
}

// ───── 생활 속 세 가지 현상 카드(원고 c2) ─────
function clueCards(ctx) {
  const s = ctx.stage, R = [];
  const D = [['알코올을 바르면', '증발 · 시원해져요', CO], ['펌프를 누르면', '압축 · 뜨거워져요', HO], ['스프레이를 뿌리면', '팽창 · 차가워져요', CO]];
  D.forEach((d, k) => {
    const x = 140 + k * 560, o = {};
    o.box = el('div', { class: 'abs panelc noqa', style: { left: x + 'px', top: '110px', width: '520px', height: '660px', opacity: 0 } }, s);
    o.ti = lab(s, x, 140, 520, d[0], 50, { cls: 'ttl' });
    o.sv = svgAt(s, x + 60, 230, 400, 330, '0 0 400 330'); o.sv.style.opacity = 0;
    o.tg = tag(s, x + 80, 620, 360, d[1], d[2]);
    const sv = o.sv;
    if (k === 0) {
      el('ellipse', { cx: 200, cy: 230, rx: 170, ry: 80, fill: '#f6d7c3', stroke: '#b98b6e', 'stroke-width': 5 }, sv);
      [130, 200, 270].forEach(cx => el('circle', { cx, cy: 232, r: 18, fill: '#cfe6ff', stroke: '#7aa7d9', 'stroke-width': 3 }, sv));
      o.steam = el('g', { opacity: 0 }, sv);
      [130, 200, 270].forEach(cx => el('path', { d: `M ${cx} 200 q 14 -30 0 -60 q -14 -30 0 -60`, fill: 'none', stroke: '#9ec3ea', 'stroke-width': 6, 'stroke-dasharray': '10 10', 'stroke-linecap': 'round' }, o.steam));
    } else if (k === 1) {
      el('rect', { x: 165, y: 110, width: 70, height: 210, fill: '#e9edf3', stroke: '#6b7686', 'stroke-width': 5 }, sv);
      o.hot = el('rect', { x: 168, y: 230, width: 64, height: 88, fill: HO, opacity: 0 }, sv);
      o.hd = el('g', {}, sv);
      el('line', { x1: 200, y1: 40, x2: 200, y2: 112, stroke: '#6b7686', 'stroke-width': 10 }, o.hd);
      el('line', { x1: 120, y1: 40, x2: 280, y2: 40, stroke: '#6b7686', 'stroke-width': 16, 'stroke-linecap': 'round' }, o.hd);
    } else {
      o.can = el('rect', { x: 140, y: 110, width: 110, height: 210, rx: 18, fill: '#e9edf3', stroke: '#6b7686', 'stroke-width': 5 }, sv);
      el('rect', { x: 175, y: 70, width: 40, height: 42, fill: '#6b7686' }, sv);
      o.spray = el('g', { opacity: 0 }, sv);
      for (let i = 0; i < 4; i++) el('line', { x1: 222, y1: 88, x2: 380, y2: 40 + i * 32, stroke: '#9ec3ea', 'stroke-width': 5, 'stroke-dasharray': '10 10', 'stroke-linecap': 'round' }, o.spray);
    }
    R.push(o);
  });
  return R;
}
function cardFull(o, k) {          // 앞 장면에서 이미 다 보인 카드
  o.box.style.opacity = 1; o.ti.style.opacity = 1; o.sv.style.opacity = 1; o.tg.style.opacity = 1;
  if (k === 0) op(o.steam, 1); if (k === 1) op(o.hot, .8); if (k === 2) { op(o.spray, 1); o.can.setAttribute('fill', '#cfe0f6'); }
}

// ───── 냉매 고리(원고 c3) viewBox 0 0 1500 760 ─────
const LP = { L: 300, R: 1200, T: 170, B: 600 };
function cyclePos(s) {             // 0~1 → 고리 위 점(왼쪽 아래에서 위로 → 오른쪽 → 아래로 → 왼쪽)
  const { L, R, T, B } = LP, h = B - T, w = R - L, P = 2 * (h + w);
  let d = ((s % 1) + 1) % 1 * P;
  if (d < h) return [L, B - d, 'e']; d -= h;
  if (d < w) return [L + d, T, d < w / 2 ? 'c0' : 'c1']; d -= w;
  if (d < h) return [R, T + d, 'r']; d -= h;
  return [R - d, B, d < w / 2 ? 'x0' : 'x1'];
}
function cycle(parent, x, y, w) {
  const h = w * 760 / 1500, sv = svgAt(parent, x, y, w, h, '0 0 1500 760');
  const { L, R, T, B } = LP, o = { sv };
  const seg = (d, sw = 18) => el('path', { d, fill: 'none', stroke: PIPEG, 'stroke-width': sw, 'stroke-linecap': 'round' }, sv);
  o.pe = seg(`M ${L} ${B} L ${L} ${T}`); o.pc0 = seg(`M ${L} ${T} L 660 ${T}`); o.pc1 = seg(`M 840 ${T} L ${R} ${T}`);
  o.pr = seg(`M ${R} ${T} L ${R} ${B}`); o.px0 = seg(`M ${R} ${B} L 830 ${B}`); o.px1 = seg(`M 670 ${B} L ${L} ${B}`, 9);
  o.fins = el('g', { opacity: 0 }, sv);
  for (let k = 0; k < 5; k++) { el('line', { x1: L - 40, y1: 260 + k * 70, x2: L + 40, y2: 290 + k * 70, stroke: CO, 'stroke-width': 7 }, o.fins); }
  o.finsR = el('g', { opacity: 0 }, sv);
  for (let k = 0; k < 5; k++) { el('line', { x1: R - 40, y1: 260 + k * 70, x2: R + 40, y2: 290 + k * 70, stroke: HO, 'stroke-width': 7 }, o.finsR); }
  o.comp = el('g', { opacity: 0 }, sv);
  o.compR = el('rect', { x: 660, y: 112, width: 180, height: 116, rx: 26, fill: '#e8e2f1', stroke: PU, 'stroke-width': 6 }, o.comp);
  stxt(o.comp, 750, 184, '압축기', 40, '#5b3f86', 'middle', 800);
  o.exp = el('g', { opacity: 0 }, sv);
  el('rect', { x: 670, y: B - 22, width: 160, height: 44, fill: '#fde3cf', stroke: OR, 'stroke-width': 5 }, o.exp);
  o.dots = []; for (let i = 0; i < 16; i++) o.dots.push(el('circle', { r: 14, fill: '#9aa4b2', opacity: 0 }, sv));
  o.b = [badge(sv, L, 104, '① 증발 · 열을 빼앗아요', CO), badge(sv, 750, 44, '② 압축 · 뜨거워져요', PU),
         badge(sv, R, 104, '③ 열 버리기 · 바깥에 내놓아요', HO), badge(sv, 750, 690, '④ 팽창 · 다시 차가워져요', OR)];
  o.inL = stxt(sv, 150, 400, '안쪽', 44, CO, 'middle', 800); o.inL.setAttribute('opacity', 0);
  o.outL = stxt(sv, 1355, 400, '바깥쪽', 44, HO, 'middle', 800); o.outL.setAttribute('opacity', 0);
  o.heatIn = el('g', { opacity: 0 }, sv); [arrow(o.heatIn, 90, 270, 240, 270, HO, 9), arrow(o.heatIn, 90, 520, 240, 520, HO, 9)].forEach(f => f(1));
  o.heatOut = el('g', { opacity: 0 }, sv); el('g', {}, o.heatOut).appendChild(waves(sv, 1262, 230, HO, 3, 100, 30, 7)); o.heatOut.appendChild(waves(sv, 1262, 480, HO, 3, 100, 30, 7));
  [...o.heatOut.querySelectorAll('g')].forEach(g => g.setAttribute('opacity', 1));
  o.mid = badge(sv, 750, 390, '냉매 · 관 속을 도는 물질', COLOR.green, 46);
  o.elec = badge(sv, 750, 480, '전기 → 압축기 · 팬', PU, 46);
  sv.style.opacity = 0;
  o.color = { e: false, c: false, r: false, x: false };
  o.paint = () => {
    const C = o.color;
    o.pe.setAttribute('stroke', C.e ? CO : PIPEG); o.pc0.setAttribute('stroke', C.c ? PU : (C.e ? CO : PIPEG));
    o.pc1.setAttribute('stroke', C.c ? HO : PIPEG); o.pr.setAttribute('stroke', C.r ? HO : PIPEG);
    o.px0.setAttribute('stroke', C.x ? OR : (C.r ? HO : PIPEG)); o.px1.setAttribute('stroke', C.x ? CO : PIPEG);
    op(o.fins, C.e ? 1 : 0); op(o.finsR, C.r ? 1 : 0); op(o.comp, C.c ? 1 : 0); op(o.exp, C.x ? 1 : 0);
  };
  o.move = (t, speed = .045, show = 1) => o.dots.forEach((d, i) => {
    const [px, py, sg] = cyclePos(i / 16 + t * speed), C = o.color;
    const col = { e: C.e ? CO : '#9aa4b2', c0: C.c ? PU : (C.e ? CO : '#9aa4b2'), c1: C.c ? HO : '#9aa4b2', r: C.r ? HO : '#9aa4b2', x0: C.x ? OR : (C.r ? HO : '#9aa4b2'), x1: C.x ? CO : '#9aa4b2' }[sg];
    d.setAttribute('cx', px); d.setAttribute('cy', py); d.setAttribute('fill', col); op(d, (py === LP.T && px > 640 && px < 860) ? 0 : show);
  });
  return o;
}
// 고리 장면(L10~L15) 공통: 앞 단계까지 칠해 둔 상태로 시작
function cycleScene(ctx, upto) {
  const o = cycle(ctx.stage, 210, 70, 1500); o.sv.style.opacity = 1;
  const keys = ['e', 'c', 'r', 'x'];
  for (let i = 0; i < upto; i++) { o.color[keys[i]] = true; op(o.b[i], 1); }
  if (upto >= 1) { op(o.inL, 1); op(o.heatIn, 1); }
  if (upto >= 3) { op(o.outL, 1); op(o.heatOut, 1); }
  o.paint(); return o;
}

// ───── 에어컨 실내기·벽·실외기 viewBox 0 0 1600 800 ─────
function acScene(parent, x, y, w, opt = {}) {
  const h = w / 2, sv = svgAt(parent, x, y, w, h, '0 0 1600 800'), o = { sv };
  el('rect', { x: 4, y: 4, width: 1592, height: 792, rx: 40, fill: '#fbfcfe', stroke: '#d6dde8', 'stroke-width': 6 }, sv);
  o.out = el('rect', { x: 924, y: 8, width: 668, height: 784, rx: 0, fill: '#eef3fa', opacity: 0 }, sv);
  el('rect', { x: 880, y: 8, width: 44, height: 784, fill: '#c9ced8' }, sv);
  stxt(sv, 60, 770, '방 안', 40, COLOR.sub, 'start'); stxt(sv, 1550, 770, '집 밖', 40, COLOR.sub, 'end');
  // 관
  o.pipe = el('g', {}, sv);
  [[180, 1420], [220, 1460]].forEach(([yy, xx]) => el('path', { d: `M 780 ${yy} L ${xx} ${yy} L ${xx} 360`, fill: 'none', stroke: '#9aa6bb', 'stroke-width': 14 }, o.pipe));
  // 실내기
  o.ind = el('g', {}, sv);
  o.indC = el('rect', { x: 190, y: 120, width: 580, height: 150, rx: 38, fill: '#dbe8fb', opacity: 0 }, o.ind);
  el('rect', { x: 180, y: 110, width: 600, height: 170, rx: 44, fill: 'none', stroke: GR, 'stroke-width': 8 }, o.ind);
  o.fin = el('g', {}, o.ind); for (let k = 0; k < 7; k++) el('line', { x1: 250 + k * 50, y1: 230, x2: 280 + k * 50, y2: 150, stroke: CO, 'stroke-width': 6, 'stroke-linecap': 'round' }, o.fin);
  o.louver = el('line', { x1: 230, y1: 262, x2: 730, y2: 262, stroke: '#555', 'stroke-width': 9, 'stroke-linecap': 'round' }, o.ind);
  o.recv = el('circle', { cx: 735, cy: 150, r: 12, fill: '#c62828' }, o.ind);
  o.sens = el('circle', { cx: 650, cy: 150, r: 12, fill: SE }, o.ind);
  // 실외기
  o.odr = el('g', {}, sv);
  el('rect', { x: 1040, y: 360, width: 440, height: 320, rx: 20, fill: '#eef1f5', stroke: GR, 'stroke-width': 8 }, o.odr);
  el('circle', { cx: 1180, cy: 520, r: 115, fill: '#fff', stroke: GR, 'stroke-width': 6 }, o.odr);
  o.fan = el('g', {}, o.odr); for (let a = 0; a < 180; a += 45) { const r = Math.PI * a / 180; el('line', { x1: 1180 - 95 * Math.cos(r), y1: 520 - 95 * Math.sin(r), x2: 1180 + 95 * Math.cos(r), y2: 520 + 95 * Math.sin(r), stroke: '#9aa6bb', 'stroke-width': 7 }, o.fan); }
  o.hfin = el('g', {}, o.odr); for (let k = 0; k < 5; k++) el('line', { x1: 1360, y1: 420 + k * 50, x2: 1440, y2: 440 + k * 50, stroke: HO, 'stroke-width': 7, 'stroke-linecap': 'round' }, o.hfin);
  o.comp = el('rect', { x: 1340, y: 600, width: 90, height: 60, fill: '#b0b8c4', stroke: '#6b7686', 'stroke-width': 4 }, o.odr);
  o.wOut = waves(sv, 1500, 400, HO, 2, 150, 40, 8);
  o.go = el('g', { opacity: 0 }, sv); o.goA = arrow(o.go, 600, 420, 1015, 520, HO, 16); o.goT = stxt(o.go, 760, 425, '열', 44, HO, 'middle', 800);
  o.back = el('g', { opacity: 0 }, sv); o.backA = arrow(o.back, 1015, 520, 640, 420, HO, 16); stxt(o.back, 840, 430, '열', 44, HO, 'middle', 800);
  const fs = opt.fs || 44;
  o.bIn = badge(sv, 480, 345, '실내기 · 열을 빼앗아요', CO, fs);
  o.bOut = badge(sv, 1180, 300, '실외기 · 열을 버려요', HO, fs);
  sv.style.opacity = 0;
  o.spin = t => o.fan.setAttribute('transform', `rotate(${t * 140} 1180 520)`);
  return o;
}
function acPlace(ctx) { return ctx.long ? acScene(ctx.stage, 160, 50, 1560) : acScene(ctx.stage, 30, 110, 800, { fs: 60 }); }
// 눈(겨울)
function snow(svg, n = 26) {
  const g = el('g', { opacity: 0, class: 'noqa' }, svg), F = []; svg.insertBefore(g, svg.children[2]);
  for (let i = 0; i < n; i++) F.push({ x: 960 + ((i * 97) % 600), y0: (i * 53) % 760, v: 40 + (i * 13) % 35, c: el('circle', { r: 9, fill: '#fff', stroke: '#c9d6e8', 'stroke-width': 3 }, g) });
  return { g, step: t => F.forEach(f => { f.c.setAttribute('cx', f.x + 10 * Math.sin(t + f.x)); f.c.setAttribute('cy', 20 + (f.y0 + f.v * t) % 680); }) };
}

// ───── 냉장고 옆모습(방 안) viewBox 0 0 900 600: 앞 = 왼쪽, 뒤 = 오른쪽 ─────
function fridgeSide(parent, x, y, w) {
  const h = w * 600 / 900, sv = svgAt(parent, x, y, w, h, '0 0 900 600'), o = { sv };
  el('rect', { x: 4, y: 4, width: 892, height: 592, rx: 34, fill: '#fbfcfe', stroke: '#d6dde8', 'stroke-width': 6 }, sv);
  el('rect', { x: 340, y: 170, width: 220, height: 380, rx: 18, fill: '#f4f6f9', stroke: GR, 'stroke-width': 8 }, sv);
  el('rect', { x: 330, y: 180, width: 14, height: 360, fill: '#cfd6e0' }, sv);
  el('rect', { x: 480, y: 480, width: 66, height: 56, fill: '#b0b8c4', stroke: '#6b7686', 'stroke-width': 4 }, sv);
  stxt(sv, 250, 585, '앞', 34, COLOR.sub); stxt(sv, 650, 585, '뒤', 34, COLOR.sub);
  o.cold = el('g', { opacity: 0 }, sv); [260, 360, 460].forEach(yy => arrow(o.cold, 320, yy, 180, yy, CO, 9)(1));
  o.a1 = el('g', { opacity: 0 }, sv); o.a1f = arrow(o.a1, 120, 300, 320, 300, HO, 13);
  o.a2 = el('g', { opacity: 0 }, sv); o.a2f = arrow(o.a2, 580, 300, 790, 300, HO, 13);
  o.loopG = el('g', { opacity: 0 }, sv);
  o.loopP = el('path', { d: 'M 800 250 Q 820 70 450 70 Q 90 70 100 250', fill: 'none', stroke: HO, 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-dasharray': '1400', 'stroke-dashoffset': '1400' }, o.loopG);
  el('polygon', { points: '100,262 82,226 120,228', fill: HO }, o.loopG);
  o.inArrow = el('g', { opacity: 0 }, sv); o.inF = arrow(o.inArrow, 370, 330, 530, 330, HO, 10);
  o.motor = badge(sv, 450, 128, '+ 모터의 열', HO, 34);
  sv.style.opacity = 0; return o;
}

// ───── 냉장고 단면(부품 지도, 원고 c4) viewBox 0 0 300 570 ─────
function fridgeMap(parent, x, y, w) {
  const k = w / 300, h = 570 * k, sv = svgAt(parent, x, y, w, h, '0 0 300 570');
  el('rect', { x: 10, y: 10, width: 280, height: 520, rx: 16, fill: '#f4f6f9', stroke: GR, 'stroke-width': 6 }, sv);
  el('rect', { x: 20, y: 20, width: 260, height: 312, fill: '#e6f0fb' }, sv);
  el('rect', { x: 20, y: 348, width: 260, height: 112, fill: '#d6e6fb' }, sv);
  el('line', { x1: 10, y1: 340, x2: 290, y2: 340, stroke: GR, 'stroke-width': 5 }, sv);
  el('line', { x1: 10, y1: 466, x2: 290, y2: 466, stroke: GR, 'stroke-width': 4 }, sv);
  [140, 240].forEach(yy => el('line', { x1: 20, y1: yy, x2: 210, y2: yy, stroke: '#b9c6d8', 'stroke-width': 4 }, sv));
  stxt(sv, 110, 110, '냉장실', 20, CO, 'middle', 800); stxt(sv, 110, 410, '냉동실', 20, CO, 'middle', 800);
  for (let i = 0; i < 4; i++) el('line', { x1: 238, y1: 180 + i * 34, x2: 268, y2: 196 + i * 34, stroke: CO, 'stroke-width': 4 }, sv);
  const P = {};
  P.led = el('g', {}, sv); el('circle', { cx: 150, cy: 34, r: 16, fill: '#ffe08a', opacity: .5 }, P.led); el('rect', { x: 140, y: 24, width: 20, height: 14, rx: 6, fill: '#f2a900' }, P.led);
  P.board = el('rect', { x: 222, y: 24, width: 48, height: 26, rx: 4, fill: '#1e88a8' }, sv);
  P.sens = el('g', {}, sv); el('rect', { x: 40, y: 168, width: 12, height: 40, rx: 6, fill: '#fff', stroke: COLOR.ink, 'stroke-width': 3 }, P.sens); el('circle', { cx: 46, cy: 212, r: 10, fill: HO, stroke: COLOR.ink, 'stroke-width': 3 }, P.sens);
  P.fan = el('circle', { cx: 250, cy: 130, r: 18, fill: '#fff', stroke: '#555', 'stroke-width': 4 }, sv);
  P.heat = el('g', {}, sv); [40, 60, 80].forEach(xx => el('line', { x1: xx, y1: 430, x2: xx, y2: 456, stroke: HO, 'stroke-width': 5 }, P.heat));
  P.comp = el('rect', { x: 110, y: 478, width: 90, height: 44, fill: '#b0b8c4', stroke: '#6b7686', 'stroke-width': 3 }, sv);
  sv.style.opacity = 0;
  return { sv, k, at: (px, py) => [x + px * k, y + py * k] };
}

const SCENES = {
  // ───────── L01 여는 질문 ─────────
  L01: {
    init(ctx) {
      const s = ctx.stage;
      this.f = fridgeFront(s, 360, 70, 560, { hand: true });
      this.q = qmark(s, 940, 140, 170);
      this.ti = big(s, 420, '냉장고와 에어컨', 110, { x: 960, w: 820 });
      this.sb = lab(s, 960, 580, 820, '차가움을 만드는 게 아니라 열을 옮겨요', 46, { cls: 'note' });
      this.t = { f: .1, h: ctx.w('손을') - .1, wv: ctx.w('따뜻할') - .1, q: ctx.eq('왜') - .1, ti: ctx.w('오늘은') - .1 };
    },
    frame(ctx, t) {
      show(this.f.sv, E.prog(t, this.t.f, .45), 30); grow(this.f.hand, E.prog(t, this.t.h, .35));
      op(this.f.wv, E.prog(t, this.t.wv, .4) * (.75 + .25 * Math.sin(t * 5)));
      pop(this.q, E.prog(t, this.t.q, .45), .5);
      pop(this.ti, E.prog(t, this.t.ti, .45), .8); show(this.sb, E.prog(t, this.t.ti + .3, .4), 16);
    },
  },
  L02: INTRO,
  // ───────── L03 먼저 한 줄로 ─────────
  L03: {
    init(ctx) {
      const s = ctx.stage;
      this.hd = lab(s, 0, 50, 1920, '먼저 한 줄로', 52, { color: COLOR.green, cls: 'ttl' });
      this.a = big(s, 160, '차가움을 만드는 기계', 96, { color: COLOR.sub });
      this.st = el('div', { class: 'abs noqa', style: { left: '470px', top: '222px', width: '980px', height: '12px', background: HO, borderRadius: '6px', transformOrigin: '0 50%', transform: 'scaleX(0)' } }, s);
      this.b = big(s, 340, '열을 <b>옮기는</b> 기계', 110);
      this.sv = svgAt(s, 460, 560, 1000, 240, '0 0 1000 240'); this.sv.style.opacity = 0;
      el('rect', { x: 10, y: 40, width: 280, height: 160, rx: 30, fill: '#dbe8fb', stroke: CO, 'stroke-width': 6 }, this.sv);
      stxt(this.sv, 150, 136, '안쪽', 52, CO, 'middle', 800);
      el('rect', { x: 710, y: 40, width: 280, height: 160, rx: 30, fill: '#f8dde1', stroke: HO, 'stroke-width': 6 }, this.sv);
      stxt(this.sv, 850, 136, '바깥쪽', 52, HO, 'middle', 800);
      this.ar = arrow(this.sv, 320, 120, 680, 120, HO, 14); stxt(this.sv, 500, 92, '열', 44, HO, 'middle', 800);
      this.t = { a: ctx.w('냉장고와') - .1, st: ctx.w('아니에요') - .1, b: ctx.w('옮기는') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, .05, .4), 12); show(this.a, E.prog(t, this.t.a, .4), 16);
      this.st.style.transform = `scaleX(${E.ease(E.prog(t, this.t.st, .45))})`;
      pop(this.b, E.prog(t, this.t.b, .45), .85); show(this.sv, E.prog(t, this.t.b, .4), 16); this.ar(E.prog(t, this.t.b + .3, .6));
    },
  },
  // ───────── L04 열을 옮기는 곳 (쇼츠 S1) ─────────
  L04: {
    init(ctx) {
      this.p = heatPanels(ctx);
      this.t = { f: Math.min(.2, ctx.w('냉장고는') - .1), fa: ctx.w('방으로') - .4, a: ctx.w('에어컨은') - .1, aa: ctx.w('집') - .3 };
    },
    frame(ctx, t) {
      const [f, a] = this.p;
      show(f.sv, E.prog(t, this.t.f, .45), 20); op(f.inner, E.prog(t, this.t.f + .3, .5)); op(f.ag, E.prog(t, this.t.fa, .1)); f.ar(E.prog(t, this.t.fa, .6)); op(f.wv, E.prog(t, this.t.fa + .5, .4));
      show(a.sv, E.prog(t, this.t.a, .45), 20); op(a.inner, E.prog(t, this.t.a + .3, .5)); op(a.ag, E.prog(t, this.t.aa, .1)); a.ar(E.prog(t, this.t.aa, .6)); op(a.wv, E.prog(t, this.t.aa + .5, .4));
    },
  },
  // ───────── L05 그래서 옆면이 따뜻해요 (쇼츠 S1) ─────────
  L05: {
    init(ctx) {
      this.p = heatPanels(ctx);
      this.p.forEach(p => { p.sv.style.opacity = 1; op(p.inner, 1); op(p.ag, 1); p.ar(1); op(p.wv, 1); });
      this.t = { c: ctx.w('차가워지고') - .1, w: ctx.w('따뜻해져요') - .1, fs: ctx.w('옆면이') - .1, as: ctx.w('실외기에서') - .1 };
    },
    frame(ctx, t) {
      const [f, a] = this.p;
      [f, a].forEach(p => { pop2(p.cold, E.prog(t, this.t.c, .4)); pop2(p.warm, E.prog(t, this.t.w, .4)); });
      const blink = (a0) => 1 + .9 * Math.max(0, Math.sin(E.clamp((t - a0) / 1.6) * Math.PI * 3));
      f.wv.setAttribute('stroke-width', 1); [...f.wv.children].forEach(c => c.setAttribute('stroke-width', 8 * blink(this.t.fs)));
      [...a.wv.children].forEach(c => c.setAttribute('stroke-width', 8 * blink(this.t.as)));
    },
  },
  // ───────── L06~L08 생활 속 세 가지 ─────────
  L06: {
    init(ctx) {
      this.c = clueCards(ctx);
      this.t = { all: ctx.eq('세') - .1, s: ctx.w('소독제를') - .1, st: ctx.w('날아가면서') - .1, tg: ctx.eq('증발', 1) - .1 };
    },
    frame(ctx, t) {
      this.c.forEach((o, k) => { o.box.style.opacity = .4 + .6 * E.prog(t, this.t.all, .4); o.ti.style.opacity = 0; });
      const o = this.c[0];
      show(o.ti, E.prog(t, this.t.s, .4), 14); show(o.sv, E.prog(t, this.t.s, .45), 20);
      op(o.steam, E.prog(t, this.t.st, .5) * (.7 + .3 * Math.sin(t * 4)));
      pop(o.tg, E.prog(t, this.t.tg, .4), .8);
      o.box.classList.toggle('on', t >= this.t.s);
    },
  },
  L07: {
    init(ctx) {
      this.c = clueCards(ctx); cardFull(this.c[0], 0); this.c.forEach(o => o.box.style.opacity = 1);
      this.t = { s: ctx.w('펌프를') - .1, p: ctx.w('누르면') - .1, w: ctx.w('따뜻해져요') - .1, tg: ctx.eq('압축') - .1 };
    },
    frame(ctx, t) {
      const o = this.c[1];
      show(o.ti, E.prog(t, this.t.s, .4), 14); show(o.sv, E.prog(t, this.t.s, .45), 20);
      const pr = t > this.t.p ? (1 - Math.cos((t - this.t.p) * 5)) / 2 : 0;
      o.hd.setAttribute('transform', `translate(0 ${pr * 60})`);
      op(o.hot, E.prog(t, this.t.w, .8) * .8);
      pop(o.tg, E.prog(t, this.t.tg, .4), .8);
      this.c.forEach((c, k) => c.box.classList.toggle('on', k === 1 && t >= this.t.s));
    },
  },
  L08: {
    init(ctx) {
      this.c = clueCards(ctx); cardFull(this.c[0], 0); cardFull(this.c[1], 1); this.c.forEach(o => o.box.style.opacity = 1);
      this.t = { s: ctx.w('파스를') - .1, p: ctx.w('누르고') - .1, c: ctx.w('압력이') - .1, tg: ctx.eq('팽창') - .1 };
    },
    frame(ctx, t) {
      const o = this.c[2];
      show(o.ti, E.prog(t, this.t.s, .4), 14); show(o.sv, E.prog(t, this.t.s, .45), 20);
      op(o.spray, E.prog(t, this.t.p, .3) * (.6 + .4 * Math.sin(t * 9)));
      const k = E.prog(t, this.t.c, .8); o.can.setAttribute('fill', k > .5 ? '#cfe0f6' : '#e9edf3');
      pop(o.tg, E.prog(t, this.t.tg, .4), .8);
      this.c.forEach((c, i) => c.box.classList.toggle('on', i === 2 && t >= this.t.s));
    },
  },
  // ───────── L09 세 가지에서 찾은 규칙 ─────────
  L09: {
    init(ctx) {
      const s = ctx.stage;
      this.c = clueCards(ctx); this.c.forEach((o, k) => { cardFull(o, k); o.box.style.opacity = 1; });
      this.ov = svgAt(s, 0, 0, 1920, 920, '0 0 1920 920', 'abs noqa');
      this.a1 = arrow(this.ov, 668, 440, 694, 440, GR, 8); this.a2 = arrow(this.ov, 1228, 440, 1254, 440, GR, 8);
      this.ret = el('path', { d: 'M 1400 780 Q 1400 860 1300 860 L 500 860 Q 400 860 400 790', fill: 'none', stroke: COLOR.green, 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': 1300, 'stroke-dashoffset': 1300 }, this.ov);
      this.retH = el('polygon', { points: '400,778 384,808 416,808', fill: COLOR.green, opacity: 0 }, this.ov);
      this.t = { k: [ctx.w('증발하면') - .1, ctx.w('압축하면') - .1, ctx.w('압력을') - .1], r: ctx.w('한') - .1 };
    },
    frame(ctx, t) {
      this.c.forEach((o, k) => { const b = Math.sin(E.prog(t, this.t.k[k], .5) * Math.PI); o.box.dataset.base = ''; o.box.style.transform = `translateY(${-18 * b}px)`; o.box.classList.toggle('on', t >= this.t.k[k] && (k === 2 || t < this.t.k[k + 1])); });
      const u = E.prog(t, this.t.r, 1.0); this.a1(u * 2); this.a2(u * 2 - .5);
      this.ret.setAttribute('stroke-dashoffset', 1300 * (1 - E.ease(E.prog(t, this.t.r + .4, 1.0)))); op(this.retH, E.prog(t, this.t.r + 1.3, .2));
    },
  },
  // ───────── L10~L15 냉매 고리 ─────────
  L10: {
    init(ctx) {
      this.o = cycle(ctx.stage, 210, 70, 1500);
      this.t = { p: ctx.w('관이') - .1, m: ctx.eq('냉매') - .1 };
    },
    frame(ctx, t) {
      const o = this.o; o.sv.style.opacity = E.prog(t, 0, .4);
      o.move(t, .045, E.prog(t, this.t.m, .4)); pop2(o.mid, E.prog(t, this.t.m, .4));
    },
  },
  L11: {
    init(ctx) { this.o = cycleScene(ctx, 0); this.t = { a: ctx.w('첫째는') - .1, h: ctx.w('열을') - .1 }; },
    frame(ctx, t) {
      const o = this.o; o.color.e = t >= this.t.a; o.paint(); o.move(t);
      pop2(o.b[0], E.prog(t, this.t.a, .4)); op(o.inL, E.prog(t, this.t.a, .4)); op(o.heatIn, E.prog(t, this.t.h, .5));
    },
  },
  L12: {
    init(ctx) { this.o = cycleScene(ctx, 1); this.t = { a: ctx.w('둘째는') - .1, c: ctx.w('압축기가') - .1 }; },
    frame(ctx, t) {
      const o = this.o; o.color.c = t >= this.t.a; o.paint(); o.move(t);
      pop2(o.b[1], E.prog(t, this.t.a, .4));
      const w = t > this.t.c ? Math.sin((t - this.t.c) * 9) * 4 * (1 - E.prog(t, this.t.c + 1.2, .6)) : 0; o.comp.setAttribute('transform', `translate(${w} 0)`);
    },
  },
  L13: {
    init(ctx) { this.o = cycleScene(ctx, 2); this.t = { a: ctx.w('셋째는') - .1, h: ctx.w('버려요') - .1 }; },
    frame(ctx, t) {
      const o = this.o; o.color.r = t >= this.t.a; o.paint(); o.move(t);
      pop2(o.b[2], E.prog(t, this.t.a, .4)); op(o.outL, E.prog(t, this.t.a, .4)); op(o.heatOut, E.prog(t, this.t.h, .5) * (.75 + .25 * Math.sin(t * 5)));
    },
  },
  L14: {
    init(ctx) { this.o = cycleScene(ctx, 3); this.t = { a: ctx.w('넷째는') - .1 }; },
    frame(ctx, t) { const o = this.o; o.color.x = t >= this.t.a; o.paint(); o.move(t); pop2(o.b[3], E.prog(t, this.t.a, .4)); },
  },
  L15: {
    init(ctx) { this.o = cycleScene(ctx, 4); this.t = { f: ctx.w('계속') - .1, e: ctx.w('전기는') - .1 }; },
    frame(ctx, t) {
      const o = this.o, f = E.prog(t, this.t.f, 1.0); o.move(t * (1 + f * .8)); pop2(o.elec, E.prog(t, this.t.e, .4));
    },
  },
  // ───────── L16 냉장고 부품 지도 ─────────
  L16: {
    init(ctx) {
      const s = ctx.stage;
      this.m = fridgeMap(s, 760, 30, 400);
      this.ov = svgAt(s, 0, 0, 1920, 920, '0 0 1920 920', 'abs noqa');
      const T = [['board', 222 + 24, 37, 1240, 110, '제어 기판 · 판단해요', CTLC, '제어'],
                 ['sens', 46, 190, 120, 330, '온도 센서 · 온도를 재요', SE, '온도'],
                 ['comp', 155, 500, 1240, 760, '압축기 · 냉매를 눌러 담아요', HO, '압축기와'],
                 ['fan', 250, 130, 1240, 330, '팬 · 찬 바람을 보내요', HO, '팬'],
                 ['led', 150, 31, 120, 110, '전등 · 문 열면 켜져요', HO, '전등'],
                 ['heat', 60, 443, 120, 560, '히터 · 성에를 녹여요', HO, '히터가']];
      this.items = T.map(([k, px, py, tx, ty, txt, col, cue]) => {
        const [ax, ay] = this.m.at(px, py), left = tx < 760;
        const tg = el('div', { class: 'abs cap', style: { left: tx + 'px', top: ty + 'px', background: col, fontSize: '40px', opacity: 0 } }, s); tg.textContent = txt;
        return { tg, ax, ay, left, ty, line: el('line', { stroke: col, 'stroke-width': 4, opacity: 0 }, this.ov), dot: el('circle', { r: 7, fill: col, opacity: 0, cx: ax, cy: ay }, this.ov), cue };
      });
      this.t = { m: .1, it: this.items.map(it => (it.cue === '온도' ? ctx.eq('온도', 1) : ctx.w(it.cue)) - .1) };
    },
    frame(ctx, t) {
      show(this.m.sv, E.prog(t, this.t.m, .45), 20);
      this.items.forEach((it, i) => {
        const u = E.prog(t, this.t.it[i], .4); it.tg.style.opacity = E.clamp(u * 2);
        if (u > 0) { const r = it.tg.getBoundingClientRect(), sr = ctx.stage.getBoundingClientRect();
          const ex = it.left ? r.right - sr.left + 6 : r.left - sr.left - 6, ey = it.ty + r.height / 2;
          it.line.setAttribute('x1', ex); it.line.setAttribute('y1', ey); it.line.setAttribute('x2', E.lerp(ex, it.ax, E.ease(u))); it.line.setAttribute('y2', E.lerp(ey, it.ay, E.ease(u))); }
        op(it.line, u * 2); op(it.dot, E.prog(t, this.t.it[i] + .3, .2));
      });
    },
  },
  // ───────── L17 차갑게 유지하기 ─────────
  L17: {
    init(ctx) {
      const s = ctx.stage;
      const C = [['① 알아채기', '온도 센서(서미스터)', SE], ['② 판단하기', '제어 기판', CTLC], ['③ 움직이기', '압축기 모터', HO]];
      this.c = C.map((c, i) => {
        const x = 180 + i * 540, b = el('div', { class: 'abs panelc noqa', style: { left: x + 'px', top: '30px', width: '480px', height: '250px', opacity: 0 } }, s);
        const h = tag(s, x + 60, 60, 360, c[0], c[2]); const l = lab(s, x, 170, 480, c[1], 44, { cls: 'ttl' });
        return { b, h, l };
      });
      this.ar = [arrow(svgAt(s, 660, 130, 60, 40, '0 0 60 40', 'abs noqa'), 4, 20, 56, 20, GR, 7), arrow(svgAt(s, 1200, 130, 60, 40, '0 0 60 40', 'abs noqa'), 4, 20, 56, 20, GR, 7)];
      const g = this.g = svgAt(s, 140, 330, 1580, 520, '0 0 1580 520'); g.style.opacity = 0;
      stxt(g, 760, 36, '정속형 압축기를 켜고 끄는 예시 (숫자는 설명용)', 34, COLOR.sub);
      el('line', { x1: 120, y1: 470, x2: 1360, y2: 470, stroke: '#9aa4b2', 'stroke-width': 4 }, g); el('line', { x1: 120, y1: 70, x2: 120, y2: 470, stroke: '#9aa4b2', 'stroke-width': 4 }, g);
      stxt(g, 100, 110, '안쪽', 30, COLOR.sub, 'end'); stxt(g, 100, 148, '온도', 30, COLOR.sub, 'end'); stxt(g, 1360, 510, '시간', 30, COLOR.sub, 'end');
      const HI = 150, LO = 330;
      el('line', { x1: 120, y1: HI, x2: 1360, y2: HI, stroke: HO, 'stroke-width': 3, 'stroke-dasharray': '12 10' }, g); el('line', { x1: 120, y1: LO, x2: 1360, y2: LO, stroke: CO, 'stroke-width': 3, 'stroke-dasharray': '12 10' }, g);
      stxt(g, 1376, HI + 12, '4°C → 켜기', 34, HO, 'start', 800); stxt(g, 1376, LO + 12, '2°C → 쉬기', 34, CO, 'start', 800);
      const pts = []; let v = LO - 30, cool = false; this.on = [];
      for (let x = 120; x <= 1360; x += 8) { v += cool ? 14 : -5; if (v <= HI) { v = HI; cool = true; this.on.push([x, null]); } if (v >= LO && cool) { v = LO; cool = false; this.on[this.on.length - 1][1] = x; } pts.push([x, v]); }
      this.bands = this.on.map(([a, b]) => { const r = el('rect', { x: a, y: 420, width: (b || 1360) - a, height: 34, fill: HO, opacity: 0, rx: 6 }, g); return r; });
      this.bt = stxt(g, this.on[0][0], 408, '압축기 켜짐', 28, HO, 'start', 800); this.bt.setAttribute('opacity', 0);
      this.pl = el('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: COLOR.ink, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
      this.len = pts.length * 20; this.pl.setAttribute('stroke-dasharray', this.len * 3); this.pl.setAttribute('stroke-dashoffset', this.len * 3);
      this.pts = pts;
      this.t = { c: [ctx.w('서미스터') - .1, ctx.w('제어') - .1, ctx.w('돌리고') - .1], g: ctx.w('설정') - .1 };
    },
    frame(ctx, t) {
      this.c.forEach((c, i) => { const u = E.prog(t, this.t.c[i], .45); pop(c.b, u, .85); c.h.style.opacity = E.clamp(u * 2); c.l.style.opacity = E.clamp(u * 2); });
      this.ar.forEach((a, i) => a(E.prog(t, this.t.c[i + 1] - .2, .4)));
      const gu = E.prog(t, this.t.g, .4); this.g.style.opacity = gu;
      const p = E.clamp((t - this.t.g) / Math.max(1, ctx.dur - this.t.g - .3)), xEnd = 120 + p * 1240;
      let L = 0; for (let i = 1; i < this.pts.length && this.pts[i][0] <= xEnd; i++) L += Math.hypot(this.pts[i][0] - this.pts[i - 1][0], this.pts[i][1] - this.pts[i - 1][1]);
      this.pl.setAttribute('stroke-dashoffset', this.len * 3 - L);
      this.bands.forEach((r, i) => op(r, xEnd > this.on[i][0] ? .85 : 0)); op(this.bt, xEnd > this.on[0][0] + 150 ? 1 : 0);
    },
  },
  // ───────── L18 인버터 방식 ─────────
  L18: {
    init(ctx) {
      const s = ctx.stage;
      this.P = [['예전 방식(정속형)', '켜기 · 끄기만', 200], ['인버터 방식', '속도를 바꿔요', 1020]].map(([h, sub, x]) => {
        const b = el('div', { class: 'abs panelc noqa', style: { left: x + 'px', top: '110px', width: '700px', height: '600px', opacity: 0 } }, s);
        const ti = lab(s, x, 150, 700, h, 56, { cls: 'ttl' }); const sb = lab(s, x, 240, 700, sub, 40, { cls: 'note' });
        const sv = svgAt(s, x + 70, 360, 560, 260, '0 0 560 260'); sv.style.opacity = 0;
        stxt(sv, 0, 40, '압축기 세기', 34, COLOR.sub, 'start');
        el('rect', { x: 0, y: 70, width: 560, height: 70, rx: 35, fill: '#eef1f5', stroke: '#cfd8e3', 'stroke-width': 4 }, sv);
        const bar = el('rect', { x: 0, y: 70, width: 0, height: 70, rx: 35, fill: OR }, sv);
        const txt = stxt(sv, 280, 220, '', 40, COLOR.ink, 'middle', 800);
        return { b, ti, sb, sv, bar, txt };
      });
      this.t = { a: Math.min(.2, ctx.w('예전') - .1), on: ctx.w('켜고') - .1, b: ctx.w('요즘') - .1, slow: ctx.w('천천히') - .2, fast: ctx.w('빠르게') - .2 };
    },
    frame(ctx, t) {
      const [A, B] = this.P;
      [[A, this.t.a], [B, this.t.b]].forEach(([p, a]) => { const u = E.prog(t, a, .45); pop(p.b, u, .9); p.ti.style.opacity = E.clamp(u * 2); show(p.sb, E.prog(t, a + .3, .4), 12); p.sv.style.opacity = E.clamp(u * 2); });
      const onA = t > this.t.on && Math.floor((t - this.t.on) / .9) % 2 === 0;
      A.bar.setAttribute('width', t > this.t.on ? (onA ? 560 : 0) : 0); A.txt.textContent = t > this.t.on ? (onA ? '켜짐' : '꺼짐') : '';
      let w = 0, tx = '';
      if (t > this.t.slow) { w = E.lerp(0, 200, E.ease(E.prog(t, this.t.slow, .5))); tx = '조금 따뜻 → 천천히'; }
      if (t > this.t.fast) { w = E.lerp(200, 520, E.ease(E.prog(t, this.t.fast, .5))); tx = '많이 따뜻 → 빠르게'; }
      B.bar.setAttribute('width', w); B.txt.textContent = tx;
    },
  },
  // ───────── L19 문 열면 불 켜기 ─────────
  L19: {
    init(ctx) {
      const s = ctx.stage, sv = this.sv = svgAt(s, 380, 30, 1140, 855, '0 0 1200 900'); sv.style.opacity = 0;
      stxt(sv, 500, 50, '위에서 내려다본 냉장고', 40, COLOR.sub);
      this.glow = el('circle', { cx: 500, cy: 340, r: 140, fill: '#ffe08a', opacity: 0 }, sv);
      el('rect', { x: 300, y: 80, width: 400, height: 390, rx: 16, fill: 'none', stroke: GR, 'stroke-width': 10 }, sv);
      this.led = el('rect', { x: 470, y: 390, width: 60, height: 28, rx: 10, fill: '#cfd6e0', stroke: '#9aa4b2', 'stroke-width': 3 }, sv);
      this.sw = el('g', {}, sv); el('rect', { x: 640, y: 440, width: 50, height: 26, fill: '#555' }, this.sw);
      this.pl = el('rect', { x: 655, y: 466, width: 20, height: 24, fill: SE }, sv);
      this.door = el('rect', { x: 300, y: 472, width: 400, height: 32, rx: 8, fill: '#e3e8ef', stroke: GR, 'stroke-width': 6 }, sv);
      this.bS = badge(sv, 960, 520, '문 스위치 · 알아채기', SE, 42); this.bL = badge(sv, 960, 300, '전등 · 움직이기', HO, 42);
      this.l1 = el('line', { x1: 760, y1: 520, x2: 690, y2: 476, stroke: SE, 'stroke-width': 4, opacity: 0 }, sv);
      this.l2 = el('line', { x1: 800, y1: 300, x2: 535, y2: 400, stroke: HO, 'stroke-width': 4, opacity: 0 }, sv);
      this.t = { c: ctx.w('닫으면') - .1, sw: ctx.w('스위치를') - .1, o: ctx.w('열면') - .1, on: ctx.w('켜요') - .2 };
    },
    frame(ctx, t) {
      show(this.sv, E.prog(t, 0, .4), 16);
      const close = E.ease(E.prog(t, this.t.c, .6)), open = E.ease(E.prog(t, this.t.o, .6));
      const ang = 50 * (1 - close) + 70 * open;                       // 0 = 닫힘
      this.door.setAttribute('transform', `rotate(${ang} 300 488)`);
      const pressed = ang < 6; this.pl.setAttribute('height', pressed ? 6 : 24);
      pop2(this.bS, E.prog(t, this.t.sw, .4)); op(this.l1, E.prog(t, this.t.sw + .2, .3));
      const on = E.prog(t, this.t.on, .3); op(this.glow, on * .45); this.led.setAttribute('fill', on > .5 ? '#f2a900' : '#cfd6e0');
      pop2(this.bL, on); op(this.l2, on);
    },
  },
  // ───────── L20 성에 녹이기 ─────────
  L20: {
    init(ctx) {
      const s = ctx.stage, sv = this.sv = svgAt(s, 260, 40, 1400, 820, '0 0 1400 820'); sv.style.opacity = 0;
      this.mo = []; for (let i = 0; i < 18; i++) this.mo.push({ x: 260 + (i * 61) % 820, y0: 30 + (i * 37) % 60, ty: [230, 380, 530][i % 3] - 26, c: el('circle', { r: 7, fill: '#9ec3ea', opacity: 0 }, sv) });
      this.fr = []; this.dr = [];
      [230, 380, 530].forEach(y => {
        el('rect', { x: 220, y: y - 18, width: 860, height: 36, rx: 18, fill: '#cfe0f6', stroke: CO, 'stroke-width': 6 }, sv);
        for (let k = 0; k < 9; k++) {
          this.fr.push(el('ellipse', { cx: 270 + k * 95, cy: y - 22, rx: 40, ry: 14, fill: '#fff', stroke: '#c9d6e8', 'stroke-width': 3, opacity: 0 }, sv));
          this.dr.push({ x: 270 + k * 95, y, c: el('path', { d: 'M 0 -14 Q 10 2 0 8 Q -10 2 0 -14 Z', fill: '#7aa7d9', opacity: 0 }, sv) });
        }
      });
      this.ht = el('rect', { x: 220, y: 640, width: 860, height: 30, rx: 15, fill: '#e9c9c9', stroke: HO, 'stroke-width': 5 }, sv);
      this.htG = el('rect', { x: 210, y: 620, width: 880, height: 70, rx: 30, fill: HO, opacity: 0 }, sv);
      this.bP = badge(sv, 1240, 170, '차가운 관', CO, 44);
      this.bF = badge(sv, 1240, 330, '성에', '#7a8ba3', 44);
      this.bH = badge(sv, 1240, 655, '히터', HO, 44);
      this.bK = badge(sv, 650, 760, '간접 냉각 · 팬으로 찬 바람을 보내요', COLOR.green, 36);
      this.t = { m: ctx.w('수분은') - .1, f: ctx.w('얼어붙어') - .1, k: ctx.w('간접') - .1, h: ctx.w('히터로') - .1, melt: ctx.w('녹여요') - .3 };
    },
    frame(ctx, t) {
      show(this.sv, E.prog(t, 0, .4), 16); pop2(this.bP, E.prog(t, .1, .4));
      this.mo.forEach(m => { const u = E.prog(t, this.t.m + (m.x % 5) * .1, 1.2); m.c.setAttribute('cx', m.x); m.c.setAttribute('cy', E.lerp(m.y0, m.ty, u)); op(m.c, u > 0 && u < 1 ? 1 : 0); });
      const fz = E.prog(t, this.t.f, 1.0), melt = E.prog(t, this.t.h + .6, 2.2);
      this.fr.forEach(f => { op(f, fz * (1 - melt)); f.setAttribute('ry', 14 * (1 - melt * .7)); });
      pop2(this.bF, fz); pop2(this.bK, E.prog(t, this.t.k, .4));
      const h = E.prog(t, this.t.h, .4); op(this.htG, h * (.18 + .08 * Math.sin(t * 6))); pop2(this.bH, h);
      this.dr.forEach((d, i) => { const u = (t - this.t.melt - (i % 5) * .15); if (u > 0) { const yy = d.y + 30 + (u * 160) % 110; d.c.setAttribute('transform', `translate(${d.x} ${yy})`); op(d.c, .9); } else op(d.c, 0); });
    },
  },
  // ───────── L21 에어컨은 왜 둘로 ─────────
  L21: {
    init(ctx) {
      this.o = acPlace(ctx);
      this.bP = badge(this.o.sv, 1150, 130, '냉매 관', COLOR.green, 44);
      this.t = { a: Math.min(.2, ctx.w('에어컨이에요') - .1), i: ctx.w('실내기와') - .1, o: ctx.w('실외기로') - .1, p: ctx.w('냉매') - .1 };
    },
    frame(ctx, t) {
      const o = this.o; show(o.sv, E.prog(t, this.t.a, .45), 16); o.spin(t);
      op(o.indC, E.prog(t, this.t.i, .5)); pop2(o.bIn, E.prog(t, this.t.i, .4));
      op(o.out, E.prog(t, this.t.o, .5)); pop2(o.bOut, E.prog(t, this.t.o, .4)); op(o.wOut, E.prog(t, this.t.o + .3, .4) * (.75 + .25 * Math.sin(t * 5)));
      pop2(this.bP, E.prog(t, this.t.p, .4));
      const pk = Math.sin(E.prog(t, this.t.p, .8) * Math.PI); o.pipe.setAttribute('opacity', 1); [...o.pipe.children].forEach(c => c.setAttribute('stroke', pk > .2 ? COLOR.green : '#9aa6bb'));
    },
  },
  // ───────── L22 리모컨과 온도 맞추기 ─────────
  L22: {
    init(ctx) {
      const o = this.o = acPlace(ctx), sv = o.sv; o.sv.style.opacity = 1; op(o.indC, 1);
      this.rm = el('g', { opacity: 0 }, sv);
      el('rect', { x: 230, y: 470, width: 110, height: 230, rx: 26, fill: '#fff', stroke: COLOR.ink, 'stroke-width': 6, transform: 'rotate(-18 285 585)' }, this.rm);
      el('circle', { cx: 275, cy: 540, r: 16, fill: HO, transform: 'rotate(-18 285 585)' }, this.rm);
      this.ir = []; for (let i = 0; i < 4; i++) this.ir.push(el('path', { d: `M ${330 + i * 80} ${440 - i * 60} q 40 -10 60 -45`, fill: 'none', stroke: '#c62828', 'stroke-width': 6, 'stroke-dasharray': '8 10', opacity: 0 }, sv));
      this.bR = badge(sv, 720, 60, '적외선 수신부', SE, 36);
      this.bT = badge(sv, 560, 420, '희망 24°C', SE, 44);
      this.bS = badge(sv, 430, 60, '온도 센서', SE, 36);
      stxt(sv, 1090, 732, '압축기', 34, COLOR.sub, 'end');
      el('rect', { x: 1100, y: 708, width: 360, height: 34, rx: 17, fill: '#eef1f5', stroke: '#cfd8e3', 'stroke-width': 3 }, sv);
      this.bar = el('rect', { x: 1100, y: 708, width: 0, height: 34, rx: 17, fill: OR }, sv);
      this.t = { r: ctx.w('누르면') - .2, ir: ctx.w('적외선') - .1, rc: ctx.w('수신부가') - .1, tp: ctx.w('희망') - .1, se: ctx.w('방') - .1, hi: ctx.w('세게') - .2, lo: ctx.w('약하게') - .2 };
    },
    frame(ctx, t) {
      const o = this.o; o.spin(t);
      op(this.rm, E.prog(t, Math.min(this.t.r, .3), .4));
      this.ir.forEach((p, i) => op(p, t > this.t.ir ? (Math.floor((t - this.t.ir) * 4 - i) % 4 === 0 ? 1 : .35) * (t < this.t.ir + 4 ? 1 : 0) : 0));
      pop2(this.bR, E.prog(t, this.t.rc, .4)); pop2(this.bT, E.prog(t, this.t.tp, .4)); pop2(this.bS, E.prog(t, this.t.se, .4));
      let w = 0; if (t > this.t.hi) w = 340 * E.ease(E.prog(t, this.t.hi, .4)); if (t > this.t.lo) w = E.lerp(340, 110, E.ease(E.prog(t, this.t.lo, .5)));
      this.bar.setAttribute('width', w);
    },
  },
  // ───────── L23 날개와 물방울 ─────────
  L23: {
    init(ctx) {
      const o = this.o = acPlace(ctx), sv = o.sv; o.sv.style.opacity = 1; op(o.indC, 1);
      this.hose = el('path', { d: 'M 210 280 L 210 520 Q 210 600 290 600 L 420 600', fill: 'none', stroke: '#7aa7d9', 'stroke-width': 14, 'stroke-linecap': 'round', opacity: 0 }, sv);
      this.dr = []; for (let i = 0; i < 6; i++) this.dr.push(el('circle', { r: 8, fill: '#7aa7d9', opacity: 0 }, sv));
      this.fl = []; for (let i = 0; i < 6; i++) this.fl.push(el('circle', { r: 7, fill: '#3b6fb6', opacity: 0 }, sv));
      this.bW = badge(sv, 480, 345, '날개 모터 · 바람 방향', HO, 40);
      this.bD = badge(sv, 560, 520, '배수 호스 · 물을 빼요', CO, 40);
      this.bH = badge(sv, 560, 690, '습도 ↓', COLOR.green, 48);
      this.t = { w: ctx.w('날개는') - .1, d: ctx.w('물방울이') - .1, h: ctx.w('배수') - .1, m: ctx.w('습도도') - .1 };
    },
    frame(ctx, t) {
      const o = this.o; o.spin(t);
      const sw = t > this.t.w ? Math.sin((t - this.t.w) * 2.2) * 9 : 0; o.louver.setAttribute('transform', `rotate(${sw} 480 262)`);
      pop2(this.bW, E.prog(t, this.t.w, .4));
      this.dr.forEach((d, i) => { const u = t - this.t.d - i * .2; if (u > 0) { d.setAttribute('cx', 280 + i * 70); d.setAttribute('cy', 160 + (u * 40) % 70); op(d, .9); } else op(d, 0); });
      op(this.hose, E.prog(t, this.t.h, .4)); pop2(this.bD, E.prog(t, this.t.h, .4));
      const P = [[210, 280], [210, 520], [250, 595], [420, 600]];
      this.fl.forEach((f, i) => { const u = ((t - this.t.h) * .5 + i / 6) % 1; if (t > this.t.h + .3) { const seg = u * 3, k = Math.floor(seg), r = seg - k, a = P[k], b = P[k + 1]; f.setAttribute('cx', E.lerp(a[0], b[0], r)); f.setAttribute('cy', E.lerp(a[1], b[1], r)); op(f, 1); } else op(f, 0); });
      pop2(this.bH, E.prog(t, this.t.m, .4));
    },
  },
  // ───────── L24 겨울에는? (쇼츠 S3) ─────────
  L24: {
    init(ctx) {
      const o = this.o = acPlace(ctx), sv = o.sv;
      this.sn = snow(sv);
      this.bQ = badge(sv, 480, 420, '난방?', HO, ctx.long ? 56 : 72);
      this.cd = ctx.long ? countdown(ctx, ctx.stage, 940, 600, 120) : countdown(ctx, ctx.stage, 430, 505, 96);
      this.t = { a: Math.min(.2, ctx.w('그럼') - .1), w: ctx.w('겨울에는') - .1, q: ctx.w('난방도') - .1 };
    },
    frame(ctx, t) {
      const o = this.o; show(o.sv, E.prog(t, this.t.a, .4), 16); o.spin(t * .3);
      op(this.sn.g, E.prog(t, this.t.w, .5)); this.sn.step(t); op(o.out, E.prog(t, this.t.w, .5));
      pop2(this.bQ, E.prog(t, this.t.q, .4)); this.cd(t);
    },
  },
  // ───────── L25 거꾸로 돌리면 난방 (쇼츠 S3) ─────────
  L25: {
    init(ctx) {
      const o = this.o = acPlace(ctx), sv = o.sv; o.sv.style.opacity = 1; op(o.out, 1);
      this.sn = snow(sv); op(this.sn.g, 1);
      op(o.go, 1); o.goA(1);
      const fs = ctx.long ? 44 : 60;
      this.bV = badge(sv, 1150, 130, '사방밸브 · 방향 바꾸기', PU, ctx.long ? 40 : 52);
      this.bP = badge(sv, 480, ctx.long ? 520 : 540, '히트펌프', COLOR.green, ctx.long ? 52 : 68);
      op(o.bIn, 1); op(o.bOut, 1);
      this.t = { v: ctx.w('밸브') - .1, d: ctx.w('방향을') - .1, out: ctx.w('실외기가') - .1, in: ctx.w('실내기가') - .1, p: ctx.w('히트펌프') - .1 };
    },
    frame(ctx, t) {
      const o = this.o; o.spin(t); this.sn.step(t);
      pop2(this.bV, E.prog(t, this.t.v, .4));
      const d = E.prog(t, this.t.d, .5); op(o.go, 1 - d); op(o.back, d); o.backA(E.prog(t, this.t.d + .2, .7));
      if (t >= this.t.out) o.bOut.setText('실외기 · 열을 빼앗아요', CO); else o.bOut.setText('실외기 · 열을 버려요', HO);
      if (t >= this.t.in) o.bIn.setText('실내기 · 열을 버려요', HO); else o.bIn.setText('실내기 · 열을 빼앗아요', CO);
      o.bOut.setAttribute('transform', t >= this.t.out ? `translate(0 ${-10 * Math.sin(E.prog(t, this.t.out, .4) * Math.PI)})` : '');
      o.bIn.setAttribute('transform', t >= this.t.in ? `translate(0 ${-10 * Math.sin(E.prog(t, this.t.in, .4) * Math.PI)})` : '');
      op(o.indC, 0); o.fin.setAttribute('opacity', 1);
      [...o.fin.children].forEach(c => c.setAttribute('stroke', t >= this.t.in ? HO : CO)); [...o.hfin.children].forEach(c => c.setAttribute('stroke', t >= this.t.out ? CO : HO));
      op(o.wOut, 0); pop2(this.bP, E.prog(t, this.t.p, .4));
    },
  },
  // ───────── L26 비교 ─────────
  L26: {
    init(ctx) {
      const s = ctx.stage;
      this.hd = lab(s, 0, 60, 1920, '같은 원리, 다른 장소', 56, { cls: 'ttl', color: COLOR.green });
      this.tb = el('div', { class: 'abs cmp', style: { left: '300px', top: '170px', width: '1320px', gridTemplateColumns: '300px 510px 510px', fontSize: '46px', opacity: 0 } }, s);
      const R = [['', '열을 빼앗는 곳', '열을 버리는 곳'], ['냉장고', '냉장고 안', '방(옆면·뒤쪽)'], ['에어컨', '방 안(실내기)', '집 밖(실외기)']];
      this.cells = [];
      R.forEach((r, i) => r.forEach((c, j) => { const d = el('div', { class: i === 0 ? 'h' : '' }, this.tb); d.innerHTML = c; if (i > 0 && j === 1) d.style.color = CO; if (i > 0 && j === 2) d.style.color = HO; if (j === 0 && i > 0) d.style.fontWeight = 800; this.cells.push([i, d]); }));
      this.c = chip(s, 560, 620, 800, '열을 <b style="color:#3b6fb6">빼앗는 곳</b>과 <b style="color:#d24a5a">버리는 곳</b>만 달라요', { size: 48 });
      this.t = { a: .1, f: ctx.w('냉장고는') - .1, e: ctx.w('에어컨은') - .1, c: ctx.w('원리는') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, this.t.a, .4), 12); this.tb.style.opacity = E.prog(t, this.t.a, .4);
      this.cells.forEach(([i, d]) => d.style.opacity = i === 0 ? 1 : E.prog(t, i === 1 ? this.t.f : this.t.e, .4));
      pop(this.c, E.prog(t, this.t.c, .45), .85);
    },
  },
  // ───────── L27 퀴즈 (쇼츠 S2) ─────────
  L27: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.f = fridgeOpen(s, L ? 260 : 40, L ? 100 : 20, L ? 560 : 340);
      this.c = chip(s, L ? 960 : 60, L ? 140 : 480, L ? 760 : 740, '문을 열어 두면 <b>방이 시원해질까?</b>', { size: L ? 50 : 42, color: CO });
      this.O = el('div', { class: 'abs ox', style: { left: (L ? 1000 : 430) + 'px', top: (L ? 320 : 60) + 'px', width: (L ? 300 : 170) + 'px', height: (L ? 300 : 170) + 'px', fontSize: (L ? 200 : 120) + 'px', opacity: 0 } }, s); this.O.textContent = 'O';
      this.X = el('div', { class: 'abs ox', style: { left: (L ? 1380 : 640) + 'px', top: (L ? 320 : 60) + 'px', width: (L ? 300 : 170) + 'px', height: (L ? 300 : 170) + 'px', fontSize: (L ? 200 : 120) + 'px', opacity: 0 } }, s); this.X.textContent = 'X';
      this.cd = L ? countdown(ctx, s, 1340, 660, 120) : countdown(ctx, s, 620, 270, 100);
      this.t = { f: ctx.w('냉장고') - .1, q: ctx.w('시원해질까요') - .1 };
    },
    frame(ctx, t) {
      show(this.f.sv, E.prog(t, Math.min(this.t.f, .4), .45), 20); op(this.f.cold, E.prog(t, this.t.f + .4, .5) * (.7 + .3 * Math.sin(t * 4)));
      pop(this.c, E.prog(t, this.t.f + .2, .45), .85); pop(this.O, E.prog(t, this.t.q, .4), .7); pop(this.X, E.prog(t, this.t.q + .15, .4), .7); this.cd(t);
    },
  },
  // ───────── L28 정답 (쇼츠 S2) ─────────
  L28: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.v = chip(s, L ? 1110 : 110, L ? 110 : 40, L ? 600 : 640, '<b style="color:#d24a5a">X</b> · 오히려 더워져요', { size: L ? 56 : 46, color: HO });
      this.o = fridgeSide(s, L ? 100 : 130, L ? 90 : 135, L ? 960 : 600);
      this.m = chip(s, L ? 1110 : 110, L ? 560 : 545, L ? 600 : 640, '에어컨은 실외기를 <b>집 밖에</b>', { size: L ? 44 : 40, color: COLOR.green });
      this.t = { v: Math.min(.1, ctx.w('아니요') - .1), b: ctx.w('뒤쪽으로') - .2, m: ctx.w('전기까지') - .1, a: ctx.w('실외기를') - .1 };
    },
    frame(ctx, t) {
      const o = this.o; pop(this.v, E.prog(t, this.t.v, .45), .8); show(o.sv, E.prog(t, this.t.v + .3, .45), 20);
      op(o.cold, E.prog(t, .9, .5)); op(o.a1, E.prog(t, 1.2, .1)); o.a1f(E.prog(t, 1.2, .7));
      op(o.inArrow, E.prog(t, this.t.b - .6, .1)); o.inF(E.prog(t, this.t.b - .6, .5));
      op(o.a2, E.prog(t, this.t.b, .1)); o.a2f(E.prog(t, this.t.b, .6));
      op(o.loopG, E.prog(t, this.t.b + .6, .1)); o.loopP.setAttribute('stroke-dashoffset', 1400 * (1 - E.ease(E.prog(t, this.t.b + .6, 1.2))));
      pop2(o.motor, E.prog(t, this.t.m, .4)); pop(this.m, E.prog(t, this.t.a, .45), .85);
    },
  },
  // ───────── L29 정리 ─────────
  L29: {
    init(ctx) {
      const s = ctx.stage;
      this.box = el('div', { class: 'abs sumbox noqa', style: { left: '120px', top: '90px', width: '980px', height: '640px', fontSize: '46px', opacity: 0 } }, s);
      this.lines = ['냉장고와 에어컨은', '열을 <b>안에서 밖으로</b> 옮기는 기계', '냉매가 한 바퀴씩 돌아요', '<span style="color:#3b6fb6">증발</span> → <span style="color:#8c6fb0">압축</span> → <span style="color:#d24a5a">열 버리기</span> → <span style="color:#e0701b">팽창</span>'].map((h, i) => { const d = lab(s, 170, 140 + i * 130, 900, h, i === 3 ? 44 : 50, { cls: 'fx' }); d.style.textAlign = 'left'; return d; });
      this.blog = el('div', { class: 'abs blogc', style: { left: '1160px', top: '130px', width: '600px' } }, s);
      this.blog.innerHTML = '<div class="bh">블로그 · 눈바공 연구소</div><div class="bt2">냉장고와 에어컨</div><div class="bl">· 같은 원리를 쓰는 다른 기기<br>· 자주 헷갈리는 점</div><div class="bd">설명란 링크 ↓</div>';
      this.blog.style.opacity = 0;
      this.t = { l: [ctx.w('냉장고와') - .1, ctx.w('열을') - .1, ctx.w('냉매가') - .1, ctx.w('증발') - .1], b: ctx.w('제습기와') - .1 };
    },
    frame(ctx, t) {
      this.box.style.opacity = E.prog(t, .05, .4);
      this.lines.forEach((d, i) => show(d, E.prog(t, this.t.l[i], .4), 14));
      pop(this.blog, E.prog(t, this.t.b, .45), .9);
    },
  },
  L30: OUTRO,

  // ════════ 쇼츠 전용 장면(무대 860×680, 가운데 x 430) ════════
  S1A: {
    init(ctx) {
      const s = ctx.stage;
      this.f = fridgeFront(s, 262, 40, 440, { hand: true });
      this.q = qmark(s, 690, 80, 140);
      this.t = { f: .05, h: ctx.w('손을') - .1, wv: ctx.w('따뜻할') - .1, q: ctx.eq('왜') - .1 };
    },
    frame(ctx, t) {
      show(this.f.sv, E.prog(t, this.t.f, .4), 24); grow(this.f.hand, E.prog(t, this.t.h, .35));
      op(this.f.wv, E.prog(t, this.t.wv, .4) * (.75 + .25 * Math.sin(t * 5))); pop(this.q, E.prog(t, this.t.q, .45), .5);
    },
  },
  S1E: {
    init(ctx) {
      const s = ctx.stage;
      this.f = fridgeFront(s, 262, 40, 440); this.f.sv.style.opacity = 1; op(this.f.inner, 1);
      this.ag = el('g', { opacity: 0 }, this.f.sv); this.ar = arrow(this.ag, 150, 300, 400, 300, HO, 12);
      this.q = qmark(s, 670, 80, 140);
      this.t = { a: ctx.w('열은') - .1, q: ctx.w('어떻게') - .1 };
    },
    frame(ctx, t) { op(this.ag, E.prog(t, this.t.a, .1)); this.ar(E.prog(t, this.t.a, .6)); op(this.f.wv, E.prog(t, this.t.a + .5, .4)); pop(this.q, E.prog(t, this.t.q, .45), .5); },
  },
  S2E: {
    init(ctx) {
      const s = ctx.stage;
      this.o = fridgeSide(s, 170, 150, 520); this.o.sv.style.opacity = 1;
      this.q = qmark(s, 695, 230, 130);
      this.t = { a: ctx.w('뒤쪽으로') - .2, q: ctx.w('보낼까요') - .1 };
    },
    frame(ctx, t) { const o = this.o; op(o.inArrow, E.prog(t, this.t.a, .1)); o.inF(E.prog(t, this.t.a, .6)); pop(this.q, E.prog(t, this.t.q, .45), .5); },
  },
  S3A: {
    init(ctx) { this.o = acPlace(ctx); this.t = { a: .05, g: ctx.w('실외기로') - .2 }; },
    frame(ctx, t) {
      const o = this.o; show(o.sv, E.prog(t, this.t.a, .4), 16); o.spin(t);
      op(o.indC, E.prog(t, .3, .5)); pop2(o.bIn, E.prog(t, .4, .4));
      op(o.go, E.prog(t, this.t.g, .1)); o.goA(E.prog(t, this.t.g, .6)); op(o.out, E.prog(t, this.t.g, .5)); pop2(o.bOut, E.prog(t, this.t.g + .4, .4)); op(o.wOut, E.prog(t, this.t.g + .5, .4));
    },
  },
  S3E: {
    init(ctx) {
      const s = ctx.stage;
      this.o = cycle(s, 40, 80, 780); const keys = ['e', 'c', 'r', 'x']; keys.forEach(k => this.o.color[k] = true); this.o.paint();
      this.q = qmark(s, 355, 200, 150);
      this.t = { a: .05, q: ctx.w('어떻게') - .1 };
    },
    frame(ctx, t) { show(this.o.sv, E.prog(t, this.t.a, .4), 16); this.o.move(t); pop(this.q, E.prog(t, this.t.q, .45), .5); },
  },
};

// SVG 이름표 등장(투명도 + 살짝 커짐)
function pop2(g, u) { const k = E.back(u); g.setAttribute('opacity', E.clamp(u * 2)); const bb = g._bb || (g._bb = g.getBBox()); const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, s = E.lerp(.7, 1, k); g.setAttribute('transform', `translate(${cx * (1 - s)} ${cy * (1 - s)}) scale(${s})`); }
const CTLC = '#6a4c93';

// ───── 문 열린 냉장고(앞모습) viewBox 0 0 420 560 ─────
function fridgeOpen(parent, x, y, w) {
  const h = w * 560 / 420, sv = svgAt(parent, x, y, w, h, '0 0 420 560'), o = { sv };
  el('rect', { x: 150, y: 30, width: 240, height: 460, rx: 20, fill: '#f4f6f9', stroke: GR, 'stroke-width': 8 }, sv);
  el('rect', { x: 166, y: 46, width: 208, height: 428, rx: 10, fill: '#e6f0fb' }, sv);
  [180, 320].forEach(yy => el('line', { x1: 166, y1: yy, x2: 374, y2: yy, stroke: '#b9c6d8', 'stroke-width': 6 }, sv));
  el('polygon', { points: '150,30 40,70 40,450 150,490', fill: '#e3e8ef', stroke: GR, 'stroke-width': 8, 'stroke-linejoin': 'round' }, sv);
  el('line', { x1: 60, y1: 200, x2: 60, y2: 300, stroke: GR, 'stroke-width': 10, 'stroke-linecap': 'round' }, sv);
  o.cold = el('g', { opacity: 0 }, sv);
  [140, 260, 380].forEach(yy => { const g = el('g', {}, o.cold); arrow(g, 240, yy, 120, yy + 10, CO, 7)(1); });
  sv.style.opacity = 0; return o;
}
