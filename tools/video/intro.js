// 쇼츠 위치는 쇼츠 배치 2판(무대 860×680) 기준(2026-11-06)
// 공통 인트로: "안녕하세요, 눈바공 연구소 바닥 연구소장입니다."
// 채널 전체 이름에서 눈·바·공 세 글자를 강조했다가, 세 글자가 모여 "눈바공 연구소"가 된다.
// 모든 강좌 영상에서 같은 장면을 쓴다(장면표에서 이 장면 이름을 INTRO로 연결).
const INTRO = {
  init(ctx) {
    const L = ctx.long, s = ctx.stage;
    const full = L ? '눈높이가 바닥에 있는 공학 연구소' : '눈높이가 바닥에 있는|공학 연구소';
    const keyIdx = { '눈': 0, '바': 0, '공': 0 };
    this.wrap = el('div', { class: 'abs center intro-full', style: { left: 0, width: '100%', top: (L ? 250 : 60) + 'px', fontSize: (L ? 92 : 76) + 'px' } }, s);
    this.keys = [];
    this.rest = [];
    for (const line of full.split('|')) {
      const row = el('div', { class: 'intro-row' }, this.wrap);
      for (const ch of line) {
        const sp = el('span', { class: 'intro-ch', text: ch === ' ' ? ' ' : ch }, row);
        if (ch in keyIdx && keyIdx[ch]++ === 0) { sp.classList.add('key'); this.keys.push(sp); }
        else this.rest.push(sp);
      }
    }
    // 모였을 때의 "눈바공 연구소" 자리(보이지 않는 글자로 자리만 잡음)
    this.target = el('div', { class: 'abs center intro-target noqa', style: { left: 0, width: '100%', top: (L ? 230 : 90) + 'px', fontSize: (L ? 170 : 130) + 'px' } }, s);
    this.target.innerHTML = '<span class="k">눈</span><span class="k">바</span><span class="k">공</span><span class="lab"> 연구소</span>';
    this.lab = this.target.querySelector('.lab');
    const tk = [...this.target.querySelectorAll('.k')];
    const sr = s.getBoundingClientRect();
    this.move = this.keys.map((k, i) => {
      const a = k.getBoundingClientRect(), b = tk[i].getBoundingClientRect();
      return { dx: (b.left + b.width / 2) - (a.left + a.width / 2), dy: (b.top + b.height / 2) - (a.top + a.height / 2), sc: b.height / a.height };
    });
    tk.forEach(n => n.style.visibility = 'hidden');
    this.role = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 520 : 340) + 'px' } }, s);
    this.role.innerHTML = `<span class="intro-role">바닥 연구소장</span>`;
    this.floor = el('div', { class: 'abs intro-floor', style: { left: (ctx.W / 2 - (L ? 520 : 380)) + 'px', width: (L ? 1040 : 760) + 'px', top: (L ? 680 : 500) + 'px' } }, s);
    this.t = { join: ctx.at('눈바공', 1, 1.2) - .25, role: ctx.at('바닥', 1, 2.2) - .1 };
  },
  frame(ctx, t) {
    show(this.wrap, E.prog(t, 0, .3), 20);
    const hi = E.prog(t, .15, .35);                       // 세 글자 강조
    this.keys.forEach(k => k.style.setProperty('--hi', hi));
    const j = E.ease(E.prog(t, this.t.join, .7));        // 세 글자가 모임
    this.rest.forEach(n => n.style.opacity = 1 - E.clamp(j * 1.6));
    this.keys.forEach((k, i) => {
      const m = this.move[i];
      k.style.transform = `translate(${m.dx * j}px, ${m.dy * j}px) scale(${E.lerp(1, m.sc, j)})`;
    });
    this.lab.style.opacity = E.prog(t, this.t.join + .45, .4);
    pop(this.role, E.prog(t, this.t.role, .45), .7);
    this.floor.style.transform = `scaleX(${E.ease(E.prog(t, .2, .8))})`;
  },
};

// 공통 마무리 인사: "지금까지 눈바공 연구소 바닥 연구소장이었습니다. … 구독과 좋아요 … 다음 영상에서 만나요."
// 모든 강좌 영상 끝에 같은 장면을 쓴다(장면표에서 이 장면 이름을 OUTRO로 연결).
const OUTRO = {
  init(ctx) {
    const L = ctx.long, s = ctx.stage;
    this.logo = el('div', { class: 'abs center intro-target', style: { left: 0, width: '100%', top: (L ? 90 : 30) + 'px', fontSize: (L ? 150 : 120) + 'px' } }, s);
    this.logo.innerHTML = '눈바공<span class="lab"> 연구소</span>';
    this.role = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 300 : 220) + 'px' } }, s);
    this.role.innerHTML = '<span class="intro-role">바닥 연구소장</span>';
    this.btns = el('div', { class: 'abs center outro-btns', style: { left: 0, width: '100%', top: (L ? 480 : 370) + 'px' } }, s);
    this.btns.innerHTML = '<span class="ob sub"><svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0z" fill="currentColor"/></svg>구독</span>'
      + '<span class="ob like"><svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M2 10h4v11H2zm6 11h9.5a2 2 0 0 0 2-1.6l1.4-7A2 2 0 0 0 19 10h-5.5l.8-4a2 2 0 0 0-3.6-1.4L8 9z" fill="currentColor"/></svg>좋아요</span>';
    [this.sub, this.like] = this.btns.querySelectorAll('.ob');
    this.bye = el('div', { class: 'abs center outro-bye', style: { left: 0, width: '100%', top: (L ? 700 : 540) + 'px', fontSize: (L ? 64 : 58) + 'px' } }, s);
    this.bye.textContent = '다음 영상에서 만나요';
    this.t = { logo: ctx.at('눈바공', 1, .6) - .1, role: ctx.at('바닥', 1, 1.4) - .1, sub: ctx.w('구독과') - .1, like: ctx.w('좋아요') - .1,
      ask: ctx.w('부탁드려요') - .1, bye: ctx.w('다음') - .1 };
  },
  frame(ctx, t) {
    pop(this.logo, E.prog(t, Math.min(0, this.t.logo), .45), .8);
    pop(this.role, E.prog(t, this.t.role, .45), .7);
    pop(this.sub, E.prog(t, this.t.sub, .4), .6);
    pop(this.like, E.prog(t, this.t.like, .4), .6);
    const press = E.prog(t, this.t.ask, .5);              // 부탁할 때 두 버튼이 한 번 눌림
    const k = 1 - .12 * Math.sin(Math.PI * press);
    if (press > 0 && press < 1) { this.sub.style.transform = `scale(${k})`; this.like.style.transform = `scale(${k})`; }
    this.sub.classList.toggle('on', press >= .5);
    show(this.bye, E.prog(t, this.t.bye, .4), 20);
  },
};
