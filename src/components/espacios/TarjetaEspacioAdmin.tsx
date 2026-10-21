/**
 * Espacio en la sección Espacios de Gestión (HU-16): foto, estado, capacidad, horario y acciones.
 * Activo o Inactivo va con texto, no solo color. Desactivar lo quita de las reservas (CA3).
 * Bloquear (HU-20) solo aparece en los espacios activos: uno inactivo no recibe reservas.
 */
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Espacio } from '@/types';

type Props = {
  espacioActual: Espacio;
  /** true mientras se activa o desactiva este espacio. */
  cambiando: boolean;
  onEditar: () => void;
  onCambiarEstado: () => void;
  onBloquear: () => void;
};

export function TarjetaEspacioAdmin({
  espacioActual,
  cambiando,
  onEditar,
  onCambiarEstado,
  onBloquear,
}: Props) {
  const { activo, nombre } = espacioActual;

  return (
    <View style={estilos.tarjeta}>
      {espacioActual.foto ? (
        <Image
          source={{ uri: espacioActual.foto }}
          style={estilos.foto}
          contentFit="cover"
          accessibilityLabel={`Fotografía de ${nombre}`}
        />
      ) : (
        <View style={estilos.sinFoto}>
          <Icon source="office-building-outline" size={32} color={colores.textoSecundario} />
          <Text variant="labelMedium" style={estilos.secundario}>
            Sin fotografía
          </Text>
        </View>
      )}

      <View style={estilos.cuerpo}>
        <View style={estilos.encabezado}>
          <Text variant="titleMedium" style={estilos.nombre}>
            {nombre}
          </Text>
          <View style={[estilos.estado, activo ? estilos.estadoActivo : estilos.estadoInactivo]}>
            <Text
              variant="labelMedium"
              style={activo ? estilos.textoActivo : estilos.textoInactivo}
            >
              {activo ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>

        <Text variant="bodyMedium" style={estilos.secundario} numberOfLines={2}>
          {espacioActual.descripcion}
        </Text>

        <View style={estilos.dato}>
          <Icon source="account-group-outline" size={18} color={colores.textoSecundario} />
          <Text variant="bodyMedium" style={estilos.textoDato}>
            {`Capacidad: ${espacioActual.capacidad} ${espacioActual.capacidad === 1 ? 'persona' : 'personas'}`}
          </Text>
        </View>
        <View style={estilos.dato}>
          <Icon source="clock-outline" size={18} color={colores.textoSecundario} />
          <Text variant="bodyMedium" style={estilos.textoDato}>
            {espacioActual.horario}
          </Text>
        </View>

        <View style={estilos.acciones}>
          <Button
            mode="contained-tonal"
            icon="pencil-outline"
            onPress={onEditar}
            disabled={cambiando}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${nombre}`}
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
            accessibilityLabel={`${activo ? 'Desactivar' : 'Activar'} ${nombre}`}
          >
            {activo ? 'Desactivar' : 'Activar'}
          </Button>
          {activo ? (
            <Button
              mode="outlined"
              icon="lock-outline"
              onPress={onBloquear}
              disabled={cambiando}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Bloquear ${nombre} para un evento institucional`}
            >
              Bloquear
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    overflow: 'hidden',
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  foto: { width: '100%', aspectRatio: 16 / 9 },
  sinFoto: {
    width: '100%',
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espacio.xs,
    backgroundColor: colores.superficieVariante,
  },
  cuerpo: { gap: espacio.s, padding: espacio.m },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  nombre: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  estado: {
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  estadoActivo: { backgroundColor: colores.primarioSuave },
  estadoInactivo: { backgroundColor: coloresEstado.cancelada.fondo },
  textoActivo: { color: colores.primarioOscuro },
  textoInactivo: { color: coloresEstado.cancelada.texto },
  secundario: { color: colores.textoSecundario },
  dato: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  textoDato: { flex: 1, color: colores.texto },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
