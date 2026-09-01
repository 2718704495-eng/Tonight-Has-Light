import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const sourceRoot = resolve(import.meta.dirname);
const outputRoot = resolve(
  import.meta.dirname,
  "../../cocos-project/assets/resources/formal-session-controls-v1",
);

await mkdir(outputRoot, { recursive: true });
const input = await readFile(resolve(sourceRoot, "selection-ring.svg"));
await sharp(input)
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(outputRoot, "selection-ring.png"));
