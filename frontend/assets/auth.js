// Utilidades para manejo de JWT en el frontend
class AuthManager {
  constructor() {
    this.token = localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
  }
  
  // Guardar token
  setToken(token, remember = false) {
    console.log('💾 FRONTEND: Saving token');
    console.log('   Token (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NULL');
    console.log('   Remember me:', remember);
    
    this.token = token;
    if (remember) {
      localStorage.setItem('jwt_token', token);
      sessionStorage.removeItem('jwt_token');
      console.log('   Saved to: localStorage');
    } else {
      sessionStorage.setItem('jwt_token', token);
      localStorage.removeItem('jwt_token');
      console.log('   Saved to: sessionStorage');
    }
    
    // TAMBIÉN guardar en cookie para navegación de páginas
    const expires = remember ? new Date(Date.now() + 24*60*60*1000) : undefined;
    document.cookie = `token=${token}; path=/; ${expires ? `expires=${expires.toUTCString()};` : ''} SameSite=Lax`;
  }

  // Obtener token
  getToken() {
    const token = this.token || localStorage.getItem('jwt_token') || sessionStorage.getItem('jwt_token');
    console.log('🔑 FRONTEND: Getting token');
    console.log('   Found token:', token ? token.substring(0, 50) + '...' : 'NONE');
    return token;
  }

  // Eliminar token
  removeToken() {
    this.token = null;
    localStorage.removeItem('jwt_token');
    sessionStorage.removeItem('jwt_token');
    // También eliminar cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // Obtener headers con authorization
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Verificar si está autenticado
  isAuthenticated() {
    return !!this.getToken();
  }

  // Hacer fetch con autenticación
  async authenticatedFetch(url, options = {}) {
    console.log('📡 FRONTEND: Making authenticated request to:', url);
    
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers
    };

    console.log('📤 FRONTEND: Request headers:', headers);

    const response = await fetch(url, {
      ...options,
      headers
    });

    console.log('📥 FRONTEND: Response status:', response.status);

    // Si hay error 401, remover token (pero no redirigir automáticamente)
    if (response.status === 401) {
      console.log('❌ FRONTEND: 401 Unauthorized - removing token');
      this.removeToken();
      // Solo redirigir si estamos en una página protegida, no en login
      const protectedPages = ['/dashboard', '/upload', '/ver-documentos'];
      const currentPath = window.location.pathname;
      console.log('🔄 FRONTEND: Current path:', currentPath);
      if (protectedPages.some(page => currentPath.includes(page))) {
        console.log('🔄 FRONTEND: Redirecting to login from protected page');
        window.location.href = '/login';
      }
    }

    return response;
  }

  // Login
  async login(username, password, remember = false) {
    console.log('🔐 FRONTEND: Attempting login');
    console.log('   Username:', username);
    console.log('   Remember:', remember);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      console.log('📡 FRONTEND: Login response status:', response.status);
      const data = await response.json();
      console.log('📦 FRONTEND: Login response data:', data);
      
      if (data.success && data.token) {
        console.log('✅ FRONTEND: Login successful, saving token');
        this.setToken(data.token, remember);
        return { success: true, user: data.user, redirect: data.redirect };
      } else {
        console.log('❌ FRONTEND: Login failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.log('❌ FRONTEND: Login error:', error);
      return { success: false, message: 'Error de conexión' };
    }
  }

  // Logout
  async logout() {
    try {
      await this.authenticatedFetch('/api/auth/logout');
    } catch (error) {
      console.log('Error en logout:', error);
    } finally {
      this.removeToken();
      window.location.href = '/';
    }
  }

  // Obtener información del usuario actual
  async getCurrentUser() {
    console.log('👤 FRONTEND: Getting current user');
    
    try {
      const response = await this.authenticatedFetch('/api/auth/user');
      console.log('📡 FRONTEND: getCurrentUser response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ FRONTEND: User data received:', userData);
        return userData;
      }
      console.log('❌ FRONTEND: getCurrentUser failed - response not ok');
      return null;
    } catch (error) {
      console.log('❌ FRONTEND: getCurrentUser error:', error);
      return null;
    }
  }
}

// Instancia global
window.authManager = new AuthManager();

// Verificar autenticación en páginas protegidas
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 FRONTEND: DOMContentLoaded - checking page protection');
  
  const protectedPages = ['/dashboard', '/upload', '/ver-documentos'];
  const currentPath = window.location.pathname;
  
  console.log('🛡️ FRONTEND: Current path:', currentPath);
  console.log('🛡️ FRONTEND: Protected pages:', protectedPages);
  
  const isProtectedPage = protectedPages.some(page => currentPath.includes(page));
  console.log('🛡️ FRONTEND: Is protected page:', isProtectedPage);
  
  if (isProtectedPage) {
    const isAuth = window.authManager.isAuthenticated();
    console.log('🔐 FRONTEND: Is authenticated:', isAuth);
    
    if (!isAuth) {
      console.log('🔄 FRONTEND: Not authenticated on protected page - redirecting to login');
      window.location.href = '/login';
      return;
    } else {
      console.log('✅ FRONTEND: User is authenticated on protected page');
    }
  } else {
    console.log('📖 FRONTEND: This is not a protected page');
  }
});
