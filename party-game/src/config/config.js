const config = {
  title: "Arena Party",
  type: Phaser.AUTO,
  width: 1280,
  height: 800,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 800,
  },
  dom: {
    createContainer: true,
  },
  render: {
    pixelArt: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
};

export default config;
