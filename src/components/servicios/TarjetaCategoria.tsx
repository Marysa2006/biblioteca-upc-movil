/**
 * Tarjeta de una categoría en la cuadrícula "Servicios ofertados" de Inicio (HU-01).
 * Toda la tarjeta se puede presionar: abre el detalle de su único servicio o sus opciones en Servicios.
 *
 * Usa TouchableRipple y no Card con onPress: Card pasa accessibilityRole y accessibilityLabel
 * a su contenedor exterior, no al elemento que se presiona, y no se estira en la fila.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fondoServicio, fuentes, radio } from '@/theme';
import type { CategoriaServicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';


type Props = {
  categoria: CategoriaServicio;
  cantidad: number;
  onPress: () => void;
};

export function TarjetaCategoria({ categoria, cantidad, onPress }: Props) {
  const info = CATEGORIAS_SERVICIO[categoria];

  return (
    <View style={[estilos.tarjeta, { backgroundColor: fondoServicio[categoria] }]}>
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
          <Text variant="titleMedium" style={estilos.nombre}>
            {info.nombre}
          </Text>
          <Text variant="bodyMedium" style={estilos.descripcion} numberOfLines={2}>
            {info.descripcion}
          </Text>
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
    borderRadius: radio.tarjeta,
    overflow: 'hidden',
  },
  presionable: { flex: 1 },
  contenido: { flex: 1, gap: espacio.s, padding: espacio.m },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
});
