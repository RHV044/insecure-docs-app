// Script para inicializar la base de datos SQLite con usuarios y comentarios
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbDir = path.join(__dirname, 'backend', 'files', 'db');
const dbPath = path.join(dbDir, 'g3.db');

// Crear el directorio db si no existe
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Función para generar hash único como ID
function generateHashId() {
  return crypto.randomBytes(16).toString('hex');
}

// Función para hashear contraseñas con bcrypt
async function hashPassword(plainPassword) {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
}

// Función principal async para manejar el hasheo de contraseñas
async function initializeDatabase() {
  console.log('🚀 Inicializando base de datos...');
  
  // Hashear todas las contraseñas
  const adminPassword = await hashPassword('admin123');
  const userPassword = await hashPassword('user123');
  const managerPassword = await hashPassword('manager123');
  const guestPassword = await hashPassword('guest123');
  const superadminPassword = await hashPassword('super123');
  
  console.log('🔐 Contraseñas hasheadas correctamente');

  db.serialize(() => {
    db.run('DROP TABLE IF EXISTS usuarios');
    db.run('CREATE TABLE usuarios (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, rol TEXT)');
    
    // Insertar usuarios con contraseñas hasheadas
    db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'admin', adminPassword, 'admin']);
    db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'user', userPassword, 'user']);
    db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'manager', managerPassword, 'user']);
    db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'guest', guestPassword, 'user']);
    db.run('INSERT INTO usuarios (id, username, password, rol) VALUES (?, ?, ?, ?)', [generateHashId(), 'superadmin', superadminPassword, 'admin']);
    
    console.log('👥 Usuarios creados:');
    console.log('   - admin / admin123 (rol: admin)');
    console.log('   - user / user123 (rol: user)');
    console.log('   - manager / manager123 (rol: user)');
    console.log('   - guest / guest123 (rol: user)');
    console.log('   - superadmin / super123 (rol: admin)');
    
    db.run('DROP TABLE IF EXISTS comentarios');
    db.run('CREATE TABLE comentarios (id TEXT PRIMARY KEY, archivo TEXT, autor TEXT, comentario TEXT)', function() {
      // Agregar algunos comentarios de ejemplo con IDs hash
      db.run('INSERT INTO comentarios (id, archivo, autor, comentario) VALUES (?, ?, ?, ?)', 
        [generateHashId(), 'documento1.pdf', 'admin', 'Documento revisado y aprobado']);
      db.run('INSERT INTO comentarios (id, archivo, autor, comentario) VALUES (?, ?, ?, ?)', 
        [generateHashId(), 'documento2.pdf', 'admin', 'Requiere correcciones menores'], function() {
          // Cerrar la base de datos después de que todas las operaciones se completen
          console.log('✅ Base de datos inicializada correctamente en:', dbPath);
          console.log('🎉 ¡Listo! Ahora puedes hacer login con cualquiera de los usuarios creados.');
          db.close();
        });
    });
  });
}

// Ejecutar la inicialización
initializeDatabase().catch(error => {
  console.error('❌ Error al inicializar la base de datos:', error);
  process.exit(1);
});
