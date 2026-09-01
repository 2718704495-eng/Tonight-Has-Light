export const SHARE_TITLE = "有人给你留了一盏灯";
export const SHARE_ENTRY_QUERY = "entry=left-light";

export interface SharePayload {
  readonly title: typeof SHARE_TITLE;
  readonly query: typeof SHARE_ENTRY_QUERY;
}

export type LaunchIntent =
  | { readonly kind: "normal" }
  | { readonly kind: "shared-welcome"; readonly message: typeof SHARE_TITLE };

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createSharePayload(): SharePayload {
  return {
    title: SHARE_TITLE,
    query: SHARE_ENTRY_QUERY,
  };
}

/**
 * Only the fixed entry marker is consumed. Sender identity, free text and progress
 * are deliberately ignored even if a caller appends them to the launch query.
 */
export function resolveLaunchIntent(query: unknown): LaunchIntent {
  if (isRecord(query) && query.entry === "left-light") {
    return { kind: "shared-welcome", message: SHARE_TITLE };
  }
  return { kind: "normal" };
}

