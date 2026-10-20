# Spike de cámara · Iteración 2

**Rama:** `chore/spike-camara` · **Responsable:** Jhon · **Para:** HU-31 (código de barras de tablets), HU-32 y HU-33 (asistencia con QR)

**Pregunta:** ¿podemos leer códigos QR y códigos de barras con la cámara del celular en Expo Go, sin una development build?

## Qué se probó

- **Paquete:** `expo-camera` ~57.0.6, instalado con `npx expo install`. Viene incluido en Expo Go ([documentación SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/camera/)).
- **Pantalla de prueba:** `src/app/pruebas/camara.tsx`. Se abre con el botón **Prueba de cámara (desarrollo)** de la pestaña Inventario. Solo aparece en desarrollo (`__DEV__`), no en el APK.
- **Componente reutilizable:** `src/components/camara/EscanerCodigos.tsx`. Pide el permiso, muestra la cámara con un recuadro guía, pausa después de cada lectura y tiene linterna.

La pantalla compara tres formas de leer un código:

| Forma | Cómo funciona | Para qué HU |
|---|---|---|
| 1. Cámara dentro de la app | `CameraView` con `onBarcodeScanned`. Se ve con el diseño de la app. | HU-32 (el usuario escanea el QR de la sesión) |
| 2. Escáner del sistema | `CameraView.launchScanner()`. En Android abre el escáner de Google y se cierra solo al leer. | Opción más rápida para HU-31 |
| 3. Escribir el código | Campo de texto. | HU-31 CA3: sin cámara o sin permiso |

**Tipos de código:**
- QR: `qr`.
- Códigos de barras: `code128`, `code39`, `ean13`, `ean8`, `upc_a`, `upc_e`, `itf14` y `codabar`.
- En "Todos", también `datamatrix` y `pdf417`.

**Configuración en `app.json`:**
- Se agrega el plugin `expo-camera` con el texto del permiso en español.
- `recordAudioAndroid: false`, porque no grabamos audio y así la app no pide el micrófono.
- Expo Go no necesita el plugin. El APK de EAS sí.

## Resultados en el celular

Probado por Jhon en Expo Go, en Android, el 20 de octubre de 2026. Todas las pruebas pasaron.

| Prueba | Resultado | Notas |
|---|---|---|
| Expo Go abre la cámara | ✅ Sí | |
| Pedir permiso → Permitir | ✅ Sí | |
| Negar el permiso dos veces → sale "Abrir ajustes" y lleva a Ajustes | ✅ Sí | |
| Lee un QR (por ejemplo, uno generado con un enlace) | ✅ Sí | |
| Lee un código de barras de un producto (EAN-13) | ✅ Sí | |
| Lee una etiqueta Code 128 (como las de inventario) | ✅ Sí | |
| No repite la lectura hasta tocar "Escanear otro" | ✅ Sí | |
| Linterna con poca luz | ✅ Sí | |
| Escáner del sistema (`launchScanner`) disponible y lee | ✅ Sí | |
| Al salir de la pantalla la cámara se apaga (se apaga la luz verde del indicador) | ✅ Sí | |

## Conclusiones y recomendación

**Respuesta:** sí. `expo-camera` lee QR y códigos de barras en Expo Go sin una development build, con permiso, linterna y escáner del sistema.

- **HU-32 (escanear el QR de asistencia):** reutilizar `EscanerCodigos` solo con el tipo `qr`. La pausa después de cada lectura ayuda con CA3 (no duplicar el registro). El aviso de permiso ya cubre CA4.
- **HU-31 (tablets):** el escáner del sistema funcionó y es la opción más rápida para el responsable de préstamos. `EscanerCodigos` con los tipos de barras queda como alternativa dentro de la app. El campo para escribir el código cubre CA3.
- **HU-33 (el facilitador muestra un QR):** generar un QR no lo hace `expo-camera`. Hace falta una librería para dibujarlo, que se evalúa en la iteración 4. Validar el QR necesita el endpoint del Backend que ya se pidió.
- **Web:** la cámara en el navegador depende del navegador. Probamos solo en Android, que es lo que exige la definición de terminado.
