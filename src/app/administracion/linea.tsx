/**
 * Crear o editar una línea de formación (HU-09). Sin ?id= crea; con ?id= edita.
 * Al guardar vuelve a Líneas de formación, que ya muestra el cambio (CA1).
 * El nombre repetido va bajo su campo (CA2), también si lo devuelve la API.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { FormularioLinea } from '@/components/capacitaciones/FormularioLinea';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useCrearLinea, useEditarLinea, useLineas } from '@/hooks/useCapacitaciones';
import { useRol } from '@/hooks/useRol';
import { mensajeErrorGuardar } from '@/utils/errores';
import { esErrorNombreRepetido } from '@/utils/lineas';

export default function EditarLinea() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar línea' : 'Nueva línea de formación';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('formacion') ? <Formulario id={id} /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  // La lista también sirve para avisar el nombre repetido antes de guardar.
  const { data, isPending, isError, refetch } = useLineas();
  const crear = useCrearLinea();
  const editar = useEditarLinea();
  const error = crear.error ?? editar.error;
  const errorNombre = esErrorNombreRepetido(error) && error ? error.message : null;

  if (isPending) return <EstadoCarga mensaje="Cargando las líneas…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar las líneas de formación." onReintentar={() => refetch()} />;
  }
  const original = id ? data.find((linea) => linea.id === id) : undefined;
  if (id && !original) return <EstadoVacio mensaje="Esta línea ya no existe." />;

  return (
    <FormularioLinea
      lineas={data}
      original={original}
      guardando={crear.isPending || editar.isPending}
      mensajeError={error && !errorNombre ? mensajeErrorGuardar(error) : null}
      errorNombre={errorNombre}
      onGuardar={(valores) => {
        crear.reset();
        editar.reset();
        const datos = { ...valores, nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() };
        const volver = { onSuccess: () => router.back() };
        if (id) editar.mutate({ id, datos }, volver);
        else crear.mutate(datos, volver);
      }}
    />
  );
}
