// Script para inicializar la base de datos SQLite con usuarios y comentarios
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'backend', 'db', 'g3.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS usuarios');
  db.run('CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, rol TEXT)');  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['admin', 'admin123', 'admin']);
  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['user', 'user123', 'user']);
  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['manager', 'manager123', 'user']);
  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['guest', 'guest123', 'user']);
  db.run('INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)', ['superadmin', 'super123', 'admin']);

  db.run('DROP TABLE IF EXISTS comentarios');
  db.run('CREATE TABLE comentarios (id INTEGER PRIMARY KEY AUTOINCREMENT, archivo TEXT, autor TEXT, comentario TEXT)');
  console.log('Base de datos inicializada con usuarios y comentarios en:', dbPath);
});

db.close();
