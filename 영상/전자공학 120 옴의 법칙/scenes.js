// 전자공학 120 옴의 법칙. 공통 그림과 색은 전자공학 110에서 이어받는다.
const VC = COLOR.red, IC = COLOR.blue, RC = COLOR.orange;
const OM = `<svg viewBox="0 0 100 100" style="height:.74em;width:.74em;vertical-align:-.02em;overflow:visible"><path d="M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92" fill="none" stroke="currentColor" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
function svgGlyph(svg, kind, cx, cy, size, color) {          // SVG 안에 Ω 그리기
  const k = size / 100, g = el('g', { transform: `translate(${cx - size / 2} ${cy - size / 2}) scale(${k})` }, svg);
  if (kind === 'Ω') el('path', { d: 'M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92', fill: 'none', stroke: color, 'stroke-width': 13, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  return g;
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
// 자막과 별개로, 그림이 해당 단어보다 0.1초 먼저 나타난다.
function cue(ctx, phrase, occurrence = 1) {
  const clean = text => text.replace(/[^0-9A-Za-z가-힣]/g, '').toLowerCase();
  const target = clean(phrase);
  const words = ctx.words.map(word => clean(word.text));
  for (let start = 0; start < words.length; start++) {
    if (!words[start]) continue;
    let found = '';
    for (let i = start; i < words.length && found.length < target.length; i++) found += words[i];
    if (found.startsWith(target) && --occurrence === 0) {
      const token = ctx.words[start].text.replace(/[^0-9A-Za-z가-힣]/g, '');
      const count = ctx.words.slice(0, start + 1).filter(word => word.text.replace(/[^0-9A-Za-z가-힣]/g, '').startsWith(token)).length;
      return Math.max(0, ctx.w(token, count) - .1);
    }
  }
  console.warn('장면 단어 없음', phrase);
  return 0;
}

function scene(draw) {
  return {
    init(ctx) {
      const updates = [];
      const add = (node, phrase, occurrence) => {
        const start = phrase ? cue(ctx, phrase, occurrence) : 0;
        updates.push(t => show(node, E.prog(t, start, .22), 5));
        return node;
      };
      draw(ctx, add, updates);
      this.updates = updates;
    },
    frame(ctx, time) { this.updates.forEach(update => update(time)); },
  };
}

const names = ['전압', '전류', '저항'];
const colors = [VC, IC, RC];
const colored = (text, color) => '<b style="color:' + color + '">' + text + '</b>';
const vi = colored('V', VC), ii = colored('I', IC), ri = colored('R', RC);
const ohm = vi + ' = ' + ii + ' × ' + ri;
const eqCurrent = ii + ' = ' + vi + ' ÷ ' + ri;
const eqResistance = ri + ' = ' + vi + ' ÷ ' + ii;

function title(ctx, add, text, phrase) {
  return add(lab(ctx.stage, 40, 36, ctx.W - 80, text, ctx.long ? 60 : 39), phrase);
}

function panel(ctx, add, x, y, width, height, text, phrase, color = COLOR.line, size = 40) {
  const node = card(ctx.stage, x, y, width, height, { text: '<span>' + text + '</span>', color, size });
  node.classList.add('ohm-panel');
  if (ctx.long && [VC, IC, RC, COLOR.green].includes(color) && height >= 200 && height <= 250 && width <= 1200) {
    node.style.background = 'color-mix(in srgb, ' + color + ' 17%, white)';
  }
  return add(node, phrase);
}

function centered(ctx, add, y, width, height, text, phrase, color, size) {
  return panel(ctx, add, (ctx.W - width) / 2, y, width, height, text, phrase, color, size);
}

function tableRows(ctx, add, y, headings, rows, rowHeight, width, size) {
  const x = (ctx.W - width) / 2;
  [ { cells: headings }, ...rows ].forEach(({ cells, phrase, color, emphasized }, index) => {
    const row = el('div', { class: 'abs ohm-row' + (index === 0 ? ' heading' : ''), style: {
      left: x + 'px', top: (y + index * (rowHeight + 9)) + 'px', width: width + 'px', height: rowHeight + 'px',
      fontSize: size + 'px', gridTemplateColumns: 'repeat(' + cells.length + ', minmax(0, 1fr))',
      borderColor: color || COLOR.line,
    } }, ctx.stage);
    cells.forEach((cell, column) => el('span', { text: cell, style: {
      color: emphasized && column >= cells.length - emphasized ? color || COLOR.green : '',
    } }, row));
    add(row, phrase);
  });
}

function path(svg, d, stroke, width = 6, fill = 'none') {
  return el('path', { d, stroke, fill, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
}

function svgText(svg, x, y, text, size, color = COLOR.ink) {
  return el('text', { x, y, text, fill: color, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800 }, svg);
}

function diagram(ctx, x, y, w, h, viewBox) {
  return svgAt(ctx.stage, x, y, w, h, viewBox);
}

function bicycle(svg, x, y, uphill) {
  const g = el('g', { transform: 'translate(' + x + ' ' + y + ')' }, svg);
  if (uphill) path(g, 'M5 136 L245 86 L245 136 Z', RC, 4, '#fce8d7');
  else path(g, 'M5 136 H245', COLOR.line, 5);
  const body = el('g', { transform: uphill ? 'rotate(-12 118 96)' : '' }, g);
  for (const cx of [60, 173]) el('circle', { cx, cy: 106, r: 27, fill: '#fff', stroke: COLOR.ink, 'stroke-width': 5 }, body);
  path(body, 'M60 106 L93 62 L123 106 Z M93 62 L153 62 L123 106 M153 62 L173 106 M87 62 H103 M151 61 L147 48 H165', IC, 5);
  path(body, 'M123 105 L116 91', VC, 5);
  return g;
}

function cup(svg, x, y, narrow) {
  const g = el('g', { transform: 'translate(' + x + ' ' + y + ')' }, svg);
  path(g, 'M64 56 H185 L170 133 H80 Z', COLOR.sub, 4, '#fff');
  path(g, 'M71 81 H178 L169 128 H82 Z', '#d9b48f', 3, '#d9b48f');
  el('rect', { x: narrow ? 121 : 116, y: 15, width: narrow ? 8 : 18, height: 108, fill: '#fff', stroke: narrow ? RC : COLOR.sub, 'stroke-width': 4 }, g);
  return g;
}

function analogy(kind) {
  const isBike = kind === 'bike';
  const rows = isBike ? [
    ['평지', '세게 밟기 → 빨라짐', '세게 밟으면'],
    ['오르막', '같은 힘 → 느려짐', '오르막이'],
    ['오르막', '더 세게 → 같은 속도', '더 세게'],
  ] : [
    ['굵은 빨대', '세게 빨기 → 많이 올라옴', '세게 빨면'],
    ['얇은 빨대', '같은 힘 → 적게 올라옴', '얇은 빨대로'],
    ['얇은 빨대', '더 세게 → 같은 양', '훨씬 세게'],
  ];
  return scene((ctx, add, updates) => {
    title(ctx, add, isBike ? '자전거 세 장면' : '빨대 세 장면');
    rows.forEach(([label, result, phrase], i) => {
      const w = ctx.long ? 510 : 770;
      const gap = ctx.long ? 30 : 0;
      const x = ctx.long ? (ctx.W - 3 * w - 2 * gap) / 2 + i * (w + gap) : (ctx.W - w) / 2;
      const y = ctx.long ? 144 : 116;
      const h = ctx.long ? 688 : 523;
      const heading = panel(ctx, add, x, y, w, ctx.long ? 106 : 80, label, phrase, i ? RC : COLOR.line, ctx.long ? 55 : 44);
      const svg = diagram(ctx, x, y + (ctx.long ? 122 : 88), w, ctx.long ? 409 : 344, '0 0 250 180');
      const start = cue(ctx, phrase);
      add(svg, phrase);
      if (isBike) bicycle(svg, 0, 14, i !== 0);
      else cup(svg, 0, 10, i !== 0);
      const force = isBike
        ? arrow(svg, 19, 35, i === 2 ? 108 : 76, 35, VC, 5)
        : arrow(svg, 155, 64, 155, i === 2 ? 9 : 23, VC, 5);
      const flow = isBike
        ? arrow(svg, 127, 160, i === 1 ? 161 : 230, 160, IC, 5)
        : arrow(svg, 125, 115, 125, i === 1 ? 77 : 42, IC, 3);
      updates.push(t => { force(E.prog(t, start, .45)); flow(E.prog(t, start, .55)); });
      const outcome = panel(ctx, add, x, y + h - 83, w, ctx.long ? 112 : 83, result, phrase, IC, ctx.long ? 45 : 39);
      if (!ctx.long) {
        const starts = rows.map(([, , key]) => cue(ctx, key));
        updates.push(t => {
          const active = Math.max(0, starts.filter(start => t >= start).length - 1);
          for (const node of [heading, svg, outcome]) node.style.visibility = i === active ? 'visible' : 'hidden';
        });
      }
    });
  });
}

function circuit(ctx, add, updates, { voltage, resistance, current, change, compact = false }) {
  const w = ctx.long ? (compact ? 1130 : 1500) : 780;
  const h = ctx.long ? (compact ? 375 : 730) : 530;
  const svg = diagram(ctx, ctx.long ? (ctx.W - w) / 2 - 68 : (ctx.W - w) / 2, compact ? 100 : (ctx.long ? 105 : 108), w, h, ctx.long ? '0 0 680 365' : '0 18 680 475');
  add(svg);
  const bottom = ctx.long ? 271 : 459;
  const middle = (89 + bottom) / 2;
  const g = loop(svg, 155, 89, 505, bottom);
  // 110의 회로와 전류계 도형을 사용하고, 저항 색만 강조한다.
  g.querySelector('path').setAttribute('stroke', RC);
  meter(svg, 505, middle, 32, 'A', IC);
  const v = svgText(svg, 59, middle + 4, voltage, ctx.long ? 35 : 34, VC);
  const r = svgText(svg, 330, 48, resistance, ctx.long ? 36 : 34, RC);
  const a = svgText(svg, 617, middle + 8, current, ctx.long ? 35 : 34, IC);
  const dots = Array.from({ length: 5 }, () => el('circle', { r: 6, fill: IC }, svg));
  const states = change.map(([node, text, phrase, n]) => [{ v, r, a }[node], text, cue(ctx, phrase, n)]);
  updates.push(t => {
    for (const [node, original] of [[v, voltage], [r, resistance], [a, current]]) node.textContent = original;
    for (const [node, value, time] of states) if (t >= time) node.textContent = value;
    const speed = parseFloat(a.textContent) * 8 || 40;
    dots.forEach((dot, i) => { dot.setAttribute('cx', 169 + (i * 63 + t * speed) % 320); dot.setAttribute('cy', bottom); });
  });
  return svg;
}

function equationCards(ctx, add, rows) {
  rows.forEach(([text, phrase], i) => {
    const w = ctx.long ? 495 : 766;
    const x = ctx.long ? (ctx.W - 3 * w - 60) / 2 + i * (w + 30) : (ctx.W - w) / 2;
    panel(ctx, add, x, ctx.long ? 242 + (i === 1 ? 270 : 0) : 127 + i * 164, w, ctx.long ? 242 : 141, text, phrase, colors[i], ctx.long ? 96 : 69);
  });
}

const rules = [
  ['1  ' + colored('힘 ↑', VC) + ' → ' + colored('흐름 ↑', IC), '첫째'],
  ['2  ' + colored('방해 ↑', RC) + ' → ' + colored('흐름 ↓', IC), '둘째'],
  ['3  ' + colored('방해 ↑', RC) + ' + 같은 흐름 → ' + colored('힘 ↑', VC), '셋째'],
];
const electricRows = [
  { cells: ['페달 밟는 힘', '빠는 힘', '전압 (V)'], phrase: '전압이에요', color: VC, emphasized: 1 },
  { cells: ['달리는 속도', '올라오는 양', '전류 (I)'], phrase: '전류예요', color: IC, emphasized: 1 },
  { cells: ['오르막', '얇은 빨대', '저항 (R)'], phrase: '저항이에요', color: RC, emphasized: 1 },
];
const numberRows = [
  ['0.005A', '1,000옴', '5', '5V'],
  ['0.01A', '1,000옴', '10', '10V'],
  ['0.0025A', '2,000옴', '5', '5V'],
  ['0.005A', '2,000옴', '10', '10V'],
];

function simpleRows(ctx, add, rows, { y = 168, step = 133, width = 1080, size = 48 } = {}) {
  rows.forEach(([text, phrase, color], i) => centered(ctx, add, y + i * step, width, step - 17, text, phrase, color, size));
}

function triangle(ctx, add) {
  const svg = diagram(ctx, 248, 115, 765, 755, '0 0 500 520');
  add(svg, '삼각형');
  path(svg, 'M250 35 L38 460 H462 Z M145 245 H355 M250 245 V460', COLOR.ink, 7);
  add(svgText(svg, 250, 195, 'V', 70, VC), '위에');
  add(svgText(svg, 175, 379, 'I', 72, IC), '아래에');
  add(svgText(svg, 325, 379, 'R', 72, RC), '알을');
  add(el('rect', { x: 130, y: 303, width: 95, height: 100, rx: 22, fill: '#d5dce5' }, svg), '손으로');
  panel(ctx, add, 1030, 432, 610, 170, eqCurrent, '브이 나누기 알', IC, 64);
}

function graph(ctx, add, updates, kind) {
  const ledGraph = kind === 'led';
  const inverse = kind === 'inverse';
  const comparison = inverse || kind === 'direct';
  const svg = diagram(ctx, comparison ? (inverse ? 956 : 290) : 343, 109, comparison ? (inverse ? 850 : 1290) : 1234, comparison && inverse ? 655 : 710, '0 0 750 480');
  if (inverse) {
    const reference = diagram(ctx, 105, 109, 850, 655, '0 0 750 480');
    add(reference);
    path(reference, 'M105 77 V365 H663', COLOR.ink, 6);
    path(reference, 'M110 361 L635 105', IC, 8);
    svgText(reference, 150, 53, '↑ 전류', 34, IC);
    svgText(reference, 575, 414, '전압 →', 34, VC);
    svgText(reference, 382, 462, '저항 1킬로옴 고정', 32, RC);
  }
  add(svg);
  path(svg, 'M105 77 V365 H663', COLOR.ink, 6);
  const grid = el('g', { class: 'grid' }, svg);
  for (const y of [125, 185, 245, 305]) path(grid, 'M105 ' + y + ' H663', COLOR.line, 2);
  svgText(svg, 150, 53, '↑ 전류', 34, IC);
  svgText(svg, 575, 414, inverse ? '저항 →' : '전압 →', 34, inverse ? RC : VC);
  const curve = path(svg, ledGraph ? 'M106 361 L637 111' : inverse ? 'M132 93 C160 224 245 293 345 319 S548 342 630 350' : 'M110 361 L635 105', ledGraph ? RC : IC, 8);
  const when = cue(ctx, ledGraph ? '곧은 직선' : inverse ? '줄어요' : '올리면');
  const len = curve.getTotalLength();
  curve.setAttribute('stroke-dasharray', len);
  updates.push(t => curve.setAttribute('stroke-dashoffset', len * (1 - E.ease(E.prog(t, when, 1.1)))));
  if (ledGraph) {
    const flat = path(svg, 'M110 357 C235 357 326 356 393 351', VC, 8);
    add(flat, '거의 흐르지');
    const rising = path(svg, 'M393 351 C469 340 511 292 552 107', VC, 8);
    add(rising, '갑자기 늘어요');
    add(svgText(svg, 523, 79, 'LED', 30, VC), '갑자기 늘어요');
    add(svgText(svg, 450, 165, '저항', 30, RC), '곧은 직선');
    centered(ctx, add, 802, 960, 77, 'LED 곡선은 모양만 보여 주는 예시', '따로 달아서', COLOR.line, 37);
  } else {
    const points = inverse ? [[212, 267], [345, 319]] : [[352, 243], [592, 126]];
    points.forEach(([x, y]) => {
      add(path(grid, 'M' + x + ' ' + y + ' V365 M105 ' + y + ' H' + x, '#b0bccc', 3), inverse ? '절반' : '두 배면');
      add(el('circle', { cx: x, cy: y, r: 12, fill: IC }, svg), inverse ? '절반' : '두 배면');
    });
    panel(ctx, add, inverse ? 1095 : 605, 797, 705, 80, inverse ? '전압 5V 고정 · 반비례' : '저항 1킬로옴 고정 · 비례', inverse ? '반비례' : '비례', inverse ? VC : RC, 40);
  }
}

function led(ctx, add, updates, mode) {
  const svg = diagram(ctx, ctx.long ? 135 : 40, ctx.long ? 109 : 105, ctx.long ? 1650 : 780, ctx.long ? 475 : 350, '0 0 740 285');
  add(svg);
  if (mode === 'calc' && !ctx.long) svg.classList.add('ohm-led-calc-short');
  const source = el('g', {}, svg);
  el('rect', { x: 23, y: 54, width: 162, height: 174, rx: 19, fill: '#286d85' }, source);
  svgText(source, 103, 100, '아두이노', 35, '#fff');
  svgText(source, 128, 149, '5V 핀', 33, '#fff');
  svgText(source, 127, 216, 'GND', 32, '#fff');
  add(source, mode === 'calc' ? null : '아두이노');
  path(svg, 'M185 138 H293 M415 138 H528 M573 138 H676 V203 H185', COLOR.ink, 5);
  zig(svg, 293, 138, 122, RC);
  const value = svgText(svg, 354, 95, mode === 'calc' ? '200옴' : '?', 34, RC);
  const diode = el('g', {}, svg);
  path(diode, 'M528 111 L573 138 L528 165 Z', VC, 4, '#f2b3b9');
  path(diode, 'M573 111 V165', COLOR.ink, 5);
  const lightA = arrow(diode, 541, 103, 566, 74, RC, 3);
  const lightB = arrow(diode, 563, 103, 588, 74, RC, 3);
  lightA(1); lightB(1);
  add(diode, mode === 'calc' ? null : '빨간');
  if (mode === 'calc') {
    const to220 = cue(ctx, '이백이십 옴처럼');
    updates.push(t => { value.textContent = t >= to220 ? '220옴' : '200옴'; });
    centered(ctx, add, ctx.long ? 588 : 455, ctx.long ? 1330 : 770, ctx.long ? 108 : 78, '3 ÷ 0.015 = 200옴', '이백 옴', RC, ctx.long ? 45 : 38);
    centered(ctx, add, ctx.long ? 722 : 555, ctx.long ? 1330 : 770, ctx.long ? 108 : 78, '3 ÷ 220 ≈ 13.6mA &lt; 20mA', '십삼 점 육', COLOR.green, ctx.long ? 45 : 37);
  } else {
    add(svgText(svg, 651, 76, '약 2V', 34, VC), '이 볼트');
    add(svgText(svg, 559, 255, '최대 20mA', 34, IC), '이십 밀리암페어');
    centered(ctx, add, ctx.long ? 650 : 526, ctx.long ? 1250 : 770, ctx.long ? 149 : 110, '5V − 2V = 3V', '삼 볼트', RC, ctx.long ? 58 : 50);
  }
}

function scaleGraphic(ctx, add) {
  const svg = diagram(ctx, 158, 105, 735, 715, '0 0 520 520');
  add(svg, '체중계');
  el('rect', { x: 63, y: 79, width: 391, height: 352, rx: 47, fill: '#fff', stroke: IC, 'stroke-width': 8 }, svg);
  el('rect', { x: 177, y: 117, width: 164, height: 58, rx: 13, fill: COLOR.ink }, svg);
  for (const x of [172, 345]) {
    el('ellipse', { cx: x, cy: 287, rx: 39, ry: 85, fill: '#dbe7fa' }, svg);
    for (let i = 0; i < 4; i++) el('circle', { cx: x - 30 + 20 * i, cy: 205 - 6 * i, r: 9 - i, fill: '#dbe7fa' }, svg);
  }
  add(el('path', { d: 'M171 285 H346', stroke: IC, 'stroke-width': 8, 'stroke-dasharray': '12 12' }, svg), '전류를');
  add(svgText(svg, 260, 389, '아주 약한 전류', 29, IC), '전류를');
}

function smallLed(ctx, add, phrase) {
  const svg = diagram(ctx, 43, 135, 774, 282, '0 0 630 265');
  add(svg, phrase);
  path(svg, 'M72 134 H183 M307 134 H410 M470 134 H560', COLOR.ink, 6);
  zig(svg, 183, 134, 124, RC, 7);
  path(svg, 'M410 105 L470 134 L410 163 Z', VC, 5, '#f6dbe0');
  path(svg, 'M470 105 V163', COLOR.ink, 5);
  const ray1 = arrow(svg, 437, 100, 469, 69, RC, 3);
  const ray2 = arrow(svg, 454, 100, 486, 69, RC, 3);
  ray1(1); ray2(1);
}

const SCENES = {
  L01: scene((ctx, add, updates) => {
    const cards = names.map((name, i) => panel(ctx, add, 162 + i * 535, 163, 526, 302, colored(name, colors[i]), '지난 영상', colors[i], 72));
    const v = add(lab(ctx.stage, 335, 478, 200, '↑', 82, { color: VC }), '전압을 올리면');
    const q = add(lab(ctx.stage, 870, 478, 200, '?', 82, { color: IC }), '어떻게 될까요');
    const join = cue(ctx, '하나의 식으로');
    updates.push(t => {
      const move = E.ease(E.prog(t, join, .65));
      cards.forEach((card, i) => { card.style.translate = (1 - i) * 95 * move + 'px'; card.style.scale = 1 - .23 * move; });
      [v, q].forEach(node => { if (t >= join) node.style.opacity = 1 - move; });
    });
    centered(ctx, add, 607, 1300, 212, '옴의 법칙　' + ohm, '옴의 법칙', COLOR.green, 96);
  }),
  L02: INTRO,
  L03: scene((ctx, add) => {
    title(ctx, add, '한 줄로 먼저');
    centered(ctx, add, 144, 655, 122, '옴의 법칙', '옴의 법칙', COLOR.green, 53);
    centered(ctx, add, 306, 1200, 237, ohm, '브이는', COLOR.line, 112);
    ['전압은', '전류와', '저항을'].forEach((phrase, i) => panel(ctx, add, 210 + i * 515, 643, 470, 165,
      colored(['V ', 'I ', 'R '][i] + names[i], colors[i]), phrase, colors[i], 54));
  }),
  L04: analogy('bike'),
  L05: analogy('straw'),
  L06: scene((ctx, add) => { title(ctx, add, '세 가지 규칙'); simpleRows(ctx, add, rules, { y: 144, step: 227, width: 1430, size: 71 }); }),
  L07: scene((ctx, add) => {
    title(ctx, add, '전기 이름으로 바꾸기');
    tableRows(ctx, add, ctx.long ? 144 : 121, ['자전거', '빨대', '전기'], electricRows, ctx.long ? 157 : 117, ctx.long ? 1530 : 774, ctx.long ? 62 : 39);
  }),
  L08: scene((ctx, add, updates) => {
    title(ctx, add, '회로 장면 1');
    const circuitSvg = circuit(ctx, add, updates, { voltage: '5V', resistance: '1킬로옴', current: '5mA', change: [['v', '10V', '십 볼트로'], ['a', '10mA', '십 밀리암페어로']] });
    // L08에서만 전류를 회로 전체에 고르게 순환시킨다.
    if (ctx.long) {
      const route = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      // 전원 위쪽 → 실제 저항의 굴곡 → 전류계 → 아래 귀환선 → 전원.
      // 경로는 측정에만 쓰며 화면에 선이나 글자를 추가하지 않는다.
      route.setAttribute('d', 'M155 89 H260' + circuitSvg.querySelector('g > path').getAttribute('d').replace(/^M 260 89/, '') + ' H505 V271 H155 Z');
      const length = route.getTotalLength();
      const dots = [...circuitSvg.querySelectorAll('circle[r="6"]')];
      while (dots.length < 12) dots.push(el('circle', { r: 6, fill: IC }, circuitSvg));
      dots.forEach(dot => dot.setAttribute('data-current-dot', 'L08'));
      const fasterAt = cue(ctx, '십 밀리암페어로');
      updates.push(t => {
        // 속도가 바뀌어도 누적 이동 거리를 이어서 위치가 튀지 않는다.
        const distance = t * 40 + Math.max(0, t - fasterAt) * 40;
        dots.forEach((dot, i) => {
          const point = route.getPointAtLength((i * length / dots.length + distance) % length);
          dot.setAttribute('cx', point.x);
          dot.setAttribute('cy', point.y);
          // 부품 내부에서는 기호를 덮지 않고, 연결선에서 다시 이어 보인다.
          const insideMeter = Math.hypot(point.x - 505, point.y - 180) < 40;
          const insideSource = Math.abs(point.x - 155) < 1 && Math.abs(point.y - 180) < 27;
          dot.style.opacity = insideMeter || insideSource ? 0 : 1;
        });
      });
    }
    const svg = diagram(ctx, 1380, 138, 345, 254, '0 0 250 180'); bicycle(svg, 0, 15, false); add(svg, '세게 밟은');
    panel(ctx, add, 1350, 705, 390, 113, '세게 밟기', '세게 밟은', VC, 39);
  }),
  L09: scene((ctx, add, updates) => {
    title(ctx, add, '회로 장면 2');
    circuit(ctx, add, updates, { voltage: '5V', resistance: '1킬로옴', current: '5mA', change: [['r', '2킬로옴', '이 킬로옴으로'], ['a', '2.5mA', '이 점 오']] });
    const svg = diagram(ctx, 1380, 138, 345, 254, '0 0 250 180'); bicycle(svg, 0, 15, true); add(svg, '오르막');
    panel(ctx, add, 1350, 705, 390, 113, '오르막', '오르막', RC, 39);
  }),
  L10: scene((ctx, add, updates) => {
    title(ctx, add, '회로 장면 3');
    circuit(ctx, add, updates, { voltage: '5V', resistance: '2킬로옴', current: '2.5mA', compact: true,
      change: [['a', '5mA?', '되돌리려면'], ['v', '10V', '십 볼트로'], ['a', '5mA', '십 볼트로']] });
    tableRows(ctx, add, 477, ['장면', '회로에서 바뀐 것', '결과'], [
      { cells: ['1', '1킬로옴 그대로, 5V → 10V', '5mA → 10mA'], phrase: '십 볼트로' },
      { cells: ['2', '5V 그대로, 1킬로옴 → 2킬로옴', '5mA → 2.5mA'], phrase: '올려야' },
      { cells: ['3', '2킬로옴에서 5mA 원함', '10V로'], phrase: '더 세게' },
    ], 88, 1620, 41);
  }),
  L11: scene((ctx, add) => {
    title(ctx, add, '숫자 속 규칙');
    const width = ctx.long ? 1500 : 774;
    const y = ctx.long ? 145 : 119;
    const height = ctx.long ? 113 : 85;
    tableRows(ctx, add, y, ['전류', '저항', '전류 × 저항', '실제 전압'], numberRows.map((cells, i) => ({
      cells, phrase: i ? '나머지 줄도' : '영 점 영영오', color: COLOR.green, emphasized: 2,
    })), height, width, ctx.long ? 53 : 34);
    centered(ctx, add, ctx.long ? 768 : 601, ctx.long ? 845 : 650, ctx.long ? 86 : 46,
      'mA → A　·　킬로옴 → 옴', '단위는', IC, ctx.long ? 43 : 34);
  }),
  L12: scene((ctx, add) => {
    title(ctx, add, '옴의 법칙, 세 가지 모양');
    equationCards(ctx, add, [[ohm, '브이는'], [eqCurrent, '아이는'], [eqResistance, '알은']]);
  }),
  L13: scene((ctx, add) => { title(ctx, add, '옴의 삼각형'); triangle(ctx, add); }),
  L14: scene((ctx, add) => {
    title(ctx, add, '직접 계산해 보기');
    [['5V, 250옴 → 전류?', '5 ÷ 250 = 0.02A = 20mA', '이백오십 옴', '오 나누기 이백오십', IC],
      ['5V, 25mA → 저항?', '5 ÷ 0.025 = 200옴', '이십오 밀리암페어', '오 나누기 영 점 영이오', RC]]
      .forEach(([question, answer, start, solve, color], i) => {
        const x = 145 + i * 825;
        panel(ctx, add, x, 157, 800, 200, question, start, color, 52);
        panel(ctx, add, x, 435, 800, 300, colored(answer, color), solve, color, 55);
      });
  }),
  L15: scene((ctx, add) => {
    title(ctx, add, '단위를 맞추지 않으면');
    panel(ctx, add, 173, 148, 1040, 270, '5V ÷ 220옴 = 0.0227A', '영 점 영이이칠', COLOR.green, 55);
    panel(ctx, add, 1248, 148, 493, 270, '<s class="vr">22.7A</s>', '이십이 점 칠', VC, 68);
    centered(ctx, add, 555, 1160, 236, 'mA → A　·　킬로옴 → 옴', '바꾼 다음', IC, 52);
  }),
  L16: scene((ctx, add) => {
    title(ctx, add, '옴이라는 이름');
    const svg = diagram(ctx, 178, 117, 617, 727, '0 0 420 475');
    add(svg, '천팔백이십칠');
    path(svg, 'M62 46 H349 Q376 46 376 72 V399 H66 Q46 399 46 372 V69 Q46 46 62 46Z M60 399 V82 H376', '#0f7459', 8, '#e2f5ec');
    svgText(svg, 209, 250, '1827', 82, COLOR.green);
    panel(ctx, add, 842, 165, 836, 216, '게오르크 옴 · 독일 물리학자', '게오르크 옴이', COLOR.green, 45);
    panel(ctx, add, 883, 517, 745, 230, '저항의 단위 = ' + OM, '단위 옴도', RC, 52);
  }),
  L17: scene((ctx, add, updates) => { title(ctx, add, '전압과 전류'); graph(ctx, add, updates, 'direct'); }),
  L18: scene((ctx, add, updates) => { title(ctx, add, '저항과 전류'); graph(ctx, add, updates, 'inverse'); }),
  L19: scene((ctx, add) => {
    title(ctx, add, '어디에 쓰나요');
    simpleRows(ctx, add, [['LED 저항 고르기 → 저항값', 'LED에', RC], ['아두이노 핀 확인 → 전류', '아두이노', IC],
      ['고장 찾기 → 계산값과 비교', '회로 고장', VC]], { y: 149, step: 224, width: 1410, size: 68 });
  }),
  L20: scene((ctx, add, updates) => { title(ctx, add, 'LED 저항 고르기'); led(ctx, add, updates, 'voltage'); }),
  L21: scene((ctx, add, updates) => { title(ctx, add, 'LED 저항 고르기'); led(ctx, add, updates, 'calc'); }),
  L22: scene((ctx, add, updates) => { title(ctx, add, 'LED는 직선이 아니에요'); graph(ctx, add, updates, 'led'); }),
  L23: scene((ctx, add) => {
    title(ctx, add, '생활 속 옴의 법칙');
    scaleGraphic(ctx, add);
    panel(ctx, add, 928, 161, 690, 162, '근육 · 잘 통함', '근육은', IC, 51);
    panel(ctx, add, 928, 367, 690, 162, '지방 · 더 막음', '지방은', RC, 51);
    panel(ctx, add, 914, 584, 722, 170, '저항 ↑ → 체지방 많다고 추정', '추정해요', COLOR.green, 46);
  }),
  L24: scene((ctx, add) => {
    title(ctx, add, '고속 충전기');
    const power = charger(ctx.stage, 218, 140, 385);
    power.v.textContent = ''; power.a.textContent = '';
    const g = power.sv.querySelectorAll('line, path');
    g.forEach(node => node.setAttribute('opacity', '0'));
    add(power.sv);
    const phone = diagram(ctx, 738, 127, 275, 565, '0 0 230 450');
    add(phone, '약속해서');
    el('rect', { x: 16, y: 12, width: 198, height: 423, rx: 34, fill: '#fff', stroke: IC, 'stroke-width': 7 }, phone);
    el('rect', { x: 38, y: 58, width: 154, height: 321, rx: 14, fill: '#eaf2fc' }, phone);
    path(phone, 'M126 164 L83 234 H115 L105 282 L152 208 H118 Z', COLOR.green, 4, COLOR.green);
    const cable = diagram(ctx, 565, 371, 170, 135, '0 0 142 115');
    const from = arrow(cable, 11, 37, 130, 37, IC, 6), back = arrow(cable, 130, 76, 11, 76, VC, 6);
    from(1); back(1); add(cable, '약속해서');
    panel(ctx, add, 1050, 144, 650, 162, '전력 ' + colored('P', COLOR.green) + ' = ' + vi + ' × ' + ii, '전력은', COLOR.green, 49);
    panel(ctx, add, 1050, 360, 650, 162, '5V → 9V · 15V · 20V', '오 볼트보다', VC, 44);
    panel(ctx, add, 1050, 578, 650, 176, '9V × 3A = 27W', '이십칠 와트', IC, 47);
  }),
  L25: scene((ctx, add) => {
    title(ctx, add, '비유는 감 잡기용');
    const svg = diagram(ctx, 148, 140, 795, 610, '0 0 280 205');
    add(svg, '자전거와');
    bicycle(svg, 15, 28, false);
    const wind = el('g', {}, svg);
    path(wind, 'M252 62 H205 M270 75 H214 M254 89 H207', IC, 4);
    svgText(wind, 194, 42, '바람 저항↑', 25, RC);
    add(wind, '바람 저항');
    panel(ctx, add, 945, 164, 730, 208, '힘 ×2 ≠ 속도 ×2', '두 배가 되지는', RC, 59);
    panel(ctx, add, 945, 500, 730, 245, ohm, '정확한 계산은', COLOR.green, 102);
  }),
  L26: scene((ctx, add) => {
    title(ctx, add, '한눈에 정리');
    centered(ctx, add, 123, 780, 157, ohm, null, COLOR.green, 71);
    simpleRows(ctx, add, [['저항 그대로 → 전압↑ 전류↑(비례)', '저항이 그대로면', RC],
      ['전압 그대로 → 저항↑ 전류↓(반비례)', '전압이 그대로면', VC], ['두 값 → 나머지 하나', '두 값을', IC],
      ['단위 V · A · 옴', '볼트', COLOR.green]], { y: 308, step: 130, width: 1350, size: 55 });
  }),
  L27: scene((ctx, add, updates) => {
    title(ctx, add, '퀴즈');
    circuit(ctx, add, updates, { voltage: '', resistance: '', current: '? A', change: [['v', '12V', '십이 볼트'], ['r', '4옴', '사 옴']] });
    updates.push(countdown(ctx, ctx.stage, 1500, 695, 145));
  }),
  L27B: scene((ctx, add, updates) => {
    title(ctx, add, '퀴즈 정답');
    circuit(ctx, add, updates, { voltage: '12V', resistance: '4옴', current: '? A', change: [['a', '3A', '삼 암페어']] });
    centered(ctx, add, 709, 1230, 133, eqCurrent + ' = 12 ÷ 4 = 3A', '십이 나누기', IC, 57);
  }),
  L28: scene((ctx, add) => {
    title(ctx, add, '옴의 법칙');
    panel(ctx, add, 204, 150, 752, 295, '옴의 법칙 · 설명란 링크', '블로그', COLOR.green, 48);
    const svg = diagram(ctx, 960, 125, 760, 450, '0 0 520 365');
    add(svg, '늘어나면');
    path(svg, 'M70 190 H126 V103 H185 M305 103 H391 V190 H444 M126 190 V267 H185 M305 267 H391 V190', COLOR.ink, 6);
    zig(svg, 185, 103, 120, RC); zig(svg, 185, 267, 120, RC);
    svgText(svg, 250, 208, '?', 62, IC);
    panel(ctx, add, 264, 610, 1392, 198, '다음 영상 · 키르히호프의 법칙', '키르히호프', IC, 51);
  }),
  L29: OUTRO,
  S1E: scene((ctx, add) => {
    title(ctx, add, '이 셋 사이에는');
    names.forEach((name, i) => panel(ctx, add, 45 + i * 264, 132, 242, 168, colored(name, colors[i]), null, colors[i], 44));
    centered(ctx, add, 362, 476, 230, '?', '어떤 식이', COLOR.green, 86);
  }),
  S2A: scene((ctx, add, updates) => {
    title(ctx, add, '간단한 회로');
    circuit(ctx, add, updates, { voltage: '5V', resistance: '1킬로옴', current: '5mA', change: [['r', '2킬로옴', '저항을'], ['a', '2.5mA', '전류를']] });
    const table = el('div', { class: 'abs ohm-switch' }, ctx.stage);
    tableRows({ ...ctx, stage: table }, add, 100, ['전류', '저항'], numberRows.map(cells => ({ cells: cells.slice(0, 2) })), 96, 774, 40);
    const switchAt = cue(ctx, '네 줄');
    updates.push(t => {
      for (const node of ctx.stage.children) if (node !== table && t >= switchAt) node.style.opacity = 0;
      table.style.visibility = t < switchAt ? 'hidden' : 'visible';
    });
  }),
  S2E: scene((ctx, add, updates) => {
    title(ctx, add, '전류는 얼마일까요?');
    circuit(ctx, add, updates, { voltage: '', resistance: '', current: '?', change: [['v', '5V', '오 볼트'], ['r', '250옴', '이백오십 옴']] });
  }),
  S3A: scene((ctx, add) => {
    title(ctx, add, 'LED 저항');
    smallLed(ctx, add, '저항을');
    centered(ctx, add, 395, 485, 112, '? 옴', '몇 옴짜리를', RC, 49);
    centered(ctx, add, 530, 683, 110, ohm, '옴의 법칙으로', COLOR.green, 55);
  }),
  S3E: scene((ctx, add) => {
    title(ctx, add, 'LED 전류');
    smallLed(ctx, add);
    centered(ctx, add, 460, 770, 176, '전압 ÷ LED 저항 ?', '전압 나누기', RC, 50);
  }),
};
