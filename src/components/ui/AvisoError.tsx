/**
 * Aviso de error dentro de una tarjeta o formulario: texto e ícono, no solo color.
 * Puede llevar una acción debajo (por ejemplo, Reintentar) como children.
 * En Android lo anuncia accessibilityLiveRegion; en iOS, quien lo muestre puede usar
 * AccessibilityInfo.announceForAccessibility.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { coloresEstado, espacio, radio } from '@/theme';

type Props = {
  mensaje: string;
  /** Acción opcional, debajo del mensaje. */
  children?: ReactNode;
};

export function AvisoError({ mensaje, children }: Props) {
  return (
    <View style={estilos.aviso} accessibilityLiveRegion="polite">
      <View style={estilos.fila}>
        <Icon source="alert-circle-outline" size={20} color={coloresEstado.rechazada.texto} />
        <Text variant="bodyMedium" style={estilos.texto}>
          {mensaje}
        </Text>
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.s },
  texto: { flex: 1, color: coloresEstado.rechazada.texto },
});
