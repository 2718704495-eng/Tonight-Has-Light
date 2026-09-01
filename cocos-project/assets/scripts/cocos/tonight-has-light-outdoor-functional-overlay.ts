import {
  _decorator,
  Color,
  Component,
  EventTouch,
  GraphicsComponent as Graphics,
  HorizontalTextAlignment,
  Label,
  Layers,
  Node,
  UITransform,
  Vec3,
  VerticalTextAlignment,
} from "cc";
import type { AppFlowState } from "../core/app-flow.ts";

const { ccclass } = _decorator;
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

export interface TonightHasLightOutdoorFunctionalOverlayBridge {
  getAppFlow(): AppFlowState;
  dismissSharedWelcome(): void;
  retryCurrentLoad(): void;
}

/**
 * Local-only functional shell for the fixed share welcome.
 *
 * It deliberately owns no approved visual language. The final welcome panel
 * remains blocked on the outdoor UI master and must replace this component
 * before the next external preview.
 */
@ccclass("TonightHasLightOutdoorFunctionalOverlay")
export class TonightHasLightOutdoorFunctionalOverlay extends Component {
  private bridge: TonightHasLightOutdoorFunctionalOverlayBridge | null = null;
  private root: Node | null = null;
  private cleanups: Array<() => void> = [];

  public initialize(bridge: TonightHasLightOutdoorFunctionalOverlayBridge): void {
    this.bridge = bridge;
    this.refresh();
  }

  public refresh(): void {
    this.release();
    const flow = this.bridge?.getAppFlow();
    const sharedWelcome = flow?.phase === "shared-welcome";
    const loadingError = flow?.overlay === "loading-error";
    if (!sharedWelcome && !loadingError) return;

    const root = this.makeNode("SharedWelcomeFunctionalShell", DESIGN_WIDTH, DESIGN_HEIGHT, this.node);
    this.root = root;
    const veil = root.addComponent(Graphics);
    veil.fillColor = new Color(3, 10, 28, 178);
    veil.rect(-DESIGN_WIDTH / 2, -DESIGN_HEIGHT / 2, DESIGN_WIDTH, DESIGN_HEIGHT);
    veil.fill();
    this.stopTouches(root);

    if (loadingError) {
      const subject = flow?.phase === "indoor-loading" ? "房间" : "夜空";
      const panel = this.makeNode("LoadingErrorPanel", 338, 320, root, 0, -80);
      const panelGraphics = panel.addComponent(Graphics);
      panelGraphics.fillColor = new Color(12, 28, 55, 248);
      panelGraphics.roundRect(-169, -160, 338, 320, 24);
      panelGraphics.fill();
      this.text(panel, `${subject}还没准备好`, 0, 78, 286, 46, 24, new Color(244, 235, 213));
      this.text(
        panel,
        flow?.loadingErrorMessage ?? "先别着急，再试一次。",
        0,
        20,
        282,
        62,
        15,
        new Color(207, 211, 205),
      );
      const retry = this.makeNode("RetryIndoorLoad", 250, 54, panel, 0, -82);
      const retryGraphics = retry.addComponent(Graphics);
      retryGraphics.fillColor = new Color(246, 193, 92);
      retryGraphics.roundRect(-125, -27, 250, 54, 16);
      retryGraphics.fill();
      this.text(retry, "再试一次", 0, 0, 218, 44, 17, new Color(26, 29, 34));
      this.bindTap(retry, () => this.bridge?.retryCurrentLoad());
      return;
    }

    const panel = this.makeNode("SharedWelcomePanel", 338, 360, root, 0, -118);
    const panelGraphics = panel.addComponent(Graphics);
    panelGraphics.fillColor = new Color(12, 28, 55, 245);
    panelGraphics.roundRect(-169, -180, 338, 360, 24);
    panelGraphics.fill();
    panelGraphics.lineWidth = 1.5;
    panelGraphics.strokeColor = new Color(205, 218, 221, 80);
    panelGraphics.roundRect(-168, -179, 336, 358, 23);
    panelGraphics.stroke();

    this.text(panel, "有人给你留了一盏灯", 0, 92, 292, 48, 26, new Color(244, 235, 213));
    this.text(
      panel,
      "不用回复，也不用解释。\n先陪自己看一会儿夜空。",
      0,
      25,
      284,
      76,
      17,
      new Color(207, 211, 205),
    );
    const button = this.makeNode("DismissSharedWelcome", 260, 54, panel, 0, -93);
    const buttonGraphics = button.addComponent(Graphics);
    buttonGraphics.fillColor = new Color(246, 193, 92);
    buttonGraphics.roundRect(-130, -27, 260, 54, 16);
    buttonGraphics.fill();
    this.text(button, "先看看夜空", 0, 0, 228, 44, 17, new Color(26, 29, 34));
    this.bindTap(button, () => {
      this.bridge?.dismissSharedWelcome();
      this.refresh();
    });
  }

  protected onDestroy(): void {
    this.release();
    this.bridge = null;
  }

  private release(): void {
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    if (this.root?.isValid) this.root.destroy();
    this.root = null;
  }

  private stopTouches(node: Node): void {
    const stop = (event: EventTouch): void => {
      event.propagationStopped = true;
    };
    node.on(Node.EventType.TOUCH_START, stop, this);
    node.on(Node.EventType.TOUCH_MOVE, stop, this);
    node.on(Node.EventType.TOUCH_END, stop, this);
    node.on(Node.EventType.TOUCH_CANCEL, stop, this);
    this.cleanups.push(() => {
      node.off(Node.EventType.TOUCH_START, stop, this);
      node.off(Node.EventType.TOUCH_MOVE, stop, this);
      node.off(Node.EventType.TOUCH_END, stop, this);
      node.off(Node.EventType.TOUCH_CANCEL, stop, this);
    });
  }

  private bindTap(node: Node, onTap: () => void): void {
    let pressed = false;
    const start = (event: EventTouch): void => {
      event.propagationStopped = true;
      pressed = this.isInside(node, event);
    };
    const end = (event: EventTouch): void => {
      event.propagationStopped = true;
      const shouldTap = pressed && this.isInside(node, event);
      pressed = false;
      if (shouldTap) onTap();
    };
    const cancel = (event: EventTouch): void => {
      event.propagationStopped = true;
      pressed = false;
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

  private isInside(node: Node, event: EventTouch): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) return false;
    const location = event.getUILocation();
    const local = transform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
    return Math.abs(local.x) <= transform.contentSize.width / 2
      && Math.abs(local.y) <= transform.contentSize.height / 2;
  }

  private text(
    parent: Node,
    content: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fontSize: number,
    color: Color,
  ): void {
    const node = this.makeNode(`Text-${content.slice(0, 10)}`, width, height, parent, x, y);
    const label = node.addComponent(Label);
    label.string = content;
    label.fontSize = fontSize;
    label.lineHeight = Math.round(fontSize * 1.45);
    label.color = color;
    label.horizontalAlign = HorizontalTextAlignment.CENTER;
    label.verticalAlign = VerticalTextAlignment.CENTER;
    label.overflow = Label.Overflow.CLAMP;
    label.enableWrapText = content.includes("\n");
    label.useSystemFont = true;
    label.fontFamily = "PingFang SC";
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
    node.layer = parent.layer || Layers.Enum.UI_2D;
    node.addComponent(UITransform).setContentSize(width, height);
    node.setPosition(x, y);
    parent.addChild(node);
    return node;
  }
}
