import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function loadSharp() {
  const candidates = [
    process.env.CODEX_SHARP_PATH,
    '/Users/wxl/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp',
    'sharp',
    '/Users/wxl/Documents/Codex/2026-08-21/g-i/node_modules/sharp',
    '/Users/wxl/Desktop/小程序/node_modules/sharp',
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next known install location.
    }
  }

  throw new Error('Unable to load sharp');
}
