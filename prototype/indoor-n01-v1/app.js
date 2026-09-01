const stage = document.querySelector("#prototype");
const kettleHotspot = document.querySelector("#kettleHotspot");
const cupHotspot = document.querySelector("#cupHotspot");
const soundToggle = document.querySelector("#soundToggle");
const storyCopy = document.querySelector("#storyCopy");
const storyLine = document.querySelector("#storyLine");
const assertiveStatus = document.querySelector("#assertiveStatus");

const query = new URLSearchParams(window.location.search);
const reducedMedia = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  phase: "waiting",
  beat: "idle",
  reducedMotion: query.get("reduced") === "1" || reducedMedia.matches,
  soundEnabled: query.get("sound") !== "0",
  completed: false,
  sequenceToken: 0,
  timers: new Set(),
  hintTimer: 0,
};

function later(callback, delay) {
  const timer = window.setTimeout(() => {
    state.timers.delete(timer);
    callback();
  }, delay);
  state.timers.add(timer);
  return timer;
}

function clearSequenceTimers() {
  state.timers.forEach((timer) => window.clearTimeout(timer));
  state.timers.clear();
}

function setPhase(phase, beat = state.beat) {
  state.phase = phase;
  state.beat = beat;
  stage.dataset.phase = phase;
  stage.dataset.beat = beat;
}

function announce(message) {
  assertiveStatus.textContent = "";
  window.requestAnimationFrame(() => {
    assertiveStatus.textContent = message;
  });
}

function showStory(message, { persistent = false } = {}) {
  storyLine.textContent = message;
  storyCopy.classList.add("is-visible");
  if (!persistent) {
    later(() => {
      if (storyLine.textContent === message && state.phase !== "settled") {
        storyCopy.classList.remove("is-visible");
      }
    }, 4200);
  }
}

function applyReducedMotion() {
  stage.classList.toggle("reduced-motion", state.reducedMotion);
  stage.dataset.reducedMotion = String(state.reducedMotion);
}

class DisposablePrototypeAudio {
  constructor() {
    this.context = null;
    this.output = null;
  }

  ensureContext() {
    if (this.context) return this.context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    this.context = new AudioContextClass();
    this.output = this.context.createGain();
    this.output.gain.value = 0.76;
    this.output.connect(this.context.destination);
    return this.context;
  }

  async resume() {
    const context = this.ensureContext();
    if (context?.state === "suspended") await context.resume();
    return context;
  }

  tone({ at = 0, from, to, duration, gain: peak, type = "sine" }) {
    if (!state.soundEnabled || !this.context || !this.output) return;
    const start = this.context.currentTime + at;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.018, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  hiss({ at = 0, duration = 0.72, gain: peak = 0.018 } = {}) {
    if (!state.soundEnabled || !this.context || !this.output) return;
    const start = this.context.currentTime + at;
    const sampleCount = Math.ceil(this.context.sampleRate * duration);
    const buffer = this.context.createBuffer(1, sampleCount, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.82 + white * 0.18;
      channel[index] = previous;
    }
    const source = this.context.createBufferSource();
    const highpass = this.context.createBiquadFilter();
    const lowpass = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    highpass.type = "highpass";
    highpass.frequency.value = 680;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2400;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(highpass).connect(lowpass).connect(gain).connect(this.output);
    source.start(start);
    source.stop(start + duration);
  }

  async kettleAnswer() {
    const context = await this.resume();
    if (!context || !state.soundEnabled) return;
    this.hiss({ duration: 0.88, gain: 0.014 });
    this.tone({ at: 0.055, from: 760, to: 430, duration: 0.13, gain: 0.026, type: "triangle" });
    this.tone({ at: 0.21, from: 610, to: 390, duration: 0.11, gain: 0.016, type: "sine" });
  }

  async cupTap() {
    const context = await this.resume();
    if (!context || !state.soundEnabled) return;
    this.tone({ from: 520, to: 350, duration: 0.16, gain: 0.018, type: "triangle" });
  }

  suspend() {
    if (this.context?.state === "running") this.context.suspend().catch(() => {});
  }
}

const audio = new DisposablePrototypeAudio();

function refreshSoundButton() {
  soundToggle.setAttribute("aria-pressed", String(state.soundEnabled));
  soundToggle.setAttribute("aria-label", state.soundEnabled ? "关闭样片声音" : "打开样片声音");
  stage.dataset.sound = state.soundEnabled ? "on" : "off";
}

function pressFeedback() {
  kettleHotspot.classList.remove("is-pressed");
  window.requestAnimationFrame(() => {
    kettleHotspot.classList.add("is-pressed");
    later(() => kettleHotspot.classList.remove("is-pressed"), 220);
  });
}

function replayKettle() {
  if (stage.classList.contains("is-replaying")) return;
  pressFeedback();
  stage.classList.add("is-replaying");
  audio.kettleAnswer().catch(() => {});
  announce("壶盖又轻轻响了一下。杯子仍好好放着。");
  later(() => stage.classList.remove("is-replaying"), 1500);
}

function settleAfterRighting(token) {
  later(() => {
    if (token !== state.sequenceToken) return;
    state.completed = true;
    cupHotspot.disabled = true;
    stage.classList.remove("is-sequencing");
    setPhase("settled", "quiet");
    kettleHotspot.setAttribute("aria-label", "再听一次壶盖轻响");
    showStory("水热了。\n你也先缓一会儿。", { persistent: true });
    announce("水热了。你也先缓一会儿。");
  }, 1180);
}

function rightCup(token = ++state.sequenceToken) {
  if (state.phase !== "responding" || state.beat !== "cat") return;
  cupHotspot.disabled = true;
  setPhase("responding", "righting");
  announce("杯子被轻轻扶正了。水和饭一直替你温着。");
  audio.cupTap().catch(() => {});
  settleAfterRighting(token);
}

function runMainSequence() {
  if (state.phase === "responding") return;
  if (state.completed) {
    replayKettle();
    return;
  }

  window.clearTimeout(state.hintTimer);
  clearSequenceTimers();
  const token = ++state.sequenceToken;
  pressFeedback();
  setPhase("responding", "kettle");
  stage.classList.add("is-sequencing");
  showStory("水正在热着。", { persistent: false });
  audio.kettleAnswer().catch(() => {});
  announce("蒸汽升起来，壶盖轻轻回应。没有失败，也不用赶。");

  later(() => {
    if (token !== state.sequenceToken) return;
    setPhase("responding", "cat");
    cupHotspot.disabled = false;
    audio.cupTap().catch(() => {});
    announce("猫靠近了一点，轻轻碰到倒扣的备用杯。你可以轻碰杯子，也可以继续坐着。");
  }, 1180);

  later(() => {
    if (token !== state.sequenceToken) return;
    rightCup(token);
  }, 5180);
}

function resetPrototype() {
  state.sequenceToken += 1;
  clearSequenceTimers();
  state.completed = false;
  cupHotspot.disabled = true;
  stage.classList.remove("is-sequencing", "is-replaying");
  storyCopy.classList.remove("is-visible");
  storyLine.textContent = "";
  kettleHotspot.setAttribute("aria-label", "轻轻碰一下水壶，听壶盖回应");
  setPhase("waiting", "idle");
  scheduleIdleWhisper();
  announce("样片已回到安静初态。");
}

function scheduleIdleWhisper() {
  window.clearTimeout(state.hintTimer);
  state.hintTimer = window.setTimeout(() => {
    if (state.phase !== "waiting") return;
    showStory("壶里的水，正轻轻响着。", { persistent: false });
  }, 10000);
}

kettleHotspot.addEventListener("pointerdown", pressFeedback, { passive: true });
kettleHotspot.addEventListener("click", runMainSequence);
cupHotspot.addEventListener("click", () => {
  if (state.phase !== "responding" || state.beat !== "cat") return;
  clearSequenceTimers();
  rightCup();
});

soundToggle.addEventListener("click", async () => {
  state.soundEnabled = !state.soundEnabled;
  refreshSoundButton();
  if (state.soundEnabled) {
    await audio.resume().catch(() => null);
    announce("样片声音已打开。声音只在触碰水壶时出现。");
  } else {
    announce("样片声音已关闭。画面仍会完整呈现互动。");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" || event.key.startsWith("Arrow")) {
    document.body.classList.add("using-keyboard");
  }
  if (event.key.toLowerCase() === "m") soundToggle.click();
  if (event.key.toLowerCase() === "r") resetPrototype();
});

document.addEventListener(
  "pointerdown",
  () => {
    document.body.classList.remove("using-keyboard");
  },
  { capture: true, passive: true },
);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) audio.suspend();
});

reducedMedia.addEventListener?.("change", (event) => {
  if (query.get("reduced") !== null) return;
  state.reducedMotion = event.matches;
  applyReducedMotion();
});

applyReducedMotion();
refreshSoundButton();
scheduleIdleWhisper();

window.__INDOOR_N01_PROTOTYPE__ = Object.freeze({
  getState: () => ({
    phase: state.phase,
    beat: state.beat,
    completed: state.completed,
    reducedMotion: state.reducedMotion,
    soundEnabled: state.soundEnabled,
  }),
  run: runMainSequence,
  reset: resetPrototype,
});
