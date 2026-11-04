// 영상 장면 공통 도구. 모든 그림은 render(t)가 시각 t만 보고 결정한다(같은 t → 같은 화면).
const E = {
  clamp: (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)),
  lerp: (a, b, u) => a + (b - a) * u,
  ease: u => (u = E.clamp(u), u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2),
  back: u => { u = E.clamp(u); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
  // t가 a에서 시작해 d초 동안 0→1
  prog: (t, a, d = .5) => E.clamp((t - a) / d),
};

const COLOR = { bg: '#f2f8f5', green: '#14936a', ink: '#14213d', sub: '#445066', orange: '#e0701b',
  red: '#d24a5a', blue: '#3b6fb6', line: '#cfd8e3', card: '#ffffff', teal: '#0f7c80' };

function el(tag, attrs = {}, parent) {
  const svgTags = ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'text', 'polygon', 'polyline', 'defs', 'marker', 'clipPath', 'tspan', 'linearGradient', 'radialGradient', 'stop', 'mask', 'use'];  // clipPath가 빠져 있어 그래프 자르기가 안 됐었음
  const n = svgTags.includes(tag) ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'text') n.textContent = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else n.setAttribute(k, v);
  }
  if (parent) parent.appendChild(n);
  return n;
}

// 장면 정보 도우미: 단어가 처음 나오는 시각(초). 못 찾으면 fallback
function makeCtx(scene, stage, layout) {
  const words = scene.words || [];
  return {
    stage, layout, dur: scene.dur, audioDur: scene.audioDur, words, W: stage.clientWidth, H: stage.clientHeight,
    long: layout === 'long',
    at(text, n = 1, fallback = 0) {
      let c = 0;
      for (const w of words) if (w.text.replace(/[^0-9A-Za-z가-힣]/g, '').includes(text)) { if (++c === n) return w.start; }
      console.warn('단어 없음', scene.id, text);
      return fallback;
    },
    // 정확한 단어 찾기: 문장부호를 뺀 단어가 text로 시작(시작=true)하거나 같으면
    w(text, n = 1, fallback = 0) {
      let c = 0;
      for (const x of words) { const k = x.text.replace(/[^0-9A-Za-z가-힣]/g, ''); if (k.startsWith(text) && ++c === n) return x.start; }
      console.warn('단어 없음', scene.id, text, n); return fallback;
    },
    eq(text, n = 1, fallback = 0) {
      let c = 0;
      for (const x of words) { const k = x.text.replace(/[^0-9A-Za-z가-힣]/g, ''); if (k === text && ++c === n) return x.start; }
      console.warn('단어 없음', scene.id, text, n); return fallback;
    },
    wend(text, n = 1, fallback = 0) {
      let c = 0;
      for (const x of words) { const k = x.text.replace(/[^0-9A-Za-z가-힣]/g, ''); if (k.startsWith(text) && ++c === n) return x.end; }
      console.warn('단어 없음', scene.id, text, n); return fallback;
    },
    has(text) { return words.some(w => w.text.replace(/[^0-9A-Za-z가-힣]/g, '').includes(text)); },
    endOf(text, n = 1, fallback = 0) {
      let c = 0;
      for (const w of words) if (w.text.replace(/[^0-9A-Za-z가-힣]/g, '').includes(text)) { if (++c === n) return w.end; }
      return fallback;
    },
  };
}

// 상자를 나타나게 하는 공통 효과(투명도 + 살짝 커지며 등장)
function pop(node, u, from = .6) {
  const k = E.back(u);
  node.style.opacity = E.clamp(u * 2);
  node.style.transform = `${node.dataset.base || ''} scale(${E.lerp(from, 1, k)})`;
}
function show(node, u, dy = 30) {
  const k = E.ease(u);
  node.style.opacity = k;
  node.style.transform = `${node.dataset.base || ''} translateY(${(1 - k) * dy}px)`;
}

// 사람 아이콘(친구 A·B·C)
function personSVG(color, label, size) {
  return `<svg viewBox="0 0 200 220" width="${size}" height="${size * 1.1}">
    <circle cx="100" cy="62" r="52" fill="${color}"/>
    <path d="M18 210 Q18 118 100 118 Q182 118 182 210 Z" fill="${color}"/>
    <text x="100" y="190" text-anchor="middle" font-family="P" font-weight="800" font-size="64" fill="#fff">${label}</text></svg>`;
}

// 카드(둥근 상자) 만들기
function card(parent, x, y, w, h, opt = {}) {
  const d = el('div', { class: 'card' + (opt.dashed ? ' dashed' : ''), style: {
    left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px',
    borderColor: opt.color || COLOR.line, background: opt.bg || COLOR.card, fontSize: (opt.size || 44) + 'px',
    color: opt.ink || COLOR.ink } }, parent);
  if (opt.text != null) d.innerHTML = opt.text;
  return d;
}

// 화살표(svg 선). 길이 u(0~1)만큼 그려지고, 화살촉은 선 끝을 따라 함께 움직인다.
// 선은 화살촉 밑변에서 끝나게 해서 둥근 선 끝이 화살촉 밖으로 삐져나오지 않게 한다.
function arrow(svg, x1, y1, x2, y2, color, width = 8, gap = {}) {
  // gap.from·gap.to: 출발점·도착점 그림(점, 별)의 반지름 + 틈. 화살촉이 도착 그림에 가려지지 않고 그 앞에서 멈춤
  const a0 = Math.atan2(y2 - y1, x2 - x1), g0 = gap.from || 0, g1 = gap.to || 0;
  x1 += Math.cos(a0) * g0; y1 += Math.sin(a0) * g0; x2 -= Math.cos(a0) * g1; y2 -= Math.sin(a0) * g1;
  const ang = a0, len = Math.hypot(x2 - x1, y2 - y1);
  const hl = width * 3.4, hw = width * 2.1;              // 화살촉 길이·반폭
  const g = el('g', {}, svg);
  const line = el('line', { x1, y1, x2: x1, y2: y1, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }, g);
  const head = el('polygon', { fill: color, stroke: color, 'stroke-width': width * .45, 'stroke-linejoin': 'round', opacity: 0 }, g);
  return u => {
    const k = E.ease(u), d = len * k;
    const tx = x1 + Math.cos(ang) * d, ty = y1 + Math.sin(ang) * d;           // 지금 화살촉 끝
    const bd = Math.max(0, d - hl * .85);                                      // 선은 화살촉 밑변까지
    line.setAttribute('x2', x1 + Math.cos(ang) * bd); line.setAttribute('y2', y1 + Math.sin(ang) * bd);
    const bx = tx - Math.cos(ang) * hl, by = ty - Math.sin(ang) * hl, nx = -Math.sin(ang) * hw, ny = Math.cos(ang) * hw;
    head.setAttribute('points', `${tx},${ty} ${bx + nx},${by + ny} ${bx - nx},${by - ny}`);
    head.setAttribute('opacity', E.clamp(d / (hl * 1.2)));
    line.setAttribute('opacity', d > 1 ? 1 : 0);
  };
}
