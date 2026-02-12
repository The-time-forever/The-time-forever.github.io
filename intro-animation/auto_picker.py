from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image

try:
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None

DEFAULT_TESSERACT_CMD = r"D:\SoftWare\Tesseract-OCR\tesseract.exe"


WEEKDAYS = {
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
    "SUN",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
}


@dataclass
class Band:
    y0: int
    y1: int
    x0: int
    x1: int

    @property
    def height(self) -> int:
        return self.y1 - self.y0

    @property
    def width(self) -> int:
        return self.x1 - self.x0


def infer_days_from_name(image_path: Path) -> int | None:
    m = re.search(r"(19|20)\d{2}(0[1-9]|1[0-2])", image_path.name)
    if not m:
        return None
    token = m.group(0)
    year, month = int(token[:4]), int(token[4:6])
    # day=0 of next month -> last day of current month
    return int((np.datetime64(f"{year:04d}-{month:02d}") + np.timedelta64(1, "M") - np.timedelta64(1, "D")).astype("datetime64[D]").astype(str).split("-")[2])


def to_percent(cx: float, cy: float, w: int, h: int) -> tuple[float, float]:
    return round(cx / w * 100.0, 4), round(cy / h * 100.0, 4)


def px_to_percent_item(item: dict[str, Any], w: int, h: int) -> dict[str, Any]:
    lp, tp = to_percent(float(item["cx"]), float(item["cy"]), w, h)
    out = dict(item)
    out["leftPercent"] = lp
    out["topPercent"] = tp
    out.pop("cx", None)
    out.pop("cy", None)
    return out


def find_dark_calendar_band(img_bgr: np.ndarray) -> Band:
    h, w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # Bottom 45% usually contains the calendar strip.
    y_start = int(h * 0.55)
    region = gray[y_start:, :]
    dark_mask = region < 70
    row_dark_ratio = dark_mask.mean(axis=1)

    idx = np.where(row_dark_ratio > 0.32)[0]
    if idx.size == 0:
        # Fallback: fixed bottom band.
        y0 = int(h * 0.86)
        y1 = int(h * 0.98)
        return Band(y0=y0, y1=y1, x0=0, x1=w)

    # Merge runs and pick the longest.
    runs: list[tuple[int, int]] = []
    s = idx[0]
    p = idx[0]
    for i in idx[1:]:
        if i == p + 1:
            p = i
            continue
        runs.append((s, p))
        s = i
        p = i
    runs.append((s, p))

    run = max(runs, key=lambda x: x[1] - x[0])
    y0 = y_start + run[0]
    y1 = y_start + run[1] + 1
    return Band(y0=max(0, y0 - 4), y1=min(h, y1 + 4), x0=0, x1=w)


def detect_text_rows_in_band(band_gray: np.ndarray) -> list[int]:
    thr = cv2.adaptiveThreshold(
        band_gray,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        31,
        7,
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
    thr = cv2.morphologyEx(thr, cv2.MORPH_OPEN, kernel)
    row_energy = thr.mean(axis=1)
    idx = np.where(row_energy > np.percentile(row_energy, 70))[0]
    if idx.size == 0:
        return []
    # Keep top 2 separated peaks.
    groups: list[tuple[int, int]] = []
    s = idx[0]
    p = idx[0]
    for i in idx[1:]:
        if i == p + 1:
            p = i
            continue
        groups.append((s, p))
        s = i
        p = i
    groups.append((s, p))
    centers = [int((a + b) / 2) for a, b in sorted(groups, key=lambda g: g[1] - g[0], reverse=True)[:2]]
    return sorted(centers)


def _ocr_candidates_from_image(img_rgb: np.ndarray, psm: int) -> dict[str, Any]:
    return pytesseract.image_to_data(
        img_rgb,
        lang="eng",
        output_type=pytesseract.Output.DICT,
        config=f"--psm {psm}",
    )


def estimate_two_row_centers(y_values: list[float], fallback: list[int]) -> list[int]:
    if len(y_values) < 4:
        out = sorted(int(v) for v in fallback)[:2]
        if len(out) == 1:
            out = [out[0], out[0] + 20]
        return out
    ys = np.array(y_values, dtype=float)
    c1 = float(np.percentile(ys, 30))
    c2 = float(np.percentile(ys, 70))
    for _ in range(10):
        d1 = np.abs(ys - c1)
        d2 = np.abs(ys - c2)
        m1 = ys[d1 <= d2]
        m2 = ys[d1 > d2]
        if m1.size > 0:
            c1 = float(m1.mean())
        if m2.size > 0:
            c2 = float(m2.mean())
    centers = sorted([int(round(c1)), int(round(c2))])
    if abs(centers[1] - centers[0]) < 12:
        out = sorted(int(v) for v in fallback)[:2]
        if len(out) == 1:
            out = [out[0], out[0] + 20]
        return out
    return centers


def ocr_extract(
    img_bgr: np.ndarray,
    band: Band,
    row_centers_global: list[int],
    days: int,
    tesseract_cmd: str | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], str | None]:
    if pytesseract is None:
        return [], [], "pytesseract package is unavailable"
    cmd = tesseract_cmd or DEFAULT_TESSERACT_CMD
    if cmd:
        pytesseract.pytesseract.tesseract_cmd = cmd
        if not Path(cmd).exists():
            return [], [], f"tesseract executable not found: {cmd}"
    try:
        _ = pytesseract.get_tesseract_version()
    except Exception as e:  # noqa: BLE001
        return [], [], f"tesseract engine not found: {e}"

    h, w = img_bgr.shape[:2]
    # Only OCR the bottom calendar strip to avoid false positives in artwork.
    crop = img_bgr[band.y0:band.y1, band.x0:band.x1]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    # Multi-pass OCR:
    # 1) grayscale
    # 2) inverted grayscale (improves white text on dark background)
    # 3) adaptive threshold + invert
    inv = cv2.bitwise_not(gray)
    thr = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 7)
    thr_inv = cv2.bitwise_not(thr)

    inputs = [
        cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB),
        cv2.cvtColor(inv, cv2.COLOR_GRAY2RGB),
        cv2.cvtColor(thr_inv, cv2.COLOR_GRAY2RGB),
    ]

    number_candidates: list[dict[str, Any]] = []
    weekday_map: dict[str, dict[str, Any]] = {}
    for rgb in inputs:
        data = _ocr_candidates_from_image(rgb, psm=11)
        n = len(data["text"])
        for i in range(n):
            txt = (data["text"][i] or "").strip()
            if not txt:
                continue
            conf = float(data["conf"][i]) if data["conf"][i] != "-1" else -1.0
            if conf < 5:
                continue

            x, y = int(data["left"][i]), int(data["top"][i])
            bw, bh = int(data["width"][i]), int(data["height"][i])
            if bw <= 0 or bh <= 0:
                continue
            cx = band.x0 + x + bw / 2.0
            cy = band.y0 + y + bh / 2.0

            if re.fullmatch(r"\d{1,2}", txt):
                v = int(txt)
                if 1 <= v <= 31:
                    number_candidates.append(
                        {
                            "value": v,
                            "text": str(v),
                            "cx": cx,
                            "cy": cy,
                            "confidence": conf,
                        }
                    )
                continue

            token = re.sub(r"[^A-Za-z]", "", txt).upper()
            if token in WEEKDAYS:
                prev = weekday_map.get(token)
                if prev is None or conf > prev["confidence"]:
                    weekday_map[token] = {
                        "text": token,
                        "cx": cx,
                        "cy": cy,
                        "confidence": conf,
                    }

    if not row_centers_global:
        row_centers_global = [int(band.y0 + band.height * 0.30), int(band.y0 + band.height * 0.70)]
    row_centers_global = sorted(int(v) for v in row_centers_global)[:2]
    if len(row_centers_global) == 1:
        row_centers_global = [row_centers_global[0], int(band.y0 + band.height * 0.70)]
    candidate_centers = estimate_two_row_centers([c["cy"] for c in number_candidates], row_centers_global)
    row_centers_global = candidate_centers

    y_tol = max(16.0, band.height * 0.14)
    in_row_candidates: list[dict[str, Any]] = []
    for c in number_candidates:
        dy1 = abs(c["cy"] - row_centers_global[0])
        dy2 = abs(c["cy"] - row_centers_global[1])
        if min(dy1, dy2) <= y_tol:
            in_row_candidates.append(c)

    # Value-wise pick best candidate by expected row distance + confidence.
    by_value: dict[int, dict[str, Any]] = {}
    for c in in_row_candidates:
        expected_row_idx = 0 if c["value"] <= 15 else 1
        expected_y = row_centers_global[min(expected_row_idx, len(row_centers_global) - 1)]
        y_penalty = abs(c["cy"] - expected_y) * 1.2
        score = c["confidence"] - y_penalty
        keep = by_value.get(c["value"])
        if keep is None or score > keep["score"]:
            by_value[c["value"]] = {**c, "score": score}

    # Prepare row anchors for interpolation completion.
    inferred_days = max(1, min(31, int(days)))
    row_specs = [(1, 15), (16, inferred_days)]
    completed: list[dict[str, Any]] = []
    used_vals = set(by_value.keys())

    for row_idx, (start_v, end_v) in enumerate(row_specs):
        if end_v < start_v:
            continue
        row_vals = [v for v in range(start_v, end_v + 1)]
        anchors = [by_value[v] for v in row_vals if v in by_value]
        anchors.sort(key=lambda a: a["value"])

        if len(anchors) >= 2:
            left_a = anchors[0]
            right_a = anchors[-1]
            span_v = max(1, right_a["value"] - left_a["value"])
            step_x = (right_a["cx"] - left_a["cx"]) / span_v
            base_x = left_a["cx"] - step_x * (left_a["value"] - start_v)
            # y uses robust center around row for better stability.
            anchor_ys = np.array([a["cy"] for a in anchors], dtype=float)
            row_y = float(np.median(anchor_ys))
        elif len(anchors) == 1:
            only = anchors[0]
            # fallback width allocation for this row
            col_count = max(1, end_v - start_v)
            step_x = (band.width * 0.46) / max(1, col_count)
            base_x = float(only["cx"] - step_x * (only["value"] - start_v))
            row_y = float(only["cy"])
        else:
            # no anchor at all -> coarse fallback from band geometry
            col_count = max(1, end_v - start_v)
            step_x = (band.width * 0.46) / max(1, col_count)
            base_x = float(band.x0 + band.width * 0.23)
            row_y = float(row_centers_global[min(row_idx, len(row_centers_global) - 1)])

        for v in row_vals:
            if v in by_value:
                c = by_value[v]
                completed.append(
                    {
                        "value": v,
                        "text": str(v),
                        "cx": c["cx"],
                        "cy": c["cy"],
                        "confidence": c["confidence"],
                        "source": "ocr",
                    }
                )
                continue
            cx = base_x + (v - start_v) * step_x
            completed.append(
                {
                    "value": v,
                    "text": str(v),
                    "cx": float(cx),
                    "cy": float(row_y),
                    "confidence": None,
                    "source": "interpolated",
                }
            )

    numbers = [px_to_percent_item(n, w, h) for n in sorted(completed, key=lambda x: x["value"])]
    weekdays = [px_to_percent_item(v, w, h) for v in weekday_map.values()]

    # Remove debug-only fields.
    for n in numbers:
        n.pop("score", None)
    for wd in weekdays:
        wd.pop("score", None)

    return numbers, weekdays, None


def annotate(img_bgr: np.ndarray, numbers: list[dict[str, Any]], weekdays: list[dict[str, Any]], out_file: Path) -> None:
    h, w = img_bgr.shape[:2]
    vis = img_bgr.copy()
    for n in numbers:
        x = int(n["leftPercent"] / 100.0 * w)
        y = int(n["topPercent"] / 100.0 * h)
        cv2.circle(vis, (x, y), 15, (80, 255, 120), -1)
        cv2.putText(vis, n["text"], (x - 9, y + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (20, 40, 20), 1, cv2.LINE_AA)
    for wd in weekdays:
        x = int(wd["leftPercent"] / 100.0 * w)
        y = int(wd["topPercent"] / 100.0 * h)
        cv2.rectangle(vis, (x - 26, y - 10), (x + 26, y + 10), (90, 200, 255), -1)
        cv2.putText(vis, wd["text"], (x - 23, y + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1, cv2.LINE_AA)
    cv2.imwrite(str(out_file), vis)


def main() -> None:
    parser = argparse.ArgumentParser(description="Auto detect calendar date coordinates from image")
    parser.add_argument("--image", default="intro-animation/calendar202602.png", help="Input image path")
    parser.add_argument("--out-json", default=None, help="Output json path (default: <image-stem>-coordinates-python.json)")
    parser.add_argument("--out-preview", default=None, help="Output annotated image (default: <image-stem>-coordinates-preview.jpg)")
    parser.add_argument("--tesseract-cmd", default=os.environ.get("TESSERACT_CMD", DEFAULT_TESSERACT_CMD), help="Path to tesseract executable")
    parser.add_argument("--days", type=int, default=None, help="Month days override (28-31)")
    args = parser.parse_args()

    image_path = Path(args.image)

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    out_json = Path(args.out_json) if args.out_json else image_path.with_name(f"{image_path.stem}-coordinates-python.json")
    out_preview = Path(args.out_preview) if args.out_preview else image_path.with_name(f"{image_path.stem}-coordinates-preview.jpg")

    pil_img = Image.open(image_path).convert("RGB")
    img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    h, w = img_bgr.shape[:2]

    band = find_dark_calendar_band(img_bgr)
    band_gray = cv2.cvtColor(img_bgr[band.y0:band.y1, band.x0:band.x1], cv2.COLOR_BGR2GRAY)
    row_centers_local = detect_text_rows_in_band(band_gray)
    row_centers_global = [band.y0 + r for r in row_centers_local]

    inferred_days = infer_days_from_name(image_path)
    days = int(args.days) if args.days is not None else int(inferred_days or 31)
    days = max(28, min(31, days))

    numbers, weekdays, ocr_error = ocr_extract(
        img_bgr,
        band=band,
        row_centers_global=row_centers_global,
        days=days,
        tesseract_cmd=args.tesseract_cmd,
    )

    payload: dict[str, Any] = {
        "image": str(image_path.as_posix()),
        "generatedAt": np.datetime_as_string(np.datetime64("now"), unit="s"),
        "imageNaturalSize": {"width": int(w), "height": int(h)},
        "inferredDaysFromName": int(inferred_days) if inferred_days is not None else None,
        "daysUsed": int(days),
        "layout": {
            "calendarBand": {
                "x0": int(band.x0),
                "x1": int(band.x1),
                "y0": int(band.y0),
                "y1": int(band.y1),
                "width": int(band.width),
                "height": int(band.height),
            },
            "detectedRowCentersY": [int(v) for v in row_centers_global],
        },
        "numbers": numbers,
        "weekdays": weekdays,
        "ocr": {
            "enabled": ocr_error is None,
            "error": ocr_error,
            "engine": "pytesseract",
            "tesseractCmd": args.tesseract_cmd,
        },
        "manualCalibrationGuide": [
            {"point": "01_center", "order": 1},
            {"point": "15_center", "order": 2},
            {"point": "16_center", "order": 3},
            {"point": "last_day_center", "order": 4},
        ],
    }

    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    annotate(img_bgr, numbers, weekdays, out_preview)

    print(f"[OK] image: {image_path}")
    print(f"[OK] json:  {out_json}")
    print(f"[OK] preview: {out_preview}")
    print(f"[INFO] size: {w}x{h}")
    print(f"[INFO] inferred days: {payload['inferredDaysFromName']}")
    print(f"[INFO] band: y={band.y0}:{band.y1}, h={band.height}")
    print(f"[INFO] row centers Y: {row_centers_global}")
    if ocr_error:
        print(f"[WARN] OCR unavailable: {ocr_error}")
    else:
        print(f"[INFO] OCR numbers={len(numbers)}, weekdays={len(weekdays)}")


if __name__ == "__main__":
    main()
