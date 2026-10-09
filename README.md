<div align="center">

# 📚 Biblioteca UPC · App móvil

**La biblioteca de la Universidad Popular del Cesar, en el bolsillo de toda la comunidad universitaria.**

<sub>Nombre definitivo de la app: por definir</sub>

<br/>

![Expo](https://img.shields.io/badge/Expo-SDK%2056-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.85-61DAFB?logo=react&logoColor=black)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![Plataformas](https://img.shields.io/badge/plataformas-Android%20%7C%20iOS-006139)
![Release](https://img.shields.io/badge/Release%201.0-5%20nov%202026-E5BC16)

</div>

---

## 📖 Contenido

- [Sobre el proyecto](#-sobre-el-proyecto)
- [El problema](#-el-problema)
- [Nuestra propuesta](#-nuestra-propuesta)
- [¿Para quién es?](#-para-quién-es)
- [Funcionalidades](#-funcionalidades)
- [Planificación](#-planificación)
- [Arquitectura](#️-arquitectura)
- [Stack tecnológico](#️-stack-tecnológico)
- [Cómo empezar](#-cómo-empezar)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Cómo trabajamos](#-cómo-trabajamos)
- [Equipo](#-equipo)

---

## 🎯 Sobre el proyecto

Este repositorio contiene la **aplicación móvil** del proyecto de aula de la asignatura **Sistemas de Información** (Ingeniería de Sistemas, 7.º semestre) de la **Universidad Popular del Cesar (UPC)**, en Valledupar, Colombia.

El proyecto general, **Sistema de Gestión de Servicios de Biblioteca Unicesar**, construye un portal de servicios para la Biblioteca de la UPC inspirado en el modelo **CRAI** (Centro de Recursos para el Aprendizaje y la Investigación). Lo desarrollan cinco equipos: Backend, Frontend, Análisis de datos, Diccionario de datos y **Móvil**, que es el que trabaja en este repositorio.

> [!NOTE]
> Este proyecto es un **primer paso hacia el modelo CRAI**, no un CRAI completo. Su objetivo es reunir y modernizar los servicios que hoy presta la biblioteca para que esa transición sea posible.

---

## 🧩 El problema

La Biblioteca de la UPC presta mucho más que libros: asesorías en normas APA y en el gestor bibliográfico Mendeley, capacitaciones, reserva de salas, préstamo de tablets, depósito de trabajos de grado y actividades culturales como el cineclub. Pero la Dirección de la Biblioteca identificó cuatro problemas:

| | Problema | Consecuencia |
|---|---|---|
| 🧭 | **Información dispersa** | Los servicios están repartidos en distintas partes del portal institucional y el usuario debe buscarlos uno por uno. |
| 👀 | **Servicios poco conocidos** | Muchos estudiantes y docentes no saben que existen; hoy se dan a conocer solo en las charlas de inducción. |
| 📝 | **Solicitudes a mano, sin estadísticas** | El seguimiento es manual, así que la biblioteca no sabe con certeza quién usa qué servicio. |
| 📶 | **Internet inestable en los talleres** | En los talleres prácticos la conexión se cae o se pone lenta. |

---

## 💡 Nuestra propuesta

Una app para **Android e iPhone** que reúne los servicios de la biblioteca, le da al personal acceso rápido a la gestión desde el celular y complementa todo con lo que solo un teléfono puede hacer bien.

La app **no reemplaza** a las plataformas que ya funcionan: **Koha** sigue siendo el catálogo y los préstamos, y **DSpace** sigue siendo el Repositorio Institucional. La app las enlaza y se conecta a la misma API que usa el portal web, así que ambos muestran siempre la misma información.

### ¿Por qué una app si el portal web ya es responsive?

Porque la app hace cosas que una página web no puede hacer bien:

1. 🔔 **Avisa aunque esté cerrada**: notificaciones y recordatorios.
2. 📷 **Usa el teléfono a fondo**: cámara para códigos QR y de barras, y calendario del sistema.
3. 📴 **Funciona sin internet**: guías y material guardados en el dispositivo.
4. ⚡ **Pone la gestión a un toque**: el personal aprueba, administra y registra préstamos sin estar frente al computador.

---

## 👥 ¿Para quién es?

Para **toda la comunidad universitaria** y para el **personal de la biblioteca**. La app tiene dos vistas y tres tipos de usuario:

| Vista | Tipo de usuario | Quiénes | Acceso |
|---|---|---|---|
| 👥 **Comunidad** | 🌐 **Sin cuenta** | Visitantes, invitados y egresados | Servicios y horarios, catálogo, disponibilidad de espacios y guías. |
| 👥 **Comunidad** | 🎓 **Con cuenta institucional** | Estudiantes, docentes y administrativos | La misma vista, más bases de datos académicas, solicitudes, seguimiento, perfil y funciones plus. |
| 🛠️ **Personal** | 🔑 **Con cuenta institucional** | Administración y facilitadores de la biblioteca | Vista propia con la operación del día, la administración de los servicios y las funciones plus de gestión. |

---

## ✨ Funcionalidades

Cada funcionalidad se rastrea con su requerimiento (RF), caso de uso (CU) e historia de usuario (HU). En este proyecto la relación es uno a uno: **RF-14 ↔ CU-14 ↔ HU-14**. La columna *Iteración* indica en qué iteración del proyecto se construye.

### 👥 Vista de la comunidad

Visitantes y usuarios con cuenta ven la misma app; iniciar sesión desbloquea los servicios que necesitan identificación.

| Funcionalidad | RF / HU | Sin cuenta | Con cuenta | Iteración |
|---|---|:---:|:---:|:---:|
| Servicios de la biblioteca con descripción, público y horarios | 01 | ✅ | ✅ | 1 |
| Acceso al catálogo bibliográfico (Koha / OPAC) | 02 | ✅ | ✅ | 1 |
| Bases de datos y recursos académicos | 03 | — | ✅ | 1 |
| Inicio de sesión institucional y perfil | 05, 06 | — | ✅ | 1 |
| Disponibilidad de espacios (vista semanal y mensual) | 17 | ✅ | ✅ | 2 |
| Solicitud de reserva de espacios | 18 | — | ✅ | 2 |
| Asesorías: agendar, cancelar y reprogramar | 14 | — | ✅ | 3 |
| Disponibilidad y solicitud de tablets | 22 | — | ✅ | 3 |
| Mis solicitudes: estado e historial en un solo lugar | 08 | — | ✅ | 4 |
| Solicitud de capacitaciones | 10 | — | ✅ | 4 |
| Orientación para el depósito del trabajo de grado | 11 | — | ✅ | 4 |

### 🛠️ Vista del personal

Todo lo que la administración y los facilitadores hacen en el portal web también lo pueden hacer desde el celular, para resolver rápido cuando no están frente al computador.

**Operación del día**

| Funcionalidad | RF / HU | Iteración |
|---|---|:---:|
| Bandeja de reservas: aprobar, modificar, rechazar o reservar para terceros | 19 | 2 |
| Agenda del facilitador y resultado de cada cita | 15 | 3 |
| Registro de entrega y devolución de tablets | 23 | 3 |
| Bandeja de solicitudes de formación | 12 | 4 |
| Panel del día y estadísticas de uso | 26 | 4 |

**Administración**

| Funcionalidad | RF / HU | Iteración |
|---|---|:---:|
| Contenidos del portal: servicios y avisos | 04 | 1 |
| Parámetros generales: periodos, festivos y horarios | 28 | 1 |
| Catálogo de espacios | 16 | 2 |
| Bloqueos institucionales de espacios | 20 | 2 |
| Temas de asesoría y jornadas | 13 | 3 |
| Inventario de tablets | 21 | 3 |
| Líneas de formación | 09 | 4 |

### 🔁 Transversales

| Funcionalidad | RF / HU | Iteración |
|---|---|:---:|
| Vistas según el rol del usuario y asignación de roles | 07 | 1 |
| Notificaciones: el backend envía el correo y la app suma notificaciones push | 27 | 2 |

El control de préstamos vencidos (HU-24) y el registro estadístico (HU-25) son procesos automáticos del backend; la app muestra sus resultados.

### ⭐ Funciones plus

Son el valor diferencial de la app frente al portal web.

| Función | Para quién | Problema que resuelve | Qué gana la biblioteca |
|---|---|---|---|
| 📷 **Registro de asistencia con QR** | Comunidad con cuenta y personal | La biblioteca sabe quién pidió un servicio, pero no quién asistió. | Estadísticas de uso real sin trabajo manual, y liberación de salas reservadas que nadie ocupa. |
| 📴 **Guías y material sin internet** | Toda la comunidad | El internet falla en los talleres prácticos. | Guías de APA, Mendeley, depósito de tesis y material de taller disponibles sin conexión. |
| 📅 **Citas en el calendario con recordatorios** | Comunidad con cuenta y facilitadores | Las citas olvidadas dejan franjas perdidas. | Cada asesoría, reserva o capacitación queda en el calendario del celular y se actualiza si cambia. |
| 🏷️ **Préstamos con código de barras** *(planeada)* | Personal | Registrar a mano la entrega y devolución de tablets es lento y propenso a errores. | El personal escanea el código del equipo con el celular y el préstamo queda registrado en segundos. |

Las tres primeras fueron aprobadas por la Dirección de la Biblioteca; la cuarta se incorporará más adelante.

> [!IMPORTANT]
> Las funciones plus **no forman parte** de las 28 HU ni de los 103 SP del backlog general. Se estimarán como historias de usuario adicionales del equipo Móvil.

---

## 📅 Planificación

El proyecto general se planifica con **4 iteraciones de 8 días** (Planning Game), del **5 de octubre al 5 de noviembre de 2026**, para un total de **28 historias de usuario y 103 Story Points**. El equipo Móvil sigue el mismo calendario.

### Iteraciones

| # | Iteración | Fechas | HU | Velocidad | En la app |
|:---:|---|---|---|:---:|---|
| 1 | Portal, autenticación y configuración base | 5 – 12 oct | 01, 02, 03, 04, 05, 06, 07, 28 | 26 SP | **Comunidad:** inicio, catálogo, bases de datos, sesión y perfil. **Personal:** contenidos, parámetros y roles. |
| 2 | Espacios, reservas y notificaciones | 13 – 20 oct | 16, 17, 18, 19, 20, 27 | 26 SP | **Comunidad:** disponibilidad y reserva de espacios. **Personal:** bandeja de reservas, espacios y bloqueos. Notificaciones. |
| 3 | Asesorías y préstamo de tablets | 21 – 28 oct | 13, 14, 15, 21, 22, 23, 24 | 26 SP | **Comunidad:** asesorías y tablets. **Personal:** jornadas, agenda del facilitador, inventario, entrega y devolución. |
| 4 | Capacitaciones, seguimiento, estadísticas y Release 1.0 | 29 oct – 5 nov | 08, 09, 10, 11, 12, 25, 26 | 25 SP | **Comunidad:** Mis solicitudes, capacitaciones y autoarchivo. **Personal:** líneas de formación, bandeja de formación y panel del día. |
| | **Total** | **32 días** | **28 HU** | **103 SP** | **Release 1.0: 5 de noviembre de 2026** |

### Estimación

Los Story Points usan la escala de Fibonacci, con **1 SP ≈ 2 horas** de trabajo. Los SP del backlog cubren Backend y Frontend web.

| SP | Horas | Referencia |
|:---:|---|---|
| 1 | ≈ 2 h (≤ 3 h) | Enlace o redirección simple |
| 2 | ≈ 4 h (3,5 – 5 h) | Vista informativa o CRUD en el admin de Django |
| 3 | ≈ 6 h (5,5 – 8 h) | CRUD con validaciones o vista con varios casos |
| 5 | ≈ 10 h (9 – 13 h) | Flujo con estados, calendario o integración externa |
| 8 | ≈ 16 h (14 – 21 h) | Lógica compleja (generación de franjas recurrentes) |

<details>
<summary><b>📋 Backlog completo: 28 historias de usuario</b></summary>

<br/>

Prioridad: 1 = alta, 2 = media, 3 = baja. La columna *En la app* indica en qué vista aparece cada HU en este repositorio.

| HU | Historia | SP | Prioridad | Iteración | En la app |
|---|---|:---:|:---:|:---:|---|
| HU-01 | Consultar servicios del portal | 5 | 1 | 1 | 👥 Comunidad |
| HU-02 | Acceder al catálogo OPAC | 1 | 1 | 1 | 👥 Comunidad |
| HU-03 | Acceder a recursos académicos | 2 | 2 | 1 | 👥 Comunidad (con cuenta) |
| HU-04 | Gestionar contenidos del portal | 5 | 1 | 1 | 🛠️ Personal |
| HU-05 | Iniciar sesión institucional | 5 | 1 | 1 | 👥 Comunidad |
| HU-06 | Gestionar perfil de usuario | 2 | 2 | 1 | 👥 Comunidad (con cuenta) |
| HU-07 | Asignar roles y permisos | 3 | 1 | 1 | 🔁 Transversal |
| HU-08 | Consultar estado de solicitudes | 5 | 2 | 4 | 👥 Comunidad (con cuenta) |
| HU-09 | Gestionar líneas de formación | 2 | 2 | 4 | 🛠️ Personal |
| HU-10 | Solicitar capacitación | 3 | 1 | 4 | 👥 Comunidad (con cuenta) |
| HU-11 | Consultar orientación de autoarchivo | 2 | 2 | 4 | 👥 Comunidad (con cuenta) |
| HU-12 | Gestionar solicitudes de formación | 5 | 1 | 4 | 🛠️ Personal |
| HU-13 | Configurar asesorías y jornadas | 8 | 1 | 3 | 🛠️ Personal |
| HU-14 | Agendar / cancelar asesoría | 5 | 1 | 3 | 👥 Comunidad (con cuenta) |
| HU-15 | Consultar agenda del facilitador | 3 | 2 | 3 | 🛠️ Personal |
| HU-16 | Gestionar espacios | 3 | 1 | 2 | 🛠️ Personal |
| HU-17 | Consultar disponibilidad de espacios | 5 | 1 | 2 | 👥 Comunidad |
| HU-18 | Solicitar reserva de espacio | 5 | 1 | 2 | 👥 Comunidad (con cuenta) |
| HU-19 | Gestionar reservas | 5 | 1 | 2 | 🛠️ Personal |
| HU-20 | Bloquear espacios | 3 | 2 | 2 | 🛠️ Personal |
| HU-21 | Gestionar inventario de tablets | 2 | 1 | 3 | 🛠️ Personal |
| HU-22 | Solicitar préstamo de tablet | 3 | 1 | 3 | 👥 Comunidad (con cuenta) |
| HU-23 | Registrar entrega y devolución | 3 | 1 | 3 | 🛠️ Personal |
| HU-24 | Controlar préstamos vencidos | 2 | 2 | 3 | ⚙️ Backend |
| HU-25 | Registrar información estadística | 3 | 2 | 4 | ⚙️ Backend |
| HU-26 | Consultar y exportar estadísticas | 5 | 3 | 4 | 🛠️ Personal |
| HU-27 | Enviar notificaciones y recordatorios | 5 | 2 | 2 | 🔁 Transversal |
| HU-28 | Configurar parámetros generales | 3 | 1 | 1 | 🛠️ Personal |
| | **Total** | **103** | | | |

**En la app:** 12 HU de la comunidad, 12 del personal y 2 transversales. Las 2 restantes son procesos automáticos del backend cuyos resultados muestra la app.

</details>

---

## 🏗️ Arquitectura

```mermaid
flowchart LR
    APP["📱 App móvil<br/>React Native + Expo"]
    WEB["💻 Portal web<br/>React"]
    API["🐍 API del proyecto<br/>Django"]
    DB[("🗄️ Base de datos")]
    KOHA["📚 Koha<br/>Catálogo OPAC"]
    DSPACE["🗂️ DSpace<br/>Repositorio Institucional"]

    APP -->|HTTPS / JSON| API
    WEB -->|HTTPS / JSON| API
    API --> DB
    APP -.->|enlace| KOHA
    APP -.->|enlace| DSPACE
```

- La app **no tiene base de datos propia**: consume la API del equipo de Backend.
- Las pantallas **no llaman directamente al backend**: toda llamada pasa por `src/api`.
- Koha y DSpace se **enlazan**, no se duplican.

---

## 🛠️ Stack tecnológico

| Pieza | Para qué |
|---|---|
| [Expo](https://expo.dev) SDK 56 (React Native 0.85, React 19.2) | Base del proyecto: un solo código para Android e iOS |
| [Expo Router](https://docs.expo.dev/router/introduction/) | Navegación basada en archivos |
| [React Native Paper](https://callstack.github.io/react-native-paper/) | Componentes visuales con los colores de la UPC |
| [Zustand](https://zustand.docs.pmnd.rs/) | Estado global (sesión del usuario) |
| [TanStack Query](https://tanstack.com/query) | Consumo de la API: carga, errores y caché |
| [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Formularios con validación antes de enviar |
| [react-native-calendars](https://github.com/wix/react-native-calendars) | Vistas semanales y mensuales de disponibilidad (HU-14, HU-17) |
| expo-secure-store | Sesión guardada de forma cifrada |
| expo-notifications | Notificaciones push y recordatorios (HU-27) |
| expo-camera | Escaneo de códigos QR y de barras *(funciones plus)* |
| expo-calendar | Sincronización con el calendario del celular *(función plus)* |
| expo-file-system | Guías y material sin conexión *(función plus)* |

---

## 🚀 Cómo empezar

> [!IMPORTANT]
> Esta sección se completa cuando se inicialice el proyecto de Expo.

### Requisitos

- [Node.js](https://nodejs.org/) LTS (versión 22 o superior)
- [Git](https://git-scm.com/)
- La app **Expo Go** en tu celular, o un emulador de Android o iOS

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/biblioteca-upc-movil.git
cd biblioteca-upc-movil

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env   # y completar la URL de la API

# 4. Iniciar el servidor de desarrollo
npx expo start
```

Escanea el código QR que aparece en la terminal con Expo Go (Android) o con la cámara (iPhone).

---

## 📂 Estructura del proyecto

```
biblioteca-upc-movil/
├── app/                 # Pantallas y rutas (Expo Router)
├── src/
│   ├── api/             # Llamadas al backend (única puerta de salida)
│   ├── components/      # Componentes reutilizables
│   ├── theme/           # Colores, tipografía y espaciado de la UPC
│   ├── store/           # Estado global (Zustand)
│   ├── hooks/           # Hooks personalizados
│   └── utils/           # Utilidades
├── assets/              # Imágenes, íconos y fuentes
├── docs/                # Documentación del proyecto (RF, CU, HU y plan de iteraciones)
└── .github/             # Plantillas de PR e issues, y guardianes (CODEOWNERS)
```

> La estructura detallada se documenta al configurar el entorno de trabajo.

---

## 🤝 Cómo trabajamos

**Ramas**

- **`main`**: versión estable. Solo recibe el Pull Request de cierre de cada iteración, que se fusiona con *merge commit* y se etiqueta (`v0.1.0`, `v0.2.0`…).
- **`develop`**: rama principal del repositorio. Integra el trabajo de la iteración y solo recibe Pull Requests, que se fusionan con *squash*.
- **Ramas de trabajo**: nacen de `develop` actualizado y viven pocos días. Cada HU se trabaja en dos ramas, una por capa: datos (integración) y pantalla (frontend).

| Prefijo | Para qué | Ejemplo |
|---|---|---|
| `feature/` | Una capa de una HU | `feature/hu14-datos-agendar-asesoria`, `feature/hu14-ui-agendar-asesoria` |
| `fix/` | Corregir algo ya fusionado | `fix/hu18-validar-hora-fin` |
| `chore/` | Base, configuración o dependencias | `chore/tema-upc` |
| `docs/` | Documentación | `docs/guia-de-instalacion` |

**Commits y Pull Requests**

- Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/) con la HU como alcance: `feat(hu14): selector de franjas por semana`.
- El título del PR usa el mismo formato, porque se convierte en el commit que queda en `develop`.
- Cada PR enlaza su issue (`Closes #12`), necesita **una aprobación** y no se fusiona con conversaciones abiertas.
- Los cambios en la base compartida (`src/types`, `src/theme`, layouts de navegación, dependencias y configuración) necesitan la aprobación de un guardián (María García o Jorge León), definido en `.github/CODEOWNERS`.

**Ceremonias**

| Ceremonia | Cuándo | Duración |
|---|---|---|
| Planning | Inicio de cada iteración | 1 h |
| Daily | Cada día | 15 min |
| Review / Demo | Cierre de cada iteración | 2 h |
| Retrospectiva | Cierre de cada iteración | 2 h |

---

## 👨‍💻 Equipo

| Integrante | Rol | Pareja | GitHub |
|---|---|---|---|
| María García | Líder del equipo Móvil · Frontend móvil · Guardiana | Comunidad | [@Marysa2006](https://github.com/Marysa2006) |
| Jhon Gómez | Frontend móvil | Personal | [@JhonJ-G](https://github.com/JhonJ-G) |
| Jorge León | Backend / integración móvil · Guardián | Personal | [@PokerProgramming](https://github.com/PokerProgramming) |
| Rigoberto Márquez | Backend / integración móvil | Comunidad | [@RigoMarquez](https://github.com/RigoMarquez) |

Cada pareja construye una vista de la app: **Comunidad** (visitantes, estudiantes, docentes y administrativos) o **Personal** (administración y facilitadores de la biblioteca). Los guardianes aprueban los cambios en la base compartida.

---

## 🙏 Agradecimientos

A la **Dirección de la Biblioteca de la Universidad Popular del Cesar**, por abrirnos las puertas y compartir las necesidades reales de la biblioteca, y al docente de la asignatura **Sistemas de Información**.

---

<div align="center">

**Universidad Popular del Cesar** · Valledupar, Colombia · 2026

<sub>Proyecto académico. Licencia por definir con el docente.</sub>

</div>
