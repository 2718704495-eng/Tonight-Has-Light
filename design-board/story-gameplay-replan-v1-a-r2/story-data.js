const CANONICAL_STATE_IDS = Object.freeze([
  'ROOT_STILL', 'WIND_AWAKENS', 'LOOK_UP', 'EYES_ADJUST', 'STAR_OCCLUDED', 'FOLLOW_CLOUD',
  'STAR_RETURNS', 'WIDE_SKY', 'METEOR_EVENT', 'AFTER_METEOR', 'DOOR_MATCH_CUT', 'ARRIVAL_H1',
  'KITCHEN_CALL', 'COOK_AND_SERVE', 'TABLE_RITUAL', 'LEAVE_THE_LIGHT'
]);

const sizes = new Set(['360x800', '390x844', '430x932', '430x844-pressure']);
const root = '/design-system/formal-picturebook-fullframe-v1-a-root-r4-manual-hem';
const stargaze = '/design-system/formal-picturebook-fullframe-v1-a-stargaze-formal-batch-v1-a/pages';
const home = '/design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages';

const sized = (base, filename) => Object.freeze({ variant: (size) => `${base}/exports/${sizes.has(size) ? size : '390x844'}/${filename}` });

export const APPROVED_ASSET_PATHS = Object.freeze({
  root: sized(root, 'root_night_slope_v2-wind-hem-r4-manual.png'),
  stargazeF1: sized(`${stargaze}/scene_02_stargaze_shot_001`, 'scene_02_stargaze_shot_001.png'),
  stargazeF2: Object.freeze({
    ...sized(`${stargaze}/scene_02_stargaze_shot_002`, 'scene_02_stargaze_shot_002.png'),
    sha256_390x844: '98e267506a5485a93fdefa9759611c0ac4de2120edd5dc61d253a9ff59deee52'
  }),
  stargazeF3: sized(`${stargaze}/scene_02_stargaze_shot_003`, 'scene_02_stargaze_shot_003.png'),
  stargazeF4: sized(`${stargaze}/scene_02_stargaze_shot_004`, 'scene_02_stargaze_shot_004.png'),
  stargazeF5: sized('/design-system/formal-picturebook-fullframe-v1-a-batch1', 'scene_02_stargaze_shot_005.png'),
  homeH1: sized(`${home}/scene_01_home_shot_001`, 'scene_01_home_shot_001.png'),
  homeH2: sized(`${home}/scene_01_home_shot_002`, 'scene_01_home_shot_002.png'),
  homeH3: sized(`${home}/scene_01_home_shot_003`, 'scene_01_home_shot_003.png'),
  homeH4: sized(`${home}/scene_01_home_shot_004`, 'scene_01_home_shot_004.png'),
  homeH5: sized('/design-system/formal-picturebook-fullframe-v1-a-home-f5-wide-room-v1-a-r1', 'scene_01_home_shot_005.png'),
  homeH4State: (state) => `/design-system/formal-picturebook-fullframe-v1-a-home-meal-ritual-v1-a/pages/scene_01_home_shot_004/exports/states/scene_01_home_shot_004-${state}-390x844.png`
});

export const METEOR_TIMING = Object.freeze({
  quietBefore: 900,
  streak: 800,
  tail: 450,
  quietAfter: 1000,
  copyFade: 180,
  reducedFade: 180
});

export function selectViewportVariant(width, height) {
  const match = `${width}x${height}`;
  if (match === '430x844') return '430x844-pressure';
  return sizes.has(match) ? match : '390x844';
}

const STORY_STATE_DEFAULTS = Object.freeze({
  nodeId: 'ROOT_STILL', safeNodeId: 'ROOT_STILL', audioUnlocked: false, sound: true, reducedMotion: false,
  largeText: false, windToken: 'none', mainStarKnown: false, eyesAdjusted: false, followedCloud: false,
  catSettled: false, meteorOrigin: 'none', meteorPlayed: false, meteorPresentation: 'none', coatHung: false, kitchenEntered: false,
  kettleWarm: false, mealServed: false, firstTableAction: 'none', ate: false, sipped: false,
  lightChoice: 'none', leaveStage: 'choice', gestureTaps: 0, gestureStart: null,
  rootInvitationsReady: false, actionLog: []
});

export function createStoryState(overrides = {}) {
  return { ...STORY_STATE_DEFAULTS, ...overrides, actionLog: [...(overrides.actionLog || [])] };
}

export function markRootInvitationsReady(state) {
  if (state.nodeId !== 'ROOT_STILL' || state.rootInvitationsReady) return state;
  return { ...state, rootInvitationsReady: true };
}

function resetGesture(state) {
  return { ...state, gestureTaps: 0, gestureStart: null };
}

function moveTo(state, nodeId, safeNodeId = state.safeNodeId) {
  return { ...resetGesture(state), nodeId, safeNodeId };
}

function completeGesture(state) {
  if (state.nodeId === 'WIND_AWAKENS') {
    return { ...moveTo(state, 'ROOT_STILL', 'ROOT_STILL'), windToken: 'petal' };
  }
  if (state.nodeId === 'FOLLOW_CLOUD') {
    return { ...moveTo(state, 'STAR_RETURNS', 'STAR_RETURNS'), followedCloud: true, catSettled: true };
  }
  return resetGesture(state);
}

export function advanceStoryState(state, event) {
  const type = typeof event === 'string' ? event : event.type;
  const current = createStoryState(state);
  switch (type) {
    case 'UNLOCK_AUDIO':
      return current.audioUnlocked ? current : { ...current, audioUnlocked: true };
    case 'TOGGLE_SETTING':
      if (event.setting === 'sound') return { ...current, sound: !current.sound };
      if (event.setting === 'motion') return { ...current, reducedMotion: !current.reducedMotion };
      if (event.setting === 'text') return { ...current, largeText: !current.largeText };
      return current;
    case 'ROOT_INVITATIONS_READY':
      return markRootInvitationsReady(current);
    case 'START_WIND':
      return current.nodeId === 'ROOT_STILL' ? moveTo(current, 'WIND_AWAKENS', 'WIND_AWAKENS') : current;
    case 'WIND_COMPLETE':
      return current.nodeId === 'WIND_AWAKENS' ? { ...moveTo(current, 'ROOT_STILL', 'ROOT_STILL'), windToken: 'petal' } : current;
    case 'START_LOOK_UP':
      return current.nodeId === 'ROOT_STILL' ? { ...moveTo(current, 'LOOK_UP'), mainStarKnown: true } : current;
    case 'LOOK_UP_COMPLETE':
      return current.nodeId === 'LOOK_UP' ? moveTo(current, 'EYES_ADJUST', 'EYES_ADJUST') : current;
    case 'EYES_REVEALED':
      return current.nodeId === 'EYES_ADJUST' ? { ...current, mainStarKnown: true, eyesAdjusted: true } : current;
    case 'EYES_CONTINUE':
      return current.nodeId === 'EYES_ADJUST' && current.eyesAdjusted ? moveTo(current, 'STAR_OCCLUDED') : current;
    case 'START_FOLLOW_CLOUD':
      return current.nodeId === 'STAR_OCCLUDED' ? moveTo(current, 'FOLLOW_CLOUD') : current;
    case 'FOLLOW_CLOUD_COMPLETE':
      return current.nodeId === 'FOLLOW_CLOUD' ? { ...moveTo(current, 'STAR_RETURNS', 'STAR_RETURNS'), followedCloud: true, catSettled: true } : current;
    case 'STAR_SETTLED':
      return current.nodeId === 'STAR_RETURNS' ? { ...moveTo(current, 'WIDE_SKY'), catSettled: true } : current;
    case 'STAR_CONTINUE':
      return current.nodeId === 'STAR_RETURNS' ? moveTo(current, 'WIDE_SKY') : current;
    case 'START_METEOR':
      if (current.nodeId !== 'WIDE_SKY') return current;
      if (current.meteorPlayed) return { ...moveTo(current, 'METEOR_EVENT'), meteorPresentation: 'suppressed' };
      return { ...moveTo(current, 'METEOR_EVENT'), meteorOrigin: 'outside', meteorPlayed: true, meteorPresentation: 'first' };
    case 'METEOR_SETTLED':
      return current.nodeId === 'METEOR_EVENT'
        ? { ...moveTo(current, 'AFTER_METEOR', 'AFTER_METEOR'), meteorPresentation: 'none' }
        : current;
    case 'STAY_OUTSIDE':
      return current.nodeId === 'AFTER_METEOR' ? moveTo(current, 'ROOT_STILL', 'ROOT_STILL') : current;
    case 'DIRECT_HOME':
      if (!['ROOT_STILL', 'AFTER_METEOR'].includes(current.nodeId)) return current;
      return { ...moveTo(current, 'DOOR_MATCH_CUT'), meteorOrigin: current.meteorOrigin === 'none' ? 'window' : current.meteorOrigin };
    case 'MATCH_CUT_SETTLED':
      return current.nodeId === 'DOOR_MATCH_CUT' ? moveTo(current, 'ARRIVAL_H1', 'ARRIVAL_H1') : current;
    case 'COAT_HUNG':
      return current.nodeId === 'ARRIVAL_H1' ? { ...moveTo(current, 'KITCHEN_CALL', 'KITCHEN_CALL'), coatHung: true } : current;
    case 'KITCHEN_RESPONDED':
      return current.nodeId === 'KITCHEN_CALL' ? { ...current, kitchenEntered: true } : current;
    case 'KITCHEN_ARRIVED':
      return current.nodeId === 'KITCHEN_CALL' && current.kitchenEntered ? moveTo(current, 'COOK_AND_SERVE', 'COOK_AND_SERVE') : current;
    case 'KETTLE_WARM':
      return current.nodeId === 'COOK_AND_SERVE' ? { ...current, kettleWarm: true } : current;
    case 'MEAL_SERVED':
      return current.nodeId === 'COOK_AND_SERVE' && current.kettleWarm ? { ...moveTo(current, 'TABLE_RITUAL', 'TABLE_RITUAL'), mealServed: true } : current;
    case 'TABLE_EAT':
      return current.nodeId === 'TABLE_RITUAL' ? { ...current, ate: true, firstTableAction: current.firstTableAction === 'none' ? 'eat' : current.firstTableAction } : current;
    case 'TABLE_SIP':
      return current.nodeId === 'TABLE_RITUAL' ? { ...current, sipped: true, firstTableAction: current.firstTableAction === 'none' ? 'sip' : current.firstTableAction } : current;
    case 'TABLE_SETTLED':
      return current.nodeId === 'TABLE_RITUAL' ? { ...moveTo(current, 'LEAVE_THE_LIGHT', 'LEAVE_THE_LIGHT'), leaveStage: 'choice' } : current;
    case 'CHOOSE_LEAVE_LIGHT':
      return current.nodeId === 'LEAVE_THE_LIGHT' && current.leaveStage === 'choice' ? { ...current, lightChoice: 'leave', leaveStage: 'feedback' } : current;
    case 'CHOOSE_STAY_LIGHT':
      return current.nodeId === 'LEAVE_THE_LIGHT' && current.leaveStage === 'choice' ? { ...current, lightChoice: 'stay', leaveStage: 'feedback' } : current;
    case 'END_EVENING':
      return current.nodeId === 'LEAVE_THE_LIGHT' && current.leaveStage === 'feedback' ? { ...current, leaveStage: 'ended' } : current;
    case 'RETURN_TO_ROOT':
      return current.nodeId === 'LEAVE_THE_LIGHT' ? moveTo(current, 'ROOT_STILL', 'ROOT_STILL') : current;
    case 'GESTURE_START':
      return ['WIND_AWAKENS', 'FOLLOW_CLOUD'].includes(current.nodeId) && Number.isFinite(event.clientX)
        ? { ...current, gestureStart: event.clientX }
        : current;
    case 'GESTURE_END': {
      if (!['WIND_AWAKENS', 'FOLLOW_CLOUD'].includes(current.nodeId) || !Number.isFinite(current.gestureStart) || !Number.isFinite(event.clientX)) return current;
      if (Math.abs(event.clientX - current.gestureStart) >= 48) return completeGesture(current);
      return { ...current, gestureStart: null };
    }
    case 'GESTURE_TAP': {
      if (!['WIND_AWAKENS', 'FOLLOW_CLOUD'].includes(current.nodeId)) return current;
      const gestureTaps = current.gestureTaps + 1;
      return gestureTaps >= 2 ? completeGesture(current) : { ...current, gestureTaps, gestureStart: null };
    }
    case 'RESET_GESTURE':
      return resetGesture(current);
    case 'DEBUG_GO_TO':
      return CANONICAL_STATE_IDS.includes(event.nodeId) ? moveTo(current, event.nodeId) : current;
    default:
      return current;
  }
}

export function buildEndingConsequences(state) {
  const current = createStoryState(state);
  const meteorText = current.meteorOrigin === 'outside'
    ? '流星 · 从草坡看见'
    : current.meteorOrigin === 'window'
      ? '流星 · 从窗边补足'
      : '流星 · 还没有经过';
  const lightText = current.lightChoice === 'leave'
    ? '灯 · 留在门廊'
    : current.lightChoice === 'stay'
      ? '灯 · 再坐一会儿'
      : '灯 · 还在等你决定';
  const mealText = current.mealServed
    ? '热饭 · 已经端到桌上'
    : current.kettleWarm
      ? '厨房 · 水汽还暖着'
      : current.kitchenEntered
        ? '厨房 · 灯已经亮过'
        : '厨房 · 今晚还没有进去';
  return Object.freeze([
    Object.freeze({ key: 'wind', text: current.windToken === 'none' ? '风 · 今晚只轻轻经过' : '风 · 衣角带回一粒花瓣或草籽' }),
    Object.freeze({ key: 'meteor', text: meteorText }),
    Object.freeze({ key: 'cat', text: current.catSettled ? '猫 · 靠近了一点' : '猫 · 仍在身边等你' }),
    Object.freeze({ key: 'coat', text: current.coatHung ? '外衣 · 已经挂在左墙挂钩' : '外衣 · 还披在肩上' }),
    Object.freeze({ key: 'meal', text: mealText }),
    Object.freeze({ key: 'ate', text: current.ate ? '饭桌 · 吃过一点' : '饭桌 · 没有勉强多吃' }),
    Object.freeze({ key: 'sipped', text: current.sipped ? '温水 · 喝过一口' : '温水 · 杯子还暖着' }),
    Object.freeze({ key: 'light', text: lightText })
  ]);
}

function immutable(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) immutable(child);
  return value;
}

function validateContract(session, storyNodes) {
  const ids = session.canonical_state_ids;
  const nodes = storyNodes.nodes;
  if (!Array.isArray(ids) || ids.length !== CANONICAL_STATE_IDS.length || ids.some((id, index) => id !== CANONICAL_STATE_IDS[index])) {
    throw new Error('R2 session contract must retain exactly the canonical 16 states.');
  }
  if (!Array.isArray(nodes) || nodes.length !== CANONICAL_STATE_IDS.length || nodes.some((node, index) => node.id !== CANONICAL_STATE_IDS[index])) {
    throw new Error('R2 node contract must retain exactly the canonical 16 ordered nodes.');
  }
  return immutable({
    canonicalStateIds: [...ids],
    legalTransitions: session.legal_transitions,
    nodes,
    nodeById: new Map(nodes.map((node) => [node.id, node]))
  });
}

export async function loadStoryContract(fetcher = globalThis.fetch) {
  const load = async (relativePath) => {
    const response = await fetcher(new URL(relativePath, import.meta.url));
    if (!response?.ok) throw new Error(`Unable to load R2 contract: ${relativePath}`);
    return JSON.parse(await response.text());
  };
  const [session, nodes] = await Promise.all([
    load('./storyboard-project/scenes/evening_session.yaml'),
    load('./storyboard-project/shots/story_nodes.yaml')
  ]);
  return validateContract(session, nodes);
}

export const R2_EXPERIENCE_COPY = Object.freeze({
  EYES_ADJUST: Object.freeze({
    kicker: '今夜 · 银河深处',
    title: '眼睛慢慢看清了',
    body: '起初只有一片深蓝。再停一会儿，银河里的暗裂才慢慢分开。'
  }),
  KITCHEN_CALL: Object.freeze({
    kicker: '回家 · 屋里',
    title: '厨房那边，轻轻响了一声',
    body: '外衣放下以后，才听见锅里还留着一点热气。'
  })
});
