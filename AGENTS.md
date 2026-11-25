This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## BiblioUPC y alcance

- Responde en español. BiblioUPC es la app de servicios bibliotecarios de la Universidad Popular del Cesar. Android es el objetivo de entrega. Mantén la compatibilidad multiplataforma y conserva el diseño y los flujos existentes.
- Lee [README.md](README.md) y la [guía técnica](docs/guia-tecnica.md) para la arquitectura y los flujos. Para la API, lee el [inventario y plan de integración](docs/integracion-backend.md) y verifica la versión desplegada con [OpenAPI](https://backend-biblioteca-njx5.onrender.com/api/schema/) o [Swagger](https://backend-biblioteca-njx5.onrender.com/api/docs/). Distingue los inventarios históricos del contrato vigente.
- Para cada issue, revisa sus criterios de aceptación y acuerda el plan por fases antes de implementar. Si afecta varios archivos, la base compartida o el diseño, explica el alcance y coordina el cambio con María. Al cerrar, informa las verificaciones y cómo reproducir el flujo pertinente, usando los perfiles de demostración del manual.

## Capas y convenciones

- Las pantallas componen componentes y consumen hooks. Los hooks encapsulan consultas y mutaciones de TanStack Query. Los servicios en `src/api/` eligen la fuente de datos. Centraliza el HTTP hacia Django en `src/api/cliente.ts` y traduce el contrato de cada módulo en `src/api/backend/`. Koha y DSpace son integraciones externas independientes.
- Conserva los modelos de dominio en `src/types/`, por módulo. Usa nombres de dominio en español e imports internos con `@/`. Mantén compatibles los exports del tema y los tipos. Si se reemplaza un export, conserva un alias con `@deprecated`.
- Centraliza las claves de TanStack Query en `src/api/claves.ts`. Incluye filtros e identidad cuando afecten el resultado. Usa prefijos comunes para invalidar listas, detalles y consultas derivadas. Mantén los hooks de datos fuera de los diálogos de Paper montados en `Portal` y pásales datos y callbacks por props.
- Usa React Hook Form y Zod para formularios, `useWatch` para observar campos con React Compiler y `superRefine` para validar entre campos. Reutiliza las utilidades de fechas, horarios y disponibilidad en `src/utils/`. Las fechas de dominio usan `AAAA-MM-DD` y las horas `HH:MM`.
- Conserva la identidad visual con los tokens de `src/theme/`, los componentes de `src/components/ui/` y los patrones del [manual de usuario](docs/manual-usuario.md). Reutiliza estados de carga, error, vacío y etiquetas de estado. Mantén contraste AA, estados con texto además de color, etiquetas accesibles y áreas táctiles de al menos 44 × 44.
- Conserva los recordatorios en `src/hooks/useRecordatorios.ts`. Las pantallas reutilizan ese hook y evitan importar directamente el paquete completo `expo-notifications` por su compatibilidad con Expo Go.

## Integración con Django y mocks

- Elige la fuente por módulo con `usaApi(modulo)` a medida que se conectan los servicios. Mantén `EXPO_PUBLIC_USAR_MOCKS` activo durante la transición y habilita en `EXPO_PUBLIC_API_MODULOS` solo los módulos adaptados. Consulta `.env.example`. La URL base incluye `/api/v1` y el APK usa HTTPS.
- Comprueba ruta, método, permisos, recurso, identificadores, campos, nulabilidad, enum, formato de errores y forma de listas contra el contrato verificable. Confirma si la respuesta es paginada, un objeto contenedor o un arreglo. Conserva las traducciones de estados y días de semana en los adaptadores. Coordina cualquier hueco del contrato con el equipo Django.
- Conserva el cliente común para JWT, renovación, errores y paginación. Usa el almacenamiento de sesión existente y protege los datos de cada cuenta al cerrar sesión o cambiar de usuario. Nunca publiques tokens, credenciales ni valores de `.env`. Las variables `EXPO_PUBLIC_*` son públicas.
- Separa el tipo de usuario de los roles del personal. Una persona puede tener varios roles. Usa `useRol().tienePermiso()` y las utilidades de `src/utils/roles.ts`, con los códigos de administrador, facilitador y gestor de espacios. La administración gestiona tablets. Respeta también las restricciones del servidor.
- Conserva las rutas de demostración, los datos y los errores simulados. Los mocks de mutaciones deben mantener el rastro existente de notificación, historial y registro de uso cuando corresponda. Al verificar un módulo, comprueba el flujo mock y el flujo real habilitado, incluyendo permisos, estados, errores y caché. En modo mixto, los IDs reales pueden carecer de datos mock asociados.

## Git y base compartida

- Conserva los cambios de trabajo existentes. Los cambios de rama, commits, pushes y PR requieren autorización de María. `develop` recibe los PR con squash y `main` se reserva para releases. Evita el push directo y los cambios forzados. Usa Conventional Commits con alcance de HU cuando corresponda.
- Consulta `.github/CODEOWNERS` y coordina cambios en tipos, tema, layouts, dependencias, configuración y archivos de GitHub. María lleva la UI y Jorge la integración y los datos. Se revisan mutuamente y cada cambio requiere revisión de otra persona cuando se tramita el PR.
- Este repositorio usa npm y `package-lock.json`. Los comandos de validación son `npm run lint` y `npm run typecheck`. Usa `npm ci` cuando cambie el lockfile y se necesite sincronizar las dependencias. Coordina cualquier dependencia nueva antes de instalarla y evita `npm audit fix`. Si faltan los tipos de rutas tras un cambio de navegación, regénéralos con Expo Router.
