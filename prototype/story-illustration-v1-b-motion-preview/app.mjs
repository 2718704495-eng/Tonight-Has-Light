import { createStoryPlayback } from "./story-timeline.mjs";
import { transitionGeometry } from "./transition-geometry.mjs";
import { envelopeProgress } from "./audio-envelope.mjs";

const FRAME_SOURCES = [
  "../../design-board/story-illustration-redesign-v1-b/exploration/b01-settle-reference-r1.png",
  "../../design-board/story-illustration-redesign-v1-b/exploration/b02-wind-passes-r1.png",
  "../../design-board/story-illustration-redesign-v1-b/exploration/b03-afterwind-detail-r1.png",
];

const PHASE_COPY = {
  settle: ["B01 · 坐稳", "天空先完整留给你。"],
  "to-wind": ["接页 · 风来了", "墨块沿着同一根草线经过。"],
  wind: ["B02 · 风经过", "草、衣角和猫尾读成同一阵风。"],
  "to-afterwind": ["接页 · 风在收", "大草带把视线带到更近的细节。"],
  afterwind: ["B03 · 余风", "什么都不用完成，画面停在这里。"],
  cancelled: ["进屋", "这阵风已被门的选择立即打断。"],
};

const scene = document.querySelector("#storyScene");
const frameA = document.querySelector("#frameA");
const frameB = document.querySelector("#frameB");
const inkWipe = document.querySelector("#inkWipe");
const doorHit = document.querySelector("#doorHit");
const windAudio = document.querySelector("#windAudio");
const phaseLabel = document.querySelector("#phaseLabel");
const phaseNote = document.querySelector("#phaseNote");
const sceneAnnouncement = document.querySelector("#sceneAnnouncement");
const replayButton = document.querySelector("#replayButton");
const returnOutdoorButton = document.querySelector("#returnOutdoorButton");
const reducedMotionToggle = document.querySelector("#reducedMotionToggle");

const query = new URLSearchParams(window.location.search);
const freezeFrame = query.get("freeze") === "1";
const parsedElapsed = Number(query.get("elapsed"));
const debugElapsed = Number.isFinite(parsedElapsed) ? Math.max(0, parsedElapsed) : 0;
const systemReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
reducedMotionToggle.checked = systemReduced.matches;

const initialClock = performance.now();
let playback = createStoryPlayback({
  startedAt: initialClock - debugElapsed,
  reducedMotion: reducedMotionToggle.checked,
});
let animationFrame = 0;
let indoor = false;
let audioUnlocked = false;
let pointerStart = null;
scene.dataset.audio = "locked";
scene.classList.toggle("is-reduced-motion", reducedMotionToggle.checked);

function setPhaseCopy(phase) {
  const [label, note] = PHASE_COPY[phase] ?? PHASE_COPY.settle;
  if (phaseLabel.textContent !== label) {
    phaseLabel.textContent = label;
    phaseNote.textContent = note;
    sceneAnnouncement.textContent = `${label}。${note}`;
  }
}

function showRestingFrame(frameIndex) {
  frameA.src = FRAME_SOURCES[frameIndex];
  frameA.style.opacity = "1";
  frameB.style.opacity = "0";
  frameB.style.clipPath = "inset(100% 0 0 0)";
  inkWipe.style.opacity = "0";
}

function showTransition(snapshot) {
  const progress = snapshot.progress;
  const geometry = transitionGeometry(snapshot.phase, progress);
  frameA.src = FRAME_SOURCES[snapshot.from];
  frameB.src = FRAME_SOURCES[snapshot.to];
  frameA.style.opacity = String(1 - progress * 0.08);
  frameB.style.opacity = "1";
  frameB.style.clipPath = geometry.clipPath;
  inkWipe.style.transform = geometry.inkTransform;
  inkWipe.style.opacity = String(geometry.inkOpacity);
}

function render(now) {
  const snapshot = playback.snapshot(now);
  scene.dataset.phase = snapshot.phase;
  setPhaseCopy(snapshot.phase);

  if (snapshot.phase === "cancelled") return;
  if (snapshot.resting) showRestingFrame(snapshot.from);
  else showTransition(snapshot);

  if (
    !freezeFrame &&
    snapshot.phase !== "afterwind" &&
    !reducedMotionToggle.checked &&
    !indoor
  ) {
    animationFrame = requestAnimationFrame(render);
  }
}

function startRendering() {
  cancelAnimationFrame(animationFrame);
  if (freezeFrame) render(initialClock);
  else animationFrame = requestAnimationFrame(render);
}

function fadeAudio(target, duration) {
  const startedAt = performance.now();
  const from = windAudio.volume;
  function step(now) {
    const progress = envelopeProgress(now, startedAt, duration);
    windAudio.volume = from + (target - from) * progress;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

async function unlockAudio() {
  if (audioUnlocked || indoor) return;
  audioUnlocked = true;
  scene.dataset.audio = "starting";
  windAudio.volume = 0;
  try {
    await windAudio.play();
    scene.dataset.audio = "playing";
    fadeAudio(0.62, 350);
  } catch (error) {
    audioUnlocked = false;
    scene.dataset.audio = "blocked";
    scene.dataset.audioError =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }
}

function replayStory() {
  indoor = false;
  scene.classList.remove("is-indoor");
  doorHit.disabled = false;
  returnOutdoorButton.hidden = true;
  replayButton.hidden = false;
  playback.replay(performance.now());
  startRendering();
}

function enterRoom() {
  if (indoor) return;
  indoor = true;
  playback.cancel("door");
  cancelAnimationFrame(animationFrame);
  setPhaseCopy("cancelled");
  doorHit.disabled = true;
  scene.classList.add("is-indoor");
  replayButton.hidden = true;
  returnOutdoorButton.hidden = false;
  fadeAudio(0.08, reducedMotionToggle.checked ? 160 : 430);
}

function setReducedMotion(value) {
  scene.classList.toggle("is-reduced-motion", value);
  playback.setReducedMotion(value, performance.now());
  if (!indoor) startRendering();
}

for (const source of FRAME_SOURCES) {
  const image = new Image();
  image.decoding = "async";
  image.src = source;
}

scene.addEventListener("pointerdown", (event) => {
  void unlockAudio();
  pointerStart = { x: event.clientX, y: event.clientY, time: performance.now() };
});

scene.addEventListener("pointerup", (event) => {
  if (!pointerStart || indoor) return;
  const duration = performance.now() - pointerStart.time;
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  pointerStart = null;
  if (duration >= 280 && distance >= 55) replayStory();
});

scene.addEventListener("pointercancel", () => {
  pointerStart = null;
});

doorHit.addEventListener("click", (event) => {
  event.stopPropagation();
  enterRoom();
});

replayButton.addEventListener("click", replayStory);
returnOutdoorButton.addEventListener("click", replayStory);
reducedMotionToggle.addEventListener("change", () => {
  setReducedMotion(reducedMotionToggle.checked);
});

systemReduced.addEventListener?.("change", (event) => {
  reducedMotionToggle.checked = event.matches;
  setReducedMotion(event.matches);
});

startRendering();
