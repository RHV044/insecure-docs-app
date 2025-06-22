// Endpoints de gestión de documentos (subida, listado, descarga, comentarios)
// ...implementación a migrar...

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { exec } = require('child_process'); // Para la vulnerabilidad RCE
const router = express.Router();

// Importar middlewares seguros que verifican contra la BD
const { requireLoginSecure, requireAdminSecure } = require('../utils/auth');

const upload = multer({
  dest: path.join(__dirname, '../files'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  }
});

// Listar documentos
router.get('/', requireLoginSecure, (req, res) => {
  console.log('📋 BACKEND: GET /api/documentos - listing documents');
  console.log('📋 BACKEND: User:', req.user);
  
  try {
    const filesDir = path.join(__dirname, '../files');
    console.log('📋 BACKEND: Files directory:', filesDir);
    
    if (!fs.existsSync(filesDir)) {
      console.log('⚠️ BACKEND: Files directory does not exist, creating it');
      fs.mkdirSync(filesDir, { recursive: true });
    }
    
    const files = fs.readdirSync(filesDir).filter(f => f.endsWith('.pdf'));
    console.log('📋 BACKEND: Found files:', files);
    
    res.json(files);
  } catch (error) {
    console.error('❌ BACKEND: Error listing documents:', error);
    console.error('❌ BACKEND: Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// Subir documento - Solo administradores
router.post('/upload', requireAdminSecure, upload.single('file'), (req, res) => {
  console.log('📤 BACKEND: POST /api/documentos/upload - uploading document');
  console.log('📤 BACKEND: User:', req.user);
  console.log('📤 BACKEND: File:', req.file);
  console.log('📤 BACKEND: Body:', req.body);
  
  try {
    if (!req.file) {
      console.log('❌ BACKEND: No file uploaded');
      return res.status(400).json({ success: false, error: 'No se subió archivo' });
    }
    
    console.log('📤 BACKEND: File details:', {
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
    // Verificar si ya existe un archivo con el mismo nombre
    const originalName = req.file.originalname;
    const filesDir = path.join(__dirname, '../files');
    const newPath = path.join(filesDir, originalName);
    
    console.log('📤 BACKEND: Checking for duplicate file:', newPath);
    
    if (fs.existsSync(newPath)) {
      console.log('❌ BACKEND: File already exists:', originalName);
      // Eliminar el archivo temporal subido
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        error: `Ya existe un archivo con el nombre "${originalName}". Por favor, renombra tu archivo o elimina el existente primero.` 
      });
    }
    
    // Renombrar archivo para mantener nombre original
    const oldPath = req.file.path;
    
    console.log('📤 BACKEND: Renaming file from', oldPath, 'to', newPath);
    fs.renameSync(oldPath, newPath);
      console.log('✅ BACKEND: File uploaded successfully:', originalName);
    
    // Agregar comentario automático indicando quién subió el archivo
    const crypto = require('crypto');
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(path.join(__dirname, '../files/db/g3.db'));
    
    const comentarioId = crypto.randomBytes(16).toString('hex');
    const comentarioTexto = `Subido por ${req.user.username}`;
    
    console.log('📝 BACKEND: Adding automatic upload comment:', comentarioTexto);
    
    db.run('INSERT INTO comentarios (id, archivo, autor, comentario, user_id) VALUES (?, ?, ?, ?, ?)', 
      [comentarioId, originalName, req.user.username, comentarioTexto, req.user.id], (err) => {
      if (err) {
        console.error('⚠️ BACKEND: Error adding upload comment:', err);
        // No fallar la subida por esto, solo logear el error
      } else {
        console.log('✅ BACKEND: Upload comment added successfully');
      }
      db.close();
    });
    
    res.json({ success: true, filename: originalName, message: 'Archivo subido correctamente' });
  } catch (error) {
    console.error('❌ BACKEND: Error uploading document:', error);
    console.error('❌ BACKEND: Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Error interno del servidor', details: error.message });
  }
});

// Descargar documento
router.get('/:filename', requireLoginSecure, (req, res) => {
  console.log('⬇️ BACKEND: GET /api/documentos/:filename - downloading document');
  console.log('⬇️ BACKEND: User:', req.user);
  console.log('⬇️ BACKEND: Filename:', req.params.filename);
  
  try {
    const file = req.params.filename;
    const filePath = path.join(__dirname, '../files', file);
    
    console.log('⬇️ BACKEND: File path:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('✅ BACKEND: File exists, sending download');
      res.download(filePath);
    } else {
      console.log('❌ BACKEND: File not found');
      res.status(404).send('Archivo no encontrado');
    }
  } catch (error) {
    console.error('❌ BACKEND: Error downloading document:', error);
    console.error('❌ BACKEND: Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

module.exports = router;
