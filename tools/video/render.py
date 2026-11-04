"""장면표 + 음성 + scenes.js → mp4

사용:
  python3 tools/video/render.py "영상/폴더" 음성폴더 long L01-L06 결과.mp4
  python3 tools/video/render.py "영상/폴더" 음성폴더 short L03-L06 결과.mp4 --hook "이 음식, 누가 좋아할까?"
"""
import argparse, hashlib, json, math, os, re, shutil, subprocess, sys, wave
sys.path.insert(0, os.path.dirname(__file__))
from common import parse_scenes
from subtitles import scene_phrases

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(os.path.dirname(HERE), "fonts")
FPS = 30
SIZE = {"long": (1920, 1080), "short": (1080, 1920)}
STAGE = {"long": (0, 0, 1920, 920), "short": (0, 300, 1080, 1150)}
MAXCH = {"long": 26, "short": 30}   # 쇼츠는 두 줄까지 한 화면에
MAXLINES = {"long": 1, "short": 2}
END_SEC = 2.2
SCENE_CACHE = "/home/claude/build/scene_cache"   # 장면별 완성 조각(mp4)과 그림 지문
FP_TOL = 6      # 지문 비교 허용치(0~255). 시험: 그릴 때 생기는 차이 최대 1, 글자 하나 추가 79, 2px 이동 21

CSS = """
@font-face{font-family:P;src:url(file://%(f)s/Paperlogy-4Regular.ttf);font-weight:400}
@font-face{font-family:P;src:url(file://%(f)s/Paperlogy-6SemiBold.ttf);font-weight:600}
@font-face{font-family:P;src:url(file://%(f)s/Paperlogy-8ExtraBold.ttf);font-weight:800}
*{box-sizing:border-box}
html,body{margin:0;width:%(W)dpx;height:%(H)dpx;overflow:hidden;background:#f2f8f5;font-family:P;color:#14213d;word-break:keep-all}
#stage{position:absolute;left:%(sx)dpx;top:%(sy)dpx;width:%(sw)dpx;height:%(sh)dpx;overflow:hidden}
.abs{position:absolute}.center{text-align:center}
.card{position:absolute;display:flex;align-items:center;justify-content:center;gap:18px;border:5px solid;border-radius:26px;font-weight:600}
.card.dashed{border-style:dashed}.card .q{color:#0f7c80;font-weight:800}
.bubble{position:absolute;border:6px solid;border-radius:30px;background:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px}
.bubble .hint{font-size:28px;color:#667085;font-weight:600;margin-bottom:6px}.bubble .food{font-size:44px;font-weight:600}
.list{font-weight:600;margin-top:6px;white-space:nowrap}
.title .big,.big{font-weight:800;font-size:150px;color:#14936a;line-height:1.1}
.title .mid{font-weight:600;font-size:60px;color:#445066;margin-top:18px}
.chip{display:inline-block;background:#14936a;color:#fff;font-weight:800;font-size:54px;padding:12px 40px;border-radius:999px;margin-bottom:24px}
.floor{height:10px;background:#14936a;border-radius:6px;margin:34px auto 0;opacity:.35}
.ask{font-weight:800;font-size:52px;color:#0f7c80}
.count{font-weight:800;font-size:220px;color:#e0701b}
.badge{font-weight:800;font-size:64px;color:#fff;background:#e0701b;border-radius:999px;padding:8px 0}
.rule{font-weight:600;font-size:62px;line-height:1.35;background:#fff;border-radius:30px;padding:30px;border:5px solid #14936a}
.rule b,.endnote b{color:#14936a;font-weight:800}
.endnote{font-weight:800;font-size:72px}
.intro-full{font-weight:800;color:#14213d;line-height:1.35}.intro-row{white-space:nowrap}
.intro-ch{display:inline-block;transform-origin:50%% 50%%}
.intro-ch.key{color:color-mix(in srgb,#14936a calc(var(--hi,0)*100%%),#14213d);position:relative;z-index:2}
.intro-ch.key::before{content:'';position:absolute;left:50%%;top:52%%;width:1.18em;height:1.18em;border-radius:50%%;background:#14936a;opacity:calc(var(--hi,0)*.16);transform:translate(-50%%,-50%%);z-index:-1}
.intro-target{font-weight:800;color:#14936a;line-height:1.1}.intro-target .lab{color:#14213d}
.intro-role{display:inline-block;background:#14936a;color:#fff;font-weight:800;font-size:60px;padding:14px 46px;border-radius:999px}
.intro-floor{height:12px;background:#14936a;border-radius:6px;opacity:.35;transform-origin:50%% 50%%}
.outro-btns{display:flex;justify-content:center;gap:48px}
.ob{display:inline-flex;align-items:center;gap:16px;font-weight:800;font-size:64px;padding:20px 54px;border-radius:999px;background:#fff;border:5px solid #14213d;color:#14213d}
.ob.sub{border-color:#d24a5a;color:#d24a5a}.ob.sub.on{background:#d24a5a;color:#fff}
.ob.like{border-color:#3b6fb6;color:#3b6fb6}
.outro-bye{font-weight:800;color:#14936a}
#host{position:absolute;z-index:5;width:%(hs)dpx;height:%(hs)dpx;left:%(hx)dpx;top:%(hy)dpx;filter:drop-shadow(0 6px 10px rgba(0,0,0,.12))}
#host svg{width:100%%;height:100%%}
#host #eyes{transform-box:fill-box;transform-origin:50%% 50%%}
#sub{position:absolute;z-index:5;left:%(subx)dpx;width:%(subw)dpx;top:%(suby)dpx;text-align:center}
#sub span{display:inline-block;max-width:100%%;background:rgba(20,33,61,.88);color:#fff;font-weight:600;font-size:%(subf)dpx;line-height:1.3;padding:14px 34px;border-radius:18px;text-wrap:balance}
#hook{position:absolute;left:60px;right:60px;top:90px;text-align:center;font-weight:800;font-size:78px;line-height:1.25;color:#14213d;text-wrap:balance}
#hook b{color:#14936a}
#brand{position:absolute;left:0;right:0;bottom:70px;text-align:center;font-size:34px;font-weight:600;color:#14936a;opacity:.85}
#endcard{position:absolute;inset:0;background:#14936a;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;text-align:center;opacity:0}
#endcard .a{font-size:%(endf)dpx;font-weight:800;line-height:1.3}#endcard .b{font-size:44px;font-weight:600;opacity:.9}
"""

RUNTIME = """
let cur = null, ctx = null;
const stage = document.getElementById('stage'), sub = document.getElementById('sub');
window.resetScene = () => { cur = null; };   // 다음 render에서 장면을 처음부터 다시 그림(지문을 앞 상태와 무관하게)
window.render = function (t) {
  let sc = TL.scenes.find(s => t >= s.start && t < s.start + s.dur);
  const end = document.getElementById('endcard');
  if (!sc) { end.style.opacity = 1; sub.innerHTML = ''; return; }
  end.style.opacity = TL.endAt != null ? Math.min(1, Math.max(0, (t - TL.endAt) / .35)) : 0;
  if (cur !== sc.id) {
    stage.innerHTML = ''; cur = sc.id;
    ctx = makeCtx(sc, stage, TL.layout);
    SCENES[sc.id].init(ctx);
  }
  const lt = t - sc.start;
  SCENES[sc.id].frame(ctx, lt);
  // 장면 전환: 앞뒤 0.2초 살짝 밝게
  stage.style.opacity = Math.min(1, lt / .2, (sc.dur - lt) / .2 + .0001);
  // 진행자: 말하는 단어 동안 입을 여닫고, 3.7초마다 눈 깜빡임
  const host = document.getElementById('host');
  if (host && host.firstChild) {
    const speaking = sc.words.some(w => lt >= w.start && lt < w.end);
    const open = speaking && Math.floor(lt * 9) % 2 === 0;   // 장면 안 시간 기준(장면별 재사용 가능하게)
    const mo = host.querySelector('#mouth-open'), mc = host.querySelector('#mouth-closed');
    if (mo) { mo.style.display = open ? '' : 'none'; mc.style.display = open ? 'none' : ''; }
    const eyes = host.querySelector('#eyes');
    // 인사("안녕하세요"): 눈을 감고 살짝 앞으로 숙였다가 돌아옴(팀장님 2026-11-04)
    const hi = sc.words.find(w => w.text.startsWith('안녕하세요'));
    let bow = 0;
    if (hi) { const a = hi.start - .05, b = hi.end + .35; if (lt > a && lt < b) bow = Math.sin(Math.PI * (lt - a) / (b - a)); }
    if (eyes) eyes.style.transform = (bow > .15 || (lt % 3.7) < .13) ? 'scaleY(.12)' : '';
    host.style.transformOrigin = '50% 95%';
    host.style.transform = bow > 0 ? `translateY(${bow * 14}px) perspective(600px) rotateX(${-bow * 22}deg)` : `translateY(${speaking ? Math.sin(lt * 6) * 2 : 0}px)`;
  }
  const ph = sc.phrases.find(p => lt >= p.start - .05 && lt < p.end + .25);
  const txt = ph ? ph.text : '';
  if (sub.dataset.t !== txt) { sub.dataset.t = txt; sub.innerHTML = txt ? '<span></span>' : '';
    if (txt) { const box = sub.firstChild; txt.split(' ').forEach((w, i) => { if (i) box.appendChild(document.createTextNode(' ')); const e = document.createElement('i'); e.textContent = w; e.style.fontStyle = 'normal'; box.appendChild(e); }); } }
};
window.overlaps = () => {
  // 글·그림·상자가 서로 겹치는지, 화면 가장자리 여백(MARGIN)을 지키는지, 진행자 얼굴을 가리는지 검사
  const st = stage.getBoundingClientRect(), out = [], M = 30;   // 화면 가장자리 여백(px)
  const vis = n => { let e = n, o = 1; while (e && e !== stage) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= parseFloat(cs.opacity); const a = e.getAttribute && e.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); e = e.parentElement; } return o; };
  const noqa = n => { let e = n; while (e && e !== stage) { if (e.classList && e.classList.contains('noqa')) return true; e = e.parentElement; } return false; };
  const clipOf = n => { let e = n; while (e && e !== stage) { const c = e.getAttribute && e.getAttribute('clip-path'); if (c) { const id = c.match(/#([^)]+)/); const r = id && document.getElementById(id[1]); if (r && r.firstElementChild) { const q = r.firstElementChild, sv = q.ownerSVGElement.getBoundingClientRect(), x = +q.getAttribute('x') + sv.left, y = +q.getAttribute('y') + sv.top; return { left: x, top: y, right: x + +q.getAttribute('width'), bottom: y + +q.getAttribute('height') }; } } e = e.parentElement; } return null; };
  const cut = (r, c) => { if (!c) return r; const l = Math.max(r.left, c.left), t = Math.max(r.top, c.top), rr = Math.min(r.right, c.right), b = Math.min(r.bottom, c.bottom); return (rr - l > 1 && b - t > 1) ? { left: l, top: t, right: rr, bottom: b } : null; };
  const nm = n => (n.tagName.toLowerCase() === 'text' ? 'T' : n.tagName.toLowerCase()) + ':' + ((n.textContent || '').trim().slice(0, 12) || (n.getAttribute && (n.getAttribute('class') || '')) || '');
  const items = [];
  const tops = [];   // 화면 전체를 덮는 바탕 상자(앞 화면 가림막)는 상자 대신 그 안의 요소를 검사
  const isCover = n => { const r = n.getBoundingClientRect(); return r.width >= st.width - 4 && r.height >= st.height - 4 && n.tagName.toLowerCase() !== 'svg'; };
  for (const n of stage.children) { if (isCover(n)) tops.push(...n.children); else tops.push(n); }
  for (const n of tops) {
    if (n.tagName.toLowerCase() === 'svg' || noqa(n) || n.offsetWidth === 0 || vis(n) <= .3) continue;
    const cs = getComputedStyle(n), framed = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || parseFloat(cs.borderTopWidth) > 0 || cs.boxShadow !== 'none';
    let r = n.getBoundingClientRect();
    if (!framed) {   // 테두리 없는 상자는 실제 글자·그림이 차지한 크기로 잰다
      let u = null; const add = c => { if (c.width < 1 || c.height < 1) return; u = u ? { left: Math.min(u.left, c.left), top: Math.min(u.top, c.top), right: Math.max(u.right, c.right), bottom: Math.max(u.bottom, c.bottom) } : { left: c.left, top: c.top, right: c.right, bottom: c.bottom }; };
      const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT); let t;
      while ((t = w.nextNode())) { if (!t.textContent.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(t); for (const c of rg.getClientRects()) add(c); }
      n.querySelectorAll('img,canvas,svg text,svg circle,svg polygon,svg rect,svg path,svg line,svg ellipse').forEach(e => { if (!e.closest('defs')) add(e.getBoundingClientRect()); });
      n.querySelectorAll('*').forEach(e => { const c = getComputedStyle(e); if ((c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent') || parseFloat(c.borderTopWidth) > 0) add(e.getBoundingClientRect()); });
      if (u) r = u;
    }
    items.push({ n, r, k: 'box', name: nm(n) });
  }
  stage.querySelectorAll('svg text, svg circle, svg polygon').forEach(n => {
    if (n.closest('defs') || noqa(n) || vis(n) <= .3) return;
    const r = cut(n.getBoundingClientRect(), clipOf(n)); if (!r || r.right - r.left < 3) return;
    items.push({ n, r, k: n.tagName.toLowerCase() === 'text' ? 'text' : 'shape', name: nm(n) });
  });
  stage.querySelectorAll('svg path, svg line').forEach(n => {     // 축·선은 여백 검사만
    if (n.closest('defs') || noqa(n) || vis(n) <= .3) return;
    const b0 = n.getBoundingClientRect(), w = (parseFloat(n.getAttribute('stroke-width')) || 2) / 2;   // 선 굵기만큼 넓혀 잼(높이 0인 가로선 대비)
    const r = cut({ left: b0.left - w, top: b0.top - w, right: b0.right + w, bottom: b0.bottom + w }, clipOf(n)); if (r) items.push({ n, r, k: 'line', name: nm(n) });
  });
  // 글자가 자기 칸(배경·테두리가 있는 상자) 밖으로 튀어나가는지
  { const w = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT); let t;
    while ((t = w.nextNode())) {
      if (!t.textContent.trim() || !t.parentElement || t.parentElement.closest('svg') || noqa(t.parentElement) || vis(t.parentElement) <= .3) continue;
      let box = t.parentElement;
      while (box && box !== stage) { const c = getComputedStyle(box); if ((c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent') || parseFloat(c.borderTopWidth) > 0) break; box = box.parentElement; }
      if (!box || box === stage) continue;
      const b = box.getBoundingClientRect(); if (b.width >= st.width - 4) continue;
      const rg = document.createRange(); rg.selectNodeContents(t);
      for (const c of rg.getClientRects()) if (c.right > b.right + 1 || c.left < b.left - 1 || c.bottom > b.bottom + 1 || c.top < b.top - 1) { out.push(['칸 넘침', nm(box), t.textContent.trim().slice(0, 14)]); break; }
    } }
  const host = document.getElementById('host'), hr = host && getComputedStyle(host).display !== 'none' ? host.getBoundingClientRect() : null;
  const ov = (a, b, pad = 0) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > pad && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > pad;
  for (const a of items) {
    const r = a.r;
    if (r.left < st.left - 2 || r.right > st.right + 2 || r.top < st.top - 2 || r.bottom > st.bottom + 2) out.push(['밖', a.name]);
    else if (r.left < st.left + M || r.right > st.right - M || r.top < st.top + M || r.bottom > st.bottom - M) out.push(['여백', a.name, Math.round(Math.min(r.left - st.left, st.right - r.right, r.top - st.top, st.bottom - r.bottom))]);
    if (hr && a.k !== 'line' && ov(r, hr, 4)) out.push(['진행자', a.name]);
  }
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const A = items[i], B = items[j];
    if (vis(A.n) < .6 || vis(B.n) < .6) continue;                   // 장면 안에서 바뀌는 순간(사라지는 중·나타나는 중)은 겹침에서 뺌
    if (A.k === 'line' || B.k === 'line') {   // 가로·세로 선(축, 기준선)이 글자나 상자를 지나가면 겹침. 격자와 사선은 뺌
      const L = A.k === 'line' ? A : B, O = A.k === 'line' ? B : A;
      if (L.k === O.k || O.k === 'shape' || L.n.closest('.grid') || O.n.contains(L.n)) continue;
      if (O.k === 'text' && items.some(X => X.k === 'shape' && O.r.left >= X.r.left - 2 && O.r.right <= X.r.right + 2 && O.r.top >= X.r.top - 2 && O.r.bottom <= X.r.bottom + 2)) continue;   // 점 위 이름표는 점에 이어진 선과 겹쳐도 됨
      const thin = (L.r.right - L.r.left) < 10 || (L.r.bottom - L.r.top) < 10;
      if (thin && ov(L.r, O.r, 1)) out.push(['선 겹침', O.name, L.name]);
      continue;
    }
    if (A.k === 'shape' && B.k === 'shape') continue;                 // 과일 점끼리 겹치는 건 그래프 내용
    if (A.n.contains(B.n) || B.n.contains(A.n)) continue;             // 상자 안의 글자
    if (A.k === 'box' && B.k === 'box') { if (ov(A.r, B.r, 4)) out.push(['겹침', A.name, B.name]); continue; }
    const inside = (a, b) => a.left >= b.left - 2 && a.right <= b.right + 2 && a.top >= b.top - 2 && a.bottom <= b.bottom + 2;
    if ((A.k === 'text' && B.k === 'shape' && inside(A.r, B.r)) || (B.k === 'text' && A.k === 'shape' && inside(B.r, A.r))) continue;   // 점 위에 쓴 이름표(A·B 등)
    if (ov(A.r, B.r, 2)) out.push(['겹침', A.name, B.name]);
  }
  return out;
};
window.subLastLine = () => { const ws = [...sub.querySelectorAll('i')]; if (!ws.length) return 0; const tops = ws.map(w => Math.round(w.getBoundingClientRect().top)); const last = Math.max(...tops); return tops.filter(t => t === last).length; };
window.stageEmpty = () => ![...stage.querySelectorAll('*')].some(n => { const r = n.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return false; let e = n, o = 1; while (e && e !== stage) { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; o *= parseFloat(cs.opacity); e = e.parentElement; } return o > .3; });
window.subLines = () => { const s = sub.firstChild; if (!s) return 0; const r = s.getClientRects(); const lh = parseFloat(getComputedStyle(s).lineHeight); return Math.round((s.getBoundingClientRect().height - 28) / lh); };
"""


def wav_info(p):
    with wave.open(p) as w:
        return w.getparams()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder"); ap.add_argument("audio"); ap.add_argument("layout", choices=["long", "short"])
    ap.add_argument("range"); ap.add_argument("out")
    ap.add_argument("--hook", default=""); ap.add_argument("--endtext", default="")
    ap.add_argument("--frames-only", action="store_true")
    ap.add_argument("--no-host", action="store_true")
    ap.add_argument("--preview", type=float, default=0, help="영상 대신 N초마다 한 장씩만 저장(빠른 확인)")
    ap.add_argument("--end-cue", default="", help="마지막 장면에서 이 단어를 말할 때 끝 안내 화면을 띄움(쇼츠)")
    ap.add_argument("--full", action="store_true", help="저장된 장면을 쓰지 않고 전부 다시 만듦(업로드 전 최종본)")
    ap.add_argument("--end-tail", type=float, default=0.8, help="--end-cue를 쓸 때 말이 끝난 뒤 남길 시간(초)")
    a = ap.parse_args()

    md = open(os.path.join(a.folder, "장면표.md"), encoding="utf-8").read()
    scenes = parse_scenes(md)
    ids = [s["id"] for s in scenes]
    # 범위 표기: "L01-L06" 또는 "L03-L05,S1E"
    want = []
    for part in a.range.split(","):
        lo, hi = (part.split("-") + [part])[:2]
        want += ids[ids.index(lo):ids.index(hi) + 1]
    byid = {s["id"]: s for s in scenes}
    sel = [byid[i] for i in want]

    W, H = SIZE[a.layout]
    tl, t = [], 0.0
    for s in sel:
        info = json.load(open(os.path.join(a.audio, s["id"] + ".json")))
        lead = s.get("lead", 0)
        dur = math.ceil(round((lead + info["duration"] + s["hold"]) * FPS, 6)) / FPS   # 프레임 단위로 맞춤(장면별 재사용을 위해)
        words = [dict(w, start=round(w["start"] + lead, 3), end=round(w["end"] + lead, 3)) for w in info["words"]]
        phrases = [dict(p, start=round(p["start"] + lead, 3), end=round(p["end"] + lead, 3)) for p in scene_phrases(info, MAXCH[a.layout])]
        tl.append({"id": s["id"], "start": round(t, 4), "dur": round(dur, 4), "audioDur": round(lead + info["duration"], 3),
                   "words": words, "phrases": phrases, "hold": s["hold"], "lead": lead})
        t += dur
    end_sec = (math.ceil(END_SEC * FPS) / FPS) if a.layout == "short" else 0
    end_at = None
    if a.end_cue:
        last = tl[-1]
        w = [x for x in last["words"] if a.end_cue in x["text"]]
        if not w:
            raise SystemExit(f"--end-cue 단어를 찾지 못함: {a.end_cue}")
        end_at = round(last["start"] + w[-1]["start"] - 0.15, 3)   # 같은 단어가 여러 번이면 마지막 것
        spoken_end = last["start"] + max(x["end"] for x in last["words"])
        end_sec = 0
        last["dur"] = round(math.ceil(round((spoken_end + a.end_tail - last["start"]) * FPS, 6)) / FPS, 4)
        last["hold"] = 0
        t = last["start"] + last["dur"]
    total = t + end_sec

    work = os.path.join(os.path.dirname(os.path.abspath(a.out)), "_work_" + os.path.basename(a.out).rsplit(".", 1)[0])
    shutil.rmtree(work, ignore_errors=True)
    os.makedirs(os.path.join(work, "f"))

    # 음성 이어 붙이기(멈춤·끝 화면은 무음)
    p0 = wav_info(os.path.join(a.audio, sel[0]["id"] + ".wav"))
    def silence(sec):
        return b"\0" * (int(sec * p0.framerate) * p0.sampwidth * p0.nchannels)
    with wave.open(os.path.join(work, "audio.wav"), "wb") as out:
        out.setparams(p0)
        bpf = p0.sampwidth * p0.nchannels
        for s, seg in zip(sel, tl):
            out.writeframes(silence(s.get("lead", 0)))
            with wave.open(os.path.join(a.audio, s["id"] + ".wav")) as w:
                fr = w.readframes(w.getnframes())
            need = int((seg["dur"] - s.get("lead", 0)) * p0.framerate) * bpf
            fr = fr[:need] if len(fr) >= need else fr + b"\0" * (need - len(fr))
            out.writeframes(fr)
        out.writeframes(silence(end_sec))

    sx, sy, sw, sh = STAGE[a.layout]
    css = CSS % dict(f=FONTS, W=W, H=H, sx=sx, sy=sy, sw=sw, sh=sh,
                     subx=80 if a.layout == "long" else 50, subw=W - (160 if a.layout == "long" else 100),
                     suby=935 if a.layout == "long" else 1500, subf=52 if a.layout == "long" else 56,
                     endf=72 if a.layout == "short" else 80,
                     hs=190 if a.layout == "long" else 170, hx=1700 if a.layout == "long" else 870,
                     hy=880 if a.layout == "long" else 1300)
    hook = f'<div id="hook">{a.hook}</div><div id="brand">눈높이가 바닥에 있는 공학 연구소</div>' if a.layout == "short" else ""
    endtext = a.endtext or "전체 설명은<br>관련 동영상에서"
    host_svg = open(os.path.join(HERE, "characters", "sojang_face.svg"), encoding="utf-8").read() if not a.no_host else ""
    cssf = os.path.join(a.folder, "style.css")
    extra_css = open(cssf, encoding="utf-8").read() if os.path.exists(cssf) else ""
    lib = open(os.path.join(HERE, "lib.js"), encoding="utf-8").read() + "\n" + open(os.path.join(HERE, "intro.js"), encoding="utf-8").read()
    scn = open(os.path.join(a.folder, "scenes.js"), encoding="utf-8").read()
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style><style>{extra_css}</style></head><body>
<div id="stage"></div>{hook}<div id="host">{host_svg}</div><div id="sub"></div>
<div id="endcard"><div class="a">{endtext}</div><div class="b">눈높이가 바닥에 있는 공학 연구소</div></div>
<script>const TL={json.dumps({"layout": a.layout, "scenes": tl, "endAt": end_at}, ensure_ascii=False)};</script>
<script>{lib}</script><script>{scn}</script><script>{RUNTIME}</script></body></html>"""
    page_path = os.path.join(work, "page.html")
    open(page_path, "w", encoding="utf-8").write(html)

    from playwright.sync_api import sync_playwright
    n = int(round(total * FPS))
    report = {"frames": n, "subtitle_max_lines": 0, "subtitle_over_1line": [], "console": []}
    # 장면 구간(프레임 번호). 마지막 끝 화면은 "끝" 구간
    segs = [(sc["id"], int(round(sc["start"] * FPS)), int(round((sc["start"] + sc["dur"]) * FPS))) for sc in tl]
    if n > segs[-1][2]:
        segs.append(("끝", segs[-1][2], n))
    variant = hashlib.md5(json.dumps([a.layout, a.hook, a.endtext, a.end_cue, a.end_tail, a.no_host]).encode()).hexdigest()[:8]
    cdir = os.path.join(SCENE_CACHE, os.path.basename(os.path.abspath(a.folder)), f"{a.layout}_{variant}")
    os.makedirs(cdir, exist_ok=True)

    def check_range(pg, f0, f1, shot_dir):
        """f0~f1 프레임을 찍고(shot_dir가 있으면) 자막·빈 화면·겹침을 검사. 결과는 장면 안 시간으로 돌려줌"""
        rep = {"subtitle_max_lines": 0, "subtitle_over_1line": []}
        last_sub, run, empty_flagged, seen = None, 0.0, False, set()
        for i in range(f0, f1):
            tt = i / FPS; k = i - f0
            pg.evaluate(f"render({tt})")
            s_ = pg.evaluate("document.getElementById('sub').dataset.t||''")
            if s_ and s_ != last_sub:
                lines = pg.evaluate("subLines()")
                rep["subtitle_max_lines"] = max(rep["subtitle_max_lines"], lines)
                if lines > MAXLINES[a.layout]:
                    rep["subtitle_over_1line"].append([round(k / FPS, 2), s_, lines])
                if lines >= 2 and pg.evaluate("subLastLine()") <= 1:
                    rep.setdefault("subtitle_orphan", []).append([round(k / FPS, 2), s_])
                last_sub = s_
            if shot_dir and (not a.preview or i % max(1, int(a.preview * FPS)) == 0):
                pg.screenshot(path=os.path.join(shot_dir, f"{i:05d}.jpg"), type="jpeg", quality=92 if not a.preview else 70)
            if k % 6 == 0:                                   # 0.2초마다: 말하는데 화면이 비어 있는지
                empty = pg.evaluate("stageEmpty()")
                run = (run + 0.2) if empty and s_ else 0.0
                if run >= 1.0 and not empty_flagged:
                    rep.setdefault("empty_stage", []).append(round(k / FPS - 1.0, 2)); empty_flagged = True
                if not empty:
                    empty_flagged = False
            if k % 15 == 0:                                  # 0.5초마다: 겹침·여백·진행자 가림·칸 넘침
                for o in pg.evaluate("overlaps()"):
                    key = json.dumps(o[:3], ensure_ascii=False)
                    if key not in seen:
                        seen.add(key); rep.setdefault("layout_issues", []).append([round(k / FPS, 1)] + o)
        return rep

    def merge(sid, f0, rep):
        t0 = f0 / FPS
        report["subtitle_max_lines"] = max(report["subtitle_max_lines"], rep.get("subtitle_max_lines", 0))
        report["subtitle_over_1line"] += [[round(t0 + x[0], 2)] + x[1:] for x in rep.get("subtitle_over_1line", [])]
        for k in ("subtitle_orphan", "empty_stage"):
            for x in rep.get(k, []):
                report.setdefault(k, []).append(round(t0 + x, 2) if not isinstance(x, list) else [round(t0 + x[0], 2)] + x[1:])
        for x in rep.get("layout_issues", []):
            report.setdefault("layout_issues", []).append([sid, round(t0 + x[0], 1)] + x[1:])

    def fingerprint(pg, f0, f1):
        """장면을 0.5초마다 한 장(+마지막 장) 찍어 작은 흑백 그림(지문)으로 줄임.
        브라우저가 그릴 때마다 글자 가장자리가 1~2픽셀 미세하게 달라지므로 정확한 해시 대신 작은 그림끼리 비교한다"""
        import io, numpy as np
        from PIL import Image
        idx = list(range(f0, f1, 15)) + [f1 - 1]
        out = []
        pg.evaluate("resetScene()")
        for i in idx:
            pg.evaluate(f"render({i / FPS})")
            im = Image.open(io.BytesIO(pg.screenshot(type="png"))).convert("L").resize((W // 12, H // 12), Image.BILINEAR)
            out.append(np.asarray(im, dtype=np.uint8))
        return np.stack(out)

    def same_fp(x, y):
        import numpy as np
        return x is not None and x.shape == y.shape and int(np.abs(x.astype(np.int16) - y.astype(np.int16)).max()) <= FP_TOL

    whole = a.preview or a.frames_only
    redo, reused = [], []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.on("console", lambda m: report["console"].append(m.text) if m.type in ("warning", "error") else None)
        pg.on("pageerror", lambda e: report["console"].append("pageerror: " + str(e)))
        pg.goto("file://" + page_path)
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(300)
        report["fonts"] = pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.weight).join(',')")
        for sid, f0, f1 in segs:                         # 미리 한 번씩 그려 글꼴·그림을 준비(첫 장면 지문이 흔들리지 않게)
            pg.evaluate("resetScene()"); pg.evaluate(f"render({(f0 + f1) // 2 / FPS})"); pg.screenshot(type="png")
        if whole:
            for sid, f0, f1 in segs:
                merge(sid, f0, check_range(pg, f0, f1, os.path.join(work, "f")))
        else:
            for sid, f0, f1 in segs:
                fp = fingerprint(pg, f0, f1)
                import numpy as np
                cj, cv, cf = os.path.join(cdir, sid + ".json"), os.path.join(cdir, sid + ".mp4"), os.path.join(cdir, sid + ".fp.npy")
                old = json.load(open(cj)) if os.path.exists(cj) else None
                ofp = np.load(cf) if os.path.exists(cf) else None
                if not a.full and old and same_fp(ofp, fp) and old["frames"] == f1 - f0 and os.path.exists(cv):
                    merge(sid, f0, old["report"]); reused.append(sid); continue
                d = os.path.join(work, "f_" + sid); os.makedirs(d, exist_ok=True)
                pg.evaluate("resetScene()")
                rep = check_range(pg, f0, f1, d)
                if not same_fp(fingerprint(pg, f0, f1), fp):   # 같은 순간을 두 번 찍어도 같은지(지문 신뢰성)
                    report.setdefault("fingerprint_unstable", []).append(sid)
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-start_number", str(f0), "-i", os.path.join(d, "%05d.jpg"),
                                "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), cv], check=True)
                np.save(cf, fp)
                json.dump({"frames": f1 - f0, "report": rep}, open(cj, "w"), ensure_ascii=False)
                merge(sid, f0, rep); redo.append(sid)
                shutil.rmtree(d, ignore_errors=True)
        b.close()
    report["다시 만든 장면"] = redo; report["재사용한 장면"] = len(reused)
    json.dump({"timeline": [{k: v for k, v in s.items() if k != "words"} for s in tl], "report": report},
              open(os.path.join(work, "report.json"), "w"), ensure_ascii=False, indent=1)
    if a.preview:
        from PIL import Image
        fs = sorted(os.listdir(os.path.join(work, "f")))
        for sc in tl:
            pick = [f for f in fs if sc["start"] <= int(f[:5]) / FPS < sc["start"] + sc["dur"]]
            if not pick: continue
            tw, th = (480, 270) if a.layout == "long" else (216, 384)
            cols = 6; rows = (len(pick) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * (tw + 6), rows * (th + 6)), "white")
            for k, f in enumerate(pick):
                sheet.paste(Image.open(os.path.join(work, "f", f)).resize((tw, th)), ((k % cols) * (tw + 6), (k // cols) * (th + 6)))
            sheet.save(os.path.join(work, f"sheet_{sc['id']}.jpg"), quality=80)
        print(json.dumps(report, ensure_ascii=False)[:3000]); return
    if a.frames_only:
        print(json.dumps(report, ensure_ascii=False)[:800]); return
    lst = os.path.join(work, "clips.txt")
    open(lst, "w").write("".join(f"file '{os.path.join(cdir, sid + '.mp4')}'\n" for sid, _, _ in segs))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-i", os.path.join(work, "audio.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.out], check=True)
    print(a.out, f"{total:.2f}초", f"{n}프레임", f"다시 만든 장면 {len(redo)}개, 재사용 {len(reused)}개")
    print(json.dumps(report, ensure_ascii=False)[:800])


if __name__ == "__main__":
    main()
