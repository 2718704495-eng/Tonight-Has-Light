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
} from "cc";
import type { UserSettings } from "../domain/contracts.ts";
import type { AppFlowState } from "../core/app-flow.ts";
import {
  deriveFormalEndingUiModel,
  type FormalEndingUiMode,
  type FormalEndingUiModel,
  type FormalEndingUiSurface,
} from "../core/formal-ending-ui.ts";
import type { IndoorN01SemanticAction } from "../core/indoor-n01-actions.ts";
import type { NightSessionState } from "../core/night-state-machine.ts";

const { ccclass } = _decorator;

const WALL_NOTE_PATH = "formal-ending-ui-v1/wall-note/spriteFrame";
const TABLE_PAPER_PATH = "formal-ending-ui-v1/table-paper/spriteFrame";
const ACTION_PAPER_PATH = "formal-ending-ui-v1/action-paper/spriteFrame";
const NOTE_PEG_PATH = "formal-ending-ui-v1/note-peg/spriteFrame";
const SURFACE_RULE_PATH = "formal-ending-ui-v1/surface-rule/spriteFrame";
const FRAME_PATHS = [
  WALL_NOTE_PATH,
  TABLE_PAPER_PATH,
  ACTION_PAPER_PATH,
  NOTE_PEG_PATH,
  SURFACE_RULE_PATH,
] as const;

const INK = new Color(59, 36, 24, 255);
const ACTION_REST_TINT = new Color(255, 255, 255, 255);
const ACTION_PRESSED_TINT = new Color(238, 220, 190, 255);

interface FormalEndingUiBridge {
  getSession(): NightSessionState;
  getAppFlow(): AppFlowState;
  getSettings(): UserSettings;
  performAction(action: IndoorN01SemanticAction): boolean;
}

interface FormalEndingUiFrames {
  readonly wallNote: SpriteFrame;
  readonly tablePaper: SpriteFrame;
  readonly actionPaper: SpriteFrame;
  readonly notePeg: SpriteFrame;
  readonly surfaceRule: SpriteFrame;
}

interface FormalEndingActionSlot {
  readonly node: Node;
  readonly transform: UITransform;
  readonly sprite: Sprite;
  readonly button: Button;
  readonly labelTransform: UITransform;
  readonly label: Label;
  semanticAction: IndoorN01SemanticAction | null;
  locked: boolean;
}

export interface FormalEndingUiDebugSnapshot {
  readonly visible: boolean;
  readonly mode: FormalEndingUiMode;
  readonly surface: FormalEndingUiSurface | null;
  readonly largeText: boolean;
  readonly reducedMotion: boolean;
  readonly transformDistancePx: 0;
  readonly opacityDurationMs: number;
  readonly actionTargetSize: readonly [number, number];
  readonly actionGapPx: number;
  readonly usesGraphics: false;
}

function loadFrame(path: string): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    resources.load(path, SpriteFrame, (error, frame) => {
      if (error || !frame) reject(error ?? new Error(`Missing ending UI frame: ${path}`));
      else resolve(frame);
    });
  });
}

@ccclass("TonightHasLightFormalEndingUi")
export class TonightHasLightFormalEndingUi extends Component {
  private bridge: FormalEndingUiBridge | null = null;
  private root: Node | null = null;
  private rootOpacity: UIOpacity | null = null;
  private panelNode: Node | null = null;
  private panelTransform: UITransform | null = null;
  private panelSprite: Sprite | null = null;
  private pegNode: Node | null = null;
  private pegSprite: Sprite | null = null;
  private ruleNode: Node | null = null;
  private ruleSprite: Sprite | null = null;
  private copyNode: Node | null = null;
  private copyTransform: UITransform | null = null;
  private copyLabel: Label | null = null;
  private actions: FormalEndingActionSlot[] = [];
  private frames: FormalEndingUiFrames | null = null;
  private loadedFramePaths: string[] = [];
  private currentModel: FormalEndingUiModel | null = null;
  private renderGeneration = 0;
  private destroyed = false;

  public async initialize(bridge: FormalEndingUiBridge): Promise<void> {
    this.bridge = bridge;
    try {
      const loaded: SpriteFrame[] = [];
      for (const path of FRAME_PATHS) {
        const frame = await loadFrame(path);
        loaded.push(frame);
        this.loadedFramePaths.push(path);
      }
      if (this.destroyed || !this.isValid) throw new Error("Ending UI was cancelled while loading");
      const [wallNote, tablePaper, actionPaper, notePeg, surfaceRule] = loaded;
      if (!wallNote || !tablePaper || !actionPaper || !notePeg || !surfaceRule) {
        throw new Error("Ending UI asset set is incomplete");
      }
      this.frames = { wallNote, tablePaper, actionPaper, notePeg, surfaceRule };
      this.buildPersistentSurface(this.frames);
      this.refresh();
    } catch (error) {
      this.releaseFrames();
      throw error;
    }
  }

  public refresh(): boolean {
    const bridge = this.bridge;
    if (!bridge || !this.root || !this.rootOpacity || !this.frames) return false;
    const settings = bridge.getSettings();
    const model = deriveFormalEndingUiModel(
      bridge.getSession(),
      bridge.getAppFlow(),
      settings,
    );
    const previous = this.currentModel;
    if (previous?.mode !== model.mode) {
      for (const slot of this.actions) slot.locked = false;
    }
    this.currentModel = model;

    if (!model.visible) {
      this.hide(model.motion.opacityDurationMs);
      return false;
    }

    const changed = !previous?.visible
      || previous.mode !== model.mode
      || previous.surface !== model.surface
      || previous.typography.scale !== model.typography.scale;
    this.renderVisibleModel(model);
    if (changed) this.show(model.motion.opacityDurationMs);
    return true;
  }

  public getDebugSnapshot(): FormalEndingUiDebugSnapshot {
    const model = this.currentModel;
    const first = this.actions[0]?.transform.contentSize;
    const settings = this.bridge?.getSettings();
    return {
      visible: model?.visible ?? false,
      mode: model?.mode ?? "hidden",
      surface: model?.visible ? model.surface : null,
      largeText: settings?.largeText ?? false,
      reducedMotion: settings?.reducedMotion ?? false,
      transformDistancePx: 0,
      opacityDurationMs: model?.motion.opacityDurationMs ?? 0,
      actionTargetSize: [first?.width ?? 0, first?.height ?? 0],
      actionGapPx: 12,
      usesGraphics: false,
    };
  }

  protected onDestroy(): void {
    this.destroyed = true;
    this.renderGeneration += 1;
    this.unscheduleAllCallbacks();
    const ownerNodeStillAlive = isValid(this.node, true);
    const rootStillAlive = this.root ? isValid(this.root, true) : false;
    if (this.rootOpacity && isValid(this.rootOpacity, true)) {
      Tween.stopAllByTarget(this.rootOpacity);
    }
    // When the room root is already being destroyed, Cocos owns the recursive
    // child cleanup. Touching those children here would destroy them twice and
    // leave Node's event processor null during the same frame.
    if (ownerNodeStillAlive && rootStillAlive) {
      for (const slot of this.actions) {
        if (isValid(slot.node, true)) {
          slot.node.off(Node.EventType.TOUCH_START);
          slot.node.off(Node.EventType.TOUCH_END);
          slot.node.off(Node.EventType.TOUCH_CANCEL);
        }
        if (isValid(slot.sprite, true)) slot.sprite.spriteFrame = null;
      }
      if (this.panelSprite && isValid(this.panelSprite, true)) this.panelSprite.spriteFrame = null;
      if (this.pegSprite && isValid(this.pegSprite, true)) this.pegSprite.spriteFrame = null;
      if (this.ruleSprite && isValid(this.ruleSprite, true)) this.ruleSprite.spriteFrame = null;
      this.root?.destroy();
    }
    this.root = null;
    this.bridge = null;
    this.frames = null;
    this.actions = [];
    this.releaseFrames();
  }

  private buildPersistentSurface(frames: FormalEndingUiFrames): void {
    const root = new Node("FormalEndingUiV1A");
    root.layer = Layers.Enum.UI_2D;
    root.active = false;
    const rootTransform = root.addComponent(UITransform);
    rootTransform.setContentSize(390, 844);
    rootTransform.setAnchorPoint(0.5, 0.5);
    const rootOpacity = root.addComponent(UIOpacity);
    rootOpacity.opacity = 0;
    this.node.addChild(root);

    const panel = this.makeSpriteNode("WarmPaperSurface", frames.wallNote, root);
    panel.node.addComponent(BlockInputEvents);
    const peg = this.makeSpriteNode("WarmPaperNotePeg", frames.notePeg, root);
    const rule = this.makeSpriteNode("WarmPaperRule", frames.surfaceRule, root);

    const copyNode = new Node("EndingCopy");
    copyNode.layer = Layers.Enum.UI_2D;
    root.addChild(copyNode);
    const copyTransform = copyNode.addComponent(UITransform);
    copyTransform.setAnchorPoint(0.5, 0.5);
    const copyLabel = copyNode.addComponent(Label);
    copyLabel.color = INK;
    copyLabel.horizontalAlign = HorizontalTextAlignment.CENTER;
    copyLabel.verticalAlign = VerticalTextAlignment.CENTER;
    copyLabel.enableWrapText = true;
    copyLabel.overflow = Label.Overflow.CLAMP;

    this.root = root;
    this.rootOpacity = rootOpacity;
    this.panelNode = panel.node;
    this.panelTransform = panel.transform;
    this.panelSprite = panel.sprite;
    this.pegNode = peg.node;
    this.pegSprite = peg.sprite;
    this.ruleNode = rule.node;
    this.ruleSprite = rule.sprite;
    this.copyNode = copyNode;
    this.copyTransform = copyTransform;
    this.copyLabel = copyLabel;
    this.actions = [0, 1].map((index) => this.buildAction(root, frames.actionPaper, index));
  }

  private buildAction(parent: Node, frame: SpriteFrame, index: number): FormalEndingActionSlot {
    const action = this.makeSpriteNode(`EndingAction${index + 1}`, frame, parent);
    const button = action.node.addComponent(Button);
    button.transition = Button.Transition.NONE;

    const labelNode = new Node(`EndingAction${index + 1}Label`);
    labelNode.layer = Layers.Enum.UI_2D;
    action.node.addChild(labelNode);
    const labelTransform = labelNode.addComponent(UITransform);
    labelTransform.setAnchorPoint(0.5, 0.5);
    const label = labelNode.addComponent(Label);
    label.color = INK;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.enableWrapText = true;
    label.overflow = Label.Overflow.CLAMP;

    const slot: FormalEndingActionSlot = {
      node: action.node,
      transform: action.transform,
      sprite: action.sprite,
      button,
      labelTransform,
      label,
      semanticAction: null,
      locked: false,
    };
    action.node.on(Node.EventType.TOUCH_START, () => this.pressAction(slot), this);
    action.node.on(Node.EventType.TOUCH_CANCEL, () => this.releaseAction(slot), this);
    action.node.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
      const inside = this.isTouchInside(action.node, event);
      this.releaseAction(slot);
      if (inside) this.activateAction(slot);
    }, this);
    return slot;
  }

  private renderVisibleModel(model: Extract<FormalEndingUiModel, { readonly visible: true }>): void {
    if (
      !this.frames
      || !this.panelNode
      || !this.panelTransform
      || !this.panelSprite
      || !this.pegNode
      || !this.ruleNode
      || !this.copyNode
      || !this.copyTransform
      || !this.copyLabel
    ) return;

    const table = model.surface === "table-paper";
    const panelWidth = table ? 362 : 230;
    const panelHeight = table ? 236 : 238;
    const panelX = table ? 0 : 63;
    const panelY = table ? -282 : 89;
    const actionWidth = table ? 326 : 194;
    const actionHeight = model.typography.scale === 1.2 ? 52 : 48;
    const firstActionY = table ? panelY - 28 : panelY - 24;
    const secondActionY = table ? panelY - 92 : panelY - 84;
    const titleWidth = table ? 326 : 194;
    const titleHeight = table ? 66 : 70;
    const titleY = table ? panelY + 54 : panelY + 53;

    this.panelNode.setPosition(panelX, panelY);
    this.panelTransform.setContentSize(panelWidth, panelHeight);
    this.panelSprite.spriteFrame = table ? this.frames.tablePaper : this.frames.wallNote;
    this.panelSprite.sizeMode = Sprite.SizeMode.CUSTOM;
    this.pegNode.active = !table;
    this.pegNode.setPosition(panelX, panelY + panelHeight / 2 - 1);
    this.pegNode.getComponent(UITransform)?.setContentSize(20, 20);
    this.ruleNode.setPosition(panelX, table ? panelY + 15 : panelY + 12);
    this.ruleNode.getComponent(UITransform)?.setContentSize(42, 2);

    this.copyNode.setPosition(panelX, titleY);
    this.copyTransform.setContentSize(titleWidth, titleHeight);
    this.copyLabel.string = model.message;
    const baseCopyFontSize = table ? 21 : 20;
    const baseCopyLineHeight = table ? 30 : 31;
    this.copyLabel.fontSize = Math.round(baseCopyFontSize * model.typography.scale);
    this.copyLabel.lineHeight = Math.round(baseCopyLineHeight * model.typography.scale);

    const positions = [firstActionY, secondActionY] as const;
    for (let index = 0; index < this.actions.length; index += 1) {
      const slot = this.actions[index];
      const actionModel = model.actions[index];
      if (!slot || !actionModel) continue;
      slot.node.setPosition(panelX, positions[index] ?? secondActionY);
      slot.transform.setContentSize(actionWidth, actionHeight);
      slot.labelTransform.setContentSize(actionWidth - 18, actionHeight);
      slot.label.string = actionModel.label;
      slot.label.fontSize = model.typography.scale === 1.2 ? 18 : 15;
      slot.label.lineHeight = model.typography.scale === 1.2 ? 24 : 21;
      slot.semanticAction = actionModel.semanticAction;
      this.applyActionState(slot);
    }
  }

  private show(durationMs: number): void {
    if (!this.root || !this.rootOpacity) return;
    const generation = ++this.renderGeneration;
    this.root.active = true;
    Tween.stopAllByTarget(this.rootOpacity);
    if (durationMs <= 0) {
      this.rootOpacity.opacity = 255;
      return;
    }
    this.rootOpacity.opacity = 0;
    tween(this.rootOpacity)
      .to(durationMs / 1_000, { opacity: 255 })
      .call(() => {
        if (generation === this.renderGeneration && this.rootOpacity) this.rootOpacity.opacity = 255;
      })
      .start();
  }

  private hide(durationMs: number): void {
    if (!this.root || !this.rootOpacity || !this.root.active) return;
    const generation = ++this.renderGeneration;
    Tween.stopAllByTarget(this.rootOpacity);
    if (durationMs <= 0) {
      this.rootOpacity.opacity = 0;
      this.root.active = false;
      return;
    }
    tween(this.rootOpacity)
      .to(durationMs / 1_000, { opacity: 0 })
      .call(() => {
        if (generation === this.renderGeneration && this.root) this.root.active = false;
      })
      .start();
  }

  private pressAction(slot: FormalEndingActionSlot): void {
    if (slot.locked || !slot.button.interactable) return;
    slot.sprite.color = ACTION_PRESSED_TINT;
  }

  private releaseAction(slot: FormalEndingActionSlot): void {
    slot.sprite.color = ACTION_REST_TINT;
  }

  private activateAction(slot: FormalEndingActionSlot): void {
    const bridge = this.bridge;
    const action = slot.semanticAction;
    if (!bridge || !action || slot.locked || !slot.button.interactable) return;
    const accepted = bridge.performAction(action);
    if (this.destroyed || !this.isValid) return;
    if (accepted && ["request-wechat-share", "retry-wechat-share"].includes(action)) {
      slot.locked = true;
      this.applyActionState(slot);
    }
    this.refresh();
  }

  private applyActionState(slot: FormalEndingActionSlot): void {
    slot.button.interactable = !slot.locked;
    slot.sprite.color = slot.locked ? ACTION_PRESSED_TINT : ACTION_REST_TINT;
  }

  private isTouchInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const location = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    const size = transform.contentSize;
    return Math.abs(local.x) <= size.width / 2 && Math.abs(local.y) <= size.height / 2;
  }

  private makeSpriteNode(
    name: string,
    frame: SpriteFrame,
    parent: Node,
  ): { readonly node: Node; readonly transform: UITransform; readonly sprite: Sprite } {
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

  private releaseFrames(): void {
    for (const path of this.loadedFramePaths.splice(0)) resources.release(path, SpriteFrame);
  }
}
