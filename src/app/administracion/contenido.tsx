/**
 * Crear o editar un aviso o informativo (HU-04). Sin ?id= crea; con ?id= edita.
 * Al guardar vuelve a "Contenidos del portal" (CA1). El error de la API (CA3) se muestra
 * dentro del formulario.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { FormularioContenido } from '@/components/contenidos/FormularioContenido';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useContenidos, useCrearContenido, useEditarContenido } from '@/hooks/useContenidos';
import { useRol } from '@/hooks/useRol';
import type { Contenido } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';

type DatosContenido = Omit<Contenido, 'id' | 'orden'>;

export default function EditarContenido() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar aviso o novedad' : 'Nuevo aviso o novedad';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('contenidos') ? <Formulario id={id} /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  const { data, isPending, isError, refetch } = useContenidos();
  const crear = useCrearContenido();
  const editar = useEditarContenido();
  const guardando = crear.isPending || editar.isPending;
  const error = crear.error ?? editar.error;

  const guardar = (datos: DatosContenido) => {
    crear.reset();
    editar.reset();
    const volver = { onSuccess: () => router.back() };
    if (id) {
      editar.mutate({ id, datos }, volver);
    } else {
      // Un contenido nuevo queda al final; luego se puede subir (CA4).
      crear.mutate(datos, volver);
    }
  };

  if (!id) {
    return (
      <FormularioContenido
        guardando={guardando}
        mensajeError={error ? mensajeErrorGuardar(error) : null}
        onGuardar={guardar}
      />
    );
  }

  if (isPending) return <EstadoCarga mensaje="Cargando el contenido…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar el contenido." onReintentar={() => refetch()} />;
  }
  const contenido = data.find((c) => c.id === id);
  if (!contenido) return <EstadoVacio mensaje="Este contenido ya no existe." />;

  return (
    <FormularioContenido
      contenido={contenido}
      guardando={guardando}
      mensajeError={error ? mensajeErrorGuardar(error) : null}
      onGuardar={guardar}
    />
  );
}
