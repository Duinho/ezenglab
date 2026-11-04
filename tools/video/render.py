"""장면표 + 음성 + scenes.js → mp4

사용:
  python3 tools/video/render.py "영상/폴더" 음성폴더 long L01-L06 결과.mp4
  python3 tools/video/render.py "영상/폴더" 음성폴더 short L03-L06 결과.mp4 --hook "이 음식, 누가 좋아할까?"
"""
import argparse, json, os, re, shutil, subprocess, sys, wave
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
#host{position:absolute;width:%(hs)dpx;height:%(hs)dpx;left:%(hx)dpx;top:%(hy)dpx;filter:drop-shadow(0 6px 10px rgba(0,0,0,.12))}
#host svg{width:100%%;height:100%%}
#host #eyes{transform-box:fill-box;transform-origin:50%% 50%%}
#sub{position:absolute;left:%(subx)dpx;width:%(subw)dpx;top:%(suby)dpx;text-align:center}
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
window.render = function (t) {
  let sc = TL.scenes.find(s => t >= s.start && t < s.start + s.dur);
  const end = document.getElementById('endcard');
  if (!sc) { end.style.opacity = 1; sub.innerHTML = ''; return; }
  end.style.opacity = 0;
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
    const open = speaking && Math.floor(t * 9) % 2 === 0;
    const mo = host.querySelector('#mouth-open'), mc = host.querySelector('#mouth-closed');
    if (mo) { mo.style.display = open ? '' : 'none'; mc.style.display = open ? 'none' : ''; }
    const eyes = host.querySelector('#eyes');
    if (eyes) eyes.style.transform = (t % 3.7) < .13 ? 'scaleY(.12)' : '';
    host.style.transform = `translateY(${speaking ? Math.sin(t * 6) * 2 : 0}px)`;
  }
  const ph = sc.phrases.find(p => lt >= p.start - .05 && lt < p.end + .25);
  const txt = ph ? ph.text : '';
  if (sub.dataset.t !== txt) { sub.dataset.t = txt; sub.innerHTML = txt ? '<span></span>' : '';
    if (txt) { const box = sub.firstChild; txt.split(' ').forEach((w, i) => { if (i) box.appendChild(document.createTextNode(' ')); const e = document.createElement('i'); e.textContent = w; e.style.fontStyle = 'normal'; box.appendChild(e); }); } }
};
window.overlaps = () => {
  const st = stage.getBoundingClientRect(), out = [];
  const nodes = [...stage.children].filter(n => n.tagName.toLowerCase() !== 'svg' && !n.classList.contains('noqa') && parseFloat(getComputedStyle(n).opacity) > .3 && n.offsetWidth > 0);
  const R = nodes.map(n => { const r = n.getBoundingClientRect(); return { n, r, name: (n.className && n.className.baseVal === undefined ? n.className : '') + ':' + (n.textContent || '').trim().slice(0, 12) }; });
  for (const a of R) {
    if (a.r.left < st.left - 2 || a.r.right > st.right + 2 || a.r.top < st.top - 2 || a.r.bottom > st.bottom + 2) out.push(['밖', a.name]);
  }
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i].r, b = R[j].r;
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 4 && h > 4) out.push(['겹침', R[i].name, R[j].name, Math.round(w), Math.round(h)]);
  }
  return out;
};
window.subLastLine = () => { const ws = [...sub.querySelectorAll('i')]; if (!ws.length) return 0; const tops = ws.map(w => Math.round(w.getBoundingClientRect().top)); const last = Math.max(...tops); return tops.filter(t => t === last).length; };
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
    a = ap.parse_args()

    md = open(os.path.join(a.folder, "장면표.md"), encoding="utf-8").read()
    scenes = parse_scenes(md)
    ids = [s["id"] for s in scenes]
    lo, hi = (a.range.split("-") + [a.range])[:2]
    sel = [s for s in scenes if ids.index(lo) <= ids.index(s["id"]) <= ids.index(hi)]

    W, H = SIZE[a.layout]
    tl, t = [], 0.0
    for s in sel:
        info = json.load(open(os.path.join(a.audio, s["id"] + ".json")))
        lead = s.get("lead", 0)
        dur = lead + info["duration"] + s["hold"]
        words = [dict(w, start=round(w["start"] + lead, 3), end=round(w["end"] + lead, 3)) for w in info["words"]]
        phrases = [dict(p, start=round(p["start"] + lead, 3), end=round(p["end"] + lead, 3)) for p in scene_phrases(info, MAXCH[a.layout])]
        tl.append({"id": s["id"], "start": round(t, 3), "dur": round(dur, 3), "audioDur": round(lead + info["duration"], 3),
                   "words": words, "phrases": phrases, "hold": s["hold"], "lead": lead})
        t += dur
    end_sec = END_SEC if a.layout == "short" else 0
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
        for s in sel:
            out.writeframes(silence(s.get("lead", 0)))
            with wave.open(os.path.join(a.audio, s["id"] + ".wav")) as w:
                out.writeframes(w.readframes(w.getnframes()))
            out.writeframes(silence(s["hold"]))
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
    lib = open(os.path.join(HERE, "lib.js"), encoding="utf-8").read() + "\n" + open(os.path.join(HERE, "intro.js"), encoding="utf-8").read()
    scn = open(os.path.join(a.folder, "scenes.js"), encoding="utf-8").read()
    html = f"""<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div id="stage"></div>{hook}<div id="host">{host_svg}</div><div id="sub"></div>
<div id="endcard"><div class="a">{endtext}</div><div class="b">눈높이가 바닥에 있는 공학 연구소</div></div>
<script>const TL={json.dumps({"layout": a.layout, "scenes": tl}, ensure_ascii=False)};</script>
<script>{lib}</script><script>{scn}</script><script>{RUNTIME}</script></body></html>"""
    page_path = os.path.join(work, "page.html")
    open(page_path, "w", encoding="utf-8").write(html)

    from playwright.sync_api import sync_playwright
    n = int(round(total * FPS))
    report = {"frames": n, "subtitle_max_lines": 0, "subtitle_over_1line": [], "console": []}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H})
        pg.on("console", lambda m: report["console"].append(m.text) if m.type in ("warning", "error") else None)
        pg.on("pageerror", lambda e: report["console"].append("pageerror: " + str(e)))
        pg.goto("file://" + page_path)
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(300)
        report["fonts"] = pg.evaluate("[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.weight).join(',')")
        last_sub = None
        for i in range(n):
            tt = i / FPS
            pg.evaluate(f"render({tt})")
            s = pg.evaluate("document.getElementById('sub').dataset.t||''")
            if s and s != last_sub:
                lines = pg.evaluate("subLines()")
                report["subtitle_max_lines"] = max(report["subtitle_max_lines"], lines)
                if lines > MAXLINES[a.layout]:
                    report["subtitle_over_1line"].append([round(tt, 2), s, lines])
                if lines >= 2 and pg.evaluate("subLastLine()") <= 1:
                    report.setdefault("subtitle_orphan", []).append([round(tt, 2), s])
                last_sub = s
            pg.screenshot(path=os.path.join(work, "f", f"{i:05d}.jpg"), type="jpeg", quality=92)
            for sc in tl:
                if abs(tt - (sc["start"] + sc["dur"] - 0.15)) < 0.5 / FPS:
                    ov = pg.evaluate("overlaps()")
                    if ov:
                        report.setdefault("layout_issues", []).append([sc["id"], ov])
        b.close()
    json.dump({"timeline": [{k: v for k, v in s.items() if k != "words"} for s in tl], "report": report},
              open(os.path.join(work, "report.json"), "w"), ensure_ascii=False, indent=1)
    if a.frames_only:
        print(json.dumps(report, ensure_ascii=False)[:800]); return
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(work, "f", "%05d.jpg"),
                    "-i", os.path.join(work, "audio.wav"), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.out], check=True)
    print(a.out, f"{total:.2f}초", f"{n}프레임")
    print(json.dumps(report, ensure_ascii=False)[:800])


if __name__ == "__main__":
    main()
