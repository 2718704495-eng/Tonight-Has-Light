import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredIds = [
  'ROOT_STILL', 'WIND_AWAKENS', 'LOOK_UP', 'EYES_ADJUST',
  'STAR_OCCLUDED', 'FOLLOW_CLOUD', 'STAR_RETURNS', 'WIDE_SKY',
  'METEOR_EVENT', 'AFTER_METEOR', 'DOOR_MATCH_CUT', 'ARRIVAL_H1',
  'KITCHEN_CALL', 'COOK_AND_SERVE', 'TABLE_RITUAL', 'LEAVE_THE_LIGHT',
];
const requiredNodeFields = [
  'id', 'illustration_id', 'narrative', 'interaction', 'immediate_response',
  'persistent_consequences', 'safe_resume', 'required_formal_overlays',
];
const prohibitedNarrativeTerms = ['页码', '进度', '任务', '成功', '奖励', '连续', '倒计时', '完成率'];

function readJsonYaml(relativePath) {
  return JSON.parse(readFileSync(path.join(packageRoot, relativePath), 'utf8'));
}

function reaches(graph, start, destination) {
  const visited = new Set();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === destination) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of graph[current] ?? []) queue.push(next);
  }
  return false;
}

test('freezes the approved 16-state evening session in canonical order', () => {
  const session = readJsonYaml('storyboard-project/scenes/evening_session.yaml');
  assert.deepEqual(session.canonical_state_ids, requiredIds);
  assert.equal(new Set(session.canonical_state_ids).size, requiredIds.length);
});

test('defines a complete node contract with low-pressure input equivalents', () => {
  const { nodes } = readJsonYaml('storyboard-project/shots/story_nodes.yaml');
  assert.equal(nodes.length, requiredIds.length);
  assert.deepEqual(nodes.map((node) => node.id), requiredIds);
  for (const node of nodes) {
    for (const field of requiredNodeFields) assert.ok(field in node, `${node.id} lacks ${field}`);
    assert.ok(node.narrative.kicker && node.narrative.title && node.narrative.body, `${node.id} lacks narrative copy`);
    assert.ok(node.interaction.primary, `${node.id} lacks a primary interaction`);
    if (!node.interaction.zero_operation) assert.ok(node.interaction.tap_equivalent, `${node.id} lacks a tap equivalent`);
    assert.ok(node.immediate_response, `${node.id} lacks immediate response`);
    assert.ok(Array.isArray(node.persistent_consequences) && node.persistent_consequences.length > 0, `${node.id} lacks a persistent consequence`);
  }
  assert.ok(nodes.some((node) => node.id === 'EYES_ADJUST'));
  assert.ok(nodes.some((node) => node.id === 'KITCHEN_CALL'));
  const narrative = JSON.stringify(nodes.map((node) => node.narrative));
  for (const term of prohibitedNarrativeTerms) assert.ok(!narrative.includes(term), `phone narrative contains ${term}`);
});

test('allows only the approved stargaze and direct-home routes to the warm ending', () => {
  const { legal_transitions: graph } = readJsonYaml('storyboard-project/scenes/evening_session.yaml');
  assert.deepEqual(graph.ROOT_STILL, ['WIND_AWAKENS', 'LOOK_UP', 'DOOR_MATCH_CUT']);
  assert.deepEqual(graph.WIND_AWAKENS, ['ROOT_STILL']);
  assert.deepEqual(graph.LOOK_UP, ['EYES_ADJUST']);
  assert.deepEqual(graph.EYES_ADJUST, ['STAR_OCCLUDED']);
  assert.deepEqual(graph.STAR_OCCLUDED, ['FOLLOW_CLOUD']);
  assert.deepEqual(graph.FOLLOW_CLOUD, ['STAR_RETURNS']);
  assert.deepEqual(graph.STAR_RETURNS, ['WIDE_SKY']);
  assert.deepEqual(graph.WIDE_SKY, ['METEOR_EVENT']);
  assert.deepEqual(graph.METEOR_EVENT, ['AFTER_METEOR']);
  assert.deepEqual(graph.AFTER_METEOR, ['ROOT_STILL', 'DOOR_MATCH_CUT']);
  assert.deepEqual(graph.DOOR_MATCH_CUT, ['ARRIVAL_H1']);
  assert.deepEqual(graph.ARRIVAL_H1, ['KITCHEN_CALL']);
  assert.deepEqual(graph.KITCHEN_CALL, ['COOK_AND_SERVE']);
  assert.deepEqual(graph.COOK_AND_SERVE, ['TABLE_RITUAL']);
  assert.deepEqual(graph.TABLE_RITUAL, ['LEAVE_THE_LIGHT']);
  assert.deepEqual(graph.LEAVE_THE_LIGHT, ['LEAVE_THE_LIGHT', 'ROOT_STILL', 'END']);
  assert.ok(reaches(graph, 'LOOK_UP', 'LEAVE_THE_LIGHT'));
  assert.ok(reaches(graph, 'DOOR_MATCH_CUT', 'LEAVE_THE_LIGHT'));
});

test('locks the approved character, visual, and continuity invariants', () => {
  const character = readFileSync(path.join(packageRoot, 'storyboard-project/bible/character_bible.md'), 'utf8');
  const visual = readFileSync(path.join(packageRoot, 'storyboard-project/bible/visual_style_bible.md'), 'utf8');
  const continuity = readFileSync(path.join(packageRoot, 'storyboard-project/bible/continuity_rules.md'), 'utf8');
  for (const phrase of ['anonymous adult', 'back', 'three-quarter', 'ordinary domestic cat', 'no named identity']) assert.ok(character.includes(phrase), `character bible lacks ${phrase}`);
  for (const phrase of ['B night-comic', 'deep indigo', 'warm ochre', 'dry-brush ink', 'restrained halftone', 'one natural Milky Way', 'outdoor cool/quiet', 'indoor bright/warm/no black corners']) assert.ok(visual.includes(phrase), `visual bible lacks ${phrase}`);
  for (const phrase of ['main star identity', 'wind direction', 'cat settling', 'coat position', 'kitchen geography', 'meal/cup states', 'meteor origin', 'porch-light result']) assert.ok(continuity.includes(phrase), `continuity bible lacks ${phrase}`);
});

test('preserves meteor observation vantage through the direct-home and outdoor routes', () => {
  const { nodes } = readJsonYaml('storyboard-project/shots/story_nodes.yaml');
  const doorNode = nodes.find((node) => node.id === 'DOOR_MATCH_CUT');
  const finalNode = nodes.find((node) => node.id === 'LEAVE_THE_LIGHT');
  const continuity = readFileSync(path.join(packageRoot, 'storyboard-project/bible/continuity_rules.md'), 'utf8');
  assert.deepEqual(doorNode.persistent_consequences, [
    'indoors=true',
    { when: 'meteorOrigin=none', set: 'meteorOrigin=window' },
    { when: 'meteorOrigin=outside', preserve: 'meteorOrigin=outside' },
  ]);
  assert.deepEqual(finalNode.persistent_consequences, [
    'lightChoice=leave|stay',
    'currentNightState is retained',
    { preserve: 'meteorOrigin' },
  ]);
  for (const phrase of ['meteorOrigin is observation vantage: outside or window', 'physical meteor source remains outdoor upper-right', 'occurs once and never replays', 'weak window trace']) assert.ok(continuity.includes(phrase), `continuity bible lacks ${phrase}`);
});
