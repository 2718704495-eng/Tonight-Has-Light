const APPROVED_ROOM_REFERENCE =
  "../formal-ui-v1-2/approvals/formal-ui-v1-2-a-user-approved-reference-2026-08-24.png";

function roomImage() {
  const image = document.createElement("img");
  image.className = "room-image";
  image.src = APPROVED_ROOM_REFERENCE;
  image.alt = "整屋明亮温暖，人物与普通家猫坐在已经准备好的晚饭旁，窗外是深蓝夜空";
  return image;
}

function feedback(label) {
  const target = document.querySelector("#preview-feedback");
  if (target) target.textContent = `设计预览：已触碰“${label}”，不会启动游戏状态。`;
}

function button(label, className, options = {}) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.setAttribute("aria-label", options.ariaLabel || label);
  if (options.pressed !== undefined) node.setAttribute("aria-pressed", String(options.pressed));
  if (options.html) node.innerHTML = options.html;
  else node.textContent = label;
  node.addEventListener("click", () => {
    if (className.includes("duration-choice")) {
      node.parentElement?.querySelectorAll(".duration-choice").forEach((choice) => {
        choice.setAttribute("aria-pressed", String(choice === node));
      });
      const surface = node.closest(".paper-surface");
      const action = surface?.querySelector(".paper-action");
      if (action) action.textContent = `就坐 ${label}`;
    }
    feedback(label);
  });
  return node;
}

function paperBase(className, label) {
  const surface = document.createElement("section");
  surface.className = `paper-surface ${className}`;
  surface.setAttribute("aria-label", label);
  return surface;
}

function durationSurface(className = "wall-paper") {
  const surface = paperBase(className, "选择今晚停留时间");
  const title = document.createElement("h2");
  title.className = "paper-title";
  title.textContent = "今晚想坐多久？";
  const copy = document.createElement("p");
  copy.className = "paper-copy";
  copy.textContent = "只是决定多久后提醒你。没有倒数，随时都可以停下。";
  const choices = document.createElement("div");
  choices.className = "duration-grid";
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-label", "停留时长");
  choices.append(
    button("3 分钟", "duration-choice", { pressed: false, html: "<span>3</span>分钟" }),
    button("5 分钟", "duration-choice", { pressed: true, html: "<span>5</span>分钟" }),
    button("8 分钟", "duration-choice", { pressed: false, html: "<span>8</span>分钟" }),
  );
  surface.append(
    title,
    copy,
    choices,
    button("就坐 5 分钟", "paper-action"),
    button("先回到夜风里", "paper-link"),
  );
  return surface;
}

function settingsTab() {
  return button("停一停", "settings-tab");
}

function settingsSurface() {
  const surface = paperBase("settings-paper", "设置与提前收尾");
  const title = document.createElement("h2");
  title.className = "paper-title";
  title.textContent = "停一停";
  const list = document.createElement("div");
  list.className = "settings-list";
  [
    ["声音", "进入"],
    ["减少动态", "关"],
    ["大字模式", "关"],
  ].forEach(([label, value]) => {
    const row = button(label, "setting-row", { ariaLabel: `${label}，${value}` });
    const name = document.createElement("span");
    name.textContent = label;
    const current = document.createElement("span");
    current.className = "setting-value";
    current.textContent = value;
    row.replaceChildren(name, current);
    list.append(row);
  });
  const ending = button("看看今晚的留笺", "setting-row ending-entry");
  list.append(ending);
  surface.append(title, list);
  return surface;
}

function tagAlternative() {
  const fragment = document.createDocumentFragment();
  const title = document.createElement("p");
  title.className = "tag-title";
  title.textContent = "今晚想坐多久？";
  const stack = document.createElement("div");
  stack.className = "tag-stack";
  ["3 分钟", "5 分钟", "8 分钟", "就坐 5 分钟"].forEach((label, index) => {
    stack.append(button(label, `tag-choice${index === 1 ? " selected" : ""}`));
  });
  fragment.append(title, stack);
  return fragment;
}

function drawerAlternative() {
  return durationSurface("drawer-paper");
}

function render(container, state) {
  const nodes = [roomImage()];
  if (state === "a-duration") nodes.push(durationSurface());
  else if (state === "a-ready") nodes.push(settingsTab());
  else if (state === "a-settings") nodes.push(settingsTab(), settingsSurface());
  else if (state === "b-tags") nodes.push(tagAlternative());
  else if (state === "c-drawer") nodes.push(drawerAlternative());
  else if (state === "large-duration") nodes.push(durationSurface("bottom-paper"));
  container.replaceChildren(...nodes);
  container.dataset.state = state;
}

document.querySelectorAll("[data-demo]").forEach((container) => render(container, container.dataset.demo));

const params = new URLSearchParams(window.location.search);
const state = params.get("view");
const allowed = new Set(["a-duration", "a-ready", "a-settings", "b-tags", "c-drawer", "large-duration"]);
if (state && allowed.has(state)) {
  const board = document.querySelector("#board");
  const preview = document.querySelector("#preview");
  const stage = document.querySelector("#preview-stage");
  board.hidden = true;
  preview.hidden = false;
  if (params.get("clean") === "1") preview.classList.add("clean");
  render(stage, state);
  document.title = `今夜有灯 · ${state}`;
}
