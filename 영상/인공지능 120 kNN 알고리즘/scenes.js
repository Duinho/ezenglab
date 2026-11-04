// kNN 알고리즘 영상 장면. 장면마다 init(ctx)로 그리고 frame(ctx, t)로 움직인다.
// 숫자와 음식 이름은 원고(인공지능 120 kNN 알고리즘/index.md)와 그림 knn_fig0_food.png에 있는 것만 쓴다.

const FRIENDS = [
  { id: 'A', color: COLOR.red, kind: '고기', foods: ['삼겹살', '소갈비', '스테이크'] },
  { id: 'B', color: COLOR.orange, kind: '매운 음식', foods: ['떡볶이', '낙지볶음', '마라샹궈'] },
  { id: 'C', color: COLOR.blue, kind: '면 요리', foods: ['잔치국수', '우동', '짜장면'] },
];
const NEW_FOODS = [
  { name: '칼국수', to: 2, word: '칼국수' },
  { name: '소불고기', to: 0, word: '소불고기' },
  { name: '쭈꾸미볶음', to: 1, word: '쭈꾸미볶음' },
];

// 가로·세로 배치 값
function G(ctx) {
  const L = ctx.long;
  return {
    xs: L ? [480, 960, 1440] : [180, 540, 900], boxW: L ? 400 : 330,
    top: L ? 40 : 40,
    bubbleW: L ? 400 : 290, bubbleH: L ? 250 : 300, bubbleY: L ? 60 : 170,
    personSize: L ? 220 : 230, personY: L ? 380 : 560,
    smallSize: L ? 120 : 150, smallY: L ? 40 : 90,
    listY: L ? 190 : 175, listSize: L ? 30 : 26,
    cardY: L ? 560 : 820, cardW: L ? 380 : 290, cardH: L ? 130 : 150, cardSize: L ? 46 : 44,
  };
}

// 친구 세 명(작은 크기) + 좋아하는 음식 목록. L04~L06에서 함께 씀
function smallFriends(ctx, layer) {
  const g = G(ctx), out = [];
  FRIENDS.forEach((f, i) => {
    const box = el('div', { class: 'abs center', style: { left: (g.xs[i] - g.boxW / 2) + 'px', top: g.smallY + 'px', width: g.boxW + 'px' } }, layer);
    box.innerHTML = personSVG(f.color, f.id, g.smallSize) +
      `<div class="list" style="font-size:${g.listSize}px;color:${f.color}">${f.foods.join(' · ')}</div>`;
    out.push(box);
  });
  return out;
}

const SCENES = {
  L01: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.plate = el('div', { class: 'abs center', style: { left: (L ? 760 : 340) + 'px', top: (L ? 170 : 260) + 'px', width: '400px', height: '400px' } }, s);
      this.plate.innerHTML = `<svg viewBox="0 0 400 400" width="400" height="400">
        <ellipse cx="200" cy="230" rx="190" ry="150" fill="#fff" stroke="${COLOR.line}" stroke-width="8"/>
        <ellipse cx="200" cy="220" rx="130" ry="96" fill="#f7efe2" stroke="#eadcc4" stroke-width="6"/>
        <text x="200" y="262" text-anchor="middle" font-family="P" font-weight="800" font-size="150" fill="${COLOR.orange}">?</text></svg>`;
      this.title = el('div', { class: 'abs center title', style: { left: 0, width: '100%', top: (L ? 300 : 620) + 'px' } }, s);
      this.title.innerHTML = `<div class="big">kNN 알고리즘</div><div class="mid">가까운 이웃에게 물어보기</div>`;
      this.tTitle = ctx.at('케이', 1, ctx.audioDur - 3) - .2;
    },
    frame(ctx, t) {
      const u = E.prog(t, 0, .7);
      this.plate.style.opacity = E.clamp(u * 2) * (1 - E.prog(t, this.tTitle - .4, .4));
      this.plate.style.transform = `translateY(${(1 - E.back(u)) * -120 + Math.sin(t * 2.2) * 6}px)`;
      show(this.title, E.prog(t, this.tTitle, .6), 50);
    },
  },

  L02: INTRO,   // 공통 인트로(tools/video/intro.js)
  L28: OUTRO,   // 공통 마무리 인사(tools/video/intro.js)

  L03: {
    init(ctx) {
      const g = G(ctx), s = ctx.stage;
      this.items = FRIENDS.map((f, i) => {
        const person = el('div', { class: 'abs center', style: { left: (g.xs[i] - g.personSize / 2) + 'px', top: g.personY + 'px', width: g.personSize + 'px' } }, s);
        person.innerHTML = personSVG(f.color, f.id, g.personSize);
        const b = el('div', { class: 'bubble', style: { left: (g.xs[i] - g.bubbleW / 2) + 'px', top: g.bubbleY + 'px', width: g.bubbleW + 'px', height: g.bubbleH + 'px', borderColor: f.color } }, s);
        b.innerHTML = `<div class="hint">${f.kind}</div>` + f.foods.map(x => `<div class="food">${x}</div>`).join('');
        const word = ['에이는', '비는', '씨는'][i];
        return { person, b, t: ctx.at(word, 1, 3 + i * 1.5) - .15 };
      });
      this.items.forEach(it => { it.person.dataset.base = ''; it.b.dataset.base = ''; });
      this.tFriends = ctx.at('친구', 1, .2) - .1;
    },
    frame(ctx, t) {
      this.items.forEach((it, i) => {
        // "친구 세 명에게"부터 회색으로 먼저 서 있다가, 자기 이름이 불릴 때 색이 들어옴
        const pre = E.prog(t, this.tFriends, .4), on = E.prog(t, it.t - .1, .35);
        it.person.style.opacity = Math.max(pre * .45, on);
        it.person.style.filter = `grayscale(${1 - on})`;
        it.person.style.transform = `scale(${E.lerp(.92, 1, E.back(on))})`;
        pop(it.b, E.prog(t, it.t + .15, .4), .7);
      });
    },
  },

  L04: {
    init(ctx) {
      const g = G(ctx), s = ctx.stage;
      this.friends = smallFriends(ctx, s);
      this.cards = NEW_FOODS.map((f, i) => {
        const c = card(s, g.xs[i] - g.cardW / 2, g.cardY, g.cardW, g.cardH, { dashed: true, color: COLOR.teal, bg: '#eef6f7', size: g.cardSize,
          text: `${f.name}<span class="q">?</span>` });
        return { c, t: ctx.at(f.word, 1, 3 + i) - .1 };
      });
      this.ask = el('div', { class: 'abs center ask', style: { left: 0, width: '100%', top: (g.cardY - 110) + 'px' } }, s);
      this.ask.textContent = '각각 누가 좋아할까요?';
      this.tAsk = ctx.at('누가', 1, 4) - .1;
      this.tName = ['에이', '비', '씨'].map((w, i) => ctx.at(w, 1, .2 + i * .2));
      this.count = el('div', { class: 'abs center count', style: { left: (ctx.W / 2 - 150) + 'px', width: '300px', top: (ctx.long ? 730 : 985) + 'px', fontSize: (ctx.long ? 120 : 100) + 'px', lineHeight: 1.1 } }, s);
    },
    frame(ctx, t) {
      // "A, B, C가 말하지 않은": 이름이 불릴 때 친구가 살짝 튀어 오름
      this.friends.forEach((f, i) => { const u = E.prog(t, this.tName[i] - .05, .35); f.style.opacity = 1; f.style.transform = `scale(${1 + .12 * Math.sin(Math.PI * u)})`; });
      show(this.ask, E.prog(t, this.tAsk, .4), 20);
      this.cards.forEach(c => pop(c.c, E.prog(t, c.t, .45), .7));
      const h = t - ctx.audioDur;                          // 말이 끝난 뒤 멈춤 시간
      if (h > 0) {
        const n = 3 - Math.floor(h);
        this.count.textContent = n >= 1 ? n : '';
        const f = h % 1;
        this.count.style.opacity = n >= 1 ? 1 - f * .6 : 0;
        this.count.style.transform = `scale(${1.25 - f * .25})`;
      } else this.count.style.opacity = 0;
    },
  },

  L05: {
    init(ctx) {
      const g = G(ctx), s = ctx.stage;
      this.friends = smallFriends(ctx, s);
      this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      this.cards = NEW_FOODS.map((f, i) => {
        const c = card(s, g.xs[i] - g.cardW / 2, g.cardY, g.cardW, g.cardH, { dashed: true, color: COLOR.teal, bg: '#eef6f7', size: g.cardSize, text: f.name });
        const fr = FRIENDS[f.to];
        const x1 = g.xs[i], y1 = g.cardY - 14, x2 = g.xs[f.to], y2 = g.smallY + g.smallSize * 1.1 + 80;
        const draw = arrow(this.svg, x1, y1, x2 + (x1 - x2) * .08, y2, fr.color, 9);
        const ans = ['씨예요', '에이예요', '비예요'][i];
        const t0 = ctx.at(f.word, 1, 1 + i * 2.3) - .1, t1 = ctx.endOf(ans, 1, t0 + 1.2);
        return { c, draw, fr, t0, d: Math.max(.5, t1 - t0) };
      });
    },
    frame(ctx, t) {
      this.friends.forEach(f => show(f, 1));
      this.cards.forEach(k => {
        const u = E.prog(t, k.t0, k.d);
        k.draw(u);
        k.c.style.borderColor = u > .9 ? k.fr.color : COLOR.teal;
        k.c.style.borderStyle = u > .9 ? 'solid' : 'dashed';
        k.c.style.background = u > .9 ? '#fff' : '#eef6f7';
      });
    },
  },

  L06: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage, cw = L ? 400 : 280, y = L ? 150 : 260;
      const cx = L ? 960 : 540, gap = L ? 360 : 230;
      this.a = card(s, cx - gap - cw / 2, y, cw, 150, { size: 52, color: COLOR.teal, text: '소불고기' });
      this.b = card(s, cx + gap - cw / 2, y, cw, 150, { size: 52, color: COLOR.red, text: '삼겹살' });
      this.pos = { cx, gap, cw, y, close: L ? .42 : .30 };
      // "방금 어떻게 맞혔는지 떠올려 보세요" 동안 비어 있지 않게: 생각 질문
      this.think = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 330 : 420) + 'px', fontSize: (L ? 96 : 84) + 'px', fontWeight: 800, color: COLOR.ink, lineHeight: 1.25 } }, s);
      this.think.innerHTML = '어떻게<br><span style="color:#14936a">맞혔을까?</span>';
      this.badge = el('div', { class: 'abs center badge', style: { left: (cx - 140) + 'px', top: (y - 110) + 'px', width: '280px' } }, s);
      this.badge.textContent = '비슷!';
      this.who = el('div', { class: 'abs center', style: { left: (cx - 80) + 'px', top: (y + 190) + 'px', width: '160px' } }, s);
      this.who.innerHTML = personSVG(COLOR.red, 'A', 150);
      this.rule = el('div', { class: 'abs center rule', style: { left: (L ? 260 : 60) + 'px', width: (L ? 1400 : 960) + 'px', top: (L ? 515 : 720) + 'px' } }, s);
      this.rule.innerHTML = '답을 아는 것 중에서<br><b>가장 비슷한 것</b>을 찾아 판단';
      this.end = el('div', { class: 'abs center endnote', style: { left: 0, width: '100%', top: (L ? 785 : 1010) + 'px' } }, s);
      this.end.innerHTML = '= <b>kNN</b>의 출발점';
      this.t = { so: ctx.at('소불고기', 1, 2.8) - .1, sam: ctx.at('삼겹살', 1, 3), sim: ctx.at('비슷하네', 1, 4), a: ctx.at('그럼', 1, 5), rule: ctx.at('답을', 1, 7), end: ctx.has('출발점') ? ctx.at('출발점') - .4 : 11 };
    },
    frame(ctx, t) {
      const p = this.pos, m = E.ease(E.prog(t, this.t.sam, 1.0));
      const off = p.gap * (1 - p.close * m);
      this.a.style.left = (p.cx - off - p.cw / 2) + 'px';
      this.b.style.left = (p.cx + off - p.cw / 2) + 'px';
      this.think.style.opacity = E.prog(t, .05, .35) * (1 - E.prog(t, this.t.so - .3, .3));
      this.a.style.opacity = E.prog(t, this.t.so, .35);
      this.b.style.opacity = E.prog(t, this.t.sam - .1, .35);
      pop(this.badge, E.prog(t, this.t.sim, .4));
      pop(this.who, E.prog(t, this.t.a - .1, .4), .7);
      const dim = E.prog(t, this.t.rule - .2, .4);
      [this.a, this.b, this.badge, this.who].forEach(n => n.style.filter = `opacity(${1 - dim * .55})`);
      show(this.rule, E.prog(t, this.t.rule - .1, .45), 30);
      show(this.end, E.prog(t, this.t.end, .5), 30);
    },
  },
};

// 쇼츠 S1 마무리: L06 화면에 이어 "짬뽕은 누가 좋아할까요?"로 끝냄
SCENES.S1E = {
  init(ctx) {
    SCENES.L06.init.call(this, ctx);
    const L = ctx.long, s = ctx.stage;
    this.end.innerHTML = '= 인공지능 기초 알고리즘<br><b>kNN</b>의 시작';
    if (!L) { this.end.style.top = '968px'; this.end.style.fontSize = '64px'; }
    this.under = [this.a, this.b, this.badge, this.who, this.rule, this.end, this.think];
    this.t.end = ctx.at('인공지능', 1, 11) - .2;
    this.t.q = ctx.at('그럼', 2, 14) - .15;
    this.t.hot = ctx.at('매운', 1, 15) - .1; this.t.noodle = ctx.at('면', 1, 16) - .1;
    this.t.jj = ctx.at('짬뽕', 1, 17) - .1; this.t.who2 = ctx.at('누가', 1, 18) - .1;
    // 짬뽕 질문 화면(앞 화면을 덮음)
    this.qbox = el('div', { class: 'abs', style: { left: 0, top: 0, width: ctx.W + 'px', height: ctx.H + 'px', background: COLOR.bg } }, s);
    const cy = L ? 420 : 520, xs = L ? [560, 1360] : [210, 870];
    const fb = this.fb = el('div', { class: 'abs center', style: { left: (xs[0] - 90) + 'px', top: (cy - 120) + 'px', width: '180px' } }, this.qbox);
    fb.innerHTML = personSVG(COLOR.orange, 'B', 170) + `<div class="list" style="font-size:30px;color:${COLOR.orange}">매운 음식</div>`;
    const fc = this.fc = el('div', { class: 'abs center', style: { left: (xs[1] - 90) + 'px', top: (cy - 120) + 'px', width: '180px' } }, this.qbox);
    fc.innerHTML = personSVG(COLOR.blue, 'C', 170) + `<div class="list" style="font-size:30px;color:${COLOR.blue}">면 요리</div>`;
    this.svg2 = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, this.qbox);
    const cx = ctx.W / 2, cw = L ? 360 : 300;
    this.l1 = el('line', { x1: cx - cw / 2 - 24, y1: cy + 30, x2: xs[0] + 100, y2: cy + 30, stroke: COLOR.orange, 'stroke-width': 7, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round' }, this.svg2);
    this.l2 = el('line', { x1: cx + cw / 2 + 24, y1: cy + 30, x2: xs[1] - 100, y2: cy + 30, stroke: COLOR.blue, 'stroke-width': 7, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round' }, this.svg2);
    this.jj = card(this.qbox, cx - cw / 2, cy - 45, cw, 150, { size: 60, color: COLOR.ink, text: '짬뽕' });
    this.tags = el('div', { class: 'abs center', style: { left: (cx - 260) + 'px', width: '520px', top: (cy + 125) + 'px', fontSize: '34px', fontWeight: 600, color: COLOR.sub } }, this.qbox);
    this.tags.innerHTML = `<span style="color:${COLOR.orange}">매운 음식</span> + <span style="color:${COLOR.blue}">면 요리</span>`;
    this.big = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (cy + 200) + 'px', fontSize: (L ? 120 : 140) + 'px', fontWeight: 800, color: COLOR.orange } }, this.qbox);
    this.big.textContent = '누가?';
  },
  frame(ctx, t) {
    SCENES.L06.frame.call(this, ctx, t);
    const q = E.prog(t, this.t.q, .35);
    this.qbox.style.opacity = q;
    pop(this.fb, E.prog(t, this.t.hot, .4), .7);                 // "매운 음식" → B
    pop(this.fc, E.prog(t, this.t.noodle, .4), .7);              // "면 요리" → C
    pop(this.jj, E.prog(t, this.t.jj, .4), .7);                  // "짬뽕"
    this.l1.style.opacity = E.prog(t, this.t.jj + .2, .3);
    this.l2.style.opacity = E.prog(t, this.t.jj + .2, .3);
    this.tags.style.opacity = E.prog(t, this.t.jj + .2, .3);
    this.under.forEach(n => n.style.visibility = q > .98 ? 'hidden' : 'visible');
    if (t > this.t.jj + .4) this.jj.style.transform = `translateX(${Math.sin((t - this.t.jj) * 3.2) * 14}px)`;
    pop(this.big, E.prog(t, this.t.who2, .4), .6);
  },
};

// ───────────── L07~L27 공통 도구 ─────────────
// 과일 데이터: 원고(knn_calc.py와 같은 값). 크기(cm), 당도
const FRUITS = [
  ['사과1', 8.0, 13.0, '사과'], ['사과2', 7.5, 14.0, '사과'], ['사과3', 8.5, 12.5, '사과'],
  ['사과4', 7.0, 13.5, '사과'], ['사과5', 8.2, 14.5, '사과'], ['사과6', 6.3, 12.0, '사과'],
  ['귤1', 5.5, 11.0, '귤'], ['귤2', 6.0, 10.5, '귤'], ['귤3', 5.0, 12.0, '귤'],
  ['귤4', 6.2, 11.5, '귤'], ['귤5', 5.8, 10.0, '귤'], ['귤6', 5.6, 11.6, '귤'],
];
const STAR_X = [7.8, 13.2], STAR_Y = [6.1, 11.8];
const APPLE = '#d24a5a', TANG = '#f0a31c';
const byDist = q => FRUITS.map(f => [Math.hypot(f[1] - q[0], f[2] - q[1]), f]).sort((a, b) => a[0] - b[0]);

// 그래프: 가로 크기, 세로 당도. 반환값으로 점 위치·노드에 접근
const ZOOM = { x0: 4.8, x1: 7.0, y0: 10.2, y1: 12.9 };   // 애매한 별 주변 확대
function makePlot(ctx, parent, box, dom) {
  const L = ctx.long;
  box = box || (L ? { x: 130, y: 100, w: 1000, h: 700 } : { x: 110, y: 110, w: 880, h: 660 });   // 위아래·옆 여백을 남김(팀장님 2026-11-04)
  const X0 = dom ? dom.x0 : 4.6, X1 = dom ? dom.x1 : 9.0, Y0 = dom ? dom.y0 : 9.6, Y1 = dom ? dom.y1 : 15.0;
  const P = { box, nodes: {}, labels: {} };
  P.px = v => box.x + (v - X0) / (X1 - X0) * box.w;
  P.py = v => box.y + box.h - (v - Y0) / (Y1 - Y0) * box.h;
  P.sx = box.w / (X1 - X0); P.sy = box.h / (Y1 - Y0);
  P.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, parent);
  P.grid = el('g', { opacity: .9, class: 'grid' }, P.svg);
  const step = dom ? .5 : 1;
  for (let v = Math.ceil(X0 / step) * step; v <= X1; v += step) el('line', { x1: P.px(v), y1: box.y, x2: P.px(v), y2: box.y + box.h, stroke: '#e1e8ef', 'stroke-width': 2 }, P.grid);
  for (let v = Math.ceil(Y0 / step) * step; v <= Y1; v += step) el('line', { x1: box.x, y1: P.py(v), x2: box.x + box.w, y2: P.py(v), stroke: '#e1e8ef', 'stroke-width': 2 }, P.grid);
  const cid = 'clip' + Math.random().toString(36).slice(2);
  const defs = el('defs', {}, P.svg); const cp = el('clipPath', { id: cid }, defs);
  el('rect', { x: box.x, y: box.y, width: box.w, height: box.h }, cp);
  P.axis = el('path', { d: `M ${box.x} ${box.y} L ${box.x} ${box.y + box.h} L ${box.x + box.w} ${box.y + box.h}`, fill: 'none', stroke: COLOR.sub, 'stroke-width': 5, 'stroke-linecap': 'round' }, P.svg);
  P.xlab = el('text', { x: box.x + box.w, y: box.y + box.h + 46, 'text-anchor': 'end', 'font-family': 'P', 'font-weight': 800, 'font-size': L ? 34 : 34, fill: COLOR.sub, text: '크기 →' }, P.svg);
  P.ylab = el('text', { x: box.x + 10, y: box.y - 4, 'font-family': 'P', 'font-weight': 800, 'font-size': L ? 34 : 34, fill: COLOR.sub, text: '↑ 당도' }, P.svg);
  P.layer = el('g', { 'clip-path': `url(#${cid})` }, P.svg);           // 원·선 등 그림 층
  P.fl = el('g', { 'clip-path': `url(#${cid})` }, P.svg);              // 과일 층
  if (dom) { P.xlab.textContent = '크기 → (확대)'; }
  for (const f of FRUITS) {
    const x = P.px(f[1]), y = P.py(f[2]);
    const g = el('g', { transform: `translate(${x},${y})` }, P.fl);
    const R = dom ? 1.5 : 1;
    if (f[3] === '사과') el('circle', { r: 19 * R, fill: APPLE, stroke: '#fff', 'stroke-width': 3 }, g);
    else el('polygon', { points: `0,${-23 * R} ${21 * R},${15 * R} ${-21 * R},${15 * R}`, fill: TANG, stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
    g.dataset.x = x; g.dataset.y = y;
    P.nodes[f[0]] = g;
  }
  P.pt = n => [+P.nodes[n].dataset.x, +P.nodes[n].dataset.y];
  P.set = (n, { s = 1, o = 1, dy = 0, dx = 0 } = {}) => {
    const g = P.nodes[n]; g.setAttribute('transform', `translate(${+g.dataset.x + dx},${+g.dataset.y + dy}) scale(${s})`); g.setAttribute('opacity', o);
  };
  P.star = (q, color = COLOR.blue) => {
    const g = el('g', {}, P.svg); const pts = [];
    const SR = dom ? 1.4 : 1; for (let i = 0; i < 10; i++) { const r = (i % 2 ? 13 : 30) * SR, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`); }
    el('polygon', { points: pts.join(' '), fill: color, stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
    g.q = q; g.place = (qq, s = 1, o = 1) => { g.setAttribute('transform', `translate(${P.px(qq[0])},${P.py(qq[1])}) scale(${s})`); g.setAttribute('opacity', o); };
    g.place(q, 1, 0);
    return g;
  };
  P.tag = (n, text, color, dy = -46) => {
    const [x, y] = P.pt(n);
    const t = el('text', { x, y: y + dy, 'text-anchor': 'middle', 'font-family': 'P', 'font-weight': 800, 'font-size': 30, fill: color, opacity: 0, text }, P.svg);
    return t;
  };
  P.ring = (q, color = COLOR.blue) => el('ellipse', { cx: P.px(q[0]), cy: P.py(q[1]), rx: 0, ry: 0, fill: color, 'fill-opacity': .08, stroke: color, 'stroke-width': 5, 'stroke-dasharray': '14 10' }, P.layer);
  P.setRing = (r, d) => { r.setAttribute('rx', d * P.sx); r.setAttribute('ry', d * P.sy); };
  return P;
}
// 그래프 전체를 바로 보이게(앞 장면에서 이어질 때)
function plotShown(P) { P.svg.style.opacity = 1; }

// 투표판: 사과·귤 표 수
function makeBoard(ctx, parent, x, y, w = 560) {
  const b = el('div', { class: 'abs board', style: { left: x + 'px', top: y + 'px', width: w + 'px' } }, parent);
  b.innerHTML = `<div class="bt">투표</div>
    <div class="br"><span class="bl" style="color:${APPLE}">사과</span><span class="bv" data-k="사과"></span></div>
    <div class="br"><span class="bl" style="color:#c27c00">귤</span><span class="bv" data-k="귤"></span></div>
    <div class="bres"></div>`;
  b.setVotes = (a, g) => {
    b.querySelector('[data-k="사과"]').innerHTML = ('<i class="dot" style="background:' + APPLE + '"></i>').repeat(a);
    b.querySelector('[data-k="귤"]').innerHTML = ('<i class="dot" style="background:' + TANG + '"></i>').repeat(g);
  };
  b.setRes = (txt, u = 1) => { const r = b.querySelector('.bres'); r.textContent = txt; r.style.opacity = u; r.style.transform = `scale(${E.lerp(.7, 1, E.back(u))})`; };
  return b;
}
function chip(parent, x, y, html, opt = {}) {
  const c = el('div', { class: 'abs chipx', style: { left: x + 'px', top: y + 'px', background: opt.bg || '#fff', color: opt.color || COLOR.ink, borderColor: opt.border || COLOR.green, fontSize: (opt.size || 40) + 'px', width: opt.w ? opt.w + 'px' : 'auto' } }, parent);
  c.innerHTML = html; c.style.opacity = 0;
  return c;
}

// ───────────── L07 애매한 짬뽕 ─────────────
SCENES.L07 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long, cy = L ? 330 : 520, xs = L ? [520, 1400] : [200, 880], cx = ctx.W / 2, cw = L ? 360 : 300;
    this.fb = el('div', { class: 'abs center', style: { left: (xs[0] - 100) + 'px', top: (cy - 130) + 'px', width: '200px' } }, s);
    this.fb.innerHTML = personSVG(COLOR.orange, 'B', 180) + `<div class="list" style="font-size:32px;color:${COLOR.orange}">매운 음식</div>`;
    this.fc = el('div', { class: 'abs center', style: { left: (xs[1] - 100) + 'px', top: (cy - 130) + 'px', width: '200px' } }, s);
    this.fc.innerHTML = personSVG(COLOR.blue, 'C', 180) + `<div class="list" style="font-size:32px;color:${COLOR.blue}">면 요리</div>`;
    this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
    this.dB = arrow(this.svg, cx - cw / 2 - 26, cy + 40, xs[0] + 110, cy + 40, COLOR.orange, 7);
    this.dC = arrow(this.svg, cx + cw / 2 + 26, cy + 40, xs[1] - 110, cy + 40, COLOR.blue, 7);
    this.jj = card(s, cx - cw / 2, cy - 35, cw, 150, { size: 64, color: COLOR.ink, text: '짬뽕' });
    this.ban = el('div', { class: 'abs center rule', style: { left: (cx - (L ? 640 : 470)) + 'px', width: (L ? 1280 : 940) + 'px', top: (L ? 620 : 860) + 'px' } }, s);
    this.ban.innerHTML = '얼마나 비슷한지 재는 <b>기준</b>이 필요해요';
    this.t = { jj: ctx.w('짬뽕은') - .1, hot: ctx.w('맵기도') - .1, nd: ctx.w('면이기도') - .1, b: ctx.w('비라고') - .1, c: ctx.w('씨라고') - .1, ban: ctx.w('얼마나') - .1 };
  },
  frame(ctx, t) {
    pop(this.jj, E.prog(t, this.t.jj, .4), .7);
    this.jj.style.transform += ` translateX(${t > this.t.jj + .4 && t < this.t.ban ? Math.sin((t - this.t.jj) * 3.4) * 16 : 0}px)`;
    this.fb.style.opacity = .35 + .65 * E.prog(t, this.t.hot, .3); this.fc.style.opacity = .35 + .65 * E.prog(t, this.t.nd, .3);
    this.dB(E.prog(t, this.t.hot, .6)); this.dC(E.prog(t, this.t.nd, .6));
    const bump = (u) => 1 + .12 * Math.sin(Math.PI * E.clamp(u));
    this.fb.style.transform = `scale(${bump(E.prog(t, this.t.b, .4))})`;
    this.fc.style.transform = `scale(${bump(E.prog(t, this.t.c, .4))})`;
    show(this.ban, E.prog(t, this.t.ban, .45), 30);
  },
};

// ───────────── L08 과일을 점으로 ─────────────
SCENES.L08 = {
  init(ctx) {
    this.P = makePlot(ctx, ctx.stage);
    const P = this.P;
    P.grid.setAttribute('opacity', 0); P.axis.setAttribute('opacity', 0); P.xlab.setAttribute('opacity', 0); P.ylab.setAttribute('opacity', 0);
    // 처음엔 과일 12개가 위에 한 줄로 서 있음
    this.row = FRUITS.map((f, i) => [ctx.W * (ctx.long ? .3 : .12) + i * (ctx.long ? 70 : 72), ctx.long ? 120 : 200]);
    this.leg = el('div', { class: 'abs legend', style: { left: (ctx.long ? 1220 : 560) + 'px', top: (ctx.long ? 120 : 920) + 'px' } }, ctx.stage);
    this.leg.innerHTML = `<div class="lg a"><i style="background:${APPLE}"></i>사과</div><div class="lg b"><i class="tri"></i>귤</div>`;
    this.la = this.leg.querySelector('.a'); this.lb = this.leg.querySelector('.b');
    this.t = { n: ctx.w('열두') - .1, g: ctx.w('그래프에') - .1, dot: ctx.w('점으로') - .1, x: ctx.w('가로는') - .1, y: ctx.w('세로는') - .1, a: ctx.w('빨간') - .1, b: ctx.w('노란') - .1 };
  },
  frame(ctx, t) {
    const P = this.P, ax = E.prog(t, this.t.g, .5);
    P.grid.setAttribute('opacity', ax * .9); P.axis.setAttribute('opacity', ax);
    const xl = E.prog(t, this.t.x, .35), yl = E.prog(t, this.t.y, .35);
    P.xlab.setAttribute('opacity', xl); P.ylab.setAttribute('opacity', yl);
    P.xlab.setAttribute('fill', xl > 0 && t < this.t.y ? COLOR.green : COLOR.sub); P.ylab.setAttribute('fill', yl > 0 && t < this.t.a ? COLOR.green : COLOR.sub);
    FRUITS.forEach((f, i) => {
      const appear = E.prog(t, this.t.n + i * .06, .3), fly = E.ease(E.prog(t, this.t.dot + i * .04, .6));
      const [px, py] = P.pt(f[0]), [rx, ry] = this.row[i];
      const hot = f[3] === '사과' ? E.prog(t, this.t.a, .3) * (1 - E.prog(t, this.t.b, .3)) : E.prog(t, this.t.b, .3);
      P.set(f[0], { dx: (rx - px) * (1 - fly), dy: (ry - py) * (1 - fly), o: appear, s: 1 + .35 * Math.sin(Math.PI * E.clamp(hot * 2 > 1 ? 1 : hot * 2)) * (hot < 1 ? 1 : 0) });
    });
    this.la.style.opacity = E.prog(t, this.t.a, .3); this.lb.style.opacity = E.prog(t, this.t.b, .3);
  },
};

// ───────────── L09 별은 무엇일까 ─────────────
SCENES.L09 = {
  init(ctx) {
    const P = this.P = makePlot(ctx, ctx.stage);
    this.star = P.star(STAR_X);
    this.lab = el('text', { x: P.px(STAR_X[0]), y: P.py(STAR_X[1]) - 50, 'text-anchor': 'middle', 'font-family': 'P', 'font-weight': 800, 'font-size': 40, fill: APPLE, opacity: 0, text: '사과!' }, P.svg);
    // 비슷한 것끼리 모인 무리
    this.ca = el('ellipse', { cx: P.px(7.8), cy: P.py(13.6), rx: 1.05 * P.sx, ry: 1.15 * P.sy, fill: APPLE, 'fill-opacity': .07, stroke: APPLE, 'stroke-width': 4, 'stroke-dasharray': '12 10', opacity: 0 }, P.layer);
    this.cb = el('ellipse', { cx: P.px(5.65), cy: P.py(11.0), rx: .85 * P.sx, ry: 1.25 * P.sy, fill: TANG, 'fill-opacity': .08, stroke: TANG, 'stroke-width': 4, 'stroke-dasharray': '12 10', opacity: 0 }, P.layer);
    this.num = chip(ctx.stage, ctx.long ? 1240 : 120, ctx.long ? 160 : 930, '크기·당도<br><b>숫자 두 개</b>면 충분', { size: ctx.long ? 44 : 40 });
    this.t = { s: ctx.w('파란') - .1, ap: ctx.w('사과들') - .1, say: ctx.w('사과라고') - .1, n: ctx.w('숫자') - .1, cl: ctx.w('가까이') - .3 };
  },
  frame(ctx, t) {
    const P = this.P, u = E.prog(t, this.t.s, .4);
    this.star.place(STAR_X, E.lerp(.4, 1, E.back(u)) * (1 + .06 * Math.sin(t * 4)), E.clamp(u * 2));
    const g = E.prog(t, this.t.ap, .3);
    FRUITS.forEach(f => P.set(f[0], { s: f[3] === '사과' ? 1 + .25 * g * (1 - E.prog(t, this.t.ap + .9, .4)) : 1, o: f[3] === '사과' ? 1 : 1 - .5 * g * (1 - E.prog(t, this.t.cl, .3)) }));
    this.lab.setAttribute('opacity', E.prog(t, this.t.say, .3));
    show(this.num, E.prog(t, this.t.n, .4), 20);
    const c = E.prog(t, this.t.cl, .5); this.ca.setAttribute('opacity', c); this.cb.setAttribute('opacity', c);
  },
};

// ───────────── L10 애매한 별 ─────────────
SCENES.L10 = {
  init(ctx) {
    const P = this.P = makePlot(ctx, ctx.stage, undefined, ZOOM);
    this.star = P.star(STAR_Y); this.ring = P.ring(STAR_Y);
    this.q = el('text', { x: P.px(STAR_Y[0]) - 60, y: P.py(STAR_Y[1]) - 40, 'text-anchor': 'end', 'font-family': 'P', 'font-weight': 800, 'font-size': 64, fill: COLOR.orange, opacity: 0, text: '?' }, P.svg);
    this.c = chip(ctx.stage, ctx.long ? 1220 : 300, ctx.long ? 160 : 930, '거리를 <b>숫자로</b> 재 보자', { size: 44 });
    this.t = { s: ctx.w('별은') - .1, a: ctx.w('사과도') - .1, b: ctx.w('귤도') - .1, hard: ctx.w('정하기') - .1, n: ctx.w('숫자로') - .1 };
  },
  frame(ctx, t) {
    const P = this.P, u = E.prog(t, this.t.s, .4);
    this.star.place(STAR_Y, E.lerp(.4, 1, E.back(u)), E.clamp(u * 2));
    P.setRing(this.ring, E.ease(E.prog(t, this.t.s + .3, 1.2)) * .62);
    const a = E.prog(t, this.t.a, .3), b = E.prog(t, this.t.b, .3);
    P.set('사과6', { s: 1 + .45 * a });
    ['귤4', '귤6'].forEach(n => P.set(n, { s: 1 + .45 * b }));
    FRUITS.forEach(f => { if (!['사과6', '귤4', '귤6'].includes(f[0])) P.set(f[0], { o: 1 - .55 * Math.max(a, b) }); });
    this.q.setAttribute('opacity', E.prog(t, this.t.hard, .3));
    show(this.c, E.prog(t, this.t.n, .4), 20);
  },
};

// ───────────── L11 자로 잰 거리 ─────────────
SCENES.L11 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long;
    // 두 점을 크게 확대해서 보여 줌(별 ↔ 사과6)
    const ax = L ? 420 : 200, ay = L ? 640 : 760, bx = L ? 1260 : 860, by = L ? 260 : 420;
    this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
    this.tri = el('path', { d: `M ${ax} ${ay} L ${bx} ${ay} L ${bx} ${by}`, fill: 'none', stroke: COLOR.sub, 'stroke-width': 5, 'stroke-dasharray': '14 10', opacity: 0 }, this.svg);
    this.lx = el('text', { x: (ax + bx) / 2, y: ay + 56, 'text-anchor': 'middle', 'font-family': 'P', 'font-weight': 800, 'font-size': 38, fill: COLOR.sub, opacity: 0, text: '크기 차이' }, this.svg);
    this.ly = el('text', { x: bx + 24, y: (ay + by) / 2, 'font-family': 'P', 'font-weight': 800, 'font-size': 38, fill: COLOR.sub, opacity: 0, text: '당도 차이' }, this.svg);
    this.line = arrow(this.svg, ax, ay, bx, by, COLOR.green, 9);
    this.ruler = el('rect', { x: -170, y: -26, width: 340, height: 52, rx: 10, fill: '#f5d77a', stroke: '#c9a227', 'stroke-width': 4, opacity: 0 }, this.svg);
    for (let i = -150; i <= 150; i += 30) el('line', { x1: i, y1: -26, x2: i, y2: i % 60 === 0 ? 0 : -10, stroke: '#8a6d12', 'stroke-width': 3, class: 'rt' }, this.svg);
    this.ticks = [...this.svg.querySelectorAll('.rt')];
    this.geo = { ax, ay, bx, by, ang: Math.atan2(by - ay, bx - ax) * 180 / Math.PI };
    const p1 = el('g', { transform: `translate(${ax},${ay})` }, this.svg); const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 18 : 42, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`); }
    el('polygon', { points: pts.join(' '), fill: COLOR.blue, stroke: '#fff', 'stroke-width': 4 }, p1);
    const p2 = el('g', { transform: `translate(${bx},${by})` }, this.svg); el('circle', { r: 30, fill: APPLE, stroke: '#fff', 'stroke-width': 4 }, p2);
    el('text', { x: bx, y: by - 50, 'text-anchor': 'middle', 'font-family': 'P', 'font-weight': 800, 'font-size': 34, fill: APPLE, text: '사과6' }, this.svg);
    this.name = chip(s, L ? 1180 : 220, L ? 560 : 950, '<b>유클리드 거리</b><br>= 자로 잰 직선 거리', { size: 42 });
    this.blog = chip(s, L ? 1180 : 220, L ? 760 : 950, '계산 방법은 <b>블로그</b>에', { size: 38, border: COLOR.orange });
    this.t = { r: ctx.w('자로') - .1, ln: ctx.w('직선') - .1, py: ctx.w('피타고라스') - .1, eu: ctx.w('유클리드') - .1, bl: ctx.w('블로그') - .1 };
  },
  frame(ctx, t) {
    const g = this.geo, r = E.prog(t, this.t.r, .5);
    const mx = (g.ax + g.bx) / 2, my = (g.ay + g.by) / 2 + 60 * (1 - E.ease(r));
    const off = 46; // 선 옆에 자를 나란히
    const nx = -Math.sin(g.ang * Math.PI / 180) * off, ny = Math.cos(g.ang * Math.PI / 180) * off;
    const tr = `translate(${mx + nx},${my + ny}) rotate(${g.ang})`;
    this.ruler.setAttribute('transform', tr); this.ruler.setAttribute('opacity', r * (1 - E.prog(t, this.t.py, .4) * .6));
    this.ticks.forEach(k => { k.setAttribute('transform', tr); k.setAttribute('opacity', r * (1 - E.prog(t, this.t.py, .4) * .6)); });
    this.line(E.prog(t, this.t.ln, .7));
    const p = E.prog(t, this.t.py, .5); this.tri.setAttribute('opacity', p); this.lx.setAttribute('opacity', p); this.ly.setAttribute('opacity', p);
    show(this.name, E.prog(t, this.t.eu, .4), 20);
    show(this.blog, E.prog(t, this.t.bl, .4), 20);
    if (!ctx.long) this.name.style.opacity *= 1 - E.prog(t, this.t.bl - .2, .2);
  },
};

// ───────────── L12 가까운 세 과일과 투표 ─────────────
SCENES.L12 = {
  init(ctx) {
    const P = this.P = makePlot(ctx, ctx.stage, undefined, ZOOM), L = ctx.long;
    this.star = P.star(STAR_Y); this.star.place(STAR_Y, 1, 1);
    const sx = P.px(STAR_Y[0]), sy = P.py(STAR_Y[1]);
    this.nb = [['사과6', '0.28', APPLE], ['귤4', '0.32', '#c27c00'], ['귤6', '0.54', '#c27c00']].map(([n, d, c], i) => {
      const [x, y] = P.pt(n);
      const ln = el('line', { x1: sx, y1: sy, x2: sx, y2: sy, stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' }, P.layer);
      const lab = el('text', { x: x + (n === '귤6' ? -52 : 50), y: y + (n === '사과6' ? -30 : 56), 'text-anchor': n === '귤6' ? 'end' : 'start', 'font-family': 'P', 'font-weight': 800, 'font-size': 36, fill: c, opacity: 0, text: d }, P.svg);
      const tag = P.tag(n, n, c, n === '귤4' ? 74 : -58);
      return { n, x, y, ln, lab, tag };
    });
    this.sxy = [sx, sy];
    this.board = makeBoard(ctx, ctx.stage, L ? 1220 : 200, L ? 200 : 780, L ? 560 : 560);
    this.t = { n: [ctx.eq('사과') - .1, ctx.eq('귤', 1) - .1, ctx.eq('귤', 2) - .1], d: [ctx.w('이팔') - .1, ctx.w('삼이') - .1, ctx.w('오사') - .1],
      g: ctx.w('귤이') - .1, a: ctx.w('사과가') - .1, res: ctx.w('귤이라고') - .1, b: ctx.w('거리는') - .1 };
  },
  frame(ctx, t) {
    const [sx, sy] = this.sxy;
    this.nb.forEach((k, i) => {
      const u = E.ease(E.prog(t, this.t.n[i], .5));
      k.ln.setAttribute('x2', E.lerp(sx, k.x, u)); k.ln.setAttribute('y2', E.lerp(sy, k.y, u));
      this.P.set(k.n, { s: 1 + .4 * E.prog(t, this.t.n[i], .3) });
      k.tag.setAttribute('opacity', E.prog(t, this.t.n[i], .3) * (1 - E.prog(t, this.t.d[0] - .3, .3)));
      k.lab.setAttribute('opacity', E.prog(t, this.t.d[i], .3));
    });
    FRUITS.forEach(f => { if (!['사과6', '귤4', '귤6'].includes(f[0])) this.P.set(f[0], { o: 1 - .55 * E.prog(t, this.t.n[0], .4) }); });
    show(this.board, E.prog(t, this.t.g - .3, .4), 20);
    this.board.setVotes(t >= this.t.a ? 1 : 0, t >= this.t.g + .3 ? 2 : t >= this.t.g ? 1 : 0);
    this.board.setRes('귤!', E.prog(t, this.t.res, .4));
  },
};

// ───────────── L13 이름 붙이기: 4단계 ─────────────
SCENES.L13 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long;
    this.title = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: '40px', fontSize: '84px', fontWeight: 800, color: COLOR.green } }, s);
    this.title.textContent = '방금 한 일 = kNN';
    const steps = [['1', '정답을 아는<br>데이터 준비'], ['2', '새 데이터와<br>거리 재기'], ['3', '가까운 순서로<br>k개 고르기'], ['4', '가장 많은 쪽이<br>답 (다수결)']];
    const w = L ? 380 : 470, gap = L ? 40 : 30, x0 = L ? (ctx.W - 4 * w - 3 * gap) / 2 : (ctx.W - 2 * w - gap) / 2;
    this.cards = steps.map(([n, txt], i) => {
      const x = L ? x0 + i * (w + gap) : x0 + (i % 2) * (w + gap), y = L ? 220 : 220 + Math.floor(i / 2) * 330;
      const c = el('div', { class: 'abs step', style: { left: x + 'px', top: y + 'px', width: w + 'px' } }, s);
      c.innerHTML = `<div class="sn">${n}</div><div class="st">${txt}</div>`; return c;
    });
    this.k1 = chip(s, L ? 520 : 140, L ? 650 : 900, '<b>k</b> = 이웃을 몇 개 볼지', { size: 50, w: L ? 880 : 800 });
    this.k1.style.textAlign = 'center';
    this.k2 = chip(s, L ? 520 : 140, L ? 650 : 900, '방금은 <b>k = 3</b>', { size: 50, w: L ? 880 : 800 });
    this.k2.style.textAlign = 'center';
    this.t = { ti: ctx.w('케이엔엔이에요') - .1, s: [ctx.w('먼저') - .1, ctx.eq('새') - .1, ctx.w('가까운') - .1, ctx.w('마지막으로') - .1], k: ctx.w('케이는') - .1, k3: ctx.w('방금은') - .1 };
  },
  frame(ctx, t) {
    show(this.title, E.prog(t, .05, .4), 20);
    this.title.style.color = t >= this.t.ti ? COLOR.green : COLOR.ink;
    let cur = -1; this.t.s.forEach((a, i) => { if (t >= a) cur = i; });
    this.cards.forEach((c, i) => {
      pop(c, E.prog(t, this.t.s[i], .4), .7);
      c.classList.toggle('on', i === cur && t < this.t.k);
    });
    show(this.k1, E.prog(t, this.t.k, .4) * (1 - E.prog(t, this.t.k3 - .2, .2)), 20);
    show(this.k2, E.prog(t, this.t.k3, .4), 20);
  },
};

// ───────────── L14 미리 공부하지 않는 방법 ─────────────
SCENES.L14 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long;
    this.no = chip(s, L ? 120 : 90, L ? 60 : 60, '미리 공부하는 단계: <b style="color:#d24a5a">없음</b>', { size: 46 });
    // 서랍장(데이터 저장)
    const cx = L ? 640 : 540, cy = L ? 470 : 560;
    this.cab = el('div', { class: 'abs cab', style: { left: (cx - 220) + 'px', top: (cy - 200) + 'px' } }, s);
    this.cab.innerHTML = [0, 1, 2].map(i => `<div class="dr"><span class="kn"></span>${'<i class="pd a"></i><i class="pd t"></i>'.repeat(3)}</div>`).join('');
    this.dr = [...this.cab.querySelectorAll('.dr')];
    this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
    this.q = el('div', { class: 'abs center qbub', style: { left: (L ? 1300 : 720) + 'px', top: (L ? 380 : 300) + 'px', width: '300px' } }, s);
    this.q.innerHTML = '새 질문<br><span style="font-size:80px;color:#3b6fb6">★</span>';
    this.calc = this.svg.appendChild(el('g', {}));
    this.lines = [0, 1, 2].map(i => el('line', { x1: L ? 1300 : 720, y1: (L ? 470 : 390), x2: cx + 220, y2: cy - 130 + i * 135, stroke: COLOR.blue, 'stroke-width': 5, 'stroke-dasharray': '12 10', opacity: 0 }, this.svg));
    this.name = chip(s, L ? 1180 : 100, L ? 690 : 880, '<b>인스턴스 기반 학습</b>', { size: 46 });
    this.year = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 820 : 1030) + 'px', fontSize: '40px', fontWeight: 600, color: COLOR.sub } }, s);
    this.year.textContent = '1951 · Evelyn Fix, Joseph Hodges';
    this.t = { no: ctx.w('케이엔엔에는') - .1, cab: ctx.w('저장해') - .1, q: ctx.w('질문이') - .1, c: ctx.w('계산하죠') - .2, n: ctx.w('인스턴스') - .1, y: ctx.w('천구백오십일') - .1 };
  },
  frame(ctx, t) {
    show(this.no, E.prog(t, this.t.no, .4), 20);
    pop(this.cab, E.prog(t, this.t.cab, .45), .8);
    pop(this.q, E.prog(t, this.t.q, .4), .6);
    const c = E.prog(t, this.t.c, .5);
    this.dr.forEach((d, i) => d.style.transform = `translateX(${-30 * c}px)`);
    this.lines.forEach((l, i) => l.setAttribute('opacity', E.prog(t, this.t.c + i * .12, .3)));
    show(this.name, E.prog(t, this.t.n, .4), 20);
    show(this.year, E.prog(t, this.t.y, .4), 20);
  },
};

// ───────────── L15 짬뽕을 숫자로 ─────────────
SCENES.L15 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long;
    this.tb = el('div', { class: 'abs vt', style: { left: (L ? 260 : 60) + 'px', top: (L ? 90 : 200) + 'px', width: (L ? 1400 : 960) + 'px' } }, s);
    this.tb.innerHTML = `<div class="vr h"><span></span><span class="c0">고기</span><span class="c1">매움</span><span class="c2">면</span><span class="dd">거리</span></div>
      <div class="vr jj"><span class="nm">짬뽕</span><span class="v0">0</span><span class="v1">1</span><span class="v2">1</span><span class="dd"></span></div>
      <div class="vr rb"><span class="nm" style="color:${COLOR.orange}">B의 음식</span><span>0</span><span>1</span><span>0</span><span class="dd" style="color:${COLOR.orange}">1</span></div>
      <div class="vr rc"><span class="nm" style="color:${COLOR.blue}">C의 음식</span><span>0</span><span>0</span><span>1</span><span class="dd" style="color:${COLOR.blue}">1</span></div>`;
    const q = sel => this.tb.querySelector(sel);
    this.h = [q('.c0'), q('.c1'), q('.c2')]; this.v = [q('.v0'), q('.v1'), q('.v2')];
    this.rows = { jj: q('.jj'), b: q('.rb'), c: q('.rc') }; this.hd = q('.h');
    this.eq = el('div', { class: 'abs center rule', style: { left: (L ? 410 : 70) + 'px', width: (L ? 1100 : 940) + 'px', top: (L ? 680 : 920) + 'px' } }, s);
    this.eq.innerHTML = 'B와도 <b>1</b>, C와도 <b>1</b> → 똑같이 가까움';
    this.t = { jj: ctx.w('짬뽕도') - .1, h: [ctx.w('고기인지') - .1, ctx.w('매운지') - .1, ctx.w('면인지를') - .1], v: [ctx.eq('고기') - .1, ctx.eq('매움') - .1, ctx.eq('면') - .1],
      b: ctx.w('비의') - .1, c: ctx.w('씨의') - .1, eq: ctx.w('똑같이') - .1 };
  },
  frame(ctx, t) {
    show(this.rows.jj, E.prog(t, this.t.jj, .4), 20);
    this.hd.style.opacity = E.prog(t, this.t.h[0], .3);
    this.h.forEach((n, i) => n.style.opacity = E.prog(t, this.t.h[i], .3));
    this.v.forEach((n, i) => { const u = E.prog(t, this.t.v[i], .35); n.style.opacity = u; n.style.transform = `scale(${E.lerp(.5, 1, E.back(u))})`; });
    show(this.rows.b, E.prog(t, this.t.b, .4), 20); show(this.rows.c, E.prog(t, this.t.c, .4), 20);
    show(this.eq, E.prog(t, this.t.eq, .4), 20);
  },
};

// ───────────── L16 k를 바꾸면 (쇼츠 S2) ─────────────
const K_R = { 1: .30, 3: .62, 5: 1.2 };     // 별에서 k번째 이웃까지 거리보다 살짝 큰 반지름(0.28 / 0.54 / 1.12 다음)
function kNear(k) { return byDist(STAR_Y).slice(0, k).map(x => x[1][0]); }
SCENES.L16 = {
  init(ctx) {
    const L = ctx.long, P = this.P = makePlot(ctx, ctx.stage, L ? undefined : { x: 100, y: 90, w: 880, h: 720 }, ZOOM);
    this.star = P.star(STAR_Y); this.star.place(STAR_Y, 1, 1);
    this.ring = P.ring(STAR_Y);
    this.list = el('div', { class: 'abs klist', style: { left: (L ? 1210 : 90) + 'px', top: (L ? 160 : 885) + 'px', width: (L ? 600 : 900) + 'px' } }, ctx.stage);
    if (!L) this.list.classList.add('row');
    this.list.innerHTML = [[1, '사과', APPLE], [3, '귤', '#c27c00'], [5, '귤', '#c27c00']].map(([k, r, c]) => `<div class="kr"><span class="kk">k = ${k}</span><span class="kv" style="color:${c}">${r}</span></div>`).join('');
    this.rows = [...this.list.querySelectorAll('.kr')];
    this.t = { k: [ctx.w('일이면') - .2, ctx.w('삼이면') - .2, ctx.w('오면') - .2], diff: ctx.w('달라졌어요') - .1 };
  },
  frame(ctx, t) {
    const P = this.P; let k = 0, r = 0;
    [1, 3, 5].forEach((kk, i) => { if (t >= this.t.k[i]) { k = kk; } });
    // 원 반지름은 k가 바뀔 때 부드럽게 커짐
    const rs = [0, K_R[1], K_R[3], K_R[5]];
    let rad = 0; [1, 3, 5].forEach((kk, i) => { if (t >= this.t.k[i]) rad = E.lerp(rs[i], rs[i + 1], E.ease(E.prog(t, this.t.k[i], .5))); });
    P.setRing(this.ring, rad);
    const near = k ? kNear(k) : [];
    FRUITS.forEach(f => P.set(f[0], { s: near.includes(f[0]) ? 1.35 : 1, o: k && !near.includes(f[0]) ? .45 : 1 }));
    this.rows.forEach((row, i) => { pop(row, E.prog(t, this.t.k[i] + .2, .35), .7); row.classList.toggle('hl', t >= this.t.diff && i < 2); });
  },
};

// ───────────── L17 왜 달라졌을까 ─────────────
SCENES.L17 = {
  init(ctx) {
    const L = ctx.long, P = this.P = makePlot(ctx, ctx.stage, L ? undefined : { x: 100, y: 90, w: 880, h: 720 }, ZOOM);
    this.star = P.star(STAR_Y); this.star.place(STAR_Y, 1, 1);
    this.ring = P.ring(STAR_Y);
    this.tag = el('div', { class: 'abs center tagx', style: { left: (P.pt('사과6')[0] - 170) + 'px', top: (P.pt('사과6')[1] - 130) + 'px', width: '340px' } }, ctx.stage);
    this.tag.innerHTML = '유난히 작은 사과';
    this.ans = chip(ctx.stage, L ? 1220 : 300, L ? 200 : 880, '', { size: 56 });
    this.t = { a6: ctx.eq('사과') - .1, odd: ctx.w('유난히') - .1, k1: ctx.w('일이면') - .2, up: ctx.w('키우면') - .2, ok: ctx.w('흔들려요') - .3 };
  },
  frame(ctx, t) {
    const P = this.P, a = E.prog(t, this.t.a6, .3), odd = E.prog(t, this.t.odd, .35);
    FRUITS.forEach(f => {
      if (f[0] === '사과6') P.set('사과6', { s: 1 + .4 * a });
      else if (f[3] === '사과') P.set(f[0], { o: 1 - .6 * odd * (1 - E.prog(t, this.t.up, .4)) });
      else P.set(f[0], { o: 1 - .6 * odd * (1 - E.prog(t, this.t.up, .4)), s: 1 + .3 * E.prog(t, this.t.up + .3, .4) * kNear(5).includes(f[0]) });
    });
    pop(this.tag, odd, .7);
    const r1 = E.ease(E.prog(t, this.t.k1, .5)) * K_R[1], r5 = E.ease(E.prog(t, this.t.up, .7));
    P.setRing(this.ring, E.lerp(r1, K_R[5], r5));
    const showAns = E.prog(t, this.t.k1 + .4, .35);
    this.ans.innerHTML = t < this.t.up ? 'k = 1 → <b style="color:#d24a5a">사과</b>' : 'k = 5 → <b style="color:#c27c00">귤</b>';
    this.ans.style.opacity = showAns;
  },
};

// ───────────── L18 k가 너무 크면 ─────────────
SCENES.L18 = {
  init(ctx) {
    const P = this.P = makePlot(ctx, ctx.stage);
    this.star = P.star(STAR_Y); this.star.place(STAR_Y, 1, 1); this.ring = P.ring(STAR_Y);
    this.board = makeBoard(ctx, ctx.stage, 1220, 170, 560);
    this.c1 = chip(ctx.stage, 1220, 560, '잡음에는 <b>강해짐</b>', { size: 40 });
    this.c2 = chip(ctx.stage, 1220, 660, '경계는 <b style="color:#d24a5a">흐려짐</b>', { size: 40 });
    this.try = chip(ctx.stage, 1220, 770, 'k = 1, 3, 5, 7 … <b>시험해 보고 고르기</b>', { size: 36 });
    this.t = { st: ctx.w('강해지지만') - .1, bl: ctx.w('경계가') - .1, all: ctx.w('십이까지') - .2, mv: ctx.w('어디에') - .2, tr: ctx.w('여러') - .1, k: ctx.w('키우는') - .2 };
  },
  frame(ctx, t) {
    const P = this.P;
    // 원이 계속 커지다 '12까지'에서 전부 덮음
    const grow = E.lerp(K_R[5], 1.2, E.prog(t, this.t.k, 1)), all = E.ease(E.prog(t, this.t.all, .8));
    const pos = [STAR_Y[0] + 0.9 * Math.sin(E.prog(t, this.t.mv, 3) * Math.PI * 2) * E.prog(t, this.t.mv, .3), STAR_Y[1] + 1.0 * Math.sin(E.prog(t, this.t.mv, 3) * Math.PI) * E.prog(t, this.t.mv, .3)];
    this.star.place(pos, 1, 1);
    this.ring.setAttribute('cx', P.px(pos[0])); this.ring.setAttribute('cy', P.py(pos[1]));
    P.setRing(this.ring, E.lerp(grow, 4.2, all));
    show(this.c1, E.prog(t, this.t.st, .35), 15); show(this.c2, E.prog(t, this.t.bl, .35), 15);
    show(this.board, E.prog(t, this.t.all + .4, .4), 20);
    this.board.setVotes(6, 6); this.board.setRes('어디서든 6 : 6', E.prog(t, this.t.mv, .4));
    show(this.try, E.prog(t, this.t.tr, .4), 15);
  },
};

// ───────────── L19 단위가 바뀌면 (쇼츠 S3) ─────────────
// 새 과일 Z와 비교 과일 A(크기만 1cm 차이), B(당도만 2 차이). 1칸 = UNIT px
function unitDiagram(ctx, parent) {
  const L = ctx.long, U = L ? 120 : 70;
  const zx = L ? 280 : 150, zy = L ? 600 : 700;
  const D = { U, zx, zy };
  D.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, parent);
  D.ax = el('path', { d: `M ${zx - 80} ${zy + 140} L ${ctx.W - 80} ${zy + 140}`, stroke: COLOR.sub, 'stroke-width': 5, fill: 'none' }, D.svg);
  D.xl = el('text', { x: ctx.W - 80, y: zy + 190, 'text-anchor': 'end', 'font-family': 'P', 'font-weight': 800, 'font-size': 36, fill: COLOR.sub, text: '크기 (cm)' }, D.svg);
  D.ticks = el('g', {}, D.svg);
  D.lnA = el('line', { x1: zx, y1: zy, x2: zx, y2: zy, stroke: APPLE, 'stroke-width': 7, 'stroke-linecap': 'round' }, D.svg);
  D.lnB = el('line', { x1: zx, y1: zy, x2: zx, y2: zy, stroke: COLOR.blue, 'stroke-width': 7, 'stroke-linecap': 'round' }, D.svg);
  const dot = (c, label) => { const g = el('g', {}, D.svg); el('circle', { r: 26, fill: c, stroke: '#fff', 'stroke-width': 4 }, g); el('text', { y: 12, 'text-anchor': 'middle', 'font-family': 'P', 'font-weight': 800, 'font-size': 32, fill: '#fff', text: label }, g); return g; };
  D.Z = dot(COLOR.ink, '새'); D.A = dot(APPLE, 'A'); D.B = dot(COLOR.blue, 'B');
  D.dA = el('text', { 'text-anchor': 'middle', 'font-family': 'P', 'font-weight': 800, 'font-size': 44, fill: APPLE, opacity: 0 }, D.svg);
  D.dB = el('text', { 'font-family': 'P', 'font-weight': 800, 'font-size': 44, fill: COLOR.blue, opacity: 0 }, D.svg);
  D.place = (scale, uA, uB) => {           // scale: 크기 1칸이 몇 배로 보이나(cm=1, mm=10)
    const ax = zx + U * scale, by = zy - 2 * U;
    D.Z.setAttribute('transform', `translate(${zx},${zy})`);
    D.A.setAttribute('transform', `translate(${ax},${zy})`); D.B.setAttribute('transform', `translate(${zx},${by})`);
    D.lnA.setAttribute('x2', E.lerp(zx, ax - 26, uA)); D.lnB.setAttribute('y2', E.lerp(zy, by + 26, uB));
    D.lnA.setAttribute('opacity', uA > .01 ? 1 : 0); D.lnB.setAttribute('opacity', uB > .01 ? 1 : 0);
    D.dA.setAttribute('x', (zx + ax) / 2); D.dA.setAttribute('y', zy + 70); D.dB.setAttribute('x', zx - 70); D.dB.setAttribute('y', (zy + by) / 2 + 14);
  };
  return D;
}
SCENES.L19 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long;
    this.D = unitDiagram(ctx, s);
    this.head = chip(s, L ? 120 : 70, L ? 50 : 40, 'kNN은 <b>거리</b>로만 판단 → <b>단위</b>에 민감', { size: L ? 46 : 40 });
    this.a = chip(s, L ? 1000 : 520, L ? 300 : 300, '<b style="color:#d24a5a">A</b>: 크기만 1cm 차이', { size: 40 });
    this.b = chip(s, L ? 1000 : 520, L ? 400 : 400, '<b style="color:#3b6fb6">B</b>: 당도만 2 차이', { size: 40 });
    this.win = el('div', { class: 'abs badge', style: { padding: '8px 30px', whiteSpace: 'nowrap' } }, s);
    this.win.textContent = 'A가 더 가까움';
    this.t = { h: ctx.w('케이엔엔은') - .1, z: ctx.eq('새') - .1, two: ctx.w('둘') - .1, a: ctx.w('에이는') - .1, b: ctx.w('비는') - .1,
      da: ctx.w('에이까지') - .1, db: ctx.w('비까지는') - .1, win: ctx.w('에이가') - .1 };
  },
  frame(ctx, t) {
    const D = this.D;
    show(this.head, E.prog(t, this.t.h, .4), 20);
    D.place(1, E.prog(t, this.t.da, .4), E.prog(t, this.t.db, .4));
    D.Z.setAttribute('opacity', E.prog(t, this.t.z, .3));
    D.A.setAttribute('opacity', E.prog(t, this.t.two, .3)); D.B.setAttribute('opacity', E.prog(t, this.t.two + .15, .3));
    show(this.a, E.prog(t, this.t.a, .35), 15); show(this.b, E.prog(t, this.t.b, .35), 15);
    D.dA.textContent = '1'; D.dB.textContent = '2';
    D.dA.setAttribute('opacity', E.prog(t, this.t.da + .3, .3)); D.dB.setAttribute('opacity', E.prog(t, this.t.db + .3, .3));
    this.win.style.left = (D.zx + D.U + 50) + 'px'; this.win.style.top = (D.zy - 40) + 'px';
    pop(this.win, E.prog(t, this.t.win, .4), .7);
  },
};

// ───────────── L20 밀리미터로 바꾸면 ─────────────
SCENES.L20 = {
  init(ctx) {
    const s = ctx.stage, L = ctx.long;
    this.D = unitDiagram(ctx, s);
    this.a = chip(s, L ? 1000 : 520, L ? 300 : 300, '<b style="color:#d24a5a">A</b>: 크기만 1cm 차이', { size: 40 });
    this.b = chip(s, L ? 1000 : 520, L ? 400 : 400, '<b style="color:#3b6fb6">B</b>: 당도만 2 차이', { size: 40 });
    this.mm = chip(s, L ? 120 : 70, L ? 50 : 40, '1cm → <b>10mm</b>로 적으면?', { size: L ? 46 : 40, border: COLOR.orange });
    this.win = el('div', { class: 'abs badge', style: { padding: '8px 30px', whiteSpace: 'nowrap' } }, s);
    this.win.textContent = 'B가 더 가까움';
    this.norm = el('div', { class: 'abs center rule', style: { left: (L ? 360 : 60) + 'px', width: (L ? 1200 : 960) + 'px', top: (L ? 120 : 860) + 'px' } }, s);
    this.norm.innerHTML = '<b>정규화</b>: 특징마다 값의 범위를 0~1로 맞추기';
    this.t = { mm: ctx.w('밀리미터로') - .1, ten: ctx.eq('십이') - .1, db: ctx.w('비까지는') - .1, win: ctx.w('비가') - .1, sw: ctx.w('바뀌었어요') - .2, n: ctx.has('정규화를') ? ctx.w('정규화를') - .3 : 999 };
  },
  frame(ctx, t) {
    const D = this.D, st = E.ease(E.prog(t, this.t.mm, 1.2));
    show(this.mm, E.prog(t, this.t.mm, .4), 20);
    this.a.style.opacity = 1 - E.prog(t, this.t.mm, .3); this.b.style.opacity = 1 - E.prog(t, this.t.mm, .3);
    D.place(E.lerp(1, 10, st), 1, 1);
    D.xl.textContent = st > .5 ? '크기 (mm)' : '크기 (cm)';
    D.dA.textContent = st > .5 ? '10' : '1'; D.dA.setAttribute('opacity', 1); D.dB.textContent = '2'; D.dB.setAttribute('opacity', 1);
    D.dA.setAttribute('fill', E.prog(t, this.t.ten, .2) > .5 ? COLOR.orange : APPLE);
    const w = E.prog(t, this.t.win, .4);
    this.win.style.left = (D.zx + 50) + 'px'; this.win.style.top = (D.zy - 2 * D.U - 40) + 'px';
    pop(this.win, w, .7);
    show(this.norm, E.prog(t, this.t.n, .45), 20);
    if (ctx.long) this.mm.style.opacity *= 1 - E.prog(t, this.t.n - .2, .2);
  },
};

// ───────────── L21 동점과 속도 ─────────────
SCENES.L21 = {
  init(ctx) {
    const s = ctx.stage;
    this.board = makeBoard(ctx, s, 120, 90, 540);
    this.odd = chip(s, 120, 520, '두 종류 분류 → <b>k는 홀수</b>', { size: 40 });
    this.wt = chip(s, 120, 630, '가까울수록 <b>큰 표</b> (거리 가중)', { size: 40 });
    // 오른쪽: 데이터가 많으면 모든 점과 거리를 재야 함
    this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
    this.cx = 1290; this.cy = 420;
    this.dots = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 160; i++) { const x = 900 + rnd() * 800, y = 120 + rnd() * 600; this.dots.push([x, y, el('circle', { cx: x, cy: y, r: 7, fill: rnd() > .5 ? APPLE : TANG, opacity: 0 }, this.svg)]); }
    this.fan = this.dots.map(([x, y]) => el('line', { x1: this.cx, y1: this.cy, x2: x, y2: y, stroke: COLOR.blue, 'stroke-width': 1.5, opacity: 0 }, this.svg));
    const st = el('g', { transform: `translate(${this.cx},${this.cy})` }, this.svg); const pts = [];
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 12 : 28, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`); }
    this.star = el('polygon', { points: pts.join(' '), fill: COLOR.blue, stroke: '#fff', 'stroke-width': 3, opacity: 0 }, st);
    this.slow = chip(s, 980, 760, '데이터가 많으면 <b style="color:#d24a5a">느려짐</b>', { size: 40 });
    this.fix = chip(s, 980, 760, '<b>KD 트리</b> · <b>근사 탐색</b>으로 계산 줄이기', { size: 38 });
    this.t = { tie: ctx.w('동점이') - .1, odd: ctx.w('홀수로') - .1, wt: ctx.eq('더') - .1, all: ctx.w('모든') - .1, slow: ctx.w('느려져요') - .1, fix: ctx.w('케이디') - .1, q: ctx.eq('또') - .1 };
  },
  frame(ctx, t) {
    show(this.board, E.prog(t, this.t.tie - .2, .4), 20);
    this.board.setVotes(1, 1);
    this.board.setRes(t < this.t.odd ? '동점!' : 'k = 3이면 결정', E.prog(t, this.t.tie + .3, .3));
    if (t >= this.t.odd) this.board.setVotes(1, 2);
    show(this.odd, E.prog(t, this.t.odd, .35), 15); show(this.wt, E.prog(t, this.t.wt, .35), 15);
    const d = E.prog(t, this.t.q, .8); this.dots.forEach(([, , c], i) => c.setAttribute('opacity', E.clamp(d * 3 - i / 80)));
    this.star.setAttribute('opacity', E.prog(t, this.t.q + .3, .3));
    const f = E.prog(t, this.t.all, 1.4); this.fan.forEach((l, i) => l.setAttribute('opacity', (i / 160 < f ? .35 : 0) * (1 - .6 * E.prog(t, this.t.fix, .4))));
    show(this.slow, E.prog(t, this.t.slow, .35), 15); this.slow.style.opacity *= 1 - E.prog(t, this.t.fix - .2, .2);
    show(this.fix, E.prog(t, this.t.fix, .35), 15);
  },
};

// ───────────── L22 특징이 너무 많으면 ─────────────
SCENES.L22 = {
  init(ctx) {
    const s = ctx.stage;
    this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
    this.cx = 700; this.cy = 470; this.R = 330;
    this.axes = []; for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 12; this.axes.push([a, el('line', { x1: this.cx, y1: this.cy, x2: this.cx + Math.cos(a) * this.R, y2: this.cy + Math.sin(a) * this.R, stroke: COLOR.sub, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0 }, this.svg)]); }
    this.l1 = el('text', { x: this.cx + 16, y: this.cy - this.R + 10, 'font-family': 'P', 'font-weight': 800, 'font-size': 36, fill: COLOR.green, text: '크기' }, this.svg);
    this.l2 = el('text', { x: this.cx + this.R * Math.cos(-Math.PI / 2 + Math.PI / 6) + 10, y: this.cy + this.R * Math.sin(-Math.PI / 2 + Math.PI / 6), 'font-family': 'P', 'font-weight': 800, 'font-size': 36, fill: COLOR.green, text: '당도' }, this.svg);
    this.ok = chip(s, 1180, 170, '특징 2~3개: 거리가 <b>잘 작동</b>', { size: 40 });
    this.many = chip(s, 1180, 300, '특징이 아주 많으면:<br>거리 차이가 <b>잘 안 드러남</b>', { size: 40 });
    this.bars = el('div', { class: 'abs bars', style: { left: '1180px', top: '470px', width: '560px' } }, s);
    this.bars.innerHTML = [0, 1, 2, 3].map(() => '<div class="bar"></div>').join('');
    this.bb = [...this.bars.querySelectorAll('.bar')];
    this.curse = el('div', { class: 'abs center', style: { left: '1180px', width: '560px', top: '720px', fontSize: '64px', fontWeight: 800, color: COLOR.orange } }, s);
    this.curse.textContent = '차원의 저주';
    this.t = { ok: ctx.w('작동해요') - .4, many: ctx.w('많아지면') - .1, gap: ctx.w('차이가') - .1, cu: ctx.w('차원의') - .1 };
  },
  frame(ctx, t) {
    const m = E.prog(t, this.t.many, 1.2);
    this.axes.forEach(([a, l], i) => l.setAttribute('opacity', i === 0 || i === 2 ? E.prog(t, 0, .4) : E.clamp(m * 12 - i)));
    this.l2.setAttribute('x', this.cx + this.R * Math.cos(-Math.PI / 2 + Math.PI / 3) + 10); this.l2.setAttribute('y', this.cy + this.R * Math.sin(-Math.PI / 2 + Math.PI / 3));
    show(this.ok, E.prog(t, this.t.ok, .35), 15); show(this.many, E.prog(t, this.t.many, .35), 15);
    const g = E.prog(t, this.t.gap, .8);
    const L0 = [.25, .55, .8, 1], L1 = [.9, .93, .96, 1];
    this.bars.style.opacity = E.prog(t, this.t.ok + .3, .3);
    this.bb.forEach((b, i) => b.style.width = (E.lerp(L0[i], L1[i], g) * 100) + '%');
    pop(this.curse, E.prog(t, this.t.cu, .4), .7);
  },
};

// ───────────── L23 장점과 단점 ─────────────
SCENES.L23 = {
  init(ctx) {
    const s = ctx.stage;
    const col = (x, title, color, items) => {
      const c = el('div', { class: 'abs pc', style: { left: x + 'px', top: '50px', width: '760px' } }, s);
      c.innerHTML = `<div class="pt" style="background:${color}">${title}</div>` + items.map(i => `<div class="pi">${i}</div>`).join('');
      return [...c.querySelectorAll('.pi')];
    };
    this.pro = col(150, '장점', COLOR.green, ['원리가 단순함', '미리 학습하는 단계가 없음', '어느 이웃을 보고 판단했는지 보여 줄 수 있음']);
    this.con = col(1010, '단점', APPLE, ['데이터가 많으면 느림', '단위에 민감함', 'k를 직접 정해야 함']);
    this.end = el('div', { class: 'abs center rule', style: { left: '260px', width: '1400px', top: '640px' } }, s);
    this.end.innerHTML = '데이터가 아주 많지 않고 특징이 몇 개일 때<br><b>먼저 써 보기 좋은 방법</b>';
    this.t = { p: [ctx.w('단순하고') - .3, ctx.eq('미리') - .1, ctx.eq('어느') - .1], c: [ctx.w('느리고') - .3, ctx.w('단위에') - .1, ctx.w('케이를') - .1], e: ctx.w('그래서') - .1 };
  },
  frame(ctx, t) {
    this.pro.forEach((n, i) => show(n, E.prog(t, this.t.p[i], .35), 15));
    this.con.forEach((n, i) => show(n, E.prog(t, this.t.c[i], .35), 15));
    show(this.end, E.prog(t, this.t.e, .4), 20);
  },
};

// ───────────── L24 실생활에서 ─────────────
SCENES.L24 = {
  init(ctx) {
    const s = ctx.stage;
    this.head = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: '40px', fontSize: '64px', fontWeight: 800, color: COLOR.ink } }, s);
    this.head.innerHTML = '<span style="color:#14936a">가장 가까운 것</span> 찾기는 어디에?';
    const icon = {
      cart: `<svg viewBox="0 0 100 100" width="110" height="110"><path d="M12 22 H26 L36 64 H78 L88 34 H32" fill="none" stroke="#14936a" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/><circle cx="42" cy="80" r="7" fill="#14936a"/><circle cx="72" cy="80" r="7" fill="#14936a"/></svg>`,
      note: `<svg viewBox="0 0 100 100" width="110" height="110"><path d="M40 72 V22 L80 14 V64" fill="none" stroke="#14936a" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="30" cy="74" rx="12" ry="9" fill="#14936a"/><ellipse cx="70" cy="66" rx="12" ry="9" fill="#14936a"/></svg>`,
      find: `<svg viewBox="0 0 100 100" width="110" height="110"><circle cx="42" cy="42" r="24" fill="none" stroke="#14936a" stroke-width="8"/><line x1="60" y1="60" x2="84" y2="84" stroke="#14936a" stroke-width="10" stroke-linecap="round"/></svg>`,
    };
    const cards = [['cart', '아마존 · 2003년 논문', '함께 사는 고객이 많은<br>상품끼리 가깝다고 보고 추천'],
      ['note', '스포티파이 · Annoy', '비슷한 곡을<br>빠르게 찾는 도구'],
      ['find', 'Elasticsearch', '질문과 가장 가까운 글 찾기<br>= <b>kNN 검색</b>']];
    this.cards = cards.map(([ic, t1, t2], i) => {
      const c = el('div', { class: 'abs life', style: { left: (150 + i * 560) + 'px', top: '210px', width: '500px' } }, s);
      c.innerHTML = `${icon[ic]}<div class="l1">${t1}</div><div class="l2">${t2}</div>`; return c;
    });
    this.t = { h: 0, c: [ctx.w('아마존은') - .1, ctx.w('스포티파이는') - .1, ctx.eq('검색') - .1] };
  },
  frame(ctx, t) {
    show(this.head, E.prog(t, .05, .4), 20);
    let cur = -1; this.t.c.forEach((a, i) => { if (t >= a) cur = i; });
    this.cards.forEach((c, i) => { pop(c, E.prog(t, this.t.c[i], .45), .75); c.classList.toggle('on', i === cur); });
  },
};

// ───────────── L25 한 줄 요약 ─────────────
SCENES.L25 = {
  init(ctx) {
    const s = ctx.stage;
    this.sum = el('div', { class: 'abs center sum', style: { left: '160px', width: '1600px', top: '130px' } }, s);
    const parts = [['새 데이터와', '새'], ['가장 가까운 <b>k개</b>의 이웃을 찾아', '가장'], ['그 이웃들의 <b>다수결</b>로', '이웃들의'], ['답을 정하는 방법', '답을']];
    this.sum.innerHTML = '<span class="k0"><b>kNN</b> = </span>' + parts.map((p, i) => (i === 2 ? '<br>' : '') + `<span class="p${i}">${p[0]} </span>`).join('');
    this.hd = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: '30px', fontSize: '44px', fontWeight: 800, color: COLOR.sub } }, s);
    this.hd.textContent = '한 줄 요약';
    this.ps = [this.sum.querySelector('.k0'), ...parts.map((p, i) => this.sum.querySelector('.p' + i))];
    this.tt = [ctx.w('케이엔엔은') - .1, ...parts.map(p => ctx.w(p[1]) - .1)];
    // 작은 그림: 별 + 이웃 3개
    this.svg = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
    const cx = 960, cy = 620;
    this.nb = [[-150, -40, APPLE], [120, -70, TANG], [60, 110, TANG]].map(([dx, dy, c]) => {
      const l = el('line', { x1: cx, y1: cy, x2: cx + dx, y2: cy + dy, stroke: c, 'stroke-width': 6, opacity: 0 }, this.svg);
      const d = el('circle', { cx: cx + dx, cy: cy + dy, r: 24, fill: c, opacity: 0 }, this.svg); return [l, d];
    });
    const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 16 : 36, a = -Math.PI / 2 + i * Math.PI / 5; pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`); }
    this.star = el('polygon', { points: pts.join(' '), fill: COLOR.blue, opacity: 0 }, this.svg);
  },
  frame(ctx, t) {
    show(this.hd, E.prog(t, .05, .4), 15);
    this.ps.forEach((p, i) => { p.style.opacity = E.prog(t, this.tt[i], .3); });
    this.star.setAttribute('opacity', E.prog(t, this.tt[1], .3));
    this.nb.forEach(([l, d], i) => { const u = E.prog(t, this.tt[2] + i * .15, .3); l.setAttribute('opacity', u); d.setAttribute('opacity', u); });
  },
};

// ───────────── L26 퀴즈, L26B 정답 ─────────────
SCENES.L26 = {
  init(ctx) {
    const s = ctx.stage;
    this.q = el('div', { class: 'abs center quiz', style: { left: '360px', width: '1200px', top: '60px' } }, s);
    this.q.innerHTML = '<div class="qt">퀴즈</div><div class="qq"><b>k = 3</b>일 때 가장 가까운 이웃</div>';
    this.ch = ['사과', '귤', '귤'].map((n, i) => { const c = chip(s, 600 + i * 260, 360, n, { size: 54, border: n === '사과' ? APPLE : TANG, color: n === '사과' ? APPLE : '#c27c00', w: 200 }); c.style.textAlign = 'center'; return c; });
    this.ask = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: '520px', fontSize: '64px', fontWeight: 800, color: COLOR.green } }, s);
    this.ask.textContent = 'kNN의 답은?';
    this.count = el('div', { class: 'abs center count', style: { left: (ctx.W / 2 - 150) + 'px', width: '300px', top: '640px', fontSize: '150px', lineHeight: 1.1 } }, s);
    this.t = { q: ctx.w('퀴즈') - .1, c: [ctx.w('사과') - .1, ctx.eq('귤') - .1, ctx.w('귤이었어요') - .1], a: ctx.w('케이엔엔은') - .1 };
  },
  frame(ctx, t) {
    show(this.q, E.prog(t, this.t.q, .4), 20);
    this.ch.forEach((c, i) => pop(c, E.prog(t, this.t.c[i], .35), .7));
    show(this.ask, E.prog(t, this.t.a, .4), 20);
    const h = t - ctx.audioDur;
    if (h > 0) { const n = 3 - Math.floor(h); this.count.textContent = n >= 1 ? n : ''; const f = h % 1; this.count.style.opacity = n >= 1 ? 1 - f * .6 : 0; this.count.style.transform = `scale(${1.25 - f * .25})`; }
    else this.count.style.opacity = 0;
  },
};
SCENES.L26B = {
  init(ctx) {
    const s = ctx.stage;
    this.board = makeBoard(ctx, s, 660, 120, 600);
    this.res = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: '620px', fontSize: '110px', fontWeight: 800, color: '#c27c00' } }, s);
    this.res.textContent = '정답: 귤';
    this.t = { a: ctx.w('정답은') - .1, g: ctx.eq('귤') - .1, ap: ctx.w('사과') - .1, w: ctx.eq('귤이') - .1 };
  },
  frame(ctx, t) {
    show(this.board, E.prog(t, 0, .3), 15);
    this.board.setVotes(t >= this.t.ap ? 1 : 0, t >= this.t.g + .25 ? 2 : t >= this.t.g ? 1 : 0);
    this.board.setRes('귤 2 : 사과 1', E.prog(t, this.t.w, .35));
    pop(this.res, E.prog(t, this.t.a, .4), .7);
  },
};

// ───────────── L27 마무리와 블로그 안내 ─────────────
SCENES.L27 = {
  init(ctx) {
    const s = ctx.stage;
    this.done = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: '50px', fontSize: '60px', fontWeight: 800, color: COLOR.ink } }, s);
    this.done.innerHTML = '오늘은 <span style="color:#14936a">개념</span>까지';
    this.blog = el('div', { class: 'abs blogc', style: { left: '200px', top: '200px', width: '720px' } }, s);
    this.blog.innerHTML = '<div class="bh">블로그 · 눈바공 연구소</div><div class="bt2">kNN 알고리즘:<br>가까운 이웃에게 물어보기</div><div class="bl">· 12개 과일과의 거리 전체 표<br>· 정규화 계산 방법</div><div class="bd">설명란 링크 ↓</div>';
    this.next = el('div', { class: 'abs blogc nx', style: { left: '1000px', top: '200px', width: '720px' } }, s);
    this.next.innerHTML = `<div class="bh">다음 영상</div><div class="bt2">선형 회귀</div>
      <svg viewBox="0 0 400 200" width="100%" height="200"><line x1="20" y1="170" x2="380" y2="30" stroke="#14936a" stroke-width="8" stroke-linecap="round"/>
      ${[[50, 150], [100, 140], [150, 105], [210, 100], [260, 70], [320, 60], [360, 35]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#3b6fb6"/>`).join('')}</svg>
      <div class="bl">점들 사이에 가장 잘 맞는 직선 긋기</div>`;
    this.t = { d: 0, b: ctx.w('열두') - .1, n: ctx.w('다음') - .1 };
  },
  frame(ctx, t) {
    show(this.done, E.prog(t, .05, .4), 20);
    pop(this.blog, E.prog(t, this.t.b, .45), .8);
    pop(this.next, E.prog(t, this.t.n, .45), .8);
  },
};

// ───────────── 쇼츠 마무리 S2E, S3E ─────────────
SCENES.S2E = {
  init(ctx) {
    const L = ctx.long, P = this.P = makePlot(ctx, ctx.stage, L ? undefined : { x: 100, y: 90, w: 880, h: 720 });
    this.star = P.star(STAR_Y); this.star.place(STAR_Y, 1, 1); this.ring = P.ring(STAR_Y);
    this.q = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 380 : 860) + 'px', fontSize: (L ? 80 : 72) + 'px', fontWeight: 800, color: COLOR.orange, lineHeight: 1.2 } }, ctx.stage);
    this.q.innerHTML = 'k를 키울수록<br>더 정확해질까?';
    this.t = { big: ctx.w('크게') - .2, q: ctx.eq('더') - .1 };
  },
  frame(ctx, t) {
    this.P.setRing(this.ring, E.lerp(K_R[5], 4.2, E.ease(E.prog(t, this.t.big, 1.6))));
    pop(this.q, E.prog(t, this.t.q, .4), .7);
  },
};
SCENES.S3E = {
  init(ctx) {
    SCENES.L20.init.call(this, ctx);
    const L = ctx.long;
    this.qq = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 380 : 220) + 'px', fontSize: (L ? 76 : 68) + 'px', fontWeight: 800, color: COLOR.orange, lineHeight: 1.2, ...(L ? { background: COLOR.bg, padding: '20px 0' } : {}) } }, ctx.stage);
    this.qq.innerHTML = '단위가 다르면<br>어떻게 맞출까?';
    this.t.q = ctx.eq('그럼') - .1;
  },
  frame(ctx, t) {
    SCENES.L20.frame.call(this, ctx, t);
    pop(this.qq, E.prog(t, this.t.q, .4), .7);
  },
};
