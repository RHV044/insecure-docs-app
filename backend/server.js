// Servidor principal Express para Gestor Docs G3
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRouter = require('./api/auth');
const documentosRouter = require('./api/documentos');
const comentariosRouter = require('./api/comentarios');

// Importar middlewares seguros que verifican contra la BD
const { requireLoginSecure, requireAdminSecure } = require('./utils/auth');

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API endpoints
app.use('/api/auth', authRouter);
app.use('/api/documentos', documentosRouter);
app.use('/api/comentarios', comentariosRouter);

// Endpoint temporal de debug
// Servir archivos estáticos del frontend
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/components', express.static(path.join(__dirname, '../frontend/components')));

// Redirección favicon.ico
app.get('/favicon.ico', (req, res) => res.redirect('/assets/favicon.svg'));

// Servir páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
app.get('/dashboard', requireLoginSecure, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html')));
app.get('/upload', requireAdminSecure, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/upload.html')));
app.get('/ver-documentos', requireLoginSecure, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/ver-documentos.html')));

// Servir archivos PDF subidos
app.use('/files', express.static(path.join(__dirname, 'files')));

// Fallback 404
app.use((req, res) => res.status(404).send('404 Not Found'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
