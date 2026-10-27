/**
 * Sección Préstamos de Inventario (permiso `tablets`). Archivo de HU-23 (Jhon).
 * Se ve con el permiso que define inventario.tsx.
 */
import { EnConstruccion } from '@/components/ui';

export function SeccionPrestamos() {
  return (
    <EnConstruccion
      hu="HU-23"
      descripcion="Entrega y devolución de tablets con estado, accesorios y novedades."
    />
  );
}
