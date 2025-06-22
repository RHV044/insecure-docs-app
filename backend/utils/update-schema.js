// Script para actualizar la estructura de la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../files/db/g3.db'));

console.log('🔧 Updating database schema...');

// Verificar estructura actual de comentarios
db.all("PRAGMA table_info(comentarios)", (err, rows) => {
  if (err) {
    console.error('❌ Error checking table structure:', err);
    return;
  }
  
  console.log('📊 Current comentarios table structure:');
  rows.forEach(row => {
    console.log(`   ${row.name}: ${row.type} (nullable: ${!row.notnull})`);
  });
  
  // Verificar si ya existe la columna user_id
  const hasUserId = rows.some(row => row.name === 'user_id');
  
  if (!hasUserId) {
    console.log('➕ Adding user_id column to comentarios table...');
    
    // Agregar columna user_id
    db.run("ALTER TABLE comentarios ADD COLUMN user_id INTEGER", (err) => {
      if (err) {
        console.error('❌ Error adding user_id column:', err);
        return;
      }
      
      console.log('✅ user_id column added successfully');
      
      // Actualizar registros existentes con user_id basado en el autor
      console.log('🔄 Updating existing comments with user_id...');
      
      db.run(`
        UPDATE comentarios 
        SET user_id = (
          SELECT id FROM usuarios WHERE username = comentarios.autor
        )
        WHERE user_id IS NULL
      `, (err) => {
        if (err) {
          console.error('❌ Error updating existing comments:', err);
        } else {
          console.log('✅ Existing comments updated with user_id');
        }
        
        // Verificar resultado
        db.all("SELECT * FROM comentarios LIMIT 5", (err, comments) => {
          if (!err) {
            console.log('📊 Sample comments after update:');
            comments.forEach(comment => {
              console.log(`   ID: ${comment.id}, Autor: ${comment.autor}, UserID: ${comment.user_id}, Archivo: ${comment.archivo}`);
            });
          }
          db.close();
        });
      });
    });
  } else {
    console.log('✅ user_id column already exists');
    db.close();
  }
});
