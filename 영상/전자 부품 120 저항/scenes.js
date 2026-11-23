// 장면 안 좌표는 1000 × 580. 쇼츠도 같은 부품 비율을 유지한다.
const INK = '#203745', GREEN = '#107151', BLUE = '#2478b8', MUTE = '#506675';
const MINT = '#d9efe4', PAPER = '#fffefa', WIRE = '#788b93', HEAT = '#df6529';
const BANDS = ['#232629','#874b22','#df3e39','#ed922d','#f6cd42','#438942','#287bc1','#8842aa','#959c9e','#fffefa'];
const GOLD = '#c49a35', SILVER = '#aab4bc', NAMES = '검갈빨주노초파보회흰';
const FOUR = [BANDS[1], BANDS[0], BANDS[2], GOLD];
const FOUR_X = [-133, -56, 22, 139], FIVE_X = [-146, -86, -26, 35, 154];

function group(p, transform = '') { return el('g', transform ? {transform} : {}, p); }
function place(p,x,y,scale=1) { return group(p,`translate(${x} ${y}) scale(${scale})`); }
function box(p,x,y,width,height,fill=PAPER,stroke='none',rx=16,sw=2) {
  return el('rect',{x,y,width,height,rx,fill,stroke,'stroke-width':sw},p);
}
function oval(p,x,y,rx,ry,fill,stroke='none',sw=2) {
  return el('ellipse',{cx:x,cy:y,rx,ry,fill,stroke,'stroke-width':sw},p);
}
function pen(p,d,stroke=INK,sw=4,fill='none',extra={}) {
  return el('path',{d,fill,stroke,'stroke-width':sw,'stroke-linecap':'round','stroke-linejoin':'round',...extra},p);
}
function line(p,x1,y1,x2,y2,color=WIRE,sw=4) { return pen(p,`M${x1} ${y1} L${x2} ${y2}`,color,sw); }
function word(p,x,y,value,size=40,color=INK,weight=600) {
  return el('text',{x,y,'text-anchor':'middle','font-size':size,'font-family':'P','font-weight':weight,fill:color,text:value},p);
}
function pill(p,x,y,w,value,fill=MINT,color=GREEN,fs=34) {
  const g=group(p);
  box(g,x-w/2,y-31,w,62,fill,'none',18);
  word(g,x,y+fs*.34,value,fs,color,800);
  return g;
}
function set(n,key,value) { n.setAttribute(key,value); }
function alpha(n,v) { set(n,'opacity',E.clamp(v)); }

// 타입캐스트가 붙여 쓰거나 여러 단어로 나누어 돌려준 구절도 같은 발화 위치를 찾는다.
function compact(s) { return s.replace(/[^가-힣a-zA-Z0-9]/g,''); }
function cue(c,phrase,nth=1) {
  if (typeof phrase === 'number') return phrase;
  const needle=compact(phrase);
  let pos=-1;
  for (let i=0;i<nth;i++) {
    pos=c.speech.indexOf(needle,pos+1);
    if (pos<0) throw new Error('장면의 발화 구절을 찾을 수 없습니다: '+phrase);
  }
  return c.charTime[pos];
}
function scene(draw) {
  return {
    init(c) {
      c.updates=[]; c.speech=''; c.charTime=[];
      for (const w of c.words) {
        const s=compact(w.text);
        c.speech+=s;
        for (let i=0;i<s.length;i++) c.charTime.push(w.start+(w.end-w.start)*i/s.length);
      }
      const svg=el('svg',{width:c.W,height:c.H,viewBox:c.long?'0 0 1000 580':'0 -65 1000 710'},c.stage);
      draw(c,svg);
    },
    frame(c,t) { for (const update of c.updates) update(t); }
  };
}
function reveal(c,node,phrase=0,nth=1) {
  const start=cue(c,phrase,nth);
  c.updates.push(t=>alpha(node,E.prog(t,start,.18)));
  return node;
}
function until(c,node,phrase,nth=1) {
  const start=cue(c,phrase,nth);
  c.updates.push(t=>alpha(node,1-E.prog(t,start,.18)));
}
function heading(p,s) { word(p,500,67,s,48,INK,800); }
function sample(p,s='예시 값') { pill(p,830,51,Math.max(184,s.length*31),s,'#e2ebe7',MUTE,38); }
function panel(p,x,y,w,h) { return box(p,x,y,w,h,PAPER,'#bfd3c9',23,3); }

function resistor(p,x,y,k=1,colors=FOUR) {
  const g=place(p,x,y,k), body=group(g);
  const lead=line(body,-315,0,315,0,WIRE,8);
  box(body,-208,-52,416,104,'#ecd5a1','#927748',34,3);
  box(body,-188,-40,376,12,'#f6e4bf','none',6);
  const xs=colors.length===5?FIVE_X:FOUR_X;
  const rings=colors.map((color,i)=>{
    const blank=!color;
    const r=box(body,xs[i]-12,-51,24,102,color||'#f6ead0',blank?'#84949c':'#786d5c',3,blank?3:1.4);
    if (blank) set(r,'stroke-dasharray','6 5');
    return r;
  });
  return {g,body,lead,rings,xs};
}
function flash(c,r,when) {
  const a=cue(c,when);
  c.updates.push(t=>set(r,'stroke-width',1.4+6*Math.sin(Math.PI*E.prog(t,a,.48))));
}
function swatch(p,x,y,i,digit=true,w=78) {
  const g=group(p);
  box(g,x-w/2,y-39,w,78,BANDS[i],i===9||i===4?'#9a9d90':'none',13);
  const fg=[3,4,8,9].includes(i)?INK:'#fff';
  word(g,x,y+14,digit?String(i):NAMES[i],42,fg,800);
  if (digit) word(g,x,y+92,NAMES[i],38);
  return g;
}
function palette(p,y) { return BANDS.map((_,i)=>swatch(p,104+i*88,y,i)); }

function stream(c,p,points,count,{start=0,stop=Infinity,speed=85,r=5,color=BLUE}={}) {
  const lengths=points.slice(1).map(([x,y],i)=>Math.hypot(x-points[i][0],y-points[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0), g=group(p);
  const dots=Array.from({length:count},()=>oval(g,0,0,r,r,color));
  c.updates.push(t=>{
    alpha(g,t>=start&&t<stop?1:0);
    dots.forEach((d,i)=>{
      let dist=(Math.max(0,t-start)*speed+i*total/count)%total,j=0;
      while (j<lengths.length-1 && dist>=lengths[j]) dist-=lengths[j++];
      const u=dist/lengths[j], [x,y]=points[j], [xx,yy]=points[j+1];
      set(d,'cx',x+(xx-x)*u); set(d,'cy',y+(yy-y)*u);
    });
  });
  return g;
}
function heat(p,x,y,k=1,color=HEAT) {
  const g=place(p,x,y,k);
  for (const dx of [-45,0,45]) pen(g,`M${dx} 0 q-18 -17 0 -34 t0 -34`,color,7);
  return g;
}
function person(p,x,y,k=1,color=GREEN) {
  const g=place(p,x,y,k);
  pen(g,'M-9 28 L-12 52 M9 28 L13 52','#344655',10);
  pen(g,'M-13 3 L-21 23 M13 3 L21 20',color,8);
  box(g,-15,-4,30,37,color,'none',10);
  box(g,-5,-12,10,14,'#d29e7e','none',4);
  oval(g,0,-19,12,14,'#e6b08d');
  pen(g,'M-12 -21 Q-11 -40 5 -32 Q13 -30 12 -22 Q3 -29 -12 -21','none',0,'#3c3231');
  return g;
}
function turnstile(p,x,y,r) {
  const g=place(p,x,y,r/65);
  oval(g,0,0,65,65,'#e5efeb','#738b82',4);
  const blades=group(g);
  for(const angle of [0,120,240]) {
    const arm=group(blades,`rotate(${angle})`);
    line(arm,0,0,58,0,HEAT,8);
  }
  oval(blades,0,0,9,9,INK);
  return blades;
}
function chip(p,x,y,k=1,mark='') {
  const g=place(p,x,y,k);
  box(g,-130,-56,260,112,'#aebcc4','#647784',11,3);
  box(g,-96,-56,192,112,'#2c3540','none',4);
  if(mark) word(g,0,21,mark,65,'#fff',800);
  return g;
}
function toaster(p,x,y,k=1) {
  const g=place(p,x,y,k);
  box(g,-98,37,196,17,'#47585f','none',6);
  box(g,-105,-50,210,90,'#dfb790','#86654e',19,4);
  box(g,-79,-84,128,49,'#d39b67','#81573d',15,4);
  box(g,-64,-74,100,29,'#f1cf9b','none',10);
  line(g,-84,-41,49,-41,'#785643',6);
  box(g,-79,-19,137,44,'#504646','none',9);
  const coil=pen(g,'M-66 10 l12 -18 12 18 12 -18 12 18 12 -18 12 18 12 -18 12 18','#ef824b',5);
  oval(g,80,5,11,11,'#66534f');
  return {g,coil};
}
function heater(p,x,y,k=1) {
  const g=place(p,x,y,k);
  for(const dx of [-62,62]) box(g,dx-10,45,20,20,'#465664','none',4);
  box(g,-98,-70,196,120,'#405661','#243b46',17,4);
  box(g,-82,-55,164,87,'#332f30','none',10);
  for(const cy of [-35,-9,16]) pen(g,`M-68 ${cy} q13 -12 26 0 t26 0 t26 0 t26 0 t26 0`,'#ff8553',5);
  return g;
}
function fuse(p,x,y,k=1) {
  const g=place(p,x,y,k);
  line(g,-240,0,240,0,WIRE,5);
  box(g,-171,-41,342,82,'#e5f1ef','#6a8a91',26,5);
  for (const dx of [-183,135]) box(g,dx,-50,48,100,'#a4b3b7','#637681',10,3);
  const wire=pen(g,'M-138 0 Q-64 -13 0 0 T138 0','#987858',5);
  return {g,wire};
}
function powerstrip(p,x,y,k=1) {
  const g=place(p,x,y,k);
  pen(g,'M-185 0 H-265 Q-287 0 -287 32 V67',WIRE,11);
  box(g,-194,-55,388,110,'#dce8e7','#58717a',25,5);
  const sockets=[-132,-44,44,132];
  sockets.forEach(cx=>{
    oval(g,cx,0,35,35,'#f9fbf9','#738b91',3);
    for (const dx of [-11,11]) oval(g,cx+dx,0,5,7,INK);
  });
  return {g,sockets};
}
function plug(p,x,y,k=1) {
  const g=place(p,x,y,k);
  pen(g,'M0 -62 v20',WIRE,9);
  box(g,-24,-42,48,36,'#374e5c','none',9);
  for (const dx of [-11,11]) line(g,dx,-6,dx,6,'#586b73',5);
  return g;
}

const SCENES = {L02:INTRO,L27:OUTRO};
SCENES.L01=scene((c,p)=>{
  const r=resistor(p,500,290,1.39);
  const roll=cue(c,'숫자가 하나도');
  c.updates.push(t=>set(r.body,'transform',`scale(1 ${1-.28*Math.sin(Math.PI*E.prog(t,roll,1.8))})`));
  ['갈색','검정','빨강','금색'].forEach((s,i)=>flash(c,r.rings[i],s));
  const q=group(p);
  r.xs.forEach(x=>word(q,500+x*1.39,173,'?',53,GREEN,800));
  reveal(c,q,'암호예요');
  reveal(c,pill(p,500,485,260,'저항',GREEN,'#fff',46),'풀어 볼게요');
});
SCENES.L03=scene((c,p)=>{
  heading(p,'저항'); resistor(p,500,253,1.32);
  const flowStart=cue(c,'지나가기 어렵게');
  stream(c,p,[[65,253],[287,253]],11,{start:flowStart,speed:45});
  stream(c,p,[[300,253],[935,253]],7,{start:flowStart,speed:85});
  const chips=['생김새','값 읽기','고르기','합치기','생활 속 쓰임'];
  chips.forEach((s,i)=>reveal(c,pill(p,113+i*190,454,i===4?207:170,s,MINT,GREEN,30),
    ['생김새','값 읽는','고르는','합치는','생활 속 쓰임'][i]));
});
SCENES.L04=scene((c,p)=>{
  heading(p,'좁은 회전문'); panel(p,36,105,445,305); panel(p,519,105,445,305);
  const a=cue(c,'넓으면'), b=cue(c,'회전문 하나만'), change=cue(c,'바로 이 회전문');
  for(const y of [174,337]) line(p,263,y,325,y,GREEN,10);
  const door=group(p), blades=turnstile(door,796,251,65);
  const left=group(p), right=group(door);
  // 대기 중인 수는 같고, 회전문 안을 통과하는 사람은 한 번에 한 명이다.
  for (let i=0;i<6;i++) {
    const lane=Math.floor(i/3), j=i%3, walker=group(left);
    person(walker,0,0,.66,lane?BLUE:GREEN);
    c.updates.push(t=>{
      const distance=(j*102+26+Math.max(0,t-a)*90)%355;
      set(walker,'transform',`translate(${80+distance} ${217+86*lane})`);
      alpha(walker,Math.min(distance,355-distance)/20);
    });
    person(right,560+j*49,221+77*lane,.56,lane?BLUE:GREEN);
  }
  const through=group(door); person(through,0,0,.61,HEAT);
  c.updates.push(t=>{
    const phase=Math.max(0,t-b)/3.2, u=phase%1;
    set(blades,'transform',`rotate(${phase*120})`);
    set(through,'transform',`translate(${718+190*u} ${249-36*Math.sin(Math.PI*u)})`);
    alpha(through,Math.min(u,1-u)*12);
    alpha(door,1-E.prog(t,change,.3));
  });
  reveal(c,word(p,260,384,'1분에 10명',37,GREEN,800),'열 명이');
  reveal(c,word(p,741,384,'1분에 3명',37,HEAT,800),'세 명만');
  reveal(c,word(p,500,448,'줄을 선 사람 수는 같아요',32),'같은데');
  reveal(c,resistor(p,738,248,.62).g,'바로 이 회전문');
  reveal(c,pill(p,274,515,385,'미는 힘 = 전압'),'전압이');
  reveal(c,pill(p,733,515,390,'지나가는 양 = 전류'),'전류가 줄어요');
});
function loopRow(c,p,cy,value,current,when,currentCue,count) {
  const g=group(p);
  pen(g,`M175 ${cy} H680 V${cy+72} H175 V${cy+43} M175 ${cy+18} V${cy}`,WIRE,5);
  line(g,155,cy+27,195,cy+27,INK,4); line(g,163,cy+42,187,cy+42,INK,4);
  word(g,105,cy+46,'5V',34);
  resistor(g,423,cy,.54,value.startsWith('100')?[BANDS[1],BANDS[0],BANDS[1],GOLD]:FOUR);
  word(g,423,cy-48,value,40,GREEN,800);
  stream(c,g,[[175,cy],[680,cy],[680,cy+72],[175,cy+72],[175,cy]],count,{start:cue(c,currentCue)});
  reveal(c,pill(g,829,cy+37,182,current),currentCue);
  reveal(c,g,when);
}
SCENES.L05=scene((c,p)=>{
  heading(p,'같은 전압에서'); loopRow(c,p,184,'100옴','50mA','백 옴','오십 밀리암페어',30);
  loopRow(c,p,365,'1킬로옴','5mA','일 킬로옴','오 밀리암페어',3);
  reveal(c,pill(p,500,519,715,'저항 ×10 → 전류 1/10',GREEN,'#fff',38),'열 배가');
});
SCENES.L06=scene((c,p)=>{
  const r=resistor(p,500,237,1.3);
  const legAt=cue(c,'다리예요');
  c.updates.push(t=>set(r.lead,'stroke',t>=legAt&&t<legAt+.6?GREEN:WIRE));
  r.rings.forEach(ring=>flash(c,ring,'몸통의 색띠'));
  const cut=group(p);
  box(cut,355,223,290,27,'#9e876a','#7e6b51',10);
  pen(cut,'M367 240 l21 -11 20 11 21 -11 20 11 21 -11 20 11 21 -11 20 11 21 -11 20 11 21 -11 20 11','#544b43',3);
  const start=cue(c,'몸통 안에는'), end=cue(c,'몸통의 색띠');
  c.updates.push(t=>alpha(cut,E.prog(t,start,.3)*(1-E.prog(t,end,.3))));
  [['다리(리드선)',170,160,212,'다리예요'],['몸통',545,110,165,'몸통 안에는'],['색띠',681,139,165,'몸통의 색띠']].forEach(([s,x,y,to,at])=>{
    const g=group(p); word(g,x,y,s,37); line(g,x,y+11,x,to,MUTE,3); reveal(c,g,at);
  });
  const boards=group(p);
  for (const [i,x] of [290,710].entries()) {
    box(boards,x-175,355,350,116,PAPER,'#acbdc2',14);
    for(let j=0;j<10;j++) for(let h=0;h<3;h++) oval(boards,x-145+j*32,378+h*31,3,3,'#83949a');
    const mini=resistor(boards,x,395,.46);
    for(const side of [-1,1]) pen(boards,`M${x+side*145} 395 v14`,WIRE,4);
    if(i) {const at=cue(c,'어느 쪽으로'); c.updates.push(t=>set(mini.body,'transform',`scale(${1-2*E.ease(E.prog(t,at,.75))} 1)`));}
    pill(boards,x,526,160,'동작');
  }
  reveal(c,boards,'어느 쪽으로');
});
SCENES.L07=scene((c,p)=>{
  const r=resistor(p,500,130,.78);
  const at=cue(c,'돌려도'); c.updates.push(t=>set(r.body,'transform',`scale(1 ${1-.32*Math.sin(Math.PI*E.prog(t,at,1.2))})`));
  const tiles=palette(p,340);
  tiles.forEach((tile,i)=>reveal(c,tile,NAMES.slice(i)));
  const rainbow=group(p);
  ['#dd5554','#e3a02e','#519056','#3f81ad','#8b5aa1'].forEach((col,i)=>pen(rainbow,`M277 ${283-i*6} Q500 ${190-i*8} 723 ${283-i*6}`,col,5));
  reveal(c,rainbow,'무지개 순서');
});
SCENES.L08=scene((c,p)=>{
  // 이 장면의 첫 쇼츠 자막만 한 줄에 담고, 다음 장면에서 style도 함께 지운다.
  if (!c.long) el('style',{text:'#sub[data-t="그런데 무지개는 빨주노초파남보잖아요"] span{font-size:44px;white-space:nowrap}'},c.stage);
  heading(p,'무지개와 저항 색띠');
  const indices=[2,3,4,5,6,-1,7], x=i=>152+i*116;
  const top=cue(c,'빨주노초파남보'), exit=cue(c,'남색이 없어요'), close=cue(c,'파랑 육');
  indices.forEach((digit,i)=>{
    const col=digit<0?'#364480':BANDS[digit], name=digit<0?'남':NAMES[digit];
    const a=group(p); box(a,x(i)-49,127,98,81,col,digit===4?'#949891':'none');
    word(a,x(i),184,name,44,[3,4].includes(digit)?INK:'#fff',800);
    reveal(c,a,top+i*.07);
    if (digit<0) {
      const ghost=group(p); box(ghost,x(i)-45,303,90,75,col);
      word(ghost,x(i),356,name,42,'#fff');
      c.updates.push(t=>{const u=E.prog(t,exit,.65); alpha(ghost,E.prog(t,top,.2)*(1-u)); set(ghost,'transform',`translate(${5*Math.sin(4*Math.PI*u)} ${-100*E.ease(u)})`);});
    } else {
      const tile=swatch(p,x(i),339,digit,true,90);
      reveal(c,tile,top+i*.07);
      c.updates.push(t=>set(tile,'transform',`translate(${(i===6?-58:58)*E.ease(E.prog(t,close,.5))} 0)`));
    }
  });
  reveal(c,pill(p,500,520,318,'외우기 요령',GREEN,'#fff',41),'외우기 위한 요령');
});
SCENES.L09=scene((c,p)=>{
  const r=resistor(p,500,171,1.27);
  const whens=['갈색은 일','검정은 영','영을 두 개','금색 띠는'];
  const slots=[200,372,558,802];
  r.xs.forEach((bx,i)=>{
    const x=500+bx*1.27;
    const q=word(p,x,82,'?',47,GREEN,800); until(c,q,whens[i]);
    const g=group(p); pen(g,`M${x} 243 V257 L${slots[i]} 282`,WIRE,3);
    word(g,slots[i],333,['1','0','× 100','±5%'][i],51,INK,800);
    word(g,slots[i],387,['숫자','숫자','곱하기','오차'][i],40,MUTE);
    reveal(c,g,whens[i]); flash(c,r.rings[i],whens[i]);
  });
  const eq=group(p); reveal(c,eq,'붙이면 십');
  const ten=word(eq,500,458,'10',50,INK,800); until(c,ten,'두 개 붙이라는');
  const digits=word(eq,500,458,'',49,INK,800), appendAt=cue(c,'두 개 붙이라는'), resultAt=cue(c,'그래서 천 옴');
  c.updates.push(t=>{
    digits.textContent=t<appendAt+.25?'10':'10'+(t<appendAt+.52?'0':'00');
    alpha(digits,E.prog(t,appendAt,.16)*(1-E.prog(t,resultAt,.15)));
  });
  reveal(c,word(eq,500,458,'10 × 100 = 1,000옴',48,INK,800),'그래서 천 옴');
  reveal(c,pill(p,500,541,333,'1킬로옴',GREEN,'#fff',48),'일 킬로옴');
});
SCENES.L10=scene((c,p)=>{
  heading(p,'오차 ±5%');
  box(p,139,205,722,40,'#dbe4df','none',15);
  const spread=cue(c,'오 퍼센트까지'), bar=box(p,500,205,0,40,'#88c7a7','none',15);
  c.updates.push(t=>{const w=700*E.ease(E.prog(t,spread,.75)); set(bar,'width',w); set(bar,'x',500-w/2);});
  for(const [i,x] of [150,500,850].entries()) {
    line(p,x,197,x,256,INK,4);
    reveal(c,word(p,x,307,['950옴','1,000옴','1,050옴'][i],40),['구백오십','천 옴의','천오십'][i]);
  }
  ['갈색','빨강','금색','은색'].forEach((s,i)=>{
    const x=155+i*230, g=group(p);
    panel(g,x-100,362,200,174);
    box(g,x-73,383,146,32,[BANDS[1],BANDS[2],GOLD,SILVER][i],'none',8);
    word(g,x,460,s,33); word(g,x,512,['±1%','±2%','±5%','±10%'][i],39,GREEN,800);
    reveal(c,g,s);
  });
});
SCENES.L11=scene((c,p)=>{
  const r=resistor(p,500,229,1.18,[null,null,null,null]);
  reveal(c,pill(p,500,72,310,'220옴',GREEN,'#fff',46),'이백이십 옴');
  r.xs.forEach(x=>reveal(c,word(p,500+x*1.18,152,'?',45),'어떤 색'));
  palette(p,379);
  const count=word(p,500,553,'',46,HEAT,800);
  c.updates.push(t=>{const n=Math.ceil(c.dur-t); count.textContent=(n>0&&n<=3)?String(n):'';});
});
SCENES.L12=scene((c,p)=>{
  const r=resistor(p,500,229,1.18,[null,null,null,null]);
  ['빨강','빨강','갈색','금색'].forEach((s,i)=>{
    const at=cue(c,s,i===1?2:1), ring=r.rings[i];
    c.updates.push(t=>{set(ring,'fill',t>=at?[BANDS[2],BANDS[2],BANDS[1],GOLD][i]:'#f6ead0'); set(ring,'stroke-dasharray',t>=at?'none':'6 5');});
  });
  const n=word(p,500,385,'22',65,INK,800); reveal(c,n,'이십이를');
  const zero=cue(c,'영을 하나');
  c.updates.push(t=>{const value=t<zero?'22':'220'; if (n.textContent!==value) n.textContent=value;});
  reveal(c,pill(p,500,500,320,'220옴',GREEN,'#fff',48),'이백이십 옴');
  reveal(c,word(p,740,345,'±5%',41,MUTE),'금색은 오차');
});
SCENES.L13=scene((c,p)=>{
  heading(p,'5띠 저항'); const r=resistor(p,500,168,1.14,[BANDS[1],BANDS[0],BANDS[0],BANDS[1],BANDS[1]]);
  const xs=[236,360,481,607,780];
  ['1','0','0','× 10','±1%'].forEach((s,i)=>{
    const g=group(p), x=500+r.xs[i]*1.14; pen(g,`M${x} 239 L${xs[i]} 264`,WIRE,3);
    word(g,xs[i],314,s,39);
    const trigger=['갈색 검정','검정 검정','검정이면','넷째 갈색','다섯째 갈색'][i];
    reveal(c,g,trigger); flash(c,r.rings[i],trigger);
  });
  reveal(c,word(p,500,381,'100 × 10 = 1,000옴',45,GREEN,800),'천 옴이에요');
  const turned=resistor(p,355,478,.66);
  reveal(c,turned.g,'금색이나 은색');
  const at=cue(c,'오른쪽에 두세요');
  c.updates.push(t=>set(turned.body,'transform',`scale(${2*E.ease(E.prog(t,at,.65))-1} 1)`));
  const gap=group(p);
  pen(gap,'M378 529 H447 m-60 -6 l-10 6 10 6 m50 -12 l10 6 -10 6',GREEN,3);
  reveal(c,gap,'떨어진 띠도');
  const meter=group(p); box(meter,647,412,118,132,'#ecae47',INK,14,3);
  box(meter,664,428,84,34,'#d4e9d9'); oval(meter,706,501,22,22,INK);
  line(meter,706,500,714,487,'#fff',4);
  pen(meter,'M743 545 Q807 560 827 464',BANDS[2],5); pen(meter,'M672 545 Q628 563 605 484',INK,5);
  reveal(c,meter,'멀티미터로');
});
SCENES.L14=scene((c,p)=>{
  heading(p,'칩 저항'); const pcb=group(p);
  box(pcb,372,86,256,90,'#236854','#174c3d',12);
  for(const dx of [390,447,551,600]) pen(pcb,`M${dx} 94 v21 l16 12 v41`,'#86b39b',3);
  chip(pcb,500,130,.34);
  oval(p,687,128,32,9,'#f6e9c9','#b6a47e',2); word(p,771,139,'쌀알',31,MUTE);
  const zoom=cue(c,'아주 작은');
  c.updates.push(t=>set(pcb,'transform',`translate(500 130) scale(${1+.12*E.prog(t,zoom,.5)}) translate(-500 -130)`));
  const a=chip(p,270,278,.96,'103'), b=chip(p,730,278,.96,'100');
  reveal(c,a,'일영삼은'); reveal(c,b,'조심할 게');
  const warn=cue(c,'조심할 게');
  c.updates.push(t=>set(b,'transform',`translate(${730+6*Math.sin(Math.PI*4*E.prog(t,warn,.5))} 278) scale(.96)`));
  const zeros=cue(c,'영 세 개'), prefix=word(p,270,407,'10',43);
  reveal(c,prefix,'십 뒤에');
  c.updates.push(t=>{prefix.textContent='10'+(t>=zeros?' + '+Array(Math.min(3,1+Math.floor((t-zeros)/.18))).fill('0').join(' '):'');});
  reveal(c,pill(p,270,508,325,'10킬로옴',GREEN,'#fff',44),'십 킬로옴');
  const wrong=group(p); word(wrong,730,385,'100옴',41,MUTE);
  line(wrong,662,370,798,370,'#ba4541',5); reveal(c,wrong,'백 옴이 아니라');
  reveal(c,word(p,730,447,'10 + (0 없음)',34),'하나도 붙이지');
  reveal(c,pill(p,730,508,325,'10옴',GREEN,'#fff',44),'십 옴이에요');
});
function led(p,x,y,k=1) {
  const g=place(p,x,y,k);
  line(g,-13,15,-13,55,WIRE,5); line(g,13,15,13,47,WIRE,5);
  pen(g,'M-23 16 V-12 A23 23 0 0 1 23 -12 V16 Z','#aa4144',3,'#f36665');
  box(g,-29,13,58,10,'#b74446','none',3);
  return g;
}
SCENES.L15=scene((c,p)=>{
  heading(p,'표준값');
  const ring=group(p);
  [10,12,15,18,22,27,33,39,47,56,68,82].forEach((v,i)=>{
    const a=i*Math.PI/6-Math.PI/2,x=255+155*Math.cos(a),y=295+171*Math.sin(a);
    const n=group(ring);
    box(n,x-32,y-22,64,44,v===22?GREEN:MINT,'none',12);
    word(n,x,y+11,String(v),30,v===22?'#fff':GREEN,800);
    reveal(c,n,cue(c,'열두 개가')+i*.04);
  });
  reveal(c,word(p,255,311,'E12',56,GREEN,800),'이 십이');
  const rail=group(p);
  for(let i=0;i<5;i++) {
    const x=503+i*94;
    box(rail,x-43,245,86,81,'#fff','#abbbb4',10,2);
    word(rail,x,298,['100','120','150','180','220'][i],31);
  }
  line(rail,460,334,925,334,MUTE,6); reveal(c,rail,'이백 옴짜리를');
  const marker=pill(p,830,185,195,'200옴?', '#f7dfc4','#914b1a',35);
  const cueFirst=cue(c,'이백 옴이'), at=cue(c,'가장 가까운'), final=cue(c,'이백이십 옴을');
  c.updates.push(t=>{set(marker,'transform',`translate(${49*E.ease(E.prog(t,at,.5))} 0)`);alpha(marker,E.prog(t,cueFirst,.18)*(1-E.prog(t,final,.16)));});
  reveal(c,pill(p,879,185,172,'220옴',GREEN,'#fff',35),'이백이십 옴을');
  const little=group(p);
  pen(little,'M548 420 V387 H748 V457 H783 M801 451 V477 H548 V444',WIRE,4);
  line(little,535,420,561,420,INK,4); line(little,541,443,555,443,INK,4);
  resistor(little,645,387,.24,[BANDS[2],BANDS[2],BANDS[1],GOLD]);
  led(little,792,420,.67);
  word(little,670,542,'LED · 220옴',34,GREEN);
  reveal(c,little,'엘이디 예제');
});
SCENES.L16=scene((c,p)=>{
  const wh=heat(p,244,155,.62); reveal(c,wh,'열로 바꿔요');
  const hot=cue(c,'타거나'); c.updates.push(t=>{for(const a of wh.children) set(a,'stroke',t>=hot?'#d74635':HEAT);});
  for(const [i,x] of [244,500,766].entries()) {
    const g=group(p); resistor(g,x,208,[.31,.39,.48][i]); word(g,x,299,['1/4W','1/2W','1W'][i],41,INK,800);
    if(i) reveal(c,g,i===1?'이분의 일 와트':'견딜 수 있는 전력');
  }
  reveal(c,word(p,500,78,'1/4W = 0.25W',45,GREEN,800),'사분의 일 와트');
  [['LED 회로 · 220옴','0.04W',.16,GREEN,'영 점 영사'],['5V · 100옴','0.25W',1,'#ce5545','영 점 이오']].forEach(([name,v,ratio,col,w],i)=>{
    const cy=369+i*115,g=group(p);word(g,210,cy+13,name,32);
    box(g,406,cy-13,372,31,'#dae4df');
    const bar=box(g,406,cy-13,0,31,col);
    word(g,883,cy+13,v,37,col,800); reveal(c,g,w);
    const start=cue(c,w); c.updates.push(t=>set(bar,'width',372*ratio*E.ease(E.prog(t,start,.45))));
  });
});
function seriesParts(p,x,y,k=1) {
  const g=place(p,x,y,k);
  const a=resistor(g,-105,0,.36),b=resistor(g,105,0,.36);
  return {g,a,b};
}
function parallelParts(p,x,y,k=1) {
  const g=place(p,x,y,k); pen(g,'M-198 0 H-148 V-53 H148 V53 H-148 V0 M148 0 H198',WIRE,5);
  resistor(g,0,-53,.47); const lower=resistor(g,0,53,.47);
  for(const cx of [-148,148]) oval(g,cx,0,8,8,INK);
  return {g,lower};
}
SCENES.L17=scene((c,p)=>{
  heading(p,'직렬');
  const doors=group(p);
  box(doors,158,135,684,145,'#dfece4','#a4bbae',38);
  const a=turnstile(doors,364,208,56),b=turnstile(doors,647,208,56);
  const start=cue(c,'길어지는');
  for(const d of [a,b]) c.updates.push(t=>set(d,'transform',`rotate(${Math.max(0,t-start)*45})`));
  reveal(c,doors,'길어지는');
  const r=seriesParts(p,500,368,1.5), join=cue(c,'한 줄로');
  c.updates.push(t=>{const gap=55*(1-E.ease(E.prog(t,join,.7)));set(r.a.body,'transform',`translate(${-gap} 0)`);set(r.b.body,'transform',`translate(${gap} 0)`);});
  reveal(c,pill(p,500,510,785,'1킬로옴 + 1킬로옴 = 2킬로옴',GREEN,'#fff',39),'이 킬로옴이에요');
});
SCENES.L18=scene((c,p)=>{
  heading(p,'병렬'); const opened=cue(c,'하나 더 생기니');
  for(const [i,y] of [170,300].entries()){
    const lane=group(p); box(lane,62,y-54,370,108,'#e5f0e8','none',29);
    const rotor=turnstile(lane,296,y,46), walker=group(lane); person(walker,0,0,.67);
    c.updates.push(t=>{
      const dt=Math.max(0,t-opened),distance=(24+dt*57)%240;
      set(rotor,'transform',`rotate(${dt*52})`);
      set(walker,'transform',`translate(${128+distance} ${y})`);
      alpha(walker,Math.min(distance,240-distance)/20);
    });
    if(i) reveal(c,lane,'하나 더 생기니');
  }
  const branches=parallelParts(p,705,228,1.08), swap=cue(c,'이 킬로옴이면');
  c.updates.push(t=>set(branches.lower.rings[0],'fill',t>=swap?BANDS[2]:BANDS[1]));
  reveal(c,word(p,500,406,'1킬로옴 병렬 1킬로옴 = 500옴',36,GREEN,800),'오백 옴');
  reveal(c,word(p,500,464,'1킬로옴 병렬 2킬로옴 ≈ 667옴',36,GREEN,800),'육백육십칠 옴');
  const bars=group(p); word(bars,292,539,'가장 작은 1킬로옴보다 작아요',28);
  box(bars,565,504,303,14,'#77909a');box(bars,565,530,202,14,GREEN);reveal(c,bars,'가장 작은 저항');
});
SCENES.L19=scene((c,p)=>{
  const myth=group(p); pill(myth,500,64,485,'낮은 쪽으로만?',MINT,GREEN,40);
  reveal(c,myth,'낮은 쪽으로만');
  const strike=cue(c,'아니에요'); reveal(c,line(myth,334,62,666,62,'#c24739',5),strike);
  const sourceY=(302+475)/2, sourceTop=sourceY-9.5, sourceBottom=sourceY+9.5;
  pen(p,`M182 302 V207 H805 V370 H182 V302 H75 V${sourceTop} M75 ${sourceBottom} V475 H908 V302 H805`,WIRE,5);
  line(p,51,sourceTop,99,sourceTop,INK,5); line(p,61,sourceBottom,89,sourceBottom,INK,5);
  reveal(c,word(p,129,sourceY+39.5,'5V',30,GREEN),'같은 전압을');
  const b=cue(c,'낮은 쪽으로만'), on=cue(c,'같은 전압을');
  for(const [i,y] of [207,370].entries()) {
    resistor(p,488,y,.78,i?[BANDS[2],BANDS[0],BANDS[2],GOLD]:FOUR);
    reveal(c,word(p,370,y-61,i?'2킬로옴':'1킬로옴',36), i?'이 킬로옴을':'일 킬로옴과');
    reveal(c,pill(p,690,y-65,172,i?'2.5mA':'5mA',MINT,GREEN,35),i?'이 점 오 밀리':'오 밀리암페어');
    stream(c,p,[[182,302],[182,y],[805,y],[805,302]],i?7:14,{start:i?on:b,speed:65});
  }
  stream(c,p,[[805,302],[908,302],[908,475],[75,475],[75,sourceBottom]],17,{start:b,speed:65});
  stream(c,p,[[75,sourceTop],[75,302],[182,302]],3,{start:b,speed:65});
  reveal(c,word(p,620,547,'7.5mA',42,BLUE,800),'높은 쪽에도');
});
SCENES.L20=scene((c,p)=>{
  const pcb=group(p); box(pcb,350,45,300,136,'#357c84','#215a66',19,4);
  box(pcb,427,82,111,62,'#263e4b','none',5);box(pcb,337,82,56,61,'#b3c5c8','none',4);
  for(let i=0;i<12;i++){box(pcb,386+i*18,52,8,13,INK,'none',1);box(pcb,386+i*18,159,8,13,INK,'none',1);}
  const cues=['먼저 엘이디','전압 분배예요','풀업 풀다운'];
  for(const [i,x] of [174,500,826].entries()){
    const g=group(p); pen(g,`M500 181 V207 H${x} V241`,GREEN,4); panel(g,x-143,241,286,259);
    word(g,x,295,['LED 전류 제한','전압 분배','풀업·풀다운'][i],34,INK,800);
    if (i===0) {
      resistor(g,x-41,380,.22,[BANDS[2],BANDS[2],BANDS[1],GOLD]);
      led(g,x+74,343,.72);
      pen(g,`M${x+28} 380 H${x+65} V382 M${x+83} 377 V409 H${x-110} V401 M${x-110} 380 V389`,WIRE,3);
      line(g,x-122,389,x-98,389,INK,3); line(g,x-117,401,x-103,401,INK,3);
      word(g,x,472,'220~330옴',34,GREEN);
    }
    if (i===1) {
      // 빛을 받는 센서와 고정 저항의 접점에서 전압을 읽는다.
      resistor(g,x+61,356,.20);
      oval(g,x-65,356,28,25,'#f3d399','#946c44',3);
      pen(g,`M${x-82} 361 l7 -13 8 13 7 -13 8 13`,HEAT,3);
      pen(g,`M${x-110} 356 H${x-93} M${x-37} 356 H${x+1} M${x-9} 356 V393 h31`,WIRE,4);
      oval(g,x-9,356,5,5,BLUE);
      reveal(c,pill(g,x,456,206,'강의 있음',MINT,GREEN,28),'이미 강의가');
    }
    if(i===2){
      resistor(g,x-43,333,.22);
      pen(g,`M${x+27} 333 H${x+58} V373 H${x-34} M${x-87} 373 H${x-111} V400`,WIRE,4);
      box(g,x-87,358,53,30,'#374a57','none',7);box(g,x-76,346,31,17,'#bf594a','none',6);
      const digit=word(g,x+90,377,'0',31,BLUE,800), at=cue(c,'버튼을 누르지'), settle=cue(c,'흔들리지 않게');
      c.updates.push(t=>{digit.textContent=t>=settle?'1':String(Math.floor(Math.max(0,t-at)*5)%2);});
      reveal(c,pill(g,x,456,246,'버튼 강의에서',MINT,GREEN,28),'버튼 강의');
    }
    reveal(c,g,cues[i]);
  }
});
// 두 기기의 위치는 다음 장면에서도 같다. 막대는 저항을, 점의 밀도는 전류를 나타낸다.
function appliances(p) {
  const left=group(p),right=group(p);
  panel(left,52,116,430,340); panel(right,518,116,430,340);
  const toast=toaster(left,267,285,1.09); heater(right,733,272,1.09);
  word(left,267,174,'토스터',40,INK,800); word(right,733,174,'히터',40,INK,800);
  return {left,right,toast};
}
SCENES.L21=scene((c,p)=>{
  sample(p); const {right,toast}=appliances(p);
  reveal(c,right,'히터도'); const hot=cue(c,'빨갛게 달아오르는');
  c.updates.push(t=>set(toast.coil,'stroke',t<hot?'#8a7c74':'#ff7241'));
  reveal(c,pill(p,500,52,205,'220V',GREEN,'#fff',41),'이백이십 볼트');
  reveal(c,word(p,267,409,'1,000W · 48.4옴',43,GREEN,800),'사십팔 점 사 옴');
  reveal(c,word(p,733,409,'2,000W · 24.2옴',43,GREEN,800),'이십사 점 이 옴');
  const at=cue(c,'오히려 절반');
  [267,733].forEach((x,i)=>{
    reveal(c,box(p,x-173,500,346,38,'#dce8e2','none',12),at);
    const bar=box(p,x-173,500,0,38,GREEN,'none',12);
    c.updates.push(t=>set(bar,'width',(i?173:346)*E.ease(E.prog(t,at,.6))));
  });
});
SCENES.L22=scene((c,p)=>{
  sample(p); appliances(p); pill(p,500,52,205,'220V',GREEN,'#fff',41);
  const lock=group(p);box(lock,631,45,44,34,GREEN,'none',7);pen(lock,'M638 45 V36 A15 15 0 0 1 668 36 V45',GREEN,6);
  reveal(c,lock,'정해져 있어요');
  const start=cue(c,'전류가 많이');
  for(const [i,x] of [267,733].entries()){
    const pts=[[x-136,304],[x-160,304],[x-160,348],[x+160,348],[x+160,304],[x+134,304]];
    pen(p,`M${x-136} 304 h-24 v44 h320 v-44 h-26`,WIRE,5);
    stream(c,p,pts,i?16:8,{start,speed:i?110:70});
    reveal(c,word(p,x,423,i?'약 9.1A':'약 4.5A',45,BLUE,800),i?'구 점 일 암페어':'사 점 오 암페어');
    const rays=heat(p,x+(i?150:144),246,i?.78:.36);
    reveal(c,rays,'열도 커지는');
  }
  reveal(c,pill(p,500,528,916,'저항이 크면 열이 많다 → 전류가 같을 때만',MINT,GREEN,c.long?36:39),'전류가 정해져');
});
SCENES.L23=scene((c,p)=>{
  sample(p); const f=fuse(p,500,166,1.25);
  const warm=cue(c,'열이 나요'), melt=cue(c,'금방 녹아요'), zoom=cue(c,'가는 금속선이에요');
  c.updates.push(t=>{
    set(f.g,'transform',`translate(500 166) scale(${1.05+.20*E.ease(E.prog(t,zoom,.6))})`);
    set(f.wire,'stroke',t>=warm?HEAT:'#987858');
    set(f.wire,'d',t<melt?'M-138 0 Q-64 -13 0 0 T138 0':'M-138 0 Q-63 -14 -15 5 M15 8 Q67 17 138 0');
  });
  stream(c,f.g,[[-224,0],[224,0]],13,{stop:melt,r:3});
  reveal(c,word(p,500,76,'퓨즈선 · 0.01옴',37,INK,800),'영 점 영일 옴');
  const base=475;
  ['5A · 0.25W','10A · 1W','20A · 4W'].forEach((v,i)=>{
    const g=group(p),x=218+i*282,h=[13,52,208][i],start=cue(c,['오 암페어일','십 암페어일','네 배가'][i]);
    const bar=box(g,x-65,base,130,0,[GOLD,HEAT,'#c84436'][i],'none',3);
    c.updates.push(t=>{const k=E.ease(E.prog(t,start,.5));set(bar,'height',h*k);set(bar,'y',base-h*k);});
    word(g,x,539,v,39,INK,800); reveal(c,g,start);
  });
});
function rearGlass(p,x,y,k=1) {
  const g=place(p,x,y,k);
  const shape='M-286 -109 Q0 -148 286 -109 L337 113 Q0 153 -337 113 Z';
  pen(g,shape,'#4e6973',10,'#b3cbd1');
  for(const xx of [-236,236]) line(g,xx,-92,xx,97,'#566c71',11);
  const wires=[];
  for(let i=0;i<5;i++) {
    const yy=-76+i*39;
    const fog=box(g,-229,yy-16,458,32,'#d9e4e5','none',13);
    const wire=pen(g,`M-236 ${yy} H236`,'#7e6d62',4);
    wires.push({wire,fog,yy});
  }
  return {g,wires};
}
SCENES.L24=scene((c,p)=>{
  sample(p,'12V · 예시 값'); const glass=rearGlass(p,500,255,1.18);
  const frost=group(glass.g);
  for (let x=-190;x<=190;x+=95) {
    pen(frost,`M${x-17} 11 l28 -19 m-12 19 l17 -12`,'#f8fcfc',3);
  }
  const on=cue(c,'버튼을 누르면'),clear=cue(c,'김이나 성에가'), branches=cue(c,'병렬로');
  const scratch=cue(c,'긁혀 끊어지면'),out=cue(c,'그 줄에만'),mist=cue(c,'김이 남고');
  c.updates.push(t=>alpha(frost,1-E.prog(t,clear,.8)+E.prog(t,mist,.8)));
  glass.wires.forEach(({wire,fog,yy},i)=>{
    const middle=i===2;
    stream(c,glass.g,[[-236,yy],[236,yy]],12,{start:branches,stop:middle?out:Infinity,r:3.8});
    c.updates.push(t=>{
      alpha(fog,.93*(1-E.prog(t,clear+i*.08,.95))+(middle?.97*E.prog(t,mist,.8):0));
      set(wire,'stroke',t>=on&&(!middle||t<out)?HEAT:'#806e64');
      set(wire,'d',middle&&t>=scratch?`M-236 ${yy} H-12 M12 ${yy} H236`:`M-236 ${yy} H236`);
    });
  });
  const compare=cue(c,'직렬로 이었다면');
  for(const [i,x] of [288,712].entries()){
    const g=group(p),mini=rearGlass(g,x,469,.28);
    mini.wires.forEach(({fog,wire},j)=>{alpha(fog,0);set(wire,'stroke',i||j===2?'#7e8a8f':HEAT);});
    word(g,x,555,i?'직렬 · 전부 꺼짐':'병렬 · 한 줄만 꺼짐',39,i?MUTE:GREEN,800);
    reveal(c,g,i?compare:cue(c,'나머지 줄은'));
  }
});
function dryer(p,x,y) {
  const g=place(p,x,y); pen(g,'M0 11 l-11 51 24 4 15 -51','#445866',3,'#839aa4');
  pen(g,'M-62 -19 L-18 -24 Q15 -53 48 -29 Q74 -4 47 19 Q21 35 -16 13 L-62 9 Z',INK,3,'#86aab4');
  oval(g,30,-6,18,18,'#496974'); return g;
}
function kettle(p,x,y) {
  const g=place(p,x,y); pen(g,'M34 -20 Q85 -31 67 11 Q58 28 39 27',INK,8);
  pen(g,'M-34 -30 L20 -30 Q41 -4 43 34 Q4 52 -46 34 L-40 -7 -58 -24 -32 -13 Z',INK,3,'#87aaa7');
  box(g,-31,-39,52,11,'#45696b','none',5);return g;
}
SCENES.L25=scene((c,p)=>{
  sample(p); const strip=powerstrip(p,500,322,1.45);
  const tag=group(p);
  for(const i of [0,1,2,3]) word(tag,500+strip.sockets[i]*1.45,452,'220V',33,GREEN,800);
  reveal(c,tag,'이백이십 볼트');
  for(const [i,x] of [344,660].entries()){
    const g=group(p); if(i) kettle(g,x,154); else dryer(g,x,154);
    const pin=500+strip.sockets[i?3:0]*1.45;
    pen(g,`M${x} ${i?195:214} Q${x} 233 ${pin} 247 V262`,WIRE,6); plug(g,pin,323);
    word(g,x,81,i?'약 8.2A':'약 6.8A',37,BLUE,800);
    reveal(c,g,i?'전기 포트':'헤어드라이어');
  }
  stream(c,p,[[213,322],[103,322],[84,342],[84,411]],7,{start:cue(c,'십오 암페어'),r:7});
  reveal(c,pill(p,153,502,170,'15A',GREEN,'#fff',36),'십오 암페어');
  const rating=group(p);
  box(rating,816,413,134,60,'#fff7ee',HEAT,14,2);
  word(rating,883,454,'정격',32,INK,800);
  pen(rating,'M816 443 H799 V370 H779',HEAT,3);
  oval(rating,779,370,3.5,3.5,HEAT);
  reveal(c,rating,'정격을');
});
SCENES.L26=scene((c,p)=>{
  const gate=group(p);turnstile(gate,220,88,45);word(gate,547,104,'일부러 만든 좁은 길',45,INK,800);
  const cells=palette(p,214);cells.forEach((n,i)=>reveal(c,n,NAMES.slice(i)));
  // 남색 칸은 무지개에서만 잠깐 보이고, 숫자표의 순번에는 넣지 않는다.
  const indigo=group(p);box(indigo,632,146,79,65,'#364480');word(indigo,672,191,'남',38,'#fff',800);
  const t0=cue(c,'무지개에서'),t1=cue(c,'남색만');
  c.updates.push(t=>{alpha(indigo,E.prog(t,t0,.14)*(1-E.prog(t,t1,.47)));set(indigo,'transform',`translate(0 ${-58*E.prog(t,t1,.47)})`);});
  reveal(c,word(p,500,373,'4띠 · 숫자 · 숫자 · 곱하기 · 오차',39,GREEN,800),'네 띠는');
  ['E12 표준값','1/4W','직렬 +','병렬 · 작아져요'].forEach((s,i)=>reveal(c,pill(p,139+i*237,443,i===3?257:204,s,MINT,GREEN,30),
    ['표준값','견디는 열','직렬은','병렬은'][i]));
  reveal(c,pill(p,500,534,752,'저항: 색띠 읽고 고르고 합치기',GREEN,'#fff',37),'블로그 글');
});
SCENES.S1A=scene((c,p)=>{
  resistor(p,500,143,1.28);
  palette(p,376).forEach((n,i)=>reveal(c,n,['검정 영','갈색 일','빨강 이','흰색 구'][Math.min(3,i)]));
});
SCENES.S1E=scene((c,p)=>{
  const g=chip(p,500,237,1.95,'? ? ?'),at=cue(c,'아주 작은');
  c.updates.push(t=>set(g,'transform',`translate(500 237) scale(${1.55+.4*E.ease(E.prog(t,at,.6))})`));
  reveal(c,word(p,500,470,'?',92,GREEN,800),'어떻게 읽을까요');
});
SCENES.S2A=scene((c,p)=>{
  resistor(p,500,165,.91);
  reveal(c,heat(p,500,113,.75),'열이 나요');
  const g=group(p);toaster(g,280,414,1.15);heater(g,726,410,1.15);reveal(c,g,'토스터와');
  reveal(c,word(p,726,283,'?',70,GREEN,800),'저항이 더 클까요');
});
SCENES.S2E=scene((c,p)=>{
  const f=fuse(p,500,256,1.75),at=cue(c,'스스로 끊어져서');
  c.updates.push(t=>set(f.wire,'stroke',t>=at?HEAT:WIRE));
  reveal(c,word(p,500,479,'?',92,GREEN,800),'무엇일까요');
});
SCENES.S3A=scene((c,p)=>{
  heading(p,'전기 부품'); panel(p,42,95,434,389); panel(p,524,95,434,389);
  const a=group(p);seriesParts(a,259,257,.9);word(a,259,425,'직렬',56,GREEN,800);
  const b=group(p);parallelParts(b,741,257,.91);word(b,741,425,'병렬',56,GREEN,800);
  reveal(c,a,'한 줄로');reveal(c,b,'나란히');
});
SCENES.S3E=scene((c,p)=>{
  const strip=powerstrip(p,574,292,1.55),start=cue(c,'여러 개 꽂으면');
  strip.sockets.forEach((x,i)=>{
    const g=plug(strip.g,x,0);
    c.updates.push(t=>{const u=E.prog(t,start+i*.28,.3);alpha(g,u);set(g,'transform',`translate(${x} ${-26*(1-E.ease(u))})`);});
  });
  reveal(c,word(p,190,234,'?',76,GREEN,800),'어떻게 될까요');
});
// 마지막 두 판은 render.py가 내레이션의 구독/팔로우 시각에 끝 카드를 그린다.
for (const id of ['S1C','S1D','S2C','S2D','S3C','S3D']) SCENES[id]=scene(()=>{});
