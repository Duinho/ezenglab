"""render.py를 실행하지 않고 실제 RUNTIME과 공통 JS를 문서 fixture로 검증합니다."""
import ast
import importlib.util
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


class TextRuntimeTests(unittest.TestCase):
    def test_dom_conversion_collection_and_real_runtime(self):
        root = Path(__file__).parent
        module = ast.parse((root/'render.py').read_text(encoding='utf-8'))
        runtime = next(ast.literal_eval(n.value) for n in module.body
                       if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id=='RUNTIME' for t in n.targets))
        node = shutil.which('node')
        if not node:
            package = importlib.util.find_spec('playwright')
            if package and package.submodule_search_locations:
                candidate = Path(next(iter(package.submodule_search_locations)))/'driver/node'
                if candidate.is_file(): node = str(candidate)
        self.assertIsNotNone(node, 'Node 또는 기존 Playwright의 Node가 필요합니다(브라우저 실행 없음)')
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'runtime.js'
            path.write_text(runtime, encoding='utf-8')
            result = subprocess.run([node, str(root/'test_text_notation.js'), str(path)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('17 checks passed', result.stdout)


if __name__ == '__main__':
    unittest.main(verbosity=2)
