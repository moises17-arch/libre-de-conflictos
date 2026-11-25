/*
 * store/authStore.ts — Store de autenticación (Pinia)
 *
 * Gestiona el estado global de autenticación de la aplicación:
 * quién está logueado, su token JWT, y las acciones para iniciar/cerrar sesión.
 *
 * Estado que maneja:
 *   - user:          datos del usuario autenticado (nombre, email, etc.)
 *   - accessToken:   JWT de corta duración (15 min aprox.) para peticiones API
 *   - isAuthenticated: derivado reactivo del accessToken
 *
 * Conexiones:
 *   → services/api.ts       (hace las peticiones HTTP de auth)
 *   → router/index.ts       (el navigation guard usa initAuth e isAuthenticated)
 *   → layouts/MainLayout.vue (usa isAuthenticated para mostrar/ocultar nav links)
 *   → views/HomeView.vue    (muestra dashboard o landing según isAuthenticated)
 *   → views/PerfilView.vue  (lee y actualiza user)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import type { User, AuthResponse, UpdateProfilePayload } from '../types/user';

export const useAuthStore = defineStore('auth', () => {
  // Datos del usuario actualmente logueado; null si no hay sesión activa
  const user = ref<User | null>(null);

  // Token JWT de corta duración usado para autenticar peticiones al backend
  const accessToken = ref<string | null>(null);

  // Computed derivado: true si existe un accessToken, false en caso contrario.
  // Los templates y el router guard usan esta propiedad en lugar de revisar el token directamente.
  const isAuthenticated = computed(() => !!accessToken.value);

  /**
   * Inicia sesión con email y contraseña.
   * Guarda el access token en localStorage para que persista entre recargas
   * (el refresh token no se guarda aquí porque ya viene en la cookie HttpOnly
   * que el navegador gestiona automáticamente).
   *
   * @param email    - Correo del usuario
   * @param password - Contraseña del usuario
   * @throws         - Propaga el error de Axios si el servidor rechaza las credenciales
   */
  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    accessToken.value = res.data.accessToken;
    user.value = res.data.user;
    // Persistir en localStorage para que initAuth() pueda rehidratar tras una recarga
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  /**
   * Registra un nuevo usuario y lo deja logueado automáticamente.
   * El token y el usuario se persisten en localStorage igual que en login().
   *
   * @param name     - Nombre completo del nuevo usuario
   * @param email    - Correo electrónico
   * @param password - Contraseña (el backend la valida y hashea con bcrypt)
   * @throws         - Propaga el error de Axios (ej. email ya registrado)
   */
  async function register(name: string, email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
    accessToken.value = res.data.accessToken;
    user.value = res.data.user;
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  /**
   * Cierra la sesión del usuario.
   * Llama al endpoint del backend para invalidar el refresh token en la base de datos.
   * El try/catch ignora deliberadamente los errores del servidor: si el backend falla
   * (ej. el token ya expiró), igual se limpia el estado local para que el usuario
   * quede deslogueado en el frontend sin importar lo que pase en el servidor.
   */
  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    // Limpiar el estado en memoria
    accessToken.value = null;
    user.value = null;
    // Limpiar la sesión persistida en disco
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  /**
   * Rehidrata el store desde localStorage.
   *
   * FUNCIÓN CRÍTICA PARA RECARGAS DE PÁGINA:
   * Cuando el usuario presiona F5, Vue destruye y recrea todos los stores de Pinia
   * desde cero (Pinia es in-memory, no persiste sola). Sin initAuth(), el usuario
   * parecería deslogueado tras cada recarga aunque tenga una sesión válida.
   * El navigation guard del router llama a esta función en cada navegación para
   * asegurarse de que el store esté siempre hidratado.
   */
  function initAuth() {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      accessToken.value = token;
      user.value = JSON.parse(savedUser);
    }
  }

  /**
   * Actualiza el nombre, email y/o contraseña del usuario autenticado.
   * Si la actualización tiene éxito, sincroniza los datos del store y localStorage
   * con los nuevos datos devueltos por el servidor.
   *
   * @param payload - Objeto con los campos a actualizar (nombre, email, contraseña opcional)
   * @returns       - { success: true, message } en éxito, o { success: false, message } en error
   */
  async function updateProfile(payload: UpdateProfilePayload): Promise<{ success: boolean; message: string }> {
    try {
      const res = await api.put('/users/profile', payload);
      // Actualizar el store con los datos frescos del servidor
      user.value = res.data.data;
      // Sincronizar localStorage para que la próxima recarga muestre el nombre/email nuevo
      localStorage.setItem('user', JSON.stringify(res.data.data));
      return { success: true, message: 'Perfil actualizado correctamente' };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Error al actualizar el perfil' };
    }
  }

  return { user, accessToken, isAuthenticated, login, register, logout, initAuth, updateProfile };
});
