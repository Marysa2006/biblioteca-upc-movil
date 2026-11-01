/**
 * Tarjeta de una fuente en la pestaña Catálogo (Koha, repositorio o recursos en línea):
 * ícono, nombre y qué se encuentra allí. Al tocarla se abre la pantalla de esa fuente.
 *
 * Usa TouchableRipple y no Card con onPress, como TarjetaRecurso.
 */
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';

type Props = {
  icono: ComponentProps<typeof Icon>['source'];
  titulo: string;
  descripcion: string;
  onPress: () => void;
};

export function TarjetaFuente({ icono, titulo, descripcion, onPress }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${descripcion}`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.cuadroIcono}>
            <Icon source={icono} size={28} color={colores.primario} />
          </View>
          <View style={estilos.textos}>
            <Text variant="titleMedium" style={estilos.titulo}>
              {titulo}
            </Text>
            <Text variant="bodyMedium" style={estilos.descripcion}>
              {descripcion}
            </Text>
          </View>
          <Icon source="chevron-right" size={24} color={colores.textoSecundario} />
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { backgroundColor: colores.superficie, borderRadius: radio.tarjeta, overflow: 'hidden' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  cuadroIcono: {
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.primarioSuave,
  },
  textos: { flex: 1, gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
});
