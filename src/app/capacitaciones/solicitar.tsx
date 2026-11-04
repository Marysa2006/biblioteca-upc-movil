/**
 * Solicitar una capacitación (HU-10). Pantalla apilada; se llega desde el detalle del servicio
 * Capacitaciones.
 * Pide cuenta desde el principio: sin sesión, solo invita a iniciarla y no consulta nada; con
 * ?volver=1, el login regresa aquí y ya se muestra el formulario.
 * - CA1: con todo completo, la solicitud queda pendiente, se notifica y la confirmación sale
 *   en el mismo lugar.
 * - CA2: lo que falte se pide bajo cada campo.
 * - CA3: un día no hábil se avisa con su motivo y una fecha sugerida.
 *
 * Patrón de datos: useParametros() / useLineas() / useSolicitarCapacitacion() (src/hooks) →
 * src/api/capacitaciones.ts → mock o API.
 */
import { FormularioSolicitudCapacitacion } from '@/components/capacitaciones/FormularioSolicitudCapacitacion';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useLineas } from '@/hooks/useCapacitaciones';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';

const TITULO = 'Solicitar capacitación';

export default function SolicitarCapacitacion() {
  const { usuario } = useRol();

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Formación para tu grupo en el uso de los recursos de la biblioteca."
        conEncabezado
        conTeclado
      >
        {usuario ? (
          <SolicitudConSesion />
        ) : (
          <InvitarSesion
            mensaje="Inicia sesión con tu cuenta institucional para solicitar una capacitación."
            etiqueta="Iniciar sesión para solicitar una capacitación"
          />
        )}
      </Pantalla>
    </>
  );
}

/** Se monta solo con sesión: así, sin sesión, no se consultan líneas ni parámetros. */
function SolicitudConSesion() {
  const parametros = useParametros();
  const lineas = useLineas();

  const reintentar = () => {
    if (parametros.isError) parametros.refetch();
    if (lineas.isError) lineas.refetch();
  };

  if (parametros.isPending || lineas.isPending) {
    return <EstadoCarga mensaje="Cargando las capacitaciones…" />;
  }
  if (parametros.isError || lineas.isError) {
    return (
      <EstadoError mensaje="No pudimos cargar las capacitaciones." onReintentar={reintentar} />
    );
  }

  // Solo se ofrecen las líneas activas (HU-09); la API vuelve a revisarlo al enviar.
  const activas = lineas.data.filter((linea) => linea.activa);
  if (activas.length === 0) {
    return (
      <EstadoVacio mensaje="Por ahora no hay líneas de formación disponibles. Vuelve a intentarlo más adelante." />
    );
  }

  return <FormularioSolicitudCapacitacion lineas={activas} parametros={parametros.data} />;
}
