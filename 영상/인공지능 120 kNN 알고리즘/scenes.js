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
    bubbleW: L ? 400 : 320, bubbleH: L ? 250 : 300, bubbleY: L ? 60 : 170,
    personSize: L ? 220 : 230, personY: L ? 380 : 560,
    smallSize: L ? 120 : 150, smallY: L ? 40 : 90,
    listY: L ? 190 : 175, listSize: L ? 30 : 26,
    cardY: L ? 560 : 820, cardW: L ? 380 : 310, cardH: L ? 130 : 150, cardSize: L ? 46 : 44,
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
      this.count = el('div', { class: 'abs center count', style: { left: (ctx.W / 2 - 150) + 'px', width: '300px', top: (ctx.long ? 705 : 1000) + 'px', fontSize: (ctx.long ? 150 : 130) + 'px', lineHeight: 1.1 } }, s);
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
      this.rule = el('div', { class: 'abs center rule', style: { left: (L ? 260 : 60) + 'px', width: (L ? 1400 : 960) + 'px', top: (L ? 540 : 720) + 'px' } }, s);
      this.rule.innerHTML = '답을 아는 것 중에서<br><b>가장 비슷한 것</b>을 찾아 판단';
      this.end = el('div', { class: 'abs center endnote', style: { left: 0, width: '100%', top: (L ? 805 : 1010) + 'px' } }, s);
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
    this.l1 = el('line', { x1: cx - cw / 2, y1: cy + 30, x2: xs[0] + 100, y2: cy + 30, stroke: COLOR.orange, 'stroke-width': 7, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round' }, this.svg2);
    this.l2 = el('line', { x1: cx + cw / 2, y1: cy + 30, x2: xs[1] - 100, y2: cy + 30, stroke: COLOR.blue, 'stroke-width': 7, 'stroke-dasharray': '14 12', 'stroke-linecap': 'round' }, this.svg2);
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
