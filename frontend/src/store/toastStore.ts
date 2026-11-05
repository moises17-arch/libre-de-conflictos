import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);
  let nextId = 0;

  function addToast(message: string, type: Toast['type'], duration = 3500) {
    const id = nextId++;
    toasts.value.push({ id, message, type, duration });
    setTimeout(() => removeToast(id), duration);
  }

  function removeToast(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  // Shortcut helpers
  const toastSuccess = (msg: string, duration?: number) => addToast(msg, 'success', duration);
  const toastError   = (msg: string, duration?: number) => addToast(msg, 'error', duration);
  const toastInfo    = (msg: string, duration?: number) => addToast(msg, 'info', duration);
  const toastWarning = (msg: string, duration?: number) => addToast(msg, 'warning', duration);

  return { toasts, addToast, removeToast, toastSuccess, toastError, toastInfo, toastWarning };
});
