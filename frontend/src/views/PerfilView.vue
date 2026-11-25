<script setup lang="ts">
/*
 * views/PerfilView.vue — Vista de perfil de usuario
 *
 * Permite al usuario ver su información actual y editarla:
 *   - Nombre y email (pre-rellenos con los datos del store al montar la vista)
 *   - Contraseña (opcional: si se deja en blanco no se modifica)
 *
 * Flujo de edición:
 *   1. onMounted() carga el nombre y email actuales desde authStore.user.
 *   2. El usuario edita los campos y hace clic en "Guardar cambios".
 *   3. handleSubmit() valida la contraseña (mínimo 6 chars, coincidencia).
 *   4. Llama a authStore.updateProfile() que hace PUT /users/profile.
 *   5. Si tiene éxito, limpia los campos de contraseña y muestra toast.
 *
 * Conexiones:
 *   → store/authStore.ts   (lee user, llama a updateProfile)
 *   → store/toastStore.ts  (muestra notificaciones de éxito/error)
 */
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const authStore = useAuthStore();
const toastStore = useToastStore();

const name = ref('');
const email = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const feedbackMessage = ref('');
const isError = ref(false);
const passwordError = ref('');

/*
 * Pre-rellena el formulario con los datos actuales del usuario.
 * Se usa onMounted() y no valores por defecto en ref() para garantizar
 * que el store ya esté hidratado cuando se leen los datos
 * (initAuth() en el router guard se ejecuta antes de que el componente monte).
 */
onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name;
    email.value = authStore.user.email;
  }
});

/**
 * Envía el formulario de actualización de perfil.
 *
 * Validaciones locales antes de llamar al backend:
 *   - Si se escribió una contraseña nueva, debe tener al menos 6 caracteres.
 *   - newPassword y confirmPassword deben coincidir.
 *
 * Si la actualización tiene éxito:
 *   - Se limpian los campos de contraseña por seguridad (no dejar texto plano en el DOM).
 *   - Se muestra un toast de éxito.
 *
 * Si falla: se muestra un toast de error y el mensaje inline.
 */
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
    // Si no se escribió contraseña, se envía undefined para que el backend no la modifique
    password: newPassword.value || undefined,
  });

  isError.value = !result.success;
  feedbackMessage.value = result.message;

  if (result.success) {
    toastStore.toastSuccess(result.message);
    // Limpiar campos de contraseña tras actualización exitosa por seguridad
    newPassword.value = '';
    confirmPassword.value = '';
  } else {
    toastStore.toastError(result.message);
  }
}

/**
 * Formatea una fecha ISO a formato legible en español largo (ej. "12 de enero de 2025").
 * Se usa para mostrar la fecha de creación de cuenta ("Miembro desde").
 *
 * @param dateStr - Fecha en formato ISO 8601 o undefined si el dato no está disponible
 * @returns       - Fecha formateada en español o '—' si dateStr es falsy
 */
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
      <!-- Formulario de edición -->
      <div class="perfil-card">
        <!-- Avatar con iniciales del nombre -->
        <div class="avatar-section">
          <div class="avatar">
            <!--
              Genera las iniciales del avatar a partir del nombre:
                .split(' ')          → divide el nombre en palabras ['Juan', 'Pérez']
                .map(n => n[0])      → toma la primera letra de cada palabra ['J', 'P']
                .slice(0, 2)         → limita a 2 iniciales para nombres largos
                .join('').toUpperCase() → une y convierte a mayúsculas → 'JP'
            -->
            {{ authStore.user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?' }}
          </div>
          <p class="avatar-name">{{ authStore.user?.name || '—' }}</p>
        </div>

        <h2 class="card-title">Editar Información</h2>

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

          <!-- Error de validación de contraseña (local, antes de llamar al backend) -->
          <div v-if="passwordError" class="feedback-message feedback-error">
            <span>❌</span>
            <span>{{ passwordError }}</span>
          </div>

          <button type="submit" class="submit-btn">Guardar cambios</button>

          <!-- Respuesta del backend: éxito o error -->
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

      <!-- Tarjeta de información de cuenta (solo lectura) -->
      <div class="info-card">
        <h2 class="card-title">Información de cuenta</h2>
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
          <!-- formatDate convierte la fecha ISO a formato legible en español -->
          <span class="info-value">{{ formatDate(authStore.user?.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perfil-page {
  max-width: 700px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* Avatar */
.avatar-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 64px;
  height: 64px;
  background: #374151;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
}

.avatar-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.25rem;
}

.form-group {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.4rem;
}

.form-group input {
  width: 100%;
  padding: 0.6875rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  color: #111827;
}

.form-group input:focus {
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
}

.divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.25rem 0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 1rem;
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
  transition: background 0.2s;
  margin-top: 0.25rem;
  font-family: inherit;
}

.submit-btn:hover {
  background: #1f2937;
}

.feedback-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.feedback-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.feedback-success {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #a7f3d0;
}

/* Info card */
.info-row {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info-value {
  font-size: 0.9375rem;
  color: #111827;
  font-weight: 500;
}
</style>
