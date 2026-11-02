/**
 * Mantiene programados los recordatorios de las reservas aprobadas (HU-27, CA2), de las citas de
 * asesoría aprobadas y de recoger o devolver la tablet de cada préstamo (HU-24 y HU-30). No
 * dibuja nada: va en el layout raíz para que funcione aunque la persona no abra Notificaciones.
 *
 * Sincroniza cuando cambian las reservas, las citas o los préstamos (por ejemplo, cuando el
 * personal aprueba una reserva o entrega una tablet, o la persona cancela o reprograma una cita),
 * cuando la app vuelve al frente y cuando se toca "Reintentar". Sin sesión cancela todos: los
 * recordatorios son de cada persona. Si algo falla, registra el error en el store y la tarjeta
 * de Notificaciones lo muestra con "Reintentar" (CA3).
 *
 * Patrón de datos: useMisReservas() / useMisCitas() / useMisPrestamos() / useEspacios() /
 * useParametros() (src/hooks) → src/api.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useMisCitas } from '@/hooks/useAsesorias';
import { useEspacios } from '@/hooks/useEspacios';
import { useParametros } from '@/hooks/useParametros';
import {
  cancelarRecordatorios,
  sincronizarRecordatorios,
  usePermisoRecordatorios,
} from '@/hooks/useRecordatorios';
import { useMisReservas } from '@/hooks/useReservas';
import { useMisPrestamos } from '@/hooks/useTablets';
import { useEstadoRecordatorios } from '@/store/recordatorios';
import { useSesion } from '@/store/sesion';
import { planRecordatorios } from '@/utils/recordatorios';

const ERROR_DATOS = 'no pudimos cargar tus reservas, asesorías y préstamos.';
const ERROR_PROGRAMAR = 'el celular no permitió programarlos.';

export function SincronizarRecordatorios() {
  const usuarioId = useSesion((estado) => estado.usuario?.id);
  const hidratada = useSesion((estado) => estado.hidratada);
  const { estado: permiso } = usePermisoRecordatorios();
  const misReservas = useMisReservas();
  const misCitas = useMisCitas();
  const misPrestamos = useMisPrestamos();
  const { data: espacios } = useEspacios();
  const { data: parametros } = useParametros();
  const intento = useEstadoRecordatorios((estado) => estado.intento);
  const registrarProgramados = useEstadoRecordatorios((estado) => estado.registrarProgramados);
  const registrarError = useEstadoRecordatorios((estado) => estado.registrarError);
  // Sube cada vez que la app vuelve al frente: los recordatorios que ya pasaron salen del plan.
  const [despertar, setDespertar] = useState(0);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (actual) => {
      if (actual === 'active') setDespertar((n) => n + 1);
    });
    return () => suscripcion.remove();
  }, []);

  const { data: reservas, isError: errorReservas, refetch: refetchReservas } = misReservas;
  const { data: citas, isError: errorCitas, refetch: refetchCitas } = misCitas;
  const { data: prestamos, isError: errorPrestamos, refetch: refetchPrestamos } = misPrestamos;

  // "Reintentar" también vuelve a pedir las reservas, las citas o los préstamos que fallaron.
  useEffect(() => {
    if (intento === 0) return;
    if (errorReservas) refetchReservas();
    if (errorCitas) refetchCitas();
    if (errorPrestamos) refetchPrestamos();
  }, [
    intento,
    errorReservas,
    errorCitas,
    errorPrestamos,
    refetchReservas,
    refetchCitas,
    refetchPrestamos,
  ]);

  useEffect(() => {
    // Mientras la sesión guardada no se recupera, usuarioId es undefined: no se cancela nada.
    if (!hidratada) return;
    if (!usuarioId) {
      cancelarRecordatorios().catch(() => undefined);
      return;
    }
    if (errorReservas || errorCitas || errorPrestamos) {
      registrarError(ERROR_DATOS);
      return;
    }
    if (permiso !== 'concedido' || !reservas || !citas || !prestamos || !parametros) return;

    let vigente = true;
    // Citas y préstamos van en el mismo plan: la sincronización cancela lo que no esté en él.
    const plan = planRecordatorios(
      reservas,
      {
        texto: parametros.textoRecordatorio,
        horasCancelacion: parametros.horasMinimasCancelacion,
        nombreEspacio: (id) => espacios?.find((e) => e.id === id)?.nombre ?? 'el espacio reservado',
        ahora: new Date(),
      },
      prestamos,
      citas,
    );
    sincronizarRecordatorios(plan)
      .then((cantidad) => {
        if (vigente) registrarProgramados(cantidad);
      })
      .catch((error: unknown) => {
        // CA3: queda registrado (en la consola y en la tarjeta) y se reintenta después.
        console.warn('[recordatorios] No se pudieron programar los recordatorios', error);
        if (vigente) registrarError(ERROR_PROGRAMAR);
      });
    return () => {
      vigente = false;
    };
  }, [
    hidratada,
    usuarioId,
    permiso,
    reservas,
    citas,
    prestamos,
    espacios,
    parametros,
    errorReservas,
    errorCitas,
    errorPrestamos,
    intento,
    despertar,
    registrarProgramados,
    registrarError,
  ]);

  return null;
}
