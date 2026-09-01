import test from "node:test";
import assert from "node:assert/strict";
import {
  FORMAL_PICTUREBOOK_PARTIAL_CONTRACT_MARKERS,
  installFormalPicturebookPartialDebugApi,
  type FormalPicturebookPartialDebugController,
  type FormalPicturebookPartialDebugGlobal,
  type FormalPicturebookPartialDebugSnapshot,
} from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-debug.ts";

function snapshot(): FormalPicturebookPartialDebugSnapshot {
  return {
    mounted: true,
    mountState: "mounted",
    pageId: "home-h4",
    branch: "home",
    transition: null,
    meteor: null,
    h4: "ate",
    reducedMotion: false,
    largeText: true,
    audio: {
      ambientPlaying: true,
      musicPlaying: false,
      ambientAssigned: true,
      musicAssigned: false,
      ambientVolume: 0.2,
      musicVolume: 0,
    },
    livePagePaths: ["home/h4/spriteFrame"],
    contractMarkers: FORMAL_PICTUREBOOK_PARTIAL_CONTRACT_MARKERS,
  };
}

test("browser debug API exposes deterministic read and action drivers without adding UI", () => {
  const target = {} as FormalPicturebookPartialDebugGlobal;
  const calls: string[] = [];
  const controller: FormalPicturebookPartialDebugController = {
    snapshot,
    tapAction(actionId): void { calls.push(`tap:${actionId}`); },
    setReducedMotion(enabled): void { calls.push(`reduced:${enabled}`); },
    setLargeText(enabled): void { calls.push(`large:${enabled}`); },
    advanceTime(milliseconds): void { calls.push(`time:${milliseconds}`); },
  };

  const cleanup = installFormalPicturebookPartialDebugApi(true, controller, target);
  const api = target.__FORMAL_PICTUREBOOK_PARTIAL__;
  assert.ok(api);
  assert.deepEqual(api.snapshot(), snapshot());
  assert.deepEqual(api.snapshot().contractMarkers, [
    "FORMAL_PICTUREBOOK_BREEZE_HIDDEN=true",
    "root-r4",
    "stargaze-finale-meteor",
    "home-h4-ate",
    "home-h4-sipped",
  ]);
  api.tapAction("h4-eat");
  api.setReducedMotion(true);
  api.setLargeText(false);
  api.advanceTime(3_330);
  assert.deepEqual(calls, ["tap:h4-eat", "reduced:true", "large:false", "time:3330"]);
  assert.equal(Object.keys(target).length, 1, "the driver installs no visible debug surface");

  cleanup();
  assert.equal(target.__FORMAL_PICTUREBOOK_PARTIAL__, undefined);
});

test("debug API is absent when the Cocos environment is not a browser", () => {
  const target = {} as FormalPicturebookPartialDebugGlobal;
  const controller: FormalPicturebookPartialDebugController = {
    snapshot,
    tapAction(): void {},
    setReducedMotion(): void {},
    setLargeText(): void {},
    advanceTime(): void {},
  };
  installFormalPicturebookPartialDebugApi(false, controller, target);
  assert.equal(target.__FORMAL_PICTUREBOOK_PARTIAL__, undefined);
});

test("cleanup never deletes a newer debug owner", () => {
  const target = {} as FormalPicturebookPartialDebugGlobal;
  const controller: FormalPicturebookPartialDebugController = {
    snapshot,
    tapAction(): void {},
    setReducedMotion(): void {},
    setLargeText(): void {},
    advanceTime(): void {},
  };
  const cleanup = installFormalPicturebookPartialDebugApi(true, controller, target);
  const newer = { ...target.__FORMAL_PICTUREBOOK_PARTIAL__! };
  target.__FORMAL_PICTUREBOOK_PARTIAL__ = newer;
  cleanup();
  assert.equal(target.__FORMAL_PICTUREBOOK_PARTIAL__, newer);
});
