/**
 * Solicitar el préstamo de una tablet (HU-22). Pantalla apilada; se llega desde el detalle del
 * servicio Préstamo de tablets. La fecha, las franjas y las condiciones se consultan sin cuenta;
 * la sesión se pide al confirmar y, con ?volver=1, el login regresa aquí con lo elegido intacto.
 * - CA1: con tablets libres, condiciones aceptadas y Confirmar, la solicitud queda registrada
 *   y se notifica; la confirmación sale en el mismo lugar.
 * - CA2: sin tablets, se sugieren otras franjas (las del día o las que manda la API). Si al
 *   confirmar la franja se ocupó, el 400 trae alternativas y se vuelven a consultar las franjas.
 * - CA3: sin aceptar las condiciones, no se envía (el formulario lo valida y la API también).
 *
 * Patrón de datos: useParametros() / useCondicionesTablet() / useDisponibilidadTablets() /
 * useSolicitarPrestamo() (src/hooks) → src/api/tablets.ts → mock o API.
 */
import { useState } from 'react';

import { FormularioPrestamoTablet } from '@/components/tablets/FormularioPrestamoTablet';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import {
  alternativasDePrestamo,
  useCondicionesTablet,
  useDisponibilidadTablets,
  useSolicitarPrestamo,
  type FormularioPrestamo,
} from '@/hooks/useTablets';
import { mensajeErrorGuardar } from '@/utils/errores';

const TITULO = 'Solicitar tablet';

export default function SolicitarTablet() {
  const { usuario } = useRol();
  const parametros = useParametros();
  const condiciones = useCondicionesTablet();
  const [fecha, setFecha] = useState('');
  // Sin fecha no consulta (enabled: fecha !== '').
  const dia = useDisponibilidadTablets(fecha);
  const solicitud = useSolicitarPrestamo();

  const alternativas = alternativasDePrestamo(solicitud.error);
  const mensajeError =
    solicitud.error && alternativas.length === 0 ? mensajeErrorGuardar(solicitud.error) : null;

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

  let contenido;
  if (parametros.isPending || condiciones.isPending) {
    contenido = <EstadoCarga mensaje="Cargando el préstamo de tablets…" />;
  } else if (parametros.isError || condiciones.isError) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar el préstamo de tablets." onReintentar={reintentar} />
    );
  } else {
    contenido = (
      <FormularioPrestamoTablet
        parametros={parametros.data}
        condiciones={condiciones.data}
        fecha={fecha}
        onCambiarFecha={setFecha}
        franjas={dia.data?.franjas}
        motivoDia={dia.data?.motivo}
        sugerenciasDia={dia.data?.sugerencias ?? []}
        errorFranjas={dia.isError}
        onReintentarFranjas={() => dia.refetch()}
        conSesion={usuario != null}
        guardando={solicitud.isPending}
        mensajeError={mensajeError}
        sugeridasError={alternativas}
        onLimpiarError={() => solicitud.reset()}
        enviada={solicitud.isSuccess}
        onConfirmar={confirmar}
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
