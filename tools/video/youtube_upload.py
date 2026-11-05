"""유튜브 업로드(비공개). 공개 전환은 팀장님이 스튜디오에서 직접 한다.

사용: python3 tools/video/youtube_upload.py 업로드표.json
- 업로드표.json: {"영상": [{"키": "long", "파일": "...mp4", "제목": "...", "설명": "...", "태그": [...]}, ...]}
  설명 안의 {long} 같은 표시는 앞서 올린 영상 주소로 바뀐다(쇼츠 설명에 롱폼 주소 넣기).
- 결과(영상 ID·주소)는 같은 파일의 "결과"에 적는다. 이미 올린 키는 다시 올리지 않는다.
- 토큰: /home/claude/youtube/token.json (작업 공간 전용, 600). client: /home/claude/youtube/client.json
"""
import json, os, sys, time, urllib.parse, urllib.request

TOKEN = "/home/claude/youtube/token.json"
CLIENT = "/home/claude/youtube/client.json"


def access_token():
    t = json.load(open(TOKEN))
    if t.get("_exp", 0) > time.time() + 60:
        return t["access_token"]
    c = json.load(open(CLIENT))["installed"]
    data = urllib.parse.urlencode({"client_id": c["client_id"], "client_secret": c["client_secret"],
                                   "refresh_token": t["refresh_token"], "grant_type": "refresh_token"}).encode()
    try:
        n = json.load(urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=data), timeout=30))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"토큰 갱신 실패({e.code}). 테스트 모드 앱은 7일 뒤 허락이 풀리니 팀장님께 다시 허락을 받아야 함")
    t.update(access_token=n["access_token"], _exp=time.time() + n.get("expires_in", 3600))
    fd = os.open(TOKEN, os.O_WRONLY | os.O_TRUNC); os.write(fd, json.dumps(t).encode()); os.close(fd)
    return t["access_token"]


def upload(path, title, desc, tags):
    meta = {"snippet": {"title": title, "description": desc, "tags": tags, "categoryId": "27",   # 27 = 교육
                        "defaultLanguage": "ko", "defaultAudioLanguage": "ko"},
            "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": False, "embeddable": True}}
    body = json.dumps(meta).encode()
    size = os.path.getsize(path)
    r = urllib.request.Request("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                               data=body, method="POST",
                               headers={"Authorization": "Bearer " + access_token(), "Content-Type": "application/json; charset=UTF-8",
                                        "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)})
    loc = urllib.request.urlopen(r, timeout=60).headers["Location"]
    with open(path, "rb") as f:
        data = f.read()
    for i in range(3):
        try:
            p = urllib.request.Request(loc, data=data, method="PUT", headers={"Content-Type": "video/mp4", "Content-Length": str(size)})
            return json.load(urllib.request.urlopen(p, timeout=600))
        except urllib.error.HTTPError as e:
            msg = e.read()[:300].decode(errors="ignore")
            if e.code in (500, 502, 503, 504) and i < 2:
                time.sleep(10); continue
            raise SystemExit(f"업로드 실패 {e.code}: {msg}")


def main():
    plan_path = sys.argv[1]
    plan = json.load(open(plan_path, encoding="utf-8"))
    res = plan.setdefault("결과", {})
    for v in plan["영상"]:
        k = v["키"]
        if k in res:
            print(k, "이미 올림:", res[k]["주소"]); continue
        desc = v["설명"]
        for kk, rr in res.items():
            desc = desc.replace("{" + kk + "}", rr["주소"])
        if "{" in desc and "}" in desc and any("{" + x["키"] + "}" in desc for x in plan["영상"]):
            raise SystemExit(f"{k}: 설명에 아직 안 올린 영상 주소가 있음")
        j = upload(v["파일"], v["제목"], desc, v.get("태그", []))
        st = j.get("status", {})
        res[k] = {"id": j["id"], "주소": f"https://youtu.be/{j['id']}", "공개 상태": st.get("privacyStatus"),
                  "업로드 상태": st.get("uploadStatus"), "시각": time.strftime("%Y-%m-%d %H:%M")}
        json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(k, "올림:", res[k])


if __name__ == "__main__":
    main()
