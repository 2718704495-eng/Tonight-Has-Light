// Archived superseded R2 component. Kept outside `assets/` so Cocos cannot
// compile it into newer experience candidates.
import {
  _decorator,
  Component,
  input,
  Input,
  Layers,
  Node,
  Sprite,
  SpriteFrame,
  UIOpacity,
  UITransform,
} from "cc";
import {
  OUTDOOR_ILLUSTRATION_PAGE_COUNT,
  OutdoorIllustrationWindPageModel,
  type OutdoorIllustrationPageIndex,
  type OutdoorIllustrationWindPageSnapshot,
} from "../../assets/scripts/cocos/outdoor-gate-c/outdoor-illustration-wind-model.ts";

const { ccclass } = _decorator;
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;

interface PageSlot {
  readonly node: Node;
  readonly sprite: Sprite;
  readonly opacity: UIOpacity;
  page: OutdoorIllustrationPageIndex;
}

export interface OutdoorIllustrationWindPagesSnapshot
  extends OutdoorIllustrationWindPageSnapshot {
  readonly slots: readonly [
    { readonly page: OutdoorIllustrationPageIndex; readonly opacity: number },
    { readonly page: OutdoorIllustrationPageIndex; readonly opacity: number },
  ];
  readonly opacitySum: number;
}

@ccclass("OutdoorIllustrationWindPages")
export class OutdoorIllustrationWindPages extends Component {
  private readonly model = new OutdoorIllustrationWindPageModel();
  private frames: readonly SpriteFrame[] = [];
  private slots: [PageSlot, PageSlot] | null = null;
  private stableSprite: Sprite | null = null;
  private activeSlotIndex: 0 | 1 = 0;
  private appliedTransitionId: number | null = null;
  private configured = false;

  public configure(
    stableUpperFrame: SpriteFrame,
    pageFrames: readonly SpriteFrame[],
    reducedMotion: boolean,
  ): void {
    if (pageFrames.length !== OUTDOOR_ILLUSTRATION_PAGE_COUNT) {
      throw new Error(
        `Outdoor illustration wind requires ${OUTDOOR_ILLUSTRATION_PAGE_COUNT} pages; received ${pageFrames.length}`,
      );
    }
    this.frames = [...pageFrames];
    this.buildVisualNodes(stableUpperFrame);
    this.model.setReducedMotion(reducedMotion);
    this.settleOnPage(0);
    this.configured = true;
  }

  protected onLoad(): void {
    input.on(Input.EventType.TOUCH_START, this.handleFirstTouch, this);
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.handleFirstTouch, this);
    if (this.stableSprite) this.stableSprite.spriteFrame = null;
    for (const slot of this.slots ?? []) slot.sprite.spriteFrame = null;
    this.frames = [];
    this.slots = null;
    this.stableSprite = null;
  }

  protected update(deltaTime: number): void {
    if (!this.configured || !this.slots) return;
    this.model.advance(Math.max(0, Math.min(deltaTime, 0.1)) * 1_000);
    this.applySnapshot(this.model.snapshot());
  }

  public startWind(): boolean {
    const started = this.model.startWind();
    if (started) this.applySnapshot(this.model.snapshot());
    return started;
  }

  public requestPage(page: number): boolean {
    const changed = this.model.requestPage(page);
    if (changed) this.applySnapshot(this.model.snapshot());
    return changed;
  }

  public isWindActive(): boolean {
    const snapshot = this.model.snapshot();
    return snapshot.transition !== null || snapshot.currentPage !== 0;
  }

  public setReducedMotion(enabled: boolean): void {
    this.model.setReducedMotion(enabled);
    this.appliedTransitionId = null;
    this.settleOnPage(0);
  }

  public replay(): void {
    this.model.reset();
    this.appliedTransitionId = null;
    this.settleOnPage(0);
  }

  public snapshot(): OutdoorIllustrationWindPagesSnapshot {
    const modelSnapshot = this.model.snapshot();
    const slots = this.slots;
    const first = slots?.[0] ?? null;
    const second = slots?.[1] ?? null;
    const firstOpacity = first ? first.opacity.opacity / 255 : 0;
    const secondOpacity = second ? second.opacity.opacity / 255 : 0;
    return {
      ...modelSnapshot,
      slots: [
        { page: first?.page ?? 0, opacity: firstOpacity },
        { page: second?.page ?? 0, opacity: secondOpacity },
      ],
      opacitySum: firstOpacity + secondOpacity,
    };
  }

  private readonly handleFirstTouch = (): void => {
    this.startWind();
  };

  private buildVisualNodes(stableUpperFrame: SpriteFrame): void {
    this.node.layer = Layers.Enum.UI_2D;
    const rootTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    rootTransform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    rootTransform.setAnchorPoint(0.5, 0.5);

    const stable = this.createSpriteNode("IllustrationStableUpper", stableUpperFrame);
    this.stableSprite = stable.sprite;
    this.node.addChild(stable.node);
    const first = this.createSpriteNode("IllustrationWindPageA", this.frames[0]!);
    const second = this.createSpriteNode("IllustrationWindPageB", this.frames[0]!);
    this.node.addChild(first.node);
    this.node.addChild(second.node);
    first.page = 0;
    second.page = 0;
    first.opacity.opacity = 255;
    second.opacity.opacity = 0;
    this.slots = [first, second];
  }

  private createSpriteNode(name: string, frame: SpriteFrame): PageSlot {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    const transform = node.addComponent(UITransform);
    transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    transform.setAnchorPoint(0.5, 0.5);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    sprite.spriteFrame = frame;
    const opacity = node.addComponent(UIOpacity);
    opacity.opacity = 255;
    return { node, sprite, opacity, page: 0 };
  }

  private applySnapshot(snapshot: OutdoorIllustrationWindPageSnapshot): void {
    const slots = this.slots;
    if (!slots) return;
    const transition = snapshot.transition;
    if (!transition) {
      this.appliedTransitionId = null;
      this.settleOnPage(snapshot.currentPage);
      return;
    }

    if (this.appliedTransitionId !== transition.id) {
      const fromSlotIndex = this.slotIndexForPage(transition.pages[0]);
      this.activeSlotIndex = fromSlotIndex ?? this.activeSlotIndex;
      const fromSlot = slots[this.activeSlotIndex];
      if (fromSlot.page !== transition.pages[0]) {
        fromSlot.page = transition.pages[0];
        fromSlot.sprite.spriteFrame = this.frames[transition.pages[0]]!;
      }
      const targetSlotIndex = (1 - this.activeSlotIndex) as 0 | 1;
      const targetSlot = slots[targetSlotIndex];
      targetSlot.page = transition.pages[1];
      targetSlot.sprite.spriteFrame = this.frames[transition.pages[1]]!;
      this.appliedTransitionId = transition.id;
    }

    const targetSlotIndex = (1 - this.activeSlotIndex) as 0 | 1;
    slots[this.activeSlotIndex].opacity.opacity = Math.round(transition.fromOpacity * 255);
    slots[targetSlotIndex].opacity.opacity = Math.round(transition.toOpacity * 255);
  }

  private settleOnPage(page: OutdoorIllustrationPageIndex): void {
    const slots = this.slots;
    if (!slots) return;
    const matchingSlot = this.slotIndexForPage(page);
    if (matchingSlot !== null) this.activeSlotIndex = matchingSlot;
    const active = slots[this.activeSlotIndex];
    active.page = page;
    active.sprite.spriteFrame = this.frames[page] ?? active.sprite.spriteFrame;
    active.opacity.opacity = 255;
    const inactiveIndex = (1 - this.activeSlotIndex) as 0 | 1;
    slots[inactiveIndex].opacity.opacity = 0;
  }

  private slotIndexForPage(page: OutdoorIllustrationPageIndex): 0 | 1 | null {
    if (this.slots?.[0].page === page) return 0;
    if (this.slots?.[1].page === page) return 1;
    return null;
  }
}
