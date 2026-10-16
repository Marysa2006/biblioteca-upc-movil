/**
 * Ícono de una categoría de servicio dentro de un recuadro teñido con su acento (HU-01).
 * Es decorativo: el nombre de la categoría siempre va escrito al lado.
 */
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';

import { acentoServicio, colores, espacio, radio } from '@/theme';
import type { CategoriaServicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

/** Opacidad del tinte del acento detrás del ícono. */
const OPACIDAD_TINTE = 0.12;

type Props = {
  categoria: CategoriaServicio;
  tamano?: number;
};

export function IconoCategoria({ categoria, tamano = 28 }: Props) {
  const acento = acentoServicio[categoria];

  return (
    <View
      style={estilos.cuadro}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[StyleSheet.absoluteFill, estilos.tinte, { backgroundColor: acento }]} />
      <Icon source={CATEGORIAS_SERVICIO[categoria].icono} size={tamano} color={acento} />
    </View>
  );
}

const estilos = StyleSheet.create({
  // Base blanca bajo el tinte: el recuadro se distingue también sobre las tarjetas con fondo de color.
  cuadro: {
    backgroundColor: colores.superficie,
    padding: espacio.s,
    borderRadius: radio.boton,
    overflow: 'hidden',
  },
  tinte: { opacity: OPACIDAD_TINTE },
});
