import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { coloresEstado, espacio } from '@/theme';
import type { EstadoSolicitud } from '@/types';

/** Etiqueta de color con el estado de una solicitud. Siempre lleva texto, no solo color. */
export function EtiquetaEstado({ estado }: { estado: EstadoSolicitud }) {
  const { fondo, texto, etiqueta } = coloresEstado[estado];
  return (
    <View style={[estilos.etiqueta, { backgroundColor: fondo }]}>
      <Text variant="labelMedium" style={{ color: texto }}>
        {etiqueta}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    alignSelf: 'flex-start',
    paddingHorizontal: espacio.s + 2,
    paddingVertical: espacio.xs,
    borderRadius: 999,
  },
});
