/**
 * Tarjeta de una categoría en la cuadrícula "Servicios ofertados" de Inicio (HU-01).
 * Toda la tarjeta se puede presionar: abre el detalle de su único servicio o sus opciones en Servicios.
 *
 * Usa TouchableRipple y no Card con onPress: Card pasa accessibilityRole y accessibilityLabel
 * a su contenedor exterior, no al elemento que se presiona, y no se estira en la fila.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { acentoServicio, colores, espacio, fuentes, radio } from '@/theme';
import type { CategoriaServicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

import { IconoCategoria } from './IconoCategoria';

type Props = {
  categoria: CategoriaServicio;
  cantidad: number;
  onPress: () => void;
};

export function TarjetaCategoria({ categoria, cantidad, onPress }: Props) {
  const acento = acentoServicio[categoria];
  const info = CATEGORIAS_SERVICIO[categoria];

  return (
    <View style={[estilos.tarjeta, { borderTopColor: acento }]}>
      <TouchableRipple
        onPress={onPress}
        style={estilos.presionable}
        accessibilityRole="button"
        accessibilityLabel={
          cantidad === 1
            ? `${info.nombre}. Ver detalle`
            : `${info.nombre}, ${cantidad} servicios. Ver opciones`
        }
      >
        <View style={estilos.contenido}>
          <View style={estilos.icono}>
            <IconoCategoria categoria={categoria} tamano={24} />
          </View>
          <Text variant="titleMedium" style={estilos.nombre}>
            {info.nombre}
          </Text>
          <Text variant="bodyMedium" style={estilos.descripcion} numberOfLines={2}>
            {info.descripcion}
          </Text>
          <View style={estilos.flecha}>
            <Icon source="arrow-right" size={20} color={acento} />
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // flex: 1 reparte el ancho de la fila y estira la tarjeta a la altura de su vecina;
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radio.tarjeta,
    borderTopWidth: 4,
    overflow: 'hidden',
  },
  presionable: { flex: 1 },
  contenido: { flex: 1, gap: espacio.s, padding: espacio.m },
  icono: { alignSelf: 'flex-start' },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  // La flecha queda abajo aunque la tarjeta vecina de la fila sea más alta.
  flecha: { marginTop: 'auto', paddingTop: espacio.xs },
});
