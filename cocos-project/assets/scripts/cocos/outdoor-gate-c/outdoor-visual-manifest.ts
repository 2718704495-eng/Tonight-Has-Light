import {
  OUTDOOR_GATE_C_HERO_STAR_COUNT,
  OUTDOOR_GATE_C_MANIFEST_CONTRACT,
} from "./outdoor-gate-c-contract.ts";

export interface OutdoorVisualLayer {
  readonly id: string;
  readonly file: string;
  readonly top_left_px: readonly [number, number];
  readonly size_px: readonly [number, number];
  readonly anchor_normalized_cocos: readonly [number, number];
  readonly blend: "normal" | "screen";
  readonly prototype_only: boolean;
  readonly render_order: number;
  readonly neutral_opacity: number;
  readonly motion_ready_clean_plate?: true;
  readonly removed_motion_layer_ids?: readonly string[];
}

export interface OutdoorVisualManifest {
  readonly status: "ALIGNED";
  readonly gate: "C";
  readonly canvas_px: readonly [number, number];
  readonly hero_star_count: number;
  readonly hero_star_motion_active_count: number;
  readonly hero_star_motion_active_ids: readonly string[];
  readonly hero_star_static_ids: readonly string[];
  readonly approved_baseline: "V7";
  readonly style_changed: false;
  readonly engineering_layering_only: true;
  readonly source_sha256: string;
  readonly motion_contract_id: "OUTDOOR-MOTION-PHONE-V2-B";
  readonly asset_package_id: "outdoor-motion-phone-v2-b-assets-r1";
  readonly motion_layer_contract: {
    readonly ids: readonly string[];
    readonly node_neutral_opacity: 1;
    readonly node_runtime_opacity: 1;
    readonly baked_static_copy_removed: true;
  };
  readonly render_order: readonly string[];
  readonly runtime_layer_count: number;
  readonly neutral_composite_contract: {
    readonly neutral_visibility_rule: string;
  };
  readonly layers_back_to_front: readonly OutdoorVisualLayer[];
}

/** Stable runtime vocabulary -> UI handoff vocabulary. Keep this adapter explicit. */
export const OUTDOOR_GATE_C_LAYER_ADAPTER = {
  "sky-base": "sky_base",
  "milky-way-baked": "galaxy_baked",
  "far-grass": "grass_far_accents",
  "near-grass": "grass_near_accents",
  "human-body": "person_body",
  "human-hair": "person_hair_tuft",
  "human-hem": "person_clothes_hem",
  "cat-body": "cat_body",
  "cat-ears": "cat_ears",
  "cat-tail": "cat_tail_tip",
  "flower-left": "flower_a",
  "flower-right": "flower_b",
  "cottage-door": "door_stable_light",
} as const satisfies Record<
  (typeof OUTDOOR_GATE_C_MANIFEST_CONTRACT.requiredLayerIds)[number],
  string
>;

export const OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER = [
  "scene_clean_plate",
  "sky_base",
  "galaxy_baked",
  "star_01",
  "star_02",
  "star_03",
  "star_04",
  "star_05",
  "star_06",
  "star_07",
  "star_08",
  "star_09",
  "star_10",
  "cloud_far",
  "cloud_near",
  "grass_far_accents",
  "house_and_fence",
  "door_stable_light",
  "grass_near_accents",
  "person_body",
  "person_hair_tuft",
  "person_clothes_hem",
  "cat_body",
  "cat_ears",
  "cat_tail_tip",
  "flower_a_glow",
  "flower_b_glow",
  "flower_a",
  "flower_b",
  "foreground_occlusion",
] as const;

export function validateOutdoorVisualManifest(value: unknown): readonly string[] {
  const errors: string[] = [];
  if (!value || typeof value !== "object") return ["manifest must be an object"];

  const manifest = value as Partial<OutdoorVisualManifest>;
  if (manifest.status !== "ALIGNED") errors.push("status must be ALIGNED");
  if (manifest.gate !== "C") errors.push("gate must be C");
  if (manifest.canvas_px?.[0] !== 390 || manifest.canvas_px?.[1] !== 844) {
    errors.push("canvas must be 390x844");
  }
  if (manifest.source_sha256 !== OUTDOOR_GATE_C_MANIFEST_CONTRACT.approvedMasterSha256) {
    errors.push("source sha256 does not match approved V7 master");
  }
  const trueWindLayerIds = [
    "grass_far_accents",
    "grass_near_accents",
    "person_hair_tuft",
    "person_clothes_hem",
    "cat_ears",
    "cat_tail_tip",
  ];
  if (manifest.motion_contract_id !== "OUTDOOR-MOTION-PHONE-V2-B") {
    errors.push("motion_contract_id must be OUTDOOR-MOTION-PHONE-V2-B");
  }
  if (manifest.asset_package_id !== "outdoor-motion-phone-v2-b-assets-r1") {
    errors.push("asset_package_id must use the frozen V2-B asset package");
  }
  if (JSON.stringify(manifest.motion_layer_contract?.ids) !== JSON.stringify(trueWindLayerIds)) {
    errors.push("motion_layer_contract.ids must match the approved V2-B moving layers");
  }
  if (
    manifest.motion_layer_contract?.node_neutral_opacity !== 1
    || manifest.motion_layer_contract?.node_runtime_opacity !== 1
  ) {
    errors.push("V2-B true motion layers must remain opaque at rest and at runtime");
  }
  if (manifest.motion_layer_contract?.baked_static_copy_removed !== true) {
    errors.push("V2-B clean plate must remove every baked static motion-layer copy");
  }
  if (manifest.approved_baseline !== "V7") errors.push("approved_baseline must be V7");
  if (manifest.style_changed !== false) errors.push("style_changed must be false");
  if (manifest.engineering_layering_only !== true) {
    errors.push("engineering_layering_only must be true");
  }
  if (manifest.hero_star_count !== OUTDOOR_GATE_C_HERO_STAR_COUNT) {
    errors.push(`hero_star_count must be ${OUTDOOR_GATE_C_HERO_STAR_COUNT}`);
  }
  const expectedActiveStars = ["star_01", "star_03", "star_08", "star_09"];
  if (
    manifest.hero_star_motion_active_count !== expectedActiveStars.length ||
    JSON.stringify(manifest.hero_star_motion_active_ids) !== JSON.stringify(expectedActiveStars)
  ) {
    errors.push("active hero stars must be star_01, star_03, star_08, star_09");
  }
  const expectedStaticStars = ["star_02", "star_04", "star_05", "star_06", "star_07", "star_10"];
  if (JSON.stringify(manifest.hero_star_static_ids) !== JSON.stringify(expectedStaticStars)) {
    errors.push("static hero star set does not match the director timeline");
  }

  const layers = Array.isArray(manifest.layers_back_to_front)
    ? manifest.layers_back_to_front
    : [];
  const ids = layers.map((layer) => layer?.id).filter((id): id is string => typeof id === "string");
  const uniqueIds = new Set(ids);
  if (manifest.runtime_layer_count !== OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER.length) {
    errors.push(`runtime_layer_count must be ${OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER.length}`);
  }
  if (ids.length !== uniqueIds.size) errors.push("layer ids must be unique");
  if (JSON.stringify(ids) !== JSON.stringify(OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER)) {
    errors.push("layers_back_to_front does not match the frozen render order");
  }
  if (JSON.stringify(manifest.render_order) !== JSON.stringify(OUTDOOR_GATE_C_EXPECTED_RENDER_ORDER)) {
    errors.push("render_order does not match the frozen authoritative order");
  }
  const cleanPlate = layers.find((layer) => layer.id === "scene_clean_plate");
  if (cleanPlate?.motion_ready_clean_plate !== true) {
    errors.push("scene_clean_plate must declare the frozen motion-ready plate");
  }
  if (JSON.stringify(cleanPlate?.removed_motion_layer_ids) !== JSON.stringify(trueWindLayerIds)) {
    errors.push("motion-ready clean plate must remove all six static motion-layer copies");
  }
  layers.forEach((layer, index) => {
    if (layer.render_order !== index) errors.push(`layer ${layer.id} has invalid render_order index`);
    const expectedOpacity = layer.id === "scene_clean_plate" || trueWindLayerIds.includes(layer.id)
      ? 1
      : 0;
    if (layer.neutral_opacity !== expectedOpacity) {
      errors.push(`layer ${layer.id} neutral_opacity must be ${expectedOpacity}`);
    }
  });

  for (const canonicalId of OUTDOOR_GATE_C_MANIFEST_CONTRACT.requiredLayerIds) {
    const uiId = OUTDOOR_GATE_C_LAYER_ADAPTER[canonicalId];
    if (!uniqueIds.has(uiId)) errors.push(`missing layer mapping ${canonicalId} -> ${uiId}`);
  }

  const starIds = ids.filter((id) => /^star_\d{2}$/.test(id));
  if (starIds.length !== OUTDOOR_GATE_C_HERO_STAR_COUNT) {
    errors.push(
      `expected ${OUTDOOR_GATE_C_HERO_STAR_COUNT} hero stars, received ${starIds.length}`,
    );
  }
  return errors;
}

export function resourcePathForLayer(layer: OutdoorVisualLayer): string {
  const withoutExtension = layer.file.replace(/\.png$/i, "");
  return `outdoor-gate-c/${withoutExtension}/spriteFrame`;
}
