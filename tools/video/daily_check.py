"""매일 업로드 점검(팀장님 2026-11-15 「매일 유튜브와 인스타에 1개 이상, 꾸준히 올리는 게 중요해」).

사용: python3 tools/video/daily_check.py [--days 14]
- 오늘(KST)부터 N일 동안 날마다 유튜브 공개(이미 공개됐거나 예약 공개) 영상 수를 센다.
- 오늘과 어제 인스타 게시물 수를 센다(인스타는 예약이 없어 지난 것만 확인 가능).
- 빈 날(유튜브 0개)이 있으면 그 날짜를 「빈 날」로, 오늘 인스타가 0이면 「인스타 빠짐」으로 알린다.
- 마지막 줄은 JSON 한 줄(점검 결과). 빈 날이나 빠짐이 있으면 종료 코드 1.
토큰 값은 출력하지 않는다.
"""
import sys, os, json, datetime, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(__file__))
import youtube_upload as yt

KST = datetime.timezone(datetime.timedelta(hours=9))


def kst_day(iso):
    return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(KST).date()


def youtube_days(start, days):
    ch = yt.api("GET", "channels?part=contentDetails&mine=true")["items"][0]
    uploads = ch["contentDetails"]["relatedPlaylists"]["uploads"]
    ids, token = [], ""
    for _ in range(4):                                   # 최근 올린 영상 200개까지
        r = yt.api("GET", f"playlistItems?part=contentDetails&playlistId={uploads}&maxResults=50" + (f"&pageToken={token}" if token else ""))
        ids += [i["contentDetails"]["videoId"] for i in r.get("items", [])]
        token = r.get("nextPageToken")
        if not token:
            break
    per = {start + datetime.timedelta(d): [] for d in range(days)}
    for k in range(0, len(ids), 50):
        r = yt.api("GET", "videos?part=status,snippet&id=" + ",".join(ids[k:k + 50]))
        for v in r.get("items", []):
            st = v["status"]
            if st["privacyStatus"] == "public":
                when = kst_day(v["snippet"]["publishedAt"])
            elif st.get("publishAt"):
                when = kst_day(st["publishAt"])
            else:
                continue                                  # 예약 없는 비공개(옛 판 등)는 세지 않음
            if when in per:
                per[when].append(v["snippet"]["title"])
    return per


def instagram_days(start):
    ez = os.environ.get("EZ_HOME", "/home/claude")
    t = json.load(open(os.path.join(ez, "instagram", "token.json")))
    url = f"https://graph.facebook.com/v21.0/{t['ig_user_id']}/media?fields=timestamp,media_product_type&limit=25"
    try:
        r = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + t["access_token"]}), timeout=60).read())
    except urllib.error.HTTPError as e:
        msg = json.loads(e.read()).get("error", {}).get("message", "")[:80]
        return None, f"인스타 조회 실패 {e.code}: {msg}"
    per = {}
    for m in r.get("data", []):
        d = datetime.datetime.strptime(m["timestamp"], "%Y-%m-%dT%H:%M:%S%z").astimezone(KST).date()
        per[d] = per.get(d, 0) + 1
    return per, ""


def main():
    days = int(sys.argv[sys.argv.index("--days") + 1]) if "--days" in sys.argv else 14
    today = datetime.datetime.now(KST).date()
    yt_per = youtube_days(today, days)
    empty = [d.isoformat() for d, v in yt_per.items() if not v]
    for d, v in yt_per.items():
        print(d.isoformat(), "유튜브", len(v), "·", " / ".join(t[:30] for t in v) if v else "★ 빈 날")
    ig, err = instagram_days(today)
    ig_today = ig.get(today, 0) if ig is not None else None
    ig_yday = ig.get(today - datetime.timedelta(1), 0) if ig is not None else None
    print("인스타 오늘", ig_today, "어제", ig_yday, err)
    now = datetime.datetime.now(KST)
    late = now.hour >= 20                                 # 19시 공개 뒤에만 오늘 인스타를 따진다
    out = {"날짜": today.isoformat(), "유튜브 빈 날": empty, "인스타 오늘": ig_today, "인스타 어제": ig_yday,
           "인스타 오류": err, "다음 빈 날": empty[0] if empty else None}
    problem = bool(empty) or bool(err) or (late and ig_today == 0)
    out["문제"] = problem
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(1 if problem else 0)


if __name__ == "__main__":
    main()
