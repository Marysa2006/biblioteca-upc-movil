/**
 * Botón flotante de la acción principal de una pantalla o sección ("Nuevo espacio",
 * "Reservar para un tercero"…). Va en el `flotante` de Pantalla, así queda fijo abajo a la
 * derecha mientras se desliza la lista. Arriba de la lista se ve con su texto; al deslizar
 * hacia abajo queda solo el ícono, para no tapar las tarjetas. El cambio de ancho se anima
 * con LinearTransition de Reanimated. El lector siempre dice qué hace.
 *
 * No usa AnimatedFAB de Paper: en Android mide mal el texto y lo deja fuera del botón.
 */
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { colores } from '@/theme';

/** Duración del cambio de ancho, en milisegundos. */
const DURACION_MS = 200;

type Props = {
  icono: string;
  texto: string;
  /** Para el lector de pantalla; si no se da, se usa el texto. */
  etiqueta?: string;
  onPress: () => void;
  /** Con el texto a la vista; false cuando la lista ya se deslizó. */
  extendido: boolean;
};

export function BotonFlotante({ icono, texto, etiqueta, onPress, extendido }: Props) {
  return (
    <Animated.View layout={LinearTransition.duration(DURACION_MS)}>
      <FAB
        icon={icono}
        label={extendido ? texto : undefined}
        onPress={onPress}
        style={estilos.boton}
        color={colores.superficie}
        accessibilityRole="button"
        accessibilityLabel={etiqueta ?? texto}
      />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  boton: { backgroundColor: colores.primario },
});
