/**
 * Botón flotante "Reservar para un tercero" (HU-19) de Gestión → Solicitudes.
 * Se encoge al ícono al deslizar (BotonFlotante). Solo se ve con el permiso `reservas`.
 */
import { router } from 'expo-router';

import { BotonFlotante } from '@/components/ui';
import { useRol } from '@/hooks/useRol';

type Props = {
  /** Con el texto a la vista; false cuando la lista ya se deslizó. */
  extendido: boolean;
};

export function BotonReservaTercero({ extendido }: Props) {
  const { tienePermiso } = useRol();
  if (!tienePermiso('reservas')) return null;

  return (
    <BotonFlotante
      icono="account-plus-outline"
      texto="Reservar para un tercero"
      etiqueta="Reservar un espacio para un tercero"
      onPress={() => router.push('/reservas/tercero')}
      extendido={extendido}
    />
  );
}
