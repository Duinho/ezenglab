"""장면표.md → 대본.md (자막 표기본). 사용: python3 tools/video/make_script.py "영상/폴더" """
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from common import parse_scenes, parse_dict, subtitle_text, reading_text, nospace

folder = sys.argv[1]
md = open(os.path.join(folder, "장면표.md"), encoding="utf-8").read()
dic = parse_dict(md)
title = re.search(r"^# (.*)$", md, re.M).group(1).replace(" 장면표", "")
out = [f"# {title} 대본 (자막 표기)", "",
       "장면표.md의 읽기 줄을 자막 표기로 바꾼 것이에요. 괄호 안 시간은 상훈 목소리 기준 추정(공백 제외 약 7음절/초)이에요.", ""]
tot = 0.0
for sc in parse_scenes(md):
    sub = subtitle_text(sc["reading"], dic)
    out.append(f"**{sc['id']} {sc['title']}** ({int(tot // 60)}:{int(tot % 60):02d})  \n{sub}\n")
    tot += len(nospace(reading_text(sc["reading"]))) / 7.0 + 0.6
out.append(f"예상 길이: 약 {int(tot // 60)}분 {int(tot % 60)}초")
open(os.path.join(folder, "대본.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("대본.md", len(parse_scenes(md)), "장면", f"{tot:.0f}초")
