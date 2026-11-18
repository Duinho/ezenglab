// 선형 회귀 개념편. 장면표 고정: 대사·숫자·장면 순서를 바꾸지 않는다.
// 그래프 데이터는 원고 l1~l9, l_rotate의 좌표. 화면은 시각만으로 결정한다.
const AI={green:'#14936a',blue:'#3b6fb6',red:'#d24a5a',orange:'#e0701b',ink:'#14213d',sub:'#445066',line:'#cfd8e3'};
const ICE=[[20,55],[22,55],[25,76],[28,79],[30,95]];
const BIKE=[[.5,7.5],[1,15.5],[2,29.5],[2.5,38]];
const WEEKDAY=[[18,45],[22,55],[25,66],[26,71],[30,93],[31,93]];
const WEEKEND=[[20,61],[21,65],[24,79],[28,100],[29,99],[32,114]];
function norm130(s){return s.replace(/[^0-9A-Za-z가-힣]/g,'').toLowerCase();}
function cue130(c,phrase,n=1){
 const goal=norm130(phrase);for(let i=0;i<c.words.length;i++){
  let s='';for(let j=i;j<c.words.length&&s.length<goal.length;j++)s+=norm130(c.words[j].text);
  if(s.startsWith(goal)&&--n===0)return Math.max(0,c.words[i].start-.12);
 }throw Error('장면 단어 없음: '+phrase);
}
function txt130(p,x,y,text,size=36,color=AI.ink,anchor='middle'){
 const t=el('text',{x,y,'font-size':size,'font-weight':600,fill:color,'text-anchor':anchor},p);
 if(!text.includes('²')){t.textContent=text;return t;}
 const [before,after]=text.split('²');t.textContent=before;const bw=t.getComputedTextLength();t.textContent=after;const aw=t.getComputedTextLength(),gap=size*.48,total=bw+gap+aw,left=anchor==='middle'?x-total/2:anchor==='end'?x-total:x;
 const g=group130(p);g.appendChild(t);t.setAttribute('x',left);t.setAttribute('text-anchor','start');t.textContent=before;el('tspan',{dx:gap,text:after},t);
 const k=size*.42/100;el('path',{d:'M 8 30 C 8 -4 92 -4 92 30 C 92 52 38 61 8 94 L 92 94',fill:'none',stroke:color,'stroke-width':15,'stroke-linecap':'round','stroke-linejoin':'round',transform:`translate(${left+bw+size*.05} ${y-size*.97}) scale(${k})`,'data-symbol':'superscript-two'},g);return g;
}
function line130(p,x1,y1,x2,y2,color=AI.line,width=4,dash=''){
 return el('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,...(dash?{'stroke-dasharray':dash}:{})},p);
}
function box130(p,x,y,w,h,fill='#fff',stroke=AI.line){return el('rect',{x,y,width:w,height:h,rx:22,fill,stroke,'stroke-width':4},p);}
function group130(p){return el('g',{},p);}
function label130(p,x,y,w,text,color=AI.green,size=38){const g=group130(p);box130(g,x,y,w,76,'#fff',color);txt130(g,x+w/2,y+51,text,size,color);return g;}
function root130(c,title){
 const w=c.long?1600:860,h=c.long?760:680;
 const s=el('svg',{class:'abs ai130',width:w,height:h,viewBox:`0 0 ${w} ${h}`,style:{left:c.long?'160px':'0px',top:c.long?'100px':'0px'}},c.stage);
 box130(s,10,10,w-20,h-20,'#fff');s.titleNode=txt130(s,w/2,c.long?76:78,title,c.long?50:42,AI.green);return s;
}
function scene130(title,draw){return {init(c){this.u=[];let s=root130(c,title);const add=(node,phrase,n=1)=>{const at=phrase?cue130(c,phrase,n):0;this.u.push(t=>node.style.opacity=E.prog(t,at,.18));return node;};draw(c,s,add,this.u);},frame(c,t){this.u.forEach(f=>f(t));}};}
function graph130(p,x,y,w,h,opt={}){
 const g=group130(p),xmin=opt.xmin??18,xmax=opt.xmax??32,ymin=opt.ymin??40,ymax=opt.ymax??110;
 const X=v=>x+(v-xmin)/(xmax-xmin)*w,Y=v=>y+h-(v-ymin)/(ymax-ymin)*h;
 el('rect',{x,y,width:w,height:h,rx:12,fill:'#e0ede7'},g);
 const xt=opt.xt??[20,25,30],yt=opt.yt??[55,80,100];
 xt.forEach(v=>{line130(g,X(v),y,X(v),y+h,'#c5dacf',2).setAttribute('class','grid');txt130(g,X(v),y+h+45,String(v),34,AI.sub);});
 yt.forEach(v=>{line130(g,x,Y(v),x+w,Y(v),'#c5dacf',2).setAttribute('class','grid');txt130(g,x-(w>800?40:22),Y(v)+11,String(v),34,AI.sub,'end');});
 line130(g,x,y,x,y+h,AI.sub,4);line130(g,x,y+h,x+w,y+h,AI.sub,4);
 txt130(g,x+w/2,y+h+94,opt.xlabel??'기온(°C)',36);txt130(g,x+6,y-27,opt.ylabel??'판매량(개)',36,AI.sub,'start');
 let clip='clip130_'+(++graph130.serial);const d=el('defs',{},g),cl=el('clipPath',{id:clip},d);el('rect',{x:x-1,y:y-1,width:w+2,height:h+2},cl);
 const plot=el('g',{'clip-path':`url(#${clip})`},g);
 return {g,plot,X,Y,x,y,w,h,xmin,xmax,ymin,ymax};
}graph130.serial=0;
function dot130(gr,x,y,color=AI.blue,r=10){return el('circle',{cx:gr.X(x),cy:gr.Y(y),r,fill:color,stroke:'#fff','stroke-width':3},gr.plot);}
function points130(gr,data=ICE,color=AI.blue){return data.map(p=>dot130(gr,...p,color));}
function fit130(gr,m=4,b=-28,color=AI.green,width=7){return line130(gr.plot,gr.X(gr.xmin),gr.Y(m*gr.xmin+b),gr.X(gr.xmax),gr.Y(m*gr.xmax+b),color,width);}
function trace130(node,t,start,dur=1){const p=E.prog(t,start,dur),len=node.getTotalLength();node.setAttribute('stroke-dasharray',len);node.setAttribute('stroke-dashoffset',len*(1-p));node.style.opacity=p>0?1:0;}
function residual130(gr,m=4,b=-28){return ICE.map(([x,y])=>line130(gr.plot,gr.X(x),gr.Y(y),gr.X(x),gr.Y(m*x+b),AI.red,8));}
function prediction130(gr,x,y){const g=group130(gr.g);line130(g,gr.X(x),gr.Y(gr.ymin),gr.X(x),gr.Y(y),AI.orange,4,'10 8');line130(g,gr.X(gr.xmin),gr.Y(y),gr.X(x),gr.Y(y),AI.orange,4,'10 8');el('circle',{cx:gr.X(x),cy:gr.Y(y),r:12,fill:AI.orange,stroke:'#fff','stroke-width':4},g);return g;}
function star130(p,x,y,r=20){let pts=[];for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pts.push(`${x+Math.cos(a)*rr},${y+Math.sin(a)*rr}`);}return el('polygon',{points:pts.join(' '),fill:AI.orange,stroke:'#fff','stroke-width':3},p);}
function ice130(p,x,y,k=1){const g=el('g',{transform:`translate(${x} ${y}) scale(${k})`},p);el('path',{d:'M -42 0 L 42 0 L 0 100 Z',fill:'#e9b577',stroke:'#ba8248','stroke-width':4},g);el('path',{d:'M -55 0 Q -65 -54 -27 -65 Q -16 -108 20 -75 Q 66 -78 55 0 Z',fill:'#facbd5',stroke:AI.red,'stroke-width':4},g);return g;}
function shop130(p,x,y,k=1){const g=el('g',{transform:`translate(${x} ${y}) scale(${k})`},p);box130(g,0,0,370,245,'#e0ede7',AI.green);el('path',{d:'M 0 0 L 370 0 L 340 -50 L 30 -50 Z',fill:AI.green},g);for(let i=0;i<4;i++)ice130(g,58+i*85,90,.55);line130(g,10,190,360,190,AI.green,8);return g;}
function sun130(p,x,y,r=43){const g=group130(p);el('circle',{cx:x,cy:y,r,fill:'#f4c35a',stroke:AI.orange,'stroke-width':5},g);for(let i=0;i<8;i++){let a=i*Math.PI/4;line130(g,x+Math.cos(a)*(r+12),y+Math.sin(a)*(r+12),x+Math.cos(a)*(r+30),y+Math.sin(a)*(r+30),AI.orange,6);}return g;}
function tube130(p,x,y,r=55){const g=group130(p);el('circle',{cx:x,cy:y,r,fill:'#fff',stroke:AI.red,'stroke-width':24},g);el('circle',{cx:x,cy:y,r:r-17,fill:'#dcebf4'},g);return g;}
function umbrella130(p,x,y,k=1){const g=el('g',{transform:`translate(${x} ${y}) scale(${k})`},p);el('path',{d:'M -45 0 Q 0 -65 45 0 Q 23 -15 0 0 Q -23 -15 -45 0 M 0 0 V 50 Q -2 74 -22 52',fill:'#eac4d0',stroke:AI.red,'stroke-width':6},g);return g;}
function standardGraph130(c,s,opt={}){return graph130(s,c.long?120:125,c.long?190:175,c.long?960:610,c.long?(opt.compact?335:390):260,opt);}
function side130(c,s,add,text,phrase,color=AI.green,row=0){return add(label130(s,c.long?1140:70,c.long?205+row*140:570,c.long?400:720,text,color,c.long?38:36),phrase);}
function step130(gr,x,y,dx,dy){const g=group130(gr.g);line130(g,gr.X(x),gr.Y(y),gr.X(x+dx),gr.Y(y),AI.orange,6);line130(g,gr.X(x+dx),gr.Y(y),gr.X(x+dx),gr.Y(y+dy),AI.orange,6);return g;}
function bowl130(s,x,y,w,h){const gr=graph130(s,x,y,w,h,{xmin:1,xmax:7,ymin:0,ymax:750,xt:[2,4,6],yt:[],xlabel:'기울기',ylabel:'오차 제곱합'});const P=m=>84+68*(m-4)**2;const a=[];for(let m=1;m<=7.001;m+=.06)a.push([gr.X(m),gr.Y(P(m))]);const curve=el('polyline',{points:a.map(v=>v.join(',')).join(' '),fill:'none',stroke:AI.green,'stroke-width':7},gr.plot);return {...gr,P,curve};}
function fruit130(p,x,y,orange=false,k=1){const g=el('g',{transform:`translate(${x} ${y}) scale(${k})`},p);el('path',{d:orange?'M 0 -50 C 70 -50 75 60 0 62 C -75 60 -70 -50 0 -50':'M 0 -40 C -90 -85 -105 55 -25 75 Q 0 57 25 75 C 105 55 90 -85 0 -40',fill:orange?AI.orange:AI.red},g);line130(g,0,-44,7,-75,AI.ink,7);el('ellipse',{cx:26,cy:-64,rx:25,ry:11,fill:AI.green,transform:'rotate(-24 26 -64)'},g);return g;}
const SCENES={L02:INTRO,L26:OUTRO};
SCENES.L01=scene130('선형 회귀 개념편',(c,s,a,u)=>{
 a(s.titleNode,'선형 회귀를');let store=shop130(s,c.long?210:235,c.long?310:270,c.long?1.3:1);a(store);
 const thermo=group130(s);box130(thermo,c.long?820:100,180,40,250,'#fff',AI.red);let mercury=el('rect',{x:c.long?832:112,y:380,width:16,height:30,rx:8,fill:AI.red},thermo);a(thermo);const start=cue130(c,'이십칠');u.push(t=>{let h=35+155*E.prog(t,start,.7);mercury.setAttribute('y',420-h);mercury.setAttribute('height',h);});
 a(label130(s,c.long?930:160,c.long?215:110,c.long?500:540,'내일 27°C',AI.red),'이십칠');a(txt130(s,c.long?1170:430,c.long?485:440,'?',135,AI.orange),'몇 개를');
 const gr=graph130(s,c.long?970:140,c.long?510:340,c.long?450:580,c.long?150:165,{xt:[],yt:[],xlabel:'',ylabel:''});a(gr.g,'직선 하나를');points130(gr);const ln=fit130(gr);u.push(t=>trace130(ln,t,cue130(c,'직선 하나를'),1));
 u.push(t=>store.style.opacity=1-E.prog(t,cue130(c,'직선 하나를'),.5));
});
SCENES.L03=scene130('먼저 한 줄로',(c,s,a,u)=>{
 const gr=graph130(s,340,180,900,430);points130(gr);const ln=fit130(gr);u.push(t=>{let k=E.prog(t,cue130(c,'가장 잘 지나는 직선을'),.8);ln.setAttribute('transform',`translate(0 ${-80*(1-k)})`);ln.style.opacity=k;gr.g.style.opacity=1-E.prog(t,cue130(c,'케이엔엔'),.25);});a(prediction130(gr,27,80),'새 값의');
 const left=group130(s);box130(left,90,170,650,480,'#e7eef8',AI.blue);txt130(left,415,250,'kNN · 종류',54,AI.blue);fruit130(left,300,400,false,.8);fruit130(left,520,400,true,.8);txt130(left,415,585,'귤',64,AI.orange);a(left,'케이엔엔');
 const right=group130(s);box130(right,850,170,650,480,'#e0ede7',AI.green);txt130(right,1175,250,'선형 회귀 · 숫자',46,AI.green);const rg=graph130(right,980,325,390,150,{xt:[],yt:[],xlabel:'',ylabel:''});points130(rg);fit130(rg);txt130(right,1175,585,'약 80개',64,AI.green);a(right,'케이엔엔');
});
SCENES.L04=scene130('자전거 기록',(c,s,a,u)=>{
 const gr=standardGraph130(c,s,{xmin:0,xmax:3,ymin:0,ymax:44,xt:[0,1,2,3],yt:[0,20,40],xlabel:'탄 시간(시간)',ylabel:'간 거리(km)'});
 const cue=['삼십 분','한 시간에','두 시간에는','두 시간 삼십 분'];
 BIKE.forEach(([x,y],i)=>{a(dot130(gr,x,y),cue[i]);let dx=0,dy=i===2?52:-40;const node=txt130(gr.g,gr.X(x)+dx,gr.Y(y)+dy,`${y}km`,c.long?36:34,AI.blue,'middle');a(node,cue[i]);});
 const pred=group130(gr.g);line130(pred,gr.X(1.5),gr.Y(0),gr.X(1.5),gr.Y(30),AI.orange,4,'10 8');txt130(pred,gr.X(1.5),gr.Y(30)-28,'?',68,AI.orange);a(pred,'한 시간 삼십 분');
 if(c.long)side130(c,s,a,'1시간 30분 = ?', '한 시간 삼십 분',AI.orange);
 let count=txt130(s,c.long?1335:430,c.long?565:628,'3',76,AI.orange);u.push(t=>{const q=E.prog(t,c.audioDur-1,3);count.textContent=String(Math.max(1,3-Math.floor(q*3)));count.style.opacity=t>=c.audioDur-1?1:0;});
});
SCENES.L05=scene130('직선을 긋고 읽어요',(c,s,a,u)=>{
 const gr=standardGraph130(c,s,{xmin:0,xmax:3,ymin:0,ymax:44,xt:[0,1,2,3],yt:[0,20,40],xlabel:'탄 시간(시간)',ylabel:'간 거리(km)'});points130(gr,BIKE);const ln=fit130(gr,15,.125);u.push(t=>trace130(ln,t,cue130(c,'직선을 긋고'),.8));a(prediction130(gr,1.5,22.6),'자리를 읽으면');
 side130(c,s,a,'약 22.6km',null,AI.green);if(c.long)side130(c,s,a,'1시간에 15km씩','십오 킬로미터씩',AI.orange,1);else a(txt130(gr.g,580,399,'1시간에 15km씩',34,AI.orange),'십오 킬로미터씩');
 a(step130(gr,1,15.05,1,15),'십오 킬로미터씩');
});
SCENES.L06=scene130('아이스크림은 한 줄로 안 서요',(c,s,a,u)=>{
 const gr=standardGraph130(c,s);ICE.forEach(([x,y],i)=>{let node=dot130(gr,x,y);const st=cue130(c,'닷새 동안')+i*.12;u.push(t=>node.style.opacity=E.prog(t,st,.15));});
 a(line130(gr.g,gr.X(20),gr.Y(55),gr.X(22),gr.Y(55),AI.orange,5,'7 6'),'똑같이');
 const ln=fit130(gr,4,-28);const st=cue130(c,'모든 점을');u.push(t=>{let m=4+Math.sin(Math.min(3*Math.PI,Math.max(0,t-st)*1.5));ln.setAttribute('y1',gr.Y(72+m*(gr.xmin-25)));ln.setAttribute('y2',gr.Y(72+m*(gr.xmax-25)));ln.style.opacity=t>=st?1:0;});side130(c,s,a,'어디에 그을까?','기준이',AI.orange);
});
SCENES.L07=scene130('분류와 회귀',(c,s,a,u)=>{
 [[110,'분류','종류를 맞혀요','kNN','답: 귤',AI.blue],[850,'회귀','숫자를 맞혀요','선형 회귀','답: 약 80개',AI.green]].forEach(([x,t,desc,model,answer,col],i)=>{const g=group130(s);box130(g,x,170,640,410,i?'#e0ede7':'#e7eef8',col);txt130(g,x+320,250,t,62,col);txt130(g,x+320,340,desc,44);txt130(g,x+320,435,model,50,col);txt130(g,x+320,530,answer,52);const at=cue130(c,i?'회귀예요':'분류예요');u.push(t=>{const q=E.prog(t,at,.18);g.style.opacity=.35+.65*q;g.style.filter=`grayscale(${1-q})`;});});a(label130(s,140,630,1320,'지도 학습 = 정답이 붙은 데이터로 배워요',AI.green,44),'지도 학습이에요');
});
SCENES.L08=scene130('직선은 두 가지로 정해져요',(c,s,a,u)=>{
 const gr=standardGraph130(c,s,{xmin:0,xmax:3,ymin:0,ymax:48,xt:[1,2,3],yt:[0,15,30,45],xlabel:'탄 시간(시간)',ylabel:'간 거리(km)'});points130(gr,BIKE);const fit=fit130(gr,15,.125),wiggleAt=cue130(c,'얼마나 기울었는지');u.push(t=>{const q=E.prog(t,wiggleAt,1),m=15+Math.sin(q*Math.PI*2)*.7;fit.setAttribute('y1',gr.Y(.125));fit.setAttribute('y2',gr.Y(m*3+.125));});a(step130(gr,1,15,1,15),'십오 킬로미터씩');a(step130(gr,0,0,1,15),'십오 킬로미터씩');a(el('circle',{cx:gr.X(0),cy:gr.Y(0),r:19,fill:'none',stroke:AI.orange,'stroke-width':5},gr.g),'영 시간');side130(c,s,a,'기울기: 15km씩','기울기예요');side130(c,s,a,'절편 ≈ 0km','절편이에요',AI.orange,1);
});
SCENES.L09=scene130('아이스크림 직선 읽기',(c,s,a)=>{
 const gr=standardGraph130(c,s,{xmin:0,xmax:33,ymin:-40,ymax:110,xt:[0,20,27,30],yt:[-28,55,80,100]});points130(gr);fit130(gr);a(step130(gr,24,68,1,4),'네 개씩');a(line130(gr.g,gr.X(0),gr.Y(-28),gr.X(20),gr.Y(52),AI.sub,5,'10 8'),'마이너스 이십팔');a(txt130(gr.g,gr.X(0)+300,gr.Y(-28)-25,'절편 -28?',36,AI.orange),'없죠');a(prediction130(gr,27,80),'이십칠 도를');side130(c,s,a,'기울기 4','네 개씩');side130(c,s,a,'4 × 27 - 28 = 80','여든 개가',AI.green,1);a(shop130(s,1160,540,.72),'처음 질문의');
});
SCENES.L10=scene130('직선과 점 사이의 거리',(c,s,a,u)=>{
 [3,4,5].forEach((m,i)=>{const gr=graph130(s,100+i*500,250,390,280,{xt:[20,30],yt:[],xmin:18,xmax:32,ymin:35,ymax:110}),at=cue130(c,'세 개를');u.push(t=>{const q=E.prog(t,at,.18);gr.g.style.opacity=.35+.65*q;gr.g.style.filter=`grayscale(${1-q})`;});points130(gr);fit130(gr,m,72-25*m);residual130(gr,m,72-25*m).forEach(n=>{const from=+n.getAttribute('y1'),to=+n.getAttribute('y2'),at=cue130(c,'빨간 막대는');a(n,'빨간 막대는');u.push(t=>n.setAttribute('y2',E.lerp(from,to,E.prog(t,at,.7))));});txt130(gr.g,295+i*500,140,['A 완만','B 가운데','C 가파름'][i],42,i===1?AI.green:AI.sub);if(i===1)a(el('rect',{x:560,y:180,width:465,height:470,rx:24,fill:'none',stroke:AI.green,'stroke-width':8},s),'가장 짧아요');});a(label130(s,470,660,660,'오차',AI.red,44),'이 차이를');
});
SCENES.L11=scene130('오차를 제곱해서 더해요',(c,s,a,u)=>{
 const concept=group130(s),plus=group130(concept),minus=group130(concept);
 box130(plus,290,240,90,210,'#cfe5da',AI.green);txt130(plus,335,200,'+',64,AI.green);box130(minus,680,240,90,210,'#f7dce1',AI.red);txt130(minus,725,200,'-',64,AI.red);a(plus,'플러스');a(minus,'마이너스라서');
 const st=cue130(c,'서로 지워지거든요');u.push(t=>{let k=E.prog(t,st,.8);plus.setAttribute('transform',`translate(${k*195} 0)`);minus.setAttribute('transform',`translate(${-k*195} 0)`);plus.style.opacity=Math.min(E.prog(t,cue130(c,'플러스'),.2),1-k);minus.style.opacity=Math.min(E.prog(t,cue130(c,'마이너스라서'),.2),1-k);});a(txt130(concept,540,350,'0',90,AI.sub),'서로 지워지거든요');
 const beam=group130(concept);line130(beam,170,475,900,475,AI.sub,8);el('polygon',{points:'535,490 495,550 575,550',fill:AI.sub},beam);a(beam,'그냥 더하면');
 const sq=group130(concept);[85,140,105].forEach((size,i)=>{let node=box130(sq,1050+i*155,300,size,size,'#f2c6cf',AI.red);const start=cue130(c,'제곱해서');u.push(t=>{let k=E.prog(t,start,.8);node.setAttribute('height',Math.max(2,size*k));node.setAttribute('transform',`translate(${E.prog(t,cue130(c,'뒤 더해요'),.8)*(-50+25*i)} ${E.prog(t,cue130(c,'뒤 더해요'),.8)*(200-size)})`);});});a(sq,'제곱해서');a(label130(concept,1000,160,500,'최소제곱법',AI.green,48),'최소제곱법이라고');
 const compareAt=cue130(c,'그림에서는');u.push(t=>concept.style.opacity=1-E.prog(t,compareAt,.22));
 const comparison=group130(s);[3,4,5].forEach((slope,i)=>{const gr=graph130(comparison,100+i*500,290,390,210,{xt:[20,30],yt:[],xmin:18,xmax:32,ymin:35,ymax:110});points130(gr);fit130(gr,slope,72-25*slope);residual130(gr,slope,72-25*slope);txt130(comparison,295+i*500,190,i===1?'B · 최소제곱법':['A','','C'][i],i===1?38:42,i===1?AI.green:AI.sub);});a(comparison,'그림에서는');
 ['A 152','B 84','C 152'].forEach((value,i)=>a(label130(comparison,140+i*470,640,400,value,i===1?AI.green:AI.sub,54),i===1?'팔십사':'백오십이'));
});
SCENES.L12=scene130('직선을 돌려 보며 찾아요',(c,s,a,u)=>{
 const left=graph130(s,110,205,580,330,{xmin:18,xmax:32,ymin:30,ymax:115,xt:[20,25,30],yt:[55,95]});points130(left);const ln=fit130(left),bars=residual130(left);a(star130(left.g,left.X(25),left.Y(72),23),'핀으로');
 const right=bowl130(s,930,205,550,330);const dot=dot130(right,4,84,AI.orange,14);const trail=el('polyline',{fill:'none',stroke:AI.orange,'stroke-width':5},right.plot);
 const begin=cue130(c,'시소처럼'),low=cue130(c,'너무 누우면'),high=cue130(c,'너무 서면'),bowl=cue130(c,'기울기마다'),bottom=cue130(c,'이 그릇의 바닥');
 const slope=t=>t<begin?4:t<low?4-2*E.ease(E.prog(t,begin,Math.max(.2,low-begin))):t<high?2+4*E.ease(E.prog(t,low,Math.max(.2,high-low))):t<bottom?6-2*E.ease(E.prog(t,high,Math.max(.2,bottom-high))):4;
 u.push(t=>{const m=slope(t),b=72-25*m;ln.setAttribute('y1',left.Y(m*18+b));ln.setAttribute('y2',left.Y(m*32+b));bars.forEach((n,i)=>n.setAttribute('y2',left.Y(m*ICE[i][0]+b)));dot.setAttribute('cx',right.X(m));dot.setAttribute('cy',right.Y(right.P(m)));dot.dataset.slope=m;ln.dataset.slope=m;
 const coords=[];for(let j=0;j<100;j++){let at=begin+(Math.max(begin,t)-begin)*j/99,mm=slope(at);coords.push(`${right.X(mm)},${right.Y(right.P(mm))}`);}trail.setAttribute('points',coords.join(' '));trail.style.opacity=t>=bowl?1:0;right.curve.style.opacity=t>=bowl?1:0;dot.style.opacity=t>=begin?1:0;});
 const glow=el('circle',{cx:right.X(4),cy:right.Y(84),r:25,fill:'none',stroke:AI.orange,'stroke-width':6},right.g);u.push(t=>glow.style.opacity=t>=bottom?.35+.55*Math.sin(Math.min(1.5,t-bottom)*Math.PI/1.5)**2:0);a(label130(s,960,650,480,'기울기 4',AI.green,48),'바닥');a(label130(s,175,650,480,'평균점',AI.orange,42),'평균이');
});
SCENES.L13=scene130('컴퓨터는 이렇게 찾아요',(c,s,a,u)=>{
 const card=group130(s);box130(card,80,175,620,460,'#e0ede7',AI.green);txt130(card,390,245,'공식으로 한 번에',44,AI.green);txt130(card,390,340,'좌표',48);const ar1=arrow(card,390,370,390,430,AI.green,6);ar1(1);const answer=group130(card),answerBox=box130(answer,210,450,360,85,'#fff',AI.green);txt130(answer,390,506,'기울기·절편',44);a(answer,'한 번에');const solveAt=cue130(c,'한 번에');u.push(t=>{const q=E.prog(t,solveAt,.65);answerBox.setAttribute('fill',q>0&&q<1?'#c8e2d5':'#fff');});txt130(card,390,595,'계산편',42,AI.orange);const cardAt=cue130(c,'하나는');u.push(t=>{const q=E.prog(t,cardAt,.18);card.style.opacity=.35+.65*q;card.style.filter=`grayscale(${1-q})`;});
 const gr=bowl130(s,900,210,565,280),graphAt=cue130(c,'다른 하나는');u.push(t=>{const q=E.prog(t,graphAt,.18);gr.g.style.opacity=.35+.65*q;gr.g.style.filter=`grayscale(${1-q})`;});const dot=dot130(gr,2,gr.P(2),AI.orange,15),ms=[2,3.36,3.80,3.93,3.98];const start=cue130(c,'조금씩 움직이기를'),finish=cue130(c,'다가가요');u.push(t=>{let z=E.prog(t,start,Math.max(1,finish-start))*4,k=Math.min(3,Math.floor(z)),m=E.lerp(ms[k],ms[k+1],E.ease(z-k));dot.setAttribute('cx',gr.X(m));dot.setAttribute('cy',gr.Y(gr.P(m)));dot.style.opacity=t>=start?1:0;});
 a(txt130(s,1190,145,'경사하강법',46,AI.green),'경사하강법이라고');a(txt130(s,1180,660,'2 → 3.36 → 3.80 → 3.93 → 3.98',34,AI.orange),'기울기 이에서');a(txt130(s,800,723,'다음: 로지스틱 회귀 · 신경망',40,AI.sub),'다음 강좌들의');
});
SCENES.L14=scene130('입력이 여러 개라면',(c,s,a)=>{
 const gr=standardGraph130(c,s,{xmin:16,xmax:34,ymin:30,ymax:125,xt:[20,27,32],yt:[40,80,120]});points130(gr,WEEKDAY,AI.blue);const weekend=group130(gr.plot);WEEKEND.forEach(([x,y])=>el('circle',{cx:gr.X(x),cy:gr.Y(y),r:10,fill:AI.orange,stroke:'#fff','stroke-width':3},weekend));a(weekend,'주말 여부를');fit130(gr,4.202005730659028,-35.950811843362075,AI.blue);const ln=fit130(gr,4.202005730659028,-21.518147086915077,AI.orange);a(ln,'주말 여부를');
 a(step130(gr,22,56.49331423113654,1,4.202005730659028),'사 점 이 개');a(txt130(s,390,265,'1°C마다 4.2개',38,AI.orange),'사 점 이 개');const arr=arrow(gr.g,gr.X(30),gr.Y(90.10936007640877),gr.X(30),gr.Y(104.54202483285577),AI.orange,6);a(gr.g.lastChild,'십사 점 사 개');arr(1);const pred=group130(gr.g);line130(pred,gr.X(27),gr.Y(30),gr.X(27),gr.Y(91.93600764087869),AI.sub,4,'10 8');[77.50334288443169,91.93600764087869].forEach((value,i)=>{line130(pred,gr.X(16),gr.Y(value),gr.X(27),gr.Y(value),i?AI.orange:AI.blue,4,'10 8');el('circle',{cx:gr.X(27),cy:gr.Y(value),r:12,fill:i?AI.orange:AI.blue,stroke:'#fff','stroke-width':4},pred);});a(pred,'이십칠 도라면');side130(c,s,a,'주말 +14.4개','십사 점 사 개',AI.orange);side130(c,s,a,'평일 약 78개','일흔여덟 개',AI.blue,1);side130(c,s,a,'주말 약 92개','아흔두 개',AI.orange,2);a(txt130(s,800,721,'입력 범위가 다르니 숫자 크기만 보고 중요도를 단정하면 안 돼요',34,AI.sub));
});
SCENES.L15=scene130('얼마나 잘 맞는지도 숫자로',(c,s,a,u)=>{
 const l=group130(s),r=group130(s);box130(l,80,170,680,420,'#e0ede7',AI.green);txt130(l,420,250,'RMSE',64,AI.green);txt130(l,420,325,'보통 얼마나 틀리나',44);const leftAt=cue130(c,'알엠에스이는');u.push(t=>{const q=E.prog(t,leftAt,.18);l.style.opacity=.35+.65*q;l.style.filter=`grayscale(${1-q})`;});a(txt130(l,420,420,'약 4.1',76,AI.green),'사 점 일');const band=box130(l,185,475,470,65,'#b7dbce',AI.green);line130(l,185,507,655,507,AI.green,6);a(band,'네 개 정도 차이로');
 box130(r,840,170,680,420,'#e7eef8',AI.blue);txt130(r,1180,250,'결정계수 R²',58,AI.blue);txt130(r,1180,325,'평균보다 얼마나 잘 맞나',40);const rightAt=cue130(c,'결정계수');u.push(t=>{const q=E.prog(t,rightAt,.18);r.style.opacity=.35+.65*q;r.style.filter=`grayscale(${1-q})`;});a(txt130(r,1180,420,'약 0.93',76,AI.blue),'영 점 구삼');box130(r,945,475,470,45,'#fff');let bar=box130(r,945,475,437,45,'#3b6fb6',AI.blue);u.push(t=>bar.setAttribute('width',Math.max(1,437*E.prog(t,cue130(c,'영 점 구삼'),.7))));txt130(r,945,564,'0',36);txt130(r,1415,564,'1',36);a(txt130(r,1250,564,'잘 맞아요',36,AI.blue),'일에 가까울수록');a(label130(s,410,645,780,'계산은 계산편에서',AI.orange,48),'계산편에서');
});
SCENES.L16=scene130('함정 1: 범위 밖 예측',(c,s,a)=>{
 const gr=standardGraph130(c,s,{compact:true,xmin:0,xmax:50,ymin:-45,ymax:190,xt:[0,20,30,50],yt:[-28,80,172]});points130(gr);line130(gr.g,gr.X(20),gr.Y(52),gr.X(30),gr.Y(92),AI.green,9);a(line130(gr.plot,gr.X(0),gr.Y(-28),gr.X(20),gr.Y(52),AI.sub,5,'12 8'),'그대로 늘리면');a(line130(gr.plot,gr.X(30),gr.Y(92),gr.X(50),gr.Y(172),AI.sub,5,'12 8'),'그대로 늘리면');side130(c,s,a,'0°C: -28개?','마이너스',AI.red);side130(c,s,a,'50°C: 172개?','백일흔두',AI.red,1);a(label130(s,250,653,1050,'믿을 수 있는 범위: 20~30°C',AI.green,44),'범위 안에서만');const bracket=group130(s);line130(bracket,gr.X(20),gr.y-16,gr.X(30),gr.y-16,AI.green,6);line130(bracket,gr.X(20),gr.y-16,gr.X(20),gr.y+5,AI.green,6);line130(bracket,gr.X(30),gr.y-16,gr.X(30),gr.y+5,AI.green,6);a(bracket,'범위 안에서만');
});
function outlier130(c,s,a,u,squares=false){
 const gr=standardGraph130(c,s,{ymin:10,ymax:110,xt:[20,25,31],yt:[30,55,95]});const ordinaryPoints=points130(gr);const base=fit130(gr);a(base);const dot=dot130(gr,31,30,AI.red,13),umb=umbrella130(gr.g,gr.X(31),gr.Y(30)-90,.65);a(dot,squares?null:'비가 와서');a(umb,squares?null:'비가 와서');if(!squares){const at=cue130(c,'비가 와서'),base=umb.getAttribute('transform');u.push(t=>{const z=-60*(1-E.ease(E.prog(t,at,.4)));dot.setAttribute('transform',`translate(0 ${z})`);umb.setAttribute('transform',`${base} translate(0 ${z})`);});}
 if(!squares){const ln=fit130(gr,4,-28,AI.red);let start=cue130(c,'확 줄어요');u.push(t=>{let k=E.ease(E.prog(t,start,.9)),m=E.lerp(4,.63265306122449,k),b=E.lerp(-28,48.5510204081632,k);ln.style.opacity=k;ln.setAttribute('y1',gr.Y(m*gr.xmin+b));ln.setAttribute('y2',gr.Y(m*gr.xmax+b));base.style.opacity=1-k*.75;});const slopeLabel=side130(c,s,a,'기울기 4.0',null,AI.green),numberAt=cue130(c,'영 점 육으로');u.push(t=>{const changed=t>=numberAt,color=changed?AI.red:AI.green;slopeLabel.querySelector('text').textContent=changed?'기울기 0.6':'기울기 4.0';slopeLabel.querySelector('text').setAttribute('fill',color);slopeLabel.querySelector('rect').setAttribute('stroke',color);});}
 else {residual130(gr).forEach((n,i)=>{const z=Math.abs(ICE[i][1]-(4*ICE[i][0]-28))*(c.long?4:2.4);const small=box130(gr.plot,gr.X(ICE[i][0])+15,gr.Y(ICE[i][1]),Math.max(6,z),Math.max(6,z),'#f2c6cf',AI.red);small.setAttribute('rx',0);a(small,'제곱하면');});const z=c.long?210:130,x=gr.X(31)-z-22,y=gr.Y(30)-z;const sq=box130(gr.plot,x,y,z,z,'#f2b9c5',AI.red);sq.setAttribute('rx',0);a(sq,'제곱하면');const st=cue130(c,'제곱하면');u.push(t=>{let k=.2+.8*E.ease(E.prog(t,st,.65));sq.setAttribute('width',z*k);sq.setAttribute('height',z*k);sq.setAttribute('x',gr.X(31)-z*k-22);sq.setAttribute('y',gr.Y(30)-z*k);});const arr=arrow(gr.g,x+z/2,y,gr.X(27),gr.Y(80)+25,AI.red,8);arr(1);a(gr.g.lastChild,'끌어당겨요');const mag=group130(gr.g);el('circle',{cx:gr.X(31),cy:gr.Y(30),r:c.long?50:38,fill:'none',stroke:AI.orange,'stroke-width':7},mag);line130(mag,gr.X(31)-32,gr.Y(30)+32,gr.X(31)-70,gr.Y(30)+70,AI.orange,10);a(mag,'먼저 살펴봐야');side130(c,s,a,'왜 생겼을까?','먼저 살펴봐야',AI.orange);}
 if(squares)ordinaryPoints.forEach(node=>gr.g.appendChild(node));
 return gr;
}
SCENES.L17=scene130('함정 2: 튀는 점 하나',(c,s,a,u)=>outlier130(c,s,a,u));
SCENES.L18=scene130('왜 그렇게 끌려갈까',(c,s,a,u)=>outlier130(c,s,a,u,true));
SCENES.L19=scene130('함정 3: 곡선 모양 데이터',(c,s,a)=>{
 const gr=standardGraph130(c,s,{xmin:0,xmax:10,ymin:0,ymax:12,xt:[],yt:[],xlabel:'기온',ylabel:'전력 수요'});let data=[];for(let i=0;i<=10;i++){const p=[i,1+(i-5)**2*.35];data.push(p);a(dot130(gr,...p),i<5?'너무 춥거나':'너무 더울 때');}a(fit130(gr,0,4.5,AI.sub),'평평한 직선이');const path=el('polyline',{points:data.map(([x,y])=>`${gr.X(x)},${gr.Y(y)}`).join(' '),fill:'none',stroke:AI.green,'stroke-width':7,'stroke-dasharray':'12 8'},gr.plot);a(path,'곡선을 쓰는');side130(c,s,a,'모양 예시');side130(c,s,a,'난방 · 냉방',null,AI.orange,1);const heat=group130(s);box130(heat,1190,500,130,105,'#f6dec4',AI.orange);for(let i=0;i<4;i++)line130(heat,1210+i*28,515,1210+i*28,590,AI.orange,7);const fan=group130(s);el('circle',{cx:1430,cy:550,r:56,fill:'#e7eef8',stroke:AI.blue,'stroke-width':5},fan);for(let i=0;i<3;i++)el('ellipse',{cx:1430,cy:523,rx:14,ry:30,fill:AI.blue,transform:`rotate(${i*120} 1430 550)`},fan);a(heat,'너무 춥거나');a(fan,'너무 더울 때');
});
SCENES.L20=scene130('아이스크림이 사고를 부를까',(c,s,a,u)=>{
 const gr=graph130(s,c.long?120:105,c.long?190:175,c.long?900:650,c.long?380:235,{xmin:0,xmax:10,ymin:0,ymax:10,xt:[],yt:[],xlabel:'아이스크림 판매량',ylabel:'물놀이 사고'});points130(gr,[[1,1.3],[2,1.7],[4,4.4],[6,5.6],[8,8.5]],AI.blue);const ln=fit130(gr,1,0);u.push(t=>trace130(ln,t,cue130(c,'꽤 잘 맞을 수'),.8));
 const icons=group130(s);let x=c.long?1180:235,y=c.long?310:535;ice130(icons,x,y,.6);tube130(icons,x+(c.long?290:390),y+25,43);a(icons,'둘 다');const ar=arrow(s,x+58,y+15,x+(c.long?220:320),y+15,AI.red,7);ar(1);a(s.lastChild,'일으키는 걸까요');a(txt130(s,x+(c.long?145:195),c.long?y-45:y+98,'?',c.long?72:64,AI.orange),'일으키는 걸까요');
});
SCENES.L21=scene130('진짜 원인은 더위',(c,s,a,u)=>{
 const x1=c.long?420:220,x2=c.long?1180:640,y=c.long?420:355,mid=c.long?800:430;ice130(s,x1,y,.9);tube130(s,x2,y+20,65);const ar=arrow(s,x1+90,y,x2-110,y,AI.sub,7);ar(1);a(line130(s,mid-28,y+28,mid+28,y-28,AI.red,9),'아니에요');const sun=sun130(s,mid,c.long?205:190,40);a(sun,'더위예요');a(txt130(s,mid,c.long?217:202,'더위',34,AI.orange),'더위예요');const left=arrow(s,mid-70,c.long?240:210,x1+45,y-105,AI.orange,7),right=arrow(s,mid+70,c.long?240:210,x2-45,y-105,AI.orange,7);left(1);right(1);a(s.children[s.children.length-2],'더위예요');a(s.lastChild,'더위예요');a(label130(s,c.long?230:70,c.long?630:575,c.long?1140:720,'함께 움직인다 ≠ 원인',AI.red,c.long?56:42),'원인까지');
});
SCENES.L22=scene130('장점과 단점',(c,s,a)=>{
 const cols=[['장점',AI.green,['읽기 쉬움','빠르고 가벼움','숫자로 확인','다른 모델의 출발점'],['규칙이 읽기','계산이','숫자로 보여','출발점이']],['단점',AI.red,['직선만','튀는 점','범위 밖','원인 아님'],['직선 관계만','튀는 점에','범위 밖','원인을']]];
 cols.forEach(([title,col,rows,cues],i)=>{const x=90+i*750;box130(s,x,160,670,540,i?'#f8e5e9':'#e0ede7',col);txt130(s,x+335,230,title,56,col);rows.forEach((row,j)=>{const g=group130(s);el('circle',{cx:x+65,cy:315+j*98,r:23,fill:col},g);txt130(g,x+65,327+j*98,String(j+1),32,'#fff');txt130(g,x+125,328+j*98,row,42,AI.ink,'start');if(i){let gr=graph130(g,x+510,275+j*98,110,63,{xmin:0,xmax:10,ymin:0,ymax:10,xt:[],yt:[],xlabel:'',ylabel:''});fit130(gr,j===0?0:1,j===0?5:0,col,5);if(j===1)dot130(gr,9,1,col,7);}a(g,cues[j]);});});
});
SCENES.L23=scene130('택시 요금도 직선이에요',(c,s,a,u)=>{
 const gr=standardGraph130(c,s,{xmin:0,xmax:5,ymin:3500,ymax:7800,xt:[0,1.6,5],yt:[4800,7000],xlabel:'거리(km)',ylabel:'요금(원)'});
 a(line130(gr.g,gr.X(0),gr.Y(4800),gr.X(1.6),gr.Y(4800),AI.green,8),'사천팔백 원으로');a(line130(gr.g,gr.X(1.6),gr.Y(4800),gr.X(5),gr.Y(4800+(5-1.6)*100/.131),AI.green,8),'백삼십일 미터마다');a(step130(gr,2,5105,.131,100),'백삼십일 미터마다');side130(c,s,a,'절편 = 기본요금','기본요금이');side130(c,s,a,'기울기 = 오르는 요금','기울기인',AI.green,1);a(txt130(s,800,721,'요금 기준: 서울시',36,AI.sub));
 const receipts=group130(s);[0,1,2].forEach(i=>{box130(receipts,1170+i*100,510+i*20,90,115,'#fff',AI.sub);line130(receipts,1185+i*100,545+i*20,1230+i*100,545+i*20,AI.sub,4);});const at=cue130(c,'영수증 기록만 보고');a(receipts,'영수증');[2,3,4].forEach(x=>a(dot130(gr,x,4800+(x-1.6)*100/.131),'영수증 기록만 보고'));u.push(t=>receipts.style.opacity=t>=cue130(c,'영수증')?1-E.prog(t,at,1):0);
});
SCENES.L24=scene130('「회귀」라는 이름',(c,s,a,u)=>{
 txt130(s,800,153,'19세기 영국 · 프랜시스 골턴',44,AI.sub);line130(s,130,440,1470,440,AI.orange,5,'12 10');txt130(s,800,410,'평균 키',38,AI.orange);
 const tall=group130(s),small=group130(s);box130(tall,200,230,110,390,'#bfd4ef',AI.blue);const tallSon=box130(tall,420,270,110,350,'#c8e2d5',AI.green);u.push(t=>{const k=E.ease(E.prog(t,cue130(c,'크지는 않았어요'),.6));tallSon.setAttribute('y',230+40*k);tallSon.setAttribute('height',390-40*k);});txt130(tall,255,690,'아버지',40);txt130(tall,475,690,'아들',40);a(tall,'키 큰 아버지의');box130(small,1040,485,110,135,'#bfd4ef',AI.blue);const smallSon=box130(small,1260,450,110,170,'#c8e2d5',AI.green);u.push(t=>{const k=E.ease(E.prog(t,cue130(c,'아버지보다 조금 컸어요'),.6));smallSon.setAttribute('y',485-35*k);smallSon.setAttribute('height',135+35*k);});txt130(small,1095,690,'아버지',40);txt130(small,1315,690,'아들',40);a(small,'키 작은');let ar1=arrow(s,600,290,600,395,AI.orange,7),ar2=arrow(s,1420,560,1420,465,AI.orange,7);ar1(1);ar2(1);a(s.children[s.children.length-2],'크지는 않았어요');a(s.lastChild,'키 작은');
});
SCENES.L25=scene130('정리',(c,s,a)=>{
 const rows=['점들 사이 직선으로 숫자를 예측해요','직선은 기울기와 절편으로 정해져요','오차 제곱합이 가장 작은 직선','공식 또는 경사하강법으로 찾아요','범위 밖 · 튀는 점 · 곡선 · 원인 착각'];const cues=['선형 회귀는','기울기와','오차를 제곱해','컴퓨터는','범위 밖 예측'];rows.forEach((v,i)=>{const g=group130(s);box130(g,120,140+i*88,1350,76,i%2?'#e7eef8':'#e0ede7',i%2?AI.blue:AI.green);el('circle',{cx:165,cy:178+i*88,r:24,fill:AI.green},g);txt130(g,165,190+i*88,String(i+1),32,'#fff');txt130(g,230,192+i*88,v,42,AI.ink,'start');a(g,cues[i]);});const icon=graph130(s,1240,157,180,45,{xt:[],yt:[],xlabel:'',ylabel:''});fit130(icon);points130(icon);a(icon.g,'선형 회귀는');a(label130(s,120,630,640,'다음: 선형 회귀 계산편',AI.blue,40),'계산편과');a(label130(s,800,630,670,'블로그: 선형 회귀 개념편',AI.green,40),'계산편과');
});
SCENES.S1E=scene130('직선은 어디에 그어야 할까요?',(c,s,a,u)=>{
 const gr=standardGraph130(c,s);points130(gr);const ln=fit130(gr);let start=cue130(c,'어디에');u.push(t=>{let m=4+Math.sin(Math.max(0,t-start)*1.7);ln.setAttribute('y1',gr.Y(72+m*(18-25)));ln.setAttribute('y2',gr.Y(72+m*(32-25)));});a(txt130(s,430,632,'?',70,AI.orange),'어디에');
});
SCENES.S2A=scene130('1°C마다 4개씩',(c,s,a,u)=>{
 const gr=standardGraph130(c,s);points130(gr);const ln=fit130(gr);u.push(t=>trace130(ln,t,cue130(c,'직선을 그어'),.7));a(step130(gr,23,64,1,4),'네 개씩');side130(c,s,a,'1°C마다 4개','네 개씩',AI.orange);
});
SCENES.S2E=scene130('또 무엇이 있을까요?',(c,s,a,u)=>{
 ['?','튀는 점','?','?'].forEach((text,i)=>{let x=60+(i%2)*390,y=140+Math.floor(i/2)*230;const g=group130(s);box130(g,x,y,350,190,i===1?'#f6dce2':'#e0ede7',i===1?AI.red:AI.green);txt130(g,x+175,y+118,text,i===1?48:82,i===1?AI.red:AI.green);if(i!==1){const st=cue130(c,'또 무엇이');u.push(t=>g.setAttribute('transform',`translate(${Math.sin((t-st)*9)*4*E.prog(t,st,.3)*(1-E.prog(t,st+1,.5))} 0)`));}});
});
SCENES.S3A=scene130('원인도 찾은 걸까요?',(c,s,a,u)=>{
 const gr=standardGraph130(c,s);points130(gr);const ln=fit130(gr);u.push(t=>trace130(ln,t,cue130(c,'직선을 그어서'),.8));a(prediction130(gr,27,80),'예측해요');side130(c,s,a,'원인도 찾은 걸까요?','원인도',AI.orange);
});
SCENES.S3E=scene130('어떻게 직선 하나로 찾아낼까요?',(c,s,a,u)=>{
 const gr=standardGraph130(c,s);points130(gr);const ln=fit130(gr);const at=cue130(c,'어떻게 직선 하나로'),end=cue130(c,'찾아낼까요');u.push(t=>{let t0=Math.min(Math.max(0,t-at),end-at),m=4+Math.sin(t0*2)*1.4*(1-E.prog(t, end-.4,.4));ln.setAttribute('y1',gr.Y(72+m*(18-25)));ln.setAttribute('y2',gr.Y(72+m*(32-25)));});side130(c,s,a,'?', '찾아낼까요',AI.orange);
});

SCENES.S1C=scene(()=>{});
SCENES.S1D=scene(()=>{});
SCENES.S2C=scene(()=>{});
SCENES.S2D=scene(()=>{});
SCENES.S3C=scene(()=>{});
SCENES.S3D=scene(()=>{});

// 페이퍼로지에 없는 위첨자 ²는 자막에서도 같은 글꼴의 작은 2 경로로 낸다.
new MutationObserver(()=>{for(const e of document.querySelectorAll('#sub i')){if(e.dataset.sup130||!e.textContent.includes('²'))continue;const [b,a]=e.textContent.split('²');e.textContent=b;e.dataset.sup130='yes';const z=document.createElementNS('http://www.w3.org/2000/svg','svg');z.setAttribute('viewBox','0 0 100 110');z.setAttribute('style','width:.48em;height:.48em;vertical-align:.42em;overflow:visible');z.innerHTML='<path d="M8 30C8 -4 92 -4 92 30C92 52 38 61 8 94L92 94" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>';e.appendChild(z);e.appendChild(document.createTextNode(a));}}).observe(document.getElementById('sub'),{childList:true,subtree:true});
