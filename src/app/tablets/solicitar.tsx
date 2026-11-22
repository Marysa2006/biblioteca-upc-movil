/**
 * Solicitar el préstamo de una tablet (HU-22). Pantalla apilada; se llega desde el detalle del
 * servicio Préstamo de tablets.
 * Pide cuenta desde el principio: sin sesión, solo invita a iniciarla y no consulta nada; con
 * ?volver=1, el login regresa aquí y ya se muestra el formulario. Los egresados no piden tablets
 * (#240): se les explica en lugar del formulario.
 * - CA1: con tablets libres, la hora de inicio (en punto o y media, hasta diasMaximosTablet días
 *   antes), las horas (de 1 al máximo; empiezan en horasPrestamoTablet), los datos de quien la
 *   pide (#224, prellenados con la sesión y el perfil), las condiciones y la responsabilidad
 *   aceptadas y Confirmar, la solicitud queda registrada y se notifica; la confirmación sale en
 *   el mismo lugar.
 * - CA2: sin tablets, se sugieren otras franjas (las del día o las que manda la API). Si al
 *   confirmar no hubo una tablet libre todas las horas, el 400 trae alternativas de la misma
 *   duración y se vuelven a consultar las franjas.
 * - CA3: sin aceptar las condiciones y la responsabilidad, no se envía (el formulario lo valida
 *   y la API también).
 *
 * Patrón de datos: useParametros() / useCondicionesTablet() / usePerfil() /
 * useDisponibilidadTablets() / useSolicitarPrestamo() (src/hooks) → src/api → mock o API.
 */
import { useState } from 'react';

import { InvitarSesion } from '@/components/reservas/InvitarSesion';
import { ServicioNoPermitido } from '@/components/reservas/ServicioNoPermitido';
import { FormularioPrestamoTablet } from '@/components/tablets/FormularioPrestamoTablet';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useParametros } from '@/hooks/useParametros';
import { usePerfil } from '@/hooks/usePerfil';
import { useRol } from '@/hooks/useRol';
import {
  alternativasDePrestamo,
  useCondicionesTablet,
  useDisponibilidadTablets,
  useSolicitarPrestamo,
  type FormularioPrestamo,
} from '@/hooks/useTablets';
import type { Usuario } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';
import { MENSAJE_NO_PIDE_TABLET, puedePedirTablet } from '@/utils/roles';

const TITULO = 'Solicitar tablet';

export default function SolicitarTablet() {
  const { usuario } = useRol();

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="Para usarla dentro de la biblioteca. Se recoge en el mostrador."
        conEncabezado
        // Tiene campos de texto al final (tus datos): el teclado no debe taparlos.
        conTeclado
      >
        {usuario && !puedePedirTablet(usuario.tipo) ? (
          <ServicioNoPermitido mensaje={MENSAJE_NO_PIDE_TABLET} tipo={usuario.tipo} />
        ) : usuario ? (
          <SolicitudConSesion usuario={usuario} />
        ) : (
          <InvitarSesion
            mensaje="Inicia sesión con tu cuenta institucional para solicitar el préstamo de una tablet."
            etiqueta="Iniciar sesión para solicitar una tablet"
          />
        )}
      </Pantalla>
    </>
  );
}

/** Se monta solo con sesión: así, sin sesión, no se consultan fechas, franjas ni condiciones. */
function SolicitudConSesion({ usuario }: { usuario: Usuario }) {
  const parametros = useParametros();
  const condiciones = useCondicionesTablet();
  // Prellena los datos (#224; su teléfono es el celular). Si no carga, no bloquea la solicitud:
  // la persona los escribe.
  const perfil = usePerfil();
  const [fecha, setFecha] = useState('');
  // Sin fecha no consulta (enabled: fecha !== '').
  const dia = useDisponibilidadTablets(fecha);
  const solicitud = useSolicitarPrestamo();

  const alternativas = alternativasDePrestamo(solicitud.error);
  const mensajeError =
    solicitud.error && alternativas.length === 0 ? mensajeErrorGuardar(solicitud.error) : null;
  const mensajeSugeridas =
    solicitud.error && alternativas.length > 0 ? solicitud.error.message : undefined;

  const confirmar = (datos: FormularioPrestamo) => {
    solicitud.mutate(datos, {
      // CA2: si la franja se ocupó, las franjas del día se consultan de nuevo.
      onError: (error) => {
        if (alternativasDePrestamo(error).length > 0) dia.refetch();
      },
    });
  };

  const reintentar = () => {
    if (parametros.isError) parametros.refetch();
    if (condiciones.isError) condiciones.refetch();
  };

  if (parametros.isPending || condiciones.isPending || perfil.isPending) {
    return <EstadoCarga mensaje="Cargando el préstamo de tablets…" />;
  }
  if (parametros.isError || condiciones.isError) {
    return <EstadoError mensaje="No pudimos cargar el préstamo de tablets." onReintentar={reintentar} />;
  }

  return (
    <FormularioPrestamoTablet
      parametros={parametros.data}
      condiciones={condiciones.data}
      usuario={usuario}
      perfil={perfil.data}
      fecha={fecha}
      onCambiarFecha={setFecha}
      franjas={dia.data?.franjas}
      motivoDia={dia.data?.motivo}
      sugerenciasDia={dia.data?.sugerencias ?? []}
      errorFranjas={dia.isError}
      onReintentarFranjas={() => dia.refetch()}
      guardando={solicitud.isPending}
      mensajeError={mensajeError}
      sugeridasError={alternativas}
      mensajeSugeridas={mensajeSugeridas}
      onLimpiarError={() => solicitud.reset()}
      enviada={solicitud.isSuccess}
      onConfirmar={confirmar}
    />
  );
}
