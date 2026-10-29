<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import type { EventModel } from '../types/event';

const eventStore = useEventStore();
const authStore = useAuthStore();

// Create form state
const title = ref<string>('');
const description = ref<string>('');
const startTime = ref<string>('');
const endTime = ref<string>('');
const timezone = ref<string>('America/Bogota');
const feedbackMessage = ref<string>('');
const isError = ref<boolean>(false);

// Edit modal state
const editingEvent = ref<EventModel | null>(null);
const editTitle = ref('');
const editDescription = ref('');
const editStartTime = ref('');
const editEndTime = ref('');
const editTimezone = ref('');
const editFeedback = ref('');
const editIsError = ref(false);

onMounted(() => {
  eventStore.fetchEvents(authStore.user!.id);
});

async function handleSubmit() {
  feedbackMessage.value = '';
  const result = await eventStore.createEvent({
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

function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

function openEdit(ev: EventModel) {
  editingEvent.value = { ...ev };
  editTitle.value = ev.title;
  editDescription.value = ev.description || '';
  editStartTime.value = toDatetimeLocal(ev.startTime || (ev as any).start_time);
  editEndTime.value = toDatetimeLocal(ev.endTime || (ev as any).end_time);
  editTimezone.value = ev.timezone;
  editFeedback.value = '';
  editIsError.value = false;
}

function closeEdit() {
  editingEvent.value = null;
}

async function handleUpdate() {
  editFeedback.value = '';
  const result = await eventStore.updateEvent(editingEvent.value!.id!, {
    title: editTitle.value,
    description: editDescription.value,
    startTime: editStartTime.value,
    endTime: editEndTime.value,
    timezone: editTimezone.value,
  });
  editIsError.value = !result.success;
  editFeedback.value = result.message;
  if (result.success) {
    closeEdit();
  }
}

async function handleDelete(id: number) {
  if (!confirm('¿Seguro que quieres eliminar este evento?')) return;
  const result = await eventStore.deleteEvent(id);
  isError.value = !result.success;
  feedbackMessage.value = result.message;
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
            <div class="event-actions">
              <button class="btn-edit" @click="openEdit(ev)">✏️ Editar</button>
              <button class="btn-delete" @click="handleDelete(ev.id!)">🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit modal overlay -->
    <div
      v-if="editingEvent"
      class="edit-modal-overlay"
      @click.self="closeEdit"
    >
      <div class="edit-modal">
        <div class="modal-header">
          <h3 class="modal-title">✏️ Editar Evento</h3>
          <button class="close-btn" @click="closeEdit">✕</button>
        </div>

        <form @submit.prevent="handleUpdate">
          <div class="form-group">
            <label>Título</label>
            <input v-model="editTitle" type="text" required placeholder="Nombre del evento" />
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="editDescription" rows="3" placeholder="Descripción opcional"></textarea>
          </div>

          <div class="form-group">
            <label>Inicio</label>
            <input v-model="editStartTime" type="datetime-local" required />
          </div>

          <div class="form-group">
            <label>Fin</label>
            <input v-model="editEndTime" type="datetime-local" required />
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeEdit">Cancelar</button>
            <button type="submit" class="update-btn">Actualizar</button>
          </div>

          <div
            v-if="editFeedback"
            class="feedback-message"
            :class="editIsError ? 'feedback-error' : 'feedback-success'"
          >
            <span>{{ editIsError ? '❌' : '✅' }}</span>
            <span>{{ editFeedback }}</span>
          </div>
        </form>
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
  background: #f5f5f5;
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

/* Edit/Delete actions */
.event-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.btn-edit,
.btn-delete {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.2s, transform 0.1s;
}

.btn-edit {
  background: #f0f0f2;
  color: #3d3d43;
}

.btn-edit:hover {
  background: #e0e0e4;
  transform: translateY(-1px);
}

.btn-delete {
  background: #fef2f2;
  color: #ef4444;
}

.btn-delete:hover {
  background: #fee2e2;
  transform: translateY(-1px);
}

/* Edit modal */
.edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.edit-modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #252526;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  color: #6b6375;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f0f0f2;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f0f0f2;
  color: #3d3d43;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.cancel-btn:hover {
  background: #e0e0e4;
}

.update-btn {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #353336, #474648);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 15px rgba(54, 52, 55, 0.3);
}

.update-btn:hover {
  transform: translateY(-1px);
}
</style>
