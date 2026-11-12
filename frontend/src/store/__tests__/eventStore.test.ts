import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEventStore } from '../eventStore';

// Mock the api service
vi.mock('../../services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../../services/api';

const MOCK_EVENT = {
  id: 1,
  userId: 1,
  title: 'Meeting',
  description: 'Team sync',
  startTime: '2025-01-01T10:00:00.000Z',
  endTime: '2025-01-01T11:00:00.000Z',
  timezone: 'UTC',
  start_time: '2025-01-01T10:00:00.000Z',
  end_time: '2025-01-01T11:00:00.000Z',
};

const MOCK_EVENT_2 = {
  id: 2,
  userId: 1,
  title: 'Workshop',
  description: 'Dev training',
  startTime: '2025-02-15T14:00:00.000Z',
  endTime: '2025-02-15T16:00:00.000Z',
  timezone: 'UTC',
  start_time: '2025-02-15T14:00:00.000Z',
  end_time: '2025-02-15T16:00:00.000Z',
};

describe('eventStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('fetchEvents — llama a la API con el userId y página correctos', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { events: [], currentPage: 1, totalPages: 1, totalEvents: 0 },
    });

    const store = useEventStore();
    await store.fetchEvents(42, 2);

    expect(api.get).toHaveBeenCalledWith('/events/user/42?page=2&limit=20');
  });

  it('fetchEvents — maneja respuesta paginada correctamente', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        events: [MOCK_EVENT],
        currentPage: 1,
        totalPages: 3,
        totalEvents: 60,
      },
    });

    const store = useEventStore();
    await store.fetchEvents(1);

    expect(store.events).toHaveLength(1);
    expect(store.totalPages).toBe(3);
    expect(store.totalEvents).toBe(60);
  });

  it('createEvent — agrega el evento al array en éxito', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { event: MOCK_EVENT },
    });

    const store = useEventStore();
    const result = await store.createEvent({
      id: 0,
      title: 'Meeting',
      description: 'Team sync',
      startTime: '2025-01-01T10:00:00.000Z',
      endTime: '2025-01-01T11:00:00.000Z',
      timezone: 'UTC',
    } as any);

    expect(result.success).toBe(true);
    expect(store.events).toHaveLength(1);
    expect(store.events[0].title).toBe('Meeting');
  });

  it('createEvent — devuelve { success: false } en error', async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: { data: { error: 'Conflicto de horario' } },
    });

    const store = useEventStore();
    const result = await store.createEvent({
      id: 0,
      title: 'Meeting',
      description: '',
      startTime: '2025-01-01T10:00:00.000Z',
      endTime: '2025-01-01T11:00:00.000Z',
      timezone: 'UTC',
    } as any);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Conflicto');
  });

  it('deleteEvent — elimina el evento del array', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    const store = useEventStore();
    store.$patch({ events: [MOCK_EVENT as any, MOCK_EVENT_2 as any] });

    const result = await store.deleteEvent(1);

    expect(result.success).toBe(true);
    expect(store.events).toHaveLength(1);
    expect(store.events[0].id).toBe(2);
  });

  it('filteredEvents — filtra por searchQuery correctamente', () => {
    const store = useEventStore();
    store.$patch({ events: [MOCK_EVENT as any, MOCK_EVENT_2 as any] });
    store.$patch({ searchQuery: 'workshop' });

    expect(store.filteredEvents).toHaveLength(1);
    expect(store.filteredEvents[0].title).toBe('Workshop');
  });

  it('filteredEvents — filtra por filterDateFrom correctamente', () => {
    const store = useEventStore();
    store.$patch({ events: [MOCK_EVENT as any, MOCK_EVENT_2 as any] });
    store.$patch({ filterDateFrom: '2025-02-01' });

    expect(store.filteredEvents).toHaveLength(1);
    expect(store.filteredEvents[0].title).toBe('Workshop');
  });
});
