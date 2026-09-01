export const OUTDOOR_GATE_C_DURATION_MS = 9_800;
export const OUTDOOR_GATE_C_HERO_STAR_COUNT = 10;

export type OutdoorGateCMotionMode = "normal" | "reduced";

export type OutdoorGateCWindChannel =
  | "far-grass"
  | "near-grass"
  | "human-hair"
  | "human-hem"
  | "cat-ears"
  | "cat-tail";

export interface OutdoorGateCWindCue {
  readonly channel: OutdoorGateCWindChannel;
  readonly startMs: number;
  readonly peakMs: number;
  readonly endMs: number;
  readonly amplitude: number;
}

export interface OutdoorGateCVisualSample {
  readonly elapsedMs: number;
  readonly sceneOpacity: number;
  readonly wind: Readonly<Record<OutdoorGateCWindChannel, number>>;
  readonly humanBreath: number;
  readonly catBreath: number;
  readonly cloudOffsetX: readonly [number, number];
  readonly cloudOpacity: readonly [number, number];
  readonly windOverlayOpacity: Readonly<Record<OutdoorGateCWindChannel, number>>;
  readonly bodyOverlayOpacity: readonly [number, number];
  readonly heroStarBrightness: readonly number[];
  readonly flowerBrightness: readonly [number, number];
}

export const OUTDOOR_GATE_C_OPENING_GUST_DELAY_MS = 900;
export const OUTDOOR_GATE_C_OPENING_GUST_START_MS =
  OUTDOOR_GATE_C_OPENING_GUST_DELAY_MS;

export const OUTDOOR_GATE_C_WIND_CUES: readonly OutdoorGateCWindCue[] = [
  { channel: "far-grass", startMs: 0, peakMs: 800, endMs: 2_500, amplitude: 1 },
  { channel: "near-grass", startMs: 300, peakMs: 1_250, endMs: 2_800, amplitude: 1 },
  { channel: "human-hair", startMs: 1_150, peakMs: 1_850, endMs: 3_000, amplitude: 1 },
  { channel: "human-hem", startMs: 1_350, peakMs: 2_150, endMs: 3_250, amplitude: 1 },
  { channel: "cat-ears", startMs: 2_350, peakMs: 2_900, endMs: 3_500, amplitude: 1 },
  { channel: "cat-tail", startMs: 2_550, peakMs: 3_250, endMs: 4_050, amplitude: 1 },
] as const;

export const OUTDOOR_GATE_C_WIND_CHAIN_START_MS = Math.min(
  ...OUTDOOR_GATE_C_WIND_CUES.map((cue) => cue.startMs),
);
export const OUTDOOR_GATE_C_WIND_CHAIN_END_MS = Math.max(
  ...OUTDOOR_GATE_C_WIND_CUES.map((cue) => cue.endMs),
);
export const OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS =
  OUTDOOR_GATE_C_WIND_CHAIN_END_MS - OUTDOOR_GATE_C_WIND_CHAIN_START_MS;
export const OUTDOOR_GATE_C_OPENING_GUST_END_MS =
  OUTDOOR_GATE_C_OPENING_GUST_START_MS + OUTDOOR_GATE_C_WIND_CHAIN_END_MS;

export const OUTDOOR_GATE_C_FIRST_TOUCH_VISIBLE_BY_MS = 160;
export const OUTDOOR_GATE_C_FIRST_TOUCH_MIN_STRENGTH = 0.18;
export const OUTDOOR_GATE_C_FIRST_TOUCH_QUEUE_MAX_DELAY_MS = 250;

/** Cocos UI positive Z is counter-clockwise, so the approved clockwise gust is negative. */
export const OUTDOOR_GATE_C_ROTATION_SIGN = -1;
/** V2-B has no transparent wind duplicates; this legacy diagnostic contract stays identically zero. */
export const OUTDOOR_GATE_C_WIND_OVERLAY_MAX_BY_CHANNEL = {
  "far-grass": 0,
  "near-grass": 0,
  "human-hair": 0,
  "human-hem": 0,
  "cat-ears": 0,
  "cat-tail": 0,
} as const satisfies Readonly<Record<OutdoorGateCWindChannel, number>>;
export const OUTDOOR_GATE_C_MAX_ROTATION_DEGREES = {
  "far-grass": 2.6,
  "near-grass": 4.2,
  "human-hair": 4.6,
  "human-hem": 5.2,
  "cat-ears": 5.4,
  "cat-tail": 7.6,
} as const satisfies Readonly<Record<OutdoorGateCWindChannel, number>>;
export const OUTDOOR_GATE_C_WIND_TRANSLATION_X_PX_BY_CHANNEL = {
  "far-grass": 0,
  "near-grass": 0,
  "human-hair": 0,
  "human-hem": 0,
  "cat-ears": 0,
  "cat-tail": 0,
} as const satisfies Readonly<Record<OutdoorGateCWindChannel, number>>;

export const OUTDOOR_GATE_C_BREATH_SCALE_Y = {
  human: 0.008,
  cat: 0.009,
} as const;

export const OUTDOOR_GATE_C_MANIFEST_CONTRACT = {
  schemaVersion: 1,
  approvedMasterSha256: "7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d",
  approvedHandoffHashesSha256: "a21c6123f1f5404a9471f9bc637c960be389aada91e0ba56ff34943935df53ee",
  approvedManifestSha256: "78501bc24de124018b9567fdf08e34f22667b4127df2c8969c16fc9d0af552cd",
  designSize: { width: 390, height: 844 },
  requiredLayerIds: [
    "sky-base",
    "milky-way-baked",
    "far-grass",
    "near-grass",
    "human-body",
    "human-hair",
    "human-hem",
    "cat-body",
    "cat-ears",
    "cat-tail",
    "flower-left",
    "flower-right",
    "cottage-door",
  ],
  heroStarCount: OUTDOOR_GATE_C_HERO_STAR_COUNT,
} as const;
