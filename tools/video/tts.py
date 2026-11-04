"""장면표 → 장면별 음성(wav) + 단어 타이밍(json). 타입캐스트 API, 상훈 목소리.

사용: python3 tools/video/tts.py "영상/폴더" 출력폴더 [L01 L02 ...]
- 같은 문장·설정은 캐시에서 다시 쓰고 크레딧을 쓰지 않는다.
- 한 번 실행에 RUN_LIMIT 글자, 한 달에 MONTH_LIMIT 글자를 넘기면 멈춘다(자동 추가 결제 방지).
"""
import base64, hashlib, io, json, os, sys, time, urllib.request, wave
sys.path.insert(0, os.path.dirname(__file__))
from common import parse_scenes, parse_dict, segments, tokens, nospace

VOICE_NAME = "상훈"
MODEL = "ssfm-v31"
SLOW_TEMPO = 0.8
SLOW_GAP = 0.35          # 천천히 구간 앞 쉼(초)
SCENE_TAIL = 0.45        # 장면 끝 쉼(초)
LUFS = -16
RUN_LIMIT = 12000
MONTH_LIMIT = 180000     # 라이트 20만 크레딧 중 여유분을 남김
KEY_FILE = "/home/claude/secrets/typecast_api_key"
CACHE = "/home/claude/build/tts_cache"
LEDGER = "/home/claude/ezenglab-work/기록/tts_사용량.json"
API = "https://api.typecast.ai"


def key():
    return open(KEY_FILE).read().strip()


def voice_id():
    p = os.path.join(CACHE, "voice_id.txt")
    if os.path.exists(p):
        return open(p).read().strip()
    r = urllib.request.Request(f"{API}/v3/voices?model={MODEL}", headers={"X-API-KEY": key()})
    vs = json.load(urllib.request.urlopen(r, timeout=60))
    vid = [v for v in vs if v["voice_name"].get("kor") == VOICE_NAME][0]["voice_id"]
    os.makedirs(CACHE, exist_ok=True)
    open(p, "w").write(vid)
    return vid


def ledger_month():
    m = time.strftime("%Y-%m")
    d = json.load(open(LEDGER)) if os.path.exists(LEDGER) else {}
    return d, m


def add_usage(n, note):
    d, m = ledger_month()
    e = d.setdefault(m, {"글자": 0, "기록": []})
    e["글자"] += n
    e["기록"].append({"시각": time.strftime("%Y-%m-%d %H:%M"), "글자": n, "내용": note})
    os.makedirs(os.path.dirname(LEDGER), exist_ok=True)
    json.dump(d, open(LEDGER, "w"), ensure_ascii=False, indent=1)


def synth(text, tempo, prev, nxt, budget):
    """한 덩어리 합성. 캐시 우선. budget: 남은 글자 수 dict"""
    body = {"voice_id": voice_id(), "text": text, "model": MODEL, "language": "kor",
            "prompt": {"emotion_type": "smart", **({"previous_text": prev[-500:]} if prev else {}),
                       **({"next_text": nxt[:500]} if nxt else {})},
            "output": {"audio_format": "wav", "audio_tempo": tempo, "target_lufs": LUFS}}
    h = hashlib.sha256(json.dumps(body, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:20]
    p = os.path.join(CACHE, h + ".json")
    if os.path.exists(p):
        return json.load(open(p)), 0
    if len(text) > budget["run"] or len(text) > budget["month"]:
        raise SystemExit(f"글자 수 상한에 걸려 멈춤(이번 실행 남은 {budget['run']}, 이번 달 남은 {budget['month']}). 팀장님 확인 필요")
    req = urllib.request.Request(f"{API}/v1/text-to-speech/with-timestamps", data=json.dumps(body).encode(),
                                 headers={"X-API-KEY": key(), "Content-Type": "application/json"})
    for i in range(2):
        try:
            j = json.load(urllib.request.urlopen(req, timeout=120))
            break
        except urllib.error.HTTPError as e:
            msg = e.read()[:300].decode(errors="ignore")
            if e.code in (429, 500, 502, 503) and i == 0:
                time.sleep(5)
                continue
            raise SystemExit(f"타입캐스트 오류 {e.code}: {msg}")
    os.makedirs(CACHE, exist_ok=True)
    json.dump(j, open(p, "w"))
    budget["run"] -= len(text)
    budget["month"] -= len(text)
    return j, len(text)


def pcm(j):
    w = wave.open(io.BytesIO(base64.b64decode(j["audio"])))
    return w.getparams(), w.readframes(w.getnframes())


def build(folder, outdir, only=None):
    md = open(os.path.join(folder, "장면표.md"), encoding="utf-8").read()
    dic = parse_dict(md)
    scenes = parse_scenes(md)
    d, m = ledger_month()
    budget = {"run": RUN_LIMIT, "month": MONTH_LIMIT - d.get(m, {}).get("글자", 0)}
    os.makedirs(outdir, exist_ok=True)
    used = 0
    for idx, sc in enumerate(scenes):
        if only and sc["id"] not in only:
            continue
        segs = segments(sc["reading"])
        frames, params, t0, words = b"", None, 0.0, []
        for k, (seg, slow) in enumerate(segs):
            toks = tokens(seg, dic)
            say = "".join(r for r, _ in toks)
            prev = " ".join("".join(r for r, _ in tokens(s, dic)) for s, _ in segs[:k])
            nxt = " ".join("".join(r for r, _ in tokens(s, dic)) for s, _ in segs[k + 1:])
            j, n = synth(say, SLOW_TEMPO if slow else 1.0, prev, nxt, budget)
            used += n
            p, f = pcm(j)
            params = params or p
            if slow and frames:
                gap = int(SLOW_GAP * p.framerate) * p.sampwidth * p.nchannels
                frames += b"\0" * gap
                t0 += SLOW_GAP
            for w in j["words"]:
                words.append({"text": w["text"], "start": round(t0 + w["start"], 3), "end": round(t0 + w["end"], 3),
                              "seg": k, "slow": slow})
            frames += f
            t0 += len(f) / (p.sampwidth * p.nchannels * p.framerate)
        tail = int(SCENE_TAIL * params.framerate) * params.sampwidth * params.nchannels
        frames += b"\0" * tail
        dur = len(frames) / (params.sampwidth * params.nchannels * params.framerate)
        with wave.open(os.path.join(outdir, f"{sc['id']}.wav"), "wb") as w:
            w.setparams(params)
            w.writeframes(frames)
        info = {"id": sc["id"], "duration": round(dur, 3), "words": words,
                "segments": [{"marked": s, "slow": sl, "tokens": tokens(s, dic)} for s, sl in segs]}
        json.dump(info, open(os.path.join(outdir, f"{sc['id']}.json"), "w"), ensure_ascii=False, indent=1)
        print(sc["id"], f"{dur:.2f}초", f"새로 만든 글자 {used}")
    if used:
        add_usage(used, f"{os.path.basename(folder.rstrip('/'))} {' '.join(only) if only else '전체'}")
    d, m = ledger_month()
    print(f"이번 실행 {used}자, 이번 달 누계 {d.get(m, {}).get('글자', 0)}자")


if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2], sys.argv[3:] or None)
