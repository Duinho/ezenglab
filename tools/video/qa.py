"""완성 영상 검수: 받아쓰기 대조, 소리 크기, 끝 정적, 규격, render 보고서 요약

사용: python3 tools/video/qa.py "영상/폴더" 결과.mp4 [장면 범위(render와 같은 표기)]
"""
import difflib, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import parse_scenes, reading_text

folder, mp4 = sys.argv[1], sys.argv[2]
rng = sys.argv[3] if len(sys.argv) > 3 else None
md = open(os.path.join(folder, "장면표.md"), encoding="utf-8").read()
scenes = parse_scenes(md); ids = [s["id"] for s in scenes]; byid = {s["id"]: s for s in scenes}
want = [i for i in ids if not i.startswith("S")]   # 범위를 안 주면 롱폼(쇼츠 전용 장면 S… 제외)
if rng:
    want = []
    for part in rng.split(","):
        lo, hi = (part.split("-") + [part])[:2]
        want += ids[ids.index(lo):ids.index(hi) + 1]
out = {}
pr = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate:format=duration", "-of", "json", mp4], capture_output=True, text=True)
info = json.loads(pr.stdout); out["길이(초)"] = round(float(info["format"]["duration"]), 2)
v = [s for s in info["streams"] if s.get("width")][0]; out["규격"] = f'{v["width"]}x{v["height"]} {v["r_frame_rate"]} {v["codec_name"]}'
lo = subprocess.run(["ffmpeg", "-hide_banner", "-i", mp4, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
out["소리 크기(LUFS)"] = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", lo)[-1])
sil = subprocess.run(["ffmpeg", "-hide_banner", "-i", mp4, "-af", "silencedetect=n=-45dB:d=1.5", "-f", "null", "-"], capture_output=True, text=True).stderr
out["1.5초 넘는 정적"] = [round(float(x), 1) for x in re.findall(r"silence_start: ([\d.]+)", sil)]
from faster_whisper import WhisperModel
import numpy as np
b = subprocess.run(["ffmpeg", "-v", "error", "-i", mp4, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True).stdout
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, _ = m.transcribe(np.frombuffer(b, np.int16).astype(np.float32) / 32768, language="ko")
hyp = " ".join(s.text for s in segs)
ref = " ".join(reading_text(byid[i]["reading"]) for i in want)
norm = lambda s: re.sub(r"[^가-힣]", "", s)
sm = difflib.SequenceMatcher(None, norm(ref), norm(hyp), autojunk=False)
out["받아쓰기 일치(한글만)"] = f"{sm.ratio():.1%}"
diffs = [(norm(ref)[a:b], norm(hyp)[c:d]) for op, a, b, c, d in sm.get_opcodes() if op != "equal"]
# 영문·숫자로 받아 적힌 소리(케이·에이·비·씨·숫자 읽기)는 차이에서 뺌
skip = re.compile(r"^(케이엔엔|케이|에이|비|씨|세|두|한|네|열두|영점|이팔|삼이|오사|센티미터|일|이|삼|사|오|육|십이|디|애노이|래|예|에)+$")
out["주요 차이"] = [d for d in diffs if not (skip.match(d[0] or "x") and len(d[1]) <= 2)][:20]
open(os.path.splitext(mp4)[0] + "_qa.txt", "w").write(hyp)
print(json.dumps(out, ensure_ascii=False, indent=1))
