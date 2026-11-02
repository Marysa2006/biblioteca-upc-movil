/**
 * Préstamo de tablet en Inventario → Préstamos (HU-23), como en el mockup: tablet, solicitante,
 * franja y la acción que toca. Reservado: Registrar entrega. Entregado o vencido: salida, hora
 * límite, tiempo restante o retraso (CA4) y Registrar devolución. Devuelto: lo que quedó
 * registrado, con novedades (CA3) y retraso.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { EstadoPrestamo, EstadoSolicitud, Prestamo, Tablet } from '@/types';
import { fechaLegible } from '@/utils/fechas';
import { duracionLegible, fechaHoraLegible, NOMBRE_CONDICION, tiempoDelPrestamo } from '@/utils/prestamos';

const ESTADO: Record<EstadoPrestamo, { etiqueta: string; color: EstadoSolicitud; icono: string }> = {
  reservado: { etiqueta: 'Reservado', color: 'pendiente', icono: 'calendar-clock' },
  entregado: { etiqueta: 'Entregado', color: 'nueva_fecha', icono: 'tablet' },
  vencido: { etiqueta: 'Vencido', color: 'rechazada', icono: 'alert-outline' },
  devuelto: { etiqueta: 'Devuelto', color: 'realizada', icono: 'check-circle-outline' },
  cancelado: { etiqueta: 'Cancelado', color: 'cancelada', icono: 'close-circle-outline' },
};

type Props = {
  prestamo: Prestamo;
  tablet?: Tablet;
  onEntregar: () => void;
  onRecibir: () => void;
};

export function TarjetaPrestamo({ prestamo, tablet, onEntregar, onRecibir }: Props) {
  const estado = ESTADO[prestamo.estado];
  const { fondo, texto } = coloresEstado[estado.color];
  const nombreTablet = tablet ? `${tablet.modelo} · ${tablet.codigo}` : 'Tablet sin datos';
  const tiempo = prestamo.estado === 'entregado' || prestamo.estado === 'vencido' ? tiempoDelPrestamo(prestamo) : null;
  const { devolucion } = prestamo;

  return (
    <View style={[estilos.tarjeta, { borderTopColor: texto }]}>
      <View style={estilos.encabezado}>
        <View style={estilos.textos}>
          <Text variant="titleMedium" style={estilos.titulo}>
            {prestamo.solicitante}
          </Text>
          <Text variant="bodyMedium" style={estilos.secundario}>
            {nombreTablet}
          </Text>
        </View>
        <View style={[estilos.estado, { backgroundColor: fondo }]}>
          <Icon source={estado.icono} size={14} color={texto} />
          <Text variant="labelMedium" style={{ color: texto }}>
            {estado.etiqueta}
          </Text>
        </View>
      </View>

      <View style={estilos.franja}>
        <View style={estilos.celda}>
          <Text variant="labelSmall" style={estilos.secundario}>
            {prestamo.entrega ? 'Salida' : 'Franja'}
          </Text>
          <Text variant="bodyMedium" style={estilos.dato}>
            {prestamo.entrega
              ? fechaHoraLegible(prestamo.entrega.fechaHora)
              : `${fechaLegible(prestamo.fecha)}, ${prestamo.horaInicio}`}
          </Text>
        </View>
        <View style={estilos.celda}>
          <Text variant="labelSmall" style={estilos.secundario}>
            Hora límite
          </Text>
          <Text variant="bodyMedium" style={[estilos.dato, tiempo?.tarde ? { color: coloresEstado.pendiente.texto } : null]}>
            {`${fechaLegible(prestamo.fecha)}, ${prestamo.horaLimite}`}
          </Text>
        </View>
      </View>

      {tiempo ? (
        <View style={estilos.fila}>
          <Icon
            source={tiempo.tarde ? 'alert-circle-outline' : 'timer-outline'}
            size={18}
            color={tiempo.tarde ? coloresEstado.pendiente.texto : coloresEstado.nueva_fecha.texto}
          />
          <Text
            variant="labelLarge"
            style={{ color: tiempo.tarde ? coloresEstado.pendiente.texto : coloresEstado.nueva_fecha.texto }}
          >
            {tiempo.texto}
          </Text>
        </View>
      ) : null}

      {prestamo.entrega && prestamo.estado !== 'devuelto' ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Entregada en estado ${NOMBRE_CONDICION[prestamo.entrega.condicion].toLowerCase()}, con ${prestamo.entrega.accesorios.length > 0 ? prestamo.entrega.accesorios.join(', ') : 'ningún accesorio'}.`}
        </Text>
      ) : null}

      {devolucion ? (
        <View style={estilos.devolucion}>
          <Text variant="bodyMedium" style={estilos.dato}>
            {`Devuelta el ${fechaHoraLegible(devolucion.fechaHora)} · ${NOMBRE_CONDICION[devolucion.condicion]}`}
          </Text>
          {devolucion.tardia ? (
            <Text variant="bodySmall" style={{ color: coloresEstado.pendiente.texto }}>
              {`Con retraso de ${duracionLegible(devolucion.retrasoMinutos ?? 0)}.`}
            </Text>
          ) : null}
          {devolucion.novedades ? (
            <Text variant="bodySmall" style={estilos.texto}>
              {`Novedad: ${devolucion.novedades}`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {prestamo.estado === 'reservado' ? (
        <Button
          mode="contained"
          icon="tablet"
          onPress={onEntregar}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Registrar la entrega de ${nombreTablet} a ${prestamo.solicitante}`}
        >
          Registrar entrega
        </Button>
      ) : null}
      {prestamo.estado === 'entregado' || prestamo.estado === 'vencido' ? (
        <Button
          mode="contained-tonal"
          icon="clipboard-check-outline"
          onPress={onRecibir}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Registrar la devolución de ${nombreTablet} de ${prestamo.solicitante}`}
        >
          Registrar devolución
        </Button>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderTopWidth: 4,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  textos: { flex: 1, gap: 2 },
  titulo: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  texto: { color: colores.texto },
  dato: { color: colores.texto, fontFamily: fuentes.seminegrita },
  estado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.xs,
    paddingHorizontal: espacio.s,
    paddingVertical: espacio.xs,
    borderRadius: radio.boton,
  },
  franja: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  celda: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: 2,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  devolucion: { gap: espacio.xs, padding: espacio.s, borderRadius: radio.boton, backgroundColor: colores.superficieVariante },
  contenidoBoton: { paddingVertical: espacio.xs },
});
