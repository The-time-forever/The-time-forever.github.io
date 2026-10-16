#!/usr/bin/env python3
"""Replay official discovery and downloads without modifying homepage assets."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path

from update_calendar import CalendarError, Http, ROOT, STATE, TARGETS, sha256, update


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--year', type=int, default=2026)
    parser.add_argument('--through-month', type=int, default=10)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not 2024 <= args.year <= 2100 or not 1 <= args.through_month <= 12:
        parser.error('invalid year or month')
    before = {str(path): sha256((ROOT / path).read_bytes())
              for path in [*TARGETS.values(), STATE]}
    results = []
    for month in range(1, args.through_month + 1):
        try:
            result = update(Http(), ROOT, args.year, month, dry_run=True)
        except CalendarError as error:
            result = {'year_month': f'{args.year:04d}-{month:02d}', 'status': 'failed', 'error': str(error)}
        results.append(result)
        print(result['year_month'], result['status'], result.get('error', ''), flush=True)
    after = {str(path): sha256((ROOT / path).read_bytes())
             for path in [*TARGETS.values(), STATE]}
    if before != after:
        raise RuntimeError('History verification unexpectedly changed site files.')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({
        'checked_at': datetime.now(timezone.utc).isoformat(), 'site_files_unchanged': True,
        'results': results,
    }, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return int(any(result['status'] != 'validated' for result in results))


if __name__ == '__main__':
    raise SystemExit(main())
