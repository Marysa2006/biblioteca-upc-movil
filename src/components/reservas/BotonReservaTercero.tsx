/**
 * Botón flotante "Reservar para un tercero" (HU-19) de Gestión → Solicitudes. Va en el
 * `flotante` de Pantalla, así queda fijo abajo a la derecha mientras se desliza la bandeja.
 * Solo se ve con el permiso `reservas`.
 */
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';

import { useRol } from '@/hooks/useRol';
import { colores } from '@/theme';

export function BotonReservaTercero() {
  const { tienePermiso } = useRol();
  if (!tienePermiso('reservas')) return null;

  return (
    <FAB
      icon="account-plus-outline"
      label="Reservar para un tercero"
      onPress={() => router.push('/reservas/tercero')}
      style={estilos.boton}
      color={colores.superficie}
      accessibilityRole="button"
      accessibilityLabel="Reservar un espacio para un tercero"
    />
  );
}

const estilos = StyleSheet.create({
  boton: { backgroundColor: colores.primario },
});
