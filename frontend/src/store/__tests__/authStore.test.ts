import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../authStore';

// Mock the api service
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../../services/api';

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initAuth — carga token y user de localStorage correctamente', () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
    localStorage.setItem('accessToken', 'my-token-123');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const store = useAuthStore();
    store.initAuth();

    expect(store.accessToken).toBe('my-token-123');
    expect(store.user).toEqual(mockUser);
  });

  it('initAuth — no hace nada si localStorage está vacío', () => {
    const store = useAuthStore();
    store.initAuth();

    expect(store.accessToken).toBeNull();
    expect(store.user).toBeNull();
  });

  it('login — llama a la API correctamente y actualiza el state', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@test.com' };
    const mockResponse = { data: { accessToken: 'new-token', user: mockUser } };
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    const store = useAuthStore();
    await store.login('test@test.com', 'password123');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'password123',
    });
    expect(store.accessToken).toBe('new-token');
    expect(store.user).toEqual(mockUser);
  });

  it('register — llama a la API y guarda en localStorage', async () => {
    const mockUser = { id: 2, name: 'New User', email: 'new@test.com' };
    const mockResponse = { data: { accessToken: 'reg-token', user: mockUser } };
    vi.mocked(api.post).mockResolvedValueOnce(mockResponse);

    const store = useAuthStore();
    await store.register('New User', 'new@test.com', 'password123');

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'New User',
      email: 'new@test.com',
      password: 'password123',
    });
    expect(localStorage.getItem('accessToken')).toBe('reg-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(mockUser);
  });

  it('logout — limpia state y localStorage', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({});

    const store = useAuthStore();
    store.$patch({ accessToken: 'some-token', user: { id: 1, name: 'U', email: 'u@u.com' } as any });
    localStorage.setItem('accessToken', 'some-token');
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    await store.logout();

    expect(store.accessToken).toBeNull();
    expect(store.user).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('isAuthenticated — es true cuando hay token, false cuando no', () => {
    const store = useAuthStore();
    expect(store.isAuthenticated).toBe(false);

    store.$patch({ accessToken: 'valid-token' });
    expect(store.isAuthenticated).toBe(true);
  });
});
