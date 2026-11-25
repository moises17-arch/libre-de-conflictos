/*
 * store/eventStore.ts — Store de eventos (Pinia)
 *
 * Centraliza todo el estado relacionado con eventos:
 * la lista de eventos cargada desde el backend, los filtros de búsqueda,
 * la paginación, las estadísticas y las acciones CRUD.
 *
 * Conexiones:
 *   → services/api.ts          (hace las peticiones HTTP a /events)
 *   → views/EventosView.vue    (CRUD principal)
 *   → views/CalendarioView.vue (lee events para mostrarlos en el calendario)
 *   → views/HomeView.vue       (lee events y stats para el dashboard)
 *   → components/EventFilter.vue (lee y escribe searchQuery, filterDateFrom, filterDateTo)
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/api';
import type { EventModel } from '../types/event';

export const useEventStore = defineStore('event', () => {
  // Lista completa de eventos del usuario cargada desde el backend
  const events = ref<EventModel[]>([]);

  // Indica si hay una petición HTTP en curso (usado para mostrar skeletons)
  const loading = ref<boolean>(false);

  // Mensaje de error de la última petición fallida, null si todo fue bien
  const error = ref<string | null>(null);

  // Estadísticas de resumen: total de eventos, próximos y activos
  const stats = ref<{ total: number; upcoming: number; active: number } | null>(null);

  // Texto libre que el usuario escribe en el buscador de EventFilter
  const searchQuery = ref<string>('');

  // Fecha mínima del filtro de rango (formato 'YYYY-MM-DD')
  const filterDateFrom = ref<string>('');

  // Fecha máxima del filtro de rango (formato 'YYYY-MM-DD')
  const filterDateTo = ref<string>('');

  // Número de la página actual en la paginación del backend
  const currentPage = ref(1);

  // Total de páginas disponibles según el backend
  const totalPages = ref(1);

  // Total de eventos en la base de datos (puede ser mayor que events.length si hay paginación)
  const totalEvents = ref(0);

  /*
   * filteredEvents — computed que aplica tres filtros en cadena sobre el array events.
   *
   * Orden de filtros:
   *   1. Búsqueda de texto: compara searchQuery contra el título y la descripción del evento.
   *   2. Fecha desde: descarta eventos cuyo inicio sea anterior a filterDateFrom.
   *   3. Fecha hasta: descarta eventos cuyo inicio sea posterior al FINAL del día filterDateTo.
   *
   * Este computed se recalcula automáticamente cada vez que cambian events, searchQuery,
   * filterDateFrom o filterDateTo. EventFilter.vue escribe directamente en esas refs
   * con v-model, lo que dispara el recálculo sin necesidad de llamar a ninguna función.
   */
  const filteredEvents = computed(() => {
    return events.value.filter(ev => {
      // Compatibilidad: el backend puede devolver start_time (snake_case) o startTime (camelCase)
      const startRaw: string = (ev as any).start_time || ev.startTime || '';

      // Filtro 1: búsqueda de texto en título y descripción
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchDesc = (ev.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      // Filtro 2: fecha de inicio no puede ser anterior a "desde"
      if (filterDateFrom.value) {
        const evDate = new Date(startRaw);
        const fromDate = new Date(filterDateFrom.value);
        if (evDate < fromDate) return false;
      }

      // Filtro 3: fecha de inicio no puede ser posterior al FINAL del día "hasta"
      if (filterDateTo.value) {
        const evDate = new Date(startRaw);
        const toDate = new Date(filterDateTo.value);
        // setHours(23,59,59,999) extiende la fecha hasta la última fracción de segundo del día,
        // así el filtro incluye todos los eventos que empiezan en ese día y no solo a las 00:00.
        toDate.setHours(23, 59, 59, 999);
        if (evDate > toDate) return false;
      }

      return true;
    });
  });

  /**
   * Carga la lista paginada de eventos del usuario desde el backend.
   * Maneja dos formatos de respuesta:
   *   - Array plano: versión sin paginación del backend.
   *   - Objeto con metadata: versión con paginación { events, currentPage, totalPages, totalEvents }.
   *
   * @param userId - ID del usuario cuya lista de eventos se quiere cargar
   * @param page   - Número de página (por defecto 1)
   */
  async function fetchEvents(userId: number, page = 1) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get<EventModel[] | { events: EventModel[]; currentPage: number; totalPages: number; totalEvents: number }>(`/events/user/${userId}?page=${page}&limit=20`);
      const data = response.data;
      if (Array.isArray(data)) {
        // El backend devuelve un array plano (sin soporte de paginación todavía)
        events.value = data;
        currentPage.value = 1;
        totalPages.value = 1;
        totalEvents.value = data.length;
      } else {
        // El backend devuelve objeto con paginación
        events.value = data.events;
        currentPage.value = data.currentPage;
        totalPages.value = data.totalPages;
        totalEvents.value = data.totalEvents;
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Error al cargar los eventos';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Carga las estadísticas de resumen del usuario (total, próximos, activos).
   * No lanza error visible al usuario: si falla, stats queda en null
   * y el dashboard muestra '—' en las tarjetas de estadísticas.
   */
  async function fetchStats() {
    try {
      const response = await api.get<{ total: number; upcoming: number; active: number }>('/events/stats');
      stats.value = response.data;
    } catch (err: any) {
      stats.value = null;
    }
  }

  /**
   * Crea un nuevo evento en el backend y lo agrega al array local events.
   *
   * Las fechas se convierten a ISO 8601 con zona horaria antes de enviarlas
   * porque el backend (y la base de datos PostgreSQL) espera ese formato.
   * El input datetime-local del HTML entrega fechas como 'YYYY-MM-DDTHH:mm'
   * sin zona horaria, por lo que new Date().toISOString() añade el offset UTC.
   *
   * @param eventData - Datos del evento sin el campo userId (el backend lo infiere del token)
   * @returns         - { success: true, message } o { success: false, message }
   */
  async function createEvent(eventData: Omit<EventModel, 'userId'>) {
    try {
      // Convertir a ISO 8601 para que el backend procese la zona horaria correctamente
      const formattedData = {
        ...eventData,
        startTime: new Date(eventData.startTime).toISOString(),
        endTime: new Date(eventData.endTime).toISOString(),
      };

      const response = await api.post('/events', formattedData);
      // Agregar el evento al array local para actualizar la UI sin un GET adicional
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

  /**
   * Actualiza un evento existente en el backend y sincroniza el array local.
   * Las fechas también se formatean a ISO 8601 por las mismas razones que en createEvent.
   *
   * @param id        - ID del evento a actualizar
   * @param eventData - Nuevos datos del evento
   * @returns         - { success: true, message } o { success: false, message }
   */
  async function updateEvent(id: number, eventData: Omit<EventModel, 'userId'>) {
    try {
      const formattedData = {
        ...eventData,
        startTime: new Date(eventData.startTime).toISOString(),
        endTime: new Date(eventData.endTime).toISOString(),
      };
      const response = await api.put(`/events/${id}`, formattedData);
      // Reemplazar el evento en el array local por el actualizado que devuelve el servidor
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

  /**
   * Elimina un evento del backend y lo remueve del array local.
   * Usar filter() en lugar de splice() es más seguro en arrays reactivos de Vue
   * porque crea un nuevo array en lugar de mutar el existente directamente.
   * Esto evita hacer un GET adicional para refrescar la lista.
   *
   * @param id - ID del evento a eliminar
   * @returns  - { success: true, message } o { success: false, message }
   */
  async function deleteEvent(id: number) {
    try {
      await api.delete(`/events/${id}`);
      // Filtrar el array local para remover el evento sin necesidad de otra petición GET
      events.value = events.value.filter(e => e.id !== id);
      return { success: true, message: 'Evento eliminado' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.error || 'Error al eliminar el evento'
      };
    }
  }

  return { events, loading, error, stats, searchQuery, filterDateFrom, filterDateTo, filteredEvents, currentPage, totalPages, totalEvents, fetchEvents, fetchStats, createEvent, updateEvent, deleteEvent };
});
