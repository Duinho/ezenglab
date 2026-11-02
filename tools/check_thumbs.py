"""게시 후 썸네일 잘림 검사: python3 tools/check_thumbs.py

블로거는 표지를 목록(정사각형)·홈 맨 위(945x600)·공유(1200x630)용으로 '내용을 보고' 자동으로 잘라요.
실제 블로그 목록에서 썸네일을 받아, 표지의 왼쪽에서 몇 px 지점부터 잘렸는지 찾아요.
목록 정사각형이 0px(=왼쪽 분야색 판 그대로)이 아니면 그 강좌 표지 그림 배치를 고쳐야 해요.
"""
import json, os, re, sys, io, urllib.parse
from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = "https://ezenglab.blogspot.com"
SIZES = {"목록(정사각형)": "w256-h256-p-k-no-nu", "홈 맨 위": "w945-h600-p-k-no-nu", "공유": "w1200-h630-p-k-no-nu"}


def titles():
    out = {}
    for d in sorted(os.listdir(ROOT)):
        f = os.path.join(ROOT, d, "index.md")
        if os.path.isfile(f):
            t = re.search(r'^title:\s*"?(.*?)"?\s*$', open(f, encoding="utf-8").read(), re.M).group(1)
            fields = re.search(r'^field:\s*(.*?)\s*$', open(f, encoding="utf-8").read(), re.M).group(1)
            out[t] = (d, fields)
    return out


def offset(cover, th):
    W, H = th.size
    sc = H / cover.height
    c = cover.resize((round(cover.width * sc), H))
    best = min((sum(ImageStat.Stat(ImageChops.difference(c.crop((x, 0, x + W, H)), th)).mean), x)
               for x in range(0, c.width - W + 1))
    return round(best[1] / sc), best[0]


def main():
    T = titles()
    src = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        p = b.new_page(viewport={"width": 1300, "height": 1600})
        for field in sorted({v[1] for v in T.values()}):
            for _ in range(3):
                p.goto(f"{BLOG}/search/label/{urllib.parse.quote(field)}?max-results=50")
                try:
                    p.wait_for_selector(".post-outer-container", timeout=30000)
                    break
                except Exception:
                    continue
            p.wait_for_timeout(1500)
            for e in p.query_selector_all(".post-outer-container"):
                t = e.inner_text().split("\n")[0].strip()
                i = e.query_selector(".snippet-thumbnail img")
                if i and t in T:
                    src[t] = i.get_attribute("src").rsplit("=", 1)[0]
        bad = 0
        for t, (d, _) in T.items():
            if t not in src:
                print(d, "목록에서 못 찾음(아직 게시 전이거나 표지 없음)")
                continue
            cover = Image.open(os.path.join(ROOT, d, "cover.png")).convert("RGB")
            res = []
            for name, q in SIZES.items():
                th = Image.open(io.BytesIO(p.request.get(src[t] + "=" + q).body())).convert("RGB")
                x, diff = offset(cover, th)
                ok = (x == 0) if name != "공유" else (x == 0 and th.size == (1200, 630))
                bad += not ok
                res.append(f"{name} {x}px{'' if ok else ' ← 확인 필요'}")
            print(d.ljust(34), " | ".join(res))
        b.close()
    print("문제", bad, "건")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
