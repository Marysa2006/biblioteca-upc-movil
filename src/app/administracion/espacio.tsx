/**
 * Crear o editar un espacio (HU-16). Sin ?id= crea; con ?id= edita el espacio de la lista.
 * Al guardar vuelve a Gestión → Espacios, que ya muestra el cambio (CA1).
 * El error de la API (CA2) se muestra dentro del formulario. Si la edición desactiva un
 * espacio activo, antes se advierten sus reservas futuras (CA3).
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { DialogoDesactivarEspacio } from '@/components/espacios/DialogoDesactivarEspacio';
import { FormularioEspacio } from '@/components/espacios/FormularioEspacio';
import { SinPermiso } from '@/components/personal/SinPermiso';
import {
  EncabezadoApilado,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Pantalla,
} from '@/components/ui';
import {
  useCrearEspacio,
  useEditarEspacio,
  useEspaciosAdministracion,
} from '@/hooks/useEspacios';
import { useRol } from '@/hooks/useRol';
import type { Espacio } from '@/types';
import { mensajeErrorGuardar } from '@/utils/errores';

type DatosEspacio = Omit<Espacio, 'id'>;

export default function EditarEspacio() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { tienePermiso } = useRol();
  const titulo = id ? 'Editar espacio' : 'Nuevo espacio';

  return (
    <>
      <EncabezadoApilado titulo={titulo} />
      <Pantalla titulo={titulo} conEncabezado conTeclado>
        {tienePermiso('espacios') ? <Formulario id={id} /> : <SinPermiso />}
      </Pantalla>
    </>
  );
}

function Formulario({ id }: { id?: string }) {
  const { data, isPending, isError, refetch } = useEspaciosAdministracion();
  const crear = useCrearEspacio();
  const editar = useEditarEspacio();
  /** Datos que esperan la confirmación de desactivar (CA3). */
  const [pendientes, setPendientes] = useState<DatosEspacio | null>(null);
  const guardando = crear.isPending || editar.isPending;
  const error = crear.error ?? editar.error;
  const mensajeError = error ? mensajeErrorGuardar(error) : null;

  const volver = { onSuccess: () => router.back() };

  // Crear no necesita esperar la lista.
  if (!id) {
    return (
      <FormularioEspacio
        guardando={guardando}
        mensajeError={mensajeError}
        onGuardar={(datos) => {
          crear.reset();
          crear.mutate(datos, volver);
        }}
      />
    );
  }

  if (isPending) return <EstadoCarga mensaje="Cargando el espacio…" />;
  if (isError) {
    return <EstadoError mensaje="No pudimos cargar el espacio." onReintentar={() => refetch()} />;
  }
  const actual = data.find((e) => e.id === id);
  if (!actual) return <EstadoVacio mensaje="Este espacio ya no existe." />;

  const guardar = (datos: DatosEspacio) => {
    editar.reset();
    if (actual.activo && !datos.activo) {
      setPendientes(datos);
      return;
    }
    editar.mutate({ id, datos }, volver);
  };

  return (
    <>
      <FormularioEspacio
        espacioActual={actual}
        guardando={guardando}
        mensajeError={pendientes ? null : mensajeError}
        onGuardar={guardar}
      />
      <DialogoDesactivarEspacio
        espacioActual={pendientes ? actual : null}
        guardando={editar.isPending}
        mensajeError={pendientes ? mensajeError : null}
        onConfirmar={() => pendientes && editar.mutate({ id, datos: pendientes }, volver)}
        onCerrar={() => setPendientes(null)}
      />
    </>
  );
}
