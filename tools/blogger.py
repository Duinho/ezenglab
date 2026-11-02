"""강좌 원본(index.md)을 블로거 글로 바꿔 올리는 도구.

사용법
  python3 tools/blogger.py html  <폴더>          # HTML 미리 만들기(build/<폴더>.html)
  python3 tools/blogger.py draft <폴더>          # 블로거 임시저장 글 만들기/고치기
  python3 tools/blogger.py publish <폴더>        # 게시

인증 파일은 저장소 밖(BLOGGER_AUTH_DIR, 기본 /home/claude/blogger)에 둔다.
"""
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUTH_DIR = os.environ.get("BLOGGER_AUTH_DIR", "/home/claude/blogger")
BLOG_ID = "6080462052485759032"
REPO = "Duinho/ezenglab"
POSTS_JSON = os.path.join(ROOT, "posts.json")

STYLE = """<style>
.ezl{line-height:1.8;word-break:keep-all}
.ezl figure{margin:24px 0;text-align:center}
.ezl figure img{max-width:100%;height:auto;border-radius:6px}
.ezl figcaption{font-size:.9em;color:#666;margin-top:6px}
.ezl table{border-collapse:collapse;width:100%;margin:16px 0;font-size:.95em}
.ezl th,.ezl td{border:1px solid #d0d7de;padding:8px 10px;text-align:left;vertical-align:top}
.ezl th,.ezl td{word-break:keep-all;text-wrap:balance}
.ezl th{background:#f3f6fa;white-space:nowrap;text-wrap:nowrap}
.ezl .tw{overflow-x:auto;margin:16px 0}
.ezl .tw table{margin:0}
.ezl details{border:1px solid #d0d7de;border-radius:6px;padding:8px 14px;margin:14px 0;background:#fafbfc}
.ezl summary{cursor:pointer;font-weight:bold;color:#0b5cad}
.ezl .callout{background:#eaf2fb;border-left:4px solid #3b6fb6;border-radius:6px;padding:12px 16px;margin:18px 0}
.ezl .callout>p:first-child{font-weight:bold}
.ezl .callout.warn{background:#fff8e1;border-left-color:#e0a800}
.ezl .callout.warn>p:first-child{font-weight:normal}
.ezl .cover{margin:0 0 18px}
.ezl .cover img{border-radius:10px}
.ezl .lead{font-size:1.08em;color:#333;margin:0 0 14px}
.ezl .toc{background:#f6f8fa;border-radius:6px;padding:10px 18px;margin:12px 0 24px}
.ezl .toc ul{margin:6px 0;padding-left:4px;list-style:none}
.ezl .toc li{margin:2px 0}
.ezl .math{overflow-x:auto;margin:14px 0}
</style>"""
MATHJAX = ('<script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]]}};</script>'
           '<script async src="https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js"></script>')


def load_posts():
    if os.path.exists(POSTS_JSON):
        return json.load(open(POSTS_JSON, encoding="utf-8"))
    return {}


def save_posts(p):
    json.dump(p, open(POSTS_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(POSTS_JSON, "a").write("\n")


def read_lecture(folder):
    src = open(os.path.join(ROOT, folder, "index.md"), encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", src, re.S)
    meta = {}
    for line in m.group(1).splitlines():
        k, v = line.split(":", 1)
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        elif v.startswith('"') and v.endswith('"'):
            v = v[1:-1]
        meta[k.strip()] = v
    return meta, src[m.end():]


def head_sha():
    return subprocess.check_output(["git", "-C", ROOT, "rev-parse", "HEAD"], text=True).strip()


def slug(text, used):
    s = re.sub(r"[^0-9A-Za-z가-힣]+", "-", text).strip("-").lower() or "sec"
    base, i = s, 2
    while s in used:
        s = f"{base}-{i}"; i += 1
    used.add(s)
    return s


def mention_html(nid, posts, by_notion):
    folder = by_notion.get(nid.replace("-", ""))
    if not folder:
        return "(준비 중인 강좌)"
    info = posts.get(folder, {})
    meta, _ = read_lecture(folder)
    title = meta["title"]
    if info.get("url"):
        return f'<a href="{info["url"]}">{html.escape(title)}</a>'
    return f"「{html.escape(title)}」"


def to_html(folder, sha=None):
    meta, body = read_lecture(folder)
    posts = load_posts()
    by_notion = {}
    for d in sorted(os.listdir(ROOT)):
        if os.path.isfile(os.path.join(ROOT, d, "index.md")):
            mm, _ = read_lecture(d)
            if mm.get("notion_id"):
                by_notion[mm["notion_id"]] = d
    sha = sha or head_sha()
    img_base = f"https://cdn.jsdelivr.net/gh/{REPO}@{sha}/{folder}/"
    store = []

    def keep(h):
        store.append(h)
        return f"\n\nZZKEEP{len(store)-1}ZZ\n\n"

    # 수식 블록
    body = re.sub(r"\$\$\n(.*?)\n\$\$", lambda m: keep(f'<div class="math">\\[{html.escape(m.group(1))}\\]</div>'), body, flags=re.S)
    # 그림
    body = re.sub(r'<image source="([^"]+)">\n(.*?)\n</image>',
                  lambda m: keep(f'<figure><img src="{img_base}{m.group(1)}" alt="{html.escape(m.group(2))}" loading="lazy"/>'
                                 f'<figcaption>{html.escape(m.group(2))}</figcaption></figure>'), body, flags=re.S)
    # 강좌 링크
    body = re.sub(r'<mention url="https://app\.notion\.com/p/([0-9a-f]+)" />',
                  lambda m: mention_html(m.group(1), posts, by_notion), body)
    # 토글
    body = re.sub(r"<toggle>\n(.*?)\n\n(.*?)\n</toggle>",
                  lambda m: f'\n<details markdown="1"><summary>{html.escape(m.group(1))}</summary>\n\n{m.group(2)}\n\n</details>\n',
                  body, flags=re.S)
    # 요약 상자
    body = re.sub(r'<callout([^>]*)>\n(.*?)\n</callout>',
                  lambda m: f'\n<div class="callout{" warn" if "yellow" in m.group(1) else ""}" markdown="1">\n\n{m.group(2)}\n\n</div>\n', body, flags=re.S)
    body = re.sub(r"<p />\n?", "", body)
    has_toc = "<table-of-contents />" in body
    body = body.replace("<table-of-contents />", "ZZTOCZZ")

    out = markdown.markdown(body, extensions=["tables", "md_in_html", "sane_lists"])
    for i, h in enumerate(store):
        out = out.replace(f"<p>ZZKEEP{i}ZZ</p>", h).replace(f"ZZKEEP{i}ZZ", h)

    used, toc, secs = set(), [], {}

    def head(m):
        lvl, txt = m.group(1), m.group(2)
        sid = slug(re.sub("<[^>]+>", "", txt), used)
        mnum = re.match(r"\s*(\d+(?:-\d+)?)\.\s", re.sub("<[^>]+>", "", txt))
        if mnum:
            secs[mnum.group(1)] = sid  # 단원 번호 → 이동 주소
        if lvl == "2":
            plain = re.sub("<[^>]+>", "", txt)
            toc.append((sid, plain))  # 본문 소제목 번호를 그대로 보여 줌(목차 자동번호 없음)
        return f'<h{lvl} id="{sid}">{txt}</h{lvl}>'

    out = re.sub(r"<h([23])>(.*?)</h\1>", head, out)
    def seclink(m):  # 표 칸의 "4장", "7-3"을 해당 단원으로 이동하는 링크로
        key = m.group(2) + (m.group(3) or "")
        return f'{m.group(1)}<a href="#{secs[key]}">{m.group(2)}{m.group(3) or "장"}</a></td>' if key in secs else m.group(0)
    out = re.sub(r"(<td[^>]*>)\s*(\d+)(?:장|(-\d+))\s*</td>", seclink, out)
    out = out.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")  # 좁은 화면에선 표만 가로 스크롤
    toc_html = ""
    if has_toc:
        toc_html = '<div class="toc"><b>목차</b><ul>' + "".join(
            f'<li><a href="#{s}">{html.escape(t)}</a></li>' for s, t in toc) + "</ul></div>"
    out = out.replace("<p>ZZTOCZZ</p>", toc_html)
    if meta.get("summary"):  # 목차 앞 소개 문장 = 블로그 목록에 보이는 소개 글
        out = f'<p class="lead">{html.escape(meta["summary"])}</p>' + out
    if os.path.exists(os.path.join(ROOT, folder, "cover.png")):  # 표지 = 본문 첫 그림 = 블로거 썸네일
        out = (f'<figure class="cover"><img src="{img_base}cover.png" alt="{html.escape(meta.get("title", ""))}"/></figure>'
               + out)
    extra = MATHJAX if "\\[" in out else ""
    return meta, f'{STYLE}{extra}<div class="ezl">{out}</div>'


def token():
    c = json.load(open(os.path.join(AUTH_DIR, "client.json")))["installed"]
    t = json.load(open(os.path.join(AUTH_DIR, "token.json")))
    data = urllib.parse.urlencode(dict(client_id=c["client_id"], client_secret=c["client_secret"],
                                       refresh_token=t["refresh_token"], grant_type="refresh_token")).encode()
    r = json.load(urllib.request.urlopen(urllib.request.Request(c["token_uri"], data=data)))
    return r["access_token"]


def api(method, path, body=None, params=None):
    url = f"https://www.googleapis.com/blogger/v3/blogs/{BLOG_ID}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json"})
    try:
        return json.load(urllib.request.urlopen(req))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"API 오류 {e.code}: {e.read().decode()[:500]}")


def draft(folder):
    meta, content = to_html(folder)
    posts = load_posts()
    info = posts.get(folder, {})
    body = {"title": meta["title"], "content": content, "labels": [meta["field"]]}
    if info.get("id"):
        r = api("PATCH", f"/posts/{info['id']}", body)
    else:
        r = api("POST", "/posts/", body, {"isDraft": "true"})
    info.update(id=r["id"], status=r.get("status", "DRAFT"))
    if r.get("status") == "LIVE":
        info["url"] = r.get("url")
    else:
        info.pop("url", None)
    posts[folder] = info
    save_posts(posts)
    print(folder, r["id"], r.get("status"), r.get("url"))


def publish(folder):
    posts = load_posts()
    info = posts[folder]
    r = api("POST", f"/posts/{info['id']}/publish")
    info.update(status=r.get("status"), url=r.get("url"))
    posts[folder] = info
    save_posts(posts)
    print(folder, r.get("status"), r.get("url"))


if __name__ == "__main__":
    cmd, folder = sys.argv[1], sys.argv[2].strip("/")
    if cmd == "html":
        os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
        meta, h = to_html(folder)
        p = os.path.join(ROOT, "build", folder + ".html")
        open(p, "w", encoding="utf-8").write(f'<!doctype html><meta charset="utf-8"><title>{meta["title"]}</title><h1>{meta["title"]}</h1>' + h)
        print(p)
    elif cmd == "draft":
        draft(folder)
    elif cmd == "publish":
        publish(folder)
