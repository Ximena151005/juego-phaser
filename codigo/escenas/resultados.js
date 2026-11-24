class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  init(data) { this.d = data || {}; }

  create() {
    const { W, H, GROUND, ART } = CONFIG;
    this.alive = true;
    this.events.once('shutdown', () => { this.alive = false; });
    this.rowObjs = [];

    // Escenario: fondo oscurecido, explorador de pie y pergamino con el Top 10
    createBgLayer(this, CONFIG.RESULTS_BG, 0);
    this.add.rectangle(0, 0, W, H, 0x000000, 0.38).setOrigin(0).setDepth(0.5);
    this.add.image(70, GROUND + 3, 'pj_frente').setOrigin(0.5, 1).setScale(ART * 1.2).setDepth(3);
    this.add.image(560, H / 2, 'carta').setDisplaySize(372, 440).setDepth(2);

    const hasScore = this.d.score != null;
    const cx = 215; // centro de la columna izquierda

    txt(this, cx, 46, hasScore ? 'FIN DEL JUEGO' : 'RANKING', 38, '#ffe9a8', '#5a2d0c', 8)
      .setOrigin(0.5).setDepth(5);
    if (hasScore) {
      txt(this, cx, 104, String(this.d.score), 62, '#ffffff', '#1b3a24', 8).setOrigin(0.5).setDepth(5);
      txt(this, cx, 150, 'puntos', 20, '#d9f2dc', '#1b3a24', 4).setOrigin(0.5).setDepth(5);
      txt(this, cx, 182, `${this.d.alias} · Nivel ${this.d.level}`, 19, '#ffffff', '#1b3a24', 4)
        .setOrigin(0.5).setDepth(5);
    }
    this.status = txt(this, cx, 214, '', 16, '#ffd479', '#1b3a24', 4).setOrigin(0.5).setDepth(5);
    this.retry = makeButton(this, cx, 246, 'Reintentar', () => this.guardar(), { w: 150, h: 34, fs: 16 });
    setButtonEnabled(this.retry, false);

    if (this.d.alias) {
      makeButton(this, cx, 292, 'JUGAR DE NUEVO', () => this.scene.start('Game', { alias: this.d.alias }), { w: 230, fs: 20 });
      makeButton(this, cx, 346, 'MENÚ', () => this.scene.start('Menu'), { w: 230, fs: 20 });
    } else {
      makeButton(this, cx, 292, 'MENÚ', () => this.scene.start('Menu'), { w: 230, fs: 20 });
    }

    // Pergamino: título y lista
    ptxt(this, 558, 108, 'TOP 10', 26).setOrigin(0.5).setDepth(5);
    this.list = ptxt(this, 558, 225, 'Cargando...', 17).setOrigin(0.5).setDepth(5);

    if (hasScore) this.guardar(); else this.cargar();
  }

  async guardar() {
    setButtonEnabled(this.retry, false);
    this.status.setText('Guardando puntuación...');
    try {
      await Cloud.saveScore(this.d.alias, this.d.score, this.d.level);
      if (!this.alive) return;
      this.status.setText('Puntuación guardada');
    } catch (e) {
      if (!this.alive) return;
      this.status.setText('Sin conexión: puntuación no guardada');
      setButtonEnabled(this.retry, true);
    }
    this.cargar();
  }

  async cargar() {
    try {
      const rows = await Cloud.top10();
      if (!this.alive) return;
      this.pintar(rows || []);
    } catch (e) {
      if (this.alive) this.list.setText('No se pudo cargar\nel ranking');
    }
  }

  pintar(rows) {
    this.rowObjs.forEach(o => o.destroy());
    this.rowObjs = [];
    if (!rows.length) { this.list.setText('Aún no hay\npuntuaciones'); return; }
    this.list.setText('');
    const medal = ['#9a6a00', '#5d6d7e', '#8c4a1a'];
    rows.slice(0, 10).forEach((r, i) => {
      const y = 134 + i * 21;
      const mine = this.d.alias && r.alias.toLowerCase() === this.d.alias.toLowerCase();
      const color = mine ? '#b3261e' : (i < 3 ? medal[i] : '#4a2c0f');
      this.rowObjs.push(
        ptxt(this, 442, y, (i + 1) + '.', 16, color).setDepth(5),
        ptxt(this, 474, y, r.alias, 16, color).setDepth(5),
        ptxt(this, 676, y, String(r.puntos), 16, color).setOrigin(1, 0).setDepth(5)
      );
    });
  }
}
