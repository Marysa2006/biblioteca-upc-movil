/**
 * Sección Portal de Gestión (permiso `contenidos` o `parametros`): la administración del portal,
 * con contenidos (HU-04) y parámetros generales (HU-28). Cada fila del menú filtra su permiso.
 */
import { MenuAdministracion } from '@/components/personal/MenuAdministracion';

export function SeccionPortal() {
  return <MenuAdministracion />;
}
