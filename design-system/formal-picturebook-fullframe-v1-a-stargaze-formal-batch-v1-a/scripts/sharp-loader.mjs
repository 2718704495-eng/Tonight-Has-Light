import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const moduleDefault = (value) => value?.default ?? value;

export async function loadSharp() {
  const failures = [];
  try {
    return moduleDefault(await import('sharp'));
  } catch (error) {
    failures.push(`standard: ${error?.code ?? error?.message ?? String(error)}`);
  }
  if (process.env.CODEX_SHARP_PATH) {
    try {
      return moduleDefault(require(resolve(process.env.CODEX_SHARP_PATH)));
    } catch (error) {
      failures.push(`CODEX_SHARP_PATH: ${error?.code ?? error?.message ?? String(error)}`);
    }
  }
  const bundled = join(homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'sharp');
  try {
    return moduleDefault(require(bundled));
  } catch (error) {
    failures.push(`bundled: ${error?.code ?? error?.message ?? String(error)}`);
  }
  throw new Error(`Sharp is required (${failures.join('; ')})`);
}
