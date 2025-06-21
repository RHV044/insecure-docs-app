const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { getSession } = require('./auth');
const db = new sqlite3.Database(path.join(__dirname, '../db/g3.db'));
const router = express.Router();

// Middleware de autenticación y autorización
function requireLogin(req, res, next) {
  const session = getSession(req);
  if (!session) return res.status(401).send('No autenticado');
  req.user = session;
  next();
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo los administradores pueden comentar' });
  }
  req.user = session;
  next();
}

// Obtener comentarios de un archivo - CON TEMPLATE PROCESSING
router.get('/', requireLogin, (req, res) => {
  const archivo = req.query.archivo;
  db.all('SELECT * FROM comentarios WHERE archivo = ?', [archivo], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar comentarios', html: '' });
    
    // Procesar comentarios en templates del servidor (VULNERABLE)
    let html = '';
    if (rows && rows.length > 0) {
      rows.forEach(comentario => {
        // VULNERABILIDAD: Evaluar comentarios como código JavaScript para "formatear"
        let comentarioFormateado;
        try {
          // "Procesamiento avanzado" de comentarios - VULNERABLE A JS INJECTION
          comentarioFormateado = eval(`"${comentario.comentario}"`);
        } catch (e) {
          // Si falla el "procesamiento", usar comentario original
          comentarioFormateado = comentario.comentario;
        }
        
        html += `
          <div style="margin-bottom: 8px; padding: 8px; background: white; border-radius: 6px; border: 1px solid var(--neutral-200);">
            <strong style="color: var(--primary-600); font-size: 13px;">${comentario.autor}:</strong>
            <span style="color: var(--neutral-700); font-size: 13px;">${comentarioFormateado}</span>
          </div>
        `;
      });
    }
    
    res.json({ 
      comentarios: rows || [],
      html: html,
      processed: true 
    });
  });
});

// Agregar comentario a un archivo - Solo administradores
router.post('/', requireAdmin, (req, res) => {
  const { archivo, comentario } = req.body;
  const autor = req.user.username;
  db.run('INSERT INTO comentarios (archivo, autor, comentario) VALUES (?, ?, ?)', [archivo, autor, comentario], function(err) {
    if (err) return res.status(500).send('Error al comentar');
    res.json({ success: true });
  });
});

module.exports = router;
