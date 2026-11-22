/**
 * Agregar o editar una foto de Inicio (#290). Sin ?id= agrega; con ?id= edita.
 * Con el permiso `contenidos` o `novedades`. Al guardar vuelve a la lista; el error de la API (por
 * ejemplo, el máximo de fotos publicadas, CA4) se muestra dentro del formulario.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { FormularioFotoInicio } from '@/components/inicio/FormularioFotoInicio';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import {
  useFotosInicioAdministracion,
  useGuardarFotoInicio,
  type DatosFotoInicio,
} from '@/hooks/useFotosInicio';
import { useRol } from '@/hooks/useRol';
import { mensajeErrorGuardar } from '@/utils/errores';

export default function EditarFotoInicio() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar foto' : 'Nueva foto';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla
        titulo={titulo}
        subtitulo="Horizontal y nítida. La app la recorta a 16:9, el formato del carrusel."
        conEncabezado
        conTeclado
      >
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
  const { data, isPending, isError, refetch } = useFotosInicioAdministracion();
  const guardar = useGuardarFotoInicio();
  const mensajeError = guardar.error ? mensajeErrorGuardar(guardar.error) : null;

  const enviar = (datos: DatosFotoInicio) => {
    guardar.reset();
    guardar.mutate({ id, datos }, { onSuccess: () => router.back() });
  };

  if (!id) {
    return (
      <FormularioFotoInicio
        guardando={guardar.isPending}
        mensajeError={mensajeError}
        onGuardar={enviar}
      />
    );
  }

  if (isPending) return <EstadoCarga mensaje="Cargando la foto…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar la foto." onReintentar={() => refetch()} />;
  }
  const foto = data.find((actual) => actual.id === id);
  if (!foto) return <EstadoVacio pose="buscando" mensaje="Esta foto ya no existe." />;

  return (
    <FormularioFotoInicio
      foto={foto}
      guardando={guardar.isPending}
      mensajeError={mensajeError}
      onGuardar={enviar}
    />
  );
}
