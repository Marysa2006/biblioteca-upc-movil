/**
 * Tarjeta de una categoría en la cuadrícula "Servicios ofertados" de Inicio (HU-01).
 * Toda la tarjeta se puede presionar y abre la pestaña Servicios filtrada por la categoría.
 */
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text } from 'react-native-paper';

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
    <Card
      mode="contained"
      onPress={onPress}
      style={[estilos.tarjeta, { borderTopColor: acento }]}
      accessibilityRole="button"
      accessibilityLabel={`${info.nombre}, ${cantidad} ${
        cantidad === 1 ? 'servicio' : 'servicios'
      }. Ver servicios`}
    >
      <Card.Content style={estilos.contenido}>
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
      </Card.Content>
    </Card>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flex: 1,
    backgroundColor: colores.superficie,
    borderRadius: radio.tarjeta,
    borderTopWidth: 4,
  },
  contenido: { flex: 1, gap: espacio.s },
  icono: { alignSelf: 'flex-start' },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  descripcion: { color: colores.textoSecundario },
  // La flecha queda abajo aunque la tarjeta vecina de la fila sea más alta.
  flecha: { marginTop: 'auto', paddingTop: espacio.xs },
});
