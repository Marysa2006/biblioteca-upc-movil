/**
 * Inicio de la comunidad.
 *
 * EJEMPLO DE REFERENCIA del patrón completo: esta pantalla usa useServicios() (src/hooks),
 * que llama a obtenerServicios() (src/api), que devuelve el mock o la respuesta de la API.
 * La pantalla contempla los tres estados: cargando, error y vacío.
 *
 * HU-01 (UI) reemplaza este diseño por el del mockup; el patrón se mantiene.
 */
import { useServicios } from '@/hooks/useServicios';
import { EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import { TarjetaServicio } from '@/components/servicios/TarjetaServicio';
import { useSesion } from '@/store/sesion';

export default function Inicio() {
  const usuario = useSesion((estado) => estado.usuario);
  const { data: servicios, isPending, isError, refetch } = useServicios();

  const saludo = usuario ? `Hola, ${usuario.nombre.split(' ')[0]}` : 'Bienvenido a la biblioteca';

  let contenido;
  if (isPending) {
    contenido = <EstadoCarga mensaje="Cargando servicios…" />;
  } else if (isError) {
    contenido = <EstadoError onReintentar={() => refetch()} />;
  } else if (servicios.length === 0) {
    contenido = <EstadoVacio mensaje="Todavía no hay servicios publicados." />;
  } else {
    contenido = servicios.map((servicio) => (
      <TarjetaServicio key={servicio.id} servicio={servicio} />
    ));
  }

  return (
    <Pantalla titulo={saludo} subtitulo="Servicios de la biblioteca">
      {contenido}
    </Pantalla>
  );
}
