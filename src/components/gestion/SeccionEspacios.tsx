/**
 * Sección Espacios de Gestión (permiso `espacios`): la configuración de los espacios, con el
 * catálogo (HU-16) y los bloqueos (HU-20). Las solicitudes de reserva no van aquí: van en la
 * bandeja de Solicitudes (HU-19). Archivo de HU-16 y HU-20 UI (Jhon). Se ve con el permiso que
 * define gestion.tsx.
 */
import { EnConstruccion } from '@/components/ui';

export function SeccionEspacios() {
  return (
    <EnConstruccion
      hu="HU-16 y HU-20"
      descripcion="Catálogo de espacios con foto, capacidad, horario y estado, y bloqueos para eventos institucionales."
    />
  );
}
