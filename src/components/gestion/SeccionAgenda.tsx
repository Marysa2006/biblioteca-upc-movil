/**
 * Sección Agenda de Gestión (permiso `asesorias`): las citas de asesoría del facilitador por día
 * y por semana (HU-15). La administración ve las de todos los facilitadores.
 * Los componentes ya están en src/components/agenda; se conectan cuando entren los datos (#97).
 */
import { EnConstruccion } from '@/components/ui';

export function SeccionAgenda() {
  return <EnConstruccion hu="HU-15" descripcion="Tu agenda de asesorías del día y de la semana." />;
}
