window.addEventListener('load', () => {
  const start = () => new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: CONFIG.W,
    height: CONFIG.H,
    backgroundColor: '#0f1f16',
    dom: { createContainer: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BootScene, MenuScene, GameScene, ResultsScene]
  });

  // Espera (máx. 1.5 s) a que cargue la tipografía para que los textos salgan bien desde el inicio
  const fontReady = (document.fonts && document.fonts.load)
    ? Promise.race([document.fonts.load('bold 32px Fredoka'), new Promise(r => setTimeout(r, 1500))])
    : Promise.resolve();
  fontReady.catch(() => {}).then(start);
});
