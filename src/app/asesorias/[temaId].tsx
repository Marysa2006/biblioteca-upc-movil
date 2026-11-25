/**
 * Solicitar una asesoría de un tema (#249, HU-14 en la versión 1.1). Pantalla apilada; se llega
 * desde la lista de temas. Desde la 1.1 no hay franjas: la persona pide la fecha y la hora, y la
 * biblioteca confirma la fecha y asigna el facilitador al aprobar.
 * Pide cuenta desde el principio, porque usa los datos de la persona: sin sesión, solo invita a
 * iniciarla y no consulta nada; con ?volver=1, el login regresa aquí y ya se muestra el
 * formulario.
 * - CA1: la solicitud queda pendiente y aparece en Mis solicitudes.
 * - CA2: fechas sin atención o a menos de 72 h no se eligen; la hora fuera del horario muestra
 *   el error bajo el campo (lo valida el formulario y la API también).
 *
 * Patrón de datos: useTemas() / useParametros() / usePerfil() / useSolicitarCita() (src/hooks)
 * → src/api → mock o API.
 */
import { useLocalSearchParams } from 'expo-router';

import { FormularioSolicitudCita } from '@/components/asesorias/FormularioSolicitudCita';
import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useSolicitarCita, useTemas } from '@/hooks/useAsesorias';
import { useParametros } from '@/hooks/useParametros';
import { usePerfil } from '@/hooks/usePerfil';
import { useRol } from '@/hooks/useRol';
import type { Usuario } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';

const TITULO = 'Solicitar asesoría';

export default function SolicitarAsesoria() {
  const { temaId } = useLocalSearchParams<{ temaId: string }>();
  const { usuario } = useRol();
  const temas = useTemas();
  const tema = temas.data?.find((t) => t.id === temaId);

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={tema?.nombre ?? 'Asesoría'}
        subtitulo="Pide el día y la hora que te sirven. La biblioteca confirma la fecha y quién te atiende."
        conEncabezado
        conTeclado
      >
        {usuario ? (
          <SolicitudConSesion temaId={temaId} usuario={usuario} />
        ) : (
          <InvitarSesion
            mensaje="Inicia sesión con tu cuenta institucional para solicitar una asesoría."
            etiqueta="Iniciar sesión para solicitar una asesoría"
          />
        )}
      </Pantalla>
    </>
  );
}

/** Se monta solo con sesión: así, sin sesión, no se consultan parámetros ni perfil. */
function SolicitudConSesion({ temaId, usuario }: { temaId: string; usuario: Usuario }) {
  const temas = useTemas();
  const parametros = useParametros();
  // Prellena el celular (#224). Si no carga, no bloquea: la persona lo escribe.
  const perfil = usePerfil();
  const solicitud = useSolicitarCita();

  const reintentar = () => {
    if (temas.isError) temas.refetch();
    if (parametros.isError) parametros.refetch();
  };

  if (temas.isPending || parametros.isPending || perfil.isPending) {
    return <EstadoCarga mensaje="Cargando la solicitud de asesoría…" />;
  }
  if (temas.isError || parametros.isError) {
    return <EstadoError mensaje="No pudimos cargar la asesoría." onReintentar={reintentar} />;
  }

  const tema = temas.data.find((t) => t.id === temaId);
  if (!tema?.activo) {
    return (
      <EstadoVacio
        pose="buscando"
        mensaje="Este tema ya no se ofrece. Vuelve atrás y elige otro tema de asesoría."
      />
    );
  }

  return (
    <FormularioSolicitudCita
      tema={tema}
      parametros={parametros.data}
      usuario={usuario}
      perfil={perfil.data}
      guardando={solicitud.isPending}
      mensajeError={solicitud.error ? mensajeErrorGuardar(solicitud.error) : null}
      enviada={solicitud.isSuccess}
      onEnviar={(nueva) => {
        solicitud.reset();
        solicitud.mutate(nueva);
      }}
    />
  );
}
