import test from "node:test";
import assert from "node:assert/strict";
import {
  NIGHT_DEFINITIONS,
  getNextNightId,
  getNightDefinition,
  validateNightDefinitions,
} from "../assets/scripts/content/nights.ts";

test("defines the five locked nights in linear order", () => {
  assert.deepEqual(
    NIGHT_DEFINITIONS.map((night) => night.title),
    ["水快开了", "被子里面", "雾窗上的月亮", "一盏灯就够了", "晚一点回来的人"],
  );
  assert.deepEqual(validateNightDefinitions(), []);
  assert.equal(getNightDefinition("night-01").assetBundle, "main");
  assert.equal(getNightDefinition("night-05").assetBundle, "night-05");
});

test("returns only the next linear night", () => {
  assert.equal(getNextNightId("night-01"), "night-02");
  assert.equal(getNextNightId("night-04"), "night-05");
  assert.equal(getNextNightId("night-05"), null);
});

