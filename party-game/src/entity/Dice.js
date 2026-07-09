import Phaser from "phaser";

export default class Dice extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene = scene;
    this.scene.add.existing(this);
    this.clicks = 0;
    this.rolledNum = 0;
  }

  roll() {
    this.rolledNum = Math.ceil(Math.random() * 6);
    this.anims.play(`${this.rolledNum}`);
    this.clicks += 1;
  }

  resetDice() {
    this.anims.play("reset");
  }
}
