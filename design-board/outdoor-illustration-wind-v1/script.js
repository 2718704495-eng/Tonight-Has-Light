const FRAME_POSITIONS = ["0%", "25%", "50%", "75%", "100%"];
const FRAME_LABELS = [
  "F0 · 风来前的安静",
  "F1 · 远草先伏下去",
  "F2 · 近草翻成大弧线",
  "F3 · 发梢和衣角被风带起",
  "F4 · 猫耳和尾巴轻轻响应",
];
const OPENING_SETTLE_MS = 900;
const FRAME_HOLDS_MS = [4500, 575, 625, 675, 800];
const TRANSITION_MS = 140;
const REDUCED_TRANSITION_MS = 180;

const stage = document.querySelector("#wind-stage");
const layers = [stage.querySelector("[data-layer='a']"), stage.querySelector("[data-layer='b']")];
const frameDescription = document.querySelector("#frame-description");
const playToggle = document.querySelector("#play-toggle");
const reduceToggle = document.querySelector("#reduce-toggle");
const frameButtons = [...document.querySelectorAll("[data-frame]")];

let activeLayerIndex = 0;
let currentFrame = 0;
let autoplay = true;
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let loopTimer = 0;
let transitionToken = 0;

function positionLayer(layer, frameIndex) {
  layer.style.backgroundPosition = `${FRAME_POSITIONS[frameIndex]} 50%`;
}

function updateControls() {
  frameDescription.textContent = FRAME_LABELS[currentFrame];
  frameButtons.forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === currentFrame));
  });

  playToggle.setAttribute("aria-pressed", String(autoplay && !reducedMotion));
  playToggle.textContent = autoplay && !reducedMotion ? "暂停自动播放" : "开始自动播放";
  reduceToggle.setAttribute("aria-pressed", String(reducedMotion));
  reduceToggle.textContent = `减少动态：${reducedMotion ? "开" : "关"}`;
}

function clearLoop() {
  window.clearTimeout(loopTimer);
  loopTimer = 0;
}

function settleInterruptedTransition() {
  const opacities = layers.map((layer) => Number.parseFloat(getComputedStyle(layer).opacity) || 0);
  const dominantLayerIndex = opacities[1] > opacities[0] ? 1 : 0;

  layers.forEach((layer, index) => {
    layer.style.transitionDuration = "0ms";
    layer.style.opacity = index === dominantLayerIndex ? "1" : "0";
  });
  activeLayerIndex = dominantLayerIndex;
  void stage.offsetWidth;
}

function scheduleNext(delayOverrideMs) {
  clearLoop();
  if (!autoplay || reducedMotion || document.hidden) return;

  loopTimer = window.setTimeout(() => {
    const nextFrame = (currentFrame + 1) % FRAME_POSITIONS.length;
    showFrame(nextFrame, { schedule: true });
  }, delayOverrideMs ?? FRAME_HOLDS_MS[currentFrame]);
}

function showFrame(frameIndex, { schedule = false } = {}) {
  clearLoop();
  transitionToken += 1;
  const token = transitionToken;
  settleInterruptedTransition();
  const previous = layers[activeLayerIndex];
  const nextLayerIndex = 1 - activeLayerIndex;
  const next = layers[nextLayerIndex];
  const duration = reducedMotion ? REDUCED_TRANSITION_MS : TRANSITION_MS;

  currentFrame = Math.max(0, Math.min(FRAME_POSITIONS.length - 1, frameIndex));
  positionLayer(next, currentFrame);
  next.style.transitionDuration = `${duration}ms`;
  previous.style.transitionDuration = `${duration}ms`;
  next.style.zIndex = "2";
  previous.style.zIndex = "1";
  next.style.opacity = "0";

  requestAnimationFrame(() => {
    if (token !== transitionToken) return;
    next.style.opacity = "1";
    previous.style.opacity = "0";
    activeLayerIndex = nextLayerIndex;
    updateControls();
    if (schedule) scheduleNext();
  });
}

function setAutoplay(value) {
  autoplay = value;
  if (autoplay && reducedMotion) {
    reducedMotion = false;
  }
  updateControls();
  scheduleNext();
}

playToggle.addEventListener("click", () => setAutoplay(!(autoplay && !reducedMotion)));

reduceToggle.addEventListener("click", () => {
  reducedMotion = !reducedMotion;
  clearLoop();
  if (reducedMotion) {
    autoplay = false;
    showFrame(0);
  }
  updateControls();
});

frameButtons.forEach((button, index) => {
  button.addEventListener("click", () => {
    autoplay = false;
    showFrame(index);
    updateControls();
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearLoop();
    return;
  }
  scheduleNext();
});

const preload = new Image();
preload.addEventListener("load", () => {
  positionLayer(layers[0], 0);
  positionLayer(layers[1], 0);
  layers[0].style.opacity = "1";
  layers[1].style.opacity = "0";
  updateControls();
  scheduleNext(OPENING_SETTLE_MS);
});
preload.src = "./exploration/five-wind-pages-storyboard-r2-stronger.png";
