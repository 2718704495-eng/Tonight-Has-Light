import {
  STARGAZE_FINALE_TIMING,
  resolveStargazeFinaleChoice,
} from "./stargaze-finale-model.mjs";
import {
  getPreviewScrollBehavior,
  getPreviewStageSize,
} from "./preview-layout-model.mjs";

const BRANCHES = {
  star: {
    title: "看星空",
    copy: "薄云掠过银河的暗纹；一颗流星经过，把回家或再坐一会儿留给你。",
    image: "./exploration/star-branch-contact-sheet-r3.png",
    width: 1907,
    height: 825,
    frames: 5,
    ending: "星空安静下来。",
  },
  breeze: {
    title: "吹吹风",
    copy: "风带来一根草叶，小猫接住了它，也把这一晚接住了。",
    image: "./exploration/breeze-branch-contact-sheet-r1.png",
    width: 1774,
    height: 887,
    frames: 5,
    ending: "轻触画面，回到草坡",
  },
  home: {
    title: "回家",
    copy: "他们一起起身，沿着暖门回到已经备好晚饭的家。",
    image: "./exploration/home-branch-contact-sheet-r1.png",
    width: 1711,
    height: 919,
    frames: 5,
    ending: "灯一直为你亮着。",
  },
};

const phoneStage = document.querySelector("#phone-stage");
const phoneColumn = document.querySelector(".phone-column");
const hubScene = document.querySelector("#hub-scene");
const storyScene = document.querySelector("#story-scene");
const storyTap = document.querySelector("#story-tap");
const storyTitle = document.querySelector("#story-title");
const storyPrompt = document.querySelector("#story-prompt");
const gentleHint = document.querySelector("#gentle-hint");
const currentState = document.querySelector("#current-state");
const currentCopy = document.querySelector("#current-copy");
const liveRegion = document.querySelector("#live-region");
const layerA = document.querySelector("#story-layer-a");
const layerB = document.querySelector("#story-layer-b");
const reduceMotion = document.querySelector("#reduce-motion");
const largeText = document.querySelector("#large-text");
const stargazeFinale = document.querySelector("#stargaze-finale");
const stargazeFinaleCopy = document.querySelector("#stargaze-finale-copy");
const finaleHome = document.querySelector("#finale-home");
const finaleStay = document.querySelector("#finale-stay");

let currentBranchKey = null;
let currentFrame = 0;
let activeLayer = layerA;
let hintWasShown = false;
let transitionTimer = 0;
let hubHintTimer = 0;
let finaleChoiceTimer = 0;
let pageTurnLocked = false;

function transitionDuration() {
  return phoneStage.classList.contains("reduced-motion") || window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 150
    : 300;
}

function fitPreviewStage() {
  const { width } = getPreviewStageSize({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
  phoneColumn.style.setProperty("--preview-stage-width", `${width}px`);
}

function bringWholeStageIntoView() {
  if (window.innerWidth > 760) return;
  const behavior = getPreviewScrollBehavior({
    manualReducedMotion: phoneStage.classList.contains("reduced-motion"),
    systemReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  window.requestAnimationFrame(() => {
    phoneColumn.scrollIntoView({
      block: "start",
      behavior,
    });
  });
}

function configureLayer(layer, branch, frame) {
  const panel = layer.querySelector(".story-panel");
  const stageWidth = storyScene.clientWidth;
  const stageHeight = storyScene.clientHeight;
  const sourceFrameWidth = branch.width / branch.frames;
  const sourceFrameHeight = branch.height;
  const scale = Math.max(stageWidth / sourceFrameWidth, stageHeight / sourceFrameHeight);
  const renderedWidth = branch.width * scale;
  const renderedHeight = branch.height * scale;
  const frameWidth = sourceFrameWidth * scale;
  const offsetX = (stageWidth - frameWidth) / 2;
  const offsetY = (stageHeight - renderedHeight) / 2;

  panel.style.width = `${stageWidth}px`;
  panel.style.backgroundImage = `url("${branch.image}")`;
  panel.style.backgroundSize = `${renderedWidth}px ${renderedHeight}px`;
  panel.style.backgroundPosition = `${offsetX - frame * frameWidth}px ${offsetY}px`;
}

function announce(message) {
  liveRegion.textContent = "";
  window.requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

function setAside(title, copy) {
  currentState.textContent = title;
  currentCopy.textContent = copy;
}

function cancelStargazeFinale() {
  window.clearTimeout(finaleChoiceTimer);
  finaleChoiceTimer = 0;
  stargazeFinale.classList.remove("is-running", "choices-ready");
  stargazeFinale.hidden = true;
  stargazeFinale.setAttribute("aria-hidden", "true");
  stargazeFinaleCopy.hidden = true;
  storyScene.classList.remove("is-stargaze-finale");
}

function startStargazeFinale() {
  cancelStargazeFinale();
  storyScene.classList.add("is-stargaze-finale");
  stargazeFinale.hidden = false;
  window.requestAnimationFrame(() => {
    stargazeFinale.classList.add("is-running");
  });

  finaleChoiceTimer = window.setTimeout(() => {
    stargazeFinaleCopy.hidden = false;
    stargazeFinale.setAttribute("aria-hidden", "false");
    window.requestAnimationFrame(() => {
      stargazeFinale.classList.add("choices-ready");
    });
    announce("一颗流星，刚刚从夜里经过。回家，还是再坐一会儿？");
  }, STARGAZE_FINALE_TIMING.choicesAtMs);
}

function revealHubHints() {
  window.clearTimeout(hubHintTimer);
  hubHintTimer = window.setTimeout(() => {
    hubScene.classList.add("hints-ready");
    announce("画中邀请已经出现：看看星空、吹吹风、回家。 ");
  }, 1500);
}

function showGentleHintOnce() {
  if (hintWasShown) return;
  hintWasShown = true;
  gentleHint.classList.add("is-visible");
  announce(gentleHint.textContent.trim());
  window.setTimeout(() => gentleHint.classList.remove("is-visible"), 3400);
}

function setStoryPrompt(branch) {
  const isFinal = currentFrame === branch.frames - 1;
  const isStargazeFinale = isFinal && currentBranchKey === "star";
  storyPrompt.textContent = isStargazeFinale ? "" : isFinal ? branch.ending : "轻触画面，继续看";
  storyTap.disabled = isFinal && (currentBranchKey === "home" || currentBranchKey === "star");
  storyTap.setAttribute(
    "aria-label",
    isStargazeFinale ? "星空结尾正在播放" : isFinal ? branch.ending : "轻触画面，继续看",
  );
  storyScene.classList.toggle("is-home-ending", currentBranchKey === "home" && isFinal);
}

function openBranch(branchKey) {
  const branch = BRANCHES[branchKey];
  if (!branch) return;

  const switchingFromStory = Boolean(currentBranchKey && !storyScene.hidden);
  window.clearTimeout(transitionTimer);
  window.clearTimeout(hubHintTimer);
  cancelStargazeFinale();
  currentBranchKey = branchKey;
  currentFrame = 0;
  storyScene.dataset.frame = "0";
  storyTitle.textContent = branch.title;
  setAside(branch.title, branch.copy);

  if (switchingFromStory) {
    pageTurnLocked = true;
    const previousLayer = activeLayer;
    const nextLayer = activeLayer === layerA ? layerB : layerA;
    configureLayer(nextLayer, branch, currentFrame);
    nextLayer.classList.remove("is-departing");
    window.requestAnimationFrame(() => {
      nextLayer.classList.add("is-visible");
      previousLayer.classList.add("is-departing");
      previousLayer.classList.remove("is-visible");
    });
    activeLayer = nextLayer;
    setStoryPrompt(branch);
    transitionTimer = window.setTimeout(() => {
      previousLayer.classList.remove("is-departing");
      pageTurnLocked = false;
    }, transitionDuration());
    announce(`进入${branch.title}。轻触画面继续。`);
    return;
  }

  pageTurnLocked = false;
  configureLayer(activeLayer, branch, currentFrame);
  activeLayer.classList.add("is-visible");
  setStoryPrompt(branch);

  storyScene.hidden = false;
  window.requestAnimationFrame(() => {
    storyScene.classList.add("is-visible");
    hubScene.classList.add("is-leaving");
  });
  bringWholeStageIntoView();

  transitionTimer = window.setTimeout(() => {
    hubScene.hidden = true;
    announce(`进入${branch.title}。轻触画面继续。`);
  }, transitionDuration());
}

function turnStoryPage() {
  if (!currentBranchKey || pageTurnLocked) return;
  const branch = BRANCHES[currentBranchKey];

  if (currentFrame === branch.frames - 1) {
    if (currentBranchKey !== "home") returnToHub();
    return;
  }

  pageTurnLocked = true;
  currentFrame += 1;
  storyScene.dataset.frame = String(currentFrame);
  const previousLayer = activeLayer;
  const nextLayer = activeLayer === layerA ? layerB : layerA;
  configureLayer(nextLayer, branch, currentFrame);
  nextLayer.classList.remove("is-departing");
  window.requestAnimationFrame(() => {
    nextLayer.classList.add("is-visible");
    previousLayer.classList.add("is-departing");
    previousLayer.classList.remove("is-visible");
  });

  activeLayer = nextLayer;
  setStoryPrompt(branch);
  const enteringStargazeFinale = currentBranchKey === "star" && currentFrame === branch.frames - 1;
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(() => {
    previousLayer.classList.remove("is-departing");
    pageTurnLocked = false;
    if (enteringStargazeFinale) startStargazeFinale();
  }, transitionDuration());
  announce(currentFrame === branch.frames - 1 ? branch.ending : "下一幅。轻触画面继续。 ");
}

function returnToHub() {
  window.clearTimeout(transitionTimer);
  cancelStargazeFinale();
  hubScene.hidden = false;
  hubScene.classList.remove("is-leaving");
  storyScene.classList.remove("is-visible", "is-home-ending");
  storyTap.disabled = false;
  setAside("草坡入口", "可以不做任何事，也可以碰天空、草尖或亮着的门。");

  transitionTimer = window.setTimeout(() => {
    storyScene.hidden = true;
    currentBranchKey = null;
    currentFrame = 0;
    pageTurnLocked = false;
    delete storyScene.dataset.frame;
    layerA.className = "story-layer is-visible";
    layerB.className = "story-layer";
    activeLayer = layerA;
    revealHubHints();
    announce("回到夜风草坡。 ");
  }, transitionDuration());
}

document.querySelectorAll("[data-branch]").forEach((hotspot) => {
  hotspot.addEventListener("pointerdown", () => {
    hotspot.classList.add("is-pressed");
    window.setTimeout(() => hotspot.classList.remove("is-pressed"), 120);
  });
  hotspot.addEventListener("click", (event) => {
    event.stopPropagation();
    openBranch(hotspot.dataset.branch);
  });
});

document.querySelector("#quiet-character-zone").addEventListener("click", (event) => {
  event.stopPropagation();
  showGentleHintOnce();
});

hubScene.addEventListener("click", showGentleHintOnce);
storyTap.addEventListener("click", turnStoryPage);
document.querySelector("#return-hub").addEventListener("click", returnToHub);
document.querySelector("#proof-reset").addEventListener("click", returnToHub);

function chooseStargazeFinale(choice) {
  const destination = resolveStargazeFinaleChoice(choice);
  if (!destination) return;
  if (destination.type === "branch") {
    openBranch(destination.branchKey);
    return;
  }
  returnToHub();
}

finaleHome.addEventListener("click", () => chooseStargazeFinale("home"));
finaleStay.addEventListener("click", () => chooseStargazeFinale("stay"));

reduceMotion.addEventListener("change", () => {
  phoneStage.classList.toggle("reduced-motion", reduceMotion.checked);
  announce(reduceMotion.checked ? "已开启减少动态预览。" : "已关闭减少动态预览。 ");
});

largeText.addEventListener("change", () => {
  phoneStage.classList.toggle("large-text", largeText.checked);
  announce(largeText.checked ? "已开启百分之一百二十大字预览。" : "已关闭大字预览。 ");
});

window.addEventListener("resize", () => {
  fitPreviewStage();
  if (!currentBranchKey || storyScene.hidden) return;
  configureLayer(activeLayer, BRANCHES[currentBranchKey], currentFrame);
});

Object.values(BRANCHES).forEach((branch) => {
  const image = new Image();
  image.src = branch.image;
});

fitPreviewStage();
revealHubHints();
