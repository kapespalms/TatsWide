import { create } from "zustand";

export const useGameStore = create((set) => ({
  playerPosition: null,
  setPlayerPosition: (position) => set({ playerPosition: position }),
  speed: null,
  setSpeed: (speed) => set({ speed: speed }),
  flamePositions: null,
  setFlamePositions: (positions) => set({ flamePositions: positions }),
  boostPower: 0,
  setBoostPower: (power) => set({ boostPower: power }),
  isBoosting : false,
  setIsBoosting: (isBoosting) => set({ isBoosting }),
  driftLevel: null,
  setDriftLevel: (level) => set({ driftLevel: level }),
  groundPosition: null,
  setGroundPosition: (groundPosition) => set({groundPosition: groundPosition}),
  wheelPositions: null,
  setWheelPositions: (wheelPositions) => set({wheelPositions: wheelPositions}),
  body: null,
  setBody: (body) => set({body: body}),
  joystick: {x: 0, y: 0, distance: 0},
  setJoystick: (joystick) => set({ joystick: joystick }),
  jumpButtonPressed: false,
  setJumpButtonPressed: (pressed) => set({ jumpButtonPressed: pressed }),
  noiseTexture: null,
  setNoiseTexture: (noiseTexture) => set({noiseTexture: noiseTexture}),
  gamepad: null,
  setGamepad: (gamepad) => set({gamepad: gamepad}),
  isOnDirt:null,
  setIsOnDirt: (isOnDirt) => set({isOnDirt: isOnDirt}),
  // Collision system
  collider: null,
  setCollider: (collider) => set({ collider }),
  trackScene: null,
  setTrackScene: (trackScene) => set({ trackScene }),

  // Race progress
  lap: 1,
  totalLaps: 3,
  setLap: (lap) => set({ lap }),
  setTotalLaps: (totalLaps) => set({ totalLaps }),
  finished: false,
  setFinished: (finished) => set({ finished }),
  raceTime: 0,
  setRaceTime: (raceTime) => set({ raceTime }),

  // Coins
  coins: 0,
  addCoins: (n) => set((state) => ({ coins: state.coins + n })),

  // Speed boost (from prize boxes / coins)
  boostEndsAt: 0,
  triggerBoost: (ms) =>
    set(() => ({ boostEndsAt: Date.now() + ms })),

  // Transient HUD flash (e.g. "BOOST!", "+1 coin")
  itemFlash: null,
  setItemFlash: (itemFlash) => set({ itemFlash }),

  resetRace: () =>
    set({ lap: 1, finished: false, coins: 0, boostEndsAt: 0, itemFlash: null, raceTime: 0 }),
}));
