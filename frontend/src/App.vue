<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEventStore } from './store/eventStore';

const eventStore = useEventStore();

const userId = ref<number>(1);
const title = ref<string>('');
const description = ref<string>('');
const startTime = ref<string>('');
const endTime = ref<string>('');
const timezone = ref<string>('America/Bogota');

const feedbackMessage = ref<string>('');
const isError = ref<boolean>(false);

onMounted(() => {
  eventStore.fetchEvents(userId.value);
});

async function handleSubmit() {
  feedbackMessage.value = '';
  const result = await eventStore.createEvent({
    userId: userId.value,
    title: title.value,
    description: description.value,
    startTime: startTime.value,
    endTime: endTime.value,
    timezone: timezone.value
  });

  isError.value = !result.success;
  feedbackMessage.value = result.message;

  if (result.success) {
    title.value = '';
    description.value = '';
    startTime.value = '';
    endTime.value = '';
  }
}
</script>

<template>
  <main style="max-width: 600px; margin: 40px auto; font-family: Arial, sans-serif;">
    <h2>🛡️ Libre de Conflictos</h2>
    <p>Sistema de Calendario con Detección Inteligente de Cruces</p>

    <!-- Formulario para crear eventos -->
    <form @submit.prevent="handleSubmit" style="background: #f4f4f4; padding: 20px; border-radius: 8px;">
      <h3>Nuevo Evento</h3>
      
      <div style="margin-bottom: 10px;">
        <label>Título: </label><br>
        <input v-model="title" required style="width: 100%; padding: 8px;" />
      </div>

      <div style="margin-bottom: 10px;">
        <label>Descripción: </label><br>
        <textarea v-model="description" style="width: 100%; padding: 8px;"></textarea>
      </div>

      <div style="margin-bottom: 10px;">
        <label>Inicio (Fecha y Hora): </label><br>
        <input type="datetime-local" v-model="startTime" required style="width: 100%; padding: 8px;" />
      </div>

      <div style="margin-bottom: 10px;">
        <label>Fin (Fecha y Hora): </label><br>
        <input type="datetime-local" v-model="endTime" required style="width: 100%; padding: 8px;" />
      </div>

      <button type="submit" style="background: #007bff; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 4px;">
        Guardar Evento
      </button>

      <p v-if="feedbackMessage" :style="{ color: isError ? 'red' : 'green', marginTop: '10px', fontWeight: 'bold' }">
        {{ feedbackMessage }}
      </p>
    </form>

    <!-- Listado de Eventos -->
    <section style="margin-top: 30px;">
      <h3>Mis Eventos Programados</h3>
      <div v-if="eventStore.loading">Cargando eventos...</div>
      <ul v-else-if="eventStore.events.length > 0">
        <li v-for="ev in eventStore.events" :key="ev.id" style="margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
          <strong>{{ ev.title }}</strong><br>
          <small>🕒 De: {{ new Date(ev.startTime || (ev as any).start_time).toLocaleString() }} hasta {{ new Date(ev.endTime || (ev as any).end_time).toLocaleString() }}</small><br>
          <span>{{ ev.description }}</span>
        </li>
      </ul>
      <p v-else>No hay eventos registrados aún.</p>
    </section>
  </main>
</template>
