/**
 * Los tres estados que toda pantalla con datos debe contemplar: cargando, error y vacío.
 * El error y el vacío llevan a Upecito (#223); el texto sigue diciendo qué pasa.
 */
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import { colores, espacio } from '@/theme';

import { Upecito } from './Upecito';

export function EstadoCarga({ mensaje = 'Cargando…' }: { mensaje?: string }) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator color={colores.primario} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
    </View>
  );
}

type PropsError = {
  mensaje?: string;
  onReintentar?: () => void;
};

export function EstadoError({
  mensaje = 'No pudimos cargar la información.',
  onReintentar,
}: PropsError) {
  return (
    <View style={estilos.contenedor}>
      <Upecito pose="preocupado" />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
      {onReintentar ? (
        <Button mode="outlined" onPress={onReintentar}>
          Reintentar
        </Button>
      ) : null}
    </View>
  );
}

type PropsVacio = {
  mensaje?: string;
  /**
   * `leyendo` (por defecto): todavía no hay nada. `buscando`, con la lupa: «no encontramos»,
   * «ya no existe» o una búsqueda sin resultados.
   */
  pose?: 'leyendo' | 'buscando';
};

export function EstadoVacio({
  mensaje = 'No hay nada para mostrar todavía.',
  pose = 'leyendo',
}: PropsVacio) {
  return (
    <View style={estilos.contenedor}>
      <Upecito pose={pose} />
      <Text variant="bodyMedium" style={estilos.texto}>
        {mensaje}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.s,
    paddingVertical: espacio.xl,
  },
  texto: { color: colores.textoSecundario, textAlign: 'center' },
});
