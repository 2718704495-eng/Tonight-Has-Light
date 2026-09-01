const STORAGE_KEY = "tonight-lamp-save-v1";

export const NIGHT_DEFINITIONS = Object.freeze([
  {
    id: 1,
    title: "水快开了",
    coreRitual: "warm-kettle",
    bundle: "night-01-kettle",
    opening: "今晚不需要赶。",
    hint: "把暖光带到水壶边。轻触也可以。",
    ending: "水热了。\n你也先缓一会儿。",
    ambient: ["擦开窗雾", "碰一碰围巾"],
  },
  {
    id: 2,
    title: "被子里面",
    coreRitual: "tuck-blanket",
    bundle: "night-02-blanket",
    opening: "被子短了一点。",
    hint: "把毯子往中间挪一挪。轻触也可以。",
    ending: "外面很冷。\n这里够暖。",
    ambient: ["听一会儿风", "碰一碰围巾"],
  },
  {
    id: 3,
    title: "雾窗上的月亮",
    coreRitual: "clear-window",
    bundle: "night-03-window",
    opening: "窗外好像还亮着什么。",
    hint: "在雾气上轻轻擦一下。",
    ending: "雪下得很慢。\n我们也是。",
    ambient: ["看雪落下", "听水壶轻响"],
  },
  {
    id: 4,
    title: "一盏灯就够了",
    coreRitual: "dim-lights",
    bundle: "night-04-one-light",
    opening: "屋里好像亮得有点多。",
    hint: "把墙上的三盏小灯轻轻关掉。",
    ending: "这边，\n还留着一点位置。",
    ambient: ["整理杯垫", "碰一碰围巾"],
  },
  {
    id: 5,
    title: "晚一点回来的人",
    coreRitual: "open-door",
    bundle: "night-05-late-arrival",
    opening: "门外有很轻的脚步声。",
    hint: "替晚一点回来的人开门。",
    ending: "晚一点也没关系。\n灯还在。",
    ambient: ["把杯子推近一点", "听门外的雪"],
  },
]);

const defaultSettings = () => ({
  sound: true,
  reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  largeText: false,
});

const createDefaultSave = () => ({
  schemaVersion: 1,
  unlockedNight: 1,
  completedNightIds: [],
  currentNight: 1,
  lastSafeCheckpoint: "arrival",
  durationMinutes: 5,
  settings: defaultSettings(),
});

function readSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || parsed.schemaVersion !== 1) return createDefaultSave();

    const completedNightIds = Array.isArray(parsed.completedNightIds)
      ? parsed.completedNightIds.filter((id) => Number.isInteger(id) && id >= 1 && id <= 5)
      : [];
    const unlockedNight = Math.min(5, Math.max(1, Number(parsed.unlockedNight) || 1));
    const currentNight = Math.min(unlockedNight, Math.max(1, Number(parsed.currentNight) || 1));
    const durationMinutes = [3, 5, 8].includes(Number(parsed.durationMinutes))
      ? Number(parsed.durationMinutes)
      : 5;

    return {
      schemaVersion: 1,
      unlockedNight,
      completedNightIds: [...new Set(completedNightIds)].sort((a, b) => a - b),
      currentNight,
      lastSafeCheckpoint: typeof parsed.lastSafeCheckpoint === "string" ? parsed.lastSafeCheckpoint : "arrival",
      durationMinutes,
      settings: {
        ...defaultSettings(),
        ...(parsed.settings && typeof parsed.settings === "object" ? parsed.settings : {}),
      },
    };
  } catch {
    return createDefaultSave();
  }
}

let save = readSave();
let currentNight = save.currentNight;
let currentPhase = "arrival";
let sessionStartedAt = 0;
let autoEndingTimer = 0;
let clumsyTimer = 0;
let ignoreNextOrbClick = false;
let previousFocus = null;
let activeSheet = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const game = $("#game");
const nightTitle = $("#nightTitle");
const storyLine = $("#storyLine");
const actionHint = $("#actionHint");
const finishButton = $("#finishButton");
const durationSheet = $("#durationSheet");
const endingSheet = $("#endingSheet");
const settingsSheet = $("#settingsSheet");
const nightBookSheet = $("#nightBookSheet");
const shareSheet = $("#shareSheet");
const shareLanding = $("#shareLanding");
const pauseSheet = $("#pauseSheet");
const errorSheet = $("#errorSheet");
const liveRegion = $("#liveRegion");
const lightOrb = $("#lightOrb");
const kettle = $("#kettle");
const cup = $("#cup");
const blanket = $("#blanketInteraction");
const windowInteraction = $("#windowInteraction");
const scarfInteraction = $("#scarfInteraction");
const doorInteraction = $("#doorInteraction");
const endingTitle = $("#endingTitle");

class RoomAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.ambience = null;
    this.started = false;
    this.enabled = save.settings.sound;
  }

  async start() {
    if (!this.enabled) return;
    if (!this.context) this.createGraph();
    if (this.context.state === "suspended") await this.context.resume();
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0.13, now + 2.6);
    this.started = true;
  }

  createGraph() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.context.destination);

    const length = this.context.sampleRate * 4;
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const channel = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.985 + white * 0.015;
      channel[index] = last * 0.36;
    }

    const noise = this.context.createBufferSource();
    const noiseFilter = this.context.createBiquadFilter();
    const noiseGain = this.context.createGain();
    noise.buffer = buffer;
    noise.loop = true;
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 760;
    noiseGain.gain.value = 0.25;
    noise.connect(noiseFilter).connect(noiseGain).connect(this.master);
    noise.start();

    [110, 164.81, 220].forEach((frequency, index) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = index === 1 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 2 ? -7 : index * 3;
      gain.gain.value = [0.019, 0.012, 0.006][index];
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!this.context || !this.master) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(enabled && this.started ? 0.13 : 0, now + 0.45);
  }

  async resume() {
    if (!this.context || !this.enabled) return;
    await this.context.resume();
    this.setEnabled(true);
  }

  pause() {
    if (!this.context) return;
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.18);
    window.setTimeout(() => this.context?.suspend(), 220);
  }

  foley(type = "soft") {
    if (!this.context || !this.enabled || this.context.state !== "running") return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type === "wood" ? "triangle" : "sine";
    const frequencies = {
      soft: [246.94, 196],
      cup: [392, 293.66],
      glow: [329.63, 493.88],
      wood: [164.81, 123.47],
      cloth: [146.83, 130.81],
    };
    const [startFrequency, endFrequency] = frequencies[type] || frequencies.soft;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + 0.3);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(type === "cup" ? 0.075 : 0.045, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.45);
  }
}

const audio = new RoomAudio();

function writeSave() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    announce("本地进度暂时无法保存，本次体验仍可继续。");
  }
}

function setCheckpoint(checkpoint) {
  save.lastSafeCheckpoint = checkpoint;
  save.currentNight = currentNight;
  writeSave();
}

function announce(message) {
  liveRegion.textContent = "";
  window.requestAnimationFrame(() => {
    liveRegion.textContent = message;
  });
}

function toast(message) {
  const existing = game.querySelector(".toast");
  existing?.remove();
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  game.append(element);
  announce(message);
  window.setTimeout(() => element.remove(), 2700);
}

function setStory(line, hint = "") {
  storyLine.textContent = line;
  actionHint.textContent = hint;
}

function setPhase(phase) {
  currentPhase = phase;
  game.dataset.phase = phase;
  setCheckpoint(phase === "dragging" ? "core" : phase);
}

function getNight(id = currentNight) {
  return NIGHT_DEFINITIONS.find((night) => night.id === id) || NIGHT_DEFINITIONS[0];
}

function resetSceneClasses() {
  [
    "is-started",
    "is-warm",
    "cup-clumsy",
    "cup-fixed",
    "blanket-done",
    "window-cleared",
    "lights-done",
    "door-open",
    "is-complete",
    "is-settled",
  ].forEach((className) => game.classList.remove(className));
  windowInteraction.classList.remove("is-cleared");
  scarfInteraction.classList.remove("is-touched");
  lightOrb.style.transform = "";
  lightOrb.style.transition = "";
  lightOrb.style.left = "";
  lightOrb.style.top = "";
  lightOrb.style.bottom = "";
  $$(".small-light").forEach((light) => light.classList.add("is-on"));
  finishButton.hidden = true;
  clearTimeout(clumsyTimer);
  clearTimeout(autoEndingTimer);
}

function renderNight(id, { showDuration = true } = {}) {
  currentNight = Math.min(save.unlockedNight, Math.max(1, id));
  const night = getNight();
  resetSceneClasses();
  game.dataset.night = String(currentNight);
  nightTitle.textContent = `第${["一", "二", "三", "四", "五"][currentNight - 1]}夜 · ${night.title}`;
  setStory(night.opening, showDuration ? "选一个想停留的时间，我们就进去。" : night.hint);
  setPhase(showDuration ? "arrival" : "core");
  save.currentNight = currentNight;
  writeSave();
  updateInteractionAvailability();
  renderNightBook();
  if (showDuration) openSheet(durationSheet);
}

function updateInteractionAvailability() {
  const coreMap = {
    1: [lightOrb],
    2: [blanket],
    3: [windowInteraction],
    4: $$(".small-light"),
    5: [doorInteraction],
  };
  const allCore = [lightOrb, blanket, doorInteraction, ...$$(".small-light")];
  allCore.forEach((element) => {
    element.tabIndex = -1;
    if (element instanceof HTMLButtonElement) element.disabled = true;
  });
  cup.tabIndex = -1;
  cup.disabled = true;
  kettle.tabIndex = -1;
  kettle.disabled = true;
  windowInteraction.tabIndex = currentNight === 3 ? 0 : 0;
  scarfInteraction.tabIndex = 0;
  (coreMap[currentNight] || []).forEach((element) => {
    element.tabIndex = 0;
    if (element instanceof HTMLButtonElement) element.disabled = false;
  });
}

function getSheetFocusables(sheet) {
  return $$Within(sheet, 'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])').filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
  );
}

function $$Within(root, selector) {
  return root ? [...root.querySelectorAll(selector)] : [];
}

function activateSheet(sheet) {
  if (!sheet) return;
  if (activeSheet !== sheet) previousFocus = document.activeElement;
  [...game.children].forEach((child) => {
    child.toggleAttribute("inert", child !== sheet);
  });
  activeSheet = sheet;
  const [focusable] = getSheetFocusables(sheet);
  window.setTimeout(() => focusable?.focus(), 80);
}

function openSheet(sheet) {
  if (!sheet) return;
  sheet.hidden = false;
  sheet.classList.add("is-open");
  activateSheet(sheet);
}

function closeSheet(sheet) {
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  sheet.classList.remove("is-open");
  if (activeSheet === sheet) {
    [...game.children].forEach((child) => {
      child.removeAttribute("inert");
    });
    activeSheet = null;
  }
  if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) previousFocus.focus();
}

function applySettings() {
  game.classList.toggle("reduced-motion", Boolean(save.settings.reducedMotion));
  game.classList.toggle("large-text", Boolean(save.settings.largeText));
  $("#soundToggle").checked = Boolean(save.settings.sound);
  $("#motionToggle").checked = Boolean(save.settings.reducedMotion);
  $("#largeTextToggle").checked = Boolean(save.settings.largeText);
  audio.setEnabled(Boolean(save.settings.sound));
}

function startAudioWithFallback() {
  return audio.start().catch(() => {
    save.settings.sound = false;
    applySettings();
    writeSave();
  });
}

function enterRoom() {
  closeSheet(durationSheet);
  game.classList.add("is-started");
  setPhase("core");
  sessionStartedAt = Date.now();
  const night = getNight();
  setStory(night.opening, night.hint);
  void startAudioWithFallback();
  scheduleAutomaticEnding();
  announce(`进入第${currentNight}夜，${night.title}。${night.hint}`);
}

function scheduleAutomaticEnding() {
  clearTimeout(autoEndingTimer);
  const elapsed = Math.max(0, Date.now() - sessionStartedAt);
  const delay = Math.max(1_000, save.durationMinutes * 60_000 - elapsed);
  autoEndingTimer = window.setTimeout(() => {
    if (currentPhase === "complete" || currentPhase === "settled") showEnding();
  }, delay);
}

function animateOrbToKettle() {
  if (currentNight !== 1 || currentPhase !== "core") return;
  const orbRect = lightOrb.getBoundingClientRect();
  const kettleRect = kettle.getBoundingClientRect();
  const dx = kettleRect.left + kettleRect.width * 0.43 - (orbRect.left + orbRect.width / 2);
  const dy = kettleRect.top + kettleRect.height * 0.78 - (orbRect.top + orbRect.height / 2);
  lightOrb.style.transition = save.settings.reducedMotion ? "transform 0.18s ease" : "transform 0.72s cubic-bezier(0.2, 0.8, 0.2, 1)";
  lightOrb.style.transform = `translate(${dx}px, ${dy}px) scale(0.72)`;
  audio.foley("glow");
  window.setTimeout(onKettleWarmed, save.settings.reducedMotion ? 190 : 740);
}

function onKettleWarmed() {
  if (currentNight !== 1 || currentPhase !== "core") return;
  setPhase("clumsy");
  game.classList.add("is-warm");
  lightOrb.style.opacity = "0";
  setStory("暖光到了。水壶开始轻轻响。", "等一小会儿……");
  audio.foley("soft");
  clumsyTimer = window.setTimeout(() => {
    game.classList.add("cup-clumsy");
    cup.tabIndex = 0;
    cup.disabled = false;
    setStory("杯子到了。只是……杯口好像在下面。", "轻轻碰一下杯子。");
    announce("小住客把杯子放反了。轻触杯子帮一帮它。 ");
    audio.foley("wood");
  }, save.settings.reducedMotion ? 240 : 1_050);
}

function fixCup() {
  if (currentNight !== 1 || currentPhase !== "clumsy" || !game.classList.contains("cup-clumsy")) return;
  game.classList.remove("cup-clumsy");
  game.classList.add("cup-fixed");
  cup.tabIndex = -1;
  cup.disabled = true;
  audio.foley("cup");
  setStory("这次放对了。", "水汽正慢慢升起来。");
  window.setTimeout(() => completeNight(), save.settings.reducedMotion ? 260 : 1_050);
}

function completeNight() {
  if (currentPhase === "complete" || currentPhase === "settled") return;
  const night = getNight();
  setPhase("complete");
  game.classList.add("is-warm", "is-complete");
  if (!save.completedNightIds.includes(currentNight)) save.completedNightIds.push(currentNight);
  save.completedNightIds.sort((a, b) => a - b);
  save.unlockedNight = Math.min(5, Math.max(save.unlockedNight, currentNight + 1));
  writeSave();
  setStory(night.ending.replace("\n", " "), "想离开时，灯会安静地送你到门口。");
  renderNightBook();
  audio.foley("glow");
  window.setTimeout(() => {
    finishButton.hidden = false;
    announce(`${night.ending.replace("\n", "")} 可以再坐一会儿，也可以今晚到这里。`);
  }, save.settings.reducedMotion ? 180 : 1_350);
}

function showEnding() {
  if (currentPhase !== "complete" && currentPhase !== "settled") return;
  endingTitle.innerHTML = getNight().ending
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br />");
  openSheet(endingSheet);
}

function stayAWhile() {
  closeSheet(endingSheet);
  setPhase("settled");
  game.classList.add("is-settled");
  setStory("房间不会催你。", "准备好时，再说今晚到这里。");
  finishButton.hidden = false;
}

function closeNight() {
  closeSheet(endingSheet);
  setCheckpoint("closed");
  finishButton.hidden = true;
  setStory("今晚就到这里。", currentNight < 5 ? "下一夜已经放进夜晚册，没有人催你打开。" : "五个夜晚都在这里，想回来时再回来。");
  toast(currentNight < 5 ? `第 ${Math.min(5, currentNight + 1)} 夜已轻轻亮起` : "灯会在这里等你");
  window.setTimeout(() => openSheet(nightBookSheet), 850);
}

function finishBlanketNight() {
  if (currentNight !== 2 || currentPhase !== "core") return;
  game.classList.add("blanket-done", "is-warm");
  audio.foley("cloth");
  setStory("毯子短了一点，两位小住客往中间靠了靠。", "这样就都盖到了。");
  window.setTimeout(completeNight, save.settings.reducedMotion ? 220 : 1_050);
}

function finishWindowNight() {
  if (currentNight === 3 && currentPhase === "core") {
    game.classList.add("window-cleared", "is-warm");
    windowInteraction.classList.add("is-cleared");
    audio.foley("soft");
    setStory("雾气散开一点，月亮刚好露出来。", "它没有催你，只是在那里。");
    window.setTimeout(completeNight, save.settings.reducedMotion ? 220 : 1_000);
    return;
  }
  windowInteraction.classList.add("is-cleared");
  game.classList.add("window-cleared");
  audio.foley("soft");
  toast("月亮露出来一点");
}

function toggleSmallLight(light) {
  if (currentNight !== 4 || currentPhase !== "core" || !light.classList.contains("is-on")) return;
  light.classList.remove("is-on");
  audio.foley("soft");
  const remaining = $$(".small-light.is-on").length;
  if (remaining > 0) {
    setStory("屋里暗下来一点。", `还亮着 ${remaining} 盏小灯。`);
  } else {
    game.classList.add("lights-done", "is-warm");
    setStory("墙上的灯都歇下了。", "桌边这一盏，已经够了。");
    window.setTimeout(completeNight, save.settings.reducedMotion ? 220 : 900);
  }
}

function finishDoorNight() {
  const renderedNight = Number(game.dataset.night);
  const renderedPhase = game.dataset.phase;
  if (renderedNight !== 5 || renderedPhase !== "core" || game.classList.contains("door-open")) return;
  currentNight = renderedNight;
  currentPhase = renderedPhase;
  game.classList.add("door-open", "is-warm");
  audio.foley("wood");
  setStory("门开了。冷风先进来一点。", "然后，是晚一点回来的人。");
  window.setTimeout(completeNight, save.settings.reducedMotion ? 260 : 1_300);
}

function renderNightBook() {
  const list = $("#nightList");
  list.replaceChildren(
    ...NIGHT_DEFINITIONS.map((night) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const unlocked = night.id <= save.unlockedNight;
      const completed = save.completedNightIds.includes(night.id);
      button.className = "night-item";
      button.type = "button";
      button.disabled = !unlocked;
      button.dataset.nightId = String(night.id);
      button.innerHTML = `
        <span class="night-number">${String(night.id).padStart(2, "0")}</span>
        <span><strong>${escapeHtml(night.title)}</strong><small>${escapeHtml(night.ambient.join(" · "))}</small></span>
        <span class="night-status">${completed ? "坐过" : unlocked ? "可进入" : "未亮"}</span>
      `;
      button.addEventListener("click", () => {
        closeSheet(nightBookSheet);
        renderNight(night.id, { showDuration: true });
      });
      item.append(button);
      return item;
    }),
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetProgress() {
  save = createDefaultSave();
  currentNight = 1;
  applySettings();
  writeSave();
  closeSheet(settingsSheet);
  renderNight(1, { showDuration: true });
  toast("房间回到了第一个夜晚");
}

function makeTapOrDrag(element, target, onComplete) {
  let dragState = null;

  element.addEventListener("pointerdown", (event) => {
    if (currentPhase !== "core") return;
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    element.setPointerCapture(event.pointerId);
    element.classList.add("is-dragging");
  });

  element.addEventListener("pointermove", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    if (Math.hypot(dx, dy) > 5) dragState.moved = true;
    element.style.transition = "none";
    element.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  element.addEventListener("pointerup", (event) => {
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const moved = dragState.moved;
    const elementRect = element.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const distance = Math.hypot(
      elementRect.left + elementRect.width / 2 - (targetRect.left + targetRect.width / 2),
      elementRect.top + elementRect.height / 2 - (targetRect.top + targetRect.height / 2),
    );
    element.classList.remove("is-dragging");
    element.releasePointerCapture(event.pointerId);
    dragState = null;
    if (moved && distance < 104) {
      ignoreNextOrbClick = true;
      onComplete();
      window.setTimeout(() => {
        ignoreNextOrbClick = false;
      }, 100);
      return;
    }
    element.style.transition = save.settings.reducedMotion ? "transform 0.18s ease" : "transform 0.45s ease";
    element.style.transform = "";
  });
}

$$('[data-duration]').forEach((button) => {
  button.addEventListener("click", () => {
    save.durationMinutes = Number(button.dataset.duration);
    $$('[data-duration]').forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle("is-selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
    });
    writeSave();
    audio.foley("soft");
  });
});

$("#enterRoomButton").addEventListener("click", enterRoom);
$("#acceptShareButton").addEventListener("click", () => {
  closeSheet(shareLanding);
  openSheet(durationSheet);
});

lightOrb.addEventListener("click", () => {
  if (!ignoreNextOrbClick) animateOrbToKettle();
});
makeTapOrDrag(lightOrb, kettle, animateOrbToKettle);

blanket.addEventListener("click", finishBlanketNight);
makeTapOrDrag(blanket, $("#softCreature"), finishBlanketNight);
cup.addEventListener("click", fixCup);
windowInteraction.addEventListener("click", finishWindowNight);
doorInteraction.addEventListener("click", finishDoorNight);
document.addEventListener(
  "click",
  (event) => {
    const target = event.target instanceof Element ? event.target.closest("#doorInteraction") : null;
    if (target) finishDoorNight();
  },
  true,
);

scarfInteraction.addEventListener("click", () => {
  scarfInteraction.classList.toggle("is-touched");
  audio.foley("cloth");
  toast(scarfInteraction.classList.contains("is-touched") ? "围巾往下滑了一点" : "围巾又搭回去了");
});

$$('.small-light').forEach((light) => light.addEventListener("click", () => toggleSmallLight(light)));

finishButton.addEventListener("click", showEnding);
$("#stayButton").addEventListener("click", stayAWhile);
$("#closeNightButton").addEventListener("click", closeNight);
$("#shareButton").addEventListener("click", () => {
  closeSheet(endingSheet);
  openSheet(shareSheet);
});

$("#settingsButton").addEventListener("click", () => openSheet(settingsSheet));
$("#nightBookButton").addEventListener("click", () => openSheet(nightBookSheet));
$("#resetButton").addEventListener("click", resetProgress);

$$('[data-close]').forEach((button) => {
  button.addEventListener("click", () => closeSheet($(`#${button.dataset.close}`)));
});

$("#soundToggle").addEventListener("change", (event) => {
  save.settings.sound = event.target.checked;
  writeSave();
  audio.setEnabled(save.settings.sound);
  if (save.settings.sound) void startAudioWithFallback();
});

$("#motionToggle").addEventListener("change", (event) => {
  save.settings.reducedMotion = event.target.checked;
  writeSave();
  applySettings();
});

$("#largeTextToggle").addEventListener("change", (event) => {
  save.settings.largeText = event.target.checked;
  writeSave();
  applySettings();
});

$("#nativeShareButton").addEventListener("click", async () => {
  const shareData = {
    title: "有人给你留了一盏灯",
    text: "不用回复，也不用解释。进去坐一会儿就好。",
    url: `${location.origin}${location.pathname}?from=lamp`,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      toast("灯已经送出去了");
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
      toast("分享文字已经复制");
    } else {
      toast("当前环境暂不支持分享，灯仍留在这里");
    }
  } catch (error) {
    if (error?.name !== "AbortError") toast("这次没有分享成功，灯仍留在这里");
  }
});

$("#resumeButton").addEventListener("click", async () => {
  closeSheet(pauseSheet);
  await audio.resume();
  setStory(getNight().opening, getNight().hint);
  announce("继续今晚。进行到一半的动作已回到安全位置。");
});

$("#errorContinueButton").addEventListener("click", () => {
  closeSheet(errorSheet);
  save.settings.sound = false;
  save.settings.reducedMotion = true;
  applySettings();
  writeSave();
  openSheet(durationSheet);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && activeSheet) {
    const focusables = getSheetFocusables(activeSheet);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  if (event.key !== "Escape") return;
  const open = [shareSheet, settingsSheet, nightBookSheet, endingSheet].find((sheet) => !sheet.hidden);
  if (open) closeSheet(open);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    setCheckpoint(currentPhase === "dragging" ? "core" : currentPhase);
    audio.pause();
    return;
  }
  if (game.classList.contains("is-started") && currentPhase !== "arrival") {
    lightOrb.style.transform = "";
    openSheet(pauseSheet);
  }
});

window.addEventListener("pagehide", () => {
  setCheckpoint(currentPhase === "dragging" ? "core" : currentPhase);
});

function bootstrap() {
  applySettings();
  renderNightBook();
  renderNight(currentNight, { showDuration: true });
  durationSheet.hidden = false;
  $$('[data-duration]').forEach((button) => {
    const selected = Number(button.dataset.duration) === save.durationMinutes;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const params = new URLSearchParams(location.search);
  if (params.get("from") === "lamp") {
    durationSheet.hidden = true;
    shareLanding.hidden = false;
  }
  if (params.get("state") === "load-error") {
    durationSheet.hidden = true;
    errorSheet.hidden = false;
  }
  if (params.get("state") === "resume") {
    durationSheet.hidden = true;
    pauseSheet.hidden = false;
  }
  if (params.get("state") === "settings") {
    durationSheet.hidden = true;
    settingsSheet.hidden = false;
  }
  if (params.get("state") === "share-preview") {
    durationSheet.hidden = true;
    shareSheet.hidden = false;
  }

  const initialSheet = [
    shareLanding,
    errorSheet,
    pauseSheet,
    settingsSheet,
    shareSheet,
    endingSheet,
    durationSheet,
  ].find((sheet) => !sheet.hidden);
  activateSheet(initialSheet);

  window.__TONIGHT_LAMP__ = Object.freeze({
    nights: NIGHT_DEFINITIONS,
    getSave: () => structuredClone(save),
    openNight: (id) => renderNight(id, { showDuration: false }),
    completeNight,
    reset: resetProgress,
  });
}

bootstrap();
