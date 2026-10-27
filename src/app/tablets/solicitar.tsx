/**
 * Solicitar el préstamo de una tablet (HU-22). Pantalla apilada; se llega desde el detalle del
 * servicio Préstamo de tablets. Las franjas se consultan sin cuenta; la sesión se pide al confirmar.
 *
 * Patrón de datos: useParametros() (src/hooks) → src/api → mock o API. La disponibilidad, las
 * condiciones y la solicitud se conectan con los hooks de HU-22 Datos (#101), con
 * FormularioPrestamoTablet (src/components/tablets).
 */
import { EncabezadoApilado, EnConstruccion, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useParametros } from '@/hooks/useParametros';

const TITULO = 'Solicitar tablet';

export default function SolicitarTablet() {
  const parametros = useParametros();

  let contenido;
  if (parametros.isPending) {
    contenido = <EstadoCarga mensaje="Cargando el préstamo de tablets…" />;
  } else if (parametros.isError) {
    contenido = (
      <EstadoError
        mensaje="No pudimos cargar el préstamo de tablets."
        onReintentar={() => parametros.refetch()}
      />
    );
  } else {
    contenido = (
      <EnConstruccion
        hu="HU-22"
        descripcion="Aquí eliges la fecha y la franja, aceptas las condiciones de uso y envías la solicitud."
      />
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Para usarla dentro de la biblioteca. Se recoge en el mostrador."
        conEncabezado
      >
        {contenido}
      </Pantalla>
    </>
  );
}
