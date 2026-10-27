/**
 * Crear o editar un tema de asesoría (HU-13). Sin ?id= crea; con ?id= edita.
 * Al guardar vuelve a Asesorías y jornadas, que ya muestra el cambio.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { FormularioTema } from '@/components/asesorias/FormularioTema';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useGuardarTema, useTemas } from '@/hooks/useAsesorias';
import { useRol } from '@/hooks/useRol';
import { mensajeErrorGuardar } from '@/utils/errores';

export default function EditarTema() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar tema' : 'Nuevo tema';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('asesorias') ? <Formulario id={id} /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  // La lista también sirve para no repetir el nombre de un tema.
  const { data, isPending, isError, refetch } = useTemas();
  const guardar = useGuardarTema();

  if (isPending) return <EstadoCarga mensaje="Cargando los temas…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar los temas." onReintentar={() => refetch()} />;
  }
  const original = id ? data.find((tema) => tema.id === id) : undefined;
  if (id && !original) return <EstadoVacio mensaje="Este tema ya no existe." />;

  return (
    <FormularioTema
      temas={data}
      original={original}
      guardando={guardar.isPending}
      mensajeError={guardar.error ? mensajeErrorGuardar(guardar.error) : null}
      onGuardar={(datos) => {
        guardar.reset();
        guardar.mutate(
          { ...datos, nombre: datos.nombre.trim(), descripcion: datos.descripcion.trim(), ...(id ? { id } : {}) },
          { onSuccess: () => router.back() },
        );
      }}
    />
  );
}
