<template>
  <!--
    <teleport to="body"> renderiza este componente como hijo directo del <body>
    del HTML, fuera del árbol Vue normal. Esto evita dos problemas comunes:
      1. Problemas de z-index: un contenedor padre con overflow:hidden o
         z-index bajo podría recortar los toasts.
      2. Herencia de estilos: al estar en el body, los toasts no heredan
         estilos no deseados del layout padre.
  -->
  <teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <!--
        <TransitionGroup> aplica animaciones CSS coordinadas a cada toast
        que entra o sale de la lista. Cuando un toast se agrega, entra
        deslizándose desde la derecha (translateX(100%) → translateX(0)).
        Cuando se elimina, sale deslizándose hacia la derecha de nuevo.
        Los toasts restantes se reposicionan suavemente gracias a .toast-move.
      -->
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="toast-card"
          :class="`toast-${toast.type}`"
          role="alert"
        >
          <!-- Icono visual según el tipo de notificación -->
          <span class="toast-icon">{{icons[toast.type]}}</span>
          <span class="toast-message">{{toast.message}}</span>

          <!--
            Botón de cierre manual: el usuario puede descartar un toast antes
            de que expire su tiempo automático llamando a removeToast(id).
          -->
          <button
            class="toast-close"
            aria-label="Cerrar notificación"
            @click="toastStore.removeToast(toast.id)"
          >✕</button>
        </div>
      </TransitionGroup>
    </div>
  </teleport>
</template>

<script setup lang="ts">
/*
 * components/ToastContainer.vue — Contenedor global de notificaciones toast
 *
 * Renderiza la lista de toasts del toastStore como notificaciones flotantes
 * en la esquina inferior derecha de la pantalla. Se monta una sola vez en
 * App.vue para que esté disponible en todas las rutas.
 *
 * El componente usa <teleport to="body"> para evitar problemas de z-index
 * y overflow que ocurrirían si estuviera anidado dentro del layout normal.
 *
 * Conexiones:
 *   → store/toastStore.ts  (lee toasts y llama a removeToast)
 *   → App.vue              (aquí se monta este componente)
 */
import { useToastStore } from '../store/toastStore';

const toastStore = useToastStore();

/*
 * Mapeo de tipo de toast a emoji representativo.
 * Se usa en el template como icons[toast.type] para seleccionar el icono correcto.
 */
const icons: Record<string, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  pointer-events: none;
}

.toast-card {
  background: white;
  border-radius: 8px;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  font-size: 0.875rem;
  font-weight: 500;
  max-width: 360px;
  min-width: 260px;
  pointer-events: all;
  border-left: 4px solid #e5e7eb;
}

.toast-success {
  border-left-color: #059669;
  color: #065f46;
}

.toast-error {
  border-left-color: #dc2626;
  color: #991b1b;
}

.toast-info {
  border-left-color: #374151;
  color: #1f2937;
}

.toast-warning {
  border-left-color: #d97706;
  color: #92400e;
}

.toast-icon {
  flex-shrink: 0;
  line-height: 1.4;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: inherit;
  opacity: 0.5;
  padding: 0;
  line-height: 1.4;
  transition: opacity 0.2s;
  font-family: inherit;
}

.toast-close:hover {
  opacity: 1;
}

/*
 * Animaciones de TransitionGroup:
 *
 * .toast-enter-from: estado inicial cuando el toast aparece (invisible, desplazado a la derecha)
 * .toast-leave-to:   estado final cuando el toast desaparece (mismo efecto que la entrada)
 * .toast-enter-active / .toast-leave-active: duración y easing de la animación
 * .toast-move: anima el reposicionamiento de los toasts restantes cuando uno desaparece
 */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.25s ease-in;
}

/* Estado inicial de entrada y final de salida: fuera de pantalla a la derecha */
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
