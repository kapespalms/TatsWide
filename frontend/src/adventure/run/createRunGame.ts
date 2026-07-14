import Phaser from 'phaser';
import { AdventureRunScene, type AdventureRunInit } from './AdventureRunScene';

export function createRunGame(parent: HTMLElement, initData: AdventureRunInit): Phaser.Game {
  class BootScene extends Phaser.Scene {
    constructor() {
      super('BootScene');
    }
    create() {
      this.scene.start('AdventureRunScene', initData);
    }
  }

  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width: 1280,
    height: 720,
    backgroundColor: '#5ca4ff',
    input: { gamepad: true },
    fps: { target: 60, forceSetTimeOut: false },
    disableContextMenu: true,
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
      powerPreference: 'high-performance',
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [BootScene, AdventureRunScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
