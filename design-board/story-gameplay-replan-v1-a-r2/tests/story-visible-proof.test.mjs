import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const packageRoot = path.resolve('design-board/story-gameplay-replan-v1-a-r2');
const dataPath = path.join(packageRoot, 'story-data.js');
const htmlPath = path.join(packageRoot, 'index.html');
const sessionPath = path.join(packageRoot, 'storyboard-project/scenes/evening_session.yaml');
const nodesPath = path.join(packageRoot, 'storyboard-project/shots/story_nodes.yaml');
const r1Path = path.resolve('.superpowers/brainstorm/51330-1788246254/content/complete-evening-slice-v1.html');

const canonicalIds = [
  'ROOT_STILL', 'WIND_AWAKENS', 'LOOK_UP', 'EYES_ADJUST', 'STAR_OCCLUDED', 'FOLLOW_CLOUD',
  'STAR_RETURNS', 'WIDE_SKY', 'METEOR_EVENT', 'AFTER_METEOR', 'DOOR_MATCH_CUT', 'ARRIVAL_H1',
  'KITCHEN_CALL', 'COOK_AND_SERVE', 'TABLE_RITUAL', 'LEAVE_THE_LIGHT'
];

const expectedSnapshotKeys = [
  'nodeId', 'safeNodeId', 'audioUnlocked', 'sound', 'reducedMotion', 'largeText', 'windToken',
  'mainStarKnown', 'eyesAdjusted', 'followedCloud', 'catSettled', 'meteorOrigin', 'coatHung',
  'meteorPresentation', 'kitchenEntered', 'kettleWarm', 'mealServed', 'firstTableAction', 'ate', 'sipped', 'lightChoice',
  'actionLog'
];

async function loadText(url) {
  return readFile(decodeURI(url.pathname), 'utf8');
}

async function contractFetch(url) {
  return { ok: true, text: () => loadText(url) };
}

test('loads and validates the frozen 16-node YAML contract instead of a second narrative', async () => {
  const { loadStoryContract } = await import('../story-data.js');
  const contract = await loadStoryContract(contractFetch);

  assert.deepEqual(contract.canonicalStateIds, canonicalIds);
  assert.equal(contract.nodes.length, 16);
  assert.equal(contract.nodeById.get('EYES_ADJUST').id, 'EYES_ADJUST');
  assert.equal(contract.nodeById.get('KITCHEN_CALL').id, 'KITCHEN_CALL');
});

test('uses approved project-root asset variants and chooses all supported phone viewports', async () => {
  const { APPROVED_ASSET_PATHS, selectViewportVariant } = await import('../story-data.js');
  const f2 = APPROVED_ASSET_PATHS.stargazeF2.variant('390x844');

  assert.equal(f2, '/design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages/scene_02_stargaze_shot_002/exports/390x844/scene_02_stargaze_shot_002.png');
  assert.equal(APPROVED_ASSET_PATHS.stargazeF2.sha256_390x844, '98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52');
  assert.equal(APPROVED_ASSET_PATHS.root.variant('390x844'), '/design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem/exports/390x844/root_night_slope_v2-wind-hem-r4-manual.png');
  assert.equal(APPROVED_ASSET_PATHS.homeH5.variant('390x844'), '/design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1/exports/390x844/scene_01_home_shot_005.png');
  assert.deepEqual(
    [[360, 800], [390, 844], [430, 932], [430, 844]].map(([width, height]) => selectViewportVariant(width, height)),
    ['360x800', '390x844', '430x932', '430x844-pressure']
  );
  assert.equal(selectViewportVariant(1280, 720), '390x844');
});

test('contains the complete R2 proof behaviors, copy, and accessibility boundaries', async () => {
  const [html, data] = await Promise.all([readFile(htmlPath, 'utf8'), readFile(dataPath, 'utf8')]);
  for (const required of [
    '今夜 · 银河深处',
    '眼睛慢慢看清了',
    '起初只有一片深蓝。再停一会儿，银河里的暗裂才慢慢分开。',
    '回家 · 屋里',
    '厨房那边，轻轻响了一声',
    '外衣放下以后，才听见锅里还留着一点热气。',
    'EYES_ADJUST', 'KITCHEN_CALL', 'window.__storyR2Debug', 'snapshot', 'reset', 'goTo',
    'setTimeout', '720', '560', 'kitchenEntered', 'mainStarKnown', 'eyesAdjusted',
    'meteorOrigin', 'outside', 'window', 'audioUnlocked', 'reducedMotion', 'largeText',
    '--copy-scale: 1.2', '≤180ms', 'prototype-only'
  ]) assert.match(`${html}\n${data}`, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  assert.doesNotMatch(`${html}\n${data}`, /\/files\//);
  assert.doesNotMatch(html, /01\/16|16\/16|完成率|进度|任务|奖励|成功/);
  assert.match(html, /kitchen-warm-zone/);
  assert.match(html, /min-width:\s*44px/);
  assert.match(html, /first-touch/);
  assert.match(data, /storyboard-project\/scenes\/evening_session\.yaml/);
  assert.match(data, /storyboard-project\/shots\/story_nodes\.yaml/);
});

test('exposes every retained field through the browser debug snapshot', async () => {
  const [html, data] = await Promise.all([readFile(htmlPath, 'utf8'), readFile(dataPath, 'utf8')]);
  assert.match(html, /const snapshot = \(\) => Object\.freeze\(\{ \.\.\.state/);
  for (const field of expectedSnapshotKeys) assert.match(`${html}\n${data}`, new RegExp(`\\b${field}\\b`));
});

test('the browser page imports and drives the shared story state machine', async () => {
  const html = await readFile(htmlPath, 'utf8');
  const moduleScript = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1] ?? '';

  assert.match(moduleScript, /import\s*\{[^}]*\bcreateStoryState\b[^}]*\}\s*from\s*['"]\.\/story-data\.js['"]/s);
  assert.match(moduleScript, /import\s*\{[^}]*\badvanceStoryState\b[^}]*\}\s*from\s*['"]\.\/story-data\.js['"]/s);
  assert.match(moduleScript, /import\s*\{[^}]*\bmarkRootInvitationsReady\b[^}]*\}\s*from\s*['"]\.\/story-data\.js['"]/s);
  assert.match(moduleScript, /state\s*=\s*createStoryState\s*\(/);
  assert.match(moduleScript, /state\s*=\s*advanceStoryState\s*\(/);
  assert.match(moduleScript, /state\s*=\s*markRootInvitationsReady\s*\(/);
  assert.doesNotMatch(moduleScript, /\bfreshState\b/);
});

test('binds F2 hold and light tap to a pointer-enabled child zone with disposable timers', async () => {
  const html = await readFile(htmlPath, 'utf8');

  assert.match(html, /\.eyes-hold-zone\s*\{[^}]*pointer-events:\s*auto/s);
  assert.match(html, /eyes-hold-zone/);
  assert.match(html, /holdZone\.addEventListener\(['"]pointerdown['"]/);
  assert.match(html, /holdZone\.addEventListener\(['"]pointerup['"]/);
  assert.match(html, /holdZone\.addEventListener\(['"]pointercancel['"]/);
  assert.doesNotMatch(html, /hotspots\.addEventListener\(['"]pointer(?:down|up|cancel)['"]/);
  assert.match(html, /cancelHoldTimer\s*\(/);
  assert.match(html, /schedule\([^)]*720/s);
});

test('keeps one root invitation timer, refreshes settings labels, and uses progressive H5 controls', async () => {
  const html = await readFile(htmlPath, 'utf8');

  assert.match(html, /rootInvitationTimer/);
  assert.match(html, /rootInvitationsReady/);
  assert.match(html, /声音：\$\{state\.sound \? '开' : '关'\}/);
  assert.match(html, /减少动态：\$\{state\.reducedMotion \? '开' : '关'\}/);
  assert.match(html, /大字：\$\{state\.largeText \? '开' : '关'\}/);
  assert.match(html, /phone\.addEventListener\(['"]pointerdown['"][^;]*unlockAudio/s);
  for (const copy of ['留一盏灯', '再坐一会儿', '今晚到这里', '回到草坡']) assert.match(html, new RegExp(copy));
  assert.match(html, /state\.leaveStage\s*===\s*['"]choice['"]/);
  assert.match(html, /state\.leaveStage\s*===\s*['"]feedback['"]/);
  assert.match(html, /state\.leaveStage\s*===\s*['"]ended['"]/);
});

test('keeps the F2 blank-space gesture zone transparent and shows only the continuation after reveal', async () => {
  const html = await readFile(htmlPath, 'utf8');
  assert.match(html, /if \(!state\.eyesAdjusted\)[\s\S]*eyes-hold-zone/);
  assert.doesNotMatch(html, /button\('轻轻碰一下'/);
  assert.match(html, /if \(state\.eyesAdjusted\) hotspots\.append\(button\('继续看云'/);
});

test('keeps the replay guard on legal meteor edges and preserves the approved finale pacing', async () => {
  const [html, dataModule] = await Promise.all([readFile(htmlPath, 'utf8'), import('../story-data.js')]);

  assert.deepEqual(dataModule.METEOR_TIMING, Object.freeze({ quietBefore: 900, streak: 800, tail: 450, quietAfter: 1000, copyFade: 180, reducedFade: 180 }));
  assert.match(html, /animation:\s*meteor 1250ms[^;]*900ms/);
  assert.match(html, /state\.meteorPresentation === 'first'/);
  assert.match(html, /meteor-skip-zone/);
  assert.match(html, /METEOR_TIMING\.quietBefore/);
  assert.match(html, /METEOR_TIMING\.quietAfter/);
  assert.match(html, /METEOR_TIMING\.copyFade/);
});

test('keeps reviewer identity out of phone alt text and builds copy as text nodes', async () => {
  const html = await readFile(htmlPath, 'utf8');
  assert.doesNotMatch(html, /approved scene/);
  assert.doesNotMatch(html, /copyEl\.innerHTML/);
  assert.match(html, /function altForNode/);
  assert.match(html, /\.textContent = copy\.(?:kicker|title|body)/);
  assert.match(html, /function render\(\) \{\s*if \(!state \|\| !contract\) return;/);
});

test('runs the complete route and retained consequences through the shared pure story state machine', async () => {
  const { advanceStoryState, buildEndingConsequences, createStoryState, markRootInvitationsReady } = await import('../story-data.js');

  let route = markRootInvitationsReady(createStoryState());
  route = advanceStoryState(route, 'START_WIND');
  route = advanceStoryState(route, { type: 'GESTURE_TAP' });
  assert.deepEqual({ nodeId: route.nodeId, gestureTaps: route.gestureTaps }, { nodeId: 'WIND_AWAKENS', gestureTaps: 1 });
  route = advanceStoryState(route, { type: 'GESTURE_TAP' });
  assert.deepEqual({ nodeId: route.nodeId, windToken: route.windToken, gestureTaps: route.gestureTaps, gestureStart: route.gestureStart }, { nodeId: 'ROOT_STILL', windToken: 'petal', gestureTaps: 0, gestureStart: null });

  route = advanceStoryState(route, 'START_LOOK_UP');
  route = advanceStoryState(route, 'LOOK_UP_COMPLETE');
  route = advanceStoryState(route, 'EYES_REVEALED');
  assert.deepEqual({ nodeId: route.nodeId, mainStarKnown: route.mainStarKnown, eyesAdjusted: route.eyesAdjusted }, { nodeId: 'EYES_ADJUST', mainStarKnown: true, eyesAdjusted: true });
  route = advanceStoryState(route, 'EYES_CONTINUE');
  route = advanceStoryState(route, 'START_FOLLOW_CLOUD');
  route = advanceStoryState(route, { type: 'GESTURE_START', clientX: 92 });
  route = advanceStoryState(route, { type: 'GESTURE_END', clientX: 151 });
  assert.deepEqual({ nodeId: route.nodeId, followedCloud: route.followedCloud, catSettled: route.catSettled, gestureStart: route.gestureStart }, { nodeId: 'STAR_RETURNS', followedCloud: true, catSettled: true, gestureStart: null });
  route = advanceStoryState(route, 'STAR_SETTLED');
  assert.deepEqual({ nodeId: route.nodeId, catSettled: route.catSettled }, { nodeId: 'WIDE_SKY', catSettled: true });

  let meteorRoute = advanceStoryState(route, 'START_METEOR');
  assert.deepEqual({ nodeId: meteorRoute.nodeId, meteorOrigin: meteorRoute.meteorOrigin, meteorPlayed: meteorRoute.meteorPlayed }, { nodeId: 'METEOR_EVENT', meteorOrigin: 'outside', meteorPlayed: true });
  meteorRoute = advanceStoryState(meteorRoute, 'METEOR_SETTLED');
  meteorRoute = advanceStoryState(meteorRoute, 'STAY_OUTSIDE');
  assert.equal(advanceStoryState(meteorRoute, 'START_METEOR').nodeId, 'ROOT_STILL');
  assert.equal(meteorRoute.meteorOrigin, 'outside');
  const revisitedWideSky = advanceStoryState({ ...meteorRoute, nodeId: 'WIDE_SKY' }, 'START_METEOR');
  assert.deepEqual(
    { nodeId: revisitedWideSky.nodeId, meteorOrigin: revisitedWideSky.meteorOrigin, meteorPlayed: revisitedWideSky.meteorPlayed, meteorPresentation: revisitedWideSky.meteorPresentation },
    { nodeId: 'METEOR_EVENT', meteorOrigin: 'outside', meteorPlayed: true, meteorPresentation: 'suppressed' }
  );
  const revisitedAfter = advanceStoryState(revisitedWideSky, 'METEOR_SETTLED');
  assert.equal(revisitedAfter.nodeId, 'AFTER_METEOR');
  assert.equal(advanceStoryState(createStoryState(), 'DIRECT_HOME').meteorOrigin, 'window');

  const wind = advanceStoryState(createStoryState({ nodeId: 'WIND_AWAKENS', gestureTaps: 1, gestureStart: 96 }), 'WIND_COMPLETE');
  assert.deepEqual({ nodeId: wind.nodeId, windToken: wind.windToken, gestureTaps: wind.gestureTaps, gestureStart: wind.gestureStart }, { nodeId: 'ROOT_STILL', windToken: 'petal', gestureTaps: 0, gestureStart: null });
  const followed = advanceStoryState(createStoryState({ nodeId: 'FOLLOW_CLOUD', gestureTaps: 1, gestureStart: 96 }), 'FOLLOW_CLOUD_COMPLETE');
  assert.deepEqual({ nodeId: followed.nodeId, followedCloud: followed.followedCloud, gestureTaps: followed.gestureTaps }, { nodeId: 'STAR_RETURNS', followedCloud: true, gestureTaps: 0 });
  assert.equal(advanceStoryState(followed, 'STAR_SETTLED').catSettled, true);

  let ending = createStoryState({ nodeId: 'LEAVE_THE_LIGHT', windToken: 'petal', meteorOrigin: 'outside', ate: true, sipped: true });
  ending = advanceStoryState(ending, 'CHOOSE_LEAVE_LIGHT');
  assert.deepEqual({ lightChoice: ending.lightChoice, leaveStage: ending.leaveStage }, { lightChoice: 'leave', leaveStage: 'feedback' });
  ending = advanceStoryState(ending, 'END_EVENING');
  assert.deepEqual({ nodeId: ending.nodeId, leaveStage: ending.leaveStage, lightChoice: ending.lightChoice }, { nodeId: 'LEAVE_THE_LIGHT', leaveStage: 'ended', lightChoice: 'leave' });
  ending = advanceStoryState(ending, 'RETURN_TO_ROOT');
  assert.deepEqual({ nodeId: ending.nodeId, windToken: ending.windToken, meteorOrigin: ending.meteorOrigin, ate: ending.ate, lightChoice: ending.lightChoice }, { nodeId: 'ROOT_STILL', windToken: 'petal', meteorOrigin: 'outside', ate: true, lightChoice: 'leave' });

  const markers = Object.fromEntries(buildEndingConsequences(createStoryState({
    nodeId: 'LEAVE_THE_LIGHT', windToken: 'petal', meteorOrigin: 'window', catSettled: true, coatHung: true,
    kitchenEntered: true, kettleWarm: true, mealServed: true, ate: true, sipped: true, lightChoice: 'leave'
  })).map(({ key, text }) => [key, text]));
  assert.match(markers.wind, /花瓣|草籽/);
  assert.match(markers.meteor, /窗边/);
  assert.match(markers.cat, /靠近/);
  assert.match(markers.coat, /挂钩/);
  assert.match(markers.meal, /端到桌上/);
  assert.match(markers.ate, /吃过/);
  assert.match(markers.sipped, /喝过/);
  assert.match(markers.light, /留/);

  const ready = markRootInvitationsReady(createStoryState());
  assert.equal(ready.rootInvitationsReady, true);
  assert.deepEqual(markRootInvitationsReady(ready), ready);
});

test('does not drift the approved R1 browser proof', async () => {
  const crypto = await import('node:crypto');
  const r1 = await readFile(r1Path);
  assert.equal(crypto.createHash('sha256').update(r1).digest('hex'), '760a0cba95d715c97cc3814b58be7206bf89727bb221036fec7e39f0fe554836');
  assert.ok(await readFile(sessionPath, 'utf8'));
  assert.ok(await readFile(nodesPath, 'utf8'));
});
