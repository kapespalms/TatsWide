import Dice from "../entity/Dice.js";
import { socket } from "../arenaSocketShim.js";

export default class BoardDice extends Phaser.Scene {
  constructor() {
    super("BoardDice");
  }

  init(data) {
    this.queue = data.queue;
    this.player = data.player;
  }

  preload() {
    this.load.spritesheet("dice", "assets/spriteSheets/dice.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  diceRollAnimations() {
    this.anims.create({
      key: "roll",
      frames: this.anims.generateFrameNumbers("dice", { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1,
    });
    for (let i = 1; i <= 6; i++) {
      this.anims.create({
        key: String(i),
        frames: [{ key: "dice", frame: i - 1 }],
        frameRate: 10,
      });
    }
  }

  create() {
    this.dice = new Dice(this, 900, 100, "dice").setScale(1.75);
    this.disableDice();
    if (this.player && this.player.name === this.queue[0]) {
      this.enableDice();
    }

    socket.on("unshiftQueue", () => {
      this.unshiftQueue();
      socket.emit("changeQueuePrompt", this.queue[0]);
      if (this.player && this.player.name === this.queue[0]) {
        this.enableDice();
      } else {
        this.disableDice();
      }
    });

    this.diceRollAnimations();
    this.dice.on("pointerup", () => {
      this.rollDice();
    });

    socket.on("updateDice", (rolledNum) => {
      this.dice.anims.play(String(rolledNum));
    });
  }

  enableDice() {
    this.dice.setInteractive();
  }

  disableDice() {
    this.dice.disableInteractive();
  }

  unshiftQueue() {
    if (this.queue.length > 1) {
      this.queue.push(this.queue.shift());
    }
  }

  rollDice() {
    this.dice.roll();
    socket.emit("diceRoll", this.dice.rolledNum, this.player.name);
    this.disableDice();
  }
}
