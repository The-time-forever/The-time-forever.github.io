#!/usr/bin/env python3
"""Download the official ZZZ calendar pair; publish only after full validation."""
from __future__ import annotations

import argparse
import hashlib
from http.client import IncompleteRead
import http.cookiejar
from html.parser import HTMLParser
import io
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPCookieProcessor, HTTPRedirectHandler, Request, build_opener
import warnings

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
API = 'https://api-takumi-static.mihoyo.com/content_v2_user/app/706fd13a87294881'
MINAS = 'https://minas.mihoyo.com'
MAX_BYTES = 25 * 1024 * 1024
MAX_PIXELS = 32_000_000
IMAGE_DIR = Path('src/assets/images/homepage')
STATE = Path('src/data/calendar.json')
TARGETS = {kind: IMAGE_DIR / f'hero-calendar-{kind}.jpg' for kind in ('desktop', 'mobile')}
ALLOWED_HOSTS = {'api-takumi-static.mihoyo.com', 'minas.mihoyo.com'}
SHANGHAI = timezone(timedelta(hours=8), name='Asia/Shanghai')


class CalendarError(Exception):
    pass


class NotPublished(CalendarError):
    pass


def check_url(url):
    parts = urlsplit(url)
    if (parts.scheme != 'https' or parts.hostname not in ALLOWED_HOSTS
            or parts.username or parts.password or parts.port not in (None, 443)):
        raise CalendarError('Unsupported resource host; manual review required.')


class OfficialRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        check_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class Http:
    """Fresh anonymous session; never uses personal browser cookies."""
    def __init__(self, timeout=40):
        self.timeout = timeout
        self.opener = build_opener(OfficialRedirects(), HTTPCookieProcessor(http.cookiejar.CookieJar()))

    def read(self, url, *, form=None, referer=None, limit=MAX_BYTES):
        # Retry one transient GET failure. Password POSTs are submitted only once.
        for attempt in range(2 if form is None else 1):
            try:
                return self._read_once(url, form=form, referer=referer, limit=limit)
            except CalendarError as error:
                transient = str(error).startswith('Network request failed') or bool(
                    re.fullmatch(r'Official server returned HTTP 50[0234]\.', str(error)))
                if not transient or form is not None or attempt == 1:
                    raise

    def _read_once(self, url, *, form=None, referer=None, limit=MAX_BYTES):
        check_url(url)
        headers = {'User-Agent': 'ZZZCalendarUpdater/1.0', 'Accept-Encoding': 'identity'}
        if referer:
            headers['Referer'] = referer
        body = urlencode(form).encode() if form is not None else None
        try:
            with self.opener.open(Request(url, body, headers), timeout=self.timeout) as response:
                length = response.headers.get('Content-Length')
                if length and int(length) > limit:
                    raise CalendarError('Resource exceeds download size limit.')
                data = response.read(limit + 1)
                if len(data) > limit:
                    raise CalendarError('Resource exceeds download size limit.')
                if length and len(data) != int(length):
                    raise CalendarError('Incomplete download.')
                return data, response.url
        except HTTPError as error:
            raise CalendarError(f'Official server returned HTTP {error.code}.') from None
        except (URLError, TimeoutError, socket.timeout, OSError, IncompleteRead) as error:
            raise CalendarError(f'Network request failed ({type(error).__name__}).') from None

    def text(self, url, **kwargs):
        data, _ = self.read(url, limit=4 * 1024 * 1024, **kwargs)
        return data.decode('utf-8')

    def json(self, url):
        try:
            return json.loads(self.text(url))
        except (ValueError, UnicodeError):
            raise CalendarError('Official server returned invalid JSON.') from None


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links = []
        self.inputs = {}
        self.text = []
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'input' and attrs.get('name'):
            self.inputs[attrs['name']] = attrs.get('value', '')

    def handle_data(self, data):
        self.text.append(data)


def matches_month(article, year, month):
    return bool(re.fullmatch(rf'《绝区零》\s*{year}年\s*0?{month}月月历壁纸',
                             article.get('sTitle', '').strip()))


def discover(http, year, month, announcement_url=None):
    """Walk the real ALL news feed (January 2026 is absent from NEWS)."""
    wanted_id = None
    if announcement_url:
        match = re.fullmatch(r'https://zzz\.mihoyo\.com/(?:main/)?news/(\d+)/?', announcement_url)
        if not match:
            raise CalendarError('Announcement URL must be an official zzz.mihoyo.com news URL.')
        wanted_id = int(match[1])
    floor = f'{year:04d}-{month:02d}-01'
    for page in range(1, 41):
        payload = http.json(API + '/getContentList?' + urlencode({
            'iChanId': 273, 'iPageSize': 100, 'iPage': page, 'sLangKey': 'zh-cn',
        }))
        if payload.get('retcode') != 0:
            raise CalendarError('Official news API rejected the request.')
        data = payload.get('data', {})
        rows = data.get('list')
        if not isinstance(rows, list):
            raise CalendarError('Official news list schema changed.')
        for row in rows:
            if matches_month(row, year, month) and (wanted_id is None or row.get('iInfoId') == wanted_id):
                published = row.get('dtStartTime', '')
                if not published.startswith(f'{year:04d}-{month:02d}-'):
                    raise CalendarError('Announcement title and publication month disagree.')
                if datetime.fromisoformat(published).replace(tzinfo=SHANGHAI) > datetime.now(SHANGHAI):
                    raise NotPublished('Announcement is scheduled for a later date.')
                return row
        # The official feed is ordered by publication time, newest first.
        if not rows or all(row.get('dtStartTime', '') < floor for row in rows):
            raise NotPublished(f'No official calendar announcement for {year:04d}-{month:02d}.')
        if page * 100 >= int(data.get('iTotal', page * 100 + 1)):
            raise NotPublished('Target announcement not found in the official feed.')
    raise CalendarError('News pagination limit reached; supply a newer supported source or review the API.')


def source_from_article(article, share_url=None, password=None):
    page = Page(article.get('sContent', ''))
    shares = sorted(set(url for url in page.links
                        if re.fullmatch(r'https://minas\.mihoyo\.com/d/[a-zA-Z0-9]+/', url)))
    if share_url:
        if share_url not in shares:
            raise CalendarError('Share override must appear in the target official announcement.')
        shares = [share_url]
    if len(shares) != 1:
        raise CalendarError('Expected one official Minas share link; manual review required.')
    found = re.search(r'(?:提取密码|提取码|密码)\s*[:：]\s*([A-Za-z0-9_-]+)', ' '.join(page.text))
    # No speculative yearly password: the ten historical announcements all provide one.
    return shares[0], password if password is not None else (found[1] if found else None)


def list_files(http, share_url, password):
    token = share_url.rstrip('/').split('/')[-1]
    html = http.text(share_url)
    page = Page(html)
    if 'password' in page.inputs:
        if not password:
            raise CalendarError('Share requires a password; supply --password or CALENDAR_SHARE_PASSWORD.')
        csrf = page.inputs.get('csrfmiddlewaretoken')
        if not csrf:
            raise CalendarError('Share password form changed; CSRF token missing.')
        html = http.text(share_url, form={
            'csrfmiddlewaretoken': csrf, 'token': token, 'password': password,
        }, referer=share_url)
        if 'password' in Page(html).inputs:
            raise CalendarError('Share password rejected or interactive verification required.')
    if 'trafficOverLimit: true' in html or 'canDownload: false' in html:
        raise CalendarError('Official share has disabled downloads.')
    data = http.json(f'{MINAS}/api/v2.1/share-links/{token}/dirents/?path=%2F')
    entries = data.get('dirent_list')
    if not isinstance(entries, list) or len(entries) > 50:
        raise CalendarError('Unexpected shared directory response.')
    return entries


def select_pair(entries, month):
    selected = {}
    for entry in entries:
        name = entry.get('file_name', '')
        if entry.get('is_dir') or not re.search(r'\.(?:png|jpe?g)$', name, re.I):
            continue  # Archives are never downloaded or extracted.
        if not re.search(rf'(?<!\d)0?{month}月月历壁纸', name):
            continue
        kind = ('desktop' if re.search(r'(?:PC|电脑|桌面)', name, re.I)
                else 'mobile' if re.search(r'(?:手机|mobile)', name, re.I) else None)
        if kind is None:
            continue
        path = entry.get('file_path', '')
        if (not path.startswith('/') or '\\' in path or '..' in path.split('/')
                or path.rsplit('/', 1)[-1] != name):
            raise CalendarError('Invalid shared file path.')
        if kind in selected:
            raise CalendarError(f'Ambiguous {kind} wallpaper; manual review required.')
        if not 0 < entry.get('size', 0) <= MAX_BYTES:
            raise CalendarError('Invalid wallpaper file size.')
        selected[kind] = entry
    if set(selected) != set(TARGETS):
        raise CalendarError('A complete, unambiguous PC/mobile calendar pair is required.')
    return selected


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def prepare_image(data, kind):
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as image:
                fmt = image.format
                if fmt not in {'JPEG', 'PNG'} or image.width * image.height > MAX_PIXELS:
                    raise CalendarError('Unsupported image format or excessive pixel count.')
                image.verify()
            with Image.open(io.BytesIO(data)) as image:
                image.load()
                oriented = ImageOps.exif_transpose(image)
                width, height = oriented.size
                ratio = width / height
                valid = (width >= 1920 and height >= 1080 and 1.5 <= ratio <= 2.1
                         if kind == 'desktop' else
                         width >= 1080 and height >= 1920 and 0.4 <= ratio <= 0.65)
                if not valid:
                    raise CalendarError(f'Invalid dimensions/orientation for {kind}: {width}x{height}.')
                if fmt == 'JPEG' and image.mode == 'RGB' and image.getexif().get(274, 1) == 1:
                    output = data  # Preserve an already suitable original JPEG byte-for-byte.
                else:
                    buffer = io.BytesIO()
                    if oriented.mode == 'RGBA':
                        rgb = Image.new('RGB', oriented.size, 'white')
                        rgb.paste(oriented, mask=oriented.getchannel('A'))
                    else:
                        rgb = oriented.convert('RGB')
                    rgb.save(buffer, format='JPEG', quality=95, subsampling=0, optimize=True)
                    output = buffer.getvalue()
                return output, {'format': fmt, 'width': width, 'height': height,
                                'original_sha256': sha256(data), 'sha256': sha256(output)}
    except CalendarError:
        raise
    except (OSError, ValueError, SyntaxError, Image.DecompressionBombError, Image.DecompressionBombWarning):
        raise CalendarError(f'Corrupt or unsafe {kind} image.') from None


def read_state(root):
    try:
        return json.loads((root / STATE).read_text(encoding='utf-8'))
    except FileNotFoundError:
        return {}


def already_updated(root, year_month):
    state = read_state(root)
    return state.get('year_month') == year_month and all(
        (root / path).exists() and sha256((root / path).read_bytes()) == state.get('images', {}).get(kind, {}).get('sha256')
        for kind, path in TARGETS.items()
    )


def replace_file(source, target):
    os.replace(source, target)


def recover(root):
    """Recover a transaction interrupted by process termination or a failed build."""
    journal = root / '.calendar-transaction'
    if not journal.exists():
        return
    if (journal / 'complete').exists():
        shutil.rmtree(journal)
        return
    manifest = journal / 'manifest.json'
    if manifest.exists():
        for name, existed in json.loads(manifest.read_text()).items():
            target = root / name
            if existed:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(journal / Path(name).name, target)
            else:
                target.unlink(missing_ok=True)
    shutil.rmtree(journal)


def install(root, images, metadata, build=False):
    journal = root / '.calendar-transaction'
    journal.mkdir()
    paths = [*TARGETS.values(), STATE]
    existed = {path.as_posix(): (root / path).exists() for path in paths}
    for path in paths:
        if existed[path.as_posix()]:
            shutil.copyfile(root / path, journal / path.name)
    (journal / 'manifest.json').write_text(json.dumps(existed), encoding='utf-8')
    try:
        for kind, path in TARGETS.items():
            staged = journal / f'new-{kind}.jpg'
            staged.write_bytes(images[kind])
            (root / path).parent.mkdir(parents=True, exist_ok=True)
            replace_file(staged, root / path)
        staged = journal / 'new-calendar.json'
        staged.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (root / STATE).parent.mkdir(parents=True, exist_ok=True)
        replace_file(staged, root / STATE)
        if build:
            npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
            if not npm:
                raise CalendarError('npm not found; build validation required.')
            subprocess.run([npm, 'run', 'build'], cwd=root, check=True)
        # Once committed, an interrupted cleanup must never roll back a successful update.
        (journal / 'complete').write_text('validated\n', encoding='utf-8')
    except BaseException:
        recover(root)
        raise
    shutil.rmtree(journal, ignore_errors=True)


def update(http, root, year, month, *, dry_run=False, force=False, build=False,
           announcement_url=None, share_url=None, password=None):
    target = f'{year:04d}-{month:02d}'
    if not force and not dry_run and already_updated(root, target):
        return {'status': 'already-updated', 'year_month': target, 'changed': False}
    article = discover(http, year, month, announcement_url)
    share, password = source_from_article(article, share_url, password)
    pair = select_pair(list_files(http, share, password), month)
    images, details = {}, {}
    # No target file is touched until BOTH complete downloads have decoded successfully.
    for kind, entry in pair.items():
        url = share + 'files/?' + urlencode({'p': entry['file_path'], 'dl': 1})
        data, _ = http.read(url)
        if len(data) != entry['size']:
            raise CalendarError(f'Incomplete {kind} download (directory size mismatch).')
        images[kind], details[kind] = prepare_image(data, kind)
        details[kind].update({'name': entry['file_name'], 'bytes': len(data), 'download_url': url})
    metadata = {
        'year_month': target, 'year': year, 'month': month,
        'announcement_url': f"https://zzz.mihoyo.com/news/{article['iInfoId']}",
        'published_at': article['dtStartTime'], 'share_url': share,
        'updated_at': datetime.now(timezone.utc).isoformat(), 'images': details,
    }
    identical = all((root / TARGETS[kind]).exists() and
                    (root / TARGETS[kind]).read_bytes() == data for kind, data in images.items())
    if not dry_run and not identical:
        install(root, images, metadata, build)
    return {'status': 'validated' if dry_run else 'identical-images' if identical else 'updated',
            'year_month': target, 'changed': not dry_run and not identical, 'metadata': metadata}


def report(result):
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as output:
            output.write(f"changed={str(result.get('changed', False)).lower()}\n")
            output.write(f"year_month={result['year_month']}\nstatus={result['status']}\n")
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as summary:
            summary.write(f"### ZZZ calendar {result['year_month']}\n\nStatus: **{result['status']}**\n\n")
            if result.get('error'):
                summary.write(result['error'] + '\n')
            if result.get('metadata'):
                summary.write(f"Source: {result['metadata']['announcement_url']}\n\n")
                for kind, detail in result['metadata']['images'].items():
                    summary.write(f"- {kind}: {detail['width']}x{detail['height']}, SHA256 `{detail['sha256']}`\n")


def main(argv=None):
    now = datetime.now(SHANGHAI)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--year', type=int)
    parser.add_argument('--month', type=int)
    parser.add_argument('--dry-run', action='store_true', help='Download and validate both originals; do not write site files.')
    parser.add_argument('--force', action='store_true', help='Revalidate even when metadata and hashes match.')
    parser.add_argument('--build', action='store_true', help='Run npm run build; roll back files on build failure.')
    parser.add_argument('--announcement-url')
    parser.add_argument('--share-url', help='Must be linked by the verified official announcement.')
    parser.add_argument('--password', default=os.environ.get('CALENDAR_SHARE_PASSWORD'), help='Prefer environment variable CALENDAR_SHARE_PASSWORD.')
    parser.add_argument('--timeout', type=int, default=40)
    args = parser.parse_args(argv)
    if (args.year is None) != (args.month is None):
        parser.error('--year and --month must be supplied together')
    year, month = (args.year, args.month) if args.year is not None else (now.year, now.month)
    if not (2024 <= year <= 2100 and 1 <= month <= 12 and 1 <= args.timeout <= 120):
        parser.error('invalid year, month or timeout')
    target = f'{year:04d}-{month:02d}'
    # Exclusive process lock with automatic OS release after a crash.
    lock = ROOT / '.calendar-update.lock'
    with lock.open('a+b') as handle:
        try:
            if os.name == 'nt':
                import msvcrt
                handle.seek(0)
                if handle.read(1) == b'':
                    handle.write(b'0')
                    handle.flush()
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            report({'status': 'failed', 'year_month': target, 'changed': False, 'error': 'Another updater holds the process lock.'})
            return 1
        try:
            recover(ROOT)
            result = update(Http(args.timeout), ROOT, year, month, dry_run=args.dry_run,
                            force=args.force, build=args.build, announcement_url=args.announcement_url,
                            share_url=args.share_url, password=args.password)
            report(result)
            return 0
        except NotPublished as error:
            report({'status': 'not-published', 'year_month': target, 'changed': False, 'error': str(error)})
            return 0
        except (CalendarError, OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError) as error:
            # Avoid exception repr / full request URLs, which may contain form credentials.
            message = str(error) if isinstance(error, CalendarError) else f'Update failed ({type(error).__name__}); site files preserved.'
            report({'status': 'failed', 'year_month': target, 'changed': False, 'error': message})
            return 1


if __name__ == '__main__':
    sys.exit(main())
