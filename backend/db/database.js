// Conexión y helpers para la base de datos
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'g3.db'));

module.exports = db;
