/**
 * Sección Vencidos de Inventario (permiso `tablets`). Archivo de HU-24 (María).
 * Se ve con el permiso que define inventario.tsx.
 */
import { EnConstruccion } from '@/components/ui';

export function SeccionVencidos() {
  return (
    <EnConstruccion
      hu="HU-24"
      descripcion="Préstamos que pasaron la hora límite, con alerta al encargado."
    />
  );
}
