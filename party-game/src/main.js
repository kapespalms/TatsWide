import Phaser from "phaser";
import { keys, scenes } from "./scenes/index.js";
import { initArenaBridge } from "./arenaBridge.js";
import { getSocket } from "./arenaSocketShim.js";
import { createPartyHost } from "./partyHost.js";
import config from "./config/config.js";

class Game extends Phaser.Game {
  constructor() {
    super(config);
    for (let i = 0; i < keys.length; i++) {
      this.scene.add(keys[i], scenes[i]);
    }
    this.arenaBooted = false;
  }

  startArenaBoot() {
    if (this.arenaBooted) return;
    this.arenaBooted = true;
    const socket = getSocket();
    createPartyHost(socket);
    this.scene.start("ArenaBootScene");
  }
}

function bootGame() {
  window.game = new Game();
}

initArenaBridge(function () {
  if (window.game) window.game.startArenaBoot();
});

bootGame();
