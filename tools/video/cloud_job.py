"""깃허브 Actions(클라우드)에서 렌더·받아쓰기 검사를 돌리는 작업 실행기.

팀장님 2026-11-18 「1번을 진행해 보자, 어차피 무료기도 하고」: 코덱스 노트북(Ryzen 3 3250U, 메모리 약 5.9GB)이
렌더·받아쓰기로 몇 시간씩 걸려서, 무거운 일은 깃허브 클라우드 컴퓨터에서 한다. 노트북은 음성(tts.py)·검토·업로드만.

사용: python3 tools/video/cloud_job.py <작업.json> <결과 폴더>
  작업.json(비공개 저장소 렌더요청/에 올림):
  {"강좌 폴더": "인공지능 130 선형 회귀 개념편",
   "영상": [{"이름": "long", "판": "long", "범위": "L01-L28"},
            {"이름": "S1", "판": "short", "범위": "L04-L05,S1E", "인자": ["--hook", "…", "--endtext", "…"]}],
   "검사": true}
- 음성은 비공개 저장소 음성/<강좌 폴더>/<장면>.flac·.json(tts.py 확정 음성)을 wav로 풀어 쓴다(새 음성 0자).
- 「인자」는 render.py 옵션 중 허용 목록만 받는다(임의 명령 실행 막음). --full은 받지 않는다(바뀐 장면만 다시 만드는 규칙).
- 결과 폴더에 <이름>.mp4, <이름>_report.json, (검사면) <이름>_qa.txt, 요약.json을 둔다.
"""
import json, os, shutil, subprocess, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUB = HERE.parent.parent
ALLOWED = {"--hook", "--endtext", "--end-cue", "--cta", "--next", "--next-label", "--end-tail", "--no-host"}
NOVALUE = {"--no-host"}


def check_args(args):
    out, i = [], 0
    while i < len(args):
        a = args[i]
        if a not in ALLOWED:
            raise SystemExit(f"허용하지 않는 render.py 옵션: {a}")
        if a in NOVALUE:
            out.append(a); i += 1
        else:
            if i + 1 >= len(args) or not isinstance(args[i + 1], str):
                raise SystemExit(f"옵션 값 없음: {a}")
            out += [a, args[i + 1]]; i += 2
    return out


def main():
    job_path, outdir = Path(sys.argv[1]), Path(sys.argv[2])
    work = Path(os.environ.get("EZ_WORK", PUB.parent / "ezenglab-work"))
    job = json.loads(job_path.read_text(encoding="utf-8"))
    course = job["강좌 폴더"]
    if "/" in course or ".." in course:
        raise SystemExit("강좌 폴더 이름 오류")
    folder = PUB / "영상" / course
    voice = work / "음성" / course
    if not (folder / "장면표.md").exists():
        raise SystemExit(f"장면표 없음: {folder}")
    if not voice.is_dir():
        raise SystemExit(f"확정 음성 없음: {voice} (tts.py 뒤 음성/ 폴더를 커밋·푸시했는지 확인)")
    outdir.mkdir(parents=True, exist_ok=True)
    audio = outdir.parent / "_audio"
    audio.mkdir(exist_ok=True)
    for f in sorted(voice.glob("*.flac")):
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), str(audio / (f.stem + ".wav"))], check=True)
        (audio / (f.stem + ".json")).write_bytes((voice / (f.stem + ".json")).read_bytes())
    summary = {"강좌 폴더": course, "영상": []}
    for v in job["영상"]:
        name = v["이름"]
        if not name.replace("_", "").isalnum():
            raise SystemExit(f"영상 이름 오류: {name}")
        layout = v["판"]
        if layout not in ("long", "short"):
            raise SystemExit(f"판은 long/short: {layout}")
        out = outdir / f"{name}.mp4"
        t0 = time.time()
        cmd = [sys.executable, str(HERE / "render.py"), str(folder), str(audio), layout, v["범위"], str(out)] + check_args(v.get("인자", []))
        print("렌더:", name, flush=True)
        subprocess.run(cmd, check=True)
        rep = outdir / f"_work_{name}" / "report.json"
        if rep.exists():
            (outdir / f"{name}_report.json").write_bytes(rep.read_bytes())
        item = {"이름": name, "렌더 초": round(time.time() - t0, 1)}
        if job.get("검사"):
            t1 = time.time()
            rng = [] if layout == "long" else [v["범위"]]
            qa = subprocess.run([sys.executable, str(HERE / "qa.py"), str(folder), str(out)] + rng,
                                capture_output=True, text=True)
            (outdir / f"{name}_qa.txt").write_text(qa.stdout + qa.stderr, encoding="utf-8")
            item.update({"검사 초": round(time.time() - t1, 1), "검사 종료 코드": qa.returncode})
        summary["영상"].append(item)
        shutil.rmtree(outdir / f"_work_{name}", ignore_errors=True)
    (outdir / "요약.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
