import process from "node:process";
import { resolve } from "node:path";
import { createWechatFormalPartialUploadReceipt } from "./audit-wechat-formal-partial-candidate.mjs";

function parseCliExitCode(options) {
  const option = options.find((value) => value.startsWith("--cli-exit="));
  if (!option) throw new Error("--cli-exit=<integer> is required");
  const value = Number(option.slice("--cli-exit=".length));
  if (!Number.isInteger(value)) throw new Error("--cli-exit must be an integer");
  return value;
}

function parseUploadDescription(options) {
  const option = options.find((value) => value.startsWith("--description="));
  if (!option) throw new Error("--description=<exact-upload-description> is required");
  return option.slice("--description=".length);
}

const [
  ,
  ,
  buildRoot,
  preflightAuditPath,
  cliLogPath,
  remoteLogPath,
  infoOutputPath,
  outputPath,
  ...options
] = process.argv;

if (!buildRoot || !preflightAuditPath || !cliLogPath || !remoteLogPath || !infoOutputPath || !outputPath) {
  console.error(
    "Usage: node scripts/validate-wechat-formal-partial-upload-receipt.mjs "
      + "<wechatgame-build-root> <preflight-audit.json> <cli-upload.log> "
      + "<wechat-remote.log> <wechat-info-output.json> <receipt-output.json> "
      + "--description=<exact-upload-description> --cli-exit=0",
  );
  process.exit(1);
}

try {
  const receipt = createWechatFormalPartialUploadReceipt({
    buildRoot: resolve(buildRoot),
    preflightAuditPath: resolve(preflightAuditPath),
    cliLogPath: resolve(cliLogPath),
    remoteLogPath: resolve(remoteLogPath),
    infoOutputPath: resolve(infoOutputPath),
    uploadDescription: parseUploadDescription(options),
    outputPath: resolve(outputPath),
    cliExitCode: parseCliExitCode(options),
  });
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
