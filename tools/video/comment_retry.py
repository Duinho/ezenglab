"""Queue a missing YouTube comment for its scheduler; never contact a platform."""
import datetime as dt
import fcntl
import json
import os
from pathlib import Path
import re

QUEUE = "우체통/유튜브댓글_재시도.jsonl"
KST = dt.timezone(dt.timedelta(hours=9))


def enqueue(work, video_id, source="daily_check", now=None):
    if not isinstance(video_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", video_id):
        raise ValueError("invalid_video_id")
    if source not in {"daily_check", "upload", "followup", "manual"}:
        raise ValueError("invalid_retry_source")
    now = now or dt.datetime.now(KST)
    if now.tzinfo is None:
        raise ValueError("timezone_required")
    path = Path(work) / QUEUE
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+", encoding="utf-8") as out:
        fcntl.flock(out, fcntl.LOCK_EX)
        out.seek(0)
        for line in out:
            try:
                row = json.loads(line)
                when = dt.datetime.fromisoformat(row["requested_at"])
                if row["video_id"] == video_id and row.get("source") == source and when.astimezone(KST).date() == now.astimezone(KST).date():
                    return False
            except (ValueError, KeyError, TypeError):
                continue
        out.seek(0, os.SEEK_END)
        out.write(json.dumps({"video_id": video_id, "requested_at": now.isoformat(), "source": source}) + "\n")
        out.flush()
        os.fsync(out.fileno())
    return True
