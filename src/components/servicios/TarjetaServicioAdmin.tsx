/**
 * Servicio en la administración de contenidos (HU-04): categoría, estado y acciones.
 * Activo o Inactivo va con texto e ícono, no solo color. Desactivar lo oculta a la comunidad (CA2).
 */
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { acentoServicio, colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Servicio } from '@/types';
import { CATEGORIAS_SERVICIO } from '@/utils/servicios';

import { IconoCategoria } from './IconoCategoria';

type Props = {
  servicio: Servicio;
  /** true mientras se activa o desactiva este servicio. */
  cambiando: boolean;
  onEditar: () => void;
  onCambiarEstado: () => void;
};

export function TarjetaServicioAdmin({ servicio, cambiando, onEditar, onCambiarEstado }: Props) {
  const { activo } = servicio;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <IconoCategoria categoria={servicio.categoria} tamano={24} />
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.nombre}>
            {servicio.nombre}
          </Text>
          <Text variant="labelMedium" style={{ color: acentoServicio[servicio.categoria] }}>
            {CATEGORIAS_SERVICIO[servicio.categoria].nombre}
          </Text>
        </View>
        <View style={[estilos.estado, activo ? estilos.estadoActivo : estilos.estadoInactivo]}>
          <Text
            variant="labelMedium"
            style={activo ? estilos.textoActivo : estilos.textoInactivo}
          >
            {activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
      </View>

      <Text variant="bodyMedium" style={estilos.descripcion} numberOfLines={2}>
        {servicio.descripcion}
      </Text>

      <View style={estilos.acciones}>
        <Button
          mode="contained-tonal"
          icon="pencil-outline"
          onPress={onEditar}
          disabled={cambiando}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${servicio.nombre}`}
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
          accessibilityLabel={`${activo ? 'Desactivar' : 'Activar'} ${servicio.nombre}`}
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
  textos: { flex: 1, gap: espacio.xs },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  estadoActivo: { backgroundColor: colores.primarioSuave },
  estadoInactivo: { backgroundColor: coloresEstado.cancelada.fondo },
  textoActivo: { color: colores.primarioOscuro },
  textoInactivo: { color: coloresEstado.cancelada.texto },
  descripcion: { color: colores.textoSecundario },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
