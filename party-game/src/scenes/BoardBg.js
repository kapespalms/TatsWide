import Phaser from "phaser";
import { socket } from "../arenaSocketShim.js";
import Align from "../entity/Align.js";
import { capitalizeFirst, labelForSprite } from "../characters.js";

export default class BoardBg extends Phaser.Scene {
  constructor() {
    super("BoardBg");
    this.walkablePath = [
      [0, 0], [0, 1], [0, 2], [0, 3, "tp"],
      [0, 4], [0, 5], [1, 5], [2, 5, "tp"],
      [2, 4], [2, 3], [2, 2], [3, 2],
      [4, 2], [4, 1, "puzzle"], [5, 1], [6, 1],
      [6, 2], [6, 3, "puzzle"], [6, 4], [6, 5],
      [5, 5], [4, 5], [4, 6], [4, 7],
    ];
    this.characterIndexes = { ayse: 68, patty: 69 };
    this.charPosition = {};
    this.distanceToEnd = {};
  }

  init(data) {
    this.queue = data.queue;
    this.player = data.player;
    this.otherPlayers = data.otherPlayers;
  }

  preload() {
    this.load.image("sky", "assets/backgrounds/sky.png");
    this.load.json("map", "assets/backgrounds/final_boardCSV.json");
    this.load.spritesheet("tiles", "assets/spriteSheets/boardWChars.png", {
      frameWidth: 128,
      frameHeight: 128,
    });
  }

  create() {
    const sky = this.add.image(0, 0, "sky");
    Align.scaleToGame(sky, 1);
    Align.center(sky);

    this.data = this.cache.json.get("map");
    this.tileWidthHalf = this.data.tilewidth / 2;
    this.tileHeightHalf = this.data.tileheight / 2;
    this.mapheight = 8;
    this.mapwidth = 8;
    this.centerX = this.mapwidth * this.tileWidthHalf + 50;
    this.centerY = 80;

    this.buildMap();

    const label0 = labelForSprite(this.queue[0]);
    this.queuePrompt = this.add.text(700, 16, `${label0} starts! Click the dice…`, {
      fontFamily: "Verdana",
      fontSize: 32,
      fill: "#FFF",
      stroke: "#000000",
      strokeThickness: 4,
    });

    this.currentLeader = this.add.text(50, 16, `${label0} is in the lead!`, {
      fontFamily: "Verdana",
      fontSize: 32,
      fill: "#FFF",
      stroke: "#000000",
      strokeThickness: 4,
    });

    socket.emit("placeOnBoard", 0, this.queue[0]);

    socket.on("placedOnBoard", (rolledNum, charName) => {
      this.moveCharacter(rolledNum, charName);
    });

    socket.on("moveCharOnBoard", (rolledNum, charName) => {
      this.moveCharacter(rolledNum, charName);
      socket.emit("unshiftQueue");
      if (this.queue.length > 1 && typeof this.charPosition[this.queue[1]] === "undefined") {
        socket.emit("placeOnBoard", 0, this.queue[1]);
      }
    });

    socket.on("changeQueuePrompt", (currentPlayer) => {
      const queuePromptStyling = {
        fontFamily: "Verdana",
        fontSize: 32,
        fill: "#FFF",
        stroke: "#000000",
        strokeThickness: 4,
      };
      this.queuePrompt.destroy();
      this.queuePrompt = this.add.text(
        700,
        16,
        `${labelForSprite(currentPlayer)}'s turn! Click the Dice`,
        queuePromptStyling
      );

      const lowestNum = Math.min(...Object.values(this.distanceToEnd));
      const nameCurrent = this.queue.find((name) => this.distanceToEnd[name] === lowestNum);
      this.currentLeader.destroy();
      this.currentLeader = this.add.text(
        50,
        16,
        `${labelForSprite(nameCurrent)} is in the lead!`,
        queuePromptStyling
      );
    });
  }

  buildMap() {
    for (let i = 0; i < this.data.layers.length; i++) {
      const layer = this.data.layers[i].data;
      let j = 0;
      for (let y = 0; y < this.mapheight; y++) {
        for (let x = 0; x < this.mapwidth; x++) {
          const id = layer[j] - 1;
          if (id >= 0) {
            const tx = (x - y) * this.tileWidthHalf;
            const ty = (x + y) * this.tileHeightHalf;
            const tile = this.add.image(this.centerX + tx, this.centerY + ty, "tiles", id);
            tile.depth = this.centerY + ty;
          }
          j++;
        }
      }
    }
  }

  moveCharacter(idx, charName) {
    const charExists = typeof this.charPosition[charName] !== "undefined";
    const prevIdx = charExists ? this.charPosition[charName].prevIndex : 0;

    if (prevIdx + idx >= this.walkablePath.length - 1) {
      const notWinners = this.queue.filter((name) => name !== charName);
      const playerPlaces = {
        first: charName,
        second: notWinners[0] || charName,
      };
      this.scene.stop("BoardBg");
      this.scene.stop("BoardDice");
      this.scene.start("EndScene", playerPlaces);
      return;
    }

    const x = this.walkablePath[idx + prevIdx][0];
    const y = this.walkablePath[idx + prevIdx][1];
    const tx = (x - y) * this.tileWidthHalf;
    const ty = (x + y) * this.tileHeightHalf;

    if (charExists) {
      this.charPosition[charName].destroy();
      delete this.charPosition[charName];
    }

    const movedChar = this.add.image(
      this.centerX + tx,
      this.centerY + ty,
      "tiles",
      this.characterIndexes[charName]
    );
    movedChar.depth = this.centerY + ty;
    movedChar.prevIndex = prevIdx + idx;
    this.distanceToEnd[charName] = this.walkablePath.length - movedChar.prevIndex;
    this.charPosition[charName] = movedChar;

    if (charExists && this.walkablePath[this.charPosition[charName].prevIndex].length === 3) {
      const coin = this.walkablePath[this.charPosition[charName].prevIndex][2];
      socket.emit("startMinigame", coin);
    }
  }
}
