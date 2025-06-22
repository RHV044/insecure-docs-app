// Script para hashear contraseñas existentes en la base de datos
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../files/db/g3.db'));
const saltRounds = 12; // Rounds de salt para bcrypt (12 es muy seguro)

console.log('🔐 Starting password hashing process...');

// Obtener todos los usuarios con contraseñas en texto plano
db.all("SELECT id, username, password FROM usuarios", async (err, users) => {
  if (err) {
    console.error('❌ Error getting users:', err);
    return;
  }
  
  console.log(`👥 Found ${users.length} users to process`);
  
  for (const user of users) {
    try {
      // Verificar si la contraseña ya está hasheada (bcrypt hashes empiezan con $2b$)
      if (user.password.startsWith('$2b$')) {
        console.log(`✅ User ${user.username} already has hashed password`);
        continue;
      }
      
      console.log(`🔐 Hashing password for user: ${user.username}`);
      console.log(`   Original password: ${user.password}`);
      
      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      console.log(`   Hashed password: ${hashedPassword}`);
      
      // Actualizar en la base de datos
      await new Promise((resolve, reject) => {
        db.run("UPDATE usuarios SET password = ? WHERE id = ?", [hashedPassword, user.id], (err) => {
          if (err) {
            console.error(`❌ Error updating user ${user.username}:`, err);
            reject(err);
          } else {
            console.log(`✅ Updated password for user: ${user.username}`);
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error(`❌ Error processing user ${user.username}:`, error);
    }
  }
  
  console.log('🎉 Password hashing process completed!');
  
  // Verificar resultado
  db.all("SELECT username, password FROM usuarios", (err, updatedUsers) => {
    if (!err) {
      console.log('\n📊 Final user passwords:');
      updatedUsers.forEach(user => {
        console.log(`   ${user.username}: ${user.password.substring(0, 20)}...`);
      });
    }
    db.close();
  });
});
