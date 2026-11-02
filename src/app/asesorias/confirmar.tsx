/**
 * Confirmar una cita de asesoría (HU-14). Pantalla apilada; llega desde las franjas del tema
 * con la franja en la ruta (?temaId, franjaId, fecha, horaInicio y horaFin).
 * - CA1: con la necesidad, agenda la cita; la confirmación queda en el mismo lugar.
 * - CA2: si la API rechaza (400), se consultan de nuevo las franjas del día: si la elegida ya
 *   no aparece, se ocupó y se pide elegir otra; si sigue, se muestra el mensaje de la API.
 *   Así no se depende del texto del error.
 * - Con ?reprogramar=<citaId>, pasa esa cita a la franja elegida, sin pedir la necesidad (CA3).
 * Agendar pide cuenta: sin sesión, invita a iniciarla y vuelve aquí después.
 *
 * Patrón de datos: useTemas() / useFranjas() / useMisCitas() / useAgendarCita() /
 * useReprogramarCita() (src/hooks) → src/api/asesorias.ts → mock o API.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { ConfirmarReprogramacion } from '@/components/asesorias/ConfirmarReprogramacion';
import { FormularioCita } from '@/components/asesorias/FormularioCita';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { EncabezadoApilado, EstadoCarga, EstadoError, EstadoVacio, Pantalla } from '@/components/ui';
import {
  useAgendarCita,
  useFranjas,
  useMisCitas,
  useReprogramarCita,
  useTemas,
} from '@/hooks/useAsesorias';
import { useRol } from '@/hooks/useRol';
import { mensajeErrorGuardar } from '@/utils/errores';

type Parametros = {
  temaId: string;
  franjaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  reprogramar?: string;
};

export default function ConfirmarCita() {
  const { temaId, franjaId, fecha, horaInicio, horaFin, reprogramar } =
    useLocalSearchParams<Parametros>();
  const { usuario } = useRol();
  const temas = useTemas();
  const franjas = useFranjas(temaId, fecha, fecha);
  const misCitas = useMisCitas();
  const agendar = useAgendarCita();
  const cambiar = useReprogramarCita();
  const mutacion = reprogramar ? cambiar : agendar;

  const nombreTema = temas.data?.find((t) => t.id === temaId)?.nombre ?? 'Asesoría';
  const cita = reprogramar ? misCitas.data?.find((c) => c.id === reprogramar) : undefined;
  const franja = { fecha, horaInicio, horaFin };

  // CA2: la franja dejó de llegar en la consulta (sin cupo, o ya no se ofrece).
  const sigueLibre = franjas.data?.some((f) => f.id === franjaId) ?? true;
  const franjaOcupada =
    !mutacion.isSuccess && franjas.isSuccess && !franjas.isFetching && !sigueLibre;
  const mensajeError = mutacion.error ? mensajeErrorGuardar(mutacion.error) : null;

  // Con un 400, los cupos se consultan de nuevo para saber si fue la franja (CA2).
  const alFallar = (error: Error) => {
    if ('estado' in error && error.estado === 400) franjas.refetch();
  };

  const confirmar = (necesidad: string) =>
    agendar.mutate({ franjaId, necesidad }, { onError: alFallar });

  const confirmarCambio = () => {
    if (!reprogramar) return;
    cambiar.mutate({ id: reprogramar, nuevaFranjaId: franjaId }, { onError: alFallar });
  };

  const reintentar = () => {
    if (temas.isError) temas.refetch();
    if (franjas.isError) franjas.refetch();
    if (misCitas.isError) misCitas.refetch();
  };

  let contenido;
  if (!usuario) {
    contenido = (
      <InvitarSesion
        mensaje={`Inicia sesión con tu cuenta institucional para agendar la asesoría de ${nombreTema}.`}
        etiqueta="Iniciar sesión para agendar la asesoría"
      />
    );
  } else if (temas.isPending || franjas.isPending || (reprogramar && misCitas.isPending)) {
    contenido = <EstadoCarga mensaje="Preparando tu cita…" />;
  } else if (temas.isError || franjas.isError || (reprogramar && misCitas.isError)) {
    contenido = <EstadoError mensaje="No pudimos cargar la franja." onReintentar={reintentar} />;
  } else if (reprogramar) {
    contenido = cita ? (
      <ConfirmarReprogramacion
        cita={cita}
        nueva={franja}
        guardando={cambiar.isPending}
        reprogramada={cambiar.isSuccess}
        franjaOcupada={franjaOcupada}
        mensajeError={mensajeError}
        onConfirmar={confirmarCambio}
        onElegirOtra={() => router.back()}
      />
    ) : (
      <EstadoVacio mensaje="No encontramos la cita que querías reprogramar." />
    );
  } else {
    contenido = (
      <FormularioCita
        nombreTema={nombreTema}
        franja={franja}
        guardando={agendar.isPending}
        agendada={agendar.isSuccess}
        franjaOcupada={franjaOcupada}
        mensajeError={mensajeError}
        onConfirmar={confirmar}
        onElegirOtra={() => router.back()}
      />
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={reprogramar ? 'Reprogramar asesoría' : 'Agendar asesoría'} />
      <Pantalla
        titulo={reprogramar ? 'Confirmar el cambio' : 'Confirmar la cita'}
        subtitulo={
          reprogramar
            ? 'Revisa la nueva franja antes de confirmar.'
            : 'Cuéntanos qué necesitas para que el facilitador prepare tu asesoría.'
        }
        conEncabezado
        conTeclado
      >
        {contenido}
      </Pantalla>
    </>
  );
}
