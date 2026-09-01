import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
  WECHAT_EXPERIENCE_CANDIDATE_ID,
  WECHAT_EXPERIENCE_VERSION,
} from "../scripts/wechat-experience-authorization.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const auditScript = resolve(projectRoot, "scripts/audit-wechat-experience-candidate.mjs");

const REQUIRED_SUBPACKAGES = [
  "indoor-n01-preview",
  "outdoor-story-b-kf-r1-temp",
  "night-02",
  "night-03",
  "night-04",
  "night-05",
] as const;
const INACTIVE_R2_SUBPACKAGE = "outdoor-illustration-wind-r2";

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function makeCandidateFixture(packageNames: readonly string[]) {
  const root = mkdtempSync(resolve(tmpdir(), "tonight-wechat-audit-"));
  const buildRoot = resolve(root, "wechatgame");
  const outputDir = resolve(root, "audit-output");
  const creatorLog = resolve(root, "creator-build.log");

  mkdirSync(resolve(buildRoot, "assets", "main"), { recursive: true });
  mkdirSync(resolve(buildRoot, "src"), { recursive: true });
  writeJson(resolve(buildRoot, "build-identity.json"), {
    candidateId: WECHAT_EXPERIENCE_CANDIDATE_ID,
    developerVersion: WECHAT_EXPERIENCE_VERSION,
    engineeringRevision: "B-KF-R1-TEMP-R1",
  });
  writeJson(resolve(buildRoot, "project.config.json"), {
    appid: "wx0123456789abcdef",
  });
  writeJson(resolve(buildRoot, "game.json"), {
    subpackages: packageNames.map((name) => ({
      name,
      root: `subpackages/${name}`,
    })),
  });
  writeJson(resolve(buildRoot, "src", "settings.json"), {
    assets: { subpackages: [...packageNames] },
  });
  writeFileSync(resolve(buildRoot, "assets", "main", "index.js"), "export {};\n", "utf8");

  for (const name of packageNames) {
    const packageRoot = resolve(buildRoot, "subpackages", name);
    mkdirSync(packageRoot, { recursive: true });
    writeFileSync(resolve(packageRoot, "game.js"), `globalThis.__package = ${JSON.stringify(name)};\n`, "utf8");
    writeFileSync(resolve(packageRoot, "index.js"), "require('./game.js');\n", "utf8");
  }

  writeFileSync(
    creatorLog,
    [
      `Start build task, options: ${JSON.stringify({
        platform: "wechatgame",
        buildPath: `project://build/${WECHAT_EXPERIENCE_CANDIDATE_ID}`,
        outputName: "wechatgame",
      })}`,
      "build Task (wechatgame) Finished",
      "",
    ].join("\n"),
    "utf8",
  );

  return { root, buildRoot, outputDir, creatorLog };
}

function runAudit(fixture: ReturnType<typeof makeCandidateFixture>) {
  return spawnSync(
    process.execPath,
    [auditScript, fixture.buildRoot, fixture.outputDir, fixture.creatorLog],
    { cwd: projectRoot, encoding: "utf8" },
  );
}

function assertAuditRejected(
  fixture: ReturnType<typeof makeCandidateFixture>,
  expectedMessage: RegExp,
): void {
  const result = runAudit(fixture);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, expectedMessage);
}

test("accepts the six required 0.4.7 subpackages plus inactive historical R2 packaging", () => {
  const fixture = makeCandidateFixture([
    ...REQUIRED_SUBPACKAGES,
    INACTIVE_R2_SUBPACKAGE,
  ]);

  try {
    const result = runAudit(fixture);
    assert.equal(result.status, 0, result.stderr);

    const report = JSON.parse(
      readFileSync(resolve(fixture.outputDir, "wechat-package-audit.json"), "utf8"),
    ) as {
      status: string;
      candidateId: string;
      developerVersion: string;
      appIdMasked: string;
      mainPackage: { budgetBytes: number; pass: boolean };
      totalPackage: { budgetBytes: number; pass: boolean };
      subpackageRoles: {
        required: string[];
        optionalInactive: string[];
        unknown: string[];
      };
      subpackages: Record<string, {
        bytes: number;
        role: string;
        runtimeEvidenceEligible: boolean;
      }>;
      buildTreeSha256: string;
      creatorBuild: { logPath: string; completed: boolean };
    };
    assert.equal(report.status, "PASS");
    assert.equal(report.candidateId, WECHAT_EXPERIENCE_CANDIDATE_ID);
    assert.equal(report.developerVersion, WECHAT_EXPERIENCE_VERSION);
    assert.equal(report.appIdMasked, "wx01…cdef");
    assert.equal(report.mainPackage.budgetBytes, 4 * 1024 * 1024);
    assert.equal(report.mainPackage.pass, true);
    assert.equal(report.totalPackage.budgetBytes, 20 * 1024 * 1024);
    assert.equal(report.totalPackage.pass, true);
    assert.deepEqual(report.subpackageRoles.required, [...REQUIRED_SUBPACKAGES]);
    assert.deepEqual(report.subpackageRoles.optionalInactive, [INACTIVE_R2_SUBPACKAGE]);
    assert.deepEqual(report.subpackageRoles.unknown, []);
    assert.equal(report.subpackages[INACTIVE_R2_SUBPACKAGE]?.role, "optional-inactive-historical");
    assert.equal(report.subpackages[INACTIVE_R2_SUBPACKAGE]?.runtimeEvidenceEligible, false);
    assert.ok(report.subpackages[INACTIVE_R2_SUBPACKAGE]?.bytes > 0);
    assert.match(report.buildTreeSha256, /^[0-9a-f]{64}$/);
    assert.equal(report.creatorBuild.logPath, fixture.creatorLog);
    assert.equal(report.creatorBuild.completed, true);

    const hashManifest = readFileSync(
      resolve(fixture.outputDir, "WECHAT_BUILD_HASHES.sha256"),
      "utf8",
    );
    assert.match(hashManifest, /  build-identity\.json$/m);
    assert.match(
      hashManifest,
      /  subpackages\/outdoor-illustration-wind-r2\/game\.js$/m,
    );
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects a candidate that omits the new story subpackage", () => {
  const fixture = makeCandidateFixture([
    ...REQUIRED_SUBPACKAGES.filter((name) => name !== "outdoor-story-b-kf-r1-temp"),
    INACTIVE_R2_SUBPACKAGE,
  ]);

  try {
    assertAuditRejected(fixture, /required subpackage missing: outdoor-story-b-kf-r1-temp/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects an unknown extra subpackage", () => {
  const fixture = makeCandidateFixture([
    ...REQUIRED_SUBPACKAGES,
    "unexpected-preview-package",
  ]);

  try {
    assertAuditRejected(fixture, /unknown subpackage: unexpected-preview-package/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects settings and game subpackage set drift even when both arrays have six entries", () => {
  const fixture = makeCandidateFixture(REQUIRED_SUBPACKAGES);
  writeJson(resolve(fixture.buildRoot, "src", "settings.json"), {
    assets: {
      subpackages: [
        "indoor-n01-preview",
        "indoor-n01-preview",
        "outdoor-story-b-kf-r1-temp",
        "night-02",
        "night-03",
        "night-04",
      ],
    },
  });

  try {
    assertAuditRejected(fixture, /settings\.assets\.subpackages contains duplicate names/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects duplicate game.json subpackage names", () => {
  const fixture = makeCandidateFixture([
    ...REQUIRED_SUBPACKAGES,
    "indoor-n01-preview",
  ]);

  try {
    assertAuditRejected(fixture, /game\.json contains duplicate subpackage names: indoor-n01-preview/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("rejects settings and game subpackage set drift without relying on duplicates", () => {
  const fixture = makeCandidateFixture(REQUIRED_SUBPACKAGES);
  writeJson(resolve(fixture.buildRoot, "src", "settings.json"), {
    assets: {
      subpackages: [
        ...REQUIRED_SUBPACKAGES.slice(0, -1),
        INACTIVE_R2_SUBPACKAGE,
      ],
    },
  });

  try {
    assertAuditRejected(fixture, /settings subpackage index does not match game\.json/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

for (const entryFile of ["game.js", "index.js"] as const) {
  test(`rejects an empty subpackage ${entryFile}`, () => {
    const fixture = makeCandidateFixture(REQUIRED_SUBPACKAGES);
    writeFileSync(
      resolve(fixture.buildRoot, "subpackages", "outdoor-story-b-kf-r1-temp", entryFile),
      "",
      "utf8",
    );

    try {
      assertAuditRejected(
        fixture,
        new RegExp(`outdoor-story-b-kf-r1-temp ${entryFile.replace(".", "\\.")} is empty`),
      );
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
}
