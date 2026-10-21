/**
 * Un aviso de una solicitud en la pantalla de notificaciones (HU-27, CA1).
 * El no leído va en negrita, con un punto y el texto "Nuevo" (no solo color); al tocarlo se
 * marca como leído. El leído no tiene acción.
 */
import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { Notificacion } from '@/types';
import { fechaLegible } from '@/utils/fechas';

/** '2026-10-17 09:40' → "17 de octubre, 09:40". */
const cuando = (fecha: string) => `${fechaLegible(fecha.slice(0, 10))}, ${fecha.slice(11, 16)}`;

type Props = {
  aviso: Notificacion;
  onMarcarLeida: () => void;
};

export function TarjetaAviso({ aviso, onMarcarLeida }: Props) {
  const nuevo = !aviso.leida;

  const contenido = (
    <View style={estilos.contenido}>
      <View style={estilos.encabezado}>
        {nuevo ? (
          <View style={estilos.nuevo}>
            <View style={estilos.punto} />
            <Text variant="labelMedium" style={estilos.textoNuevo}>
              Nuevo
            </Text>
          </View>
        ) : null}
        <Text variant="bodySmall" style={estilos.fecha}>
          {cuando(aviso.fecha)}
        </Text>
      </View>
      <Text variant="titleSmall" style={nuevo ? estilos.tituloNuevo : estilos.titulo}>
        {aviso.titulo}
      </Text>
      <Text variant="bodyMedium" style={estilos.mensaje}>
        {aviso.mensaje}
      </Text>
    </View>
  );

  if (!nuevo) {
    return (
      <View
        style={estilos.tarjeta}
        accessible
        accessibilityLabel={`${aviso.titulo}. ${aviso.mensaje}. ${cuando(aviso.fecha)}`}
      >
        {contenido}
      </View>
    );
  }

  return (
    <View style={[estilos.tarjeta, estilos.tarjetaNueva]}>
      <TouchableRipple
        onPress={onMarcarLeida}
        accessibilityRole="button"
        accessibilityLabel={`Nuevo. ${aviso.titulo}. ${aviso.mensaje}. ${cuando(aviso.fecha)}. Marcar como leída`}
      >
        {contenido}
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  tarjeta: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  tarjetaNueva: { backgroundColor: colores.primarioSuave },
  contenido: { gap: espacio.xs, padding: espacio.m },
  encabezado: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacio.s },
  nuevo: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  punto: {
    width: espacio.s,
    height: espacio.s,
    borderRadius: espacio.xs,
    backgroundColor: colores.primario,
  },
  textoNuevo: { color: colores.primario, fontFamily: fuentes.negrita },
  fecha: { color: colores.textoSecundario },
  titulo: { color: colores.texto, fontFamily: fuentes.seminegrita },
  tituloNuevo: { color: colores.texto, fontFamily: fuentes.negrita },
  mensaje: { color: colores.texto },
});
