/**
 * Una reserva en una lista de reservas afectadas: fecha, franja, solicitante y estado.
 * La usan el diálogo de desactivar (HU-16, CA3) y el bloqueo de espacios (HU-20, CA1).
 * El personal sí ve quién reservó; la comunidad nunca (HU-17, CA3).
 */
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Reserva } from '@/types';
import { fechaLegible } from '@/utils/fechas';

export function FilaReserva({ reserva }: { reserva: Reserva }) {
  const periodo = `${fechaLegible(reserva.fecha)} · ${reserva.horaInicio} a ${reserva.horaFin}`;
  return (
    <View
      style={estilos.reserva}
      accessible
      accessibilityLabel={`${periodo}, ${reserva.solicitante}, ${coloresEstado[reserva.estado].etiqueta}`}
    >
      <Text variant="labelLarge" style={estilos.fecha}>
        {periodo}
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        {reserva.solicitante}
      </Text>
      <EtiquetaEstado estado={reserva.estado} />
    </View>
  );
}

const estilos = StyleSheet.create({
  reserva: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  fecha: { color: colores.texto, fontFamily: fuentes.seminegrita },
  texto: { color: colores.texto },
});
