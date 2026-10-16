/**
 * Dashboard del personal (provisional). Según el mockup, reunirá el resumen del día, la
 * actividad reciente y la afluencia; no tiene HU propia, toma datos de varias.
 * Cambiar a la vista de la comunidad y cerrar sesión están en el menú de usuario (arriba).
 */
import { EnConstruccion, Pantalla } from '@/components/ui';
import { useSesion } from '@/store/sesion';
import { describirRoles } from '@/utils/roles';

export default function Panel() {
  const usuario = useSesion((estado) => estado.usuario);

  return (
    <Pantalla
      titulo={usuario ? `Hola, ${usuario.nombre.split(' ')[0]}` : 'Dashboard'}
      subtitulo={usuario ? describirRoles(usuario) : undefined}
    >
      <EnConstruccion descripcion="Resumen del día, actividad reciente y afluencia de la biblioteca." />
    </Pantalla>
  );
}
