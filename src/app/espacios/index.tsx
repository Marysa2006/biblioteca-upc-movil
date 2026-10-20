/**
 * Espacios que se pueden reservar (HU-17, CA1): la lista de los activos.
 * Pantalla apilada; se abre desde el detalle del servicio de espacios y no pide cuenta.
 * Cada tarjeta abre el calendario de disponibilidad del espacio.
 *
 * Patrón de datos: useEspacios() (src/hooks) → src/api/espacios.ts → mock o API.
 */
import { router } from 'expo-router';

import { TarjetaEspacio } from '@/components/espacios/TarjetaEspacio';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useEspacios } from '@/hooks/useEspacios';

export default function Espacios() {
  const { data: espacios, isPending, isError, isRefetching, refetch } = useEspacios();

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando espacios…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar los espacios." onReintentar={() => refetch()} />;
  } else if (espacios.length === 0) {
    contenido = <EstadoVacio mensaje="Por ahora no hay espacios disponibles para reservar." />;
  } else {
    contenido = espacios.map((lugar) => (
      <TarjetaEspacio
        key={lugar.id}
        espacio={lugar}
        onPress={() => router.push({ pathname: '/espacios/[id]', params: { id: lugar.id } })}
      />
    ));
  }

  return (
    <>
      <EncabezadoApilado titulo="Espacios" />
      <Pantalla
        titulo="Disponibilidad de espacios"
        subtitulo="Elige un espacio para ver sus horarios libres."
        conEncabezado
        recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
      >
        {contenido}
      </Pantalla>
    </>
  );
}
