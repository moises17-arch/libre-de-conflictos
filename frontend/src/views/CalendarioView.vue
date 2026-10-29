<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEventStore } from '../store/eventStore';
import { useAuthStore } from '../store/authStore';
import type { EventModel } from '../types/event';

const eventStore = useEventStore();
const authStore = useAuthStore();

const selectedEvent = ref<EventModel | null>(null);
const showPanel = ref(false);

// Pre-fill form when clicking a date
const newEventDate = ref('');
const showNewForm = ref(false);
const newTitle = ref('');
const newDescription = ref('');
const newStartTime = ref('');
const newEndTime = ref('');
const newTimezone = ref('America/Bogota');
const createFeedback = ref('');
const createIsError = ref(false);

const calendarEvents = computed(() =>
  eventStore.events.map(ev => ({
    id: String(ev.id),
    title: ev.title,
    start: ev.startTime || (ev as any).start_time,
    end: ev.endTime || (ev as any).end_time,
    extendedProps: { event: ev },
  }))
);

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: 'es',
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '',
  },
  events: calendarEvents.value,
  eventClick: (info: any) => {
    selectedEvent.value = info.event.extendedProps.event as EventModel;
    showPanel.value = true;
    showNewForm.value = false;
  },
  dateClick: (info: any) => {
    newEventDate.value = info.dateStr;
    newStartTime.value = `${info.dateStr}T09:00`;
    newEndTime.value = `${info.dateStr}T10:00`;
    newTitle.value = '';
    newDescription.value = '';
    createFeedback.value = '';
    showNewForm.value = true;
    showPanel.value = false;
    selectedEvent.value = null;
  },
}));

function closePanel() {
  showPanel.value = false;
  selectedEvent.value = null;
}

function closeNewForm() {
  showNewForm.value = false;
}

async function handleCreateEvent() {
  createFeedback.value = '';
  const result = await eventStore.createEvent({
    title: newTitle.value,
    description: newDescription.value,
    startTime: newStartTime.value,
    endTime: newEndTime.value,
    timezone: newTimezone.value,
  });
  createIsError.value = !result.success;
  createFeedback.value = result.message;
  if (result.success) {
    showNewForm.value = false;
  }
}

function formatDate(iso: string | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
}

onMounted(() => {
  eventStore.fetchEvents(authStore.user!.id);
});
</script>

<template>
  <div class="calendario-page">
    <div class="page-header">
      <h1 class="page-title">Calendario</h1>
      <p class="page-subtitle">Visualiza y gestiona tus eventos en el calendario mensual.</p>
    </div>

    <div class="calendario-layout">
      <!-- Calendar -->
      <div class="calendar-card">
        <FullCalendar :options="calendarOptions" />
      </div>

      <!-- Event detail panel -->
      <div v-if="showPanel && selectedEvent" class="side-panel">
        <div class="panel-header">
          <h3 class="panel-title">Detalle del evento</h3>
          <button class="close-btn" @click="closePanel">✕</button>
        </div>
        <div class="panel-body">
          <p class="detail-title">{{ selectedEvent.title }}</p>
          <p class="detail-row">
            <span class="detail-label">Inicio:</span>
            <span>{{ formatDate(selectedEvent.startTime || (selectedEvent as any).start_time) }}</span>
          </p>
          <p class="detail-row">
            <span class="detail-label">Fin:</span>
            <span>{{ formatDate(selectedEvent.endTime || (selectedEvent as any).end_time) }}</span>
          </p>
          <p v-if="selectedEvent.description" class="detail-desc">
            {{ selectedEvent.description }}
          </p>
        </div>
      </div>

      <!-- New event form triggered by dateClick -->
      <div v-if="showNewForm" class="side-panel">
        <div class="panel-header">
          <h3 class="panel-title">Nuevo Evento — {{ newEventDate }}</h3>
          <button class="close-btn" @click="closeNewForm">✕</button>
        </div>
        <div class="panel-body">
          <form @submit.prevent="handleCreateEvent">
            <div class="form-group">
              <label>Título</label>
              <input v-model="newTitle" type="text" required placeholder="Nombre del evento" />
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <textarea v-model="newDescription" rows="2" placeholder="Descripción opcional"></textarea>
            </div>
            <div class="form-group">
              <label>Inicio</label>
              <input v-model="newStartTime" type="datetime-local" required />
            </div>
            <div class="form-group">
              <label>Fin</label>
              <input v-model="newEndTime" type="datetime-local" required />
            </div>
            <button type="submit" class="submit-btn">Guardar Evento</button>
            <div
              v-if="createFeedback"
              class="feedback-message"
              :class="createIsError ? 'feedback-error' : 'feedback-success'"
            >
              <span>{{ createIsError ? '❌' : '✅' }}</span>
              <span>{{ createFeedback }}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendario-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
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

.calendario-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 900px) {
  .calendario-layout {
    grid-template-columns: 1fr;
  }
}

.calendar-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(54, 53, 55, 0.1);
  min-height: 500px;
}

.side-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(54, 53, 55, 0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e4e7;
  background: #f8f8f8;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #252526;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: #6b6375;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e5e4e7;
}

.panel-body {
  padding: 1.25rem;
}

.detail-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #3d3d43;
  margin-bottom: 0.5rem;
}

.detail-label {
  font-weight: 600;
  color: #252526;
}

.detail-desc {
  font-size: 0.875rem;
  color: #6b6375;
  margin-top: 0.75rem;
  line-height: 1.5;
}

/* Form inside side panel */
.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.form-group label {
  color: #303031;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.4rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.6rem 0.875rem;
  border: 2px solid #e5e4e7;
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #353436;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #353336, #474648);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.submit-btn:hover {
  transform: translateY(-1px);
}

.feedback-message {
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
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
</style>
