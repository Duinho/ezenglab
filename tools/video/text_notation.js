// 저항 단위 변환과 최종 DOM 글자 수집. 새 렌더는 모든 장면의 frame() 뒤에 적용한다.
// 장면표/읽기 원문과 인명·법칙 이름은 바꾸지 않는다.
const TextNotation = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const PATH = 'M 12 92 L 38 92 L 38 79 A 38 38 0 1 1 62 79 L 62 92 L 88 92';
  const units = /(?<=[0-9?→=·]\s*)(?:(킬로|메가|밀리)\s*옴|옴)/gu;
  const prefixes = {킬로:'k', 메가:'M', 밀리:'m'};
  const glyphs = new WeakMap();
  const labelsByRoot = new WeakMap();
  const excluded = 'script,style,defs,clipPath,mask,title,desc';
  function svg(tag, attrs = {}) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  }
  function parts(text, before = '') {
    const input = before + String(text);
    let result = [], pos = before.length;
    for (const match of input.matchAll(units)) {
      if (match.index < before.length) continue;
      result.push(input.slice(pos, match.index), {prefix:prefixes[match[1]] || ''});
      pos = match.index + match[0].length;
    }
    result.push(input.slice(pos));
    return result;
  }
  function textGroup(parent, root) {
    let group = parent.closest('svg text');
    if (!group) {
      group = parent;
      while (group.parentElement && group !== root && ['inline','contents'].includes(getComputedStyle(group).display)) group = group.parentElement;
    }
    return group;
  }
  function normalize(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [], previous = new Map();
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest(excluded)) continue;
      const group = textGroup(node.parentElement, root), before = previous.get(group) || '';
      const values = parts(node.textContent, before);
      if (values.length > 1) nodes.push({node, values});
      previous.set(group, (before + node.textContent).slice(-32));
    }
    for (const {node, values} of nodes) {
      const label = node.parentElement.closest('svg text'), fragment = document.createDocumentFragment();
      for (const part of values) {
        if (typeof part === 'string') { if (part) fragment.appendChild(document.createTextNode(part)); continue; }
        if (part.prefix) fragment.appendChild(document.createTextNode(part.prefix));
        if (label) {
          const space = svg('tspan', {'data-ohm-space':'', textLength:parseFloat(getComputedStyle(node.parentElement).fontSize) * .84, lengthAdjust:'spacingAndGlyphs'});
          space.textContent = '\u00a0'; fragment.appendChild(space);
        } else {
          const symbol = svg('svg', {viewBox:'0 0 100 100', 'data-ohm-unit':'Ω', 'aria-label':'옴'});
          symbol.style.cssText = 'height:.74em;width:.74em;vertical-align:-.02em;overflow:visible';
          symbol.appendChild(svg('path', {d:PATH, fill:'none', stroke:'currentColor', 'stroke-width':13, 'stroke-linejoin':'round', 'stroke-linecap':'round'}));
          fragment.appendChild(symbol);
        }
      }
      node.replaceWith(fragment);
    }
    // SVG text의 좌표/anchor/tspan/변환을 유지한다. 애니메이션이 값을 덮어쓰면 옛 도형도 제거한다.
    const tracked = labelsByRoot.get(root) || new Set();
    for (const label of tracked) if (!root.contains(label)) {
      for (const shape of (glyphs.get(label) || new Map()).values()) shape.remove();
      glyphs.delete(label);
      tracked.delete(label);
    }
    for (const label of root.querySelectorAll('svg text')) {
      const old = glyphs.get(label) || new Map(), spaces = [...label.querySelectorAll('[data-ohm-space]')];
      for (const [space, shape] of old) if (!label.contains(space)) { shape.remove(); old.delete(space); }
      for (const space of spaces) {
        let shape = old.get(space);
        if (!shape) { shape = svg('path', {d:PATH, 'data-ohm-unit':'Ω', fill:'none', 'stroke-width':13, 'stroke-linejoin':'round', 'stroke-linecap':'round'}); shape.notationOwner = label; label.parentNode.appendChild(shape); old.set(space, shape); }
        const size = parseFloat(getComputedStyle(space).fontSize), p = space.getStartPositionOfChar(0);
        shape.setAttribute('transform', `${label.getAttribute('transform') || ''} translate(${p.x + size * .05} ${p.y - size * .68}) scale(${size * .0074})`);
        shape.setAttribute('stroke', getComputedStyle(label).fill);
        shape.style.opacity = getComputedStyle(label).opacity;
        shape.style.display = getComputedStyle(label).display;
        shape.style.visibility = getComputedStyle(label).visibility;
      }
      glyphs.set(label, old);
      tracked.add(label);
    }
    labelsByRoot.set(root, tracked);
  }
  function visible(node) {
    if (node.closest(excluded)) return false;
    for (let p = node; p; p = p.parentElement) {
      const style = getComputedStyle(p);
      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || +style.opacity === 0) return false;
    }
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }
  function text(root, omitSub = false) {
    if (!root) return [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), groups = new Map();
    const end = document.getElementById('endcard'), covered = end && +getComputedStyle(end).opacity === 1;
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!node.textContent || !visible(parent) || (omitSub && parent.closest('#sub'))) continue;
      if (covered && parent.closest('#stage')) continue;
      // 인라인 경계(1<b>킬로옴</b>, EE-<span>130</span>)를 붙여 검사하되 서로 다른 카드는 합치지 않는다.
      const group = textGroup(parent, root);
      groups.set(group, (groups.get(group) || '') + node.textContent);
    }
    return [...groups.values()].map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  function collect() {
    return {화면:text(document.body, true), 자막:text(document.getElementById('sub'))};
  }
  return {parts, normalize, collect};
})();
