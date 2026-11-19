#!/usr/bin/env python3
"""강좌 코드(AI-130 등)로 강좌와 관련 파일을 찾습니다. 팀장님 2026-11-19 「분류하고 꺼내올 수 있도록」.

사용:
  python3 tools/강좌코드.py AI-130            # 한 강좌와 관련 파일(폴더·블로그·영상·업로드표·결과·지시서)
  python3 tools/강좌코드.py "전자공학 130"     # 이름·작업 이름(전자공학130)·kNN 같은 다른 이름도 받음
  python3 tools/강좌코드.py --목록 [AI]       # 전체 또는 한 과목 목록
  python3 tools/강좌코드.py --json AI-130     # 기계가 읽을 JSON
  python3 tools/강좌코드.py --코드 "<글>"      # 글(파일 이름 등) 안에서 강좌를 찾아 코드만 출력
  python3 tools/강좌코드.py --맞추기          # 강좌 폴더·posts.json을 보고 코드표 갱신(정리.py가 자동으로 부름)

다른 도구에서: from 강좌코드 import find, code_of, related
비공개 작업 저장소는 EZ_HOME/ezenglab-work(없으면 ../ezenglab-work)에서 찾습니다. 비밀값은 읽지 않습니다.
"""
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
TABLE = HERE / "강좌코드.json"


def load():
    return json.loads(TABLE.read_text(encoding="utf-8"))


def _norm(s):
    return re.sub(r"[\s_\-·]", "", str(s)).lower()


def _keys(e):
    ks = [e["코드"], e["코드"].replace("-", ""), e["작업 이름"], f'{e["과목"]} {e["번호"]}']
    if e.get("폴더"):
        ks.append(e["폴더"])
    ks += e.get("다른 이름", [])
    return {_norm(k) for k in ks}


def find(text, table=None):
    """코드·이름·작업 이름·폴더 이름 하나로 강좌 한 개를 찾습니다. 없으면 None."""
    t = _norm(text)
    for e in (table or load())["강좌"]:
        if t in _keys(e):
            return e
    return None


def _pattern(key):
    sep = r"[\s_\-·]*"
    return re.compile(sep.join(re.escape(c) for c in key) + r"(?!\d)", re.I)


def code_of(text, table=None):
    """파일 이름·제목 같은 글 안에서 강좌를 찾아 코드를 돌려줍니다(가장 긴 일치 우선).
    키 바로 뒤에 숫자가 붙으면(예: 「인공지능1300」) 다른 번호로 보고 넘깁니다. 「_2판」처럼 구분 기호 뒤 숫자는 괜찮습니다."""
    best = None
    for e in (table or load())["강좌"]:
        for k in _keys(e):
            if k and _pattern(k).search(str(text)) and (best is None or len(k) > best[0]):
                best = (len(k), e["코드"])
    return best[1] if best else None


def work_dir():
    home = os.environ.get("EZ_HOME")
    for p in ([Path(home) / "ezenglab-work"] if home else []) + [HERE.parent / "ezenglab-work"]:
        if p.is_dir():
            return p
    return None


def related(e):
    """강좌와 관련된 파일 경로를 모읍니다(있는 것만)."""
    out = {}
    for k in ("폴더", "영상 폴더"):
        if e.get(k) and (HERE / e[k]).exists():
            out[k] = e[k]
    w = work_dir()
    if not w:
        return out
    names = [e["작업 이름"]] + e.get("다른 이름", [])
    up = []
    for p in sorted((w / "업로드").glob("*.json")):
        stem = p.stem
        if any(stem == n or re.fullmatch(re.escape(n) + r"_.+", stem) for n in names):
            up.append(f"업로드/{p.name}")
    if up:
        out["업로드표"] = up
    res = [f"결과/{n}" for n in names if (w / "결과" / n).is_dir()]
    if res:
        out["결과"] = res
    reqs = []
    for p in sorted((w / "요청").glob("*.md")):
        if code_of(p.stem) == e["코드"]:
            reqs.append(f"요청/{p.name}")
    if reqs:
        out["지시서"] = reqs
    return out


FOLDER_RE = re.compile(r"^(?P<sub>.+?) (?P<num>\d{3}) (?P<name>.+)$")


def sync(write=True):
    """강좌 폴더·posts.json을 보고 코드표를 맞춥니다. 새 강좌는 코드를 붙여 넣고, 예정 강좌가 생기면 「게시」로 바꿉니다.
    과목 코드가 없는 새 과목은 넣지 않고 알림만 돌려줍니다(팀장님이 두 글자를 정하셔야 함). 돌려주는 값: (바뀐 코드 목록, 알림 목록)."""
    table = load()
    code_by_sub = {v["이름"]: k for k, v in table["과목"].items()}
    posts_p = HERE / "posts.json"
    posts = json.loads(posts_p.read_text(encoding="utf-8")) if posts_p.exists() else {}
    changed, notes = [], []
    for d in sorted(p.name for p in HERE.iterdir() if (p / "index.md").is_file()):
        m = FOLDER_RE.match(d)
        if not m:
            continue
        sub, num, name = m["sub"], int(m["num"]), m["name"]
        if sub not in code_by_sub:
            notes.append(f"새 과목 「{sub}」의 두 글자 코드가 코드표에 없습니다: {d}")
            continue
        code = f"{code_by_sub[sub]}-{num}"
        t = (HERE / d / "index.md").read_text(encoding="utf-8")
        tm = re.search(r'^title:\s*"(.*)"', t, re.M)
        want = {"코드": code, "과목": sub, "번호": num, "이름": name, "제목": tm[1] if tm else name, "폴더": d,
                "상태": "게시" if posts.get(d, {}).get("url") else "원고", "블로그": posts.get(d, {}).get("url", ""),
                "작업 이름": sub.replace(" ", "") + str(num)}
        if (HERE / "영상" / d).is_dir():
            want["영상 폴더"] = f"영상/{d}"
        e = next((x for x in table["강좌"] if x["코드"] == code), None)
        if e is None:
            table["강좌"].append(want)
            changed.append(code)
            continue
        if e.get("폴더") and e["폴더"] != d:
            notes.append(f"{code} 폴더가 둘입니다: {e['폴더']} / {d} (그대로 둠)")
            continue
        before = dict(e)
        e.update({k: v for k, v in want.items() if v != ""})
        if e != before:
            changed.append(code)
    order = list(code_by_sub)
    table["강좌"].sort(key=lambda x: (order.index(x["과목"]) if x["과목"] in order else 99, x["번호"]))
    if changed and write:
        TABLE.write_text(json.dumps(table, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return changed, notes


def line(e):
    s = f'{e["코드"]}  {e["과목"]} {e["번호"]} {e["이름"]}  [{e["상태"]}'
    if e.get("난이도"):
        s += f', 난이도 {e["난이도"]}'
    return s + "]"


def main(argv):
    table = load()
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    if argv[0] == "--목록":
        sub = argv[1].upper() if len(argv) > 1 else None
        for e in table["강좌"]:
            if not sub or e["코드"].startswith(sub + "-"):
                print(line(e))
        return 0
    if argv[0] == "--맞추기":
        changed, notes = sync()
        for n in notes:
            print("알림:", n)
        print("바뀐 코드:", ", ".join(changed) if changed else "없음")
        return 0
    if argv[0] == "--코드":
        c = code_of(" ".join(argv[1:]), table)
        print(c or "")
        return 0 if c else 1
    as_json = argv[0] == "--json"
    q = " ".join(argv[1:] if as_json else argv)
    e = find(q, table)
    if not e:
        print(f"강좌를 찾지 못했습니다: {q}", file=sys.stderr)
        return 1
    rel = related(e)
    if as_json:
        print(json.dumps({**e, "관련 파일": rel}, ensure_ascii=False, indent=1))
        return 0
    print(line(e))
    for k in ("제목", "블로그"):
        if e.get(k):
            print(f"  {k}: {e[k]}")
    for k, v in rel.items():
        print(f"  {k}: " + (", ".join(v) if isinstance(v, list) else v))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
