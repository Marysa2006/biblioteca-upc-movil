/**
 * Menú de usuario, arriba a la derecha de cada pantalla con pestañas (Pantalla lo muestra).
 * - Con sesión: Perfil, cambiar a la vista de la comunidad o del personal (solo el personal)
 *   y Cerrar sesión.
 * - Sin sesión: Iniciar sesión.
 */
import { router, useSegments } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, Icon, Menu, Text, TouchableRipple } from 'react-native-paper';

import { useCerrarSesion } from '@/hooks/useAutenticacion';
import { useSesion } from '@/store/sesion';
import { colores, espacio, fuentes, radio } from '@/theme';
import { describirRoles, esPersonal } from '@/utils/roles';

/** "Ana Torres" → "AT". */
function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

export function MenuUsuario() {
  const usuario = useSesion((estado) => estado.usuario);
  const cerrarSesion = useCerrarSesion();
  const segmentos = useSegments();
  const [abierto, setAbierto] = useState(false);
  const enVistaPersonal = segmentos[0] === '(personal)';

  const ir = (accion: () => void) => {
    setAbierto(false);
    accion();
  };

  const boton = (
    <TouchableRipple
      onPress={() => setAbierto(true)}
      borderless
      style={estilos.boton}
      accessibilityRole="button"
      accessibilityLabel={usuario ? `Menú de ${usuario.nombre}` : 'Menú: iniciar sesión'}
    >
      <View style={estilos.circulo}>
        {usuario ? (
          <Text variant="labelLarge" style={estilos.iniciales}>
            {iniciales(usuario.nombre)}
          </Text>
        ) : (
          <Icon source="account-outline" size={24} color={colores.superficie} />
        )}
      </View>
    </TouchableRipple>
  );

  return (
    <Menu
      visible={abierto}
      onDismiss={() => setAbierto(false)}
      anchor={boton}
      anchorPosition="bottom"
      contentStyle={estilos.menu}
    >
      {usuario ? (
        <>
          <View style={estilos.cabecera}>
            <Text variant="titleSmall" style={estilos.nombre}>
              {usuario.nombre}
            </Text>
            <Text variant="bodySmall" style={estilos.rol}>
              {describirRoles(usuario)}
            </Text>
          </View>
          <Divider />
          <Menu.Item
            title="Perfil"
            leadingIcon="account-circle-outline"
            onPress={() => ir(() => router.push('/perfil'))}
            accessibilityLabel="Perfil"
          />
          {esPersonal(usuario) ? (
            enVistaPersonal ? (
              <Menu.Item
                title="Ver la vista de la comunidad"
                leadingIcon="home-variant-outline"
                onPress={() => ir(() => router.replace('/'))}
                accessibilityLabel="Ver la vista de la comunidad"
              />
            ) : (
              <Menu.Item
                title="Ver la vista del personal"
                leadingIcon="view-dashboard-outline"
                onPress={() => ir(() => router.replace('/panel'))}
                accessibilityLabel="Ver la vista del personal"
              />
            )
          ) : null}
          <Menu.Item
            title="Cerrar sesión"
            leadingIcon="logout"
            onPress={() =>
              ir(() => {
                cerrarSesion();
                router.replace('/');
              })
            }
            accessibilityLabel="Cerrar sesión"
          />
        </>
      ) : (
        <Menu.Item
          title="Iniciar sesión"
          leadingIcon="login"
          onPress={() => ir(() => router.push('/login'))}
          accessibilityLabel="Iniciar sesión"
        />
      )}
    </Menu>
  );
}

const estilos = StyleSheet.create({
  // 44 px de área táctil: el círculo mide espacio.xl + espacio.s (40) y el relleno completa.
  boton: { padding: espacio.xs / 2, borderRadius: radio.tarjeta * 2 },
  circulo: {
    minWidth: espacio.xl + espacio.s,
    aspectRatio: 1,
    padding: espacio.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radio.tarjeta * 2,
    backgroundColor: colores.primarioOscuro,
  },
  iniciales: { color: colores.superficie, fontFamily: fuentes.negrita },
  menu: { backgroundColor: colores.superficie },
  cabecera: { gap: espacio.xs, paddingHorizontal: espacio.m, paddingVertical: espacio.s },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  rol: { color: colores.textoSecundario },
});
