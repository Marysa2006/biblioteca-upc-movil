/**
 * Temas de asesoría que ofrece la biblioteca (HU-14): la lista de los activos.
 * Pantalla apilada; se abre desde el detalle del servicio de asesorías y no pide cuenta:
 * la sesión se pide al confirmar la cita.
 *
 * Patrón de datos: useTemas() (src/hooks) → src/api/asesorias.ts → mock o API.
 */
import { TarjetaTema } from '@/components/asesorias/TarjetaTema';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { useTemas } from '@/hooks/useAsesorias';
import { temasActivos } from '@/utils/asesorias';

export default function TemasAsesoria() {
  const { data, isPending, isError, isRefetching, refetch } = useTemas();
  const temas = data ? temasActivos(data) : [];

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando temas…" />;
  } else if (isError) {
    contenido = <EstadoError mensaje="No pudimos cargar los temas." onReintentar={() => refetch()} />;
  } else if (temas.length === 0) {
    contenido = <EstadoVacio mensaje="Por ahora no hay asesorías disponibles para agendar." />;
  } else {
    // Al entrar las franjas (HU-14 Datos), cada tema abre su pantalla con onElegir.
    contenido = temas.map((tema) => <TarjetaTema key={tema.id} tema={tema} />);
  }

  return (
    <>
      <EncabezadoApilado titulo="Asesorías" />
      <Pantalla
        titulo="Agendar asesoría"
        subtitulo="Estos son los temas en los que la biblioteca te puede asesorar."
        conEncabezado
        recarga={{ recargando: isRefetching, onRecargar: () => refetch() }}
      >
        {contenido}
      </Pantalla>
    </>
  );
}
