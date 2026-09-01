import test from "node:test";
import assert from "node:assert/strict";
import {
  SHARE_ENTRY_QUERY,
  SHARE_TITLE,
  createSharePayload,
  resolveLaunchIntent,
} from "../assets/scripts/core/sharing.ts";

test("creates a fixed identity-free share payload", () => {
  assert.deepEqual(createSharePayload(), {
    title: SHARE_TITLE,
    query: SHARE_ENTRY_QUERY,
  });
});

test("opens the shared welcome without consuming sender data or progress", () => {
  const intent = resolveLaunchIntent({
    entry: "left-light",
    senderName: "must-be-ignored",
    completedNightIds: ["night-05"],
    message: "must-be-ignored",
  });

  assert.deepEqual(intent, { kind: "shared-welcome", message: SHARE_TITLE });
  assert.deepEqual(resolveLaunchIntent({ entry: "other" }), { kind: "normal" });
});

