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
