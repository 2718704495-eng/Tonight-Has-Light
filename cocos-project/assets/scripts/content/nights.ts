import {
  DURATION_OPTIONS,
  NIGHT_IDS,
  type NightDefinition,
  type NightId,
} from "../domain/contracts.ts";

export const NIGHT_DEFINITIONS: readonly NightDefinition[] = [
  {
    id: "night-01",
    sequence: 1,
    title: "水快开了",
    assetBundle: "main",
    coreRitual: {
      id: "bring-light-to-kettle",
      prompt: "把这点暖光，带到壶边。",
      accessibilityAction: "先轻触暖光，再轻触水壶，也可以完成。",
    },
    ambientInteractions: [
      {
        id: "wipe-window-mist",
        prompt: "窗上起雾了。",
        completionHint: "月亮露出了一小块。",
      },
      {
        id: "touch-chair-scarf",
        prompt: "围巾还搭在椅背上。",
        completionHint: "它慢慢垂了下来。",
      },
    ],
    durationModes: DURATION_OPTIONS,
    endingLines: ["水热了。", "你也先缓一会儿。"],
  },
  {
    id: "night-02",
    sequence: 2,
    title: "被子里面",
    assetBundle: "night-02",
    coreRitual: {
      id: "unfold-blanket",
      prompt: "把毯子慢慢展开。",
      accessibilityAction: "依次轻触两个毯角，也可以把毯子展开。",
    },
    ambientInteractions: [
      {
        id: "press-pillow",
        prompt: "枕头还没有躺平。",
        completionHint: "枕面慢慢回弹了。",
      },
      {
        id: "touch-fireplace-ash",
        prompt: "柴灰里还留着一点暗红。",
        completionHint: "它亮了一下，又安静下来。",
      },
    ],
    durationModes: DURATION_OPTIONS,
    endingLines: ["外面很冷。", "这里够暖。"],
  },
  {
    id: "night-03",
    sequence: 3,
    title: "雾窗上的月亮",
    assetBundle: "night-03",
    coreRitual: {
      id: "clear-window-mist",
      prompt: "擦开一点雾，看看外面。",
      accessibilityAction: "连续轻触三个雾点，也可以擦出月亮。",
    },
    ambientInteractions: [
      {
        id: "open-curtain-gap",
        prompt: "窗帘还可以再打开一点。",
        completionHint: "远处的屋灯露出来了。",
      },
      {
        id: "follow-window-drop",
        prompt: "有颗水珠走得很慢。",
        completionHint: "暖光在里面折了一下。",
      },
    ],
    durationModes: DURATION_OPTIONS,
    endingLines: ["雪下得很慢。", "我们也是。"],
  },
  {
    id: "night-04",
    sequence: 4,
    title: "一盏灯就够了",
    assetBundle: "night-04",
    coreRitual: {
      id: "turn-off-extra-lights",
      prompt: "留下桌边这一盏，就够了。",
      accessibilityAction: "轻触远处的灯，也可以逐盏关掉。",
    },
    ambientInteractions: [
      {
        id: "touch-wall-shadow",
        prompt: "墙上的影子还在轻轻晃。",
        completionHint: "桌边的光没有动，影子先停了。",
      },
      {
        id: "nudge-chair",
        prompt: "椅子离桌边还有一点远。",
        completionHint: "它轻响一下，又回到原处。",
      },
    ],
    durationModes: DURATION_OPTIONS,
    endingLines: ["这边，", "还留着一点位置。"],
  },
  {
    id: "night-05",
    sequence: 5,
    title: "晚一点回来的人",
    assetBundle: "night-05",
    coreRitual: {
      id: "open-door-for-late-arrival",
      prompt: "外面有脚步。把门打开吧。",
      accessibilityAction: "依次轻触门闩与门板，也可以把门打开。",
    },
    ambientInteractions: [
      {
        id: "settle-doormat",
        prompt: "门边地毯翘起了一角。",
        completionHint: "它慢慢落平了。",
      },
      {
        id: "touch-distant-window-light",
        prompt: "窗外还有一盏很远的灯。",
        completionHint: "它和屋里的光错开亮了一次。",
      },
    ],
    durationModes: DURATION_OPTIONS,
    endingLines: ["晚一点也没关系。", "灯还在。"],
  },
];

const NIGHT_BY_ID = new Map(NIGHT_DEFINITIONS.map((night) => [night.id, night] as const));

export function getNightDefinition(nightId: NightId): NightDefinition {
  const definition = NIGHT_BY_ID.get(nightId);
  if (!definition) {
    throw new Error(`Unknown night definition: ${nightId}`);
  }
  return definition;
}

export function getNextNightId(nightId: NightId): NightId | null {
  const index = NIGHT_IDS.indexOf(nightId);
  return NIGHT_IDS[index + 1] ?? null;
}

export function validateNightDefinitions(
  definitions: readonly NightDefinition[] = NIGHT_DEFINITIONS,
): readonly string[] {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const seenInteractionIds = new Set<string>();

  if (definitions.length !== NIGHT_IDS.length) {
    errors.push(`Expected ${NIGHT_IDS.length} nights, received ${definitions.length}.`);
  }

  definitions.forEach((night, index) => {
    const expectedId = NIGHT_IDS[index];
    if (night.id !== expectedId || night.sequence !== index + 1) {
      errors.push(`Night at index ${index} is not in the required linear order.`);
    }
    if (seenIds.has(night.id)) {
      errors.push(`Duplicate night id: ${night.id}.`);
    }
    seenIds.add(night.id);

    if (night.durationModes.join(",") !== DURATION_OPTIONS.join(",")) {
      errors.push(`${night.id} must expose only the 3/5/8 minute modes.`);
    }
    if (night.ambientInteractions.length !== 2) {
      errors.push(`${night.id} must have exactly two ambient interactions.`);
    }
    if (night.endingLines.length < 1 || night.endingLines.length > 2) {
      errors.push(`${night.id} must end with one or two short lines.`);
    }

    [night.coreRitual, ...night.ambientInteractions].forEach((interaction) => {
      if (seenInteractionIds.has(interaction.id)) {
        errors.push(`Duplicate interaction id: ${interaction.id}.`);
      }
      seenInteractionIds.add(interaction.id);
    });
  });

  return errors;
}
