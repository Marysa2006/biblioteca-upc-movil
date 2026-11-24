# Integración con el Backend

Qué tiene que existir del lado del servidor para apagar los datos de prueba (`USAR_MOCKS`), y qué
cambia en cada módulo. Lo pidió la reunión con la bibliotecóloga del 5 de noviembre de 2026, y lo
deja por escrito el **#228**. La versión de la 1.1, con lo que falta campo por campo, es el documento
**«App móvil y Backend: campos pendientes y archivos»**, que se le entrega al Backend: este archivo
sigue siendo el inventario de endpoints de la app y el plan para apagarlos.

**Estado de esta comparación:** `biblioteca-upc-movil` @ `develop` (`48b91d8`, 23 de noviembre de
2026) contra `LibniT/BackEnd-Biblioteca` @ `develop` `53d1350` (23 de noviembre), `docs/schema.yml`
versión **2.0.1** con **111 rutas**.

> El Backend tiene `main` en `ad3b76c` (5 de noviembre), **sin** la migración `core.0004` de los
> roles. Todo lo de roles de este documento es de `develop`, no de `main`.

> **El `develop` del Backend se mueve.** Entre el `ca50fff` (10 de noviembre, 105 rutas) y el
> `53d1350` (23 de noviembre, 111 rutas) hubo dos versiones de esquema. Entraron la asistencia por
> QR, aprobar y rechazar asesoría, el registro de cuentas y la aceptación de la política; salieron
> los horarios de asesoría y las franjas de un tema. Vuelve a medirse antes de empezar el plan.

---

## 1. Lo que hay que resolver antes de apagar los mocks

Estos seis puntos afectan a **todos** los módulos: mientras no estén, apagar `USAR_MOCKS` deja la
app vacía o rota.

| # | Qué pasa | Qué hace falta |
|---|---|---|
| 1 | **Ninguna ruta coincide.** El móvil usa español y sin prefijo (`/asesorias/citas/`), el Backend inglés con `/api/v1/` (`/api/v1/advisories/appointments/`) | Una capa de traducción en `src/api/cliente.ts` |
| 2 | **Los días de la semana están invertidos.** Móvil: `0 = domingo` (como `Date.getDay()`). Backend: `DayOfWeekEnum` con `0 = lunes` y `6 = domingo` | Que uno de los dos cambie, o traducir en el cliente |
| 3 | **JWT distinto.** Backend devuelve `{ access, refresh }`; el móvil espera `{ usuario, token }` y **no renueva** el token | Guardar el `refresh` y renovarlo; `/me/` para el usuario |
| 4 | **Paginación.** El Backend devuelve `{ count, next, previous, results }` en **27 GET**; el móvil espera arrays planos | Desenvolver `results` en el cliente |
| 5 | **El login no habla el mismo idioma.** Backend pide `{ email, password }`; el móvil manda `{ correo, contrasena }` | Traducir el cuerpo, o alinear los nombres |
| 6 | **Estados y tipos.** Estados: **6** en el móvil contra **8** en el Backend (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `RESCHEDULE_PROPOSED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`). Tipos de usuario: **5** en el móvil contra **3** (`STUDENT`, `TEACHER`, `ADMINISTRATIVE`) | Tabla de equivalencias para los dos |
| 7 | **El APK solo habla por HTTPS.** Desde el #299 el APK ya no permite tráfico HTTP (`usesCleartextTraffic` quitado); un Django local por `http://` solo sirve en Expo Go | El servidor de producción, con HTTPS |

**Los roles ya coinciden.** `administrador`, `facilitador` y `gestor_espacios`, por **código** y no
por nombre (`Role.code`, migración `core.0004`). Ese bloqueante desapareció.

---

## 2. Endpoints, por módulo

**Leyenda:** ✅ existe una ruta del Backend que hace lo mismo · ⚠️ existe pero cambia algo (método,
forma del cuerpo o de la respuesta) · ❌ no existe.

`src/api` hace **109 llamadas** a `peticion()` con ruta, que son **103 endpoints distintos**: seis se
piden dos veces (`GET /espacios`, `GET /servicios` y `GET /usuarios` con y sin filtro para la
administración, y las tres funciones de asesoría que comparten ruta con su versión obsoleta). De esos
103, **75 tienen contraparte** en el Backend y **28 no**.

> Cómo se cuenta: `rg -c 'peticion<' src/api/*.ts` da **109** (sin contar `cliente.ts`, que es el
> propio cliente HTTP). Cada llamada se comprobó con su método y su ruta contra el `schema.yml`
> 2.0.1: **0 rutas inventadas y 0 métodos inexistentes**.

| Módulo | Móvil | Backend | |
|---|---|---|---|
| **Asesorías** | `GET /asesorias/agenda` | `/api/v1/advisories/agenda/` | ✅ |
| | `POST /asesorias/citas` | `/api/v1/advisories/appointments/` | ✅ con `desired_date`/`desired_time` y `accept_terms`; ya no exige franja |
| | `GET /asesorias/citas/mias` | `/api/v1/advisories/appointments/` | ✅ |
| | `POST /asesorias/citas/{id}/aprobar` | `/api/v1/advisories/manage/appointments/{id}/approve/` | ✅ `scheduled_date`, `start_time`, `facilitator`, `virtual_link` |
| | `POST /asesorias/citas/{id}/cancelar` | `/api/v1/advisories/appointments/{id}/cancel/` | ✅ |
| | `POST /asesorias/citas/{id}/inasistencia` | `/api/v1/advisories/agenda/appointments/{id}/record/` | ✅ `attended: false` |
| | `POST /asesorias/citas/{id}/rechazar` | `/api/v1/advisories/manage/appointments/{id}/reject/` | ✅ el motivo es obligatorio |
| | `POST /asesorias/citas/{id}/reprogramar` | `/api/v1/advisories/appointments/{id}/reschedule/` | ✅ solo fecha y hora |
| | `POST /asesorias/citas/{id}/resultado` | `/api/v1/advisories/agenda/appointments/{id}/record/` | ✅ `attended: true` y `quality_rating` |
| | `POST /solicitudes/cita/{id}/calificacion` | `/api/v1/advisories/appointments/{id}/rate/` | ⚠️ el Backend lo cuelga de la cita, no de `/solicitudes/` |
| | `GET` · `POST /asesorias/jornadas` · `PUT /{id}` | ❌ | ❌ el Backend quitó `/manage/schedules/` en la 2.0.0: la asesoría no depende de una jornada |
| | `GET /asesorias/temas` · `POST` · `PUT` | `/advisories/topics/` · `/manage/topics/` | ✅ |
| | `GET /asesorias/temas/{id}/franjas` | ❌ | ❌ quitó `/topics/{id}/slots/`: la franja se calcula con fecha y hora |
| **Asistencia** | `POST …/asistencia/abrir` | `GET /api/v1/attendance/{id}/qr/` | ⚠️ es GET y el token lo genera el servidor; vale 4 h |
| | `POST …/asistencia/qr` | `POST /api/v1/attendance/` | ⚠️ la persona sale de la sesión, no del cuerpo; 201 la primera vez y 200 después |
| | `GET …/asistencia` | `GET /api/v1/attendance/{id}/` | ⚠️ devuelve nombre, programa y semestre, sin id de usuario ni medio |
| | `POST …/asistencia/manual` | ❌ | ❌ no existe el registro a mano |
| | `POST …/asistencia/cerrar` | ❌ | ❌ no hay cierre: el token vence solo |
| **Auth** | `POST /auth/login` | `/api/v1/token/` (+ `/token/refresh/`) | ⚠️ pide `{email,password}` y devuelve `{access,refresh}` |
| | `POST /register` | `/api/v1/register/` | ⚠️ falta la sede y la facultad (ver §3) |
| **Autoarchivo** | `GET /autoarchivo` | `/api/v1/portal/self-archive/` | ✅ |
| **Bloqueos** | `GET /bloqueos` · `POST /bloqueos` | `GET`/`POST /spaces/blocks/` | ⚠️ el espacio va por `?space=` y el POST con `confirm: true` |
| | `POST /bloqueos/afectadas` | ❌ | ❌ las afectadas llegan en el 409 del POST |
| **Capacitaciones** | `GET` · `POST /capacitaciones/lineas` · `PUT /{id}` | `/trainings/lines/` · `/lines/manage/` | ✅ |
| | `PATCH /lineas/{id}/estado` | `PATCH /lines/manage/{id}/` (`is_active`) | ✅ |
| | `GET /lineas/{id}/solicitudes-activas` | `/trainings/requests/manage/` | ⚠️ hoy es un filtro `?line=&status=`, no una ruta aparte |
| | `POST /capacitaciones/solicitudes` | `/api/v1/trainings/requests/` | ⚠️ faltan novedades, datos del solicitante y `accept_terms` |
| | `GET /capacitaciones/solicitudes/mias` | `/api/v1/trainings/requests/` | ✅ |
| | `GET /capacitaciones/solicitudes/{id}` | `/trainings/requests/manage/{id}/` | ✅ |
| | `…/aprobar` · `/rechazar` · `/nueva-fecha` · `/cerrar` | `/manage/{id}/approve\|reject\|propose-date\|close/` | ✅ |
| | `PATCH …/responsable` | `POST /manage/{id}/assign/` | ⚠️ es POST |
| | `…/responder-fecha` | `/requests/{id}/accept-date\|decline-date/` | ✅ |
| | `POST /solicitudes/capacitacion/{id}/calificacion` | ❌ | ❌ solo existe `rate` de asesorías |
| **Contenidos** | `GET` · `POST /contenidos` | `/portal/manage/contents/` | ✅ |
| | `PUT /contenidos/{id}` | `/manage/contents/{slug}/` | ✅ |
| | `PATCH /contenidos/{id}/publicacion` | `…/{slug}/publish/` y `/hide/` | ⚠️ dos rutas, no un PATCH |
| | `PATCH /contenidos/orden` | `…/manage/contents/reorder/` | ⚠️ el Backend lo expone como POST |
| **Espacios** | `GET` · `POST /espacios` · `PUT /{id}` | `/spaces/` · `/spaces/manage/` | ✅ |
| | `GET /espacios/{id}/disponibilidad` | `/spaces/{id}/availability/` | ✅ |
| | `PATCH /espacios/{id}/estado` | `POST /spaces/manage/{id}/status/` | ⚠️ es POST |
| | `GET /espacios/{id}/reservas-futuras` | `/spaces/manage/reservations/` | ⚠️ hoy es un filtro `?space=&date_from=&status=` |
| | `POST /reservas` | `/api/v1/spaces/reservations/` | ⚠️ faltan recursos de apoyo, datos del solicitante y `accept_terms` |
| **Estadísticas** | `GET /estadisticas/registros` | ❌ | ❌ solo hay `summary/` y `export/` |
| **Fotos de Inicio** | 6 rutas (`GET`, `POST`, administración, orden, `PUT`, publicación) | ❌ | ❌ el recurso no existe: rutas y campos propuestos en el documento de campos |
| **Guías** | 6 rutas (`GET`, `POST`, administración, `PUT`, detalle, publicación) | ❌ | ❌ no hay modelo de guías: los contenidos del portal son aviso, noticia y página |
| **Historial** | `GET /solicitudes/{tipo}/{id}/historial` | `/me/requests/{id}/` | ✅ el historial viene dentro del detalle |
| **Notificaciones** | `GET /notificaciones` | `/notifications/me/` | ✅ |
| | `PATCH /notificaciones/{id}/leida` | `/notifications/me/{id}/read/` | ⚠️ es POST |
| **Parámetros** | `GET /parametros` | `/config/parameters/` | ⚠️ son cuatro rutas: `parameters`, `periods`, `holidays` y `schedules` |
| | `PUT /parametros` | `/config/parameters/{code}/` | ⚠️ uno por código, y es PATCH |
| **Perfil** | `GET` · `PATCH /perfil` | `/api/v1/me/` | ✅ |
| **Recursos** | `GET /recursos` | `/portal/resources/` | ✅ |
| **Reservas** | `GET /reservas/mias` · `GET /reservas/{id}` | `/me/requests/` · `/{id}/` | ✅ |
| | `POST /reservas/terceros` | `/spaces/manage/reservations/` | ✅ con `requester_email` |
| | `POST /reservas/{id}/decision` | `…/manage/reservations/{id}/approve\|reject\|cancel/` | ✅ son tres rutas |
| **Servicios** | `GET /servicios` · `GET /servicios/{id}` | `/portal/services/` · `/{slug}/` | ✅ |
| | `POST` · `PUT` · `PATCH /estado` | ❌ | ❌ el portal solo tiene GET |
| **Solicitudes** | `GET /solicitudes/mias/{id}` | `/api/v1/me/requests/{id}/` | ✅ |
| **Tablets** | `GET` · `POST /tablets` · `PUT /{id}` | `/tablets/manage/` | ✅ |
| | `PATCH /tablets/{id}/estado` | `PATCH /tablets/manage/{id}/` | ✅ |
| | `GET /tablets/disponibilidad` | `/tablets/availability/` | ✅ |
| | `GET /tablets/codigo/{codigo}` | ❌ | ❌ no hay búsqueda por código; propuesto `?search=` |
| | `GET /tablets/condiciones` | ❌ | ❌ solo guarda `conditions_accepted` |
| | `GET /prestamos/mios` · `POST /prestamos` | `/tablets/loans/` | ✅ |
| | `GET /prestamos/{id}` | `/tablets/manage/loans/{id}/` | ✅ |
| | `GET /prestamos/vencidos` | `/tablets/manage/loans/?status=OVERDUE` | ✅ |
| | `POST /prestamos/{id}/entrega` · `/devolucion` | `…/manage/loans/{id}/deliver/` · `/return/` | ✅ |
| | `GET /prestamos/{id}/constancia` | ❌ | ❌ **no hace falta**: la app arma la constancia con el detalle |
| **Usuarios** | `GET /usuarios` | `/api/v1/users/` | ✅ |
| | `PUT /usuarios/{id}/roles` | `POST`/`DELETE /users/{user_id}/roles/` | ⚠️ uno por uno, no un PUT con la lista |
| | `PUT /usuarios/{id}/permisos` | ❌ | ❌ el Backend solo tiene permisos **por rol** (`Role.permissions`) |

**Resumen:** **55 ✅ · 20 ⚠️ · 28 ❌ = 103** endpoints. Con contraparte (✅+⚠️) **75**; sin ella, **28**.

---

## 3. Lo que falta campo por campo

Esto ya no va por endpoint sino por **dato**: es lo que la app ya pide y el Backend no recibe. Lo
desarrolla, con las preguntas para el equipo del servidor, el documento **«App móvil y Backend:
campos pendientes y archivos»**; aquí queda el resumen para no tener que abrirlo.

### Prioridad alta: la app lo pide y el Backend no lo recibe

| Dato | Dónde | Estado en el Backend (`53d1350`) |
|---|---|---|
| **Sede de la persona** (Valledupar o Aguachica) | las cuatro solicitudes y el registro | no existe en el usuario ni en la solicitud |
| **Solicitud de capacitación**: novedades, datos del solicitante y `accept_terms` | `POST /trainings/requests/` | `TrainingRequest` no tiene ninguno de los tres |
| **Reserva de espacios**: recursos de apoyo, datos del solicitante y `accept_terms` | `POST /spaces/reservations/` | no existen |
| **Registro**: sede y facultad | `POST /register/` | `Register` no las tiene |
| **Tablets y constancia**: marca, valor y tipo de la tablet; estado del formato y firma | `POST …/deliver/` | `Tablet` no tiene marca ni valor; la entrega no tiene estado del formato ni firma |

### Prioridad media

| Tema | Qué falta |
|---|---|
| **Archivos** | Cómo se suben (`multipart/form-data`) y dónde se guardan en producción (`MEDIA_ROOT` o un servicio externo). Hoy la app manda la **ruta local** de la foto del espacio dentro del JSON, que el servidor no puede abrir |
| **Estadísticas** | Sede, temáticas (tema de asesoría y línea de formación), tiempo de respuesta, duración de los préstamos y calificación promedio en `summary/`; y una serie por día de la semana para la afluencia del Dashboard |
| **Asistencia con QR** | El registro a mano y cinco preguntas: la ventana de 4 h, si se valida que quien escanea esté inscrito, el id y el medio de cada asistente, y si entra en los registros de uso |
| **Guías de la biblioteca** | El modelo y las rutas, con el PDF y `updated_at` con hora |
| **Fotos de Inicio y permisos por persona** | El recurso de fotos (máximo 5 publicadas) y una lista de permisos **aparte de los roles** |

### Prioridad baja

| Tema | Qué falta |
|---|---|
| **Servicios del portal** | Crear, editar y activar o desactivar: hoy el portal solo tiene GET |
| **Calificar la capacitación** | `POST /trainings/requests/{id}/rate/`, igual que el de asesorías |
| **Koha para el personal** | La dirección de `KOHA_STAFF_URL`: la app la usa en el #311 |

### Lo que la app ya resuelve por su cuenta

Para no pedirle cambios de forma al Backend, la app se adapta en `src/api/cliente.ts`: las rutas al
inglés con `/api/v1/`, el login a `{email,password}` con `refresh`, `results` de las paginadas, los
días de la semana (`0 = lunes`), los nombres de los campos, los estados y los tipos de usuario.

Y **deja de enviar** lo que el Backend no necesita: la sede de la reserva, la identificación, los
nombres de los participantes de la capacitación y la asignatura aparte del grupo.

---

## 4. Plan para apagar los mocks

El interruptor es uno (`USAR_MOCKS`), pero **no se puede apagar de golpe**: con 103 endpoints en
español y el Backend en inglés, apagarlo dejaría la app vacía. Orden propuesto, un módulo por PR y
con su prueba:

1. **La capa de traducción** en `src/api/cliente.ts`: prefijo `/api/v1`, mapa español→inglés y
   desenvoltura de `results` en las 27 paginadas. **Sin esto no avanza nada más.**
2. **Autenticación**: `{email, password}` → `{access, refresh}`, guardar el `refresh` y renovarlo, y
   pedir `/me/` para el usuario.
3. **Solo lectura**: `servicios`, `contenidos`, `parametros`, `espacios`.
4. **Solicitudes**: `reservas`, `tablets`, `asesorias`. Va **después del punto 3** porque las tres
   leen de lo de allí: las asesorías sacan los horarios y los días no hábiles de `parametros`, y las
   reservas, la disponibilidad de `espacios`.
5. **Estadísticas y asistencia**: al final, porque dependen de que todo lo anterior escriba de verdad.
6. **Catálogo y repositorio** van aparte: no pasan por el Backend.

**Antes del punto 1 hay que cerrar los cinco temas de prioridad alta de §3**, o la app no podrá
guardar los datos de los formularios aunque consiga hablar con el servidor.

---

## 5. Lo que este documento no cubre

No hay una instancia del Backend en el entorno donde se escribió esto: **el contraste es contra el
`schema.yml`**, que es lo que el Backend declara, no contra respuestas reales. Las pruebas de
integración de verdad siguen pendientes de un entorno.

Los tres documentos de la entrega de la 1.1 son:

- **este archivo**, con el inventario de endpoints y el plan;
- **«App móvil y Backend: campos pendientes y archivos»**, con los 13 temas campo por campo y las
  preguntas para el equipo del servidor;
- la **guía técnica** (`docs/guia-tecnica.md`), que explica cómo está hecha la app.
