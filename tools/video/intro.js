// 공통 인트로: "안녕하세요, 눈바공 연구소 바닥 연구소장입니다."
// 채널 전체 이름에서 눈·바·공 세 글자를 강조했다가, 세 글자가 모여 "눈바공 연구소"가 된다.
// 모든 강좌 영상에서 같은 장면을 쓴다(장면표에서 이 장면 이름을 INTRO로 연결).
const INTRO = {
  init(ctx) {
    const L = ctx.long, s = ctx.stage;
    const full = L ? '눈높이가 바닥에 있는 공학 연구소' : '눈높이가 바닥에 있는|공학 연구소';
    const keyIdx = { '눈': 0, '바': 0, '공': 0 };
    this.wrap = el('div', { class: 'abs center intro-full', style: { left: 0, width: '100%', top: (L ? 250 : 330) + 'px', fontSize: (L ? 92 : 84) + 'px' } }, s);
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
    this.target = el('div', { class: 'abs center intro-target noqa', style: { left: 0, width: '100%', top: (L ? 230 : 380) + 'px', fontSize: (L ? 170 : 150) + 'px' } }, s);
    this.target.innerHTML = '<span class="k">눈</span><span class="k">바</span><span class="k">공</span><span class="lab"> 연구소</span>';
    this.lab = this.target.querySelector('.lab');
    const tk = [...this.target.querySelectorAll('.k')];
    const sr = s.getBoundingClientRect();
    this.move = this.keys.map((k, i) => {
      const a = k.getBoundingClientRect(), b = tk[i].getBoundingClientRect();
      return { dx: (b.left + b.width / 2) - (a.left + a.width / 2), dy: (b.top + b.height / 2) - (a.top + a.height / 2), sc: b.height / a.height };
    });
    tk.forEach(n => n.style.visibility = 'hidden');
    this.role = el('div', { class: 'abs center', style: { left: 0, width: '100%', top: (L ? 520 : 700) + 'px' } }, s);
    this.role.innerHTML = `<span class="intro-role">바닥 연구소장</span>`;
    this.floor = el('div', { class: 'abs intro-floor', style: { left: (ctx.W / 2 - (L ? 520 : 420)) + 'px', width: (L ? 1040 : 840) + 'px', top: (L ? 680 : 860) + 'px' } }, s);
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
