import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const prototypeRoot = join(root, "prototype/indoor-n01-v1");
const html = readFileSync(join(prototypeRoot, "index.html"), "utf8");
const css = readFileSync(join(prototypeRoot, "styles.css"), "utf8");
const js = readFileSync(join(prototypeRoot, "app.js"), "utf8");
const readme = readFileSync(join(prototypeRoot, "README.md"), "utf8");
const approvedImage = join(
  root,
  "design-board/formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png",
);

const approvedHash = createHash("sha256").update(readFileSync(approvedImage)).digest("hex");
assert.equal(
  approvedHash,
  "ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a",
  "prototype must consume the exact user-approved FORMAL-UI-V1.2-A reference",
);

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "prototype HTML must not contain duplicate ids");

for (const id of [...js.matchAll(/querySelector\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1])) {
  assert.ok(ids.includes(id), `prototype JS references missing #${id}`);
}

const externalReferences = `${html}\n${css}\n${js}`.match(/(?:src|href)=['"]https?:\/\/|url\(['"]?https?:\/\//g) || [];
assert.equal(externalReferences.length, 0, "disposable prototype must not depend on remote assets");

assert.ok(html.includes("formal-ui-v1-2-a-user-approved-reference-2026-08-24.png"));
assert.ok(html.includes('aria-live="polite"'));
assert.ok(html.includes('aria-live="assertive"'));
assert.match(css, /\.kettle-hotspot\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/);
assert.match(css, /\.cup-hotspot\s*\{[\s\S]*?min-width:\s*44px;[\s\S]*?min-height:\s*44px;/);
assert.ok(css.includes("prefers-reduced-motion: reduce"));
assert.ok(css.includes("--motion-fade: 180ms"), "reduced-motion crossfade must remain <= 200ms");
assert.ok(js.includes('query.get("reduced") === "1"'));
assert.ok(js.includes('query.get("sound") !== "0"'));
assert.ok(js.includes("createBufferSource"), "temporary steam sound must be procedural, not a shipped asset");
assert.ok(js.includes("kettleAnswer"));
assert.ok(js.includes("cupTap"));
assert.ok(js.includes("cupHotspot"));
assert.match(js, /cupHotspot\.addEventListener\("click"[\s\S]*?rightCup\(\)/);
assert.ok(js.includes('setPhase("responding", "cat")'));
assert.ok(js.includes('setPhase("responding", "righting")'));
assert.ok(js.includes('setPhase("settled", "quiet")'));
assert.ok(js.includes("}, 5180);"), "cup should naturally continue about 4s after the cat beat");
assert.ok(js.includes("壶里的水，正轻轻响着。"));
assert.ok(js.includes("水热了。\\n你也先缓一会儿。"));
assert.ok(readme.includes("不得进入正式 Cocos、微信小游戏包"));
assert.ok(!html.includes("lightOrb"), "superseded drag-light interaction must not enter this prototype");
assert.ok(!`${html}\n${css}\n${js}`.includes("cocos-project/assets"), "prototype runtime must stay isolated from formal Cocos assets");

console.log("✓ exact approved reference and disposable-asset boundary");
console.log("✓ kettle response, cup micro-scene and quiet ending contract");
console.log("✓ 44px input, silent equivalence and reduced-motion fallback");
