<!--
Título del PR: mismo formato que un commit, porque será el commit que queda en develop.
Ejemplo: feat(hu14): pantalla para elegir franja de asesoría
-->

## ¿Qué hace este PR?

<!-- Una o dos frases. -->

## Historia de usuario

Closes #<!-- número del issue --> · HU-<!-- NN -->

## Tipo de cambio

- [ ] 🖼️ Pantalla o componente (UI)
- [ ] 🔌 Datos: tipos, mock, hook o llamada a la API
- [ ] 🧱 Base compartida: tipos, tema, layouts, dependencias o configuración
- [ ] 🐛 Corrección
- [ ] 📝 Documentación

## Capturas

<!-- Para cambios de UI: capturas desde Expo Go o el emulador. Si cambia algo existente, antes y después. -->

## Cómo probarlo

1. `git switch <rama>` y `npx expo start`
2. <!-- pasos para llegar a la pantalla o al flujo -->

## Lista de verificación

- [ ] Corrí la app y probé el flujo en un celular o emulador
- [ ] Mi rama está actualizada con `develop` y no tiene conflictos
- [ ] Las pantallas no llaman a la API directamente: usan hooks de `src/hooks`
- [ ] Contemplé los estados de carga, error y lista vacía (si aplica)
- [ ] No subí claves, tokens ni el archivo `.env`
- [ ] El PR tiene menos de ~400 líneas cambiadas (si no, explico por qué)
