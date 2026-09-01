import {
  _decorator,
  Component,
  Node,
  UIOpacity,
  Vec3,
  input,
  Input,
} from "cc";
import {
  OUTDOOR_GATE_C_BREATH_SCALE_Y,
  OUTDOOR_GATE_C_FIRST_TOUCH_MIN_STRENGTH,
  OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS,
  OUTDOOR_GATE_C_MAX_ROTATION_DEGREES,
  OUTDOOR_GATE_C_ROTATION_SIGN,
  OUTDOOR_GATE_C_WIND_TRANSLATION_X_PX_BY_CHANNEL,
  OUTDOOR_GATE_C_WIND_CHAIN_END_MS,
  OUTDOOR_GATE_C_WIND_CHAIN_START_MS,
  OUTDOOR_GATE_C_WIND_CUES,
  type OutdoorGateCVisualSample,
  type OutdoorGateCWindChannel,
} from "./outdoor-gate-c-contract.ts";
import {
  OutdoorGateCPersistentScheduler,
  sampleOutdoorGateCPersistentTimeline,
} from "./outdoor-gate-c-timeline.ts";
import type { OutdoorSwipeDirection } from "./outdoor-slow-swipe.ts";

const { ccclass, property } = _decorator;
const FLOWER_PULSE_SECONDS = 0.35;
const FLOWER_STAR_DELAY_SECONDS = 0.35;
const FLOWER_STAR_PULSE_SECONDS = 0.36;
const FLOWER_STAR_INDEX_BY_FLOWER = [2, 8] as const;
const SKY_PULSE_SECONDS = 0.72;
const REDUCED_FEEDBACK_SECONDS = 0.18;
const FLOWER_BRIGHTNESS_MAX_BY_INDEX = [0.05, 0.04] as const;
const STAR_BRIGHTNESS_MAX = 0.06;
const REDUCED_BRIGHTNESS_MAX = 0.04;
const FIRST_TOUCH_QUEUE_WIND_THRESHOLD = OUTDOOR_GATE_C_FIRST_TOUCH_MIN_STRENGTH;
const FIRST_TOUCH_QUEUE_TAIL_START_MS = Math.max(
  ...OUTDOOR_GATE_C_WIND_CUES.map((cue) => cue.peakMs),
);
const WIND_CHANNELS: readonly OutdoorGateCWindChannel[] = [
  "far-grass",
  "near-grass",
  "human-hair",
  "human-hem",
  "cat-ears",
  "cat-tail",
];

interface NodePose {
  readonly node: Node;
  readonly position: Vec3;
  readonly scale: Vec3;
  readonly rotationZ: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

function gestureWindEnvelope(
  elapsedMs: number,
  startMs: number,
  peakMs: number,
  endMs: number,
): number {
  if (elapsedMs <= startMs || elapsedMs >= endMs) return 0;
  if (elapsedMs <= peakMs) return clamp01((elapsedMs - startMs) / (peakMs - startMs));
  return 1 - smoothstep((elapsedMs - peakMs) / (endMs - peakMs));
}

function gestureWindOffsetMs(): number {
  return OUTDOOR_GATE_C_WIND_CHAIN_START_MS;
}

function gestureWindDurationMs(): number {
  return OUTDOOR_GATE_C_MANUAL_WIND_DURATION_MS;
}

function decodeFormQueryComponent(component: string): string {
  const withSpaces = component.replace(/\+/g, " ");
  try {
    return decodeURIComponent(withSpaces);
  } catch {
    // URLSearchParams tolerates malformed percent escapes. Leaving that
    // component undecoded is sufficient here because only exact ASCII keys
    // and values can enable reduced motion, and it keeps startup non-throwing.
    return withSpaces;
  }
}

export function requestsReducedMotionFromSearch(search?: string | null): boolean {
  if (!search) return false;

  const query = search.charAt(0) === "?" ? search.slice(1) : search;
  let reducedMotionValue: string | undefined;
  let motionValue: string | undefined;
  let sawReducedMotion = false;
  let sawMotion = false;
  let segmentStart = 0;

  while (segmentStart <= query.length) {
    const separatorIndex = query.indexOf("&", segmentStart);
    const segmentEnd = separatorIndex === -1 ? query.length : separatorIndex;
    const equalsIndex = query.indexOf("=", segmentStart);
    const hasEquals = equalsIndex !== -1 && equalsIndex < segmentEnd;
    const keyEnd = hasEquals ? equalsIndex : segmentEnd;
    const key = decodeFormQueryComponent(query.slice(segmentStart, keyEnd));

    if (key === "reducedMotion" && !sawReducedMotion) {
      sawReducedMotion = true;
      reducedMotionValue = decodeFormQueryComponent(
        hasEquals ? query.slice(equalsIndex + 1, segmentEnd) : "",
      );
    } else if (key === "motion" && !sawMotion) {
      sawMotion = true;
      motionValue = decodeFormQueryComponent(
        hasEquals ? query.slice(equalsIndex + 1, segmentEnd) : "",
      );
    }

    if (separatorIndex === -1 || (sawReducedMotion && sawMotion)) break;
    segmentStart = separatorIndex + 1;
  }

  return reducedMotionValue === "1" || motionValue === "reduced";
}

function startupRequestsReducedMotion(): boolean {
  const locationValue = (globalThis as typeof globalThis & {
    readonly location?: { readonly search?: string };
  }).location;
  return requestsReducedMotionFromSearch(locationValue?.search);
}

@ccclass("OutdoorGateCRig")
export class OutdoorGateCRig extends Component {
  @property(UIOpacity)
  public sceneOpacity: UIOpacity | null = null;

  @property(Node)
  public farGrass: Node | null = null;

  @property(Node)
  public nearGrass: Node | null = null;

  @property(Node)
  public farCloud: Node | null = null;

  @property(Node)
  public nearCloud: Node | null = null;

  @property(UIOpacity)
  public farCloudOpacity: UIOpacity | null = null;

  @property(UIOpacity)
  public nearCloudOpacity: UIOpacity | null = null;

  @property(Node)
  public humanBreathRoot: Node | null = null;

  @property(UIOpacity)
  public humanBodyOpacity: UIOpacity | null = null;

  @property(Node)
  public humanHair: Node | null = null;

  @property(Node)
  public humanHem: Node | null = null;

  @property(Node)
  public catBreathRoot: Node | null = null;

  @property(UIOpacity)
  public catBodyOpacity: UIOpacity | null = null;

  @property(Node)
  public catEars: Node | null = null;

  @property(Node)
  public catTail: Node | null = null;

  @property({ type: [UIOpacity] })
  public heroStarOpacities: UIOpacity[] = [];

  @property({ type: [UIOpacity] })
  public flowerOpacities: UIOpacity[] = [];

  @property
  public reducedMotionOverride = false;

  private elapsedMs = 0;
  private readonly persistentScheduler = new OutdoorGateCPersistentScheduler();
  private reducedMotion = false;
  private poses = new Map<Node, NodePose>();
  private flowerPulseSeconds: [number, number] = [0, 0];
  private flowerStarResponseSeconds: [number | null, number | null] = [null, null];
  private skyPulseSeconds = 0;
  private gestureWindElapsedMs: number | null = null;
  private reducedGestureFeedbackElapsedMs: number | null = null;
  private firstTouchVisualWindHandled = false;
  private queuedFirstTouchWindStartMs: number | null = null;

  protected onLoad(): void {
    this.reducedMotion = this.reducedMotionOverride || startupRequestsReducedMotion();
    for (const node of this.motionNodes()) {
      this.poses.set(node, {
        node,
        position: node.position.clone(),
        scale: node.scale.clone(),
        rotationZ: node.eulerAngles.z,
      });
    }
    input.on(Input.EventType.TOUCH_START, this.handleFirstTouch, this);
    this.node.on(Node.EventType.TOUCH_START, this.handleFirstTouch, this);
    this.applyCurrentSample();
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.handleFirstTouch, this);
    this.node.off(Node.EventType.TOUCH_START, this.handleFirstTouch, this);
  }

  protected update(deltaTime: number): void {
    const safeDelta = Math.max(0, Math.min(deltaTime, 0.1));
    this.elapsedMs += safeDelta * 1_000;
    this.flowerPulseSeconds = [
      Math.max(0, this.flowerPulseSeconds[0] - safeDelta),
      Math.max(0, this.flowerPulseSeconds[1] - safeDelta),
    ];
    this.flowerStarResponseSeconds = this.flowerStarResponseSeconds.map((elapsed) => {
      if (elapsed === null) return null;
      const next = elapsed + safeDelta;
      const duration = this.reducedMotion ? REDUCED_FEEDBACK_SECONDS : FLOWER_STAR_PULSE_SECONDS;
      return next >= FLOWER_STAR_DELAY_SECONDS + duration ? null : next;
    }) as [number | null, number | null];
    this.skyPulseSeconds = Math.max(0, this.skyPulseSeconds - safeDelta);
    if (this.gestureWindElapsedMs !== null) {
      const nextElapsedMs = this.gestureWindElapsedMs + safeDelta * 1_000;
      this.gestureWindElapsedMs = nextElapsedMs >= gestureWindDurationMs()
        ? null
        : nextElapsedMs;
    }
    if (this.reducedGestureFeedbackElapsedMs !== null) {
      const nextElapsedMs = this.reducedGestureFeedbackElapsedMs + safeDelta * 1_000;
      this.reducedGestureFeedbackElapsedMs = nextElapsedMs >= REDUCED_FEEDBACK_SECONDS * 1_000
        ? null
        : nextElapsedMs;
    }
    if (
      this.queuedFirstTouchWindStartMs !== null
      && this.elapsedMs >= this.queuedFirstTouchWindStartMs
      && this.gestureWindElapsedMs === null
      && this.reducedGestureFeedbackElapsedMs === null
    ) {
      const queuedStartMs = this.queuedFirstTouchWindStartMs;
      this.queuedFirstTouchWindStartMs = null;
      this.beginManualWind(Math.min(
        gestureWindDurationMs(),
        Math.max(0, this.elapsedMs - queuedStartMs),
      ));
    }
    this.applyCurrentSample();
  }

  public replay(): void {
    this.elapsedMs = 0;
    this.persistentScheduler.reset();
    this.flowerPulseSeconds = [0, 0];
    this.flowerStarResponseSeconds = [null, null];
    this.skyPulseSeconds = 0;
    this.gestureWindElapsedMs = null;
    this.reducedGestureFeedbackElapsedMs = null;
    this.firstTouchVisualWindHandled = false;
    this.queuedFirstTouchWindStartMs = null;
    this.applyCurrentSample();
  }

  public setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled;
    this.gestureWindElapsedMs = null;
    this.reducedGestureFeedbackElapsedMs = null;
    this.queuedFirstTouchWindStartMs = null;
    if (enabled) {
      this.flowerPulseSeconds = [
        Math.min(this.flowerPulseSeconds[0], REDUCED_FEEDBACK_SECONDS),
        Math.min(this.flowerPulseSeconds[1], REDUCED_FEEDBACK_SECONDS),
      ];
      this.skyPulseSeconds = Math.min(this.skyPulseSeconds, REDUCED_FEEDBACK_SECONDS);
    }
    this.applyCurrentSample();
  }

  public isReducedMotionEnabled(): boolean {
    return this.reducedMotion;
  }

  public getElapsedMs(): number {
    return this.sampleElapsedMs();
  }

  public getRuntimeElapsedMs(): number {
    return this.elapsedMs;
  }

  public getMotionSnapshot(): OutdoorGateCVisualSample {
    return this.effectiveMotionSample();
  }

  public pulseFlower(index: 0 | 1): void {
    this.flowerPulseSeconds[index] = this.reducedMotion
      ? REDUCED_FEEDBACK_SECONDS
      : FLOWER_PULSE_SECONDS;
    this.flowerStarResponseSeconds[index] = 0;
    this.applyCurrentSample();
  }

  public pulseSky(): void {
    this.skyPulseSeconds = this.reducedMotion ? REDUCED_FEEDBACK_SECONDS : SKY_PULSE_SECONDS;
    this.applyCurrentSample();
  }

  public isGestureWindActive(): boolean {
    return this.gestureWindElapsedMs !== null
      || this.reducedGestureFeedbackElapsedMs !== null
      || this.queuedFirstTouchWindStartMs !== null;
  }

  public isAutomaticWindActive(): boolean {
    if (this.reducedMotion) return false;
    const wind = sampleOutdoorGateCPersistentTimeline(
      this.elapsedMs,
      false,
      this.persistentScheduler,
    ).wind;
    return Object.values(wind).some((strength) => Math.abs(strength) > 0.0001);
  }

  public startGestureWind(_direction: OutdoorSwipeDirection): boolean {
    if (this.isGestureWindActive() || this.isAutomaticWindActive()) return false;
    this.beginManualWind(0);
    return true;
  }

  private readonly handleFirstTouch = (): void => {
    if (this.firstTouchVisualWindHandled) return;
    if (this.acceptFirstTouchVisualWind("right")) this.firstTouchVisualWindHandled = true;
  };

  private applyCurrentSample(): void {
    const sample = this.effectiveMotionSample();
    if (this.sceneOpacity) this.sceneOpacity.opacity = Math.round(sample.sceneOpacity * 255);

    this.applyRotation(this.farGrass, this.rotation("far-grass", sample.wind["far-grass"]));
    this.applyRotation(this.nearGrass, this.rotation("near-grass", sample.wind["near-grass"]));
    this.applyRotation(this.humanHair, this.rotation("human-hair", sample.wind["human-hair"]));
    this.applyRotation(this.humanHem, this.rotation("human-hem", sample.wind["human-hem"]));
    this.applyRotation(this.catEars, this.rotation("cat-ears", sample.wind["cat-ears"]));
    this.applyRotation(this.catTail, this.rotation("cat-tail", sample.wind["cat-tail"]));
    this.applyTranslationX(this.farGrass, this.windTranslation("far-grass", sample.wind["far-grass"]));
    this.applyTranslationX(this.nearGrass, this.windTranslation("near-grass", sample.wind["near-grass"]));
    this.applyTranslationX(this.humanHair, this.windTranslation("human-hair", sample.wind["human-hair"]));
    this.applyTranslationX(this.humanHem, this.windTranslation("human-hem", sample.wind["human-hem"]));
    this.applyTranslationX(this.catEars, this.windTranslation("cat-ears", sample.wind["cat-ears"]));
    this.applyTranslationX(this.catTail, this.windTranslation("cat-tail", sample.wind["cat-tail"]));
    this.applyTranslationX(this.farCloud, sample.cloudOffsetX[0]);
    this.applyTranslationX(this.nearCloud, sample.cloudOffsetX[1]);
    this.applyOpacity(this.farCloudOpacity, sample.cloudOpacity[0]);
    this.applyOpacity(this.nearCloudOpacity, sample.cloudOpacity[1]);

    this.applyBreath(this.humanBreathRoot, sample.humanBreath, OUTDOOR_GATE_C_BREATH_SCALE_Y.human);
    this.applyBreath(this.catBreathRoot, sample.catBreath, OUTDOOR_GATE_C_BREATH_SCALE_Y.cat);
    this.applyOpacity(this.humanBodyOpacity, sample.bodyOverlayOpacity[0]);
    this.applyOpacity(this.catBodyOpacity, sample.bodyOverlayOpacity[1]);

    sample.heroStarBrightness.forEach((brightness, index) => {
      this.applyOpacity(
        this.heroStarOpacities[index] ?? null,
        Math.min(
          STAR_BRIGHTNESS_MAX,
          Math.max(brightness, this.skyStarPulse(index), this.flowerStarPulse(index)),
        ),
      );
    });
    sample.flowerBrightness.forEach((brightness, index) => {
      const flowerIndex = index as 0 | 1;
      this.applyOpacity(
        this.flowerOpacities[index] ?? null,
        Math.min(
          FLOWER_BRIGHTNESS_MAX_BY_INDEX[flowerIndex],
          Math.max(brightness, this.flowerPulse(flowerIndex)),
        ),
      );
    });

  }

  /**
   * One source of truth for both rendering and diagnostic evidence. This merges
   * a first-touch/slow-swipe wind with the automatic ambient sample without
   * adding their amplitudes, so snapshot().motion describes actual pixels.
   */
  private effectiveMotionSample(): OutdoorGateCVisualSample {
    const sample = sampleOutdoorGateCPersistentTimeline(
      this.elapsedMs,
      this.reducedMotion,
      this.persistentScheduler,
    );
    const wind = Object.fromEntries(WIND_CHANNELS.map((channel) => [
      channel,
      this.windStrength(channel, sample.wind[channel]),
    ])) as Record<OutdoorGateCWindChannel, number>;
    const heroStarBrightness = [...sample.heroStarBrightness];
    if (this.reducedMotion && heroStarBrightness.length > 2) {
      heroStarBrightness[2] = Math.max(
        heroStarBrightness[2] ?? 0,
        this.reducedGestureFeedback(),
      );
    }
    return {
      ...sample,
      wind,
      heroStarBrightness,
    };
  }

  private beginManualWind(initialElapsedMs: number): void {
    if (this.reducedMotion) {
      this.reducedGestureFeedbackElapsedMs = Math.min(
        REDUCED_FEEDBACK_SECONDS * 1_000,
        Math.max(0, initialElapsedMs),
      );
    } else {
      this.gestureWindElapsedMs = Math.min(
        gestureWindDurationMs(),
        Math.max(0, initialElapsedMs),
      );
      this.persistentScheduler.deferAfterManualGust(
        this.elapsedMs - this.gestureWindElapsedMs + gestureWindDurationMs(),
      );
    }
    this.applyCurrentSample();
  }

  /**
   * Accepts exactly one audio-unlock visual response. The handled flag is set
   * by the caller only after this method starts, reuses, or queues a chain.
   */
  private acceptFirstTouchVisualWind(direction: OutdoorSwipeDirection): boolean {
    if (this.gestureWindElapsedMs !== null || this.reducedGestureFeedbackElapsedMs !== null) {
      return true;
    }
    if (this.queuedFirstTouchWindStartMs !== null) return true;

    if (this.reducedMotion) return this.startGestureWind(direction);

    const occurrence = this.persistentScheduler.gustOccurrenceAt(this.elapsedMs);
    if (occurrence) {
      const wind = sampleOutdoorGateCPersistentTimeline(
        this.elapsedMs,
        false,
        this.persistentScheduler,
      ).wind;
      const strongest = Math.max(...Object.values(wind).map((strength) => Math.abs(strength)));
      const isSettlingTail = occurrence.sampleMs >= FIRST_TOUCH_QUEUE_TAIL_START_MS
        && strongest <= FIRST_TOUCH_QUEUE_WIND_THRESHOLD;
      if (isSettlingTail) {
        const settledAtMs = occurrence.startMs + OUTDOOR_GATE_C_WIND_CHAIN_END_MS;
        if (settledAtMs <= this.elapsedMs) this.beginManualWind(0);
        else this.queuedFirstTouchWindStartMs = settledAtMs;
      }
      // A fresh or readable automatic chain already is the first-touch visual
      // response; the settling tail instead owns the queued full chain above.
      return true;
    }

    return this.startGestureWind(direction);
  }

  private motionNodes(): readonly Node[] {
    return [
      this.farGrass,
      this.nearGrass,
      this.farCloud,
      this.nearCloud,
      this.humanBreathRoot,
      this.humanHair,
      this.humanHem,
      this.catBreathRoot,
      this.catEars,
      this.catTail,
    ].filter((node): node is Node => node !== null);
  }

  private applyRotation(node: Node | null, deltaDegrees: number): void {
    if (!node) return;
    const pose = this.poses.get(node);
    if (!pose) return;
    node.setRotationFromEuler(0, 0, pose.rotationZ + deltaDegrees);
  }

  private rotation(
    channel: keyof typeof OUTDOOR_GATE_C_MAX_ROTATION_DEGREES,
    strength: number,
  ): number {
    return OUTDOOR_GATE_C_ROTATION_SIGN * OUTDOOR_GATE_C_MAX_ROTATION_DEGREES[channel] * strength;
  }

  private windTranslation(
    channel: keyof typeof OUTDOOR_GATE_C_WIND_TRANSLATION_X_PX_BY_CHANNEL,
    strength: number,
  ): number {
    return OUTDOOR_GATE_C_ROTATION_SIGN
      * OUTDOOR_GATE_C_WIND_TRANSLATION_X_PX_BY_CHANNEL[channel]
      * strength;
  }

  private applyTranslationX(node: Node | null, offsetX: number): void {
    if (!node) return;
    const pose = this.poses.get(node);
    if (!pose) return;
    node.setPosition(pose.position.x + offsetX, pose.position.y, pose.position.z);
  }

  private applyBreath(node: Node | null, progress: number, amplitude: number): void {
    if (!node) return;
    const pose = this.poses.get(node);
    if (!pose) return;
    node.setPosition(pose.position);
    node.setScale(pose.scale.x, pose.scale.y * (1 + progress * amplitude), pose.scale.z);
  }

  private applyOpacity(component: UIOpacity | null, opacity: number): void {
    if (!component) return;
    component.opacity = Math.round(255 * Math.min(1, Math.max(0, opacity)));
  }

  private sampleElapsedMs(): number {
    return this.persistentScheduler.runtimeWindSampleMs(this.elapsedMs);
  }

  private flowerPulse(index: 0 | 1): number {
    const remaining = this.flowerPulseSeconds[index];
    if (remaining <= 0) return 0;
    const duration = this.reducedMotion ? REDUCED_FEEDBACK_SECONDS : FLOWER_PULSE_SECONDS;
    const maximum = this.reducedMotion
      ? REDUCED_BRIGHTNESS_MAX
      : FLOWER_BRIGHTNESS_MAX_BY_INDEX[index];
    return clamp01(remaining / duration) * maximum;
  }

  private skyStarPulse(index: number): number {
    if (this.skyPulseSeconds <= 0) return 0;
    const order = [1, 4, 7];
    if (this.reducedMotion) {
      if (index !== order[1]) return 0;
      return clamp01(this.skyPulseSeconds / REDUCED_FEEDBACK_SECONDS) * REDUCED_BRIGHTNESS_MAX;
    }
    const slot = order.indexOf(index);
    if (slot === -1) return 0;
    const elapsed = SKY_PULSE_SECONDS - this.skyPulseSeconds;
    const local = elapsed - slot * 0.12;
    if (local < 0 || local > 0.36) return 0;
    const progress = local <= 0.18 ? local / 0.18 : (0.36 - local) / 0.18;
    return progress * STAR_BRIGHTNESS_MAX;
  }

  private flowerStarPulse(index: number): number {
    let response = 0;
    this.flowerStarResponseSeconds.forEach((elapsed, flowerIndex) => {
      if (elapsed === null || FLOWER_STAR_INDEX_BY_FLOWER[flowerIndex] !== index) return;
      const local = elapsed - FLOWER_STAR_DELAY_SECONDS;
      const duration = this.reducedMotion ? REDUCED_FEEDBACK_SECONDS : FLOWER_STAR_PULSE_SECONDS;
      if (local < 0 || local >= duration) return;
      const half = duration / 2;
      const progress = local <= half ? local / half : (duration - local) / half;
      response = Math.max(response, smoothstep(progress) * STAR_BRIGHTNESS_MAX);
    });
    return response;
  }

  private gestureWindStrength(channel: OutdoorGateCWindChannel): number {
    if (this.reducedMotion || this.gestureWindElapsedMs === null) return 0;
    const cue = OUTDOOR_GATE_C_WIND_CUES.find((candidate) => candidate.channel === channel);
    if (!cue) return 0;
    const sampleMs = this.gestureWindElapsedMs + gestureWindOffsetMs();
    return gestureWindEnvelope(sampleMs, cue.startMs, cue.peakMs, cue.endMs) * cue.amplitude;
  }

  private windStrength(channel: OutdoorGateCWindChannel, automaticStrength: number): number {
    if (this.reducedMotion) return 0;
    if (this.gestureWindElapsedMs !== null) {
      return this.gestureWindStrength(channel);
    }
    return automaticStrength;
  }

  private reducedGestureFeedback(): number {
    if (!this.reducedMotion || this.reducedGestureFeedbackElapsedMs === null) return 0;
    const progress = 1 - this.reducedGestureFeedbackElapsedMs / (REDUCED_FEEDBACK_SECONDS * 1_000);
    return clamp01(progress) * REDUCED_BRIGHTNESS_MAX;
  }
}
