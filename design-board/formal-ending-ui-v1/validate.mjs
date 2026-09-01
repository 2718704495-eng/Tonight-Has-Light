import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const files = ["index.html", "styles.css", "script.js", "README.md"];
const content = Object.fromEntries(files.map((file) => [file, readFileSync(join(root, file), "utf8")]));
const combined = Object.values(content).join("\n");

const checks = [
  ["status is explicit", content["index.html"].includes("BLOCKED · AWAITING USER APPROVAL · DESIGN BOARD ONLY · NOT FOR BUILD")],
  ["approved room is referenced", content["script.js"].includes("../formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png")],
  ["all seven preview states exist", ["a-ending", "a-summary", "b-ending", "b-summary", "b-large", "share", "failure"].every((key) => content["script.js"].includes(`\"${key}\"`) || content["script.js"].includes(`${key}:`))],
  ["ending copy exists", combined.includes("水热了。你也先缓一会儿。")],
  ["summary copy exists", combined.includes("这一夜，先放在这里。")],
  ["share copy exists", combined.includes("有人给你留了一盏灯")],
  ["failure copy exists", combined.includes("这次没有发出去。")],
  ["touch target is at least 44px", /min-height:\s*(44|4[5-9]|[5-9][0-9])px/.test(content["styles.css"])],
  ["adjacent actions use at least 8px gap", /\.action-row[\s\S]*?gap:\s*10px/.test(content["styles.css"])],
  ["large type is 120 percent", content["styles.css"].includes("--type-scale: 1.2")],
  ["reduced motion is implemented", content["styles.css"].includes("prefers-reduced-motion: reduce")],
  ["no external font import", !/@import|fonts\.googleapis|@font-face/.test(content["styles.css"])],
  ["no emoji structural icons", !/[\u{1F300}-\u{1FAFF}]/u.test(combined)],
];

let failures = 0;
for (const [label, pass] of checks) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`);
  if (!pass) failures += 1;
}

console.log(`\n${checks.length - failures}/${checks.length} checks passed`);
process.exitCode = failures ? 1 : 0;
