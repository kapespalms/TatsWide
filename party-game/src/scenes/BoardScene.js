import Phaser from "phaser";
import { socket } from "../arenaSocketShim.js";

export default class BoardScene extends Phaser.Scene {
  constructor() {
    super("BoardScene");
    this.miniActive = false;
  }

  init(data) {
    this.queue = data.queue;
    this.player = data.player;
    this.otherPlayers = data.otherPlayers;
  }

  create() {
    this.miniActive = false;
    this.scene.launch("BoardBg", {
      queue: this.queue,
      player: this.player,
      otherPlayers: this.otherPlayers,
    });
    this.scene.launch("BoardDice", { queue: this.queue, player: this.player });

    socket.on("minigameStarted", (coin) => {
      if (this.miniActive) return;
      this.miniActive = true;
      this.scene.sleep("BoardBg").sleep("BoardDice");
      const dataForMiniGames = {
        player: this.player,
        otherPlayers: this.otherPlayers,
      };
      if (coin === "tp") {
        this.scene.run("TPScene", dataForMiniGames);
      }
      if (coin === "puzzle") {
        this.scene.run("PuzzleScene", dataForMiniGames);
      }
    });

    socket.on("gameOverClient", () => {
      this.miniActive = false;
    });
    socket.on("fromPuzzleToBoard", () => {
      this.miniActive = false;
    });
  }
}
