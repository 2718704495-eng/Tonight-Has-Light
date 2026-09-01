import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureWechatSubpackageEntries } from "../scripts/prepare-wechat-subpackage-entries.mjs";

test("adds a non-destructive index.js compatibility entry to every Cocos WeChat subpackage", () => {
  const root = mkdtempSync(join(tmpdir(), "tonight-wechat-subpackages-"));
  try {
    writeFileSync(
      join(root, "game.json"),
      JSON.stringify({
        subpackages: [
          { name: "indoor-n01-preview", root: "subpackages/indoor-n01-preview/" },
          { name: "night-02", root: "subpackages/night-02/" },
        ],
      }),
    );
    for (const name of ["indoor-n01-preview", "night-02"]) {
      const folder = join(root, "subpackages", name);
      mkdirSync(folder, { recursive: true });
      writeFileSync(join(folder, "game.js"), `globalThis.__loaded = "${name}";\n`);
    }

    const result = ensureWechatSubpackageEntries(root);
    assert.deepEqual(result.created.sort(), ["indoor-n01-preview", "night-02"]);
    assert.deepEqual(result.preserved, []);
    for (const name of ["indoor-n01-preview", "night-02"]) {
      assert.equal(
        readFileSync(join(root, "subpackages", name, "index.js"), "utf8"),
        'require("./game.js");\n',
      );
    }

    const second = ensureWechatSubpackageEntries(root);
    assert.deepEqual(second.created, []);
    assert.deepEqual(second.preserved.sort(), ["indoor-n01-preview", "night-02"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("refuses missing Cocos entries and subpackage roots that escape the build", () => {
  const root = mkdtempSync(join(tmpdir(), "tonight-wechat-subpackages-invalid-"));
  try {
    writeFileSync(
      join(root, "game.json"),
      JSON.stringify({ subpackages: [{ name: "bad", root: "../outside/" }] }),
    );
    assert.throws(() => ensureWechatSubpackageEntries(root), /outside the build root/);

    writeFileSync(
      join(root, "game.json"),
      JSON.stringify({ subpackages: [{ name: "missing", root: "subpackages/missing/" }] }),
    );
    mkdirSync(join(root, "subpackages", "missing"), { recursive: true });
    assert.throws(() => ensureWechatSubpackageEntries(root), /missing game\.js/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
