export const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;

export const ENTRANCE_DURATION_S = 0.4;
export const ENTRANCE_Y = 8;
export const ENTRANCE_REDUCE_DURATION_S = 0.2;

export const ENTRANCE_DELAYS_MS = {
  topBar: 0,
  hero: 60,
  modelRows: 120,
  modelRowStagger: 30,
  panelSystem: 200,
  panelExamples: 260,
  panelUser: 320,
  panelReply: 380,
  compareHeadline: 60,
  compareSubline: 90,
  compareTable: 120,
  compareTableRowStagger: 30,
  comparePanel: 200,
  compareFooter: 260,
} as const;

export const SHARE_BAR_DELAY_S = 0.45;
export const SHARE_BAR_DURATION_S = 0.6;
export const SHARE_BAR_UPDATE_DURATION_S = 0.3;

export const PAGE_READY_TIMEOUT_MS = 1_200;

/** Time after pageReady until share-bar entrance is considered finished. */
export function entranceCompleteMs(reducedMotion: boolean): number {
  if (reducedMotion) return ENTRANCE_REDUCE_DURATION_S * 1000;
  return (SHARE_BAR_DELAY_S + SHARE_BAR_DURATION_S) * 1000;
}