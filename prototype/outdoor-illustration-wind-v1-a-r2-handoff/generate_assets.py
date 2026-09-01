#!/usr/bin/env python3
"""Derive the approved disposable R2 five-page wind assets.

The contact sheet is image-generation exploration, not production art. The
five immutable alpha masks in approved-masks preserve the visually coherent
large-outline pages that the user approved. They lock the upper sky, cottage,
door and seated composition while allowing the lower landscape, hair/clothing
edge, cat ears and tail to change as complete illustration states.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
HANDOFF = Path(__file__).resolve().parent
RUNTIME = ROOT / "cocos-project/assets/resources/outdoor-illustration-wind-r2"
SOURCE = ROOT / (
    "design-board/outdoor-illustration-wind-v1/exploration/"
    "five-wind-pages-storyboard-r2-stronger.png"
)
MASKS = HANDOFF / "approved-masks"

SOURCE_SHA256 = "a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811"
SOURCE_SIZE = (1774, 887)
OUTPUT_SIZE = (390, 844)
ASSET_BOUNDARY = "prototype-only/disposable/not-for-review/not-for-release"
ENGINEERING_REVISION = "R2-EDGEFIX-01"
SUPERSEDED_ENGINEERING_CANDIDATE = "outdoor-illustration-wind-r2-local-r3-web"
ALPHA_ENCODING = "straight"

PANEL_CONTENT_BOUNDS = (
    (0, 356),
    (357, 709),
    (710, 1061),
    (1062, 1413),
    (1414, 1774),
)
PANEL_CROP_WIDTH = 349
PANEL_CROP_TOP = 65
PANEL_CROP_BOTTOM = 821

APPROVED_MASK_SHA256 = (
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


def centred_crop_box(left: int, right: int) -> tuple[int, int, int, int]:
    width = right - left
    if width < PANEL_CROP_WIDTH:
        raise ValueError(f"panel content span is only {width}px")
    crop_left = left + (width - PANEL_CROP_WIDTH) // 2
    return crop_left, PANEL_CROP_TOP, crop_left + PANEL_CROP_WIDTH, PANEL_CROP_BOTTOM


def sprite_meta(name: str, has_alpha: bool) -> dict:
    base_uuid = str(uuid.uuid5(uuid.NAMESPACE_URL, f"tonight-has-light:r2:{name}"))
    texture_id = "6c48a"
    sprite_id = "f9941"
    return {
        "ver": "1.0.27",
        "importer": "image",
        "imported": True,
        "uuid": base_uuid,
        "files": [".json", ".png"],
        "subMetas": {
            texture_id: {
                "importer": "texture",
                "uuid": f"{base_uuid}@{texture_id}",
                "displayName": name,
                "id": texture_id,
                "name": "texture",
                "userData": {
                    "wrapModeS": "clamp-to-edge",
                    "wrapModeT": "clamp-to-edge",
                    "imageUuidOrDatabaseUri": base_uuid,
                    "isUuid": True,
                    "visible": False,
                    "minfilter": "linear",
                    "magfilter": "linear",
                    "mipfilter": "none",
                    "anisotropy": 0,
                },
                "ver": "1.0.22",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
            sprite_id: {
                "importer": "sprite-frame",
                "uuid": f"{base_uuid}@{sprite_id}",
                "displayName": name,
                "id": sprite_id,
                "name": "spriteFrame",
                "userData": {
                    "trimThreshold": 1,
                    "rotated": False,
                    "offsetX": 0,
                    "offsetY": 0,
                    "trimX": 0,
                    "trimY": 0,
                    "width": 390,
                    "height": 844,
                    "rawWidth": 390,
                    "rawHeight": 844,
                    "borderTop": 0,
                    "borderBottom": 0,
                    "borderLeft": 0,
                    "borderRight": 0,
                    "packable": False,
                    "pixelsToUnit": 100,
                    "pivotX": 0.5,
                    "pivotY": 0.5,
                    "meshType": 0,
                    "vertices": {
                        "rawPosition": [-195, -422, 0, 195, -422, 0,
                                        -195, 422, 0, 195, 422, 0],
                        "indexes": [0, 1, 2, 2, 1, 3],
                        "uv": [0, 844, 390, 844, 0, 0, 390, 0],
                        "nuv": [0, 0, 1, 0, 0, 1, 1, 1],
                        "minPos": [-195, -422, 0],
                        "maxPos": [195, 422, 0],
                    },
                    "isUuid": True,
                    "imageUuidOrDatabaseUri": f"{base_uuid}@{texture_id}",
                    "atlasUuid": "",
                    "trimType": "none",
                },
                "ver": "1.0.12",
                "imported": True,
                "files": [".json"],
                "subMetas": {},
            },
        },
        "userData": {
            "type": "sprite-frame",
            "fixAlphaTransparencyArtifacts": has_alpha,
            "hasAlpha": has_alpha,
            "redirect": f"{base_uuid}@{texture_id}",
        },
    }


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_approved_masks() -> list[Image.Image]:
    result = []
    for index, expected_hash in enumerate(APPROVED_MASK_SHA256):
        path = MASKS / f"approved-mask-f{index}-390x844.png"
        if sha256(path) != expected_hash:
            raise RuntimeError(f"approved R2 mask F{index} hash drift")
        mask = Image.open(path).convert("L")
        if mask.size != OUTPUT_SIZE:
            raise RuntimeError(f"approved R2 mask F{index} size drift: {mask.size}")
        result.append(mask)
    return result


def main() -> None:
    if not SOURCE.is_file() or sha256(SOURCE) != SOURCE_SHA256:
        raise RuntimeError("R2 approved storyboard source missing or drifted")
    source = Image.open(SOURCE).convert("RGB")
    if source.size != SOURCE_SIZE:
        raise RuntimeError(f"R2 source size drift: {source.size}")

    RUNTIME.mkdir(parents=True, exist_ok=True)
    (HANDOFF / "composites").mkdir(parents=True, exist_ok=True)
    (HANDOFF / "evidence").mkdir(parents=True, exist_ok=True)

    frames: list[Image.Image] = []
    crop_boxes: list[list[int]] = []
    for left, right in PANEL_CONTENT_BOUNDS:
        box = centred_crop_box(left, right)
        crop_boxes.append(list(box))
        frames.append(source.crop(box).resize(OUTPUT_SIZE, Image.Resampling.LANCZOS))

    stable_path = RUNTIME / "stable-scene-390x844.png"
    frames[0].save(stable_path, optimize=True)
    write_json(stable_path.with_suffix(".png.meta"), sprite_meta(stable_path.stem, False))

    masks = load_approved_masks()
    state_cues = (
        ["quiet-lower-scene"],
        ["far-grass-leading-edge"],
        ["large-near-and-far-grass-arc"],
        ["large-grass-arc", "adult-hair", "adult-clothing-edge"],
        ["large-grass-arc", "cat-ears", "cat-full-tail", "adult-hair"],
    )
    overlay_records = []
    for index, (frame, mask) in enumerate(zip(frames, masks)):
        evidence_mask = HANDOFF / f"evidence/dynamic-mask-f{index}-390x844.png"
        mask.save(evidence_mask, optimize=True)

        # Keep the original illustration RGB under transparent and semi-transparent
        # mask pixels. PIL paste() blends partial-mask edges against transparent
        # black, which later becomes a dark fringe with Cocos linear sampling.
        overlay = frame.convert("RGBA")
        overlay.putalpha(mask)
        overlay_path = RUNTIME / f"lower-f{index}-390x844.png"
        overlay.save(overlay_path, optimize=True)
        write_json(overlay_path.with_suffix(".png.meta"), sprite_meta(overlay_path.stem, True))

        composite = frames[0].convert("RGBA")
        composite.alpha_composite(overlay)
        composite.convert("RGB").save(
            HANDOFF / f"composites/composite-f{index}-390x844.png", optimize=True
        )

        overlay_records.append({
            "state": f"F{index}",
            "runtime_file": overlay_path.name,
            "runtime_sha256": sha256(overlay_path),
            "approved_mask_file": str(evidence_mask.relative_to(HANDOFF)),
            "approved_mask_sha256": APPROVED_MASK_SHA256[index],
            "crop_box_source_pixels": crop_boxes[index],
            "canvas": [390, 844],
            "anchor": [0.5, 0.5],
            "position": [0, 0],
            "blend": "normal/straight-alpha",
            "alpha_encoding": ALPHA_ENCODING,
            "visible_cues": state_cues[index],
        })

    runtime_manifest = {
        "schema": "tonight-has-light.outdoor-illustration-wind-r2.v2",
        "candidate": "OUTDOOR-ILLUSTRATION-WIND-V1-A-R2",
        "engineering_revision": ENGINEERING_REVISION,
        "supersedes_engineering_candidate": SUPERSEDED_ENGINEERING_CANDIDATE,
        "alpha_encoding": ALPHA_ENCODING,
        "status": "local-disposable-handoff-only",
        "asset_boundary": ASSET_BOUNDARY,
        "source": {
            "path": str(SOURCE.relative_to(ROOT)),
            "sha256": SOURCE_SHA256,
            "dimensions": list(SOURCE_SIZE),
            "property": "imagegen-exploration/not-production-art",
        },
        "mechanical_method": {
            "divider_columns_removed": [356, 709, 1061, 1413],
            "panel_content_bounds": [list(item) for item in PANEL_CONTENT_BOUNDS],
            "crop_width": PANEL_CROP_WIDTH,
            "crop_y": [PANEL_CROP_TOP, PANEL_CROP_BOTTOM],
            "resize": "Pillow LANCZOS to 390x844",
            "stable_scene": "F0 crop is the only full-screen opaque base",
            "lower_states": "five immutable approved masks over the five storyboard crops",
            "mask_provenance": "frozen from the user-approved seamless local R2 visual candidate",
            "alpha_edge_fix": (
                "preserve source RGB under the immutable alpha mask; "
                "enable Cocos fixAlphaTransparencyArtifacts on RGBA pages"
            ),
            "no_redesign": True,
        },
        "runtime_contract": {
            "render_order": ["stable-scene", "two-crossfading-lower-pages"],
            "resident_sprites": 2,
            "preload_all_states": True,
            "crossfade_ms": 140,
            "crossfade_easing": "smoothstep",
            "reduced_motion_state": "F0",
            "stable_requirements": [
                "galaxy", "mountain-line", "cottage", "door-light", "two-flowers"
            ],
            "anchor_policy": (
                "composition-locked prototype: adult/cat seated position and identity stay fixed; "
                "approved hair/clothing/ears/full-tail silhouettes may change"
            ),
            "pixel_identity_claim": False,
        },
        "stable_scene": {
            "runtime_file": stable_path.name,
            "runtime_sha256": sha256(stable_path),
            "canvas": [390, 844],
            "anchor": [0.5, 0.5],
            "position": [0, 0],
        },
        "states": overlay_records,
    }
    write_json(RUNTIME / "asset-manifest.json", runtime_manifest)
    write_json(HANDOFF / "asset-manifest.json", runtime_manifest)
    write_json(RUNTIME / "asset-boundary.json", {
        "asset_boundary": ASSET_BOUNDARY,
        "allowed": ["local disposable Cocos/Web candidate", "local evidence capture"],
        "forbidden": [
            "production art claim", "WeChat preview/upload", "experience version",
            "review submission", "release",
        ],
        "release_guard": "must reject every file in this directory",
    })
    print(
        f"generated {ENGINEERING_REVISION}: stable scene, five straight-alpha R2 lower "
        "pages, manifests and evidence masks"
    )


if __name__ == "__main__":
    main()
