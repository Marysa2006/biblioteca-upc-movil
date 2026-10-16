/**
 * Crear o editar un servicio (HU-04). Sin ?id= crea; con ?id= edita el servicio de la lista.
 * Al guardar vuelve a "Contenidos del portal", que ya muestra el cambio (CA1).
 * El error de la API (CA3) se muestra dentro del formulario.
 */
import { router, useLocalSearchParams } from 'expo-router';

import { SinPermiso } from '@/components/personal/SinPermiso';
import { FormularioServicio } from '@/components/servicios/FormularioServicio';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import {
  useCrearServicio,
  useEditarServicio,
  useServiciosAdministracion,
} from '@/hooks/useServicios';
import type { Servicio } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';

type DatosServicio = Omit<Servicio, 'id'>;

export default function EditarServicio() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar servicio' : 'Nuevo servicio';

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
  const { data, isPending, isError, refetch } = useServiciosAdministracion();
  const crear = useCrearServicio();
  const editar = useEditarServicio();
  const guardando = crear.isPending || editar.isPending;
  const error = crear.error ?? editar.error;

  const guardar = (datos: DatosServicio) => {
    crear.reset();
    editar.reset();
    const volver = { onSuccess: () => router.back() };
    if (id) {
      editar.mutate({ id, datos }, volver);
    } else {
      crear.mutate(datos, volver);
    }
  };

  // Crear no necesita esperar la lista.
  if (!id) {
    return (
      <FormularioServicio
        guardando={guardando}
        mensajeError={error ? mensajeErrorGuardar(error) : null}
        onGuardar={guardar}
      />
    );
  }

  if (isPending) return <EstadoCarga mensaje="Cargando el servicio…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar el servicio." onReintentar={() => refetch()} />;
  }
  const servicio = data.find((s) => s.id === id);
  if (!servicio) return <EstadoVacio mensaje="Este servicio ya no existe." />;

  return (
    <FormularioServicio
      servicio={servicio}
      guardando={guardando}
      mensajeError={error ? mensajeErrorGuardar(error) : null}
      onGuardar={guardar}
    />
  );
}
