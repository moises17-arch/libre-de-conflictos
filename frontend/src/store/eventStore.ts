import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '../services/api';
import type { EventModel } from '../types/event';

export const useEventStore = defineStore('event', () => {
  const events = ref<EventModel[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  async function fetchEvents(userId: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<EventModel[]>(`/events/user/${userId}`);
      events.value = response.data;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error al cargar los eventos';
    } finally {
      loading.value = false;
    }
  }

  async function createEvent(eventData: Omit<EventModel, 'userId'>) {
    try {
      // Aseguramos que las fechas se envíen en formato ISO con zona horaria
      const formattedData = {
        ...eventData,
        startTime: new Date(eventData.startTime).toISOString(),
        endTime: new Date(eventData.endTime).toISOString(),
      };

      const response = await api.post('/events', formattedData);
      events.value.push(response.data.event);
      return { success: true, message: '¡Evento creado con éxito!' };
    } catch (err: any) {
      console.error("Error detallado del backend:", err.response?.data);
      return {
        success: false,
        message: err.response?.data?.error || err.response?.data?.message || 'Error al guardar el evento'
      };
    }
  }

  async function updateEvent(id: number, eventData: Omit<EventModel, 'userId'>) {
    try {
      const formattedData = {
        ...eventData,
        startTime: new Date(eventData.startTime).toISOString(),
        endTime: new Date(eventData.endTime).toISOString(),
      };
      const response = await api.put(`/events/${id}`, formattedData);
      const idx = events.value.findIndex(e => e.id === id);
      if (idx !== -1) events.value[idx] = response.data.event;
      return { success: true, message: '¡Evento actualizado con éxito!' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.error || 'Error al actualizar el evento'
      };
    }
  }

  async function deleteEvent(id: number) {
    try {
      await api.delete(`/events/${id}`);
      events.value = events.value.filter(e => e.id !== id);
      return { success: true, message: 'Evento eliminado' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.error || 'Error al eliminar el evento'
      };
    }
  }

  return { events, loading, error, fetchEvents, createEvent, updateEvent, deleteEvent };
});
