/**
 * Tema visual de la UPC.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 * Colores del manual de identidad UPC 2024 (pp. 19–20). Los marcados como derivados
 * no están en el manual: se sacaron de la paleta oficial para cumplir contraste AA.
 */
import { configureFonts, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import type { CategoriaServicio, EstadoSolicitud } from '@/types';

export const colores = {
  verdeUpc: '#42A542',
  verdeOscuroUpc: '#107B42',
  verdeClaroUpc: '#8CCE6B',
  amarilloUpc: '#FAF800',
  primario: '#107B42',
  primarioOscuro: '#0B5A30', // derivado: encabezado oscuro tipo mockup, estado presionado
  primarioSuave: '#E8F4E8', // derivado: fondos de chips y contenedores
  texto: '#131B2E',
  textoSecundario: '#5B6375',
  fondo: '#F5F8F5',
  superficie: '#FFFFFF',
  superficieVariante: '#EEF2EE',
  borde: '#E1E7E1',
  bordeFuerte: '#7A867A', // campos de texto
  error: '#D4212C', // rojo complementario (p. 20)
  /** @deprecated Usa verdeUpc. */
  institucionalVerde: '#42A542',
  /** @deprecated Usa amarilloUpc. */
  institucionalAmarillo: '#FAF800',
} as const;

/** Color de acento de cada servicio: etiquetas, íconos, bordes y texto (todos ≥ 4.5:1 sobre blanco). */
export const acentoServicio: Record<CategoriaServicio, string> = {
  asesorias: '#2477A4',
  capacitaciones: '#A43AC1',
  espacios: '#337F33',
  tablets: '#D4212C',
  repositorio: '#107B42',
  prestamo: '#1B5E86',
  cultura: '#946622',
};

/** Colores de cada estado de solicitud: fondo de la etiqueta y color del texto (≥ 5.5:1). */
export const coloresEstado: Record<EstadoSolicitud, { fondo: string; texto: string; etiqueta: string }> = {
  pendiente: { fondo: '#FEF3E3', texto: '#825A1E', etiqueta: 'Pendiente' },
  aprobada: { fondo: '#E5F2E5', texto: '#2B6B2B', etiqueta: 'Aprobada' },
  rechazada: { fondo: '#F9E0E1', texto: '#B01B25', etiqueta: 'Rechazada' },
  nueva_fecha: { fondo: '#E2F1FA', texto: '#1E648A', etiqueta: 'Nueva fecha propuesta' },
  cancelada: { fondo: '#ECEDF1', texto: '#5B6375', etiqueta: 'Cancelada' },
  realizada: { fondo: '#DEEDE5', texto: '#0E6A39', etiqueta: 'Realizada' },
};

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
export const radio = { boton: 12, tarjeta: 16 } as const;
/** Ancho de los logos institucionales (el isotipo va entre 32 y 40 px, según CLAUDE.md). */
export const tamanoLogo = { isotipo: 36 } as const;

/**
 * Open Sans (manual UPC 2024, pp. 15–16), cargada en el layout raíz.
 * El peso lo da la familia: Android no aplica fontWeight a fuentes cargadas.
 */
export const fuentes = {
  regular: 'OpenSans_400Regular',
  seminegrita: 'OpenSans_600SemiBold',
  negrita: 'OpenSans_700Bold',
} as const;

const familia = (fontFamily: string) => ({ fontFamily, fontWeight: 'normal' as const });

/** Una entrada por variante de Paper; tamaños e interlineado quedan los de MD3. */
const fuentesPaper = configureFonts({
  config: {
    displayLarge: familia(fuentes.negrita),
    displayMedium: familia(fuentes.negrita),
    displaySmall: familia(fuentes.negrita),
    headlineLarge: familia(fuentes.negrita),
    headlineMedium: familia(fuentes.negrita),
    headlineSmall: familia(fuentes.negrita),
    titleLarge: familia(fuentes.seminegrita),
    titleMedium: familia(fuentes.seminegrita),
    titleSmall: familia(fuentes.seminegrita),
    labelLarge: familia(fuentes.seminegrita),
    labelMedium: familia(fuentes.seminegrita),
    labelSmall: familia(fuentes.seminegrita),
    bodyLarge: familia(fuentes.regular),
    bodyMedium: familia(fuentes.regular),
    bodySmall: familia(fuentes.regular),
  },
});

/**
 * Tema de React Native Paper con los colores de la UPC.
 * Se definen todas las claves de color que usan los componentes: las que quedan por defecto salen moradas.
 */
export const tema: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  // `default` es la que usa <Text> sin variant.
  fonts: { ...fuentesPaper, default: { ...fuentesPaper.default, ...familia(fuentes.regular) } },
  colors: {
    ...MD3LightTheme.colors,
    primary: colores.primario,
    onPrimary: '#FFFFFF',
    primaryContainer: colores.primarioSuave,
    onPrimaryContainer: colores.primarioOscuro,
    secondary: colores.primarioOscuro,
    onSecondary: '#FFFFFF',
    secondaryContainer: colores.primarioSuave,
    onSecondaryContainer: colores.primarioOscuro,
    tertiary: colores.primarioOscuro,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FEFED6',
    onTertiaryContainer: colores.texto,
    background: colores.fondo,
    onBackground: colores.texto,
    surface: colores.superficie,
    onSurface: colores.texto,
    surfaceVariant: colores.superficieVariante,
    onSurfaceVariant: colores.textoSecundario,
    outline: colores.bordeFuerte,
    outlineVariant: colores.borde,
    error: colores.error,
    onError: '#FFFFFF',
    errorContainer: coloresEstado.rechazada.fondo,
    onErrorContainer: coloresEstado.rechazada.texto,
    inversePrimary: colores.verdeClaroUpc,
    elevation: {
      level0: 'transparent',
      level1: '#F3F7F3',
      level2: '#EEF4EE',
      level3: '#E9F1E9',
      level4: '#E7F0E7',
      level5: '#E3EDE3',
    },
  },
};
