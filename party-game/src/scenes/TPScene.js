import Phaser from "phaser";
import { socket } from "../arenaSocketShim.js";
import Player from "../entity/Player.js";
import { SPRITE_CHARS, labelForSprite } from "../characters.js";
import { isSoloMode } from "../arenaBridge.js";

export default class TPScene extends Phaser.Scene {
  constructor() {
    super("TPScene");
    this.gameOver = false;
    this.clientScore = { ayse: 0, patty: 0 };
    this.updateScore = false;
    this.collectTP = this.collectTP.bind(this);
    this.hitBomb = this.hitBomb.bind(this);
  }

  preload() {
    SPRITE_CHARS.forEach((key) => {
      this.load.spritesheet(key, `assets/spriteSheets/${key}-sheet.png`, {
        frameWidth: 300,
        frameHeight: 300,
        endFrame: 8,
      });
    });
    this.load.image("sky2", "assets/minigameTP/sky.png");
    this.load.image("platform", "assets/minigameTP/platform.png");
    this.load.image("tp", "assets/minigameTP/tp.png");
    this.load.image("bomb", "assets/minigameTP/bomb.png");
    this.load.audio("jump", "assets/audio/jump.wav");
  }

  createAnimations(name) {
    this.anims.create({
      key: "run",
      frames: this.anims.generateFrameNumbers(name, { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "idle",
      frames: [{ key: name, frame: 0 }],
      frameRate: 20,
    });
    this.anims.create({
      key: "jump",
      frames: [{ key: name, frame: 3 }],
      frameRate: 20,
    });
  }

  create(data) {
    const passedDataPlayer = data.player;
    const passedDataOtherPlayers = data.otherPlayers || [];

    this.player = new Player(this, 100, 400, passedDataPlayer.name);
    this.player.setScale(0.5).setCollideWorldBounds(true).setBounce(0.2);
    this.createAnimations(passedDataPlayer.name);
    this.player.name = passedDataPlayer.name;

    const otherPlayersArr = [];
    passedDataOtherPlayers.slice(0, 1).forEach((op, i) => {
      const otherPlayer = new Player(this, 900 + i * 150, 50, op.name).setScale(0.35);
      otherPlayer.body.enable = false;
      otherPlayer.displayName = op.name;
      otherPlayersArr.push(otherPlayer);
      this.createAnimations(op.name);
    });

    socket.on("updatedPlayersHit", (count, totalPlayers, playerHit) => {
      otherPlayersArr.forEach((player) => {
        if (player.displayName === playerHit.name) {
          player.setTint(0xff0000);
        }
      });

      if (count >= totalPlayers - 1 || (isSoloMode() && count >= 1)) {
        this.physics.pause();
        this.add.text(250, 150, "Game Over!", { fontSize: "32px", fill: "#FFF" });
        this.clientScore = { ayse: 0, patty: 0 };
        socket.emit("gameOver");
        socket.emit("resetTPgame");
        return;
      }
    });

    socket.on("gameOverClient", () => {
      this.scene.stop("TPScene");
      this.scene.wake("BoardBg");
      this.scene.wake("BoardDice");
      this.scene.wake("BoardScene");
    });

    socket.on("updateScores", (playerWhoScored, score) => {
      this.clientScore[playerWhoScored] = score;
      if (this.score1) this.score1.destroy();
      if (this.score2) this.score2.destroy();
      this.updateScore = true;
    });

    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(0, 250, "platform");
    this.platforms.create(100, 600, "platform");
    this.platforms.create(800, 500, "platform");
    this.platforms.create(1200, 250, "platform");
    this.platforms.create(200, 800, "platform");
    this.platforms.create(400, 800, "platform");
    this.platforms.create(800, 800, "platform");
    this.platforms.create(1200, 800, "platform");

    this.cursors = this.input.keyboard.createCursorKeys();
    this.jumpSound = this.sound.add("jump");

    this.toiletpaper = this.physics.add.group({
      key: "tp",
      repeat: 17,
      setXY: { x: 12, y: 0, stepX: 70 },
    });
    this.toiletpaper.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      child.setCollideWorldBounds(true);
    });

    this.bombs = this.physics.add.group();
    this.scoreStyle = { fontSize: "24px", fill: "#FFF" };
    this.add.text(16, 16, "Character   Score", this.scoreStyle);
    this.score1 = this.add.text(16, 36, `  ${labelForSprite("ayse")} :  ${this.clientScore.ayse}`, this.scoreStyle);
    this.score2 = this.add.text(16, 56, `  ${labelForSprite("patty")} :  ${this.clientScore.patty}`, this.scoreStyle);

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.toiletpaper, this.platforms);
    this.physics.add.collider(this.bombs, this.platforms);
    this.physics.add.overlap(this.player, this.toiletpaper, this.collectTP, null, this);
    this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);

    this.instructions = this.add.text(350, 150, "Collect toilet paper! Avoid the virus!", {
      fontSize: "24px",
      fill: "#FFF",
    });
  }

  update() {
    if (this.updateScore) {
      if (this.score1) this.score1.destroy();
      if (this.score2) this.score2.destroy();
      this.score1 = this.add.text(16, 36, `  ${labelForSprite("ayse")} :  ${this.clientScore.ayse}`, this.scoreStyle);
      this.score2 = this.add.text(16, 56, `  ${labelForSprite("patty")} :  ${this.clientScore.patty}`, this.scoreStyle);
      this.updateScore = false;
    }
    this.player.update(this.cursors, this.jumpSound);
  }

  collectTP(player, toiletpaper) {
    toiletpaper.disableBody(true, true);
    const name = this.player.name;
    socket.emit("scoredTP", name, this.clientScore[name]);

    if (this.toiletpaper.countActive(true) === 0) {
      this.toiletpaper.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });
      const x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
      this.bomb = this.bombs.create(x, 16, "bomb");
      this.bomb.setBounce(1);
      this.bomb.setCollideWorldBounds(true);
      this.bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      this.bomb.allowGravity = false;
    }
  }

  hitBomb(player, bomb) {
    bomb.destroy();
    this.physics.pause();
    player.setTint(0xff0000);
    socket.emit("playerHit", player);
    this.instructions.destroy();
    this.add.text(350, 150, "You caught the virus!", { fontSize: "24px", fill: "#FFF" });
    this.add.text(350, 200, "Please wait for the other player to finish.", { fontSize: "24px", fill: "#FFF" });
  }
}
