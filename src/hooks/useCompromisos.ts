/**
 * Compromisos del usuario de la sesión para "Mi calendario" (HU-30): reservas y citas
 * aprobadas y préstamos de tablet reservados, entregados o vencidos, en una sola lista.
 * Se refresca solo: agendar, cancelar, aprobar, entregar o devolver invalidan las consultas
 * de las que sale.
 *
 *   const { data: compromisos, isPending, isError, refetch } = useMisCompromisos();
 */
import { useMemo } from 'react';

import { useMisCitas } from '@/hooks/useAsesorias';
import { useEspacios } from '@/hooks/useEspacios';
import { useMisReservas } from '@/hooks/useReservas';
import { useMisPrestamos } from '@/hooks/useTablets';
import { useSesion } from '@/store/sesion';
import { construirCompromisos, type Compromiso } from '@/utils/compromisos';

/** Para que la pantalla de HU-30 (María) tipe el calendario sin importar de src/utils. */
export type { Compromiso, TipoCompromiso } from '@/utils/compromisos';

export function useMisCompromisos(): {
  data: Compromiso[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
} {
  const usuario = useSesion((estado) => estado.usuario);
  const reservas = useMisReservas();
  const citas = useMisCitas();
  const prestamos = useMisPrestamos();
  // Solo para el nombre del espacio: si falta, el compromiso usa un texto genérico.
  const espacios = useEspacios();

  const data = useMemo(
    () =>
      construirCompromisos({
        reservas: reservas.data ?? [],
        citas: citas.data ?? [],
        prestamos: prestamos.data ?? [],
        espacios: espacios.data ?? [],
      }),
    [reservas.data, citas.data, prestamos.data, espacios.data],
  );

  const principales = [reservas, citas, prestamos];
  return {
    data,
    // isLoading y no isPending: sin sesión las consultas están apagadas y quedarían pendientes.
    isPending: principales.some((consulta) => consulta.isLoading),
    isError: principales.some((consulta) => consulta.isError),
    error: principales.find((consulta) => consulta.error)?.error ?? null,
    refetch: () => {
      // refetch() ignora `enabled`: sin sesión, las consultas propias fallarían.
      if (!usuario) return;
      reservas.refetch();
      citas.refetch();
      prestamos.refetch();
      espacios.refetch();
    },
  };
}
