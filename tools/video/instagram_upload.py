"""인스타그램 릴스 올리기(파일을 직접 보내는 방식). 팀장님이 컨펌한 영상만 올린다.

사용: python3 tools/video/instagram_upload.py 업로드표.json [키 ...]
- 업로드표.json의 "인스타": [{"키": "S1", "파일": "...mp4", "캡션": "..."}] 를 차례로 올린다.
  캡션 안의 {S1} 같은 표시는 같은 표의 유튜브 "결과" 주소로 바뀐다.
- 키를 주면 그 키만 올린다(유튜브 쇼츠 공개 시각에 맞춰 올릴 때). 이미 올린 키는 다시 올리지 않는다.
- 인스타 API에는 예약 게시가 없어서, 시각을 맞출 때는 예약 작업이 그 시각에 이 도구를 실행한다.
- AI 표시: 컨테이너를 만들 때 is_ai_generated=true(합성 음성·AI 그림 사용).
- 결과(미디어 ID·주소)는 같은 파일의 "인스타 결과"에 적는다.
- 토큰: /home/claude/instagram/token.json {"access_token": "...", "ig_user_id": "..."} (작업 공간 전용, 600).
  원본은 ezenglab-work/secrets/instagram/. 토큰 값은 화면·로그에 출력하지 않는다.
"""
import json, os, sys, time, urllib.parse, urllib.request

TOKEN = "/home/claude/instagram/token.json"
VER = "v21.0"
GRAPH = f"https://graph.facebook.com/{VER}"


def tok():
    t = json.load(open(TOKEN))
    return t["access_token"], t["ig_user_id"]


def call(method, url, data=None, headers=None, body=None):
    at, _ = tok()
    h = {"Authorization": "Bearer " + at}
    h.update(headers or {})
    if data is not None:
        body = urllib.parse.urlencode(data).encode()
        h["Content-Type"] = "application/x-www-form-urlencoded"
    r = urllib.request.Request(url, data=body, method=method, headers=h)
    try:
        return json.load(urllib.request.urlopen(r, timeout=900))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {url.split('?')[0]} 실패 {e.code}: {e.read()[:400].decode(errors='ignore')}")


def post_reel(path, caption):
    at, uid = tok()
    # 1) 릴스 컨테이너(파일 직접 보내기)
    c = call("POST", f"{GRAPH}/{uid}/media?upload_type=resumable",
             data={"media_type": "REELS", "caption": caption, "is_ai_generated": "true"})
    cid = c["id"]
    # 2) 파일 보내기(rupload). 인증 머리글은 OAuth 형식
    size = os.path.getsize(path)
    with open(path, "rb") as f:
        data = f.read()
    r = urllib.request.Request(c.get("uri") or f"https://rupload.facebook.com/ig-api-upload/{VER}/{cid}", data=data, method="POST",
                               headers={"Authorization": "OAuth " + at, "offset": "0", "file_size": str(size)})
    try:
        up = json.load(urllib.request.urlopen(r, timeout=900))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"파일 보내기 실패 {e.code}: {e.read()[:400].decode(errors='ignore')}")
    if not up.get("success"):
        raise SystemExit(f"파일 보내기 실패: {up}")
    # 3) 처리 끝날 때까지 기다림(최대 10분)
    for _ in range(60):
        s = call("GET", f"{GRAPH}/{cid}?fields=status_code,status")
        if s.get("status_code") == "FINISHED":
            break
        if s.get("status_code") in ("ERROR", "EXPIRED"):
            raise SystemExit(f"인스타 처리 실패: {s}")
        time.sleep(10)
    else:
        raise SystemExit("인스타 처리가 10분 안에 끝나지 않음")
    # 4) 게시
    p = call("POST", f"{GRAPH}/{uid}/media_publish", data={"creation_id": cid})
    m = call("GET", f"{GRAPH}/{p['id']}?fields=permalink,timestamp")
    return {"id": p["id"], "주소": m.get("permalink"), "시각": m.get("timestamp")}


def main():
    plan_path = sys.argv[1]
    only = set(sys.argv[2:])
    plan = json.load(open(plan_path, encoding="utf-8"))
    yt = plan.get("결과", {})
    res = plan.setdefault("인스타 결과", {})
    for v in plan.get("인스타", []):
        k = v["키"]
        if only and k not in only:
            continue
        if k in res:
            print(k, "이미 올림:", res[k]["주소"]); continue
        cap = v["캡션"]
        for kk, rr in yt.items():
            cap = cap.replace("{" + kk + "}", rr["주소"])
        res[k] = post_reel(v["파일"], cap)
        json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(k, "인스타 올림:", res[k]["주소"])


if __name__ == "__main__":
    main()
