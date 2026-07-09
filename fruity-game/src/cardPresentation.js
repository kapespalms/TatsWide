/** Off-center deck on the board — visible when camera pans for card draw. */
export const CARD_DECK_POS = [5.4, 0.55, 2.2];

export const CARD_PRESENT_MS = {
  approach: 950,
  flip: 1600,
};

export function cardPresentTotalMs() {
  return CARD_PRESENT_MS.approach + CARD_PRESENT_MS.flip;
}
