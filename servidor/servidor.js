// Servidor de Forest Dash: sirve el juego y expone la API del ranking sobre MySQL.
require('dotenv').config();
const path = require('path');
const express = require('express');
const mysql = require('mysql2/promise');

const PORT = Number(process.env.PORT) || 3000;
const MAX_SCORE = 100000;
const ALIAS_RE = /^[\p{L}\p{N}_ ]{3,12}$/u;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'forest_dash',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10
});

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1kb' }));

// Límite sencillo: máximo 20 guardados por minuto desde la misma IP
const hits = new Map();
function limitar(req, res, next) {
  const now = Date.now();
  const recientes = (hits.get(req.ip) || []).filter(t => now - t < 60000);
  if (recientes.length >= 20) return res.status(429).json({ error: 'demasiadas peticiones' });
  recientes.push(now);
  hits.set(req.ip, recientes);
  next();
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, arr] of hits) {
    const vivos = arr.filter(t => now - t < 60000);
    if (vivos.length) hits.set(ip, vivos); else hits.delete(ip);
  }
}, 60000).unref();

// Guardar una partida (valida alias, puntos y nivel en el servidor)
app.post('/api/partidas', limitar, async (req, res) => {
  const body = req.body || {};
  const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
  const puntos = Number(body.puntos);
  const nivel = Number(body.nivel);

  if (!ALIAS_RE.test(alias)) return res.status(400).json({ error: 'alias inválido' });
  if (!Number.isInteger(puntos) || puntos < 0 || puntos > MAX_SCORE) return res.status(400).json({ error: 'puntos inválidos' });
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > 3) return res.status(400).json({ error: 'nivel inválido' });

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    // Si el alias ya existe, LAST_INSERT_ID(id) devuelve su id; si no, crea el jugador
    const [r] = await conn.execute(
      'INSERT INTO jugadores (alias) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)', [alias]);
    await conn.execute(
      'INSERT INTO partidas (jugador_id, puntuacion, nivel) VALUES (?, ?, ?)', [r.insertId, puntos, nivel]);
    await conn.commit();
    res.status(201).json({ ok: true });
  } catch (e) {
    if (conn) await conn.rollback().catch(() => {});
    console.error('Error al guardar partida:', e.message);
    res.status(500).json({ error: 'error de base de datos' });
  } finally {
    if (conn) conn.release();
  }
});

// Top 10
app.get('/api/ranking', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT alias, puntos FROM ranking_top10');
    res.set('Cache-Control', 'no-store').json(rows);
  } catch (e) {
    console.error('Error al leer el ranking:', e.message);
    res.status(500).json({ error: 'error de base de datos' });
  }
});


// Archivos del juego: solo estas carpetas (así nunca se expone .env ni el código del servidor)
const raiz = path.join(__dirname, '..');
app.get('/', (_req, res) => res.sendFile(path.join(raiz, 'index.html')));
['codigo', 'recursos', 'Musica'].forEach(d => app.use('/' + d, express.static(path.join(raiz, d))));

// JSON mal formado, etc.
app.use((err, _req, res, _next) => {
  res.status(err.status || 400).json({ error: 'petición inválida' });
});

app.listen(PORT, async () => {
  console.log(`Forest Dash listo en http://localhost:${PORT}`);
  try {
    await pool.query('SELECT 1 FROM ranking_top10 LIMIT 1');
    console.log('MySQL conectado.');
  } catch (e) {
    console.error('\nNo se pudo usar la base de datos: ' + e.message);
    console.error('Revisa tu archivo .env y ejecuta "npm run setup" para crear las tablas.\n');
  }
});
