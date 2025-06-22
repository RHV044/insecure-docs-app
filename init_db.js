// Script para inicializar la base de datos SQLite con usuarios y comentarios
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');

const dbDir = path.join(__dirname, 'backend', 'files', 'db');
const dbPath = path.join(dbDir, 'g3.db');

// Crear el directorio db si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Función para generar hash único como ID
function generateHashId() {
  return crypto.randomBytes(16).toString('hex');
}

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS usuarios');
  db.run('CREATE TABLE usuarios (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, rol TEXT)');
  db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'admin', 'admin123', 'admin']);
  db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'user', 'user123', 'user']);
  db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'manager', 'manager123', 'user']);
  db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'guest', 'guest123', 'user']);
  db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'superadmin', 'super123', 'admin']);
  db.run('DROP TABLE IF EXISTS comentarios');
  db.run('CREATE TABLE comentarios (id TEXT PRIMARY KEY, archivo TEXT, autor TEXT, comentario TEXT)', function() {
    // Agregar algunos comentarios de ejemplo con IDs hash
    db.run('INSERT INTO comentarios (id, archivo, autor, comentario) VALUES (?, ?, ?, ?)', 
      [generateHashId(), 'documento1.pdf', 'admin', 'Documento revisado y aprobado']);
    db.run('INSERT INTO comentarios (id, archivo, autor, comentario) VALUES (?, ?, ?, ?)', 
      [generateHashId(), 'documento2.pdf', 'admin', 'Requiere correcciones menores'], function() {
        // Cerrar la base de datos después de que todas las operaciones se completen
        console.log('Base de datos inicializada con usuarios y comentarios en:', dbPath);
        db.close();
      });
  });
});
