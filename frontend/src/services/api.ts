/*
 * services/api.ts — Cliente HTTP centralizado (Axios)
 *
 * Este archivo configura la única instancia de Axios que usa toda la app.
 * Todos los stores y vistas hacen sus peticiones HTTP a través de esta instancia,
 * en vez de crear clientes Axios individuales.
 *
 * Configuración base:
 *   - baseURL: apunta al backend en http://localhost:3000/api
 *   - withCredentials: true → el navegador envía automáticamente las cookies
 *     en cada petición, lo que permite que el refresh token (almacenado como
 *     cookie HttpOnly) llegue al endpoint /auth/refresh sin código adicional.
 *
 * Conexiones:
 *   → store/authStore.ts   (usa api para login, register, logout, updateProfile)
 *   → store/eventStore.ts  (usa api para CRUD de eventos)
 *   → router/index.ts      (importado dinámicamente para redirigir a /login)
 *   → store/toastStore.ts  (importado dinámicamente para mostrar errores globales)
 */

import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api', // URL base del backend REST
  withCredentials: true,                // Necesario para enviar la cookie del refresh token
  headers: {
    'Content-Type': 'application/json'
  }
});

/*
 * INTERCEPTOR DE REQUEST
 *
 * Antes de que cada petición salga hacia el servidor, este interceptor
 * lee el access token de localStorage y lo inyecta en el header Authorization.
 * Gracias a esto, ningún store ni vista necesita añadir el token manualmente;
 * todas las peticiones autenticadas lo incluyen de forma transparente.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    // Formato estándar Bearer Token para autenticación JWT
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

/*
 * INTERCEPTOR DE RESPONSE
 *
 * Maneja tres situaciones de error a nivel global:
 *   1. 401 (token expirado): intenta renovar el access token silenciosamente.
 *   2. 429 (rate limit):     muestra siempre un toast de error.
 *   3. Otros errores:        muestra un toast solo si NO es una ruta de /auth/.
 */
api.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, pasa sin modificaciones
  async (error) => {
    const originalRequest = error.config;

    /*
     * REFRESH SILENCIOSO DE TOKEN
     *
     * El access token dura poco tiempo (ej. 15 min). Cuando expira, el servidor
     * responde 401. En lugar de forzar al usuario a re-loguearse, el interceptor
     * intenta obtener un nuevo access token llamando a /auth/refresh.
     * El refresh token se envía automáticamente en la cookie HttpOnly (por eso
     * se configuró withCredentials: true arriba).
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      // _retry es una bandera para evitar un bucle infinito:
      // si /auth/refresh también devuelve 401, no volvemos a intentarlo.
      originalRequest._retry = true;
      try {
        const res = await api.post<{ accessToken: string }>('/auth/refresh');
        const newToken = res.data.accessToken;

        // Guarda el nuevo token para las siguientes peticiones
        localStorage.setItem('accessToken', newToken);

        // Reintentar la petición original con el token renovado
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // El refresh falló (refresh token expirado o inválido):
        // limpiar la sesión y forzar re-login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        try {
          const { default: router } = await import('../router');
          router.push('/login');
        } catch {
          // Si el router no está disponible (caso extremo), recarga la página
          window.location.href = '/login';
        }
      }
    }

    /*
     * ERROR 429 — RATE LIMIT
     *
     * Este error es de infraestructura (demasiadas peticiones), no de lógica
     * de negocio. Se muestra siempre como toast, aunque sea en una ruta de auth.
     */
    if (error.response?.status === 429) {
      import('../store/toastStore').then(({ useToastStore }) => {
        useToastStore().addToast('Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.', 'error');
      });
      return Promise.reject(error);
    }

    /*
     * ERRORES GENÉRICOS — mostrar toast solo fuera de rutas de autenticación
     *
     * Las vistas LoginView y RegisterView muestran sus propios mensajes de error
     * inline debajo del formulario. Si además mostráramos un toast, el usuario
     * vería el mensaje duplicado. Por eso, si la URL contiene '/auth/', no mostramos
     * el toast global y dejamos que la vista lo gestione por sí sola.
     */
    const isAuthRoute = originalRequest?.url?.includes('/auth/');
    if (error.response?.status !== 401 && !isAuthRoute) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error de conexión';
      // Importación dinámica para evitar dependencias circulares en la inicialización
      import('../store/toastStore').then(({ useToastStore }) => {
        useToastStore().addToast(errorMessage, 'error');
      });
    }

    return Promise.reject(error);
  }
);
