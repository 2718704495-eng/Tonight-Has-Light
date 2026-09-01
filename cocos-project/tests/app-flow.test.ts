import test from "node:test";
import assert from "node:assert/strict";
import {
  createAppFlowState,
  transitionAppFlow,
  type AppFlowCommand,
  type AppFlowState,
} from "../assets/scripts/core/app-flow.ts";

function send(state: AppFlowState, command: AppFlowCommand) {
  return transitionAppFlow(state, command);
}

function reachOutdoor(sharedWelcome = false): AppFlowState {
  let state = createAppFlowState();
  state = send(state, { type: "BOOT_COMPLETE", sharedWelcome }).state;
  if (sharedWelcome) {
    state = send(state, { type: "DISMISS_SHARED_WELCOME" }).state;
  }
  return state;
}

function reachIndoorLoading(): AppFlowState {
  let state = reachOutdoor();
  state = send(state, { type: "REQUEST_ENTER_HOUSE" }).state;
  return send(state, { type: "DOOR_TRANSITION_DONE" }).state;
}

function reachNightSession(): AppFlowState {
  return send(reachIndoorLoading(), { type: "INDOOR_LOADED" }).state;
}

test("boots either through the fixed shared welcome or directly into the outdoor scene", () => {
  const direct = send(createAppFlowState(), {
    type: "BOOT_COMPLETE",
    sharedWelcome: false,
  });
  assert.equal(direct.state.phase, "outdoor-ready");
  assert.equal(direct.state.overlay, "none");

  const shared = send(createAppFlowState(), {
    type: "BOOT_COMPLETE",
    sharedWelcome: true,
  });
  assert.equal(shared.state.phase, "shared-welcome");

  const dismissed = send(shared.state, { type: "DISMISS_SHARED_WELCOME" });
  assert.equal(dismissed.state.phase, "outdoor-ready");
  assert.deepEqual(dismissed.effects, []);

  const resumed = send(createAppFlowState(), {
    type: "BOOT_COMPLETE",
    sharedWelcome: false,
    resumeNightSession: true,
  });
  assert.equal(resumed.state.phase, "indoor-loading");
  assert.deepEqual(resumed.effects, [{ type: "LOAD_INDOOR_NIGHT" }]);
});

test("consumes the door request exactly once and loads the indoor night after the transition", () => {
  const outdoor = reachOutdoor();
  const requested = send(outdoor, { type: "REQUEST_ENTER_HOUSE" });

  assert.equal(requested.state.phase, "door-transition");
  assert.deepEqual(requested.effects, [{ type: "START_DOOR_TRANSITION" }]);

  const duplicate = send(requested.state, { type: "REQUEST_ENTER_HOUSE" });
  assert.strictEqual(duplicate.state, requested.state);
  assert.deepEqual(duplicate.effects, []);

  const transitioned = send(duplicate.state, { type: "DOOR_TRANSITION_DONE" });
  assert.equal(transitioned.state.phase, "indoor-loading");
  assert.deepEqual(transitioned.effects, [{ type: "LOAD_INDOOR_NIGHT" }]);

  const loadingDuplicate = send(transitioned.state, { type: "REQUEST_ENTER_HOUSE" });
  assert.strictEqual(loadingDuplicate.state, transitioned.state);
  assert.deepEqual(loadingDuplicate.effects, []);

  const staleDone = send(loadingDuplicate.state, { type: "DOOR_TRANSITION_DONE" });
  assert.strictEqual(staleDone.state, transitioned.state);
  assert.deepEqual(staleDone.effects, []);
});

test("rolls an interrupted door transition back to the outdoor safe state", () => {
  let state = reachOutdoor();
  state = send(state, { type: "REQUEST_ENTER_HOUSE" }).state;

  const hidden = send(state, { type: "APP_HIDE" });
  assert.equal(hidden.state.phase, "outdoor-ready");
  assert.equal(hidden.state.overlay, "paused");
  assert.deepEqual(hidden.effects, [{ type: "SUSPEND_APP" }]);

  const staleTransition = send(hidden.state, { type: "DOOR_TRANSITION_DONE" });
  assert.strictEqual(staleTransition.state, hidden.state);

  const shown = send(hidden.state, { type: "APP_SHOW" });
  assert.equal(shown.state.phase, "outdoor-ready");
  assert.equal(shown.state.overlay, "none");
  assert.deepEqual(shown.effects, [{ type: "RESUME_APP" }]);
});

test("keeps an outdoor asset failure visible and retryable without entering a night", () => {
  const outdoor = reachOutdoor();
  const failed = send(outdoor, {
    type: "OUTDOOR_LOAD_FAILED",
    message: "夜空资源暂时没有准备好",
  });
  assert.equal(failed.state.phase, "outdoor-ready");
  assert.equal(failed.state.overlay, "loading-error");

  const retry = send(failed.state, { type: "RETRY_OUTDOOR_LOAD" });
  assert.equal(retry.state.overlay, "none");
  assert.deepEqual(retry.effects, [{ type: "LOAD_OUTDOOR_SCENE" }]);

  const hidden = send(outdoor, { type: "APP_HIDE" }).state;
  const failedWhileHidden = send(hidden, {
    type: "OUTDOOR_LOAD_FAILED",
    message: "夜空资源暂时没有准备好",
  }).state;
  assert.equal(failedWhileHidden.overlayBeforePause, "loading-error");
  assert.equal(send(failedWhileHidden, { type: "APP_SHOW" }).state.overlay, "loading-error");
});

test("enters and finishes a night session without treating the outdoor scene as progress", () => {
  const loading = reachIndoorLoading();
  assert.equal(loading.phase, "indoor-loading");
  assert.equal("completedNightIds" in loading, false);

  const loaded = send(loading, { type: "INDOOR_LOADED" });
  assert.equal(loaded.state.phase, "night-session");

  const finished = send(loaded.state, { type: "NIGHT_FINISHED" });
  assert.equal(finished.state.phase, "finished-summary");

  const impossibleOutdoorFinish = send(reachOutdoor(), { type: "NIGHT_FINISHED" });
  assert.equal(impossibleOutdoorFinish.state.phase, "outdoor-ready");
  assert.deepEqual(impossibleOutdoorFinish.effects, []);
});

test("keeps an indoor loading error recoverable and retries only once it is visible", () => {
  const loading = reachIndoorLoading();
  const failed = send(loading, {
    type: "INDOOR_LOAD_FAILED",
    message: "室内资源暂时没有准备好",
  });

  assert.equal(failed.state.phase, "indoor-loading");
  assert.equal(failed.state.overlay, "loading-error");
  assert.equal(failed.state.loadingErrorMessage, "室内资源暂时没有准备好");

  const cannotOverwrite = send(failed.state, { type: "OPEN_SETTINGS" });
  assert.strictEqual(cannotOverwrite.state, failed.state);

  const retry = send(failed.state, { type: "RETRY_INDOOR_LOAD" });
  assert.equal(retry.state.overlay, "none");
  assert.equal(retry.state.loadingErrorMessage, null);
  assert.deepEqual(retry.effects, [{ type: "LOAD_INDOOR_NIGHT" }]);

  const duplicateRetry = send(retry.state, { type: "RETRY_INDOOR_LOAD" });
  assert.strictEqual(duplicateRetry.state, retry.state);
});

test("preserves a loading failure that arrives while the app is hidden", () => {
  const hidden = send(reachIndoorLoading(), { type: "APP_HIDE" }).state;
  const failed = send(hidden, {
    type: "INDOOR_LOAD_FAILED",
    message: "加载中断",
  });

  assert.equal(failed.state.overlay, "paused");
  assert.equal(failed.state.overlayBeforePause, "loading-error");

  const shown = send(failed.state, { type: "APP_SHOW" });
  assert.equal(shown.state.overlay, "loading-error");
  assert.equal(shown.state.loadingErrorMessage, "加载中断");
});

test("settings is non-destructive and cannot replace a stronger overlay", () => {
  const outdoor = reachOutdoor();
  const opened = send(outdoor, { type: "OPEN_SETTINGS" });
  assert.equal(opened.state.overlay, "settings");

  const nestedOpen = send(opened.state, { type: "OPEN_SHARE_PREVIEW" });
  assert.strictEqual(nestedOpen.state, opened.state);

  const interrupted = send(opened.state, { type: "AUDIO_INTERRUPTED" });
  assert.strictEqual(interrupted.state, opened.state);

  const closed = send(opened.state, { type: "CLOSE_SETTINGS" });
  assert.equal(closed.state.overlay, "none");
  assert.equal(closed.state.phase, "outdoor-ready");
});

test("returns a failed share directly to the quiet ending without losing progress", () => {
  let state = reachNightSession();
  state = send(state, { type: "NIGHT_FINISHED" }).state;
  state = send(state, { type: "OPEN_SHARE_PREVIEW" }).state;
  assert.equal(state.overlay, "share-preview");

  const failed = send(state, { type: "SHARE_FAILED", message: "分享没有发出去" });
  assert.equal(failed.state.overlay, "share-failed");
  assert.equal(failed.state.shareErrorMessage, "分享没有发出去");

  const cannotReplaceFailure = send(failed.state, { type: "OPEN_SETTINGS" });
  assert.strictEqual(cannotReplaceFailure.state, failed.state);

  const dismissed = send(failed.state, { type: "DISMISS_SHARE_FAILED" });
  assert.equal(dismissed.state.overlay, "none");
  assert.equal(dismissed.state.shareErrorMessage, null);
  assert.equal(dismissed.state.phase, "finished-summary");

  const retryPreview = send(dismissed.state, { type: "OPEN_SHARE_PREVIEW" });
  assert.equal(retryPreview.state.overlay, "share-preview");
});

test("keeps a failed completion save visible and retryable across backgrounding", () => {
  const night = reachNightSession();
  const failed = send(night, {
    type: "SAVE_FAILED",
    message: "今晚的进度暂时没有存好",
  }).state;
  assert.equal(failed.overlay, "save-error");
  assert.equal(failed.saveErrorMessage, "今晚的进度暂时没有存好");

  const hidden = send(failed, { type: "APP_HIDE" }).state;
  assert.equal(hidden.overlay, "paused");
  assert.equal(hidden.overlayBeforePause, "save-error");

  const retriedWhileHidden = send(hidden, { type: "SAVE_SUCCEEDED" }).state;
  assert.equal(retriedWhileHidden.overlay, "paused");
  assert.equal(retriedWhileHidden.overlayBeforePause, "none");
  assert.equal(retriedWhileHidden.saveErrorMessage, null);
  assert.equal(send(retriedWhileHidden, { type: "APP_SHOW" }).state.overlay, "none");

  const retriedInPlace = send(failed, { type: "SAVE_SUCCEEDED" }).state;
  assert.equal(retriedInPlace.overlay, "none");
  assert.equal(retriedInPlace.saveErrorMessage, null);
});

test("records share callbacks that arrive while WeChat has the game hidden", () => {
  let sharing = send(reachNightSession(), { type: "NIGHT_FINISHED" }).state;
  sharing = send(sharing, { type: "OPEN_SHARE_PREVIEW" }).state;

  const hiddenForSuccess = send(sharing, { type: "APP_HIDE" }).state;
  const succeeded = send(hiddenForSuccess, { type: "CLOSE_SHARE_PREVIEW" }).state;
  assert.equal(succeeded.overlay, "paused");
  assert.equal(succeeded.overlayBeforePause, "none");
  assert.equal(send(succeeded, { type: "APP_SHOW" }).state.overlay, "none");

  const hiddenForFailure = send(sharing, { type: "APP_HIDE" }).state;
  const failed = send(hiddenForFailure, {
    type: "SHARE_FAILED",
    message: "分享没有发出去",
  }).state;
  assert.equal(failed.overlay, "paused");
  assert.equal(failed.overlayBeforePause, "share-failed");
  const shown = send(failed, { type: "APP_SHOW" }).state;
  assert.equal(shown.overlay, "share-failed");
  assert.equal(shown.shareErrorMessage, "分享没有发出去");
});

test("audio interruption has an explicit exit and cannot overwrite another overlay", () => {
  const outdoor = reachOutdoor();
  const silentOutdoor = send(outdoor, { type: "AUDIO_INTERRUPTED" });
  assert.strictEqual(silentOutdoor.state, outdoor);

  const night = reachNightSession();
  const interrupted = send(night, { type: "AUDIO_INTERRUPTED" });
  assert.equal(interrupted.state.overlay, "audio-interrupted");

  const cannotOpenSettings = send(interrupted.state, { type: "OPEN_SETTINGS" });
  assert.strictEqual(cannotOpenSettings.state, interrupted.state);

  const resumed = send(interrupted.state, { type: "AUDIO_RESUMED" });
  assert.equal(resumed.state.overlay, "none");
  assert.equal(resumed.state.phase, "night-session");
});

test("clears an audio interruption that ends while the game remains hidden", () => {
  const interrupted = send(reachNightSession(), { type: "AUDIO_INTERRUPTED" }).state;
  const hidden = send(interrupted, { type: "APP_HIDE" }).state;
  assert.equal(hidden.overlay, "paused");
  assert.equal(hidden.overlayBeforePause, "audio-interrupted");

  const endedInBackground = send(hidden, { type: "AUDIO_RESUMED" }).state;
  assert.equal(endedInBackground.overlay, "paused");
  assert.equal(endedInBackground.overlayBeforePause, "none");

  const shown = send(endedInBackground, { type: "APP_SHOW" }).state;
  assert.equal(shown.overlay, "none");
});

test("background pause restores loading, sharing and audio overlays exactly", () => {
  const loadingError = send(reachIndoorLoading(), {
    type: "INDOOR_LOAD_FAILED",
    message: "加载失败",
  }).state;

  let finished = send(reachNightSession(), { type: "NIGHT_FINISHED" }).state;
  finished = send(finished, { type: "OPEN_SHARE_PREVIEW" }).state;
  const shareFailed = send(finished, {
    type: "SHARE_FAILED",
    message: "分享失败",
  }).state;

  const audioInterrupted = send(reachNightSession(), { type: "AUDIO_INTERRUPTED" }).state;

  for (const original of [loadingError, shareFailed, audioInterrupted]) {
    const hidden = send(original, { type: "APP_HIDE" }).state;
    assert.equal(hidden.overlay, "paused");
    assert.equal(hidden.overlayBeforePause, original.overlay);

    const shown = send(hidden, { type: "APP_SHOW" }).state;
    assert.equal(shown.overlay, original.overlay);
    assert.equal(shown.overlayBeforePause, null);
    assert.equal(shown.phase, original.phase);
  }
});

test("returns an active or finished night to the outdoor safe state without completing progress", () => {
  const active = send(reachNightSession(), { type: "RETURN_TO_OUTDOOR" });
  assert.equal(active.state.phase, "outdoor-ready");
  assert.equal(active.state.overlay, "none");
  assert.deepEqual(active.effects, []);

  let finished = send(reachNightSession(), { type: "NIGHT_FINISHED" }).state;
  finished = send(finished, { type: "OPEN_SHARE_PREVIEW" }).state;
  const blockedByShare = send(finished, { type: "RETURN_TO_OUTDOOR" });
  assert.strictEqual(blockedByShare.state, finished);

  const paused = send(reachNightSession(), { type: "APP_HIDE" }).state;
  const leftWhilePaused = send(paused, { type: "RETURN_TO_OUTDOOR" });
  assert.equal(leftWhilePaused.state.phase, "outdoor-ready");
  assert.equal(leftWhilePaused.state.overlay, "none");
});
