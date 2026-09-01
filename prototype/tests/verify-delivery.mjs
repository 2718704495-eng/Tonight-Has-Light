import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const html = readFileSync(join(root, "prototype/index.html"), "utf8");
const css = readFileSync(join(root, "prototype/styles.css"), "utf8");
const js = readFileSync(join(root, "prototype/app.js"), "utf8");
const board = readFileSync(join(root, "design-board/index.html"), "utf8");

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, "prototype HTML must not contain duplicate ids");

for (const id of [...js.matchAll(/\$\("#([A-Za-z0-9_-]+)"\)/g)].map((match) => match[1])) {
  assert.ok(ids.includes(id), `prototype JS references missing #${id}`);
}

assert.equal((js.match(/bundle:\s*"night-/g) || []).length, 5, "five night bundles are required");
assert.equal((js.match(/coreRitual:\s*"/g) || []).length, 5, "each night must define exactly one core ritual");
for (const title of ["水快开了", "被子里面", "雾窗上的月亮", "一盏灯就够了", "晚一点回来的人"]) {
  assert.ok(js.includes(title), `missing night title: ${title}`);
}

for (const requiredText of [
  "有人给你留了一盏灯",
  "再坐一会儿",
  "今晚到这里",
  "减少动态",
  "大字",
]) {
  assert.ok(html.includes(requiredText) || js.includes(requiredText), `missing required copy: ${requiredText}`);
}

assert.ok(css.includes("width: 44px") || css.includes("min-height: 44px"), "44px touch target baseline is required");
assert.ok(css.includes("prefers-reduced-motion"), "system reduced-motion support is required");
assert.ok(html.includes('aria-live="polite"'), "polite live region is required");
assert.ok(html.includes('aria-live="assertive"'), "assertive live region is required");
assert.ok(js.includes('toggleAttribute("inert"'), "modal backgrounds must be made inert");
assert.ok(js.includes('event.key === "Tab" && activeSheet'), "modal focus must remain inside the active sheet");
assert.ok(js.includes('setAttribute("aria-pressed"'), "duration selection must expose its selected state");
assert.ok(js.includes('sheet.classList.add("is-open")'), "openSheet must mark the active sheet");
assert.ok(js.includes('sheet.classList.remove("is-open")'), "closeSheet must clear the active sheet");
assert.match(
  js,
  /function startAudioWithFallback\(\)[\s\S]*audio\.start\(\)\.catch[\s\S]*save\.settings\.sound = false/,
  "audio startup failures must fall back to a silent, persisted setting",
);
assert.match(css, /\.topbar h1\s*\{[\s\S]*?font-size:\s*16px;/, "topbar title size must remain design-token driven");
assert.ok(js.includes("new URLSearchParams(location.search)"), "share and recovery entry states must be URL-addressable");
assert.ok(!/nickname|avatar|openid|user(name|Id)|freeMessage|customMessage/i.test(js), "share/save logic must not carry identity or free-message fields");

const externalReferences = `${html}\n${css}`.match(/(?:src|href)=["']https?:\/\/|url\(["']?https?:\/\//g) || [];
assert.equal(externalReferences.length, 0, "prototype must not depend on remote assets");

assert.equal((board.match(/class="phone phone--/g) || []).length, 3, "design board must contain three phone masters");
assert.equal((board.match(/class="story-frame/g) || []).length, 18, "design board must contain 18 storyboard frames");
assert.match(
  js,
  /Number\(game\.dataset\.night\)[\s\S]*renderedNight !== 5[\s\S]*game\.classList\.add\("door-open", "is-warm"\)/,
  "fifth-night door must gate against the rendered scene and open visibly",
);
assert.match(
  js,
  /document\.addEventListener\(\s*"click"[\s\S]*?closest\("#doorInteraction"\)[\s\S]*?finishDoorNight\(\)[\s\S]*?true,\s*\)/,
  "fifth-night door must have a capture-phase click fallback for layered scene taps",
);
assert.match(css, /\.door\s*\{[\s\S]*?z-index:\s*18;/, "fifth-night door hit area must remain above the table");
assert.match(css, /\.game\[data-night="5"\]\s+\.door\s*\{[\s\S]*?pointer-events:\s*auto;/, "fifth-night door must receive pointer events only when active");
assert.ok(board.includes('class="lamp-fold"'), "design board lamp spirit must use the folded-page silhouette from the character bible");

console.log("✓ prototype structure and references");
console.log("✓ five-night content and fixed private-message sharing copy");
console.log("✓ accessibility and reduced-motion entry points");
console.log("✓ sheet state and fifth-night touch target guards");
console.log("✓ three visual masters and eighteen storyboard frames");
