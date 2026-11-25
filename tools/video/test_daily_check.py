import contextlib,datetime as dt,importlib.util,io,json,sys,unittest,types
from pathlib import Path
from unittest import mock
P=Path(__file__).with_name('daily_check.py')
with mock.patch.dict(sys.modules,{'youtube_upload':types.ModuleType('youtube_upload')}):
 spec=importlib.util.spec_from_file_location('candidate_daily',P);d=importlib.util.module_from_spec(spec);spec.loader.exec_module(d)
class DailyTests(unittest.TestCase):
 def run_daily(self,release,ig_count=1):
  today=dt.datetime.now(d.KST).date();out=io.StringIO()
  with mock.patch.object(d,'youtube_days',return_value=({today:['approved']},[])),mock.patch.object(d,'instagram_days',return_value=({today:ig_count},'')),mock.patch.object(d,'release_readback',return_value=release),mock.patch.object(d,'missing_comments',return_value=[]),mock.patch.object(d.datetime,'datetime',wraps=dt.datetime) as clock,contextlib.redirect_stdout(out):
   clock.now.return_value=dt.datetime.combine(today,dt.time(20,1),d.KST)
   with self.assertRaises(SystemExit) as e:d.main()
  return e.exception.code,json.loads(out.getvalue().splitlines()[-1])
 def test_aggregate_instagram_other_post_cannot_hide_missing_approved_reel(self):
  code,result=self.run_daily({'complete':False,'youtube':[{'video_id':'v','ok':True}],'instagram':[{'id':'slot','ok':False}],'errors':[{'code':'instagram:slot'}]})
  self.assertEqual(code,1);self.assertTrue(result['문제']);self.assertEqual(result['인스타 오늘'],1)
 def test_existing_reel_cannot_hide_missing_instagram_comment(self):
  code,result=self.run_daily({'complete':False,'youtube':[{'video_id':'v','ok':True}],'instagram':[{'id':'slot','reels':1,'own_comments':0,'ok':False}],'errors':[{'code':'instagram:slot'}]})
  self.assertEqual(code,1)
 def test_missing_youtube_comment_is_in_shared_result(self):
  code,result=self.run_daily({'complete':False,'youtube':[{'video_id':'v','ok':False}],'errors':[{'code':'youtube:v'}]});self.assertEqual(code,1);self.assertIn('v',result['댓글 빠짐'])
 def test_complete_shared_readback_passes_without_retry_author(self):
  code,result=self.run_daily({'complete':True,'youtube':[{'video_id':'v','ok':True}],'instagram':[{'id':'slot','ok':True}],'errors':[]});self.assertEqual(code,0);self.assertFalse(result['문제'])
if __name__=='__main__':unittest.main()
