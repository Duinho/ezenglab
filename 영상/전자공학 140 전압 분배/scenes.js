// 전자공학 140 전압 분배. 전압·전류·저항 색과 공통 카드 배치는 전자공학 130에서 이어받는다.
const VC = COLOR.red, IC = COLOR.blue, RC = COLOR.orange;
const OM = `<svg viewBox="0 0 100 100" style="height:.74em;width:.74em;vertical-align:-.02em;overflow:visible"><path d="M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92" fill="none" stroke="currentColor" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
function svgGlyph(svg, kind, cx, cy, size, color) {          // SVG 안에 Ω 그리기
  const k = size / 100, g = el('g', { transform: `translate(${cx - size / 2} ${cy - size / 2}) scale(${k})` }, svg);
  if (kind === 'Ω') el('path', { d: 'M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92', fill: 'none', stroke: color, 'stroke-width': 13, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  return g;
}

// 팀장님 2026-11-12·11-14: 저항 단위는 화면에서 무조건 기호로. 킬로옴 → K + Ω 도형, 숫자 뒤 옴 → Ω 도형.
// 「옴의 법칙」처럼 이름으로 쓰인 옴은 그대로 둔다. 음성은 바꾸지 않는다. 롱폼·쇼츠 모두 적용.
const OHM_SPLIT = /(킬로옴|(?<=[0-9?]\s?)옴)/;
function ohmNotation(ctx, updates) {
  const symbol = OM.replace('<svg ', '<svg data-ohm-unit="Ω" aria-label="옴" ');
  const walker = document.createTreeWalker(ctx.stage, NodeFilter.SHOW_TEXT);
  const htmlTexts = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement.closest('svg') && OHM_SPLIT.test(node.textContent)) htmlTexts.push(node);
  }
  for (const node of htmlTexts) {
    const fragment = document.createDocumentFragment();
    node.textContent.split(OHM_SPLIT).forEach(part => {
      if (part === '킬로옴' || part === '옴') {
        if (part === '킬로옴') fragment.appendChild(document.createTextNode('K'));
        const template = document.createElement('template'); template.innerHTML = symbol;
        fragment.appendChild(template.content);
      } else if (part) fragment.appendChild(document.createTextNode(part));
    });
    node.replaceWith(fragment);
  }
  const labels = [...ctx.stage.querySelectorAll('svg text')];
  const centres = new Map(labels.map(node => [node, +node.getAttribute('x')]));
  // 값이 바뀌는 글자(changeText140) 뒤에 적용해 1.94킬로옴 → 2킬로옴 같은 변화도 기호로 유지한다.
  updates.push(() => {
    for (const node of labels) {
      if (node.ohmRaw === node.textContent && node.ohmGlyph) continue;
      const raw = node.textContent, m = raw.match(OHM_SPLIT);
      if (node.ohmGlyph) { node.ohmGlyph.remove(); node.ohmGlyph = null; }
      if (!m) continue;
      const before = raw.slice(0, m.index) + (m[0] === '킬로옴' ? 'K' : ''), after = raw.slice(m.index + m[0].length);
      const size = +node.getAttribute('font-size'), y = +node.getAttribute('y');
      node.setAttribute('x', centres.get(node)); node.setAttribute('text-anchor', 'middle');
      node.textContent = before; const leftWidth = before ? node.getComputedTextLength() : 0;
      node.textContent = after; const rightWidth = after ? node.getComputedTextLength() : 0;
      const gap = size * .84, x = centres.get(node) - (leftWidth + gap + rightWidth) / 2;
      node.textContent = ''; node.setAttribute('x', x); node.setAttribute('text-anchor', 'start');
      el('tspan', { text: before }, node);
      el('tspan', { text: after, dx: gap }, node);
      node.ohmGlyph = svgGlyph(node.parentNode, 'Ω', x + leftWidth + gap / 2, y - size * .37, size * .74, node.getAttribute('fill'));
      node.ohmGlyph.setAttribute('data-ohm-unit', 'Ω');
      node.ohmRaw = node.textContent;
    }
  });
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
        updates.push(t => {
          const progress=E.prog(t,start,.22);
          if(node instanceof SVGElement)node.style.opacity=E.ease(progress);
          else show(node,progress,5);
        });
        return node;
      };
      draw(ctx, add, updates);
      ohmNotation(ctx, updates);
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




function group140(parent, x, y, scale = 1) {
  return el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + scale + ')' }, parent);
}
function box140(svg, x, y, width, height, color, fill = '#fff') {
  return el('rect', { x, y, width, height, rx: 18, fill, stroke: color, 'stroke-width': 6 }, svg);
}
function resistor(svg, x, y, vertical = false) {
  const g = el('g', {transform: 'translate(' + x + ' ' + y + ')' + (vertical ? ' rotate(90)' : '')}, svg);
  zig(g, -47, 0, 94, RC, 8);
  return g;
}

const OUT_GREEN=COLOR.green;
// 단계 번호는 글자와 떨어진 동그라미 배지로(팀장님 2026-11-14: 1 2 3이 따로 보이게)
const step140=(n,color)=>'<span style="display:inline-flex;align-items:center;justify-content:center;width:1.3em;height:1.3em;border-radius:50%;background:'+color+';color:#fff;font-size:.78em;margin-right:.7em;vertical-align:.06em;flex:none">'+n+'</span>';
const vsub=(name)=>'V<sub>'+name+'</sub>';
const formula140=colored('V<sub>출력</sub>',VC)+' = '+colored('V<sub>전원</sub>',VC)+' × '+colored('R2 ÷ (R1 + R2)',RC);

function diagram140(ctx,add,phrase,{side=false,compact=false}={}){
  const w=ctx.long?(side?720:1460):774;
  const h=ctx.long?(compact?500:688):(compact?390:525);
  return add(svgAt(ctx.stage,side&&ctx.long?112:(ctx.W-w)/2,ctx.long?114:106,w,h,'0 0 750 470'),phrase);
}
function ribbon140(ctx,add,text,phrase,color,options={}){
  const {y=ctx.long?735:560,h=ctx.long?130:77,w=ctx.long?1400:776,size=ctx.long?62:42}=options;
  return centered(ctx,add,y,w,h,text,phrase,color,size);
}
function cards140(ctx,add,rows,{side=false,top}={}){
  const x=ctx.long?(side?866:206):43;
  const width=ctx.long?(side?840:1508):774;
  const step=ctx.long?Math.min(199,682/rows.length):Math.min(158,516/rows.length);
  const start=top??(ctx.long?155:115);
  for(const [i,[text,phrase,color,size]] of rows.entries()){
    const node=panel(ctx,add,x,start+i*step,width,step-12,text,phrase,color,size||(ctx.long?64:44));
    if(ctx.long) node.style.background='color-mix(in srgb, '+color+' 15%, white)';
  }
}
function graphLine(svg,d,color,width=8){return path(svg,d,color,width);}
function divider140(ctx,add,updates,opts={}){
  const {
    input='9V', upper='1킬로옴', lower='2킬로옴', result='', drops=[], split=false, sensor=false,
    side=false,compact=false,load=false,emphasis=false,outputCue,entry, ground='0V (GND)',
  }=opts;
  const svg=diagram140(ctx,add,entry,{side,compact});
  const mid=226, left=300;
  graphLine(svg,'M300 48 V'+(split?83:72)+' M300 '+(split?155:166)+' V'+(sensor?289:split?260:284)+' M300 '+(sensor?373:split?402:378)+' V435',COLOR.ink,8);
  const pole=el('circle',{cx:left,cy:48,r:10,fill:VC},svg);
  add(pole,opts.inputCue);
  const power=add(svgText(svg,384,57,input,42,VC),opts.inputCue);
  const bottom=group140(svg,0,0);
  graphLine(bottom,'M250 434 H350 M266 448 H334 M282 461 H318',COLOR.ink,6);
  svgText(bottom,462,456,ground,!ctx.long&&compact?42:35,COLOR.sub);
  add(bottom,opts.groundCue);
  const first=group140(svg,left,119);
  const topResistor=resistor(first,0,0,true);
  if(split)topResistor.setAttribute('transform','rotate(90) scale(.76 1)');
  const second=group140(svg,left,331);
  if(sensor){
    el('circle',{cx:0,cy:0,r:42,fill:'#daf2ec',stroke:COLOR.teal,'stroke-width':6},second);
    graphLine(second,'M-25 -16 L-12 -16 L-12 13 H0 V-12 H12 V14 H24',COLOR.teal,6);
  }else {
    const r=resistor(second,0,0,true);
    if(split)r.setAttribute('transform','rotate(90) scale(1.52 1)');
  }
  add(first,opts.upperCue);
  add(second,opts.lowerCue);
  const componentLabel=(x,y,text,size,color,phrase)=>{
    if(emphasis&&ctx.long&&text){
      const fill=color===RC?'#fce5c7':'#dbf0e8';
      add(box140(svg,x-84,y-48,168,66,color,fill),phrase);
    }
    return add(svgText(svg,x,y,text,size,color),phrase);
  };
  const upperText=componentLabel(177,129,upper,42,RC,opts.upperCue);
  const lowerText=componentLabel(sensor?142:176,344,lower,40,sensor?COLOR.teal:RC,opts.lowerCue);
  const display=group140(svg,0,0);
  graphLine(display,load?'M300 226 H530':'M300 226 H482',OUT_GREEN,8);
  el('circle',{cx:300,cy:mid,r:13,fill:OUT_GREEN},display);
  const value=svgText(display,load?644:615,240,result,42,OUT_GREEN);
  if(result||outputCue||load)add(display,outputCue);else display.style.visibility='hidden';
  for(const [i,[text,phrase]] of drops.entries()) add(svgText(svg,449,i?346:139,text,46,VC),phrase);
  if(load){
    const branch=group140(svg,0,0);
    graphLine(branch,'M530 226 H578 V279 M578 373 V418 H300',OUT_GREEN,7);
    resistor(branch,578,326,true);
    svgText(branch,658,359,'2킬로옴',ctx.long?34:42,OUT_GREEN);
    add(branch,'연결하면');
  }
  return {svg,value,display,power,upperText,lowerText,first,second};
}
function changeText140(ctx,updates,node,initial,changes){
  const states=changes.map(([text,key])=>[text,cue(ctx,key)]);
  updates.push(t=>{node.textContent=states.reduce((v,[text,at])=>t>=at?text:v,initial);});
}
function pizza140(ctx,add,updates){
  const sv=diagram140(ctx,add,'한 판을');
  if(!ctx.long)sv.setAttribute('viewBox','35 0 680 470');
  const disk=group140(sv,374,218);
  el('circle',{cx:0,cy:0,r:145,fill:'#e9a24d',stroke:'#b56a28','stroke-width':9},disk);
  const slice=group140(disk,0,0);
  path(slice,'M0 0 L0 -145 A145 145 0 0 0 -125.57 72.5 Z','#b56a28',8,'#ffd47a');
  for(const [x,y] of [[55,-62],[96,5],[54,72],[0,107]])el('circle',{cx:x,cy:y,r:13,fill:VC},disk);
  const cut=group140(sv,0,0);
  path(cut,'M374 73 V218 L248.43 290.5','#fff7e4',5);
  add(cut,'일 대 이로');
  const move=cue(ctx,'삼분의 일');
  updates.push(t=>{slice.setAttribute('transform','translate('+(-24*E.ease(E.prog(t,move,.45)))+' -'+(12*E.ease(E.prog(t,move,.45)))+')');});
  add(svgText(sv,149,171,'1/3',62,RC),'삼분의 일');
  add(svgText(sv,597,171,'2/3',62,VC),'삼분의 이');
  for(const [i,x] of [145,605].entries()){
    const mark=group140(sv,x,315);
    el('circle',{cx:0,cy:0,r:23,fill:i?VC:RC},mark);
    path(mark,'M-37 80 Q-30 31 0 31 Q30 31 37 80 Z',i?VC:RC,4,i?VC:RC);
    svgText(mark,0,ctx.long?118:132,String(i+1),39);
    add(mark,'일 대 이로');
  }
}
function equalBars140(ctx,add){
  const sv=diagram140(ctx,add);
  const supply=group140(sv,0,0);
  box140(supply,108,68,534,109,VC,'#f3c7ce');svgText(supply,375,138,'전원 전압',44,VC);
  const divided=group140(sv,0,0);
  box140(divided,108,68,534,109,VC,'#ec9ca8');
  el('rect',{x:111,y:71,width:173,height:103,rx:15,fill:'#f7dfe1'},divided);
  svgText(divided,375,138,'전원 전압',44,VC);
  const resistance=group140(sv,0,0);
  box140(resistance,108,253,176,111,RC,'#ffedda');box140(resistance,284,253,358,111,RC,'#f8c895');
  svgText(resistance,195,323,'저항',40,RC);svgText(resistance,458,323,'저항',40,RC);
  add(resistance,'한 줄로');
  return {supply,divided};
}
function sensorIcon140(svg,x,y,kind){
  const g=group140(svg,x,y);
  box140(g,-68,-58,136,120,COLOR.teal,'#e2f4ee');
  if(kind==='sun'){
    el('circle',{cx:0,cy:1,r:23,fill:'#f8bf54',stroke:RC,'stroke-width':5},g);
    for(let i=0;i<8;i++){
      const t=i*Math.PI/4,px=Math.cos(t),py=Math.sin(t);
      graphLine(g,'M'+(px*30)+' '+(py*30)+' L'+(px*45)+' '+(py*45),RC,5);
    }
  }else if(kind==='heat'){
    graphLine(g,'M0 -33 V31',VC,10);
    el('circle',{cx:0,cy:30,r:17,fill:VC},g);
  }else{
    graphLine(g,'M0 -35 V17 M-17 5 L0 24 L17 5 M-38 36 H38',IC,8);
  }
  return g;
}
function sensors140(ctx,add,updates){
  const sv=diagram140(ctx,add);
  const all=group140(sv,0,0);
  [['빛','빛','sun'],['온도','온도','heat'],['누르는 힘','누르는 힘','push']].forEach(([text,key,kind],i)=>{
    const x=141+i*234;
    const g=group140(all,x,176);
    sensorIcon140(g,0,0,kind);
    svgText(g,0,122,text,39);
    svgText(g,0,178,'저항이 바뀜',36,RC);
    add(g,key);
  });
  const circuit=divider140(ctx,add,updates,{input:'',upper:'고정 저항',lower:'센서',result:'출력',sensor:true,emphasis:true,entry:'짝을 지어',ground:'GND'});
  const switchAt=cue(ctx,'짝을 지어');
  const gray=cue(ctx,'만들지 못해요');
  updates.push(t=>{all.style.filter=t<gray?'none':'grayscale(1)';sv.style.visibility=t<switchAt?'visible':'hidden';});
  return circuit;
}
function flow140(ctx,add,updates){
  // L16 only: roomy chips and exposed arrows, horizontal / vertical independently.
  const items=[['대상 변화','대상이 변하면',OUT_GREEN],['저항 변화','저항이 바뀌어요',RC],['전압 변화','출력 전압이',VC],['숫자로 읽기','숫자로 읽어요',IC],['판단','판단해요',COLOR.teal]];
  const sv=add(svgAt(ctx.stage,ctx.long?40:43,ctx.long?150:100,ctx.long?1840:774,ctx.long?600:575,ctx.long?'0 0 1840 600':'0 0 774 575'));
  items.forEach(([text,word,col],i)=>{
    const x=ctx.long?20+i*380:72, y=ctx.long?190:10+i*121;
    const width=ctx.long?280:630,h=ctx.long?300:65;
    const group=group140(sv,x,y);
    box140(group,0,0,width,h,col,'#fff');
    svgText(group,width/2,h/2+14,text,ctx.long?44:39,col);
    add(group,word);
    if(i){
      const move=ctx.long?arrow(sv,x-76,y+h/2,x-24,y+h/2,COLOR.sub,6):arrow(sv,387,y-40,387,y-16,COLOR.sub,3);
      const start=cue(ctx,word);
      updates.push(t=>move(E.prog(t,start,.2)));
    }
  });
}
function resistanceBars140(ctx,add){
  const sv=diagram140(ctx,add);
  const values=[['10킬로옴','10킬로옴','2.5V',.5,'십 킬로옴 두 개면','이 점 오'],
                ['2킬로옴','3킬로옴','3V',.4,'이 킬로옴','삼 볼트예요']];
  values.forEach(([left,right,result,split,key,reveal],i)=>{
    const y=119+i*193,x=100,w=565,splitX=x+w*split;
    const g=group140(sv,0,0);
    box140(g,x,y,w*split,85,RC,'#fce2c3');
    box140(g,splitX,y,w*(1-split),85,RC,'#efb178');
    svgText(g,62,y+56,'5V',38,VC);
    svgText(g,x+w*split/2,y+55,left,36,RC);
    svgText(g,splitX+w*(1-split)/2,y+55,right,36,COLOR.ink);
    add(g,key);
    const tip=group140(sv,0,0);
    graphLine(tip,'M'+splitX+' '+(y-22)+' V'+(y+25),OUT_GREEN,6);
    el('circle',{cx:splitX,cy:y,r:10,fill:OUT_GREEN},tip);
    svgText(tip,splitX,y-41,result,44,OUT_GREEN);
    add(tip,reveal);
  });
}
function lifeStick140(ctx,add,updates){
  const sv=diagram140(ctx,add,'게임 패드');
  box140(sv,55,103,320,250,COLOR.sub,'#e7edf4');
  el('circle',{cx:215,cy:226,r:90,fill:'#fff',stroke:IC,'stroke-width':6},sv);
  graphLine(sv,'M120 226 H310 M215 131 V321',COLOR.line,5);
  const stick=el('circle',{cx:215,cy:226,r:43,fill:IC},sv);
  add(svgText(sv,559,130,'좌우 X',45,VC),'좌우');
  add(svgText(sv,559,294,'위아래 Y',45,IC),'위아래');
  const lines=[143,307].map((y,i)=>el('rect',{x:449,y:y+18,width:65,height:36,rx:9,fill:i?IC:VC},sv));
  const t=cue(ctx,'기울이면');
  updates.push(now=>{
    const u=E.ease(E.prog(now,t,.8));stick.setAttribute('cx',215+47*u);stick.setAttribute('cy',226-42*u);
    lines[0].setAttribute('width',65+141*u);lines[1].setAttribute('width',65+93*u);
  });
}
function gauge140(ctx,add){
  const sv=diagram140(ctx,add,'바꿔요');
  for(const [i,x] of [145,605].entries()){
    box140(sv,x-55,95,110,280,i?IC:VC,'#fff');
    for(let y=117;y<366;y+=38)graphLine(sv,'M'+(x-30)+' '+y+' h60',COLOR.line,5);
    svgText(sv,x,65,i?'0 ~ 1023':'0V ~ 5V',42,i?IC:VC);
  }
  const values=[[333,'0.45V → 약 93','구십삼'],[214,'2.5V → 약 512','오백십이']];
  values.forEach(([y,text,word])=>{
    const g=group140(sv,0,0);graphLine(g,'M145 '+y+' H605',OUT_GREEN,6);
    for(const x of [145,605])el('circle',{cx:x,cy:y,r:11,fill:OUT_GREEN},g);
    svgText(g,375,y-40,text,32,OUT_GREEN);add(g,word);
  });
}
function dividerQuiz140(ctx,add,updates,answer){
  const d=divider140(ctx,add,updates,{input:'10V',upper:'R1 3킬로옴',lower:'R2 2킬로옴',result:answer?'4V':'? V',compact:answer,inputCue:answer?null:'십 볼트',upperCue:answer?null:'삼 킬로옴',lowerCue:answer?null:'이 킬로옴',outputCue:answer?'사 볼트':'출력 전압은'});
  d.upperText.setAttribute('x',105);d.lowerText.setAttribute('x',105);
  if(!answer){d.upperText.setAttribute('font-size',52);d.lowerText.setAttribute('font-size',52);d.value.setAttribute('font-size',64);d.power.setAttribute('font-size',52);}  // 옴 도형으로 바뀐 뒤 채움 4% 아래로 내려가 글자를 조금 키움
  if(answer)ribbon140(ctx,add,'10 × 2 ÷ (3 + 2) = 4V','십 곱하기',OUT_GREEN,{size:96});
  else updates.push(countdown(ctx,ctx.stage,1520,689,145));
}
const SCENES={
 L01:scene((c,a,u)=>{
   const h=title(c,a,'여는 질문');
   const at=cue(c,'전압 분배');
   u.push(t=>{h.textContent=t<at?'여는 질문':'전압 분배';});
   divider140(c,a,u,{entry:'직렬로',emphasis:true,drops:[['? V','얼마씩'],['? V','얼마씩']]});
   const sensor=svgAt(c.stage,1310,322,315,280,'0 0 315 280');sensorIcon140(sensor,155,140,'sun');a(sensor,'센서가');
 }),
 L02:INTRO,
 L03:scene((c,a,u)=>{
   title(c,a,'한 줄로 먼저');const {supply,divided}=equalBars140(c,a);const at=cue(c,'비율대로');
   u.push(t=>{supply.style.visibility=t<at?'visible':'hidden';divided.style.visibility=t>=at?'visible':'hidden';});
   ribbon140(c,a,'전압 분배','전압 분배',OUT_GREEN,{size:87});
 }),
 L04:scene((c,a,u)=>{title(c,a,'피자 나누기');pizza140(c,a,u);}),
 L05:scene((c,a)=>{
   title(c,a,'전기로 바꾸면');
   const row=c.long?150:113,w=c.long?1510:774,y=c.long?147:115;
   tableRows(c,a,y,['피자','전기'],[
     {cells:['한 판','전원 전압'],phrase:'전원 전압이고',color:VC,emphasized:1},
     {cells:['몫','저항'],phrase:'저항이에요',color:RC,emphasized:1},
     {cells:['큰 몫 → 많이','큰 저항 → 전압 많이'],phrase:'전압을 더 많이',color:VC,emphasized:1},
   ],row,w,c.long?58:39);
 }),
 L06:scene((c,a,u)=>{
   title(c,a,'회로로 보기');
   const d=divider140(c,a,u,{split:true,emphasis:true,entry:'세로로',inputCue:'구 볼트',groundCue:'영 볼트',upperCue:'일 킬로옴과',lowerCue:'이 킬로옴이',drops:[['3V','삼 볼트'],['6V','육 볼트'],]});
   const ratio=svgText(d.svg,535,249,'1 : 2',44,VC);a(ratio,'일 대 이니');
   if(!c.long)d.svg.style.left='75px';
 }),
  L07:scene((c,a,u)=>{
   title(c,a,'출력 전압');
   const d=divider140(c,a,u,{upper:'R1',lower:'R2',result:'출력',emphasis:true,upperCue:'알 일',lowerCue:'알 이',outputCue:'사이 점과'});
   const flow=arrow(d.svg,525,265,525,423,OUT_GREEN,8);
   const at=cue(c,'육 볼트가');
   u.push(t=>flow(E.prog(t,at,.5)));
   changeText140(c,u,d.value,'출력',[['출력 6V','육 볼트가']]);
 }),
 L08:scene((c,a,u)=>{
   title(c,a,'식이 나오는 과정');
   const d=divider140(c,a,u,{side:true,entry:'같은 전류가',result:'',input:'V전원',upper:'R1',lower:'R2',ground:'GND'});
   d.svg.style.left='25px';d.svg.style.width='830px';
   d.upperText.setAttribute('x',150);d.power.setAttribute('x',420);
   d.power.textContent='';el('tspan',{text:'V'},d.power);el('tspan',{text:'전원','font-size':27,dy:8},d.power);
   const dots=Array.from({length:3},()=>el('circle',{cx:300,r:7,fill:IC},d.svg));
   // L08: 같은 간격의 전류 점이 R1·R2 전체를 지나고 끝에서 서서히 사라진다.
   const flowStart=cue(c,'같은 전류가');
   u.push(t=>dots.forEach((dot,i)=>{
     const phase=((i/3+Math.max(0,t-flowStart)*.22)%1);
     dot.setAttribute('cy',48+phase*386);
     dot.style.opacity=t<flowStart?0:Math.min(1,phase*24,(1-phase)*24);
   }));
   cards140(c,a,[['옴　·　KCL　·　KVL','세 법칙을',OUT_GREEN],[step140(1,IC)+'같은 전류가 흐름','같은 전류가',IC],[step140(2,RC)+'I = '+vsub('전원')+' ÷ (R1 + R2)','전체 전압 나누기',RC,60]],{side:true});
 }),
 L09:scene((c,a)=>{
   title(c,a,'전압 분배 식');cards140(c,a,[
     [step140(3,IC)+vsub('출력')+' = I × R2','전류 곱하기',IC,77],
     [formula140,'합치면',VC,96],
     ['전원 전압 × 내 몫의 비율','말로 풀면',OUT_GREEN,60],
   ]);
 }),
 L10:scene((c,a)=>{title(c,a,'비율로 쓰기');cards140(c,a,[['V1 : V2 = R1 : R2','비율로도',VC,108],['3V : 6V = 1킬로옴 : 2킬로옴','같아요',RC,77]]);}),
 L11:scene((c,a)=>{title(c,a,'저항을 알 때');resistanceBars140(c,a);}),
 L12:scene((c,a,u)=>{
   title(c,a,'전압을 알 때');const d=divider140(c,a,u,{side:true,input:'5V',upper:'1킬로옴',lower:'?',result:'3.3V',outputCue:'삼 점 삼 볼트 부품에'});
   d.svg.style.left='25px';d.svg.style.width='830px';
   d.upperText.setAttribute('x',150);d.lowerText.setAttribute('x',125);
   changeText140(c,u,d.lowerText,'?',[['1.94킬로옴','일 점 구사'],['2킬로옴','이 킬로옴을']]);
   cards140(c,a,[['R1 전압 = 5V − 3.3V = 1.7V','일 점 칠',VC,53],['R2 = 1킬로옴 × 3.3 ÷ 1.7 ≈ 1.94킬로옴','일 점 구사',RC,46],['2킬로옴 → 출력 ≈ 3.33V','삼 점 삼삼',OUT_GREEN,53]],{side:true});
 }),
 L13:scene((c,a)=>{
   title(c,a,'사양서 확인');
   const sv=diagram140(c,a,'사양서의',{side:true});
   box140(sv,152,49,432,370,COLOR.teal,'#e5f4ee');
   graphLine(sv,'M215 150 H514 M215 208 H514 M215 265 H514 M215 326 H453',COLOR.teal,12);
   cards140(c,a,[['3.33V ≤ ?',null,VC,104],['사양서 · 최대 입력 전압','사양서의',OUT_GREEN,54]],{side:true,top:235});
 }),
 L14:scene((c,a,u)=>{
   title(c,a,'센서의 지금 저항');
   const d=divider140(c,a,u,{side:true,input:'5V',upper:'10킬로옴',lower:'센서 ?',result:'2V',sensor:true,outputCue:'이 볼트가'});
   d.svg.style.left='25px';d.svg.style.width='830px';
   d.upperText.setAttribute('x',150);d.lowerText.setAttribute('x',115);
   changeText140(c,u,d.lowerText,'센서 ?',[['6.67킬로옴','육 점 육칠']]);
   cards140(c,a,[['5V − 2V = 3V','삼 볼트예요',VC,62],['10킬로옴 × 2 ÷ 3 ≈ 6.67킬로옴','육 점 육칠',RC,51]],{side:true,top:223});
 }),
 L15:scene((c,a,u)=>{title(c,a,'센서는 혼자 전압을 만들지 못해요');sensors140(c,a,u);}),
 L16:scene((c,a,u)=>{title(c,a,'센서가 값을 알려 주는 흐름');flow140(c,a,u);}),
 L17:scene((c,a)=>{
   title(c,a,'센서마다 저항이 바뀌는 방향');
   tableRows(c,a,136,['센서','변화','저항'],[
     {cells:['조도 센서','빛 ↑','저항 ↓'],phrase:'조도 센서는',color:RC,emphasized:1},
     {cells:['서미스터','온도 ↑','저항 ↓'],phrase:'서미스터는',color:RC,emphasized:1},
     {cells:['휨 센서','많이 휨','저항 ↑'],phrase:'휨 센서는',color:RC,emphasized:1},
   ],119,1500,53);
   ribbon140(c,a,'저항 변화 → 전압 분배 → 전압 변화','다리 역할',OUT_GREEN);
 }),
 L18:scene((c,a)=>{
   title(c,a,'모든 센서가 이렇지는 않아요');
   const sv=a(svgAt(c.stage,310,140,1300,560,'0 0 1000 450'),'온습도 센서나');
   sensorIcon140(sv,210,100,'heat');sensorIcon140(sv,210,310,'push');
   svgText(sv,210,220,'온습도',39);svgText(sv,210,430,'거리',39);
   a(graphLine(sv,'M400 290 H465 V180 H539 V290 H606 V180 H673 V290 H751 V180 H850',IC,12),'디지털 신호로');
   ribbon140(c,a,'사양서 확인','사양서에서',OUT_GREEN,{size:72});
 }),
 L19:scene((c,a,u)=>{
   title(c,a,'아두이노로 밝기 읽기');
   const d=divider140(c,a,u,{side:true,input:'5V',upper:'10킬로옴',lower:'조도 센서',sensor:true,result:'A0',outputCue:'에이 영에'});
   d.svg.style.left='25px';d.svg.style.width='830px';
   d.upperText.setAttribute('x',150);d.lowerText.setAttribute('x',125);
   cards140(c,a,[['밝을 때 · 1킬로옴 · 약 0.45V','밝을 때',VC,55],['어두울 때 · 10킬로옴 · 2.5V','어두울 때',IC,55]],{side:true,top:235});
 }),
 L20:scene((c,a)=>{title(c,a,'전압을 숫자로');gauge140(c,a);ribbon140(c,a,'센서 저항값은 계산용 예시','예시예요',COLOR.teal,{size:43});}),
 L21:scene((c,a,u)=>{
   title(c,a,'가변저항은 혼자서 전압 분배기');const sv=diagram140(c,a,'다리가 세 개',{compact:true});
   graphLine(sv,'M380 58 V110 M380 360 V421',COLOR.ink,8);
   box140(sv,341,107,78,253,RC,'#ffe2c0');
   svgText(sv,488,68,'5V',43,VC);svgText(sv,490,427,'GND',41,COLOR.sub);
   const slider=group140(sv,0,0);
   const move=arrow(slider,548,0,423,0,OUT_GREEN,9);move(1);
   svgText(slider,608,11,'출력',40,OUT_GREEN);
   const start=cue(c,'돌리면'),stop=cue(c,'한가운데');
   u.push(t=>{const y=t<start||t>=stop?232:232+66*Math.sin((t-start)*3.3);slider.setAttribute('transform','translate(0 '+y+')');});
   ribbon140(c,a,'2.5V','이 점 오 볼트',OUT_GREEN,{size:81});
 }),
 L22:scene((c,a,u)=>{title(c,a,'생활 속 전압 분배');lifeStick140(c,a,u);}),
 L23:scene((c,a,u)=>{
   title(c,a,'전압 분배로 전원을 만들면');
   const normal=divider140(c,a,u,{entry:'육 볼트가',result:'6V',compact:true});
   const loaded=divider140(c,a,u,{entry:'연결하면',result:'6V',load:true,compact:true});
   const at=cue(c,'연결하면');
   // L23 only: branch label outside wire and GND below return wire.
   for(const d of [normal,loaded]){
     d.svg.setAttribute('viewBox','0 0 750 510');d.svg.setAttribute('height',c.long?560:430);
     const ground=[...d.svg.querySelectorAll('text')].find(t=>t.textContent==='0V (GND)');ground.setAttribute('y',500);
   }
   const branch=loaded.svg.lastElementChild;
   branch.querySelector('path').setAttribute('d','M510 226 H540 V279 M540 373 V418 H300');
   branch.children[1].setAttribute('transform','translate(540 326) rotate(90)');
   branch.querySelector('text').setAttribute('x',665);
   if(c.long){normal.svg.style.left='30px';normal.svg.style.width='850px';loaded.svg.style.left='952px';loaded.svg.style.width='910px';}
   else u.push(t=>{normal.svg.style.visibility=t<at?'visible':'hidden';});
   changeText140(c,u,loaded.value,'6V',[['4.5V','사 점 오']]);
   ribbon140(c,a,'2킬로옴과 2킬로옴 = 1킬로옴','일 킬로옴처럼',RC,{size:c.long?76:39});
 }),
 L24:scene((c,a)=>{
   title(c,a,'전원은 레귤레이터로');
   const sv=diagram140(c,a,'모터처럼',{compact:true});
   el('circle',{cx:171,cy:212,r:79,fill:'#e4eefc',stroke:IC,'stroke-width':9},sv);svgText(sv,171,234,'M',70,IC);
   a(graphLine(sv,'M275 224 L326 206 L375 232 L421 149 L462 299 L519 211 L584 274 L637 162',VC,11),'흔들리고');
   ribbon140(c,a,'전압 분배 → 센서·신호','센서 값을',IC,{y:600,h:108,size:54});
   ribbon140(c,a,'전원 → 전압 레귤레이터','레귤레이터',VC,{y:735,h:112,size:62});
 }),
 L25:scene((c,a)=>{title(c,a,'저항 크기와 전압 높이기');cards140(c,a,[
   ['100옴 + 100옴 → 25mA','백 옴',IC],['10킬로옴 + 10킬로옴 → 0.25mA','십 킬로옴 두 개면',IC],
   ['출력 &lt; 전원 전압','항상',VC],['<s>3.3V → 5V</s>　불가','높이는 데는',COLOR.sub],
 ]);}),
 L26:scene((c,a)=>{title(c,a,'한눈에 정리');cards140(c,a,[
   [formula140,'출력 전압은',VC,96],['저항 비율대로 나눔','직렬 저항은',RC,54],
   ['센서 저항 변화 → 전압 변화','많은 센서는',OUT_GREEN,54],['아두이노 우노: 0~1023','아두이노는',IC,54],['전원용 아님 · 높이기 불가','전원용으로는',VC,54],
 ]);}),
 L27:scene((c,a,u)=>{title(c,a,'퀴즈');dividerQuiz140(c,a,u,false);}),
 L27B:scene((c,a,u)=>{title(c,a,'퀴즈 정답');dividerQuiz140(c,a,u,true);}),
 L28:scene((c,a,u)=>{
   title(c,a,'전압 분배');
   panel(c,a,245,254,598,239,'블로그 글<br>설명란 링크','블로그',OUT_GREEN,67);
   ['전압·전류·저항','옴의 법칙','키르히호프의 법칙','전압 분배'].forEach((name,i)=>{
     const node=panel(c,a,920+i*42,155+i*157,690,115,name,'여기까지',[IC,RC,VC,OUT_GREEN][i],47);
     const start=cue(c,'여기까지');
     u.push(t=>show(node,E.prog(t,start+i*.24,.25),5));
   });
 }),
 L29:OUTRO,
 S1E:scene((c,a,u)=>{title(c,a,'가운데 점의 전압');divider140(c,a,u,{result:'?',outputCue:'가운데 점의'});}),
 S2E:scene((c,a)=>{
   title(c,a,'방이 밝아지면');const svg=diagram140(c,a,'밝아지면');
   const sun=sensorIcon140(svg,375,115,'sun');sun.setAttribute('transform','translate(375 119) scale(1.35)');
   box140(svg,112,287,526,151,IC,'#eef5fe');svgText(svg,375,388,'↑　?　↓',75,IC);
 }),
 S3A:scene((c,a,u)=>{
   title(c,a,'9V에서 6V가 필요하면');
   divider140(c,a,u,{entry:'나눠서',upper:'',lower:'',result:'?',compact:true});
   ribbon140(c,a,'9V → 6V 필요','육 볼트가',VC);
 }),
 S3E:scene((c,a)=>{
   title(c,a,'부품에 전원을 줄 때');
   const svg=diagram140(c,a);
   box140(svg,205,54,342,229,COLOR.teal,'#dff2ec');
   for(let i=0;i<5;i++)graphLine(svg,'M'+(240+67*i)+' 285 v52',COLOR.teal,9);
   svgText(svg,375,192,'전원은 ?',64,OUT_GREEN);
   ribbon140(c,a,'무엇을 써야 할까요?','무엇을 써야',IC);
 }),
};
