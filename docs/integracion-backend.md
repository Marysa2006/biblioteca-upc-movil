# Integración con el Backend

Qué tiene que existir del lado del servidor para apagar los datos de prueba (`USAR_MOCKS`), y qué
cambia en cada módulo. Lo pidió la reunión con la bibliotecóloga del 5 de noviembre de 2026, y lo
deja por escrito el **#228**. La versión de la 1.1, con lo que falta campo por campo, es el documento
**«App móvil y Backend: campos pendientes y archivos»**, que se le entrega al Backend: este archivo
sigue siendo el inventario de endpoints de la app y el plan para apagarlos.

**Estado de esta comparación:** el inventario de §2 se midió con `biblioteca-upc-movil` @ `develop`
(`48b91d8`, 23 de noviembre de 2026) contra el Backend **2.0.1** (`53d1350`, 111 rutas). El 24 de
noviembre el Backend publicó la **2.1.0** (`e8555ba`, en `main` y en `develop`, **125 rutas**), que
resuelve casi todo lo que faltaba: ver §2.1 y §3.

**Servidor de pruebas:** `https://backend-biblioteca-njx5.onrender.com/api/v1` (Swagger en
`/api/docs/`), con la 2.1.0 y HTTPS. Lo que se encontró al probarlo está en §5.

**La conexión ya empezó** (§4): la fase 1, la sesión, está en `chore/integracion-api-sesion`.

---

## 1. Lo que hay que resolver antes de apagar los mocks

Estos puntos afectan a **todos** los módulos: mientras no estén, apagar `USAR_MOCKS` deja la app
vacía o rota.

| # | Qué pasa | Qué hace falta | Estado |
|---|---|---|---|
| 1 | **Ninguna ruta coincide.** El móvil usa español y sin prefijo (`/asesorias/citas/`), el Backend inglés con `/api/v1/` (`/api/v1/advisories/appointments/`) | Reescribir la rama sin mocks de cada función con la ruta del Backend y un adaptador en `src/api/backend/` | Por módulo (§4); el prefijo va en `EXPO_PUBLIC_API_URL` |
| 2 | **Los días de la semana están invertidos.** Móvil: `0 = domingo` (como `Date.getDay()`). Backend: `DayOfWeekEnum` con `0 = lunes` y `6 = domingo` | Traducir en `src/api/backend/equivalencias.ts` | Fase 2 |
| 3 | **JWT distinto.** Backend devuelve `{ access, refresh }` (30 min y 7 días, y el `refresh` cambia en cada renovación); el móvil esperaba `{ usuario, token }` y **no renovaba** el token | Guardar el `refresh` y renovarlo; `/me/` y `/me/access/` para el usuario | ✅ Fase 1 |
| 4 | **Paginación.** El Backend devuelve `{ count, next, previous, results }`; el móvil espera arrays planos. Hay tres formas de lista: paginada, objeto con la lista adentro (`{message, spaces}`) y arreglo simple | `peticionPagina()` y `peticionTodas()` en `src/api/cliente.ts`; cada adaptador sabe qué forma le toca | ✅ Fase 1 (las funciones) |
| 5 | **El login no habla el mismo idioma.** Backend pide `{ email, password }`; el móvil manda `{ correo, contrasena }` | Traducir el cuerpo | ✅ Fase 1 |
| 6 | **Estados y tipos.** Estados: **6** en el móvil contra **8** en el Backend (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `RESCHEDULE_PROPOSED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`). Tipos de usuario: **5** en el móvil contra **3** (`STUDENT`, `TEACHER`, `ADMINISTRATIVE`) | Tabla de equivalencias para los dos | Tipos ✅ fase 1 (sin egresados, para después); estados en la fase 3 |
| 7 | **El APK solo habla por HTTPS.** Desde el #299 el APK ya no permite tráfico HTTP (`usesCleartextTraffic` quitado); un Django local por `http://` solo sirve en Expo Go | El servidor de producción, con HTTPS | ✅ Render tiene HTTPS |
| 8 | **Errores.** `peticion()` descartaba el cuerpo del error, así que la pantalla veía «La API respondió 400 en …» | Leer `{detail}`, `{detail, error_code}` y `{campo: [...]}` en `ErrorApi` (`codigo` y `campos`) | ✅ Fase 1 |

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

### 2.1 Lo que cambió con la 2.1.0

La tabla de arriba es contra la 2.0.1. La 2.1.0 agrega rutas para casi todos los ❌; cada uno se
confirma al conectar su módulo:

| Módulo | Ruta nueva en la 2.1.0 |
|---|---|
| **Asistencia** | `POST /attendance/{id}/manual/` (registro a mano, con o sin cuenta). No hay «abrir» ni «cerrar»: el QR vale 4 h desde el inicio de la sesión y cualquiera con cuenta puede escanear |
| **Fotos de Inicio** | `GET /portal/home-photos/` (sin sesión) y `/portal/manage/home-photos/` con `reorder/`; la imagen va en `image` |
| **Guías** | `GET /portal/guides/` (sin sesión) y `/portal/manage/guides/`; el PDF va en `file` y `updated_at` trae hora |
| **Servicios** | `/portal/manage/services/` y `/portal/manage/service-categories/` |
| **Capacitaciones** | `POST /trainings/requests/{id}/rate/` |
| **Tablets** | `GET /tablets/manage/?search=` y la página `condiciones-tablets` del portal |
| **Usuarios** | `GET`/`PUT /users/{id}/permissions/` (`extra_permissions`) y `GET /users/?role=` |
| **Solicitudes** | `GET /me/requests/` y `/me/requests/{id}/`, con el historial |

Las jornadas y las franjas de asesoría ya no existen: esas funciones se borran al conectar Asesorías.
Los archivos se suben en `multipart/form-data` (foto del espacio en `photo`, fotos de Inicio en
`image`, PDF de las guías en `file` y foto de perfil en `photo`).

---

## 3. Lo que falta campo por campo

Esto ya no va por endpoint sino por **dato**: es lo que la app ya pide y el Backend no recibe. Lo
desarrolla, con las preguntas para el equipo del servidor, el documento **«App móvil y Backend:
campos pendientes y archivos»**; aquí queda el resumen para no tener que abrirlo.

> **Con la 2.1.0 está todo resuelto**, con estos nombres: `campus` (`VALLEDUPAR` o `AGUACHICA`),
> `faculty` y `position` en el registro y el perfil; `contact_phone`, `campus`, `education_level`,
> `faculty`, `program` y `semester` en las cuatro solicitudes; `notes` y `accept_terms` en la
> capacitación (máximo 25 participantes); `support_resources` y `accept_terms` en la reserva;
> `brand`, `asset_value` y `device_type` en la tablet; `format_condition`, `signature` y
> `receipt_code` en la entrega y la constancia; y en `statistics/summary/`, `by_campus`, `by_topic`,
> `by_weekday`, `response_hours`, `tablet_loans`, `average_rating` y `attendees`. Las tablas de abajo
> quedan como registro de lo que se pidió. Lo que sigue pendiente está en §3.1.
>
> El Backend no exige la sede al pedir una tablet ni en la capacitación, para no bloquear a la web;
> la app la sigue exigiendo en su formulario.

### 3.1 Lo que sigue pendiente (24 de noviembre)

| Tema | Qué pasa | Quién |
|---|---|---|
| **Firma del personal** | La app la guarda en el Perfil (`PUT /me/firma/`, provisional). Se pidió `signature` en `GET`/`PATCH /me/` y que el `GET` del préstamo devuelva las firmas de entrega y de devolución | Backend |
| **Cuenta desactivada** | `/token/` responde 401 igual que con una contraseña incorrecta, así que la app no puede decir «tu cuenta está inactiva» (HU-05, CA3). Se sugirió 403 | Backend (no bloquea) |
| **Dirección en el perfil** | El Backend no la tiene: con la API, la app la oculta | — |
| **Egresados** | El Backend no tiene ese tipo de usuario | Para después |

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

### Lo que la app resuelve por su cuenta

Para no pedirle cambios de forma al Backend, la app se adapta: `src/api/cliente.ts` hace lo común
(prefijo, token y su renovación, errores, paginación) y `src/api/backend/` traduce lo de cada módulo
(rutas, nombres de los campos, días de la semana, estados y tipos de usuario).

Y **deja de enviar** lo que el Backend no necesita: la sede de la reserva, la identificación, los
nombres de los participantes de la capacitación y la asignatura aparte del grupo.

---

## 4. Plan para apagar los mocks, por fases

No se puede apagar `USAR_MOCKS` de golpe: cada función tiene su rama sin mocks escrita con rutas
provisionales en español. Se conecta **un módulo a la vez**, con su PR y su prueba contra Render:

- **`usaApi(modulo)`** (`src/api/cliente.ts`) decide en cada función. Es `true` si
  `EXPO_PUBLIC_USAR_MOCKS=false`, o si el módulo está en `EXPO_PUBLIC_API_MODULOS` (por ejemplo
  `sesion`). Así el APK de demostración sigue con datos de prueba mientras se conecta lo demás.
- **Cada módulo** cambia `USAR_MOCKS` por `usaApi('…')` en sus funciones y escribe su adaptador en
  `src/api/backend/`. Las pantallas y los hooks no cambian.
- **Mientras se mezclan:** al entrar con una cuenta real, los módulos que siguen con datos de prueba
  están guardados con los ids de los usuarios de prueba, así que, por ejemplo, Mis solicitudes sale
  vacía hasta la fase 3.

| Fase | Qué | Módulos |
|---|---|---|
| 0 | Probar Render: rutas públicas, login, `/me/`, errores y paginación | — ✅ |
| 1 | El cliente (errores, renovación del token, paginación, servidor lento) y la sesión: login, `/me/`, `/me/access/` (el superusuario cuenta como `administrador`), registro, política y perfil | `sesion` |
| 2 | Lectura pública: servicios, avisos de Inicio, recursos, guías, notificaciones, fotos de Inicio, y periodos, festivos, horarios y plazos (los días hábiles de todos los calendarios) | `servicios`, `contenidos`, `recursos`, `guias`, `notificaciones`, `fotosInicio`, `parametros` |
| 3 | Solicitudes de la comunidad, **cada una con su catálogo**: espacios (con disponibilidad) y reservas, temas y asesorías (sin jornadas ni franjas), líneas y capacitaciones, tablets, Mis solicitudes con historial y foto de perfil | `espacios`, `reservas`, `asesorias`, `capacitaciones`, `tablets`, `solicitudes` |
| 4 | Personal: bandejas, entrega y devolución con firma y `receipt_code`, y la administración | `bloqueos`, `usuarios` y la parte del personal de los anteriores |
| 5 | Estadísticas y asistencia (#231) | `estadisticas`, `asistencia` |
| 6 | APK contra el servidor con HTTPS y pruebas de aceptación | todos |

En la fase 2 ya se pueden habilitar las lecturas públicas de avisos y recursos con `EXPO_PUBLIC_API_MODULOS=sesion,contenidos,recursos` y `EXPO_PUBLIC_USAR_MOCKS=true`. `contenidos` activa la lectura de Inicio, solo avisos y noticias: las páginas (`PAGE`, como `autoarchivo`) no son novedades. La administración de contenidos conserva su flujo mock. Para abrir recursos protegidos se requiere una sesión real, ya que Render entrega su URL después del login. Render puede devolver una lista vacía cuando no hay avisos publicados.

Agrega `servicios` a `EXPO_PUBLIC_API_MODULOS` para leer el catálogo y las fichas de Render. La administración sigue usando los mocks con `EXPO_PUBLIC_USAR_MOCKS=true`. Virtualteca abre la solicitud de tablet y Hemeroteca conserva su ficha informativa. La app muestra los servicios activos que puede clasificar en sus categorías existentes.

`guias` activa el listado, el detalle y la gestión de guías (requiere `sesion` para gestionar). `notificaciones` activa la bandeja y el marcado como leída de la cuenta real. En modo mixto, las solicitudes simuladas solo generan notificaciones simuladas.

`parametros` lee periodos, festivos y horarios de `config/` (públicos) y traduce el día de la semana (`0` = lunes en el Backend, `0` = domingo en la app). Con eso, todos los calendarios de la app, también los de las solicitudes que siguen con datos de prueba, usan los días hábiles del servidor. Los plazos (`config/parameters/`) solo los puede leer quien administra los parámetros; los demás usan los de siempre, que son los mismos del Backend. **Guardar con la API llega en la fase 4:** con el módulo activo, Parámetros generales avisa que no guarda. `fotosInicio` lee las fotos publicadas; sin ninguna, el carrusel usa las de la app, y la administración sigue con datos de prueba.

**Por qué los catálogos van en la fase 3 con sus solicitudes:** las citas, capacitaciones y reservas de prueba apuntan a los ids de los temas, líneas y espacios de prueba. Si el catálogo viniera de Render y la solicitud siguiera simulada, pedir un servicio fallaría porque el tema, la línea o el espacio «no existe».

**Fase 3 · `espacios`:** el catálogo (`/spaces/`, con el horario de cada espacio como texto), la disponibilidad, la solicitud de reserva y «Mis reservas» de la comunidad. La disponibilidad se pide por mes (`?view=month`) y el Backend la entrega en tramos de largo variable; la app arma franjas de una hora desde la apertura, y una hora queda reservada o bloqueada si cualquier parte de ella lo está. La anticipación mínima la marca la app («Faltan menos de 72 h…»), como en sus datos de prueba. Un conflicto (409 `SCHEDULE_CONFLICT`) trae tramos libres del mismo día, que la app ofrece con la duración pedida. «Mis reservas» sale de `/me/requests/?service=SPACE_RESERVATION` más el detalle de cada una: el detalle trae el **nombre** del espacio y no su id, así que se busca en el catálogo (pedido al Backend: `space_id` en el detalle). La bandeja del personal y la administración de espacios siguen con datos de prueba (fase 4).

**Fase 3 · `asesorias`:** los temas (los activos de `/advisories/topics/` para la comunidad; todos, de `/advisories/manage/topics/`, para quien administra asesorías, que también los crea y edita), pedir la asesoría con fecha y hora deseadas y «Tus datos», mis citas, cancelar (con motivo), reprogramar (el Backend cancela la cita y crea otra pendiente) y calificar. En la app, el id de la cita es su `request_id`, el de «Mis solicitudes»; para cancelar, reprogramar y calificar se usa el `id` de la cita, que la app recuerda al leerlas. Mientras la cita no se aprueba, la hora de fin sale de `advisory-duration-minutes`. La agenda del facilitador y la bandeja de aprobación siguen con datos de prueba (fase 4).

**Autoarchivo no encaja todavía:** la app muestra cuatro listas (procedimiento, requisitos, formatos y metadatos) y el Backend entrega un texto libre (`guide.body` de `portal/self-archive/`). Sigue con datos de prueba hasta acordar con el Backend cómo se separan los bloques. **Koha** sigue con `URL_CATALOGO_KOHA`, porque `portal/koha-opac/` aún no tiene dirección en Render (`KOHA_OPAC_URL`); el ingreso del personal (`staff_url`) es del #311.

**Catálogo y repositorio** van aparte: no pasan por el Backend.

---

## 5. Lo que se encontró en Render (24 de noviembre)

Pruebas de la fase 0 (rutas públicas, login con una cuenta de estudiante y con la de la
administración, y errores provocados) y de la fase 1 (el cliente compilado y llamado desde Node):

- **El servidor se duerme.** Render, en su plan gratis, lo apaga cuando nadie lo usa: la primera
  llamada tardó **35 s** y las demás entre 0,1 y 1,5 s. La app espera hasta 60 s y, desde los 8 s,
  dice «Conectando con la biblioteca…» (`src/store/conexion.ts`). Antes de una demostración, abrir
  la app un minuto antes.
- **Datos de prueba de los desarrolladores**, no de la biblioteca: temas y líneas de ejemplo, un solo
  espacio, sin contenidos ni guías, y **el horario de atención vacío** (`config/schedules/` responde
  `[]`): sin él, los calendarios de la app no ofrecen ningún día. Se pidió `seed_library_data`.
- **La foto del espacio** apunta al panel de Supabase y devuelve HTML, no la imagen. Se pidió la
  dirección pública.
- **El login falla en inglés** («No active account found…»); la app muestra su propio mensaje para el
  401. Se pidió en español.
- **Los servicios no coinciden** con los de la app (`slug` distintos, sigue la Hemeroteca, faltan el
  préstamo de libros y el de computadores). Para la fase 2: la categoría sale de `access_url`, y el
  catálogo se carga como el acordado con la bibliotecóloga.
- **`config/parameters/` pide sesión**: sin cuenta, los días hábiles se arman con `config/schedules/`,
  `config/holidays/` y `config/calendar/check/`, que son públicas.
- **La cuenta de la administración** es superusuaria y tiene el rol `administrador`. No se pide otra:
  `set_library_admin` deja una sola persona con ese rol y se lo quitaría.

Los tres documentos de la entrega de la 1.1 son:

- **este archivo**, con el inventario de endpoints y el plan;
- **«App móvil y Backend: campos pendientes y archivos»**, con los 13 temas campo por campo y las
  preguntas para el equipo del servidor;
- la **guía técnica** (`docs/guia-tecnica.md`), que explica cómo está hecha la app.
