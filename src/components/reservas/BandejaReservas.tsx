/**
 * Bandeja de solicitudes de reserva del personal (HU-19), en Gestión → Solicitudes.
 * Arriba, un buscador por persona, espacio o propósito; debajo, pestañas por estado con su
 * cantidad (distintas de los chips de las secciones). Cada tarjeta trae las acciones de su estado (CA1).
 * "Reservar para un tercero" es el botón flotante de la sección (BotonReservaTercero).
 * Rechazar y cancelar piden el motivo (CA2); otra fecha pide la fecha y el horario.
 * La API impide los choques de horario (CA3) y su error se muestra donde se tomó la decisión.
 * Al guardar, la lista se refresca y un aviso confirma a quién se notificó (CA4).
 *
 * Patrón de datos: useReservas() / useDecidirReserva() (src/hooks) → src/api/reservas.ts → mock o API.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { Portal, Searchbar, Snackbar } from 'react-native-paper';

import { EstadoCarga, EstadoError, EstadoVacio, PestanasFiltro, type OpcionFiltro } from '@/components/ui';
import { useEspaciosAdministracion } from '@/hooks/useEspacios';
import { useDecidirReserva, useReservas } from '@/hooks/useReservas';
import { colores, coloresEstado, espacio } from '@/theme';
import type { EstadoSolicitud, Reserva } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { avisoDecision, buscarReservas, ORDEN_ESTADOS, type AccionReserva } from '@/utils/reservas';

import { DialogoMotivo, type SolicitudMotivo } from './DialogoMotivo';
import { DialogoOtraFecha } from './DialogoOtraFecha';
import { TarjetaSolicitud } from './TarjetaSolicitud';

/** Tiempo que se ve el aviso de la decisión. */
const DURACION_AVISO_MS = 4000;

type Filtro = EstadoSolicitud | 'todas';

/** Lo que acompaña a una decisión: el motivo (CA2) y, en otra fecha, el nuevo horario. */
type DatosDecision = {
  motivo?: string;
  cambios?: { fecha: string; horaInicio: string; horaFin: string };
};

export function BandejaReservas() {
  const { data: reservas, isPending, isError, refetch } = useReservas('todas');
  const { mutate, isPending: guardando, error, reset } = useDecidirReserva();
  // Todos los espacios, también los inactivos: una reserva vieja puede ser de uno desactivado.
  // Si todavía no cargan, la tarjeta dice "Espacio" y la bandeja no se bloquea.
  const { data: espacios } = useEspaciosAdministracion();
  const nombreEspacio = (espacioId: string) =>
    espacios?.find((e) => e.id === espacioId)?.nombre ?? 'Espacio';

  const [filtroElegido, setFiltroElegido] = useState<Filtro | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [motivo, setMotivo] = useState<SolicitudMotivo | null>(null);
  const [otraFecha, setOtraFecha] = useState<Reserva | null>(null);
  const [aprobando, setAprobando] = useState<string | null>(null);
  const [errorAprobar, setErrorAprobar] = useState<{ id: string; mensaje: string } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // El Snackbar ya trae accessibilityLiveRegion (Android); en iOS el aviso se anuncia aquí.
  useEffect(() => {
    if (Platform.OS === 'ios' && aviso) {
      AccessibilityInfo.announceForAccessibility(aviso);
    }
  }, [aviso]);

  const decidir = (reserva: Reserva, accion: AccionReserva, datos?: DatosDecision) => {
    mutate(
      { id: reserva.id, decision: accion, ...datos },
      {
        onSuccess: () => {
          setMotivo(null);
          setOtraFecha(null);
          setAprobando(null);
          setAviso(avisoDecision(accion, reserva.solicitante));
        },
        onError: (falla) => {
          // Al aprobar no hay diálogo: el error (CA3) va en la tarjeta.
          if (accion === 'aprobar') {
            setAprobando(null);
            setErrorAprobar({ id: reserva.id, mensaje: mensajeErrorGuardar(falla) });
          }
        },
      },
    );
  };

  const alElegirAccion = (reserva: Reserva, accion: AccionReserva) => {
    reset();
    setErrorAprobar(null);
    if (accion === 'aprobar') {
      setAprobando(reserva.id);
      decidir(reserva, 'aprobar');
    } else if (accion === 'nueva_fecha') {
      setOtraFecha(reserva);
    } else {
      setMotivo({ reserva, accion });
    }
  };

  const cerrarDialogos = () => {
    reset();
    setMotivo(null);
    setOtraFecha(null);
  };

  // El error de la API solo se ve en el diálogo abierto; el de aprobar va en su tarjeta.
  const errorDialogo = error && (motivo || otraFecha) ? mensajeErrorGuardar(error) : null;

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando solicitudes…" />;
  } else if (isError) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar las solicitudes." onReintentar={() => refetch()} />
    );
  } else {
    const encontradas = buscarReservas(reservas, busqueda, nombreEspacio);
    const hay = (estado: EstadoSolicitud) => reservas.some((r) => r.estado === estado);
    const cantidad = (estado: EstadoSolicitud) => encontradas.filter((r) => r.estado === estado).length;
    // Las pestañas son los estados que tienen solicitudes; la búsqueda solo cambia los números,
    // así no aparecen ni desaparecen mientras se escribe. "Todas" va al final.
    const opciones: OpcionFiltro<Filtro>[] = [
      ...ORDEN_ESTADOS.filter(hay).map((estado) => ({
        valor: estado,
        etiqueta: coloresEstado[estado].etiqueta,
        cantidad: cantidad(estado),
      })),
      { valor: 'todas', etiqueta: 'Todas', cantidad: encontradas.length },
    ];
    // Empieza en Pendiente; si el estado elegido se queda sin solicitudes, vuelve a "Todas".
    const inicial: Filtro = hay('pendiente') ? 'pendiente' : 'todas';
    const filtro =
      filtroElegido && opciones.some((o) => o.valor === filtroElegido) ? filtroElegido : inicial;
    const visibles = filtro === 'todas' ? encontradas : encontradas.filter((r) => r.estado === filtro);

    let mensajeVacio = 'Todavía no hay solicitudes de reserva.';
    if (busqueda.trim()) mensajeVacio = `Ninguna solicitud coincide con «${busqueda.trim()}».`;
    else if (filtro !== 'todas') mensajeVacio = `No hay solicitudes en estado «${coloresEstado[filtro].etiqueta}».`;

    contenido = (
      <>
        <PestanasFiltro
          opciones={opciones}
          valor={filtro}
          onCambiar={setFiltroElegido}
          descripcion="Filtrar las solicitudes por estado"
        />
        {visibles.length === 0 ? (
          <EstadoVacio mensaje={mensajeVacio} />
        ) : (
          visibles.map((reserva) => (
            <TarjetaSolicitud
              key={reserva.id}
              reserva={reserva}
              nombreEspacio={nombreEspacio(reserva.espacioId)}
              onAccion={(accion) => alElegirAccion(reserva, accion)}
              aprobando={aprobando === reserva.id}
              error={errorAprobar?.id === reserva.id ? errorAprobar.mensaje : null}
            />
          ))
        )}
      </>
    );
  }

  return (
    <View style={estilos.bandeja}>
      <Searchbar
        placeholder="Buscar por persona, espacio o propósito"
        value={busqueda}
        onChangeText={setBusqueda}
        style={estilos.buscador}
        accessibilityLabel="Buscar solicitudes por persona, espacio o propósito"
      />

      {contenido}

      <DialogoMotivo
        solicitud={motivo}
        guardando={guardando}
        mensajeError={errorDialogo}
        onConfirmar={(texto) => motivo && decidir(motivo.reserva, motivo.accion, { motivo: texto })}
        onCerrar={cerrarDialogos}
      />
      <DialogoOtraFecha
        reserva={otraFecha}
        guardando={guardando}
        mensajeError={errorDialogo}
        onConfirmar={({ fecha, horaInicio, horaFin, motivo: texto }) =>
          otraFecha &&
          decidir(otraFecha, 'nueva_fecha', {
            motivo: texto.trim() || undefined,
            cambios: { fecha: fecha.trim(), horaInicio: horaInicio.trim(), horaFin: horaFin.trim() },
          })
        }
        onCerrar={cerrarDialogos}
      />
      <Portal>
        <Snackbar visible={aviso != null} onDismiss={() => setAviso(null)} duration={DURACION_AVISO_MS}>
          {aviso}
        </Snackbar>
      </Portal>
    </View>
  );
}

const estilos = StyleSheet.create({
  bandeja: { gap: espacio.s },
  buscador: { backgroundColor: colores.superficie },
});
