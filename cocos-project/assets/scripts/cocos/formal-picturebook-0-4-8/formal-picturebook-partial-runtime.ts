import type { FormalPicturebookMeteorSample } from "./formal-picturebook-partial-model.ts";
import type { FormalPicturebookPageId } from "./formal-picturebook-partial-assets.ts";
import { computeOutdoorGateCPixelAlignedViewport } from "../outdoor-gate-c/outdoor-gate-c-viewport.ts";

export const FORMAL_PICTUREBOOK_SAFETY_COLOR_HEX = "#06265F";
export const FORMAL_PICTUREBOOK_DESIGN_SIZE = { width: 390, height: 844 } as const;
/** 0.4.8 intentionally ships only the approved stargaze and home branches. */
export const FORMAL_PICTUREBOOK_BREEZE_HIDDEN = true;

export interface FormalPicturebookRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FormalPicturebookPoint {
  readonly x: number;
  readonly y: number;
}

export const FORMAL_PICTUREBOOK_HIT_AREAS = {
  root: {
    stargaze: { x: 24, y: 70, width: 342, height: 510 },
    home: { x: 270, y: 628, width: 100, height: 112 },
  },
  page: { x: 0, y: 0, width: 390, height: 844 },
  h4: {
    eat: { x: 144, y: 346, width: 146, height: 170 },
    sip: { x: 299, y: 346, width: 83, height: 170 },
  },
  finale: {
    home: { x: 32, y: 748, width: 140, height: 56 },
    stay: { x: 218, y: 748, width: 140, height: 56 },
  },
  homeH5: {
    returnRoot: { x: 115, y: 748, width: 160, height: 56 },
  },
} as const satisfies Record<string, unknown>;

export const FORMAL_PICTUREBOOK_UI_COPY = {
  root: {
    stargaze: "看看星空",
    home: "回家",
  },
  h4: {
    eat: "吃一点",
    sip: "喝口温水",
  },
  finale: {
    line1: "一颗流星，刚刚从夜里经过。",
    line2: "回家，还是再坐一会儿？",
    home: "回家",
    stay: "再坐一会儿",
  },
  homeH5: {
    returnRoot: "回到夜风里",
  },
} as const;

export interface FormalPicturebookTypography {
  readonly scale: 1 | 1.2;
  /** Labels wrap into their allocated boxes; they are never SHRINKed. */
  readonly overflow: "wrap";
  readonly h4Surface: "inline" | "table-paper";
}

export function formalPicturebookTypography(largeText: boolean): FormalPicturebookTypography {
  return largeText
    ? { scale: 1.2, overflow: "wrap", h4Surface: "table-paper" }
    : { scale: 1, overflow: "wrap", h4Surface: "inline" };
}

export function formalPicturebookDelayedFade(elapsedMs: number, delayMs: number): number {
  const progress = (Math.max(0, elapsedMs) - Math.max(0, delayMs)) / 180;
  return Math.max(0, Math.min(1, progress));
}

export function formalPicturebookCopyTone(
  pageId: FormalPicturebookPageId,
): "outdoor-light" | "indoor-dark" {
  return pageId.startsWith("home-") ? "indoor-dark" : "outdoor-light";
}

export interface FormalPicturebookViewport {
  readonly policy: "SHOW_ALL";
  readonly scale: number;
  readonly rootScale: { readonly x: number; readonly y: number };
  readonly contentRect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
}

export function formalPicturebookViewport(width: number, height: number): FormalPicturebookViewport {
  const result = computeOutdoorGateCPixelAlignedViewport(width, height);
  return {
    policy: "SHOW_ALL",
    scale: result.scale,
    rootScale: result.rootScale,
    contentRect: result.contentRect,
  };
}

const METEOR_START: FormalPicturebookPoint = { x: 142, y: 286 };
const METEOR_END: FormalPicturebookPoint = { x: -18, y: 76 };
const METEOR_TAIL_FRACTION = 0.22;

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export interface FormalPicturebookMeteorSegment {
  readonly head: FormalPicturebookPoint;
  readonly tail: FormalPicturebookPoint;
  readonly opacity: number;
}

export function formalPicturebookMeteorSegment(
  sample: FormalPicturebookMeteorSample,
): FormalPicturebookMeteorSegment | null {
  if (!sample.meteorVisible || sample.meteorOpacity <= 0) return null;
  const headProgress = Math.max(0, Math.min(1, sample.meteorProgress));
  const tailProgress = Math.max(0, headProgress - METEOR_TAIL_FRACTION);
  return {
    head: {
      x: lerp(METEOR_START.x, METEOR_END.x, headProgress),
      y: lerp(METEOR_START.y, METEOR_END.y, headProgress),
    },
    tail: {
      x: lerp(METEOR_START.x, METEOR_END.x, tailProgress),
      y: lerp(METEOR_START.y, METEOR_END.y, tailProgress),
    },
    opacity: Math.max(0, Math.min(1, sample.meteorOpacity)),
  };
}

type PageSlot = 0 | 1;

export interface FormalPicturebookResidencySnapshot {
  readonly activeSlot: PageSlot;
  readonly slotPaths: readonly [string | null, string | null];
  readonly preparedSlot: PageSlot | null;
}

export class FormalPicturebookDoublePageResidency {
  private activeSlot: PageSlot = 0;
  private slotPaths: [string | null, string | null] = [null, null];
  private preparedSlot: PageSlot | null = null;

  public installInitial(path: string): void {
    this.activeSlot = 0;
    this.slotPaths = [path, null];
    this.preparedSlot = null;
  }

  public prepare(path: string): { readonly targetSlot: PageSlot; readonly releaseBeforeLoad: string | null } {
    const targetSlot: PageSlot = this.activeSlot === 0 ? 1 : 0;
    const releaseBeforeLoad = this.slotPaths[targetSlot];
    this.slotPaths[targetSlot] = null;
    this.preparedSlot = null;
    return { targetSlot, releaseBeforeLoad };
  }

  public markPrepared(slot: PageSlot, path: string): void {
    const expectedSlot: PageSlot = this.activeSlot === 0 ? 1 : 0;
    if (slot !== expectedSlot) throw new Error("The prepared page must use the inactive Sprite slot");
    this.slotPaths[slot] = path;
    this.preparedSlot = slot;
  }

  public commit(): { readonly activeSlot: PageSlot; readonly releaseAfterCommit: string | null } {
    const nextSlot = this.preparedSlot;
    if (nextSlot === null || this.slotPaths[nextSlot] === null) {
      throw new Error("Cannot commit before the next full-frame page is prepared");
    }
    const previousSlot = this.activeSlot;
    const releaseAfterCommit = this.slotPaths[previousSlot];
    this.slotPaths[previousSlot] = null;
    this.activeSlot = nextSlot;
    this.preparedSlot = null;
    return { activeSlot: nextSlot, releaseAfterCommit };
  }

  public abortPrepared(): string | null {
    const preparedSlot = this.preparedSlot;
    if (preparedSlot === null) return null;
    const path = this.slotPaths[preparedSlot];
    this.slotPaths[preparedSlot] = null;
    this.preparedSlot = null;
    return path;
  }

  public reset(): readonly string[] {
    const paths = this.slotPaths.filter((path): path is string => path !== null);
    this.activeSlot = 0;
    this.slotPaths = [null, null];
    this.preparedSlot = null;
    return paths;
  }

  public livePathCount(): number {
    return this.slotPaths.filter((path) => path !== null).length;
  }

  public snapshot(): FormalPicturebookResidencySnapshot {
    return {
      activeSlot: this.activeSlot,
      slotPaths: [...this.slotPaths],
      preparedSlot: this.preparedSlot,
    };
  }
}
