#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const required = {
  'docs/README.md': [
    'FORMAL-UI-V1-2-A-APPROVAL.md',
    'FORMAL-UI-PROPOSAL-V1-2.md',
    'INDOOR-N01-CORE-PROPOSAL-V1.md',
    'INDOOR-N01-PROTOTYPE-V1.md',
    'CHARACTER-BIBLE.md',
    'NIGHTS-CONTENT.md',
    'ASSET-PROVENANCE.md',
    'GATE-CHECKLISTS.md',
    'RESEARCH-TEST-KIT.md',
    'QUALITY-VALIDATION.md',
  ],
  'docs/CHARACTER-BIBLE.md': [
    '成年人背影＋普通家猫',
    '正常成年人比例',
    '不穿衣、不直立、不拿道具',
    '人物发梢/衣角→猫耳/尾尖',
    '整组漂浮',
    'Gate C 分层最小集',
    '48px 黑剪影',
    '7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d',
  ],
  'docs/NIGHTS-CONTENT.md': [
    '一小会儿 · 3 分钟',
    '慢一点 · 5 分钟',
    '多坐一会儿 · 8 分钟',
    '把这点光，带到壶边。',
    '水热了。你也先缓一会儿。',
    '关掉三盏多余小灯',
    '外面有脚步。把门打开吧。',
    '全程不出现第三个可见角色',
    '有人给你留了一盏灯',
  ],
  'docs/ASSET-PROVENANCE.md': [
    '`asset_id`',
    '`license_snapshot`',
    '`generator_record`',
    '`human_redraw`',
    '`sha256`',
    '`AUD-N01-001`',
    '耳机/微信真机/用户听感待验',
  ],
  'docs/GATE-CHECKLISTS.md': [
    'Gate B：UI 视觉方向',
    'Gate C：可丢弃高保真竖切片',
    'Gate D：正式开发',
    '第四夜的核心行为是关掉',
    '无第三个可见角色',
  ],
  'docs/RESEARCH-TEST-KIT.md': [
    '8 人原创盲测',
    '6–10 人体验测试',
    '2 人或以上',
    '3 人或以上',
    '通过线≥80%',
    '通过线≥70%',
  ],
  'docs/QUALITY-VALIDATION.md': [
    '主包（不含分包和 remote）',
    '≤ 4 MiB',
    '≤ 20 MiB',
    '输入反应 P95≤100ms',
    '≥44×44 逻辑像素',
    '复杂手势替代',
    'VoiceOver',
    'TalkBack',
  ],
  'docs/templates/asset-register.csv': ['asset_id,display_name,category,night_scope'],
  'assets/asset-register.csv': [
    'CHR-COMMON-001',
    'CHR-COMMON-002',
    'CHR-COMMON-003',
    'BRD-COMMON-001',
    'UI-COMMON-001',
    'OBJ-N01-001',
    'AUD-N01-001',
    'EXP-OUTDOOR-007',
    'EXP-N01-UI-004',
    'EXP-N01-UI-005',
  ],
  'docs/PROJECT-MEMORY.md': [
    'Outdoor V7 / Gate C baseline',
    'Formal UI V1.2',
    '角落不能黑',
    'FORMAL-UI-PROPOSAL-V1.2',
    '成年人及一只小猫',
    '普通、清澈的深蓝星空占主体',
    'Gate C / B2-P 期间仍需确认的内容',
    '7157484b95988b11c1abdf9ddc0d5bb7c2d3bde25dd9d2dfcf6c5ee795847b3d',
  ],
  'docs/FORMAL-UI-PROPOSAL-V1-2.md': [
    '灯一直为你亮着',
    '进门后整屋亮起',
    '场景语义高亮度，屏幕输出中亮度',
    '角落不能黑',
    '076ea53dcbc7a5e6c2d4920a9a21adfaf60c4e7880c7864cd5d28baf04adf347',
    'DRIFT / BLOCKED',
  ],
  'docs/FORMAL-UI-V1-2-A-APPROVAL.md': [
    '批准 FORMAL-UI-V1.2-A 灯一直为你亮着',
    'ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a',
    'eb8a086a56e570784291e5a838e22ceb7fad2f205c3d4de2f37a691dbf703620',
    'APPROVED FOR EDITABLE MASTER',
    '第二次批准前不得接入 Cocos',
  ],
  'docs/INDOOR-N01-CORE-PROPOSAL-V1.md': [
    '壶盖轻响',
    '批准 INDOOR-N01-CORE-V1 壶盖轻响',
    'DRIFT / BLOCKED',
    '120×112px',
    '水热了。你也先缓一会儿。',
  ],
  'docs/INDOOR-N01-PROTOTYPE-V1.md': [
    '批准 INDOOR-N01-PROTOTYPE-V1：壶盖轻响',
    'ad65d6fa811487fe5bd69726f1c5bf9d4b4c983d517c360b7087ff42f89cb36a',
    'LOCAL BROWSER CHECK PASS / USER EXPERIENCE REVIEW PENDING',
    '不得复制到 `cocos-project/assets/`',
    '水热了。你也先缓一会儿。',
  ],
};

const contents = new Map();

for (const [relativePath, phrases] of Object.entries(required)) {
  const absolutePath = resolve(repoRoot, relativePath);
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    errors.push(`missing required file: ${relativePath}`);
    continue;
  }

  const content = readFileSync(absolutePath, 'utf8');
  contents.set(relativePath, content);
  for (const phrase of phrases) {
    if (!content.includes(phrase)) {
      errors.push(`${relativePath}: missing required phrase: ${phrase}`);
    }
  }
}

const forbidden = [
  '中空长滴环',
  '灯灵的中空环',
  '调整小灯方向',
  '把灯转向他们中间',
  '把小灯留在窗边',
];

for (const [relativePath, content] of contents) {
  for (const phrase of forbidden) {
    if (content.includes(phrase)) {
      errors.push(`${relativePath}: contains superseded phrase: ${phrase}`);
    }
  }
}

const research = contents.get('docs/RESEARCH-TEST-KIT.md') ?? '';
const blindRows = research.match(/^\| P0[1-8] \|/gm) ?? [];
const experienceRows = research.match(/^\| E(?:0[1-9]|10) \|/gm) ?? [];
if (blindRows.length !== 8) {
  errors.push(`research kit: expected 8 blind-test rows, found ${blindRows.length}`);
}
if (experienceRows.length !== 10) {
  errors.push(`research kit: expected 10 experience-test rows, found ${experienceRows.length}`);
}

const assetRegister = contents.get('assets/asset-register.csv') ?? '';
const assetRows = assetRegister.trim().split(/\r?\n/);
const assetHeader = assetRows.shift()?.split(',') ?? [];
const assetIdIndex = assetHeader.indexOf('asset_id');
const finalPathIndex = assetHeader.indexOf('final_path');
const sourcePathIndex = assetHeader.indexOf('source_path');
const hashIndex = assetHeader.indexOf('sha256');
const gateIndex = assetHeader.indexOf('gate_status');
const expectedAudioAsset = {
  id: 'AUD-N01-001',
  finalPath: 'cocos-project/assets/resources/audio/night-room-loop.ogg',
  sourcePath: 'assets/final/audio/night-room-loop.ogg',
  sha256: 'd2b5df60c879dd9b3c4be65132b17605820d312259dff2e98fcdc47ea7b14b30',
  gateStatus: 'draft',
};
let foundExpectedAudioAsset = false;

if (
  assetHeader.length !== 21 ||
  assetIdIndex < 0 ||
  finalPathIndex < 0 ||
  sourcePathIndex < 0 ||
  hashIndex < 0 ||
  gateIndex < 0
) {
  errors.push('asset register: expected the 21-field production header');
} else {
  for (const row of assetRows) {
    const columns = row.split(',');
    if (columns.length !== assetHeader.length) {
      errors.push(`asset register: malformed row with ${columns.length} fields: ${columns[0] ?? 'unknown'}`);
      continue;
    }
    const finalPath = columns[finalPathIndex];
    if (finalPath === 'not-in-build') continue;
    const absolutePath = resolve(repoRoot, finalPath);
    if (!existsSync(absolutePath)) {
      errors.push(`asset register: missing final asset: ${finalPath}`);
      continue;
    }
    const actualHash = createHash('sha256').update(readFileSync(absolutePath)).digest('hex');
    if (actualHash !== columns[hashIndex]) {
      errors.push(`asset register: sha256 mismatch for ${finalPath}`);
    }

    if (columns[assetIdIndex] === expectedAudioAsset.id) {
      foundExpectedAudioAsset = true;
      if (finalPath !== expectedAudioAsset.finalPath) {
        errors.push(`asset register: ${expectedAudioAsset.id} has an unexpected final_path`);
      }
      if (columns[sourcePathIndex] !== expectedAudioAsset.sourcePath) {
        errors.push(`asset register: ${expectedAudioAsset.id} has an unexpected source_path`);
      }
      if (columns[hashIndex] !== expectedAudioAsset.sha256) {
        errors.push(`asset register: ${expectedAudioAsset.id} does not use the verified sha256`);
      }
      if (columns[gateIndex] !== expectedAudioAsset.gateStatus) {
        errors.push(`asset register: ${expectedAudioAsset.id} must remain draft until listening gates pass`);
      }

      const absoluteSourcePath = resolve(repoRoot, columns[sourcePathIndex]);
      if (!existsSync(absoluteSourcePath) || !statSync(absoluteSourcePath).isFile()) {
        errors.push(`asset register: missing audio source asset: ${columns[sourcePathIndex]}`);
      } else {
        const sourceHash = createHash('sha256').update(readFileSync(absoluteSourcePath)).digest('hex');
        if (sourceHash !== actualHash) {
          errors.push(`asset register: ${expectedAudioAsset.id} source and packaged copies differ`);
        }
      }
    }

    if (columns[gateIndex] === 'approved') {
      errors.push(`asset register: ${finalPath} cannot be approved before the recorded human gates`);
    }
    if (finalPath.endsWith('.svg')) {
      const svg = readFileSync(absolutePath, 'utf8');
      if (!svg.includes('<metadata>')) errors.push(`asset register: ${finalPath} is missing metadata`);
      if (/(?:href|src)=["']https?:\/\//i.test(svg)) {
        errors.push(`asset register: ${finalPath} contains a remote dependency`);
      }
    }
  }

  if (!foundExpectedAudioAsset) {
    errors.push(`asset register: missing required audio asset ${expectedAudioAsset.id}`);
  }
}

for (const [relativePath, content] of contents) {
  if (!relativePath.endsWith('.md')) continue;
  const sourceDirectory = dirname(resolve(repoRoot, relativePath));
  const links = content.matchAll(/\[[^\]]+\]\((\.\.?\/[^)#?]+)(?:#[^)]*)?\)/g);
  for (const link of links) {
    const target = resolve(sourceDirectory, decodeURIComponent(link[1]));
    if (!existsSync(target)) {
      errors.push(`${relativePath}: broken relative link: ${link[1]}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Documentation verification failed (${errors.length} issue(s)):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Documentation verification passed (${Object.keys(required).length} files).`);
console.log('Checked: required sections, final character/night decisions, asset hashes/statuses, test rows, and relative links.');
