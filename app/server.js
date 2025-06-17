// Servidor web vulnerable para demo educativa
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const querystring = require('querystring');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'usuarios.db');
const db = new sqlite3.Database(dbPath);

// Sesiones simples en memoria
const sessions = {};

function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

function getSession(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([a-f0-9]+)/);
  if (match && sessions[match[1]]) {
    return sessions[match[1]];
  }
  return null;
}

function requireLogin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    res.writeHead(302, { Location: '/login' });
    res.end();
    return false;
  }
  req.user = session;
  return true;
}

function requireAdmin(req, res, next) {
  const cookie = req.headers.cookie || '';
  console.log('DEBUG: requireAdmin cookie:', cookie);
  const session = getSession(req);
  console.log('DEBUG: requireAdmin session:', session);
  if (!session || session.rol !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>Acceso denegado</h1>');
    return false;
  }
  req.user = session;
  return true;
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('404 Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

function handleLogin(req, res, body) {
  const { username, password } = querystring.parse(body);
  db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) {
      console.error('Error en la base de datos (login):', err);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end('<h1>Error en la base de datos</h1>');
      return;
    }
    if (user) {
      const sessionId = generateSessionId();
      sessions[sessionId] = { username: user.username, rol: user.rol };
      res.writeHead(302, {
        'Set-Cookie': `session=${sessionId}; HttpOnly`,
        Location: '/dashboard',
      });
      res.end();
    } else {
      res.writeHead(401, { 'Content-Type': 'text/html' });
      res.end('<h1>Login fallido</h1><a href="/login">Volver</a>');
    }
  });
}

function handleXSS(req, res, body) {
  const { comentario } = querystring.parse(body);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  // Refleja el comentario sin sanitizar (vulnerable a XSS)
  res.end('<h1>Comentario recibido:</h1><p>' + comentario + '</p>');
}

function handleSQLi(req, res, body) {
  const { user } = querystring.parse(body);
  // Simulación de consulta SQL vulnerable
  const query = `SELECT * FROM users WHERE username = '${user}'`;
  let found = users.find(u => u.username === user);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<pre>Consulta ejecutada: ' + query + '\nResultado: ' + (found ? 'Usuario encontrado' : 'No existe') + '</pre>');
}

function handleUpload(req, res) {
  console.log('DEBUG: handleUpload llamado');
  if (!requireAdmin(req, res)) { console.log('DEBUG: requireAdmin falló'); return; }
  console.log('POST /upload recibido');
  let data = Buffer.alloc(0);
  req.on('data', chunk => {
    console.log('chunk recibido, tamaño:', chunk.length);
    data = Buffer.concat([data, chunk]);
  });
  req.on('end', () => {
    console.log('fin de request, tamaño total:', data.length);
    // Intentar extraer el nombre de archivo del multipart
    let filename = 'archivo_' + Date.now();
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)$/);
    if (boundaryMatch) {
      const boundary = Buffer.from('--' + boundaryMatch[1]);
      let start = data.indexOf(boundary);
      if (start !== -1) {
        let next = data.indexOf(boundary, start + boundary.length);
        if (next === -1) next = data.length;
        let part = data.slice(start + boundary.length, next);
        let headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd !== -1) {
          let header = part.slice(0, headerEnd).toString();
          let filenameMatch = header.match(/filename="([^"]+)"/);
          if (filenameMatch) filename = filenameMatch[1];
          let fileContent = part.slice(headerEnd + 4);
          // Quitar el último CRLF si existe
          if (fileContent.slice(-2).toString() === '\r\n') fileContent = fileContent.slice(0, -2);
          fs.writeFileSync(path.join(__dirname, 'files', filename), fileContent);
          console.log('DEBUG: Archivo guardado como', filename);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Archivo subido correctamente</h1><a href="/dashboard">Volver</a>');
          return;
        }
      }
    }
    // Si no se pudo extraer, guardar todo el body como .bin
    fs.writeFileSync(path.join(__dirname, 'files', filename + '.bin'), data);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Archivo subido (sin procesar)</h1><a href="/dashboard">Volver</a>');
  });
  req.on('error', (e) => {
    console.error('Error al guardar archivo:', e);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>Error interno al procesar archivo</h1>');
  });
}

function handleLogout(req, res) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([a-f0-9]+)/);
  if (match) {
    delete sessions[match[1]];
  }
  res.writeHead(302, { Location: '/' });
  res.end();
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (req.method === 'GET') {
    if (parsedUrl.pathname === '/') {
      serveFile(res, path.join(__dirname, 'index.html'), 'text/html');
    } else if (parsedUrl.pathname === '/login') {
      serveFile(res, path.join(__dirname, 'login.html'), 'text/html');
    } else if (parsedUrl.pathname === '/dashboard') {
      if (!requireLogin(req, res)) return;
      serveFile(res, path.join(__dirname, 'dashboard.html'), 'text/html');
    } else if (parsedUrl.pathname === '/ver-documentos') {
      if (!requireLogin(req, res)) return;
      serveFile(res, path.join(__dirname, 'ver-documentos.html'), 'text/html');
    } else if (parsedUrl.pathname === '/upload') {
      if (!requireAdmin(req, res)) return;
      serveFile(res, path.join(__dirname, 'upload.html'), 'text/html');
    } else if (parsedUrl.pathname === '/logout') {
      handleLogout(req, res);
    } else if (parsedUrl.pathname === '/rol') {
      const session = getSession(req);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(session || {}));
    } else if (parsedUrl.pathname === '/files' || parsedUrl.pathname.startsWith('/files/')) {
      if (!requireLogin(req, res)) return;
      let file = parsedUrl.pathname.replace('/files/', '');
      file = decodeURIComponent(file);
      const filePath = path.join(__dirname, 'files', file);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="' + file + '"'
        });
        fs.createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Archivo no encontrado');
      }
    } else if (parsedUrl.pathname === '/api/docs') {
      if (!requireLogin(req, res)) return;
      const files = fs.readdirSync(path.join(__dirname, 'files'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } else if (parsedUrl.pathname === '/xss') {
      if (!requireLogin(req, res)) return;
      serveFile(res, path.join(__dirname, 'xss.html'), 'text/html');
    } else if (parsedUrl.pathname === '/sqli') {
      if (!requireLogin(req, res)) return;
      serveFile(res, path.join(__dirname, 'sqli.html'), 'text/html');
    } else {
      res.writeHead(404);
      res.end('404 Not Found');
    }
  } else if (req.method === 'POST') {
    if (parsedUrl.pathname === '/upload') {
      // Manejo especial para archivos: procesar stream binario
      handleUpload(req, res);
      return;
    }
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (parsedUrl.pathname === '/login') {
        handleLogin(req, res, body);
      } else if (parsedUrl.pathname === '/xss') {
        if (!requireLogin(req, res)) return;
        handleXSS(req, res, body);
      } else if (parsedUrl.pathname === '/sqli') {
        if (!requireLogin(req, res)) return;
        handleSQLi(req, res, body);
      } else {
        res.writeHead(404);
        res.end('404 Not Found');
      }
    });
  }
});

server.listen(3000, () => {
  console.log('Servidor vulnerable corriendo en http://localhost:3000');
});
