import Phaser from "phaser";
import Align from "../entity/Align.js";
import { SPRITE_CHARS, labelForSprite } from "../characters.js";
import { postToParent } from "../arenaBridge.js";

export default class EndScene extends Phaser.Scene {
  constructor() {
    super("EndScene");
  }

  init(data) {
    this.first = data.first;
    this.second = data.second;
  }

  preload() {
    SPRITE_CHARS.forEach((key) => {
      this.load.spritesheet(key, `assets/spriteSheets/${key}-sheet.png`, {
        frameWidth: 300,
        frameHeight: 300,
        endFrame: 8,
      });
    });
    this.load.image("background", "assets/backgrounds/sky.png");
  }

  create() {
    const bg = this.add.image(0, 0, "background");
    Align.scaleToGame(bg, 1);
    Align.center(bg);

    const style = { fontSize: "32px", fill: "#000" };
    this.add.text(300, 50, `${labelForSprite(this.first).toUpperCase()} WINS!`, style);
    this.add.text(50, 750, "Based on Quarantine Party by Ayse, Patty, Tiffany, Stephanie", {
      fontSize: "18px",
      fill: "#333",
    });

    this.add.sprite(400, 250, this.first).setScale(1);
    if (this.second && this.second !== this.first) {
      this.add.sprite(200, 500, this.second).setScale(0.5);
    }

    const playAgainButton = this.add.text(50, 250, "PLAY AGAIN?", style);
    playAgainButton.setInteractive();
    playAgainButton.on("pointerup", () => {
      postToParent({ type: "playAgain" });
    });
  }
}
