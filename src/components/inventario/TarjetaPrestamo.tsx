/**
 * Préstamo de tablet en Gestión → Préstamos (HU-23): quién, qué tablet, la franja en una línea
 * y la acción que toca. Reservado: Registrar entrega. Entregado o vencido: tiempo restante o
 * retraso (CA4), cómo salió y Registrar devolución. Devuelto: cómo volvió, con retraso y
 * novedades (CA3).
 * Desde la entrega, Constancia abre la constancia del préstamo (versión 1.1, #253).
 * #310: un préstamo apartado no muestra una tablet: se asigna al entregarlo.
 * Rediseño (#310): sin la barra de color de arriba (el estado ya lo dicen la etiqueta y su
 * ícono) y con la franja en una línea en vez de dos recuadros, para que la tarjeta sea corta.
 */
import { StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { EstadoPrestamo, EstadoSolicitud, Prestamo, Tablet } from '@/types';
import {
  diaRelativo,
  duracionLegible,
  franjaDelPrestamo,
  NOMBRE_CONDICION,
  tiempoDelPrestamo,
} from '@/utils/prestamos';

const ESTADO: Record<EstadoPrestamo, { etiqueta: string; color: EstadoSolicitud; icono: string }> =
  {
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
  /** Abre la constancia (#253); solo cuando la tablet ya se entregó. */
  onVerConstancia?: () => void;
};

/** "Bueno · con cargador y funda" o "Bueno · sin accesorios". */
function comoSalio(entrega: Prestamo['entrega']): string | null {
  if (!entrega) return null;
  const accesorios =
    entrega.accesorios.length > 0
      ? `con ${entrega.accesorios.join(', ').toLowerCase()}`
      : 'sin accesorios';
  return `${NOMBRE_CONDICION[entrega.condicion]} · ${accesorios}`;
}

export function TarjetaPrestamo({
  prestamo,
  tablet,
  onEntregar,
  onRecibir,
  onVerConstancia,
}: Props) {
  const estado = ESTADO[prestamo.estado];
  const { fondo, texto } = coloresEstado[estado.color];
  // #310: la tablet de un préstamo apartado es provisional; la de verdad se elige al entregarla.
  let nombreTablet = tablet ? `${tablet.codigo} · ${tablet.modelo}` : 'Tablet sin datos';
  if (prestamo.estado === 'reservado' || prestamo.estado === 'cancelado') {
    nombreTablet = 'La tablet se asigna al entregarla';
  }
  const prestada = prestamo.estado === 'entregado' || prestamo.estado === 'vencido';
  const tiempo = prestada ? tiempoDelPrestamo(prestamo) : null;
  const colorTiempo = tiempo?.tarde
    ? coloresEstado.rechazada.texto
    : coloresEstado.nueva_fecha.texto;
  const { devolucion } = prestamo;
  const verConstancia =
    onVerConstancia && (prestamo.entrega != null || prestamo.estado === 'devuelto');

  return (
    <View style={estilos.tarjeta}>
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
        <Text variant="bodyMedium" style={estilos.dato}>
          {franjaDelPrestamo(prestamo)}
        </Text>
        {tiempo ? (
          <View style={estilos.fila}>
            <Icon
              source={tiempo.tarde ? 'alert-circle-outline' : 'timer-outline'}
              size={16}
              color={colorTiempo}
            />
            <Text variant="labelLarge" style={{ color: colorTiempo }}>
              {tiempo.texto}
            </Text>
          </View>
        ) : null}
      </View>

      {prestada && prestamo.entrega ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {`Salió: ${comoSalio(prestamo.entrega)}`}
        </Text>
      ) : null}

      {devolucion ? (
        <View style={estilos.devolucion}>
          <Text variant="bodySmall" style={estilos.texto}>
            {`Volvió ${diaRelativo(devolucion.fechaHora.split(' ')[0]).toLowerCase()}, ${devolucion.fechaHora.split(' ')[1]} · ${NOMBRE_CONDICION[devolucion.condicion]}`}
            {devolucion.tardia ? (
              <Text variant="bodySmall" style={{ color: coloresEstado.rechazada.texto }}>
                {` · ${duracionLegible(devolucion.retrasoMinutos ?? 0)} tarde`}
              </Text>
            ) : null}
          </Text>
          {devolucion.novedades ? (
            <Text variant="bodySmall" style={estilos.secundario}>
              {`Novedad: ${devolucion.novedades}`}
            </Text>
          ) : null}
        </View>
      ) : null}

      {prestamo.estado === 'reservado' || prestada || verConstancia ? (
        <View style={estilos.acciones}>
          {prestamo.estado === 'reservado' ? (
            <Button
              mode="contained"
              icon="tablet"
              onPress={onEntregar}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Registrar la entrega de una tablet a ${prestamo.solicitante}`}
            >
              Registrar entrega
            </Button>
          ) : null}
          {prestada ? (
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
          {verConstancia ? (
            <Button
              mode="text"
              icon="file-document-outline"
              onPress={onVerConstancia}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Ver la constancia del préstamo de ${nombreTablet} a ${prestamo.solicitante}`}
            >
              Constancia
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: espacio.m },
  textos: { flex: 1, gap: espacio.xs },
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
  // La franja y el tiempo en una línea; con letra grande, el tiempo baja.
  franja: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: espacio.m,
    rowGap: espacio.xs,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: espacio.xs },
  devolucion: {
    gap: espacio.xs,
    padding: espacio.s,
    borderRadius: radio.boton,
    backgroundColor: colores.superficieVariante,
  },
  // La acción y Constancia en una fila; con letra grande, Constancia baja.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: espacio.s },
  contenidoBoton: { paddingVertical: espacio.xs },
});
