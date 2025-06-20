const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getSession } = require('./auth');
const db = new sqlite3.Database(path.join(__dirname, '../db/g3.db'));
const router = express.Router();

// Middleware de autenticación y autorización
function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  req.user = session;
  next();
}

// Buscar usuario - VULNERABLE A SQL INJECTION
router.post('/buscar', requireAdmin, (req, res) => {
  const { user } = req.body;
  // VULNERABLE: Concatenación directa sin sanitización
  const query = `SELECT * FROM usuarios WHERE username = '${user}'`;
  console.log('QUERY VULNERABLE:', query); // Para ver la consulta en logs
  
  // Usar db.all para obtener múltiples resultados
  db.all(query, (err, rows) => {
    if (err) {
      console.error('Error SQL:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (rows && rows.length > 0) {
      // Devolver todos los usuarios encontrados con todos sus datos
      res.json({ 
        usuarios: rows.map(row => ({
          id: row.id,
          username: row.username,
          password: row.password, // VULNERABLE: expone contraseñas
          rol: row.rol
        })),
        total: rows.length
      });
    } else {
      res.json({ usuarios: [], total: 0 });
    }
  });
});

module.exports = router;
