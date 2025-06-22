// Utilidades de autenticación seguras que verifican contra la BD
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { verifyToken } = require('./jwt');

const db = new sqlite3.Database(path.join(__dirname, '../files/db/g3.db'));

// Función para obtener usuario por ID desde la BD
function getUserFromDB(userId) {
  return new Promise((resolve, reject) => {
    console.log('🔍 AUTH_UTILS: Getting user from DB with ID:', userId);
    
    db.get('SELECT * FROM usuarios WHERE id = ?', [userId], (err, user) => {
      if (err) {
        console.error('❌ AUTH_UTILS: Database error:', err);
        reject(err);
      } else {
        console.log('📄 AUTH_UTILS: User from DB:', user ? { id: user.id, username: user.username, rol: user.rol } : 'NOT_FOUND');
        resolve(user);
      }
    });
  });
}

// Middleware de autenticación que verifica contra la BD
async function requireLoginSecure(req, res, next) {
  console.log('🔐 SECURE_AUTH: requireLoginSecure middleware called');
  console.log('🔐 SECURE_AUTH: Path:', req.path);
  console.log('🔐 SECURE_AUTH: Headers:', req.headers);
  console.log('🔐 SECURE_AUTH: Cookies:', req.cookies);
  
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1];
  
  // Si no hay token en header, verificar cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('🍪 SECURE_AUTH: Using token from cookie');
  }
  
  if (!token) {
    console.log('❌ SECURE_AUTH: No token found');
    if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
      return res.status(401).json({ error: 'Token requerido' });
    }
    return res.redirect('/login');
  }
  
  try {
    console.log('🔍 SECURE_AUTH: Verifying token...');
    const payload = verifyToken(token);
    
    if (!payload || !payload.id) {
      console.log('❌ SECURE_AUTH: Invalid token payload');
      if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      return res.redirect('/login');
    }
    
    console.log('🔍 SECURE_AUTH: Token valid, checking user in DB...');
    const user = await getUserFromDB(payload.id);
    
    if (!user) {
      console.log('❌ SECURE_AUTH: User not found in database');
      if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: 'Usuario no válido' });
      }
      return res.redirect('/login');
    }
    
    console.log('✅ SECURE_AUTH: User authenticated from DB:', { id: user.id, username: user.username, rol: user.rol });
    req.user = {
      id: user.id,
      username: user.username,
      rol: user.rol // Rol verificado desde la BD
    };
    
    next();
  } catch (error) {
    console.error('❌ SECURE_AUTH: Error during authentication:', error);
    if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ error: 'Error interno de autenticación' });
    }
    return res.redirect('/login');
  }
}

// Middleware de administrador que verifica contra la BD
async function requireAdminSecure(req, res, next) {
  console.log('👑 SECURE_ADMIN: requireAdminSecure middleware called');
  console.log('👑 SECURE_ADMIN: Path:', req.path);
  
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1];
  
  // Si no hay token en header, verificar cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('🍪 SECURE_ADMIN: Using token from cookie');
  }
  
  if (!token) {
    console.log('❌ SECURE_ADMIN: No token found');
    if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
      return res.status(403).json({ error: 'Token requerido' });
    }
    return res.status(403).send('Acceso denegado. Token requerido.');
  }
  
  try {
    console.log('🔍 SECURE_ADMIN: Verifying token...');
    const payload = verifyToken(token);
    
    if (!payload || !payload.id) {
      console.log('❌ SECURE_ADMIN: Invalid token payload');
      if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      return res.status(403).send('Acceso denegado. Token inválido.');
    }
    
    console.log('🔍 SECURE_ADMIN: Token valid, checking user in DB...');
    const user = await getUserFromDB(payload.id);
    
    if (!user) {
      console.log('❌ SECURE_ADMIN: User not found in database');
      if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ error: 'Usuario no válido' });
      }
      return res.status(403).send('Acceso denegado. Usuario no válido.');
    }
    
    // VERIFICACIÓN CRÍTICA: Revisar rol en la BD
    if (user.rol !== 'admin') {
      console.log('❌ SECURE_ADMIN: User is not admin. DB role:', user.rol);
      if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
        return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
      }
      return res.status(403).send('Acceso denegado. Solo administradores.');
    }
    
    console.log('✅ SECURE_ADMIN: Admin access granted from DB:', { id: user.id, username: user.username, rol: user.rol });
    req.user = {
      id: user.id,
      username: user.username,
      rol: user.rol // Rol verificado desde la BD
    };
    
    next();
  } catch (error) {
    console.error('❌ SECURE_ADMIN: Error during admin verification:', error);
    if (req.path.startsWith('/api/') || req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ error: 'Error interno de autenticación' });
    }
    return res.status(403).send('Error interno de autenticación.');
  }
}

module.exports = {
  getUserFromDB,
  requireLoginSecure,
  requireAdminSecure
};
