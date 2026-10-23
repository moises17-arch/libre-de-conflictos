<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventStore } from '../store/eventStore';

const eventStore = useEventStore();
const userId = ref<number>(1);
const title = ref<string>('');
const description = ref<string>('');
const startTime = ref<string>('');
const endTime = ref<string>('');
const timezone = ref<string>('America/Bogota');
const feedbackMessage = ref<string>('');
const isError = ref<boolean>(false);

onMounted(() => {
  eventStore.fetchEvents(userId.value);
});

async function handleSubmit() {
  feedbackMessage.value = '';
  const result = await eventStore.createEvent({
    userId: userId.value,
    title: title.value,
    description: description.value,
    startTime: startTime.value,
    endTime: endTime.value,
    timezone: timezone.value
  });
  isError.value = !result.success;
  feedbackMessage.value = result.message;
  if (result.success) {
    title.value = '';
    description.value = '';
    startTime.value = '';
    endTime.value = '';
  }
}
</script>

<template>
  <div class="eventos-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Gestión de Eventos</h1>
      <p class="page-subtitle">
        Crea y visualiza tus eventos. El sistema detecta conflictos automáticamente.
      </p>
    </div>

    <!-- Two-column layout -->
    <div class="eventos-grid">
      <!-- Left column: Form -->
      <div class="form-card">
        <h2 class="card-title">📝 Nuevo Evento</h2>

        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="ev-title">Título</label>
            <input
              id="ev-title"
              v-model="title"
              type="text"
              required
              placeholder="Nombre del evento"
            />
          </div>

          <div class="form-group">
            <label for="ev-desc">Descripción</label>
            <textarea
              id="ev-desc"
              v-model="description"
              rows="3"
              placeholder="Descripción opcional"
            ></textarea>
          </div>

          <div class="form-group">
            <label for="ev-start">Inicio</label>
            <input
              id="ev-start"
              v-model="startTime"
              type="datetime-local"
              required
            />
          </div>

          <div class="form-group">
            <label for="ev-end">Fin</label>
            <input
              id="ev-end"
              v-model="endTime"
              type="datetime-local"
              required
            />
          </div>

          <button type="submit" class="submit-btn">Guardar Evento</button>

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

      <!-- Right column: Event list -->
      <div class="events-card">
        <h2 class="card-title">📋 Mis Eventos</h2>

        <div v-if="eventStore.loading" class="state-msg">
          Cargando eventos...
        </div>

        <div v-else-if="eventStore.events.length === 0" class="state-empty">
          <span class="empty-icon">📭</span>
          <p>No hay eventos registrados aún.</p>
        </div>

        <div v-else>
          <div
            v-for="ev in eventStore.events"
            :key="ev.id"
            class="event-item"
          >
            <p class="event-title">{{ ev.title }}</p>
            <p class="event-time">
              🕒 De:
              {{ new Date(ev.startTime || (ev as any).start_time).toLocaleString() }}
              hasta
              {{ new Date(ev.endTime || (ev as any).end_time).toLocaleString() }}
            </p>
            <p v-if="ev.description" class="event-desc">{{ ev.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.eventos-page {
  max-width: 1100px;
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

/* Two-column grid */
.eventos-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 768px) {
  .eventos-grid {
    grid-template-columns: 1fr;
  }
}

/* Cards shared */
.form-card,
.events-card {
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

/* Form */
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e4e7;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #353436;
  box-shadow: 0 0 0 3px rgba(50, 49, 50, 0.15);
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

/* Event list */
.state-msg {
  text-align: center;
  color: #6b6375;
  padding: 2rem 0;
}

.state-empty {
  text-align: center;
  color: #6b6375;
  padding: 2rem 0;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
}

.event-item {
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e5e4e7;
  margin-bottom: 0.75rem;
  background: #fafafa;
  transition: background 0.2s;
}

.event-item:hover {
  background: #f8f7ff;
}

.event-title {
  font-weight: 700;
  color: #1a1a2e;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.event-time {
  font-size: 0.8125rem;
  color: #6b6375;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.event-desc {
  font-size: 0.875rem;
  color: #6b6375;
  margin-top: 0.375rem;
}
</style>
