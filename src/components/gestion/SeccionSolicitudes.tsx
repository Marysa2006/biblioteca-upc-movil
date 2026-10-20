/**
 * Sección Solicitudes de Gestión (permiso `reservas`, `asesorias` o `formacion`): la bandeja
 * de solicitudes de todos los servicios, con un filtro por servicio según los permisos de
 * cada persona, como en el mockup personal-bandeja.png.
 * Hoy tiene las reservas de espacios (HU-19, permiso `reservas`); las asesorías y las
 * capacitaciones se suman con sus HU. Se ve con los permisos que define gestion.tsx.
 */
import { BandejaReservas } from '@/components/reservas/BandejaReservas';
import { EstadoVacio } from '@/components/ui';
import { useRol } from '@/hooks/useRol';

export function SeccionSolicitudes() {
  const { tienePermiso } = useRol();

  if (!tienePermiso('reservas')) {
    return (
      <EstadoVacio mensaje="Las solicitudes de asesorías y capacitaciones llegan en las iteraciones 3 y 4." />
    );
  }

  return <BandejaReservas />;
}
