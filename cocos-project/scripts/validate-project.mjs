import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { validateNightDefinitions } from "../assets/scripts/content/nights.ts";
import { ASSET_RECORDS, validateAssetRecords } from "../assets/scripts/content/asset-manifest.ts";

const projectRoot = resolve(import.meta.dirname, "..");

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(projectRoot, relativePath), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(relativePath) {
  return createHash("sha256")
    .update(readFileSync(resolve(projectRoot, relativePath)))
    .digest("hex");
}

const project = readJson("project.json");
const packageJson = readJson("package.json");
const projectSettings = readJson("settings/v2/packages/project.json");
const engineSettings = readJson("settings/v2/packages/engine.json");
const builderSettings = readJson("settings/v2/packages/builder.json");
const mainScene = readFileSync(resolve(projectRoot, "assets/scenes/main.scene"), "utf8");
const bootstrap = readFileSync(
  resolve(projectRoot, "assets/scripts/cocos/tonight-has-light-bootstrap.ts"),
  "utf8",
);
const bootstrapMeta = readJson("assets/scripts/cocos/tonight-has-light-bootstrap.ts.meta");
const v0View = readFileSync(
  resolve(projectRoot, "assets/scripts/cocos/tonight-has-light-v0-view.ts"),
  "utf8",
);
const v0ViewMeta = readJson("assets/scripts/cocos/tonight-has-light-v0-view.ts.meta");
const phonePreviewPath = "assets/scripts/cocos/tonight-has-light-indoor-n01-preview.ts";
const phonePreview = readFileSync(resolve(projectRoot, phonePreviewPath), "utf8");
const phonePreviewMeta = readJson(`${phonePreviewPath}.meta`);
const formalEndingUiPath = "assets/scripts/cocos/tonight-has-light-formal-ending-ui.ts";
const formalEndingUi = readFileSync(resolve(projectRoot, formalEndingUiPath), "utf8");
const formalEndingUiMeta = readJson(`${formalEndingUiPath}.meta`);
const formalEndingModel = readFileSync(
  resolve(projectRoot, "assets/scripts/core/formal-ending-ui.ts"),
  "utf8",
);
const phonePreviewBundleMeta = readJson("assets/indoor-n01-preview.meta");
const phonePreviewBoundary = readJson("assets/indoor-n01-preview/asset-boundary.json");
const historicalR2Boundary = readJson(
  "assets/outdoor-illustration-wind-r2/asset-boundary.json",
);
const historicalR2AssetManifest = readJson(
  "assets/outdoor-illustration-wind-r2/asset-manifest.json",
);
const historicalR2BundleMeta = readJson(
  "assets/outdoor-illustration-wind-r2.meta",
);
const outdoorStoryBoundary = readJson(
  "assets/outdoor-story-b-kf-r1-temp/asset-boundary.json",
);
const outdoorStoryAssetManifest = readJson(
  "assets/outdoor-story-b-kf-r1-temp/asset-manifest.json",
);
const outdoorStoryBundleMeta = readJson("assets/outdoor-story-b-kf-r1-temp.meta");
const appFlow = readFileSync(
  resolve(projectRoot, "assets/scripts/core/app-flow.ts"),
  "utf8",
);
const outdoorAudioGate = readFileSync(
  resolve(projectRoot, "assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-audio-gate.ts"),
  "utf8",
);
const outdoorScene = readFileSync(
  resolve(projectRoot, "assets/scripts/cocos/outdoor-gate-c/outdoor-gate-c-scene.ts"),
  "utf8",
);
const outdoorStoryModel = readFileSync(
  resolve(projectRoot, "assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-model.ts"),
  "utf8",
);
const outdoorStoryPages = readFileSync(
  resolve(projectRoot, "assets/scripts/cocos/outdoor-story-b-kf-r1-temp/outdoor-story-pages.ts"),
  "utf8",
);
const wechatRuntimeBuildValidator = readFileSync(
  resolve(projectRoot, "scripts/validate-wechat-motion-runtime-build.mjs"),
  "utf8",
);
const wechatExperienceIdentityPreparer = readFileSync(
  resolve(projectRoot, "scripts/prepare-wechat-experience-candidate.mjs"),
  "utf8",
);
const wechatExperienceAuthorization = readFileSync(
  resolve(projectRoot, "scripts/wechat-experience-authorization.mjs"),
  "utf8",
);
const wechatBuildConfig = readJson(
  "scripts/gate-d-story-b-kf-r1-temp-dev-r1-0-4-7.json",
);
const webBuildConfig = readJson(
  "scripts/gate-d-story-b-kf-r1-temp-web-r1-0-4-7.json",
);
const audioControllerPath = "assets/scripts/cocos/tonight-has-light-audio.ts";
const audioController = readFileSync(resolve(projectRoot, audioControllerPath), "utf8");
const audioControllerMeta = readJson("assets/scripts/cocos/tonight-has-light-audio.ts.meta");
const audioResourcePath = "assets/resources/audio/night-room-loop.ogg";
const audioResourceMeta = readJson("assets/resources/audio/night-room-loop.ogg.meta");
const handleShowBody = bootstrap.match(/private readonly handleGameShow = \(\): void => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
const handleHideBody = bootstrap.match(/private readonly handleGameHide = \(\): void => \{([\s\S]*?)\n  \};/)?.[1] ?? "";

assert(project.version === "3.8.8", "project.json must target Cocos Creator 3.8.8.");
assert(packageJson.creator?.version === "3.8.8", "package.json Creator version is inconsistent.");
assert(
  projectSettings.general?.designResolution?.width === 390 &&
    projectSettings.general?.designResolution?.height === 844,
  "Design resolution must remain 390×844 portrait.",
);
assert(
  engineSettings.modules?.configs?.defaultConfig?.cache?.["3d"]?._value === false,
  "3D must remain disabled for the foundation build.",
);
assert(
  engineSettings.modules?.configs?.defaultConfig?.cache?.physics?._value === false &&
    engineSettings.modules?.configs?.defaultConfig?.cache?.["physics-2d"]?._value === false,
  "Physics modules must remain disabled.",
);
assert(
  engineSettings.modules?.configs?.defaultConfig?.cache?.graphics?._value === true &&
    engineSettings.modules?.configs?.defaultConfig?.includeModules?.includes("graphics"),
  "Cocos Graphics must remain enabled for the programmatically drawn V0 view.",
);
assert(
  engineSettings.modules?.configs?.defaultConfig?.cache?.mask?._value === true &&
    engineSettings.modules?.configs?.defaultConfig?.includeModules?.includes("mask"),
  "Cocos Mask must remain enabled for the B/KF-R1 grass-line page transition.",
);
assert(mainScene.includes('"_name": "Canvas"'), "main.scene must contain a Canvas node.");
assert(mainScene.includes('"_name": "GameRoot"'), "main.scene must contain a GameRoot node.");
assert(
  mainScene.includes('"__type__": "c42f1GnbWRPN40lGbnb06IG"') &&
    bootstrapMeta.uuid === "c42f11a7-6d64-4f37-8d25-19b9dbd3a206",
  "main.scene must mount TonightHasLightBootstrap with the checked-in script meta uuid.",
);
assert(
  v0ViewMeta.uuid === "ab91c5f4-31c1-4bf0-b747-9f8e5421dc82" &&
    v0View.includes('@ccclass("TonightHasLightV0View")') &&
    v0View.includes("COMPLETE_CORE_WITH_TAP") &&
    v0View.includes("FINISH_NIGHT") &&
    v0View.includes("有人给你留了一盏灯") &&
    v0View.includes("isTouchInside") &&
    v0View.includes('this.bridge.send({ type: "DROP_CORE", targetHit: false })') &&
    v0View.includes("<= 28") &&
    v0View.includes("largeText ? 1.2 : 1") &&
    v0View.includes("Label.Overflow.CLAMP") &&
    v0View.includes('touchShield.name = "AppOverlayTouchShield"') &&
    v0View.includes('flow.overlay === "save-error"') &&
    v0View.includes("bridge.retryPersist()") &&
    v0View.includes("LIGHT_MIN_X") &&
    v0View.includes("LIGHT_MAX_Y") &&
    v0View.includes('this.button(parent, "再试一次"') &&
    v0View.includes('this.button(parent, "留在今晚"') &&
    v0View.includes('session.phase === "paused"') &&
    !v0View.includes("Label.Overflow.SHRINK"),
  "The visible first-night V0 view and its core flow must remain checked in.",
);
assert(
  bootstrap.includes("FormalPicturebookPartialScene") &&
    bootstrap.includes(
      'FORMAL_PICTUREBOOK_PARTIAL_STORAGE_PREFIX = "formal-picturebook-partial-r1-0.4.8:"',
    ) &&
    bootstrap.includes("resumeNightSession: false") &&
    bootstrap.includes("storeRecentAppCheckpoint") &&
    bootstrap.includes("shareInFlight") &&
    bootstrap.includes('type: "SAVE_SUCCEEDED"') &&
    bootstrap.includes("retryPersist") &&
    bootstrap.includes("onAudioInterruptionBegin") &&
    bootstrap.includes("offAudioInterruptionBegin") &&
    bootstrap.includes("onAudioInterruptionEnd") &&
    bootstrap.includes("offAudioInterruptionEnd") &&
    bootstrap.includes("setReducedMotion(updatedSettings.reducedMotion)") &&
    bootstrap.includes("setSoundEnabled(updatedSettings.ambientEnabled)") &&
    bootstrap.includes("setMusicEnabled(updatedSettings.musicEnabled)") &&
    bootstrap.includes("setLargeText(updatedSettings.largeText)") &&
    handleHideBody.indexOf("this.picturebookScene?.pauseAudioForInterruption()") >= 0 &&
    handleHideBody.indexOf('this.sendAppFlow({ type: "APP_HIDE" })') >
      handleHideBody.indexOf("this.picturebookScene?.pauseAudioForInterruption()") &&
    handleShowBody.indexOf('this.sendAppFlow({ type: "APP_SHOW" })') >= 0 &&
    handleShowBody.indexOf("this.picturebookScene?.resumeAudioFromInterruption()") >
      handleShowBody.indexOf('this.sendAppFlow({ type: "APP_SHOW" })') &&
    !bootstrap.includes("TonightHasLightIndoorN01Preview") &&
    !bootstrap.includes("PHONE_PREVIEW_STORAGE_PREFIX") &&
    !bootstrap.includes("preloadIndoorN01PreviewBundle") &&
    !bootstrap.includes("startIndoorBundlePrefetch") &&
    !bootstrap.includes("completeNight") &&
    !bootstrap.includes('type: "REQUEST_ENTER_HOUSE"'),
  "The 0.4.8 bootstrap must mount only the isolated formal picturebook, preserve settings/share/lifecycle handling, and leave historical N01 progress disconnected.",
);
assert(
  phonePreviewMeta.uuid === "5069edc1-16b1-49b7-b7f0-49cc9694d71a" &&
    phonePreview.includes('@ccclass("TonightHasLightIndoorN01Preview")') &&
    phonePreview.includes('const BUNDLE_NAME = "indoor-n01-preview"') &&
    phonePreview.includes('candidateId: "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7"') &&
    phonePreview.includes("INDOOR_N01_BUNDLE_LOAD_TIMEOUT_MS = 12_000") &&
    phonePreview.includes("indoorBundleLoadInFlight") &&
    phonePreview.includes("preloadIndoorN01PreviewBundle") &&
    phonePreview.includes('const RESPONSE_SECONDS = 0.62') &&
    phonePreview.includes('const CAT_REVEAL_SECONDS = 1.18') &&
    phonePreview.includes('const AUTO_RIGHT_CUP_SECONDS = 4') &&
    phonePreview.includes('const EQUIVALENT_FADE_SECONDS = 0.18') &&
    phonePreview.includes('session.phase === "paused" || session.phase === "loading-error"') &&
    phonePreview.includes('const LID_OVERLAY_PATH = "kettle-lid-overlay/spriteFrame"') &&
    phonePreview.includes('const CAT_OVERLAY_PATH = "cat-head-overlay/spriteFrame"') &&
    phonePreview.includes('const CUP_OVERLAY_PATH = "spare-cup-overlay/spriteFrame"') &&
    phonePreview.includes("TonightHasLightFormalEndingUi") &&
    phonePreview.includes("await formalEndingUi.initialize") &&
    phonePreview.includes('this.performAction("request-ending")') &&
    !phonePreview.includes("drawWarmPaper") &&
    !phonePreview.includes("endingPaperGraphics") &&
    !phonePreview.includes("Mask"),
  "The disposable indoor preview component and its lifecycle/timeline contract are missing.",
);
assert(
  packageJson.scripts?.["prepare:wechat-subpackages"] ===
    "node scripts/prepare-wechat-subpackage-entries.mjs",
  "The WeChat subpackage compatibility preparation command is missing.",
);
assert(
  formalEndingUiMeta.uuid === "f8efc70f-44aa-4fe8-9767-308e472b6201" &&
    formalEndingUi.includes('@ccclass("TonightHasLightFormalEndingUi")') &&
    formalEndingUi.includes('new Node("FormalEndingUiV1A")') &&
    formalEndingUi.includes("deriveFormalEndingUiModel") &&
    formalEndingUi.includes("Sprite,") &&
    formalEndingUi.includes("Label,") &&
    formalEndingUi.includes("Button,") &&
    formalEndingUi.includes("BlockInputEvents") &&
    formalEndingUi.includes("const panelWidth = table ? 362 : 230") &&
    formalEndingUi.includes("const actionWidth = table ? 326 : 194") &&
    formalEndingUi.includes("actionGapPx: 12") &&
    !formalEndingUi.includes("GraphicsComponent") &&
    !formalEndingUi.includes("new Graphics") &&
    !formalEndingUi.includes("drawWarmPaper"),
  "The approved formal ending must remain a persistent Sprite/Label/Button surface, not a disposable Graphics card.",
);
assert(
  formalEndingModel.includes("FORMAL_ENDING_UI_DEFAULT_FADE_MS = 170") &&
    formalEndingModel.includes("FORMAL_ENDING_UI_REDUCED_MOTION_FADE_MS = 0") &&
    formalEndingModel.includes("FORMAL_ENDING_UI_TRANSFORM_DISTANCE_PX = 0") &&
    formalEndingModel.includes("FORMAL_ENDING_UI_LARGE_TEXT_SCALE = 1.2") &&
    formalEndingModel.includes("FORMAL_ENDING_UI_MIN_TOUCH_TARGET_PX = 44") &&
    formalEndingModel.includes("FORMAL_ENDING_UI_MIN_ACTION_GAP_PX = 8") &&
    formalEndingModel.includes('return largeText ? "table-paper" : "wall-note"') &&
    formalEndingModel.includes(
      'if (mode === "share-preview" || mode === "share-failed") return "table-paper"',
    ) &&
    !formalEndingModel.includes("回房间") &&
    !/通关|奖励|领取|打卡|分享得/.test(formalEndingModel),
  "The approved A-default/B-large ending model, copy and accessibility limits have drifted.",
);

const formalEndingAssets = {
  "wall-note": "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a1",
  "table-paper": "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a2",
  "action-paper": "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a3",
  "note-peg": "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a4",
  "surface-rule": "05c9e3d2-c1b2-45f3-b5d2-9d9a17f001a5",
};
for (const [name, uuid] of Object.entries(formalEndingAssets)) {
  const path = `assets/resources/formal-ending-ui-v1/${name}.png`;
  assert(existsSync(resolve(projectRoot, path)), `Missing formal ending asset ${path}.`);
  const meta = readJson(`${path}.meta`);
  assert(
    meta.importer === "image" &&
      meta.uuid === uuid &&
      meta.userData?.type === "sprite-frame" &&
      meta.subMetas?.f9941?.importer === "sprite-frame",
    `Invalid formal ending SpriteFrame metadata for ${name}.`,
  );
}
assert(
  phonePreviewBundleMeta.userData?.isBundle === true &&
    phonePreviewBundleMeta.userData?.bundleConfigID === "indoor_n01_preview_subpackage" &&
    phonePreviewBundleMeta.userData?.bundleName === "indoor-n01-preview" &&
    builderSettings.bundleConfig?.custom?.indoor_n01_preview_subpackage?.configs?.miniGame
      ?.fallbackOptions?.compressionType === "subpackage",
  "The disposable warm-room assets must remain isolated in a WeChat subpackage.",
);
assert(
  phonePreviewBoundary.candidateId === "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7" &&
    phonePreviewBoundary.supersedes === "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6" &&
    phonePreviewBoundary.excludedCandidateIds?.includes(
      "gate-d-mainflow-v4-phone-preview-dev-r9-0.4.6",
    ) &&
    phonePreviewBoundary.historicalCandidateIds?.includes(
      "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6",
    ) &&
    phonePreviewBoundary.classification ===
      "prototype-only / disposable / experience-v0.4.3-through-v0.4.7-only / gate-d-story-b-kf-r1-temp-dev-r1-0.4.7-only" &&
    phonePreviewBoundary.allowedUse?.includes(
      "one WeChat developer upload version 0.4.3 and its corresponding user-promoted experience version",
    ) &&
    phonePreviewBoundary.allowedUse?.includes(
      "one WeChat developer upload version 0.4.4 and its corresponding user-promoted experience version",
    ) &&
    phonePreviewBoundary.allowedUse?.includes(
      "one WeChat developer upload version 0.4.5 and its corresponding user-promoted experience version",
    ) &&
    phonePreviewBoundary.allowedUse?.includes(
      "one WeChat developer upload version 0.4.6 and its corresponding user-promoted experience version",
    ) &&
    phonePreviewBoundary.allowedUse?.includes(
      "local OUTDOOR-ILLUSTRATION-WIND-V1-A-R2 / R2-EDGEFIX-01 candidate",
    ) &&
    phonePreviewBoundary.allowedUse?.includes(
      "one WeChat developer upload version 0.4.7 and its corresponding user-promoted experience version",
    ) &&
    phonePreviewBoundary.allowedUse?.includes(
      "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7 disposable candidate only",
    ) &&
    phonePreviewBoundary.forbiddenUse?.includes("review submission") &&
    phonePreviewBoundary.forbiddenUse?.includes(
      "any remote upload or experience version other than 0.4.3, 0.4.4, 0.4.5, 0.4.6 or 0.4.7 unless separately authorized by the user",
    ) &&
    phonePreviewBoundary.forbiddenUse?.includes("public release") &&
    phonePreviewBoundary.derivedBackplateSha256 ===
      sha256("assets/indoor-n01-preview/formal-ui-v1-2-a-preview.jpg") &&
    phonePreviewBoundary.temporarySoundSha256 ===
      sha256("assets/indoor-n01-preview/kettle-lid-answer-test-only.mp3") &&
    phonePreviewBoundary.derivedOverlaySha256?.["kettle-lid-overlay.png"] ===
      sha256("assets/indoor-n01-preview/kettle-lid-overlay.png") &&
    phonePreviewBoundary.derivedOverlaySha256?.["cat-head-overlay.png"] ===
      sha256("assets/indoor-n01-preview/cat-head-overlay.png") &&
    phonePreviewBoundary.derivedOverlaySha256?.["spare-cup-overlay.png"] ===
      sha256("assets/indoor-n01-preview/spare-cup-overlay.png"),
  "The disposable room asset boundary or checked-in hashes have drifted.",
);
assert(
  appFlow.includes('| "save-error"') &&
    appFlow.includes('case "SAVE_FAILED"') &&
    appFlow.includes('case "SAVE_SUCCEEDED"') &&
    appFlow.includes('overlay: "none",\n          shareErrorMessage: null') &&
    appFlow.includes('phase === "night-session"'),
  "AppFlow must preserve retryable save/share failures and keep the outdoor scene usable in silence.",
);
assert(
  outdoorAudioGate.includes("setChannelEnabled") &&
    outdoorAudioGate.includes("backgroundPaused") &&
    outdoorAudioGate.includes("interruptionPaused") &&
    outdoorAudioGate.includes("pauseForInterruption") &&
    outdoorAudioGate.includes("resumeFromInterruption"),
  "Outdoor ambient and music channels must remain independent across background and system interruption pauses.",
);
assert(
  outdoorStoryModel.includes("settleHoldMs: 3_200") &&
    outdoorStoryModel.includes("firstTransitionMs: 300") &&
    outdoorStoryModel.includes("windHoldMs: 1_500") &&
    outdoorStoryModel.includes("secondTransitionMs: 360") &&
    outdoorStoryModel.includes('return restingSnapshot(elapsed, "afterwind", "B03", false)') &&
    outdoorStoryModel.includes("public replay()") &&
    outdoorStoryModel.includes("public setReducedMotion(enabled: boolean)") &&
    outdoorStoryModel.includes("public requestDoorEntry(): boolean"),
  "The approved one-shot B01/B02/B03 story timing, B03 hold, reduced state and door cancellation are missing.",
);
assert(
  outdoorStoryPages.includes('@ccclass("OutdoorStoryPages")') &&
    outdoorStoryPages.includes('this.createStorySprite("OutdoorStoryCurrent"') &&
    outdoorStoryPages.includes('new Node("OutdoorStoryRevealMask")') &&
    outdoorStoryPages.includes('this.createStorySprite("OutdoorStoryTarget"') &&
    outdoorStoryPages.includes("Mask.Type.GRAPHICS_STENCIL") &&
    outdoorStoryPages.includes("public replay(): void") &&
    outdoorStoryPages.includes("public cancelForDoorEntry(): boolean") &&
    outdoorStoryPages.includes("current.opacity.opacity = 255") &&
    outdoorStoryPages.includes("target.opacity.opacity = 255") &&
    outdoorStoryPages.includes("sprite.spriteFrame = null"),
  "The disposable B story must use two persistent sprites, a grass-line stencil, no-empty rendering and explicit release.",
);
assert(
  outdoorScene.includes('OUTDOOR_STORY_B_KF_R1_TEMP_BUNDLE_NAME = "outdoor-story-b-kf-r1-temp"') &&
    outdoorScene.includes("OutdoorStoryPages") &&
    outdoorScene.includes("storyPages.replay()") &&
    outdoorScene.includes("storyPages.cancelForDoorEntry()") &&
    outdoorScene.includes("story: this.storyPages?.snapshot() ?? null") &&
    !outdoorScene.includes("outdoor-illustration-wind-r2") &&
    !outdoorScene.includes("OutdoorIllustrationWindPages") &&
    outdoorScene.includes("if (!sys.isBrowser) return"),
  "Outdoor Cocos runtime must consume only the approved disposable B story bundle and keep door/replay diagnostics.",
);
assert(
  outdoorAudioGate.includes("if (!sys.isBrowser) return"),
  "Outdoor browser-only audio diagnostics must not be exposed in WeChat or other non-browser runtimes.",
);
assert(
  outdoorStoryBundleMeta.userData?.isBundle === true &&
    outdoorStoryBundleMeta.userData?.bundleName === "outdoor-story-b-kf-r1-temp" &&
    outdoorStoryBundleMeta.userData?.bundleConfigID ===
      "outdoor_story_b_kf_r1_temp_experience_subpackage" &&
    builderSettings.bundleConfig?.custom?.outdoor_story_b_kf_r1_temp_experience_subpackage
      ?.configs?.miniGame?.fallbackOptions?.compressionType === "subpackage",
  "The disposable B KF-R1 story assets must stay isolated in their own WeChat subpackage.",
);
assert(
  outdoorStoryBoundary.candidateId === "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7" &&
    outdoorStoryBoundary.developerVersion === "0.4.7" &&
    outdoorStoryBoundary.classification.includes("prototype-only") &&
    outdoorStoryBoundary.classification.includes("disposable") &&
    outdoorStoryBoundary.classification.includes("not-for-review") &&
    outdoorStoryBoundary.classification.includes("not-for-release") &&
    outdoorStoryBoundary.assetManifestSha256 ===
      sha256("assets/outdoor-story-b-kf-r1-temp/asset-manifest.json") &&
    outdoorStoryBoundary.sourceSha256?.B01 ===
      "fdac7f8edf8a22954a93a3f756ab2c1699c1afe04462bf2fa3ed679ae2794d0c" &&
    outdoorStoryBoundary.sourceSha256?.B02 ===
      "e0f00f2b573dda25b91f53aa5e04fa72456fa3ed1f784a1087b4238083504727" &&
    outdoorStoryBoundary.sourceSha256?.B03 ===
      "8da6d324520fce5175a1f0546a8cb67e29c041795d002439a5add28a80ea1b67" &&
    outdoorStoryBoundary.allowedUse?.includes("one WeChat developer upload version 0.4.7") &&
    outdoorStoryBoundary.allowedUse?.includes(
      "the user may independently promote that exact 0.4.7 developer upload to an experience version",
    ) &&
    outdoorStoryBoundary.forbiddenUse?.includes("review submission") &&
    outdoorStoryBoundary.forbiddenUse?.includes("release") &&
    outdoorStoryBoundary.inactiveHistoricalPackaging?.some((entry) =>
      entry?.bundle === "outdoor-illustration-wind-r2" &&
      entry?.runtimeReferenced === false &&
      entry?.evidenceUse === "forbidden"
    ) &&
    outdoorStoryBoundary.release_guard ===
      "must recursively reject every file in this directory and every derived artifact from review/release",
  "The disposable B KF-R1 boundary, exact source hashes or recursive release stop have drifted.",
);
assert(
  outdoorStoryAssetManifest.candidateId === "gate-d-story-b-kf-r1-temp-dev-r1-0.4.7" &&
    outdoorStoryAssetManifest.developerVersion === "0.4.7" &&
    outdoorStoryAssetManifest.bundle?.name === "outdoor-story-b-kf-r1-temp" &&
    outdoorStoryAssetManifest.bundle?.excludedBundles?.includes(
      "outdoor-illustration-wind-r2",
    ) &&
    outdoorStoryAssetManifest.timeline?.B01HoldMs === 3200 &&
    outdoorStoryAssetManifest.timeline?.firstTransitionMs === 300 &&
    outdoorStoryAssetManifest.timeline?.B02HoldMs === 1500 &&
    outdoorStoryAssetManifest.timeline?.secondTransitionMs === 360 &&
    outdoorStoryAssetManifest.timeline?.B03Hold === "infinite" &&
    outdoorStoryAssetManifest.reducedMotion?.fixedBeat === "B01" &&
    outdoorStoryAssetManifest.reducedMotion?.transitions === false &&
    outdoorStoryAssetManifest.source?.assets?.length === 3,
  "The disposable B KF-R1 manifest must keep the approved three-beat timing and reduced-motion contract.",
);
let storyRuntimeBytes = 0;
for (const record of outdoorStoryAssetManifest.source.assets) {
  const path = `assets/outdoor-story-b-kf-r1-temp/${record.runtimeFile}`;
  assert(existsSync(resolve(projectRoot, path)), `Missing B KF-R1 runtime frame ${path}.`);
  assert(record.runtimeSha256 === sha256(path), `${record.beat} runtime hash drifted.`);
  assert(
    outdoorStoryBoundary.runtimeSha256?.[record.runtimeFile] === record.runtimeSha256,
    `${record.beat} boundary runtime hash drifted.`,
  );
  const meta = readJson(`${path}.meta`);
  assert(
    meta.importer === "image" &&
      meta.userData?.type === "sprite-frame" &&
      meta.userData?.hasAlpha === false &&
      meta.subMetas?.f9941?.userData?.width === 780 &&
      meta.subMetas?.f9941?.userData?.height === 1688,
    `Invalid 780x1688 RGB SpriteFrame metadata for ${record.runtimeFile}.`,
  );
  storyRuntimeBytes += record.runtimeBytes;
}
assert(
  storyRuntimeBytes === outdoorStoryAssetManifest.runtimeTotalBytes,
  "B KF-R1 runtime byte total drifted from the manifest.",
);
assert(
  wechatBuildConfig.platform === "wechatgame" &&
    wechatBuildConfig.buildPath ===
      "project://build/gate-d-story-b-kf-r1-temp-dev-r1-0.4.7" &&
    wechatBuildConfig.outputName === "wechatgame" &&
    wechatBuildConfig.packages?.wechatgame?.orientation === "portrait" &&
    webBuildConfig.platform === "web-mobile" &&
    webBuildConfig.buildPath ===
      "project://build/gate-d-story-b-kf-r1-temp-web-r1-0.4.7" &&
    webBuildConfig.outputName === "web-mobile",
  "The 0.4.7 WeChat/Web candidates must use unique build directories and keep portrait platform settings.",
);
assert(
  historicalR2Boundary.asset_boundary ===
    "prototype-only/disposable/not-for-review/not-for-release" &&
    historicalR2Boundary.candidateId ===
      "gate-d-mainflow-v4-r2-edgefix-01-dev-r10-0.4.6" &&
    historicalR2Boundary.engineeringRevision === "R2-EDGEFIX-01" &&
    historicalR2Boundary.assetManifestSha256 ===
      sha256("assets/outdoor-illustration-wind-r2/asset-manifest.json") &&
    historicalR2Boundary.allowed?.includes(
      "one WeChat developer upload version 0.4.6 and its corresponding user-promoted experience version",
    ) &&
    historicalR2Boundary.forbidden?.includes(
      "any remote upload or experience version other than 0.4.6 unless separately authorized by the user",
    ) &&
    historicalR2Boundary.forbidden?.includes("review submission") &&
    historicalR2Boundary.forbidden?.includes("release") &&
    historicalR2Boundary.release_guard ===
      "must reject every file in this directory from review/release",
  "The superseded R2 asset history must remain traceable and release-blocked.",
);
assert(
  historicalR2BundleMeta.userData?.isBundle === true &&
    historicalR2BundleMeta.userData?.bundleName ===
      "outdoor-illustration-wind-r2" &&
    builderSettings.bundleConfig?.custom?.outdoor_illustration_wind_r2_experience_subpackage
      ?.configs?.miniGame?.fallbackOptions?.compressionType === "subpackage",
  "The superseded R2 illustration bundle must remain isolated historical packaging.",
);
assert(
  wechatRuntimeBuildValidator.includes(
    'const storySourceRoot = resolve(projectRoot, "assets/outdoor-story-b-kf-r1-temp")',
  ) &&
    wechatRuntimeBuildValidator.includes(
      'const storyBoundaryPath = resolve(storySourceRoot, "asset-boundary.json")',
    ) &&
    wechatRuntimeBuildValidator.includes("storyArtifacts") &&
    wechatRuntimeBuildValidator.includes("indoorArtifacts") &&
    wechatRuntimeBuildValidator.includes("historicalR2Artifacts") &&
    wechatRuntimeBuildValidator.includes("findPrototypeBuildArtifacts") &&
    wechatRuntimeBuildValidator.includes('readJson(resolve(buildRoot, "build-identity.json"))') &&
    wechatExperienceIdentityPreparer.includes("remoteOperationPerformed: false") &&
    wechatExperienceIdentityPreparer.includes("WECHAT_EXPERIENCE_CANDIDATE_ID") &&
    wechatRuntimeBuildValidator.includes("release mode is blocked by recursive prototype asset scan") &&
    wechatRuntimeBuildValidator.includes("forbidden runtime marker present") &&
    wechatExperienceAuthorization.includes("allowsStoryBKfR1TemporaryExperience") &&
    wechatExperienceAuthorization.includes("gate-d-story-b-kf-r1-temp-dev-r1-0.4.7"),
  "The WeChat validator must accept only the exact 0.4.7 B candidate, recursively scan prototypes and reject release.",
);
assert(
  historicalR2AssetManifest.candidate === "OUTDOOR-ILLUSTRATION-WIND-V1-A-R2" &&
    historicalR2AssetManifest.source?.sha256 ===
      "a787d06f170cef4ac675e7a14287b4f8c4cfaef5414248091bfe481abdb1b811" &&
    historicalR2AssetManifest.runtime_contract?.resident_sprites === 2 &&
    historicalR2AssetManifest.runtime_contract?.crossfade_ms === 140 &&
    historicalR2AssetManifest.mechanical_method?.stable_scene === "F0 crop is the only full-screen opaque base" &&
    historicalR2AssetManifest.states?.length === 5,
  "The superseded R2 asset manifest must remain intact for audit history.",
);
const stableScenePath = "assets/outdoor-illustration-wind-r2/stable-scene-390x844.png";
assert(existsSync(resolve(projectRoot, stableScenePath)), `Missing ${stableScenePath}.`);
assert(
  historicalR2AssetManifest.stable_scene?.runtime_sha256 === sha256(stableScenePath),
  "R2 stable-scene hash drifted from asset-manifest.json.",
);
for (let index = 0; index < 5; index += 1) {
  const name = `lower-f${index}-390x844`;
  const path = `assets/outdoor-illustration-wind-r2/${name}.png`;
  const frameRecord = historicalR2AssetManifest.states?.[index];
  assert(existsSync(resolve(projectRoot, path)), `Missing R2 lower wind page ${path}.`);
  assert(frameRecord?.state === `F${index}`, `R2 state entry is missing or out of order for F${index}.`);
  assert(frameRecord.canvas?.[0] === 390 && frameRecord.canvas?.[1] === 844, `${name} must stay 390x844.`);
  assert(frameRecord.runtime_sha256 === sha256(path), `${name} hash drifted from asset-manifest.json.`);
  const meta = readJson(`${path}.meta`);
  assert(
    meta.importer === "image" &&
      meta.userData?.type === "sprite-frame" &&
      meta.subMetas?.f9941?.importer === "sprite-frame" &&
      meta.subMetas?.f9941?.userData?.width === 390 &&
      meta.subMetas?.f9941?.userData?.height === 844,
    `Invalid R2 SpriteFrame metadata for ${name}.`,
  );
}
assert(existsSync(resolve(projectRoot, audioResourcePath)), "Missing first-night room-loop audio.");
assert(
  audioControllerMeta.uuid === "2f940b4b-6ea2-4bb5-bc2e-8cc94f1ebf8b" &&
    audioResourceMeta.importer === "audio-clip" &&
  audioController.includes('@ccclass("TonightHasLightAudio")') &&
    audioController.includes('resources.load(AUDIO_RESOURCE_PATH, AudioClip') &&
    audioController.includes("durationMs = 2500") &&
    audioController.includes("source.playOnAwake = false") &&
    audioController.includes("source.loop = true") &&
    audioController.includes("if (!this.isValid || !this.source)") &&
    audioController.includes("resources.release(AUDIO_RESOURCE_PATH, AudioClip)"),
  "The first-night audio must remain user-triggered, looped and gradually faded in.",
);

for (const nightNumber of [2, 3, 4, 5]) {
  const suffix = String(nightNumber).padStart(2, "0");
  const metaPath = `assets/nights/night-${suffix}.meta`;
  assert(existsSync(resolve(projectRoot, metaPath)), `Missing ${metaPath}.`);
  const meta = readJson(metaPath);
  assert(meta.userData?.isBundle === true, `${metaPath} must be an Asset Bundle.`);
  assert(meta.userData?.bundleName === `night-${suffix}`, `${metaPath} bundle name is invalid.`);
  assert(
    builderSettings.bundleConfig?.custom?.[`night_${suffix}_subpackage`],
    `Missing mini-game subpackage config for night-${suffix}.`,
  );
}

const validationErrors = [
  ...validateNightDefinitions(),
  ...validateAssetRecords(ASSET_RECORDS),
];
assert(validationErrors.length === 0, validationErrors.join("\n"));

console.log("Project structure, content contracts and bundle settings are valid.");
