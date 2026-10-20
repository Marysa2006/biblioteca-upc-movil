/**
 * Una franja de una hora en la vista semanal (HU-17): la hora, su estado y el motivo si lo hay.
 * Solo la franja disponible se puede presionar y lleva al formulario de reserva (HU-18).
 * Nunca muestra quién reservó (CA3): solo usa el estado y el motivo.
 */
import { StyleSheet, View } from 'react-native';
import { Icon, Text, TouchableRipple } from 'react-native-paper';

import { colores, espacio, fuentes, radio } from '@/theme';
import type { FranjaDisponibilidad } from '@/types';
import { fechaCompleta } from '@/utils/calendario';
import { ESTADO_FRANJA } from '@/utils/disponibilidad';

import { EtiquetaFranja } from './EtiquetaFranja';

type Props = {
  fecha: string;
  franja: FranjaDisponibilidad;
  onElegir: (franja: FranjaDisponibilidad) => void;
};

export function FilaFranja({ fecha, franja, onElegir }: Props) {
  const horas = `${franja.horaInicio} – ${franja.horaFin}`;
  const disponible = franja.estado === 'disponible';

  const contenido = (
    <View style={estilos.contenido}>
      <View style={estilos.textos}>
        <Text variant="titleSmall" style={estilos.horas}>
          {horas}
        </Text>
        <EtiquetaFranja estado={franja.estado} />
        {franja.motivo ? (
          <Text variant="bodySmall" style={estilos.motivo}>
            {franja.motivo}
          </Text>
        ) : null}
      </View>
      {disponible ? <Icon source="chevron-right" size={24} color={colores.textoSecundario} /> : null}
    </View>
  );

  if (!disponible) {
    const estado = ESTADO_FRANJA[franja.estado].etiqueta;
    return (
      <View
        style={estilos.fila}
        accessible
        accessibilityLabel={`${horas}, ${estado}${franja.motivo ? `: ${franja.motivo}` : ''}`}
      >
        {contenido}
      </View>
    );
  }

  return (
    <View style={estilos.fila}>
      <TouchableRipple
        onPress={() => onElegir(franja)}
        accessibilityRole="button"
        accessibilityLabel={`Disponible. Reservar el ${fechaCompleta(fecha)} de ${franja.horaInicio} a ${franja.horaFin}`}
      >
        {contenido}
      </TouchableRipple>
    </View>
  );
}

const estilos = StyleSheet.create({
  // overflow: 'hidden' recorta el ripple al borde redondeado.
  fila: { borderRadius: radio.tarjeta, backgroundColor: colores.superficie, overflow: 'hidden' },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.m,
    padding: espacio.m,
  },
  textos: { flex: 1, gap: espacio.xs },
  horas: { color: colores.texto, fontFamily: fuentes.seminegrita },
  motivo: { color: colores.textoSecundario },
});
