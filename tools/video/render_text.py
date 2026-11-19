"""렌더 중 실제 DOM에서 수집한 글자 증거. 규칙·비밀 자료는 포함하지 않습니다."""

class TextCapture:
    def __init__(self, expected_frames):
        self.expected_frames = expected_frames
        self.frames = 0
        self.samples = {}

    def add(self, texts, time):
        self.frames += 1
        for kind in ('화면', '자막'):
            for text in texts[kind]:
                key = (kind, text)
                if key not in self.samples:
                    self.samples[key] = {'kind':kind, 'text':text, 'first':round(time, 6), 'last':round(time, 6)}
                else:
                    self.samples[key]['last'] = round(time, 6)

    def report(self):
        return {'version':1, 'source':'render-frames', 'frames':self.frames, 'expected_frames':self.expected_frames,
                'samples':list(self.samples.values())}


def cached_text(evidence, expected_frames):
    # 옛 캐시의 픽셀은 지금 페이지를 재생한 글자와 다를 수 있다.
    # 증거를 새 페이지에서 만들어 붙이거나 전체 재인코딩하지 않는다.
    return evidence if evidence is not None else {
        'version':1, 'source':'legacy-cache-without-text', 'frames':0,
        'expected_frames':expected_frames, 'samples':[]}


def merge_text(report, sid, start, evidence):
    target = report.setdefault('rendered_text', {'version':1, 'fps':30, 'scenes':[]})
    target['scenes'].append({**evidence, 'id':sid, 'start_frame':round(start * 30), 'samples':[
        {**sample, 'first':round(start + sample['first'], 6), 'last':round(start + sample['last'], 6)}
        for sample in evidence['samples']]})


def trim_text(report, frames):
    """최종 출력에서 잘린 꼬리는 실제 파일에 없으므로 증거에서도 제외합니다."""
    evidence = report.get('rendered_text')
    if not evidence:
        return
    end = frames / 30
    kept = []
    for scene in evidence['scenes']:
        count = min(scene['expected_frames'], max(0, frames - scene['start_frame']))
        if not count:
            continue
        scene['expected_frames'] = count
        scene['frames'] = min(scene['frames'], count)
        scene['samples'] = [{**s, 'last':min(s['last'], round((frames - 1)/30, 6))}
                            for s in scene['samples'] if s['first'] < end]
        kept.append(scene)
    evidence['scenes'] = kept
