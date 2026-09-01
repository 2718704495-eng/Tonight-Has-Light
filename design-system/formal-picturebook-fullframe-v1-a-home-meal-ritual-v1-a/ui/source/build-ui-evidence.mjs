import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadSharp } from '../../scripts/sharp-loader.mjs';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const uiDir = resolve(sourceDir, '..');
const packageDir = resolve(uiDir, '..');
const evidenceDir = join(uiDir, 'evidence');
const pageDir = join(packageDir, 'pages');

const approvedH4Inputs = {
  none: 'bbb02106fb4f5a820d1199eb61c7b10b5065028461bfdd6bf813276abe796533',
  ate: '0a356ea97cc91afecc93c8c9a607583d63a40db0a6e0226ec224be4a47a450b5',
  sipped: '710a4b4f54641e0880639147807120594b7e43302e74ce5d97c4784614cf841e',
  both: '69a9ab2b2982cd83beec6430c9684940f2b9924c5a15beb29615eeaaf722a530',
};

const approvedH4UpstreamRecords = {
  ateSvg: {
    path: join(pageDir, 'scene_01_home_shot_004/source/response-layers/ate.svg'),
    sha256: 'acfe49b8be244198e521f371c17bb61355e3b7951708dc7ed3aff346e9ce5ae5',
  },
  responseStateReport: {
    path: join(pageDir, 'scene_01_home_shot_004/evidence/h4-response-state-report.json'),
    sha256: 'f2b1642da1d405dc90802c45580318c1728775b9a939e680a450a80aef3fa752',
  },
  responseBoard: {
    path: join(pageDir, 'scene_01_home_shot_004/evidence/h4-response-states-2x2.png'),
    sha256: 'ac3d68a7e40b6e946eb5895c6363ba8ff18a171a713f3628a99e3abc288e77ef',
  },
};

const scenePath = (shot, suffix = '') => join(
  pageDir,
  `scene_01_home_shot_00${shot}`,
  suffix || `exports/390x844/scene_01_home_shot_00${shot}.png`,
);

const h4StatePath = (state) => scenePath(
  4,
  `exports/states/scene_01_home_shot_004-${state}-390x844.png`,
);

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function assertApprovedH4Inputs() {
  const actual = {};
  for (const [state, expected] of Object.entries(approvedH4Inputs)) {
    actual[state] = await sha256(h4StatePath(state));
    if (actual[state] !== expected) {
      throw new Error(`H4 ${state} input drift: expected ${expected}, received ${actual[state]}`);
    }
  }
  const upstreamRecords = {};
  for (const [id, record] of Object.entries(approvedH4UpstreamRecords)) {
    upstreamRecords[id] = await sha256(record.path);
    if (upstreamRecords[id] !== record.sha256) {
      throw new Error(`H4 ${id} upstream record drift: expected ${record.sha256}, received ${upstreamRecords[id]}`);
    }
  }
  return { states: actual, upstreamRecords };
}

const xml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function fit390(width, height) {
  const scale = Math.min(width / 390, height / 844);
  return {
    scale,
    offsetX: (width - (390 * scale)) / 2,
    offsetY: (height - (844 * scale)) / 2,
  };
}

function mappedRect(rect, viewport) {
  const fit = fit390(viewport.width, viewport.height);
  return {
    x: fit.offsetX + (rect.x * fit.scale),
    y: fit.offsetY + (rect.y * fit.scale),
    width: rect.width * fit.scale,
    height: rect.height * fit.scale,
  };
}

function fullSvg(width, height, content) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`);
}

function outlinedText({ x, y, copy, size, letterSpacing = 0.6 }) {
  return `<text x="${x}" y="${y}" text-anchor="middle"
    font-family="STSong, Songti SC, Noto Serif CJK SC, serif"
    font-size="${size}" font-weight="500" letter-spacing="${letterSpacing}"
    fill="#F6E2BC" stroke="#26170F" stroke-width="1.6"
    stroke-linejoin="round" paint-order="stroke fill">${xml(copy)}</text>`;
}

function tablePaper() {
  return `
    <path data-role="large-table-paper"
      d="M155 468 C175 462 199 464 221 461 C244 459 274 461 305 464 C333 467 365 465 383 471 L381 518 C350 521 320 517 292 520 C262 523 233 519 203 521 C181 522 164 517 150 515 Z"
      fill="#D9AF68" fill-opacity="0.82"
      stroke="#6A3A20" stroke-width="1.1" stroke-opacity="0.45"/>
    <path data-role="large-table-paper-grain"
      d="M166 482 C211 477 259 482 372 479 M160 503 C227 508 291 500 375 507"
      fill="none" stroke="#FBE9C8" stroke-width="0.7" stroke-opacity="0.24"/>
  `;
}

function h1Overlay({ width = 390, height = 844, large = false } = {}) {
  const viewport = { width, height };
  const bounds = mappedRect({ x: 40, y: 214, width: 108, height: 38 }, viewport);
  const size = large ? 19.2 : 16;
  return fullSvg(width, height, outlinedText({
    x: bounds.x + (bounds.width / 2),
    y: bounds.y + (bounds.height / 2) + (size * 0.36),
    copy: '放下外衣',
    size,
  }));
}

function h2Overlay({ width = 390, height = 844, large = false } = {}) {
  const viewport = { width, height };
  const b = mappedRect({ x: 190, y: 620, width: 176, height: 76 }, viewport);
  const size = large ? 16.8 : 14;
  const textStyle = `text-anchor="middle" font-family="STSong, Songti SC, Noto Serif CJK SC, serif" font-size="${size}" font-weight="500" letter-spacing="0.4" fill="#F6E2BC" stroke="#26170F" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke fill"`;
  return fullSvg(width, height, `
    <text x="${b.x + (b.width / 2)}" y="${b.y + 31}" ${textStyle}>轻轻碰一下，</text>
    <text x="${b.x + (b.width / 2)}" y="${b.y + 53}" ${textStyle}>故事会往前走。</text>
  `);
}

function h4Overlay({ width = 390, height = 844, large = false } = {}) {
  const viewport = { width, height };
  const fit = fit390(width, height);
  const eat = mappedRect({ x: 180, y: 474, width: 76, height: 38 }, viewport);
  const sip = mappedRect({ x: 296, y: 474, width: 86, height: 38 }, viewport);
  const size = (large ? 19.2 : 16) * fit.scale;
  const paper = large && width === 390 && height === 844 ? tablePaper() : '';
  return fullSvg(width, height, `
    ${paper}
    ${outlinedText({ x: eat.x + (eat.width / 2), y: eat.y + (eat.height / 2) + (size * 0.36), copy: '吃一点', size })}
    ${outlinedText({ x: sip.x + (sip.width / 2), y: sip.y + (sip.height / 2) + (size * 0.36), copy: '喝口温水', size, letterSpacing: 0.4 })}
  `);
}

async function compose(sharp, { base, overlay, output, width = 390, height = 844 }) {
  await sharp(base)
    .resize(width, height, { fit: 'contain', background: '#06265F' })
    .composite([{ input: overlay }])
    .png()
    .toFile(join(evidenceDir, output));
}

async function stateBoard(sharp, renderedStates, output) {
  const panelWidth = 195;
  const panelHeight = 422;
  const gap = 8;
  const boardWidth = (panelWidth * 2) + gap;
  const boardHeight = (panelHeight * 2) + gap;
  const composites = [];
  for (const [index, input] of renderedStates.entries()) {
    composites.push({
      input: await sharp(input).resize(panelWidth, panelHeight).png().toBuffer(),
      left: (index % 2) * (panelWidth + gap),
      top: Math.floor(index / 2) * (panelHeight + gap),
    });
  }
  await sharp({
    create: { width: boardWidth, height: boardHeight, channels: 3, background: '#06265F' },
  }).composite(composites).png().toFile(join(evidenceDir, output));
}

async function writeUiSources() {
  await mkdir(sourceDir, { recursive: true });
  await writeFile(join(sourceDir, 'h4-quiet-actions.svg'), h4Overlay().toString('utf8'));
  await writeFile(join(sourceDir, 'h4-large-table-paper.svg'), h4Overlay({ large: true }).toString('utf8'));
}

function buildContract() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    contractId: 'HOME-MEAL-QUIET-UI-V1-A',
    status: 'PASS / H4 RESPONSE+QUIET UI READY FOR USER VISUAL REVIEW',
    gate: 'B',
    scope: [
      'scene_01_home_shot_001',
      'scene_01_home_shot_002',
      'scene_01_home_shot_004',
    ],
    sourceBoundary: {
      uiOnly: true,
      cleanPlatesModified: false,
      responseLayersModified: false,
      cocosModified: false,
      buildOrWechatOperations: false,
    },
    evidenceInputs: {
      h4States: approvedH4Inputs,
      responseSource: {
        ateSvgSha256: 'acfe49b8be244198e521f371c17bb61355e3b7951708dc7ed3aff346e9ce5ae5',
        responseStateReportSha256: 'f2b1642da1d405dc90802c45580318c1728775b9a939e680a450a80aef3fa752',
        responseBoardSha256: 'ac3d68a7e40b6e946eb5895c6363ba8ff18a171a713f3628a99e3abc288e77ef',
      },
      supersedes: 'All UI composites generated from earlier H4 response hashes.',
    },
    approvedCopy: {
      h1: '放下外衣',
      h2: '轻轻碰一下，故事会往前走。',
      h4Eat: '吃一点',
      h4Sip: '喝口温水',
    },
    experienceIntent: {
      role: '对象旁的低权重画中邀请，不是任务、按钮栏或完成反馈',
      equalOptionalActions: true,
      progressMeaning: false,
      rewardMeaning: false,
      completionMeaning: false,
      medicalMeaning: false,
    },
    canvas: {
      logicalWidth: 390,
      logicalHeight: 844,
      coordinateMode: 'approved-390x844-logical-canvas',
      adaptation: 'Preserve the approved scene aspect ratio with SHOW_ALL; anchor UI to scene objects, never stretch independently.',
      safeBorder: '#06265F',
      reviewSizes: ['360x800', '390x844', '430x932', '430x844-pressure'],
    },
    tokens: {
      typography: {
        family: 'STSong, Songti SC, Noto Serif CJK SC, serif',
        actionStandardPx: 16,
        helperStandardPx: 14,
        actionLargePx: 19.2,
        helperLargePx: 16.8,
        largeScale: 1.2,
        lineHeight: 1.5,
        shrinkAllowed: false,
        weight: 500,
        letterSpacingPx: 0.6,
      },
      color: {
        textWarm: '#F6E2BC',
        textWarmBright: '#FBE9C8',
        inkDark: '#26170F',
        paperWarm: '#D9AF68',
        paperOpacity: 0.82,
        paperEdge: '#6A3A20',
        pressedOpacity: 0.72,
      },
      motion: {
        promptRevealMs: 160,
        pressedMs: 120,
        stateCrossfadeMs: 160,
        maxStateCrossfadeMs: 180,
        reducedMotion: {
          translationPx: 0,
          scaleDelta: 0,
          rotationDeg: 0,
          promptRevealMs: 150,
          stateCrossfadeMs: 150,
        },
      },
      touch: {
        minimumWidthPx: 44,
        minimumHeightPx: 44,
        minimumAdjacentEdgeGapPx: 8,
        feedback: 'opacity-only; no transform, reflow, glow or reward pulse',
      },
    },
    scenes: {
      scene_01_home_shot_001: {
        copyKey: 'h1',
        showAfterStableMs: 500,
        maxShows: 1,
        layout: {
          promptBounds: { x: 40, y: 214, width: 108, height: 38 },
          anchorObject: 'left-wall-hook',
          localPaper: false,
          fallbackAdvanceRegion: { x: 0, y: 52, width: 390, height: 748 },
        },
        interaction: {
          promptHitTarget: { x: 32, y: 194, width: 136, height: 78 },
          promptOrCurrentPictureAdvances: true,
          pressedFeedbackMs: 120,
        },
        source: 'source/h1-put-down-outerwear.svg',
      },
      scene_01_home_shot_002: {
        copyKey: 'h2',
        showAfterStableMs: 2500,
        maxShows: 1,
        hideOnFirstAdvance: true,
        layout: {
          promptBounds: { x: 190, y: 620, width: 176, height: 76 },
          anchorObject: 'open-floor-right-of-adult',
          localPaper: false,
          paperFallbackOnlyIfRuntimeBackdropBreaksContrast: true,
          lineBreakAfter: '轻轻碰一下，',
        },
        interaction: {
          wholePictureAdvances: true,
          pageHitTarget: { x: 0, y: 52, width: 390, height: 748 },
          pressedFeedbackMs: 120,
        },
        source: 'source/h2-advance-hint.svg',
      },
      scene_01_home_shot_004: {
        showAfterStableMs: 300,
        layout: {
          standardModePaper: false,
          largeModePaper: 'table-edge-warm-paper',
          largeModePaperSource: 'source/h4-large-table-paper.svg',
        },
        actions: {
          eat: {
            copyKey: 'h4Eat',
            equalWeight: true,
            idempotent: true,
            anchorObject: 'warm-ochre-dish',
            labelBounds: { x: 180, y: 474, width: 76, height: 38 },
            hitTarget: { x: 144, y: 346, width: 146, height: 170 },
            source: 'source/h4-eat.svg',
            resultStates: ['ate', 'both'],
          },
          sip: {
            copyKey: 'h4Sip',
            equalWeight: true,
            idempotent: true,
            anchorObject: 'nearer-warm-water-cup',
            labelBounds: { x: 296, y: 474, width: 86, height: 38 },
            hitTarget: { x: 299, y: 346, width: 83, height: 170 },
            source: 'source/h4-sip-warm-water.svg',
            resultStates: ['sipped', 'both'],
          },
        },
        interaction: {
          adjacentEdgeGapPx: 9,
          blankPictureAdvances: true,
          blankAdvanceExcludesActionTargets: true,
          pressedFeedbackMs: 120,
          stateCrossfadeMs: 160,
          stateMeaning: 'Static object-state feedback only; no checkmark, success word, progress or completion event.',
        },
        allowedStates: ['none', 'ate', 'sipped', 'both'],
        forbiddenWrites: [
          'completedNightIds',
          'unlockedNightIds',
          'nightCompleted',
          'reward',
          'progress',
        ],
      },
    },
    evidence: {
      geometry: 'evidence/geometry-report.json',
      contrast: 'evidence/contrast-report.json',
      pixelContrast: 'evidence/pixel-contrast-report.json',
      standardAndLargeComposites: 'evidence/',
      reducedMotionComposite: 'evidence/h4-both-reduced-390x844.png',
    },
  };
}

export async function buildHomeMealUiEvidence() {
  const sharp = await loadSharp();
  await mkdir(evidenceDir, { recursive: true });
  const verifiedH4Inputs = await assertApprovedH4Inputs();
  await writeUiSources();

  await compose(sharp, {
    base: scenePath(1), overlay: h1Overlay(), output: 'h1-standard-390x844.png',
  });
  await compose(sharp, {
    base: scenePath(1), overlay: h1Overlay({ large: true }), output: 'h1-large-390x844.png',
  });
  await compose(sharp, {
    base: scenePath(2), overlay: h2Overlay(), output: 'h2-standard-390x844.png',
  });
  await compose(sharp, {
    base: scenePath(2), overlay: h2Overlay({ large: true }), output: 'h2-large-390x844.png',
  });

  const stateOutputs = [];
  for (const state of ['none', 'ate', 'sipped', 'both']) {
    const output = `h4-${state}-standard-390x844.png`;
    await compose(sharp, { base: h4StatePath(state), overlay: h4Overlay(), output });
    stateOutputs.push(join(evidenceDir, output));
  }
  await stateBoard(sharp, stateOutputs, 'h4-standard-state-board.png');

  await compose(sharp, {
    base: h4StatePath('none'), overlay: h4Overlay({ large: true }), output: 'h4-none-large-390x844.png',
  });
  await compose(sharp, {
    base: h4StatePath('both'), overlay: h4Overlay(), output: 'h4-both-reduced-390x844.png',
  });

  for (const viewport of [
    { width: 360, height: 800, name: '360x800' },
    { width: 430, height: 932, name: '430x932' },
    { width: 430, height: 844, name: '430x844-pressure' },
  ]) {
    await compose(sharp, {
      base: h4StatePath('none'),
      overlay: h4Overlay(viewport),
      output: `h4-none-standard-${viewport.name}.png`,
      width: viewport.width,
      height: viewport.height,
    });
  }

  const generatedFiles = [
    'h1-standard-390x844.png',
    'h1-large-390x844.png',
    'h2-standard-390x844.png',
    'h2-large-390x844.png',
    ...['none', 'ate', 'sipped', 'both'].map((state) => `h4-${state}-standard-390x844.png`),
    'h4-standard-state-board.png',
    'h4-none-large-390x844.png',
    'h4-both-reduced-390x844.png',
    'h4-none-standard-360x800.png',
    'h4-none-standard-430x932.png',
    'h4-none-standard-430x844-pressure.png',
  ];
  const outputHashes = {};
  for (const file of generatedFiles) outputHashes[file] = await sha256(join(evidenceDir, file));

  const report = {
    status: 'PASS / UI OWNER EVIDENCE BUILT / USER VISUAL APPROVAL PENDING',
    contractId: 'HOME-MEAL-QUIET-UI-V1-A',
    uiDir,
    inputHashes: {
      h4States: verifiedH4Inputs.states,
      upstreamRecords: verifiedH4Inputs.upstreamRecords,
    },
    generatedFiles,
    outputHashes,
    invariants: {
      actionFontPx: 16,
      helperFontPx: 14,
      largeActionFontPx: 19.2,
      largeHelperFontPx: 16.8,
      shrinkAllowed: false,
      pressedFeedbackMs: 120,
      responseCrossfadeMs: 160,
      reducedMotionCrossfadeMs: 150,
      reducedMotionTransform: 0,
    },
  };
  await writeFile(join(evidenceDir, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(join(uiDir, 'home-meal-ui-contract.json'), `${JSON.stringify(buildContract(), null, 2)}\n`);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await buildHomeMealUiEvidence();
}
