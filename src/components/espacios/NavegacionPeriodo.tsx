/**
 * Anterior y siguiente del calendario (HU-17), con el título de la semana o el mes.
 * "Anterior" se desactiva en el periodo actual: no se consulta el pasado.
 */
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

import { colores, espacio, fuentes } from '@/theme';

import type { VistaCalendario } from './SelectorVista';

type Props = {
  vista: VistaCalendario;
  titulo: string;
  puedeAnterior: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
};

export function NavegacionPeriodo({ vista, titulo, puedeAnterior, onAnterior, onSiguiente }: Props) {
  const periodo = vista === 'semana' ? 'Semana' : 'Mes';

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
