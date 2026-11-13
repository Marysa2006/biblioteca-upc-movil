# Guía técnica

Cómo está hecha la app **BiblioUPC**, cómo se trabaja en ella y cómo se publica.
Va dirigida a quien **desarrolle, mantenga o integre** la app móvil con el Backend.

> **No es el manual de usuario.** Para eso está [manual-usuario.md](manual-usuario.md), que
> explica qué hace cada pantalla. Este documento explica lo de dentro: arquitectura, datos,
> convenciones y las trampas que rompen la app.

**Alcance: solo la app móvil.** No lleva requisitos no funcionales, diagramas ni el modelo de
datos formal: eso lo entrega el grupo del Diccionario de datos del proyecto. Cuando hace falta,
se enlaza en vez de repetirlo.

- [1. Visión general](#1-visión-general)
- [2. Arquitectura](#2-arquitectura)
- [3. Instalación y configuración](#3-instalación-y-configuración)
- [4. Datos en la app](#4-datos-en-la-app)
- [5. Programación](#5-programación)
- [6. Especificaciones de diseño](#6-especificaciones-de-diseño)
- [7. Generar el APK](#7-generar-el-apk)
- [8. Publicar una versión y flujo de trabajo](#8-publicar-una-versión-y-flujo-de-trabajo)
- [9. Resolución de problemas](#9-resolución-de-problemas)

---

## 1. Visión general

BiblioUPC reúne en el celular los servicios de la Biblioteca de la Universidad Popular del
Cesar: consultar el catálogo y las guías, reservar espacios, agendar asesorías, pedir una tablet
o una capacitación, y seguir el estado de cada solicitud. El personal de la biblioteca atiende
esas solicitudes desde la misma aplicación.

El proyecto general construye un **CRAI** (Centro de Recursos para el Aprendizaje y la
Investigación). Esta app es **un primer paso** hacia ese modelo, no un CRAI completo: su
objetivo es reunir y modernizar los servicios que hoy presta la biblioteca.

### Los usuarios

| Quién | Qué puede hacer |
|---|---|
| **Visitantes**, sin cuenta | Consultar servicios, horarios, catálogo y disponibilidad de espacios |
| **Comunidad**, con cuenta institucional | Además, solicitar servicios y seguir sus solicitudes. Puede ser estudiante, docente, administrativo o egresado |
| **Personal**, con cuenta y rol | La operación del día: aprobar, gestionar, inventario y estadísticas |

En el código, `TipoUsuario` (`src/types/usuarios.ts`) también incluye `visitante`, pero **no es
un tipo de cuenta**: es el valor que usa la app cuando no hay sesión (`useRol()` lo toma por
defecto). Los nombres visibles salen de `NOMBRE_TIPO`.

Los **roles del personal** son tres, y una persona puede tener varios:

| Rol | Quién es |
|---|---|
| `administrador` | La administradora de la biblioteca. Una sola persona; no se asigna desde la app |
| `facilitador` | Atiende asesorías y capacitaciones |
| `gestor_espacios` | Gestiona el catálogo de espacios y sus reservas |

> **No existe** el rol de encargado de tablets: el préstamo lo maneja la administradora, que ya
> tiene el permiso `tablets` (#208).

### El alcance

Por ahora **solo Android**, con el APK generado en EAS. El código sirve para iOS, pero falta
`ios.bundleIdentifier` en `app.json` y la cuenta de Apple Developer; sin esa cuenta no se puede
probar en un iPhone con la SDK 58.

Lo que se programe **tiene que seguir funcionando en iOS**: nada de APIs solo de Android sin
comprobar `Platform.OS`.

### Lo que no está en este repositorio

- **El Backend.** Es un proyecto aparte (Django). Aquí solo se consume su API.
- **Las credenciales.** Ningún token ni contraseña se guarda en el código ni en el APK.
- **`ios/` y `android/`.** Se generan con Continuous Native Generation; no se editan a mano. La
  configuración nativa va en `app.json` y en sus plugins.

---

## 2. Arquitectura

### La estructura del proyecto

```
src/
├── app/            las pantallas (Expo Router: cada archivo es una ruta)
├── components/     componentes por módulo (asesorias/, tablets/, ui/, …)
├── hooks/          un archivo por módulo; envuelven TanStack Query
├── api/            llamadas: un archivo por módulo + cliente.ts + mocks/
├── types/          tipos por módulo (base compartida: los aprueba un guardián)
├── utils/          funciones puras: fechas, calendario, roles, validaciones
├── store/          estado global (Zustand): la sesión y los recordatorios
└── theme/          colores, tipografía y espaciados de la UPC
docs/               manual de usuario, guía técnica, paleta y mockups
assets/images/      íconos, splash, logos y fotos
```

Tamaño, **en la versión 1.1**: **48 pantallas**, **153 componentes**, **22 módulos de API** (20
con `peticion()` y 2 que hablan con Koha y DSpace por su cuenta), **25 hooks**, **44 utilidades**,
**16 archivos de tipos** y **18 mocks**.

### El stack

| Pieza | Versión | Para qué |
|---|---|---|
| Expo SDK | 58 (`expo` ~58.0.22) | Base de la app; se prueba en Expo Go |
| React Native / React | 0.88.1 / 19.3 | — |
| Expo Router | ~58.0.29 | Rutas por archivos en `src/app/`, con `typedRoutes` |
| React Native Paper | 5 (MD3) | Componentes, con el tema de `src/theme`. Íconos MaterialCommunityIcons |
| TanStack Query | 5 | Datos del servidor: consultas y mutaciones |
| Zustand | 5 | Estado global, con `persist` sobre `expo-secure-store` |
| react-hook-form + zod | 4 | Formularios y validación |

### Las capas, siempre igual

```
Pantalla (src/app)
   └── usa un hook (src/hooks)          ← nunca llama a la API directamente
         └── llama a src/api/<módulo>   ← decide mock o API real
               └── src/api/cliente.ts   ← el `peticion()` de la API del Backend
```

Una consecuencia práctica: **todo el Backend entra por `src/api/cliente.ts`**. Si algún día hay
que añadir cabeceras, reintentos o telemetría para la API propia, se hace ahí y vale para todas
las llamadas de los módulos que la usan.

**La excepción son Koha y DSpace**, el catálogo y el repositorio: `src/api/catalogo.ts` y
`src/api/repositorio.ts` llaman a `fetch()` directamente porque son servicios externos con su
propio formato (RSS y la API de DSpace), no la API del Backend. Si algún día se añade
instrumentación a `peticion()`, esos dos no la reciben: hay que tocarlos aparte.

### Las claves de consulta

Están todas en `src/api/claves.ts`. Una clave que depende de otra consulta **empieza por su
prefijo**, para que las mutaciones la refresquen solas:

```ts
citasAsesoria: ['asesorias', 'citas'] as const,
agendaFacilitador: (id, desde, hasta) => ['asesorias', 'citas', 'agenda', id, desde, hasta] as const,
```

Así, invalidar `['asesorias', 'citas']` refresca también la agenda. **Mis solicitudes** la
refrescan todas las mutaciones de solicitudes.

Sin clave centralizada, las mutaciones no saben qué refrescar y la pantalla se queda con datos
viejos.

### La sesión persistida

`src/store/sesion.ts` guarda el usuario en `expo-secure-store`, con `version` y `migrate`.
`src/store/recordatorios.ts` guarda, aparte, el estado de los recordatorios programados.
Si cambia la forma del usuario guardado, **se sube la versión y se amplía la migración**; si no,
las sesiones guardadas se rompen en silencio.

### La navegación

Expo Router toma **el árbol de `src/app/` como rutas**; no hay tabla de rutas que mantener.

| Grupo | Pestañas |
|---|---|
| `(comunidad)/` | Inicio, Servicios, Catálogo y Mis solicitudes |
| `(personal)/` | Dashboard, Gestión, Personal, Inventario y Estadísticas |

- Los grupos entre paréntesis **no aparecen en la URL**: solo separan los dos conjuntos de pestañas.
- El resto son **rutas apiladas**, con flecha atrás (`asesorias/mis-citas`, `agenda/[id]`, `administracion/…`).
- El `_layout.tsx` del personal **redirige a `/login`** a quien no tenga un rol del personal.
- El personal siempre entra a `/panel`. La comunidad, con `?volver=1`, regresa a la pantalla de
  origen después de iniciar sesión.

### React Compiler

Está activo (`experiments.reactCompiler` en `app.json`). Eso cambia dos cosas al programar:
ver [trampas conocidas](#trampas-conocidas).

### Las integraciones externas

| Servicio | Cómo se usa |
|---|---|
| **Koha** (catálogo) | Búsqueda por RSS, en `src/api/catalogo.ts`. La URL está en `URL_CATALOGO_KOHA` |
| **DSpace** (repositorio) | API de DSpace, en `src/api/repositorio.ts`. Va por HTTP: el APK lo permite con `usesCleartextTraffic`, configurado en el plugin `expo-build-properties` |
| **Notificaciones** | Recordatorios **locales** del celular. El push desde el servidor llegará con el Backend |

---

## 3. Instalación y configuración

### Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 20 o superior (probado con 22) | Compilar y ejecutar la app |
| npm | 10 | Instalar dependencias y regenerar el lockfile |
| Expo Go | **SDK 58** | Probar en el celular sin compilar |
| Git | cualquiera reciente | Ramas y commits |
| Java / Android Studio | **no hace falta** | El APK se compila en la nube con EAS |

Un Expo Go de otra SDK no abre el proyecto.

### Instalación y arranque

```bash
git clone https://github.com/Marysa2006/biblioteca-upc-movil.git
cd biblioteca-upc-movil

npm ci                 # instala exactamente lo que dice el lockfile
cp .env.example .env   # y ajusta los valores

npx expo start
```

Escanea el código QR con Expo Go. El celular y el computador tienen que estar en la misma red;
si la red no lo permite, `npx expo start --tunnel`.

### Los seis scripts

```bash
npm run start      # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios  (necesita macOS y la cuenta de Apple Developer)
npm run web        # expo start --web
npm run lint       # expo lint
npm run typecheck  # tsc --noEmit
```

Recuerda que **la app se entrega solo en Android**: `npm run ios` sirve para revisar el diseño,
no para probar el flujo real.

**Antes de abrir un PR, `lint` y `typecheck` tienen que pasar sin errores.** No hay framework de
pruebas unitarias: la verificación es el tipado, el lint y la prueba manual en Expo Go.

### Las variables de `.env`

`.env.example` es la plantilla; `.env` no se sube (está en `.gitignore`).

| Variable | Qué hace |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base de la API del Backend. Desde el celular, usa la IP del computador, **no `localhost`**: `localhost` desde el celular es el propio celular |
| `EXPO_PUBLIC_USAR_MOCKS` | `true`: datos de prueba. `false`: API real |

**Ojo con la lógica:** solo el texto `"false"` desactiva los mocks. Una variable ausente o vacía
mantiene los datos de prueba, que es lo que se quiere en el APK.

```ts
export const USAR_MOCKS = process.env.EXPO_PUBLIC_USAR_MOCKS !== 'false';
```

### Lo que configura `app.json`

| Clave | Qué hace |
|---|---|
| `plugins` | `expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-camera` (con el texto del permiso) y `expo-build-properties` |
| `experiments.typedRoutes` | Tipa las rutas: `router.push('/asesorias/mis-citas')` falla en `tsc` si la ruta no existe |
| `experiments.reactCompiler` | Activa el compilador de React |
| `expo-build-properties` → `android.usesCleartextTraffic` | Permite el HTTP del repositorio institucional. Se quita cuando la Universidad active HTTPS |
| `android.package` | `com.biblioupc.app` |
| `android.adaptiveIcon` | Fondo, primer plano y monocromo del ícono |
| `extra.eas.projectId` | El proyecto de EAS |

### `eas.json`

Un solo perfil, `preview`: distribución interna, APK de Android y `EXPO_PUBLIC_USAR_MOCKS=true`
inyectado en el build (el `.env` no se sube, así que el APK siempre sale con datos de prueba).

---

## 4. Datos en la app

> El modelo de datos **formal** lo entrega el grupo del Diccionario de datos. Aquí solo se
> explica **cómo los usa la app**.

### Los tipos

Un archivo por módulo en `src/types/`: `usuarios`, `asesorias`, `espacios`, `tablets`,
`capacitaciones`, `solicitudes`, `estadisticas`, `parametros`, `servicios`, `contenidos`,
`recursos`, `notificaciones`, `guias`, `historial`, `perfil` y `autoarchivo`.

`src/types` es **base compartida**: un cambio ahí necesita la aprobación de un guardián.

### Los estados de una solicitud

`EstadoSolicitud` tiene seis valores y los comparten reservas, asesorías, préstamos y
capacitaciones:

| Estado | Qué significa |
|---|---|
| `pendiente` | Espera la decisión del personal |
| `aprobada` | Aceptada; ocupa su cupo u horario |
| `rechazada` | Negada, con motivo |
| `nueva_fecha` | El personal propuso otro día y espera la respuesta de la persona |
| `cancelada` | Anulada; libera el cupo |
| `realizada` | Ya ocurrió (con `asistio: true/false` en las citas) |

**El caso de las asesorías (#216, versión 1.1):** la cita ya no nace aprobada.

- `agendarCita` la deja **`pendiente`** y **aparta el cupo** desde el primer momento.
- `reprogramarCita` la vuelve a dejar **`pendiente`**: hay que aprobarla otra vez.
- `aprobarCita` y `rechazarCita` la deciden. Solo puede hacerlo **el facilitador de la cita o la
  administración**; si no, la API responde 403. Rechazar exige motivo y **libera el cupo**.
- Los recordatorios y Mi calendario solo cuentan las citas **aprobadas**.

### Usuarios, tipos y roles

`useRol()` expone `usuario`, `tipo`, `rolesPersonal`, `esPersonal`, `esAdministrador`, `permisos`
y `tienePermiso()`.

Los permisos de una persona son **la suma de los de sus roles** (`PERMISOS_POR_ROL` en
`src/utils/roles.ts`):

| Rol | Permisos |
|---|---|
| `administrador` | `roles`, `contenidos`, `parametros`, `espacios`, `reservas`, `asesorias`, `tablets`, `formacion`, `estadisticas` |
| `facilitador` | `asesorias`, `formacion` |
| `gestor_espacios` | `espacios`, `reservas` |

- Se pregunta con `useRol().tienePermiso('reservas')`. **Nunca se compara el nombre del rol a mano.**
- Hay ayudas: `esPersonal()`, `tieneRol()`, `describirRoles()`, `NOMBRE_TIPO` y
  `NOMBRE_ROL_PERSONAL`. `NOMBRE_ROL` y `Rol` están obsoletos.
- Los identificadores de los roles son **provisionales** hasta conectar con el Backend.

### El rastro de cada cambio de estado

En los mocks de reservas, asesorías, tablets y capacitaciones, **cada cambio de estado** crea:

1. una **notificación** para la persona,
2. un **evento en el historial** (Mis solicitudes, HU-08), y
3. un **registro de uso** (Estadísticas, HU-25).

Es una regla del proyecto, no un detalle: si una acción nueva no deja los tres, la estadística
miente y la persona no se entera.

Marcar un préstamo como **vencido** es responsabilidad de los datos; la interfaz solo lee
`estado: 'vencido'`.

---

## 5. Programación

### Convenciones

- Nombres de código y **textos de la interfaz en español**.
- Imports con `@/` (`@/components/ui`, `@/utils/fechas`).
- El nombre de la app sale de `NOMBRE_APP` (`src/utils/constantes.ts`); no se escribe a mano.
- Las **pantallas solo usan hooks**: nunca `fetch` ni imports de `src/api`.

### Los errores

Se leen **sin importar la clase** (`ErrorApi`), para que la pantalla no dependa de `src/api`:

```ts
if ('estado' in error && error.estado === 400) { … }
```

Los de guardar se muestran con `mensajeErrorGuardar()` (`src/utils/errores.ts`), que respeta el
mensaje de la API solo si es 400 o 404 y, si no, da uno genérico.

### Los formularios (zod 4)

- Los mensajes van con `{ error: '…' }`, no con `{ message: … }`.
- Las reglas entre campos, con `superRefine`.
- Para observar un campo se usa **`useWatch`**.
- Para guardar con errores en un formulario con pestañas, `handleSubmit(onValid, onInvalid)`
  permite saltar a la primera pestaña con errores.

### Las fechas y las horas

- Fechas como texto `'AAAA-MM-DD'` y horas como `'HH:MM'` (`src/utils/fechas.ts`).
- **Sin paquetes de calendario**: las vistas de mes y semana y el selector son propios.
- La semana de los calendarios va de lunes a sábado.

### La disponibilidad

Los días que se ofrecen para reservas y citas salen **siempre** de `esDiaHabil()` y
`motivoNoDisponible()` (`src/utils/parametros.ts`), con los datos de `useParametros()`.

**No se repite esa lógica** en pantallas ni en mocks: si cada pantalla decidiera por su cuenta
qué día es hábil, se desincronizan.

### Los recordatorios

Todo recordatorio tiene que entrar al plan de **`planRecordatorios()`**
(`src/utils/recordatorios.ts`). `SincronizarRecordatorios` cancela los que empiezan por
`PREFIJO_RECORDATORIO` (`recordatorio-`) y ya no están en el plan.

Si un recordatorio se programa por fuera del plan, la siguiente sincronización lo borra.

### Los mocks

Los **datos y la lógica** de un mock van en `src/api/mocks/<módulo>.ts`. La función de
`src/api/<módulo>.ts` los importa y decide:

```ts
// src/api/asesorias.ts
import { CITAS_ASESORIA } from './mocks/asesorias';

let citas: Cita[] = CITAS_ASESORIA.map((cita) => ({ ...cita }));

export async function obtenerMisCitas(usuarioId: string): Promise<Cita[]> {
  if (USAR_MOCKS) {
    return simularRed(citas.filter((c) => c.solicitanteId === usuarioId));
  }
  return peticion<Cita[]>('/asesorias/citas/mias/');
}
```

Qué hace cada pieza:

- **`src/api/mocks/<módulo>.ts`** exporta las constantes con los datos (`CITAS_ASESORIA`,
  `RESERVAS`, `PRESTAMOS_TABLET`…).
- **`src/api/<módulo>.ts`** guarda una **copia mutable** (así lo que se crea durante la sesión se
  ve, y se pierde al cerrar la app) y elige entre mock y API.
- **`simularRed()`** imita la latencia, para que los estados de carga se vean de verdad.
- Los mocks **validan** como la API: lanzan `ErrorApi` 400 (datos inválidos) o 404 (no existe).
  Así la pantalla se prueba contra los mismos errores que dará el Backend.
- Las fechas de los mocks salen de `src/api/mocks/fechasDemo.ts`, **relativas al día en que se
  abre la app**. No se escriben fechas fijas: la demo quedaría vieja al día siguiente.
- Cada cambio de estado deja **notificación, evento del historial y registro de uso**, igual que
  en la API real (ver [El rastro de cada cambio de estado](#el-rastro-de-cada-cambio-de-estado)).

### El paso a la API real, módulo por módulo

Cuando un módulo deje de usar datos de prueba:

1. **Confirma la ruta y la forma de la respuesta** con el equipo de Backend. La app espera
   `'AAAA-MM-DD'` para las fechas y `'HH:MM'` para las horas.
2. **Deja el `peticion<T>(...)` escrito** en la rama `else` **aunque el endpoint todavía no
   exista**. Así, el día que el Backend responda, solo hace falta apagar el mock.
3. **Ajusta el tipo de `src/types`** si la respuesta no coincide. Es base compartida: necesita la
   aprobación de un guardián.
4. **Quita el mock solo cuando la API responda** en desarrollo. Hasta entonces, el mock sigue
   siendo el camino de la demo y de las pruebas de aceptación.
5. **`EXPO_PUBLIC_API_URL` apunta a la IP del computador, no a `localhost`**: `localhost` desde el
   celular es el propio celular.

Un módulo a la vez, con su PR y su prueba. **No se apaga `USAR_MOCKS` de golpe**: con el Backend a
medias, la app quedaría vacía en el resto de pantallas.

### Cómo agregar una pantalla

**1. Crea el archivo donde va la ruta.** El nombre del archivo es la ruta.

```tsx
// src/app/(personal)/reportes.tsx
export default function Reportes() {
  return null; // primero el esqueleto
}
```

No hay que registrar nada en `_layout.tsx`: la ruta aparece sola. Solo se toca el `_layout` si la
pantalla es una **pestaña nueva** o necesita un `presentation: 'modal'`.

**2. Escribe el hook antes que la pantalla.**

```ts
// src/hooks/useReportes.ts
import { useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerReportes } from '@/api/reportes';

export function useReportes() {
  return useQuery({ queryKey: claves.reportes, queryFn: obtenerReportes });
}
```

**3. Añade la clave** en `src/api/claves.ts`, con las demás de su iteración.

**4. Implementa la llamada** en `src/api/reportes.ts`, con la rama de mocks y la de API real.

**5. Pinta la pantalla** con los componentes de `src/components/ui`: `Pantalla`, `EstadoCarga`,
`EstadoError` y `EstadoVacio`. Los tres estados —carga, error y vacío— **no son opcionales**
cuando la pantalla muestra datos.

**6. Comprueba antes de abrir el PR.**

```bash
npm run lint
npm run typecheck
npx expo start   # y recorre el flujo a mano en Expo Go (Android)
```

### Expo y lo nativo

- **No se crean ni se editan `ios/` ni `android/`**: se generan solos. Lo nativo se configura en
  `app.json` y en los plugins.
- En `expo-file-system`, `File.write()` es **asíncrono**; para guardar al instante se usa
  `writeSync()`.
- Los paquetes se instalan con `npx expo install`, no con `npm install`: así se resuelve la
  versión compatible con la SDK.

---

## 6. Especificaciones de diseño

### Los tokens del tema

Todo sale de `@/theme`: `colores`, `fuentes`, `espacio`, `radio`, `acentoServicio`,
`fondoServicio`, `coloresEstado` y `tamanoLogo`. **Nada de colores hex ni medidas sueltas en las
pantallas.** La paleta exacta está en [paleta-colores.md](paleta-colores.md).

Cuándo usar cada color:

| Token | Cuándo |
|---|---|
| `colores.primario` | Botones, enlaces y texto de marca |
| `colores.primarioOscuro` | Bloques oscuros, siempre con texto blanco |
| `colores.primarioSuave` | Fondos suaves de chips y contenedores |
| `verdeUpc` | Solo en elementos grandes o decorativos |
| `verdeClaroUpc` | Solo de fondo, con texto `colores.texto` |
| `amarilloUpc` | Solo como acento pequeño |

**Nunca** texto amarillo ni verde claro sobre blanco: no alcanza el contraste AA.

Las **categorías de servicio** toman el color de `acentoServicio[categoria]` y el fondo claro de
`fondoServicio[categoria]`, sin bordes de color. Siempre van con ícono o texto, **nunca solo con
color**.

Los **logos** (`assets/images/`) no se recolorean ni se deforman: `contentFit="contain"` y la
proporción del archivo.

### Los componentes compartidos

Están en `src/components/ui`:

| Componente | Cuándo |
|---|---|
| `Pantalla` | Envuelve toda pantalla. Lleva el isotipo y el menú de usuario arriba a la derecha |
| `EncabezadoApilado` | Encabezado de las rutas apiladas |
| `EstadoCarga`, `EstadoError`, `EstadoVacio` | Los tres estados obligatorios de una pantalla con datos; el de error lleva reintentar |
| `BotonFlotante` | Crear algo nuevo, en la prop `flotante` de `Pantalla`. Se encoge al desplazar. No se usan botones largos de «Nuevo …» ni `AnimatedFAB` |
| `MenuAcciones` | Las acciones de una tarjeta (tres puntos, con `ocupado` mientras guarda). Si la tarjeta tiene **una sola** acción, se toca la tarjeta entera, con `chevron-right` |
| `PestanasFiltro` | Las secciones o estados de una pantalla, con `cantidad` y `alerta` |
| `ChipsFiltro` | Filtrar una lista por un valor |
| `EtiquetaEstado` | El estado de una solicitud, con texto y color |
| `CampoHora` y `CampoNumerico` | Horas (cada 30 min) y cantidades (− y +) |
| `Paginacion` | Listas largas, de 10 en 10 (#210) |
| `AvisoError`, `FilaInterruptor`, `MenuUsuario`, `EnConstruccion` | Avisos, interruptores, menú de la sesión y pantallas pendientes |

**Fechas, horas y cantidades nunca se escriben a mano.** Las fechas van con `SelectorFecha`
(`src/components/espacios/`), las horas con `CampoHora` y las cantidades con `CampoNumerico`.

### Accesibilidad

- Los estados llevan **texto además del color**, con contraste AA.
- Todo lo presionable lleva `accessibilityRole` y `accessibilityLabel`, y un área táctil de al
  menos **44×44** (o `hitSlop`).
- Las tarjetas presionables van con `TouchableRipple` dentro de un `View`, **no** con `Card` y
  `onPress`.
- **Nada de anchos fijos** que se rompan con letra grande.
- Los avisos al lector de pantalla van con `accessibilityLiveRegion` (Android) y
  `AccessibilityInfo.announceForAccessibility` (iOS).

---

## 7. Generar el APK

El proyecto vive en la organización **biblioupc** de Expo. Para lanzar builds hay que ser miembro.

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

- El perfil `preview` de `eas.json` produce un **APK** con `EXPO_PUBLIC_USAR_MOCKS=true`.
- La compilación va en la nube: entre 10 y 30 minutos si la cola está libre, y hasta una hora o
  más cuando está cargada. **Se pide en cuanto se congela `develop`.**
- La firma de Android la guarda Expo. No se sube al repositorio.
- Al terminar, la terminal da el enlace y el código QR; el APK también queda en
  [expo.dev](https://expo.dev/accounts/biblioupc/projects/biblioteca-upc-movil/builds).

Fuera de la nube, en local, hacen falta Android Studio y el SDK: `npx expo run:android`.

> **Expo Go muestra su propio ícono y su propio splash.** Para ver los de la app hace falta el APK
> o un build de desarrollo. Es la razón por la que los issues de identidad piden verificar el
> ícono en el APK.

---

## 8. Publicar una versión y flujo de trabajo

### Publicar una versión

El orden importa. Saltarse un paso deja el README apuntando a un Release que no existe.

**1. Sube la versión en los tres sitios:**

```
app.json          → "version": "1.1.0"
package.json      → "version": "1.1.0"
package-lock.json → "version": "1.1.0"  y  packages[""].version: "1.1.0"
```

Tienen que coincidir los tres para que **el APK, la etiqueta y el Release digan la misma
versión**. (`npm ci` no lee `app.json`; lo que se descuadra es lo que ve quien descarga.)

**2. Actualiza el README** con el estado de la versión, lo que quedó fuera y las limitaciones.

**3. Abre el PR `develop` → `main`** con **merge commit**, nunca squash.

Las dos ramas no se fusionan igual:

| Rama | Cómo se fusiona | Por qué |
|---|---|---|
| PR hacia `develop` | **Squash** | Un commit por PR en el historial de la iteración |
| PR `develop` → `main` | **Merge commit** | El cierre de la versión conserva la historia y se etiqueta |

**4. Crea la etiqueta sobre `main`**, ya fusionado:

```bash
git switch main && git pull
git tag -a v1.1.0 -m "v1.1.0 · Versión 1.1"
git push origin v1.1.0
```

**5. Publica el Release** con el APK adjunto y las notas. El archivo sigue la convención
`biblioupc-v1.1.0.apk`.

**6. Recién entonces reparte el APK.** El README enlaza a `releases/tag/v1.1.0`; hasta que el
Release exista, ese enlace da 404.

### Las ramas

- `develop` es la rama por defecto y `main` es solo para releases. **Nunca se hace push directo a
  ninguna de las dos.**
- Los nombres son `feature/huNN-ui-…`, `feature/huNN-datos-…`, `fix/…`, `chore/…` o `docs/…`.
- Una rama vive pocos días y nace de `develop` actualizado.

### Los commits y los PR

- **Conventional Commits con la HU como alcance**: `feat(hu14): selector de franjas por semana`.
- El título del PR usa el mismo formato, porque será el commit que quede en `develop`.
- Cada PR enlaza su issue con `Closes #N` y necesita **una aprobación**.
- No se fusiona con conversaciones abiertas.
- **Nunca `--force`.** Si hay que reescribir una rama, `--force-with-lease` y solo si es tuya.

### La base compartida (CODEOWNERS)

Necesitan la aprobación de un guardián que **no sea el autor**:

```
src/types/
src/theme/
src/app/**/_layout.tsx
package.json
app.json
tsconfig.json
.github/
```

Además: **no se renombran ni se borran exports** del tema ni de los tipos. Si algo cambia, se deja
un alias con `/** @deprecated */` para no romper a quien lo use.

### El formato

El proyecto **no tiene configuración de Prettier**. Si hace falta formatear, se usa:

```bash
npx prettier --single-quote --print-width 100 --trailing-comma all
```

Y solo en los archivos que se tocaron.

---

## 9. Resolución de problemas

### `Type '"/ruta"' is not assignable…` en `tsc`

Los tipos de rutas que genera Expo (`.expo/types/router.d.ts`) están viejos respecto al árbol de
`src/app`. Se regeneran arrancando la app una vez:

```bash
npx expo start --offline
# Ctrl+C cuando termine de arrancar, y repite el typecheck
```

`.expo/` está en `.gitignore`: no se sube.

### `npm ci` falla tras un merge

El lockfile quedó desincronizado con `package.json`. **No lo arregles con el `npm` del sistema**:
el equipo genera el lockfile con **npm 10**, y un npm más nuevo reescribe el formato y llena el
diff de ruido.

```bash
npx npm@10 install
git diff package-lock.json   # revisa que solo cambien las versiones esperadas
```

Y avisa en el grupo: el lockfile lo tiene que regenerar **una sola persona**.

### La app abre con datos viejos o sin sesión

- Los mocks viven en memoria: al recargar, todo vuelve al estado inicial.
- La sesión se guarda con versión (`src/store/sesion.ts`). Si cambia la forma del usuario
  guardado, **sube la versión** y amplía la migración; si no, las sesiones guardadas se rompen
  en silencio.

### Un cambio de `src/theme` o `src/types` queda bloqueado

Es base compartida. El PR necesita la aprobación de un guardián que no sea el autor
(`.github/CODEOWNERS`).

### El celular no conecta con Expo

Misma red Wi-Fi, y si la red aísla los dispositivos, `npx expo start --tunnel`. Firewall del
computador abierto en el puerto que muestra la terminal.

### El ícono o el splash no cambian

Expo Go muestra **su propio** ícono y su propio splash. Hace falta el APK o un build de
desarrollo.

### No se puede abrir el repositorio institucional

Va por HTTP (`usesCleartextTraffic` en el plugin `expo-build-properties`). Depende de que el área
de sistemas active HTTPS; está anotado como bloqueado en el issue #165.

### Trampas conocidas

Son las que más rompen la app, y casi ninguna da un error claro:

| Trampa | Por qué |
|---|---|
| **Nunca importar `'expo-notifications'` directamente** | Carga el módulo nativo de push y **Expo Go para Android se cae al abrir**. Se usa `src/hooks/useRecordatorios.ts`, que importa por archivo (`expo-notifications/build/…`) |
| **El peso de la letra va con `fuentes.*`**, nunca con `fontWeight` | Android no aplica `fontWeight` a las fuentes cargadas: el texto se queda con el peso normal |
| **Los diálogos de Paper (`Portal`) quedan fuera del `QueryClientProvider`** | Los hooks de datos van en la pantalla y el diálogo los recibe **por props** |
| **Los paquetes se instalan con `npx expo install`** | `npm install` puede traer una versión incompatible con la SDK |
| **Nunca `npm audit fix`** | Aunque npm lo sugiera al final de `npm ci`. Rompe versiones fijadas por Expo |
| **Con React Compiler activo, `useWatch` y no `watch()`** | `watch()` no se re-ejecuta como el compilador espera |
| **Los tipos de RN 0.88 son estrictos** | `onPress={() => handleSubmit(fn)()}`, y en `tabBarIcon` el `color` es `ColorValue` |
