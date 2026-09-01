import type { AssetRecord } from "../domain/contracts.ts";

/**
 * The visible V0 artwork is drawn from Cocos primitives. The first-night room
 * loop is the only imported media candidate; it remains draft until listening
 * and real-device gates are recorded in the project-level asset register.
 */
export const ASSET_RECORDS: readonly AssetRecord[] = [
  {
    id: "AUD-N01-001",
    path: "resources/audio/night-room-loop.ogg",
    kind: "audio",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "assets/final/audio/night-room-loop.ogg",
    license: "project-original procedural synthesis; release approval pending",
    generationProcess: "assets/final/audio/README.md",
    humanEditVersion: "v0.1.0-draft",
  },
  {
    id: "UI-N01-END-001",
    path: "resources/formal-ending-ui-v1/wall-note.png",
    kind: "image",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "design-system/formal-ending-ui-v1/wall-note.svg",
    license: "project-original AI-assisted editable vector; FORMAL-ENDING-UI-V1-A style approved",
    generationProcess: "design-system/formal-ending-ui-v1/generate-assets.mjs",
    humanEditVersion: "v1.0.0-local-runtime-reviewed",
  },
  {
    id: "UI-N01-END-002",
    path: "resources/formal-ending-ui-v1/table-paper.png",
    kind: "image",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "design-system/formal-ending-ui-v1/table-paper.svg",
    license: "project-original AI-assisted editable vector; FORMAL-ENDING-UI-V1-A large-text/share style approved",
    generationProcess: "design-system/formal-ending-ui-v1/generate-assets.mjs",
    humanEditVersion: "v1.0.0-local-runtime-reviewed",
  },
  {
    id: "UI-N01-END-003",
    path: "resources/formal-ending-ui-v1/action-paper.png",
    kind: "image",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "design-system/formal-ending-ui-v1/action-paper.svg",
    license: "project-original AI-assisted editable vector; equal-action treatment approved",
    generationProcess: "design-system/formal-ending-ui-v1/generate-assets.mjs",
    humanEditVersion: "v1.0.0-local-runtime-reviewed",
  },
  {
    id: "UI-N01-END-004",
    path: "resources/formal-ending-ui-v1/note-peg.png",
    kind: "image",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "design-system/formal-ending-ui-v1/note-peg.svg",
    license: "project-original AI-assisted editable vector; FORMAL-ENDING-UI-V1-A detail",
    generationProcess: "design-system/formal-ending-ui-v1/generate-assets.mjs",
    humanEditVersion: "v1.0.0-local-runtime-reviewed",
  },
  {
    id: "UI-N01-END-005",
    path: "resources/formal-ending-ui-v1/surface-rule.png",
    kind: "image",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "design-system/formal-ending-ui-v1/surface-rule.svg",
    license: "project-original AI-assisted editable vector; FORMAL-ENDING-UI-V1-A detail",
    generationProcess: "design-system/formal-ending-ui-v1/generate-assets.mjs",
    humanEditVersion: "v1.0.0-local-runtime-reviewed",
  },
  {
    id: "UI-N01-SESSION-001",
    path: "resources/formal-session-controls-v1/selection-ring.png",
    kind: "image",
    assetBundle: "main",
    author: "CODEX-AI+PROJECT-OWNER",
    source: "design-system/formal-session-controls-v1/selection-ring.svg",
    license: "project-original AI-assisted editable vector; FORMAL-SESSION-CONTROLS-V1-A style approved",
    generationProcess: "design-system/formal-session-controls-v1/generate-assets.mjs",
    humanEditVersion: "v1.0.0-local-source-verified",
  },
];

export function validateAssetRecords(records: readonly AssetRecord[]): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();

  records.forEach((record) => {
    if (ids.has(record.id)) errors.push(`Duplicate asset id: ${record.id}.`);
    if (paths.has(record.path)) errors.push(`Duplicate asset path: ${record.path}.`);
    ids.add(record.id);
    paths.add(record.path);

    const requiredFields = [
      record.id,
      record.path,
      record.author,
      record.source,
      record.license,
      record.generationProcess,
      record.humanEditVersion,
    ];
    if (requiredFields.some((field) => field.trim().length === 0)) {
      errors.push(`Asset ${record.id || "<missing-id>"} has incomplete provenance.`);
    }
  });

  return errors;
}
