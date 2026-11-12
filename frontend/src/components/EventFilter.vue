<template>
  <div class="event-filter">
    <div class="filter-row">
      <div class="filter-search">
        <span class="filter-icon">🔍</span>
        <input
          v-model="eventStore.searchQuery"
          type="text"
          class="filter-input"
          placeholder="Buscar eventos..."
          aria-label="Buscar eventos"
        />
      </div>

      <div class="filter-dates">
        <div class="date-group">
          <label class="date-label">Desde</label>
          <input
            v-model="eventStore.filterDateFrom"
            type="date"
            class="filter-input date-input"
            aria-label="Fecha desde"
          />
        </div>
        <div class="date-group">
          <label class="date-label">Hasta</label>
          <input
            v-model="eventStore.filterDateTo"
            type="date"
            class="filter-input date-input"
            aria-label="Fecha hasta"
          />
        </div>
      </div>

      <button class="clear-btn" @click="clearFilters" title="Limpiar filtros">
        ✕ Limpiar
      </button>
    </div>

    <p class="filter-count">
      Mostrando <strong>{{eventStore.filteredEvents.length}}</strong> de
      <strong>{{eventStore.events.length}}</strong> eventos
    </p>
  </div>
</template>

<script setup lang="ts">
import { useEventStore } from '../store/eventStore';

const eventStore = useEventStore();

function clearFilters() {
  eventStore.searchQuery = '';
  eventStore.filterDateFrom = '';
  eventStore.filterDateTo = '';
}
</script>

<style scoped>
.event-filter {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  margin-bottom: 1rem;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.filter-search {
  flex: 1;
  min-width: 160px;
  position: relative;
  display: flex;
  align-items: center;
}

.filter-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 0.875rem;
  pointer-events: none;
}

.filter-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #fafafa;
  box-sizing: border-box;
  color: #111827;
}

.filter-search .filter-input {
  padding-left: 2.25rem;
}

.filter-input:focus {
  border-color: #374151;
  box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.08);
  background: white;
}

.filter-dates {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.date-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.date-input {
  width: 140px;
}

.clear-btn {
  padding: 0.4rem 0.75rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
  font-family: inherit;
}

.clear-btn:hover {
  background: #f4f5f7;
  color: #374151;
}

.filter-count {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0;
}

.filter-count strong {
  color: #374151;
}

@media (max-width: 600px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-dates {
    flex-direction: column;
  }
  .date-input {
    width: 100%;
  }
  .clear-btn {
    width: 100%;
  }
}
</style>
