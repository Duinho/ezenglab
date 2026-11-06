// 채널 소개 영상 장면. 장면표.md와 같은 장면 번호를 쓴다.
// 롱폼 무대 1920×920, 쇼츠 무대 860×680(쇼츠 배치 2판). 쇼츠에서는 진행자가 무대 왼쪽 아래(x 0~170, y 510~)에 있어 그 자리를 비운다.

const IMG = n => 'file://' + encodeURI(FOLDER + '/img/' + n + '.jpg');
window.PRELOAD = ['new', 't1'].map(n => { const i = new Image(); i.src = IMG(n); return i.decode().catch(() => 0); });

function tag(parent, x, y, w, html, color = COLOR.green) {
  const t = el('div', { class: 'abs center tagp', style: { left: x + 'px', top: y + 'px', width: w + 'px', background: color } }, parent);
  t.innerHTML = html; t.style.opacity = 0; return t;
}
function chip(parent, x, y, w, html, opt = {}) {
  const c = el('div', { class: 'abs center chipx', style: { left: x + 'px', top: y + 'px', width: w + 'px', borderColor: opt.color || COLOR.green, fontSize: (opt.size || 48) + 'px', background: '#fff' } }, parent);
  c.innerHTML = html; c.style.opacity = 0; return c;
}
function photo(parent, name, x, y, w, h) {
  const d = el('div', { class: 'abs photo', style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } }, parent);
  el('img', { src: IMG(name), decoding: 'sync' }, d); d.style.opacity = 0; return d;
}

// 실제 강좌에 나온 식(전자공학 120·130·140, 인공지능 120·130·140)
const FORMULAS = [
  'V = I × R',
  'V<sub>out</sub> = V<sub>in</sub> × R<sub>2</sub> ÷ (R<sub>1</sub> + R<sub>2</sub>)',
  'y = wx + b',
  'p = 1 ÷ (1 + e<sup>-z</sup>)',
  'd<sup>2</sup> = (x<sub>1</sub> - x<sub>2</sub>)<sup>2</sup> + (y<sub>1</sub> - y<sub>2</sub>)<sup>2</sup>',
  'I<sub>1</sub> + I<sub>2</sub> = I<sub>3</sub>',
];
// 수식 자리 [x, y, 기울기]. 롱폼은 가운데 물음표 둘레 여섯 자리, 쇼츠는 위아래 네 자리
const FPOS_L = [[150, 90, -4], [1110, 70, 3], [120, 380, 2], [1230, 400, -3], [260, 680, 3], [1080, 690, -2]];
const FPOS_S = [[40, 40, -3, 0], [470, 70, 3, 2], [200, 420, 2, 5], [470, 470, -3, 3]];   // [x, y, 기울기, 식 번호]
function formulas(ctx) {
  const L = ctx.long, pos = L ? FPOS_L : FPOS_S;
  return pos.map((p, i) => {
    const f = el('div', { class: 'abs fml', style: { left: p[0] + 'px', top: p[1] + 'px', fontSize: (L ? 60 : 40) + 'px' } }, ctx.stage);
    f.innerHTML = FORMULAS[L ? i : p[3]]; f.dataset.base = `rotate(${p[2]}deg)`; f.style.opacity = 0; return f;
  });
}
// 10칸 롤케이크(가변저항 강좌 2-2 그림을 코드로). 칼 자리 k(0~10)
function cake(parent, x, y, cw, gap) {
  const n = 10, w = n * cw + (n - 1) * gap, h = cw * 1.05;
  const sv = el('svg', { class: 'abs', width: w, height: h + 110, viewBox: `0 0 ${w} ${h + 110}`, style: { left: x + 'px', top: (y - 110) + 'px' } }, parent);
  const cells = [];
  for (let i = 0; i < n; i++) {
    const cx = i * (cw + gap);
    const g = el('g', {}, sv);
    el('rect', { x: cx, y: 110, width: cw, height: h, rx: cw * .16, fill: '#f6d8a8', stroke: '#c9a06a', 'stroke-width': 4 }, g);
    el('ellipse', { cx: cx + cw / 2, cy: 110 + h / 2, rx: cw * .17, ry: h * .22, fill: '#e8b4c4' }, g);
    cells.push(g);
  }
  const knife = el('g', {}, sv);
  el('line', { x1: 0, y1: 52, x2: 0, y2: 110 + h + 4, stroke: COLOR.teal, 'stroke-width': 6, 'stroke-dasharray': '16 10' }, knife);
  el('rect', { x: -14, y: 0, width: 28, height: 30, rx: 6, fill: COLOR.teal }, knife);
  el('path', { d: 'M -14 30 L 14 30 L 0 70 Z', fill: '#c9ced8', stroke: '#8a93a3', 'stroke-width': 3 }, knife);
  return {
    sv, w, set(k, show) {                                   // k칸째 자리에 칼(내 몫 = 칼 왼쪽)
      cells.forEach((c, i) => c.setAttribute('opacity', i < Math.round(k) ? 1 : .35));
      knife.setAttribute('transform', `translate(${k * (cw + gap) - gap / 2} 0)`);
      knife.setAttribute('opacity', show);
    },
  };
}

// 밤길 가로등(「전자 부품 지도」 2-1). set(on): 0~1 불빛
function lamp(parent, x, y, w, h) {
  const sv = el('svg', { class: 'abs', width: w, height: h, viewBox: '0 0 300 420', style: { left: x + 'px', top: y + 'px' } }, parent);
  el('rect', { x: 0, y: 0, width: 300, height: 420, rx: 34, fill: '#2d3e66' }, sv);
  el('path', { d: 'M 236 40 a 26 26 0 1 0 22 44 a 32 32 0 0 1 -22 -44 Z', fill: '#fdeeb5' }, sv);   // 달
  el('rect', { x: 20, y: 372, width: 260, height: 14, rx: 7, fill: '#55658c' }, sv);                   // 길
  const cone = el('path', { d: 'M 168 128 L 214 128 L 262 372 L 120 372 Z', fill: '#ffe9a8' }, sv);
  el('rect', { x: 76, y: 86, width: 14, height: 290, fill: '#c3cad6' }, sv);                           // 기둥
  el('rect', { x: 76, y: 86, width: 120, height: 14, fill: '#c3cad6' }, sv);                           // 팔
  el('path', { d: 'M 160 100 L 222 100 Q 222 132 191 132 Q 160 132 160 100 Z', fill: '#8a93a3' }, sv);
  const bulb = el('ellipse', { cx: 191, cy: 124, rx: 22, ry: 9, fill: '#8a93a3' }, sv);
  return { sv, set(on) { cone.setAttribute('opacity', on * .85); bulb.setAttribute('fill', on > .5 ? '#ffd54a' : '#8a93a3'); } };
}

const SCENES = {
  // L01 · 공감: 수식이 쏟아지고 물음표
  L01: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      this.f = formulas(ctx);
      this.q = el('div', { class: 'abs center qbig', style: { left: (ctx.W / 2 - (L ? 110 : 80)) + 'px', top: (L ? 330 : 250) + 'px', width: (L ? 220 : 160) + 'px', height: (L ? 220 : 160) + 'px', fontSize: (L ? 150 : 110) + 'px' } }, s);
      this.q.textContent = '?'; this.q.style.opacity = 0;
      this.t = { q: ctx.w('막막하죠') - .1 };
    },
    frame(ctx, t) {
      this.f.forEach((f, i) => pop(f, E.prog(t, .05 + i * .22, .4), .7));
      pop(this.q, E.prog(t, this.t.q, .45), .5);
    },
  },
  // L02 · 수식이 바닥으로 떨어지고 쉬운 그림이 남음
  L02: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      this.f = formulas(ctx); this.f.forEach(f => f.style.opacity = 1);
      this.floor = el('div', { class: 'abs intro-floor', style: { left: (L ? 260 : 200) + 'px', width: (L ? 1400 : 630) + 'px', top: (L ? 720 : 560) + 'px' } }, s);
      this.ph = photo(s, 'new', L ? 470 : 230, L ? 420 : 360, L ? 280 : 180, L ? 280 : 180);
      this.ck = lamp(s, L ? 1000 : 470, L ? 420 : 360, L ? 210 : 135, L ? 294 : 189); this.ck.set(1); this.ck.sv.style.opacity = 0;
      this.t = { drop: ctx.w('바닥까지') - .2, show: ctx.w('낮췄어요') - .1 };
    },
    frame(ctx, t) {
      const d = E.prog(t, this.t.drop, .7);
      this.f.forEach((f, i) => { const k = E.ease(E.clamp(d * 1.2 - i * .04)); f.style.opacity = 1 - k; f.style.transform = `${f.dataset.base} translateY(${k * (ctx.long ? 260 : 200)}px)`; });
      this.floor.style.transform = `scaleX(${E.ease(E.prog(t, this.t.drop, .6))})`;
      show(this.ph, E.prog(t, this.t.show, .45), 30);
      const u = E.prog(t, this.t.show + .15, .45); this.ck.sv.style.opacity = E.ease(u);
    },
  },
  L03: INTRO,   // 공통 인트로(tools/video/intro.js)
  // L04 · 어려운 개념 → 쉬운 예시
  L04: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      const a = L ? [180, 250, 640, 360] : [200, 30, 600, 230], b = L ? [1100, 250, 640, 360] : [200, 420, 600, 220];
      this.a = el('div', { class: 'abs fbox2 hard', style: { left: a[0] + 'px', top: a[1] + 'px', width: a[2] + 'px', height: a[3] + 'px' } }, s);
      this.a.innerHTML = `<div class="ft">어려운 개념</div><div class="fb">${FORMULAS[1]}</div>`;
      this.b = el('div', { class: 'abs fbox2 easy', style: { left: b[0] + 'px', top: b[1] + 'px', width: b[2] + 'px', height: b[3] + 'px' } }, s);
      this.b.innerHTML = '<div class="ft">쉬운 예시 먼저</div><div class="fb">열매 · 가로등 · 친구들의 음식</div>';
      const sv = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      this.ar = L ? arrow(sv, 840, 430, 1100, 430, COLOR.green, 10, { from: 20, to: 24 }) : arrow(sv, 500, 270, 500, 410, COLOR.green, 9, { from: 12, to: 14 });
      [this.a, this.b].forEach(n => n.style.opacity = 0);
      this.t = { a: ctx.w('어려운') - .1, b: ctx.w('쉬운') - .1 };
    },
    frame(ctx, t) {
      show(this.a, E.prog(t, Math.min(this.t.a, .2), .4), 24);
      this.ar(E.prog(t, this.t.b - .1, .5));
      pop(this.b, E.prog(t, this.t.b + .2, .45), .7);
    },
  },
  // L05 · 예시 1 — 인공지능 첫걸음의 처음 보는 열매
  L05: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      this.tg = tag(s, L ? 760 : 230, L ? 40 : 34, 400, '인공지능 첫걸음');
      this.ph = photo(s, 'new', L ? 735 : 240, L ? 140 : 120, L ? 450 : 340, L ? 450 : 340);
      this.qm = el('div', { class: 'abs center qmk', style: { left: (L ? 1205 : 600) + 'px', top: (L ? 150 : 130) + 'px', fontSize: (L ? 80 : 64) + 'px', width: (L ? 110 : 90) + 'px', height: (L ? 110 : 90) + 'px', lineHeight: (L ? 110 : 90) + 'px' } }, s);
      this.qm.textContent = '?'; this.qm.style.opacity = 0;
      this.lb = chip(s, L ? 560 : 190, L ? 640 : 500, L ? 800 : 630, '이 열매의 이름은? <b>별꼭지 열매</b>', { size: L ? 50 : 40 });
      this.t = { tg: ctx.w('인공지능') - .1, ph: ctx.w('열매') - .1, lb: ctx.w('맞혀') - .1 };
    },
    frame(ctx, t) {
      pop(this.tg, E.prog(t, this.t.tg, .4), .7);
      show(this.ph, E.prog(t, this.t.ph, .45), 30);
      pop(this.qm, E.prog(t, this.t.ph + .25, .4), .5);
      pop(this.lb, E.prog(t, this.t.lb, .45), .7);
    },
  },
  // L06 · 예시 2 — 전자 부품 지도의 가로등(알아채기 → 판단하기 → 켜기)
  L06: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      this.tg = tag(s, L ? 760 : 230, L ? 40 : 34, 400, '전자 부품 지도');
      this.lp = L ? lamp(s, 300, 170, 500, 700) : lamp(s, 40, 130, 310, 434); this.lp.set(0); this.lp.sv.style.opacity = 0;
      const ST = [['알아채기', '조도 센서'], ['판단하기', 'MCU'], ['켜기', 'LED 전등']];
      this.st = ST.map((x, i) => {
        const r = L ? [920, 200 + i * 230, 700, 180] : [380, 136 + i * 160, 440, 136];
        const b = el('div', { class: 'abs stp2', style: { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px', fontSize: (L ? 58 : 42) + 'px' } }, s);
        b.innerHTML = `<span class="sn">${i + 1}</span>${x[0]}<span class="sp">${x[1]}</span>`; b.style.opacity = 0; return b;
      });
      this.t = { tg: ctx.w('부품은') - .3, lp: ctx.w('가로등') - .1, mv: ctx.w('뜯어') - .1, end: ctx.audioDur };
    },
    frame(ctx, t) {
      pop(this.tg, E.prog(t, this.t.tg, .4), .7);
      show(this.lp.sv, E.prog(t, this.t.lp, .45), 30);
      const st0 = this.t.lp + .5, step = Math.max(.45, (this.t.end - .6 - st0) / 2);   // 가로등 뒤부터 세 칸, 끝나기 전에 불이 켜짐
      const at = [0, 1, 2].map(i => st0 + i * step);
      this.st.forEach((b, i) => { pop(b, E.prog(t, at[i], .4), .7); b.classList.toggle('on', t >= at[i] && (i === 2 || t < at[i + 1])); });
      this.lp.set(E.ease(E.prog(t, at[2], .35)));
    },
  },
  // L07 · 예시 → 원리 → 계산, 한 단계씩
  L07: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      const P = L ? [[300, 560], [800, 400], [1300, 240]] : [[180, 450], [400, 300], [620, 150]], w = L ? 340 : 200, h = L ? 170 : 130;
      this.st = ['예시', '원리', '계산'].map((x, i) => {
        const b = el('div', { class: 'abs stp2', style: { left: P[i][0] + 'px', top: P[i][1] + 'px', width: w + 'px', height: h + 'px', fontSize: (L ? 60 : 46) + 'px' } }, s);
        b.innerHTML = `<span class="sn">${i + 1}</span>${x}`; b.style.opacity = 0; return b;
      });
      this.t = { a: [ctx.w('예시') - .1, ctx.w('원리') - .1, ctx.w('계산') - .1] };
    },
    frame(ctx, t) { this.st.forEach((b, i) => { pop(b, E.prog(t, this.t.a[i], .4), .7); b.classList.toggle('on', t >= this.t.a[i] && (i === 2 || t < this.t.a[i + 1])); }); },
  },
  // L08 · 다루는 과목 세 갈래 + 꾸준히 새 강의
  L08: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      const subj = [['인공지능', 'kNN · 선형 회귀 · 로지스틱 회귀'], ['전자공학', '옴의 법칙 · 키르히호프 · 전압 분배'], ['전자 부품', '부품 지도 · 저항 · 가변저항']];
      this.c = subj.map((x, i) => {
        const r = L ? [170 + i * 540, 150, 500, 300] : [200, 34 + i * 148, 600, 128];
        const b = el('div', { class: 'abs subj', style: { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px' } }, s);
        b.innerHTML = `<div class="ft">${x[0]}</div><div class="fb">${x[1]}</div>`; b.style.opacity = 0; return b;
      });
      if (!L) this.c.forEach(b => b.classList.add('row'));
      this.ch = chip(s, L ? 610 : 200, L ? 560 : 500, L ? 700 : 600, '<b>꾸준히</b> 새 강의가 올라와요', { size: L ? 54 : 44 });
      this.t = { c: [ctx.w('인공지능') - .1, ctx.w('전자공학') - .1, ctx.w('전자') - .1 > ctx.w('전자공학') ? ctx.w('전자', 2) - .1 : ctx.w('전자', 2) - .1], ch: ctx.w('꾸준히') - .1 };
    },
    frame(ctx, t) { this.c.forEach((b, i) => pop(b, E.prog(t, this.t.c[i], .4), .75)); pop(this.ch, E.prog(t, this.t.ch, .45), .7); },
  },
  // L09 · 쇼츠 → 롱폼(재생목록) → 블로그(계산 과정)
  L09: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      const R = L ? [[130, 260, 460, 300], [730, 260, 460, 300], [1330, 260, 460, 300]] : [[200, 34, 600, 146], [200, 267, 600, 146], [200, 500, 600, 146]];
      const txt = [['쇼츠', '짧게 맛보기'], ['전체 강의', '재생목록 순서대로'], ['블로그', '계산 과정 이어 보기']];
      this.b = R.map((r, i) => {
        const b = el('div', { class: 'abs flow' + (L ? '' : ' row'), style: { left: r[0] + 'px', top: r[1] + 'px', width: r[2] + 'px', height: r[3] + 'px' } }, s);
        b.innerHTML = `<div class="ft">${txt[i][0]}</div><div class="fb">${txt[i][1]}</div>`; b.style.opacity = 0; return b;
      });
      const sv = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      this.ar = L ? [arrow(sv, 590, 410, 730, 410, COLOR.green, 9, { from: 14, to: 18 }), arrow(sv, 1190, 410, 1330, 410, COLOR.green, 9, { from: 14, to: 18 })]
        : [arrow(sv, 500, 180, 500, 267, COLOR.green, 8, { from: 8, to: 12 }), arrow(sv, 500, 413, 500, 500, COLOR.green, 8, { from: 8, to: 12 })];
      this.t = { b: [ctx.w('쇼츠로') - .1, ctx.w('전체') - .1, ctx.w('계산') - .1] };
    },
    frame(ctx, t) {
      this.b.forEach((b, i) => pop(b, E.prog(t, this.t.b[i], .4), .75));
      this.ar.forEach((a, i) => a(E.prog(t, this.t.b[i + 1] - .45, .45)));
    },
  },
  // L10 · 마무리: 로고 · 명패 · 구독 버튼 · 첫 강의부터
  L10: {
    init(ctx) {
      const L = ctx.long, s = ctx.stage;
      this.logo = el('div', { class: 'abs center intro-target', style: { left: 0, width: '100%', top: (L ? 100 : 40) + 'px', fontSize: (L ? 150 : 112) + 'px' } }, s);
      this.logo.innerHTML = '눈바공<span class="lab"> 연구소</span>';
      this.role = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 310 : 200) + 'px' } }, s);
      this.role.innerHTML = '<span class="intro-role">바닥 연구소장</span>';
      this.btns = el('div', { class: 'abs center outro-btns', style: { left: 0, width: '100%', top: (L ? 480 : 340) + 'px' } }, s);
      this.btns.innerHTML = '<span class="ob sub"><svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z" fill="currentColor"/></svg>구독</span>';
      this.sub = this.btns.querySelector('.ob');
      this.go = el('div', { class: 'abs center outro-bye', style: { left: (L ? 0 : 180) + 'px', width: (L ? 1920 : 650) + 'px', top: (L ? 690 : 500) + 'px', fontSize: (L ? 64 : 50) + 'px' } }, s);
      this.go.textContent = '첫 강의부터 시작해 보세요';
      [this.logo, this.role, this.sub, this.go].forEach(n => n.style.opacity = 0);
      this.t = { logo: ctx.w('바닥부터') - .1, sub: ctx.w('구독하고') - .1, go: ctx.eq('첫') - .1 };
    },
    frame(ctx, t) {
      pop(this.logo, E.prog(t, Math.min(this.t.logo, .1), .45), .8);
      pop(this.role, E.prog(t, this.t.logo + .4, .45), .7);
      pop(this.sub, E.prog(t, this.t.sub, .4), .6);
      const press = E.prog(t, this.t.sub + .45, .5), k = 1 - .12 * Math.sin(Math.PI * press);
      if (press > 0 && press < 1) this.sub.style.transform = `scale(${k})`;
      this.sub.classList.toggle('on', press >= .5);
      show(this.go, E.prog(t, this.t.go, .4), 20);
    },
  },
};
