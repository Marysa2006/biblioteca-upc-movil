/**
 * Upecito, la mascota de la Universidad (#222 y #223). Es el único lugar que sabe qué imagen
 * corresponde a cada pose: si un día se quita o se cambia, se hace aquí.
 *
 * Cada pose tiene un significado fijo en la app:
 * - leyendo: la marca (encabezado y login) y los estados vacíos, «todavía no hay nada»;
 * - listo: con el pulgar arriba, la confirmación de una solicitud enviada;
 * - buscando: con la lupa, «no encontramos» o «ya no existe», y las búsquedas sin resultados;
 * - preocupado: los errores al cargar.
 *
 * Es decorativo: el texto de al lado dice lo que pasa, así que el lector de pantalla lo salta.
 * Los zapatos de las poses se igualaron a los de la pose aprobada por la biblioteca (leyendo).
 */
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { tamanoLogo } from '@/theme';

const IMAGENES = {
  leyendo: require('@/assets/images/upecito.png'),
  listo: require('@/assets/images/upecito-pulgar.png'),
  buscando: require('@/assets/images/upecito-lupa.png'),
  preocupado: require('@/assets/images/upecito-preocupado.png'),
} as const;

export type PoseUpecito = keyof typeof IMAGENES;

const ANCHO = {
  /** En la fila de marca del encabezado, junto al nombre de la app. */
  encabezado: tamanoLogo.isotipo,
  /** En el login, los estados vacíos, los errores y las confirmaciones. */
  grande: tamanoLogo.app,
} as const;

type Props = {
  pose?: PoseUpecito;
  tamano?: keyof typeof ANCHO;
};

export function Upecito({ pose = 'leyendo', tamano = 'grande' }: Props) {
  return (
    <View
      style={[estilos.contenedor, { width: ANCHO[tamano] }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Image source={IMAGENES[pose]} style={estilos.imagen} contentFit="contain" />
    </View>
  );
}

const estilos = StyleSheet.create({
  // maxWidth en %: en pantallas angostas o con letra grande, Upecito se encoge en vez de salirse.
  contenedor: { maxWidth: '40%', aspectRatio: 1 },
  imagen: { width: '100%', height: '100%' },
});
