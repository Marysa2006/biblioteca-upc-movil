# Integración con el Backend

Qué tiene que existir del lado del servidor para apagar los datos de prueba (`USAR_MOCKS`), y qué
cambia en cada módulo. Lo pidió la reunión con la bibliotecóloga del 5 de noviembre de 2026, y lo
deja por escrito el **#228** para que quien siga no tenga que adivinarlo.

**Estado de esta comparación:** `biblioteca-upc-movil` @ `develop` contra
`LibniT/BackEnd-Biblioteca` @ `develop` `8eb5e5a` (18 de noviembre de 2026), `docs/schema.yml`
versión **1.1.0** con **110 rutas**.

> El Backend tiene `main` en `ad3b76c` (5 de noviembre), **sin** la migración `core.0004` de los
> roles. Todo lo de roles de este documento es de `develop`, no de `main`.

> **Ojo con el `develop` del Backend.** Entre el `ca50fff` (10 de noviembre, 105 rutas) y el
> `8eb5e5a` cambió bastante, y en los dos sentidos:
>
> - **Entró** la asistencia por QR (`/attendance/`), **aprobar y rechazar** una asesoría
>   (`/advisories/manage/appointments/{id}/approve|reject/`), el **registro** de cuentas
>   (`/register/`) y la **aceptación de la política** (`/me/privacy-acceptance/`).
> - **Salieron** los horarios de asesoría (`/advisories/manage/schedules/`) y las franjas de un
>   tema (`/advisories/topics/{id}/slots/`): la asesoría ya se pide con fecha y hora deseadas.
>
> Lo de abajo está medido contra `8eb5e5a`. Si alguien compara contra `ca50fff`, media tabla le
> saldrá distinta.

---

## 1. Lo que hay que resolver antes de apagar los mocks

Estos seis puntos afectan a **todos** los módulos: mientras no estén, apagar `USAR_MOCKS` deja la
app vacía o rota.

| # | Qué pasa | Qué hace falta |
|---|---|---|
| 1 | **Ninguna ruta coincide.** El móvil usa español y sin prefijo (`/asesorias/citas/`), el Backend inglés con `/api/v1/` (`/api/v1/advisories/appointments/`) | Una capa de traducción en `src/api/cliente.ts`, o que el Backend exponga las rutas del móvil |
| 2 | **Los días de la semana están invertidos.** Móvil: `0 = domingo` (como `Date.getDay()`). Backend: `DayOfWeekEnum` con `0 = lunes` y `6 = domingo` | Que uno de los dos cambie, o traducir en el cliente |
| 3 | **JWT distinto.** Backend devuelve `{ access, refresh }`; el móvil espera `{ usuario, token }` y **no renueva** el token | Guardar el `refresh` y renovarlo; `/me/` para el usuario |
| 4 | **Paginación.** El Backend devuelve `{ count, next, previous, results }` en **27 GET**; el móvil espera arrays planos | Desenvolver `results` en el cliente |
| 5 | **El login no habla el mismo idioma.** Backend pide `{ email, password }`; el móvil manda `{ correo, contrasena }` | Traducir el cuerpo, o alinear los nombres |
| 6 | **Estados y tipos.** Estados: **6** en el móvil contra **8** en el Backend (`PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `RESCHEDULE_PROPOSED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`). Tipos de usuario: **5** en el móvil contra **3** (`STUDENT`, `TEACHER`, `ADMINISTRATIVE`) | Tabla de equivalencias para los dos |

**Los roles ya coinciden.** `administrador`, `facilitador` y `gestor_espacios`, por **código** y no
por nombre (`Role.code`, migración `core.0004`). Ese bloqueante desapareció.

---

## 2. Endpoints, por módulo

**Leyenda:** ✅ existe una ruta del Backend que hace lo mismo · ⚠️ existe pero cambia algo (método,
forma del cuerpo o de la respuesta) · ❌ no existe.

`src/api` hace **90 llamadas** a `peticion()` con ruta, que son **88 endpoints distintos**: `GET
/espacios` y `GET /servicios` se llaman dos veces, con y sin `?todos=1` para la administración. De
esos 88, **72 tienen contraparte** en el Backend y **16 no**.

> Cómo se cuenta, para que se pueda repetir: `rg -c 'peticion<' src/api/*.ts` da **90**. Un `grep`
> de una sola línea da **86**, porque cuatro rutas están escritas en la línea siguiente a la
> llamada (`capacitaciones.ts:175` y `:662`, `espacios.ts:159`, `asesorias.ts:341`). Ni 84 ni 86:
> **90 llamadas y 88 endpoints**.

Los dos endpoints que llegan con la 1.1 y **todavía no están en `develop`** van marcados con su PR
(`#269` y `#270`): con ellos serían **90 endpoints** y **18 sin contraparte**. Que vuelva a salir 90
es casualidad —90 son hoy las *llamadas*, porque dos rutas se piden dos veces—.

| Módulo | Móvil | Backend | |
|---|---|---|---|
| **Auth** | `POST /auth/login` | `/api/v1/token/` | ⚠️ pide `{email,password}` y devuelve `{access,refresh}` |
| | `POST /register/` *(#203)* | `/api/v1/register/` | ✅ ya manda los nombres del Backend (`first_name`, `user_type: 'STUDENT'`…); ⚠️ el semestre va como texto (`"7"`) y los 400 llegan por campo: falta leerlos en `ErrorRegistro` |
| **Perfil** | `GET /perfil` | `/api/v1/me/` | ✅ |
| | `PATCH /perfil` | `/api/v1/me/` | ✅ |
| **Usuarios** | `GET /usuarios` | `/api/v1/users/` | ✅ |
| | `PUT /usuarios/{id}/roles` | `/api/v1/users/{user_id}/roles/` | ⚠️ uno por uno, no un PUT con la lista |
| | `PUT /usuarios/{id}/permisos` *(en el #269)* | ❌ | ❌ **falta**: los permisos del Backend son de un rol (`Role.permissions`), no de una persona |
| **Servicios** | `GET /servicios` | `/api/v1/portal/services/` | ✅ |
| | `POST /servicios` | ❌ | ❌ el portal solo tiene GET: no se crean servicios |
| | `GET /servicios/{id}` | `/api/v1/portal/services/{slug}/` | ✅ el Backend usa `slug`, no id |
| | `PUT /servicios/{id}` | ❌ | ❌ |
| | `PATCH /servicios/{id}/estado` | ❌ | ❌ |
| **Contenidos** | `GET /contenidos` | `/api/v1/portal/manage/contents/` | ✅ |
| | `POST /contenidos` | `/api/v1/portal/manage/contents/` | ✅ |
| | `PATCH /contenidos/orden` | `/api/v1/portal/manage/contents/reorder/` | ⚠️ el Backend lo expone como POST |
| | `PUT /contenidos/{id}` | `/api/v1/portal/manage/contents/{slug}/` | ✅ |
| | `PATCH /contenidos/{id}/publicacion` | `/api/v1/portal/manage/contents/{slug}/publish/` | ⚠️ dos rutas (`publish` y `hide`), no un PATCH |
| **Parámetros** | `GET /parametros` | `/api/v1/config/parameters/` | ⚠️ son cuatro rutas: `parameters`, `periods`, `holidays` y `schedules` |
| | `PUT /parametros` | `/api/v1/config/parameters/{code}/` | ⚠️ uno por código, y es PATCH |
| **Espacios** | `GET /espacios` | `/api/v1/spaces/` | ✅ |
| | `POST /espacios` | `/api/v1/spaces/manage/` | ✅ |
| | `PUT /espacios/{id}` | `/api/v1/spaces/manage/{id}/` | ✅ |
| | `GET /espacios/{id}/disponibilidad` | `/api/v1/spaces/{id}/availability/` | ✅ |
| | `PATCH /espacios/{id}/estado` | `/api/v1/spaces/manage/{id}/status/` | ⚠️ es POST |
| | `GET /espacios/{id}/reservas-futuras` | ❌ | ❌ ningún GET del espacio trae reservas |
| **Reservas** | `POST /reservas` | `/api/v1/spaces/reservations/` | ✅ |
| | `GET /reservas/mias` | `/api/v1/me/requests/` | ✅ |
| | `POST /reservas/terceros` | `/api/v1/spaces/manage/reservations/` | ✅ con `requester_email` |
| | `GET /reservas/{id}` | `/api/v1/me/requests/{id}/` | ✅ |
| | `POST /reservas/{id}/decision` | `/api/v1/spaces/manage/reservations/{id}/approve/` | ✅ son tres rutas: `approve`, `reject` y `modify` |
| **Bloqueos** | `POST /bloqueos` | `/api/v1/spaces/blocks/` | ⚠️ va con `confirm: true` |
| | `POST /bloqueos/afectadas` | ❌ | ❌ no hay ruta: las afectadas llegan en el 409 del POST de arriba |
| | `GET /bloqueos/{id}` | `/api/v1/spaces/blocks/` | ⚠️ el espacio llega por `?space=`, no en la ruta |
| **Asesorías** | `GET /asesorias/agenda` | `/api/v1/advisories/agenda/` | ✅ |
| | `POST /asesorias/citas` | `/api/v1/advisories/appointments/` | ✅ acepta `desired_date`/`desired_time` y `accept_terms`; ya no exige franja (#248) |
| | `GET /asesorias/citas/mias` | `/api/v1/advisories/appointments/` | ✅ |
| | `POST /asesorias/citas/{id}/aprobar` | `/api/v1/advisories/manage/appointments/{id}/approve/` | ✅ `scheduled_date`, `start_time`, `facilitator` y `virtual_link` |
| | `POST /asesorias/citas/{id}/cancelar` | `/api/v1/advisories/appointments/{id}/cancel/` | ✅ |
| | `POST /asesorias/citas/{id}/inasistencia` | `/api/v1/advisories/agenda/appointments/{id}/record/` | ✅ `attended: false`, sin calificación |
| | `POST /asesorias/citas/{id}/rechazar` | `/api/v1/advisories/manage/appointments/{id}/reject/` | ✅ el motivo es obligatorio |
| | `POST /asesorias/citas/{id}/reprogramar` | `/api/v1/advisories/appointments/{id}/reschedule/` | ✅ |
| | `POST /asesorias/citas/{id}/resultado` | `/api/v1/advisories/agenda/appointments/{id}/record/` | ✅ `attended: true` y `quality_rating` |
| | `GET /asesorias/jornadas` | ❌ | ❌ quitaron `/manage/schedules/`: la asesoría ya no depende de una jornada |
| | `POST /asesorias/jornadas` | ❌ | ❌ |
| | `PUT /asesorias/jornadas/{id}` | ❌ | ❌ |
| | `GET /asesorias/temas` | `/api/v1/advisories/topics/` | ✅ |
| | `POST /asesorias/temas` | `/api/v1/advisories/manage/topics/` | ✅ |
| | `PUT /asesorias/temas/{id}` | `/api/v1/advisories/manage/topics/{id}/` | ✅ |
| | `GET /asesorias/temas/{id}/franjas` | ❌ | ❌ quitaron `/topics/{id}/slots/`: la franja se calcula con fecha y hora |
| **Asistencia (QR)** | `GET /asesorias/citas/{id}/asistencia` | `/api/v1/attendance/{id}/` | ⚠️ trae nombre, programa y semestre de cada asistente |
| | `POST /asesorias/citas/{id}/asistencia/abrir` | `/api/v1/attendance/{id}/qr/` | ⚠️ es GET, el `token` lo genera el servidor y vale 4 h |
| | `POST /asesorias/citas/{id}/asistencia/cerrar` | ❌ | ❌ no hay cierre: el QR vence solo |
| | `POST /asesorias/citas/{id}/asistencia/manual` | ❌ | ❌ no existe el registro manual |
| | `POST /asesorias/citas/{id}/asistencia/qr` | `/api/v1/attendance/` | ⚠️ la persona sale de la sesión, no del cuerpo; 201 la primera vez y 200 si repite |
| **Tablets** | `POST /prestamos` | `/api/v1/tablets/loans/` | ✅ |
| | `GET /prestamos/mios` | `/api/v1/tablets/loans/` | ✅ |
| | `GET /prestamos/vencidos` | `/api/v1/tablets/manage/loans/?status=OVERDUE` | ✅ |
| | `GET /prestamos/{id}` | `/api/v1/tablets/manage/loans/{id}/` | ✅ |
| | `POST /prestamos/{id}/devolucion` | `/api/v1/tablets/manage/loans/{id}/return/` | ✅ |
| | `GET /prestamos/{id}/constancia` *(en el #270)* | ❌ | ❌ **falta**: el formato de responsabilidad |
| | `POST /prestamos/{id}/entrega` | `/api/v1/tablets/manage/loans/{id}/deliver/` | ✅ |
| | `GET /tablets` | `/api/v1/tablets/manage/` | ✅ |
| | `POST /tablets` | `/api/v1/tablets/manage/` | ✅ |
| | `GET /tablets/codigo/{id}` | ❌ | ❌ no hay búsqueda por código; el listado solo pagina |
| | `GET /tablets/condiciones` | ❌ | ❌ solo guarda `conditions_accepted` (booleano) |
| | `GET /tablets/disponibilidad` | `/api/v1/tablets/availability/` | ✅ |
| | `PUT /tablets/{id}` | `/api/v1/tablets/manage/{id}/` | ✅ |
| | `PATCH /tablets/{id}/estado` | `/api/v1/tablets/manage/{id}/` | ✅ |
| **Capacitaciones** | `GET /capacitaciones/lineas` | `/api/v1/trainings/lines/` | ✅ |
| | `POST /capacitaciones/lineas` | `/api/v1/trainings/lines/manage/` | ✅ |
| | `PUT /capacitaciones/lineas/{id}` | `/api/v1/trainings/lines/manage/{id}/` | ✅ |
| | `PATCH /capacitaciones/lineas/{id}/estado` | `/api/v1/trainings/lines/manage/{id}/` | ✅ con `is_active` |
| | `GET /capacitaciones/lineas/{id}/solicitudes-activas` | ❌ | ⚠️ no es un GET: las activas llegan en el 409 al desactivar sin `confirm` |
| | `POST /capacitaciones/solicitudes` | `/api/v1/trainings/requests/` | ✅ |
| | `GET /capacitaciones/solicitudes/mias` | `/api/v1/trainings/requests/` | ✅ |
| | `GET /capacitaciones/solicitudes/{id}` | `/api/v1/trainings/requests/manage/{id}/` | ✅ |
| | `POST /capacitaciones/solicitudes/{id}/aprobar` | `/api/v1/trainings/requests/manage/{id}/approve/` | ✅ |
| | `POST /capacitaciones/solicitudes/{id}/cerrar` | `/api/v1/trainings/requests/manage/{id}/close/` | ✅ |
| | `POST /capacitaciones/solicitudes/{id}/nueva-fecha` | `/api/v1/trainings/requests/manage/{id}/propose-date/` | ✅ |
| | `POST /capacitaciones/solicitudes/{id}/rechazar` | `/api/v1/trainings/requests/manage/{id}/reject/` | ✅ |
| | `POST /capacitaciones/solicitudes/{id}/responder-fecha` | `/api/v1/trainings/requests/{id}/accept-date/` | ✅ son dos rutas: `accept-date` y `decline-date` |
| | `PATCH /capacitaciones/solicitudes/{id}/responsable` | `/api/v1/trainings/requests/manage/{id}/assign/` | ⚠️ es POST |
| **Guías** | `GET /guias` | ❌ | ❌ HU-29 no existe en el Backend (las guías sin conexión) |
| | `GET /guias/{id}` | ❌ | ❌ |
| **Recursos y autoarchivo** | `GET /autoarchivo` | `/api/v1/portal/self-archive/` | ✅ |
| | `GET /recursos` | `/api/v1/portal/resources/` | ✅ |
| **Notificaciones** | `GET /notificaciones` | `/api/v1/notifications/me/` | ✅ |
| | `PATCH /notificaciones/{id}/leida` | `/api/v1/notifications/me/{id}/read/` | ⚠️ es POST |
| **Solicitudes** | `GET /solicitudes/mias/{id}` | `/api/v1/me/requests/{id}/` | ✅ |
| | `GET /solicitudes/{tipo}/{id}/historial` | `/api/v1/me/requests/{id}/` | ✅ el historial viene dentro del detalle, sin ruta aparte |
| **Estadísticas** | `GET /estadisticas/registros` | ❌ | ❌ solo hay `summary/` y `export/`: no hay lista de registros |

**Resumen:** **57 ✅ · 15 ⚠️ · 16 ❌ = 88** endpoints, más los dos que traen el #269 y el #270 (90 en total, con 18 sin contraparte). Con contraparte (✅+⚠️) hay **72**; sin ella, **16**.

---

## 3. Lo que cambia en la versión 1.1

Campos y comportamientos nuevos que el Backend tiene que aceptar cuando se conecte:

| Tema | Issue | Qué necesita el Backend |
|---|---|---|
| Asesorías sin jornadas | **#248** | Ya está: `POST /appointments/` con fecha y hora deseadas (`PENDING` sin facilitador), y `approve` con `facilitator`, `scheduled_date` y `virtual_link` |
| Campos de los formularios | **#251**, **#224** | `datosSolicitante` (identificación, celular, nivel, facultad, programa, semestre), `asignatura`, `participantes` y `novedades` en citas, capacitaciones y reservas |
| Constancia del préstamo | **#252** | `estadoEquipo`, `notas`, `responsable` (id, nombre y cargo), `marca`, `valor` y `tipo` de la tablet |
| Calificación | **#254** | Ya está en citas: `quality_rating` (1 a 5) al registrar el resultado. Falta en capacitaciones |
| Permiso de novedades | **#256** | Un permiso suelto por persona. Hoy el Backend solo tiene permisos **dentro de un rol** |
| Guías con enlace | **#258** | `GET /guias/` con `enlace` y `sede` |
| Estadísticas | **#259** | `facultad`, `sede`, `semestre` y `calificacion` en los registros; los tres filtros; y el PDF (que se genera en el celular) |
| **Aceptación de la Ley 1581** | **#225**, **#246** | Ya está: `POST /me/privacy-acceptance/` guarda la aceptación con la versión de la política, y el perfil trae `privacy_acceptance_required`. Falta que el móvil lo llame |
| Registro de cuentas | **#203** | Ya está: `POST /register/` con el correo `@unicesar.edu.co`, `accept_privacy` y los datos del #224; la cuenta queda activa y sin rol. El móvil ya tiene la pantalla (`registro`) con los mismos campos; al conectar, falta leer los errores por campo del 400 |
| QR de asistencia | **#231** | Están **3 de las 5**: el QR lo genera el servidor (`/attendance/{id}/qr/`), la persona lo envía (`POST /attendance/`) y la lista se consulta (`/attendance/{id}/`). **Faltan** el registro manual y el cierre |

---

## 4. Plan para apagar los mocks

El interruptor es uno (`USAR_MOCKS`), pero **no se puede apagar de golpe**: con 88 endpoints en
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

---

## 5. Lo que este documento no cubre

No hay una instancia del Backend en el entorno donde se escribió esto: **el contraste es contra el
`schema.yml`**, que es lo que el Backend declara, no contra respuestas reales. Las pruebas de
integración de verdad siguen pendientes de un entorno.

Y como el `develop` del Backend se mueve (dos versiones del esquema en ocho días), esto hay que
volver a medirlo antes de empezar el punto 1 del plan: lo que hoy falta puede aparecer, y lo que hoy
existe puede desaparecer sin avisar en el móvil.
