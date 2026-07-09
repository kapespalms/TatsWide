import { useEffect } from "react";
import { useBoardStore } from "./store.js";
import { CARD_PRESENT_MS } from "./cardPresentation.js";

/** After a move lands on a card tile: piece pause → deck flip → show card UI. */
export function useCardPresentation() {
  const phase = useBoardStore((s) => s.phase);
  const isMoving = useBoardStore((s) => s.isMoving);
  const activeCard = useBoardStore((s) => s.activeCard);
  const cardFor = useBoardStore((s) => s.cardFor);
  const cardKey =
    phase === "card" && activeCard
      ? (activeCard.id || activeCard.prompt || "card") + ":" + cardFor
      : null;

  useEffect(() => {
    if (phase !== "card" || isMoving || !activeCard || !cardKey) {
      useBoardStore.setState({ cardPresentStep: null });
      return;
    }

    useBoardStore.setState({ cardPresentStep: "approach" });

    const flipTimer = setTimeout(() => {
      useBoardStore.setState({ cardPresentStep: "flip" });
    }, CARD_PRESENT_MS.approach);

    const readyTimer = setTimeout(() => {
      useBoardStore.setState({ cardPresentStep: "ready" });
    }, CARD_PRESENT_MS.approach + CARD_PRESENT_MS.flip);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(readyTimer);
    };
  }, [phase, isMoving, activeCard, cardFor, cardKey]);
}
