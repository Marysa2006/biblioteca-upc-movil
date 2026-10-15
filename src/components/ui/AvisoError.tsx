/**
 * Aviso de error dentro de una tarjeta o formulario: texto e ícono, no solo color.
 * En Android lo anuncia accessibilityLiveRegion; en iOS, quien lo muestre puede usar
 * AccessibilityInfo.announceForAccessibility.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { coloresEstado, espacio, radio } from '@/theme';

export function AvisoError({ mensaje }: { mensaje: string }) {
  return (
    <View style={estilos.aviso} accessibilityLiveRegion="polite">
      <Icon source="alert-circle-outline" size={20} color={coloresEstado.rechazada.texto} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.boton,
    backgroundColor: coloresEstado.rechazada.fondo,
  },
  texto: { flex: 1, color: coloresEstado.rechazada.texto },
});
