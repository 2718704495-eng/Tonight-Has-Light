import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, copyFileSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const runtimeRoot = '/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { createCanvas, Path2D, loadImage, GlobalFonts } = require(join(runtimeRoot, '@napi-rs/canvas'));
const sharp = require(join(runtimeRoot, 'sharp'));

const scriptDir = dirname(fileURLToPath(import.meta.url));
const candidateRoot = resolve(scriptDir, '..');
const projectRoot = resolve(candidateRoot, '../../..');
const referencePath = join(projectRoot, 'design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png');
const out = {
  source: join(candidateRoot, 'source'),
  layers: join(candidateRoot, 'source/layers'),
  oraStage: join(candidateRoot, 'source/.ora-stage'),
  exports: join(candidateRoot, 'exports'),
  overlays: join(candidateRoot, 'exports/safe-area-overlays'),
  review: join(candidateRoot, 'review'),
  evidence: join(candidateRoot, 'evidence'),
};

const LOGICAL_W = 390;
const LOGICAL_H = 844;
const SCALE = 2;
const SOURCE_W = LOGICAL_W * SCALE;
const SOURCE_H = LOGICAL_H * SCALE;
const CANDIDATE_ID = 'B01-FORMAL-PILOT-V1-R1';
const palette = {
  inkIndigo: '#06182F',
  paperBlue: '#173B57',
  greyTeal: '#4E7380',
  coolPaper: '#91A5AA',
  lampAmber: '#D3A05B',
  deepInk: '#041121',
  midInk: '#0D2942',
};

const loadLocalImage = async (path) => loadImage(await sharp(path).png().toBuffer());

function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = seeded(0xb010f0a1);
const pick = (min, max) => min + (max - min) * rnd();

function prepareDirectories() {
  const normalized = candidateRoot.replaceAll('\\', '/');
  if (!normalized.endsWith('/b01-formal-pilot-v1')) {
    throw new Error(`Refusing to prepare unexpected path: ${candidateRoot}`);
  }
  for (const dir of Object.values(out)) mkdirSync(dir, { recursive: true });
  rmSync(out.layers, { recursive: true, force: true });
  rmSync(out.oraStage, { recursive: true, force: true });
  mkdirSync(out.layers, { recursive: true });
  mkdirSync(join(out.oraStage, 'data'), { recursive: true });
  mkdirSync(join(out.oraStage, 'Thumbnails'), { recursive: true });
}

function newLayer(name) {
  const canvas = createCanvas(SOURCE_W, SOURCE_H);
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  return { name, canvas, ctx };
}

function pathFrom(commands) {
  const path = new Path2D();
  for (const command of commands) {
    const [op, ...args] = command;
    path[op](...args);
  }
  return path;
}

function fillPath(ctx, commands, fill, stroke = null, width = 1) {
  const path = pathFrom(commands);
  ctx.fillStyle = fill;
  ctx.fill(path);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
  }
  return path;
}

function dryStroke(ctx, points, color, width, alpha = 1, passes = 4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let pass = 0; pass < passes; pass += 1) {
    const jitterX = pick(-width * 0.11, width * 0.11);
    const jitterY = pick(-width * 0.09, width * 0.09);
    const path = new Path2D();
    path.moveTo(points[0][0] + jitterX, points[0][1] + jitterY);
    if (points.length === 4) {
      path.bezierCurveTo(
        points[1][0] + jitterX,
        points[1][1] + jitterY,
        points[2][0] + jitterX,
        points[2][1] + jitterY,
        points[3][0] + jitterX,
        points[3][1] + jitterY,
      );
    } else {
      for (let index = 1; index < points.length; index += 1) {
        path.lineTo(points[index][0] + jitterX, points[index][1] + jitterY);
      }
    }
    ctx.globalAlpha = alpha * pick(0.18, 0.42);
    ctx.lineWidth = width * pick(0.5, 1.08);
    if (pass % 2 === 1) ctx.setLineDash([pick(7, 16), pick(1, 4), pick(10, 22), pick(0.5, 3)]);
    else ctx.setLineDash([]);
    ctx.stroke(path);
  }
  ctx.restore();
}

function hatchInside(ctx, clipPath, bounds, color, count, direction = 1) {
  ctx.save();
  ctx.clip(clipPath);
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let index = 0; index < count; index += 1) {
    const x = pick(bounds.x, bounds.x + bounds.w);
    const y = pick(bounds.y, bounds.y + bounds.h);
    const length = pick(6, 24);
    ctx.globalAlpha = pick(0.09, 0.28);
    ctx.lineWidth = pick(0.35, 1.1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + direction * length, y - pick(2, 8));
    ctx.stroke();
  }
  ctx.restore();
}

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}

function drawSky(layer) {
  const { ctx } = layer;
  const gradient = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
  gradient.addColorStop(0, '#041428');
  gradient.addColorStop(0.48, '#08233C');
  gradient.addColorStop(0.78, '#0B2B46');
  gradient.addColorStop(1, '#071A31');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  for (let index = 0; index < 24; index += 1) {
    const y = pick(90, 635);
    dryStroke(ctx, [[-40, y], [80, y + pick(-25, 18)], [250, y + pick(-20, 24)], [430, y + pick(-12, 25)]], index % 3 ? '#173B57' : '#4E7380', pick(2, 8), pick(0.04, 0.09), 2);
  }
  for (let index = 0; index < 260; index += 1) {
    ctx.globalAlpha = pick(0.015, 0.05);
    ctx.fillStyle = rnd() > 0.5 ? '#91A5AA' : '#06182F';
    ctx.fillRect(pick(0, LOGICAL_W), pick(0, LOGICAL_H), pick(0.3, 1.4), pick(0.3, 1.2));
  }
  ctx.globalAlpha = 1;
}

function drawMilkyWay(layer) {
  const { ctx } = layer;
  const p0 = { x: 88, y: -35 };
  const p1 = { x: 92, y: 160 };
  const p2 = { x: 290, y: 260 };
  const p3 = { x: 425, y: 390 };
  const gaps = [[0.18, 0.235], [0.47, 0.535], [0.73, 0.79]];
  const isGap = (t) => gaps.some(([a, b]) => t >= a && t <= b);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let ribbon = 0; ribbon < 18; ribbon += 1) {
    const t0 = pick(0.01, 0.88);
    if (isGap(t0)) continue;
    const t1 = Math.min(1, t0 + pick(0.045, 0.16));
    const a = cubicPoint(p0, p1, p2, p3, t0);
    const b = cubicPoint(p0, p1, p2, p3, t1);
    const offset = pick(-26, 26);
    dryStroke(ctx, [[a.x + offset, a.y - offset * 0.55], [a.x + 12 + offset, a.y + 8 - offset * 0.55], [b.x - 12 + offset, b.y - 7 - offset * 0.55], [b.x + offset, b.y - offset * 0.55]], ribbon % 3 === 0 ? '#C0C2B8' : '#6E8993', pick(1.2, 4.5), pick(0.035, 0.08), 3);
  }
  for (let index = 0; index < 9200; index += 1) {
    const t = rnd();
    if (isGap(t) || rnd() < 0.11) continue;
    const center = cubicPoint(p0, p1, p2, p3, t);
    const width = 18 + 30 * Math.sin(Math.PI * t) + 13 * Math.sin(Math.PI * t * 3.1) ** 2;
    const offset = (rnd() - 0.5) * width * (0.45 + rnd());
    const angle = -0.7;
    const x = center.x + Math.cos(angle) * offset + pick(-8, 8);
    const y = center.y + Math.sin(angle) * offset + pick(-5, 5);
    const radius = pick(0.22, rnd() > 0.988 ? 1.55 : 0.92);
    ctx.globalAlpha = pick(0.045, 0.24) * Math.max(0.08, 1 - Math.abs(offset) / (width * 1.28));
    ctx.fillStyle = rnd() > 0.74 ? '#D7D3BF' : rnd() > 0.38 ? '#91A5AA' : '#4E7380';
    ctx.beginPath();
    ctx.ellipse(x, y, radius * pick(0.7, 1.5), radius, pick(-0.8, 0.8), 0, Math.PI * 2);
    ctx.fill();
  }
  for (let index = 0; index < 88; index += 1) {
    const t0 = pick(0.02, 0.92);
    if (isGap(t0)) continue;
    const t1 = Math.min(1, t0 + pick(0.018, 0.07));
    const a = cubicPoint(p0, p1, p2, p3, t0);
    const b = cubicPoint(p0, p1, p2, p3, t1);
    dryStroke(ctx, [[a.x - 6, a.y + 4], [a.x, a.y], [b.x, b.y], [b.x + 10, b.y + 5]], index % 2 ? '#AAB2AD' : '#5E7C88', pick(0.55, 3.2), pick(0.11, 0.3), 3);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawStars(layer) {
  const { ctx } = layer;
  const mainStars = [
    [42, 112, 1.3], [176, 91, 1.7], [308, 72, 1.35], [351, 181, 1.1], [52, 286, 1.25],
    [222, 326, 1.05], [327, 362, 1.35], [112, 423, 1.1], [285, 482, 1.2],
  ];
  for (const [x, y, radius] of mainStars) {
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#C8C7B7';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let index = 0; index < 155; index += 1) {
    const x = pick(14, 376);
    const y = pick(28, 525);
    ctx.globalAlpha = pick(0.12, 0.44);
    ctx.fillStyle = rnd() > 0.85 ? '#91A5AA' : '#6F8791';
    ctx.beginPath();
    ctx.arc(x, y, pick(0.15, 0.48), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawMountains(layer) {
  const { ctx } = layer;
  const bands = [
    { fill: '#0D2942', y: 570, points: [[0, 606], [48, 585], [93, 599], [142, 568], [185, 594], [232, 557], [278, 583], [328, 561], [390, 581]] },
    { fill: '#0A233B', y: 610, points: [[0, 627], [52, 616], [102, 625], [158, 594], [208, 615], [260, 588], [311, 610], [351, 586], [390, 604]] },
    { fill: '#071D34', y: 636, points: [[0, 646], [55, 636], [112, 645], [171, 619], [225, 637], [279, 617], [333, 629], [390, 611]] },
  ];
  for (const band of bands) {
    const commands = [['moveTo', 0, LOGICAL_H], ['lineTo', 0, band.points[0][1]]];
    for (const [x, y] of band.points) commands.push(['lineTo', x, y]);
    commands.push(['lineTo', LOGICAL_W, LOGICAL_H], ['closePath']);
    const path = fillPath(ctx, commands, band.fill);
    hatchInside(ctx, path, { x: 0, y: band.y - 10, w: LOGICAL_W, h: 95 }, '#4E7380', 65, 1);
  }
}

function drawHouse(layer) {
  const { ctx } = layer;
  const wall = fillPath(ctx, [
    ['moveTo', 302, 596], ['lineTo', 360, 593], ['lineTo', 366, 635], ['lineTo', 297, 638], ['closePath'],
  ], '#102A3D', '#041121', 1.2);
  fillPath(ctx, [
    ['moveTo', 290, 597], ['lineTo', 321, 566], ['lineTo', 366, 579], ['lineTo', 374, 598], ['lineTo', 303, 596], ['closePath'],
  ], '#07192C', '#041121', 1.5);
  fillPath(ctx, [
    ['moveTo', 319, 566], ['lineTo', 326, 563], ['lineTo', 328, 577], ['lineTo', 320, 576], ['closePath'],
  ], '#0B2437', '#041121', 0.8);
  ctx.fillStyle = '#07182B';
  ctx.fillRect(348, 607, 8, 11);
  ctx.fillRect(309, 605, 7, 9);
  hatchInside(ctx, wall, { x: 298, y: 594, w: 68, h: 45 }, '#4E7380', 38, 1);
  for (let index = 0; index < 18; index += 1) {
    dryStroke(ctx, [[302 + pick(0, 54), 590 + pick(-8, 0)], [312 + pick(0, 48), 585 + pick(-8, 3)], [340 + pick(0, 28), 589 + pick(-8, 3)], [368, 594]], '#4E7380', pick(0.35, 0.8), 0.16, 2);
  }
  dryStroke(ctx, [[298, 637], [315, 632], [340, 636], [366, 633]], '#4E7380', 0.75, 0.42, 2);
  dryStroke(ctx, [[292, 597], [316, 588], [342, 591], [371, 598]], '#56717D', 0.9, 0.35, 2);
  for (let index = 0; index < 8; index += 1) {
    const x = 304 + index * 7;
    dryStroke(ctx, [[x, 598], [x - 1, 609], [x + 1, 621], [x, 635]], '#36576B', 0.45, 0.42, 2);
  }
}

function drawDoor(layer) {
  const { ctx } = layer;
  const glow = ctx.createRadialGradient(331.5, 617, 0.5, 331.5, 617, 18);
  glow.addColorStop(0, 'rgba(211,160,91,0.26)');
  glow.addColorStop(1, 'rgba(211,160,91,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(311, 594, 42, 48);
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = palette.lampAmber;
  ctx.fillRect(328, 604, 8, 26);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#F0C77A';
  ctx.fillRect(329.5, 605, 2, 24);
  ctx.globalAlpha = 1;
}

function slopeY(x) {
  return 647 + 0.11 * x + 7 * Math.sin((x + 30) / 82);
}

function drawFarGrass(layer) {
  const { ctx } = layer;
  fillPath(ctx, [
    ['moveTo', 0, 648], ['bezierCurveTo', 90, 634, 250, 659, 390, 681], ['lineTo', 390, LOGICAL_H], ['lineTo', 0, LOGICAL_H], ['closePath'],
  ], '#0A243A');
  for (let index = 0; index < 270; index += 1) {
    const x = pick(-10, 400);
    const base = slopeY(x) + pick(-4, 14);
    const height = pick(8, 34);
    const lean = pick(4, 19);
    dryStroke(ctx, [[x, base], [x + lean * 0.18, base - height * 0.42], [x + lean * 0.64, base - height * 0.78], [x + lean, base - height]], rnd() > 0.42 ? '#173B57' : '#4E7380', pick(0.35, 1.3), pick(0.18, 0.45), 2);
  }
}

function drawAdultBody(layer) {
  const { ctx } = layer;
  const head = fillPath(ctx, [
    ['moveTo', 96, 592], ['bezierCurveTo', 98, 576, 109, 566, 123, 567], ['bezierCurveTo', 139, 568, 148, 581, 146, 597], ['bezierCurveTo', 144, 609, 136, 619, 124, 622], ['bezierCurveTo', 111, 620, 101, 611, 96, 592], ['closePath'],
  ], '#173B57', '#041121', 1.0);
  fillPath(ctx, [
    ['moveTo', 111, 613], ['bezierCurveTo', 114, 623, 129, 625, 135, 615], ['lineTo', 137, 635], ['lineTo', 108, 635], ['closePath'],
  ], '#2C4C61');
  const torso = fillPath(ctx, [
    ['moveTo', 86, 623], ['bezierCurveTo', 76, 625, 67, 633, 62, 645], ['bezierCurveTo', 56, 662, 58, 687, 67, 703],
    ['bezierCurveTo', 76, 718, 95, 724, 116, 721], ['bezierCurveTo', 132, 720, 148, 714, 157, 704],
    ['bezierCurveTo', 158, 681, 157, 660, 151, 643], ['bezierCurveTo', 137, 632, 111, 622, 86, 623], ['closePath'],
  ], '#527584', '#071729', 1.7);
  const leftLeg = fillPath(ctx, [
    ['moveTo', 89, 698], ['bezierCurveTo', 74, 702, 58, 710, 39, 719], ['bezierCurveTo', 24, 726, 17, 738, 25, 748],
    ['bezierCurveTo', 52, 746, 76, 741, 98, 732], ['bezierCurveTo', 115, 725, 133, 724, 151, 728], ['lineTo', 157, 708], ['bezierCurveTo', 135, 697, 110, 693, 89, 698], ['closePath'],
  ], '#0A2136', '#041121', 1.6);
  const rightArm = fillPath(ctx, [
    ['moveTo', 145, 634], ['bezierCurveTo', 159, 640, 166, 657, 168, 678], ['bezierCurveTo', 170, 698, 173, 708, 184, 715],
    ['lineTo', 195, 721], ['bezierCurveTo', 197, 725, 195, 730, 191, 731], ['bezierCurveTo', 181, 728, 170, 724, 162, 716],
    ['bezierCurveTo', 153, 706, 149, 692, 147, 677], ['lineTo', 140, 648], ['closePath'],
  ], '#557887', '#071729', 1.2);
  const hand = fillPath(ctx, [
    ['moveTo', 181, 714], ['bezierCurveTo', 190, 715, 202, 720, 210, 725], ['bezierCurveTo', 212, 728, 210, 731, 207, 731],
    ['lineTo', 199, 729], ['lineTo', 207, 735], ['bezierCurveTo', 207, 738, 203, 739, 200, 737], ['lineTo', 192, 731],
    ['lineTo', 197, 738], ['bezierCurveTo', 195, 741, 191, 739, 189, 737], ['lineTo', 181, 727], ['closePath'],
  ], '#6F8E98', '#071729', 0.9);
  const torsoShadow = fillPath(ctx, [
    ['moveTo', 59, 667], ['bezierCurveTo', 70, 681, 86, 690, 103, 693], ['bezierCurveTo', 123, 697, 142, 694, 158, 685],
    ['lineTo', 158, 705], ['bezierCurveTo', 139, 718, 113, 724, 91, 719], ['bezierCurveTo', 72, 714, 61, 701, 59, 681], ['closePath'],
  ], 'rgba(13,41,66,0.68)');
  const shoulderLight = fillPath(ctx, [
    ['moveTo', 65, 646], ['bezierCurveTo', 80, 629, 101, 628, 122, 633], ['bezierCurveTo', 133, 635, 143, 640, 151, 648],
    ['bezierCurveTo', 128, 642, 109, 643, 93, 648], ['bezierCurveTo', 79, 652, 69, 657, 61, 665], ['closePath'],
  ], 'rgba(145,165,170,0.34)');
  hatchInside(ctx, torso, { x: 56, y: 620, w: 108, h: 104 }, '#173B57', 115, 1);
  hatchInside(ctx, leftLeg, { x: 22, y: 690, w: 140, h: 63 }, '#4E7380', 48, 1);
  hatchInside(ctx, rightArm, { x: 140, y: 630, w: 62, h: 104 }, '#173B57', 45, 1);
  hatchInside(ctx, head, { x: 96, y: 568, w: 52, h: 56 }, '#4E7380', 16, 1);
  hatchInside(ctx, torsoShadow, { x: 58, y: 663, w: 103, h: 63 }, '#91A5AA', 55, 1);
  hatchInside(ctx, shoulderLight, { x: 60, y: 626, w: 95, h: 44 }, '#D0D0C3', 32, 1);
  void hand;
}

function drawAdultHair(layer) {
  const { ctx } = layer;
  const hair = fillPath(ctx, [
    ['moveTo', 94, 590], ['bezierCurveTo', 95, 574, 105, 562, 120, 560], ['bezierCurveTo', 134, 559, 146, 568, 151, 581],
    ['lineTo', 147, 578], ['lineTo', 152, 588], ['lineTo', 145, 585], ['lineTo', 147, 597], ['lineTo', 140, 592],
    ['bezierCurveTo', 137, 606, 131, 610, 125, 613], ['lineTo', 124, 603], ['lineTo', 119, 610], ['lineTo', 116, 601],
    ['lineTo', 110, 607], ['lineTo', 109, 597], ['lineTo', 101, 602], ['bezierCurveTo', 98, 598, 97, 594, 96, 590], ['closePath'],
  ], '#061629', '#041121', 1.2);
  hatchInside(ctx, hair, { x: 94, y: 560, w: 60, h: 55 }, '#4E7380', 35, 1);
  for (let index = 0; index < 16; index += 1) {
    const x = pick(99, 145);
    const y = pick(565, 598);
    dryStroke(ctx, [[x, y], [x + pick(2, 6), y - pick(4, 10)], [x + pick(5, 10), y - pick(5, 12)], [x + pick(8, 14), y - pick(4, 9)]], '#91A5AA', pick(0.4, 1.05), 0.42, 2);
  }
}

function drawAdultClothingEdge(layer) {
  const { ctx } = layer;
  dryStroke(ctx, [[76, 639], [98, 628], [128, 628], [154, 641]], '#B0B6AE', 1.8, 0.7, 3);
  dryStroke(ctx, [[90, 629], [104, 634], [127, 637], [144, 634]], '#173B57', 1.1, 0.7, 2);
  for (let index = 0; index < 10; index += 1) {
    dryStroke(ctx, [[103 + index * 3.5, 625], [103 + index * 3.5, 629], [104 + index * 3.5, 634], [105 + index * 3.5, 637]], '#173B57', 0.55, 0.7, 1);
  }
  dryStroke(ctx, [[62, 647], [73, 631], [92, 623], [113, 624]], '#CCD0C4', 2.1, 0.55, 4);
  dryStroke(ctx, [[113, 624], [128, 626], [142, 633], [151, 643]], '#AAB3AE', 1.6, 0.48, 3);
  dryStroke(ctx, [[80, 650], [94, 667], [113, 684], [144, 693]], '#173B57', 1.1, 0.85, 3);
  dryStroke(ctx, [[65, 649], [78, 643], [99, 639], [118, 640]], '#C2C1B5', 1.45, 0.48, 3);
  dryStroke(ctx, [[67, 699], [90, 709], [119, 711], [151, 704]], '#173B57', 1.3, 0.68, 3);
  dryStroke(ctx, [[74, 661], [89, 674], [105, 680], [121, 690]], '#173B57', 0.85, 0.72, 2);
  dryStroke(ctx, [[85, 707], [104, 703], [126, 700], [151, 690]], '#8C9FA3', 0.9, 0.36, 2);
  dryStroke(ctx, [[155, 648], [159, 667], [160, 691], [164, 711]], '#C2C1B5', 1.6, 0.48, 3);
  dryStroke(ctx, [[29, 741], [62, 735], [96, 725], [148, 725]], '#4E7380', 1.4, 0.55, 3);
  for (let index = 0; index < 7; index += 1) {
    dryStroke(ctx, [[169 + index * 2.4, 711 + index * 1.4], [174 + index * 2.5, 714 + index * 1.5], [180 + index * 2.6, 717 + index * 1.7], [184 + index * 2.7, 720 + index * 1.8]], '#173B57', 0.5, 0.64, 1);
  }
}

function drawCatBody(layer) {
  const { ctx } = layer;
  const body = fillPath(ctx, [
    ['moveTo', 207, 662], ['bezierCurveTo', 204, 653, 208, 644, 216, 640], ['bezierCurveTo', 224, 636, 235, 639, 240, 647],
    ['bezierCurveTo', 244, 654, 242, 663, 238, 668], ['bezierCurveTo', 251, 674, 260, 687, 263, 702],
    ['bezierCurveTo', 266, 716, 260, 730, 251, 737], ['bezierCurveTo', 243, 741, 231, 740, 224, 733],
    ['bezierCurveTo', 218, 725, 219, 713, 220, 704], ['bezierCurveTo', 214, 692, 209, 678, 207, 662], ['closePath'],
  ], '#3F6274', '#041121', 1.5);
  fillPath(ctx, [
    ['moveTo', 221, 705], ['bezierCurveTo', 224, 720, 221, 732, 218, 741], ['lineTo', 227, 741], ['bezierCurveTo', 230, 728, 231, 716, 228, 704], ['closePath'],
  ], '#1A354B', '#041121', 0.7);
  fillPath(ctx, [
    ['moveTo', 249, 701], ['bezierCurveTo', 254, 716, 250, 731, 246, 741], ['lineTo', 256, 741], ['bezierCurveTo', 262, 727, 261, 714, 258, 703], ['closePath'],
  ], '#203C51', '#041121', 0.7);
  const haunchShadow = fillPath(ctx, [
    ['moveTo', 237, 681], ['bezierCurveTo', 253, 682, 264, 696, 264, 711], ['bezierCurveTo', 264, 725, 256, 736, 247, 739],
    ['bezierCurveTo', 246, 722, 244, 703, 237, 681], ['closePath'],
  ], 'rgba(13,41,66,0.72)');
  const chestLight = fillPath(ctx, [
    ['moveTo', 210, 666], ['bezierCurveTo', 217, 671, 223, 679, 225, 692], ['bezierCurveTo', 227, 707, 224, 720, 221, 728],
    ['bezierCurveTo', 216, 715, 211, 695, 210, 666], ['closePath'],
  ], 'rgba(145,165,170,0.42)');
  hatchInside(ctx, body, { x: 203, y: 636, w: 64, h: 107 }, '#91A5AA', 105, 1);
  hatchInside(ctx, haunchShadow, { x: 235, y: 680, w: 31, h: 62 }, '#91A5AA', 42, 1);
  hatchInside(ctx, chestLight, { x: 207, y: 662, w: 22, h: 70 }, '#D0D0C3', 35, 1);
  dryStroke(ctx, [[211, 663], [221, 669], [233, 675], [243, 683]], '#91A5AA', 1.25, 0.55, 3);
  dryStroke(ctx, [[232, 648], [239, 659], [242, 679], [247, 707]], '#B5B8B0', 1.4, 0.46, 3);
  dryStroke(ctx, [[208, 662], [211, 681], [216, 706], [220, 731]], '#C3C6BA', 1.55, 0.52, 4);
  dryStroke(ctx, [[241, 670], [253, 683], [259, 703], [255, 727]], '#8FA2A5', 1.25, 0.44, 3);
  for (let index = 0; index < 11; index += 1) {
    const y = 656 + index * 5;
    dryStroke(ctx, [[213, y], [220, y + pick(-2, 2)], [228, y + pick(-2, 2)], [234, y + pick(-1, 3)]], '#173B57', pick(0.5, 1.1), 0.52, 2);
  }
  for (let whisker = 0; whisker < 4; whisker += 1) {
    dryStroke(ctx, [[237, 657 + whisker * 1.8], [247, 655 + whisker * 3], [256, 657 + whisker * 3.3], [263, 660 + whisker * 3.6]], '#91A5AA', 0.35, 0.48, 1);
  }
}

function drawCatEars(layer) {
  const { ctx } = layer;
  fillPath(ctx, [['moveTo', 208, 647], ['lineTo', 211, 630], ['lineTo', 222, 641], ['closePath']], '#29485D', '#041121', 1.1);
  fillPath(ctx, [['moveTo', 229, 640], ['lineTo', 241, 631], ['lineTo', 239, 651], ['closePath']], '#29485D', '#041121', 1.1);
  dryStroke(ctx, [[211, 631], [214, 635], [218, 639], [221, 642]], '#91A5AA', 0.8, 0.7, 2);
  dryStroke(ctx, [[239, 633], [237, 638], [237, 644], [238, 649]], '#91A5AA', 0.8, 0.7, 2);
}

function drawCatTail(layer) {
  const { ctx } = layer;
  dryStroke(ctx, [[254, 719], [273, 708], [288, 727], [310, 713]], '#0A2035', 14, 0.95, 6);
  dryStroke(ctx, [[254, 716], [273, 708], [289, 723], [309, 712]], '#6A8790', 2.4, 0.58, 3);
  dryStroke(ctx, [[270, 714], [279, 714], [289, 719], [298, 714]], '#91A5AA', 0.7, 0.32, 2);
}

function drawNearGrass(layer) {
  const { ctx } = layer;
  for (let index = 0; index < 620; index += 1) {
    const x = pick(-25, 410);
    const base = pick(694, 870);
    const height = pick(18, 95) * (0.45 + (base - 680) / 190);
    const lean = pick(10, 43);
    const toneRoll = rnd();
    const color = toneRoll > 0.83 ? '#91A5AA' : toneRoll > 0.42 ? '#4E7380' : '#173B57';
    dryStroke(ctx, [[x, base], [x + lean * 0.12, base - height * 0.38], [x + lean * 0.58, base - height * 0.78], [x + lean, base - height]], color, pick(0.45, 1.7), pick(0.25, 0.68), 2);
  }
  for (let band = 0; band < 34; band += 1) {
    const x = pick(-40, 380);
    const y = pick(700, 840);
    dryStroke(ctx, [[x, y], [x + 22, y - 18], [x + 55, y - 42], [x + 87, y - 78]], band % 3 === 0 ? '#8C9FA3' : '#4E7380', pick(1.5, 4.1), pick(0.15, 0.38), 4);
  }
}

function drawFlowers(layer) {
  const { ctx } = layer;
  const flowers = [
    { x: 69, y: 738, scale: 0.92 },
    { x: 317, y: 774, scale: 1.0 },
  ];
  for (const flower of flowers) {
    const { x, y, scale } = flower;
    dryStroke(ctx, [[x, y + 24 * scale], [x - 1, y + 14 * scale], [x + 1, y + 7 * scale], [x, y]], '#4E7380', 0.85, 0.72, 2);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 14 * scale);
    glow.addColorStop(0, 'rgba(211,160,91,0.24)');
    glow.addColorStop(1, 'rgba(211,160,91,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 14 * scale, 0, Math.PI * 2);
    ctx.fill();
    for (let petal = 0; petal < 6; petal += 1) {
      const angle = (Math.PI * 2 * petal) / 6 - Math.PI / 2 + pick(-0.12, 0.12);
      ctx.globalAlpha = 0.46;
      ctx.fillStyle = palette.lampAmber;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(angle) * 3.6 * scale, y + Math.sin(angle) * 3.6 * scale, pick(1.2, 1.7) * scale, pick(2.8, 3.7) * scale, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = '#C7A56D';
    ctx.beginPath();
    ctx.arc(x, y, 1.65 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawForegroundGrass(layer) {
  const { ctx } = layer;
  for (let index = 0; index < 118; index += 1) {
    const x = pick(-45, 415);
    if (x > 30 && x < 278 && rnd() < 0.72) continue;
    const base = pick(780, 885);
    const height = pick(40, 135);
    const lean = pick(20, 68);
    dryStroke(ctx, [[x, base], [x + lean * 0.12, base - height * 0.34], [x + lean * 0.55, base - height * 0.78], [x + lean, base - height]], rnd() > 0.45 ? '#6F8791' : '#36576B', pick(1.0, 3.3), pick(0.36, 0.75), 4);
  }
  for (let index = 0; index < 22; index += 1) {
    const x = pick(-20, 380);
    if (x > 20 && x < 278 && rnd() < 0.82) continue;
    const y = pick(760, 845);
    dryStroke(ctx, [[x, y], [x + 28, y - 24], [x + 58, y - 55], [x + 84, y - 92]], '#A4ADA8', pick(2.2, 5.2), pick(0.18, 0.42), 5);
  }
}

function drawPaperGrain(layer) {
  const { ctx } = layer;
  for (let index = 0; index < 27000; index += 1) {
    const x = pick(0, LOGICAL_W);
    const y = pick(0, LOGICAL_H);
    const light = rnd() > 0.56;
    ctx.globalAlpha = light ? pick(0.012, 0.04) : pick(0.01, 0.032);
    ctx.fillStyle = light ? '#D5D0BB' : '#020B16';
    const width = pick(0.16, 0.6);
    ctx.fillRect(x, y, width, width * pick(0.4, 1.8));
  }
  for (let row = 0; row < LOGICAL_H; row += 9) {
    for (let col = (row / 9) % 2 ? 2 : 6; col < LOGICAL_W; col += 10) {
      ctx.globalAlpha = 0.018;
      ctx.fillStyle = '#B8B6A8';
      ctx.beginPath();
      ctx.arc(col + pick(-0.8, 0.8), row + pick(-0.8, 0.8), 0.42, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

const layerDefinitions = [
  ['01-sky', 'background plate', drawSky],
  ['02-milky-way', 'future stable sky sprite', drawMilkyWay],
  ['03-main-stars', 'future independent star brightness sprites', drawStars],
  ['04-mountains', 'stable middle-distance plate', drawMountains],
  ['05-house', 'stable house sprite', drawHouse],
  ['06-door-light', 'future clickable door visual state', drawDoor],
  ['07-far-grass', 'B01 resting far-grass state', drawFarGrass],
  ['08-near-grass', 'future near-grass wind state, behind characters in B01', drawNearGrass],
  ['09-adult-body', 'character body anchor', drawAdultBody],
  ['10-adult-hair', 'future hair wind state', drawAdultHair],
  ['11-adult-clothing-edge', 'future hem and sleeve wind detail', drawAdultClothingEdge],
  ['12-cat-body', 'ordinary cat body anchor', drawCatBody],
  ['13-cat-ears', 'future cat ear wind detail', drawCatEars],
  ['14-cat-tail', 'future cat tail wind detail', drawCatTail],
  ['15-two-flowers', 'exactly two low-light optional interaction visuals', drawFlowers],
  ['16-foreground-grass-strokes', 'foreground framing and future wind state', drawForegroundGrass],
  ['17-paper-grain', 'shared print texture overlay', drawPaperGrain],
];

async function saveLayers() {
  const layers = [];
  for (const [name, runtimeRole, painter] of layerDefinitions) {
    const layer = newLayer(name);
    painter(layer);
    const file = join(out.layers, `${name}.png`);
    writeFileSync(file, layer.canvas.toBuffer('image/png'));
    layers.push({ name, runtimeRole, file, canvas: layer.canvas });
  }
  return layers;
}

function compositeLayers(layers) {
  const canvas = createCanvas(SOURCE_W, SOURCE_H);
  const ctx = canvas.getContext('2d');
  for (const layer of layers) ctx.drawImage(layer.canvas, 0, 0);
  return canvas;
}

async function exportFrames(flattened) {
  const sourceBuffer = flattened.toBuffer('image/png');
  writeFileSync(join(out.source, 'b01-formal-pilot-v1-flattened-2x.png'), sourceBuffer);
  const specs = [
    ['390x844', 390, 844],
    ['thumbnail-195x422', 195, 422],
    ['360x800', 360, 800],
    ['430x932', 430, 932],
    ['430x844-pressure', 430, 844],
  ];
  const manifest = [];
  for (const [id, width, height] of specs) {
    const file = join(out.exports, `b01-formal-pilot-v1-${id}.png`);
    await sharp(sourceBuffer).resize(width, height, {
      fit: 'contain',
      position: 'centre',
      background: { r: 6, g: 24, b: 47, alpha: 1 },
    }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(file);
    manifest.push({ id, width, height, file });
  }
  return manifest;
}

async function createSafeAreaOverlay(item) {
  const image = await loadLocalImage(item.file);
  const canvas = createCanvas(item.width, item.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, item.width, item.height);

  const contentScale = Math.min(item.width / LOGICAL_W, item.height / LOGICAL_H);
  const contentW = LOGICAL_W * contentScale;
  const contentH = LOGICAL_H * contentScale;
  const contentX = (item.width - contentW) / 2;
  const contentY = (item.height - contentH) / 2;
  const safe = {
    x: contentX + 16 * contentScale,
    y: contentY + 48 * contentScale,
    w: contentW - 32 * contentScale,
    h: contentH - 82 * contentScale,
  };

  ctx.save();
  ctx.lineWidth = Math.max(1.5, 2 * contentScale);
  ctx.strokeStyle = 'rgba(112, 219, 205, 0.95)';
  ctx.setLineDash([8 * contentScale, 5 * contentScale]);
  ctx.strokeRect(safe.x, safe.y, safe.w, safe.h);
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(211, 160, 91, 0.9)';
  ctx.lineWidth = Math.max(1, 1.3 * contentScale);
  ctx.strokeRect(contentX + 0.5, contentY + 0.5, contentW - 1, contentH - 1);
  ctx.fillStyle = 'rgba(6, 24, 47, 0.72)';
  ctx.fillRect(7, 7, Math.min(item.width - 14, 176), 29);
  ctx.fillStyle = '#E2DED0';
  ctx.font = `${Math.max(10, Math.round(11 * contentScale))}px sans-serif`;
  ctx.fillText(`SAFE CORE · ${item.id}`, 13, 26);
  ctx.restore();

  const file = join(out.overlays, `b01-formal-pilot-v1-${item.id}-safe-overlay.png`);
  writeFileSync(file, canvas.toBuffer('image/png'));
  return { ...item, overlay: file, safe, contentBounds: { x: contentX, y: contentY, w: contentW, h: contentH } };
}

function registerBoardFonts() {
  const candidates = [
    ['/System/Library/Fonts/PingFang.ttc', 'Pilot Sans'],
    ['/System/Library/Fonts/Supplemental/Arial Unicode.ttf', 'Pilot Sans'],
  ];
  for (const [path, family] of candidates) {
    try {
      if (GlobalFonts.registerFromPath(path, family)) return family;
    } catch {
      // Fall through to system sans-serif.
    }
  }
  return 'sans-serif';
}

function drawBoardLabel(ctx, text, x, y, font, size = 22, color = '#D7D4C7') {
  ctx.fillStyle = color;
  ctx.font = `600 ${size}px ${font}`;
  ctx.fillText(text, x, y);
}

async function createReviewBoards(exportsManifest, safeManifest) {
  const font = registerBoardFonts();
  const pilot = await loadLocalImage(exportsManifest.find((item) => item.id === '390x844').file);
  const reference = await loadLocalImage(referencePath);
  const thumb = await loadLocalImage(exportsManifest.find((item) => item.id === 'thumbnail-195x422').file);

  const compare = createCanvas(1110, 1030);
  const cctx = compare.getContext('2d');
  cctx.fillStyle = '#071322';
  cctx.fillRect(0, 0, compare.width, compare.height);
  drawBoardLabel(cctx, 'B01「坐稳」正式样板对照', 48, 58, font, 28);
  drawBoardLabel(cctx, 'REFERENCE · EXPLORATION ONLY', 88, 104, font, 16, '#91A5AA');
  drawBoardLabel(cctx, CANDIDATE_ID, 638, 104, font, 16, '#D3A05B');
  cctx.drawImage(reference, 72, 125, 390, 844);
  cctx.drawImage(pilot, 622, 125, 390, 844);
  cctx.strokeStyle = '#4E7380';
  cctx.lineWidth = 2;
  cctx.strokeRect(71, 124, 392, 846);
  cctx.strokeStyle = '#D3A05B';
  cctx.strokeRect(621, 124, 392, 846);
  drawBoardLabel(cctx, '构图 / 光色 / 材质参照', 142, 1005, font, 16, '#91A5AA');
  drawBoardLabel(cctx, '原创分层重绘 / 待总控视觉裁决', 690, 1005, font, 16, '#D3A05B');
  writeFileSync(join(out.review, 'b01-reference-vs-formal-pilot.png'), compare.toBuffer('image/png'));

  const board = createCanvas(1800, 1300);
  const ctx = board.getContext('2d');
  ctx.fillStyle = '#071322';
  ctx.fillRect(0, 0, board.width, board.height);
  drawBoardLabel(ctx, 'B01-FORMAL-PILOT-V1 · 本地可见审查板', 56, 62, font, 34);
  drawBoardLabel(ctx, 'Gate B / no Cocos / no build / no upload', 58, 96, font, 17, '#91A5AA');

  ctx.drawImage(pilot, 56, 138, 390, 844);
  ctx.strokeStyle = '#D3A05B';
  ctx.lineWidth = 2;
  ctx.strokeRect(55, 137, 392, 846);
  drawBoardLabel(ctx, '390×844 母版', 56, 1020, font, 18);
  ctx.drawImage(thumb, 484, 138, 195, 422);
  ctx.strokeStyle = '#4E7380';
  ctx.strokeRect(483, 137, 197, 424);
  drawBoardLabel(ctx, '195×422 首读缩略图', 484, 592, font, 18);

  const overlayPositions = [
    ['360x800', 730, 138, 270, 600],
    ['430x932', 1036, 138, 277, 600],
    ['430x844-pressure', 1348, 138, 306, 600],
  ];
  for (const [id, x, y, w, h] of overlayPositions) {
    const item = safeManifest.find((entry) => entry.id === id);
    const image = await loadLocalImage(item.overlay);
    ctx.drawImage(image, x, y, w, h);
    ctx.strokeStyle = '#4E7380';
    ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
    drawBoardLabel(ctx, id, x, y + h + 34, font, 17);
  }

  drawBoardLabel(ctx, '分层结构（2× OpenRaster 源包）', 484, 674, font, 22, '#D3A05B');
  const layerNames = layerDefinitions.map(([name]) => name);
  layerNames.forEach((name, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 484 + column * 270;
    const y = 784 + row * 35;
    ctx.fillStyle = index % 2 ? '#173B57' : '#4E7380';
    ctx.fillRect(x, y - 13, 18, 3);
    drawBoardLabel(ctx, name, x + 29, y, font, 15, '#C8C7BB');
  });

  drawBoardLabel(ctx, '锁定规则自评', 1125, 794, font, 22, '#D3A05B');
  const checks = [
    'YES  成年人左 / 普通家猫右 / 共同仰望',
    'YES  右侧中景暖门稳定、不催促',
    'NO   银河过窄且偏点状',
    'YES  恰好两朵弱光花',
    'YES  无 UI / 任务 / 奖励 / 对白',
    'NO   人物、猫和草坡未达 B 漫画重量',
    'YES  四尺寸 SHOW_ALL 无关键物裁切',
    'YES  参考像素未进入正式源包',
  ];
  checks.forEach((check, index) => drawBoardLabel(ctx, check, 1125, 838 + index * 43, font, 17, '#C8C7BB'));
  drawBoardLabel(ctx, '当前状态：FAIL / SUPERSEDED / do not consume', 56, 1260, font, 19, '#D3A05B');
  writeFileSync(join(out.review, 'b01-formal-pilot-v1-review-board.png'), board.toBuffer('image/png'));
}

function buildOra(layers, flattenedBuffer) {
  writeFileSync(join(out.oraStage, 'mimetype'), 'image/openraster');
  writeFileSync(join(out.oraStage, 'mergedimage.png'), flattenedBuffer);
  copyFileSync(join(out.exports, 'b01-formal-pilot-v1-thumbnail-195x422.png'), join(out.oraStage, 'Thumbnails/thumbnail.png'));
  for (const layer of layers) copyFileSync(layer.file, join(out.oraStage, 'data', `${layer.name}.png`));
  const stack = [...layers].reverse().map((layer) => `    <layer name="${layer.name}" src="data/${layer.name}.png" visibility="visible" opacity="1.0"/>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<image version="0.0.1" w="${SOURCE_W}" h="${SOURCE_H}" name="${CANDIDATE_ID}">\n  <stack name="B01 source layers">\n${stack}\n  </stack>\n</image>\n`;
  writeFileSync(join(out.oraStage, 'stack.xml'), xml);
  const oraPath = join(out.source, 'b01-formal-pilot-v1.ora');
  rmSync(oraPath, { force: true });
  execFileSync('zip', ['-0', '-q', oraPath, 'mimetype'], { cwd: out.oraStage });
  execFileSync('zip', ['-r', '-q', oraPath, 'stack.xml', 'mergedimage.png', 'data', 'Thumbnails'], { cwd: out.oraStage });
  return oraPath;
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function listFiles(dir) {
  const entries = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) entries.push(...listFiles(full));
    else entries.push(full);
  }
  return entries;
}

function writeEvidence(layers, exportsManifest, safeManifest, oraPath) {
  const layerManifest = {
    candidateId: CANDIDATE_ID,
    sourceCanvas: { width: SOURCE_W, height: SOURCE_H, logicalWidth: LOGICAL_W, logicalHeight: LOGICAL_H, scale: SCALE },
    renderOrder: layers.map((layer, index) => ({ orderBottomToTop: index + 1, id: layer.name, runtimeRole: layer.runtimeRole, file: relative(candidateRoot, layer.file) })),
    constraints: {
      adultPosition: 'left',
      catPosition: 'right of adult',
      warmDoor: 'right middle distance, stable',
      milkyWayCount: 1,
      flowerCount: 2,
      uiTextDialogueCount: 0,
    },
  };
  writeFileSync(join(out.source, 'layer-manifest.json'), `${JSON.stringify(layerManifest, null, 2)}\n`);

  const exportReport = {
    candidateId: CANDIDATE_ID,
    adaptation: 'SHOW_ALL / contain / #06182F extension',
    exports: safeManifest.map((item) => ({
      id: item.id,
      width: item.width,
      height: item.height,
      file: relative(candidateRoot, item.file),
      safeOverlay: relative(candidateRoot, item.overlay),
      contentBounds: item.contentBounds,
      safeCore: item.safe,
      criticalContentCropped: false,
    })),
    thumbnail: exportsManifest.find((item) => item.id === 'thumbnail-195x422'),
  };
  writeFileSync(join(out.evidence, 'export-report.json'), `${JSON.stringify(exportReport, null, 2)}\n`);

  const layerRows = layers.map((layer, index) => `| ${index + 1} | \`${layer.name}\` | ${layer.runtimeRole} | \`${relative(candidateRoot, layer.file)}\` |`).join('\n');
  writeFileSync(join(out.evidence, 'LAYER-LIST.md'), `# ${CANDIDATE_ID} layer list\n\nSource canvas: \`${SOURCE_W}×${SOURCE_H}\` (2× of logical \`${LOGICAL_W}×${LOGICAL_H}\`). Render order is bottom to top.\n\n| Order | Layer | Intended future runtime role | Editable layer PNG |\n|---:|---|---|---|\n${layerRows}\n\nOpenRaster source: \`${relative(candidateRoot, oraPath)}\`.\n`);

  writeFileSync(join(out.evidence, 'PROVENANCE-DRAFT.md'), `# ${CANDIDATE_ID} provenance draft\n\n- Authoring mode: original deterministic raster-brush repaint assembled as 17 editable transparent layers and an OpenRaster package.\n- Author: Codex UI/art task window, under the main-controller-approved B01 production brief.\n- Approved visual reference: \`design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png\`.\n- Reference SHA-256: \`fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c\`.\n- Reference identity: ImageGen exploration only; used for composition, light, limited palette, material density, and mood comparison.\n- Generator record for final production pixels: none. The production painter does not load or sample the approved reference.\n- Redrawn: sky gradient, one broken Milky Way, nine main stars, mountain bands, house, stable door, adult anatomy/silhouette, ordinary cat anatomy/silhouette, grass strokes, two flowers, halftone, and paper grain.\n- Discarded from the reference: its exact pixel shapes, exact star field, exact grass blades, exact character contour, exact house contour, and all generated-image noise.\n- Why this is not a direct generated-image copy: every formal layer is painted from new authored paths and seeded brush marks; the approved reference is opened only while composing the side-by-side review board. No crop, trace bitmap, embedded reference, or pixel sampling is present in the source package.\n- Production status: local review candidate only; not approved for Cocos, WeChat, review submission, or release.\n`);

  const checklist = [
    ['YES', '195×422 first read keeps sky, seated adult, ordinary cat, house, and grass slope.'],
    ['NO', '390×844 follows approved B reference language rather than the superseded flat SVG drafts. It is improved over earlier code art, but still reads as constructed layer art instead of mature dry-brush night comics.'],
    ['NO', 'Adult silhouette connects head, neck, shoulders, torso, seated pelvis, legs, sleeve, and planted hand with believable relaxed weight. The body reads too thin and upright.'],
    ['NO', 'Cat silhouette connects head, ears, neck, chest, back, haunch, paws, and tail root with ordinary cat volume. The cat reads too flat and paper-like.'],
    ['NO', 'Dry-brush marks, restrained halftone, and paper grain cross sky, mountains, house, characters, and grass with one coherent print logic. The grass and characters lack the approved heavy brush mass.'],
    ['NO', 'There is one soft broken Milky Way with three dark gaps and loose particulate edges. The current Milky Way is too narrow and dotted.'],
    ['YES', 'No rectangular halo, sticker edge, black box, or alpha fringe is visible in the flattened source.'],
    ['YES', 'Door is the strongest warm point; exactly two flowers are weaker and do not form a path.'],
    ['NO', 'Mood remains cool, quiet, comfortable, and visually unhurried at the approved quality level. The intent is present, but drawing quality is insufficient.'],
    ['YES', 'No UI, task, reward, dialogue, countdown, or automatic-entry cue appears.'],
    ['YES', '360×800, 390×844, 430×932, and 430×844-pressure use SHOW_ALL with no critical crop.'],
    ['NO', 'Main-controller visible approval has not yet been recorded; Gate B remains BLOCKED.'],
  ];
  const checkRows = checklist.map(([answer, item]) => `| ${answer} | ${item} |`).join('\n');
  writeFileSync(join(out.evidence, 'SELF-CHECK.md'), `# ${CANDIDATE_ID} one-page visual self-check\n\n> Updated by main controller after visual review: this package is a failed formal-art pilot. Structural checks remain useful as audit notes, but they do not make the visible image acceptable.\n\n| Yes/No | Locked rule / pass line |\n|---|---|\n${checkRows}\n\n## Gate conclusion\n\n- Current Gate: B — static visible design.\n- Status: \`FAIL / SUPERSEDED / STOPPED\`.\n- P0: none found in self-check.\n- P1: visible quality failure in anatomy, cat volume, grass brush mass, Milky Way shape, and overall approved B style fidelity.\n- Can enter B02/B03 or Cocos: **No**.\n`);

  writeFileSync(join(out.evidence, 'TRACEABILITY.md'), `# ${CANDIDATE_ID} traceability\n\n| ID | Current requirement | Superseded item | Static evidence | Code consumer | QA evidence | Status | Owner / next step |\n|---|---|---|---|---|---|---|---|\n| B01-01 | Adult left, ordinary cat right, shared upward gaze | R2 five-page visual and failed formal SVG drafts | \`review/b01-formal-pilot-v1-review-board.png\` | None | \`SELF-CHECK.md\` | FAIL | Reject this pilot; next route needs stronger hand-drawn anatomy and cat volume |\n| B01-02 | One faint broken Milky Way, deep indigo limited palette | geometric Milky Way strips | \`exports/b01-formal-pilot-v1-390x844.png\` | None | reference comparison | FAIL | Reject this pilot; next route needs broad broken Milky Way mass |\n| B01-03 | Right middle-distance stable warm door; exactly two weak flowers | task-like glow/path markers | \`exports/b01-formal-pilot-v1-390x844.png\` | None | layer manifest counts | ALIGNED | Main controller visual review |\n| B01-04 | Editable, traceable formal source; no approved-reference pixels | generated exploration PNG as runtime art | \`source/b01-formal-pilot-v1.ora\` | None | provenance + hashes | ALIGNED | Main controller source audit |\n| B01-05 | 360/390/430 and pressure safe-area evidence | crop-to-fill exports | \`exports/safe-area-overlays/\` | None | \`export-report.json\` | ALIGNED | Main controller crop review |\n| B01-06 | Visible approval before B02/B03 or Cocos | automatic Gate advancement | all local review evidence | None | approval absent | FAIL | Do not consume this package; create a new formal-art route |\n`);

  writeFileSync(join(candidateRoot, 'STATUS.md'), `# ${CANDIDATE_ID}\n\n- Gate: \`B / STATIC VISIBLE DESIGN\`\n- State: \`FAIL / SUPERSEDED / DO NOT REVIEW AS CANDIDATE\`\n- Cocos: \`NO\`\n- Build: \`NO\`\n- WeChat: \`NO\`\n- Git: \`NO COMMIT\`\n- Scope: B01 \`坐稳\` only.\n- Review board: \`review/b01-formal-pilot-v1-review-board.png\`.\n- Editable source: \`source/b01-formal-pilot-v1.ora\`.\n- Main-controller decision: rejected before user presentation.\n- Failure summary: the image is structurally layered, but the visible result still misses the approved B direction. The adult reads too thin and constructed, the cat reads like a flat paper silhouette, the grass lacks the heavy dry-brush mass of the approved reference, and the Milky Way becomes a narrow dotted streak instead of a broad broken night shape.\n- Stop line: do not extend B02/B03, do not hand off to Cocos, do not use in WeChat, and do not cite as visual approval evidence.\n`);
}

function writeHashes() {
  const files = listFiles(candidateRoot)
    .filter((file) => !file.includes('/.ora-stage/'))
    .filter((file) => !file.endsWith('/HASHES.sha256'))
    .sort();
  const lines = files.map((file) => `${sha256(file)}  ${relative(candidateRoot, file)}`);
  writeFileSync(join(candidateRoot, 'HASHES.sha256'), `${lines.join('\n')}\n`);
}

async function main() {
  prepareDirectories();
  const layers = await saveLayers();
  const flattened = compositeLayers(layers);
  const exportsManifest = await exportFrames(flattened);
  const safeManifest = [];
  for (const item of exportsManifest.filter((entry) => entry.id !== 'thumbnail-195x422')) {
    safeManifest.push(await createSafeAreaOverlay(item));
  }
  await createReviewBoards(exportsManifest, safeManifest);
  const flattenedBuffer = flattened.toBuffer('image/png');
  const oraPath = buildOra(layers, flattenedBuffer);
  writeEvidence(layers, exportsManifest, safeManifest, oraPath);
  writeHashes();
  process.stdout.write(`${CANDIDATE_ID}\n${join(out.review, 'b01-formal-pilot-v1-review-board.png')}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
