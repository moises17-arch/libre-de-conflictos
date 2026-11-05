import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor de respuesta: refresca el token en caso de 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await api.post<{ accessToken: string }>('/auth/refresh');
        const newToken = res.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // Show toast for all non-401 errors (401 is handled silently above)
    if (error.response?.status !== 401) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Error de conexión';
      // Lazily import to avoid circular deps at module init time
      import('../store/toastStore').then(({ useToastStore }) => {
        useToastStore().addToast(errorMessage, 'error');
      });
    }
    return Promise.reject(error);
  }
);