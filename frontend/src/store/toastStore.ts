/*
 * store/toastStore.ts — Store de notificaciones toast (Pinia)
 *
 * Gestiona la lista de notificaciones temporales que aparecen en la esquina
 * inferior derecha de la pantalla. Cualquier parte de la app puede generar
 * un toast llamando a las funciones helper exportadas.
 *
 * Conexiones:
 *   → components/ToastContainer.vue  (lee toasts y llama a removeToast para renderizarlos)
 *   → store/eventStore.ts            (llama a toastSuccess/toastError tras CRUD)
 *   → views/EventosView.vue          (llama a toastSuccess/toastError)
 *   → views/PerfilView.vue           (llama a toastSuccess/toastError)
 *   → services/api.ts                (llama a addToast para errores 429 y errores globales)
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Representa una notificación individual en la cola de toasts.
 *
 * @property id       - Identificador único autoincrementado; usado como :key en v-for
 * @property message  - Texto visible para el usuario
 * @property type     - Tipo visual: 'success' | 'error' | 'info' | 'warning'
 * @property duration - Tiempo en ms antes de que el toast se elimine automáticamente (default 3500)
 */
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const useToastStore = defineStore('toast', () => {
  // Array reactivo de toasts actualmente visibles en pantalla
  const toasts = ref<Toast[]>([]);

  // Contador global de IDs; se incrementa con cada toast creado.
  // Garantiza IDs únicos aunque se creen varios toasts en el mismo milisegundo.
  let nextId = 0;

  /**
   * Crea un nuevo toast y lo agrega a la cola de notificaciones.
   * Programa su eliminación automática con setTimeout.
   *
   * Mecanismo de auto-dismiss:
   *   El setTimeout captura el id del toast en su closure. Cuando el tiempo
   *   expire, llama a removeToast(id) aunque otros toasts ya hayan sido
   *   creados o eliminados entre tanto. Esto evita borrar el toast equivocado.
   *
   * @param message  - Texto de la notificación
   * @param type     - Tipo visual del toast
   * @param duration - Tiempo de vida en ms (por defecto 3500 ms)
   */
  function addToast(message: string, type: Toast['type'], duration = 3500) {
    const id = nextId++; // Asigna ID único e incrementa el contador para el próximo
    toasts.value.push({ id, message, type, duration });
    // Programa la eliminación automática después de 'duration' milisegundos
    setTimeout(() => removeToast(id), duration);
  }

  /**
   * Elimina el toast con el ID dado de la lista.
   * Se llama tanto por el auto-dismiss (setTimeout) como manualmente
   * cuando el usuario hace clic en el botón ✕ del toast.
   *
   * @param id - ID del toast a eliminar
   */
  function removeToast(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id);
    if (idx !== -1) toasts.value.splice(idx, 1);
  }

  /**
   * Muestra un toast de tipo éxito (verde).
   * @param msg      - Mensaje de éxito
   * @param duration - Duración opcional en ms
   */
  const toastSuccess = (msg: string, duration?: number) => addToast(msg, 'success', duration);

  /**
   * Muestra un toast de tipo error (rojo).
   * @param msg      - Mensaje de error
   * @param duration - Duración opcional en ms
   */
  const toastError   = (msg: string, duration?: number) => addToast(msg, 'error', duration);

  /**
   * Muestra un toast de tipo informativo (gris).
   * @param msg      - Mensaje informativo
   * @param duration - Duración opcional en ms
   */
  const toastInfo    = (msg: string, duration?: number) => addToast(msg, 'info', duration);

  /**
   * Muestra un toast de tipo advertencia (amarillo/naranja).
   * @param msg      - Mensaje de advertencia
   * @param duration - Duración opcional en ms
   */
  const toastWarning = (msg: string, duration?: number) => addToast(msg, 'warning', duration);

  return { toasts, addToast, removeToast, toastSuccess, toastError, toastInfo, toastWarning };
});
