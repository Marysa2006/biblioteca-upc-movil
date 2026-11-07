/**
 * La información de una solicitud en su detalle (HU-08, CA2), según su tipo. Cada sección
 * consulta su propio hook (useMisReservas, useMisCitas, useMisPrestamos o useMisCapacitaciones),
 * que ya trae los datos completos; así no se repite su lógica.
 * - Cita: dentro del plazo (puedeCancelarCita, HU-28) se cancela aquí con confirmación; para
 *   reprogramar, Mis citas de Asesorías.
 * - Capacitación con nueva fecha (HU-12, CA4): se muestra la fecha propuesta y se responde aquí.
 *   Aceptarla la deja Aprobada con esa fecha; "No me sirve" pide confirmación y la deja
 *   Cancelada (responderNuevaFecha). El diálogo recibe todo por props.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from 'react-native-paper';

import { DialogoCancelarCita } from '@/components/asesorias/DialogoCancelarCita';
import { DialogoNoMeSirve } from '@/components/capacitaciones/DialogoNoMeSirve';
import { AvisoError, EstadoCarga, EstadoError } from '@/components/ui';
import { useCancelarCita, useMisCitas } from '@/hooks/useAsesorias';
import { useMisCapacitaciones, useResponderNuevaFecha } from '@/hooks/useCapacitaciones';
import { useParametros } from '@/hooks/useParametros';
import { useMisReservas } from '@/hooks/useReservas';
import { useMisPrestamos } from '@/hooks/useTablets';
import { colores, espacio, fuentes, radio } from '@/theme';
import type { Cita, ResumenSolicitud, SolicitudCapacitacion } from '@/types';
import { citaEnCurso, puedeCancelarCita, textoPlazoCancelacion } from '@/utils/asesorias';
import { fechaCompleta } from '@/utils/calendario';
import { mensajeErrorGuardar } from '@/utils/errores';
import { fechaLegible } from '@/utils/fechas';
import { NOMBRE_MODALIDAD } from '@/utils/jornadas';
import { notaDePrestamo } from '@/utils/solicitudes';

export type Dato = { etiqueta: string; valor?: string | number | null };

export function InfoSolicitud({ solicitud }: { solicitud: ResumenSolicitud }) {
  switch (solicitud.tipo) {
    case 'reserva':
      return <InfoReserva solicitud={solicitud} />;
    case 'cita':
      return <InfoCita solicitud={solicitud} />;
    case 'prestamo':
      return <InfoPrestamo solicitud={solicitud} />;
    case 'capacitacion':
      return <InfoCapacitacion solicitud={solicitud} />;
  }
}

/** Carga, error con reintentar o los datos; si ya no aparece, se queda con el resumen. */
function Estado({
  consulta,
}: {
  consulta: { isPending: boolean; isError: boolean; refetch: () => unknown };
}) {
  if (consulta.isPending) return <EstadoCarga mensaje="Cargando la información…" />;
  if (consulta.isError) {
    return (
      <EstadoError
        mensaje="No pudimos cargar la información de la solicitud."
        onReintentar={() => consulta.refetch()}
      />
    );
  }
  return null;
}

function InfoReserva({ solicitud }: { solicitud: ResumenSolicitud }) {
  const reservas = useMisReservas();
  const reserva = reservas.data?.find((actual) => actual.id === solicitud.id);
  if (!reserva) return <Estado consulta={reservas} />;

  return (
    <ListaDatos
      datos={[
        { etiqueta: 'Espacio', valor: solicitud.titulo },
        { etiqueta: 'Fecha', valor: fechaCompleta(reserva.fecha) },
        { etiqueta: 'Horario', valor: `${reserva.horaInicio} a ${reserva.horaFin}` },
        { etiqueta: 'Propósito', valor: reserva.proposito },
        { etiqueta: 'Asistentes', valor: reserva.asistentes },
        { etiqueta: 'Requerimientos', valor: reserva.requerimientos },
        { etiqueta: 'Motivo', valor: reserva.motivo },
      ]}
    />
  );
}

function InfoCita({ solicitud }: { solicitud: ResumenSolicitud }) {
  const citas = useMisCitas();
  const parametros = useParametros();
  const cancelar = useCancelarCita();
  const [porCancelar, setPorCancelar] = useState<Cita | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  const cita = citas.data?.find((actual) => actual.id === solicitud.id);
  if (!cita) return <Estado consulta={citas} />;

  const horas = parametros.data?.horasMinimasCancelacion;
  const puedeCancelar = horas != null && puedeCancelarCita(cita, horas);
  const fueraDePlazo = horas != null && citaEnCurso(cita) && !puedeCancelar;

  const confirmarCancelar = (actual: Cita) => {
    cancelar.mutate(actual.id, {
      onSuccess: () => {
        setPorCancelar(null);
        setAviso(
          `Cancelaste tu asesoría del ${fechaLegible(actual.fecha)}. La franja quedó libre.`,
        );
      },
    });
  };

  return (
    <>
      {aviso ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {aviso}
          </Text>
        </View>
      ) : null}
      <ListaDatos
        datos={[
          { etiqueta: 'Tema', valor: cita.tema },
          { etiqueta: 'Facilitador', valor: cita.facilitador },
          { etiqueta: 'Fecha', valor: fechaCompleta(cita.fecha) },
          { etiqueta: 'Horario', valor: `${cita.horaInicio} a ${cita.horaFin}` },
          { etiqueta: 'Modalidad', valor: NOMBRE_MODALIDAD[cita.modalidad] },
          { etiqueta: 'Lo que necesitas', valor: cita.necesidad },
          { etiqueta: 'Resultado', valor: cita.resultado },
          { etiqueta: 'Motivo', valor: cita.motivo },
        ]}
      />
      {puedeCancelar ? (
        <View style={estilos.acciones}>
          <Button
            mode="outlined"
            icon="calendar-remove-outline"
            onPress={() => {
              cancelar.reset();
              setPorCancelar(cita);
            }}
            textColor={colores.error}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Cancelar la asesoría de ${cita.tema}`}
          >
            Cancelar cita
          </Button>
          <Button
            mode="text"
            onPress={() => router.push('/asesorias/mis-citas')}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            accessibilityRole="button"
            accessibilityLabel="Reprogramar en Mis citas"
          >
            Reprogramar
          </Button>
        </View>
      ) : null}
      {fueraDePlazo && horas != null ? (
        <Text variant="bodySmall" style={estilos.secundario}>
          {`${textoPlazoCancelacion(horas)} Esta ya no se puede cambiar.`}
        </Text>
      ) : null}

      <DialogoCancelarCita
        cita={porCancelar}
        guardando={cancelar.isPending}
        mensajeError={cancelar.error ? mensajeErrorGuardar(cancelar.error) : null}
        onConfirmar={confirmarCancelar}
        onCerrar={() => setPorCancelar(null)}
      />
    </>
  );
}

function InfoPrestamo({ solicitud }: { solicitud: ResumenSolicitud }) {
  const prestamos = useMisPrestamos();
  const prestamo = prestamos.data?.find((actual) => actual.id === solicitud.id);
  if (!prestamo) return <Estado consulta={prestamos} />;

  const nota = notaDePrestamo(prestamo);

  return (
    <>
      {nota ? (
        <View style={[estilos.aviso, nota.alerta ? estilos.avisoAlerta : null]}>
          {nota.alerta ? (
            <Icon source="alert-circle-outline" size={20} color={colores.error} />
          ) : null}
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {nota.texto}
          </Text>
        </View>
      ) : null}
      <ListaDatos
        datos={[
          { etiqueta: 'Fecha', valor: fechaCompleta(prestamo.fecha) },
          { etiqueta: 'Desde', valor: prestamo.horaInicio },
          { etiqueta: 'Hora límite de devolución', valor: prestamo.horaLimite },
        ]}
      />
    </>
  );
}

function InfoCapacitacion({ solicitud }: { solicitud: ResumenSolicitud }) {
  const capacitaciones = useMisCapacitaciones();
  const responder = useResponderNuevaFecha();
  const [porRechazar, setPorRechazar] = useState<SolicitudCapacitacion | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  const capacitacion = capacitaciones.data?.find((actual) => actual.id === solicitud.id);
  if (!capacitacion) return <Estado consulta={capacitaciones} />;

  const propuesta =
    capacitacion.estado === 'nueva_fecha' && capacitacion.fechaPropuesta
      ? `${fechaCompleta(capacitacion.fechaPropuesta)}${
          capacitacion.horaPropuesta ? ` a las ${capacitacion.horaPropuesta}` : ''
        }`
      : null;

  const aceptar = () => {
    responder.reset();
    responder.mutate(
      { id: capacitacion.id, acepta: true },
      {
        onSuccess: (actualizada) =>
          setAviso(
            `Aceptaste la nueva fecha. Tu capacitación quedó para el ${fechaCompleta(actualizada.fecha)} a las ${actualizada.hora}.`,
          ),
      },
    );
  };

  const confirmarNoMeSirve = () => {
    responder.mutate(
      { id: capacitacion.id, acepta: false },
      {
        onSuccess: () => {
          setPorRechazar(null);
          setAviso('No aceptaste la nueva fecha: la solicitud quedó cancelada.');
        },
      },
    );
  };

  // Aceptar guarda sin diálogo: su error va aquí. El de "No me sirve" va en el diálogo.
  const errorAceptar =
    responder.error && porRechazar == null ? mensajeErrorGuardar(responder.error) : null;

  return (
    <>
      {aviso ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {aviso}
          </Text>
        </View>
      ) : null}
      {propuesta ? (
        <View style={estilos.bloque}>
          <Text variant="labelMedium" style={estilos.textoAviso}>
            Nueva fecha propuesta por la biblioteca
          </Text>
          <Text variant="bodyLarge" style={estilos.fechaPropuesta}>
            {propuesta}
          </Text>
          <Text variant="bodySmall" style={estilos.textoAviso}>
            ¿Te sirve? Si la aceptas, tu capacitación queda aprobada para esa fecha.
          </Text>
          <View style={estilos.respuesta}>
            <View style={estilos.acciones}>
              <Button
                mode="contained"
                onPress={aceptar}
                loading={responder.isPending && porRechazar == null}
                disabled={responder.isPending}
                style={estilos.boton}
                contentStyle={estilos.contenidoBoton}
                labelStyle={estilos.textoBoton}
                accessibilityRole="button"
                accessibilityLabel={`Aceptar la nueva fecha: ${propuesta}`}
              >
                Aceptar la nueva fecha
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  responder.reset();
                  setPorRechazar(capacitacion);
                }}
                disabled={responder.isPending}
                textColor={colores.error}
                style={[estilos.boton, estilos.botonSobreColor]}
                contentStyle={estilos.contenidoBoton}
                labelStyle={estilos.textoBoton}
                accessibilityRole="button"
                accessibilityLabel="No me sirve la nueva fecha"
              >
                No me sirve
              </Button>
            </View>
            {errorAceptar ? <AvisoError mensaje={errorAceptar} /> : null}
          </View>
        </View>
      ) : null}
      <ListaDatos
        datos={[
          { etiqueta: 'Línea de formación', valor: capacitacion.linea },
          { etiqueta: 'Modalidad', valor: NOMBRE_MODALIDAD[capacitacion.modalidad] },
          { etiqueta: 'Fecha solicitada', valor: fechaCompleta(capacitacion.fecha) },
          { etiqueta: 'Hora', valor: capacitacion.hora },
          { etiqueta: 'Grupo', valor: capacitacion.grupo },
          { etiqueta: 'Participantes', valor: capacitacion.participantes },
          { etiqueta: 'Objetivo', valor: capacitacion.objetivo },
          { etiqueta: 'Responsable', valor: capacitacion.responsable },
          { etiqueta: 'Resultado', valor: capacitacion.resultado },
          { etiqueta: 'Motivo', valor: capacitacion.motivo },
        ]}
      />

      <DialogoNoMeSirve
        solicitud={porRechazar}
        propuesta={propuesta}
        guardando={responder.isPending}
        mensajeError={
          responder.error && porRechazar != null ? mensajeErrorGuardar(responder.error) : null
        }
        onConfirmar={confirmarNoMeSirve}
        onCerrar={() => setPorRechazar(null)}
      />
    </>
  );
}

/** Etiqueta arriba y valor abajo: con letra grande nada se corta. Los vacíos no se muestran. */
export function ListaDatos({ datos }: { datos: Dato[] }) {
  return (
    <View style={estilos.datos}>
      {datos
        .filter((dato) => dato.valor != null && dato.valor !== '')
        .map((dato) => (
          <View key={dato.etiqueta} style={estilos.dato}>
            <Text variant="labelMedium" style={estilos.secundario}>
              {dato.etiqueta}
            </Text>
            <Text variant="bodyMedium" style={estilos.valor}>
              {String(dato.valor)}
            </Text>
          </View>
        ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  datos: {
    gap: espacio.m,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  dato: { gap: espacio.xs },
  secundario: { color: colores.textoSecundario },
  valor: { color: colores.texto },
  // Sobre los fondos de color, el texto va en colores.texto (contraste AA).
  aviso: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  avisoAlerta: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.error },
  textoAviso: { flexShrink: 1, color: colores.texto },
  bloque: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  fechaPropuesta: { color: colores.texto, fontFamily: fuentes.seminegrita },
  respuesta: { gap: espacio.s },
  // Los botones se reparten la fila y, con letra grande, pasan a la siguiente.
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  textoBoton: { marginHorizontal: espacio.s, fontFamily: fuentes.seminegrita },
  // Sobre el fondo verde suave, el botón con borde va en blanco para que se distinga.
  botonSobreColor: { backgroundColor: colores.superficie },
});
