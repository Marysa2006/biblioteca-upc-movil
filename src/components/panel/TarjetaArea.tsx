/**
 * Una tarjeta de «Resumen de hoy» del Dashboard (#306): el área, su número con lo que significa
 * («3 por revisar»), el detalle y una flecha. Toda la tarjeta lleva a su sección de Gestión.
 * Mismo aspecto que TarjetaIndicador de Estadísticas: dos por fila y crece con la letra grande.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { ResumenArea } from '@/utils/panel';

type Props = {
  resumen: ResumenArea;
  onAbrir: () => void;
};

export function TarjetaArea({ resumen, onAbrir }: Props) {
  const { titulo, icono, valor, unidad, detalle } = resumen;
  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onAbrir}
        style={estilos.toque}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}: ${valor} ${unidad}. ${detalle}. Abrir en Gestión`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.fila}>
            <View style={estilos.icono}>
              <Icon source={icono} size={20} color={colores.primario} />
            </View>
            <Icon source="chevron-right" size={20} color={colores.textoSecundario} />
          </View>
          <Text variant="labelMedium" style={estilos.titulo}>
            {titulo}
          </Text>
          <View style={estilos.valorFila}>
            <Text variant="headlineSmall" style={estilos.valor}>
              {valor}
            </Text>
            <Text variant="bodyMedium" style={estilos.unidad}>
              {unidad}
            </Text>
          </View>
          <Text variant="bodySmall" style={estilos.detalle}>
            {detalle}
          </Text>
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // Dos por fila; overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
    overflow: 'hidden',
  },
  toque: { flexGrow: 1 },
  contenido: { gap: espacio.xs, padding: espacio.m, minHeight: 44 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  icono: {
    padding: espacio.s,
    marginBottom: espacio.xs,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  titulo: { color: colores.textoSecundario, fontFamily: fuentes.seminegrita },
  valorFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: espacio.xs },
  valor: { color: colores.texto, fontFamily: fuentes.negrita },
  unidad: { color: colores.texto },
  detalle: { color: colores.textoSecundario },
});
