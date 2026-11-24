// Crea la base de datos, las tablas y la vista del ranking:  npm run setup
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const nombre = process.env.DB_NAME || 'forest_dash';
  // El archivo trae CREATE DATABASE y USE para importarlo a mano; aquí usamos el nombre del .env
  const sql = fs.readFileSync(path.join(__dirname, '..', 'base_de_datos', 'mysql.sql'), 'utf8')
    .replace(/^\s*(CREATE DATABASE|USE)\b.*$/gim, '');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });
  await conn.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [nombre]);
  await conn.query('USE ??', [nombre]);
  await conn.query(sql);
  await conn.end();
  console.log(`Base de datos "${nombre}" lista.`);
})().catch(e => {
  console.error('No se pudo preparar la base de datos:', e.message);
  process.exit(1);
});
