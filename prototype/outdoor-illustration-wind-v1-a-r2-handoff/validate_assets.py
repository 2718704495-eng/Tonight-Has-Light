#!/usr/bin/env python3
"""Deterministic mechanical validator for the disposable R2 handoff."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


ROOT = Path(__file__).resolve().parents[2]
HANDOFF = Path(__file__).resolve().parent
RUNTIME = ROOT / "cocos-project/assets/outdoor-illustration-wind-r2"
SOURCE = ROOT / (
    "design-board/outdoor-illustration-wind-v1/exploration/"
    "five-wind-pages-storyboard-r2-stronger.png"
)
SIZE = (390, 844)
BOUNDARY = "prototype-only/disposable/not-for-review/not-for-release"
ENGINEERING_REVISION = "R2-EDGEFIX-01"
ALPHA_ENCODING = "straight"
EXPECTED_SOURCE_SHA = "a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811"
EXPECTED_STABLE_SHA = "2ddda67fc31d21d35ef4012e34e737d487a3b86d2ef5496140781e42430f2e65"
EXPECTED_LOWER_SHA = (
    "2867d9d382f00150bbc06452e0728dbabe8bf2903ade8b73366847c451fb217d",
    "e7d64d1e8fa816cc9023688f9233890c2487fe9ff59c9ab424c25c88a15cb49f",
    "998856bf03e4aac767adb3a3ed8b2a198307186ffacf39c49bcf92ed4be0a589",
    "4eee879767b5763aa0b92fbad7783628296c7c8fac9fa47fda5f2a7b23fcc0ef",
    "47981253efb0420d29ca433462c35325e125130c48e4dbc68fc836e5e216c7ac",
)
EXPECTED_MASK_SHA = (
    "668a50a7e68bac0e066a86fab11b27d8e2fc81d51a921a966dea94249d89440a",
    "668a50a7e68bac0e066a86fab11b27d8e2fc81d51a921a966dea94249d89440a",
    "668a50a7e68bac0e066a86fab11b27d8e2fc81d51a921a966dea94249d89440a",
    "377414a1f76940c9c37b104389d1e8903f0c2c255809a0932c0a5fd958311e0b",
    "0c8d2b17329ccd1f30635a1056579c2f25877e8715c6410c7874950de80561f7",
)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def mean_abs_difference(a: Image.Image, b: Image.Image) -> float:
    diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
    return sum(ImageStat.Stat(diff).mean) / 3.0


def white_separator_columns(image: Image.Image) -> list[int]:
    rgb = image.convert("RGB")
    width, height = rgb.size
    columns = []
    for x in range(width):
        bright = sum(1 for y in range(height) if min(rgb.getpixel((x, y))) >= 240)
        if bright / height >= 0.95:
            columns.append(x)
    return columns


def main() -> None:
    checks: list[dict] = []

    def check(name: str, condition: bool, detail: object) -> None:
        if not condition:
            raise AssertionError(f"{name}: {detail}")
        checks.append({"name": name, "status": "PASS", "detail": detail})

    check("source-sha256", sha256(SOURCE) == EXPECTED_SOURCE_SHA, EXPECTED_SOURCE_SHA)
    manifest_path = RUNTIME / "asset-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    check("manifest-candidate", manifest["candidate"] == "OUTDOOR-ILLUSTRATION-WIND-V1-A-R2",
          manifest["candidate"])
    check("manifest-engineering-revision",
          manifest["engineering_revision"] == ENGINEERING_REVISION,
          manifest["engineering_revision"])
    check("manifest-alpha-encoding", manifest["alpha_encoding"] == ALPHA_ENCODING,
          manifest["alpha_encoding"])
    check("manifest-boundary", manifest["asset_boundary"] == BOUNDARY,
          manifest["asset_boundary"])
    check("manifest-state-count", len(manifest["states"]) == 5, len(manifest["states"]))
    contract = manifest["runtime_contract"]
    check("crossfade-contract", contract["crossfade_ms"] == 140, contract["crossfade_ms"])
    check("smoothstep-contract", contract["crossfade_easing"] == "smoothstep",
          contract["crossfade_easing"])
    check("reduced-motion-contract", contract["reduced_motion_state"] == "F0",
          contract["reduced_motion_state"])
    check("honest-anchor-contract", contract["pixel_identity_claim"] is False,
          contract["anchor_policy"])

    stable_path = RUNTIME / "stable-scene-390x844.png"
    stable = Image.open(stable_path).convert("RGB")
    check("stable-dimensions", stable.size == SIZE, list(stable.size))
    check("stable-source-hash", sha256(stable_path) == EXPECTED_STABLE_SHA,
          sha256(stable_path))
    check("stable-no-divider", not white_separator_columns(stable),
          white_separator_columns(stable))

    source = Image.open(SOURCE).convert("RGB")
    composites: list[Image.Image] = []
    alpha_integrity: dict[str, dict[str, int | float | str]] = {}
    for index in range(5):
        canonical_mask_path = HANDOFF / f"approved-masks/approved-mask-f{index}-390x844.png"
        evidence_mask_path = HANDOFF / f"evidence/dynamic-mask-f{index}-390x844.png"
        overlay_path = RUNTIME / f"lower-f{index}-390x844.png"
        preview_path = HANDOFF / f"composites/composite-f{index}-390x844.png"

        check(f"f{index}-canonical-mask-hash",
              sha256(canonical_mask_path) == EXPECTED_MASK_SHA[index],
              sha256(canonical_mask_path))
        canonical_mask = Image.open(canonical_mask_path).convert("L")
        evidence_mask = Image.open(evidence_mask_path).convert("L")
        check(f"f{index}-mask-dimensions", canonical_mask.size == SIZE,
              list(canonical_mask.size))
        check(f"f{index}-evidence-mask-exact",
              ImageChops.difference(canonical_mask, evidence_mask).getbbox() is None,
              evidence_mask_path.name)

        # The entire upper sky remains one stable image. F3/F4 may begin at the
        # adult hair around y=576, but never alter the sky/galaxy above y=560.
        check(f"f{index}-upper-mask-clear",
              canonical_mask.crop((0, 0, 390, 560)).getextrema() == (0, 0),
              canonical_mask.crop((0, 0, 390, 560)).getextrema())
        check(f"f{index}-cottage-core-clear",
              canonical_mask.crop((300, 560, 390, 650)).getextrema() == (0, 0),
              canonical_mask.crop((300, 560, 390, 650)).getextrema())
        check(f"f{index}-door-clear",
              canonical_mask.crop((320, 650, 375, 720)).getextrema() == (0, 0),
              canonical_mask.crop((320, 650, 375, 720)).getextrema())

        overlay_raw = Image.open(overlay_path)
        check(f"f{index}-overlay-dimensions", overlay_raw.size == SIZE,
              list(overlay_raw.size))
        check(f"f{index}-overlay-mode", overlay_raw.mode == "RGBA", overlay_raw.mode)
        check(f"f{index}-overlay-hash", sha256(overlay_path) == EXPECTED_LOWER_SHA[index],
              sha256(overlay_path))
        check(f"f{index}-overlay-alpha-exact",
              ImageChops.difference(overlay_raw.getchannel("A"), canonical_mask).getbbox() is None,
              "approved mask")

        state_record = manifest["states"][index]
        source_frame = source.crop(tuple(state_record["crop_box_source_pixels"])).resize(
            SIZE, Image.Resampling.LANCZOS
        )
        rgb_difference = ImageChops.difference(overlay_raw.convert("RGB"), source_frame)
        straight_rgb_mismatch_pixels = sum(
            1 for pixel in rgb_difference.get_flattened_data() if pixel != (0, 0, 0)
        )
        semi_transparent_pixels = sum(
            1
            for alpha in overlay_raw.getchannel("A").get_flattened_data()
            if 0 < alpha < 255
        )
        check(f"f{index}-straight-alpha-source-rgb-exact",
              straight_rgb_mismatch_pixels == 0,
              {"mismatch_pixels": straight_rgb_mismatch_pixels})
        check(f"f{index}-semi-transparent-edge-present",
              semi_transparent_pixels > 0,
              {"semi_transparent_pixels": semi_transparent_pixels})

        meta_path = overlay_path.with_suffix(".png.meta")
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        check(f"f{index}-cocos-alpha-artifact-fix",
              meta["userData"]["fixAlphaTransparencyArtifacts"] is True,
              meta["userData"]["fixAlphaTransparencyArtifacts"])
        check(f"f{index}-cocos-has-alpha",
              meta["userData"]["hasAlpha"] is True,
              meta["userData"]["hasAlpha"])
        check(f"f{index}-manifest-alpha-encoding",
              state_record["alpha_encoding"] == ALPHA_ENCODING,
              state_record["alpha_encoding"])
        alpha_integrity[f"F{index}"] = {
            "alpha_encoding": ALPHA_ENCODING,
            "semi_transparent_pixels": semi_transparent_pixels,
            "straight_rgb_mismatch_pixels": straight_rgb_mismatch_pixels,
            "mean_absolute_rgb_error": mean_abs_difference(
                overlay_raw.convert("RGB"), source_frame
            ),
        }

        composite = stable.convert("RGBA")
        composite.alpha_composite(overlay_raw.convert("RGBA"))
        composite = composite.convert("RGB")
        composites.append(composite)
        check(f"f{index}-preview-exact",
              ImageChops.difference(composite, Image.open(preview_path).convert("RGB")).getbbox()
              is None,
              preview_path.name)
        check(f"f{index}-upper-pixels-stable",
              ImageChops.difference(composite.crop((0, 0, 390, 560)),
                                    stable.crop((0, 0, 390, 560))).getbbox() is None,
              "pixel-identical")
        check(f"f{index}-cottage-pixels-stable",
              ImageChops.difference(composite.crop((300, 560, 390, 650)),
                                    stable.crop((300, 560, 390, 650))).getbbox() is None,
              "pixel-identical")
        check(f"f{index}-door-pixels-stable",
              ImageChops.difference(composite.crop((320, 650, 375, 720)),
                                    stable.crop((320, 650, 375, 720))).getbbox() is None,
              "pixel-identical")
        check(f"f{index}-no-divider", not white_separator_columns(composite),
              white_separator_columns(composite))

        check(f"f{index}-manifest-runtime-hash",
              state_record["runtime_sha256"] == EXPECTED_LOWER_SHA[index],
              state_record["runtime_sha256"])
        check(f"f{index}-manifest-mask-hash",
              state_record["approved_mask_sha256"] == EXPECTED_MASK_SHA[index],
              state_record["approved_mask_sha256"])

    full_diffs = {
        f"f0-f{index}": mean_abs_difference(composites[0], composites[index])
        for index in range(1, 5)
    }
    thumbs = [image.resize((98, 211), Image.Resampling.LANCZOS) for image in composites]
    thumb_diffs = {
        "f0-f2": mean_abs_difference(thumbs[0], thumbs[2]),
        "f0-f4": mean_abs_difference(thumbs[0], thumbs[4]),
        "f2-f4": mean_abs_difference(thumbs[2], thumbs[4]),
    }
    check("all-pages-full-size-distinct", min(full_diffs.values()) >= 1.25, full_diffs)
    check("large-outline-pages-thumbnail-distinct", min(thumb_diffs.values()) >= 1.25,
          thumb_diffs)

    # Do not silently regress to the rejected narrow-polygon experiment: all
    # five pages must use the coherent lower-scene masks frozen above.
    mask_bboxes = [
        Image.open(HANDOFF / f"approved-masks/approved-mask-f{i}-390x844.png")
        .convert("L").getbbox()
        for i in range(5)
    ]
    check("coherent-lower-mask-span",
          all(box is not None and box[0] == 0 and box[2] == 390 and box[3] == 844
              for box in mask_bboxes),
          mask_bboxes)

    report = {
        "candidate": "OUTDOOR-ILLUSTRATION-WIND-V1-A-R2",
        "engineering_revision": ENGINEERING_REVISION,
        "alpha_encoding": ALPHA_ENCODING,
        "status": "PASS_MECHANICAL_HANDOFF_ONLY",
        "asset_boundary": BOUNDARY,
        "checks": checks,
        "metrics": {
            "full_canvas_mean_abs_difference": full_diffs,
            "quarter_scale_mean_abs_difference": thumb_diffs,
            "approved_mask_bbox": mask_bboxes,
            "alpha_integrity": alpha_integrity,
        },
        "limitations": [
            "User approval covers the visual direction, not production-art rights.",
            "Composition anchors are visually locked; exact character pixel identity is not claimed.",
            "Mechanical checks do not prove human phone-scale readability.",
            "No WeChat preview/upload, experience setting, review submission or release was run.",
        ],
    }
    report_path = HANDOFF / "validation-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n",
                           encoding="utf-8")

    hash_targets = [
        path for path in sorted(HANDOFF.rglob("*"))
        if path.is_file() and path.name != "HASHES.sha256"
    ]
    runtime_owned = [
        RUNTIME / "asset-boundary.json",
        RUNTIME / "asset-manifest.json",
        stable_path,
        stable_path.with_suffix(".png.meta"),
    ]
    for index in range(5):
        overlay_path = RUNTIME / f"lower-f{index}-390x844.png"
        runtime_owned.extend([overlay_path, overlay_path.with_suffix(".png.meta")])
    hash_targets.extend(path for path in runtime_owned if path.is_file())
    lines = [f"{sha256(path)}  {path.relative_to(ROOT)}" for path in hash_targets]
    (HANDOFF / "HASHES.sha256").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(json.dumps({
        "status": report["status"],
        "checks": len(checks),
        "full_diffs": full_diffs,
        "thumb_diffs": thumb_diffs,
        "hash_entries": len(lines),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
