import assert from "node:assert/strict";
import test from "node:test";

import { envelopeProgress } from "../audio-envelope.mjs";

test("audio envelope reaches the full target instead of stopping at one percent", () => {
  assert.equal(envelopeProgress(1_000, 1_000, 350), 0);
  assert.equal(envelopeProgress(1_175, 1_000, 350), 0.5);
  assert.equal(envelopeProgress(1_350, 1_000, 350), 1);
  assert.equal(envelopeProgress(2_000, 1_000, 350), 1);
});

