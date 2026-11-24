# Forest Dash

Runner infinito 2D de bosque hecho con Phaser 3. Corre, salta obstáculos, esquiva (o pisa) ranas, cruza suelos de púas y lava usando bases flotantes, junta monedas y compite en un ranking Top 10 guardado en **MySQL**.

## Controles
- Saltar: barra espaciadora, clic o toque (mantén presionado para saltar más alto)
- Pausa: `P`, `Esc` o el botón `II`
- Sonido: `M` o el botón del altavoz

## Reglas
- 3 vidas (se ven en la barra del corazón); cada golpe quita una (1.5 s de invulnerabilidad).
- **Obstáculos** en el suelo (troncos, rocas, tocones). Desde el nivel 1 a veces salen dos seguidos.
- **Rana enemiga**: salta hacia ti más rápido que el mundo. Si la tocas de lado, pierdes una vida; si la **pisas desde arriba**, la vences, rebotas y ganas 50 puntos.
- **Suelo peligroso** (hueco con púas o lava): si tus pies bajan a esa zona pierdes una vida. Hay que subirse a las **bases flotantes** y saltar de una a otra para cruzarlo. Las bases están **desniveladas** (unas bajas, otras medias y otras altas, como en Mario Bros) y en muchas hay monedas.
- **Fuego sobre las bases**: algunas bases anchas llevan una llama; hay que brincarla (tocarla quita una vida). Arriba de la llama hay monedas de premio.
- **Nido de dragones**: un grupo de dragones que vuela de izquierda a derecha y de regreso, bajito. Hay que brincar por encima; tocarlos quita una vida. Sobre el nido hay monedas.
- **La velocidad sube todo el tiempo** y cada nivel empieza más rápido que el anterior (hasta un tope).
- Puntos = metros recorridos + 10 por moneda + 50 por rana pisada (tope de 100 000).
- 3 niveles de ~1 minuto cada uno (el último sigue sin parar): Bosque encantado (día), Atardecer de otoño (caen hojas, aparece la lava) y Noche de luciérnagas.

## Cómo ponerlo a funcionar
Necesitas **Node.js 18 o superior** y un servidor **MySQL 8 / MariaDB**.

1. Instala las dependencias:

        npm install

2. Copia `.env.example` como `.env` y pon tus datos de MySQL (usuario, contraseña, etc.).
3. Crea la base de datos y las tablas, con **una** de estas dos opciones:
   - `npm run setup`
   - o importa `base_de_datos/mysql.sql` en phpMyAdmin / MySQL Workbench.
4. Arranca el juego:

        npm start

   y abre http://localhost:3000

> El juego no se puede abrir haciendo doble clic en `index.html`: las imágenes y el ranking necesitan el servidor.

## Base de datos (MySQL)
- `jugadores`: un registro por alias (único).
- `partidas`: cada partida terminada (puntuación 0–100 000, nivel 1–3).
- `ranking_top10` (vista): mejor puntuación de cada jugador.

El navegador nunca se conecta a MySQL: habla con la API de `servidor/servidor.js` (`POST /api/partidas`, `GET /api/ranking`), que valida alias, puntos y nivel antes de guardar y limita a 20 guardados por minuto por IP. Las credenciales de MySQL viven solo en `.env`, que no se publica ni se sirve al navegador. En `base_de_datos/mysql.sql` hay un bloque comentado para crear un usuario de MySQL con permisos mínimos.

## Estructura de carpetas
- `index.html`: página del juego
- `codigo/`: el juego (navegador)
  - `configuracion.js`: velocidades, niveles, obstáculos, bases, alturas, peligros, fuego, dragones, rana y música
  - `nube.js`: llamadas a la API
  - `interfaz.js`: botones, textos, suelo y capas de fondo
  - `sonidos.js`: efectos de sonido generados por código
  - `principal.js`: arranque de Phaser
  - `escenas/`: `carga.js`, `menu.js`, `juego.js`, `resultados.js`
- `servidor/`: API y servidor (`servidor.js`, `preparar-bd.js`)
- `base_de_datos/`: `mysql.sql` (tablas y vista)
- `recursos/`: imágenes ya optimizadas que usa el juego
  - `fondos/`, `personaje/`, `obstaculos/`, `plataformas/` (bases `plat1`…`plat13`), `peligros/` (púas, lava y fuego), `enemigos/` (rana y dragones), `agarrables/` (moneda, hojas, luciérnagas), `vidas/`, `interfaz/` (pergamino)
- `imagenes/` y `carta.png`: tus originales, sin tocar
- `Musica/`: pon aquí tu música (opcional)

## Personalizar (todo en `codigo/configuracion.js`)
- **Más difícil o más fácil**: en cada nivel cambia `speed` (velocidad al empezar), `ramp` (cuánto acelera por metro), `gap` (tiempo entre cosas), `doble` (probabilidad de dos obstáculos seguidos) y `eventos` (cuántos obstáculos, ranas y zonas de peligro salen).
- **Duración de los niveles**: `LEVEL_M` (metros por nivel).
- **Fondo de cada nivel**: `bg`, con cualquier archivo de `recursos/fondos/` (por ejemplo `fondo5`, `fondo_cascada`, `fondo8`…).
- **Bases y peligros por nivel**: listas `bases` y `zonas`. Cada base de `PLATAFORMAS` tiene su tamaño en pantalla (`ancho`, `alto`), dónde se para el personaje (`sup`, `izq`, `der`) y si puede llevar fuego (`fuego: true`).
- **Alturas de las bases**: `ALTURAS` (baja, media, alta). Si las subes mucho, el salto no llega (el máximo es ~128 px).
- **Fuego**: `fuego` en cada nivel es la probabilidad de que una base lleve una llama (0 = nunca, 1 = siempre que se pueda).
- **Púas más grandes o chicas**: `PELIGROS.puas.alto` (y `golpe`, que es qué tanto te lastiman).
- **Dragones**: `dragones` en cada nivel (cuántos tiene el nido), `eventos.nido` (qué tan seguido sale) y `DRAGON` (tamaño y qué tanto se mueven de lado a lado).
- **Música**: copia un `musica.mp3` a la carpeta `Musica/`; si no existe, el juego no la usa.

## Publicar
Necesitas un hosting que ejecute Node.js y tenga MySQL (no sirve GitHub Pages, porque hay servidor). Sube el proyecto, crea el `.env` allí y ejecuta `npm install`, `npm run setup` y `npm start`.
