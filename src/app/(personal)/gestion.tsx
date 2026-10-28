/**
 * Gestión: el trabajo del día a día del personal y la administración del portal.
 * Cada sección vive en su propio componente de src/components/gestion y se ve con su permiso:
 * - Solicitudes (`reservas`, `asesorias` o `formacion`): la bandeja de solicitudes de todos
 *   los servicios, filtrada por los permisos de cada persona (HU-19; luego asesorías y capacitaciones).
 * - Agenda (`asesorias`): las citas de asesoría por día y por semana (HU-15).
 * - Espacios (`espacios`): la configuración de los espacios y sus bloqueos (HU-16 y HU-20).
 * - Portal (`contenidos` o `parametros`): contenidos (HU-04) y parámetros generales (HU-28).
 * El selector aparece solo con dos secciones o más. Esta pantalla solo compone: el contenido
 * de cada sección se cambia en su componente, no aquí.
 */
import { useState, type ComponentType } from 'react';

import { SeccionAgenda } from '@/components/gestion/SeccionAgenda';
import { SeccionEspacios } from '@/components/gestion/SeccionEspacios';
import { SeccionPortal } from '@/components/gestion/SeccionPortal';
import { SeccionSolicitudes } from '@/components/gestion/SeccionSolicitudes';
import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { EstadoVacio, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import type { Permiso } from '@/types';

type ValorSeccion = 'solicitudes' | 'agenda' | 'espacios' | 'portal';

type Seccion = {
  valor: ValorSeccion;
  etiqueta: string;
  Componente: ComponentType;
  /** Se ve con cualquiera de estos permisos. */
  permisos: readonly Permiso[];
};

const SECCIONES: Seccion[] = [
  {
    valor: 'solicitudes',
    etiqueta: 'Solicitudes',
    Componente: SeccionSolicitudes,
    permisos: ['reservas', 'asesorias', 'formacion'],
  },
  {
    valor: 'agenda',
    etiqueta: 'Agenda',
    Componente: SeccionAgenda,
    permisos: ['asesorias'],
  },
  {
    valor: 'espacios',
    etiqueta: 'Espacios',
    Componente: SeccionEspacios,
    permisos: ['espacios'],
  },
  {
    valor: 'portal',
    etiqueta: 'Portal',
    Componente: SeccionPortal,
    permisos: ['contenidos', 'parametros'],
  },
];

export default function Gestion() {
  const { tienePermiso } = useRol();
  const [elegida, setElegida] = useState<ValorSeccion>('solicitudes');

  const visibles = SECCIONES.filter((seccion) => seccion.permisos.some(tienePermiso));
  // Si la elegida dejó de verse (o nunca se vio), se muestra la primera visible.
  const activa: Seccion | undefined =
    visibles.find((seccion) => seccion.valor === elegida) ?? visibles[0];

  return (
    <Pantalla titulo="Gestión" subtitulo="Solicitudes, espacios y administración del portal">
      {activa && visibles.length > 1 ? (
        <SelectorSeccion opciones={visibles} valor={activa.valor} onCambiar={setElegida} />
      ) : null}

      {activa ? (
        <activa.Componente />
      ) : (
        <EstadoVacio mensaje="Tu rol no tiene secciones de gestión por ahora." />
      )}
    </Pantalla>
  );
}
