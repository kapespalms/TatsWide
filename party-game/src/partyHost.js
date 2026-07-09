import { isSoloMode } from "./arenaBridge.js";

let hostInstance = null;

export function getPartyHost() {
  return hostInstance;
}

/**
 * Authoritative party logic, ported from Quarantine Party's Express/Socket.IO
 * server (src/server.js). Runs identically on every client; results are pushed
 * to the local scenes via socket.local(). Cross-client sync happens by relaying
 * the raw client emits (see arenaSocketShim + arenaBridge).
 */
export function createPartyHost(socket) {
  if (hostInstance) return hostInstance;

  const state = { puzzleCount: 0, playerHitByBombsCount: 0 };

  function local(event, ...args) {
    socket.local(event, ...args);
  }

  const host = {
    reset() {
      state.puzzleCount = 0;
      state.playerHitByBombsCount = 0;
    },

    handleClientEvent(fromRole, event, args) {
      switch (event) {
        case "diceRoll": {
          const rolledNum = args[0];
          const charName = args[1];
          local("moveCharOnBoard", rolledNum, charName);
          local("unshiftQueue");
          local("updateDice", rolledNum);
          break;
        }
        case "placeOnBoard":
          local("placedOnBoard", args[0], args[1]);
          break;
        case "changeQueuePrompt":
          local("changeQueuePrompt", args[0]);
          break;
        case "startMinigame":
          local("minigameStarted", args[0]);
          break;
        case "resetTPgame":
          state.playerHitByBombsCount = 0;
          break;
        case "playerHit": {
          state.playerHitByBombsCount += 1;
          const total = isSoloMode() ? 1 : 2;
          local("updatedPlayersHit", state.playerHitByBombsCount, total, args[0]);
          break;
        }
        case "gameOver":
          local("gameOverClient");
          break;
        case "scoredTP": {
          const score = (args[1] || 0) + 10;
          local("updateScores", args[0], score);
          break;
        }
        case "quitPuzzle":
          state.puzzleCount = 0;
          local("fromPuzzleToBoard");
          break;
        case "wonPuzzle":
          state.puzzleCount = 0;
          local("fromPuzzleToBoard");
          local("wonMinigame");
          break;
        default:
          break;
      }
    },
  };

  hostInstance = host;
  return host;
}
