// 인공지능 첫걸음 장면 그림. 장면표.md와 같은 장면 번호를 쓴다.
// 열매 사진은 원고 그림에서 잘라 img/에 둔 것(t1·t2·t3 학습 사진, new 처음 보는 열매, look 닮은꼴, hidden 꼭지가 가려진 열매)

const IMG = n => 'file://' + encodeURI(FOLDER + '/img/' + n + '.jpg');
window.PRELOAD = ['t1', 't2', 't3', 'new', 'look', 'hidden'].map(n => { const i = new Image(); i.src = IMG(n); return i.decode().catch(() => 0); });

// 사진마다 꼭지·몸통(줄무늬) 위치(사진 안 비율)
const SPOT = {
  t1: { stem: [.5, .2, .28], body: [.12, .3, .88, .95] }, t2: { stem: [.5, .26, .3], body: [.1, .38, .9, .95] },
  t3: { stem: [.5, .13, .26], body: [.15, .25, .85, .96] }, new: { stem: [.47, .12, .22], body: [.12, .25, .7, .8] },
  look: { stem: [.5, .1, .12], body: [.18, .1, .82, .86] }, hidden: { stem: [.47, .13, .2], body: [.2, .2, .82, .94] },
};

// 사진 상자: 둥근 모서리 + 그림자. 꼭지 동그라미·몸통 표시는 사진 안에 둔다(겹침 검사에서 한 덩어리)
function photo(parent, name, x, y, w, h) {
  const d = el('div', { class: 'abs photo', style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } }, parent);
  const im = el('img', { src: IMG(name), decoding: 'sync' }, d);
  const sv = el('svg', { class: 'mk', width: w, height: h, viewBox: `0 0 ${w} ${h}` }, d);
  const sp = SPOT[name];
  d.stem = el('circle', { cx: sp.stem[0] * w, cy: sp.stem[1] * h, r: sp.stem[2] * w, fill: 'none', stroke: COLOR.green, 'stroke-width': 8, opacity: 0 }, sv);
  d.body = el('rect', { x: sp.body[0] * w, y: sp.body[1] * h, width: (sp.body[2] - sp.body[0]) * w, height: (sp.body[3] - sp.body[1]) * h, rx: 26, fill: 'none', stroke: COLOR.orange, 'stroke-width': 7, 'stroke-dasharray': '18 12', opacity: 0 }, sv);
  d.mark = (which, u, color) => { const n = d[which]; n.setAttribute('opacity', E.clamp(u)); if (color) n.setAttribute('stroke', color); };
  d.style.opacity = 0;
  return d;
}
function tag(parent, x, y, w, html, color = COLOR.green) {
  const t = el('div', { class: 'abs center tagp', style: { left: x + 'px', top: y + 'px', width: w + 'px', background: color } }, parent);
  t.innerHTML = html; t.style.opacity = 0; return t;
}
function chip(parent, x, y, html, opt = {}) {
  const c = el('div', { class: 'abs chipx', style: { left: x + 'px', top: y + 'px', background: opt.bg || '#fff', color: opt.color || COLOR.ink, borderColor: opt.border || COLOR.green, fontSize: (opt.size || 44) + 'px' } }, parent);
  if (opt.w) { c.style.width = opt.w + 'px'; c.style.whiteSpace = 'normal'; c.style.textAlign = 'center'; }
  c.innerHTML = html; c.style.opacity = 0; return c;
}
function big(parent, y, html, size, opt = {}) {
  const b = el('div', { class: 'abs center big', style: { left: (opt.x || 0) + 'px', width: (opt.w ? opt.w + 'px' : '100%'), top: y + 'px', fontSize: size + 'px', color: opt.color || COLOR.ink } }, parent);
  b.innerHTML = html; b.style.opacity = 0; return b;
}
// 카운트다운(멈춤 시간 동안 3·2·1 또는 2·1)
function countdown(ctx, parent, x, y, size) {
  const c = el('div', { class: 'abs center count', style: { left: (x - 150) + 'px', width: '300px', top: y + 'px', fontSize: size + 'px', lineHeight: 1.1, opacity: 0 } }, parent);
  return t => { const h = t - ctx.audioDur, n = Math.round(ctx.dur - ctx.audioDur) - Math.floor(h); if (h > 0 && n >= 1) { const f = h % 1; c.textContent = n; c.style.opacity = 1 - f * .6; c.style.transform = `scale(${1.25 - f * .25})`; } else c.style.opacity = 0; };
}
// 세 장의 학습 사진 배치(롱폼 가로, 쇼츠 가로 세 칸)
function trio(ctx, s, top) {
  const L = ctx.long, W = L ? 360 : 300, H = L ? 440 : 380, xs = L ? [300, 780, 1260] : [60, 390, 720];
  return ['t1', 't2', 't3'].map((n, i) => photo(s, n, xs[i], top, W, H));
}

const SCENES = {
  // ───────────── L01 여는 질문 ─────────────
  L01: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'new', L ? 260 : 300, L ? 170 : 90, L ? 480 : 480, L ? 480 : 480);
      this.p.classList.add('silhouette');
      this.q = el('div', { class: 'qmark' }, this.p); this.q.textContent = '?';   // 실루엣 위 물음표(사진 안에 둠)
      this.title = big(s, L ? 320 : 660, '<span class="kc">인공지능</span> 첫걸음', L ? 120 : 110, { x: L ? 820 : 0, w: L ? 900 : 1080 });
      this.sub = big(s, L ? 480 : 810, '처음 보는 열매로 배우는 AI의 원리', L ? 50 : 46, { x: L ? 820 : 0, w: L ? 900 : 1080, color: COLOR.sub });
      this.t = { p: 0, ai: ctx.w('인공지능이') - .1 };
    },
    frame(ctx, t) {
      pop(this.p, E.prog(t, .1, .5), .8);
      this.q.style.opacity = E.prog(t, .5, .4); this.q.style.transform = `translateY(${Math.sin(t * 3) * 6}px)`;
      show(this.title, E.prog(t, this.t.ai, .5), 30);
      show(this.sub, E.prog(t, this.t.ai + .4, .5), 20);
    },
  },

  L02: INTRO,   // 공통 인트로(tools/video/intro.js)
  L29: OUTRO,   // 공통 마무리 인사(tools/video/intro.js)

  // ───────────── L03 별꼭지 열매 ─────────────
  L03: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.ps = trio(ctx, s, L ? 60 : 40);
      const W = L ? 360 : 300, xs = L ? [300, 780, 1260] : [60, 390, 720];
      this.tags = xs.map(x => tag(s, x, L ? 525 : 445, W, '정답: 별꼭지 열매'));
      this.none = chip(s, 0, L ? 660 : 580, '세상에 없는, 이 강좌용 열매', { size: L ? 48 : 44 });
      this.none.style.left = '50%'; this.none.dataset.base = 'translateX(-50%)';
      this.t = { ps: [0, .3, .6].map(d => .05 + d), none: ctx.w('세상에') - .1 };   // '이 열매들은'에서 바로 사진이 나옴
    },
    frame(ctx, t) {
      this.ps.forEach((p, i) => { pop(p, E.prog(t, this.t.ps[i], .45), .7); show(this.tags[i], E.prog(t, this.t.ps[i] + .25, .35), 12); });
      show(this.none, E.prog(t, this.t.none, .4), 20);
    },
  },

  // ───────────── L04 공통점 두 가지 ─────────────
  L04: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.ps = trio(ctx, s, L ? 60 : 40);
      this.c1 = chip(s, L ? 430 : 70, L ? 560 : 480, '① 별 모양 꼭지', { size: L ? 52 : 46, border: COLOR.green });
      this.c2 = chip(s, L ? 1000 : 560, L ? 560 : 480, '② 세로 줄무늬', { size: L ? 52 : 46, border: COLOR.orange });
      this.diff = chip(s, 0, L ? 720 : 640, '색과 크기는 제각각', { size: L ? 44 : 40, border: COLOR.line, color: COLOR.sub });
      this.diff.style.left = '50%'; this.diff.dataset.base = 'translateX(-50%)';
      this.t = { diff: ctx.w('색도') - .1, stem: ctx.w('꼭지가') - .1, body: ctx.w('줄무늬가') - .1 };
    },
    frame(ctx, t) {
      this.ps.forEach(p => { p.style.opacity = 1; p.mark('stem', E.prog(t, this.t.stem, .35)); p.mark('body', E.prog(t, this.t.body, .35)); });
      show(this.diff, E.prog(t, this.t.diff, .4) * (1 - E.prog(t, this.t.stem - .2, .3)), 15);
      pop(this.c1, E.prog(t, this.t.stem, .4), .7);
      pop(this.c2, E.prog(t, this.t.body, .4), .7);
    },
  },

  // ───────────── L05 처음 보는 열매 ─────────────
  L05: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'new', L ? 610 : 190, L ? 40 : 30, L ? 700 : 700, L ? 690 : 690);
      this.q = chip(s, L ? 1360 : 190, L ? 120 : 760, '이건 무엇일까요?', { size: L ? 56 : 54, border: COLOR.blue });
      this.c1 = chip(s, L ? 1360 : 70, L ? 300 : 900, '처음 보는 <b>연두색</b>', { size: L ? 44 : 42, border: COLOR.line });
      this.c2 = chip(s, L ? 1360 : 470, L ? 420 : 900, '<b>나무 탁자</b> 위', { size: L ? 44 : 42, border: COLOR.line });
      this.cd = countdown(ctx, s, L ? 1500 : 970, L ? 560 : 280, L ? 150 : 110);
      this.t = { q: ctx.w('뭘까요') - .3, c1: ctx.w('연두색') - .1, c2: ctx.w('나무') - .1 };
    },
    frame(ctx, t) {
      pop(this.p, E.prog(t, 0, .5), .85);
      pop(this.q, E.prog(t, this.t.q, .4), .7);
      show(this.c1, E.prog(t, this.t.c1, .35), 15); show(this.c2, E.prog(t, this.t.c2, .35), 15);
      this.cd(t);
    },
  },

  // ───────────── L06 정답: 별꼭지 열매 ─────────────
  L06: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'new', L ? 610 : 190, L ? 40 : 30, 700, 690);
      this.ans = tag(s, L ? 1360 : 240, L ? 140 : 760, L ? 420 : 600, '별꼭지 열매!', COLOR.green);
      this.ans.style.fontSize = (L ? 60 : 64) + 'px';
      this.c1 = chip(s, L ? 1360 : 70, L ? 330 : 900, '① 별 모양 꼭지', { size: L ? 44 : 42 });
      this.c2 = chip(s, L ? 1360 : 520, L ? 450 : 900, '② 세로 줄무늬', { size: L ? 44 : 42, border: COLOR.orange });
      this.t = { a: ctx.eq('별꼭지') - .1, stem: ctx.w('꼭지와') - .2, body: ctx.w('줄무늬가') - .2 };
    },
    frame(ctx, t) {
      this.p.style.opacity = 1;
      pop(this.ans, E.prog(t, this.t.a, .4), .6);
      this.p.mark('stem', E.prog(t, this.t.stem, .35)); this.p.mark('body', E.prog(t, this.t.body, .35));
      pop(this.c1, E.prog(t, this.t.stem, .4), .7); pop(this.c2, E.prog(t, this.t.body, .4), .7);
    },
  },

  // ───────────── L07 닮은꼴 열매 ─────────────
  L07: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'look', L ? 610 : 190, L ? 40 : 30, 700, 690);
      this.q = chip(s, L ? 1360 : 120, L ? 120 : 760, L ? '이것도<br>별꼭지 열매일까요?' : '이것도 별꼭지 열매일까요?', { size: L ? 50 : 50, border: COLOR.blue });
      this.c1 = chip(s, L ? 1360 : 70, L ? 330 : 900, '<b>주황색</b>', { size: 44, border: COLOR.line });
      this.c2 = chip(s, L ? 1360 : 370, L ? 450 : 900, '<b>줄무늬</b>도 있음', { size: 44, border: COLOR.line });
      this.cd = countdown(ctx, s, L ? 1500 : 970, L ? 600 : 280, L ? 150 : 110);
      this.t = { q: ctx.w('이것도') - .1, c1: ctx.w('주황색이고') - .1, c2: ctx.w('줄무늬도') - .1 };
    },
    frame(ctx, t) {
      pop(this.p, E.prog(t, 0, .5), .85);
      pop(this.q, E.prog(t, this.t.q, .4), .7);
      show(this.c1, E.prog(t, this.t.c1, .35), 15); show(this.c2, E.prog(t, this.t.c2, .35), 15);
      this.cd(t);
    },
  },

  // ───────────── L08 정답: 아니에요 ─────────────
  L08: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long, W = L ? 520 : 470, H = L ? 520 : 470;
      this.a = photo(s, 'look', L ? 330 : 50, L ? 40 : 40, W, H);
      this.b = photo(s, 't1', L ? 1050 : 560, L ? 40 : 40, W, H);
      this.ta = tag(s, L ? 330 : 50, L ? 590 : 540, W, '단추 모양 꼭지', COLOR.red);
      this.tb = tag(s, L ? 1050 : 560, L ? 590 : 540, W, '별 모양 꼭지', COLOR.green);
      this.x = el('div', { class: 'xmark' }, this.a); this.x.textContent = '✕';   // 닮은꼴 사진 위 ✕(사진 안에 둠)
      this.end = big(s, L ? 700 : 680, '줄무늬·색이 같아도 <b>꼭지가 다르면</b> 다른 열매', L ? 54 : 46, { x: L ? 0 : 40, w: L ? 1920 : 1000 });
      this.t = { no: ctx.w('아니에요') - .1, btn: ctx.w('단추') - .2, star: (ctx.has('별모양이') ? ctx.w('별모양이') : ctx.w('별')) - .2, end: ctx.w('줄무늬와') - .1 };
    },
    frame(ctx, t) {
      pop(this.a, E.prog(t, 0, .4), .9);
      pop(this.b, E.prog(t, this.t.star, .4), .8);
      const xo = E.prog(t, this.t.no, .3) * (1 - E.prog(t, this.t.btn - .3, .3));
      this.x.style.opacity = xo; this.x.style.transform = `scale(${E.lerp(1.4, 1, E.ease(E.prog(t, this.t.no, .3)))})`;
      this.a.mark('stem', E.prog(t, this.t.btn, .3), COLOR.red); this.b.mark('stem', E.prog(t, this.t.star, .3));
      show(this.ta, E.prog(t, this.t.btn, .35), 12); show(this.tb, E.prog(t, this.t.star + .2, .35), 12);
      show(this.end, E.prog(t, this.t.end, .4), 20);
    },
  },

  // ───────────── L09 꼭지가 가려지면 ─────────────
  L09: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'hidden', L ? 300 : 230, L ? 40 : 30, L ? 640 : 620, L ? 640 : 620);
      this.c1 = chip(s, L ? 1030 : 70, L ? 130 : 690, '<b>줄무늬</b>만 보여요', { size: L ? 48 : 44, border: COLOR.orange });
      this.c2 = chip(s, L ? 1030 : 520, L ? 260 : 690, '꼭지는 가려짐', { size: L ? 48 : 44, border: COLOR.line, color: COLOR.sub });
      this.bub = el('div', { class: 'abs think', style: { left: (L ? 1030 : 120) + 'px', top: (L ? 430 : 830) + 'px', width: (L ? 660 : 700) + 'px' } }, s);
      this.bub.innerHTML = '“아마 맞을 거야…<br><b>하지만 확실하진 않아</b>”'; this.bub.style.opacity = 0;
      this.t = { c1: ctx.w('줄무늬만') - .1, c2: ctx.w('잎이') - .1, bub: ctx.at('아마', 2) - .1 };
    },
    frame(ctx, t) {
      pop(this.p, E.prog(t, 0, .5), .85);
      this.p.mark('body', E.prog(t, this.t.c1, .35));
      show(this.c2, E.prog(t, this.t.c2, .35), 15); show(this.c1, E.prog(t, this.t.c1, .35), 15);
      pop(this.bub, E.prog(t, this.t.bub, .45), .7);
    },
  },

  // ───────────── L10 방금 한 일 = 인공지능의 원리 ─────────────
  L10: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.hd = big(s, L ? 40 : 40, '방금 한 일 = <span class="kc">인공지능의 원리</span>', L ? 64 : 58);
      const rows = [['정답이 붙은 사진을 봤어요', '학습 데이터'], ['공통점을 찾았어요', '학습'], ['처음 보는 열매를 맞혔어요', '예측'], ['꼭지가 가려지자 “아마도”', '확률로 판단']];
      this.tb = el('div', { class: 'abs tbl', style: { left: (L ? 210 : 40) + 'px', top: (L ? 170 : 170) + 'px', width: (L ? 1500 : 1000) + 'px' } }, s);
      this.tb.innerHTML = `<div class="tr th"><span>방금 우리가 한 일</span><span>인공지능에서는</span></div>` + rows.map(r => `<div class="tr"><span class="l">${r[0]}</span><span class="r">${r[1]}</span></div>`).join('');
      if (!L) this.tb.classList.add('sm');
      this.rs = [...this.tb.querySelectorAll('.tr:not(.th)')];
      this.tb.style.opacity = 0;
      this.t = { hd: ctx.w('방금') - .1, l: [ctx.w('정답이') - .1, ctx.w('공통점을') - .1, ctx.w('처음') - .1, ctx.w('꼭지가') - .1],
        r: [ctx.w('데이터') - .1, ctx.eq('학습', 2) - .1, ctx.w('예측') - .1, ctx.w('확률로') - .1] };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, this.t.hd, .4), 20);
      this.tb.style.opacity = E.prog(t, this.t.hd + .3, .4);
      this.rs.forEach((r, i) => { const l = r.querySelector('.l'), rr = r.querySelector('.r'); l.style.opacity = E.prog(t, this.t.l[i], .35); rr.style.opacity = E.prog(t, this.t.r[i], .35); r.classList.toggle('on', t >= this.t.r[i]); });
    },
  },

  // ───────────── L11 한 줄 정의 ─────────────
  L11: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.box = el('div', { class: 'abs center defn', style: { left: (L ? 160 : 40) + 'px', width: (L ? 1600 : 1000) + 'px', top: (L ? 220 : 260) + 'px' } }, s);
      this.box.innerHTML = `<span class="d0"><b>인공지능</b> =</span><br><span class="d1">데이터에서 <b>규칙을 배워</b></span><br><span class="d2">처음 보는 것도 <b>판단</b>하는 프로그램</span>`;
      if (!L) this.box.style.fontSize = '64px';
      this.ds = [0, 1, 2].map(i => this.box.querySelector('.d' + i));
      this.t = [ctx.w('인공지능은') - .1, ctx.w('데이터에서') - .1, ctx.w('처음') - .1];
    },
    frame(ctx, t) { this.ds.forEach((d, i) => { d.style.opacity = E.prog(t, this.t[i], .4); }); },
  },

  // ───────────── L12 사람도 이렇게 판단해요 ─────────────
  L12: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long, ox = L ? 300 : 140, oy = L ? 150 : 170;
      this.hd = big(s, L ? 30 : 40, '사람도 늘 이렇게 판단해요', L ? 58 : 52);
      this.sv = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      this.cloud = el('g', { opacity: 0 }, this.sv);
      [[0, 60, 90], [90, 20, 110], [200, 50, 95], [110, 80, 100]].forEach(([x, y, r]) => el('circle', { cx: ox + 60 + x, cy: oy + 100 + y, r, fill: '#8d99ab' }, this.cloud));
      this.rain = el('g', { opacity: 0 }, this.sv);
      for (let i = 0; i < 6; i++) el('line', { x1: ox + 40 + i * 50, y1: oy + 270, x2: ox + 20 + i * 50, y2: oy + 330, stroke: COLOR.blue, 'stroke-width': 8, 'stroke-linecap': 'round' }, this.rain);
      const ux = L ? 1020 : 640, uy = L ? 200 : 220;
      this.umb = el('g', { opacity: 0 }, this.sv);
      el('path', { d: `M ${ux} ${uy + 130} A 170 150 0 0 1 ${ux + 340} ${uy + 130} Z`, fill: COLOR.red }, this.umb);
      el('line', { x1: ux + 170, y1: uy + 130, x2: ux + 170, y2: uy + 330, stroke: COLOR.ink, 'stroke-width': 10, 'stroke-linecap': 'round' }, this.umb);
      el('path', { d: `M ${ux + 170} ${uy + 330} q 0 40 -40 40 q -30 0 -30 -30`, fill: 'none', stroke: COLOR.ink, 'stroke-width': 10, 'stroke-linecap': 'round' }, this.umb);
      if (!L) { this.cloud.setAttribute('transform', 'scale(.8)'); this.rain.setAttribute('transform', 'scale(.8)'); this.umb.setAttribute('transform', `translate(${-ux * .2} 0) scale(.8)`); }
      this.c = chip(s, 0, L ? 680 : 760, '경험(데이터) → <b>비 올 가능성</b>', { size: L ? 56 : 50 });
      this.c.style.left = '50%'; this.c.dataset.base = 'translateX(-50%)';
      this.t = { cl: ctx.w('흐리고') - .4, um: ctx.w('우산을') - .2, ex: ctx.w('경험으로') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .4), 20);
      this.cloud.setAttribute('opacity', E.prog(t, this.t.cl, .4));
      this.rain.setAttribute('opacity', E.prog(t, this.t.cl + .4, .4));
      this.umb.setAttribute('opacity', E.prog(t, this.t.um, .4));
      show(this.c, E.prog(t, this.t.ex, .4), 20);
    },
  },
};

// 흐름 상자 줄(가로 또는 쇼츠 세로)
function flowBox(parent, x, y, w, h, title, body, color) {
  const b = el('div', { class: 'abs fbox', style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', borderColor: color || COLOR.line } }, parent);
  b.innerHTML = `<div class="ft" style="color:${color || COLOR.ink}">${title}</div><div class="fb">${body}</div>`; b.style.opacity = 0; return b;
}
function hArrow(sv, x1, y1, x2, y2, color) { return arrow(sv, x1, y1, x2, y2, color || COLOR.sub, 7); }

const STEPS = ['데이터 모으기', '라벨링', '특징 정하기', '학습', '평가', '예측'];
function stepRow(ctx, s, top) {
  const L = ctx.long;
  return STEPS.map((n, i) => {
    const x = L ? 70 + i * 300 : 60 + (i % 3) * 330, y = L ? top : top + Math.floor(i / 3) * 230, w = L ? 270 : 300, h = L ? 200 : 190;
    const b = el('div', { class: 'abs stp', style: { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' } }, s);
    b.innerHTML = `<div class="sn">${i + 1}</div><div class="sx">${n}</div>`; b.style.opacity = 0; return b;
  });
}

Object.assign(SCENES, {
  // ───────────── L13 보통 프로그램 ─────────────
  L13: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.hd = big(s, 40, '<b>보통 프로그램</b>: 사람이 규칙을 직접 써요', L ? 60 : 50);
      this.sv = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      if (L) {
        this.b1 = flowBox(s, 150, 220, 420, 220, '사람', '규칙을 직접 씀');
        this.b2 = flowBox(s, 750, 220, 460, 220, '규칙', '‘당첨’이 들어가면 스팸', COLOR.blue);
        this.b3 = flowBox(s, 1390, 220, 380, 220, '결과', '규칙대로만 판단');
        this.a1 = hArrow(this.sv, 590, 330, 730, 330); this.a2 = hArrow(this.sv, 1230, 330, 1370, 330);
        this.nw = flowBox(s, 600, 560, 720, 200, '새 스팸 메일', '‘무료 쿠폰 지급’ → 규칙에 없어 통과', COLOR.red);
      } else {
        this.b1 = flowBox(s, 240, 150, 600, 170, '사람', '규칙을 직접 씀');
        this.b2 = flowBox(s, 240, 390, 600, 170, '규칙', '‘당첨’이 들어가면 스팸', COLOR.blue);
        this.b3 = flowBox(s, 240, 630, 600, 170, '결과', '규칙대로만 판단');
        this.a1 = hArrow(this.sv, 540, 330, 540, 380); this.a2 = hArrow(this.sv, 540, 570, 540, 620);
        this.nw = flowBox(s, 90, 860, 720, 190, '새 스팸 메일', '‘무료 쿠폰 지급’ → 규칙에 없어 통과', COLOR.red);
      }
      this.t = { hd: 0, b2: ctx.w('스팸') - .1, b3: ctx.w('규칙을', 2, 4) - .1, nw: ctx.w('새로운') - .1 };
      this.t.b3 = ctx.w('하나하나') - .1;
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .4), 20); pop(this.b1, E.prog(t, .3, .4), .8);
      this.a1(E.prog(t, this.t.b2 - .3, .4)); pop(this.b2, E.prog(t, this.t.b2, .4), .8);
      this.a2(E.prog(t, this.t.b3 - .3, .4)); pop(this.b3, E.prog(t, this.t.b3, .4), .8);
      pop(this.nw, E.prog(t, this.t.nw, .4), .8);
    },
  },

  // ───────────── L14 인공지능은 ─────────────
  L14: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.hd = big(s, 40, '<b>인공지능</b>: 예시와 정답으로 배워요', L ? 60 : 50);
      this.sv = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      const pile = '<div class="mails"><span class="m sp">스팸</span><span class="m ok">정상</span><span class="m sp">스팸</span><span class="m ok">정상</span></div>';
      if (L) {
        this.b1 = flowBox(s, 120, 220, 520, 300, '예시 + 정답', pile, COLOR.blue);
        this.b2 = flowBox(s, 780, 220, 440, 300, '컴퓨터', '스팸의 특징을<br>스스로 찾음', COLOR.green);
        this.b3 = flowBox(s, 1360, 220, 420, 300, '결과', '처음 보는 메일도<br>판단', COLOR.green);
        this.a1 = hArrow(this.sv, 660, 370, 760, 370); this.a2 = hArrow(this.sv, 1240, 370, 1340, 370);
      } else {
        this.b1 = flowBox(s, 140, 150, 800, 270, '예시 + 정답', pile, COLOR.blue);
        this.b2 = flowBox(s, 240, 500, 600, 210, '컴퓨터', '스팸의 특징을 스스로 찾음', COLOR.green);
        this.b3 = flowBox(s, 240, 790, 600, 190, '결과', '처음 보는 메일도 판단', COLOR.green);
        this.a1 = hArrow(this.sv, 540, 430, 540, 490); this.a2 = hArrow(this.sv, 540, 720, 540, 780);
      }
      this.t = { b1: ctx.w('스팸') - .1, b2: ctx.w('컴퓨터가') - .1, b3: ctx.w('처음') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .4), 20); pop(this.b1, E.prog(t, this.t.b1, .4), .8);
      this.a1(E.prog(t, this.t.b2 - .3, .4)); pop(this.b2, E.prog(t, this.t.b2, .4), .8);
      this.a2(E.prog(t, this.t.b3 - .3, .4)); pop(this.b3, E.prog(t, this.t.b3, .4), .8);
    },
  },

  // ───────────── L15 배우는 과정 여섯 단계 ─────────────
  L15: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.hd = big(s, L ? 60 : 60, '인공지능이 배우는 과정', L ? 62 : 56);
      this.bs = stepRow(ctx, s, L ? 280 : 260);
      this.t = { hd: 0, st: [ctx.w('데이터') - .1, ctx.w('라벨링') - .1, ctx.w('특징') - .1, ctx.eq('학습') - .1, ctx.w('평가') - .1, ctx.w('예측') - .1] };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .4), 20);
      this.bs.forEach((b, i) => { b.style.opacity = .3 + .7 * E.prog(t, this.t.st[i], .3); b.classList.toggle('on', t >= this.t.st[i] && (i === 5 || t < this.t.st[i + 1])); });
    },
  },

  // ───────────── L16 평가는 처음 보는 문제로 ─────────────
  L16: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long, W = L ? 220 : 190;
      this.g1 = el('div', { class: 'abs grp', style: { left: (L ? 120 : 60) + 'px', top: (L ? 120 : 80) + 'px', width: (L ? 780 : 960) + 'px' } }, s);
      this.g1.innerHTML = '<div class="gt">학습용 사진</div><div class="gp"></div>';
      this.g2 = el('div', { class: 'abs grp test', style: { left: (L ? 1020 : 60) + 'px', top: (L ? 120 : 520) + 'px', width: (L ? 640 : 960) + 'px' } }, s);
      this.g2.innerHTML = '<div class="gt">시험용 사진</div><div class="gp"></div>';
      ['t1', 't2', 't3'].forEach(n => { const im = el('img', { src: IMG(n), decoding: 'sync', style: { width: W + 'px', height: W + 'px' } }, this.g1.querySelector('.gp')); });
      ['new', 'hidden'].forEach(n => { const im = el('img', { src: IMG(n), decoding: 'sync', style: { width: W + 'px', height: W + 'px' } }, this.g2.querySelector('.gp')); });
      this.c = chip(s, L ? 1080 : 260, L ? 560 : 960, '처음 보는 문제로 시험', { size: L ? 48 : 46, border: COLOR.orange });
      this.g1.style.opacity = 0; this.g2.style.opacity = 0;
      this.t = { g1: 0, g2: ctx.w('쓰지') - .2, c: ctx.w('시험을') - .1 };
    },
    frame(ctx, t) {
      pop(this.g1, E.prog(t, 0, .4), .9); pop(this.g2, E.prog(t, this.t.g2, .4), .9); show(this.c, E.prog(t, this.t.c, .4), 20);
    },
  },

  // ───────────── L17 라벨이 틀리면 ─────────────
  L17: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      const mk = (x, y, w, title, wrong) => {
        const p = el('div', { class: 'abs lpan' + (wrong ? ' bad' : ''), style: { left: x + 'px', top: y + 'px', width: w + 'px' } }, s);
        p.innerHTML = `<div class="lt">${title}</div><div class="lr"><div class="li"><img src="${IMG('t1')}"><span class="lb g">별꼭지</span></div><div class="li"><img src="${IMG('look')}"><span class="lb ${wrong ? 'r' : 'x'}">${wrong ? '별꼭지' : '닮은꼴'}</span></div></div><div class="lres">${wrong ? '꼭지 모양은 상관없다고 <b>잘못</b> 배워요' : '꼭지 모양이 중요하다고 배워요'}</div>`;
        p.style.opacity = 0; return p;
      };
      this.ok = mk(L ? 110 : 90, L ? 40 : 45, L ? 800 : 760, '라벨이 맞을 때', false);
      this.bad = mk(L ? 1010 : 90, L ? 40 : 530, L ? 800 : 760, '라벨이 틀렸을 때', true);
      if (!L) { this.ok.classList.add('sm'); this.bad.classList.add('sm'); }
      this.okres = this.ok.querySelector('.lres'); this.badres = this.bad.querySelector('.lres'); this.badlb = this.bad.querySelector('.lb.r');
      this.t = { ok: ctx.w('라벨링이라고') - .2, bad: ctx.w('틀리면') - .1, lb: ctx.w('실수로') - .1, res: ctx.w('상관없다고') - .3 };
    },
    frame(ctx, t) {
      pop(this.ok, E.prog(t, Math.min(.2, this.t.ok), .4), .9);
      this.okres.style.opacity = E.prog(t, this.t.ok + .4, .4);
      pop(this.bad, E.prog(t, this.t.bad, .4), .9);
      this.badlb.style.opacity = E.prog(t, this.t.lb, .3); this.badlb.style.transform = `scale(${1 + .2 * Math.sin(Math.PI * E.prog(t, this.t.lb, .5))})`;
      this.badres.style.opacity = E.prog(t, this.t.res, .4);
    },
  },

  // ───────────── L18 좋은 데이터와 정확한 라벨 ─────────────
  L18: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'look', L ? 260 : 290, L ? 60 : 40, L ? 520 : 500, L ? 520 : 500);
      this.bub = el('div', { class: 'abs think bad', style: { left: (L ? 840 : 150) + 'px', top: (L ? 140 : 580) + 'px', width: (L ? 620 : 780) + 'px' } }, s);
      this.bub.innerHTML = '인공지능:<br>“<b>별꼭지 열매</b>예요!”<div class="nx">✕ 틀린 답</div>'; this.bub.style.opacity = 0;
      this.end = chip(s, 0, L ? 650 : 870, '좋은 데이터 + 정확한 라벨 = <b>좋은 인공지능</b>', { size: L ? 54 : 40 });
      this.end.style.left = '50%'; this.end.dataset.base = 'translateX(-50%)';
      this.t = { b: ctx.w('답하게') - .6, e: ctx.eq('좋은') - .1 };
    },
    frame(ctx, t) {
      pop(this.p, E.prog(t, 0, .4), .9); pop(this.bub, E.prog(t, this.t.b, .4), .7); show(this.end, E.prog(t, this.t.e, .4), 20);
    },
  },

  // ───────────── L19 확률로 골라요 ─────────────
  L19: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      const rows = [['new', '처음 보는 열매', 96, '구십육'], ['look', '닮은꼴 열매', 8, '팔'], ['hidden', '꼭지가 가려진 열매', 70, '칠십']];
      this.hd = big(s, L ? 30 : 30, '“별꼭지 열매일 확률”을 따져 봐요', L ? 54 : 46);
      this.rows = rows.map(([n, name, v, w], i) => {
        const r = el('div', { class: 'abs prow' + (L ? '' : ' sm'), style: { left: (L ? 120 : 40) + 'px', top: ((L ? 140 : 140) + i * (L ? 210 : 230)) + 'px', width: (L ? 1560 : 1000) + 'px' } }, s);
        r.innerHTML = `<img src="${IMG(n)}"><div class="pn">${name}</div><div class="pb"><i></i></div><div class="pv">0%</div>`;
        r.style.opacity = 0; return { r, v, bar: r.querySelector('i'), val: r.querySelector('.pv'), t: ctx.eq(w) - .1 };
      });
      this.note = chip(s, 0, L ? 790 : 860, '숫자는 설명을 위한 예시예요', { size: L ? 38 : 38, border: COLOR.line, color: COLOR.sub });
      this.note.style.left = '50%'; this.note.dataset.base = 'translateX(-50%)';
      this.t = { hd: 0, rows: ctx.w('처음') - .3, note: ctx.w('숫자는') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .4), 20);
      this.rows.forEach((o, i) => { o.r.style.opacity = E.prog(t, this.t.rows + i * .15, .35); const u = E.ease(E.prog(t, o.t, .7)); o.bar.style.width = (o.v * u) + '%'; o.val.textContent = Math.round(o.v * u) + '%'; o.r.classList.toggle('top', i === 0 && u >= 1); });
      show(this.note, E.prog(t, this.t.note, .4), 15);
    },
  },

  // ───────────── L20 70%의 뜻 ─────────────
  L20: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'hidden', L ? 150 : 340, L ? 80 : 40, L ? 420 : 400, L ? 420 : 400);
      this.bar = el('div', { class: 'abs split' + (L ? '' : ' sm'), style: { left: (L ? 680 : 60) + 'px', top: (L ? 150 : 520) + 'px', width: (L ? 1000 : 960) + 'px' } }, s);
      this.bar.innerHTML = '<div class="a">70% 별꼭지 열매</div><div class="b">30%</div>';
      this.wr = el('div', { class: 'abs wrongl', style: { left: (L ? 680 + 700 : 60 + 672) + 'px', top: (L ? 320 : 670) + 'px', width: (L ? 300 : 288) + 'px' } }, s); this.wr.textContent = '틀릴 수 있음'; this.wr.style.opacity = 0;
      this.a = this.bar.querySelector('.a'); this.b = this.bar.querySelector('.b'); this.bar.style.opacity = 0;
      this.c = chip(s, L ? 680 : 140, L ? 470 : 820, '중요한 결정일수록 <b>사람이 한 번 더 확인</b>', { size: L ? 46 : 42 });
      this.t = { a: ctx.eq('칠십') - .1, b: ctx.eq('삼십') - .1, c: ctx.w('중요한') - .1 };
    },
    frame(ctx, t) {
      pop(this.p, E.prog(t, 0, .4), .9); this.bar.style.opacity = E.prog(t, this.t.a, .3);
      this.b.style.opacity = .25 + .75 * E.prog(t, this.t.b, .3); show(this.wr, E.prog(t, this.t.b, .3), 10); show(this.c, E.prog(t, this.t.c, .4), 20);
    },
  },

  // ───────────── L21 고르기만 하는 건 아니에요 ─────────────
  L21: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      const cs = [['고르기', '별꼭지 열매?<br>닮은꼴 열매?'], ['숫자 맞히기', '집값<br>내일 기온'], ['다음 단어 고르기', '챗봇: 확률에 따라<br>섞어 골라요']];
      this.cs = cs.map(([h, b], i) => { const x = L ? 150 + i * 560 : 90, y = L ? 160 : 60 + i * 340, w = L ? 500 : 900, hh = L ? 460 : 300; return flowBox(s, x, y, w, hh, h, b, [COLOR.green, COLOR.blue, COLOR.orange][i]); });
      this.cs.forEach(c => c.classList.add('tall'));
      this.t = [ctx.w('모든') - .1, ctx.w('집값이나') - .1, ctx.w('챗봇은') - .1];
    },
    frame(ctx, t) { this.cs.forEach((c, i) => pop(c, E.prog(t, this.t[i], .4), .85)); },
  },

  // ───────────── L22 배우는 방식 세 가지 ─────────────
  L22: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      const ic = [
        '<svg viewBox="0 0 240 110" width="240" height="110"><circle cx="45" cy="45" r="30" fill="#f0a31c"/><circle cx="120" cy="45" r="30" fill="#8e5bb5"/><circle cx="195" cy="45" r="30" fill="#e6c233"/><rect x="18" y="86" width="54" height="22" rx="8" fill="#14936a"/><rect x="93" y="86" width="54" height="22" rx="8" fill="#14936a"/><rect x="168" y="86" width="54" height="22" rx="8" fill="#14936a"/></svg>',
        '<svg viewBox="0 0 240 110" width="240" height="110"><circle cx="65" cy="55" r="50" fill="none" stroke="#3b6fb6" stroke-width="4" stroke-dasharray="10 8"/><circle cx="175" cy="55" r="50" fill="none" stroke="#3b6fb6" stroke-width="4" stroke-dasharray="10 8"/><circle cx="50" cy="45" r="15" fill="#f0a31c"/><circle cx="80" cy="70" r="15" fill="#f0a31c"/><circle cx="160" cy="45" r="15" fill="#8e5bb5"/><circle cx="190" cy="70" r="15" fill="#8e5bb5"/></svg>',
        '<svg viewBox="0 0 240 110" width="240" height="110"><rect x="10" y="20" width="100" height="70" rx="12" fill="#fff" stroke="#14213d" stroke-width="5"/><text x="60" y="64" text-anchor="middle" font-family="P" font-weight="800" font-size="26" fill="#14213d">해 보기</text><line x1="120" y1="55" x2="150" y2="55" stroke="#445066" stroke-width="5"/><rect x="155" y="32" width="80" height="46" rx="10" fill="#d24a5a"/><text x="195" y="64" text-anchor="middle" font-family="P" font-weight="800" font-size="28" fill="#fff">+10</text></svg>'];
      const cs = [['지도 학습', '정답이 붙은<br>데이터로 배움'], ['비지도 학습', '정답 없이<br>비슷한 것끼리 묶음'], ['강화 학습', '해 보고 받은<br>점수로 배움']];
      this.cs = cs.map(([h, b], i) => { const x = L ? 150 + i * 560 : 90, y = L ? 140 : 40 + i * 315, w = L ? 500 : 900, hh = L ? 540 : 290; const f = flowBox(s, x, y, w, hh, h, ic[i] + '<div class="fb2">' + b + '</div>', [COLOR.green, COLOR.blue, COLOR.red][i]); f.classList.add('tall', 'ic'); if (!L) f.classList.add('row'); return f; });
      this.t = [ctx.eq('정답이') - .3, ctx.eq('정답') - .3, ctx.eq('마지막으로') - .3];   // 각 문장이 시작될 때 카드가 나옴(설명이 이름보다 먼저 나오므로)
      this.hd = big(s, L ? 30 : 1000, '배우는 방식 세 가지', L ? 56 : 46); if (!L) this.hd.style.width = '800px';
    },
    frame(ctx, t) { show(this.hd, E.prog(t, 0, .4), 20); this.cs.forEach((c, i) => pop(c, E.prog(t, this.t[i], .4), .85)); },
  },

  // ───────────── L23 생활 속 인공지능 ─────────────
  L23: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      const cs = [['스팸 메일 걸러내기', '<b>Gmail</b><br>메일과 정답으로 배움'], ['사진 앱 인물 앨범', '<b>구글 포토</b><br>같은 얼굴끼리 묶음'], ['영상 추천', '<b>넷플릭스</b><br>내 취향에 맞는 작품']];
      this.cs = cs.map(([h, b], i) => { const x = L ? 150 + i * 560 : 90, y = L ? 160 : 60 + i * 330, w = L ? 500 : 900, hh = L ? 420 : 290; const f = flowBox(s, x, y, w, hh, h, b, [COLOR.red, COLOR.blue, COLOR.green][i]); f.classList.add('tall'); return f; });
      this.hd = big(s, L ? 40 : 1040, '생활 속 인공지능', L ? 58 : 48);
      if (!L) this.hd.style.width = '800px';
      this.t = [ctx.w('지메일은') - .1, ctx.w('구글') - .1, ctx.w('넷플릭스는') - .1];
    },
    frame(ctx, t) { show(this.hd, E.prog(t, 0, .4), 20); this.cs.forEach((c, i) => pop(c, E.prog(t, this.t[i], .4), .85)); },
  },

  // ───────────── L24 자주 헷갈리는 점 ─────────────
  L24: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long, W = L ? 230 : 230;
      this.c1 = chip(s, 0, L ? 50 : 50, '이해가 아니라 <b>패턴</b>을 찾아요', { size: L ? 56 : 50 });
      this.c1.style.left = '50%'; this.c1.dataset.base = 'translateX(-50%)';
      this.g = el('div', { class: 'abs grp', style: { left: (L ? 360 : 90) + 'px', top: (L ? 220 : 220) + 'px', width: (L ? 1200 : 900) + 'px' } }, s);
      this.g.innerHTML = '<div class="gt">학습 사진: 모두 회색 배경</div><div class="gp"></div>';
      ['t1', 't2', 't3'].forEach(n => el('img', { src: IMG(n), decoding: 'sync', style: { width: W + 'px', height: W + 'px' } }, this.g.querySelector('.gp')));
      this.g.style.opacity = 0;
      this.c2 = chip(s, 0, L ? 680 : 720, '“회색 배경이면 별꼭지 열매?” ✕', { size: L ? 52 : 46, border: COLOR.red, color: COLOR.red });
      this.c2.style.left = '50%'; this.c2.dataset.base = 'translateX(-50%)';
      this.t = { c1: ctx.w('이해하는') - .3, g: ctx.w('학습') - .1, c2: ctx.w('엉뚱하게') - .3 };
    },
    frame(ctx, t) { show(this.c1, E.prog(t, Math.min(.2, this.t.c1), .4), 20); pop(this.g, E.prog(t, this.t.g, .4), .9); show(this.c2, E.prog(t, this.t.c2, .4), 20); },
  },

  // ───────────── L25 앞으로 배울 알고리즘 ─────────────
  L25: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      const al = [['kNN', '가까운 이웃에게 물어보기'], ['선형 회귀', '직선으로 숫자 예측'], ['로지스틱 회귀', '예/아니오 확률 계산'], ['결정 트리', '스무고개처럼 질문'], ['나이브 베이즈', '단서의 확률로 분류'], ['k-평균 군집', '비슷한 것끼리 묶기'], ['신경망', '층을 쌓아 복잡한 패턴']];
      this.hd = big(s, L ? 30 : 30, '앞으로 배울 알고리즘', L ? 56 : 52);
      this.rows = al.map(([n, d], i) => { const r = el('div', { class: 'abs arow' + (L ? '' : ' sm'), style: { left: (L ? 360 : 60) + 'px', top: ((L ? 130 : 140) + i * (L ? 100 : 120)) + 'px', width: (L ? 1200 : 960) + 'px' } }, s); r.innerHTML = `<span class="an">${i + 1}</span><span class="ak">${n}</span><span class="ad">${d}</span>`; r.style.opacity = 0; return r; });
      this.hl = [ctx.w('케이엔엔') - .1, ctx.w('선형') - .1, ctx.w('로지스틱') - .1];
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .4), 20);
      this.rows.forEach((r, i) => { r.style.opacity = E.prog(t, .2 + i * .12, .3); r.classList.toggle('on', i < 3 && t >= this.hl[i]); });
    },
  },

  // ───────────── L26 한 줄 요약 ─────────────
  L26: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.hd = big(s, L ? 40 : 40, '한 줄 요약', L ? 44 : 44, { color: COLOR.sub });
      this.sum = el('div', { class: 'abs center sum', style: { left: (L ? 160 : 40) + 'px', width: (L ? 1600 : 1000) + 'px', top: (L ? 130 : 140) + 'px' } }, s);
      this.sum.innerHTML = '<span class="s0"><b>인공지능</b>은 데이터에서 <b>규칙을 배워</b></span><br><span class="s1">처음 보는 것도 <b>판단</b>하는 프로그램</span>';
      if (!L) this.sum.style.fontSize = '56px';
      this.ss = [this.sum.querySelector('.s0'), this.sum.querySelector('.s1')];
      const W = L ? 210 : 190, xs = L ? [420, 660, 900, 1290] : [40, 270, 500, 800];
      this.ims = ['t1', 't2', 't3', 'new'].map((n, i) => { const p = photo(s, n, xs[i], L ? 460 : 520, W, W); return p; });
      this.sv = el('svg', { class: 'abs', width: ctx.W, height: ctx.H, style: { left: 0, top: 0 } }, s);
      this.ar = arrow(this.sv, xs[2] + W + 20, (L ? 460 : 520) + W / 2, xs[3] - 20, (L ? 460 : 520) + W / 2, COLOR.green, 8);
      this.t = { s0: ctx.w('인공지능은') - .1, s1: ctx.w('처음') - .1 };
    },
    frame(ctx, t) {
      show(this.hd, E.prog(t, 0, .3), 10);
      show(this.ss[0], E.prog(t, this.t.s0, .4), 15); show(this.ss[1], E.prog(t, this.t.s1, .4), 15);
      this.ims.forEach((p, i) => pop(p, E.prog(t, i < 3 ? this.t.s0 + i * .2 : this.t.s1 + .3, .4), .8));
      this.ar(E.prog(t, this.t.s1, .5));
    },
  },

  // ───────────── L27 퀴즈 ─────────────
  L27: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.qt = big(s, L ? 30 : 30, '<span class="qtag">퀴즈</span>', 50);
      this.p = photo(s, 'hidden', L ? 300 : 340, L ? 140 : 140, L ? 520 : 400, L ? 520 : 400);
      this.q = el('div', { class: 'abs quizq', style: { left: (L ? 860 : 60) + 'px', top: (L ? 200 : 590) + 'px', width: (L ? 880 : 960) + 'px' } }, s);
      this.q.innerHTML = '인공지능:<br>“별꼭지 열매일 확률 <b>70%</b>”<div class="qq">무슨 뜻일까요?</div>'; this.q.style.opacity = 0;
      this.cd = countdown(ctx, s, L ? 1280 : 540, L ? 600 : 880, L ? 150 : 120);
      this.t = { p: ctx.w('인공지능이') - .2, q: ctx.eq('칠십') - .3, qq: ctx.w('무슨') - .1 };
    },
    frame(ctx, t) {
      show(this.qt, E.prog(t, 0, .3), 10); pop(this.p, E.prog(t, this.t.p, .4), .9); pop(this.q, E.prog(t, this.t.q, .4), .85);
      this.q.querySelector('.qq').style.opacity = E.prog(t, this.t.qq, .3); this.cd(t);
    },
  },

  // ───────────── L27B 퀴즈 정답 ─────────────
  L27B: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.bar = el('div', { class: 'abs split' + (L ? '' : ' sm'), style: { left: (L ? 260 : 60) + 'px', top: (L ? 160 : 200) + 'px', width: (L ? 1400 : 960) + 'px' } }, s);
      this.bar.innerHTML = '<div class="a">70% 별꼭지 열매 → 이쪽을 골라요</div><div class="b">30%</div>';
      this.b = this.bar.querySelector('.b'); this.bar.style.opacity = 0;
      this.c = chip(s, 0, L ? 420 : 520, '고르지만 <b>30%만큼은 틀릴 수 있어요</b>', { size: L ? 54 : 44 });
      this.c.style.left = '50%'; this.c.dataset.base = 'translateX(-50%)';
      this.t = { a: 0, b: ctx.eq('삼십') - .1 };
    },
    frame(ctx, t) { this.bar.style.opacity = E.prog(t, 0, .3); this.b.style.opacity = .25 + .75 * E.prog(t, this.t.b, .3); show(this.c, E.prog(t, this.t.b, .4), 20); },
  },

  // ───────────── L28 마무리와 블로그 안내 ─────────────
  L28: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.done = big(s, L ? 50 : 40, '오늘은 <span class="kc">인공지능이 무엇인지</span>', L ? 60 : 52);
      this.blog = el('div', { class: 'abs blogc', style: { left: (L ? 200 : 90) + 'px', top: (L ? 200 : 170) + 'px', width: (L ? 720 : 900) + 'px' } }, s);
      this.blog.innerHTML = '<div class="bh">블로그 · 눈바공 연구소</div><div class="bt2">인공지능 첫걸음</div><div class="bl">· 인공지능이 배우는 과정<br>· 생활 속 인공지능 예시</div><div class="bd">설명란 링크 ↓</div>';
      this.next = el('div', { class: 'abs blogc nx', style: { left: (L ? 1000 : 90) + 'px', top: (L ? 200 : 640) + 'px', width: (L ? 720 : 900) + 'px' } }, s);
      this.next.innerHTML = '<div class="bh">다음 영상</div><div class="bt2">kNN 알고리즘</div><div class="bl">가까운 이웃에게 물어보기</div>';
      this.blog.style.opacity = 0; this.next.style.opacity = 0;
      this.t = { b: ctx.w('배우는') - .1, n: ctx.w('다음') - .1 };
    },
    frame(ctx, t) { show(this.done, E.prog(t, 0, .4), 20); pop(this.blog, E.prog(t, this.t.b, .4), .9); pop(this.next, E.prog(t, this.t.n, .4), .9); },
  },

  // ───────────── 쇼츠 전용 ─────────────
  S1E: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.a = big(s, L ? 120 : 120, '공통점을 찾아 처음 보는 것을 맞히기<br>= <span class="kc">인공지능이 배우는 방식</span>', L ? 60 : 50);
      this.p = photo(s, 'look', L ? 660 : 290, L ? 330 : 420, L ? 600 : 500, L ? 540 : 500);
      this.q = chip(s, 0, L ? 760 : 940, '이것도 별꼭지 열매일까?', { size: L ? 50 : 50, border: COLOR.blue });
      this.q.style.left = '50%'; this.q.dataset.base = 'translateX(-50%)';
      this.t = { a: 0, p: ctx.w('그럼') - .1, q: ctx.w('별꼭지') - .1 };
    },
    frame(ctx, t) { show(this.a, E.prog(t, 0, .4), 20); this.a.style.opacity *= 1; pop(this.p, E.prog(t, this.t.p, .4), .85); pop(this.q, E.prog(t, this.t.q, .4), .7); },
  },
  S2A: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long, W = L ? 520 : 470;
      this.a = photo(s, 't1', L ? 330 : 50, 40, W, W); this.b = photo(s, 'look', L ? 1050 : 560, 40, W, W);
      this.ta = tag(s, L ? 330 : 50, W + 70, W, '별꼭지 열매 · 별 모양 꼭지', COLOR.green);
      this.tb = tag(s, L ? 1050 : 560, W + 70, W, '닮은꼴 열매 · 동그란 꼭지', '#667085');
      this.c = chip(s, 0, L ? 720 : 720, '사진 + 정답 → <b>구분하는 법을 배워요</b>', { size: L ? 50 : 42 });
      this.c.style.left = '50%'; this.c.dataset.base = 'translateX(-50%)';
      this.t = { a: 0, b: ctx.w('동그란') - .3, c: ctx.w('사진과') - .1 };
    },
    frame(ctx, t) {
      pop(this.a, E.prog(t, 0, .4), .85); this.a.mark('stem', E.prog(t, .5, .3)); show(this.ta, E.prog(t, .5, .35), 12);
      pop(this.b, E.prog(t, this.t.b, .4), .85); this.b.mark('stem', E.prog(t, this.t.b + .3, .3), COLOR.red); show(this.tb, E.prog(t, this.t.b + .3, .35), 12);
      show(this.c, E.prog(t, this.t.c, .4), 20);
    },
  },
  S2E: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.p = photo(s, 'hidden', L ? 300 : 290, L ? 60 : 60, L ? 520 : 500, L ? 520 : 500);
      this.q = el('div', { class: 'abs quizq', style: { left: (L ? 860 : 60) + 'px', top: (L ? 200 : 620) + 'px', width: (L ? 880 : 960) + 'px' } }, s);
      this.q.innerHTML = '인공지능:<br>“별꼭지 열매일 확률 <b>70%</b>”<div class="qq" style="opacity:1">무슨 뜻일까?</div>'; this.q.style.opacity = 0;
      this.t = { p: 0, q: ctx.eq('칠십') - .3 };
    },
    frame(ctx, t) { pop(this.p, E.prog(t, 0, .4), .9); pop(this.q, E.prog(t, this.t.q, .4), .85); },
  },
  S3E: {
    init(ctx) {
      const s = ctx.stage, L = ctx.long;
      this.bs = stepRow(ctx, s, L ? 330 : 380);
      this.q = big(s, L ? 90 : 120, '그럼 인공지능은<br><span class="kc">어떤 과정으로 배울까?</span>', L ? 64 : 60);
      this.t = { q: 0 };
    },
    frame(ctx, t) { show(this.q, E.prog(t, 0, .4), 20); this.bs.forEach((b, i) => { b.style.opacity = .18 + .22 * E.prog(t, .3 + i * .1, .3); b.classList.add('dim'); }); },
  },
});
