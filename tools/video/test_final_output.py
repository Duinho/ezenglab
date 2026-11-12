"""최종 출력은 실제 ffmpeg 영상으로 시험합니다. 브라우저/장면 렌더는 실행하지 않습니다."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import final_output as f

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
 def test_03_true_peak_limited_after_aac(self):self.assertLessEqual(self.short_result['aac_true_peak'],-1.)
 def test_04_source_immutable(self):self.assertEqual(hashlib.sha256(self.source.read_bytes()).hexdigest(),self.before)
 def test_05_every_retained_pixel_identical(self):
  def hashes(p):
   s=f.run(['ffmpeg','-v','error','-i',str(p),'-map','0:v:0','-f','framemd5','-']).stdout
   return [x.rsplit(',',1)[-1] for x in s.splitlines() if x and not x.startswith('#')]
  before,after=hashes(self.source),hashes(self.short);self.assertEqual(after,before[:len(after)])
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

if __name__=='__main__':unittest.main(verbosity=2)
