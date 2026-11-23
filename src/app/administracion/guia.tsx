/**
 * Crear o editar una guía de la biblioteca (#258, HU-29). Sin ?id= crea; con ?id= edita.
 * Con el permiso `contenidos` o `novedades`. Al guardar vuelve a la lista de guías; el error de
 * la API se muestra dentro del formulario.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { FormularioGuia } from '@/components/guias/FormularioGuia';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useEditarGuia, useGuiasAdministracion, type DatosGuia } from '@/hooks/useGuias';
import { useRol } from '@/hooks/useRol';
import { mensajeErrorGuardar } from '@/utils/errores';

export default function EditarGuia() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar guía' : 'Nueva guía';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('contenidos') || tienePermiso('novedades') ? (
          <Formulario id={id} />
        ) : (
          <SinPermiso />
        )}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  const { data, isPending, isError, refetch } = useGuiasAdministracion();
  const editar = useEditarGuia();
  const mensajeError = editar.error ? mensajeErrorGuardar(editar.error) : null;

  const guardar = (datos: DatosGuia) => {
    editar.reset();
    editar.mutate({ id, datos }, { onSuccess: () => router.back() });
  };

  if (!id) {
    return (
      <FormularioGuia guardando={editar.isPending} mensajeError={mensajeError} onGuardar={guardar} />
    );
  }

  if (isPending) return <EstadoCarga mensaje="Cargando la guía…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar la guía." onReintentar={() => refetch()} />;
  }
  const guia = data.find((g) => g.id === id);
  if (!guia) return <EstadoVacio pose="buscando" mensaje="Esta guía ya no existe." />;

  return (
    <FormularioGuia
      guia={guia}
      guardando={editar.isPending}
      mensajeError={mensajeError}
      onGuardar={guardar}
    />
  );
}
