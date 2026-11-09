"""강좌를 만든 순서·올린 순서와 상관없이, 보이는 순서를 강좌 번호대로 맞추는 도구.

사용법(저장소 맨 위에서)
  python3 tools/정리.py            # 원고 정리 → (커밋·푸시돼 있으면) 블로그·목차 페이지·재생목록 정리
  python3 tools/정리.py --확인      # 아무것도 바꾸지 않고 어긋난 곳만 보여 줌

하는 일
  1. 원고: 같은 분야 강좌를 번호순으로 놓고 각 index.md의 「이전 강좌」「다음 강좌」 줄을 다시 쓴다.
     index.md에 <!-- 시리즈 목차 --> … <!-- /시리즈 목차 --> 가 있으면 그 사이를 그 분야 강좌 목록으로 다시 쓴다(인트로 글용).
  2. README.md의 강좌 목록(<!-- 강좌 목록 --> … <!-- /강좌 목록 -->)을 다시 쓴다.
     1·2에서 바뀐 파일이 있으면 여기서 멈춘다. 커밋·푸시한 뒤 다시 실행한다(블로그 그림 주소가 커밋을 따라가서).
  3. 블로그: 게시된 글 중 「강좌 이동」 줄·시리즈 목차·끝 링크 상자만 달라진 글을 다시 반영한다.
     본문이 게시본과 다른 글은 건드리지 않고 알려 준다.
  4. 블로그 「강좌 목차」 페이지를 번호순으로 다시 쓴다(없으면 만든다).
  5. 유튜브 과목 재생목록이 번호순인지 보고 어긋난 자리를 고친다.
"""
import html
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import blogger as B  # noqa: E402

ROOT = B.ROOT
FIELDS = ["인공지능", "전자공학", "전자 부품", "생활 기기"]   # 블로그 목차·README에 놓는 분야 순서(없는 분야는 뒤에)
PAGES_JSON = os.path.join(ROOT, "pages.json")
TOC_TITLE = "강좌 목차"
LIST_RE = re.compile(r"(<!-- 강좌 목록 -->\n)(.*?)(<!-- /강좌 목록 -->)", re.S)
SERIES_RE = re.compile(r"(<!-- 시리즈 목차 -->\n)(.*?)(<!-- /시리즈 목차 -->)", re.S)


def lectures():
    """{분야: [(번호, 폴더, 제목), ...]} 번호순"""
    out = {}
    for d in sorted(os.listdir(ROOT)):
        if not os.path.isfile(os.path.join(ROOT, d, "index.md")):
            continue
        meta, _ = B.read_lecture(d)
        out.setdefault(meta["field"], []).append((int(meta["order"]), d, meta["title"]))
    for v in out.values():
        v.sort()
    return {f: out[f] for f in sorted(out, key=lambda f: (FIELDS.index(f) if f in FIELDS else 99, f))}


def md_link(folder, title):
    return f"[{title}](<../{folder}/index.md>)"


def fix_md(apply=True):
    changed = []
    L = lectures()
    for field, items in L.items():
        for i, (num, folder, title) in enumerate(items):
            p = os.path.join(ROOT, folder, "index.md")
            src = open(p, encoding="utf-8").read()
            prev = md_link(items[i - 1][1], items[i - 1][2]) if i > 0 else f"없어요. {field} 강좌의 첫 강좌예요."
            nxt = md_link(items[i + 1][1], items[i + 1][2]) if i + 1 < len(items) else "준비 중이에요."
            new = re.sub(r"^- 이전 강좌: .*$", lambda m: "- 이전 강좌: " + prev, src, count=1, flags=re.M)
            new = re.sub(r"^- 다음 강좌: .*$", lambda m: "- 다음 강좌: " + nxt, new, count=1, flags=re.M)
            series = "".join(f"{k}. " + (f"**{t}** (지금 보는 글)" if f == folder else md_link(f, t)) + "\n"
                             for k, (_, f, t) in enumerate(items, 1))
            new = SERIES_RE.sub(lambda m: m.group(1) + "\n" + series + "\n" + m.group(3), new)
            if "- 이전 강좌: " not in src:
                print("  알림:", folder, "에 「강좌 이동」 줄이 없음(그대로 둠)")
            if new != src:
                changed.append(p)
                if apply:
                    open(p, "w", encoding="utf-8").write(new)
    # README
    p = os.path.join(ROOT, "README.md")
    src = open(p, encoding="utf-8").read()
    body = ""
    for field, items in L.items():
        body += f"\n### {field}\n\n" + "".join(f"- {n} · [{t}](<{f}/index.md>)\n" for n, f, t in items)
    new = LIST_RE.sub(lambda m: m.group(1) + body + "\n" + m.group(3), src)
    if not LIST_RE.search(src):
        print("  알림: README.md에 <!-- 강좌 목록 --> 표시가 없음")
    if new != src:
        changed.append(p)
        if apply:
            open(p, "w", encoding="utf-8").write(new)
    return changed


def pushed():
    st = subprocess.run(["git", "-C", ROOT, "status", "--porcelain", "-b"], capture_output=True, text=True).stdout
    first, rest = st.split("\n", 1)
    dirty = [l for l in rest.splitlines() if l.endswith("index.md") or l.endswith("README.md")]
    return "ahead" not in first and not dirty, first, dirty


NAV_RE = re.compile(r"<li>(이전|다음) 강좌: .*?</li>", re.S)
SER_HTML_RE = re.compile(r"(<!-- 시리즈 목차 -->)?<ol>(?:(?!</ol>).)*?(?:<a href=\"[^\"]*\"|「)(?:(?!</ol>).)*?</ol>", re.S)


def norm(c):
    c = re.sub(r"<style>.*?</style>", "", c, flags=re.S)
    c = re.sub(r'<div class="callout ezlinks">.*?</div>(?=</div>$)', "", c, flags=re.S)
    c = re.sub(r"cdn\.jsdelivr\.net/gh/Duinho/ezenglab@[0-9a-f]+/", "CDN/", c)
    c = NAV_RE.sub("<li>NAV</li>", c)
    return c


def sync_blog(apply=True):
    posts = B.load_posts()
    for folder, info in posts.items():
        if info.get("status") != "LIVE" or not os.path.isfile(os.path.join(ROOT, folder, "index.md")):
            continue
        live = B.api("GET", f"/posts/{info['id']}", params={"fields": "content"})["content"]
        _, new = B.to_html(folder)
        cdn = lambda c: re.sub(r"cdn\.jsdelivr\.net/gh/Duinho/ezenglab@[0-9a-f]+/", "CDN/", c)
        if cdn(live) == cdn(new):   # 그림 주소의 커밋 번호만 다름 = 바뀐 것 없음
            continue
        box = lambda c: (re.findall(r'<div class="callout ezlinks">.*?</div>(?=</div>$)', c, flags=re.S) or [""])[0]
        if box(live) != box(new):    # 영상 링크 상자는 영상 공개 때 blogger.py links로만 바꾼다(비공개 영상 링크 방지)
            print("  블로그 건너뜀(끝 링크 상자가 다름 — 영상 공개 때 links 명령으로):", folder)
            continue
        has_series ="<!-- 시리즈 목차 -->" in open(os.path.join(ROOT, folder, "index.md"), encoding="utf-8").read()
        a, b = norm(live), norm(new)
        if has_series:   # 인트로 글: 시리즈 목차 목록도 바뀔 수 있음
            a, b = SER_HTML_RE.sub("SERIES", a, count=1), SER_HTML_RE.sub("SERIES", b, count=1)
        if a != b:
            print("  블로그 건너뜀(본문이 게시본과 다름, 먼저 확인 필요):", folder)
            continue
        print("  블로그 반영:", folder, "" if apply else "(확인만)")
        if apply:
            B.draft(folder)


def toc_html():
    posts = B.load_posts()
    out = '<p>강좌를 공부 순서대로 모았어요. 글을 올린 날짜와 상관없이 이 순서대로 보시면 돼요.</p>'
    for field, items in lectures().items():
        out += f"<h2>{html.escape(field)}</h2><ol>"
        for n, f, t in items:
            url = posts.get(f, {}).get("url") if posts.get(f, {}).get("status") == "LIVE" else None
            out += (f'<li><a href="{url}">{html.escape(t)}</a></li>' if url
                    else f"<li>{html.escape(t)} (준비 중)</li>")
        out += "</ol>"
    return f'{B.STYLE}<div class="ezl">{out}</div>'


def page_api(method, path, body=None, params=None):
    return B.api(method, "/pages" + path, body, params)


def sync_toc(apply=True):
    pages = json.load(open(PAGES_JSON, encoding="utf-8")) if os.path.exists(PAGES_JSON) else {}
    content = toc_html()
    info = pages.get(TOC_TITLE)
    if info:
        cur = page_api("GET", f"/{info['id']}", params={"fields": "content,status,url"})
        if cur.get("content") == content:
            print("  목차 페이지 그대로:", cur.get("url")); return
        print("  목차 페이지 다시 씀", "" if apply else "(확인만)")
        if apply:
            r = page_api("PATCH", f"/{info['id']}", {"title": TOC_TITLE, "content": content})
            info.update(url=r.get("url"), status=r.get("status"))
    else:
        print("  목차 페이지 새로 만듦", "" if apply else "(확인만)")
        if not apply:
            return
        r = page_api("POST", "/", {"title": TOC_TITLE, "content": content}, {"isDraft": "false"})
        info = pages[TOC_TITLE] = {"id": r["id"], "url": r.get("url"), "status": r.get("status")}
    json.dump(pages, open(PAGES_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("  목차 페이지:", info.get("url"))


def sync_playlists(apply=True):
    try:
        sys.path.insert(0, os.path.join(ROOT, "tools", "video"))
        import youtube_upload as Y
    except Exception as e:  # 토큰이 없는 곳에서도 블로그 정리는 되게
        print("  재생목록 건너뜀:", e); return
    if not os.path.exists(Y.PL_REG):
        print("  재생목록 기록 없음"); return
    reg = json.load(open(Y.PL_REG, encoding="utf-8"))
    for subj, pl in reg.items():
        num = {x["videoId"]: x["번호"] for x in pl["강좌"]}
        for _ in range(60):
            items = sorted(Y.api("GET", f"playlistItems?part=snippet&maxResults=50&playlistId={pl['id']}")["items"],
                           key=lambda i: i["snippet"]["position"])
            cur = [i["snippet"]["resourceId"]["videoId"] for i in items]
            known = sorted([v for v in cur if v in num], key=lambda v: num[v])
            want = known + [v for v in cur if v not in num]          # 기록에 없는 영상은 맨 뒤, 원래 순서대로
            missing = [v for v in num if v not in cur]
            if missing:
                print(f"  재생목록 {subj}: 기록엔 있는데 재생목록에 없음 {missing}")
            if cur == want:
                print(f"  재생목록 {subj}: 번호순 맞음 ({len(cur)}개)"); break
            i = next(k for k in range(len(cur)) if cur[k] != want[k])
            it = next(x for x in items if x["snippet"]["resourceId"]["videoId"] == want[i])
            print(f"  재생목록 {subj}: {want[i]} 를 {i}번 자리로", "" if apply else "(확인만)")
            if not apply:
                break
            Y.api("PUT", "playlistItems?part=snippet", {"id": it["id"], "snippet": {
                "playlistId": pl["id"], "position": i, "resourceId": it["snippet"]["resourceId"]}})


def main():
    apply = "--확인" not in sys.argv
    print("1·2. 원고·README")
    changed = fix_md(apply)
    for p in changed:
        print("  바뀜" if apply else "  바뀔 곳", os.path.relpath(p, ROOT))
    ok, head, dirty = pushed()
    if apply and (changed or not ok):
        print("멈춤: 원고가 바뀌었거나 커밋·푸시 전이에요. 커밋·푸시한 뒤 다시 실행하세요.", head, dirty)
        return
    print("3. 블로그 글"); sync_blog(apply)
    print("4. 목차 페이지"); sync_toc(apply)
    print("5. 유튜브 재생목록"); sync_playlists(apply)


if __name__ == "__main__":
    main()
