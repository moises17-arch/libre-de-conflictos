<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const loading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  loading.value = true;
  try {
    await authStore.login(email.value, password.value);
    router.push('/eventos');
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.error ||
      err.response?.data?.message ||
      'Correo o contraseña incorrectos.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-logo">
        <span>📅</span>
        <span class="auth-logo-text">Libre de Conflictos</span>
      </div>

      <h1 class="auth-title">Iniciar Sesión</h1>
      <p class="auth-subtitle">Accede a tu cuenta para gestionar tus eventos.</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-email">Correo electrónico</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            placeholder="tu@correo.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="login-password">Contraseña</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <div v-if="errorMessage" class="feedback-error" role="alert">
          <span>❌</span>
          <span>{{ errorMessage }}</span>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <p class="auth-link">
        ¿No tienes cuenta?
        <RouterLink to="/registro">Regístrate aquí</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(54, 53, 55, 0.1);
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
  font-size: 1.25rem;
}

.auth-logo-text {
  font-weight: 700;
  color: #252526;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #3d3d43;
  text-align: center;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  color: #58545d;
  font-size: 0.9rem;
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
  gap: 0.5rem;
}

.form-group label {
  color: #303031;
  font-weight: 600;
  font-size: 0.875rem;
}

.form-group input {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e4e7;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus {
  border-color: #353436;
  box-shadow: 0 0 0 3px rgba(50, 49, 50, 0.15);
}

.feedback-error {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.submit-btn {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #353336, #474648);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
  box-shadow: 0 4px 15px rgba(54, 52, 55, 0.3);
  margin-top: 0.25rem;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: #58545d;
}

.auth-link a {
  color: #353436;
  font-weight: 600;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>
