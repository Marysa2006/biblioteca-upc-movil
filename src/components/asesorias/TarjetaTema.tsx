/**
 * Tema de asesoría en la administración (HU-13): nombre, descripción, estado y acciones.
 * Activo o Inactivo va con texto. Un tema inactivo no se ofrece para agendar (HU-14).
 */
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { TemaAsesoria } from '@/types';

type Props = {
  tema: TemaAsesoria;
  /** Jornadas que tiene el tema, para saber si ya se ofrece. */
  jornadas: number;
  /** true mientras se activa o desactiva este tema. */
  cambiando: boolean;
  onEditar: () => void;
  onCambiarEstado: () => void;
};

export function TarjetaTema({ tema, jornadas, cambiando, onEditar, onCambiarEstado }: Props) {
  const { activo } = tema;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.nombre}>
          {tema.nombre}
        </Text>
        <View style={[estilos.estado, activo ? estilos.estadoActivo : estilos.estadoInactivo]}>
          <Text variant="labelMedium" style={activo ? estilos.textoActivo : estilos.textoInactivo}>
            {activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>
      <Text variant="bodyMedium" style={estilos.secundario}>
        {tema.descripcion}
      </Text>
      <Text variant="bodySmall" style={estilos.secundario}>
        {jornadas === 0
          ? 'Sin jornadas: todavía no se puede agendar.'
          : `${jornadas} ${jornadas === 1 ? 'jornada' : 'jornadas'}`}
      </Text>

      <View style={estilos.acciones}>
        <Button
          mode="contained-tonal"
          icon="pencil-outline"
          onPress={onEditar}
          disabled={cambiando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Editar el tema ${tema.nombre}`}
        >
          Editar
        </Button>
        <Button
          mode="outlined"
          icon={activo ? 'eye-off-outline' : 'eye-outline'}
          onPress={onCambiarEstado}
          loading={cambiando}
          disabled={cambiando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`${activo ? 'Desactivar' : 'Activar'} el tema ${tema.nombre}`}
        >
          {activo ? 'Desactivar' : 'Activar'}
        </Button>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  nombre: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  estado: { paddingHorizontal: espacio.s, paddingVertical: espacio.xs, borderRadius: radio.boton },
  estadoActivo: { backgroundColor: colores.primarioSuave },
  estadoInactivo: { backgroundColor: coloresEstado.cancelada.fondo },
  textoActivo: { color: colores.primarioOscuro },
  textoInactivo: { color: coloresEstado.cancelada.texto },
  secundario: { color: colores.textoSecundario },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
