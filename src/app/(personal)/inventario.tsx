/**
 * Inventario: los equipos de la biblioteca del lado del personal.
 * Cada sección vive en su propio componente de src/components/inventario y se ve con su permiso:
 * - Tablets (`tablets`): el inventario de tablets (HU-21, Jhon).
 * Préstamos y Vencidos pasaron a Gestión en el #162: son trabajo del día a día, y aquí quedan
 * solo los equipos. Si llegan más equipos, cada uno es una sección más y el selector (el mismo
 * de Gestión) aparece solo con dos o más.
 * Esta pantalla solo compone: el contenido de cada sección se cambia en su componente, no aquí,
 * para que dos personas no editen el mismo archivo.
 */
import { useState, type ComponentType } from 'react';

import { SeccionIncidencias } from '@/components/inventario/SeccionIncidencias';
import { BotonRegistrarTablet, SeccionTablets } from '@/components/inventario/SeccionTablets';
import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { EstadoVacio, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import type { Permiso } from '@/types';

type ValorSeccion = 'tablets' | 'incidencias';

type Seccion = {
  valor: ValorSeccion;
  etiqueta: string;
  Componente: ComponentType;
  /** Botón flotante de la sección (opcional), como en Gestión; se encoge al deslizar. */
  Flotante?: ComponentType<{ extendido: boolean }>;
  /** Se ve con cualquiera de estos permisos. */
  permisos: readonly Permiso[];
};

const SECCIONES: Seccion[] = [
  {
    valor: 'tablets',
    etiqueta: 'Tablets',
    Componente: SeccionTablets,
    Flotante: BotonRegistrarTablet,
    permisos: ['tablets'],
  },
  { valor: 'incidencias', etiqueta: 'Incidencias', Componente: SeccionIncidencias, permisos: ['tablets'] },
];

export default function Inventario() {
  const { tienePermiso } = useRol();
  const [elegida, setElegida] = useState<ValorSeccion>('tablets');
  const visibles = SECCIONES.filter((seccion) => seccion.permisos.some(tienePermiso));
  // Si la elegida dejó de verse (o nunca se vio), se muestra la primera visible.
  const activa: Seccion | undefined =
    visibles.find((seccion) => seccion.valor === elegida) ?? visibles[0];
  const Flotante = activa?.Flotante;

  return (
    <Pantalla
      titulo="Inventario"
      subtitulo="Tablets del inventario"
      flotante={Flotante ? (desplazada: boolean) => <Flotante extendido={!desplazada} /> : null}
    >
      {activa && visibles.length > 1 ? (
        <SelectorSeccion
          opciones={visibles}
          valor={activa.valor}
          onCambiar={setElegida}
          etiqueta="Secciones de Inventario"
        />
      ) : null}

      {activa ? (
        <activa.Componente />
      ) : (
        <EstadoVacio mensaje="Tu rol no tiene secciones de inventario por ahora." />
      )}

    </Pantalla>
  );
}
