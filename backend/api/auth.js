const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { generateToken, verifyToken } = require('../utils/jwt');
// Importar middlewares seguros que verifican contra la BD
const { requireLoginSecure } = require('../utils/auth');
const db = new sqlite3.Database(path.join(__dirname, '../files/db/g3.db'));
const router = express.Router();

// Login - VULNERABLE a Information Disclosure (pero bcrypt previene bypass)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('🔑 LOGIN ATTEMPT:', { username, password: '***' });
  
  // VULNERABLE: Concatenación directa sin sanitización
  // Nota: bcrypt previene bypass de autenticación incluso con SQL injection
  const query = `SELECT * FROM usuarios WHERE username = '${username}'`;
  console.log('QUERY VULNERABLE:', query); // Para ver la consulta en logs
  
  db.get(query, async (err, user) => {
    if (err) {
      console.error('❌ Error SQL:', err.message);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Database path:', err.message.includes('SQLITE_ERROR') ? __dirname + '/../files/db/g3.db' : 'Unknown');
      
      // VULNERABILITY: Information Disclosure - Exponer detalles del error y ruta
      return res.status(500).json({ 
        success: false,
        message: 'Error en la base de datos',
        error: err.message,
        sqlError: err.code,
        dbPath: path.join(__dirname, '../files/db/g3.db'),
        query: query,
        timestamp: new Date().toISOString(),
        serverInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          workingDirectory: process.cwd()
        }
      });
    }
    
    if (user) {
      console.log('✅ Usuario encontrado en BD:', { id: user.id, username: user.username, rol: user.rol });
      
      try {
        // Verificar contraseña con bcrypt (ESTA PARTE PREVIENE EL BYPASS)
        console.log('🔐 Comparing passwords...');
        console.log('   Input password:', password);
        console.log('   Stored hash:', user.password.substring(0, 20) + '...');
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Password match result:', passwordMatch);
        
        if (!passwordMatch) {
          console.log('❌ Contraseña incorrecta para usuario:', username);
          return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }
        
        console.log('✅ Login exitoso para usuario:', username);
        
        // Generar JWT
        const token = generateToken(user);
        console.log('🎫 Token generado:', token.substring(0, 50) + '...');
        
        // Enviar tanto como cookie como en respuesta JSON para compatibilidad
        res.cookie('token', token, { httpOnly: true });
        res.json({ 
          success: true, 
          token: token,
          user: { username: user.username, rol: user.rol },
          redirect: '/dashboard'
        });
        console.log('✅ Login exitoso - enviando respuesta');
        
      } catch (error) {
        console.error('❌ Error during password verification:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
      }
    } else {
      console.log('❌ Usuario no encontrado o credenciales incorrectas');
      res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }
  });
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Endpoint para verificar token actual
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.split(' ')[1];
  
  // Si no hay token en header, verificar cookie
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  
  console.log('🔍 VERIFY TOKEN REQUEST:');
  console.log('   Authorization header:', authHeader ? authHeader.substring(0, 30) + '...' : 'NONE');
  console.log('   Cookie token:', req.cookies?.token ? req.cookies.token.substring(0, 30) + '...' : 'NONE');
  console.log('   Final token:', token ? token.substring(0, 30) + '...' : 'NONE');
  
  if (!token) {
    console.log('❌ VERIFY: No token provided');
    return res.status(401).json({ valid: false });
  }
  
  // VULNERABILIDAD: Usa la verificación defectuosa
  const payload = verifyToken(token);
  console.log('🔓 VERIFY: Token payload received:', payload);
  
  if (payload) {
    console.log('✅ VERIFY: Token válido, usuario:', payload.username);
    res.json({ valid: true, user: payload });
  } else {
    console.log('❌ VERIFY: Token inválido');
    res.status(401).json({ valid: false });
  }
});

// Usuario actual basado en JWT (ahora seguro)
router.get('/user', requireLoginSecure, (req, res) => {
  console.log('👤 USER REQUEST (SECURE):');
  console.log('   User from DB:', req.user);
  
  // Devolver datos del usuario verificados desde la BD
  res.json({ 
    username: req.user.username, 
    rol: req.user.rol 
  });
});

module.exports = router;
