/** Map arena mascot ids to Quarantine Party sprite keys. */
export const CHAR_SPRITE = {
  tats: "ayse",
  wideass: "patty",
};

export const SPRITE_CHARS = ["ayse", "patty"];

export const CHAR_LABEL = {
  ayse: "Tats",
  patty: "Wideass",
};

export function spriteForArenaChar(char) {
  return CHAR_SPRITE[char === "wideass" ? "wideass" : "tats"] || "ayse";
}

export function labelForSprite(sprite) {
  return CHAR_LABEL[sprite] || sprite;
}

export function capitalizeFirst(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
