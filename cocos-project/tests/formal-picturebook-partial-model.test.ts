import test from "node:test";
import assert from "node:assert/strict";
import {
  FORMAL_PICTUREBOOK_BRANCH_TRANSITION_MS,
  FORMAL_PICTUREBOOK_H4_ACTION_REVEAL_DELAY_MS,
  FORMAL_PICTUREBOOK_PAGE_TRANSITION_MS,
  FORMAL_PICTUREBOOK_REDUCED_TRANSITION_MS,
  createFormalPicturebookPartialState,
  reduceFormalPicturebookPartial,
  sampleFormalPicturebookMeteor,
  type FormalPicturebookPartialState,
} from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-model.ts";
import {
  FORMAL_PICTUREBOOK_PARTIAL_BUNDLE_NAME,
  FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS,
  formalPicturebookResourcePath,
} from "../assets/scripts/cocos/formal-picturebook-0-4-8/formal-picturebook-partial-assets.ts";

function dispatch(
  state: FormalPicturebookPartialState,
  action: Parameters<typeof reduceFormalPicturebookPartial>[1],
): ReturnType<typeof reduceFormalPicturebookPartial> {
  return reduceFormalPicturebookPartial(state, action);
}

test("root exposes only stargaze and home, with low-weight invitations delayed to 1.5s", () => {
  let state = createFormalPicturebookPartialState(false);
  assert.equal(state.pageId, "root");
  assert.deepEqual(state.availableActions, ["stargaze", "home"]);
  assert.equal(state.rootInvitationsVisible, false);

  state = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 1_499 }).state;
  assert.equal(state.rootInvitationsVisible, false);
  state = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 1 }).state;
  assert.equal(state.rootInvitationsVisible, true);
  assert.equal(state.availableActions.includes("breeze" as never), false);
});

test("stargaze advances F1 through F5 only by taps and uses 320/260ms transitions", () => {
  let state = createFormalPicturebookPartialState(false);
  let result = dispatch(state, { type: "ENTER_STARGAZE" });
  state = result.state;
  assert.equal(state.pageId, "stargaze-f1");
  assert.deepEqual(result.transition, { kind: "branch", durationMs: 320 });

  for (const pageId of ["stargaze-f2", "stargaze-f3", "stargaze-f4", "stargaze-f5"] as const) {
    result = dispatch(state, { type: "TAP_PAGE" });
    state = result.state;
    assert.equal(state.pageId, pageId);
    assert.deepEqual(result.transition, { kind: "page", durationMs: 260 });
  }

  const unchanged = dispatch(state, { type: "TAP_PAGE" });
  assert.equal(unchanged.state, state);
  assert.equal(unchanged.transition, null);
});

test("F5 plays exactly one normal meteor timeline before exposing home and stay choices", () => {
  const samples = [
    sampleFormalPicturebookMeteor(0, false),
    sampleFormalPicturebookMeteor(899, false),
    sampleFormalPicturebookMeteor(900, false),
    sampleFormalPicturebookMeteor(1_699, false),
    sampleFormalPicturebookMeteor(1_700, false),
    sampleFormalPicturebookMeteor(2_149, false),
    sampleFormalPicturebookMeteor(2_150, false),
    sampleFormalPicturebookMeteor(3_149, false),
    sampleFormalPicturebookMeteor(3_150, false),
    sampleFormalPicturebookMeteor(3_330, false),
    sampleFormalPicturebookMeteor(20_000, false),
  ];

  assert.deepEqual(samples.map((sample) => sample.phase), [
    "hold",
    "hold",
    "meteor",
    "meteor",
    "tail",
    "tail",
    "quiet",
    "quiet",
    "copy",
    "choices",
    "choices",
  ]);
  assert.equal(samples[2]!.meteorVisible, true);
  assert.equal(samples[4]!.meteorVisible, true);
  assert.equal(samples[6]!.meteorVisible, false);
  assert.equal(samples[8]!.choicesVisible, false);
  assert.equal(samples[9]!.choicesVisible, true);
  assert.equal(samples[10]!.meteorVisible, false, "the meteor must not loop");
});

test("reduced motion removes meteor movement and uses only 150ms transitions", () => {
  let state = createFormalPicturebookPartialState(true);
  let result = dispatch(state, { type: "ENTER_STARGAZE" });
  assert.deepEqual(result.transition, { kind: "branch", durationMs: 150 });
  state = result.state;

  for (let index = 0; index < 4; index += 1) state = dispatch(state, { type: "TAP_PAGE" }).state;
  assert.equal(state.pageId, "stargaze-f5");
  assert.equal(sampleFormalPicturebookMeteor(950, true).moves, false);
  assert.equal(sampleFormalPicturebookMeteor(950, true).phase, "reduced-static");
  assert.equal(sampleFormalPicturebookMeteor(2_260, true).choicesVisible, true);

  result = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 2_260 });
  state = result.state;
  result = dispatch(state, { type: "FINALE_STAY" });
  assert.equal(result.state.pageId, "root");
  assert.deepEqual(result.transition, { kind: "branch", durationMs: 150 });
});

test("the F5 finale routes home to H1 or stay back to root without recording completion", () => {
  let state = createFormalPicturebookPartialState(false);
  state = dispatch(state, { type: "ENTER_STARGAZE" }).state;
  for (let index = 0; index < 4; index += 1) state = dispatch(state, { type: "TAP_PAGE" }).state;
  state = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 3_330 }).state;

  const home = dispatch(state, { type: "FINALE_HOME" });
  assert.equal(home.state.pageId, "home-h1");
  assert.deepEqual(home.transition, { kind: "branch", durationMs: 320 });
  assert.equal(home.state.completed, false);

  const stay = dispatch(state, { type: "FINALE_STAY" });
  assert.equal(stay.state.pageId, "root");
  assert.deepEqual(stay.transition, { kind: "branch", durationMs: 320 });
  assert.equal(stay.state.completed, false);
});

test("home H4 eat and sip are optional, order-independent, idempotent, and blank tap reaches H5", () => {
  let state = dispatch(createFormalPicturebookPartialState(false), { type: "ENTER_HOME" }).state;
  assert.equal(state.pageId, "home-h1");
  for (let index = 0; index < 3; index += 1) state = dispatch(state, { type: "TAP_PAGE" }).state;
  assert.equal(state.pageId, "home-h4");
  assert.equal(state.h4State, "none");
  assert.equal(FORMAL_PICTUREBOOK_H4_ACTION_REVEAL_DELAY_MS, 300);
  assert.equal(state.h4ActionsVisible, false);
  assert.deepEqual(state.availableActions, ["next"]);
  state = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 299 }).state;
  assert.equal(state.h4ActionsVisible, false);
  state = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 1 }).state;
  assert.equal(state.h4ActionsVisible, true);
  assert.deepEqual(state.availableActions, ["eat", "sip", "next"]);

  const ate = dispatch(state, { type: "H4_EAT" });
  state = ate.state;
  assert.equal(state.h4State, "ate");
  assert.deepEqual(ate.transition, { kind: "feedback", durationMs: 180 });
  assert.equal(dispatch(state, { type: "H4_EAT" }).state, state, "eating twice is idempotent");

  const both = dispatch(state, { type: "H4_SIP" });
  state = both.state;
  assert.equal(state.h4State, "both");
  assert.equal(dispatch(state, { type: "H4_SIP" }).state, state, "sipping twice is idempotent");

  const h5 = dispatch(state, { type: "TAP_PAGE" });
  assert.equal(h5.state.pageId, "home-h5");
  assert.deepEqual(h5.transition, { kind: "page", durationMs: 260 });
  assert.equal(h5.state.completed, false);
  assert.equal(dispatch(h5.state, { type: "TAP_PAGE" }).state, h5.state);
  assert.deepEqual(h5.state.availableActions, ["return-root"]);
  const returned = dispatch(h5.state, { type: "RETURN_ROOT" });
  assert.equal(returned.state.pageId, "root");
  assert.deepEqual(returned.transition, { kind: "branch", durationMs: 320 });
  assert.equal(returned.state.completed, false);

  let skipped = dispatch(createFormalPicturebookPartialState(false), { type: "ENTER_HOME" }).state;
  for (let index = 0; index < 3; index += 1) skipped = dispatch(skipped, { type: "TAP_PAGE" }).state;
  skipped = dispatch(skipped, { type: "TAP_PAGE" }).state;
  assert.equal(skipped.pageId, "home-h5", "blank H4 tap must not require either ritual action");
});

test("a completed H4 ritual never leaks into a second home visit", () => {
  let state = dispatch(createFormalPicturebookPartialState(false), { type: "ENTER_HOME" }).state;
  for (let index = 0; index < 3; index += 1) state = dispatch(state, { type: "TAP_PAGE" }).state;
  state = dispatch(state, { type: "ADVANCE_TIME", deltaMs: 300 }).state;
  state = dispatch(state, { type: "H4_EAT" }).state;
  state = dispatch(state, { type: "H4_SIP" }).state;
  assert.equal(state.h4State, "both");
  state = dispatch(state, { type: "TAP_PAGE" }).state;
  state = dispatch(state, { type: "RETURN_ROOT" }).state;
  assert.equal(state.pageId, "root");
  assert.equal(state.h4State, "none");

  state = dispatch(state, { type: "ENTER_HOME" }).state;
  for (let index = 0; index < 3; index += 1) state = dispatch(state, { type: "TAP_PAGE" }).state;
  assert.equal(state.pageId, "home-h4");
  assert.equal(state.h4State, "none");
});

test("asset contract uses the approved partial bundle and excludes superseded story frames", () => {
  assert.equal(FORMAL_PICTUREBOOK_PARTIAL_BUNDLE_NAME, "formal-picturebook-partial-0-4-8");
  assert.equal(formalPicturebookResourcePath("root"), "root/root-wind-hem-r4/spriteFrame");
  assert.equal(formalPicturebookResourcePath("stargaze-f5"), "stargaze/f5/spriteFrame");
  assert.equal(formalPicturebookResourcePath("home-h5"), "home/h5/spriteFrame");
  assert.deepEqual(FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.h4Feedback, {
    ate: "home/h4-ate/spriteFrame",
    sipped: "home/h4-sipped/spriteFrame",
  });
  const serialized = JSON.stringify(FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS);
  for (const forbidden of ["B01", "B02", "B03", "outdoor-illustration-wind", "outdoor-story-b-kf-r1-temp"]) {
    assert.equal(serialized.includes(forbidden), false, `must exclude ${forbidden}`);
  }
});

test("transition constants remain the approved 260/320/150ms contract", () => {
  assert.equal(FORMAL_PICTUREBOOK_PAGE_TRANSITION_MS, 260);
  assert.equal(FORMAL_PICTUREBOOK_BRANCH_TRANSITION_MS, 320);
  assert.equal(FORMAL_PICTUREBOOK_REDUCED_TRANSITION_MS, 150);
});
