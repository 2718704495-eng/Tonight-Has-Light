import { createHash } from 'node:crypto';
import { readdir, readFile, realpath, stat } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = resolve(SCRIPT_DIR, '..');
export const PROJECT_ROOT = resolve(PACKAGE_ROOT, '../..');
export const COCOS_ROOT = resolve(PROJECT_ROOT, 'cocos-project');

export function isInside(root, target) {
  const relativePath = relative(resolve(root), resolve(target));
  return relativePath === '' || (!relativePath.startsWith('..') && !isAbsolute(relativePath));
}

export function assertNonCocosPath(target, label = 'path') {
  if (isInside(COCOS_ROOT, target)) {
    throw new Error(`${label} must not resolve inside cocos-project: ${target}`);
  }
  return target;
}

export function resolveProjectPath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0 || isAbsolute(relativePath)) {
    throw new Error('Expected a non-empty project-relative path');
  }
  const target = resolve(PROJECT_ROOT, relativePath);
  if (!isInside(PROJECT_ROOT, target)) {
    throw new Error(`Path escapes the project root: ${relativePath}`);
  }
  return assertNonCocosPath(target);
}

export async function sha256File(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function fileExists(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

export async function readPngMetadata(filePath) {
  const buffer = await readFile(filePath);
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 26 || buffer.subarray(0, 8).toString('hex') !== signature || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error(`Expected a PNG with an IHDR header: ${filePath}`);
  }
  return {
    format: 'png',
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
    hasAlpha: buffer[25] === 4 || buffer[25] === 6,
  };
}

export async function realPathInside(root, filePath, label) {
  const canonical = await realpath(filePath);
  if (!isInside(root, canonical)) {
    throw new Error(`${label} resolves outside its allowed directory: ${filePath}`);
  }
  return assertNonCocosPath(canonical, label);
}

export async function hasUnexpectedFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.keep') continue;
      const child = resolve(directory, entry.name);
      if (entry.isFile()) return true;
      if (entry.isDirectory() && await hasUnexpectedFiles(child)) return true;
    }
    return false;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}
