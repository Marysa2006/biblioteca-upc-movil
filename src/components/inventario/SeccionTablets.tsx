/**
 * Sección Tablets de Inventario (permiso `tablets`). Archivo de HU-21 (Jhon).
 * Se ve con el permiso que define inventario.tsx.
 */
import { EnConstruccion } from '@/components/ui';

export function SeccionTablets() {
  return (
    <EnConstruccion
      hu="HU-21"
      descripcion="Inventario de tablets: registrar y editar con código, serial, modelo, accesorios y estado."
    />
  );
}
