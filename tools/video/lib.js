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
  const svgTags = ['svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'text', 'polygon', 'polyline', 'defs', 'marker'];
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

// 화살표(svg 선). 길이 u(0~1)만큼 그려짐
function arrow(svg, x1, y1, x2, y2, color, width = 8) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const g = el('g', {}, svg);
  const p = el('line', { x1, y1, x2, y2, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round',
    'stroke-dasharray': len, 'stroke-dashoffset': len }, g);
  const ang = Math.atan2(y2 - y1, x2 - x1), hs = width * 3.2;
  const head = el('polygon', { points: `${x2},${y2} ${x2 - hs * Math.cos(ang - .45)},${y2 - hs * Math.sin(ang - .45)} ${x2 - hs * Math.cos(ang + .45)},${y2 - hs * Math.sin(ang + .45)}`, fill: color, opacity: 0 }, g);
  return u => { p.setAttribute('stroke-dashoffset', len * (1 - E.ease(u))); head.setAttribute('opacity', u >= .95 ? 1 : 0); };
}
