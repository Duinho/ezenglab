"""최종 출력은 실제 ffmpeg 영상으로 시험합니다. 브라우저/장면 렌더는 실행하지 않습니다."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch
import final_output as f
output=f

class FinalOutput(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();cls.root=Path(cls.tmp.name);cls.source=cls.root/'input.mp4'
  subprocess.run(['ffmpeg','-v','error','-y','-f','lavfi','-i','testsrc2=s=160x90:r=30:d=4',
                  '-f','lavfi','-i','sine=f=1000:r=48000:d=2.5','-filter:a','volume=6,apad=pad_dur=1.5',
                  '-t','4','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',str(cls.source)],check=True)
  cls.before=hashlib.sha256(cls.source.read_bytes()).hexdigest()
  cls.long=cls.root/'long.mp4';cls.short=cls.root/'short.mp4'
  cls.long_result=f.finalize(cls.source,cls.long);cls.short_result=f.finalize(cls.source,cls.short,True)
 @classmethod
 def tearDownClass(cls):cls.tmp.cleanup()
 def test_01_long_duration_preserved(self):self.assertAlmostEqual(float(f.probe(self.long)['format']['duration']),4,delta=.08)
 def test_02_short_tail_trimmed(self):self.assertAlmostEqual(float(f.probe(self.short)['format']['duration']),3,delta=.12)
 def test_03_true_peak_limited_after_aac(self):self.assertLessEqual(self.short_result['aac_true_peak'],-1.5)
 def test_04_source_immutable(self):self.assertEqual(hashlib.sha256(self.source.read_bytes()).hexdigest(),self.before)
 def test_05_every_retained_pixel_identical(self):
  def hashes(p):
   s=f.run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-f','framemd5','-']).stdout
   return [x.rsplit(',',1)[-1] for x in s.splitlines() if x and not x.startswith('#')]
  before,after=hashes(self.source),hashes(self.short);self.assertEqual(after,before[:len(after)])
  self.assertEqual(hashes(self.long),before)
 def test_06_aac_audio_and_copied_video(self):
  streams=f.probe(self.short)['streams'];self.assertEqual([s['codec_name'] for s in streams],['h264','aac']);self.assertFalse(self.short_result['scene_rebuild'])
 def test_07_in_place_input_refused(self):
  with self.assertRaises(ValueError):f.finalize(self.source,self.source)
 def test_08_invalid_tail_refused(self):
  for value in [-1,float('nan'),float('inf')]:
   with self.assertRaises(ValueError):f.finalize(self.source,self.root/'bad.mp4',True,value)
 def test_09_report_keeps_actual_scene_scope(self):
  # CLI report 출력에서도 기존 렌더의 실제 장면 변경 사실은 지우지 않습니다.
  import sys
  from unittest.mock import patch
  report=self.root/'report.json';report.write_text(json.dumps({'timeline':[{'id':'S1E'}],'report':{'다시 만든 장면':['S1E']}}))
  with patch.object(sys,'argv',['final_output.py',str(self.source),str(self.root/'cli.mp4'),'--short','--report',str(report)]):f.main()
  r=json.loads(report.read_text());self.assertEqual(r['report']['다시 만든 장면'],['S1E']);self.assertFalse(r['report']['최종 출력 처리']['scene_rebuild'])


class FinalOutputTests(unittest.TestCase):
    def normalization(self, peaks):
        encoded=[]; readings=iter(peaks)
        def run(args):
            if 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json' in args:
                return SimpleNamespace(stderr=json.dumps(dict(input_i='-16',input_tp='-1',input_lra='2',input_thresh='-26',target_offset='0')))
            if 'ebur128=peak=true' in args:
                return SimpleNamespace(stderr='Peak: '+str(next(readings))+' dBFS')
            encoded.append(args);return SimpleNamespace(stderr='')
        return encoded,run

    def test_aac_overshoot_retries_instead_of_accepting_old_minus_one_limit(self):
        encoded,run=self.normalization([-1.1,-1.6])
        with patch.object(output,'run',side_effect=run):result=output.normalize('v','a','out')
        self.assertEqual(len(encoded),2)
        self.assertEqual(result['true_peak_target'],-2)
        self.assertEqual(result['aac_true_peak'],-1.6)
        self.assertEqual(result['lufs_target'],-16)

    def test_exact_target_needs_one_encode(self):
        encoded,run=self.normalization([-1.5])
        with patch.object(output,'run',side_effect=run):self.assertEqual(output.normalize('v','a','out')['aac_true_peak'],-1.5)
        self.assertEqual(len(encoded),1)

    def test_uncontrolled_peak_stops_after_bounded_retries(self):
        encoded,run=self.normalization([-1.1,-1.2,-1.3])
        with patch.object(output,'run',side_effect=run),self.assertRaisesRegex(ValueError,'-1.5'):output.normalize('v','a','out')
        self.assertEqual(len(encoded),3)

    def test_speech_without_final_silence_is_preserved(self):
        log='silence_start: 1\nsilence_end: 1.2\n'
        with patch.object(output,'run',return_value=SimpleNamespace(stderr=log)):
            self.assertEqual(output.tail_end('in',10,.5),10)

    def test_final_silence_keeps_half_second_after_last_word(self):
        with patch.object(output,'run',return_value=SimpleNamespace(stderr='silence_start: 8\nsilence_end: 10\n')):
            self.assertEqual(output.tail_end('in',10,.5),8.5)

    def test_in_place_output_is_rejected_before_external_commands(self):
        with patch.object(output,'probe') as probe,self.assertRaises(ValueError):output.finalize('same.mp4','same.mp4')
        probe.assert_not_called()

    def test_invalid_tail_is_rejected_before_external_commands(self):
        for tail in [-1,float('nan'),float('inf')]:
            with self.subTest(tail=tail),patch.object(output,'probe') as probe,self.assertRaises(ValueError):output.finalize('in','out',tail=tail)
            probe.assert_not_called()

    def test_cli_report_preserves_actual_scene_rebuild_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'report.json'
            original={'timeline':[{'id':'S1A','start':0,'dur':2}], 'report':{'다시 만든 장면':['S1A'],'console':[]}}
            path.write_text(json.dumps(original))
            meta={'scene_rebuild':False,'true_peak_target':-1.5}
            with patch('sys.argv',['final_output.py','in','out','--short','--report',str(path)]),patch.object(output,'finalize',return_value=meta),patch('builtins.print'):
                output.main()
            result=json.loads(path.read_text())
            self.assertEqual(result['timeline'],original['timeline'])
            self.assertEqual(result['report']['다시 만든 장면'],['S1A'])
            self.assertEqual(result['report']['최종 출력 처리'],meta)


if __name__=='__main__':unittest.main(verbosity=2)
