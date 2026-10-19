/**
 * Tarjeta de un espacio en la lista de disponibilidad (HU-17): nombre, capacidad, horario y
 * descripción. Toda la tarjeta se puede presionar y abre el calendario del espacio.
 *
 * Usa TouchableRipple y no Card con onPress: Card pasa accessibilityRole y accessibilityLabel
 * a su contenedor exterior, no al elemento que se presiona.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import type { Espacio } from '@/types';

type Props = {
  espacio: Espacio;
  onPress: () => void;
};

export function TarjetaEspacio({ espacio: lugar, onPress }: Props) {
  const capacidad = `Hasta ${lugar.capacidad} ${lugar.capacidad === 1 ? 'persona' : 'personas'}`;

  return (
    <View style={estilos.tarjeta}>
      <TouchableRipple
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${lugar.nombre}. ${capacidad}. ${lugar.horario}. Ver disponibilidad`}
      >
        <View style={estilos.contenido}>
          <View style={estilos.textos}>
            <Text variant="titleMedium" style={estilos.nombre}>
              {lugar.nombre}
            </Text>
            <Text variant="bodyMedium" style={estilos.dato}>
              {capacidad} · {lugar.horario}
            </Text>
            <Text variant="bodySmall" style={estilos.descripcion} numberOfLines={2}>
              {lugar.descripcion}
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
  tarjeta: { borderRadius: radio.tarjeta, overflow: 'hidden', backgroundColor: fondoServicio.espacios },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: espacio.m, padding: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  dato: { color: colores.texto },
  descripcion: { color: colores.textoSecundario },
});
