class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.alias = data.alias; }

  create() {
    const { W, H, GROUND, ART } = CONFIG;
    this.dist = 0; this.coins = 0; this.ranasPisadas = 0; this.score = 0;
    this.lives = CONFIG.LIVES; this.level = 1;
    this.inv = 0; this.over = false; this.paused = false;
    this.obs = []; this.nuts = []; this.leaves = [];
    this.plats = []; this.zonas = []; this.ranas = [];
    this.fuegos = []; this.dragones = [];
    this.t = 0; this.leafT = 0; this.landT = 0; this.mode = 'run';
    this.velocidad = CONFIG.LEVELS[0].speed;
    this.extraEspera = 0; this.ultimoEvento = '';
    // física del personaje (propia): velocidad vertical, altura de los pies y estado de salto
    this.vy = 0; this.feet = GROUND - 40; this.grounded = false;
    this.coyote = 0; this.jumpBuf = 0; this.holding = false; this.cutDone = true; this.prevFeet = this.feet;
    this.time.paused = false;
    startMusic(this);

    // Fondo (con fundido al cambiar de nivel)
    this.layers = [];
    this.addBackground(0, true);

    // Luciérnagas: solo aparecen en el nivel de noche
    this.ffMix = { v: 0 };
    this.ff = [1, 2].map(n => this.add.image(W / 2, H / 2, 'luciernagas' + n)
      .setDisplaySize(W * 1.15, H * 1.15).setBlendMode(Phaser.BlendModes.ADD).setDepth(4).setAlpha(0));

    // Personaje (los pies están en la parte de abajo de la imagen)
    this.player = this.add.sprite(130, this.feet, 'pj_correr1').setOrigin(0.5, 1).setScale(ART).setDepth(3);
    this.player.play('run');

    this.buildHud();


    // Aviso de Internet sin detener el videojuego
    this.avisoConexion = this.add.text(
      CONFIG.W / 2, 89,
      'Sin conexión',
      {
        fontFamily: 'Fredoka, Arial',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fff5ca',
        backgroundColor: '#8b2920',
        padding: { x: 14, y: 9 },
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(30).setVisible(false);

    this.comprobandoInternet = false;

    this.onSinInternet = () => this.mostrarEstadoInternet(false);
    this.onConInternet = () => this.comprobarInternet();

    window.addEventListener('offline', this.onSinInternet);
    window.addEventListener('online', this.onConInternet);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('offline', this.onSinInternet);
      window.removeEventListener('online', this.onConInternet);

      if (this.internetAbort) {
        this.internetAbort.abort();
      }
    });

    this.comprobarInternet();

    // Comprobar la conexión cada 5 segundos
    this.internetTimer = window.setInterval(
      () => this.comprobarInternet(),
      5000
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.clearInterval(this.internetTimer);
    });


    // Controles: salto de altura variable (mantener = más alto)
    const pulsar = () => {
      if (this.over || this.paused) return;
      this.holding = true;
      this.jumpBuf = 120; // se recuerda el toque 120 ms por si se presiona justo antes de aterrizar
    };
    const soltar = () => { this.holding = false; };
    this.input.on('pointerdown', (p, over) => { if (!over.length) pulsar(); });
    this.input.on('pointerup', soltar);
    this.input.keyboard.on('keydown-SPACE', e => { if (!e.repeat) pulsar(); });
    this.input.keyboard.on('keyup-SPACE', soltar);
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-M', () => this.toggleMute());

    // Diálogo inicial y récords de otros exploradores.
    this.dialogoActivo = null;
    this.records = [];
    this.recordsSuperados = new Set();
    this.cargarRecords();
    this.mostrarDialogo('¡Empecemos!');
    this.programar();
  }

  // Mostrar u ocultar el aviso de Internet
  mostrarEstadoInternet(conectado) {
    if (this.scene.isActive() && !this.over && this.avisoConexion) {
      this.avisoConexion.setVisible(!conectado);
    }
  }

  // Comprobar la conexión a Internet
  async comprobarInternet() {
    if (!this.scene.isActive() ||
        this.over ||
        this.comprobandoInternet) return;

    if (!navigator.onLine) {
      this.mostrarEstadoInternet(false);
      return;
    }

    this.comprobandoInternet = true;

    const controller = new AbortController();
    this.internetAbort = controller;

    const timeout = window.setTimeout(
      () => controller.abort(),
      3500
    );

    try {
      await fetch('https://www.gstatic.com/generate_204', {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });

      this.mostrarEstadoInternet(true);

    } catch (_) {
      this.mostrarEstadoInternet(false);

    } finally {
      window.clearTimeout(timeout);

      if (this.internetAbort === controller) {
        this.internetAbort = null;
      }

      this.comprobandoInternet = false;
    }
  }

  // Globo de diálogo del explorador, sin interrumpir la carrera.
  mostrarDialogo(mensaje, duracion = 1800) {
    if (this.over || !this.player) return;
    if (this.dialogoActivo) this.dialogoActivo.destroy();

    const x = Math.min(CONFIG.W - 145, this.player.x + 115);
    const y = Math.max(82, this.player.y - this.player.displayHeight - 30);
    const globo = this.add.text(x, y, mensaje, {
      fontFamily: 'Fredoka, Arial',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#4A2C0F',
      backgroundColor: '#FFF7D6',
      padding: { x: 12, y: 8 },
      align: 'center',
      wordWrap: { width: 230 }
    }).setOrigin(0.5).setDepth(18);
    this.dialogoActivo = globo;

    this.tweens.add({
      targets: globo, alpha: 0, y: y - 15,
      delay: duracion, duration: 350,
      onComplete: () => {
        if (this.dialogoActivo === globo) this.dialogoActivo = null;
        globo.destroy();
      }
    });
  }

  // Consultar el Top 10 sin bloquear la partida si no hay conexión.
  async cargarRecords() {
    try {
      const rows = await Cloud.top10();
      if (!this.scene.isActive() || !Array.isArray(rows)) return;
      this.records = rows
        .filter(r => r && typeof r.alias === 'string'
          && Number.isFinite(Number(r.puntos))
          && r.alias.toLowerCase() !== String(this.alias).toLowerCase())
        .map(r => ({ alias: r.alias, puntos: Number(r.puntos) }))
        .sort((a, b) => a.puntos - b.puntos);
    } catch (e) {
      // La carrera sigue normalmente si falla la conexión.
    }
  }

  revisarRecords() {
    for (const r of this.records) {
      const key = r.alias.toLowerCase();
      if (this.score > r.puntos && !this.recordsSuperados.has(key)) {
        this.recordsSuperados.add(key);
        this.mostrarDialogo('Has alcanzado el récord de ' + r.alias, 2300);
        break; // Un solo mensaje a la vez.
      }
    }
  }

  // ---------- Fondo y HUD ----------

  addBackground(idx, instant) {
    const L = CONFIG.LEVELS[idx];
    const layer = createBgLayer(this, L.bg, idx);
    this.layers.push(layer);
    if (!instant) {
      layer.c.setAlpha(0);
      this.tweens.add({
        targets: layer.c, alpha: 1, duration: 1200,
        onComplete: () => {
          this.layers = this.layers.filter(l => {
            if (l === layer) return true;
            l.c.destroy();
            return false;
          });
        }
      });
    }
  }

  buildHud() {
    const { W, ART } = CONFIG;

    // Marcador (arriba a la izquierda)
    const g = this.add.graphics().setDepth(9);
    g.fillStyle(0x0b1f12, 0.58).fillRoundedRect(10, 8, 205, 62, 16);
    g.lineStyle(2, 0xffffff, 0.28).strokeRoundedRect(10, 8, 205, 62, 16);
    this.tScore = txt(this, 24, 12, '', 22, '#ffffff', '#0b1f12', 4).setDepth(10);
    this.add.image(36, 54, 'moneda').setScale(ART * 0.78).setDepth(10);
    this.tCoins = txt(this, 56, 41, '', 19, '#ffe066', '#0b1f12', 4).setDepth(10);

    // Nivel y velocidad (arriba al centro)
    const lv = this.add.graphics().setDepth(9);
    lv.fillStyle(0x0b1f12, 0.58).fillRoundedRect(W / 2 - 130, 8, 260, 30, 15);
    this.tLevel = txt(this, W / 2, 23, '', 16, '#ffffff', '#0b1f12', 3).setOrigin(0.5).setDepth(10);
    this.tVel = txt(this, W / 2, 52, '', 14, '#ffe9a8', '#0b1f12', 3).setOrigin(0.5).setDepth(10);

    // Vidas (imagen con el corazón y la barra) y botones
    this.imgLives = this.add.image(W - 54, 38, 'vidas' + this.lives).setOrigin(1, 0.5).setScale(ART).setDepth(10);
    this.btnPause = makeIconButton(this, W - 26, 22, 'II', () => this.togglePause());
    this.btnSound = makeIconButton(this, W - 26, 58, Sfx.muted ? '🔇' : '🔊', () => this.toggleMute());

    // Pantalla de pausa
    const dim = this.add.rectangle(0, 0, W, CONFIG.H, 0x000000, 0.5).setOrigin(0);
    const pt = txt(this, W / 2, CONFIG.H / 2, 'PAUSA\nPulsa P para continuar', 28, '#ffffff', '#0b1f12', 6)
      .setOrigin(0.5).setAlign('center');
    this.pauseUI = this.add.container(0, 0, [dim, pt]).setDepth(20).setVisible(false);
  }

  
togglePause() {
  if (this.over) return;

  this.paused = !this.paused;

  // Pausar o reanudar animación
  if (this.paused) {
    this.player.anims.pause();
  } else {
    this.player.anims.resume();
  }

  // Pausar el tiempo del juego
  this.time.paused = this.paused;

  // Mostrar u ocultar pantalla de pausa
  this.pauseUI.setVisible(this.paused);

  // Pausar o reanudar música de fondo
  const musica = this.sound.get('musica');

  if (musica) {
    if (this.paused) {
      musica.pause();
    } else if (musica.isPaused) {
      musica.resume();
    }
  }


  }

  toggleMute() {
    Sfx.setMuted(!Sfx.muted);
    this.sound.mute = Sfx.muted;
    this.btnSound.label.setText(Sfx.muted ? '🔇' : '🔊');
  }

  // ---------- Qué sale y cuándo ----------

  programar() {
    const g = CONFIG.LEVELS[this.level - 1].gap;
    // extraEspera: tiempo que ocupa lo que acaba de salir (una zona larga, dos obstáculos, etc.)
    const espera = Phaser.Math.Between(g[0], g[1]) + this.extraEspera;
    this.extraEspera = 0;
    this.time.delayedCall(espera, () => {
      if (this.over) return;
      this.generarEvento();
      this.programar();
    });
  }

  generarEvento() {
    const L = CONFIG.LEVELS[this.level - 1];
    const m = this.dist / 10;
    const pesos = { ...L.eventos };
    if (m < CONFIG.RANA_DESDE_M) pesos.rana = 0;
    if (m < CONFIG.ZONA_DESDE_M || this.ultimoEvento === 'zona') pesos.zona = 0;
    if (m < CONFIG.NIDO_DESDE_M || this.ultimoEvento === 'nido') pesos.nido = 0;
    let r = Math.random() * (pesos.obstaculo + pesos.rana + pesos.zona + pesos.nido);
    let tipo = 'obstaculo';
    for (const k of ['obstaculo', 'rana', 'zona', 'nido']) {
      if (r < pesos[k]) { tipo = k; break; }
      r -= pesos[k];
    }
    this.ultimoEvento = tipo;
    if (tipo === 'zona') this.spawnZona(Phaser.Utils.Array.GetRandom(L.zonas));
    else if (tipo === 'rana') this.spawnRana();
    else if (tipo === 'nido') this.spawnNido();
    else this.spawnObstaculo();
  }

  // Obstáculo en el suelo (a veces dos seguidos) con un arco de monedas encima
  spawnObstaculo() {
    const { W, GROUND, ART } = CONFIG;
    const L = CONFIG.LEVELS[this.level - 1];
    const v = this.velocidad;
    const crear = x => this.add.image(x, GROUND + 4, 'ob_' + Phaser.Utils.Array.GetRandom(L.obst))
      .setOrigin(0, 1).setScale(ART).setDepth(2);

    const o = crear(W + 60);
    this.obs.push(o);

    if (Math.random() < L.doble) {
      const sep = Phaser.Math.Clamp(v * 0.95, 260, 620); // da tiempo a aterrizar y volver a saltar
      const o2 = crear(W + 60 + o.displayWidth + sep);
      this.obs.push(o2);
      this.extraEspera += ((o.displayWidth + sep + o2.displayWidth) / v) * 1000;
      return;
    }
    if (Math.random() < 0.6) {
      for (let i = 0; i < 5; i++) {
        const x = W + 60 + o.displayWidth / 2 + (i - 2) * 40;
        const y = GROUND - 34 - Math.sin((i / 4) * Math.PI) * 95;
        const c = this.add.image(x, y, 'moneda').setScale(ART * 0.9).setDepth(2);
        c.ph = i * 0.7;
        this.nuts.push(c);
      }
    }
  }

  // Rana enemiga: avanza saltando hacia el personaje, más rápido que el mundo
  spawnRana() {
    const { W, GROUND, ART } = CONFIG;
    const r = this.add.image(W + 60, GROUND + 4, 'rana').setOrigin(0.5, 1).setScale(ART).setDepth(2);
    r.ph = Math.random() * 6.28;
    r.extra = Phaser.Math.Between(70, 130) + (this.level - 1) * 25; // px/s extra hacia el personaje
    this.ranas.push(r);
  }

  // Cuánto dura un salto (s) para subir "dh" px (dh > 0 = la siguiente base está más arriba)
  tiempoSalto(dh) {
    const S = CONFIG.SALTO, g = CONFIG.GRAVEDAD;
    return (S + Math.sqrt(Math.max(0, S * S - 2 * g * dh))) / g;
  }

  // Suelo peligroso (hueco con púas o lava) cruzado por bases flotantes desniveladas:
  // unas bajas, otras medias y otras altas. Algunas llevan fuego y otras monedas.
  spawnZona(tipo) {
    const { W, GROUND } = CONFIG;
    const L = CONFIG.LEVELS[this.level - 1];
    const def = CONFIG.PELIGROS[tipo];
    const v = this.velocidad;
    const n = Phaser.Math.Between(3, 4) + (this.level >= 2 && Math.random() < 0.5 ? 1 : 0); // 3 a 5 bases
    const g0 = Phaser.Math.Clamp(v * 0.40, 110, 300);      // del suelo seguro a la primera base
    const f = Phaser.Math.Clamp(v / 420, 1, 1.35);         // las bases crecen un poco con la velocidad
    const x0 = W + 80;
    let cursor = x0 + g0;
    let nivelPrev = 0, altPrev = 0, fuegoPrev = false;

    for (let i = 0; i < n; i++) {
      // Altura: baja / media / alta. Nunca se sube más de un escalón (el salto llega a ~128 px)
      let nivel;
      if (i === 0) nivel = Phaser.Math.Between(0, 1);
      else {
        const posibles = [0, 1, 2].filter(k => k <= nivelPrev + 1);
        const distintos = posibles.filter(k => k !== nivelPrev);
        nivel = (Math.random() < 0.25 || !distintos.length) ? nivelPrev : Phaser.Utils.Array.GetRandom(distintos);
      }
      const alt = CONFIG.ALTURAS[nivel] + Phaser.Math.Between(-5, 5);
      const apoyoY = GROUND - alt; // y donde se paran los pies

      // Hueco hasta esta base: la mitad de lo que alcanza un salto completo (más corto si hay que subir)
      if (i > 0) cursor += Phaser.Math.Clamp(v * 0.5 * this.tiempoSalto(Math.max(0, alt - altPrev)), 100, 300);

      // ¿Lleva fuego? Nunca la primera ni dos seguidas. La base se estira a lo ancho si hace falta para que
      // haya espacio de tomar vuelo antes de la llama y de caer después de brincarla (depende de la velocidad)
      const fk = Phaser.Utils.Array.GetRandom(Object.keys(CONFIG.FUEGOS));
      const fd = CONFIG.FUEGOS[fk];
      const antes = 55 + v * 0.08, despues = 25 + v * 0.35;
      const hace = k => ((antes + despues + fd.ancho) / (CONFIG.PLATAFORMAS[k].der - CONFIG.PLATAFORMAS[k].izq));
      let clave = null;
      if (i > 0 && !fuegoPrev && Math.random() < L.fuego) {
        const aptas = L.bases.filter(k => CONFIG.PLATAFORMAS[k].fuego && Math.max(f, hace(k)) <= 1.75);
        if (aptas.length) clave = Phaser.Utils.Array.GetRandom(aptas);
      }
      const conFuego = !!clave;
      if (!clave) clave = Phaser.Utils.Array.GetRandom(L.bases);

      const d = CONFIG.PLATAFORMAS[clave];
      const sx = conFuego ? Math.max(f, hace(clave)) : f;   // estiramiento horizontal
      const p = this.add.image(cursor, apoyoY - d.sup * f, 'plat_' + clave)
        .setOrigin(0, 0).setDisplaySize(d.ancho * sx, d.alto * f).setDepth(2.5);
      p.w = p.displayWidth;
      p.sx0 = d.izq * sx;           // zona donde se puede pisar
      p.sx1 = d.der * sx;
      p.apoyoY = apoyoY;
      this.plats.push(p);

      const x1 = cursor + p.sx0, x2 = cursor + p.sx1;
      if (conFuego) {
        // Una llama que hay que brincar, con monedas en arco encima como premio
        const fx = x1 + antes + fd.ancho / 2 + Math.random() * Math.max(0, (x2 - x1) - antes - despues - fd.ancho);
        const fu = this.add.image(fx, apoyoY + 2, fk).setOrigin(0.5, 1)
          .setDisplaySize(fd.ancho, fd.alto).setDepth(2.7);
        fu.sy0 = fu.scaleY; fu.ph = Math.random() * 6.28;
        this.fuegos.push(fu);
        for (let k = -1; k <= 1; k++) {
          const c = this.add.image(fx + k * 28, apoyoY - fd.alto - 22 - (k === 0 ? 10 : 0), 'moneda')
            .setScale(CONFIG.ART * 0.9).setDepth(2.6);
          c.ph = (k + 1) * 0.8;
          this.nuts.push(c);
        }
      } else if (Math.random() < 0.85) {
        // Monedas sobre la base (dos si es ancha)
        const pos = (x2 - x1) >= 190 ? [0.3, 0.7] : [0.5];
        pos.forEach((q, k) => {
          const c = this.add.image(x1 + (x2 - x1) * q, apoyoY - 30, 'moneda').setScale(CONFIG.ART * 0.9).setDepth(2.6);
          c.ph = (i + k) * 0.9;
          this.nuts.push(c);
        });
      }

      fuegoPrev = conFuego;
      nivelPrev = nivel;
      altPrev = alt;
      cursor += p.w;
    }

    // El peligro termina antes del borde de la última base, así que al bajarse ya hay suelo seguro
    const ancho = (cursor - 70) - x0;
    const z = this.dibujarPeligro(tipo, x0, ancho);
    z.x = x0; z.w = ancho; z.golpe = def.golpe;
    this.zonas.push(z);
    this.extraEspera += ((cursor - x0) / v) * 1000 + 700;
  }

  // Dibuja el hueco del suelo con las púas o la lava adentro (no sobresalen del suelo del fondo)
  dibujarPeligro(tipo, x, ancho) {
    const { GROUND, H } = CONFIG;
    const def = CONFIG.PELIGROS[tipo];
    const hondo = H - GROUND;
    const cont = this.add.container(x, 0).setDepth(2);
    const frente = this.add.container(x, 0).setDepth(2.8);
    const llamas = [];

    // El hueco y sus bordes
    cont.add(this.add.image(0, GROUND, 'pit_' + tipo).setOrigin(0).setDisplaySize(ancho, hondo));
    cont.add(this.add.rectangle(0, GROUND, 7, hondo, 0x1a0f08, 0.8).setOrigin(0));
    cont.add(this.add.rectangle(ancho - 7, GROUND, 7, hondo, 0x1a0f08, 0.8).setOrigin(0));

    // Tiras de imagen repartidas de borde a borde del hueco
    const tira = (key, alto, aspecto, base, destino, voltear, animar) => {
      const wt = alto * aspecto;
      const nt = Math.max(1, Math.ceil((ancho - wt) / (wt * 0.82)) + 1);
      for (let i = 0; i < nt; i++) {
        const cx = nt === 1 ? ancho / 2 : wt / 2 + i * ((ancho - wt) / (nt - 1));
        const im = this.add.image(cx, GROUND + base, key).setOrigin(0.5, 1).setDisplaySize(wt, alto);
        if (voltear && i % 2) im.setFlipX(true);
        if (animar) { im.sy0 = im.scaleY; im.ph = i * 1.3; llamas.push(im); }
        destino.add(im);
      }
    };
    tira('pel_' + tipo, def.alto, def.aspecto, def.base, cont, tipo === 'puas', tipo === 'lava');
    if (def.frente) tira('pel_lava_frente', def.frente.alto, def.frente.aspecto, def.frente.base, frente, false, true);

    return { cont, frente, llamas };
  }

  // Nido de dragones: varios dragones que vuelan de izquierda a derecha y de regreso, bajito, para brincarlos
  spawnNido() {
    const { W, GROUND } = CONFIG;
    const L = CONFIG.LEVELS[this.level - 1];
    const v = this.velocidad;
    const n = L.dragones;
    const D = CONFIG.DRAGON;
    const S = Phaser.Math.Clamp(v * 0.16, 44, 110);   // qué tan abierto es el nido (más angosto si va lento)
    const alturas = Phaser.Utils.Array.Shuffle([6, 22, 12, 28]).slice(0, n); // px del pie del dragón al suelo
    const x0 = W + 80;
    for (let i = 0; i < n; i++) {
      const base = x0 + (n === 1 ? 0 : (i / (n - 1)) * S);
      const cy = GROUND - alturas[i] - D.alto / 2;
      const im = this.add.image(base, cy, 'dragon_der').setScale(CONFIG.ART).setDepth(2.4);
      this.dragones.push({ im, base, cy, ph: Math.random() * 6.28, ph2: Math.random() * 6.28 });
    }
    // Monedas en arco sobre el nido, como premio por brincarlo
    for (let k = -1; k <= 1; k++) {
      const c = this.add.image(x0 + S / 2 + k * 32, GROUND - 112 - (k === 0 ? 14 : 0), 'moneda')
        .setScale(CONFIG.ART * 0.9).setDepth(2.6);
      c.ph = (k + 1) * 0.8;
      this.nuts.push(c);
    }
    this.extraEspera += ((S + 2 * D.amp + 160) / v) * 1000 + 300;
  }

  spawnLeaf() {
    const { W, ART } = CONFIG;
    const s = this.add.image(W + 20, Phaser.Math.Between(-10, 220), 'hoja' + Phaser.Math.Between(1, 5))
      .setScale(ART * Phaser.Math.FloatBetween(0.6, 1.1)).setDepth(1);
    s.vx = Phaser.Math.FloatBetween(0.9, 1.5);
    s.vy = Phaser.Math.Between(35, 70);
    s.ph = Math.random() * 6.28;
    s.rot = Phaser.Math.FloatBetween(-2, 2);
    this.leaves.push(s);
  }

  // ---------- Niveles, daño y fin ----------

  nextLevel(lvl) {
    const { W, H } = CONFIG;
    const L = CONFIG.LEVELS[lvl - 1];
    this.level = lvl;
    this.addBackground(lvl - 1, false);
    if (L.fireflies) this.tweens.add({ targets: this.ffMix, v: 1, duration: 2500 });
    Sfx.level();
    this.mostrarDialogo(lvl === 2
      ? '¡El bosque está cambiando!'
      : '¡Se está haciendo de noche!');
    const t = txt(this, W / 2, H / 2 - 60, 'Nivel ' + lvl + '\n' + L.name, 40, '#fff7d6', '#2d5a1b', 8)
      .setOrigin(0.5).setAlign('center').setDepth(15);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, duration: 1800, onComplete: () => t.destroy() });
  }

  hit() {
    this.lives--;
    this.inv = 1500;
    this.imgLives.setTexture('vidas' + Math.max(0, this.lives));
    Sfx.hit();
    this.cameras.main.shake(200, 0.01);
    this.tweens.add({
      targets: this.player, alpha: 0.3, yoyo: true, repeat: 5, duration: 120,
      onComplete: () => this.player.setAlpha(1)
    });
    if (this.lives <= 0) this.end();
  }

  // Al tocar púas o lava: pierde una vida y sale rebotando hacia arriba
  hitPeligro() {
    this.vy = -500;
    this.grounded = false;
    this.coyote = 0;
    this.cutDone = true;
    this.hit();
  }

  pisarRana(r) {
    this.ranasPisadas++;
    Sfx.pisar();
    this.vy = -430; // rebote al pisarla
    this.grounded = false;
    this.coyote = 0;
    this.cutDone = true;
    const f = txt(this, r.x, r.y - r.displayHeight, '+' + CONFIG.RANA.puntos, 22, '#ffe066', '#7a4b00', 4)
      .setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets: f, y: f.y - 40, alpha: 0, duration: 700, onComplete: () => f.destroy() });
    this.tweens.add({
      targets: r, scaleY: CONFIG.ART * 0.15, scaleX: CONFIG.ART * 1.3, alpha: 0, duration: 240,
      onComplete: () => r.destroy()
    });
  }

  end() {
    this.over = true;
    this.player.anims.stop();
    this.player.setTexture('pj_agacha');
    Sfx.over();
    this.time.delayedCall(900, () =>
      this.scene.start('Results', { alias: this.alias, score: this.score, level: this.level }));
  }

  // ---------- Movimiento del personaje ----------

  moverPersonaje(ms) {
    const { GROUND } = CONFIG;
    const dt = ms / 1000;
    this.prevFeet = this.feet;

    // Saltar: desde el suelo/base, o hasta 90 ms después de salir del borde
    if (this.grounded) this.coyote = 90; else this.coyote -= ms;
    if (this.jumpBuf > 0) {
      this.jumpBuf -= ms;
      if (this.grounded || this.coyote > 0) {
        this.vy = -CONFIG.SALTO;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuf = 0;
        this.cutDone = false;
        Sfx.jump();
      }
    }
    // Si se suelta el botón mientras sube, el salto se corta (salto corto)
    if (!this.cutDone && !this.holding) {
      if (this.vy < -220) this.vy *= 0.45;
      this.cutDone = true;
    }
    if (this.vy >= 0) this.cutDone = true;

    this.vy += CONFIG.GRAVEDAD * dt;
    this.feet += this.vy * dt;

    // Aterrizar sobre una base (solo cayendo y viniendo desde arriba) o sobre el suelo
    let apoyo = null;
    if (this.vy >= 0) {
      const cx = this.player.x;
      for (const p of this.plats) {
        if (cx + 10 < p.x + p.sx0 || cx - 10 > p.x + p.sx1) continue;
        if (this.prevFeet <= p.apoyoY + 4 && this.feet >= p.apoyoY && (!apoyo || p.apoyoY < apoyo.apoyoY)) apoyo = p;
      }
    }
    if (apoyo) {
      this.feet = apoyo.apoyoY; this.vy = 0; this.grounded = true;
    } else if (this.feet >= GROUND + 3) {
      this.feet = GROUND + 3; this.vy = 0; this.grounded = true;
    } else {
      this.grounded = false;
    }
    this.player.y = this.feet;
  }

  // ---------- Bucle principal ----------

  update(_, delta) {
    if (this.over || this.paused) return;
    const { W, H, GROUND, ART } = CONFIG;
    const ms = Math.min(delta, 50);
    const dt = ms / 1000;
    this.t += ms;

    // Nivel y velocidad: sube con cada metro y se reinicia un poco más alta en cada nivel
    const m = this.dist / 10;
    const lvl = Math.min(CONFIG.LEVELS.length, 1 + Math.floor(m / CONFIG.LEVEL_M));
    if (lvl !== this.level) this.nextLevel(lvl);
    const L = CONFIG.LEVELS[lvl - 1];
    this.velocidad = Math.min(CONFIG.MAX_SPEED, L.speed + (m - (lvl - 1) * CONFIG.LEVEL_M) * L.ramp);
    const dx = this.velocidad * dt;
    this.dist += dx;
    this.layers.forEach(l => l.move(dx));

    // Mover el mundo
    this.plats = this.plats.filter(p => {
      p.x -= dx;
      if (p.x + p.w < -80) { p.destroy(); return false; }
      return true;
    });
    this.zonas = this.zonas.filter(z => {
      z.x -= dx;
      z.cont.x = z.x;
      z.frente.x = z.x;
      if (z.x + z.w < -80) { z.cont.destroy(); z.frente.destroy(); return false; }
      z.llamas.forEach(im => { im.scaleY = im.sy0 * (1 + 0.07 * Math.sin(this.t / 130 + im.ph)); }); // las llamas se mueven
      return true;
    });
    this.obs = this.obs.filter(o => {
      o.x -= dx;
      if (o.x < -200) { o.destroy(); return false; }
      return true;
    });

    this.moverPersonaje(ms);

    // Pose del personaje: correr / salto / aterrizaje
    if (!this.grounded) {
      if (this.mode !== 'air') {
        this.mode = 'air';
        this.player.anims.stop();
        this.player.setTexture('pj_saltar');
      }
    } else if (this.mode === 'air') {
      this.mode = 'land';
      this.landT = 90;
      this.player.setTexture('pj_agacha');
    } else if (this.mode === 'land') {
      this.landT -= ms;
      if (this.landT <= 0) { this.mode = 'run'; this.player.play('run'); }
    }

    // Cajas de colisión (más pequeñas que el dibujo para que sea justo)
    const R = Phaser.Geom.Intersects.RectangleToRectangle;
    const px = this.player.x, pw = this.player.displayWidth, ph = this.player.displayHeight;
    const full = new Phaser.Geom.Rectangle(px - pw / 2, this.feet - ph, pw, ph);
    const pb = new Phaser.Geom.Rectangle(px - pw * 0.225, this.feet - ph * 0.9, pw * 0.45, ph * 0.88);

    if (this.inv > 0) this.inv -= ms;

    // Obstáculos del suelo
    if (this.inv <= 0) {
      for (const o of this.obs) {
        const b = o.getBounds();
        b.x += b.width * 0.14; b.width *= 0.72;
        b.y += b.height * 0.18; b.height *= 0.82;
        if (R(pb, b)) { this.hit(); break; }
      }
    }

    // Suelo peligroso: si los pies bajan de cierta altura dentro de la zona, lastima
    if (this.inv <= 0) {
      for (const z of this.zonas) {
        if (z.x + z.w < pb.x || z.x > pb.right) continue;
        if (this.feet > GROUND - z.golpe + 4) { this.hitPeligro(); break; }
      }
    }
    if (this.over) return;

    // Ranas: saltan hacia el personaje. Pisarlas desde arriba las vence; tocarlas de lado quita una vida
    const vivas = [];
    for (const r of this.ranas) {
      r.x -= dx + r.extra * dt;
      r.y = GROUND + 4 - Math.abs(Math.sin(this.t / 1000 * Math.PI / 0.95 + r.ph)) * 36;
      r.rotation = Math.sin(this.t / 300 + r.ph) * 0.06;
      if (r.x < -80) { r.destroy(); continue; }
      const w = r.displayWidth, h = r.displayHeight;
      const rb = new Phaser.Geom.Rectangle(r.x - w * 0.3, r.y - h * 0.88, w * 0.6, h * 0.8);
      if (R(pb, rb)) {
        if (this.vy > 60 && this.prevFeet <= rb.y + rb.height * 0.55) { this.pisarRana(r); continue; }
        if (this.inv <= 0) this.hit();
        if (this.over) return;
      }
      vivas.push(r);
    }
    this.ranas = vivas;

    // Llamas sobre las bases: se brincan; tocarlas quita una vida
    this.fuegos = this.fuegos.filter(u => {
      u.x -= dx;
      u.scaleY = u.sy0 * (1 + 0.09 * Math.sin(this.t / 110 + u.ph));
      if (u.x < -60) { u.destroy(); return false; }
      if (this.inv <= 0) {
        const w = u.displayWidth, h = u.displayHeight;
        const ub = new Phaser.Geom.Rectangle(u.x - w * 0.28, u.y - h * 0.66, w * 0.56, h * 0.62);
        if (R(pb, ub)) this.hit();
      }
      return true;
    });
    if (this.over) return;

    // Nido de dragones: vuelan de lado a lado (miran hacia donde van) y quitan una vida al tocarlos
    this.dragones = this.dragones.filter(d => {
      d.base -= dx;
      const ang = this.t / 1000 * CONFIG.DRAGON.vel + d.ph;
      d.im.x = d.base + Math.sin(ang) * CONFIG.DRAGON.amp;
      d.im.y = d.cy + Math.sin(this.t / 170 + d.ph2) * 4;
      d.im.setTexture(Math.cos(ang) >= 0 ? 'dragon_der' : 'dragon_izq');
      if (d.im.x < -120) { d.im.destroy(); return false; }
      if (this.inv <= 0) {
        const w = d.im.displayWidth, h = d.im.displayHeight;
        const db = new Phaser.Geom.Rectangle(d.im.x - w * 0.25, d.im.y - h * 0.28, w * 0.5, h * 0.56);
        if (R(pb, db)) this.hit();
      }
      return true;
    });
    if (this.over) return;

    // Monedas (giran y se recogen al tocarlas)
    this.nuts = this.nuts.filter(n => {
      n.x -= dx;
      n.scaleX = ART * 0.9 * (0.3 + 0.7 * Math.abs(Math.cos(this.t / 260 + n.ph)));
      if (n.x < -40) { n.destroy(); return false; }
      if (R(full, n.getBounds())) {
        this.coins++;
        Sfx.coin();
        const f = txt(this, n.x, n.y, '+10', 20, '#ffe066', '#7a4b00', 4).setOrigin(0.5).setDepth(11);
        this.tweens.add({ targets: f, y: f.y - 40, alpha: 0, duration: 650, onComplete: () => f.destroy() });
        n.destroy();
        return false;
      }
      return true;
    });

    // Hojas que caen (nivel de otoño)
    if (L.leaves) {
      this.leafT += ms;
      if (this.leafT > 420) { this.leafT = 0; this.spawnLeaf(); }
    }
    this.leaves = this.leaves.filter(s => {
      s.x -= dx * s.vx;
      s.y += s.vy * dt + Math.sin(this.t / 400 + s.ph) * 0.6;
      s.rotation += s.rot * dt;
      if (s.x < -40 || s.y > GROUND - 4) { s.destroy(); return false; }
      return true;
    });

    // Luciérnagas (nivel de noche)
    if (this.ffMix.v > 0) {
      this.ff.forEach((f, i) => {
        f.setAlpha(this.ffMix.v * (0.55 + 0.45 * Math.sin(this.t / (600 + i * 250) + i * 2)));
        f.x = W / 2 + Math.sin(this.t / 1700 + i * 1.7) * 22;
        f.y = H / 2 + Math.cos(this.t / 2100 + i) * 12;
      });
    }

    // Puntos = metros + 10 por moneda + 50 por rana pisada (con tope)
    this.score = Math.min(CONFIG.MAX_SCORE,
      Math.floor(m) + this.coins * 10 + this.ranasPisadas * CONFIG.RANA.puntos);
    this.revisarRecords();
    this.tScore.setText('Puntos ' + this.score);
    this.tCoins.setText('x ' + this.coins);
    this.tLevel.setText('Nivel ' + this.level + ' · ' + L.name);
    this.tVel.setText('Velocidad x' + (this.velocidad / CONFIG.LEVELS[0].speed).toFixed(1));
  }
}
