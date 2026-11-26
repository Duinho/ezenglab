"""매일 업로드 점검(팀장님 2026-11-15 「매일 유튜브와 인스타에 1개 이상, 꾸준히 올리는 게 중요해」).

사용: python3 tools/video/daily_check.py [--days 14]
- 오늘(KST)부터 N일 동안 날마다 유튜브 공개(이미 공개됐거나 예약 공개) 영상 수를 센다.
- 오늘과 어제 인스타 게시물 수를 센다(인스타는 예약이 없어 지난 것만 확인 가능).
- 빈 날(유튜브 0개)이 있으면 그 날짜를 「빈 날」로, 오늘 인스타가 0이면 「인스타 빠짐」으로 알린다.
- 최근 7일 안에 공개된 영상(공개 30분 지난 것)에 채널 본인 댓글(고정용: 블로그·타임라인 또는 전체 영상 안내)이
  없으면 「댓글 빠짐」으로 알린다(팀장님 2026-11-17 「유튜브 댓글 또 안 달려있는디? 같은 실수 왜 자꾸 하지」).
- 마지막 줄은 JSON 한 줄(점검 결과). 빈 날이나 빠짐이 있으면 종료 코드 1.
토큰 값은 출력하지 않는다.
"""
import sys, os, json, datetime, urllib.request, urllib.error
os.environ.setdefault('EZ_HOME','/home/ezworker/ez')
sys.path.insert(0, os.path.dirname(__file__))
import youtube_upload as yt
from comment_retry import enqueue
from pathlib import Path
import importlib.util

KST = datetime.timezone(datetime.timedelta(hours=9))


def course_labels():
    """옛 이름/코드 이름 업로드표를 읽어 표시만 연결합니다. 일정은 바꾸지 않습니다."""
    try:
        spec=importlib.util.spec_from_file_location('daily_course_codes',Path(__file__).parents[1]/'강좌코드.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        work=module.work_dir();labels={}
        for path in (work/'업로드').glob('*.json') if work else []:
            code=module.code_of(path.stem)
            if not code:continue
            data=json.loads(path.read_text(encoding='utf-8'))
            for row in data.get('결과',{}).values():
                if isinstance(row,dict) and row.get('id'):labels[row['id']]=code
        return labels
    except (OSError,ValueError,ImportError,TypeError,AttributeError):return {}


def kst_day(iso):
    return datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone(KST).date()


def youtube_days(start, days):
    labels=course_labels()
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
    recent = []                                           # 최근 7일 공개 영상(댓글 점검용)
    now = datetime.datetime.now(datetime.timezone.utc)
    for k in range(0, len(ids), 50):
        r = yt.api("GET", "videos?part=status,snippet&id=" + ",".join(ids[k:k + 50]))
        for v in r.get("items", []):
            code=labels.get(v['id'],'')
            title=(code+' ' if code else '')+v['snippet']['title']
            st = v["status"]
            if st["privacyStatus"] == "public":
                when = kst_day(v["snippet"]["publishedAt"])
                pub = datetime.datetime.fromisoformat(v["snippet"]["publishedAt"].replace("Z", "+00:00"))
                if datetime.timedelta(minutes=30) <= now - pub <= datetime.timedelta(days=7):
                    recent.append((v["id"], title, v["snippet"]["channelId"]))
            elif st.get("publishAt"):
                when = kst_day(st["publishAt"])
            else:
                continue                                  # 예약 없는 비공개(옛 판 등)는 세지 않음
            if when in per:
                per[when].append(title)
    return per, recent


def missing_comments(recent, work=None):
    """공개된 영상 중 채널 본인 댓글이 없는 것(제목, id) 목록"""
    out = []
    for vid, title, ch in recent:
        # Use the scheduler's complete top-level/reply pagination and author check.
        # This reader never calls process() or any POST method.
        root = Path(work) if work else Path(os.environ.get("EZ_HOME", "/home/claude")) / "ezenglab-work"
        spec = importlib.util.spec_from_file_location("daily_comment_reader", root / "우체통/youtube_comments.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        reader = module.Comments(root.parent, yt, lambda: datetime.datetime.now(KST))
        if reader.existing(vid) is None:
            out.append(f"{title} ({vid})")
            enqueue(root, vid, "daily_check")
    return out


def instagram_days(start):
    ez = os.environ.get("EZ_HOME", "/home/claude")
    t = json.load(open(os.path.join(ez, "instagram", "token.json")))
    url = f"https://graph.facebook.com/v21.0/{t['ig_user_id']}/media?fields=timestamp,media_product_type&limit=25"
    try:
        r = json.loads(urllib.request.urlopen(urllib.request.Request(url, headers={"Authorization": "Bearer " + t["access_token"]}), timeout=60).read())
    except urllib.error.HTTPError as e:
        e.close()
        return None, f"인스타 조회 실패 HTTP {e.code}"
    per = {}
    for m in r.get("data", []):
        d = datetime.datetime.strptime(m["timestamp"], "%Y-%m-%dT%H:%M:%S%z").astimezone(KST).date()
        per[d] = per.get(d, 0) + 1
    return per, ""


def release_readback(today):
    """Use the publisher's same platform reader; never a second authoring route."""
    base = Path(os.environ.get('EZ_HOME', '/home/ezworker/ez'))
    private = base/'ezenglab-work/우체통/publisher_followup.py'
    spec = importlib.util.spec_from_file_location('daily_release_readback', private)
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module.Observer(base, notify=True).postcheck(today, retry=False, send=True)


def publication_check(prevention=None):
    days = int(sys.argv[sys.argv.index("--days") + 1]) if "--days" in sys.argv else 14
    today = datetime.datetime.now(KST).date()
    yt_per, recent = youtube_days(today, days)
    empty = [d.isoformat() for d, v in yt_per.items() if not v]
    for d, v in yt_per.items():
        print(d.isoformat(), "유튜브", len(v), "·", " / ".join(t[:30] for t in v) if v else "★ 빈 날")
    ig, err = instagram_days(today)
    ig_today = ig.get(today, 0) if ig is not None else None
    ig_yday = ig.get(today - datetime.timedelta(1), 0) if ig is not None else None
    print("인스타 오늘", ig_today, "어제", ig_yday, err)
    release = release_readback(today)
    current_ids = {row['video_id'] for row in release.get('youtube', [])}
    no_comment = missing_comments([row for row in recent if row[0] not in current_ids])
    no_comment += [row['video_id'] for row in release.get('youtube', []) if row.get('due', True) and not row.get('ok')]
    for t in no_comment:
        print("★ 댓글 빠짐:", t)
    now = datetime.datetime.now(KST)
    late = now.hour >= 20                                 # 19시 공개 뒤에만 오늘 인스타를 따진다
    out = {"날짜": today.isoformat(), "유튜브 빈 날": empty, "인스타 오늘": ig_today, "인스타 어제": ig_yday,
           "인스타 오류": err, "다음 빈 날": empty[0] if empty else None, "댓글 빠짐": no_comment,
           "공개 후속": release,"오류대장":prevention}
    release_due = late and bool(release.get('youtube') or release.get('instagram') or release.get('errors'))
    problem = bool(empty) or bool(err) or (late and ig_today == 0) or bool(no_comment) or (release_due and not release.get('complete'))
    problem = problem or bool(prevention and prevention.get('problem'))
    out["문제"] = problem
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(1 if problem else 0)


def main():
    # 게시/댓글 조회 실패로 중단되더라도 오류 재검사는 먼저 한 번 실행합니다.
    work=Path(os.environ.get('EZ_HOME','/home/ezworker/ez'))/'ezenglab-work'
    sys.path.insert(0,str(work/'우체통'))
    try:
        from error_ledger_daily import run_daily
        prevention=run_daily(work)
    except Exception as error:
        prevention={'problem':True,'state':'오류대장 재검사 실행 실패','reason':type(error).__name__}
    print(json.dumps({'오류대장':prevention},ensure_ascii=False))
    publication_check(prevention)


if __name__ == "__main__":
    main()
