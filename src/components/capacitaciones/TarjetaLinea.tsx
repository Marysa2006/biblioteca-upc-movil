/**
 * Línea de formación en la administración (HU-09): nombre, descripción y estado con texto.
 * Editar y Desactivar o Activar van en el menú de tres puntos, como en Temas de asesoría.
 * Una línea inactiva no se ofrece para solicitar capacitación (HU-10).
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { MenuAcciones } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { LineaFormacion } from '@/types';

type Props = {
  linea: LineaFormacion;
  /** true mientras se activa o desactiva esta línea. */
  cambiando: boolean;
  onEditar: () => void;
  onCambiarEstado: () => void;
};

export function TarjetaLinea({ linea, cambiando, onEditar, onCambiarEstado }: Props) {
  const { activa } = linea;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="titleMedium" style={estilos.nombre}>
          {linea.nombre}
        </Text>
        <View style={[estilos.estado, activa ? estilos.estadoActivo : estilos.estadoInactivo]}>
          <Text variant="labelMedium" style={activa ? estilos.textoActivo : estilos.textoInactivo}>
            {activa ? 'Activa' : 'Inactiva'}
          </Text>
        </View>
        <MenuAcciones
          acciones={[
            {
              titulo: 'Editar',
              icono: 'pencil-outline',
              onPress: onEditar,
              etiqueta: `Editar la línea ${linea.nombre}`,
            },
            {
              titulo: activa ? 'Desactivar' : 'Activar',
              icono: activa ? 'eye-off-outline' : 'eye-outline',
              onPress: onCambiarEstado,
              etiqueta: `${activa ? 'Desactivar' : 'Activar'} la línea ${linea.nombre}`,
            },
          ]}
          descripcion={`Acciones de la línea ${linea.nombre}`}
          ocupado={cambiando}
        />
      </View>
      <Text variant="bodyMedium" style={estilos.secundario}>
        {linea.descripcion}
      </Text>
      <Text variant="bodySmall" style={estilos.secundario}>
        {activa ? 'Se ofrece para solicitar capacitación.' : 'No se ofrece para solicitar capacitación.'}
      </Text>
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
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: espacio.s },
  nombre: { flex: 1, color: colores.texto, fontFamily: fuentes.negrita },
  estado: { paddingHorizontal: espacio.s, paddingVertical: espacio.xs, borderRadius: radio.boton },
  estadoActivo: { backgroundColor: colores.primarioSuave },
  estadoInactivo: { backgroundColor: coloresEstado.cancelada.fondo },
  textoActivo: { color: colores.primarioOscuro },
  textoInactivo: { color: coloresEstado.cancelada.texto },
  secundario: { color: colores.textoSecundario },
});
