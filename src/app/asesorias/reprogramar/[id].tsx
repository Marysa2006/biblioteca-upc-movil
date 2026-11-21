/**
 * Reprogramar una asesoría (#249, CA4). Pantalla apilada; se llega desde Mis citas y desde el
 * detalle de la cita en Mis solicitudes. Solo cambian la fecha y la hora, como `reschedule/` del
 * Backend: se envía una solicitud nueva (pendiente) y la anterior queda cancelada.
 * Dentro del plazo de puedeCancelarCita() (pendiente: siempre; aprobada: hasta
 * horasMinimasCancelacion antes); fuera de él, lo explica. La API vuelve a validar.
 * Pide cuenta: sin sesión, invita a iniciarla y vuelve aquí después.
 *
 * Patrón de datos: useMisCitas() / useParametros() / useReprogramarSolicitud() (src/hooks)
 * → src/api → mock o API.
 */
import { useLocalSearchParams } from 'expo-router';

import { FormularioReprogramarCita } from '@/components/asesorias/FormularioReprogramarCita';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useMisCitas, useReprogramarSolicitud } from '@/hooks/useAsesorias';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import type { Usuario } from '@/types';
import { puedeCancelarCita, solicitudReprogramada, textoPlazoCancelacion } from '@/utils/asesorias';
import { mensajeErrorGuardar } from '@/utils/errores';

export default function ReprogramarAsesoria() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { usuario } = useRol();
  const citas = useMisCitas();
  const tema = citas.data?.find((cita) => cita.id === id)?.tema;

  return (
    <>
      <EncabezadoApilado titulo="Reprogramar asesoría" />
      <Pantalla
        titulo={tema ?? 'Reprogramar asesoría'}
        subtitulo="Elige otra fecha y otra hora. Lo demás de tu solicitud se mantiene."
        conEncabezado
      >
        {usuario ? (
          <ReprogramarConSesion id={id} usuario={usuario} />
        ) : (
          <InvitarSesion
            mensaje="Inicia sesión con tu cuenta institucional para reprogramar tu asesoría."
            etiqueta="Iniciar sesión para reprogramar la asesoría"
          />
        )}
      </Pantalla>
    </>
  );
}

function ReprogramarConSesion({ id, usuario }: { id: string; usuario: Usuario }) {
  const citas = useMisCitas();
  const parametros = useParametros();
  const reprogramar = useReprogramarSolicitud();

  const reintentar = () => {
    if (citas.isError) citas.refetch();
    if (parametros.isError) parametros.refetch();
  };

  if (citas.isPending || parametros.isPending) {
    return <EstadoCarga mensaje="Cargando tu asesoría…" />;
  }
  if (citas.isError || parametros.isError) {
    return <EstadoError mensaje="No pudimos cargar tu asesoría." onReintentar={reintentar} />;
  }

  const cita = citas.data.find((actual) => actual.id === id);
  if (!cita) {
    return <EstadoVacio pose="buscando" mensaje="No encontramos esta asesoría en tus citas." />;
  }
  // Después de enviar, la anterior queda cancelada: se sigue mostrando la confirmación.
  const horas = parametros.data.horasMinimasCancelacion;
  if (!reprogramar.isSuccess && !puedeCancelarCita(cita, horas)) {
    return (
      <EstadoVacio
        pose="buscando"
        mensaje={`Esta asesoría ya no se puede reprogramar. ${textoPlazoCancelacion(horas)}`}
      />
    );
  }

  return (
    <FormularioReprogramarCita
      cita={cita}
      parametros={parametros.data}
      guardando={reprogramar.isPending}
      mensajeError={reprogramar.error ? mensajeErrorGuardar(reprogramar.error) : null}
      enviada={reprogramar.isSuccess}
      onEnviar={(fecha, hora) => {
        reprogramar.reset();
        reprogramar.mutate({
          id: cita.id,
          nueva: solicitudReprogramada(cita, fecha, hora, usuario),
        });
      }}
    />
  );
}
