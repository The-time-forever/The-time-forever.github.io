"""Behavioral failure-injection tests: errors must preserve the entire old pair."""
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from PIL import Image

spec = importlib.util.spec_from_file_location('calendar_updater', Path(__file__).parents[1] / 'update_calendar.py')
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)
SHARE = 'https://minas.mihoyo.com/d/testtoken/'


class FakeHttp:
    def __init__(self, images):
        self.images = images
        self.fail = None
        self.password_bad = False
        self.missing_mobile = False
        self.no_article = False

    def json(self, url):
        if 'getContentList' in url:
            return {'retcode': 0, 'data': {'iTotal': 1, 'list': [] if self.no_article else [{
                'sTitle': '《绝区零》2026年10月月历壁纸', 'iInfoId': 123,
                'dtStartTime': '2026-10-01 12:00:00',
                'sContent': f'<a href="{SHARE}">Download</a><p>密码：publicpassword</p>',
            }]}}
        return {'dirent_list': [{
            'is_dir': False, 'file_name': f'10月月历壁纸_{label}版.jpg',
            'file_path': f'/10月月历壁纸_{label}版.jpg', 'size': len(data),
        } for label, data in self.images.items() if not (self.missing_mobile and label == '手机')]}

    def text(self, url, **kwargs):
        if not kwargs.get('form') or self.password_bad:
            return '<input name="csrfmiddlewaretoken" value="csrf"><input name="password">'
        return 'shared directory'

    def read(self, url):
        path = parse_qs(urlsplit(url).query)['p'][0]
        kind = 'PC' if 'PC' in path else '手机'
        if self.fail == 'timeout':
            raise updater.CalendarError('Network request failed (TimeoutError).')
        data = self.images[kind]
        if self.fail == 'partial' and kind == '手机':
            data = data[:-10]
        if self.fail == 'corrupt' and kind == '手机':
            data = b'x' * len(data)
        return data, url


class UpdateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.images = {}
        for label, size in [('PC', (2560, 1440)), ('手机', (1290, 2796))]:
            image = Image.new('RGB', size, '#34c6bc')
            output = io.BytesIO()
            image.save(output, format='JPEG')
            cls.images[label] = output.getvalue()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in [*updater.TARGETS.values(), updater.STATE]:
            (self.root / path).parent.mkdir(parents=True, exist_ok=True)
            (self.root / path).write_bytes(b'old-file' if path != updater.STATE else b'{}')
        self.before = self.snapshot()
        self.http = FakeHttp(self.images)

    def snapshot(self):
        return {str(path): (self.root / path).read_bytes()
                for path in [*updater.TARGETS.values(), updater.STATE]}

    def run_update(self, **kwargs):
        return updater.update(self.http, self.root, 2026, 10, **kwargs)

    def assert_failed_without_changes(self):
        with self.assertRaises(updater.CalendarError):
            self.run_update()
        self.assertEqual(self.before, self.snapshot())

    def test_timeout_preserves_all_files(self):
        self.http.fail = 'timeout'
        self.assert_failed_without_changes()

    def test_actual_http_timeout_becomes_safe_error(self):
        http = updater.Http()
        with patch.object(http.opener, 'open', side_effect=TimeoutError):
            with self.assertRaisesRegex(updater.CalendarError, 'Network request failed'):
                http.read(SHARE)

    def test_transient_get_retries_once_but_password_post_does_not(self):
        http = updater.Http()
        failure = updater.CalendarError('Network request failed (URLError).')
        with patch.object(http, '_read_once', side_effect=[failure, (b'complete', SHARE)]) as read:
            self.assertEqual(http.read(SHARE)[0], b'complete')
            self.assertEqual(read.call_count, 2)
        with patch.object(http, '_read_once', side_effect=failure) as read:
            with self.assertRaises(updater.CalendarError):
                http.read(SHARE, form={'password': 'public'})
            self.assertEqual(read.call_count, 1)

    def test_not_published_preserves_all_files(self):
        self.http.no_article = True
        with self.assertRaises(updater.NotPublished):
            self.run_update()
        self.assertEqual(self.before, self.snapshot())

    def test_wrong_password_preserves_all_files(self):
        self.http.password_bad = True
        self.assert_failed_without_changes()

    def test_missing_mobile_preserves_all_files(self):
        self.http.missing_mobile = True
        self.assert_failed_without_changes()

    def test_incomplete_mobile_preserves_all_files(self):
        self.http.fail = 'partial'
        self.assert_failed_without_changes()

    def test_corrupt_mobile_preserves_all_files(self):
        self.http.fail = 'corrupt'
        self.assert_failed_without_changes()

    def test_build_failure_rolls_back_pair_and_metadata(self):
        with patch.object(updater.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'npm')):
            with self.assertRaises(subprocess.CalledProcessError):
                self.run_update(build=True)
        self.assertEqual(self.before, self.snapshot())
        self.assertFalse((self.root / '.calendar-transaction').exists())

    def test_replacement_failure_rolls_back_first_file(self):
        original = updater.replace_file
        calls = []

        def fail_second(source, target):
            calls.append(target)
            if len(calls) == 2:
                raise OSError('simulated second replacement failure')
            original(source, target)

        with patch.object(updater, 'replace_file', side_effect=fail_second):
            with self.assertRaises(OSError):
                self.run_update()
        self.assertEqual(self.before, self.snapshot())

    def test_success_then_no_network_or_new_metadata_on_rerun(self):
        self.assertTrue(self.run_update()['changed'])
        after = self.snapshot()
        with patch.object(self.http, 'json', side_effect=AssertionError('No network expected')):
            self.assertEqual(self.run_update()['status'], 'already-updated')
        self.assertEqual(after, self.snapshot())
        self.assertEqual((self.root / updater.TARGETS['desktop']).read_bytes(), self.images['PC'])

    def test_dry_run_downloads_without_writing(self):
        self.assertEqual(self.run_update(dry_run=True)['status'], 'validated')
        self.assertEqual(self.before, self.snapshot())

    def test_force_identical_pair_does_not_change_metadata(self):
        self.run_update()
        after = self.snapshot()
        self.assertEqual(self.run_update(force=True)['status'], 'identical-images')
        self.assertEqual(after, self.snapshot())

    def test_changed_hash_prevents_incorrect_skip(self):
        self.run_update()
        (self.root / updater.TARGETS['mobile']).write_bytes(b'corrupted')
        self.assertTrue(self.run_update()['changed'])

    def test_interrupted_transaction_recovers_on_next_invocation(self):
        journal = self.root / '.calendar-transaction'
        journal.mkdir()
        manifest = {}
        for path in [*updater.TARGETS.values(), updater.STATE]:
            manifest[path.as_posix()] = True
            (journal / path.name).write_bytes((self.root / path).read_bytes())
        (journal / 'manifest.json').write_text(json.dumps(manifest))
        (self.root / updater.TARGETS['desktop']).write_bytes(b'new-half-pair')
        updater.recover(self.root)
        self.assertEqual(self.before, self.snapshot())

    def test_completed_transaction_cleanup_keeps_new_files(self):
        self.run_update()
        after = self.snapshot()
        journal = self.root / '.calendar-transaction'
        journal.mkdir()
        (journal / 'complete').write_text('validated')
        (journal / 'manifest.json').write_text('{}')
        updater.recover(self.root)
        self.assertEqual(after, self.snapshot())
        self.assertFalse(journal.exists())

    def test_month_and_orientation_must_match(self):
        self.assertFalse(updater.matches_month({'sTitle': '《绝区零》2026年1月月历壁纸'}, 2026, 10))
        with self.assertRaises(updater.CalendarError):
            updater.prepare_image(self.images['手机'], 'desktop')

    def test_untrusted_redirect_and_unbound_share_are_rejected(self):
        for url in ['https://evil.example/x', 'http://minas.mihoyo.com/x',
                    'https://minas.mihoyo.com@evil.example/x']:
            with self.assertRaises(updater.CalendarError):
                updater.check_url(url)
        with self.assertRaises(updater.CalendarError):
            updater.source_from_article({'sContent': ''}, share_url=SHARE)

    def test_archives_and_ambiguous_versions_fail_closed(self):
        with self.assertRaises(updater.CalendarError):
            updater.select_pair([{'file_name': '10月月历壁纸.zip', 'is_dir': False}], 10)
        entries = self.http.json('directory')['dirent_list']
        with self.assertRaises(updater.CalendarError):
            updater.select_pair(entries + entries[:1], 10)


if __name__ == '__main__':
    unittest.main()
