// Endpoints de gestión de documentos (subida, listado, descarga, comentarios)
// ...implementación a migrar...

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../files'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Solo se permiten archivos PDF'));
  }
});

// Middleware de autenticación y autorización
const { getSession } = require('./auth');

function requireLogin(req, res, next) {
  const session = getSession(req);
  if (!session) return res.status(401).send('No autenticado');
  req.user = session;
  next();
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.rol !== 'admin') {
    return res.status(403).send('Acceso denegado. Solo administradores pueden subir archivos.');
  }
  req.user = session;
  next();
}

// Listar documentos
router.get('/', requireLogin, (req, res) => {
  const filesDir = path.join(__dirname, '../files');
  const files = fs.readdirSync(filesDir).filter(f => f.endsWith('.pdf'));
  res.json(files);
});

// Subir documento - Solo administradores
router.post('/upload', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No se subió archivo' });
  
  // Renombrar archivo para mantener nombre original
  const originalName = req.file.originalname;
  const oldPath = req.file.path;
  const newPath = path.join(path.dirname(oldPath), originalName);
  
  fs.renameSync(oldPath, newPath);
  
  res.json({ success: true, filename: originalName, message: 'Archivo subido correctamente' });
});

// Descargar documento
router.get('/:filename', requireLogin, (req, res) => {
  const file = req.params.filename;
  const filePath = path.join(__dirname, '../files', file);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

module.exports = router;
