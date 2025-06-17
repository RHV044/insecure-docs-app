# Demo de Vulnerabilidades Web

Este proyecto es una aplicación web simple y vulnerable, creada con fines educativos para la materia de Seguridad en aplicaciones Web.

## Funcionalidades vulnerables
- **Login inseguro:** Contraseñas en texto plano y sin protección.
- **Formulario XSS:** Refleja el input del usuario sin sanitizar.
- **SQLi simulado:** Consulta vulnerable a inyección SQL (simulada).
- **Subida de archivos insegura:** Sin validación de tipo ni tamaño.

## Requisitos
- [Node.js](https://nodejs.org/) (v14 o superior)
- npm (incluido con Node.js)

## Instalación y uso
1. **Clona el repositorio y entra a la carpeta del proyecto:**
   ```bash
   git clone <url-del-repo>
   cd <carpeta-del-repo>/app
   ```
2. **Instala las dependencias:**
   ```bash
   npm install
   ```
3. **Inicializa la base de datos SQLite con usuarios de ejemplo:**
   ```bash
   npm run initdb
   ```
   Esto crea el archivo `usuarios.db` con los usuarios:
   - admin / admin123 (rol admin)
   - user / user123 (rol user)

4. **Ejecuta el servidor:**
   ```bash
   npm start
   # o
   node server.js
   ```
5. **Abre la app en tu navegador:**
   [http://localhost:3000](http://localhost:3000)

## Notas
- Los archivos subidos se guardan en la carpeta `files`.
- Solo el usuario admin puede subir archivos. Los usuarios normales solo pueden ver y descargar.
- Si modificas los usuarios, vuelve a correr `npm run initdb` para reiniciar la base.

## Advertencia
No uses este código en producción. Es intencionalmente inseguro para fines de demostración y práctica de explotación.
