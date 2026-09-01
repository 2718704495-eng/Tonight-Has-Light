import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { syncWechatAppId } from "../scripts/sync-wechat-appid-from-existing-project.mjs";

function withTemporaryConfigs(
  source: Readonly<Record<string, unknown>>,
  target: Readonly<Record<string, unknown>>,
  run: (sourcePath: string, buildRoot: string, targetPath: string) => void,
): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tonight-wechat-appid-"));
  const sourcePath = path.join(root, "source-project.config.json");
  const buildRoot = path.join(root, "wechatgame");
  const targetPath = path.join(buildRoot, "project.config.json");
  fs.mkdirSync(buildRoot);
  fs.writeFileSync(sourcePath, JSON.stringify(source));
  fs.writeFileSync(targetPath, JSON.stringify(target));
  try {
    run(sourcePath, buildRoot, targetPath);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test("copies the registered AppID without embedding it in source code", () => {
  withTemporaryConfigs(
    { appid: "wx0123456789abcdef" },
    { appid: "wxaaaaaaaaaaaaaaaa", projectname: "tonight" },
    (sourcePath, buildRoot, targetPath) => {
      const result = syncWechatAppId(sourcePath, buildRoot);
      const persisted = JSON.parse(fs.readFileSync(targetPath, "utf8"));
      assert.equal(persisted.appid, "wx0123456789abcdef");
      assert.equal(persisted.projectname, "tonight");
      assert.equal(result.maskedAppId, "wx01…cdef");
      assert.equal(result.maskedAppId.includes("23456789ab"), false);
    },
  );
});

test("rejects an invalid source AppID without changing the target", () => {
  withTemporaryConfigs(
    { appid: "not-a-wechat-appid" },
    { appid: "wxaaaaaaaaaaaaaaaa", projectname: "tonight" },
    (sourcePath, buildRoot, targetPath) => {
      const before = fs.readFileSync(targetPath, "utf8");
      assert.throws(
        () => syncWechatAppId(sourcePath, buildRoot),
        /does not contain a valid AppID/,
      );
      assert.equal(fs.readFileSync(targetPath, "utf8"), before);
    },
  );
});
