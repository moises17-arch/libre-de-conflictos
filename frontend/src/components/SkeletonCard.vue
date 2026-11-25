<template>
  <div class="skeleton-card">
    <!-- Línea de título más ancha; solo se renderiza si showTitle es true -->
    <div v-if="showTitle" class="skeleton-title skeleton-shimmer"></div>
    <!-- Se renderizan 'lines' líneas de contenido simulado -->
    <div v-for="n in lines" :key="n" class="skeleton-line skeleton-shimmer"></div>
  </div>
</template>

<script setup lang="ts">
/*
 * components/SkeletonCard.vue — Tarjeta de carga esqueleto (skeleton loading)
 *
 * Muestra un marcador de posición animado mientras los datos reales se están
 * cargando desde el backend. Proporciona retroalimentación visual inmediata al
 * usuario para que sepa que el contenido está en camino, en lugar de ver
 * una pantalla en blanco.
 *
 * Uso típico:
 *   <SkeletonCard v-for="n in 3" :key="n" :lines="3" :showTitle="true" />
 *
 * Conexiones:
 *   → views/HomeView.vue       (mientras carga stats y eventos del dashboard)
 *   → views/EventosView.vue    (mientras carga la lista de eventos)
 *   → views/CalendarioView.vue (mientras carga los eventos para el calendario)
 */

/*
 * Props:
 *   lines     - Número de líneas de contenido simulado a mostrar (simula párrafos de texto)
 *   showTitle - Si true, muestra una línea más ancha al inicio que simula un título
 */
withDefaults(defineProps<{
  lines?: number;
  showTitle?: boolean;
}>(), {
  lines: 3,
  showTitle: true
});
</script>

<style scoped>
/*
 * Animación shimmer (brillo deslizante):
 *
 * El efecto se logra moviendo un gradiente lineal de izquierda a derecha
 * sobre el elemento. background-position va de -200% a 200%:
 *   - Se necesita background-size: 200% para que el gradiente sea más ancho
 *     que el elemento, haciendo visible el movimiento de la banda luminosa.
 *   - Sin ese tamaño extra, el gradiente ocuparía exactamente el ancho del
 *     elemento y el desplazamiento no se percibiría.
 */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.625rem;
}

.skeleton-shimmer {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  /* background-size: 200% es obligatorio para que el movimiento del gradiente sea visible */
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

.skeleton-title {
  height: 1.25rem;
  width: 60%; /* Más ancho que las líneas de contenido para simular un título */
  margin-bottom: 0.75rem;
}

.skeleton-line {
  height: 0.875rem;
  width: 100%;
  margin-bottom: 0.5rem;
}

.skeleton-line:last-child {
  width: 80%; /* La última línea es más corta para simular texto que no llena la línea */
}
</style>
