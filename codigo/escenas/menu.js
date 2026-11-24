class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const { W, H, GROUND, ART } = CONFIG;
    startMusic(this);

    // Escenario: bosque que se mueve despacio y el explorador corriendo
    this.layer = createBgLayer(this, CONFIG.MENU_BG, 0);
    this.add.sprite(95, GROUND + 3, 'pj_correr1').setOrigin(0.5, 1).setScale(ART * 1.15).setDepth(3).play('run');

    // Título
    const title = txt(this, W / 2, 64, 'FOREST DASH', 64, '#fff7d6', '#2d5a1b', 10).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: title, y: 70, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
    txt(this, W / 2, 118, 'Corre por el bosque, salta obstáculos y junta monedas', 18, '#ffffff', '#1b3a24', 4)
      .setOrigin(0.5).setDepth(5);

    // Panel
    const panel = this.add.graphics().setDepth(4);
    panel.fillStyle(0x0b1f12, 0.74).fillRoundedRect(W / 2 - 215, 148, 430, 228, 22);
    panel.lineStyle(3, 0xf2d27a, 0.9).strokeRoundedRect(W / 2 - 215, 148, 430, 228, 22);

    txt(this, W / 2, 176, 'Tu alias (3 a 12 letras o números)', 17, '#f6e7b4', '#0b1f12', 3).setOrigin(0.5).setDepth(5);

    const input = this.add.dom(W / 2, 216, 'input',
      'width:230px;font-size:22px;padding:6px 8px;text-align:center;border-radius:12px;' +
      'border:3px solid #f2d27a;background:#fffbea;color:#2b1d0e;outline:none;');
    input.setDepth(6);
    input.node.maxLength = 12;
    input.node.placeholder = 'Explorador';
    try { input.node.value = localStorage.getItem('alias') || ''; } catch (e) { /* sin storage */ }

    this.err = txt(this, W / 2, 252, '', 16, '#ff9a90', '#0b1f12', 3).setOrigin(0.5).setDepth(5);

    const go = () => {
      const alias = input.node.value.trim();
      if (!Cloud.validAlias(alias)) {
        this.err.setText('Alias inválido: usa de 3 a 12 letras o números');
        return;
      }
      try { localStorage.setItem('alias', alias); } catch (e) { /* sin storage */ }
      this.scene.start('Game', { alias });
    };
    input.node.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });

    makeButton(this, W / 2 - 100, 305, 'JUGAR', go, { w: 180 });
    makeButton(this, W / 2 + 100, 305, 'RANKING', () => this.scene.start('Results', {}), { w: 180 });

    txt(this, W / 2, 344, 'Espacio / clic / toque: saltar  ·  P: pausa  ·  M: sonido', 13, '#cfe8d0', '#0b1f12', 3)
      .setOrigin(0.5).setDepth(5);
    txt(this, W / 2, 363, 'Pisa a las ranas  ·  Sube a las bases cuando el suelo tenga púas o lava', 13, '#ffe9a8', '#0b1f12', 3)
      .setOrigin(0.5).setDepth(5);
  }

  update(_, delta) {
    this.layer.move(110 * delta / 1000);
  }
}
