<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const loading = ref(false);

async function handleRegister() {
  errorMessage.value = '';

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Las contraseñas no coinciden.';
    return;
  }

  loading.value = true;
  try {
    await authStore.register(name.value, email.value, password.value);
    router.push('/eventos');
  } catch (err: any) {
    const data = err.response?.data;
    if (data?.errors && Array.isArray(data.errors)) {
      // Errores de validación Zod: array de { message }
      errorMessage.value = data.errors.map((e: any) => e.message).join(', ');
    } else {
      errorMessage.value =
        data?.error ||
        data?.message ||
        'Error al crear la cuenta. Intenta de nuevo.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <span class="auth-logo-text">Libre de Conflictos</span>
      </div>

      <h1 class="auth-title">Crear Cuenta</h1>
      <p class="auth-subtitle">Regístrate para comenzar a gestionar tus eventos.</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="reg-name">Nombre completo</label>
          <input
            id="reg-name"
            v-model="name"
            type="text"
            required
            placeholder="Tu nombre"
            autocomplete="name"
          />
        </div>

        <div class="form-group">
          <label for="reg-email">Correo electrónico</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            required
            placeholder="tu@correo.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="reg-password">Contraseña</label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <div class="form-group">
          <label for="reg-confirm">Confirmar contraseña</label>
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>

        <div v-if="errorMessage" class="feedback-error" role="alert">
          <span>❌</span>
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
        </button>
      </form>

      <p class="auth-link">
        ¿Ya tienes cuenta?
        <RouterLink to="/login">Inicia sesión aquí</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #f4f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 8px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  margin-bottom: 1.75rem;
  font-size: 1.0625rem;
}

.auth-logo-icon {
  width: 36px;
  height: 36px;
  background: #111827;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.auth-logo-text {
  font-weight: 700;
  color: #111827;
}

.auth-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin-bottom: 0.375rem;
}

.auth-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1.75rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  padding: 0.6875rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
  color: #111827;
}

.form-group input:focus {
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
}

.feedback-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
  font-family: inherit;
}

.submit-btn:hover:not(:disabled) {
  background: #1f2937;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
  margin-top: 1.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.auth-link a {
  color: #374151;
  font-weight: 500;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>
