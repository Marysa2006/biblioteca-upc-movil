# Manual de mantenimiento

Cómo está hecho el proyecto, cómo se trabaja en él y cómo se publica una versión.
Va dirigido a quien retome el repositorio: no explica la app pantalla por pantalla —para eso
está el [manual de usuario](manual-usuario.md)—, sino **cómo tocar el código sin romperlo**.

- [1. Requisitos](#1-requisitos)
- [2. Instalación y arranque](#2-instalación-y-arranque)
- [3. Estructura del proyecto](#3-estructura-del-proyecto)
- [4. Cómo agregar una pantalla](#4-cómo-agregar-una-pantalla)
- [5. Datos: mocks y paso a la API](#5-datos-mocks-y-paso-a-la-api)
- [6. Generar el APK](#6-generar-el-apk)
- [7. Publicar una versión](#7-publicar-una-versión)
- [8. Problemas frecuentes](#8-problemas-frecuentes)

---

## 1. Requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 20 o superior (probado con 22) | Compilar y ejecutar la app |
| npm | 10 | Instalar dependencias y regenerar el lockfile |
| Expo Go | **SDK 58** | Probar en el celular sin compilar |
| Git | cualquiera reciente | Ramas y commits |
| Java / Android Studio | **no hace falta** | El APK se compila en la nube con EAS |

La app usa **Expo SDK 58** y **React Native 0.88**. Un Expo Go de otra SDK no abre el proyecto.

---

## 2. Instalación y arranque

```bash
git clone https://github.com/Marysa2006/biblioteca-upc-movil.git
cd biblioteca-upc-movil

npm ci                 # instala exactamente lo que dice el lockfile
cp .env.example .env   # y ajusta los valores

npx expo start
```

Escanea el código QR con Expo Go. El celular y el computador tienen que estar en la misma red;
si la red no lo permite, `npx expo start --tunnel`.

Para verlo en el navegador: `npm run web`.

### Los seis scripts

```bash
npm run start      # expo start
npm run android    # expo start --android
npm run ios        # expo start --ios  (necesita macOS)
npm run web        # expo start --web
npm run lint       # expo lint
npm run typecheck  # tsc --noEmit
```

**Antes de abrir un PR, `lint` y `typecheck` tienen que pasar sin errores.** No hay framework de
pruebas unitarias: la verificación es el tipado, el lint y la prueba manual en Expo Go.

### `npm ci` después de cada merge que cambie el lockfile

Si un PR toca `package.json` o `package-lock.json`, todo el equipo corre `npm ci` al bajar los
cambios. Con `npm install` en su lugar se puede reescribir el lockfile y meter ruido en el PR.

---

## 3. Estructura del proyecto

```
src/
├── app/            las pantallas (Expo Router: cada archivo es una ruta)
├── components/     componentes por módulo (asesorias/, tablets/, ui/, …)
├── hooks/          un archivo por módulo; envuelven TanStack Query
├── api/            llamadas: un archivo por módulo + cliente.ts + mocks/
├── types/          tipos por módulo (base compartida: los aprueba un guardián)
├── utils/          funciones puras: fechas, calendario, roles, validaciones
├── store/          estado global (Zustand): sesión y preferencias
└── theme/          colores, tipografía y espaciados de la UPC
docs/               manual de usuario, manual de mantenimiento, paleta, mockups
assets/images/      íconos, splash, logos y fotos
```

Tamaño actual: **51 pantallas**, **153 componentes**, **25 módulos de API**, **25 hooks**,
**44 utilidades**, **16 archivos de tipos** y **18 mocks**.

### El flujo de datos, siempre igual

```
Pantalla (src/app)
   └── usa un hook (src/hooks)          ← nunca llama a la API directamente
         └── llama a src/api/<módulo>   ← decide mock o API real
               └── src/api/cliente.ts   ← el único sitio que hace fetch
```

Una consecuencia práctica: **`src/api/cliente.ts` es el único punto de salida a la red**. Si
algún día hay que añadir cabeceras, reintentos o telemetría, se hace ahí y vale para las 90
llamadas de los 21 módulos que hablan con la API.

### Las pantallas y el enrutado

Expo Router toma **el árbol de `src/app/` como rutas**; no hay tabla de rutas que mantener.

```
src/app/_layout.tsx              el Stack raíz (proveedores: tema, query, área segura)
src/app/login.tsx                /login  (presentación modal)
src/app/(comunidad)/             pestañas de la comunidad: /, /servicios, /catalogo, /solicitudes
src/app/(personal)/              pestañas del personal: /panel, /gestion, /equipo, /inventario, /estadisticas
src/app/asesorias/mis-citas.tsx  /asesorias/mis-citas  (apilada)
src/app/administracion/…         pantallas de gestión, con flecha atrás
```

Los grupos entre paréntesis —`(comunidad)`, `(personal)`— **no aparecen en la URL**: solo separan
los dos conjuntos de pestañas.

---

## 4. Cómo agregar una pantalla

Ejemplo: una pantalla nueva en la vista del personal.

**1. Crea el archivo donde va la ruta.** El nombre del archivo es la ruta.

```tsx
// src/app/(personal)/reportes.tsx
export default function Reportes() {
  return null; // primero el esqueleto
}
```

No hay que registrar nada en `_layout.tsx`: la ruta aparece sola. Solo se toca el `_layout` si la
pantalla es una **pestaña nueva** o necesita un `presentation: 'modal'`.

**2. Escribe el hook antes que la pantalla.** La pantalla no llama a la API.

```ts
// src/hooks/useReportes.ts
import { useQuery } from '@tanstack/react-query';

import { claves } from '@/api/claves';
import { obtenerReportes } from '@/api/reportes';

export function useReportes() {
  return useQuery({ queryKey: claves.reportes, queryFn: obtenerReportes });
}
```

**3. Añade la clave** en `src/api/claves.ts`, con las demás de su iteración. Sin clave
centralizada, las mutaciones no sabrán qué refrescar.

**4. Implementa la llamada** en `src/api/reportes.ts`, con la rama de mocks y la de API real:

```ts
export async function obtenerReportes(): Promise<Reporte[]> {
  if (USAR_MOCKS) {
    return simularRed(REPORTES.map((r) => ({ ...r })));
  }
  return peticion<Reporte[]>('/reportes/');
}
```

**5. Pinta la pantalla** con los componentes compartidos de `src/components/ui`: `Pantalla`,
`EstadoCarga`, `EstadoError`, `EstadoVacio`, `EncabezadoApilado`. Las tres estados —carga, error y
vacío— no son opcionales cuando la pantalla muestra datos.

**6. Comprueba antes de abrir el PR.**

```bash
npm run lint
npm run typecheck
npx expo start   # y recorre el flujo a mano en Expo Go (Android)
```

### Reglas de estilo que no se negocian

- Colores, tipografía y espacios salen de `src/theme`. Nunca un `#1B5E20` suelto.
- Los estados se distinguen **con texto además del color**.
- Todo lo presionable lleva `accessibilityRole`, `accessibilityLabel` y al menos 44×44 de área
  táctil.
- `src/types`, `src/theme`, los `_layout` y `package.json` son **base compartida**: los aprueba un
  guardián (María o Jorge) que no sea el autor, según `.github/CODEOWNERS`.

---

## 5. Datos: mocks y paso a la API

### El interruptor

```env
EXPO_PUBLIC_USAR_MOCKS=true    # datos de prueba (lo que se entrega hoy)
EXPO_PUBLIC_USAR_MOCKS=false   # API real
```

En `src/api/cliente.ts`:

```ts
export const USAR_MOCKS = process.env.EXPO_PUBLIC_USAR_MOCKS !== 'false';
```

**Ojo con la lógica:** solo el texto `"false"` desactiva los mocks. Una variable ausente o vacía
mantiene los datos de prueba, que es lo que se quiere en el APK.

### Cómo se escribe un mock

Cada módulo de `src/api/` tiene su archivo en `src/api/mocks/`. La forma es siempre la misma:

```ts
export async function obtenerReportes(): Promise<Reporte[]> {
  if (USAR_MOCKS) return simularRed(REPORTES.map((r) => ({ ...r })));
  return peticion<Reporte[]>('/reportes/');
}
```

- `simularRed()` imita la latencia para que los estados de carga se vean de verdad.
- Los mocks son **copias mutables**: lo que se crea durante la sesión se ve, y se pierde al
  cerrar la app.
- Las fechas de los mocks salen de `src/api/mocks/fechasDemo.ts`, relativas al día en que se abre
  la app. No se escriben fechas fijas: la demo quedaría vieja al día siguiente.

### Paso a la API real, módulo por módulo

1. Confirma la ruta y la forma de la respuesta con el equipo de Backend.
2. Deja el `peticion<T>(...)` escrito en la rama `else` **aunque el endpoint todavía no exista**.
3. Ajusta el tipo de `src/types` si la respuesta no coincide — cambio de base compartida.
4. Quita el mock solo cuando la API responda en desarrollo. Hasta entonces, el mock sigue siendo
   el camino de la demo.
5. `EXPO_PUBLIC_API_URL` apunta a la IP del computador, **no a `localhost`**: `localhost` desde el
   celular es el propio celular.

### Estados y fechas

- Los estados de una solicitud son seis: `pendiente`, `aprobada`, `rechazada`, `nueva_fecha`,
  `cancelada` y `realizada`.
- Las fechas viajan como `'AAAA-MM-DD'` y las horas como `'HH:MM'`. Se validan con
  `src/utils/fechas.ts`.
- Un día hábil se decide **siempre** con `esDiaHabil()` de `src/utils/parametros.ts`. No se
  reimplementa en cada calendario.

---

## 6. Generar el APK

El proyecto vive en la organización **biblioupc** de Expo. Para lanzar builds hay que ser miembro.

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

- El perfil `preview` de `eas.json` produce un **APK** con `EXPO_PUBLIC_USAR_MOCKS=true`, porque el
  `.env` no se sube al repositorio.
- La compilación va en la nube: entre 10 y 30 minutos si la cola está libre, y hasta una hora o más
  cuando está cargada. **Se pide en cuanto se congela `develop`.**
- La firma de Android la guarda Expo. No se sube al repositorio.
- Al terminar, la terminal da el enlace y el código QR; el APK también queda en
  [expo.dev](https://expo.dev/accounts/biblioupc/projects/biblioteca-upc-movil/builds).

Fuera de la nube, en local, hacen falta Android Studio y el SDK: `npx expo run:android`.

---

## 7. Publicar una versión

El orden importa. Saltarse un paso deja el README apuntando a un Release que no existe.

**1. Sube la versión en los tres sitios.** Tienen que coincidir los tres o `npm ci` falla:

```
app.json          → "version": "1.1.0"
package.json      → "version": "1.1.0"
package-lock.json → "version": "1.1.0"  y  packages[""].version: "1.1.0"
```

**2. Actualiza el README** con el estado de la versión, lo que quedó fuera y las limitaciones.

**3. Abre el PR `develop` → `main`** con **merge commit**, nunca squash: el historial de `develop`
tiene que quedar en `main`. El aviso «out-of-date» es normal; no uses «Update branch».

**4. Crea la etiqueta sobre `main`**, ya fusionado:

```bash
git switch main && git pull
git tag -a v1.1.0 -m "v1.1.0 · Versión 1.1"
git push origin v1.1.0
```

**5. Publica el Release** con el APK adjunto y las notas de la versión. El nombre del archivo
sigue la convención `biblioupc-v1.1.0.apk`.

**6. Recién entonces reparte el APK.** El README enlaza a `releases/tag/v1.1.0`; hasta que el
Release exista, ese enlace da 404.

### Reglas de ramas

| Prefijo | Para qué | Ejemplo |
|---|---|---|
| `feature/` | Una capa de una HU | `feature/hu14-datos-aprobacion-citas` |
| `fix/` | Corregir algo ya fusionado | `fix/calendarios-dias-habiles` |
| `chore/` | Base, configuración o dependencias | `chore/icono-upecito` |
| `docs/` | Documentación | `docs/manual-mantenimiento` |

Cada PR enlaza su issue con `Closes #N`, necesita **una aprobación** y no se fusiona con
conversaciones abiertas.

---

## 8. Problemas frecuentes

### `Type '"/ruta"' is not assignable…` en `tsc`

Los tipos de rutas que genera Expo (`.expo/types/router.d.ts`) están viejos respecto al árbol de
`src/app`. Se regeneran arrancando la app una vez:

```bash
npx expo start --offline
# Ctrl+C cuando termine de arrancar, y repite el typecheck
```

`.expo/` está en `.gitignore`: no se sube.

### `npm ci` falla tras un merge

El lockfile quedó desincronizado con `package.json`. No lo arregles a mano:

```bash
npm install          # regenera el lockfile
git diff package-lock.json   # revisa que solo cambien las versiones esperadas
```

Y avisa en el grupo: el lockfile lo tiene que regenerar una sola persona.

### La app abre con datos viejos o sin sesión

- Los mocks viven en memoria: al recargar, todo vuelve al estado inicial.
- La sesión se guarda con versión (`src/store/sesion.ts`, hoy `version: 2`). Si cambia la forma
  del usuario guardado, **sube la versión** y amplía la migración; si no, las sesiones guardadas
  se rompen en silencio.

### Un cambio de `src/theme` o `src/types` queda bloqueado

Es base compartida. El PR necesita la aprobación de un guardián que no sea el autor
(`.github/CODEOWNERS`: María o Jorge).

### El celular no conecta con Expo

Misma red Wi-Fi, y si la red aísla los dispositivos, `npx expo start --tunnel`. Firewall del
computador abierto en el puerto que muestra la terminal.

### El ícono o el splash no cambian

Expo Go muestra **su propio** ícono y su propio splash. Para ver los de la app hace falta el
**APK** o un build de desarrollo. Es la razón por la que el CA2 de los issues de identidad pide
verificarlo en el APK.

### `no se puede abrir el repositorio institucional`

El repositorio va por HTTP (`usesCleartextTraffic` en `app.json`). Depende de que el área de
sistemas active HTTPS; está anotado como bloqueado en el issue #165.

---

## Lo que no está en este repositorio

- **El Backend.** Es un proyecto aparte (Django). Aquí solo se consume su API.
- **Las credenciales.** Ningún token ni contraseña se guarda en el código ni en el APK.
- **`ios/` y `android/`.** Se generan con Continuous Native Generation; no se editan a mano. La
  configuración nativa va en `app.json` y en sus plugins.
