const FONT = 'Fredoka, "Arial Rounded MT Bold", "Trebuchet MS", Arial, sans-serif';

// Texto con borde (se lee bien sobre cualquier fondo)
function txt(scene, x, y, str, size, color = '#ffffff', stroke = '#1b3a24', sw = 5) {
  return scene.add.text(x, y, str, {
    fontFamily: FONT, fontSize: size + 'px', fontStyle: 'bold', color, stroke, strokeThickness: sw
  });
}

// Texto sin borde, para escribir sobre el pergamino
function ptxt(scene, x, y, str, size, color = '#4a2c0f') {
  return scene.add.text(x, y, str, { fontFamily: FONT, fontSize: size + 'px', fontStyle: 'bold', color });
}

// Suelo de cada nivel (se dibuja por código con los colores de CONFIG.LEVELS[i].ground)
function buildGroundTextures(scene) {
  CONFIG.LEVELS.forEach((L, i) => {
    const key = 'ground_' + i;
    if (scene.textures.exists(key)) return;
    const c = L.ground;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(c.soil).fillRect(0, 0, 128, 128);
    g.fillStyle(c.dark).fillRect(0, 44, 128, 84);
    g.fillStyle(c.stone);
    [[14, 60], [52, 84], [96, 70], [30, 108], [84, 112], [116, 52]].forEach(([x, y]) => g.fillRoundedRect(x, y, 12, 7, 3));
    g.fillStyle(c.top).fillRect(0, 0, 128, 10);
    for (let k = 0; k < 8; k++) g.fillCircle(8 + k * 16, 10, 8);
    g.fillStyle(0x000000, 0.18).fillRect(0, 19, 128, 4);
    g.fillStyle(c.light).fillRect(0, 0, 128, 3);
    g.generateTexture(key, 128, 128);
    g.destroy();
  });
}

// Hueco en el suelo para las zonas de lava y púas: un degradado que se ve "metido" en la tierra
// (así los peligros no sobresalen del suelo del fondo).
function buildPitTextures(scene) {
  const hondo = CONFIG.H - CONFIG.GROUND;
  const hacer = (key, paradas) => {
    if (scene.textures.exists(key)) return;
    const tex = scene.textures.createCanvas(key, 64, hondo);
    const ctx = tex.getContext();
    const g = ctx.createLinearGradient(0, 0, 0, hondo);
    paradas.forEach(([p, c]) => g.addColorStop(p, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, hondo);
    tex.refresh();
  };
  hacer('pit_lava', [[0, '#140605'], [0.35, '#4a0f06'], [0.72, '#b8330a'], [1, '#ff9a1f']]);
  hacer('pit_puas', [[0, '#120b07'], [0.5, '#2b1a0e'], [1, '#3d2615']]);
}

// Capa de fondo: dos copias de la imagen (ya espejada, repite sin costura) + suelo.
// Se mueve con layer.move(dx). Al cambiar de nivel se crea otra capa y se hace fundido.
function createBgLayer(scene, bgKey, groundIdx, withGround = true) {
  const { W, H, GROUND } = CONFIG;
  const key = 'bg_' + bgKey;
  const bw = scene.textures.get(key).getSourceImage().width;
  const a = scene.add.image(0, 0, key).setOrigin(0);
  const b = scene.add.image(bw, 0, key).setOrigin(0);
  const items = [a, b];
  let ground = null;
  if (withGround) {
    ground = scene.add.tileSprite(0, GROUND, W, H - GROUND, 'ground_' + groundIdx).setOrigin(0);
    items.push(ground);
  }
  const c = scene.add.container(0, 0, items).setDepth(0);
  return {
    c, off: 0,
    move(dx) {
      this.off = (this.off + dx * 0.35) % bw; // el fondo va más lento que el suelo (parallax)
      const x = Math.floor(this.off);
      a.x = -x;
      b.x = bw - x;
      if (ground) ground.tilePositionX += dx;
    }
  };
}

// Botón de madera/verde con texto
function makeButton(scene, x, y, label, cb, o = {}) {
  const w = o.w || 220, h = o.h || 48, fs = o.fs || 22;
  const g = scene.add.graphics();
  const draw = hover => {
    g.clear();
    g.fillStyle(0x000000, 0.28).fillRoundedRect(-w / 2 + 2, -h / 2 + 5, w, h, 14);
    g.fillStyle(hover ? 0x34a85c : 0x258a44, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    g.fillStyle(0xffffff, 0.2).fillRoundedRect(-w / 2 + 5, -h / 2 + 4, w - 10, h / 2 - 5, 10);
    g.lineStyle(3, 0x14532d, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
  };
  draw(false);
  const t = txt(scene, 0, -1, label, fs, '#ffffff', '#14532d', 4).setOrigin(0.5);
  const c = scene.add.container(x, y, [g, t]).setSize(w, h).setDepth(5);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => draw(true));
  c.on('pointerout', () => { draw(false); c.setScale(1); });
  c.on('pointerdown', () => {
    c.setScale(0.96);
    scene.time.delayedCall(80, () => c.setScale(1));
    cb();
  });
  return c;
}

function setButtonEnabled(btn, on) {
  btn.setVisible(on);
  if (btn.input) btn.input.enabled = on;
}

// Botoncito redondo (pausa, sonido)
function makeIconButton(scene, x, y, label, cb) {
  const g = scene.add.graphics();
  const draw = h => {
    g.clear();
    g.fillStyle(0x0b1f12, h ? 0.85 : 0.55).fillCircle(0, 0, 16);
    g.lineStyle(2, 0xffffff, 0.45).strokeCircle(0, 0, 16);
  };
  draw(false);
  const t = scene.add.text(0, 0, label, {
    fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffffff'
  }).setOrigin(0.5);
  const c = scene.add.container(x, y, [g, t]).setSize(32, 32).setDepth(10);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => draw(true));
  c.on('pointerout', () => draw(false));
  c.on('pointerdown', cb);
  c.label = t;
  return c;
}

// Música de fondo (opcional): solo suena si existe el archivo indicado en CONFIG.MUSICA
function startMusic(scene) {
  scene.sound.mute = Sfx.muted;
  if (!scene.cache.audio.exists('musica')) return;
  let m = scene.sound.get('musica');
  if (!m) m = scene.sound.add('musica', { loop: true, volume: 0.03 });
  if (!m.isPlaying) m.play();
}
