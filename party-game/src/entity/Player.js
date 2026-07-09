import Phaser from "phaser";

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey) {
    super(scene, x, y, spriteKey);
    this.scene = scene;
    this.scene.add.existing(this);
    this.scene.physics.world.enable(this);
    this.facingLeft = false;
  }

  updateMovement(cursors) {
    if (cursors.left.isDown) {
      if (!this.facingLeft) {
        this.flipX = !this.flipX;
        this.facingLeft = true;
      }
      this.setVelocityX(-360);
      if (this.body.onFloor()) {
        this.anims.play("run", true);
      }
    } else if (cursors.right.isDown) {
      if (this.facingLeft) {
        this.flipX = !this.flipX;
        this.facingLeft = false;
      }
      this.setVelocityX(360);
      if (this.body.onFloor()) {
        this.anims.play("run", true);
      }
    } else if (cursors.up.isDown) {
      this.setVelocityY(-270);
      if (this.body.onFloor()) {
        this.anims.play("run", true);
      }
    } else {
      this.setVelocityX(0);
      this.play("idle");
    }
  }

  updateJump(cursors, jumpSound) {
    if (cursors.up.isDown && this.body.onFloor()) {
      this.setVelocityY(-200);
      jumpSound.play();
    }
  }

  updateInAir() {
    if (!this.body.touching.down) {
      this.play("jump");
    }
  }

  update(cursors, jumpSound) {
    this.updateMovement(cursors);
    this.updateJump(cursors, jumpSound);
    this.updateInAir();
  }
}
