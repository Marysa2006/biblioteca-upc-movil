/**
 * Reservar un espacio para un tercero (HU-19). Pantalla apilada; se abre desde la bandeja de
 * Gestión → Solicitudes. Solo con el permiso 'reservas'.
 * Necesita las personas, los espacios activos y los parámetros (día hábil, HU-28).
 *
 * Patrón de datos: useUsuarios() / useEspacios() / useParametros() / useCrearReservaTercero()
 * (src/hooks) → src/api → mock o API.
 */
import { SinPermiso } from '@/components/personal/SinPermiso';
import { FormularioReservaTercero } from '@/components/reservas/FormularioReservaTercero';
import { EncabezadoApilado, EstadoCarga, EstadoError, Pantalla } from '@/components/ui';
import { useEspacios } from '@/hooks/useEspacios';
import { useParametros } from '@/hooks/useParametros';
import { useRol } from '@/hooks/useRol';
import { useUsuarios } from '@/hooks/useUsuarios';

const TITULO = 'Reservar para un tercero';

export default function ReservaTercero() {
  const { tienePermiso } = useRol();
  const usuarios = useUsuarios();
  const espacios = useEspacios();
  const parametros = useParametros();

  const consultas = [usuarios, espacios, parametros];
  const reintentar = () => consultas.filter((c) => c.isError).forEach((c) => c.refetch());

  let contenido;
  if (!tienePermiso('reservas')) {
    contenido = <SinPermiso />;
  } else if (consultas.some((c) => c.isPending)) {
    contenido = <EstadoCarga mensaje="Cargando personas y espacios…" />;
  } else if (!usuarios.data || !espacios.data || !parametros.data) {
    contenido = (
      <EstadoError mensaje="No pudimos cargar lo necesario para reservar." onReintentar={reintentar} />
    );
  } else {
    contenido = (
      <FormularioReservaTercero
        usuarios={usuarios.data}
        espacios={espacios.data}
        parametros={parametros.data}
      />
    );
  }

  return (
    <>
      <EncabezadoApilado titulo={TITULO} />
      <Pantalla
        titulo={TITULO}
        subtitulo="La reserva queda aprobada y se notifica a la persona."
        conEncabezado
        conTeclado
      >
        {contenido}
      </Pantalla>
    </>
  );
}
