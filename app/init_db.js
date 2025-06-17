// Script para inicializar la base de datos SQLite con usuarios
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'usuarios.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS usuarios');
  db.run('CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, rol TEXT)');
  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['admin', 'admin123', 'admin']);
  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['user', 'user123', 'user']);
  console.log('Base de datos inicializada con usuarios de ejemplo en:', dbPath);
});

db.close();
