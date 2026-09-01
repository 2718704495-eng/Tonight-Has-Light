import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const WECHAT_APP_ID_PATTERN = /^wx[0-9a-f]{16}$/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function maskAppId(appid) {
  return `${appid.slice(0, 4)}…${appid.slice(-4)}`;
}

export function syncWechatAppId(sourceConfigPath, targetBuildRoot) {
  const targetConfigPath = path.join(targetBuildRoot, "project.config.json");
  if (!fs.existsSync(sourceConfigPath)) {
    throw new Error(`Source WeChat project config does not exist: ${sourceConfigPath}`);
  }
  if (!fs.existsSync(targetConfigPath)) {
    throw new Error(`Target WeChat project config does not exist: ${targetConfigPath}`);
  }

  const sourceConfig = readJson(sourceConfigPath);
  const targetConfig = readJson(targetConfigPath);
  const sourceAppId = sourceConfig.appid;
  if (typeof sourceAppId !== "string" || !WECHAT_APP_ID_PATTERN.test(sourceAppId)) {
    throw new Error("Source WeChat project config does not contain a valid AppID");
  }

  const updatedConfig = { ...targetConfig, appid: sourceAppId };
  const temporaryPath = `${targetConfigPath}.appid-sync-tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(updatedConfig, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  fs.renameSync(temporaryPath, targetConfigPath);

  const persisted = readJson(targetConfigPath);
  if (persisted.appid !== sourceAppId) {
    throw new Error("AppID verification failed after writing target project config");
  }

  return {
    maskedAppId: maskAppId(sourceAppId),
    targetConfigPath,
  };
}

const isDirectRun = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const [, , sourceConfigPath, targetBuildRoot] = process.argv;
  if (!sourceConfigPath || !targetBuildRoot) {
    throw new Error(
      "Usage: node scripts/sync-wechat-appid-from-existing-project.mjs "
      + "<source-project.config.json> <wechatgame-build-root>",
    );
  }
  const result = syncWechatAppId(
    path.resolve(sourceConfigPath),
    path.resolve(targetBuildRoot),
  );
  console.log(`Wechat AppID synchronized: ${result.maskedAppId}`);
  console.log(`Target: ${result.targetConfigPath}`);
}
