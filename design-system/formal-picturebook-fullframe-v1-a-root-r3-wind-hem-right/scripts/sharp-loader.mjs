import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function loadSharp() {
  const candidates = [
    process.env.CODEX_SHARP_PATH,
    '/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp',
    'sharp',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next configured runtime path.
    }
  }

  throw new Error('Unable to load Sharp. Set CODEX_SHARP_PATH to a valid installation.');
}

