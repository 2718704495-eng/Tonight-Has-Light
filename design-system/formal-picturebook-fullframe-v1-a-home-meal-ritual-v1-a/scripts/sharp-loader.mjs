import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);

function moduleDefault(module) {
  return module?.default ?? module;
}

async function standardSharp() {
  return moduleDefault(await import('sharp'));
}

function requiredSharp(modulePath) {
  return moduleDefault(require(modulePath));
}

export async function loadSharp() {
  const failures = [];
  try {
    return await standardSharp();
  } catch (error) {
    failures.push(`standard: ${error?.code ?? error?.message ?? String(error)}`);
  }
  if (process.env.CODEX_SHARP_PATH) {
    try {
      return requiredSharp(resolve(process.env.CODEX_SHARP_PATH));
    } catch (error) {
      failures.push(`CODEX_SHARP_PATH: ${error?.code ?? error?.message ?? String(error)}`);
    }
  }
  const bundledPath = join(homedir(), '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'node_modules', 'sharp');
  try {
    return requiredSharp(bundledPath);
  } catch (error) {
    failures.push(`bundled runtime: ${error?.code ?? error?.message ?? String(error)}`);
  }
  throw new Error(`Sharp is required for image export but could not be loaded (${failures.join('; ')})`);
}
