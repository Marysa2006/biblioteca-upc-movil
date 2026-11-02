/**
 * Registrar o editar una tablet del inventario (HU-21). Sin ?id= registra; con ?id= edita.
 * Al guardar vuelve a Inventario → Tablets, que ya muestra el cambio (CA1).
 * El código o el serial repetidos se marcan bajo su campo (CA2); el error de la API, arriba.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { FormularioTablet } from '@/components/inventario/FormularioTablet';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { useCrearTablet, useEditarTablet, useTablets } from '@/hooks/useTablets';
import { mensajeErrorGuardar } from '@/utils/errores';

export default function EditarTablet() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar tablet' : 'Registrar tablet';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('tablets') ? <Formulario id={id} /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  // La lista también sirve para avisar el código o el serial repetidos antes de guardar.
  const { data, isPending, isError, refetch } = useTablets();
  const crear = useCrearTablet();
  const editar = useEditarTablet();
  const error = crear.error ?? editar.error;

  if (isPending) return <EstadoCarga mensaje="Cargando el inventario…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar el inventario." onReintentar={() => refetch()} />;
  }
  const original = id ? data.find((tablet) => tablet.id === id) : undefined;
  if (id && !original) return <EstadoVacio mensaje="Esta tablet ya no existe." />;

  return (
    <FormularioTablet
      tablets={data}
      original={original}
      guardando={crear.isPending || editar.isPending}
      mensajeError={error ? mensajeErrorGuardar(error) : null}
      onGuardar={(datos) => {
        crear.reset();
        editar.reset();
        const volver = { onSuccess: () => router.back() };
        if (id) editar.mutate({ id, datos }, volver);
        else crear.mutate(datos, volver);
      }}
    />
  );
}
