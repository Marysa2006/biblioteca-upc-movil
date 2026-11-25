/**
 * Detalle de una cita de la agenda (HU-15). Pantalla apilada; se abre desde Gestión → Agenda con
 * ?id, desde y hasta: reutiliza la consulta de la semana de la agenda, así que sale de la caché.
 * - CA2: quién pidió la cita (tipo y programa si se conocen), qué necesita y los datos de la cita.
 * - CA3: si la cita aprobada ya terminó, se registra el resultado o, con confirmación, que la
 *   persona no asistió. Al guardar, la agenda y el detalle se refrescan solos.
 * Solo con el permiso `asesorias`; la administración ve las citas de todos los facilitadores.
 * HU-33: el día de la cita aprobada, "Tomar asistencia" abre el control con QR.
 * #217: la cita pendiente se aprueba o se rechaza con motivo (DialogoRechazarCita). La API solo
 * deja decidir al facilitador de la cita o a la administración.
 * #250: Aprobar abre DialogoAprobarCita, con el facilitador (la administración elige; el
 * facilitador se asigna a sí mismo), la fecha y la hora pedidas y, si es virtual, el enlace. El
 * equipo y los parámetros se piden aquí y van al diálogo por props (regla 13).
 *
 * Patrón de datos: useAgenda() / useAprobarCita() / useRechazarCita() / useRegistrarResultado()
 * / useRegistrarInasistencia() / useEquipo() / useParametros() (src/hooks) → src/api → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { DialogoAprobarCita } from '@/components/agenda/DialogoAprobarCita';
import { DetalleCitaAgenda } from '@/components/agenda/DetalleCitaAgenda';
import { DialogoInasistencia } from '@/components/agenda/DialogoInasistencia';
import { DialogoRechazarCita } from '@/components/agenda/DialogoRechazarCita';
import { usaApi } from '@/api/cliente';
import { FormularioResultado } from '@/components/agenda/FormularioResultado';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import {
  useAgenda,
  useAprobarCita,
  useRechazarCita,
  useCancelarCitaPersonal,
  useRegistrarInasistencia,
  useRegistrarResultado,
} from '@/hooks/useAsesorias';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { useFacilitadores } from '@/hooks/useUsuarios';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import { puedeRegistrarResultado, type FormularioAprobacionCita } from '@/utils/agenda';
import { fechaCompleta } from '@/utils/calendario';
import { puedeTomarAsistencia } from '@/utils/asistencia';
import { mensajeErrorGuardar } from '@/utils/errores';
import { opcionesFacilitador } from '@/utils/roles';

type Parametros = { id: string; desde: string; hasta: string };

const TITULO = 'Detalle de la cita';

export default function DetalleCita() {
  const { tienePermiso } = useRol();

  return (
    <>
      <EncabezadoApilado titulo="Agenda" />
      <Pantalla titulo={TITULO} conEncabezado conTeclado>
        {tienePermiso('asesorias') ? <Detalle /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Detalle() {
  const { id, desde, hasta } = useLocalSearchParams<Parametros>();
  const { esAdministrador, usuario } = useRol();
  const agenda = useAgenda(desde ?? '', hasta ?? '', esAdministrador ? 'todas' : undefined);
  const registrarResultado = useRegistrarResultado();
  const registrarInasistencia = useRegistrarInasistencia();
  const aprobar = useAprobarCita();
  const rechazar = useRechazarCita();
  const cancelar = useCancelarCitaPersonal();
  const [preguntarCancelacion, setPreguntarCancelacion] = useState(false);
  const [preguntarInasistencia, setPreguntarInasistencia] = useState(false);
  const [preguntarRechazo, setPreguntarRechazo] = useState(false);
  const [preguntarAprobacion, setPreguntarAprobacion] = useState(false);
  // Para el diálogo de aprobar (#250): quién puede atenderla y qué días hay atención.
  const equipo = useFacilitadores(esAdministrador);
  const { data: parametros } = useParametros();
  const [aviso, setAviso] = useState<string | null>(null);

  // En Android lo anuncia accessibilityLiveRegion; en iOS se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) AccessibilityInfo.announceForAccessibility(aviso);
  }, [aviso]);

  if (agenda.isPending) return <EstadoCarga mensaje="Cargando la cita…" />;
  if (agenda.isError) {
    return <EstadoError mensaje="No pudimos cargar la cita." onReintentar={() => agenda.refetch()} />;
  }
  const cita = cancelar.data?.id === id ? cancelar.data : agenda.data.find((actual) => actual.id === id);
  if (!cita) {
    return <EstadoVacio pose="buscando" mensaje="No encontramos esta cita en la agenda." />;
  }

  const guardarResultado = (resultado: string) => {
    registrarResultado.mutate(
      { citaId: cita.id, resultado },
      { onSuccess: () => setAviso('Guardamos el resultado de la asesoría.') },
    );
  };

  const abrirInasistencia = () => {
    registrarInasistencia.reset();
    setPreguntarInasistencia(true);
  };

  // #217: mientras se aprueba o se rechaza, los dos botones quedan ocupados (CA3).
  const decidiendo = aprobar.isPending || rechazar.isPending;

  const abrirAprobacion = () => {
    aprobar.reset();
    rechazar.reset();
    setPreguntarAprobacion(true);
  };

  // Revisión de la 1.1: la administración también atiende asesorías (opcionesFacilitador).
  const facilitadores = equipo.data ? opcionesFacilitador(equipo.data) : undefined;

  const confirmarAprobacion = ({ facilitadorId, fecha, hora, enlaceVirtual }: FormularioAprobacionCita) => {
    const enlace = enlaceVirtual.trim();
    aprobar.mutate(
      { id: cita.id, facilitadorId, fecha, hora, ...(enlace ? { enlaceVirtual: enlace } : {}) },
      {
        onSuccess: (aprobada) => {
          setPreguntarAprobacion(false);
          const quien = facilitadorId === usuario?.id ? 'contigo' : `con ${aprobada.facilitador ?? 'el facilitador'}`;
          setAviso(
            `Aprobaste la cita de ${cita.solicitante} para el ${fechaCompleta(aprobada.fecha).toLowerCase()}, ${aprobada.horaInicio}, ${quien}. Le avisamos.`,
          );
        },
      },
    );
  };

  const abrirRechazo = () => {
    aprobar.reset();
    rechazar.reset();
    setPreguntarRechazo(true);
  };

  const confirmarRechazo = (motivo: string) => {
    rechazar.mutate(
      { id: cita.id, motivo },
      {
        onSuccess: () => {
          setPreguntarRechazo(false);
          setAviso(`Rechazaste la cita de ${cita.solicitante}. Le avisamos y el cupo quedó libre.`);
        },
      },
    );
  };

  const confirmarInasistencia = () => {
    registrarInasistencia.mutate(cita.id, {
      onSuccess: () => {
        setPreguntarInasistencia(false);
        setAviso('Registramos que la persona no asistió.');
      },
    });
  };

  return (
    <View style={estilos.contenido}>
      {aviso ? (
        <View style={estilos.aviso} accessibilityLiveRegion="polite">
          <Text variant="bodyMedium" style={estilos.textoAviso}>
            {aviso}
          </Text>
        </View>
      ) : null}

      <DetalleCitaAgenda cita={cita} />
      {['pendiente', 'aprobada'].includes(cita.estado) &&
        (esAdministrador || cita.facilitadorId === usuario?.id || cita.estado === 'pendiente') ? (
          <Button mode="outlined" disabled={decidiendo || cancelar.isPending} onPress={() => {
            cancelar.reset();
            setPreguntarCancelacion(true);
          }}>
            Cancelar cita
          </Button>
        ) : null}

      {cita.estado === 'pendiente' ? (
        <View style={estilos.decision}>
          <Text variant="titleSmall" style={estilos.tituloDecision} accessibilityRole="header">
            Esta cita espera tu aprobación
          </Text>
          <Text variant="bodySmall" style={estilos.textoDecision}>
            La persona recibe un aviso con tu respuesta. Si la rechazas, el cupo queda libre.
          </Text>
          <View style={estilos.botonesDecision}>
            <Button
              mode="contained"
              icon="check"
              onPress={abrirAprobacion}
              loading={aprobar.isPending}
              disabled={decidiendo}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Aprobar la cita de ${cita.solicitante}`}
            >
              Aprobar
            </Button>
            <Button
              mode="outlined"
              icon="close"
              onPress={abrirRechazo}
              disabled={decidiendo}
              textColor={coloresEstado.rechazada.texto}
              style={estilos.botonRechazar}
              contentStyle={estilos.contenidoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Rechazar la cita de ${cita.solicitante}`}
            >
              Rechazar
            </Button>
          </View>
        </View>
      ) : null}

      {(usaApi('asistencia') ? cita.estado === 'aprobada' : puedeTomarAsistencia(cita)) ? (
        <Button
          mode="contained"
          icon="qrcode"
          onPress={() =>
            router.push({ pathname: '/asistencia/[id]', params: { id: cita.id, desde, hasta } })
          }
          style={estilos.tomarAsistencia}
          contentStyle={estilos.contenidoBoton}
          accessibilityRole="button"
          accessibilityLabel={`Tomar la asistencia de la cita de ${cita.solicitante} con un código QR`}
        >
          Tomar asistencia
        </Button>
      ) : null}

      {puedeRegistrarResultado(cita) ? (
        <FormularioResultado
          guardando={registrarResultado.isPending}
          mensajeError={registrarResultado.error ? mensajeErrorGuardar(registrarResultado.error) : null}
          onGuardar={guardarResultado}
          onNoAsistio={abrirInasistencia}
        />
      ) : null}

      <DialogoAprobarCita
        cita={preguntarAprobacion ? cita : null}
        eligeFacilitador={esAdministrador}
        yo={{ id: usuario?.id ?? '', nombre: usuario?.nombre ?? '' }}
        facilitadores={equipo.isError ? null : (facilitadores ?? null)}
        cargandoFacilitadores={equipo.isPending}
        onReintentarFacilitadores={() => equipo.refetch()}
        parametros={parametros}
        guardando={aprobar.isPending}
        mensajeError={aprobar.error ? mensajeErrorGuardar(aprobar.error) : null}
        onConfirmar={confirmarAprobacion}
        onCerrar={() => setPreguntarAprobacion(false)}
      />

      <DialogoRechazarCita
        cita={preguntarRechazo ? cita : null}
        guardando={rechazar.isPending}
        mensajeError={rechazar.error ? mensajeErrorGuardar(rechazar.error) : null}
        onConfirmar={confirmarRechazo}
        onCerrar={() => setPreguntarRechazo(false)}
      />
      <DialogoRechazarCita
        accion="cancelar"
        cita={preguntarCancelacion ? cita : null}
        guardando={cancelar.isPending}
        mensajeError={cancelar.error ? mensajeErrorGuardar(cancelar.error) : null}
        onConfirmar={(motivo) => cancelar.mutate({ id: cita.id, motivo }, { onSuccess: () => {
          setPreguntarCancelacion(false);
          setAviso('Cancelaste la cita. Le avisamos a la persona.');
        } })}
        onCerrar={() => setPreguntarCancelacion(false)}
      />

      <DialogoInasistencia
        cita={preguntarInasistencia ? cita : null}
        guardando={registrarInasistencia.isPending}
        mensajeError={
          registrarInasistencia.error ? mensajeErrorGuardar(registrarInasistencia.error) : null
        }
        onConfirmar={confirmarInasistencia}
        onCerrar={() => setPreguntarInasistencia(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { gap: espacio.m },
  // Sobre el fondo de color, el texto va en colores.texto (contraste AA).
  aviso: { padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.primarioSuave },
  textoAviso: { color: colores.texto },
  tomarAsistencia: { alignSelf: 'flex-start' },
  decision: {
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: coloresEstado.pendiente.fondo,
  },
  // Sobre el fondo de Pendiente, el texto va en su color de estado (contraste AA).
  tituloDecision: { color: coloresEstado.pendiente.texto, fontFamily: fuentes.negrita },
  textoDecision: { color: colores.texto },
  // Con letra grande, Rechazar pasa debajo de Aprobar en vez de cortarse.
  botonesDecision: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  botonRechazar: { borderColor: coloresEstado.rechazada.texto, backgroundColor: colores.superficie },
  contenidoBoton: { paddingVertical: espacio.xs },
});
