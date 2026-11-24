// Carga todas las imágenes y crea las animaciones
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const { W, H } = CONFIG;
    this.cameras.main.setBackgroundColor('#0f1f16');
    this.add.text(W / 2, H / 2 - 34, 'Cargando el bosque...', {
      fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#9fe3a6'
    }).setOrigin(0.5);
    this.add.graphics().fillStyle(0x0b1f12, 1).fillRoundedRect(W / 2 - 170, H / 2, 340, 22, 11);
    const bar = this.add.graphics();
    this.load.on('progress', v => {
      bar.clear().fillStyle(0x4cc36b, 1).fillRoundedRect(W / 2 - 166, H / 2 + 4, 332 * v, 14, 7);
    });
    this.load.on('loaderror', f => console.warn('No se pudo cargar:', f.src));

    const L = this.load;
    L.setPath('recursos/');

    const bgs = new Set([CONFIG.MENU_BG, CONFIG.RESULTS_BG, ...CONFIG.LEVELS.map(l => l.bg)]);
    bgs.forEach(k => L.image('bg_' + k, 'fondos/' + k + '.jpg'));

    ['correr1', 'correr2', 'saltar', 'agacha', 'frente', 'lado', 'caminar']
      .forEach(n => L.image('pj_' + n, 'personaje/pj_' + n + '.png'));

    CONFIG.OBSTACLES.forEach(k => L.image('ob_' + k, 'obstaculos/' + k + '.png'));
    Object.keys(CONFIG.PLATAFORMAS).forEach(k => L.image('plat_' + k, 'plataformas/' + k + '.png'));
    Object.keys(CONFIG.PELIGROS).forEach(k => L.image('pel_' + k, 'peligros/' + k + '.png'));
    L.image('rana', 'enemigos/rana.png');
    L.image('dragon_der', 'enemigos/dragon_der.png');
    L.image('dragon_izq', 'enemigos/dragon_izq.png');
    L.image('pel_lava_frente', 'peligros/lava_frente.png');
    Object.keys(CONFIG.FUEGOS).forEach(k => L.image(k, 'peligros/' + k + '.png'));

    L.image('moneda', 'agarrables/moneda.png');
    for (let i = 1; i <= 5; i++) L.image('hoja' + i, 'agarrables/hoja' + i + '.png');
    L.image('luciernagas1', 'agarrables/luciernagas1.png');
    L.image('luciernagas2', 'agarrables/luciernagas2.png');
    for (let i = 0; i <= 3; i++) L.image('vidas' + i, 'vidas/vidas' + i + '.png');
    L.image('carta', 'interfaz/carta.png');

    if (CONFIG.MUSICA && CONFIG.MUSICA.length) {
      L.setPath('');
      L.audio('musica', CONFIG.MUSICA);
    }
  }

  create() {
    buildGroundTextures(this);
    buildPitTextures(this);
    this.anims.create({
      key: 'run',
      frames: [{ key: 'pj_correr1' }, { key: 'pj_correr2' }],
      frameRate: 8,
      repeat: -1
    });
    this.sound.mute = Sfx.muted;
    this.scene.start('Menu');
  }
}
