import {
  _decorator,
  BlockInputEvents,
  Button,
  Color,
  Component,
  EventTouch,
  HorizontalTextAlignment,
  isValid,
  Label,
  Layers,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  tween,
  Tween,
  UIOpacity,
  UITransform,
  Vec3,
  VerticalTextAlignment,
  view,
} from "cc";
import type { AppFlowCommand, AppFlowState } from "../core/app-flow.ts";
import {
  canPerformFormalSessionControlsAction,
  deriveFormalSessionControlsModel,
  FORMAL_SESSION_CONTROLS_DURATION_OPTIONS,
  FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS,
  resolveFormalSessionControlsTableBottom,
  type FormalSessionControlsAction,
  type FormalSessionControlsMode,
  type FormalSessionControlsModel,
  type FormalSessionControlsRow,
  type FormalSessionControlsSubpage,
  type FormalSessionControlsSurface,
} from "../core/formal-session-controls.ts";
import type { NightCommand, NightSessionState } from "../core/night-state-machine.ts";
import type { DurationMinutes, UserSettings } from "../domain/contracts.ts";

const { ccclass } = _decorator;

const WALL_NOTE_PATH = "formal-ending-ui-v1/wall-note/spriteFrame";
const TABLE_PAPER_PATH = "formal-ending-ui-v1/table-paper/spriteFrame";
const ACTION_PAPER_PATH = "formal-ending-ui-v1/action-paper/spriteFrame";
const NOTE_PEG_PATH = "formal-ending-ui-v1/note-peg/spriteFrame";
const SURFACE_RULE_PATH = "formal-ending-ui-v1/surface-rule/spriteFrame";
const SELECTION_RING_PATH = "formal-session-controls-v1/selection-ring/spriteFrame";
const FRAME_PATHS = [
  WALL_NOTE_PATH,
  TABLE_PAPER_PATH,
  ACTION_PAPER_PATH,
  NOTE_PEG_PATH,
  SURFACE_RULE_PATH,
  SELECTION_RING_PATH,
] as const;

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
const INK = new Color(59, 36, 24, 255);
const SOFT_INK = new Color(104, 68, 48, 255);
const ACTION_REST_TINT = new Color(255, 255, 255, 255);
const ACTION_PRESSED_TINT = new Color(238, 220, 190, 255);
const EMPHASIS_TINT = new Color(247, 224, 180, 255);

interface FormalSessionControlsBridge {
  getSession(): NightSessionState;
  getAppFlow(): AppFlowState;
  getSettings(): UserSettings;
  send(command: NightCommand): void;
  sendAppFlow(command: AppFlowCommand): void;
  updateSettings(settings: Readonly<Partial<UserSettings>>): UserSettings;
  openEndingNote(): boolean;
  returnToOutdoor(): void;
}

interface FormalSessionControlsFrames {
  readonly wallNote: SpriteFrame;
  readonly tablePaper: SpriteFrame;
  readonly actionPaper: SpriteFrame;
  readonly notePeg: SpriteFrame;
  readonly surfaceRule: SpriteFrame;
  readonly selectionRing: SpriteFrame;
}

interface SpriteNode {
  readonly node: Node;
  readonly transform: UITransform;
  readonly sprite: Sprite;
}

interface TextNode {
  readonly node: Node;
  readonly transform: UITransform;
  readonly label: Label;
}

interface ActionSlot extends SpriteNode {
  readonly button: Button;
  readonly hitTarget: Node;
  readonly hitTransform: UITransform;
  readonly primary: TextNode;
  readonly secondary: TextNode | null;
  action: FormalSessionControlsAction | null;
  duration: DurationMinutes | null;
  locked: boolean;
  emphasis: boolean;
}

interface DurationSlot extends ActionSlot {
  readonly selectionRing: Node;
}

export interface FormalSessionControlsDebugSnapshot {
  readonly visible: boolean;
  readonly mode: FormalSessionControlsMode;
  readonly surface: FormalSessionControlsSurface | null;
  readonly selectedDuration: DurationMinutes;
  readonly roomInputBlocked: boolean;
  readonly durationPromptRevealed: boolean;
  readonly largeText: boolean;
  readonly reducedMotion: boolean;
  readonly opacityDurationMs: number;
  readonly transformDistancePx: 0;
  readonly durationTargetSize: readonly [number, number];
  readonly durationHitTargetSize: readonly [number, number];
  readonly collapsedTabSize: readonly [number, number];
  readonly collapsedTabHitTargetSize: readonly [number, number];
  readonly actionGapPx: number;
  readonly usesGraphics: false;
}

function loadFrame(path: string): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    resources.load(path, SpriteFrame, (error, frame) => {
      if (error || !frame) reject(error ?? new Error(`Missing session controls frame: ${path}`));
      else resolve(frame);
    });
  });
}

@ccclass("TonightHasLightFormalSessionControls")
export class TonightHasLightFormalSessionControls extends Component {
  private bridge: FormalSessionControlsBridge | null = null;
  private frames: FormalSessionControlsFrames | null = null;
  private root: Node | null = null;
  private shield: Node | null = null;
  private panelGroup: Node | null = null;
  private panel: SpriteNode | null = null;
  private panelOpacity: UIOpacity | null = null;
  private peg: SpriteNode | null = null;
  private rule: SpriteNode | null = null;
  private title: TextNode | null = null;
  private body: TextNode | null = null;
  private durationSlots: DurationSlot[] = [];
  private confirmSlot: ActionSlot | null = null;
  private returnSlot: ActionSlot | null = null;
  private settingsSlots: ActionSlot[] = [];
  private collapsedTab: ActionSlot | null = null;
  private collapsedTabOpacity: UIOpacity | null = null;
  private selectedDuration: DurationMinutes = 5;
  private settingsSubpage: FormalSessionControlsSubpage = "main";
  private durationPromptRevealed = false;
  private activated = false;
  private destroyed = false;
  private renderGeneration = 0;
  private revealScheduled = false;
  private currentModel: FormalSessionControlsModel | null = null;
  private loadedFramePaths: string[] = [];

  public async initialize(bridge: FormalSessionControlsBridge): Promise<void> {
    this.bridge = bridge;
    const loaded: SpriteFrame[] = [];
    try {
      for (const path of FRAME_PATHS) {
        loaded.push(await loadFrame(path));
        this.loadedFramePaths.push(path);
      }
      if (this.destroyed || !this.isValid) {
        throw new Error("Session controls were cancelled while loading");
      }
      const [wallNote, tablePaper, actionPaper, notePeg, surfaceRule, selectionRing] = loaded;
      if (!wallNote || !tablePaper || !actionPaper || !notePeg || !surfaceRule || !selectionRing) {
        throw new Error("Session controls asset set is incomplete");
      }
      this.frames = { wallNote, tablePaper, actionPaper, notePeg, surfaceRule, selectionRing };
      this.buildPersistentSurface(this.frames);
    } catch (error) {
      this.releaseFrames();
      throw error;
    }
  }

  /** Called only when the fully loaded warm room is synchronously shown. */
  public activate(): void {
    this.activated = true;
    this.durationPromptRevealed = this.bridge?.getSession().phase !== "duration-selection";
    this.refresh();
    this.ensureDurationRevealScheduled();
  }

  public refresh(): boolean {
    const bridge = this.bridge;
    if (!bridge || !this.root || !this.activated) return false;
    const model = deriveFormalSessionControlsModel({
      session: bridge.getSession(),
      appFlow: bridge.getAppFlow(),
      settings: bridge.getSettings(),
      selectedDuration: this.selectedDuration,
      settingsSubpage: this.settingsSubpage,
    });
    this.currentModel = model;

    if (!model.visible) {
      this.hideEverything();
      return false;
    }

    this.root.active = true;
    if (model.mode === "duration" && !this.durationPromptRevealed) {
      this.showPreludeShield();
      this.ensureDurationRevealScheduled();
      return true;
    }

    if (model.mode === "collapsed") {
      this.renderCollapsed(model);
      return true;
    }

    this.renderPanel(model);
    return true;
  }

  public performAction(
    action: FormalSessionControlsAction,
    duration: DurationMinutes | null = null,
  ): boolean {
    const bridge = this.bridge;
    if (!bridge) return false;
    if (!canPerformFormalSessionControlsAction(
      this.currentModel,
      action,
      this.durationPromptRevealed,
    )) return false;

    switch (action) {
      case "select-duration":
        if (
          bridge.getSession().phase !== "duration-selection"
          || duration === null
          || !FORMAL_SESSION_CONTROLS_DURATION_OPTIONS.includes(duration)
        ) return false;
        this.selectedDuration = duration;
        this.refresh();
        return true;
      case "confirm-duration": {
        if (bridge.getSession().phase !== "duration-selection") return false;
        bridge.send({ type: "SELECT_DURATION", durationMinutes: this.selectedDuration });
        if (bridge.getSession().phase === "duration-selection") return false;
        this.refresh();
        return true;
      }
      case "return-to-outdoor":
        bridge.returnToOutdoor();
        return true;
      case "open-settings":
        this.settingsSubpage = "main";
        bridge.sendAppFlow({ type: "OPEN_SETTINGS" });
        this.refresh();
        return bridge.getAppFlow().overlay === "settings";
      case "close-settings":
        this.settingsSubpage = "main";
        bridge.sendAppFlow({ type: "CLOSE_SETTINGS" });
        this.refresh();
        return bridge.getAppFlow().overlay === "none";
      case "open-sound-settings":
        if (bridge.getAppFlow().overlay !== "settings") return false;
        this.settingsSubpage = "sound";
        this.refresh();
        return true;
      case "close-sound-settings":
        if (bridge.getAppFlow().overlay !== "settings") return false;
        this.settingsSubpage = "main";
        this.refresh();
        return true;
      case "toggle-ambient":
        bridge.updateSettings({ ambientEnabled: !bridge.getSettings().ambientEnabled });
        this.refresh();
        return true;
      case "toggle-music":
        bridge.updateSettings({ musicEnabled: !bridge.getSettings().musicEnabled });
        this.refresh();
        return true;
      case "toggle-feedback":
        bridge.updateSettings({ feedbackEnabled: !bridge.getSettings().feedbackEnabled });
        this.refresh();
        return true;
      case "toggle-reduced-motion":
        bridge.updateSettings({ reducedMotion: !bridge.getSettings().reducedMotion });
        this.refresh();
        return true;
      case "toggle-large-text":
        bridge.updateSettings({ largeText: !bridge.getSettings().largeText });
        this.refresh();
        return true;
      case "open-ending-note":
        if (bridge.getAppFlow().overlay !== "settings") return false;
        this.settingsSubpage = "main";
        bridge.sendAppFlow({ type: "CLOSE_SETTINGS" });
        if (bridge.getAppFlow().overlay !== "none") return false;
        return bridge.openEndingNote();
    }
  }

  public getDebugSnapshot(): FormalSessionControlsDebugSnapshot {
    const model = this.currentModel;
    const durationSize = this.durationSlots[0]?.transform.contentSize;
    const durationHitSize = this.durationSlots[0]?.hitTransform.contentSize;
    const tabSize = this.collapsedTab?.transform.contentSize;
    const tabHitSize = this.collapsedTab?.hitTransform.contentSize;
    const settings = this.bridge?.getSettings();
    return {
      visible: model?.visible ?? false,
      mode: model?.mode ?? "hidden",
      surface: model?.visible ? model.surface : null,
      selectedDuration: this.selectedDuration,
      roomInputBlocked: model?.roomInputBlocked ?? false,
      durationPromptRevealed: this.durationPromptRevealed,
      largeText: settings?.largeText ?? false,
      reducedMotion: settings?.reducedMotion ?? false,
      opacityDurationMs: model?.motion.opacityDurationMs ?? 0,
      transformDistancePx: 0,
      durationTargetSize: [durationSize?.width ?? 0, durationSize?.height ?? 0],
      durationHitTargetSize: [durationHitSize?.width ?? 0, durationHitSize?.height ?? 0],
      collapsedTabSize: [tabSize?.width ?? 0, tabSize?.height ?? 0],
      collapsedTabHitTargetSize: [tabHitSize?.width ?? 0, tabHitSize?.height ?? 0],
      actionGapPx: 8,
      usesGraphics: false,
    };
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.renderGeneration += 1;
    this.unscheduleAllCallbacks();
    if (this.panelOpacity && isValid(this.panelOpacity, true)) Tween.stopAllByTarget(this.panelOpacity);
    if (this.collapsedTabOpacity && isValid(this.collapsedTabOpacity, true)) {
      Tween.stopAllByTarget(this.collapsedTabOpacity);
    }
    const ownerAlive = isValid(this.node, true);
    const rootAlive = this.root ? isValid(this.root, true) : false;
    if (ownerAlive && rootAlive) {
      this.clearSpriteFrames();
      this.root?.destroy();
    }
    this.root = null;
    this.bridge = null;
    this.frames = null;
    this.durationSlots = [];
    this.settingsSlots = [];
    this.confirmSlot = null;
    this.returnSlot = null;
    this.collapsedTab = null;
    this.panelGroup = null;
    this.releaseFrames();
  }

  private buildPersistentSurface(frames: FormalSessionControlsFrames): void {
    const root = new Node("FormalSessionControlsV1A");
    root.layer = Layers.Enum.UI_2D;
    root.active = false;
    const transform = root.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    transform.setAnchorPoint(0.5, 0.5);
    this.node.addChild(root);

    const shield = new Node("SessionControlsRoomInputShield");
    shield.layer = Layers.Enum.UI_2D;
    shield.active = false;
    root.addChild(shield);
    const shieldTransform = shield.addComponent(UITransform);
    shieldTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    shieldTransform.setAnchorPoint(0.5, 0.5);
    shield.addComponent(BlockInputEvents);
    shield.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
      event.propagationStopped = true;
      if (this.currentModel?.mode === "settings" || this.currentModel?.mode === "sound-settings") {
        this.performAction("close-settings");
      }
    }, this);

    const panelGroup = new Node("SessionWarmPaperGroup");
    panelGroup.layer = Layers.Enum.UI_2D;
    panelGroup.active = false;
    root.addChild(panelGroup);
    const panelOpacity = panelGroup.addComponent(UIOpacity);
    panelOpacity.opacity = 0;

    const panel = this.makeSpriteNode("SessionWarmPaperSurface", frames.wallNote, panelGroup);
    panel.node.addComponent(BlockInputEvents);
    const peg = this.makeSpriteNode("SessionWarmPaperPeg", frames.notePeg, panelGroup);
    peg.node.active = false;
    const rule = this.makeSpriteNode("SessionWarmPaperRule", frames.surfaceRule, panelGroup);
    rule.node.active = false;
    const title = this.makeTextNode("SessionTitle", panelGroup);
    title.node.active = false;
    title.label.color = INK;
    title.label.horizontalAlign = HorizontalTextAlignment.LEFT;
    const body = this.makeTextNode("SessionBody", panelGroup);
    body.node.active = false;
    body.label.color = SOFT_INK;
    body.label.horizontalAlign = HorizontalTextAlignment.LEFT;

    this.root = root;
    this.shield = shield;
    this.panelGroup = panelGroup;
    this.panel = panel;
    this.panelOpacity = panelOpacity;
    this.peg = peg;
    this.rule = rule;
    this.title = title;
    this.body = body;

    this.durationSlots = FORMAL_SESSION_CONTROLS_DURATION_OPTIONS.map((minutes) =>
      this.buildDurationSlot(panelGroup, frames.actionPaper, frames.selectionRing, minutes));
    this.confirmSlot = this.buildActionSlot("SessionConfirmDuration", panelGroup, frames.actionPaper, true);
    this.returnSlot = this.buildActionSlot("SessionReturnToOutdoor", panelGroup, frames.actionPaper, true);
    this.settingsSlots = [0, 1, 2, 3].map((index) =>
      this.buildActionSlot(`SessionSettingsRow${index + 1}`, panelGroup, frames.actionPaper, true, true));
    this.collapsedTab = this.buildActionSlot("SessionCollapsedTab", root, frames.actionPaper, false);
    this.collapsedTabOpacity = this.collapsedTab.node.addComponent(UIOpacity);
    this.collapsedTabOpacity.opacity = 0;
  }

  private buildDurationSlot(
    parent: Node,
    frame: SpriteFrame,
    selectionRingFrame: SpriteFrame,
    minutes: DurationMinutes,
  ): DurationSlot {
    const base = this.buildActionSlot(`SessionDuration${minutes}`, parent, frame, true, true);
    base.duration = minutes;
    base.action = "select-duration";
    base.primary.label.string = String(minutes);
    base.secondary!.label.string = "分钟";
    const selectionRing = this.makeSelectionRing(
      base.node,
      selectionRingFrame,
      "DurationSelectionDoubleInkRing",
      44,
      40,
      -2,
    );
    base.hitTarget.setSiblingIndex(base.node.children.length - 1);
    return { ...base, selectionRing };
  }

  private makeSelectionRing(
    parent: Node,
    frame: SpriteFrame,
    name: string,
    width: number,
    height: number,
    angle: number,
  ): Node {
    const ring = this.makeSpriteNode(name, frame, parent);
    ring.node.active = false;
    ring.node.angle = angle;
    ring.transform.setContentSize(width, height);
    return ring.node;
  }

  private buildActionSlot(
    name: string,
    parent: Node,
    frame: SpriteFrame,
    wrap: boolean,
    secondary = false,
  ): ActionSlot {
    const spriteNode = this.makeSpriteNode(name, frame, parent);
    spriteNode.node.active = false;
    const button = spriteNode.node.addComponent(Button);
    button.transition = Button.Transition.NONE;
    const primary = this.makeTextNode(`${name}Primary`, spriteNode.node);
    primary.label.color = INK;
    primary.label.enableWrapText = wrap;
    const secondaryNode = secondary ? this.makeTextNode(`${name}Secondary`, spriteNode.node) : null;
    if (secondaryNode) {
      secondaryNode.label.color = SOFT_INK;
      secondaryNode.label.horizontalAlign = HorizontalTextAlignment.RIGHT;
    }
    const hitTarget = new Node(`${name}HitTarget`);
    hitTarget.layer = Layers.Enum.UI_2D;
    spriteNode.node.addChild(hitTarget);
    const hitTransform = hitTarget.addComponent(UITransform);
    hitTransform.setContentSize(52, 48);
    hitTransform.setAnchorPoint(0.5, 0.5);
    const slot: ActionSlot = {
      ...spriteNode,
      button,
      hitTarget,
      hitTransform,
      primary,
      secondary: secondaryNode,
      action: null,
      duration: null,
      locked: false,
      emphasis: false,
    };
    hitTarget.on(Node.EventType.TOUCH_START, (event: EventTouch) => {
      event.propagationStopped = true;
      this.pressAction(slot);
    }, this);
    hitTarget.on(Node.EventType.TOUCH_CANCEL, (event: EventTouch) => {
      event.propagationStopped = true;
      this.releaseAction(slot);
    }, this);
    hitTarget.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
      event.propagationStopped = true;
      const inside = this.isTouchInside(hitTarget, event);
      this.releaseAction(slot);
      if (inside && slot.action) this.performAction(slot.action, slot.duration);
    }, this);
    return slot;
  }

  private renderCollapsed(model: FormalSessionControlsModel): void {
    if (model.mode !== "collapsed" || !this.collapsedTab || !this.collapsedTabOpacity) return;
    const panelWasVisible = this.panelGroup?.active === true
      && (this.panelOpacity?.opacity ?? 0) > 0;
    this.setShield(panelWasVisible);
    this.hidePanel(model.motion.opacityDurationMs, panelWasVisible);
    this.hidePanelChildren();
    const tab = this.collapsedTab;
    tab.node.active = true;
    tab.node.setPosition(156, 274);
    tab.transform.setContentSize(48, 44);
    tab.hitTransform.setContentSize(52, 48);
    tab.primary.transform.setContentSize(44, 44);
    tab.primary.label.string = "停一停";
    tab.primary.label.fontSize = 12;
    tab.primary.label.lineHeight = 16;
    tab.action = "open-settings";
    tab.duration = null;
    this.fade(this.collapsedTabOpacity, 255, model.motion.opacityDurationMs);
  }

  private renderPanel(model: FormalSessionControlsModel): void {
    if (!model.visible || model.mode === "collapsed" || !model.surface) return;
    this.setShield(model.roomInputBlocked);
    this.hideCollapsedTab(model.motion.opacityDurationMs);
    this.hidePanelChildren();
    this.applyPanelLayout(model);
    if (model.mode === "duration") this.renderDuration(model);
    else this.renderSettings(model);
    this.showPanel(model.motion.opacityDurationMs);
  }

  private applyPanelLayout(model: FormalSessionControlsModel): void {
    if (!model.visible || !model.surface || !this.frames || !this.panel || !this.peg || !this.rule) return;
    const table = model.surface === "table-paper";
    const settingsRows = model.mode === "settings" || model.mode === "sound-settings"
      ? model.rows.length
      : 0;
    const panelWidth = table ? 362 : 186;
    const panelHeight = model.mode === "duration"
      ? table ? 264 : 242
      : table ? (settingsRows >= 4 ? 286 : 234) : (settingsRows >= 4 ? 262 : 210);
    const panelX = table ? 0 : 82;
    const visibleDesignHeight = view.getVisibleSize().height;
    const tableBottom = resolveFormalSessionControlsTableBottom(visibleDesignHeight);
    const panelTop = table ? tableBottom + panelHeight : 222;
    const panelY = table ? tableBottom + panelHeight / 2 : 422 - (panelTop + panelHeight / 2);
    this.panel.node.setPosition(panelX, panelY);
    this.panel.transform.setContentSize(panelWidth, panelHeight);
    this.panel.sprite.spriteFrame = table ? this.frames.tablePaper : this.frames.wallNote;
    this.panel.sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.peg.node.active = !table;
    this.peg.node.setPosition(panelX, panelY + panelHeight / 2 - 1);
    this.peg.transform.setContentSize(16, 16);
    this.rule.node.active = model.mode !== "duration";
    this.rule.node.setPosition(panelX, panelY + panelHeight / 2 - 47);
    this.rule.transform.setContentSize(42, 2);
  }

  private renderDuration(
    model: Extract<FormalSessionControlsModel, { readonly mode: "duration" }>,
  ): void {
    if (!this.panel || !this.title || !this.body || !this.confirmSlot || !this.returnSlot) return;
    const table = model.surface === "table-paper";
    const panelPosition = this.panel.node.position;
    const scale = model.typography.scale;
    const titleY = panelPosition.y + (table ? 105 : 91);
    const bodyY = panelPosition.y + (table ? 67 : 55);
    const choicesY = panelPosition.y + (table ? 19 : 13);
    const confirmY = panelPosition.y + (table ? -38 : -39);
    const returnY = panelPosition.y + (table ? -95 : -95);

    this.configureText(
      this.title,
      model.title,
      panelPosition.x,
      titleY,
      table ? 324 : 162,
      table ? 34 : 30,
      Math.round((table ? 18 : 17) * scale),
      Math.round((table ? 25 : 23) * scale),
      HorizontalTextAlignment.LEFT,
    );
    this.configureText(
      this.body,
      model.body,
      panelPosition.x,
      bodyY,
      table ? 324 : 162,
      table ? 49 : 43,
      Math.round(10.5 * scale),
      Math.round(15 * scale),
      HorizontalTextAlignment.LEFT,
    );

    const choiceWidth = table ? 96 : 50;
    const stride = table ? choiceWidth + 8 : 60;
    this.durationSlots.forEach((slot, index) => {
      slot.node.active = true;
      slot.node.setPosition(panelPosition.x + (index - 1) * stride, choicesY);
      slot.transform.setContentSize(choiceWidth, 48);
      slot.hitTransform.setContentSize(table ? choiceWidth : 52, 48);
      slot.primary.transform.setContentSize(choiceWidth, 28);
      slot.primary.node.setPosition(0, 7);
      slot.primary.label.fontSize = Math.round(17 * scale);
      slot.primary.label.lineHeight = Math.round(22 * scale);
      slot.secondary?.transform.setContentSize(choiceWidth, 17);
      slot.secondary?.node.setPosition(0, -12);
      if (slot.secondary) {
        slot.secondary.label.fontSize = Math.round(9.5 * scale);
        slot.secondary.label.lineHeight = Math.round(13 * scale);
        slot.secondary.label.horizontalAlign = HorizontalTextAlignment.CENTER;
      }
      const selected = slot.duration === model.selectedDuration;
      slot.selectionRing.active = selected;
      slot.selectionRing.setPosition(0, 3);
      this.applyActionState(slot, false);
    });

    this.configureAction(
      this.confirmSlot,
      model.confirmLabel,
      "confirm-duration",
      panelPosition.x,
      confirmY,
      table ? 326 : 162,
      44,
      Math.round(12 * scale),
    );
    this.configureAction(
      this.returnSlot,
      "先回到夜风里",
      "return-to-outdoor",
      panelPosition.x,
      returnY,
      table ? 326 : 162,
      44,
      Math.round(10.5 * scale),
      true,
    );
  }

  private renderSettings(
    model: Extract<FormalSessionControlsModel, { readonly mode: "settings" | "sound-settings" }>,
  ): void {
    if (!this.panel || !this.title) return;
    const table = model.surface === "table-paper";
    const panelPosition = this.panel.node.position;
    const panelHeight = this.panel.transform.contentSize.height;
    const scale = model.typography.scale;
    this.configureText(
      this.title,
      model.title,
      panelPosition.x,
      panelPosition.y + panelHeight / 2 - (table ? 31 : 28),
      table ? 326 : 162,
      34,
      Math.round(18 * scale),
      Math.round(24 * scale),
      HorizontalTextAlignment.LEFT,
    );
    const rowWidth = table ? 326 : 162;
    const rowHeight = model.typography.scale === 1.2 ? 48 : 44;
    const gap = 8;
    const rowStride = Math.max(56, rowHeight + gap);
    const firstY = panelPosition.y + panelHeight / 2 - (table ? 78 : 72);
    model.rows.forEach((row, index) => {
      const slot = this.settingsSlots[index];
      if (!slot) return;
      this.configureSettingsRow(
        slot,
        row,
        panelPosition.x,
        firstY - index * rowStride,
        rowWidth,
        rowHeight,
        scale,
      );
    });
  }

  private configureSettingsRow(
    slot: ActionSlot,
    row: FormalSessionControlsRow,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: 1 | 1.2,
  ): void {
    slot.node.active = true;
    slot.node.setPosition(x, y);
    slot.transform.setContentSize(width, height);
    slot.hitTransform.setContentSize(width, Math.max(48, height));
    slot.primary.node.setPosition(row.value ? -width * 0.18 : 0, 0);
    slot.primary.transform.setContentSize(row.value ? width * 0.56 : width - 18, height);
    slot.primary.label.string = row.label;
    slot.primary.label.fontSize = Math.round(11.5 * scale);
    slot.primary.label.lineHeight = Math.round(16 * scale);
    slot.primary.label.horizontalAlign = row.value
      ? HorizontalTextAlignment.LEFT
      : HorizontalTextAlignment.CENTER;
    if (slot.secondary) {
      slot.secondary.node.active = row.value.length > 0;
      slot.secondary.node.setPosition(width * 0.31, 0);
      slot.secondary.transform.setContentSize(width * 0.25, height);
      slot.secondary.label.string = row.value;
      slot.secondary.label.fontSize = Math.round(10.5 * scale);
      slot.secondary.label.lineHeight = Math.round(15 * scale);
    }
    slot.action = row.action;
    slot.duration = null;
    this.applyActionState(slot, row.emphasis);
  }

  private configureAction(
    slot: ActionSlot,
    label: string,
    action: FormalSessionControlsAction,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    transparent = false,
  ): void {
    slot.node.active = true;
    slot.node.setPosition(x, y);
    slot.transform.setContentSize(width, height);
    slot.hitTransform.setContentSize(width, Math.max(48, height));
    slot.primary.node.setPosition(0, 0);
    slot.primary.transform.setContentSize(width - 16, height);
    slot.primary.label.string = label;
    slot.primary.label.fontSize = fontSize;
    slot.primary.label.lineHeight = fontSize + 5;
    slot.primary.label.horizontalAlign = HorizontalTextAlignment.CENTER;
    slot.action = action;
    slot.duration = null;
    slot.sprite.color = transparent ? new Color(255, 255, 255, 0) : ACTION_REST_TINT;
  }

  private configureText(
    text: TextNode,
    value: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    lineHeight: number,
    align: HorizontalTextAlignment,
  ): void {
    text.node.active = true;
    text.node.setPosition(x, y);
    text.transform.setContentSize(width, height);
    text.label.string = value;
    text.label.fontSize = fontSize;
    text.label.lineHeight = lineHeight;
    text.label.horizontalAlign = align;
  }

  private showPreludeShield(): void {
    if (!this.root) return;
    this.root.active = true;
    this.setShield(true);
    this.hidePanelChildren();
    if (this.panelGroup) this.panelGroup.active = false;
    if (this.collapsedTab) this.collapsedTab.node.active = false;
  }

  private ensureDurationRevealScheduled(): void {
    if (
      this.revealScheduled
      || !this.activated
      || this.durationPromptRevealed
      || this.bridge?.getSession().phase !== "duration-selection"
    ) return;
    this.revealScheduled = true;
    this.scheduleOnce(() => {
      this.revealScheduled = false;
      if (this.destroyed || this.bridge?.getSession().phase !== "duration-selection") return;
      this.durationPromptRevealed = true;
      this.refresh();
    }, FORMAL_SESSION_CONTROLS_ROOM_REVEAL_DELAY_MS / 1_000);
  }

  private showPanel(durationMs: number): void {
    if (!this.panelGroup || !this.panelOpacity) return;
    const wasActive = this.panelGroup.active;
    this.panelGroup.active = true;
    if (!wasActive) {
      this.panelOpacity.opacity = 0;
      this.fade(this.panelOpacity, 255, durationMs);
    } else if (this.panelOpacity.opacity !== 255) {
      this.fade(this.panelOpacity, 255, durationMs);
    }
  }

  private hidePanel(durationMs: number, releaseShieldWhenHidden = false): void {
    if (!this.panelGroup || !this.panelOpacity || !this.panelGroup.active) return;
    const generation = ++this.renderGeneration;
    Tween.stopAllByTarget(this.panelOpacity);
    if (durationMs <= 0) {
      this.panelOpacity.opacity = 0;
      this.panelGroup.active = false;
      if (releaseShieldWhenHidden) this.setShield(false);
      return;
    }
    tween(this.panelOpacity)
      .to(durationMs / 1_000, { opacity: 0 })
      .call(() => {
        if (generation !== this.renderGeneration) return;
        if (this.panelGroup) this.panelGroup.active = false;
        if (releaseShieldWhenHidden) this.setShield(false);
      })
      .start();
  }

  private hideCollapsedTab(durationMs: number): void {
    if (!this.collapsedTab || !this.collapsedTabOpacity || !this.collapsedTab.node.active) return;
    const generation = ++this.renderGeneration;
    Tween.stopAllByTarget(this.collapsedTabOpacity);
    if (durationMs <= 0) {
      this.collapsedTabOpacity.opacity = 0;
      this.collapsedTab.node.active = false;
      return;
    }
    tween(this.collapsedTabOpacity)
      .to(durationMs / 1_000, { opacity: 0 })
      .call(() => {
        if (generation === this.renderGeneration && this.collapsedTab) {
          this.collapsedTab.node.active = false;
        }
      })
      .start();
  }

  private hidePanelChildren(): void {
    this.title && (this.title.node.active = false);
    this.body && (this.body.node.active = false);
    this.peg && (this.peg.node.active = false);
    this.rule && (this.rule.node.active = false);
    for (const slot of [
      ...this.durationSlots,
      this.confirmSlot,
      this.returnSlot,
      ...this.settingsSlots,
    ]) {
      if (slot) slot.node.active = false;
    }
  }

  private hideEverything(): void {
    if (!this.root) return;
    this.setShield(false);
    this.hidePanelChildren();
    this.renderGeneration += 1;
    if (this.panelOpacity) {
      Tween.stopAllByTarget(this.panelOpacity);
      this.panelOpacity.opacity = 0;
    }
    if (this.collapsedTabOpacity) {
      Tween.stopAllByTarget(this.collapsedTabOpacity);
      this.collapsedTabOpacity.opacity = 0;
    }
    if (this.panelGroup) this.panelGroup.active = false;
    if (this.collapsedTab) this.collapsedTab.node.active = false;
    this.root.active = false;
    if (this.bridge?.getAppFlow().overlay !== "settings") this.settingsSubpage = "main";
  }

  private setShield(active: boolean): void {
    if (this.shield) this.shield.active = active;
  }

  private pressAction(slot: ActionSlot): void {
    if (slot.locked || !slot.button.interactable) return;
    if (slot.action === "return-to-outdoor") {
      slot.sprite.color = new Color(238, 220, 190, 76);
      return;
    }
    slot.sprite.color = ACTION_PRESSED_TINT;
  }

  private releaseAction(slot: ActionSlot): void {
    if (slot.action === "return-to-outdoor") {
      slot.sprite.color = new Color(255, 255, 255, 0);
      return;
    }
    slot.sprite.color = slot.emphasis ? EMPHASIS_TINT : ACTION_REST_TINT;
  }

  private applyActionState(slot: ActionSlot, emphasis: boolean): void {
    slot.button.interactable = !slot.locked;
    slot.emphasis = emphasis;
    slot.sprite.color = emphasis ? EMPHASIS_TINT : ACTION_REST_TINT;
  }

  private isTouchInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const location = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    const size = transform.contentSize;
    return Math.abs(local.x) <= size.width / 2 && Math.abs(local.y) <= size.height / 2;
  }

  private fade(opacity: UIOpacity, target: number, durationMs: number): void {
    Tween.stopAllByTarget(opacity);
    if (durationMs <= 0) {
      opacity.opacity = target;
      return;
    }
    tween(opacity).to(durationMs / 1_000, { opacity: target }).start();
  }

  private makeSpriteNode(name: string, frame: SpriteFrame, parent: Node): SpriteNode {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    const transform = node.addComponent(UITransform);
    transform.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    sprite.spriteFrame = frame;
    return { node, transform, sprite };
  }

  private makeTextNode(name: string, parent: Node): TextNode {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    const transform = node.addComponent(UITransform);
    transform.setAnchorPoint(0.5, 0.5);
    const label = node.addComponent(Label);
    label.color = INK;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.enableWrapText = true;
    label.overflow = Label.Overflow.CLAMP;
    return { node, transform, label };
  }

  private clearSpriteFrames(): void {
    for (const spriteNode of [
      this.panel,
      this.peg,
      this.rule,
      ...this.durationSlots,
      this.confirmSlot,
      this.returnSlot,
      ...this.settingsSlots,
      this.collapsedTab,
    ]) {
      if (spriteNode?.sprite && isValid(spriteNode.sprite, true)) spriteNode.sprite.spriteFrame = null;
    }
    for (const slot of this.durationSlots) {
      const sprite = slot.selectionRing.getComponent(Sprite);
      if (sprite && isValid(sprite, true)) sprite.spriteFrame = null;
    }
  }

  private releaseFrames(): void {
    for (const path of this.loadedFramePaths.splice(0)) resources.release(path, SpriteFrame);
  }
}
