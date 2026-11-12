<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import type { EventModel } from '../types/event';
import { useToastStore } from '../store/toastStore';
import EventFilter from '../components/EventFilter.vue';
import SkeletonCard from '../components/SkeletonCard.vue';

const eventStore = useEventStore();
const authStore = useAuthStore();
const toastStore = useToastStore();

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

function changePage(page: number) {
  eventStore.fetchEvents(authStore.user!.id, page);
}

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
    toastStore.toastSuccess(result.message);
  } else {
    toastStore.toastError(result.message);
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
    toastStore.toastSuccess(result.message);
    closeEdit();
  } else {
    toastStore.toastError(result.message);
  }
}

async function handleDelete(id: number) {
  if (!confirm('¿Seguro que quieres eliminar este evento?')) return;
  const result = await eventStore.deleteEvent(id);
  if (result.success) {
    toastStore.toastSuccess(result.message);
  } else {
    toastStore.toastError(result.message);
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
        <h2 class="card-title">Nuevo Evento</h2>

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
        <h2 class="card-title">Mis Eventos</h2>

        <EventFilter />

        <template v-if="eventStore.loading">
          <SkeletonCard v-for="n in 3" :key="n" :lines="3" :showTitle="true" />
        </template>

        <template v-else>
          <div v-if="eventStore.filteredEvents.length === 0" class="state-empty">
            <p>No hay eventos registrados aún.</p>
          </div>

          <div v-else>
            <div
              v-for="ev in eventStore.filteredEvents"
              :key="ev.id"
              class="event-item"
            >
              <p class="event-title">{{ ev.title }}</p>
              <p class="event-time">
                De:
                {{ new Date(ev.startTime || (ev as any).start_time).toLocaleString() }}
                hasta
                {{ new Date(ev.endTime || (ev as any).end_time).toLocaleString() }}
              </p>
              <p v-if="ev.description" class="event-desc">{{ ev.description }}</p>
              <div class="event-actions">
                <button class="btn-edit" @click="openEdit(ev)">Editar</button>
                <button class="btn-delete" @click="handleDelete(ev.id!)">Eliminar</button>
              </div>
            </div>
          </div>

          <div class="pagination" v-if="eventStore.totalPages > 1">
            <button
              :disabled="eventStore.currentPage <= 1"
              @click="changePage(eventStore.currentPage - 1)"
            >Anterior</button>
            <span>Página {{ eventStore.currentPage }} de {{ eventStore.totalPages }}</span>
            <button
              :disabled="eventStore.currentPage >= eventStore.totalPages"
              @click="changePage(eventStore.currentPage + 1)"
            >Siguiente</button>
          </div>
        </template>
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
          <h3 class="modal-title">Editar Evento</h3>
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
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.25rem;
}

/* Form */
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

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.6875rem 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  color: #111827;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
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
  font-family: inherit;
}

.submit-btn:hover {
  background: #1f2937;
}

.feedback-message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* Event list */
.state-empty {
  text-align: center;
  color: #6b7280;
  padding: 2rem 0;
  font-size: 0.9rem;
}

.event-item {
  padding: 0.875rem 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #374151;
  margin-bottom: 0.625rem;
  background: #fafafa;
  transition: background 0.15s;
}

.event-item:hover {
  background: #f4f5f7;
}

.event-item:hover .event-actions {
  opacity: 1;
}

.event-title {
  font-weight: 600;
  color: #111827;
  font-size: 0.9375rem;
  margin-bottom: 0.25rem;
}

.event-time {
  font-size: 0.8rem;
  color: #6b7280;
}

.event-desc {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* Edit/Delete actions */
.event-actions {
  display: flex;
  gap: 0.375rem;
  margin-top: 0.5rem;
  opacity: 0;
  transition: opacity 0.15s;
}

.btn-edit {
  background: #f4f5f7;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.3rem 0.625rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.btn-edit:hover {
  background: #e5e7eb;
}

.btn-delete {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 0.3rem 0.625rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.btn-delete:hover {
  background: #fee2e2;
}

/* Edit modal */
.edit-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.edit-modal {
  background: white;
  border-radius: 10px;
  padding: 1.75rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid #e5e7eb;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1rem;
  margin-bottom: 1.25rem;
}

.modal-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
  font-family: inherit;
}

.close-btn:hover {
  background: #f4f5f7;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f4f5f7;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.update-btn {
  flex: 1;
  padding: 0.75rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.update-btn:hover {
  background: #1f2937;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.pagination button {
  padding: 0.4rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.pagination button:hover:not(:disabled) {
  background: #f4f5f7;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination span {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
