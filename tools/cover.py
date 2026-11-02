"""강좌 표지(썸네일) 만들기: python3 tools/cover.py [폴더 ...]

- 1200x630 (블로거가 썸네일로 자르는 비율과 같음), 페이퍼로지 폰트
- 결과: <폴더>/cover.png  → blogger.py가 본문 맨 위 첫 그림으로 넣음(=썸네일)
- 새 강좌는 아래 COVERS에 한 줄 문구와 그림(motif)을 추가
"""
import os, re, sys, subprocess, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "tools", "fonts")

FIELD = {  # 분야: (강조색, 배경색)
    "인공지능": ("#2f6fde", "#f4f8ff"),
    "전자공학": ("#e0701b", "#fff7f0"),
    "전자 부품": ("#14936a", "#f1faf6"),
}

# 그림(440x440 SVG 안쪽). {c}=강조색
M = {}
def _fruit(x, y, star=True, check=True):
    o = (f'<circle cx="{x}" cy="{y}" r="34" fill="#f39a3d"/>'
         f'<path d="M{x-16} {y-16} q16 32 0 34 M{x} {y-26} q13 46 0 58 M{x+16} {y-16} q-16 32 0 34" stroke="#d9741c" stroke-width="4" fill="none"/>')
    if star:
        o += f'<polygon points="{x},{y-52} {x+6},{y-40} {x+19},{y-40} {x+9},{y-32} {x+13},{y-20} {x},{y-28} {x-13},{y-20} {x-9},{y-32} {x-19},{y-40} {x-6},{y-40}" fill="#56a64b"/>'
    if check:
        o += (f'<rect x="{x+22}" y="{y+16}" width="30" height="30" rx="8" fill="#14936a"/>'
              f'<path d="M{x+29} {y+31} l6 6 l11 -12" stroke="#fff" stroke-width="4" fill="none"/>')
    return o


M["fruit"] = (_fruit(95, 105) + _fruit(95, 230) + _fruit(95, 355) +
    '<line x1="170" y1="230" x2="238" y2="230" stroke="#9aa6bb" stroke-width="5"/>'
    '<polygon points="256,230 234,218 234,242" fill="#9aa6bb"/>'
    '<circle cx="335" cy="230" r="72" fill="{c}" fill-opacity=".07" stroke="{c}" stroke-width="4" stroke-dasharray="12 9"/>'
    + _fruit(335, 236, star=False, check=False).replace('r="34"', 'r="44"') +
    '<ellipse cx="335" cy="190" rx="26" ry="12" fill="#56a64b"/>'
    '<text x="335" y="355" text-anchor="middle" font-family="P" font-weight="800" font-size="44" fill="{c}">?</text>')

M["knn"] = """
<circle cx="220" cy="225" r="105" fill="{c}" fill-opacity=".07" stroke="{c}" stroke-width="4" stroke-dasharray="12 9"/>
<g stroke="#9db3d9" stroke-width="3"><line x1="220" y1="225" x2="160" y2="170"/><line x1="220" y1="225" x2="290" y2="195"/><line x1="220" y1="225" x2="200" y2="305"/></g>
<g fill="#f08a24"><circle cx="160" cy="170" r="20"/><circle cx="290" cy="195" r="20"/><circle cx="80" cy="95" r="20"/><circle cx="120" cy="300" r="20"/><circle cx="95" cy="200" r="20"/></g>
<g fill="#22a06b"><circle cx="200" cy="305" r="20"/><circle cx="360" cy="330" r="20"/><circle cx="350" cy="90" r="20"/><circle cx="300" cy="380" r="20"/><circle cx="380" cy="215" r="20"/></g>
<circle cx="220" cy="225" r="24" fill="#fff" stroke="#14213d" stroke-width="5"/>
<text x="220" y="236" text-anchor="middle" font-family="P" font-weight="800" font-size="30" fill="#14213d">?</text>"""

M["line"] = """
<g stroke="#c9d3e3" stroke-width="3"><line x1="60" y1="380" x2="400" y2="380"/><line x1="60" y1="380" x2="60" y2="50"/></g>
<line x1="70" y1="350" x2="400" y2="90" stroke="{c}" stroke-width="7" stroke-linecap="round"/>
<g fill="#f08a24"><circle cx="100" cy="300" r="14"/><circle cx="140" cy="310" r="14"/><circle cx="170" cy="250" r="14"/><circle cx="215" cy="262" r="14"/><circle cx="245" cy="205" r="14"/><circle cx="280" cy="215" r="14"/></g>
<g stroke="#f08a24" stroke-width="3" stroke-dasharray="5 5"><line x1="140" y1="310" x2="140" y2="296"/><line x1="215" y1="262" x2="215" y2="236"/><line x1="245" y1="205" x2="245" y2="213"/></g>
<line x1="350" y1="380" x2="350" y2="130" stroke="#14213d" stroke-width="3" stroke-dasharray="8 7"/>
<circle cx="350" cy="130" r="22" fill="#fff" stroke="#14213d" stroke-width="5"/>
<text x="350" y="141" text-anchor="middle" font-family="P" font-weight="800" font-size="28" fill="#14213d">?</text>"""

M["circuit"] = """
<rect x="90" y="110" width="260" height="230" rx="8" fill="none" stroke="#14213d" stroke-width="6"/>
<rect x="160" y="96" width="120" height="28" fill="#fff"/>
<path d="M160 110 l12 -18 l20 36 l20 -36 l20 36 l20 -36 l20 36 l8 -18" stroke="{c}" stroke-width="7" fill="none" stroke-linejoin="round"/>
<rect x="76" y="190" width="28" height="70" fill="#fff"/>
<line x1="64" y1="205" x2="116" y2="205" stroke="#14213d" stroke-width="7"/><line x1="76" y1="245" x2="104" y2="245" stroke="#14213d" stroke-width="7"/>
<polygon points="250,340 222,326 222,354" fill="{c}"/>
<g font-family="P" font-weight="800" font-size="42">
<text x="40" y="160" fill="#14213d">V</text><text x="205" y="70" fill="{c}">R</text><text x="208" y="405" fill="{c}">I</text></g>
"""

M["ohm"] = """
<polygon points="220,60 400,370 40,370" fill="{c}" fill-opacity=".08" stroke="{c}" stroke-width="7" stroke-linejoin="round"/>
<line x1="125" y1="225" x2="315" y2="225" stroke="{c}" stroke-width="6"/>
<line x1="220" y1="225" x2="220" y2="370" stroke="{c}" stroke-width="6"/>
<g font-family="P" font-weight="800" fill="#14213d" text-anchor="middle">
<text x="220" y="190" font-size="80">V</text><text x="148" y="330" font-size="72">I</text><text x="292" y="330" font-size="72">R</text></g>"""

M["junction"] = """
<g stroke="#14213d" stroke-width="8" stroke-linecap="round" fill="none"><path d="M50 220 L200 220"/><path d="M200 220 L380 110"/><path d="M200 220 L380 330"/></g>
<circle cx="200" cy="220" r="16" fill="#14213d"/>
<g fill="{c}"><polygon points="140,220 112,206 112,234"/><polygon points="300,159 268,162 282,186" /><polygon points="300,281 282,254 268,278"/></g>
<g font-family="P" font-weight="800" font-size="36" fill="{c}"><text x="95" y="190">I₁</text><text x="300" y="120">I₂</text><text x="300" y="350">I₃</text></g>
<rect x="95" y="372" width="250" height="52" rx="26" fill="{c}"/>
<text x="220" y="408" text-anchor="middle" font-family="P" font-weight="800" font-size="30" fill="#fff">I₁ = I₂ + I₃</text>"""

M["divider"] = """
<g stroke="#14213d" stroke-width="6" fill="none" stroke-linejoin="round">
<path d="M150 40 L150 90"/><path d="M150 90 l-20 12 l40 18 l-40 18 l40 18 l-40 18 l20 12"/>
<path d="M150 186 L150 236"/><path d="M150 236 l-20 12 l40 18 l-40 18 l40 18 l-40 18 l20 12"/><path d="M150 332 L150 380"/>
<path d="M120 380 L180 380 M132 394 L168 394 M144 408 L156 408"/></g>
<g font-family="P" font-weight="800" font-size="30" fill="#14213d"><text x="60" y="148">R₁</text><text x="60" y="294">R₂</text></g>
<g stroke="{c}" stroke-width="5" fill="none"><path d="M215 90 q12 0 12 12 v72 q0 12 -12 12"/><path d="M215 236 q12 0 12 12 v72 q0 12 -12 12"/></g>
<g font-family="P" font-weight="800" font-size="40" fill="{c}"><text x="245" y="152">V₁</text><text x="245" y="298">V₂</text></g>
<text x="190" y="40" font-family="P" font-weight="800" font-size="32" fill="#14213d">V</text>"""

M["blocks"] = """
<defs><marker id="ar2" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#9aa6bb"/></marker></defs>
<g font-family="P" font-weight="800" font-size="30" text-anchor="middle">
<rect x="40" y="45" width="230" height="78" rx="18" fill="{c}" fill-opacity=".12" stroke="{c}" stroke-width="4"/><text x="155" y="95" fill="{c}">센서</text>
<rect x="105" y="180" width="230" height="78" rx="18" fill="{c}"/><text x="220" y="230" fill="#fff">제어 장치</text>
<rect x="170" y="315" width="230" height="78" rx="18" fill="{c}" fill-opacity=".12" stroke="{c}" stroke-width="4"/><text x="285" y="365" fill="{c}">액추에이터</text></g>
<g stroke="#9aa6bb" stroke-width="5" fill="none" marker-end="url(#ar2)"><path d="M155 130 q0 30 -0 45"/><path d="M285 265 q0 25 0 42"/></g>"""

M["resistor"] = """
<line x1="20" y1="220" x2="420" y2="220" stroke="#9aa6bb" stroke-width="9" stroke-linecap="round"/>
<rect x="110" y="165" width="220" height="110" rx="50" fill="#e9d3a8" stroke="#c9ad78" stroke-width="4"/>
<g><rect x="148" y="167" width="20" height="106" fill="#d22f2f"/><rect x="183" y="167" width="20" height="106" fill="#d22f2f"/><rect x="218" y="167" width="20" height="106" fill="#7a4a21"/><rect x="278" y="167" width="20" height="106" fill="#c9a227"/></g>
<text x="220" y="370" text-anchor="middle" font-family="P" font-weight="800" font-size="44" fill="{c}">220Ω</text>"""

COVERS = {  # 폴더: (그림, 한 줄 문구 — 강좌 본문 문장에서 가져옴, \n=줄바꿈)
    "ai-110-first-step": ("fruit", "데이터에서 규칙을 배워\n처음 보는 상황에서도 판단해요"),
    "ai-120-knn": ("knn", "나와 비슷한 이웃을 보면\n내가 누군지 알 수 있다"),
    "ai-130-linear-regression": ("line", "가장 잘 지나는 직선으로\n새 값의 숫자를 예측해요"),
    "ee-110-voltage-current-resistance": ("circuit", "미는 힘, 흐르는 양,\n그 흐름을 막는 정도"),
    "ee-120-ohms-law": ("ohm", "전압·전류·저항을\n하나의 식으로 묶었어요"),
    "ee-130-kirchhoff": ("junction", "들어온 전류와 나간 전류는 같고\n한 바퀴 돌면 전압도 같아요"),
    "ee-140-voltage-divider": ("divider", "저항을 한 줄로 이으면\n저항 크기의 비율대로 나눠요"),
    "parts-110-map": ("blocks", "앞으로 배울 부품들이\n어느 칸에 들어가는지 보는 지도"),
    "parts-120-resistor": ("resistor", "전류가 지나가기 어렵게 만들어\n흐름을 원하는 만큼 줄여요"),
}

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:P;src:url(file://{font}/Paperlogy-4Regular.ttf);font-weight:400}}
@font-face{{font-family:P;src:url(file://{font}/Paperlogy-6SemiBold.ttf);font-weight:600}}
@font-face{{font-family:P;src:url(file://{font}/Paperlogy-8ExtraBold.ttf);font-weight:800}}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;font-family:P;background:{bg};position:relative;overflow:hidden;word-break:keep-all}}
.bar{{position:absolute;left:0;top:0;width:18px;height:630px;background:{c}}}
.col{{position:absolute;left:80px;top:70px;width:580px;height:450px;display:flex;flex-direction:column}}
.chip{{align-self:flex-start;background:{c};color:#fff;font-weight:600;font-size:26px;padding:8px 20px;border-radius:30px}}
h1{{margin-top:34px;font-weight:800;font-size:96px;line-height:1.1;color:#14213d;letter-spacing:-1px;white-space:nowrap}}
h2{{margin-top:14px;font-weight:600;font-size:46px;line-height:1.3;color:{c};text-wrap:balance}}
.quote{{margin-top:auto;font-size:30px;line-height:1.5;color:#3d4a63}}
.blog{{position:absolute;left:80px;bottom:52px;font-size:24px;color:#7a869c;font-weight:600}}
svg{{position:absolute;right:60px;top:95px}}
</style></head><body><div class="bar"></div>
<div class="col"><span class="chip">{field}</span><h1>{t1}</h1><h2>{t2}</h2><p class="quote">{quote}</p></div>
<p class="blog">눈높이가 바닥에 있는 공학 연구소</p>
<svg width="440" height="440" viewBox="0 0 440 440">
<defs><marker id="ar" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#9aa6bb"/></marker></defs>
<rect x="0" y="0" width="440" height="440" rx="28" fill="#fff" stroke="#d6e2f5" stroke-width="3"/>{motif}
</svg></body></html>"""

FIT_JS = """() => {  // 제목이 칸보다 넓으면 글자를 줄임(최소 64px), 부제가 3줄 이상이면 줄임
  const h1 = document.querySelector('h1'), h2 = document.querySelector('h2'), col = document.querySelector('.col');
  let s = 96; while (h1.scrollWidth > col.clientWidth && s > 64) { s -= 2; h1.style.fontSize = s + 'px'; }
  let t = 46; const lines = () => Math.round(h2.getBoundingClientRect().height / (t * 1.3));
  while (lines() > 2 && t > 34) { t -= 2; h2.style.fontSize = t + 'px'; }
  const q = document.querySelector('.quote').getBoundingClientRect(), b = h2.getBoundingClientRect();
  return {h1: s, h2: t, h2lines: lines(), h1fit: h1.scrollWidth <= col.clientWidth, gap: Math.round(q.top - b.bottom),
          fonts: [...document.fonts].map(f => f.status)};
}"""


def meta(folder):
    t = open(os.path.join(ROOT, folder, "index.md"), encoding="utf-8").read()
    title = re.search(r'^title:\s*"?(.*?)"?\s*$', t, re.M).group(1)
    field = re.search(r'^field:\s*(.*?)\s*$', t, re.M).group(1)
    return title, field


def build(folders):
    import html
    from playwright.sync_api import sync_playwright
    report = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={"width": 1200, "height": 630})
        for folder in folders:
            motif, quote = COVERS[folder]
            title, field = meta(folder)
            t1, _, t2 = title.partition(":")
            c, bg = FIELD[field]
            page = PAGE.format(font=FONT, bg=bg, c=c, field=html.escape(field), t1=html.escape(t1.strip()),
                               t2=html.escape(t2.strip()), quote="<br>".join(map(html.escape, quote.split("\n"))),
                               motif=M[motif].replace("{c}", c))
            tmp = os.path.join(ROOT, "build", f"cover_{folder}.html")
            os.makedirs(os.path.dirname(tmp), exist_ok=True)
            open(tmp, "w", encoding="utf-8").write(page)
            p.goto("file://" + tmp)
            p.evaluate("document.fonts.ready")
            p.wait_for_timeout(300)
            report[folder] = p.evaluate(FIT_JS)
            p.screenshot(path=os.path.join(ROOT, folder, "cover.png"))
        b.close()
    return report


if __name__ == "__main__":
    fs = [f.strip("/") for f in sys.argv[1:]] or list(COVERS)
    for k, v in build(fs).items():
        print(k, json.dumps(v, ensure_ascii=False))
