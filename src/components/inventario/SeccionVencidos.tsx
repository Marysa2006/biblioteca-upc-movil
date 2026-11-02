/**
 * Sección Vencidos de Inventario (permiso `tablets`). Archivo de HU-24 (María).
 * Se ve con el permiso que define inventario.tsx.
 *
 * Muestra los préstamos vencidos. Marcarlos (CA1) y crear la alerta del encargado y el aviso del
 * usuario (CA2) lo hace la consulta de usePrestamosVencidos() (con la API, el Backend), no la UI.
 * Con vencidos, ListaVencidos pone el aviso para el responsable (CA2); sin vencidos, solo un
 * mensaje y ningún aviso (CA3). Al registrar la devolución en Préstamos (HU-23), la lista se
 * refresca sola: las mutaciones invalidan el prefijo ['prestamos'].
 *
 * Patrón de datos: usePrestamosVencidos() / useTablets() (src/hooks) → src/api/tablets.ts → mock o API.
 */
import { EstadoCarga, EstadoError } from '@/components/ui';
import { ListaVencidos } from '@/components/vencidos/ListaVencidos';
import { usePrestamosVencidos, useTablets } from '@/hooks/useTablets';

export function SeccionVencidos() {
  const prestamos = usePrestamosVencidos();
  const tablets = useTablets();

  if (prestamos.isPending || tablets.isPending) {
    return <EstadoCarga mensaje="Buscando préstamos vencidos…" />;
  }

  if (prestamos.isError || tablets.isError) {
    const reintentar = () => {
      if (prestamos.isError) prestamos.refetch();
      if (tablets.isError) tablets.refetch();
    };
    return (
      <EstadoError mensaje="No pudimos cargar los préstamos vencidos." onReintentar={reintentar} />
    );
  }

  // Si la tablet ya no está en el inventario, se muestra su identificador.
  const codigoTablet = (tabletId: string) =>
    tablets.data.find((tablet) => tablet.id === tabletId)?.codigo ?? tabletId;

  return <ListaVencidos prestamos={prestamos.data} codigoTablet={codigoTablet} />;
}
