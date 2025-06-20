const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const db = new sqlite3.Database(path.join(__dirname, '../db/g3.db'));
const router = express.Router();

// Sesiones simples en memoria
const sessions = {};
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}
function getSession(req) {
  const sessionId = req.cookies.session;
  if (sessionId && sessions[sessionId]) {
    return sessions[sessionId];
  }
  return null;
}

// Login - VULNERABLE A SQL INJECTION
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // VULNERABLE: Concatenación directa sin sanitización
  const query = `SELECT * FROM usuarios WHERE username = '${username}' AND password = '${password}'`;
  console.log('QUERY VULNERABLE:', query); // Para ver la consulta en logs
  
  db.get(query, (err, user) => {
    if (err) {
      console.error('Error SQL:', err.message);
      return res.status(500).send('Error en la base de datos');
    }
    if (user) {
      const sessionId = generateSessionId();
      sessions[sessionId] = { username: user.username, rol: user.rol };
      res.cookie('session', sessionId, { httpOnly: true });
      res.redirect('/dashboard');
    } else {
      res.status(401).send('Login fallido');
    }
  });
});

// Logout
router.get('/logout', (req, res) => {
  const sessionId = req.cookies.session;
  if (sessionId) delete sessions[sessionId];
  res.clearCookie('session');
  res.redirect('/');
});

// Sesión actual
router.get('/user', (req, res) => {
  const session = getSession(req);
  if (session) {
    res.json({ username: session.username, rol: session.rol });
  } else {
    res.status(401).json({});
  }
});

module.exports = router;
module.exports.sessions = sessions;
module.exports.getSession = getSession;
