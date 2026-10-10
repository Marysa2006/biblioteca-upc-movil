/**
 * Tema visual de la UPC.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 * Colores tomados del mockup web del proyecto y del catálogo actual de la biblioteca.
 */
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

import type { CategoriaServicio, EstadoSolicitud } from '@/types';

export const colores = {
  primario: '#006139',
  primarioSuave: '#E2F8EB',
  texto: '#131B2E',
  textoSecundario: '#5B6375',
  fondo: '#F9F8FE',
  superficie: '#FFFFFF',
  borde: '#E3E5EE',
  institucionalVerde: '#1CA20F',
  institucionalAmarillo: '#E5BC16',
  error: '#B3261E',
} as const;

/** Color de acento de cada servicio: solo para etiquetas, íconos y bordes. */
export const acentoServicio: Record<CategoriaServicio, string> = {
  asesorias: '#0097B2',
  capacitaciones: '#5B3FD6',
  espacios: '#7A9A00',
  tablets: '#E0562E',
  repositorio: '#006139',
  prestamo: '#1D76DB',
  cultura: '#C2185B',
};

/** Colores de cada estado de solicitud: fondo de la etiqueta y color del texto. */
export const coloresEstado: Record<EstadoSolicitud, { fondo: string; texto: string; etiqueta: string }> = {
  pendiente: { fondo: '#FFF4D6', texto: '#8A5A00', etiqueta: 'Pendiente' },
  aprobada: { fondo: '#E2F8EB', texto: '#006139', etiqueta: 'Aprobada' },
  rechazada: { fondo: '#FDE7E7', texto: '#B3261E', etiqueta: 'Rechazada' },
  nueva_fecha: { fondo: '#E3EEFC', texto: '#1A4F9C', etiqueta: 'Nueva fecha propuesta' },
  cancelada: { fondo: '#ECEDF1', texto: '#5B6375', etiqueta: 'Cancelada' },
  realizada: { fondo: '#D3EFE0', texto: '#00391F', etiqueta: 'Realizada' },
};

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 } as const;
export const radio = { boton: 12, tarjeta: 16 } as const;

/** Tema de React Native Paper con los colores de la UPC. */
export const tema: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colores.primario,
    onPrimary: '#FFFFFF',
    primaryContainer: colores.primarioSuave,
    onPrimaryContainer: '#00391F',
    secondary: colores.institucionalAmarillo,
    onSecondary: colores.texto,
    secondaryContainer: colores.primarioSuave,
    onSecondaryContainer: '#00391F',
    background: colores.fondo,
    surface: colores.superficie,
    surfaceVariant: '#F0F1F6',
    onSurface: colores.texto,
    onSurfaceVariant: colores.textoSecundario,
    outline: colores.borde,
    error: colores.error,
  },
};
