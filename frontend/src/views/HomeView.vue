<template>
  <div>
    <!--
      MODO DASHBOARD (usuario autenticado):
      Muestra el saludo personalizado, estadísticas de eventos y los próximos 5 eventos.
      Se activa cuando authStore.isAuthenticated es true.
    -->
    <template v-if="authStore.isAuthenticated">
      <section class="dashboard">
        <h1 class="greeting">Hola, {{ authStore.user?.name }} 👋</h1>
        <p class="greeting-sub">{{ todayStr }}</p>

        <!-- Tarjetas de estadísticas: muestra skeletons mientras carga -->
        <div class="stats-grid">
          <template v-if="eventStore.loading">
            <SkeletonCard v-for="n in 3" :key="n" :lines="1" :showTitle="true" />
          </template>
          <template v-else>
            <div class="stat-card">
              <div class="stat-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <p class="stat-label">Total de Eventos</p>
              <p class="stat-value">{{ eventStore.stats?.total ?? '—' }}</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <p class="stat-label">Próximos Eventos</p>
              <p class="stat-value">{{ eventStore.stats?.upcoming ?? '—' }}</p>
            </div>
            <div class="stat-card">
              <div class="stat-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <p class="stat-label">Eventos Activos</p>
              <p class="stat-value">{{ eventStore.stats?.active ?? '—' }}</p>
            </div>
          </template>
        </div>

        <!-- Lista de próximos eventos (máximo 5) -->
        <section class="upcoming-section">
          <h2 class="section-title">Próximos eventos</h2>
          <div v-if="upcomingEvents.length === 0" class="empty-state">
            No tienes eventos próximos.
          </div>
          <ul v-else class="event-list">
            <li v-for="event in upcomingEvents" :key="event.id" class="event-item">
              <div class="event-info">
                <p class="event-title">{{ event.title }}</p>
                <span class="event-time">{{ formatDate(event.startTime) }}</span>
              </div>
            </li>
          </ul>
        </section>

        <!-- Botones de navegación rápida al resto de la app -->
        <div class="nav-buttons">
          <RouterLink to="/eventos" class="nav-btn primary">Ver todos los eventos →</RouterLink>
          <RouterLink to="/calendario" class="nav-btn secondary">Ver calendario →</RouterLink>
        </div>
      </section>
    </template>

    <!--
      MODO LANDING PAGE (usuario no autenticado):
      Muestra la página de marketing con hero y sección de características.
      Se activa cuando el usuario no ha iniciado sesión.
    -->
    <template v-else>
      <!-- Sección hero con llamada a la acción -->
      <section class="hero">
        <span class="badge">Sistema Inteligente de Calendarios</span>
        <h1 class="hero-title">Gestiona tu agenda sin conflictos</h1>
        <p class="hero-desc">
          Detecta solapamientos de horario en tiempo real, organiza tus eventos y mantén el control
          total de tu agenda personal.
        </p>
        <RouterLink to="/eventos" class="cta-button">Comenzar Ahora →</RouterLink>
      </section>

      <!-- Sección de características del producto -->
      <section class="features">
        <h2 class="features-title">¿Por qué Libre de Conflictos?</h2>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 class="feature-card-title">Crea Eventos</h3>
            <p class="feature-card-desc">
              Registra tus compromisos con fecha, hora y zona horaria. Mantén todo organizado en un
              solo lugar.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <h3 class="feature-card-title">Detecta Conflictos</h3>
            <p class="feature-card-desc">
              El sistema verifica automáticamente si dos eventos se solapan en el tiempo y te avisa
              al instante.
            </p>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="feature-card-title">Sin solapamientos</h3>
            <p class="feature-card-desc">
              Organiza tu agenda con la certeza de que ningún evento interfiere con otro. Productividad
              sin caos.
            </p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
/*
 * views/HomeView.vue — Vista de inicio (doble modo: dashboard y landing)
 *
 * Esta vista tiene dos comportamientos según el estado de autenticación:
 *
 *   AUTENTICADO → Dashboard:
 *     Muestra saludo personalizado, tarjetas de estadísticas (total/próximos/activos)
 *     y la lista de los próximos 5 eventos ordenados por fecha.
 *
 *   NO AUTENTICADO → Landing page:
 *     Muestra la sección hero con llamada a la acción y las tarjetas de características
 *     del producto para convencer al usuario de registrarse.
 *
 * Conexiones:
 *   → store/authStore.ts   (lee isAuthenticated y user)
 *   → store/eventStore.ts  (carga events y stats para el dashboard)
 *   → components/SkeletonCard.vue (placeholder de carga)
 */
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../store/authStore';
import { useEventStore } from '../store/eventStore';
import SkeletonCard from '../components/SkeletonCard.vue';

const authStore = useAuthStore();
const eventStore = useEventStore();

/*
 * todayStr — Fecha actual formateada en español largo.
 * Ejemplo: "miércoles, 15 de enero de 2025"
 * Se usa en el saludo del dashboard. text-transform: capitalize en CSS
 * convierte la primera letra a mayúscula.
 */
const todayStr = computed(() => new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

/*
 * upcomingEvents — Lista de los próximos 5 eventos del usuario.
 *
 * Pasos:
 *   1. filter: descarta eventos pasados (startTime <= ahora)
 *   2. sort:   ordena de más próximo a más lejano (ascendente)
 *   3. slice:  toma solo los primeros 5 para no saturar el dashboard
 */
const upcomingEvents = computed(() => {
  const now = new Date();
  return eventStore.events
    .filter(e => new Date(e.startTime) > now)      // Solo eventos futuros
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()) // Más próximo primero
    .slice(0, 5); // Máximo 5 en el dashboard
});

/**
 * Formatea una fecha ISO a formato legible corto en español.
 * Ejemplo: "mié. 15 ene., 09:00"
 *
 * @param isoString - Fecha en formato ISO 8601
 * @returns         - Cadena formateada en español
 */
function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/*
 * onMounted: carga inicial de datos para el dashboard.
 *
 * Por qué se llama initAuth() aquí:
 *   HomeView puede ser la primera pantalla tras una recarga directa en '/'.
 *   El router guard ya la llama, pero como esta vista puede cargarse sin navegar
 *   (p.ej. primer acceso), la llamamos de nuevo para garantizar que el store
 *   esté hidratado antes de verificar isAuthenticated.
 *
 * Por qué Promise.all():
 *   fetchEvents y fetchStats son independientes entre sí. Lanzarlos en paralelo
 *   reduce el tiempo de carga del dashboard a max(t_eventos, t_stats) en lugar
 *   de t_eventos + t_stats (suma secuencial).
 */
onMounted(async () => {
  authStore.initAuth();
  if (authStore.isAuthenticated && authStore.user) {
    // Cargar eventos y estadísticas en paralelo para reducir el tiempo de espera
    await Promise.all([
      eventStore.fetchEvents(authStore.user.id!),
      eventStore.fetchStats()
    ]);
  }
});
</script>

<style scoped>
/* Dashboard */
.dashboard {
  max-width: 1100px;
  margin: 0 auto;
}

.greeting {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.greeting-sub {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  text-transform: capitalize;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f4f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}

/* Upcoming events */
.upcoming-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

.empty-state {
  color: #6b7280;
  font-size: 0.95rem;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-item {
  border-bottom: 1px solid #f3f4f6;
  padding: 0.75rem 0;
}

.event-item:last-child {
  border-bottom: none;
}

.event-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.event-title {
  font-weight: 500;
  color: #111827;
}

.event-time {
  display: inline-block;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 0.2rem 0.6rem;
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
}

/* Nav buttons */
.nav-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s;
}

.nav-btn.primary {
  background: #111827;
  color: white;
}

.nav-btn.primary:hover {
  background: #1f2937;
}

.nav-btn.secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.nav-btn.secondary:hover {
  background: #f9fafb;
}

/* Hero */
.hero {
  background: #1e2024;
  color: white;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.badge {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 0.3rem 0.875rem;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.25rem;
  display: inline-block;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  letter-spacing: -0.5px;
}

.hero-desc {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  max-width: 540px;
  line-height: 1.65;
  margin-bottom: 2rem;
}

.cta-button {
  background: white;
  color: #111827;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: background 0.2s;
}

.cta-button:hover {
  background: #f9fafb;
}

/* Features */
.features {
  background: #f4f5f7;
  padding: 3.5rem 2rem;
}

.features-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 2.5rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  max-width: 960px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.feature-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.feature-icon-wrap {
  width: 44px;
  height: 44px;
  background: #f4f5f7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.feature-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.feature-card-desc {
  color: #6b7280;
  line-height: 1.6;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 640px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .greeting {
    font-size: 1.375rem;
  }
}
</style>
