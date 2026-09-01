#!/usr/bin/env python3
"""Compare Cocos Gate C screenshots against the approved V7 reference."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image


APPROVED_V7 = Path(
    "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/"
    "gate-b-material-proof/v4b-natural-starry-sky-cartoon-human-cat-v7-390x844.png"
)
OFFLINE_COMPOSITE = Path(
    "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/"
    "gate-c-motion-handoff/prototype_runtime_neutral_composite_390x844.png"
)
HANDOFF_MANIFEST = Path(
    "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/"
    "gate-c-motion-handoff/prototype_layer_manifest.json"
)
DEFAULT_EVIDENCE = Path(
    "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/"
    "gate-c-cocos-evidence/gate-c-v7-20260821-41b0b7b1-showall-navy-r5"
)
SAMPLES = [
    "normal-390x844-t0000.png",
    "normal-390x844-t9800.png",
    "reduced-390x844.png",
]
THRESHOLDS = {
    "max_abs_rgb": 1,
    "mean_abs_rgb": 0.001,
    "basis": (
        "Offline handoff composite must be exact. Browser WebGL screenshot readback may "
        "differ by one 8-bit channel value after texture upload and canvas readback."
    ),
}
SAFETY_BAR_RGB = (6, 38, 95)


def compare(
    sample_path: Path,
    reference_path: Path,
    reference: Image.Image,
    star_boxes: list[tuple[str, tuple[int, int, int, int]]],
) -> dict[str, object]:
    sample = Image.open(sample_path).convert("RGB")
    if sample.size != reference.size:
        raise ValueError(f"{sample_path.name} size {sample.size} != {reference.size}")
    diff = np.abs(np.asarray(sample, dtype=np.int16) - np.asarray(reference, dtype=np.int16))
    amplified = np.clip(diff * 32, 0, 255).astype(np.uint8)
    reference_label = "v7" if reference_path == APPROVED_V7 else "offline-composite"
    diff_path = sample_path.with_name(
        sample_path.stem + f"-vs-{reference_label}-diff32.png"
    )
    Image.fromarray(amplified, "RGB").save(diff_path, optimize=True)
    max_abs = int(diff.max())
    mean_abs = float(diff.mean())
    roi_results = []
    for star_id, box in star_boxes:
        roi_diff = diff[box[1]:box[3], box[0]:box[2]]
        roi_results.append({
            "id": star_id,
            "box": box,
            "max_abs_rgb": int(roi_diff.max()),
            "mean_abs_rgb": round(float(roi_diff.mean()), 9),
            "changed_pixels": int(np.any(roi_diff > 0, axis=2).sum()),
        })
    return {
        "sample": str(sample_path),
        "reference": str(reference_path),
        "diff_image": str(diff_path),
        "max_abs_rgb": max_abs,
        "mean_abs_rgb": round(mean_abs, 9),
        "changed_pixels": int(np.any(diff > 0, axis=2).sum()),
        "star_rois": roi_results,
        "pass": max_abs <= THRESHOLDS["max_abs_rgb"] and mean_abs <= THRESHOLDS["mean_abs_rgb"],
    }


def compare_responsive_fit(evidence: Path, approved_v7: Image.Image) -> dict[str, object]:
    narrow = Image.open(evidence / "responsive-360x800-neutral.png").convert("RGB")
    wide_tall = Image.open(evidence / "responsive-430x932-neutral.png").convert("RGB")
    wide_short = Image.open(evidence / "responsive-430x844-neutral.png").convert("RGB")
    probes = {
        "360x800_top": narrow.getpixel((180, 2)),
        "360x800_bottom": narrow.getpixel((180, 797)),
        "430x932_top": wide_tall.getpixel((215, 2)),
        "430x932_bottom": wide_tall.getpixel((215, 929)),
        "430x844_left": wide_short.getpixel((2, 422)),
        "430x844_right": wide_short.getpixel((427, 422)),
    }
    wide_tall_content = wide_tall.crop((0, 0, 430, 932))
    content = wide_short.crop((20, 0, 410, 844))
    content_diff = np.abs(
        np.asarray(content, dtype=np.int16) - np.asarray(approved_v7, dtype=np.int16)
    )
    tall_top = np.asarray(wide_tall_content.crop((0, 0, 430, 1)), dtype=np.int16)
    tall_bottom = np.asarray(wide_tall_content.crop((0, 931, 430, 932)), dtype=np.int16)
    safety = np.asarray(SAFETY_BAR_RGB, dtype=np.int16)
    tall_edge_max_abs = int(max(
        np.abs(tall_top - safety).max(),
        np.abs(tall_bottom - safety).max(),
    ))
    probes_match = all(tuple(value) == SAFETY_BAR_RGB for value in probes.values())
    content_max_abs = int(content_diff.max())
    return {
        "safety_bar_rgb": SAFETY_BAR_RGB,
        "probes": probes,
        "430x932_edge_max_abs_rgb": tall_edge_max_abs,
        "430x844_content_crop": [20, 0, 410, 844],
        "430x844_content_max_abs_rgb": content_max_abs,
        "pass": probes_match and tall_edge_max_abs == 0 and content_max_abs == 0,
    }


def main() -> None:
    env_build_id = os.environ.get("GATE_C_BUILD_ID")
    evidence = (
        Path(sys.argv[1])
        if len(sys.argv) > 1
        else Path(
            "/Users/wxl/Documents/Codex/2026-08-21/g-i/outputs/gate-c-cocos-evidence",
            env_build_id,
        )
        if env_build_id
        else DEFAULT_EVIDENCE
    )
    manifest = json.loads(HANDOFF_MANIFEST.read_text(encoding="utf-8"))
    star_boxes = []
    for layer in manifest["layers_back_to_front"]:
        if not layer["id"].startswith("star_"):
            continue
        left, top = layer["top_left_px"]
        width, height = layer["size_px"]
        star_boxes.append((layer["id"], (left, top, left + width, top + height)))
    references = [APPROVED_V7, OFFLINE_COMPOSITE]
    results = [
        compare(evidence / sample, reference_path, Image.open(reference_path).convert("RGB"), star_boxes)
        for sample in SAMPLES
        for reference_path in references
    ]
    responsive_fit = compare_responsive_fit(evidence, Image.open(APPROVED_V7).convert("RGB"))
    report = {
        "status": "PASS" if all(result["pass"] for result in results) and responsive_fit["pass"] else "FAIL",
        "approved_v7": str(APPROVED_V7),
        "offline_composite": str(OFFLINE_COMPOSITE),
        "thresholds": THRESHOLDS,
        "responsive_fit": responsive_fit,
        "samples": results,
    }
    report_path = evidence / "runtime-fidelity-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if report["status"] != "PASS":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
