/**
 * Sección Portal de Gestión (permiso `contenidos`, `parametros` o `novedades`): la administración
 * del portal, con contenidos (HU-04) y parámetros generales (HU-28). Cada fila del menú filtra su
 * permiso; con solo `novedades` (#257) se ven los avisos y los informativos.
 */
import { MenuAdministracion } from '@/components/personal/MenuAdministracion';

export function SeccionPortal() {
  return <MenuAdministracion />;
}
