const CONFIG = {
  // La API (servidor/servidor.js) guarda y lee el ranking en MySQL.
  // Si sirves el juego desde el mismo servidor Node, déjalo así.
  API_URL: '/api',

  W: 800,
  H: 450,
  GROUND: 380,        // y donde empieza el suelo
  LIVES: 3,
  MAX_SCORE: 100000,

  LEVEL_M: 2000,      // metros por nivel (cada nivel dura aprox. 50–60 s)
  MAX_SPEED: 900,     // velocidad máxima del mundo (px/s)
  GRAVEDAD: 1500,
  SALTO: 620,         // impulso del salto (mantener presionado = salto más alto)

  PLAYER_H: 76,       // alto del personaje en pantalla (px)
  ART: 0.5,           // los PNG de /recursos están guardados al doble de su tamaño en pantalla

  // Fondos que usan el menú y el ranking (nombres de recursos/fondos/*.jpg, sin extensión)
  MENU_BG: 'fondo_encantado',
  RESULTS_BG: 'fondo11',

  // Música opcional: copia un archivo a /Musica y escribe su ruta aquí. Si no existe, se ignora.
  MUSICA: ['Musica/musica_fondo.mp3'],

  // Obstáculos del suelo (recursos/obstaculos/<nombre>.png)
  OBSTACLES: ['tronco1', 'tronco2', 'roca1', 'roca2', 'roca3', 'roca4', 'roca5', 'tocon', 'losa'],

  // Bases para subirse cuando el suelo es peligroso (recursos/plataformas/<nombre>.png)
  // ancho/alto: tamaño en pantalla | sup: px desde arriba de la imagen hasta donde se para el personaje
  // izq/der: de dónde a dónde se puede pisar (px desde la izquierda) | fuego: puede llevar una llama encima
  PLATAFORMAS: {
    plat1: { ancho: 96, alto: 73, sup: 1, izq: 4, der: 92 },
    plat2: { ancho: 150, alto: 101, sup: 26, izq: 3, der: 147 },
    plat4: { ancho: 80, alto: 90, sup: 1, izq: 4, der: 77 },
    plat5: { ancho: 92, alto: 76, sup: 1, izq: 3, der: 89 },
    plat6: { ancho: 210, alto: 67, sup: 1, izq: 4, der: 206, fuego: true },
    plat7: { ancho: 110, alto: 102, sup: 6, izq: 10, der: 106 },
    plat8: { ancho: 250, alto: 100, sup: 10, izq: 15, der: 236 },
    plat10: { ancho: 280, alto: 39, sup: 7, izq: 14, der: 264, fuego: true },
    plat11: { ancho: 140, alto: 93, sup: 12, izq: 3, der: 137 },
    plat12: { ancho: 220, alto: 38, sup: 6, izq: 3, der: 209, fuego: true },
    plat13: { ancho: 360, alto: 45, sup: 16, izq: 9, der: 356, fuego: true }
  },

  // Alturas (px sobre el suelo) de las bases: baja, media y alta. Se van alternando para que queden desniveladas.
  // El salto llega a ~128 px, por eso la más alta es 108 y nunca se sube más de un escalón de una base a la siguiente.
  ALTURAS: [44, 76, 108],

  // Suelo peligroso: un hueco en el suelo con púas o lava (recursos/peligros/). Se lastima si los pies bajan de "golpe" px sobre el suelo.
  // alto: tamaño en pantalla | base: cuántos px bajo la línea del suelo queda el pie de la imagen (más base = se asoma menos)
  PELIGROS: {
    puas: { alto: 34, golpe: 22, aspecto: 4.73, base: 16 },
    lava: { alto: 58, golpe: 22, aspecto: 4.05, base: 36, frente: { alto: 42, aspecto: 4.55, base: 52 } }
  },

  // Llamas que pueden ir sobre una base (recursos/peligros/fuegoN.png). Quitan una vida al tocarlas: hay que brincarlas.
  FUEGOS: {
    fuego1: { ancho: 27, alto: 42 },
    fuego2: { ancho: 25, alto: 40 }
  },

  // Dragones del nido (recursos/enemigos/dragon_der.png y dragon_izq.png). Vuelan de izquierda a derecha y de regreso.
  // alto: tamaño en pantalla | amp: cuánto se van de un lado a otro (px) | vel: qué tan rápido (rad/s)
  DRAGON: { alto: 58, amp: 18, vel: 2.8 },

  // Enemigo (recursos/enemigos/rana.png)
  RANA: { alto: 64, puntos: 50 },

  // A partir de cuántos metros pueden aparecer
  RANA_DESDE_M: 200,
  ZONA_DESDE_M: 350,
  NIDO_DESDE_M: 250,

  // speed: velocidad al empezar el nivel (px/s) | ramp: cuánto sube por cada metro recorrido
  // gap: tiempo (ms) entre eventos | doble: probabilidad de dos obstáculos seguidos
  // eventos: peso de cada cosa que puede salir (obstaculo, rana, zona, nido) | zonas: suelo peligroso posible | bases: plataformas posibles
  // fuego: probabilidad de que una base lleve una llama | dragones: cuántos dragones tiene cada nido
  // leaves: caen hojas | fireflies: luciérnagas | ground: colores del suelo
  LEVELS: [
    {
      name: 'Bosque encantado', speed: 300, ramp: 0.045, gap: [1300, 1900], bg: 'fondo_encantado',
      obst: ['tronco1', 'tronco2', 'roca2', 'roca4', 'roca5'], doble: 0.10,
      eventos: { obstaculo: 6, rana: 2, zona: 3, nido: 2 }, zonas: ['puas'], bases: ['plat7', 'plat2', 'plat8', 'plat1', 'plat13'],
      fuego: 0.25, dragones: 3,
      leaves: false, fireflies: false,
      ground: { top: 0x5fbf4a, light: 0x8ee26a, soil: 0x7a4d28, dark: 0x5e3a1d, stone: 0x8a6a45 }
    },
    {
      name: 'Atardecer de otoño', speed: 410, ramp: 0.06, gap: [1000, 1500], bg: 'fondo3',
      obst: ['tronco1', 'tronco2', 'roca1', 'roca2', 'roca3', 'roca4', 'tocon'], doble: 0.25,
      eventos: { obstaculo: 5, rana: 3, zona: 3, nido: 2 }, zonas: ['puas', 'lava'], bases: ['plat10', 'plat12', 'plat13', 'plat11', 'plat2'],
      fuego: 0.40, dragones: 3,
      leaves: true, fireflies: false,
      ground: { top: 0xc58a2b, light: 0xe8b84a, soil: 0x6e3f1c, dark: 0x522d14, stone: 0x8c5a35 }
    },
    {
      name: 'Noche de luciérnagas', speed: 520, ramp: 0.07, gap: [800, 1250], bg: 'fondo2',
      obst: ['tronco1', 'tronco2', 'roca1', 'roca2', 'roca3', 'roca4', 'roca5', 'tocon', 'losa'], doble: 0.35,
      eventos: { obstaculo: 4, rana: 3, zona: 4, nido: 3 }, zonas: ['lava', 'puas'], bases: ['plat6', 'plat4', 'plat5', 'plat8', 'plat1', 'plat13'],
      fuego: 0.50, dragones: 4,
      leaves: false, fireflies: true,
      ground: { top: 0x2f7d5a, light: 0x4fb386, soil: 0x33261d, dark: 0x241a14, stone: 0x4a3a2e }
    }
  ]
};
