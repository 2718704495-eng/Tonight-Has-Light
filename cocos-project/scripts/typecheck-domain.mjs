import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const configuredCompiler = process.env.COCOS_TYPESCRIPT_BIN;
const compilerCandidates = [
  configuredCompiler,
  resolve(projectRoot, "node_modules/typescript/bin/tsc"),
  "/Applications/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/bin/tsc",
].filter((candidate) => typeof candidate === "string");

const compiler = compilerCandidates.find((candidate) => existsSync(candidate));
if (!compiler) {
  console.error(
    "TypeScript compiler not found. Set COCOS_TYPESCRIPT_BIN or open the project with Cocos Creator 3.8.8.",
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [compiler, "-p", "tsconfig.domain.json", "--pretty", "false"],
  { cwd: projectRoot, stdio: "inherit" },
);

process.exit(result.status ?? 1);

