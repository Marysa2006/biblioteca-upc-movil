/**
 * Menú de usuario, arriba a la derecha de cada pantalla con pestañas (Pantalla lo muestra).
 * - Con sesión: Perfil, Notificaciones (HU-27), Mi calendario (HU-30), cambiar a la vista de la comunidad o del personal
 *   (solo el personal) y Cerrar sesión. Un globito sobre el botón cuenta los avisos sin leer.
 * - Sin sesión: Iniciar sesión.
 */
import { router, useSegments } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Badge, Divider, Icon, Menu, Text, TouchableRipple } from 'react-native-paper';

import { useCerrarSesion } from '@/hooks/useAutenticacion';
import { useNotificaciones } from '@/hooks/useNotificaciones';
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
  // Sin sesión, useNotificaciones() no consulta y no hay globito.
  const { data: avisos } = useNotificaciones();
  const sinLeer = usuario ? (avisos?.filter((aviso) => !aviso.leida).length ?? 0) : 0;
  const textoSinLeer = `${sinLeer} ${sinLeer === 1 ? 'notificación' : 'notificaciones'} sin leer`;
  const enVistaPersonal = segmentos[0] === '(personal)';

  const ir = (accion: () => void) => {
    setAbierto(false);
    accion();
  };

  const boton = (
    <View>
      <TouchableRipple
        onPress={() => setAbierto(true)}
        borderless
        style={estilos.boton}
        accessibilityRole="button"
        accessibilityLabel={
          usuario
            ? `Menú de ${usuario.nombre}${sinLeer > 0 ? `, ${textoSinLeer}` : ''}`
            : 'Menú: iniciar sesión'
        }
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
      {/* El número ya va en la etiqueta del botón: el globito es solo visual. */}
      <Badge
        visible={sinLeer > 0}
        size={espacio.m + espacio.xs}
        style={estilos.globito}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {sinLeer}
      </Badge>
    </View>
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
          <Menu.Item
            title={sinLeer > 0 ? `Notificaciones (${sinLeer})` : 'Notificaciones'}
            leadingIcon="bell-outline"
            onPress={() => ir(() => router.push('/notificaciones'))}
            accessibilityLabel={sinLeer > 0 ? `Notificaciones, ${textoSinLeer}` : 'Notificaciones'}
          />
          <Menu.Item
            title="Mi calendario"
            leadingIcon="calendar-month-outline"
            onPress={() => ir(() => router.push('/calendario'))}
            accessibilityLabel="Mi calendario"
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
  globito: { position: 'absolute', top: 0, right: 0 },
  menu: { backgroundColor: colores.superficie },
  cabecera: { gap: espacio.xs, paddingHorizontal: espacio.m, paddingVertical: espacio.s },
  nombre: { color: colores.texto, fontFamily: fuentes.seminegrita },
  rol: { color: colores.textoSecundario },
});
