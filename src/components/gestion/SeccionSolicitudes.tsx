/**
 * Sección Solicitudes de Gestión (permiso `reservas`, `asesorias` o `formacion`): la bandeja
 * de solicitudes de todos los servicios, con un filtro por servicio según los permisos de
 * cada persona, como en el mockup personal-bandeja.png.
 * La construye HU-19 UI (María) con las reservas de espacios; las asesorías y las
 * capacitaciones se suman con sus HU. Se ve con los permisos que define gestion.tsx.
 */
import { EnConstruccion } from '@/components/ui';

export function SeccionSolicitudes() {
  return (
    <EnConstruccion
      hu="HU-19"
      descripcion="Bandeja de solicitudes por servicio: reservas de espacios (HU-19); las asesorías y las capacitaciones se suman en las iteraciones 3 y 4."
    />
  );
}
