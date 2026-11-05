/**
 * Detalle de una solicitud de capacitación para el personal (HU-12). Pantalla apilada; se abre
 * desde Gestión → Solicitudes → Capacitaciones. Pide el permiso `formacion`.
 * Arriba, quién pide, el estado y el responsable; luego la información completa y el historial
 * como línea de tiempo (HU-08). Las acciones van en una tarjeta flotante abajo (pie de
 * Pantalla), en una fila y sin íconos, y solo aparece si la persona puede hacer algo.
 * - CA1: pendiente o con nueva fecha, se aprueba, se rechaza o se propone otra fecha.
 * - CA2: rechazar exige el motivo.
 * - CA3: aprobada y sin responsable, cualquiera con `formacion` puede tomarla ("Asignarme") y la
 *   administración puede asignarla a quien elija; solo la administración cambia al responsable.
 *   Después de dictarla, la marca como realizada el responsable o la administración, con el
 *   resultado (en la API, cerrarCapacitacion). Queda Realizada y se notifica al usuario.
 *   Las reglas están en src/utils/capacitaciones.ts (puedeTomarCapacitacion y las demás).
 * - CA4: con nueva fecha, un aviso dice que espera la respuesta del usuario, que la acepta en
 *   Mis solicitudes.
 * Los diálogos van en un Portal, fuera del QueryClientProvider: los hooks están en la barra y les
 * llegan los datos y las acciones por props.
 *
 * Patrón de datos: useSolicitudesCapacitacion() / useHistorialSolicitud() y las mutaciones de
 * useCapacitaciones (src/hooks) → src/api → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Button, Icon, Portal, Snackbar, Text } from 'react-native-paper';

import { DialogoFechaCapacitacion } from '@/components/capacitaciones/DialogoFechaCapacitacion';
import {
  DialogoResponsable,
  type OpcionResponsable,
} from '@/components/capacitaciones/DialogoResponsable';
import {
  DialogoTextoCapacitacion,
  type TipoTextoCapacitacion,
} from '@/components/capacitaciones/DialogoTextoCapacitacion';
import { SinPermiso } from '@/components/personal/SinPermiso';
import { ListaDatos } from '@/components/solicitudes/InfoSolicitud';
import { LineaTiempo } from '@/components/solicitudes/LineaTiempo';
import {
  AvisoError,
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  EtiquetaEstado,
  Pantalla,
} from '@/components/ui';
import {
  useAprobarCapacitacion,
  useAsignarResponsable,
  useCerrarCapacitacion,
  useProponerFechaCapacitacion,
  useRechazarCapacitacion,
  useSolicitudesCapacitacion,
} from '@/hooks/useCapacitaciones';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { useHistorialSolicitud } from '@/hooks/useSolicitudes';
import { useUsuarios } from '@/hooks/useUsuarios';
import { colores, coloresEstado, espacio, fuentes, radio } from '@/theme';
import type { SolicitudCapacitacion } from '@/types';
import { fechaCompleta } from '@/utils/calendario';
import {
  ACCIONES_CAPACITACION,
  AVISO_ASIGNARME,
  avisoCapacitacion,
  NOMBRE_ACCION_CAPACITACION,
  nombreModalidad,
  puedeCambiarResponsable,
  puedeMarcarRealizada,
  puedeTomarCapacitacion,
  textoParticipantes,
  type AccionCapacitacion,
} from '@/utils/capacitaciones';
import { mensajeErrorGuardar } from '@/utils/errores';
import { fechaLegible } from '@/utils/fechas';
import { describirRoles, NOMBRE_TIPO, tienePermiso as usuarioTienePermiso } from '@/utils/roles';
import { textoFechaEvento } from '@/utils/solicitudes';

const TITULO = 'Solicitud de capacitación';

/** Tiempo que se ve el aviso de lo guardado. */
const DURACION_AVISO_MS = 4000;

type Dialogo = TipoTextoCapacitacion | 'fecha' | 'responsable';

type Quien = { usuarioId: string | undefined; esAdministrador: boolean };

export default function DetalleCapacitacion() {
  const { tienePermiso } = useRol();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ?? '';

  if (!tienePermiso('formacion')) {
    return (
      <>
        <EncabezadoApilado titulo={TITULO} />
        <Pantalla titulo={TITULO} conEncabezado>
          <SinPermiso />
        </Pantalla>
      </>
    );
  }
  return <Detalle id={id} />;
}

/** Se monta solo con el permiso: así, sin él, no se consulta nada. */
function Detalle({ id }: { id: string }) {
  const { usuario, esAdministrador } = useRol();
  const solicitudes = useSolicitudesCapacitacion('todas');
  const historial = useHistorialSolicitud('capacitacion', id);
  const solicitud = solicitudes.data?.find((actual) => actual.id === id);
  // El aviso vive aquí y no en la barra: la barra se va cuando la solicitud queda resuelta.
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const recargar = () => {
    solicitudes.refetch();
    historial.refetch();
  };

  const botones = solicitud
    ? botonesDe(solicitud, { usuarioId: usuario?.id, esAdministrador })
    : null;
  const conBarra = botones != null && Object.values(botones).some(Boolean);

  let contenido;
  if (solicitudes.isPending) {
    contenido = <EstadoCarga mensaje="Cargando la solicitud…" />;
  } else if (solicitudes.isError) {
    contenido = <EstadoError mensaje="No pudimos cargar la solicitud." onReintentar={recargar} />;
  } else if (!solicitud) {
    contenido = <NoEncontrada />;
  } else {
    contenido = (
      <>
        <Encabezado solicitud={solicitud} usuarioId={usuario?.id} />
        <AvisoNuevaFecha solicitud={solicitud} />
        <ListaDatos datos={datosDe(solicitud)} />

        <View style={estilos.seccion}>
          <Text variant="titleSmall" style={estilos.tituloSeccion} accessibilityRole="header">
            Historial
          </Text>
          {historial.isPending ? (
            <EstadoCarga mensaje="Cargando el historial…" />
          ) : historial.isError ? (
            <EstadoError
              mensaje="No pudimos cargar el historial."
              onReintentar={() => historial.refetch()}
            />
          ) : historial.data.length === 0 ? (
            <EstadoVacio mensaje="Esta solicitud todavía no tiene cambios registrados." />
          ) : (
            <View style={estilos.tarjeta}>
              <LineaTiempo eventos={historial.data} />
            </View>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={solicitud?.linea ?? TITULO}
        conEncabezado
        recarga={{
          recargando: solicitudes.isRefetching || historial.isRefetching,
          onRecargar: recargar,
        }}
        pie={
          solicitud && botones && conBarra ? (
            <BarraAcciones
              solicitud={solicitud}
              botones={botones}
              usuarioId={usuario?.id}
              onAviso={setAviso}
            />
          ) : undefined
        }
      >
        {contenido}
      </Pantalla>
      <Portal>
        <Snackbar
          visible={aviso != null}
          onDismiss={() => setAviso(null)}
          duration={DURACION_AVISO_MS}
        >
          {aviso}
        </Snackbar>
      </Portal>
    </>
  );
}

/** Quién pide, el estado y el responsable; la línea ya va arriba, en Pantalla. */
function Encabezado({
  solicitud,
  usuarioId,
}: {
  solicitud: SolicitudCapacitacion;
  usuarioId: string | undefined;
}) {
  const { solicitante } = solicitud;
  let responsable: string | null = null;
  if (solicitud.responsable) {
    const soyYo = solicitud.responsableId === usuarioId;
    responsable = `Responsable: ${solicitud.responsable}${soyYo ? ' (tú)' : ''}`;
  } else if (solicitud.estado === 'aprobada') {
    responsable = 'Responsable: sin asignar';
  }

  return (
    <View style={estilos.encabezado}>
      <Text variant="labelLarge" style={estilos.tipo}>
        Capacitación
      </Text>
      <Text variant="titleMedium" style={estilos.nombre}>
        {solicitante.nombre}
      </Text>
      <Text variant="bodyMedium" style={estilos.secundario}>
        {solicitante.programa
          ? `${NOMBRE_TIPO[solicitante.tipo]} · ${solicitante.programa}`
          : NOMBRE_TIPO[solicitante.tipo]}
      </Text>
      <Text variant="bodyMedium" style={estilos.texto}>
        {`${fechaLegible(solicitud.fecha)} · ${solicitud.hora} · ${nombreModalidad(solicitud.modalidad)}`}
      </Text>
      {responsable ? (
        <Text variant="bodyMedium" style={estilos.responsable}>
          {responsable}
        </Text>
      ) : null}
      <EtiquetaEstado estado={solicitud.estado} />
    </View>
  );
}

/** Con nueva fecha (CA4): la fecha propuesta y que falta la respuesta del usuario. */
function AvisoNuevaFecha({ solicitud }: { solicitud: SolicitudCapacitacion }) {
  if (solicitud.estado !== 'nueva_fecha' || !solicitud.fechaPropuesta) return null;
  return (
    <View style={estilos.bloque} accessible>
      <Icon source="calendar-clock" size={20} color={colores.texto} />
      <Text variant="bodyMedium" style={estilos.textoBloque}>
        {`Propusiste el ${fechaCompleta(solicitud.fechaPropuesta)}${
          solicitud.horaPropuesta ? ` a las ${solicitud.horaPropuesta}` : ''
        }. Falta que ${solicitud.solicitante.nombre} la acepte en Mis solicitudes.`}
      </Text>
    </View>
  );
}

/**
 * La información completa, con etiqueta arriba y valor abajo; los vacíos no se muestran.
 * El responsable no va aquí: ya está en el encabezado.
 */
function datosDe(solicitud: SolicitudCapacitacion) {
  return [
    { etiqueta: 'Línea de formación', valor: solicitud.linea },
    { etiqueta: 'Modalidad', valor: nombreModalidad(solicitud.modalidad) },
    { etiqueta: 'Fecha solicitada', valor: fechaCompleta(solicitud.fecha) },
    { etiqueta: 'Hora', valor: solicitud.hora },
    { etiqueta: 'Grupo', valor: solicitud.grupo },
    { etiqueta: 'Participantes', valor: textoParticipantes(solicitud.participantes) },
    { etiqueta: 'Objetivo', valor: solicitud.objetivo },
    { etiqueta: 'Resultado', valor: solicitud.resultado },
    { etiqueta: 'Motivo', valor: solicitud.motivo },
    { etiqueta: 'Solicitada el', valor: textoFechaEvento(solicitud.creada) },
  ];
}

type Botones = {
  /** Pendiente o con nueva fecha (CA1): rechazar, otra fecha y aprobar. */
  decidir: boolean;
  /** Aprobada sin responsable, para quien no es administración: tomarla. */
  asignarme: boolean;
  /** Aprobada sin responsable, para la administración: elegir a quién. */
  asignar: boolean;
  /** Aprobada con responsable: solo la administración lo cambia. */
  cambiar: boolean;
  /** Aprobada con responsable: el responsable o la administración. */
  marcar: boolean;
};

function botonesDe(solicitud: SolicitudCapacitacion, quien: Quien): Botones {
  const tomar = puedeTomarCapacitacion(solicitud);
  return {
    decidir: ACCIONES_CAPACITACION[solicitud.estado].includes('aprobar'),
    asignarme: tomar && !quien.esAdministrador,
    asignar: tomar && quien.esAdministrador,
    cambiar: solicitud.responsableId != null && puedeCambiarResponsable(solicitud, quien),
    marcar: puedeMarcarRealizada(solicitud, quien),
  };
}

/**
 * La tarjeta de abajo con lo que la persona puede hacer (CA1 y CA3), y sus diálogos. La acción
 * principal va primero. Aprobar y Asignarme guardan sin diálogo, así que su error va en la
 * tarjeta; los demás, en su diálogo.
 */
function BarraAcciones({
  solicitud,
  botones,
  usuarioId,
  onAviso,
}: {
  solicitud: SolicitudCapacitacion;
  botones: Botones;
  usuarioId: string | undefined;
  onAviso: (aviso: string) => void;
}) {
  const parametros = useParametros();
  const usuarios = useUsuarios();
  const aprobar = useAprobarCapacitacion();
  const rechazar = useRechazarCapacitacion();
  const proponer = useProponerFechaCapacitacion();
  const asignar = useAsignarResponsable();
  const cerrar = useCerrarCapacitacion();

  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  const mutaciones = { rechazar, cerrar, fecha: proponer, responsable: asignar };
  const enDialogo = dialogo ? mutaciones[dialogo] : null;
  const errorDialogo = enDialogo?.error ? mensajeErrorGuardar(enDialogo.error) : null;
  const errorBarra = aprobar.error ?? (dialogo == null ? asignar.error : null);

  const listo = (aviso: string) => () => {
    setDialogo(null);
    onAviso(aviso);
  };

  const limpiar = () => {
    aprobar.reset();
    asignar.reset();
  };

  const abrir = (accion: AccionCapacitacion) => {
    limpiar();
    if (accion === 'aprobar') {
      aprobar.mutate(solicitud.id, { onSuccess: listo(avisoCapacitacion('aprobar', solicitud)) });
      return;
    }
    const cual: Dialogo = accion === 'nueva_fecha' ? 'fecha' : accion;
    mutaciones[cual].reset();
    setDialogo(cual);
  };

  const asignarme = () => {
    if (!usuarioId) return;
    limpiar();
    asignar.mutate({ id: solicitud.id, usuarioId }, { onSuccess: listo(AVISO_ASIGNARME) });
  };

  // Personal con el permiso de capacitaciones, para elegir el responsable (CA3).
  const opciones: OpcionResponsable[] | null = usuarios.data
    ? usuarios.data
        .filter((usuario) => usuarioTienePermiso(usuario, 'formacion'))
        .map((usuario) => ({
          id: usuario.id,
          nombre: usuario.nombre,
          roles: describirRoles(usuario),
        }))
    : null;

  const ocupado = aprobar.isPending || (asignar.isPending && dialogo == null);
  const persona = solicitud.solicitante.nombre;

  return (
    <View style={estilos.barra}>
      {errorBarra ? <AvisoError mensaje={mensajeErrorGuardar(errorBarra)} /> : null}

      {/* Pendiente o con nueva fecha (CA1): la principal primero. */}
      {botones.decidir ? (
        <View style={estilos.fila}>
          <Button
            mode="contained"
            onPress={() => abrir('aprobar')}
            loading={aprobar.isPending}
            disabled={ocupado}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Aprobar la solicitud de ${persona}`}
          >
            {NOMBRE_ACCION_CAPACITACION.aprobar}
          </Button>
          <Button
            mode="contained-tonal"
            onPress={() => abrir('nueva_fecha')}
            disabled={ocupado || !parametros.data}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Proponer otra fecha a ${persona}`}
          >
            {NOMBRE_ACCION_CAPACITACION.nueva_fecha}
          </Button>
          <Button
            mode="outlined"
            onPress={() => abrir('rechazar')}
            disabled={ocupado}
            textColor={coloresEstado.rechazada.texto}
            style={estilos.boton}
            contentStyle={estilos.contenidoBoton}
            labelStyle={estilos.textoBoton}
            accessibilityRole="button"
            accessibilityLabel={`Rechazar la solicitud de ${persona}`}
          >
            {NOMBRE_ACCION_CAPACITACION.rechazar}
          </Button>
        </View>
      ) : null}

      {/* Aprobada (CA3): tomarla o asignarla si no tiene responsable; si lo tiene, marcarla como
          realizada (responsable o administración) y cambiarlo (solo administración). */}
      {botones.asignarme || botones.asignar || botones.marcar || botones.cambiar ? (
        <View style={estilos.fila}>
          {botones.asignarme ? (
            <Button
              mode="contained"
              onPress={asignarme}
              loading={asignar.isPending && dialogo == null}
              disabled={ocupado}
              style={estilos.boton}
              contentStyle={estilos.contenidoBoton}
              labelStyle={estilos.textoBoton}
              accessibilityRole="button"
              accessibilityLabel="Asignarme como responsable de esta capacitación"
            >
              Asignarme
            </Button>
          ) : null}
          {botones.asignar ? (
            <Button
              mode="contained"
              onPress={() => abrir('responsable')}
              disabled={ocupado}
              style={estilos.boton}
              contentStyle={estilos.contenidoBoton}
              labelStyle={estilos.textoBoton}
              accessibilityRole="button"
              accessibilityLabel="Asignar el responsable de esta capacitación"
            >
              {NOMBRE_ACCION_CAPACITACION.responsable}
            </Button>
          ) : null}
          {botones.marcar ? (
            <Button
              mode="contained"
              onPress={() => abrir('cerrar')}
              disabled={ocupado}
              style={estilos.boton}
              contentStyle={estilos.contenidoBoton}
              labelStyle={estilos.textoBoton}
              accessibilityRole="button"
              accessibilityLabel="Marcar como realizada y registrar el resultado"
              accessibilityHint="Hazlo después de dictar la capacitación"
            >
              {NOMBRE_ACCION_CAPACITACION.cerrar}
            </Button>
          ) : null}

          {botones.cambiar ? (
            <Button
              mode="outlined"
              onPress={() => abrir('responsable')}
              disabled={ocupado}
              style={estilos.boton}
              contentStyle={estilos.contenidoBoton}
              labelStyle={estilos.textoBoton}
              accessibilityRole="button"
              accessibilityLabel={`Cambiar el responsable. Ahora es ${solicitud.responsable ?? 'nadie'}`}
            >
              Cambiar responsable
            </Button>
          ) : null}
        </View>
      ) : null}

      <DialogoTextoCapacitacion
        tipo={dialogo === 'rechazar' || dialogo === 'cerrar' ? dialogo : null}
        solicitud={solicitud}
        guardando={rechazar.isPending || cerrar.isPending}
        mensajeError={errorDialogo}
        onConfirmar={(texto) =>
          dialogo === 'rechazar'
            ? rechazar.mutate(
                { id: solicitud.id, motivo: texto },
                { onSuccess: listo(avisoCapacitacion('rechazar', solicitud)) },
              )
            : cerrar.mutate(
                { id: solicitud.id, resultado: texto },
                { onSuccess: listo(avisoCapacitacion('cerrar', solicitud)) },
              )
        }
        onCerrar={() => setDialogo(null)}
      />
      {parametros.data ? (
        <DialogoFechaCapacitacion
          visible={dialogo === 'fecha'}
          solicitud={solicitud}
          parametros={parametros.data}
          guardando={proponer.isPending}
          mensajeError={errorDialogo}
          onConfirmar={({ fecha, hora }) =>
            proponer.mutate(
              { id: solicitud.id, fecha, hora },
              { onSuccess: listo(avisoCapacitacion('nueva_fecha', solicitud)) },
            )
          }
          onCerrar={() => setDialogo(null)}
        />
      ) : null}
      <DialogoResponsable
        visible={dialogo === 'responsable'}
        solicitud={solicitud}
        opciones={opciones}
        cargando={usuarios.isPending}
        errorCarga={usuarios.isError}
        onReintentar={() => usuarios.refetch()}
        guardando={asignar.isPending}
        mensajeError={errorDialogo}
        onConfirmar={(elegida) =>
          asignar.mutate(
            { id: solicitud.id, usuarioId: elegida.id },
            { onSuccess: listo(avisoCapacitacion('responsable', solicitud, elegida.nombre)) },
          )
        }
        onCerrar={() => setDialogo(null)}
      />
    </View>
  );
}

function NoEncontrada() {
  const volver = () => (router.canGoBack() ? router.back() : router.replace('/gestion'));

  return (
    <View style={estilos.noEncontrada}>
      <EstadoVacio mensaje="No encontramos esta solicitud de capacitación. Puede que ya no exista." />
      <Button
        mode="outlined"
        onPress={volver}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Volver a Gestión"
      >
        Volver a Gestión
      </Button>
    </View>
  );
}

const estilos = StyleSheet.create({
  encabezado: {
    gap: espacio.xs,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.superficie,
  },
  tipo: { color: colores.primario, fontFamily: fuentes.seminegrita },
  nombre: { color: colores.texto, fontFamily: fuentes.negrita },
  secundario: { color: colores.textoSecundario },
  texto: { color: colores.texto },
  responsable: { color: colores.texto, fontFamily: fuentes.seminegrita },
  // Sobre los fondos de color, el texto va en colores.texto (contraste AA).
  bloque: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espacio.s,
    padding: espacio.m,
    borderRadius: radio.tarjeta,
    backgroundColor: colores.primarioSuave,
  },
  textoBloque: { flexShrink: 1, color: colores.texto },
  barra: { gap: espacio.s },
  // Los botones van en una fila y se reparten el ancho; si no caben (letra grande), bajan a la
  // siguiente línea en vez de cortarse.
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.s },
  boton: { flexGrow: 1 },
  contenidoBoton: { paddingVertical: espacio.xs },
  // Paper deja mucho margen a los lados del texto: con menos, caben los tres en la fila.
  textoBoton: { marginHorizontal: espacio.s, fontFamily: fuentes.seminegrita },
  seccion: { gap: espacio.s },
  tituloSeccion: { color: colores.texto, fontFamily: fuentes.seminegrita },
  tarjeta: { padding: espacio.m, borderRadius: radio.tarjeta, backgroundColor: colores.superficie },
  noEncontrada: { gap: espacio.m },
});
