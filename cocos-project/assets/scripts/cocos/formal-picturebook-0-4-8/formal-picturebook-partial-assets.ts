export const FORMAL_PICTUREBOOK_PARTIAL_BUNDLE_NAME = "formal-picturebook-partial-0-4-8";

export const FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS = {
  pages: {
    root: "root/root-wind-hem-r4/spriteFrame",
    "stargaze-f1": "stargaze/f1/spriteFrame",
    "stargaze-f2": "stargaze/f2/spriteFrame",
    "stargaze-f3": "stargaze/f3/spriteFrame",
    "stargaze-f4": "stargaze/f4/spriteFrame",
    "stargaze-f5": "stargaze/f5/spriteFrame",
    "home-h1": "home/h1/spriteFrame",
    "home-h2": "home/h2/spriteFrame",
    "home-h3": "home/h3/spriteFrame",
    "home-h4": "home/h4/spriteFrame",
    "home-h5": "home/h5/spriteFrame",
  },
  h4Feedback: {
    ate: "home/h4-ate/spriteFrame",
    sipped: "home/h4-sipped/spriteFrame",
  },
} as const;

export type FormalPicturebookPageId = keyof typeof FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.pages;
export type FormalPicturebookH4FeedbackId = keyof typeof FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.h4Feedback;

export function formalPicturebookResourcePath(pageId: FormalPicturebookPageId): string {
  return FORMAL_PICTUREBOOK_PARTIAL_RESOURCE_PATHS.pages[pageId];
}

