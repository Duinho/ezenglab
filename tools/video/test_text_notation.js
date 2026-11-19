// 브라우저 없이 DOM API 계약과 변환·수집을 검증하는 작은 문서 fixture.
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
class Node {
  constructor(tag, text = '') { this.tagName = tag; this.nodeType = tag === '#text' ? 3 : 1; this.childNodes = []; this.attrs = {}; this.style = {}; this.dataset = {}; this.raw = text; }
  get firstChild() { return this.childNodes[0] || null; }
  set innerHTML(value) { this.textContent = ''; if (value === '<span></span>') this.appendChild(new Node('span')); else if (value) throw Error('지원하지 않는 fixture HTML'); }
  get parentElement() { return this.parentNode || null; }
  get textContent() { return this.nodeType === 3 ? this.raw : this.childNodes.map(n => n.textContent).join(''); }
  set textContent(value) { if (this.nodeType === 3) this.raw = String(value); else { for (const n of this.childNodes) n.parentNode = null; this.childNodes = []; if (String(value)) this.appendChild(new Node('#text', String(value))); } }
  appendChild(node) { if (node.tagName === '#fragment') { for (const n of [...node.childNodes]) this.appendChild(n); node.childNodes = []; return node; } if (node.parentNode) node.remove(); node.parentNode = this; this.childNodes.push(node); return node; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  contains(node) { return node === this || this.childNodes.some(n => n.contains(node)); }
  remove() { if (this.parentNode) { const parent = this.parentNode; parent.childNodes.splice(parent.childNodes.indexOf(this), 1); this.parentNode = null; } }
  replaceWith(node) { const parent = this.parentNode, index = parent.childNodes.indexOf(this), nodes = node.tagName === '#fragment' ? [...node.childNodes] : [node]; parent.childNodes.splice(index, 1, ...nodes); for (const n of nodes) n.parentNode = parent; this.parentNode = null; }
  matches(selector) { if (selector.startsWith('#')) return this.attrs.id === selector.slice(1); if (selector === 'svg text') return this.tagName === 'text' && this.parentElement?.closest('svg'); if (selector.startsWith('[')) return Object.hasOwn(this.attrs, selector.slice(1, -1)); return this.tagName.toLowerCase() === selector.toLowerCase(); }
  closest(selectors) { for (let p = this; p; p = p.parentElement) if (selectors.split(',').some(s => p.matches(s.trim()))) return p; return null; }
  querySelectorAll(selector) { return this.childNodes.flatMap(n => [...(n.nodeType === 1 && n.matches(selector) ? [n] : []), ...n.querySelectorAll(selector)]); }
  getBoundingClientRect() { return {left:0, top:0, width:100, height:20, right:100, bottom:20}; }
  getStartPositionOfChar() { return {x:100, y:50}; }
}
const document = {
  body:null,
  createElementNS(ns, tag) { return new Node(tag); },
  createElement(tag) { return new Node(tag); },
  createTextNode(text) { return new Node('#text', text); },
  createDocumentFragment() { return new Node('#fragment'); },
  getElementById(id) { return this.body?.querySelectorAll('#'+id)[0] || null; },
  createTreeWalker(root) { const nodes = []; const walk = n => { for (const c of n.childNodes) { if (c.nodeType === 3) nodes.push(c); else walk(c); } }; walk(root); return {currentNode:null, nextNode() { this.currentNode = nodes.shift(); return Boolean(this.currentNode); }}; },
};
function getComputedStyle(node) {
  let font = node.style.fontSize || node.attrs['font-size'];
  if (!font && node.parentElement) font = getComputedStyle(node.parentElement).fontSize;
  return {fontSize:font || '40px', fill:node.attrs.fill || '#14213d', opacity:node.style.opacity ?? node.attrs.opacity ?? '1', display:node.style.display || (['span','b','i','tspan'].includes(node.tagName) ? 'inline':'block'), visibility:node.style.visibility || 'visible'};
}
const sandbox = {document, NodeFilter:{SHOW_TEXT:4}, getComputedStyle};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname+'/text_notation.js', 'utf8')+'\nglobalThis.api=TextNotation;', sandbox);
const api = sandbox.api;
const make = (tag, parent, text = '', attrs = {}) => { const n = new Node(tag); for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); n.textContent = text; if (parent) parent.appendChild(n); return n; };
let passed = 0;
function test(name, fn) { fn(); passed++; process.stdout.write('PASS '+name+'\n'); }
function reset() { document.body = new Node('body'); return document.body; }
const plain = value => JSON.parse(JSON.stringify(value));

test('숫자·쉼표·소수와 SI 접두어', () => {
  for (const [value, prefix] of [['1킬로옴','k'],['3,000옴',''],['1.94킬로옴','k'],['2메가옴','M'],['3밀리옴','m'],['1 킬로 옴','k'],['1킬로옴이에요','k']]) {
    const p = plain(api.parts(value)); assert.equal(p.length, 3); assert.equal(p[1].prefix, prefix);
  }
});
test('인명·명칭·일반 단어 보존', () => {
  for (const word of ['옴의 법칙','게오르크 옴','단위 옴도','몇 옴','킬로옴은 옴으로','영상','영향']) assert.deepEqual(plain(api.parts(word)), [word]);
});
test('HTML 복수 단위를 한 번만 도형으로', () => {
  const root = reset(), label = make('div',root,'1킬로옴 + 3,000옴'); api.normalize(root);
  assert.equal(label.querySelectorAll('svg').length,2); assert.equal(label.textContent,'1k + 3,000');
  api.normalize(root); assert.equal(label.querySelectorAll('svg').length,2);
});
test('자막 공백 단위 변환과 조사 보존', () => {
  const root=reset(), sub=make('div',root,'',{id:'sub'}); make('span',sub,'1 킬로옴이에요'); api.normalize(sub);
  assert.equal(sub.textContent,'1 k이에요'); assert.equal(sub.querySelectorAll('path').length,1);
});
test('SVG 복수 기호·anchor·원래 좌표 보존', () => {
  const root=reset(), image=make('svg',root), label=make('text',image,'1킬로옴 + 2옴',{x:200,y:100,'text-anchor':'middle',transform:'rotate(10)'});
  api.normalize(root); assert.equal(image.querySelectorAll('path').length,2); assert.equal(label.getAttribute('x'),'200'); assert.equal(label.getAttribute('text-anchor'),'middle');
  assert.ok(image.querySelectorAll('path')[0].getAttribute('transform').startsWith('rotate(10)'));
});
test('동적 값 갱신 뒤 옛 도형 제거', () => {
  const root=reset(), image=make('svg',root), label=make('text',image,'1킬로옴'); api.normalize(root);
  label.textContent='2옴'; api.normalize(root); assert.equal(image.querySelectorAll('path').length,1); assert.equal(label.textContent.trim(),'2');
  label.textContent='전압'; api.normalize(root); assert.equal(image.querySelectorAll('path').length,0);
});
test('삭제된 라벨 도형도 제거', () => {
  const root=reset(), image=make('svg',root), label=make('text',image,'1옴'); api.normalize(root); label.remove(); api.normalize(root); assert.equal(image.querySelectorAll('path').length,0);
});
test('같은 SVG 라벨을 다시 붙이면 도형 복원', () => {
  const root=reset(), image=make('svg',root), label=make('text',image,'1옴'); api.normalize(root); label.remove(); api.normalize(root); image.appendChild(label); api.normalize(root); assert.equal(image.querySelectorAll('path').length,1);
});
test('SVG 글자 숨김·투명도에 도형도 따름', () => {
  const root=reset(), image=make('svg',root), label=make('text',image,'1옴'); api.normalize(root); label.style.opacity='0'; api.normalize(root); assert.equal(image.querySelectorAll('path')[0].style.opacity,'0');
});
test('실제 SVG·HTML 글자와 자막 분리·중복 방지', () => {
  const root=reset(); make('div',root,'옴의 법칙'); make('text',make('svg',root),'EE-130'); const sub=make('div',root,'',{id:'sub'}); make('span',sub,'영이에요');
  const result=plain(api.collect()); assert.deepEqual(result.화면,['옴의 법칙','EE-130']); assert.deepEqual(result.자막,['영이에요']);
});
test('인라인 경계를 넘는 금지 표기 수집', () => {
  const root=reset(), label=make('div',root,'1'); make('b',label,'킬로옴'); const code=make('div',root,'EE-'); make('span',code,'130');
  assert.deepEqual(plain(api.collect().화면),['1킬로옴','EE-130']);
});
test('숫자와 단위가 다른 HTML 노드여도 공통 변환', () => {
  const root=reset(), label=make('div',root,'1'); make('b',label,'킬로옴'); api.normalize(root);
  assert.equal(label.textContent,'1k'); assert.equal(label.querySelectorAll('svg').length,1);
});
test('자막 단어 노드와 외톨이 줄 검사용 i 유지', () => {
  const root=reset(), sub=make('div',root,'',{id:'sub'}), box=make('span',sub); make('i',box,'1'); box.appendChild(document.createTextNode(' ')); make('i',box,'킬로옴이에요');
  api.normalize(box); assert.equal(box.querySelectorAll('i').length,2); assert.equal(box.textContent,'1 k이에요'); assert.equal(box.querySelectorAll('svg').length,1);
});
test('숨은 글자·style·defs·접근성 이름·도형 제외', () => {
  const root=reset(); const hidden=make('div',root,'1킬로옴'); hidden.style.display='none'; const faded=make('div',root,'EE-130'); faded.style.opacity='0';
  make('style',root,'EE-130'); make('text',make('defs',make('svg',root)),'EE-130'); make('path',root,'',{'aria-label':'옴'}); make('div',root,'1k'); assert.deepEqual(plain(api.collect().화면),['1k']);
});
test('완전히 덮은 끝카드 아래 무대 글자 제외', () => {
  const root=reset(); make('div',root,'EE-130',{id:'stage'}); const end=make('div',root,'다음 강의',{id:'endcard'}); end.style.opacity='1'; assert.deepEqual(plain(api.collect().화면),['다음 강의']);
});
// Python 시험이 render.py AST에서 추출한 문자열을 파일로 건넨다. 렌더/브라우저 실행 없음.
if (process.argv[2]) {
const runtime = fs.readFileSync(process.argv[2], 'utf8');
sandbox.window = sandbox;
sandbox.makeCtx = (scene, stage, layout) => ({stage, layout, ...scene});
let updates = [], rawLabel;
sandbox.ohmNotation = () => { throw Error('복사된 옛 변환 함수 실행 금지'); };
sandbox.SCENES = {L01:{init(ctx) { rawLabel=make('div',ctx.stage,''); updates=[]; sandbox.ohmNotation(ctx,updates); }, frame(ctx,t) { rawLabel.textContent=t<.5?'1킬로옴':'3,000옴'; for (const update of updates) update(t); }}};
sandbox.TL = {layout:'long', scenes:[{id:'L01',start:0,dur:1,words:[],phrases:[{start:0,end:1,text:'1 킬로옴이에요'}]}],endAt:null,ctaAt:null};
const runtimeRoot=reset(); make('div',runtimeRoot,'',{id:'stage'}); make('div',runtimeRoot,'',{id:'sub'}); make('div',runtimeRoot,'다음 편',{id:'endcard'});
vm.runInContext(runtime, sandbox);
test('실제 렌더 런타임이 직접 그린 글자·자막·옛 함수까지 공통 경유', () => {
  sandbox.render(.25); assert.equal(rawLabel.textContent,'1k'); assert.equal(rawLabel.querySelectorAll('svg').length,1);
  assert.equal(document.getElementById('sub').querySelectorAll('i').length,2);
  assert.equal(document.getElementById('sub').textContent,'1 k이에요');
  sandbox.render(.75); assert.equal(rawLabel.textContent,'3,000'); assert.equal(rawLabel.querySelectorAll('svg').length,1);
});
test('실제 런타임의 끝카드 글자만 수집·자막 비움', () => {
  sandbox.render(1.1); assert.equal(document.getElementById('sub').textContent,''); assert.deepEqual(plain(api.collect().화면),['다음 편']);
});
}
console.log(`${passed} checks passed`);
