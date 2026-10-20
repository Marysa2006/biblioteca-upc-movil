/** Leyenda de los estados del calendario (HU-17, CA2). Se acomoda en varias líneas con letra grande. */
import { StyleSheet, View } from 'react-native';

import { espacio } from '@/theme';
import { ORDEN_ESTADOS_FRANJA } from '@/utils/disponibilidad';

import { EtiquetaFranja } from './EtiquetaFranja';

export function LeyendaDisponibilidad() {
  return (
    <View style={estilos.leyenda} accessibilityLabel="Leyenda: disponible, reservada, bloqueada y no disponible">
      {ORDEN_ESTADOS_FRANJA.map((estado) => (
        <EtiquetaFranja key={estado} estado={estado} />
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
});
