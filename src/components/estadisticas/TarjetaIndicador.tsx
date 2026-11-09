/**
 * Tarjeta de un indicador del tablero (HU-26, CA1), como las del tablero del equipo de Análisis:
 * ícono, título, el valor en grande y un detalle. Va en una cuadrícula de dos columnas que, con
 * letra grande, pasa a una sola. El detalle puede llevar una flecha (sube o baja), siempre con
 * texto que dice lo mismo, para no depender del color.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Props = {
  icono: string;
  titulo: string;
  valor: string;
  detalle: string;
  /** Flecha delante del detalle: 'sube' en verde, 'baja' en rojo. */
  sentido?: 'sube' | 'baja' | 'igual' | null;
};

const FLECHA = { sube: 'arrow-up', baja: 'arrow-down', igual: 'equal' } as const;
const COLOR_SENTIDO = {
  sube: colores.primario,
  baja: colores.error,
  igual: colores.textoSecundario,
};

export function TarjetaIndicador({ icono, titulo, valor, detalle, sentido }: Props) {
  return (
    <View
      style={estilos.tarjeta}
      accessible
      accessibilityLabel={`${titulo}: ${valor}. ${detalle}.`}
    >
      <View style={estilos.icono}>
        <Icon source={icono} size={20} color={colores.primario} />
      </View>
      <Text variant="labelMedium" style={estilos.titulo}>
        {titulo}
      </Text>
      <Text variant="titleLarge" style={estilos.valor}>
        {valor}
      </Text>
      <View style={estilos.filaDetalle}>
        {sentido ? (
          <Icon source={FLECHA[sentido]} size={16} color={COLOR_SENTIDO[sentido]} />
        ) : null}
        <Text
          variant="bodySmall"
          style={[estilos.detalle, sentido ? { color: COLOR_SENTIDO[sentido] } : null]}
        >
          {detalle}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Dos por fila; con letra grande, el contenido crece hacia abajo sin cortarse.
  tarjeta: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  icono: {
    alignSelf: 'flex-start',
    padding: espacio.s,
    marginBottom: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  titulo: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  valor: { color: colores.texto, fontFamily: fuentes.negrita },
  filaDetalle: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  detalle: { flexShrink: 1, color: colores.textoSecundario },
});
