const APPROVED_ROOM_REFERENCE =
  "../formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png";

const STATE_CONTENT = {
  "a-ending": {
    layout: "a",
    copy: "水热了。你也先缓一会儿。",
    actions: ["再坐一会儿", "今晚到这里"],
  },
  "a-summary": {
    layout: "a",
    copy: "这一夜，先放在这里。",
    actions: ["给朋友留一盏灯", "回到夜风里"],
  },
  "b-ending": {
    layout: "b",
    copy: "水热了。你也先缓一会儿。",
    actions: ["再坐一会儿", "今晚到这里"],
  },
  "b-summary": {
    layout: "b",
    copy: "这一夜，先放在这里。",
    actions: ["给朋友留一盏灯", "回到夜风里"],
  },
  "b-large": {
    layout: "b",
    large: true,
    copy: "这一夜，先放在这里。",
    actions: ["给朋友留一盏灯", "回到夜风里"],
  },
  share: {
    layout: "b",
    compact: true,
    copy: "有人给你留了一盏灯",
    actions: ["发给朋友", "先不分享"],
  },
  failure: {
    layout: "b",
    compact: true,
    copy: "这次没有发出去。",
    actions: ["再试一次", "留在今晚"],
  },
};

function roomImage() {
  const image = document.createElement("img");
  image.className = "room-image";
  image.src = APPROVED_ROOM_REFERENCE;
  image.alt = "整屋明亮温暖、人物与普通家猫坐在已备好的晚饭旁，窗外是深蓝夜空";
  return image;
}

function actionButton(label) {
  const button = document.createElement("button");
  button.className = "action-button";
  button.type = "button";
  button.textContent = label;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", () => {
    button.dataset.pressed = "true";
    window.setTimeout(() => {
      delete button.dataset.pressed;
    }, 120);

    const feedback = document.querySelector("#preview-feedback");
    if (feedback) feedback.textContent = `设计预览：已触碰“${label}”，未触发游戏行为。`;
  });
  return button;
}

function endingSurface(state, options = {}) {
  const surface = document.createElement("section");
  const layoutClass = state.layout === "a" ? "layout-a" : "layout-b";
  surface.className = `ending-surface ${layoutClass}${state.large ? " layout-large" : ""}${
    options.micro ? " micro-surface" : ""
  }`;
  surface.setAttribute("aria-label", `${state.copy} 可选动作`);

  if (state.layout === "a") {
    const peg = document.createElement("span");
    peg.className = "note-peg";
    peg.setAttribute("aria-hidden", "true");
    surface.append(peg);
  }

  const copy = document.createElement("p");
  copy.className = "surface-copy";
  copy.textContent = state.copy;

  const rule = document.createElement("div");
  rule.className = "surface-rule";
  rule.setAttribute("aria-hidden", "true");

  const actions = document.createElement("div");
  actions.className = "action-row";
  state.actions.forEach((label) => actions.append(actionButton(label)));

  surface.append(copy, rule, actions);
  return surface;
}

function renderFullState(container, key) {
  const state = STATE_CONTENT[key];
  if (!state) return;
  container.replaceChildren(roomImage(), endingSurface(state));
  container.dataset.state = key;
}

function renderStrip(container, key) {
  const state = STATE_CONTENT[key];
  if (!state) return;
  container.replaceChildren(roomImage(), endingSurface(state, { micro: true }));
  container.dataset.state = key;
}

document.querySelectorAll("[data-demo]").forEach((container) => {
  renderFullState(container, container.dataset.demo);
});

document.querySelectorAll("[data-strip]").forEach((container) => {
  renderStrip(container, container.dataset.strip);
});

const params = new URLSearchParams(window.location.search);
const requestedView = params.get("view") || "board";
const isPreview = Object.hasOwn(STATE_CONTENT, requestedView);

if (isPreview) {
  const board = document.querySelector("#board");
  const preview = document.querySelector("#preview");
  const stage = document.querySelector("#preview-stage");
  board.hidden = true;
  preview.hidden = false;
  document.body.classList.add("preview-mode");
  if (params.get("clean") === "1") preview.classList.add("clean");
  renderFullState(stage, requestedView);
  document.title = `今夜有灯 · ${requestedView}`;
}
