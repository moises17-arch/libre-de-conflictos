# Implementation Plan — Libre de Conflictos (3 Features)

## Context discovered during exploration

- **Frontend:** Vue 3 + TypeScript + Pinia + Vue Router. Build: `npm run build` (vite). No test runner configured.
- **Backend:** Node.js + Express + pg (PostgreSQL). No automated test runner.
- **Auth middleware:** `verifyToken` en `backend/src/middleware/auth.middleware.js` — populates `req.user = { id, email }` from JWT.
- **API base URL:** `http://localhost:3000/api` (axios instance in `frontend/src/services/api.ts`). Interceptor already injects Bearer token on every request.
- **EventModel** (frontend/src/types/event.ts): `{ id?, userId, title, description?, startTime, endTime, timezone }`.
- **User type** (frontend/src/types/user.ts): `{ id, name, email }` — needs `created_at` added for Perfil.
- **UserModel.update** (backend/src/models/user.model.js): accepts only `{ name, email }` — needs a new `updateWithPassword` method that also hashes and saves password when provided.
- **Existing event routes:** `POST /events` and `GET /events/user/:userId`. Need PUT and DELETE added.
- **FullCalendar packages already installed:** `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`, `@fullcalendar/vue3`.
- **Style palette:** dark navbar (`#2b2b2d`), cards white with `box-shadow: 0 4px 20px rgba(0,0,0,0.08)`, page background `#f3f4f6`, text `#3d3d43`. No purple anywhere. Follow EventosView.vue and HomeView.vue as style templates.
- **Router pattern:** children of the MainLayout route (path `/`), with `meta: { requiresAuth: true }`. See `frontend/src/router/index.ts`.
- **Navbar pattern:** RouterLink elements inside `.nav-links` in `MainLayout.vue`.
- **Verification:** `npm run build` (frontend, in `frontend/`) + `node src/index.js` backend starts without errors. There is no test suite.

---

## FEATURE 1: Calendario Visual con FullCalendar

### Paso 1 — Crear CalendarioView.vue

**Qué hacer:** Crear el componente `CalendarioView.vue` que monta FullCalendar con los plugins `dayGridPlugin` e `interactionPlugin`. En `onMounted` llama `eventStore.fetchEvents(authStore.user!.id)`. Mapea `eventStore.events` a objetos FullCalendar `{ id, title, start, end }` usando `computed`. Implementa `eventClick` para mostrar un panel lateral (div condicional) con título, descripción y horario del evento seleccionado. Implementa `dateClick` para pre-llenar un formulario de nuevo evento (reusa la lógica de `EventosView.vue`) con la fecha clicada. Usa locale español (`'es'`), botones `prev/next/today`. Estilo: cards blancas, sombras suaves, sin morado — sigue la paleta de `EventosView.vue`.

**Archivo a crear:**
- `frontend/src/views/CalendarioView.vue`

**Verificar:** `cd frontend && npm run build` — sin errores de TypeScript ni de Vite.

---

### Paso 2 — Registrar ruta /calendario y link en navbar

**Qué hacer:**
1. En `frontend/src/router/index.ts` importar `CalendarioView` y agregar la ruta `{ path: 'calendario', name: 'Calendario', component: CalendarioView, meta: { requiresAuth: true } }` como child del route de `MainLayout` (junto a `eventos`).
2. En `frontend/src/layouts/MainLayout.vue` agregar `<RouterLink to="/calendario">Calendario</RouterLink>` dentro de `.nav-links`, entre el link "Eventos" y el botón "Cerrar Sesión".

**Archivos a modificar:**
- `frontend/src/router/index.ts`
- `frontend/src/layouts/MainLayout.vue`

**Verificar:** `cd frontend && npm run build` — sin errores. Al abrir el navegador en `/calendario` se muestra el calendario.

---

## FEATURE 2: Perfil de Usuario

### Paso 3 — Backend: modelo User — método updateWithPassword

**Qué hacer:** En `UserModel` agregar el método `updateWithPassword(id, { name, email, password })`. Si `password` está presente, hashearla con `bcrypt.hash(password, 10)` e incluirla en el `UPDATE`; si no, actualizar solo `name` y `email`. El método retorna `{ id, name, email, created_at }`. También verificar que `findById` devuelve `created_at` — ya lo hace según el código leído.

**Archivo a modificar:**
- `backend/src/models/user.model.js`

**Verificar:** `node src/index.js` arranca sin errores (en `backend/`).

---

### Paso 4 — Backend: controller user — getProfile y updateProfile

**Qué hacer:** Agregar en `UserController`:
- `getProfile(req, res)`: usa `req.user.id` (provisto por `verifyToken`) para llamar `UserModel.findById(req.user.id)`. Si no existe retorna 404. Retorna `{ success: true, data: { id, name, email, created_at } }`.
- `updateProfile(req, res)`: extrae `{ name, email, password }` de `req.body`. Valida que `name` y `email` estén presentes (400 si faltan). Si viene `password`, valida que tenga al menos 6 caracteres (400 si no cumple). Llama `UserModel.updateWithPassword(req.user.id, { name, email, password })`. Retorna `{ success: true, data: { id, name, email, created_at } }`.

**Archivo a modificar:**
- `backend/src/controllers/user.controller.js`

**Verificar:** `node src/index.js` arranca sin errores.

---

### Paso 5 — Backend: rutas protegidas de perfil

**Qué hacer:** En `user.routes.js` importar `{ verifyToken }` de `'../middleware/auth.middleware'` y agregar antes de las rutas existentes (para evitar colisión con `/:id`):
- `router.get('/profile', verifyToken, UserController.getProfile)`
- `router.put('/profile', verifyToken, UserController.updateProfile)`

La ruta `/profile` debe ir **antes** de `/:id` para que Express no la interprete como un ID.

**Archivo a modificar:**
- `backend/src/routes/user.routes.js`

**Verificar:** `node src/index.js` arranca. `GET /api/users/profile` con token válido retorna los datos del usuario.

---

### Paso 6 — Frontend: ampliar tipo User y agregar UpdateProfilePayload

**Qué hacer:**
1. En `frontend/src/types/user.ts` agregar el campo opcional `created_at?: string` a la interfaz `User`.
2. Agregar la interfaz `export interface UpdateProfilePayload { name: string; email: string; password?: string; }`.

**Archivo a modificar:**
- `frontend/src/types/user.ts`

**Verificar:** `cd frontend && npm run build` — sin errores de TypeScript.

---

### Paso 7 — Frontend: acción updateProfile en authStore

**Qué hacer:** En `authStore.ts` importar `UpdateProfilePayload` de `'../types/user'` y agregar la función `async function updateProfile(payload: UpdateProfilePayload)`:
- Llama `api.put('/users/profile', payload)`.
- Si tiene éxito, actualiza `user.value` con la respuesta del servidor y guarda en `localStorage.setItem('user', JSON.stringify(user.value))`.
- Retorna `{ success: true, message: 'Perfil actualizado correctamente' }`.
- En catch retorna `{ success: false, message: err.response?.data?.message || 'Error al actualizar el perfil' }`.
- Exponer `updateProfile` en el `return`.

**Archivo a modificar:**
- `frontend/src/store/authStore.ts`

**Verificar:** `cd frontend && npm run build` — sin errores de TypeScript.

---

### Paso 8 — Frontend: crear PerfilView.vue

**Qué hacer:** Crear `PerfilView.vue` con:
- Formulario con campos: Nombre (`v-model="name"`), Email (`v-model="email"`), Nueva contraseña (`v-model="newPassword"`, type password, opcional), Confirmar contraseña (`v-model="confirmPassword"`, type password, opcional).
- Validación en submit: si `newPassword` tiene valor, verificar que coincida con `confirmPassword` y que tenga ≥ 6 caracteres; mostrar error inline si no.
- `onMounted`: pre-llenar `name` y `email` desde `authStore.user`.
- Sección informativa (solo lectura): mostrar fecha de registro (`authStore.user.created_at`) formateada con `toLocaleDateString('es')`.
- Botón "Guardar cambios" llama `authStore.updateProfile({ name, email, password: newPassword || undefined })`.
- Feedback de éxito/error usando las mismas clases `.feedback-success` / `.feedback-error` que usa `EventosView.vue`.
- Estilo: misma paleta gris/blanco, card blanca con sombra, sin morado.

**Archivo a crear:**
- `frontend/src/views/PerfilView.vue`

**Verificar:** `cd frontend && npm run build` — sin errores.

---

### Paso 9 — Frontend: ruta /perfil y link en navbar

**Qué hacer:**
1. En `frontend/src/router/index.ts` importar `PerfilView` y agregar `{ path: 'perfil', name: 'Perfil', component: PerfilView, meta: { requiresAuth: true } }` como child del route de `MainLayout`.
2. En `frontend/src/layouts/MainLayout.vue` agregar `<RouterLink to="/perfil">Perfil</RouterLink>` dentro de `.nav-links`, después del link "Calendario" y antes del botón "Cerrar Sesión".

**Archivos a modificar:**
- `frontend/src/router/index.ts`
- `frontend/src/layouts/MainLayout.vue`

**Verificar:** `cd frontend && npm run build` — sin errores. El navbar muestra "Inicio | Eventos | Calendario | Perfil | Cerrar Sesión".

---

## FEATURE 3: Editar y Eliminar Eventos

### Paso 10 — Backend: service — updateEvent y deleteEvent

**Qué hacer:** En `EventService` agregar dos métodos estáticos:

**`updateEvent(eventId, userId, eventData)`:**
1. Obtiene un `client` de `pool.connect()`.
2. `BEGIN`.
3. Verifica ownership: `SELECT id FROM events WHERE id = $1 AND user_id = $2 FOR UPDATE` — si no retorna fila lanza `Error('Evento no encontrado o no autorizado')`.
4. Re-verifica conflictos **excluyendo el propio evento**: `SELECT id FROM events WHERE user_id = $2 AND id != $1 AND start_time < $4 AND end_time > $3 FOR UPDATE` — si hay resultado lanza `Error('Conflicto de horario: El intervalo se solapa con otro evento existente.')`.
5. Ejecuta `UPDATE events SET title=$1, description=$2, start_time=$3, end_time=$4, timezone=$5 WHERE id=$6 AND user_id=$7 RETURNING *`.
6. `COMMIT`, retorna `rows[0]`.
7. `ROLLBACK` en catch.

**`deleteEvent(eventId, userId)`:**
1. Ejecuta `DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id`.
2. Si no retorna fila lanza `Error('Evento no encontrado o no autorizado')`.
3. Retorna `rows[0]`.

**Archivo a modificar:**
- `backend/src/services/event.service.js`

**Verificar:** `node src/index.js` arranca sin errores.

---

### Paso 11 — Backend: controller — update y remove

**Qué hacer:** En `EventController` agregar:

**`update(req, res)`:**
- Extrae `req.params.id` y `req.user.id`.
- Extrae `{ title, description, startTime, endTime, timezone }` de `req.body`.
- Llama `EventService.updateEvent(req.params.id, req.user.id, { title, description, startTime, endTime, timezone })`.
- En éxito: `res.json({ message: 'Evento actualizado con éxito', event: updatedEvent })`.
- En error con mensaje de conflicto: 409. En error de no encontrado: 404. Otros: 500.

**`remove(req, res)`:**
- Llama `EventService.deleteEvent(req.params.id, req.user.id)`.
- En éxito: `res.json({ message: 'Evento eliminado con éxito' })`.
- En error de no encontrado/no autorizado: 404. Otros: 500.

**Archivo a modificar:**
- `backend/src/controllers/event.controller.js`

**Verificar:** `node src/index.js` arranca sin errores.

---

### Paso 12 — Backend: rutas PUT y DELETE /events/:id

**Qué hacer:** En `event.routes.js` agregar:
- `router.put('/:id', verifyToken, EventController.update)`
- `router.delete('/:id', verifyToken, EventController.remove)`

Ambas rutas deben ir después de las rutas ya existentes (`POST /` y `GET /user/:userId`) para que no haya colisión con el getter de usuario.

**Archivo a modificar:**
- `backend/src/routes/event.routes.js`

**Verificar:** `node src/index.js` arranca sin errores.

---

### Paso 13 — Frontend: acciones updateEvent y deleteEvent en eventStore

**Qué hacer:** En `eventStore.ts` agregar:

**`async function updateEvent(id: number, eventData: Omit<EventModel, 'userId'>)`:**
- Formatea fechas a ISO igual que en `createEvent`.
- Llama `api.put(\`/events/${id}\`, formattedData)`.
- Actualiza el array local: `const idx = events.value.findIndex(e => e.id === id); if (idx !== -1) events.value[idx] = response.data.event`.
- Retorna `{ success: true, message: '¡Evento actualizado con éxito!' }`.
- En catch retorna `{ success: false, message: err.response?.data?.error || 'Error al actualizar el evento' }`.

**`async function deleteEvent(id: number)`:**
- Llama `api.delete(\`/events/${id}\`)`.
- Elimina del array: `events.value = events.value.filter(e => e.id !== id)`.
- Retorna `{ success: true, message: 'Evento eliminado' }`.
- En catch retorna `{ success: false, message: err.response?.data?.error || 'Error al eliminar el evento' }`.

Exponer ambas funciones en el `return`.

**Archivo a modificar:**
- `frontend/src/store/eventStore.ts`

**Verificar:** `cd frontend && npm run build` — sin errores de TypeScript.

---

### Paso 14 — Frontend: botones Editar y Eliminar en EventosView.vue

**Qué hacer:** Modificar la sección de la lista de eventos en `EventosView.vue`:

1. Agregar estado reactivo para el modal de edición:
   - `const editingEvent = ref<EventModel | null>(null)` — el evento que se está editando.
   - `const editTitle = ref('')`, `editDescription = ref('')`, `editStartTime = ref('')`, `editEndTime = ref('')`, `editTimezone = ref('')`.
   - `const editFeedback = ref('')`, `editIsError = ref(false)`.

2. Función `openEdit(ev: EventModel)`: asigna `editingEvent.value = ev` y pre-llena los `edit*` refs. Para los datetime-local inputs, convertir `ev.startTime` a formato `YYYY-MM-DDTHH:mm` usando `new Date(ev.startTime).toISOString().slice(0,16)`.

3. Función `closeEdit()`: `editingEvent.value = null`.

4. Función `async handleUpdate()`: llama `eventStore.updateEvent(editingEvent.value!.id!, { title: editTitle.value, description: editDescription.value, startTime: editStartTime.value, endTime: editEndTime.value, timezone: editTimezone.value })`. Si success cierra modal. Si error muestra `editFeedback`.

5. Función `async handleDelete(id: number)`: llama `confirm('¿Seguro que quieres eliminar este evento?')`; si confirma llama `eventStore.deleteEvent(id)` y muestra feedback en `feedbackMessage`.

6. En el template, dentro de cada `.event-item`, agregar una fila de botones:
   ```
   <div class="event-actions">
     <button class="btn-edit" @click="openEdit(ev)">✏️ Editar</button>
     <button class="btn-delete" @click="handleDelete(ev.id!)">🗑️ Eliminar</button>
   </div>
   ```

7. Modal de edición: un `<div class="edit-modal-overlay" v-if="editingEvent" @click.self="closeEdit">` con un formulario interno pre-llenado (título, descripción, inicio, fin) y botón "Actualizar". Mismo estilo que el formulario de creación.

8. Agregar clases CSS para `.event-actions`, `.btn-edit`, `.btn-delete`, y `.edit-modal-overlay` / `.edit-modal` siguiendo la paleta gris/blanca existente.

**Archivo a modificar:**
- `frontend/src/views/EventosView.vue`

**Verificar:** `cd frontend && npm run build` — sin errores de TypeScript ni de Vite.

---

## Orden de implementación (resumen de dependencias)

```
Paso 1  → Paso 2                (Feature 1: FullCalendar)
Paso 3  → Paso 4  → Paso 5     (Feature 2: Backend perfil)
Paso 6  → Paso 7  → Paso 8 → Paso 9  (Feature 2: Frontend perfil)
Paso 10 → Paso 11 → Paso 12    (Feature 3: Backend editar/eliminar)
Paso 13 → Paso 14              (Feature 3: Frontend editar/eliminar)
```

Las tres features son independientes entre sí. Se puede implementar en cualquier orden de feature, pero dentro de cada feature los pasos deben seguirse en secuencia.

---

## Comandos de verificación final

```bash
# Backend: arrancar sin errores
cd backend && node src/index.js

# Frontend: compilar sin errores
cd frontend && npm run build
```

No hay suite de tests automatizados en el proyecto. La verificación es compilación exitosa + arranque del servidor.
