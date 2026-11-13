"""최종 소리 보정과 쇼츠 말끝 정리. 영상은 재인코딩하지 않습니다."""
import argparse
import json
import math
from pathlib import Path
import re
import subprocess


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True)


def probe(path):
    return json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]).stdout)


def tail_end(path, duration, tail):
    log = run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-vn',
               '-af', 'silencedetect=n=-45dB:d=0.02', '-f', 'null', '-']).stderr
    events = list(re.finditer(r'silence_(start|end): ([\d.]+)', log))
    if len(events) >= 2 and events[-1][1] == 'end' and events[-2][1] == 'start':
        end, start = float(events[-1][2]), float(events[-2][2])
        if end >= duration - 0.1:
            return min(duration, start + tail)
    return duration


def normalize(video, audio, output, duration=None):
    """2-pass -16 LUFS / -1.5 dBTP. AAC 복호화 후에도 피크 여유를 확인합니다."""
    measure = run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(audio), '-vn',
                   '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).stderr
    m, _ = json.JSONDecoder().raw_decode(measure[measure.rfind('{'):])
    finite = all(math.isfinite(float(m[k])) for k in ['input_i','input_tp','input_lra','input_thresh','target_offset'])
    base = 'loudnorm=I=-16:TP={peak}:LRA=11'
    if finite:
        base += ':measured_I={input_i}:measured_TP={input_tp}:measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true'
    for attempt in range(3):
        target = -1.5 - attempt * 0.5
        filt = base.format(peak=target, **m)
        cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', str(video), '-i', str(audio),
               '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-af', filt,
               '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart']
        if duration is not None:cmd += ['-t', f'{duration:.6f}', '-shortest']
        # 롱폼에서 -shortest는 AAC 끝 시각보다 뒤에 놓인 B프레임을 버릴 수 있습니다.
        # 끝을 자르지 않는 출력은 전체 영상 패킷을 그대로 복사합니다.
        cmd += [str(output)]
        run(cmd)
        log = run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(output), '-vn',
                   '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
        peaks = re.findall(r'Peak:\s+(-?(?:[\d.]+|inf)) dBFS', log)
        if not peaks:raise ValueError('final AAC true peak measurement missing')
        if float(peaks[-1]) <= -1.5:
            return {'lufs_target': -16, 'true_peak_target': target, 'aac_true_peak': float(peaks[-1]) if peaks else None}
    raise ValueError('AAC true peak exceeds -1.5 dBTP after final limiting')


def finalize(source, output, short=False, tail=0.5):
    source, output = Path(source), Path(output)
    if source.resolve() == output.resolve():raise ValueError('input and output must differ')
    if not math.isfinite(tail) or tail < 0:raise ValueError('invalid end tail')
    info = probe(source); duration = float(info['format']['duration'])
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    fps = float(v['avg_frame_rate'].split('/')[0]) / float(v['avg_frame_rate'].split('/')[1])
    end = math.ceil(tail_end(source, duration, tail)*fps - 1e-6)/fps if short else duration
    end = min(duration, end)
    result = normalize(source, source, output, end if short else None)
    final_info = probe(output)
    final_video = next(s for s in final_info['streams'] if s['codec_type']=='video')
    return {**result, 'video_codec': 'copy', 'original_duration': duration,
            'duration': float(final_info['format']['duration']), 'frames': int(final_video['nb_frames']), 'end_tail_target': tail if short else None,
            'scene_rebuild': False}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('source');p.add_argument('output')
    p.add_argument('--short',action='store_true');p.add_argument('--end-tail',type=float,default=.5)
    p.add_argument('--report',type=Path, help='원본 render report를 보존하며 최종 출력 처리 항목을 추가')
    a=p.parse_args();result=finalize(a.source,a.output,a.short,a.end_tail)
    if a.report:
        data=json.loads(a.report.read_text());data.setdefault('report',{})['최종 출력 처리']=result
        a.report.write_text(json.dumps(data,ensure_ascii=False,indent=1))
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':main()
