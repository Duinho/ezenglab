"""영상 장면표 공통 처리: 장면 읽기, 읽기→자막 변환, 음성용 문장 만들기"""
import re

SLOW_RE = re.compile(r"\{천천히:\s*(.*?)\}")
MARK_RE = re.compile(r"\[([^\[\]|]+)\|([^\[\]]+)\]")


def parse_scenes(md):
    """장면표.md → [{id, title, reading, screen, motion}]"""
    out = []
    for m in re.finditer(r"^### ([LS]\d+[A-Z]?) · (.*?)\n(.*?)(?=^### |^## |\Z)", md, re.S | re.M):
        sid, title, body = m.groups()
        f = dict(re.findall(r"^- (읽기|화면|움직임|멈춤|앞멈춤): (.*)$", body, re.M))
        hold = float(re.sub(r"[^0-9.]", "", f.get("멈춤", "0")) or 0)
        lead = float(re.sub(r"[^0-9.]", "", f.get("앞멈춤", "0")) or 0)
        out.append(dict(id=sid, title=title.strip(), reading=f.get("읽기", ""),
                        screen=f.get("화면", ""), motion=f.get("움직임", ""), hold=hold, lead=lead))
    return out


def parse_dict(md):
    """표기 규칙 표(| 읽기 | 자막 |) → [(읽기, 자막)], 긴 것부터"""
    sec = md.split("### 표기 규칙", 1)[-1].split("## 장면", 1)[0]
    rows = re.findall(r"^\| ([^|\n]+?) \| ([^|\n]+?) \|$", sec, re.M)
    rows = [(a, b) for a, b in rows if a not in ("읽기", "---")]
    return sorted(rows, key=lambda x: -len(x[0]))


def segments(reading):
    """읽기 줄 → [(마크업 포함 문장, 천천히 여부)]"""
    segs, pos = [], 0
    for m in SLOW_RE.finditer(reading):
        if m.start() > pos:
            segs.append((reading[pos:m.start()].strip(), False))
        segs.append((m.group(1).strip(), True))
        pos = m.end()
    if pos < len(reading):
        segs.append((reading[pos:].strip(), False))
    return [s for s in segs if s[0]]


def tokens(marked, dic):
    """마크업 문장 → [(읽는 소리, 자막)] 토큰. 사전 단어도 토큰으로 바꿈"""
    toks, pos = [], 0
    for m in MARK_RE.finditer(marked):
        if m.start() > pos:
            toks += _dict_tokens(marked[pos:m.start()], dic)
        # 읽기와 자막이 같아도 '끊지 않는 덩어리'로 표시(보이지 않는 글자 U+2060을 붙임)
        toks.append((m.group(1), m.group(2) if m.group(2) != m.group(1) else m.group(2) + "\u2060"))
        pos = m.end()
    toks += _dict_tokens(marked[pos:], dic)
    return [t for t in toks if t[0]]


def _dict_tokens(text, dic):
    if not dic:
        return [(text, text)]
    pat = re.compile("|".join(re.escape(a) for a, _ in dic))
    look = dict(dic)
    out, pos = [], 0
    for m in pat.finditer(text):
        if m.start() > pos:
            out.append((text[pos:m.start()],) * 2)
        out.append((m.group(0), look[m.group(0)]))
        pos = m.end()
    if pos < len(text):
        out.append((text[pos:],) * 2)
    return out


def reading_text(marked):
    return MARK_RE.sub(lambda m: m.group(1), SLOW_RE.sub(lambda m: m.group(1), marked))


def subtitle_text(marked, dic):
    out = []
    for seg, _ in segments(marked):
        out.append("".join(s for _, s in tokens(seg, dic)))
    return " ".join(out).replace("\u2060", "")


def nospace(s):
    return re.sub(r"\s", "", s)
