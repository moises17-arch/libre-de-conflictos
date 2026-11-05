<template>
  <teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="toast-card"
          :class="`toast-${toast.type}`"
          role="alert"
        >
          <span class="toast-icon">{{icons[toast.type]}}</span>
          <span class="toast-message">{{toast.message}}</span>
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
import { useToastStore } from '../store/toastStore';

const toastStore = useToastStore();

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
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  max-width: 360px;
  min-width: 240px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  font-size: 0.9rem;
  font-weight: 500;
  pointer-events: all;
  border: 1px solid transparent;
}

.toast-success {
  background: #f0fdf4;
  border-color: #86efac;
  color: #166534;
}

.toast-error {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.toast-info {
  background: #f0f9ff;
  border-color: #7dd3fc;
  color: #0c4a6e;
}

.toast-warning {
  background: #fffbeb;
  border-color: #fcd34d;
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
  opacity: 0.6;
  padding: 0;
  line-height: 1.4;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

/* TransitionGroup animations */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.25s ease-in;
}

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
