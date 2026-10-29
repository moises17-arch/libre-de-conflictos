<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../store/authStore';

const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const feedbackMessage = ref('');
const isError = ref(false);
const passwordError = ref('');

onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name;
    email.value = authStore.user.email;
  }
});

async function handleSubmit() {
  feedbackMessage.value = '';
  passwordError.value = '';

  if (newPassword.value) {
    if (newPassword.value.length < 6) {
      passwordError.value = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = 'Las contraseñas no coinciden';
      return;
    }
  }

  const result = await authStore.updateProfile({
    name: name.value,
    email: email.value,
    password: newPassword.value || undefined,
  });

  isError.value = !result.success;
  feedbackMessage.value = result.message;

  if (result.success) {
    newPassword.value = '';
    confirmPassword.value = '';
  }
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es', { dateStyle: 'long' });
}
</script>

<template>
  <div class="perfil-page">
    <div class="page-header">
      <h1 class="page-title">Mi Perfil</h1>
      <p class="page-subtitle">Actualiza tu información personal y contraseña.</p>
    </div>

    <div class="perfil-grid">
      <!-- Edit form -->
      <div class="perfil-card">
        <h2 class="card-title">✏️ Editar Información</h2>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="perfil-name">Nombre</label>
            <input
              id="perfil-name"
              v-model="name"
              type="text"
              required
              placeholder="Tu nombre"
            />
          </div>

          <div class="form-group">
            <label for="perfil-email">Email</label>
            <input
              id="perfil-email"
              v-model="email"
              type="email"
              required
              placeholder="tu@email.com"
            />
          </div>

          <div class="divider"></div>
          <p class="section-label">Cambiar contraseña (opcional)</p>

          <div class="form-group">
            <label for="perfil-password">Nueva contraseña</label>
            <input
              id="perfil-password"
              v-model="newPassword"
              type="password"
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>

          <div class="form-group">
            <label for="perfil-confirm">Confirmar contraseña</label>
            <input
              id="perfil-confirm"
              v-model="confirmPassword"
              type="password"
              placeholder="Repetir nueva contraseña"
            />
          </div>

          <div v-if="passwordError" class="feedback-message feedback-error">
            <span>❌</span>
            <span>{{ passwordError }}</span>
          </div>

          <button type="submit" class="submit-btn">Guardar cambios</button>

          <div
            v-if="feedbackMessage"
            class="feedback-message"
            :class="isError ? 'feedback-error' : 'feedback-success'"
          >
            <span>{{ isError ? '❌' : '✅' }}</span>
            <span>{{ feedbackMessage }}</span>
          </div>
        </form>
      </div>

      <!-- Info card -->
      <div class="info-card">
        <h2 class="card-title">ℹ️ Información de cuenta</h2>
        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span class="info-value">{{ authStore.user?.name || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value">{{ authStore.user?.email || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Miembro desde</span>
          <span class="info-value">{{ formatDate(authStore.user?.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perfil-page {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #3d3d43;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #58545d;
  font-size: 1rem;
}

.perfil-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 680px) {
  .perfil-grid {
    grid-template-columns: 1fr;
  }
}

.perfil-card,
.info-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(54, 53, 55, 0.1);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #252526;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #303031;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e4e7;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #353436;
  box-shadow: 0 0 0 3px rgba(50, 49, 50, 0.15);
}

.divider {
  border: none;
  border-top: 1px solid #e5e4e7;
  margin: 1.25rem 0 1rem;
}

.section-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b6375;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
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
  transition: transform 0.2s;
  box-shadow: 0 4px 15px rgba(54, 52, 55, 0.3);
  margin-top: 0.25rem;
}

.submit-btn:hover {
  transform: translateY(-2px);
}

.feedback-message {
  margin-top: 1rem;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.feedback-error {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.feedback-success {
  background: #f0fdf4;
  color: #10b981;
  border: 1px solid #a7f3d0;
}

/* Info card */
.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 0;
  border-bottom: 1px solid #f0eff2;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b6375;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.9375rem;
  color: #3d3d43;
  font-weight: 500;
}
</style>
