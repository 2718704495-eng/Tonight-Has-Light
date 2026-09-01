import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSharp } from '../../formal-picturebook-fullframe-v1-a-batch1/scripts/sharp-loader.mjs';

const sharp = loadSharp();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const candidateRoot = path.resolve(scriptDir, '..');
const source = path.join(candidateRoot, 'source/masters/scene_01_home_shot_005-wide-room-master-2x.png');
const outputDir = path.join(candidateRoot, 'evidence/tone-previews');

const variants = [
  { id: 'a-current', apply: (pipeline) => pipeline },
  { id: 'b-gamma-116', apply: (pipeline) => pipeline.gamma(1.16) },
  { id: 'c-gamma-122', apply: (pipeline) => pipeline.gamma(1.22) },
];

await mkdir(outputDir, { recursive: true });
for (const variant of variants) {
  const pipeline = variant.apply(sharp(source).resize(390, 844, { fit: 'fill' }));
  await pipeline
    .ensureAlpha(1)
    .withIccProfile('srgb')
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(path.join(outputDir, `${variant.id}-390x844.png`));
}

process.stdout.write(`${JSON.stringify({ source, variants: variants.map(({ id }) => id), outputDir }, null, 2)}\n`);
