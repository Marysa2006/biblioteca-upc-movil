# Integración con el Backend

Qué tiene que existir del lado del servidor para apagar los datos de prueba (`USAR_MOCKS`), y qué
cambia en cada módulo. Lo pidió la reunión con la bibliotecóloga del 5 de noviembre de 2026, y lo
deja por escrito el **#228** para que quien siga no tenga que adivinarlo.

**Estado de esta comparación:** `biblioteca-upc-movil` @ `develop` contra
`LibniT/BackEnd-Biblioteca` @ `develop` `ca50fff` (10 de noviembre de 2026), `docs/schema.yml`
versión **1.1.0** con **105 rutas**.

> El Backend tiene `main` en `ad3b76c` (5 de noviembre), **sin** la migración `core.0004` de los
> roles. Todo lo de roles de este documento es de `develop`, no de `main`.

---

## 1. Lo que hay que resolver antes de apagar los mocks

Estos seis puntos afectan a **todos** los módulos: mientras no estén, apagar `USAR_MOCKS` deja la
app vacía o rota.

| # | Qué pasa | Qué hace falta |
|---|---|---|
| 1 | **Ninguna ruta coincide.** El móvil usa español y sin prefijo (`/asesorias/citas/`), el Backend inglés con `/api/v1/` (`/api/v1/advisories/appointments/`) | Una capa de traducción en `src/api/cliente.ts`, o que el Backend exponga las rutas del móvil |
| 2 | **Los días de la semana están invertidos.** Móvil: `0 = domingo`. Backend: `MONDAY = 0` | Que uno de los dos cambie, o traducir en el cliente |
| 3 | **JWT distinto.** Backend devuelve `{ access, refresh }`; el móvil espera `{ usuario, token }` y **no renueva** el token | Guardar el `refresh` y renovarlo; `/me/` para el usuario |
| 4 | **Paginación.** El Backend devuelve `{ count, next, previous, results }` en **27 GET**; el móvil espera arrays planos | Desenvolver `results` en el cliente |
| 5 | **El login no habla el mismo idioma.** Backend pide `{ email, password }`; el móvil manda `{ correo, contrasena }` | Traducir el cuerpo, o alinear los nombres |
| 6 | **Estados y tipos.** Estados: **6** en el móvil contra **8** en el Backend (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `RESCHEDULE_PROPOSED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`). Tipos de usuario: **5** contra **3** | Tabla de equivalencias para los dos |

**Los roles ya coinciden.** `administrador`, `facilitador` y `gestor_espacios`, por **código** y no
por nombre (`Role.code`, migración `core.0004`). Ese bloqueante desapareció.

---

## 2. Endpoints, por módulo

**Leyenda:** ✅ existe una ruta del Backend que hace lo mismo · ⚠️ existe pero cambia algo (método,
forma del cuerpo o de la respuesta) · ❌ no existe.

Son **84 endpoints** en `src/api`; **69 tienen contraparte** y **15 no**.

| Módulo | Móvil | Backend | |
|---|---|---|---|
| **Auth** | `POST /auth/login` | `POST /api/v1/token/` (+ `/token/refresh/`) | ⚠️ pide `{email,password}` y devuelve `{access,refresh}` |
| | — | `POST /api/v1/token/refresh/` | ⚠️ **falta en el móvil** |
| **Perfil** | `GET /perfil` · `PATCH /perfil` | `GET`/`PATCH /api/v1/me/` | ✅ |
| | — | `GET /api/v1/me/access/` | ⚠️ **falta en el móvil**: ahí vienen los roles y permisos |
| **Usuarios** | `GET /usuarios` | `GET /api/v1/users/` | ✅ |
| | `PUT /usuarios/{id}/roles` | `POST`/`DELETE /users/{user_id}/roles/` | ⚠️ uno por uno, no un PUT con la lista |
| | `PUT /usuarios/{id}/permisos` | ❌ | ❌ **falta**: el permiso `novedades` (#256) |
| **Servicios** | `GET /servicios` · `/servicios/{id}` | `GET /api/v1/portal/services/` · `/{slug}/` | ✅ |
| | `POST` · `PUT` · `PATCH /estado` | ❌ | ❌ el portal **solo tiene GET**: no se crean ni editan servicios |
| **Contenidos** | `GET` · `POST /contenidos` | `/api/v1/portal/manage/contents/` | ✅ |
| | `PUT /contenidos/{id}` | `/manage/contents/{slug}/` | ✅ |
| | `PATCH /contenidos/{id}/publicacion` | `…/{slug}/publish/` y `/hide/` | ⚠️ dos rutas, no un PATCH |
| | `PATCH /contenidos/orden` | `…/manage/contents/reorder/` | ⚠️ el Backend lo expone como **POST** |
| **Parámetros** | `GET /parametros` | `config/parameters/` + `periods/` + `holidays/` + `schedules/` | ⚠️ cuatro rutas, no una |
| | `PUT /parametros` | `PATCH /config/parameters/{code}/` | ⚠️ uno por código |
| **Espacios** | `GET /espacios` · `POST` · `PUT /{id}` | `/spaces/` · `/spaces/manage/` · `/manage/{id}/` | ✅ |
| | `GET /espacios/{id}` · `/disponibilidad` | `/spaces/{id}/` · `/{id}/availability/` | ✅ |
| | `PATCH /espacios/{id}/estado` | `POST /spaces/manage/{id}/status/` | ⚠️ es POST |
| | `GET /espacios/{id}/reservas-futuras` | ❌ | ❌ ningún GET del espacio trae reservas |
| **Reservas** | `POST /reservas` | `POST /api/v1/spaces/reservations/` | ✅ |
| | `GET /reservas/mias` · `/{id}` | `GET /me/requests/` · `/{id}/` | ✅ |
| | `POST /reservas/{id}/decision` | `…/manage/reservations/{id}/approve\|reject\|modify/` | ✅ (tres rutas) |
| | `POST /reservas/terceros` | `POST /spaces/manage/reservations/` con `requester_email` | ✅ |
| **Bloqueos** | `POST /bloqueos` · `/afectadas` | `POST /spaces/blocks/` (`confirm: true`) | ⚠️ las afectadas llegan en el **409**, no en un POST aparte |
| **Asesorías** | `GET /asesorias/temas` · `POST` · `PUT` | `/advisories/topics/` · `/manage/topics/` | ✅ |
| | `GET /asesorias/jornadas` · `POST` · `PUT` | `/advisories/manage/schedules/` | ✅ |
| | `POST /asesorias/citas` (#248, sin franja) | `POST /advisories/appointments/` | ⚠️ el Backend **exige una franja** (`slot`) |
| | `GET /asesorias/citas/mias` · `GET /agenda` | `/appointments/` · `/advisories/agenda/` | ✅ |
| | `POST …/cancelar` · `…/reprogramar` | `/{id}/cancel/` · `/{id}/reschedule/` | ✅ |
| | `POST …/resultado` · `…/inasistencia` | `/agenda/appointments/{id}/record/` | ✅ |
| | `POST …/aprobar` · `…/rechazar` | ❌ | ❌ **no existen**: `BOOKED = APPROVED`, la cita nace aprobada |
| **Asistencia (QR)** | 5 rutas (`asistencia/`, `abrir`, `qr`, `manual`, `cerrar`) | ❌ | ❌ **#231**: no hay nada de asistencia ni QR |
| **Tablets** | `GET` · `POST` · `PUT /tablets` | `/tablets/manage/` | ✅ |
| | `PATCH /tablets/{id}/estado` | `PATCH /tablets/manage/{id}/` | ✅ |
| | `GET /tablets/disponibilidad` | `/tablets/availability/` | ✅ |
| | `GET /tablets/condiciones` | ❌ | ❌ solo guarda `conditions_accepted` (booleano) |
| | `GET /tablets/codigo/{codigo}` | ❌ | ❌ no hay búsqueda por código; el listado solo pagina |
| | `GET /prestamos/mios` · `POST /prestamos` | `/tablets/loans/` | ✅ |
| | `GET /prestamos/vencidos` | `/tablets/manage/loans/?status=OVERDUE` | ✅ |
| | `POST /prestamos/{id}/entrega` · `/devolucion` | `…/manage/loans/{id}/deliver/` · `/return/` | ✅ |
| | `GET /prestamos/{id}/constancia` (#252) | ❌ | ❌ **falta**: el formato de responsabilidad |
| **Capacitaciones** | `GET` · `POST` · `PUT /capacitaciones/lineas` | `/trainings/lines/` · `/lines/manage/` | ✅ |
| | `PATCH /lineas/{id}/estado` | `PATCH /lines/manage/{id}/` (`is_active`) | ✅ |
| | `GET /lineas/{id}/solicitudes-activas` | el **409** al desactivar sin `confirm` | ⚠️ no es un GET |
| | `GET` · `POST /capacitaciones/solicitudes` | `/trainings/requests/` · `/manage/` | ✅ |
| | `…/aprobar` · `/rechazar` · `/nueva-fecha` · `/responsable` · `/cerrar` | `/manage/{id}/approve\|reject\|propose-date\|assign\|close/` | ✅ |
| | `…/responder-fecha` | `/requests/{id}/accept-date\|decline-date/` | ✅ |
| **Guías** | `GET /guias` · `/{id}` | ❌ | ❌ **HU-29 no existe** en el Backend (las guías sin conexión) |
| **Recursos y autoarchivo** | `GET /recursos` · `/autoarchivo` | `/portal/resources/` · `/portal/self-archive/` | ✅ |
| **Notificaciones** | `GET /notificaciones` · `PATCH …/leida` | `/notifications/me/` · `…/{id}/read/` | ✅ |
| **Solicitudes** | `GET /solicitudes/mias/{id}` · `…/historial` | `GET /me/requests/{id}/` (trae el historial) | ✅ |
| **Estadísticas** | `GET /estadisticas/registros` | ❌ | ❌ solo `summary/` y `export/`: **no hay lista de registros** |
| | — | `GET /statistics/summary/` · `/statistics/export/` | ⚠️ **falta en el móvil** el resumen del servidor |

---

## 3. Lo que cambia en la versión 1.1

Campos y comportamientos nuevos que el Backend tiene que aceptar cuando se conecte:

| Tema | Issue | Qué necesita el Backend |
|---|---|---|
| Asesorías sin jornadas | **#248** | `POST /appointments/` **sin `slot`**: fecha y hora pedidas, `PENDING` sin facilitador, y `aprobar` con facilitador, enlace y fecha final |
| Campos de los formularios | **#251**, **#224** | `datosSolicitante` (identificación, celular, nivel, facultad, programa, semestre), `asignatura`, `participantes` e `novedades` en citas, capacitaciones y reservas |
| Constancia del préstamo | **#252** | `estadoEquipo`, `notas`, `responsable` (id, nombre y cargo), `marca`, `valor` y `tipo` de la tablet |
| Calificación | **#254** | `calificacion { puntaje, comentario, fecha }` en citas y capacitaciones |
| Permiso de novedades | **#256** | `PUT /users/{id}/permisos/` con `permisosExtra` |
| Guías con enlace | **#258** | `GET /guias/` con `enlace` y `sede` |
| Estadísticas | **#259** | `facultad`, `sede`, `semestre` y `calificacion` en los registros; los tres filtros; y el PDF (que se genera en el celular) |
| **Aceptación de la Ley 1581** | **#225**, **#246** | Un endpoint que guarde **quién aceptó, qué versión de la política y cuándo**. Hoy queda solo en el celular y la Universidad no puede demostrarlo (responsabilidad demostrada) |
| Registro de cuentas | **#203** | Cómo se crean las cuentas |
| QR de asistencia | **#231** | Las cinco rutas de asistencia |

---

## 4. Plan para apagar los mocks

El interruptor es uno (`USAR_MOCKS`), pero **no se puede apagar de golpe**: con 84 rutas en español
y el Backend en inglés, apagarlo dejaría la app vacía. Orden propuesto, un módulo por PR y con su
prueba:

1. **La capa de traducción** en `src/api/cliente.ts`: prefijo `/api/v1`, mapa español→inglés y
   desenvoltura de `results` en las 27 paginadas. **Sin esto no avanza nada más.**
2. **Autenticación**: `{email, password}` → `{access, refresh}`, guardar el `refresh` y renovarlo, y
   pedir `/me/` para el usuario.
3. **Solo lectura**: `servicios`, `contenidos`, `parametros`, `espacios`.
4. **Solicitudes**: `reservas`, `tablets`, `asesorias` (aquí entra el punto 3).
5. **Estadísticas y asistencia**: al final, porque dependen de que todo lo anterior escriba de verdad.
6. **Catálogo y repositorio** van aparte: no pasan por el Backend.

---

## 5. Lo que este documento no cubre

No hay una instancia del Backend en el entorno donde se escribió esto: **el contraste es contra el
`schema.yml`**, que es lo que el Backend declara, no contra respuestas reales. Las pruebas de
integración de verdad siguen pendientes de un entorno.
