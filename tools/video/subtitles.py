"""단어 타이밍 + 마크업 토큰 → 자막 구절 [{start, end, text}]

- 문장(. ? !) 단위로 먼저 나눈다. 문장이 길면 구절 길이가 고르게 되도록 나눈다.
  한두 단어만 따로 떨어지는 구절이 생기지 않게 하고, 쉼표 자리를 우선한다.
- 단어 중간이나 [읽기|자막] 토큰 안에서는 끊지 않는다.
"""
import math, re

KEEP = re.compile(r"[0-9A-Za-z가-힣]")
MIN_CHARS = 7   # 구절 최소 길이(이보다 짧으면 옆 구절에 붙임)


def _clean(s):
    return "".join(KEEP.findall(s))


def _units(words, toks):
    R = "".join(r for r, _ in toks)
    marked = []
    pos = 0
    for r, s in toks:
        if r != s:
            marked.append((pos, pos + len(r)))
        pos += len(r)
    keep_idx = [i for i, ch in enumerate(R) if KEEP.match(ch)]
    units, p = [], 0
    for w in words:
        n = len(_clean(w["text"]))
        if n == 0:
            continue
        a = keep_idx[p]
        b = keep_idx[p + n - 1] + 1
        p += n
        units.append({"w": w, "a": a, "b": b})
    if p != len(keep_idx):
        raise ValueError(f"단어 타이밍과 문장이 맞지 않음: {p} != {len(keep_idx)} ({R[:40]})")
    # 단어를 토큰 경계에 맞춰 합치기: 끝이 마크업 토큰 안이면 다음 단어와 합침
    merged = []
    for u in units:
        if merged and any(ma < merged[-1]["b"] < mb for ma, mb in marked):
            merged[-1]["b"] = u["b"]
            merged[-1]["w2"] = u["w"]
        else:
            merged.append(dict(u))
    # 여는 따옴표처럼 단어 앞에 붙은 문장부호는 그 단어 몫
    for u in merged:
        while u["a"] > 0 and not KEEP.match(R[u["a"] - 1]) and not R[u["a"] - 1].isspace():
            u["a"] -= 1
    for i, u in enumerate(merged):
        nxt = merged[i + 1]["a"] if i + 1 < len(merged) else len(R)
        tail = R[u["b"]:nxt]
        u["punct"] = tail.strip()[:1]
        u["end"] = u["b"] + len(tail.rstrip())
    return R, merged


def _sub(R, toks, a, b):
    out, pos = [], 0
    for r, s in toks:
        ta, tb = pos, pos + len(r)
        pos = tb
        if r == s:
            x, y = max(a, ta), min(b, tb)
            if x < y:
                out.append(r[x - ta:y - ta])
        elif a <= ta < b:
            out.append(s)
    return re.sub(r"\s+", " ", "".join(out)).replace("\u2060", "").strip()


CONNECT = ("고", "서", "며", "면", "지만", "는데", "니까", "도", "요", "죠")
PARTICLE = ("을", "를", "에게", "에서", "으로", "로", "와", "과", "은", "는", "이", "가", "에", "만", "의")


def _break_pen(u):
    """이 단어 뒤에서 끊을 때의 벌점(작을수록 자연스러움)"""
    w = _clean(u["w2"]["text"] if "w2" in u else u["w"]["text"])
    if u["punct"] == ",":
        return 0
    if len(w) <= 1:
        return 12
    if w.endswith(CONNECT):
        return 1
    if w.endswith(PARTICLE):
        return 3
    return 7


def _start_pen(us, i):
    """구절 첫 단어가 앞 절의 끝(쉼표로 끝남)이면 앞 구절에 붙어야 할 말이 뒤로 밀린 것"""
    return 10 if i > 0 and us[i]["punct"] == "," and i + 1 < len(us) else 0


def _split_sentence(us, R, toks, max_chars):
    full = _sub(R, toks, us[0]["a"], us[-1]["end"])
    k = max(1, math.ceil(len(full) / max_chars))
    if k == 1:
        return [us]
    n = len(us)
    best = None

    def length(i, j):
        return len(_sub(R, toks, us[i]["a"], us[j - 1]["end"]))

    # 동적계획: 최대 구절 길이를 줄이고, 쉼표 자리에서 끊으면 가산점
    import functools

    @functools.lru_cache(None)
    def dp(i, parts):
        if parts == 1:
            L = length(i, n)
            ok = L <= max_chars and (L >= MIN_CHARS or i == 0)
            inner = 3 * sum(1 for u in us[i:n - 1] if u["punct"] == ",") + 3 * _start_pen(us, i)
            return (L * 0.3 + inner if ok else 999 + L, [n])
        res = None
        for j in range(i + 1, n - parts + 2):
            L = length(i, j)
            if L > max_chars or (L < MIN_CHARS and not (us[j - 1]["punct"] == "," and L >= 5)):
                continue
            L = L * 0.3
            score, cuts = dp(j, parts - 1)
            pen = _break_pen(us[j - 1]) + 1 * sum(1 for u in us[i:j - 1] if u["punct"] == ",") + _start_pen(us, i)
            cand = (score + pen * 3 + 4, [j] + cuts)
            if res is None or cand[0] < res[0]:
                res = cand
        return res or (9999, [n])

    for parts in (k, k + 1):
        r = dp(0, parts)
        if best is None or r[0] < best[0]:
            best = r
    cuts, out, i = best[1], [], 0
    for j in cuts:
        out.append(us[i:j])
        i = j
    return out


def seg_phrases(words, toks, max_chars):
    R, us = _units(words, toks)
    sents, cur = [], []
    for u in us:
        cur.append(u)
        if u["punct"] in (".", "?", "!"):
            sents.append(cur)
            cur = []
    if cur:
        sents.append(cur)
    out = []
    for s in sents:
        for part in _split_sentence(s, R, toks, max_chars):
            last = part[-1].get("w2", part[-1]["w"])
            out.append({"start": part[0]["w"]["start"], "end": last["end"],
                        "text": _sub(R, toks, part[0]["a"], part[-1]["end"])})
    return out


def scene_phrases(info, max_chars):
    out = []
    for k, seg in enumerate(info["segments"]):
        ws = [w for w in info["words"] if w["seg"] == k]
        ph = seg_phrases(ws, [tuple(t) for t in seg["tokens"]], max_chars)
        # 천천히 구간처럼 짧은 덩어리는 앞 구절에 이어 붙임
        if out and ph and len(ph[0]["text"]) < MIN_CHARS + 6 and len(out[-1]["text"]) + len(ph[0]["text"]) + 1 <= max_chars + 6:
            out[-1]["text"] += " " + ph[0]["text"]
            out[-1]["end"] = ph[0]["end"]
            ph = ph[1:]
        out += ph
    for a, b in zip(out, out[1:]):
        if b["start"] - a["end"] < 0.6:
            a["end"] = b["start"]
    # 두 줄로 나뉠 때 한 글자 단어(그, 세, 두, 몇 …)가 줄 끝에 홀로 남지 않게 다음 단어와 붙임
    DET = "그이저세두한네몇새옛각첫온전"          # 뒤 단어와 붙일 한 글자 관형어
    BOUND = ("건", "것", "수", "적", "데", "줄", "때", "뿐", "만큼")   # 앞 단어와 붙일 의존 명사
    for p in out:
        t = re.sub(r"(?:(?<=\s)|^)([" + DET + r"]) ", "\\1\u00a0", p["text"])
        t = re.sub(r" (" + "|".join(BOUND) + r")(?=[\s,.?!]|$)", "\u00a0\\1", t)
        p["text"] = t
    return out
