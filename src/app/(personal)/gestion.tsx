/**
 * Gestión: el trabajo del día a día del personal y la administración del portal.
 * Cada sección vive en su propio componente de src/components/gestion y se ve con su permiso:
 * - Solicitudes (`reservas`, `asesorias` o `formacion`): la bandeja de solicitudes de todos
 *   los servicios, filtrada por los permisos de cada persona (HU-19; luego asesorías y capacitaciones).
 * - Agenda (`asesorias`): las citas de asesoría por día y por semana (HU-15).
 * - Préstamos (`tablets`): la entrega y la devolución de tablets (HU-23, Jhon).
 * - Vencidos (`tablets`): los préstamos que pasaron la hora límite (HU-24), con cuántos hay al
 *   lado. Préstamos y Vencidos llegaron de Inventario en el #162: son trabajo del día a día;
 *   Inventario quedó para los equipos. Sus componentes siguen en src/components/inventario.
 * - Espacios (`espacios`): la configuración de los espacios y sus bloqueos (HU-16 y HU-20).
 * - Portal (`contenidos` o `parametros`): contenidos (HU-04) y parámetros generales (HU-28).
 * Una sección puede traer un botón flotante (Solicitudes: "Reservar para un tercero";
 * Espacios: "Nuevo espacio").
 * El selector aparece solo con dos secciones o más. Esta pantalla solo compone: el contenido
 * de cada sección se cambia en su componente, no aquí.
 */
import { useState, type ComponentType } from 'react';

import { SeccionAgenda } from '@/components/gestion/SeccionAgenda';
import { SeccionPrestamos } from '@/components/inventario/SeccionPrestamos';
import { SeccionVencidos } from '@/components/inventario/SeccionVencidos';
import { BotonNuevoEspacio, SeccionEspacios } from '@/components/gestion/SeccionEspacios';
import { SeccionPortal } from '@/components/gestion/SeccionPortal';
import { SeccionSolicitudes } from '@/components/gestion/SeccionSolicitudes';
import { SelectorSeccion } from '@/components/gestion/SelectorSeccion';
import { BotonReservaTercero } from '@/components/reservas/BotonReservaTercero';
import { EstadoVacio, Pantalla } from '@/components/ui';
import { useRol } from '@/hooks/useRol';
import { usePrestamosVencidos } from '@/hooks/useTablets';
import type { Permiso } from '@/types';

type ValorSeccion = 'solicitudes' | 'agenda' | 'prestamos' | 'vencidos' | 'espacios' | 'portal';

type Seccion = {
  valor: ValorSeccion;
  etiqueta: string;
  Componente: ComponentType;
  /** Botón flotante de la sección, fijo abajo a la derecha (opcional); se encoge al deslizar. */
  Flotante?: ComponentType<{ extendido: boolean }>;
  /** Se ve con cualquiera de estos permisos. */
  permisos: readonly Permiso[];
};

const SECCIONES: Seccion[] = [
  {
    valor: 'solicitudes',
    etiqueta: 'Solicitudes',
    Componente: SeccionSolicitudes,
    Flotante: BotonReservaTercero,
    permisos: ['reservas', 'asesorias', 'formacion'],
  },
  {
    valor: 'agenda',
    etiqueta: 'Agenda',
    Componente: SeccionAgenda,
    permisos: ['asesorias'],
  },
  {
    valor: 'prestamos',
    etiqueta: 'Préstamos',
    Componente: SeccionPrestamos,
    permisos: ['tablets'],
  },
  {
    valor: 'vencidos',
    etiqueta: 'Vencidos',
    Componente: SeccionVencidos,
    permisos: ['tablets'],
  },
  {
    valor: 'espacios',
    etiqueta: 'Espacios',
    Componente: SeccionEspacios,
    Flotante: BotonNuevoEspacio,
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
  // La misma consulta que SeccionVencidos: la alerta a la administración se crea apenas se abre
  // Gestión.
  // Solo con el permiso `tablets`: la consulta crea avisos, y un facilitador o un gestor de
  // espacios también abren Gestión.
  const cantidadVencidos =
    usePrestamosVencidos({ activa: tienePermiso('tablets') }).data?.length ?? 0;

  const visibles = SECCIONES.filter((seccion) => seccion.permisos.some(tienePermiso)).map(
    (seccion) =>
      seccion.valor === 'vencidos' && cantidadVencidos > 0
        ? { ...seccion, cantidad: cantidadVencidos }
        : seccion,
  );
  // Si la elegida dejó de verse (o nunca se vio), se muestra la primera visible.
  const activa: Seccion | undefined =
    visibles.find((seccion) => seccion.valor === elegida) ?? visibles[0];
  const Flotante = activa?.Flotante;

  return (
    <Pantalla
      titulo="Gestión"
      subtitulo="Solicitudes, préstamos, espacios y administración del portal"
      flotante={
        Flotante ? (desplazada: boolean) => <Flotante extendido={!desplazada} /> : null
      }
    >
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
