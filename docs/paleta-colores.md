# Paleta de colores de BiblioUPC (app móvil)

Esta es la paleta **exacta** que usa la app, tomada de `src/theme/index.ts`. Sirve para compararla con la del portal web (grupo Frontend) y con el manual de identidad institucional.

- **Fuente:** _Manual de identidad UPC 2024_, colores en las pp. 19–20 y tipografía en las pp. 15–16.
- **Institucional:** el color está tal cual en el manual.
- **Derivado:** no está en el manual. Se sacó de la paleta oficial (más oscuro, más claro o mezclado con blanco) para cumplir el contraste AA de accesibilidad.
- **Contraste:** relación WCAG 2.1. El texto normal necesita **4,5:1** (AA) y los íconos, bordes y texto grande, **3:1**.

> Si un color cambia en el tema, este documento se actualiza en el mismo PR.

---

## 1. Colores institucionales

| Nombre en el código | Hex | Origen | Uso en la app | Contraste sobre blanco |
| --- | --- | --- | --- | --- |
| `verdeOscuroUpc` / `primario` | `#107B42` | Institucional | Color principal: botones, enlaces, títulos de marca, pestaña activa | 5,3:1 ✅ |
| `verdeUpc` | `#42A542` | Institucional | Solo elementos grandes o decorativos. **No para texto**. Hoy no se usa en ninguna pantalla | 3,1:1 (solo decorativo) |
| `verdeClaroUpc` | `#8CCE6B` | Institucional | Solo de fondo, con texto `texto` encima (9,1:1). Hoy solo en el marco del lector de códigos (prueba de cámara) | 1,9:1 (no para texto) |
| `amarilloUpc` | `#FAF800` | Institucional | Solo como acento pequeño, con texto `texto` encima (15,1:1). Hoy no se usa en ninguna pantalla | 1,1:1 (no para texto) |
| `error` | `#D4212C` | Institucional (rojo complementario, p. 20) | Errores del sistema y acento del servicio Tablets | 5,2:1 ✅ |

**Regla:** nunca texto amarillo ni verde claro sobre fondo blanco, porque no se puede leer.

## 2. Colores derivados de la marca

| Nombre en el código | Hex | Derivado de | Uso en la app | Contraste |
| --- | --- | --- | --- | --- |
| `primarioOscuro` | `#0B5A30` | `#107B42`, más oscuro | Bloques oscuros tipo mockup (encabezado, avatar), estado presionado | Blanco encima: 8,3:1 ✅ |
| `primarioSuave` | `#E8F4E8` | `#107B42`, casi blanco | Fondos de chips y contenedores | `primarioOscuro` encima: 7,4:1 ✅ |
| `tertiaryContainer` (Paper) | `#FEFED6` | `#FAF800`, casi blanco | Color terciario de Paper. Ninguna pantalla lo usa directamente | `texto` encima: 16,6:1 ✅ |

## 3. Neutros: texto, fondos y bordes

| Nombre en el código | Hex | Uso | Contraste sobre blanco |
| --- | --- | --- | --- |
| `texto` | `#131B2E` | Texto principal | 17,2:1 ✅ |
| `textoSecundario` | `#5B6375` | Texto de apoyo: fechas, descripciones, etiquetas | 6,0:1 ✅ |
| `fondo` | `#F5F8F5` | Fondo de las pantallas | — |
| `superficie` | `#FFFFFF` | Tarjetas, diálogos y menús | — |
| `superficieVariante` | `#EEF2EE` | Recuadros dentro de una tarjeta | — |
| `borde` | `#E1E7E1` | Separadores y bordes suaves | — (decorativo) |
| `bordeFuerte` | `#7A867A` | Borde de los campos de texto | 3,8:1 ✅ (componente, 3:1) |

**Elevación** (sombras de Paper, derivadas del verde): `#F3F7F3`, `#EEF4EE`, `#E9F1E9`, `#E7F0E7` y `#E3EDE3`, de menor a mayor.

## 4. Colores por servicio

Cada servicio tiene un **acento** (íconos, etiquetas y texto sobre blanco) y un **fondo claro** (el acento mezclado con 90 % de blanco). El color nunca va solo: siempre acompaña un ícono o un texto.

| Servicio (`CategoriaServicio`) | Acento | Fondo | Acento sobre blanco | `texto` sobre el fondo |
| --- | --- | --- | --- | --- |
| Asesorías (`asesorias`) | `#2477A4` | `#E9F1F6` | 4,9:1 ✅ | 15,0:1 ✅ |
| Capacitaciones (`capacitaciones`) | `#A43AC1` | `#F6EBF9` | 5,3:1 ✅ | 14,8:1 ✅ |
| Espacios (`espacios`) | `#337F33` | `#EBF2EB` | 5,0:1 ✅ | 15,1:1 ✅ |
| Tablets (`tablets`) | `#D4212C` | `#FBE9EA` | 5,2:1 ✅ | 14,7:1 ✅ |
| Repositorio (`repositorio`) | `#107B42` | `#E7F2EC` | 5,3:1 ✅ | 15,0:1 ✅ |
| Préstamo (`prestamo`) | `#1B5E86` | `#E8EFF3` | 7,0:1 ✅ | 14,8:1 ✅ |

**Regla:** sobre el fondo claro del servicio, el texto va en `texto` y el acento solo en el ícono. El acento sobre su propio fondo queda entre 4,3:1 y 6,0:1, suficiente para íconos (3:1) pero no siempre para texto normal.

## 5. Colores de estado

Se usan en las etiquetas de estado de las solicitudes y en los avisos. Siempre llevan el nombre del estado escrito, no solo el color.

| Estado (`EstadoSolicitud`) | Etiqueta | Fondo | Texto | Texto sobre su fondo | Otros usos |
| --- | --- | --- | --- | --- | --- |
| `pendiente` | Pendiente | `#FEF3E3` | `#825A1E` | 5,6:1 ✅ | Avisos de retraso en préstamos (ámbar, no error) |
| `aprobada` | Aprobada | `#E5F2E5` | `#2B6B2B` | 5,6:1 ✅ | |
| `rechazada` | Rechazada | `#F9E0E1` | `#B01B25` | 5,5:1 ✅ | Errores y préstamos vencidos |
| `nueva_fecha` | Nueva fecha propuesta | `#E2F1FA` | `#1E648A` | 5,6:1 ✅ | Tiempo restante de un préstamo |
| `cancelada` | Cancelada | `#ECEDF1` | `#5B6375` | 5,1:1 ✅ | |
| `realizada` | Realizada | `#ECE9F7` | `#4B3A8C` | 7,7:1 ✅ | Préstamos devueltos |

> Los fondos y textos de estado son **derivados**: el manual no define colores de estado. El ámbar de `pendiente` reemplaza al amarillo institucional (`#FAF800`), que no se puede leer como texto.

## 6. Tipografía

**Open Sans** (manual UPC 2024, pp. 15–16): `OpenSans_400Regular`, `OpenSans_600SemiBold` y `OpenSans_700Bold`. Títulos y botones en seminegrita, encabezados grandes en negrita y el texto corrido en regular.

## 7. Para comparar con Frontend

Puntos que conviene revisar juntos:

1. **El verde principal:** la app usa `#107B42` (verde oscuro UPC) y no `#42A542`, porque `#42A542` sobre blanco no llega a 4,5:1 para texto ni botones.
2. **El amarillo:** hoy la app no lo usa en ninguna pantalla. La regla es usarlo solo como acento pequeño o de fondo muy claro (`#FEFED6`), nunca como texto. Para los avisos se usa el ámbar de `pendiente`.
3. **Los colores por servicio y de estado:** son derivados nuestros. Si Frontend tiene otros, conviene unificarlos para que un mismo servicio o estado se vea igual en la web y en el celular.
4. **La tipografía:** confirmar que la web también use Open Sans.
