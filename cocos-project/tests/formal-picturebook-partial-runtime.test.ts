import test from "node:test";
import assert from "node:assert/strict";
import {
  FORMAL_PICTUREBOOK_HIT_AREAS,
  FORMAL_PICTUREBOOK_BREEZE_HIDDEN,
  FORMAL_PICTUREBOOK_SAFETY_COLOR_HEX,
  FORMAL_PICTUREBOOK_UI_COPY,
  FormalPicturebookDoublePageResidency,
  formalPicturebookMeteorSegment,
  formalPicturebookDelayedFade,
  formalPicturebookCopyTone,
  formalPicturebookTypography,
  formalPicturebookViewport,
} from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-runtime.ts";
import { sampleFormalPicturebookMeteor } from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-model.ts";

test("root runtime layout has two non-task entrances and no breeze control", () => {
  assert.deepEqual(Object.keys(FORMAL_PICTUREBOOK_HIT_AREAS.root), ["stargaze", "home"]);
  assert.equal(JSON.stringify(FORMAL_PICTUREBOOK_HIT_AREAS).includes("breeze"), false);
  assert.equal(FORMAL_PICTUREBOOK_UI_COPY.root.stargaze, "看看星空");
  assert.equal(FORMAL_PICTUREBOOK_UI_COPY.root.home, "回家");
  assert.equal(FORMAL_PICTUREBOOK_UI_COPY.homeH5.returnRoot, "回到夜风里");
  assert.equal(FORMAL_PICTUREBOOK_BREEZE_HIDDEN, true);
});

test("large text is a true 120% layout and H4 moves its copy onto the approved warm paper", () => {
  assert.deepEqual(formalPicturebookTypography(false), {
    scale: 1,
    overflow: "wrap",
    h4Surface: "inline",
  });
  assert.deepEqual(formalPicturebookTypography(true), {
    scale: 1.2,
    overflow: "wrap",
    h4Surface: "table-paper",
  });
  assert.equal(Math.round(15 * formalPicturebookTypography(true).scale), 18);
});

test("root and H4 invitations begin at their locked delays and fade in over 180ms", () => {
  assert.equal(formalPicturebookDelayedFade(1_499, 1_500), 0);
  assert.equal(formalPicturebookDelayedFade(1_500, 1_500), 0);
  assert.ok(Math.abs(formalPicturebookDelayedFade(1_590, 1_500) - 0.5) < 1e-9);
  assert.equal(formalPicturebookDelayedFade(1_680, 1_500), 1);
  assert.equal(formalPicturebookDelayedFade(299, 300), 0);
  assert.equal(formalPicturebookDelayedFade(300, 300), 0);
  assert.ok(Math.abs(formalPicturebookDelayedFade(390, 300) - 0.5) < 1e-9);
  assert.equal(formalPicturebookDelayedFade(480, 300), 1);
});

test("generic continue copy changes ink tone between cool outdoor and bright warm home pages", () => {
  assert.equal(formalPicturebookCopyTone("root"), "outdoor-light");
  assert.equal(formalPicturebookCopyTone("stargaze-f3"), "outdoor-light");
  assert.equal(formalPicturebookCopyTone("home-h1"), "indoor-dark");
  assert.equal(formalPicturebookCopyTone("home-h5"), "indoor-dark");
});

test("SHOW_ALL keeps every 390x844 full-frame page uncropped across target and pressure sizes", () => {
  assert.equal(FORMAL_PICTUREBOOK_SAFETY_COLOR_HEX, "#06265F");
  for (const [width, height] of [[360, 800], [390, 844], [430, 932], [430, 844]] as const) {
    const presentation = formalPicturebookViewport(width, height);
    assert.equal(presentation.policy, "SHOW_ALL");
    assert.ok(presentation.contentRect.x >= 0, `${width}x${height} left bar`);
    assert.ok(presentation.contentRect.y >= 0, `${width}x${height} bottom bar`);
    assert.ok(presentation.contentRect.x + presentation.contentRect.width <= width + 1e-6);
    assert.ok(presentation.contentRect.y + presentation.contentRect.height <= height + 1e-6);
    assert.ok(
      Math.abs(presentation.contentRect.width / presentation.contentRect.height - 390 / 844) < 0.001,
      "the existing sub-two-pixel safety-bar correction may adjust one axis by at most a fraction of a pixel",
    );
  }
});

test("every localized control has at least a 44x44 target and paired choices stay separated", () => {
  const controls = [
    ...Object.values(FORMAL_PICTUREBOOK_HIT_AREAS.root),
    ...Object.values(FORMAL_PICTUREBOOK_HIT_AREAS.h4),
    ...Object.values(FORMAL_PICTUREBOOK_HIT_AREAS.finale),
    FORMAL_PICTUREBOOK_HIT_AREAS.homeH5.returnRoot,
  ];
  for (const rect of controls) {
    assert.ok(rect.width >= 44, `${JSON.stringify(rect)} width`);
    assert.ok(rect.height >= 44, `${JSON.stringify(rect)} height`);
  }

  const eat = FORMAL_PICTUREBOOK_HIT_AREAS.h4.eat;
  const sip = FORMAL_PICTUREBOOK_HIT_AREAS.h4.sip;
  assert.ok(sip.x - (eat.x + eat.width) >= 8);
  const home = FORMAL_PICTUREBOOK_HIT_AREAS.finale.home;
  const stay = FORMAL_PICTUREBOOK_HIT_AREAS.finale.stay;
  assert.ok(stay.x - (home.x + home.width) >= 8);
});

test("H4 preserves the approved top-left interaction rectangles exactly", () => {
  assert.deepEqual(FORMAL_PICTUREBOOK_HIT_AREAS.h4, {
    eat: { x: 144, y: 346, width: 146, height: 170 },
    sip: { x: 299, y: 346, width: 83, height: 170 },
  });
  assert.equal(
    FORMAL_PICTUREBOOK_HIT_AREAS.h4.sip.x
      - (FORMAL_PICTUREBOOK_HIT_AREAS.h4.eat.x + FORMAL_PICTUREBOOK_HIT_AREAS.h4.eat.width),
    9,
  );
});

test("meteor geometry moves once in normal mode but remains fixed in reduced mode", () => {
  const early = formalPicturebookMeteorSegment(sampleFormalPicturebookMeteor(1_000, false));
  const late = formalPicturebookMeteorSegment(sampleFormalPicturebookMeteor(1_600, false));
  assert.ok(early && late);
  assert.notDeepEqual(early.head, late.head);
  assert.ok(late.head.x < early.head.x, "the meteor travels from the upper-right toward the companions");
  assert.ok(late.head.y < early.head.y);

  const reducedA = formalPicturebookMeteorSegment(sampleFormalPicturebookMeteor(930, true));
  const reducedB = formalPicturebookMeteorSegment(sampleFormalPicturebookMeteor(1_030, true));
  assert.ok(reducedA && reducedB);
  assert.deepEqual(reducedA.head, reducedB.head);
  assert.deepEqual(reducedA.tail, reducedB.tail);
});

test("double-page residency never needs a third live full-frame slot", () => {
  const residency = new FormalPicturebookDoublePageResidency();
  residency.installInitial("root/root-wind-hem-r4/spriteFrame");
  assert.deepEqual(residency.snapshot(), {
    activeSlot: 0,
    slotPaths: ["root/root-wind-hem-r4/spriteFrame", null],
    preparedSlot: null,
  });

  let preparation = residency.prepare("stargaze/f1/spriteFrame");
  assert.deepEqual(preparation, { targetSlot: 1, releaseBeforeLoad: null });
  residency.markPrepared(1, "stargaze/f1/spriteFrame");
  assert.equal(residency.livePathCount(), 2);
  assert.deepEqual(residency.commit(), {
    activeSlot: 1,
    releaseAfterCommit: "root/root-wind-hem-r4/spriteFrame",
  });
  assert.equal(residency.livePathCount(), 1);

  preparation = residency.prepare("stargaze/f2/spriteFrame");
  assert.deepEqual(preparation, { targetSlot: 0, releaseBeforeLoad: null });
  residency.markPrepared(0, "stargaze/f2/spriteFrame");
  assert.equal(residency.livePathCount(), 2);
  assert.deepEqual(residency.commit(), {
    activeSlot: 0,
    releaseAfterCommit: "stargaze/f1/spriteFrame",
  });
  assert.equal(residency.livePathCount(), 1);
});
