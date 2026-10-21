/** Etiqueta del estado de una franja (HU-17, CA2): ícono y texto, no solo color. */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { espacio, fuentes } from '@/theme';
import type { EstadoFranja } from '@/types';
import { ESTADO_FRANJA } from '@/utils/disponibilidad';

export function EtiquetaFranja({ estado }: { estado: EstadoFranja }) {
  const { etiqueta, icono, fondo, texto } = ESTADO_FRANJA[estado];
  return (
    <View style={[estilos.etiqueta, { backgroundColor: fondo }]}>
      <Icon source={icono} size={16} color={texto} />
      <Text variant="labelMedium" style={[estilos.texto, { color: texto }]}>
        {etiqueta}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: 999,
  },
  texto: { fontFamily: fuentes.seminegrita },
});
