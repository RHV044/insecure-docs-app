// Servidor principal Express para Gestor Docs G3
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRouter = require('./api/auth');
const documentosRouter = require('./api/documentos');
const usuariosRouter = require('./api/usuarios');
const comentariosRouter = require('./api/comentarios');

// Importar funciones de autenticación
const { getSession } = require('./api/auth');

const app = express();
const PORT = 3000;

// Middlewares de autenticación
function requireLogin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.redirect('/login');
  }
  req.user = session;
  next();
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session || session.rol !== 'admin') {
    return res.status(403).send('Acceso denegado. Solo administradores.');
  }
  req.user = session;
  next();
}

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoints
app.use('/api/auth', authRouter);
app.use('/api/documentos', documentosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/comentarios', comentariosRouter);

// Servir archivos estáticos del frontend
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use('/components', express.static(path.join(__dirname, '../frontend/components')));

// Redirección favicon.ico
app.get('/favicon.ico', (req, res) => res.redirect('/assets/favicon.svg'));

// Servir páginas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
app.get('/dashboard', requireLogin, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html')));
app.get('/buscar-usuarios', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/buscar-usuarios.html')));
app.get('/upload', requireAdmin, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/upload.html')));
app.get('/ver-documentos', requireLogin, (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/ver-documentos.html')));

// Servir archivos PDF subidos
app.use('/files', express.static(path.join(__dirname, 'files')));

// Fallback 404
app.use((req, res) => res.status(404).send('404 Not Found'));

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
