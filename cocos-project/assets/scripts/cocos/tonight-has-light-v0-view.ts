import {
  _decorator,
  Color,
  Component,
  EventTouch,
  GraphicsComponent as Graphics,
  HorizontalTextAlignment,
  Label,
  Node,
  UITransform,
  Vec3,
  VerticalTextAlignment,
} from "cc";
import type { DurationMinutes, UserSettings } from "../domain/contracts.ts";
import type {
  AppFlowCommand,
  AppFlowState,
  AppFlowTransition,
} from "../core/app-flow.ts";
import type { LaunchIntent } from "../core/sharing.ts";
import type {
  NightCommand,
  NightSessionState,
  NightTransition,
} from "../core/night-state-machine.ts";

const { ccclass } = _decorator;

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
const KETTLE_X = 105;
const KETTLE_Y = -76;
const LIGHT_RESTING_X = -30;
const LIGHT_RESTING_Y = -70;
const LIGHT_MIN_X = -155;
const LIGHT_MAX_X = 155;
const LIGHT_MIN_Y = -250;
const LIGHT_MAX_Y = 330;

const PALETTE = {
  night: new Color(14, 19, 32, 255),
  cream: new Color(244, 235, 213, 255),
  creamMuted: new Color(194, 195, 186, 255),
  ink: new Color(26, 29, 34, 255),
  amber: new Color(246, 193, 92, 255),
  wood: new Color(75, 59, 53, 255),
} as const;

export interface TonightHasLightV0Bridge {
  getSession(): NightSessionState;
  getSettings(): UserSettings;
  getLaunchIntent(): LaunchIntent;
  getAppFlow(): AppFlowState;
  send(command: NightCommand): NightTransition;
  sendAppFlow(command: AppFlowCommand): AppFlowTransition;
  updateSettings(settings: Readonly<Partial<UserSettings>>): UserSettings;
  requestWechatShare(): boolean;
  retryPersist(): boolean;
  returnToOutdoor(): void;
}

interface TextOptions {
  readonly size?: number;
  readonly color?: Readonly<Color>;
  readonly align?: HorizontalTextAlignment;
  readonly bold?: boolean;
  readonly wrap?: boolean;
}

interface MotionNode {
  readonly node: Node;
  readonly x: number;
  readonly y: number;
  readonly amplitude: number;
  readonly speed: number;
  readonly offset: number;
}

type Cleanup = () => void;

/**
 * Local-only functional shell for exercising the first-night state machine.
 *
 * Its Graphics room and legacy proxy characters are not approved visual
 * assets and must be replaced before any external preview. Behavioral
 * transitions remain delegated to NightStateMachine through the bridge.
 */
@ccclass("TonightHasLightV0View")
export class TonightHasLightV0View extends Component {
  private bridge: TonightHasLightV0Bridge | null = null;
  private screenLayer: Node | null = null;
  private cleanups: Cleanup[] = [];
  private motionNodes: MotionNode[] = [];
  private motionTime = 0;
  private tickAccumulator = 0;
  private renderGeneration = 0;
  private previousPhase: NightSessionState["phase"] | null = null;
  private microSceneStage: 0 | 1 = 0;
  private draggingLight = false;
  private selectedDuration: DurationMinutes = 5;
  private lightRestingPosition = new Vec3(LIGHT_RESTING_X, LIGHT_RESTING_Y, 0);
  private lightTapArmed = false;

  public initialize(bridge: TonightHasLightV0Bridge): void {
    this.bridge = bridge;
    this.render();
  }

  /** Reconcile presentation after lifecycle commands issued by the bootstrap. */
  public refresh(): void {
    this.render();
  }

  protected update(deltaTime: number): void {
    if (!this.bridge) return;
    this.tickAccumulator += Math.min(deltaTime, 0.1);
    if (this.tickAccumulator >= 1) {
      this.tickAccumulator = 0;
      const previous = this.bridge.getSession();
      const transition = this.bridge.send({ type: "TICK" });
      if (transition.state !== previous) {
        this.render();
        return;
      }
    }
    if (this.bridge.getSettings().reducedMotion || this.draggingLight) return;
    this.motionTime += Math.min(deltaTime, 0.05);
    for (const motion of this.motionNodes) {
      if (!motion.node.isValid) continue;
      motion.node.setPosition(
        motion.x,
        motion.y + Math.sin(this.motionTime * motion.speed + motion.offset) * motion.amplitude,
      );
    }
  }

  protected onDestroy(): void {
    this.unscheduleAllCallbacks();
    this.releaseScreen();
    this.bridge = null;
  }

  private render(): void {
    const bridge = this.bridge;
    if (!bridge) return;

    const session = bridge.getSession();
    if (session.phase !== this.previousPhase) {
      if (session.phase === "micro-scene") this.microSceneStage = 0;
      if (session.phase === "paused") {
        this.lightRestingPosition = new Vec3(LIGHT_RESTING_X, LIGHT_RESTING_Y, 0);
        this.lightTapArmed = false;
      }
      this.previousPhase = session.phase;
    }

    this.unscheduleAllCallbacks();
    this.releaseScreen();
    this.renderGeneration += 1;

    const layer = this.makeNode("TonightV0Screen", DESIGN_WIDTH, DESIGN_HEIGHT, this.node);
    this.screenLayer = layer;
    this.drawBackdrop(layer);

    switch (session.phase) {
      case "welcome":
        this.renderWelcome(layer);
        break;
      case "duration-selection":
        this.renderDurationSelection(layer);
        break;
      case "exploring":
      case "core-dragging":
        this.renderExploring(layer);
        break;
      case "micro-scene":
        this.renderMicroScene(layer);
        break;
      case "quiet-stay":
        this.renderQuietStay(layer);
        break;
      case "ending":
        this.renderEnding(layer);
        break;
      case "finished":
        this.renderFinished(layer);
        break;
      case "paused":
        this.renderPaused(layer);
        break;
      case "loading-error":
        this.renderLoadingError(layer, session.loadingErrorMessage);
        break;
    }

    if (session.phase !== "loading-error") {
      this.drawSettingsControls(layer);
    }
    this.renderAppOverlay(layer);
  }

  private releaseScreen(): void {
    if (this.draggingLight && this.bridge?.getSession().phase === "core-dragging") {
      this.bridge.send({ type: "DROP_CORE", targetHit: false });
    }
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    this.motionNodes = [];
    this.draggingLight = false;
    if (this.screenLayer?.isValid) this.screenLayer.destroy();
    this.screenLayer = null;
  }

  private dispatch(command: NightCommand): NightTransition | null {
    if (!this.bridge) return null;
    const transition = this.bridge.send(command);
    this.render();
    return transition;
  }

  private drawBackdrop(parent: Node): void {
    this.rect(parent, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE.night);
    this.rect(parent, 0, -307, DESIGN_WIDTH, 230, new Color(21, 27, 40, 255));
    this.rect(parent, -153, 0, 7, DESIGN_HEIGHT, new Color(5, 9, 18, 70));
    this.rect(parent, 166, 0, 2, DESIGN_HEIGHT, new Color(255, 255, 255, 13));
  }

  private renderWelcome(parent: Node): void {
    const sharedWelcome = this.bridge?.getLaunchIntent().kind === "shared-welcome";
    this.drawWindow(parent, -98, 112, true, 0.62);
    this.drawRoomShell(parent, 0.46);
    this.drawSoftCreature(parent, -90, -106, 0.82, false);
    this.drawLampSpirit(parent, 33, -77, 0.8, false);

    this.text(parent, sharedWelcome ? "有人给你留了一盏灯" : "今夜有灯", 0, 263, 322, 62, {
      size: this.fontSize(sharedWelcome ? 26 : 38),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(parent, "第一夜 · 水快开了", 0, 218, 272, 32, {
      size: this.fontSize(15),
      color: PALETTE.creamMuted,
    });
    this.text(
      parent,
      sharedWelcome ? "不用回复，也不用解释。\n先替自己坐一会儿。" : "门没有锁。\n进来以后，不用急着做什么。",
      0,
      151,
      280,
      72,
      { size: this.fontSize(17), color: PALETTE.cream, wrap: true },
    );

    this.button(parent, "进屋坐一会儿", 0, -328, 280, 58, true, () => {
      this.dispatch({ type: "OPEN_NIGHT" });
    });
    this.text(parent, "没有倒计时，也没有做错的事", 0, -376, 300, 26, {
      size: this.fontSize(13),
      color: PALETTE.creamMuted,
    });
  }

  private renderDurationSelection(parent: Node): void {
    this.drawWindow(parent, -105, 104, true, 0.48);
    this.drawRoomShell(parent, 0.32);
    this.panel(parent, 0, 17, 326, 402);

    this.text(parent, "今晚想坐多久？", 0, 129, 284, 42, {
      size: this.fontSize(26),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(parent, "只是决定收尾什么时候出现，\n随时都可以提前离开。", 0, 76, 276, 64, {
      size: this.fontSize(15),
      color: PALETTE.creamMuted,
      wrap: true,
    });

    const choices = [3, 5, 8] as const;
    choices.forEach((minutes, index) => {
      const selected = minutes === this.selectedDuration;
      const x = -100 + index * 100;
      this.button(
        parent,
        `${minutes} 分钟`,
        x,
        -20,
        88,
        64,
        selected,
        () => {
          this.selectedDuration = minutes;
          this.render();
        },
      );
      if (minutes === 5) {
        this.text(parent, "推荐", x, -68, 70, 22, {
          size: this.fontSize(12),
          color: PALETTE.amber,
        });
      }
    });

    this.text(parent, "先坐五分钟也很好。", 0, -126, 260, 34, {
      size: this.fontSize(16),
      color: PALETTE.cream,
    });
    this.button(parent, "就这样开始", 0, -181, 246, 52, true, () => {
      this.dispatch({ type: "SELECT_DURATION", durationMinutes: this.selectedDuration });
    });
  }

  private renderExploring(parent: Node): void {
    this.drawRoom(parent, { lampAwake: true, cupUpright: false, warmRoom: false });
    const light = this.drawLampSpirit(
      parent,
      this.lightRestingPosition.x,
      this.lightRestingPosition.y,
      1,
      true,
    );
    light.name = "MovableWarmLightFunctionalProxy";
    this.motionNodes.push({
      node: light,
      x: this.lightRestingPosition.x,
      y: this.lightRestingPosition.y,
      amplitude: 3,
      speed: 1.55,
      offset: 0,
    });
    this.bindLampDrag(light);

    const kettleTarget = this.makeNode("KettleTapTarget", 92, 112, parent, KETTLE_X, KETTLE_Y);
    this.bindTap(kettleTarget, () => {
      const session = this.bridge?.getSession();
      if (session?.phase === "exploring" && this.lightTapArmed) {
        this.lightTapArmed = false;
        this.dispatch({ type: "COMPLETE_CORE_WITH_TAP" });
      }
    }, false);

    this.bindIndoorAmbientTargets(parent);

    this.panel(parent, 0, -326, 342, 118);
    this.text(parent, "把这点暖光，带到壶边。", 0, -305, 304, 34, {
      size: this.fontSize(18),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(
      parent,
      this.lightTapArmed ? "再轻触水壶" : "拖动暖光 · 或先轻触暖光",
      0,
      -345,
      300,
      30,
      {
      size: this.fontSize(14),
      color: PALETTE.creamMuted,
      },
    );

    this.drawAmbientCompletionHint(parent);
  }

  private renderMicroScene(parent: Node): void {
    const upright = this.microSceneStage === 1;
    this.drawRoom(parent, { lampAwake: true, cupUpright: upright, warmRoom: true });
    this.drawLampSpirit(parent, upright ? 82 : 46, upright ? -28 : -55, 0.9, true);
    this.drawSoftCreature(parent, -83, -114, 0.94, upright);

    if (!upright) {
      this.text(parent, "……杯子好像放反了。", 0, -268, 314, 38, {
        size: this.fontSize(17),
        color: PALETTE.cream,
      });
    } else {
      this.text(parent, "那点暖光轻轻碰了一下。", 0, -268, 314, 38, {
        size: this.fontSize(17),
        color: PALETTE.cream,
      });
      this.text(parent, "这次对了。", 0, -303, 250, 30, {
        size: this.fontSize(14),
        color: PALETTE.creamMuted,
      });
    }

    const generation = this.renderGeneration;
    const reducedMotion = this.bridge?.getSettings().reducedMotion ?? false;
    const skipTarget = this.makeNode("MicroSceneSkipTarget", DESIGN_WIDTH, DESIGN_HEIGHT, parent);
    this.bindTap(skipTarget, () => this.dispatch({ type: "SKIP_MICRO_SCENE" }), false);
    this.text(parent, "轻触继续", 0, -354, 180, 30, {
      size: this.fontSize(13),
      color: PALETTE.creamMuted,
    });
    if (!upright) {
      this.scheduleOnce(() => {
        if (generation !== this.renderGeneration || this.bridge?.getSession().phase !== "micro-scene") return;
        this.microSceneStage = 1;
        this.render();
      }, reducedMotion ? 0.18 : 1.1);
    } else {
      this.scheduleOnce(() => {
        if (generation !== this.renderGeneration || this.bridge?.getSession().phase !== "micro-scene") return;
        this.dispatch({ type: "COMPLETE_MICRO_SCENE" });
      }, reducedMotion ? 3.82 : 2.9);
    }
  }

  private renderQuietStay(parent: Node): void {
    const endingPromptAvailable = this.bridge?.getSession().endingPromptAvailable ?? false;
    this.drawRoom(parent, { lampAwake: true, cupUpright: true, warmRoom: true });
    const lamp = this.drawLampSpirit(parent, 67, -43, 0.88, true);
    this.motionNodes.push({ node: lamp, x: 67, y: -43, amplitude: 2, speed: 1.25, offset: 1.1 });
    this.bindIndoorAmbientTargets(parent);
    this.drawAmbientCompletionHint(parent);

    this.panel(parent, 0, -325, 342, 120);
    this.text(
      parent,
      endingPromptAvailable ? "已经坐了一会儿。水也热了。" : "水壶开始轻轻响了。",
      0,
      -301,
      300,
      32,
      { size: this.fontSize(17), color: PALETTE.cream },
    );
    this.button(
      parent,
      endingPromptAvailable ? "听听今晚的话" : "今晚先到这里",
      0,
      -352,
      246,
      48,
      false,
      () => this.dispatch({ type: "REQUEST_END" }),
    );
  }

  private renderEnding(parent: Node): void {
    this.drawRoom(parent, { lampAwake: true, cupUpright: true, warmRoom: true });
    this.rect(parent, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, new Color(7, 10, 19, 72));
    this.panel(parent, 0, -21, 330, 430);
    this.text(parent, "水热了。", 0, 90, 286, 48, {
      size: this.fontSize(29),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(parent, "你也先缓一会儿。", 0, 38, 286, 44, {
      size: this.fontSize(22),
      color: PALETTE.cream,
    });
    this.line(parent, -54, -18, 108, 1, new Color(246, 193, 92, 115));
    this.button(parent, "再坐一会儿", 0, -96, 270, 54, false, () => {
      this.dispatch({ type: "STAY_A_WHILE" });
    });
    this.button(parent, "今晚到这里", 0, -161, 270, 54, true, () => {
      this.dispatch({ type: "FINISH_NIGHT" });
    });
  }

  private renderFinished(parent: Node): void {
    this.drawWindow(parent, -96, 111, true, 0.56);
    this.drawRoomShell(parent, 0.55);
    this.drawSoftCreature(parent, -76, -101, 0.86, true);
    this.drawLampSpirit(parent, 37, -72, 0.78, true);
    this.text(parent, "今夜到这里", 0, 194, 300, 48, {
      size: this.fontSize(29),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(parent, "灯会留在桌边。\n明晚想来时，再慢慢回来。", 0, 125, 290, 74, {
      size: this.fontSize(17),
      color: PALETTE.creamMuted,
      wrap: true,
    });
    this.text(parent, "第一夜 · 已完成", 0, -330, 260, 34, {
      size: this.fontSize(14),
      color: PALETTE.amber,
    });
    this.button(parent, "给朋友留一盏灯", 0, -271, 270, 52, true, () => {
      this.bridge?.sendAppFlow({ type: "OPEN_SHARE_PREVIEW" });
      this.render();
    });
  }

  private renderPaused(parent: Node): void {
    this.drawRoom(parent, { lampAwake: true, cupUpright: true, warmRoom: false });
    this.rect(parent, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, new Color(3, 6, 13, 130));
    this.panel(parent, 0, 0, 316, 250);
    this.text(parent, "先停在这里", 0, 49, 270, 42, {
      size: this.fontSize(25),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(parent, "回来时，会从最近的安全位置继续。", 0, 2, 270, 48, {
      size: this.fontSize(15),
      color: PALETTE.creamMuted,
      wrap: true,
    });
    this.button(parent, "继续", 0, -48, 220, 50, true, () => this.dispatch({ type: "RESUME" }));
    this.button(parent, "结束今晚", 0, -109, 220, 50, false, () => this.endFromPause());
  }

  private renderLoadingError(parent: Node, message: string | null): void {
    this.drawWindow(parent, -98, 110, false, 0.34);
    this.panel(parent, 0, 4, 326, 300);
    this.text(parent, "这盏灯刚才没点亮", 0, 76, 282, 42, {
      size: this.fontSize(23),
      color: PALETTE.cream,
      bold: true,
    });
    this.text(parent, message ?? "房间还在，我们再试一次。", 0, 21, 274, 60, {
      size: this.fontSize(15),
      color: PALETTE.creamMuted,
      wrap: true,
    });
    this.button(parent, "再试一次", 0, -72, 240, 52, true, () => {
      this.dispatch({ type: "RETRY_LOADING" });
    });
  }

  private drawSettingsControls(parent: Node): void {
    const bridge = this.bridge;
    if (!bridge) return;
    const settings = bridge.getSettings();
    this.text(parent, "第一夜", -148, 379, 76, 30, {
      size: this.fontSize(13),
      color: PALETTE.creamMuted,
      align: HorizontalTextAlignment.LEFT,
    });

    const anyAudio = settings.musicEnabled || settings.ambientEnabled || settings.feedbackEnabled;
    // Keep the right-side control below a conservative 58px top capsule zone.
    const button = this.button(parent, anyAudio ? "设置" : "静音", 148, 342, 68, 44, false, () => {
      this.openSettings();
    });
    button.name = "OpenSettings";
  }

  private bindIndoorAmbientTargets(parent: Node): void {
    const windowTarget = this.makeNode("WindowMistTapTarget", 132, 192, parent, -105, 102);
    this.bindTap(windowTarget, () => {
      this.dispatch({ type: "COMPLETE_AMBIENT", interactionId: "wipe-window-mist" });
    }, false);
    const scarfTarget = this.makeNode("ChairScarfTapTarget", 70, 112, parent, -145, -121);
    this.bindTap(scarfTarget, () => {
      this.dispatch({ type: "COMPLETE_AMBIENT", interactionId: "touch-chair-scarf" });
    }, false);
  }

  private drawAmbientCompletionHint(parent: Node): void {
    const completedAmbient = this.bridge?.getSession().completedAmbientInteractionIds ?? [];
    if (completedAmbient.includes("wipe-window-mist")) {
      this.text(parent, "月亮露出了一小块。", -75, 219, 210, 28, {
        size: this.fontSize(13),
        color: PALETTE.creamMuted,
      });
    } else if (completedAmbient.includes("touch-chair-scarf")) {
      this.text(parent, "围巾慢慢垂了下来。", -42, -243, 245, 28, {
        size: this.fontSize(13),
        color: PALETTE.creamMuted,
      });
    }
  }

  private renderAppOverlay(parent: Node): void {
    const bridge = this.bridge;
    if (!bridge) return;
    const flow = bridge.getAppFlow();
    if (["none", "paused"].includes(flow.overlay)) return;

    const touchShield = this.rect(
      parent,
      0,
      0,
      DESIGN_WIDTH,
      DESIGN_HEIGHT,
      new Color(3, 6, 13, 170),
    );
    touchShield.name = "AppOverlayTouchShield";
    this.bindTap(touchShield, () => undefined, false);
    if (flow.overlay === "settings") {
      this.renderSettingsOverlay(parent);
    } else if (flow.overlay === "share-preview") {
      this.panel(parent, 0, 8, 338, 410);
      this.text(parent, "给朋友留一盏灯", 0, 123, 292, 44, {
        size: this.fontSize(25),
        color: PALETTE.cream,
        bold: true,
      });
      this.text(parent, "有人给你留了一盏灯", 0, 65, 288, 42, {
        size: this.fontSize(18),
        color: PALETTE.cream,
      });
      this.text(parent, "不携带姓名、留言或今晚的进度。", 0, 13, 284, 58, {
        size: this.fontSize(14),
        color: PALETTE.creamMuted,
        wrap: true,
      });
      this.button(parent, "发给朋友", 0, -68, 254, 52, true, () => {
        bridge.requestWechatShare();
      });
      this.button(parent, "再坐一会儿", 0, -130, 254, 50, false, () => {
        bridge.sendAppFlow({ type: "CLOSE_SHARE_PREVIEW" });
        this.render();
      });
    } else if (flow.overlay === "share-failed") {
      this.panel(parent, 0, 0, 326, 324);
      this.text(parent, "分享还没有发出去", 0, 81, 276, 42, {
        size: this.fontSize(22),
        color: PALETTE.cream,
        bold: true,
      });
      this.text(parent, flow.shareErrorMessage ?? "可以等一会儿再试。", 0, 35, 272, 44, {
        size: this.fontSize(14),
        color: PALETTE.creamMuted,
      });
      this.button(parent, "再试一次", 0, -45, 246, 50, true, () => {
        bridge.sendAppFlow({ type: "DISMISS_SHARE_FAILED" });
        bridge.sendAppFlow({ type: "OPEN_SHARE_PREVIEW" });
        bridge.requestWechatShare();
        this.render();
      });
      this.button(parent, "留在今晚", 0, -105, 246, 50, false, () => {
        bridge.sendAppFlow({ type: "DISMISS_SHARE_FAILED" });
        this.render();
      });
    } else if (flow.overlay === "save-error") {
      this.panel(parent, 0, 0, 326, 286);
      this.text(parent, "进度暂时没有存好", 0, 63, 276, 42, {
        size: this.fontSize(22),
        color: PALETTE.cream,
        bold: true,
      });
      this.text(parent, flow.saveErrorMessage ?? "请再试一次，先不要退出。", 0, 18, 272, 44, {
        size: this.fontSize(14),
        color: PALETTE.creamMuted,
      });
      this.button(parent, "重新保存", 0, -65, 246, 50, true, () => {
        bridge.retryPersist();
        this.render();
      });
    } else if (flow.overlay === "audio-interrupted") {
      this.panel(parent, 0, 0, 326, 250);
      this.text(parent, "声音先停了一下", 0, 46, 276, 42, {
        size: this.fontSize(22),
        color: PALETTE.cream,
        bold: true,
      });
      this.button(parent, "继续", 0, -55, 220, 50, true, () => {
        const session = bridge.getSession();
        if (session.phase === "paused" && session.pauseReason === "audio-interruption") {
          bridge.send({ type: "RESUME" });
        }
        bridge.sendAppFlow({ type: "AUDIO_RESUMED" });
        this.render();
      });
    } else if (flow.overlay === "loading-error") {
      this.panel(parent, 0, 0, 326, 286);
      this.text(parent, "房间还没准备好", 0, 62, 280, 42, {
        size: this.fontSize(22),
        color: PALETTE.cream,
        bold: true,
      });
      this.text(parent, flow.loadingErrorMessage ?? "再试一次就好。", 0, 16, 274, 44, {
        size: this.fontSize(14),
        color: PALETTE.creamMuted,
      });
      this.button(parent, "再试一次", 0, -66, 230, 50, true, () => {
        bridge.sendAppFlow({ type: "RETRY_INDOOR_LOAD" });
      });
    }
  }

  private renderSettingsOverlay(parent: Node): void {
    const bridge = this.bridge;
    if (!bridge) return;
    const settings = bridge.getSettings();
    this.panel(parent, 0, 0, 342, 568);
    this.text(parent, "设置", 0, 235, 280, 44, {
      size: this.fontSize(26),
      color: PALETTE.cream,
      bold: true,
    });
    const rows: ReadonlyArray<{
      readonly y: number;
      readonly label: string;
      readonly enabled: boolean;
      readonly change: Readonly<Partial<UserSettings>>;
    }> = [
      { y: 163, label: "音乐", enabled: settings.musicEnabled, change: { musicEnabled: !settings.musicEnabled } },
      { y: 99, label: "环境声", enabled: settings.ambientEnabled, change: { ambientEnabled: !settings.ambientEnabled } },
      { y: 35, label: "触碰反馈", enabled: settings.feedbackEnabled, change: { feedbackEnabled: !settings.feedbackEnabled } },
      { y: -29, label: "减少动态", enabled: settings.reducedMotion, change: { reducedMotion: !settings.reducedMotion } },
      { y: -93, label: "大字", enabled: settings.largeText, change: { largeText: !settings.largeText } },
    ];
    for (const row of rows) {
      this.text(parent, row.label, -76, row.y, 150, 44, {
        size: this.fontSize(16),
        color: PALETTE.cream,
        align: HorizontalTextAlignment.LEFT,
      });
      this.button(parent, row.enabled ? "开" : "关", 105, row.y, 70, 44, row.enabled, () => {
        bridge.updateSettings(row.change);
        this.render();
      });
    }
      this.button(parent, "回到房间", 0, -174, 250, 50, true, () => {
      this.closeSettingsAndResume();
    });
    if (!["finished", "ending"].includes(bridge.getSession().phase)) {
      this.button(parent, "暂停今晚", 0, -232, 250, 46, false, () => {
        bridge.sendAppFlow({ type: "CLOSE_SETTINGS" });
        if (bridge.getSession().phase !== "paused") {
          bridge.send({ type: "PAUSE", reason: "manual" });
        }
        this.render();
      });
    }
  }

  private drawRoom(
    parent: Node,
    options: { readonly lampAwake: boolean; readonly cupUpright: boolean; readonly warmRoom: boolean },
  ): void {
    this.drawWindow(parent, -105, 102, true, options.warmRoom ? 0.74 : 0.56);
    this.drawRoomShell(parent, options.warmRoom ? 0.88 : 0.7);

    if (options.lampAwake) {
      this.glow(parent, 64, -65, options.warmRoom ? 138 : 100);
    }

    this.drawTable(parent);
    this.drawKettle(parent, KETTLE_X, KETTLE_Y, options.warmRoom);
    this.drawCup(parent, 38, -100, options.cupUpright);
    this.drawSoftCreature(parent, -103, -131, 0.94, options.cupUpright);
    this.drawScarf(parent, -145, -121);
  }

  private drawRoomShell(parent: Node, warmth: number): void {
    this.rect(parent, 0, -181, DESIGN_WIDTH, 6, new Color(116, 99, 84, 125));
    this.rect(parent, 134, 92, 78, 230, new Color(26, 31, 44, 210));
    this.rect(parent, 134, -4, 76, 7, new Color(83, 73, 69, 170));
    this.line(parent, -186, 244, 356, 1, new Color(186, 199, 203, 18));
    this.rect(parent, 40, -145, 258, 92, new Color(25, 27, 35, 110));
    if (warmth > 0.5) {
      this.rect(parent, 44, -95, 235, 155, new Color(219, 136, 54, Math.round(21 * warmth)));
    }
  }

  private drawWindow(parent: Node, x: number, y: number, showMoon: boolean, brightness: number): void {
    this.rect(parent, x, y, 132, 192, new Color(7, 12, 23, 255), 4);
    this.rect(parent, x, y, 118, 178, new Color(35, 48, 68, 255), 2);
    this.rect(parent, x, y, 5, 178, new Color(14, 20, 31, 255));
    this.rect(parent, x, y - 18, 118, 5, new Color(14, 20, 31, 255));
    this.rect(parent, x + 7, y + 6, 102, 152, new Color(151, 174, 185, Math.round(17 * brightness)));
    if (showMoon) {
      const moon = this.shape(parent, "Moon", 52, 52, x + 26, y + 47, (graphics) => {
        graphics.fillColor = new Color(221, 226, 211, Math.round(230 * brightness));
        graphics.circle(0, 0, 22);
        graphics.fill();
        graphics.fillColor = new Color(58, 72, 88, Math.round(155 * brightness));
        graphics.circle(-8, 8, 4);
        graphics.fill();
      });
      this.motionNodes.push({ node: moon, x: x + 26, y: y + 47, amplitude: 1.4, speed: 0.42, offset: 0.8 });
    }
    for (const offset of [-40, -4, 35]) {
      this.line(parent, x + offset, y - 71, 1, 76, new Color(218, 229, 225, 24));
    }
  }

  private drawTable(parent: Node): void {
    this.rect(parent, 70, -130, 240, 23, PALETTE.wood, 4);
    this.rect(parent, 70, -119, 240, 4, new Color(144, 101, 72, 115), 2);
    this.rect(parent, 7, -224, 18, 176, new Color(55, 44, 43, 255), 4);
    this.rect(parent, 145, -224, 18, 176, new Color(55, 44, 43, 255), 4);
  }

  private drawKettle(parent: Node, x: number, y: number, warm: boolean): Node {
    const kettle = this.shape(parent, "Kettle", 108, 120, x, y, (graphics) => {
      graphics.fillColor = new Color(122, 130, 132, 255);
      graphics.roundRect(-31, -34, 65, 66, 25);
      graphics.fill();
      graphics.fillColor = new Color(75, 83, 91, 255);
      graphics.roundRect(-25, 23, 52, 13, 6);
      graphics.fill();
      graphics.moveTo(26, 13);
      graphics.lineTo(48, 1);
      graphics.lineTo(31, -8);
      graphics.close();
      graphics.fill();
      graphics.lineWidth = 7;
      graphics.strokeColor = new Color(80, 86, 91, 255);
      graphics.arc(-29, 1, 22, Math.PI * 0.62, Math.PI * 1.38, false);
      graphics.stroke();
      graphics.lineWidth = 3;
      graphics.strokeColor = warm ? PALETTE.amber : new Color(163, 169, 167, 180);
      graphics.moveTo(-12, -12);
      graphics.bezierCurveTo(-3, -20, 11, -20, 20, -10);
      graphics.stroke();
    });
    return kettle;
  }

  private drawCup(parent: Node, x: number, y: number, upright: boolean): Node {
    return this.shape(parent, "Cup", 62, 58, x, y, (graphics) => {
      graphics.fillColor = upright ? PALETTE.cream : new Color(206, 197, 177, 255);
      if (upright) {
        graphics.roundRect(-20, -18, 38, 35, 7);
        graphics.fill();
        graphics.lineWidth = 5;
        graphics.strokeColor = new Color(210, 194, 163, 255);
        graphics.arc(19, 1, 10, -Math.PI / 2, Math.PI / 2, false);
        graphics.stroke();
        graphics.strokeColor = PALETTE.ink;
        graphics.lineWidth = 2;
        graphics.moveTo(-9, 8);
        graphics.lineTo(6, 8);
        graphics.stroke();
      } else {
        graphics.moveTo(-23, -17);
        graphics.lineTo(23, -17);
        graphics.lineTo(15, 17);
        graphics.lineTo(-15, 17);
        graphics.close();
        graphics.fill();
        graphics.lineWidth = 3;
        graphics.strokeColor = new Color(210, 194, 163, 255);
        graphics.moveTo(-25, -18);
        graphics.lineTo(25, -18);
        graphics.stroke();
      }
    });
  }

  private drawSoftCreature(parent: Node, x: number, y: number, scale: number, pleased: boolean): Node {
    const creature = this.shape(parent, "SoftCreature", 122, 142, x, y, (graphics) => {
      graphics.fillColor = new Color(232, 220, 195, 255);
      graphics.moveTo(-42, -44);
      graphics.bezierCurveTo(-54, -10, -49, 34, -19, 52);
      graphics.bezierCurveTo(8, 67, 43, 47, 47, 13);
      graphics.bezierCurveTo(55, -17, 37, -52, 5, -58);
      graphics.bezierCurveTo(-13, -62, -31, -57, -42, -44);
      graphics.close();
      graphics.fill();
      graphics.fillColor = new Color(196, 177, 151, 255);
      graphics.ellipse(-22, -49, 12, 7);
      graphics.ellipse(22, -50, 12, 7);
      graphics.fill();
      graphics.fillColor = PALETTE.ink;
      graphics.circle(-15, 15, 3.2);
      graphics.circle(16, 15, 3.2);
      graphics.fill();
      graphics.lineWidth = 2;
      graphics.strokeColor = new Color(71, 65, 60, 255);
      graphics.moveTo(-6, pleased ? 3 : 5);
      if (pleased) graphics.bezierCurveTo(-1, -1, 5, -1, 9, 3);
      else graphics.lineTo(8, 5);
      graphics.stroke();
      graphics.fillColor = new Color(217, 153, 121, 80);
      graphics.circle(-28, 4, 7);
      graphics.circle(29, 4, 7);
      graphics.fill();
    });
    creature.setScale(scale, scale, 1);
    return creature;
  }

  private drawLampSpirit(parent: Node, x: number, y: number, scale: number, awake: boolean): Node {
    this.glow(parent, x, y, awake ? 74 * scale : 42 * scale);
    const lamp = this.shape(parent, "LampSpirit", 78, 100, x, y, (graphics) => {
      graphics.fillColor = awake ? new Color(240, 198, 111, 255) : new Color(119, 111, 96, 255);
      graphics.moveTo(-18, -37);
      graphics.lineTo(-22, 24);
      graphics.lineTo(-7, 40);
      graphics.lineTo(19, 30);
      graphics.lineTo(18, -34);
      graphics.close();
      graphics.fill();
      graphics.fillColor = awake ? new Color(214, 158, 74, 255) : new Color(91, 84, 75, 255);
      graphics.moveTo(-7, 40);
      graphics.lineTo(10, 42);
      graphics.lineTo(19, 30);
      graphics.close();
      graphics.fill();
      graphics.moveTo(18, 20);
      graphics.lineTo(30, 7);
      graphics.lineTo(18, -2);
      graphics.close();
      graphics.fill();
      graphics.fillColor = awake ? new Color(255, 221, 133, 255) : new Color(145, 126, 91, 255);
      graphics.roundRect(-10, -27, 20, 28, 8);
      graphics.fill();
      graphics.fillColor = PALETTE.ink;
      graphics.circle(-8, 17, 2.6);
      graphics.circle(8, 17, 2.6);
      graphics.fill();
    });
    lamp.setScale(scale, scale, 1);
    return lamp;
  }

  private drawScarf(parent: Node, x: number, y: number): void {
    this.shape(parent, "Scarf", 70, 112, x, y, (graphics) => {
      graphics.lineWidth = 13;
      graphics.strokeColor = new Color(119, 74, 67, 255);
      graphics.moveTo(-13, 42);
      graphics.bezierCurveTo(14, 21, -9, -7, 16, -45);
      graphics.stroke();
      graphics.lineWidth = 2;
      graphics.strokeColor = new Color(183, 126, 104, 170);
      for (const yOffset of [-20, -11, -2]) {
        graphics.moveTo(7, yOffset);
        graphics.lineTo(19, yOffset - 4);
      }
      graphics.stroke();
    });
  }

  private drawPulse(parent: Node, x: number, y: number): void {
    const pulse = this.shape(parent, "TouchPulse", 70, 70, x, y, (graphics) => {
      graphics.lineWidth = 2;
      graphics.strokeColor = new Color(246, 193, 92, 155);
      graphics.circle(0, 0, 19);
      graphics.stroke();
      graphics.fillColor = PALETTE.amber;
      graphics.circle(0, 0, 5);
      graphics.fill();
    });
    this.motionNodes.push({ node: pulse, x, y, amplitude: 4, speed: 1.5, offset: 0 });
  }

  private glow(parent: Node, x: number, y: number, diameter: number): void {
    this.shape(parent, "AmberGlow", diameter, diameter, x, y, (graphics) => {
      const radii = [0.5, 0.37, 0.23];
      const alpha = [15, 23, 36];
      radii.forEach((ratio, index) => {
        graphics.fillColor = new Color(246, 177, 70, alpha[index] ?? 18);
        graphics.circle(0, 0, diameter * ratio);
        graphics.fill();
      });
    });
  }

  private bindLampDrag(light: Node): void {
    let movedDistance = 0;
    let startPosition: Vec3 | null = null;
    const start = (event: EventTouch): void => {
      event.propagationStopped = true;
      if (this.bridge?.getSession().phase !== "exploring") return;
      const transition = this.bridge.send({ type: "BEGIN_CORE_DRAG" });
      if (transition.state.phase !== "core-dragging") return;
      this.draggingLight = true;
      movedDistance = 0;
      startPosition = this.touchPosition(event);
      light.setScale(1.05, 1.05, 1);
    };
    const move = (event: EventTouch): void => {
      event.propagationStopped = true;
      if (!this.draggingLight) return;
      const rawPosition = this.touchPosition(event);
      const position = rawPosition ? this.clampLightPosition(rawPosition) : null;
      if (position) {
        if (startPosition) {
          movedDistance = Math.max(
            movedDistance,
            Math.hypot(position.x - startPosition.x, position.y - startPosition.y),
          );
        }
        light.setPosition(position.x, position.y);
      }
    };
    const finish = (event: EventTouch, cancelled: boolean): void => {
      event.propagationStopped = true;
      if (!this.draggingLight) return;
      this.draggingLight = false;
      const rawPosition = cancelled ? null : this.touchPosition(event);
      const position = rawPosition ? this.clampLightPosition(rawPosition) : null;
      const targetHit = position !== null
        && movedDistance >= 8
        && Math.hypot(position.x - KETTLE_X, position.y - KETTLE_Y) <= 28;
      if (!cancelled && position && movedDistance >= 8 && !targetHit) {
        this.lightRestingPosition = new Vec3(position.x, position.y, 0);
      }
      if (movedDistance >= 8) this.lightTapArmed = false;
      if (!cancelled && movedDistance < 8) {
        this.lightTapArmed = true;
      }
      if (targetHit) this.lightTapArmed = false;
      this.bridge?.send({ type: "DROP_CORE", targetHit });
      this.render();
    };
    const end = (event: EventTouch): void => finish(event, false);
    const cancel = (event: EventTouch): void => finish(event, true);

    light.on(Node.EventType.TOUCH_START, start, this);
    light.on(Node.EventType.TOUCH_MOVE, move, this);
    light.on(Node.EventType.TOUCH_END, end, this);
    light.on(Node.EventType.TOUCH_CANCEL, cancel, this);
    this.cleanups.push(() => {
      light.off(Node.EventType.TOUCH_START, start, this);
      light.off(Node.EventType.TOUCH_MOVE, move, this);
      light.off(Node.EventType.TOUCH_END, end, this);
      light.off(Node.EventType.TOUCH_CANCEL, cancel, this);
    });
  }

  private touchPosition(event: EventTouch): Vec3 | null {
    const canvas = this.node.parent;
    const transform = canvas?.getComponent(UITransform);
    if (!transform) return null;
    const location = event.getUILocation();
    return transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
  }

  private clampLightPosition(position: Readonly<Vec3>): Vec3 {
    return new Vec3(
      Math.max(LIGHT_MIN_X, Math.min(LIGHT_MAX_X, position.x)),
      Math.max(LIGHT_MIN_Y, Math.min(LIGHT_MAX_Y, position.y)),
      0,
    );
  }

  private button(
    parent: Node,
    labelText: string,
    x: number,
    y: number,
    width: number,
    height: number,
    primary: boolean,
    onTap: () => void,
  ): Node {
    const safeWidth = Math.max(width, 44);
    const safeHeight = Math.max(height, 44);
    const node = this.makeNode(`Button-${labelText}`, safeWidth, safeHeight, parent, x, y);
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = primary ? PALETTE.amber : new Color(25, 32, 48, 244);
    graphics.roundRect(-safeWidth / 2, -safeHeight / 2, safeWidth, safeHeight, Math.min(16, safeHeight / 2));
    graphics.fill();
    graphics.lineWidth = 1.5;
    graphics.strokeColor = primary ? new Color(255, 224, 156, 190) : new Color(159, 167, 167, 95);
    graphics.roundRect(-safeWidth / 2 + 1, -safeHeight / 2 + 1, safeWidth - 2, safeHeight - 2, Math.min(15, safeHeight / 2 - 1));
    graphics.stroke();
    this.text(node, labelText, 0, 0, safeWidth - 16, safeHeight - 8, {
      size: this.fontSize(safeHeight <= 46 ? 14 : 16),
      color: primary ? PALETTE.ink : PALETTE.cream,
      bold: primary,
    });
    this.bindTap(node, onTap, true);
    return node;
  }

  private bindTap(node: Node, onTap: () => void, pressFeedback = true): void {
    let pressedInside = false;
    const start = (event: EventTouch): void => {
      event.propagationStopped = true;
      pressedInside = this.isTouchInside(node, event);
      if (pressFeedback && !this.bridge?.getSettings().reducedMotion) {
        node.setScale(0.975, 0.975, 1);
      }
    };
    const end = (event: EventTouch): void => {
      event.propagationStopped = true;
      node.setScale(1, 1, 1);
      const shouldTap = pressedInside && this.isTouchInside(node, event);
      pressedInside = false;
      if (shouldTap) onTap();
    };
    const cancel = (event: EventTouch): void => {
      event.propagationStopped = true;
      pressedInside = false;
      node.setScale(1, 1, 1);
    };
    node.on(Node.EventType.TOUCH_START, start, this);
    node.on(Node.EventType.TOUCH_END, end, this);
    node.on(Node.EventType.TOUCH_CANCEL, cancel, this);
    this.cleanups.push(() => {
      node.off(Node.EventType.TOUCH_START, start, this);
      node.off(Node.EventType.TOUCH_END, end, this);
      node.off(Node.EventType.TOUCH_CANCEL, cancel, this);
    });
  }

  private isTouchInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const size = transform.contentSize;
    const location = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    return Math.abs(local.x) <= size.width / 2 && Math.abs(local.y) <= size.height / 2;
  }

  private panel(parent: Node, x: number, y: number, width: number, height: number): Node {
    const shadow = this.rect(parent, x, y - 5, width + 5, height + 7, new Color(0, 0, 0, 85), 22);
    shadow.name = "PanelShadow";
    const panel = this.rect(parent, x, y, width, height, new Color(21, 28, 43, 244), 20);
    const graphics = panel.getComponent(Graphics);
    if (graphics) {
      graphics.lineWidth = 1.2;
      graphics.strokeColor = new Color(177, 187, 186, 67);
      graphics.roundRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 19);
      graphics.stroke();
    }
    return panel;
  }

  private text(
    parent: Node,
    content: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: TextOptions = {},
  ): Label {
    const node = this.makeNode(`Text-${content.slice(0, 12)}`, width, height, parent, x, y);
    const label = node.addComponent(Label);
    const size = options.size ?? this.fontSize(16);
    label.string = content;
    label.fontSize = size;
    label.lineHeight = Math.round(size * 1.45);
    label.color = options.color ? new Color(options.color) : new Color(PALETTE.cream);
    label.horizontalAlign = options.align ?? HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Label.Overflow.CLAMP;
    label.enableWrapText = options.wrap ?? false;
    label.useSystemFont = true;
    label.fontFamily = "PingFang SC";
    label.isBold = options.bold ?? false;
    return label;
  }

  private fontSize(base: number): number {
    return Math.round(base * (this.bridge?.getSettings().largeText ? 1.2 : 1));
  }

  private endFromPause(): void {
    const bridge = this.bridge;
    if (!bridge) return;
    const paused = bridge.getSession();
    if (paused.coreCompleted) {
      bridge.send({ type: "RESUME" });
      bridge.send({ type: "REQUEST_END" });
      this.render();
      return;
    }
    bridge.returnToOutdoor();
  }

  private openSettings(): void {
    const bridge = this.bridge;
    if (!bridge) return;
    if (["exploring", "core-dragging", "micro-scene", "quiet-stay"].includes(
      bridge.getSession().phase,
    )) {
      bridge.send({ type: "PAUSE", reason: "manual" });
    }
    bridge.sendAppFlow({ type: "OPEN_SETTINGS" });
    this.render();
  }

  private closeSettingsAndResume(): void {
    const bridge = this.bridge;
    if (!bridge) return;
    bridge.sendAppFlow({ type: "CLOSE_SETTINGS" });
    if (bridge.getSession().phase === "paused" && bridge.getSession().pauseReason === "manual") {
      bridge.send({ type: "RESUME" });
    }
    this.render();
  }

  private line(parent: Node, x: number, y: number, width: number, height: number, color: Readonly<Color>): Node {
    return this.rect(parent, x, y, width, height, color, Math.min(width, height) / 2);
  }

  private rect(
    parent: Node,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Readonly<Color>,
    radius = 0,
  ): Node {
    return this.shape(parent, "Rectangle", width, height, x, y, (graphics) => {
      graphics.fillColor = new Color(color);
      if (radius > 0) graphics.roundRect(-width / 2, -height / 2, width, height, radius);
      else graphics.rect(-width / 2, -height / 2, width, height);
      graphics.fill();
    });
  }

  private shape(
    parent: Node,
    name: string,
    width: number,
    height: number,
    x: number,
    y: number,
    draw: (graphics: Graphics) => void,
  ): Node {
    const node = this.makeNode(name, width, height, parent, x, y);
    draw(node.addComponent(Graphics));
    return node;
  }

  private makeNode(
    name: string,
    width: number,
    height: number,
    parent: Node,
    x = 0,
    y = 0,
  ): Node {
    const node = new Node(name);
    node.layer = parent.layer;
    node.addComponent(UITransform).setContentSize(width, height);
    node.setPosition(x, y);
    parent.addChild(node);
    return node;
  }
}
