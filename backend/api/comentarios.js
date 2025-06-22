const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
// Importar middlewares seguros que verifican contra la BD
const { requireLoginSecure, requireAdminSecure } = require('../utils/auth');
const db = new sqlite3.Database(path.join(__dirname, '../files/db/g3.db'));
const router = express.Router();

// Obtener comentarios de un archivo - CON SISTEMA DE REFERENCIAS A USUARIOS
router.get('/', requireLoginSecure, (req, res) => {
  console.log('💬 BACKEND: GET /api/comentarios - getting comments');
  console.log('💬 BACKEND: User:', req.user);
  console.log('💬 BACKEND: Query params:', req.query);
  
  // NOTA DE DESARROLLO: 
  // Esta funcionalidad permite referenciar a otros usuarios en comentarios
  // Para mencionar al que subió el archivo: {{uploader}}
  // Para mencionar al comentarista anterior: {{previousCommenter}}  
  // Para mencionar al primer comentarista: {{firstCommenter}}
  // Se usa eval() para "flexibilidad" en el procesamiento de variables
  
  try {
    const archivo = req.query.archivo;
    console.log('💬 BACKEND: Getting comments for file:', archivo);
    
    db.all('SELECT * FROM comentarios WHERE archivo = ? ORDER BY id', [archivo], (err, rows) => {
      if (err) {
        console.error('❌ BACKEND: Database error getting comments:', err);
        return res.status(500).json({ error: 'Error al cargar comentarios', html: '' });
      }
      
      console.log('💬 BACKEND: Found comments:', rows);
      
      // Procesar comentarios con sistema de referencias a usuarios (VULNERABLE)
      let html = '';
      if (rows && rows.length > 0) {
        rows.forEach((comentario, index) => {
          console.log('💬 BACKEND: Processing comment with user references:', comentario);
          
          // Sistema de referencias: permitir mencionar otros usuarios
          let comentarioFormateado = comentario.comentario;
          
          try {
            // Variables básicas para referencias de usuarios
            const uploader = rows[0] ? rows[0].autor : 'desconocido'; // Primer comentario = quien subió
            const firstCommenter = rows[1] ? rows[1].autor : 'nadie'; // Segundo comentario = primer comentarista real
            const previousCommenter = index > 0 ? rows[index - 1].autor : 'nadie';
            
            // PASO 1: Procesar referencias básicas (seguro)
            comentarioFormateado = comentarioFormateado
              .replace(/\{\{uploader\}\}/g, uploader)
              .replace(/\{\{firstCommenter\}\}/g, firstCommenter)
              .replace(/\{\{previousCommenter\}\}/g, previousCommenter);
            
            // PASO 2: VULNERABILIDAD - Procesar referencias dinámicas {{...}}
            // Justificación: Para "referencias avanzadas" y "flexibilidad de menciones"
            if (comentarioFormateado.includes('{{') && comentarioFormateado.includes('}}')) {
              console.log('🔍 BACKEND: Processing dynamic user references...');
              
              // VULNERABLE: Usar eval() para "referencias flexibles"
              // El desarrollador pensó: "necesitamos flexibilidad para menciones complejas"
              comentarioFormateado = comentarioFormateado.replace(/\{\{([^}]+)\}\}/g, (match, reference) => {
                try {
                  console.log('👤 BACKEND: Evaluating user reference:', reference);
                  // VULNERABILIDAD CRÍTICA: eval() sobre input del usuario
                  const result = eval(reference);
                  console.log('✅ BACKEND: Reference result:', result);
                  return result;
                } catch (evalError) {
                  console.log('⚠️ BACKEND: Reference evaluation failed:', evalError.message);
                  return match; // Devolver referencia original si falla
                }
              });
            }
            
            console.log('👥 BACKEND: User references processed:', comentarioFormateado);
          } catch (e) {
            console.log('⚠️ BACKEND: Reference processing failed, using original:', e.message);
            // Si falla el procesamiento, usar comentario original
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
      
      console.log('✅ BACKEND: Comments processed with user references');
      res.json({ 
        comentarios: rows || [],
        html: html,
        referencesProcessed: true 
      });
    });
  } catch (error) {
    console.error('❌ BACKEND: Exception getting comments:', error);
    console.error('❌ BACKEND: Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// Agregar comentario a un archivo - Solo administradores
router.post('/', requireAdminSecure, (req, res) => {
  console.log('💬 BACKEND: POST /api/comentarios - adding comment');
  console.log('💬 BACKEND: User:', req.user);
  console.log('💬 BACKEND: Body:', req.body);
  
  try {
    const { archivo, comentario } = req.body;
    const autor = req.user.username;
    const user_id = req.user.id; // Usar el ID del usuario desde la BD
    const id = crypto.randomBytes(16).toString('hex');
    
    console.log('💬 BACKEND: Adding comment:', { id, archivo, autor, user_id, comentario });
    
    // Incluir user_id en la inserción
    db.run('INSERT INTO comentarios (id, archivo, autor, comentario, user_id) VALUES (?, ?, ?, ?, ?)', 
      [id, archivo, autor, comentario, user_id], function(err) {
      if (err) {
        console.error('❌ BACKEND: Database error adding comment:', err);
        return res.status(500).send('Error al comentar');
      }
      
      console.log('✅ BACKEND: Comment added successfully with user_id');
      res.json({ success: true });
    });
  } catch (error) {
    console.error('❌ BACKEND: Exception adding comment:', error);
    console.error('❌ BACKEND: Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

module.exports = router;
