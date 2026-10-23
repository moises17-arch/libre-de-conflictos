import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import type { User, AuthResponse } from '../types/user';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const isAuthenticated = computed(() => !!accessToken.value);

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    accessToken.value = res.data.accessToken;
    user.value = res.data.user;
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
    accessToken.value = res.data.accessToken;
    user.value = res.data.user;
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('user', JSON.stringify(res.data.user));
  }

  async function logout() {
    try { await api.post('/auth/logout'); } catch {}
    accessToken.value = null;
    user.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }

  function initAuth() {
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      accessToken.value = token;
      user.value = JSON.parse(savedUser);
    }
  }

  return { user, accessToken, isAuthenticated, login, register, logout, initAuth };
});
