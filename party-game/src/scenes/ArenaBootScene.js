import Phaser from "phaser";
import { getArenaConfig } from "../arenaBridge.js";
import { spriteForArenaChar, SPRITE_CHARS } from "../characters.js";

export default class ArenaBootScene extends Phaser.Scene {
  constructor() {
    super("ArenaBootScene");
  }

  preload() {
    SPRITE_CHARS.forEach((key) => {
      this.load.spritesheet(key, `assets/spriteSheets/${key}-sheet.png`, {
        frameWidth: 300,
        frameHeight: 300,
        endFrame: 8,
      });
    });
    this.load.image("picBg", "assets/backgrounds/introBg.png");
    this.load.audio("backgroundmusic", "assets/audio/backgroundmusic.wav");
  }

  create() {
    try {
      const music = this.sound.add("backgroundmusic");
      music.play();
      music.setVolume(0.2);
      music.setLoop(true);
    } catch (e) {
      /* audio autoplay may be blocked until interaction */
    }

    const cfg = getArenaConfig() || {};
    const mySprite = spriteForArenaChar(cfg.driver);
    let peerSprite = !cfg.solo && cfg.peer ? spriteForArenaChar(cfg.peer) : null;
    // Board logic distinguishes players by sprite key; keep them distinct.
    if (peerSprite && peerSprite === mySprite) {
      peerSprite = mySprite === "ayse" ? "patty" : "ayse";
    }

    // Canonical, cross-client-consistent turn order: host first, then joiner.
    const hostSprite = cfg.isHost ? mySprite : peerSprite;
    const joinSprite = cfg.isHost ? peerSprite : mySprite;
    const queue = joinSprite ? [hostSprite, joinSprite] : [hostSprite];

    const player = { name: mySprite };
    const otherName = cfg.isHost ? joinSprite : hostSprite;
    const otherPlayers = peerSprite ? [{ name: otherName }] : [];

    this.scene.start("BoardScene", { queue: queue, player: player, otherPlayers: otherPlayers });
  }
}
