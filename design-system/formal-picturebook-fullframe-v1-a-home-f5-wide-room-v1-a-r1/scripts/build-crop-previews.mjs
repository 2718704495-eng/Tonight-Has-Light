import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from '../../formal-picturebook-fullframe-v1-a-batch1/scripts/sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(scriptDir, '..');
const source = path.join(candidateRoot, 'source/raw/scene_01_home_shot_005-wide-room-imagegen-r1.png');
const outputDir = path.join(candidateRoot, 'evidence/crop-previews');

const variants = [
  { id: 'a-roomwide', left: 36, top: 0, width: 780, height: 1688 },
  { id: 'b-threshold-thin', left: 48, top: 0, width: 748, height: 1618 },
  { id: 'c-warm-floor', left: 60, top: 0, width: 720, height: 1558 },
];

await mkdir(outputDir, { recursive: true });

for (const variant of variants) {
  const output = path.join(outputDir, `${variant.id}-390x844.png`);
  await sharp(source)
    .extract({
      left: variant.left,
      top: variant.top,
      width: variant.width,
      height: variant.height,
    })
    .resize(390, 844, { fit: 'fill' })
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(output);
}

process.stdout.write(`${JSON.stringify({ source, variants, outputDir }, null, 2)}\n`);
