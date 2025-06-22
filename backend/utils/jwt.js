// Utilidades JWT con vulnerabilidad de verificación de firma
const jwt = require('jsonwebtoken');

// Clave secreta (en producción debería estar en variables de entorno)
const JWT_SECRET = 'mi_clave_super_secreta_2024';

// Generar JWT
function generateToken(user) {
  console.log('🎫 GENERATING TOKEN for user:', { id: user.id, username: user.username, rol: user.rol });
  
  const payload = {
    id: user.id,
    username: user.username,
    rol: user.rol,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
  };
  
  console.log('🔧 Token payload created:', payload);
  
  const token = jwt.sign(payload, JWT_SECRET);
  console.log('✅ Token signed successfully with secret:', JWT_SECRET.substring(0, 10) + '...');
  console.log('🎫 Generated token (first 50 chars):', token.substring(0, 50) + '...');
  
  return token;
}

// VULNERABILIDAD: Verificación defectuosa del JWT
// Esta función NO verifica la firma correctamente
function verifyToken(token) {
  console.log('🔍 VERIFYING TOKEN (VULNERABLE METHOD):');
  console.log('   Token received (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NULL');
  
  try {
    // VULNERABILIDAD CRÍTICA: Decodifica sin verificar la firma
    // Esto permite que cualquier JWT malformado sea aceptado
    const decoded = jwt.decode(token, { complete: true });
    console.log('🔓 Decoded token (complete):', decoded);
    
    if (!decoded || !decoded.payload) {
      console.log('❌ VERIFY: No decoded payload found');
      return null;
    }
    
    // Solo verifica que tenga la estructura correcta, NO la firma
    const payload = decoded.payload;
    console.log('📦 Extracted payload:', payload);
    
    // Verificación básica de campos requeridos
    if (!payload.id || !payload.username || !payload.rol) {
      console.log('❌ VERIFY: Missing required fields in payload');
      console.log('   ID:', payload.id);
      console.log('   Username:', payload.username);
      console.log('   Rol:', payload.rol);
      return null;
    }
    
    // Verificar expiración (esta parte sí funciona correctamente)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ VERIFY: Token expired');
      console.log('   Token exp:', payload.exp);
      console.log('   Current time:', Math.floor(Date.now() / 1000));
      return null; // Token expirado
    }
    
    console.log('✅ VERIFY: Token accepted (VULNERABLE - no signature check)');
    return payload;
  } catch (error) {
    console.log('❌ VERIFY: Error during verification:', error.message);
    return null;
  }
}

// Función correcta para verificar (no usada en el middleware vulnerable)
function verifyTokenCorrectly(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  verifyTokenCorrectly,
  JWT_SECRET
};
