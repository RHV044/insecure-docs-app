// navbar.js - Componente de navegación dinámico
function createNavbar(currentPage = '', userRole = null) {
  const isAdmin = userRole === 'admin';
  
  // Links básicos disponibles para todos los usuarios autenticados
  const baseLinks = [
    { href: '/dashboard', text: 'Panel', page: 'dashboard' },
    { href: '/ver-documentos', text: 'Documentos', page: 'ver-documentos' }
  ];
    // Links solo para administradores
  const adminLinks = [
    { href: '/upload', text: 'Subir', page: 'upload' }
  ];
    // Links de autenticación
  const authLinks = [
    { href: 'javascript:void(0)', text: 'Salir', page: 'logout', onclick: 'window.authManager.logout()' }
  ];
  
  // Construir la lista de links según el rol
  let allLinks = [...baseLinks];
  
  if (isAdmin) {
    allLinks = [...allLinks, ...adminLinks];
  }
  
  allLinks = [...allLinks, ...authLinks];
    // Generar HTML del navbar
  const linksHtml = allLinks.map(link => {
    const onclickAttr = link.onclick ? ` onclick="${link.onclick}"` : '';
    return `<li><a href="${link.href}" class="nav-link ${currentPage === link.page ? 'active' : ''}"${onclickAttr}>${link.text}</a></li>`;
  }).join('');
    return `
    <nav class="navbar">
      <div class="navbar-container">
        <a href="/" class="brand">
          Gestor Docs <span class="x">G3</span>
        </a>
        <ul class="nav-links" id="nav-links">
          ${linksHtml}
        </ul>
      </div>
    </nav>
  `;
}

// Función para renderizar el navbar dinámicamente con JWT
async function renderNavbar(currentPage = '') {
  try {
    // Verificar si tenemos auth manager disponible
    if (typeof window.authManager !== 'undefined' && window.authManager.isAuthenticated()) {
      // Obtener información del usuario actual usando JWT
      const userData = await window.authManager.getCurrentUser();
      
      if (userData) {
        // Usuario autenticado
        const navbarHtml = createNavbar(currentPage, userData.rol);
        document.body.insertAdjacentHTML('afterbegin', navbarHtml);
        return;
      }
    }
    
    // Usuario no autenticado - mostrar navbar básico
    const basicNavbar = `
      <nav class="navbar">
        <div class="navbar-container">
          <a href="/" class="brand">Gestor Docs <span class="x">G3</span></a>
          <ul class="nav-links">
            <li><a href="/" class="nav-link ${currentPage === 'inicio' ? 'active' : ''}">Inicio</a></li>
            <li><a href="/login" class="nav-link ${currentPage === 'login' ? 'active' : ''}">Login</a></li>
          </ul>
        </div>
      </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', basicNavbar);
    
  } catch (error) {
    console.error('Error renderizando navbar:', error);
    // Fallback: navbar básico en caso de error
    const basicNavbar = `
      <nav class="navbar">
        <div class="navbar-container">
          <a href="/" class="brand">Gestor Docs <span class="x">G3</span></a>
          <ul class="nav-links">
            <li><a href="/" class="nav-link ${currentPage === 'inicio' ? 'active' : ''}">Inicio</a></li>
            <li><a href="/login" class="nav-link ${currentPage === 'login' ? 'active' : ''}">Login</a></li>
          </ul>
        </div>
      </nav>
    `;
    document.body.insertAdjacentHTML('afterbegin', basicNavbar);
  }
}
