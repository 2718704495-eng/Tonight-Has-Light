import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const sourceRoot = resolve(import.meta.dirname);
const outputRoot = resolve(import.meta.dirname, "../../cocos-project/assets/resources/formal-ending-ui-v1");
const assets = [
  { source: "wall-note.svg", uuid: "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a1", width: 460, height: 476 },
  { source: "table-paper.svg", uuid: "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a2", width: 724, height: 448 },
  { source: "action-paper.svg", uuid: "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a3", width: 652, height: 104 },
  { source: "note-peg.svg", uuid: "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a4", width: 40, height: 40 },
  { source: "surface-rule.svg", uuid: "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a5", width: 84, height: 4 },
];

function imageMeta(name, uuid, width, height) {
  return {
    ver: "1.0.27",
    importer: "image",
    imported: true,
    uuid,
    files: [".json", ".png"],
    subMetas: {
      "6c48a": {
        importer: "texture",
        uuid: `${uuid}@6c48a`,
        displayName: name,
        id: "6c48a",
        name: "texture",
        userData: {
          wrapModeS: "clamp-to-edge",
          wrapModeT: "clamp-to-edge",
          imageUuidOrDatabaseUri: uuid,
          isUuid: true,
          visible: false,
          minfilter: "linear",
          magfilter: "linear",
          mipfilter: "none",
          anisotropy: 0,
        },
        ver: "1.0.22",
        imported: true,
        files: [".json"],
        subMetas: {},
      },
      "f9941": {
        importer: "sprite-frame",
        uuid: `${uuid}@f9941`,
        displayName: name,
        id: "f9941",
        name: "spriteFrame",
        userData: {
          trimThreshold: 1,
          rotated: false,
          offsetX: 0,
          offsetY: 0,
          trimX: 0,
          trimY: 0,
          width,
          height,
          rawWidth: width,
          rawHeight: height,
          borderTop: 0,
          borderBottom: 0,
          borderLeft: 0,
          borderRight: 0,
          packable: true,
          pixelsToUnit: 100,
          pivotX: 0.5,
          pivotY: 0.5,
          meshType: 0,
          vertices: {
            rawPosition: [-width / 2, -height / 2, 0, width / 2, -height / 2, 0, -width / 2, height / 2, 0, width / 2, height / 2, 0],
            indexes: [0, 1, 2, 2, 1, 3],
            uv: [0, height, width, height, 0, 0, width, 0],
            nuv: [0, 0, 1, 0, 0, 1, 1, 1],
            minPos: [-width / 2, -height / 2, 0],
            maxPos: [width / 2, height / 2, 0],
          },
          isUuid: true,
          imageUuidOrDatabaseUri: `${uuid}@6c48a`,
          atlasUuid: "",
          trimType: "auto",
        },
        ver: "1.0.12",
        imported: true,
        files: [".json"],
        subMetas: {},
      },
    },
    userData: {
      type: "sprite-frame",
      fixAlphaTransparencyArtifacts: true,
      hasAlpha: true,
      redirect: `${uuid}@6c48a`,
    },
  };
}

await mkdir(outputRoot, { recursive: true });
for (const asset of assets) {
  const input = await readFile(resolve(sourceRoot, asset.source));
  const name = basename(asset.source, ".svg");
  const output = resolve(outputRoot, name + ".png");
  await sharp(input).png({ compressionLevel: 9, palette: true }).toFile(output);
  await writeFile(
    output + ".meta",
    JSON.stringify(imageMeta(name, asset.uuid, asset.width, asset.height), null, 2) + "\n",
  );
}
