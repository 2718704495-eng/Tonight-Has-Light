import {
  OUTDOOR_GATE_C_HERO_STAR_COUNT,
  OUTDOOR_GATE_C_DURATION_MS,
  OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS,
  OUTDOOR_GATE_C_OPENING_GUST_DELAY_MS,
  OUTDOOR_GATE_C_OPENING_GUST_END_MS,
  OUTDOOR_GATE_C_WIND_CHAIN_END_MS,
  OUTDOOR_GATE_C_WIND_CHAIN_START_MS,
  OUTDOOR_GATE_C_WIND_CUES,
  type OutdoorGateCVisualSample,
  type OutdoorGateCWindChannel,
} from "./outdoor-gate-c-contract.ts";

const WIND_CHANNELS: readonly OutdoorGateCWindChannel[] = [
  "far-grass",
  "near-grass",
  "human-hair",
  "human-hem",
  "cat-ears",
  "cat-tail",
];

const STATIC_OVERLAY_OPACITY = 0;
/** Quiet-gap calculations begin when the last channel of a wind chain settles. */
export const OUTDOOR_GATE_C_RECURRING_GUSTS_AFTER_MS =
  OUTDOOR_GATE_C_OPENING_GUST_END_MS;
export const OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS = 4_500;
export const OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS = 6_500;
export const OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MIN_MS = 6_000;
export const OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MAX_MS = 9_000;
export const OUTDOOR_GATE_C_RUNTIME_SCHEDULE_SEED = 0x4e494748;

const PERSISTENT_AMBIENT_SCHEDULE = {
  humanBreath: { delayMs: 900, periodMs: 12_700 },
  catBreath: { delayMs: 2_100, periodMs: 11_900 },
  clouds: { delayMs: 300, periodMs: 17_300 },
  heroStars: { delayMs: 1_600, periodMs: 14_900 },
  flowerLeft: { delayMs: 2_800, periodMs: 11_300 },
  flowerRight: { delayMs: 4_200, periodMs: 13_700 },
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

function normalizeElapsedMs(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs)) return 0;
  return Math.max(0, Math.min(OUTDOOR_GATE_C_DURATION_MS, elapsedMs));
}

export function outdoorGateCRuntimeSampleMs(elapsedMs: number): number {
  return new OutdoorGateCPersistentScheduler().runtimeWindSampleMs(elapsedMs);
}

function deterministicUnit(seed: number, index: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
}

export function outdoorGateCRecurringGustIntervalMs(
  index: number,
  seed = OUTDOOR_GATE_C_RUNTIME_SCHEDULE_SEED,
): number {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
  const minimum = safeIndex === 0
    ? OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MIN_MS
    : OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MIN_MS;
  const maximum = safeIndex === 0
    ? OUTDOOR_GATE_C_FIRST_RECURRING_GUST_GAP_MAX_MS
    : OUTDOOR_GATE_C_RECURRING_GUST_INTERVAL_MAX_MS;
  const span = maximum - minimum;
  return minimum
    + Math.round(deterministicUnit(seed >>> 0, safeIndex) * span);
}

export interface OutdoorGateCGustOccurrence {
  readonly source: "opening" | "recurring";
  readonly startMs: number;
  readonly sampleMs: number;
}

/**
 * Persistent, deterministic runtime schedule. The first automatic chain begins
 * after the approved 900ms settle. Later chains start after 4.5–6.5s of quiet,
 * then after deterministic non-fixed 6–9s quiet gaps. Cached starts keep an hours-long stay
 * O(log n) per frame rather than walking the whole history every update.
 */
export class OutdoorGateCPersistentScheduler {
  private readonly recurringGustStartsMs: number[] = [];
  private readonly seed: number;
  private openingWindSuppressed = false;
  private nextGustIndex = 0;
  private nextGustStartMs: number;

  public constructor(seed = OUTDOOR_GATE_C_RUNTIME_SCHEDULE_SEED) {
    this.seed = seed;
    this.nextGustStartMs = OUTDOOR_GATE_C_RECURRING_GUSTS_AFTER_MS
      + outdoorGateCRecurringGustIntervalMs(0, seed)
      - OUTDOOR_GATE_C_WIND_CHAIN_START_MS;
  }

  public reset(): void {
    this.recurringGustStartsMs.length = 0;
    this.nextGustIndex = 0;
    this.openingWindSuppressed = false;
    this.nextGustStartMs = OUTDOOR_GATE_C_RECURRING_GUSTS_AFTER_MS
      + outdoorGateCRecurringGustIntervalMs(0, this.seed)
      - OUTDOOR_GATE_C_WIND_CHAIN_START_MS;
  }

  public deferAfterManualGust(gustEndMs: number): void {
    const safeEndMs = sanitizeRuntimeElapsedMs(gustEndMs);
    this.recurringGustStartsMs.length = 0;
    this.nextGustIndex = 0;
    this.openingWindSuppressed = true;
    this.nextGustStartMs = safeEndMs
      + outdoorGateCRecurringGustIntervalMs(0, this.seed)
      - OUTDOOR_GATE_C_WIND_CHAIN_START_MS;
  }

  public recurringGustStartsThrough(elapsedMs: number): readonly number[] {
    const safeElapsedMs = sanitizeRuntimeElapsedMs(elapsedMs);
    this.ensureScheduleThrough(safeElapsedMs);
    return this.recurringGustStartsMs.filter((startMs) => startMs <= safeElapsedMs);
  }

  public gustOccurrenceAt(elapsedMs: number): OutdoorGateCGustOccurrence | null {
    const safeElapsedMs = sanitizeRuntimeElapsedMs(elapsedMs);
    if (!this.openingWindSuppressed) {
      const sampleMs = safeElapsedMs - OUTDOOR_GATE_C_OPENING_GUST_DELAY_MS;
      if (sampleMs >= OUTDOOR_GATE_C_WIND_CHAIN_START_MS
        && sampleMs <= OUTDOOR_GATE_C_WIND_CHAIN_END_MS) {
        return { source: "opening", startMs: OUTDOOR_GATE_C_OPENING_GUST_DELAY_MS, sampleMs };
      }
    }

    this.ensureScheduleThrough(safeElapsedMs);
    const index = this.lastStartAtOrBefore(safeElapsedMs);
    if (index < 0) return null;
    const startMs = this.recurringGustStartsMs[index] ?? 0;
    const sampleMs = safeElapsedMs - startMs;
    if (sampleMs > OUTDOOR_GATE_C_WIND_CHAIN_END_MS) return null;
    return { source: "recurring", startMs, sampleMs };
  }

  public runtimeWindSampleMs(elapsedMs: number): number {
    return this.gustOccurrenceAt(elapsedMs)?.sampleMs ?? OUTDOOR_GATE_C_DURATION_MS;
  }

  private ensureScheduleThrough(elapsedMs: number): void {
    while (this.nextGustStartMs <= elapsedMs) {
      this.recurringGustStartsMs.push(this.nextGustStartMs);
      this.nextGustIndex += 1;
      this.nextGustStartMs += OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS
        + outdoorGateCRecurringGustIntervalMs(
          this.nextGustIndex,
          this.seed,
        );
    }
  }

  private lastStartAtOrBefore(elapsedMs: number): number {
    let low = 0;
    let high = this.recurringGustStartsMs.length - 1;
    let match = -1;
    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2);
      const startMs = this.recurringGustStartsMs[middle] ?? Number.POSITIVE_INFINITY;
      if (startMs <= elapsedMs) {
        match = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return match;
  }
}

function sanitizeRuntimeElapsedMs(elapsedMs: number): number {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  return elapsedMs;
}

function persistentAmbientSampleMs(
  elapsedMs: number,
  schedule: { readonly delayMs: number; readonly periodMs: number },
): number {
  const postOpeningMs = Math.max(0, elapsedMs - OUTDOOR_GATE_C_DURATION_MS);
  if (postOpeningMs <= schedule.delayMs) return OUTDOOR_GATE_C_DURATION_MS;
  return Math.min(
    (postOpeningMs - schedule.delayMs) % schedule.periodMs,
    OUTDOOR_GATE_C_DURATION_MS,
  );
}

function oneShotEnvelope(elapsedMs: number, startMs: number, peakMs: number, endMs: number): number {
  if (elapsedMs <= startMs || elapsedMs >= endMs) return 0;
  if (elapsedMs <= peakMs) return smoothstep((elapsedMs - startMs) / (peakMs - startMs));
  return 1 - smoothstep((elapsedMs - peakMs) / (endMs - peakMs));
}

function windEnvelope(elapsedMs: number, startMs: number, peakMs: number, endMs: number): number {
  if (elapsedMs <= startMs || elapsedMs >= endMs) return 0;
  if (elapsedMs <= peakMs) return clamp01((elapsedMs - startMs) / (peakMs - startMs));
  return 1 - smoothstep((elapsedMs - peakMs) / (endMs - peakMs));
}

function breatheBetween(
  elapsedMs: number,
  startMs: number,
  peakMs: number,
  endMs: number,
): number {
  return oneShotEnvelope(elapsedMs, startMs, peakMs, endMs);
}

function windowedOpacity(
  elapsedMs: number,
  startMs: number,
  peakMs: number,
  endMs: number,
  startOpacity: number,
  peakOpacity: number,
  endOpacity: number,
): number {
  if (elapsedMs <= startMs) return startOpacity;
  if (elapsedMs >= endMs) return endOpacity;
  if (elapsedMs <= peakMs) {
    const progress = (elapsedMs - startMs) / (peakMs - startMs);
    return startOpacity + (peakOpacity - startOpacity) * progress;
  }
  const progress = smoothstep((elapsedMs - peakMs) / (endMs - peakMs));
  return peakOpacity + (endOpacity - peakOpacity) * progress;
}

function sampleWind(elapsedMs: number): Record<OutdoorGateCWindChannel, number> {
  return Object.fromEntries(WIND_CHANNELS.map((channel) => {
    const cue = OUTDOOR_GATE_C_WIND_CUES.find((candidate) => candidate.channel === channel);
    const value = cue
      ? windEnvelope(elapsedMs, cue.startMs, cue.peakMs, cue.endMs) * cue.amplitude
      : 0;
    return [channel, value] as const;
  })) as Record<OutdoorGateCWindChannel, number>;
}

function sampleWindOverlay(
  _wind: Readonly<Record<OutdoorGateCWindChannel, number>>,
): Record<OutdoorGateCWindChannel, number> {
  return Object.fromEntries(WIND_CHANNELS.map((channel) => [
    channel,
    0,
  ])) as Record<OutdoorGateCWindChannel, number>;
}

function sampleHeroStars(elapsedMs: number): number[] {
  const heroStarBrightness = Array.from(
    { length: OUTDOOR_GATE_C_HERO_STAR_COUNT },
    () => STATIC_OVERLAY_OPACITY,
  );
  heroStarBrightness[0] = windowedOpacity(elapsedMs, 6_200, 6_625, 7_050, 0, 0.05, 0);
  heroStarBrightness[2] = windowedOpacity(elapsedMs, 2_300, 2_675, 3_050, 0, 0.06, 0);
  heroStarBrightness[7] = windowedOpacity(elapsedMs, 4_650, 5_050, 5_450, 0, 0.05, 0);
  heroStarBrightness[8] = windowedOpacity(elapsedMs, 8_000, 8_425, 8_850, 0, 0.06, 0);
  return heroStarBrightness;
}

function sampleHumanBreath(elapsedMs: number): number {
  return Math.max(
    breatheBetween(elapsedMs, 700, 2_000, 4_600),
    breatheBetween(elapsedMs, 5_200, 7_200, 8_700),
  );
}

function sampleCatBreath(elapsedMs: number): number {
  return Math.max(
    breatheBetween(elapsedMs, 1_300, 3_150, 4_800),
    breatheBetween(elapsedMs, 5_400, 6_950, 8_500),
  );
}

function sampleCloudProgress(elapsedMs: number): number {
  return oneShotEnvelope(elapsedMs, 0, 4_900, OUTDOOR_GATE_C_DURATION_MS);
}

function sampleFlowerLeft(elapsedMs: number): number {
  return windowedOpacity(elapsedMs, 1_050, 1_800, 2_550, 0, 0.05, 0);
}

function sampleFlowerRight(elapsedMs: number): number {
  return windowedOpacity(elapsedMs, 6_550, 7_250, 7_950, 0, 0.04, 0);
}

function neutralSample(elapsedMs: number): OutdoorGateCVisualSample {
  return {
    elapsedMs,
    sceneOpacity: 1,
    wind: {
      "far-grass": 0,
      "near-grass": 0,
      "human-hair": 0,
      "human-hem": 0,
      "cat-ears": 0,
      "cat-tail": 0,
    },
    humanBreath: 0,
    catBreath: 0,
    cloudOffsetX: [0, 0],
    cloudOpacity: [0, 0],
    windOverlayOpacity: {
      "far-grass": 0,
      "near-grass": 0,
      "human-hair": 0,
      "human-hem": 0,
      "cat-ears": 0,
      "cat-tail": 0,
    },
    bodyOverlayOpacity: [0, 0],
    heroStarBrightness: Array.from(
      { length: OUTDOOR_GATE_C_HERO_STAR_COUNT },
      () => STATIC_OVERLAY_OPACITY,
    ),
    flowerBrightness: [0, 0],
  };
}

export function sampleOutdoorGateCTimeline(
  elapsedMs: number,
  reducedMotion: boolean,
): OutdoorGateCVisualSample {
  const normalizedMs = normalizeElapsedMs(elapsedMs);

  if (reducedMotion) return neutralSample(normalizedMs);

  const wind = sampleWind(normalizedMs - OUTDOOR_GATE_C_OPENING_GUST_DELAY_MS);
  const heroStarBrightness = sampleHeroStars(normalizedMs);
  const humanBreath = sampleHumanBreath(normalizedMs);
  const catBreath = sampleCatBreath(normalizedMs);
  const cloudProgress = sampleCloudProgress(normalizedMs);

  return {
    elapsedMs: normalizedMs,
    sceneOpacity: 1,
    wind,
    humanBreath,
    catBreath,
    cloudOffsetX: [
      cloudProgress * 0.8,
      cloudProgress * 1.6,
    ],
    cloudOpacity: [cloudProgress * 0.06, cloudProgress * 0.08],
    windOverlayOpacity: sampleWindOverlay(wind),
    bodyOverlayOpacity: [humanBreath * 0.12, catBreath * 0.12],
    heroStarBrightness,
    flowerBrightness: [
      sampleFlowerLeft(normalizedMs),
      sampleFlowerRight(normalizedMs),
    ],
  };
}

/**
 * Formal outdoor runtime sampler. Ambient channels keep their established
 * envelopes, while wind follows the approved phone-readable 4.5–6.5s first quiet
 * gap and 6–9s later quiet gaps. A manual/first-touch chain may suppress the
 * remaining automatic opening wind so the two chains never overlap or jump.
 */
export function sampleOutdoorGateCPersistentTimeline(
  elapsedMs: number,
  reducedMotion: boolean,
  scheduler: OutdoorGateCPersistentScheduler,
): OutdoorGateCVisualSample {
  const safeElapsedMs = sanitizeRuntimeElapsedMs(elapsedMs);
  if (safeElapsedMs <= OUTDOOR_GATE_C_DURATION_MS) {
    const openingSample = sampleOutdoorGateCTimeline(safeElapsedMs, reducedMotion);
    if (reducedMotion) return openingSample;
    const wind = sampleWind(scheduler.runtimeWindSampleMs(safeElapsedMs));
    return {
      ...openingSample,
      wind,
      windOverlayOpacity: sampleWindOverlay(wind),
    };
  }
  if (reducedMotion) return neutralSample(safeElapsedMs);

  const wind = sampleWind(scheduler.runtimeWindSampleMs(safeElapsedMs));
  const humanBreath = sampleHumanBreath(persistentAmbientSampleMs(
    safeElapsedMs,
    PERSISTENT_AMBIENT_SCHEDULE.humanBreath,
  ));
  const catBreath = sampleCatBreath(persistentAmbientSampleMs(
    safeElapsedMs,
    PERSISTENT_AMBIENT_SCHEDULE.catBreath,
  ));
  const cloudProgress = sampleCloudProgress(persistentAmbientSampleMs(
    safeElapsedMs,
    PERSISTENT_AMBIENT_SCHEDULE.clouds,
  ));
  const heroStarBrightness = sampleHeroStars(persistentAmbientSampleMs(
    safeElapsedMs,
    PERSISTENT_AMBIENT_SCHEDULE.heroStars,
  ));

  return {
    elapsedMs: safeElapsedMs,
    sceneOpacity: 1,
    wind,
    humanBreath,
    catBreath,
    cloudOffsetX: [cloudProgress * 0.8, cloudProgress * 1.6],
    cloudOpacity: [cloudProgress * 0.06, cloudProgress * 0.08],
    windOverlayOpacity: sampleWindOverlay(wind),
    bodyOverlayOpacity: [humanBreath * 0.12, catBreath * 0.12],
    heroStarBrightness,
    flowerBrightness: [
      sampleFlowerLeft(persistentAmbientSampleMs(
        safeElapsedMs,
        PERSISTENT_AMBIENT_SCHEDULE.flowerLeft,
      )),
      sampleFlowerRight(persistentAmbientSampleMs(
        safeElapsedMs,
        PERSISTENT_AMBIENT_SCHEDULE.flowerRight,
      )),
    ],
  };
}
