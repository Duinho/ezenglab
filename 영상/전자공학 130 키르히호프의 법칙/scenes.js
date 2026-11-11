// 전자공학 130 키르히호프의 법칙. 전압·전류·저항 색과 장면 표시 도구는 120에서 이어받는다.
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



// 회로와 비유는 같은 좌표계를 사용하고, 장면마다 실제 읽기 단어에 맞춰 요소를 표시한다.
function canvas130(ctx, add, phrase, compact = false) {
  const width = ctx.long ? 1450 : 776;
  const height = ctx.long ? (compact ? 493 : 681) : (compact ? 355 : 529);
  const y = ctx.long ? 118 : 103;
  const svg = svgAt(ctx.stage, (ctx.W - width) / 2, y, width, height, '0 0 750 458');
  return add(svg, phrase);
}
function badge(ctx, add, text, phrase, color, row = 0, rows = 1) {
  if(!ctx.long && rows===2) {
    const wrapped=text.replace(' = ','<br>= ');
    const box=panel(ctx,add,35+row*410,552,380,90,wrapped,phrase,color,34);
    box.style.padding='0'; box.style.lineHeight='1';
    return box;
  }
  const h = ctx.long ? 131 : 72;
  const bottom = ctx.long ? 866 : 637;
  const size = ctx.long ? (text.length <= 18 ? 96 : 57) : (text.length <= 18 ? 49 : 38);
  return centered(ctx, add, bottom - rows * h - (rows - row - 1) * 9 + row * h,
    ctx.long ? 1440 : 776, h - 8, text, phrase, color, size);
}
function stack130(ctx, add, entries) {
  const step = ctx.long ? Math.min(205, 696 / entries.length) : Math.min(157, 524 / entries.length);
  const x = ctx.long ? 200 : 42;
  const first = (ctx.H - entries.length * step) / 2 + 31;
  entries.forEach(([text, phrase, color], i) => panel(ctx, add, x, first + i * step, ctx.W - 2*x,
    step - 14, text, phrase, color, ctx.long ? (text.length <= 24 ? 96 : 60) : (text.length <= 24 ? 50 : 38))
    .classList.add('kir-key-card'));
}
function g130(parent, x, y, scale = 1) {
  return el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + scale + ')' }, parent);
}
function box130(svg, x, y, width, height, color, fill = '#fff') {
  return el('rect', { x, y, width, height, rx: 18, fill, stroke: color, 'stroke-width': 6 }, svg);
}
function resistor(svg, x, y, vertical = false) {
  const g = el('g', {transform: 'translate(' + x + ' ' + y + ')' + (vertical ? ' rotate(90)' : '')}, svg);
  zig(g, -47, 0, 94, RC, 8);
  return g;
}
function battery130(svg, x, y, label) {
  path(svg,'M'+x+' '+(y-65)+' V'+(y-18)+' M'+(x-33)+' '+(y-18)+' H'+(x+33)
    +' M'+(x-20)+' '+(y+18)+' H'+(x+20)+' M'+x+' '+(y+18)+' V'+(y+65),COLOR.ink,8);
  path(svg,'M'+(x+55)+' '+(y-38)+' h22 m-11 -11 v22 M'+(x+55)+' '+(y+38)+' h22',VC,5);
  svgText(svg,x-95,y+12,label,40,VC);
}
function dotFlow(ctx, svg, updates, coords, phrase, count=4) {
  const [x0,y0,x1,y1] = coords;
  const start = phrase ? cue(ctx, phrase) : 0;
  const dots=Array.from({length:count},()=>el('circle',{r:6,fill:IC},svg));
  updates.push(t=>dots.forEach((d,i)=>{
    const u=(i/count+Math.max(0,t-start)*.6)%1;
    d.setAttribute('cx',E.lerp(x0,x1,u)); d.setAttribute('cy',E.lerp(y0,y1,u));
    d.style.visibility=t>=start?'visible':'hidden';
  }));
}
function split130(ctx, add, updates, values, {compact=false, quiz=false}={}) {
  const svg=canvas130(ctx,add,null,compact);
  const lines=[['M55 229 H306', [75,229,288,229]],['M306 229 L485 85 H705',[505,85,687,85]],['M306 229 L485 370 H705',[505,370,687,370]]];
  lines.forEach(([d,coords],i)=>{
    path(svg,d,'#dce6e1',27);
    const [label, phrase]=values[i];
    add(svgText(svg,i ? 588 : 173,i===1 ? 47 : i===2 ? 430 : 181,label,48,IC),phrase);
    dotFlow(ctx,svg,updates,coords,phrase,i===0?5:3);
  });
  el('circle',{cx:306,cy:229,r:20,fill:'#fff',stroke:COLOR.teal,'stroke-width':8},svg);
  if(quiz) {
    if(ctx.long) {
      svg.style.width='1260px'; svg.style.left='110px';
      updates.push(countdown(ctx,ctx.stage,1610,420,122));
    } else {
      svg.style.width='776px'; svg.style.left='42px';
      updates.push(countdown(ctx,ctx.stage,750,315,82));
    }
  }
  return svg;
}
function branch130(ctx, add, updates, opts={}) {
  const {mode='current',source='6V',resistances=['1킬로옴','1.5킬로옴'],led=false}=opts;
  const width=ctx.long?1450:800, height=ctx.long?(opts.doubleBadges?535:625):482;
  const svg=svgAt(ctx.stage,(ctx.W-width)/2,ctx.long?(opts.doubleBadges?65:110):75,width,height,'0 0 750 458');
  add(svg,opts.begin);
  const top=70,bottom=440,center=255,sourceX=140;
  path(svg,'M'+sourceX+' '+top+' H670 M'+sourceX+' '+bottom+' H670 M'+sourceX+' '+top
    +' V'+(center-65)+' M'+sourceX+' '+(center+65)+' V'+bottom,COLOR.ink,8);
  battery130(svg,sourceX,center,source);
  for(const [i,x] of [335,610].entries()) {
    const branch=g130(svg,0,0);
    path(branch,'M'+x+' '+top+' V177 M'+x+' 271 V'+bottom,COLOR.ink,8);
    resistor(branch,x,224,true);
    svgText(branch,x,ctx.long?35:48,resistances[i],36,RC);
    for(const y of [top,bottom]) el('circle',{cx:x,cy:y,r:10,fill:COLOR.teal},branch);
    if(led) {
      path(branch,'M'+(x-15)+' 305 h30 l-15 27 Z',VC,4,VC);
      path(branch,'M'+(x-18)+' 335 h36',VC,4);
    }
    add(branch,mode==='voltage'?'나란히':null);
    if(mode==='voltage') add(svgText(svg,x+87,255,'6V',40,VC),'같은 육 볼트가');
    if(mode==='current') {
      const phrase=i?'사 밀리암페어':'육 밀리암페어';
      add(svgText(svg,x+87,255,i?'4mA':'6mA',40,IC),phrase);
      dotFlow(ctx,svg,updates,[x,100,x,168],phrase,3);
    }
    if(mode==='arduino') {
      add(svgText(svg,472,i?390:180,'약 13.6mA',36,IC),'십삼 점 육');
      dotFlow(ctx,svg,updates,[x,100,x,168],'십삼 점 육',3);
    }
  }
  if(mode==='current') {
    add(svgText(svg,237,145,'10mA',40,IC),'십 밀리암페어가');
    add(svgText(svg,237,388,'10mA',40,IC),'다시 만나는');
  }
  if(mode==='arduino') add(svgText(svg,237,388,'약 27.2mA',28,IC),'이십칠 점 이');
  return svg;
}
function loop130(ctx, add, updates, opts={}) {
  const {voltage='9V',r1='1킬로옴',r2='2킬로옴',phrase,labels=[],led=false,single=false,side=false}=opts;
  const width=ctx.long?(side?1050:1450):800;
  const height=ctx.long?(opts.doubleBadges?535:625):475;
  const top=ctx.long&&opts.doubleBadges?50:70;
  const svg=svgAt(ctx.stage,side&&ctx.long?135:(ctx.W-width)/2,ctx.long?(opts.doubleBadges?70:110):(opts.doubleBadges?75:90),width,height,'0 0 750 458');
  add(svg,phrase);
  path(svg,'M140 '+top+' H311 M405 '+top+' H550 V203 M550 297 V440 H140 V320 M140 190 V'+top,COLOR.ink,8);
  battery130(svg,140,255,voltage);
  resistor(svg,358,top);
  if(led) {
    path(svg,'M527 225 H573 L550 275 Z',VC,5,VC);
    path(svg,'M524 276 H576 M550 203 V224 M550 276 V297',VC,5);
  } else if(single) path(svg,'M550 203 V297',COLOR.ink,8);
  else resistor(svg,550,250,true);
  if(r1) svgText(svg,358,opts.doubleBadges?130:30,r1,38,RC);
  if(r2) svgText(svg,660,260,r2,36,RC);
  for(const [x,y,label,color,cueWord] of labels) add(svgText(svg,x,y,label,42,color),cueWord);
  if(opts.flow) dotFlow(ctx,svg,updates,[180,440,510,440],opts.flow,7);
  return svg;
}
function profile130(ctx,add,updates,phrase,compact=false){
  const svg=canvas130(ctx,add,phrase,ctx.long?false:compact);
  const segments=[[74,345,260,80,'구 미터'],[260,80,428,169,'삼 미터와'],[428,169,660,345,'육 미터']];
  path(svg,'M57 345 H690',COLOR.line,5);
  path(svg,'M71 344 V269 L117 283 L71 299',COLOR.green,6);
  const labels=[[116,157,'+9m',VC],[359,58,'−3m',IC],[593,207,'−6m',IC]];
  segments.forEach(([x,y,x1,y1,key],i)=>{
    const g=el('g',{},svg);
    path(g,'M'+x+' '+y+' L'+x1+' '+y1,labels[i][3],13);
    add(g,key); add(svgText(svg,labels[i][0],labels[i][1],labels[i][2],43,labels[i][3]),key);
    dotFlow(ctx,svg,updates,[x,y,x1,y1],key,1);
  });
  return svg;
}
function remote130(ctx,add,updates,flip,compact=false){
  const svg=canvas130(ctx,add,null,compact);
  box130(svg,150,38,434,360,COLOR.sub,'#e8eef3');
  box130(svg,205,125,320,211,COLOR.line,'#fff');
  const cells=[225,365].map((x,i)=>{
    const g=g130(svg,x,170);
    box130(g,0,0,130,99,VC,'#f9dfe4');
    svgText(g,65,62,i?'−   +':'+   −',37,VC);
    return g;
  });
  const lamp=el('circle',{cx:371,cy:78,r:16,fill:COLOR.green},svg);
  const start=cue(ctx,flip);
  updates.push(t=>{
    cells[1].setAttribute('transform','translate(365 170) rotate('+(180*E.ease(E.prog(t,start,.55)))+' 65 50)');
    lamp.setAttribute('fill',t>=start+.55?'#b2bdc7':COLOR.green);
  });
  return svg;
}
function outlets130(ctx,add,updates,opts={}){
  const svg=canvas130(ctx,add,opts.start,opts.compact);
  path(svg,'M72 100 H677 M72 349 H677',COLOR.ink,9);
  for(const [i,x] of [169,375,581].entries()){
    path(svg,'M'+x+' 100 V349',IC,7);
    box130(svg,x-62,178,124,95,IC,'#f3f8ff');
    path(svg,'M'+(x-18)+' 207 v31 m36 -31 v31',COLOR.sub,8);
    if(opts.labels) add(svgText(svg,x+72,151,'같은 전압',30,VC),opts.labels);
    if(opts.names) add(svgText(svg,x,416,opts.names[i],34),opts.start);
  }
  return svg;
}
function comparison130(ctx,add,withLabels=true) {

  if(!ctx.long) {
    ['직렬','병렬'].forEach((name,i)=>{
      const x=50+i*410;
      const label=panel(ctx,add,x,90,350,64,name,name,i?IC:VC,43);
      label.style.padding='0';
      const svg=svgAt(ctx.stage,x,160,350,408,'0 0 300 350');
      add(svg,name);
      if(i) {
        path(svg,'M30 5 H270 M30 345 H270 M30 5 V128 M30 222 V345 M270 5 V128 M270 222 V345',COLOR.ink,10);
        resistor(svg,30,175,true); resistor(svg,270,175,true);
      } else {
        path(svg,'M30 5 H270 V58 M270 152 V198 M270 292 V345 H30 V5',COLOR.ink,10);
        resistor(svg,270,105,true); resistor(svg,270,245,true);
      }
      if(withLabels) {
        const first=i?'전압 같음':'전류 같음';
        const second=i?['전류 나눠','흐름']:['전압 나눠','가짐'];
        add(svgText(svg,150,135,first,30,i?IC:VC),i?'전압이 같아요':'전류가 같아요');
        second.forEach((text,row)=>add(svgText(svg,150,215+row*45,text,30,i?IC:VC),i?'나눠 흘러요':'나눠 가져요'));
      }
    });
    return;
  }
  const top=ctx.long?145:123, h=ctx.long?330:225;
  const widths=ctx.long?[740,740]:[766,766];
  const names=['직렬','병렬'];
  const parts=[['전류 같음','전압 나눠 가짐'],['전압 같음','전류 나눠 흐름']];
  names.forEach((name,i)=>{
    const x=ctx.long?205+i*775:47,y=ctx.long?top:top+i*247;
    const w=widths[i], key=i?'병렬':'직렬';
    panel(ctx,add,x,y,w,ctx.long?75:58,name,key,i?IC:VC,ctx.long?54:43);
    const sv=svgAt(ctx.stage,x+80,y+(ctx.long?87:64),w-160,ctx.long?215:115,'0 0 600 205');
    add(sv,key);
    path(sv,i?'M92 45 H515 V72 M515 166 H92 V45':'M92 45 H253 M347 45 H515 V59 M515 153 V164 H92 V45',COLOR.ink,7);
    if(i){
      path(sv,'M295 45 V72',COLOR.ink,7);
      resistor(sv,295,119,true); resistor(sv,515,119,true);
    }else{
      resistor(sv,300,45); resistor(sv,515,106,true);
    }
    if(!withLabels) return;
    if(ctx.long){
      const ps=i?['전압이 같아요','나눠 흘러요']:['전류가 같아요','나눠 가져요'];
      parts[i].forEach((v,j)=>panel(ctx,add,x,y+h+35+j*120,w,94,v,ps[j],(i+j)%2?VC:IC,49));
    }else{
      const ps=i?['전압이 같아요','나눠 흘러요']:['전류가 같아요','나눠 가져요'];
      parts[i].forEach((v,j)=>panel(ctx,add,x+14+j*382,y+h-34,356,50,v,ps[j],(i+j)%2?VC:IC,34));
    }
  });
}
function rulePair130(ctx, add, opts) {
  opts.forEach(([heading, note, phrase, color, fork], i) => {
    const x = 177 + i * 798;
    panel(ctx,add,x,153,770,105,heading,phrase,color,60);
    const svg=svgAt(ctx.stage,x+88,280,594,389,'0 0 560 355');
    add(svg,phrase);
    if(fork){
      path(svg,'M46 178 H244 M244 178 L367 77 H515 M244 178 L367 280 H515',color,24);
      el('circle',{cx:244,cy:178,r:23,fill:'#fff',stroke:COLOR.teal,'stroke-width':7},svg);
    }else{
      path(svg,'M72 72 H221 M315 72 H491 V285 H72 V72',color,16);
      resistor(svg,268,72);
      const motion=arrow(svg,190,285,359,285,IC,9);
      motion(1);
    }
    panel(ctx,add,x,704,770,114,note,phrase,color,44);
  });
}
function riseFall130(ctx, add) {
  const x=ctx.long?1288:290;
  const y=ctx.long?267:335;
  const svg=svgAt(ctx.stage,x,y,ctx.long?390:290,ctx.long?275:190,'0 0 375 236');
  add(svg,'동네 한 바퀴');
  path(svg,'M31 185 H346',COLOR.line,5);
  path(svg,'M41 181 L122 58 L215 100 L328 181',IC,8);
  svgText(svg,35,55,'+9',ctx.long?43:48,VC);
  svgText(svg,184,47,'−3',ctx.long?43:48,IC);
  svgText(svg,309,121,'−6',ctx.long?43:48,IC);
}
function warning130(svg, add, phrase) {
  const outer=el('g',{},svg);
  const g=g130(outer,700,240);
  path(g,'M0 -24 L23 16 H-23 Z',RC,5,'#fce1c5');
  path(g,'M0 -10 V4 M0 10 V11',COLOR.ink,5);
  return add(outer,phrase);
}
function currentMeters130(ctx,add,updates) {
  const svg=canvas130(ctx,add,null,false);
  path(svg,'M70 230 H680',COLOR.ink,9);
  path(svg,'M351 201 L397 230 L351 259 Z',VC,5,VC);
  path(svg,'M397 199 V261',VC,7);
  for(const [i,x] of [193,553].entries()){
    const gauge=meter(svg,x,230,94,'A',IC);
    gauge.querySelector('circle').setAttribute('fill','#cfe3fa');
    svgText(svg,x,100,i?'나온 전류':'들어간 전류',37,IC);
    add(svgText(svg,x,410,'13.6mA',72,IC),'하지만');
  }
  const q=add(svgText(svg,553,410,'줄어든다?',56,COLOR.sub),'줄어든다고');
  const answer=cue(ctx,'하지만');
  updates.push(t=>{q.style.visibility=t<answer?'visible':'hidden';});
}
function capacity130(ctx,add) {
  const charger=svgAt(ctx.stage,265,172,430,430,'0 0 400 400');
  add(charger);
  box130(charger,45,75,300,235,IC,'#e4edf8');
  path(charger,'M140 25 V74 M254 25 V74 M198 310 V372',COLOR.ink,12);
  svgText(charger,196,210,'9V 1A',66,VC);
  panel(ctx,add,205,658,540,120,'1A = 최대치','줄 수 있다는',IC,62);
  const lift=svgAt(ctx.stage,1080,135,590,630,'0 0 510 525');
  add(lift,'엘리베이터에');
  box130(lift,61,61,389,424,COLOR.sub,'#e5ecef');
  path(lift,'M255 145 V480',COLOR.line,6);
  svgText(lift,255,123,'정원 15명',48);
  const riders=g130(lift,0,0);
  for(const x of [144,255,366]){
    el('circle',{cx:x,cy:264,r:25,fill:IC},riders);
    path(riders,'M'+(x-34)+' 382 Q'+(x-34)+' 299 '+x+' 299 Q'+(x+34)+' 299 '+(x+34)+' 382 Z',IC,4,IC);
  }
  add(riders,'세 명이');
}
const SCENES={
  L01: scene((c,a,u)=>{
    const heading=title(c,a,'여는 질문');
    const headingAt=cue(c,'키르히호프');
    u.push(t=>{heading.textContent=t<headingAt?'여는 질문':'키르히호프의 법칙';});
    loop130(c,a,u,{voltage:'',r1:'',r2:'',doubleBadges:true,compact:true,single:true,phrase:'부품 하나'});
    const branch=branch130(c,a,u,{source:'',resistances:['',''],doubleBadges:true,compact:true,mode:'diagram',begin:'늘어나면'});
    const change=cue(c,'늘어나면');
    const prior=branch.previousElementSibling;
    u.push(t=>{prior.style.visibility=t<change?'visible':'hidden';});
    badge(c,a,'V = I × R　→　?', '나뉠까요', COLOR.green,0,2);
    badge(c,a,'갈림길　·　한 바퀴','두 가지 규칙',IC,1,2);
  }),
  L02:INTRO,
  L03:scene((c,a,u)=>{const heading=title(c,a,'한 줄로 먼저');const at=cue(c,'키르히호프의 법칙');u.push(t=>{heading.textContent=t<at?'한 줄로 먼저':'키르히호프의 법칙';});rulePair130(c,a,[['전류 법칙','들어온 전류 = 나간 전류','전류 법칙',IC,true],['전압 법칙','올라간 전압 = 내려간 전압','전압 법칙',VC,false]]);}),
  L04:scene((c,a)=>{title(c,a,'부품 하나와 회로 전체');rulePair130(c,a,[['옴의 법칙','부품 하나','부품 하나에서',RC,false],['키르히호프의 법칙','회로 전체','회로 전체에서',IC,true]]);}),
  L05:scene((c,a,u)=>{title(c,a,'자전거 갈림길');split130(c,a,u,[['10대','열 대가'],['6대','여섯 대가'],['? 대','몇 대가']],{quiz:true});}),
  L06:scene((c,a,u)=>{title(c,a,'갈림길 정답');split130(c,a,u,[['10대'],['6대'],['4대','네 대예요']],{compact:true});badge(c,a,'10 = 6 + 4','더한 값과',IC);}),
  L07:scene((c,a,u)=>{title(c,a,'동네 한 바퀴');profile130(c,a,u,null,true);badge(c,a,'+9 = 3 + 6','같아야 해요',VC);}),
  L08:scene((c,a)=>{title(c,a,'두 예시의 규칙');stack130(c,a,[['1　들어온 양 = 나간 양의 합','첫째',IC],['2　올라간 높이 = 내려간 높이','둘째',VC],['올라간 전압 = 내려간 전압','전압으로 바꿔',VC]]);}),
  L09:scene((c,a,u)=>{title(c,a,'갈림길은 전류로');branch130(c,a,u,{mode:'voltage',begin:'전원에'});}),
  L10:scene((c,a,u)=>{title(c,a,'나뉘고 합쳐지는 전류');branch130(c,a,u,{mode:'current',compact:true});badge(c,a,'10 = 6 + 4','자전거',IC);}),
  L11:scene((c,a,u)=>{title(c,a,'한 바퀴는 전압으로');loop130(c,a,u,{doubleBadges:true,compact:true,phrase:'한 줄로',flow:'같은 전류가',labels:[[375,324,'3mA',IC,'삼 밀리암페어']]});badge(c,a,'1킬로옴 + 2킬로옴 = 3킬로옴','삼 킬로옴이고',RC,0,2);badge(c,a,'9V ÷ 3,000옴 = 3mA','삼 밀리암페어',IC,1,2);}),
  L12:scene((c,a,u)=>{title(c,a,'올라간 만큼 내려가요');loop130(c,a,u,{compact:true,side:true,labels:[[359,151,'3V',VC,'삼 볼트'],[660,340,'6V',VC,'육 볼트가 걸려요'],[174,125,'↑',VC,'올라가고']]});riseFall130(c,a);badge(c,a,'3V + 6V = 9V','삼 더하기 육은 구',VC);}),
  L13:scene((c,a)=>{title(c,a,'키르히호프의 두 법칙');stack130(c,a,[['구스타프 키르히호프 · 독일 물리학자 · 1845','키르히호프가',COLOR.green],['전류 법칙　KCL','케이 씨 엘',IC],['전압 법칙　KVL','케이 브이 엘',VC]]);}),
  L14:scene((c,a)=>{title(c,a,'교과서 표현');stack130(c,a,[['갈림점　+10 − 6 − 4 = 0','한 점에',IC],['한 바퀴　+9 − 3 − 6 = 0','한 바퀴 돌며',VC]]);}),
  L15:scene((c,a)=>{title(c,a,'직렬과 병렬');comparison130(c,a);}),
  L16:scene((c,a,u)=>{title(c,a,'LED 한 개 검산');loop130(c,a,u,{voltage:'5V',r1:'220옴',r2:'LED',doubleBadges:true,compact:true,led:true,phrase:'연결했어요',flow:'한 바퀴',labels:[[358,210,'3V',VC,'삼 볼트'],[660,340,'약 2V',VC,'이 볼트']]});badge(c,a,'2V + 3V = 5V','이 더하기 삼은 오',VC,0,2);badge(c,a,'전압 법칙','전압 법칙',VC,1,2);}),
  L17:scene((c,a,u)=>{title(c,a,'LED 두 개를 나란히');branch130(c,a,u,{mode:'arduino',source:'5V',resistances:['220옴','220옴'],compact:true,led:true,begin:'두 갈래로'});badge(c,a,'전류 법칙','이십칠 점 이',IC);}),
  L18:scene((c,a,u)=>{title(c,a,'리모컨 건전지');remote130(c,a,u,'거꾸로',true);const result=badge(c,a,'+1.5V + 1.5V = 3V','삼 볼트가',VC);const flip=cue(c,'남는 전압이 없어요');u.push(t=>{result.firstChild.textContent=t<flip?'+1.5V + 1.5V = 3V':'+1.5V − 1.5V = 0V';});}),
  L19:scene((c,a,u)=>{title(c,a,'멀티탭 최대 용량');const svg=outlets130(c,a,u,{start:'여러 개',compact:true,names:['히터','전기포트','']});dotFlow(c,svg,u,[172,346,640,346],'합쳐져',7);warning130(svg,a,'히터나');badge(c,a,'최대 용량','최대 전류나',RC);}),
  L20:scene((c,a,u)=>{title(c,a,'드라이어를 꺼도 냉장고는 돌아가요');outlets130(c,a,u,{start:'같은 두 전선에',labels:'같은 전압이',names:['드라이어','냉장고','전등'],compact:true});badge(c,a,'직렬이라면?','직렬로',RC);}),
  L21:scene((c,a,u)=>{title(c,a,'전류는 줄어들지 않아요');currentMeters130(c,a,u);}),
  L22:scene((c,a,u)=>{
    title(c,a,'트럭과 짐');const svg=canvas130(c,a,null,true);
    path(svg,'M120 95 H634 V342 H120 Z',COLOR.line,18);
    const trucks=Array.from({length:4},(_,i)=>{
      const g=g130(svg,0,0);box130(g,0,0,78,44,IC,'#e7f1ff');box130(g,77,13,37,31,IC,'#e7f1ff');
      const load=box130(g,8,7,62,28,VC,'#f4a6a8');
      for(const x of [22,95])el('circle',{cx:x,cy:48,r:9,fill:COLOR.ink},g);
      return {g,load};
    });
    const start=cue(c,'실어 보내면'), drop=cue(c,'내려놓고');
    u.push(t=>trucks.forEach(({g,load},i)=>{
      const x=(i/4+t*.33)%1;
      const pos=x<.5?[120+x*850,74]:[545-(x-.5)*850,320];
      g.setAttribute('transform','translate('+pos.join(' ')+')');load.style.visibility=t>=start && (x<.5||t<drop)?'visible':'hidden';
    }));
    badge(c,a,'트럭 수 = 전류(그대로)','트럭 수가 전류',IC,0,2);
    badge(c,a,'짐 = 전압(내려감)','짐이 전압',VC,1,2);
  }),
  L23:scene((c,a)=>{title(c,a,'어댑터의 A는 최대치');capacity130(c,a);}),
  L24:scene((c,a,u)=>{title(c,a,'전압이 바뀌면 다시 계산');const svg=loop130(c,a,u,{voltage:'5V',r1:'220옴',r2:'LED',doubleBadges:true,compact:true,led:true,phrase:'오 볼트에'});const node=svg.querySelector('text');const t0=cue(c,'구 볼트 어댑터에');u.push(t=>{node.textContent=t<t0?'5V':'9V';});badge(c,a,'(9V − 2V) ÷ 220옴 ≈ 31.8mA','삼십일 점 팔',VC,0,2);badge(c,a,'최대 20mA 넘음','최대치를 넘어요',VC,1,2);}),
  L25:scene((c,a)=>{title(c,a,'비유는 감 잡기용');const svg=svgAt(c.stage,160,120,1550,600,'0 0 1100 500');a(svg,'그림이에요');const bike=bicycle(svg,20,40,false);bike.setAttribute('transform','translate(20 40) scale(2.1)');const truck=g130(svg,620,125,2.5);box130(truck,0,0,105,72,IC,'#cfe3fa');box130(truck,104,24,50,48,IC);for(const x of [27,123])el('circle',{cx:x,cy:78,r:12,fill:IC},truck);badge(c,a,'V = I × R　·　KCL　·　KVL','정확한 값은',COLOR.green);}),
  L26:scene((c,a)=>{title(c,a,'한눈에 정리');stack130(c,a,[['전류 법칙 KCL · 들어온 전류 = 나간 전류의 합','전류 법칙은',IC],['전압 법칙 KVL · 올라간 전압 = 내려간 전압의 합','전압 법칙은',VC],['직렬 · 전류 같음, 전압 나눔','직렬은',RC],['병렬 · 전압 같음, 전류 나눔','병렬은',IC]]);}),
  L27:scene((c,a,u)=>{title(c,a,'퀴즈');split130(c,a,u,[['20mA','이십 밀리암페어'],['12mA','십이 밀리암페어'],['? mA','몇 밀리암페어']],{quiz:true});}),
  L27B:scene((c,a,u)=>{title(c,a,'퀴즈 정답');split130(c,a,u,[['20mA'],['12mA'],['8mA','팔 밀리암페어']],{compact:true});badge(c,a,'20 = 12 + 8','이십은',IC);}),
  L28:scene((c,a,u)=>{title(c,a,'키르히호프의 법칙');loop130(c,a,u,{voltage:'',r1:'? V',r2:'? V',doubleBadges:true,compact:true,phrase:'나눠 가질까요'});badge(c,a,'블로그 글 · 설명란 링크','블로그',COLOR.green,0,2);badge(c,a,'다음 영상 · 전압 분배','전압 분배',IC,1,2);}),
  L29:OUTRO,
  S1E:scene((c,a,u)=>{title(c,a,'전류는 어떻게 될까요?');loop130(c,a,u,{voltage:'',r1:'',r2:'',compact:true});badge(c,a,'? mA','전류는',IC);}),
  S2A:scene((c,a,u)=>{title(c,a,'전압 = 높이 차이','높이 차이와');const svg=canvas130(c,a);svg.style.height='540px';path(svg,'M83 347 H665 M100 346 L292 50 L570 347 Z',RC,7,'#fae9d9');badge(c,a,'회로 한 바퀴　·　동네 한 바퀴','동네를',VC);}),
  S2E:scene((c,a,u)=>{title(c,a,'리모컨은 왜 안 켜질까요?');remote130(c,a,u,'거꾸로',true);badge(c,a,'?','왜 안 켜질까요',VC);}),
  S3A:scene((c,a)=>{title(c,a,'저항을 잇는 두 가지 방법');comparison130(c,a,false);}),
  S3E:scene((c,a,u)=>{title(c,a,'집 안 콘센트');outlets130(c,a,u,{start:'콘센트는',compact:true});badge(c,a,'직렬?　병렬?','직렬일까요',IC);}),
};
