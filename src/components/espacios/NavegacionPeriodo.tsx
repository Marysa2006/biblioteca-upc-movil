/**
 * Anterior y siguiente de un calendario (HU-17 y HU-15), con el título del día, la semana o el mes.
 * Quien la usa decide si hay anterior: el calendario de un espacio no consulta el pasado.
 */
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

import { NOMBRE_VISTA, type VistaCalendario } from './SelectorVista';

type Props = {
  vista: VistaCalendario;
  titulo: string;
  puedeAnterior: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
};

export function NavegacionPeriodo({ vista, titulo, puedeAnterior, onAnterior, onSiguiente }: Props) {
  const periodo = NOMBRE_VISTA[vista];

  return (
    <View style={estilos.fila}>
      <IconButton
        icon="chevron-left"
        size={24}
        onPress={onAnterior}
        disabled={!puedeAnterior}
        iconColor={colores.primario}
        accessibilityLabel={`${periodo} anterior`}
      />
      <Text
        variant="titleMedium"
        style={estilos.titulo}
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
      >
        {titulo}
      </Text>
      <IconButton
        icon="chevron-right"
        size={24}
        onPress={onSiguiente}
        iconColor={colores.primario}
        accessibilityLabel={`${periodo} siguiente`}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  titulo: { flex: 1, textAlign: 'center', color: colores.texto, fontFamily: fuentes.seminegrita },
});
