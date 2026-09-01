import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadSharp } from './sharp-loader.mjs';
import { PACKAGE_ROOT, PROJECT_ROOT, readPngMetadata, sha256File } from './package-utils.mjs';

export const H4_STATES = Object.freeze(['none', 'ate', 'sipped', 'both']);
export const H4_RESPONSE_MS = 180;
export const H4_ACTION_WRITES = Object.freeze(['h4State']);

const PAGE_ROOT = resolve(PACKAGE_ROOT, 'pages/scene_01_home_shot_004');
const CLEAN_PLATE = resolve(PAGE_ROOT, 'exports/390x844/scene_01_home_shot_004.png');
const SOURCE_ROOT = resolve(PAGE_ROOT, 'source/response-layers');
const STATE_ROOT = resolve(PAGE_ROOT, 'exports/states');
const EVIDENCE_ROOT = resolve(PAGE_ROOT, 'evidence');

const RESPONSE_LAYERS = Object.freeze({
  ate: Object.freeze({
    source: resolve(SOURCE_ROOT, 'ate.svg'),
    output: resolve(STATE_ROOT, 'ate-layer-390x844.png'),
    roi: Object.freeze({ x: 154, y: 366, width: 132, height: 122 }),
  }),
  sipped: Object.freeze({
    source: resolve(SOURCE_ROOT, 'sipped.svg'),
    output: resolve(STATE_ROOT, 'sipped-layer-390x844.png'),
    roi: Object.freeze({ x: 294, y: 366, width: 78, height: 96 }),
  }),
});

const STATE_LAYERS = Object.freeze({
  none: Object.freeze([]),
  ate: Object.freeze(['ate']),
  sipped: Object.freeze(['sipped']),
  both: Object.freeze(['ate', 'sipped']),
});

function statePath(state) {
  return resolve(STATE_ROOT, `scene_01_home_shot_004-${state}-390x844.png`);
}

function assertKnownState(state) {
  if (!H4_STATES.includes(state)) throw new Error(`Unknown H4 state: ${state}`);
}

export function applyH4Action(state, action) {
  assertKnownState(state);
  if (action !== 'eat' && action !== 'sip') throw new Error(`Unknown H4 action: ${action}`);

  const ate = state === 'ate' || state === 'both' || action === 'eat';
  const sipped = state === 'sipped' || state === 'both' || action === 'sip';
  if (ate && sipped) return 'both';
  return ate ? 'ate' : 'sipped';
}

function insideRoi(x, y, roi) {
  return x >= roi.x && x < roi.x + roi.width && y >= roi.y && y < roi.y + roi.height;
}

function insideAnyResponseRoi(x, y) {
  return Object.values(RESPONSE_LAYERS).some(({ roi }) => insideRoi(x, y, roi));
}

async function rawRgba(sharp, filePath) {
  return sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function rgbaPixelsDiffer(a, b, offset) {
  return a[offset] !== b[offset]
    || a[offset + 1] !== b[offset + 1]
    || a[offset + 2] !== b[offset + 2]
    || a[offset + 3] !== b[offset + 3];
}

async function validateLayer(sharp, layer) {
  const svgSource = await readFile(layer.source, 'utf8');
  const { data, info } = await rawRgba(sharp, layer.output);
  let nonTargetAlphaPixels = 0;
  let transparentColoredPixels = 0;
  let visiblePixels = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const alpha = data[offset + 3];
      if (alpha > 0) {
        visiblePixels += 1;
        if (!insideRoi(x, y, layer.roi)) nonTargetAlphaPixels += 1;
      } else if (data[offset] !== 0 || data[offset + 1] !== 0 || data[offset + 2] !== 0) {
        transparentColoredPixels += 1;
      }
    }
  }

  if (visiblePixels === 0) throw new Error(`Response layer is empty: ${layer.output}`);
  if (nonTargetAlphaPixels !== 0) throw new Error(`Response layer escapes its ROI: ${layer.output}`);
  if (transparentColoredPixels !== 0) throw new Error(`Response layer contains hidden RGB background pixels: ${layer.output}`);

  return {
    sourceSvgPath: layer.source,
    sourceSvgSha256: await sha256File(layer.source),
    pngPath: layer.output,
    pngSha256: await sha256File(layer.output),
    roi: layer.roi,
    alphaEncoding: 'straight',
    metadata: await readPngMetadata(layer.output),
    visiblePixels,
    nonTargetAlphaPixels,
    transparentColoredPixels,
    checkerboardDetected: /checker(?:board)?|#(?:fff|ffffff).+#(?:ccc|cccccc)/is.test(svgSource),
    backgroundGhostDetected: transparentColoredPixels !== 0,
  };
}

async function countChangedPixelsOutsideUnion(sharp, baseRaw, outputPath) {
  const outputRaw = await rawRgba(sharp, outputPath);
  if (baseRaw.info.width !== outputRaw.info.width || baseRaw.info.height !== outputRaw.info.height) {
    throw new Error(`State dimensions do not match clean plate: ${outputPath}`);
  }

  let changedPixelsOutsideUnionRoi = 0;
  let totalChangedPixels = 0;
  for (let y = 0; y < baseRaw.info.height; y += 1) {
    for (let x = 0; x < baseRaw.info.width; x += 1) {
      const offset = (y * baseRaw.info.width + x) * baseRaw.info.channels;
      if (!rgbaPixelsDiffer(baseRaw.data, outputRaw.data, offset)) continue;
      totalChangedPixels += 1;
      if (!insideAnyResponseRoi(x, y)) changedPixelsOutsideUnionRoi += 1;
    }
  }
  return { totalChangedPixels, changedPixelsOutsideUnionRoi };
}

function pixelAt(raw, x, y) {
  const safeX = Math.max(0, Math.min(raw.info.width - 1, Math.round(x)));
  const safeY = Math.max(0, Math.min(raw.info.height - 1, Math.round(y)));
  const offset = (safeY * raw.info.width + safeX) * raw.info.channels;
  return [raw.data[offset], raw.data[offset + 1], raw.data[offset + 2]];
}

function averagePixels(raw, samples) {
  const total = [0, 0, 0];
  for (const [x, y] of samples) {
    const pixel = pixelAt(raw, x, y);
    total[0] += pixel[0];
    total[1] += pixel[1];
    total[2] += pixel[2];
  }
  return total.map((channel) => Math.round(channel / samples.length));
}

function maskRole(mask, offset) {
  const [red, green, blue] = [mask.data[offset], mask.data[offset + 1], mask.data[offset + 2]];
  if (red >= green && red >= blue) return 'red';
  if (green >= red && green >= blue) return 'green';
  return 'blue';
}

function buildInpaintRepair(mask, baseRaw) {
  const { width, height } = baseRaw.info;
  const pixels = Buffer.from(baseRaw.data);
  const unknown = new Uint8Array(width * height);
  const known = new Uint8Array(width * height);
  let remaining = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const offset = pixelIndex * 4;
      const shouldRepair = mask.data[offset + 3] > 0 && maskRole(mask, offset) === 'red';
      unknown[pixelIndex] = shouldRepair ? 1 : 0;
      known[pixelIndex] = shouldRepair ? 0 : 1;
      if (shouldRepair) remaining += 1;
    }
  }

  const neighbors = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
  while (remaining > 0) {
    const frontier = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x;
        if (!unknown[pixelIndex]) continue;
        const values = [];
        for (const [dx, dy] of neighbors) {
          const neighborIndex = (y + dy) * width + (x + dx);
          if (known[neighborIndex]) values.push(pixelAt({ data: pixels, info: baseRaw.info }, x + dx, y + dy));
        }
        if (values.length < 2) continue;
        const value = [0, 1, 2].map((channel) => Math.round(
          values.reduce((sum, pixel) => sum + pixel[channel], 0) / values.length,
        ));
        frontier.push({ pixelIndex, value });
      }
    }
    if (frontier.length === 0) throw new Error('Editable erase geometry contains an unfillable region');
    for (const { pixelIndex, value } of frontier) {
      const offset = pixelIndex * 4;
      pixels[offset] = value[0];
      pixels[offset + 1] = value[1];
      pixels[offset + 2] = value[2];
      known[pixelIndex] = 1;
      unknown[pixelIndex] = 0;
      remaining -= 1;
    }
  }
  return { data: pixels, info: baseRaw.info };
}

function replacementPixel(name, role, baseRaw, redRepair, x, y, plateInk) {
  if (name === 'ate') {
    if (role === 'blue') {
      const grain = ((x * 13 + y * 7) % 9) - 4;
      return [96 + grain, 38 + Math.round(grain * 0.45), 1];
    }
    if (role === 'green') {
      const original = pixelAt(baseRaw, x, y);
      return original.map((channel, index) => Math.round(plateInk[index] * 0.72 + channel * 0.28));
    }
    const grain = ((x * 11 + y * 5) % 7) - 3;
    return [52 + grain, 21 + Math.round(grain * 0.35), 0];
  }

  if (role === 'blue') return pixelAt(baseRaw, x + 4, y - 2);
  if (role === 'green') {
    const water = pixelAt(baseRaw, x + 4, y - 9);
    return water.map((channel, index) => Math.round(channel * (index === 0 ? 0.76 : 0.7)));
  }
  return pixelAt(redRepair, x, y);
}

async function renderLayer(sharp, name, layer, baseRaw) {
  const mask = await sharp(layer.source, { density: 72 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (mask.info.width !== baseRaw.info.width || mask.info.height !== baseRaw.info.height) {
    throw new Error(`Response geometry dimensions do not match H4 clean plate: ${layer.source}`);
  }

  const plateInk = averagePixels(baseRaw, [
    [181, 419], [187, 431], [268, 416], [260, 436], [203, 440], [246, 441],
  ]);
  const redRepair = buildInpaintRepair(mask, baseRaw);
  const output = Buffer.alloc(baseRaw.info.width * baseRaw.info.height * 4);
  for (let y = 0; y < baseRaw.info.height; y += 1) {
    for (let x = 0; x < baseRaw.info.width; x += 1) {
      const offset = (y * baseRaw.info.width + x) * 4;
      const alpha = mask.data[offset + 3];
      if (alpha === 0) continue;
      const replacement = replacementPixel(
        name,
        maskRole(mask, offset),
        baseRaw,
        redRepair,
        x,
        y,
        plateInk,
      );
      output[offset] = replacement[0];
      output[offset + 1] = replacement[1];
      output[offset + 2] = replacement[2];
      output[offset + 3] = alpha;
    }
  }

  await sharp(output, { raw: { width: baseRaw.info.width, height: baseRaw.info.height, channels: 4 } })
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(layer.output);
}

async function composeState(sharp, state) {
  const output = statePath(state);
  const layers = STATE_LAYERS[state];
  if (layers.length === 0) {
    await copyFile(CLEAN_PLATE, output);
    return output;
  }
  await sharp(CLEAN_PLATE)
    .composite(layers.map((name) => ({ input: RESPONSE_LAYERS[name].output, blend: 'over' })))
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(output);
  return output;
}

function labelSvg(label) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="195" height="24"><rect width="195" height="24" fill="#f2dfbf"/><text x="10" y="17" fill="#3b2412" font-size="12" font-family="sans-serif">${label}</text></svg>`);
}

async function buildReviewBoard(sharp, states) {
  const boardPath = resolve(EVIDENCE_ROOT, 'h4-response-states-2x2.png');
  const cells = [];
  const labels = { none: 'NONE', ate: 'ATE', sipped: 'SIPPED', both: 'BOTH' };
  for (const [index, state] of H4_STATES.entries()) {
    const left = index % 2 === 0 ? 10 : 215;
    const top = index < 2 ? 10 : 466;
    const image = await sharp(states[state].path).resize(195, 422, { fit: 'fill' }).png().toBuffer();
    cells.push({ input: labelSvg(labels[state]), left, top });
    cells.push({ input: image, left, top: top + 24 });
  }
  await sharp({ create: { width: 420, height: 912, channels: 3, background: '#24170f' } })
    .composite(cells)
    .png({ compressionLevel: 9 })
    .toFile(boardPath);
  return {
    path: boardPath,
    sha256: await sha256File(boardPath),
    metadata: await readPngMetadata(boardPath),
  };
}

function projectRelative(filePath) {
  return relative(PROJECT_ROOT, filePath);
}

function portable(value) {
  if (Array.isArray(value)) return value.map(portable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, portable(item)]));
  }
  if (typeof value === 'string' && value.startsWith(`${PROJECT_ROOT}/`)) return projectRelative(value);
  return value;
}

export async function composeH4States() {
  const sharp = await loadSharp();
  await mkdir(SOURCE_ROOT, { recursive: true });
  await mkdir(STATE_ROOT, { recursive: true });
  await mkdir(EVIDENCE_ROOT, { recursive: true });

  const baseRaw = await rawRgba(sharp, CLEAN_PLATE);
  for (const [name, layer] of Object.entries(RESPONSE_LAYERS)) await renderLayer(sharp, name, layer, baseRaw);
  const layers = Object.fromEntries(await Promise.all(
    Object.entries(RESPONSE_LAYERS).map(async ([name, layer]) => [name, await validateLayer(sharp, layer)]),
  ));

  const states = {};
  for (const state of H4_STATES) {
    const output = await composeState(sharp, state);
    const diff = await countChangedPixelsOutsideUnion(sharp, baseRaw, output);
    if (diff.changedPixelsOutsideUnionRoi !== 0) {
      throw new Error(`State ${state} changes pixels outside the declared response ROIs`);
    }
    if (state !== 'none' && diff.totalChangedPixels === 0) throw new Error(`State ${state} has no visible response`);
    states[state] = {
      path: output,
      sha256: await sha256File(output),
      metadata: await readPngMetadata(output),
      layers: STATE_LAYERS[state],
      ...diff,
    };
  }

  const cleanPlateSha256 = await sha256File(CLEAN_PLATE);
  if (states.none.sha256 !== cleanPlateSha256) throw new Error('The none state must be byte-identical to the approved H4 clean plate');

  const reviewBoard = await buildReviewBoard(sharp, states);
  const report = {
    schemaVersion: 1,
    status: 'PASS / H4 RESPONSE STATES BUILT',
    deterministic: true,
    cleanPlate: {
      path: CLEAN_PLATE,
      sha256: cleanPlateSha256,
      metadata: await readPngMetadata(CLEAN_PLATE),
    },
    stateOrder: H4_STATES,
    responseMs: H4_RESPONSE_MS,
    writes: H4_ACTION_WRITES,
    completionEffects: { story: false, night: false, reward: false, unlock: false },
    layers,
    states,
    reviewBoard,
    validation: {
      changedPixelsOutsideUnionRoi: Math.max(...Object.values(states).map((state) => state.changedPixelsOutsideUnionRoi)),
      bothUsesOnlyDeclaredLayers: states.both.layers.join(',') === 'ate,sipped',
      generatedResponseContent: false,
      editableSvgSources: true,
      method: 'approved clean-plate pixel reuse constrained by editable SVG edit geometry',
      transparentBackground: true,
    },
  };

  const reportPath = resolve(EVIDENCE_ROOT, 'h4-response-state-report.json');
  await writeFile(reportPath, `${JSON.stringify(portable(report), null, 2)}\n`, 'utf8');
  report.reportPath = reportPath;
  report.reportSha256 = await sha256File(reportPath);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await composeH4States();
  process.stdout.write(`${JSON.stringify(portable(report), null, 2)}\n`);
}
