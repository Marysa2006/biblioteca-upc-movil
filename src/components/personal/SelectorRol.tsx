/**
 * Menú para elegir el rol de un usuario (HU-07).
 * Solo muestra las opciones y avisa cuál se eligió: guardar el cambio le toca a la pantalla.
 */
import { useState } from 'react';
import { Button, Menu } from 'react-native-paper';

import { colores } from '@/theme';
import type { Rol } from '@/types';
import { NOMBRE_ROL } from '@/utils/roles';

const ROLES = Object.keys(NOMBRE_ROL) as Rol[];

type Props = {
  rolActual: Rol;
  onElegir: (rol: Rol) => void;
  deshabilitado?: boolean;
  cargando?: boolean;
};

export function SelectorRol({ rolActual, onElegir, deshabilitado = false, cargando = false }: Props) {
  const [abierto, setAbierto] = useState(false);

  const elegir = (rol: Rol) => {
    setAbierto(false);
    if (rol !== rolActual) {
      onElegir(rol);
    }
  };

  return (
    <Menu
      visible={abierto}
      onDismiss={() => setAbierto(false)}
      anchor={
        <Button
          mode="outlined"
          icon="account-switch-outline"
          onPress={() => setAbierto(true)}
          disabled={deshabilitado || cargando}
          loading={cargando}>
          Cambiar rol
        </Button>
      }>
      {ROLES.map((rol) => (
        <Menu.Item
          key={rol}
          title={NOMBRE_ROL[rol]}
          leadingIcon={rol === rolActual ? 'check' : undefined}
          titleStyle={rol === rolActual ? { color: colores.primario } : undefined}
          onPress={() => elegir(rol)}
        />
      ))}
    </Menu>
  );
}
