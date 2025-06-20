const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getSession } = require('./auth');
const db = new sqlite3.Database(path.join(__dirname, '../db/g3.db'));
const router = express.Router();

// Middleware de autenticación
function requireLogin(req, res, next) {
  const session = getSession(req);
  if (!session) return res.status(401).send('No autenticado');
  req.user = session;
  next();
}

// Obtener comentarios de un archivo
router.get('/', requireLogin, (req, res) => {
  const archivo = req.query.archivo;
  db.all('SELECT * FROM comentarios WHERE archivo = ?', [archivo], (err, rows) => {
    if (err) return res.status(500).json([]);
    res.json(rows || []);
  });
});

// Agregar comentario a un archivo
router.post('/', requireLogin, (req, res) => {
  const { archivo, comentario } = req.body;
  const autor = req.user.username;
  db.run('INSERT INTO comentarios (archivo, autor, comentario) VALUES (?, ?, ?)', [archivo, autor, comentario], function(err) {
    if (err) return res.status(500).send('Error al comentar');
    res.json({ success: true });
  });
});

module.exports = router;
