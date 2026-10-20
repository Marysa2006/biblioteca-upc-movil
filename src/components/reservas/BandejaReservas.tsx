/**
 * Bandeja de solicitudes de reserva del personal (HU-19), en Gestión → Solicitudes.
 * Chips por estado con su cantidad; cada tarjeta trae las acciones de su estado (CA1).
 * Rechazar y cancelar piden el motivo (CA2); otra fecha pide la fecha y el horario.
 * La API impide los choques de horario (CA3) y su error se muestra donde se tomó la decisión.
 * Al guardar, la lista se refresca y un aviso confirma a quién se notificó (CA4).
 *
 * Patrón de datos: useReservas() / useDecidirReserva() (src/hooks) → src/api/reservas.ts → mock o API.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Portal, Snackbar } from 'react-native-paper';

import { ChipsFiltro, EstadoCarga, EstadoError, EstadoVacio, type OpcionFiltro } from '@/components/ui';
import { useEspaciosAdministracion } from '@/hooks/useEspacios';
import { useDecidirReserva, useReservas } from '@/hooks/useReservas';
import { coloresEstado, espacio } from '@/theme';
import type { EstadoSolicitud, Reserva } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { avisoDecision, ORDEN_ESTADOS, type AccionReserva } from '@/utils/reservas';

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
    const cantidad = (estado: EstadoSolicitud) => reservas.filter((r) => r.estado === estado).length;
    const opciones: OpcionFiltro<Filtro>[] = [
      { valor: 'todas', etiqueta: 'Todas', cantidad: reservas.length },
      ...ORDEN_ESTADOS.map((estado) => ({
        valor: estado,
        etiqueta: coloresEstado[estado].etiqueta,
        cantidad: cantidad(estado),
      })).filter((opcion) => opcion.cantidad > 0),
    ];
    // Empieza en Pendiente; si el estado elegido se queda sin solicitudes, vuelve a "Todas".
    const inicial: Filtro = cantidad('pendiente') > 0 ? 'pendiente' : 'todas';
    const filtro =
      filtroElegido && opciones.some((o) => o.valor === filtroElegido) ? filtroElegido : inicial;
    const visibles = filtro === 'todas' ? reservas : reservas.filter((r) => r.estado === filtro);

    contenido = (
      <>
        <ChipsFiltro
          opciones={opciones}
          valor={filtro}
          onCambiar={setFiltroElegido}
          descripcion="Filtrar las solicitudes por estado"
        />
        {visibles.length === 0 ? (
          <EstadoVacio
            mensaje={
              filtro === 'todas'
                ? 'Todavía no hay solicitudes de reserva.'
                : `No hay solicitudes en estado «${coloresEstado[filtro].etiqueta}».`
            }
          />
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
      <Button
        mode="contained-tonal"
        icon="account-plus-outline"
        onPress={() => router.push('/reservas/tercero')}
        style={estilos.botonTercero}
        contentStyle={estilos.contenidoBoton}
        accessibilityRole="button"
        accessibilityLabel="Reservar un espacio para un tercero"
      >
        Reservar para un tercero
      </Button>

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
  botonTercero: { alignSelf: 'flex-start' },
  contenidoBoton: { paddingVertical: espacio.xs },
});
