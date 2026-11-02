/**
 * Tarjeta de una solicitud de reserva en la bandeja del personal (HU-19), con la disposición
 * del mockup personal-bandeja.png: tipo y estado, qué se pide, quién y cuándo, y las acciones.
 * Las acciones dependen del estado (CA1); lo ya resuelto solo muestra su motivo.
 * No se presiona entera: cada acción es su propio botón.
 */
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { AvisoError, EtiquetaEstado } from '@/components/ui';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { Reserva } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { ACCIONES_POR_ESTADO, NOMBRE_ACCION, type AccionReserva } from '@/utils/reservas';

type Props = {
  reserva: Reserva;
  nombreEspacio: string;
  onAccion: (accion: AccionReserva) => void;
  /** Mientras se guarda una aprobación de esta tarjeta. */
  aprobando: boolean;
  /** Error de la API al aprobar esta tarjeta (CA3: choque de horario). */
  error: string | null;
};

/** Con letra más grande que esto, los botones pasan a la línea siguiente para no cortarse. */
const ESCALA_LETRA_GRANDE = 1.3;

const MODO_BOTON: Record<AccionReserva, 'contained' | 'contained-tonal' | 'outlined'> = {
  aprobar: 'contained',
  nueva_fecha: 'contained-tonal',
  rechazar: 'outlined',
  cancelar: 'outlined',
};

export function TarjetaSolicitud({ reserva, nombreEspacio, onAccion, aprobando, error }: Props) {
  const acciones = ACCIONES_POR_ESTADO[reserva.estado];
  const enUnaFila = useWindowDimensions().fontScale <= ESCALA_LETRA_GRANDE;
  const fecha = fechaLegible(reserva.fecha);
  const horario = `${reserva.horaInicio} – ${reserva.horaFin}`;
  const asistentes = `${reserva.asistentes} ${reserva.asistentes === 1 ? 'asistente' : 'asistentes'}`;

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text variant="labelMedium" style={estilos.tipo}>
          Reserva de espacio
        </Text>
        <EtiquetaEstado estado={reserva.estado} />
      </View>

      <View style={estilos.textos}>
        <Text variant="titleMedium" style={estilos.titulo}>
          {`${nombreEspacio} · ${reserva.proposito}`}
        </Text>
        <Text variant="bodyMedium" style={estilos.secundario}>
          {reserva.solicitante}
        </Text>
      </View>

      <View style={estilos.detalle}>
        <Text variant="bodyMedium" style={estilos.dato}>
          {`${fecha} · ${horario}`}
        </Text>
        <Text variant="bodySmall" style={estilos.secundario}>
          {reserva.requerimientos ? `${asistentes} · ${reserva.requerimientos}` : asistentes}
        </Text>
      </View>

      {reserva.motivo ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Motivo: ${reserva.motivo}`}
        </Text>
      ) : null}

      {error ? <AvisoError mensaje={error} /> : null}

      {acciones.length > 0 ? (
        <View style={estilos.acciones}>
          {acciones.map((accion) => {
            const deRiesgo = accion === 'rechazar' || accion === 'cancelar';
            return (
              <Button
                key={accion}
                mode={MODO_BOTON[accion]}
                onPress={() => onAccion(accion)}
                loading={accion === 'aprobar' && aprobando}
                disabled={aprobando}
                textColor={deRiesgo ? coloresEstado.rechazada.texto : undefined}
                compact
                style={[estilos.boton, enUnaFila && estilos.botonEnFila]}
                contentStyle={estilos.contenidoBoton}
                labelStyle={estilos.textoBoton}
                accessibilityRole="button"
                accessibilityLabel={`${NOMBRE_ACCION[accion]} la reserva de ${reserva.solicitante} del ${fecha}`}
              >
                {NOMBRE_ACCION[accion]}
              </Button>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  // Con letra grande, la etiqueta del estado baja a la línea siguiente.
  encabezado: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacio.s,
  },
  tipo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  textos: { gap: espacio.xs },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  detalle: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  // Los botones se reparten la fila en partes iguales; con letra grande, pasan a la siguiente.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  botonEnFila: { flexBasis: 0 },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { marginHorizontal: espacio.xs, fontFamily: fuentes.seminegrita },
});
