"""유튜브 업로드. 팀장님이 컨펌한 영상만 "공개" 값대로 올린다(지금/예약/비공개).

사용: python3 tools/video/youtube_upload.py 업로드표.json
- 업로드표.json: {"영상": [{"키": "long", "파일": "...mp4", "제목": "...", "설명": "...", "태그": [...]}, ...]}
  설명 안의 {long} 같은 표시는 앞서 올린 영상 주소로 바뀐다(쇼츠 설명에 롱폼 주소 넣기).
- 결과(영상 ID·주소)는 같은 파일의 "결과"에 적는다. 이미 올린 키는 다시 올리지 않는다.
- "썸네일": jpg 경로를 주면 롱폼에 넣는다(채널 인증 필요, 2MB 이하).
- "재생목록": 강좌 폴더 이름을 주면 과목 재생목록(예: 인공지능)에 강좌 번호 순서로 넣는다(롱폼만).
- "설명"을 고치고 다시 돌리면 올린 영상의 설명만 바뀐다. "댓글"이 있으면 영상마다 한 번 댓글을 단다(고정은 스튜디오에서 직접).
- AI 사용 표시(containsSyntheticMedia)는 업로드 때 켠다. GET 응답에는 이 값이 안 나오므로, 나중에 status를 PUT할 때는 반드시 containsSyntheticMedia: true를 함께 보낸다(빠뜨리면 꺼질 수 있음).
- "공개": "지금"이면 올리자마자 공개, "2026-11-06T10:00:00Z" 같은 시각이면 그때 공개되게 예약, 없으면 비공개.
- 토큰: /home/claude/youtube/token.json (작업 공간 전용, 600). client: /home/claude/youtube/client.json
"""
import json, os, sys, time, urllib.parse, urllib.request

EZ = os.environ.get("EZ_HOME", "/home/claude")   # 코덱스 PC에서는 다른 곳
TOKEN = os.path.join(EZ, "youtube", "token.json")
CLIENT = os.path.join(EZ, "youtube", "client.json")


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


def upload(path, title, desc, tags, when=None):
    """when: None=비공개, "지금"=바로 공개, "2026-11-06T10:00:00Z"=그 시각 예약 공개(팀장님이 컨펌한 영상만)"""
    st = {"privacyStatus": "private"}
    if when == "지금":
        st = {"privacyStatus": "public"}
    elif when:
        st = {"privacyStatus": "private", "publishAt": when}
    meta = {"snippet": {"title": title, "description": desc, "tags": tags, "categoryId": "27",   # 27 = 교육
                        "defaultLanguage": "ko", "defaultAudioLanguage": "ko"},
            "status": {**st, "selfDeclaredMadeForKids": False, "embeddable": True,
                       "publicStatsViewable": True, "license": "youtube",
                       "containsSyntheticMedia": True}}   # AI 음성·AI 그림을 쓰므로 'AI 사용: 예' 표시(유튜브 정책)
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


def api(method, path, body=None):
    r = urllib.request.Request("https://www.googleapis.com/youtube/v3/" + path, method=method,
                               data=json.dumps(body).encode() if body is not None else None,
                               headers={"Authorization": "Bearer " + access_token(), "Content-Type": "application/json; charset=UTF-8"})
    try:
        return json.load(urllib.request.urlopen(r, timeout=60))
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{method} {path.split('?')[0]} 실패 {e.code}: {e.read()[:300].decode(errors='ignore')}")


LINKS = json.load(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "채널링크.json"), encoding="utf-8"))


def with_links(text):
    """설명 끝(해시태그 앞)에 블로그·인스타 링크를 붙인다. 세 곳이 서로 이어지게(팀장님 2026-11-06)"""
    foot = f"인스타그램: {LINKS['인스타그램']}\n블로그: {LINKS['블로그']}"
    if LINKS["인스타그램"] in text:
        return text
    lines = text.rstrip().split("\n")
    if lines and lines[-1].startswith("#"):
        return "\n".join(lines[:-1]).rstrip() + "\n\n" + foot + "\n\n" + lines[-1]
    return text.rstrip() + "\n\n" + foot


def fill(text, res):
    for kk, rr in res.items():
        text = text.replace("{" + kk + "}", rr["주소"])
    return with_links(text)


def update_desc(vid, desc):
    """제목·범주는 그대로 두고 설명만 바꿈(videos.update는 snippet 전체를 다시 보내야 함)"""
    cur = api("GET", f"videos?part=snippet&id={vid}")["items"][0]["snippet"]
    sn = {k: cur[k] for k in ("title", "categoryId", "tags", "defaultLanguage", "defaultAudioLanguage") if k in cur}
    sn["description"] = desc
    return api("PUT", "videos?part=snippet", {"id": vid, "snippet": sn})


def comment(vid, text):
    """영상에 댓글을 단다(고정은 API에 없어서 팀장님이 직접 함)"""
    j = api("POST", "commentThreads?part=snippet", {"snippet": {"videoId": vid, "topLevelComment": {"snippet": {"textOriginal": text}}}})
    return j["id"]


PL_REG = os.path.join(EZ, "ezenglab-work", "업로드", "재생목록.json")   # 과목별 재생목록 ID와 들어 있는 강좌 번호


def playlist_place(folder_name, vid):
    """강좌 폴더 이름(예: '인공지능 120 kNN 알고리즘')으로 과목 재생목록을 찾거나 만들고,
    강좌 번호 순서에 맞는 자리에 영상을 넣는다. 새 재생목록은 비공개로 만든다(공개는 팀장님 확인 뒤)."""
    import re
    m = re.match(r"^(.+?) (\d+) ", folder_name)
    if not m:
        raise SystemExit(f"폴더 이름에서 과목·번호를 못 찾음: {folder_name}")
    subj, num = m.group(1), int(m.group(2))
    reg = json.load(open(PL_REG, encoding="utf-8")) if os.path.exists(PL_REG) else {}
    pl = reg.get(subj)
    if not pl:
        j = api("POST", "playlists?part=snippet,status", {"snippet": {"title": subj, "description": f"눈바공 연구소 {subj} 강좌를 공부 순서대로 모았어요.", "defaultLanguage": "ko"},
                                                          "status": {"privacyStatus": "private"}})
        pl = reg[subj] = {"id": j["id"], "강좌": []}
        json.dump(reg, open(PL_REG, "w", encoding="utf-8"), ensure_ascii=False, indent=1)   # 아래가 실패해도 재생목록이 두 번 생기지 않게
    if any(x["videoId"] == vid for x in pl["강좌"]):
        return pl["id"], None
    pos = sum(1 for x in pl["강좌"] if x["번호"] < num)            # 번호가 작은 강좌 뒤에 넣음
    body = {"snippet": {"playlistId": pl["id"], "position": pos, "resourceId": {"kind": "youtube#video", "videoId": vid}}}
    for i in range(4):                                  # 막 만든 재생목록은 잠깐 409(SERVICE_UNAVAILABLE)가 날 수 있어 기다렸다 다시 함
        try:
            api("POST", "playlistItems?part=snippet", body); break
        except SystemExit as e:
            if "409" not in str(e) or i == 3:
                raise
            time.sleep(5 * (i + 1))
    pl["강좌"].append({"번호": num, "videoId": vid, "폴더": folder_name}); pl["강좌"].sort(key=lambda x: x["번호"])
    json.dump(reg, open(PL_REG, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return pl["id"], pos


def main():
    plan_path = sys.argv[1]
    plan = json.load(open(plan_path, encoding="utf-8"))
    res = plan.setdefault("결과", {})
    for v in plan["영상"]:
        k = v["키"]
        if k in res:
            print(k, "이미 올림:", res[k]["주소"]); continue
        desc = fill(v["설명"], res)
        if "{" in desc and "}" in desc and any("{" + x["키"] + "}" in desc for x in plan["영상"]):
            raise SystemExit(f"{k}: 설명에 아직 안 올린 영상 주소가 있음")
        try:
            j = upload(v["파일"], v["제목"], desc, v.get("태그", []), v.get("공개"))
        except (urllib.error.HTTPError, SystemExit) as e:   # 하루 업로드 한도(uploadLimitExceeded) 등: 남은 건 다음에 다시 실행
            msg = e.read()[:300].decode(errors="ignore") if hasattr(e, "read") else str(e)
            print(k, "업로드 못 함:", "하루 업로드 한도 초과" if "uploadLimitExceeded" in msg else msg); break
        st0 = desc
        st = j.get("status", {})
        res[k] = {"id": j["id"], "주소": f"https://youtu.be/{j['id']}", "공개 상태": st.get("privacyStatus"),
                  "업로드 상태": st.get("uploadStatus"), "예약": st.get("publishAt"), "시각": time.strftime("%Y-%m-%d %H:%M"), "설명": st0}
        json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(k, "올림:", res[k])
    # 설명 고치기(업로드표의 설명이 바뀌었을 때)와 고정용 댓글
    for v in plan["영상"]:
        k = v["키"]
        if k not in res:
            continue
        r = res[k]
        want = fill(v["설명"], res)
        if r.get("설명") != want:
            update_desc(r["id"], want); r["설명"] = want; print(k, "설명 고침")
            json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)   # 아래에서 건너뛰어도 기록은 남게
        if v.get("썸네일") and not r.get("썸네일") and api("GET", f"videos?part=status&id={r['id']}")["items"][0]["status"].get("uploadStatus") != "processed":
            print(k, "아직 처리 중이라 썸네일은 다음 실행 때 넣음")   # 처리 전에 넣으면 쇼츠 화면에 반영되지 않음(2026-11-06 확인)
        elif v.get("썸네일") and not r.get("썸네일"):          # 직접 만든 썸네일(롱폼·쇼츠). 중급 기능(전화 인증) 필요
            img = open(v["썸네일"], "rb").read()
            q = urllib.request.Request(f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={r['id']}", data=img, method="POST",
                                       headers={"Authorization": "Bearer " + access_token(), "Content-Type": "image/jpeg"})
            try:
                urllib.request.urlopen(q, timeout=60)
                time.sleep(5)
                th = api("GET", f"videos?part=snippet&id={r['id']}")["items"][0]["snippet"]["thumbnails"]
                if "쇼츠" in k.upper() or k.upper().startswith("S"):
                    if "shortsAspectRatio" not in th:
                        print(k, "썸네일은 들어갔지만 쇼츠 모양이 아직 없음 — 다음 실행 때 다시"); raise urllib.error.HTTPError(q.full_url, 0, "쇼츠 모양 없음", {}, None)
                r["썸네일"] = v["썸네일"]; print(k, "썸네일 넣음")
            except urllib.error.HTTPError as e:
                print(k, f"썸네일 실패 {e.code}(채널 인증 확인)")
            json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        if v.get("재생목록") and not r.get("재생목록"):      # 과목 재생목록에 강좌 번호 순서로 넣기
            pid, pos = playlist_place(v["재생목록"], r["id"])
            r["재생목록"] = pid; print(k, f"재생목록에 넣음(자리 {pos})")
            json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
            import subprocess                              # 블로그 글 끝에 이 영상 링크 넣기(세 곳 연결)
            subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "blogger.py"), "links", v["재생목록"]])
        if v.get("댓글") and not r.get("댓글 id"):
            priv = api("GET", f"videos?part=status&id={r['id']}")["items"][0]["status"]["privacyStatus"]
            if priv == "private":                         # 비공개 영상에는 댓글을 달 수 없음(403). 공개(또는 일부 공개) 뒤 다시 실행
                print(k, "비공개라 댓글은 공개 뒤에 담"); continue
            t = v["댓글"]
            for kk, rr in res.items():             # 댓글에는 링크 꼬리를 붙이지 않음(설명에만)
                t = t.replace("{" + kk + "}", rr["주소"])
            r["댓글 id"] = comment(r["id"], t); print(k, "댓글 달음(고정은 팀장님)")
        json.dump(plan, open(plan_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
