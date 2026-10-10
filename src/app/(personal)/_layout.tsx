/**
 * Pestañas de la vista del personal: administración y facilitadores de la biblioteca.
 * Solo entra quien tenga un rol del personal; los demás vuelven al login.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { EstadoCarga } from '@/components/ui';
import { useSesion } from '@/store/sesion';
import { colores } from '@/theme';
import { esPersonal } from '@/utils/roles';

export default function LayoutPersonal() {
  const usuario = useSesion((estado) => estado.usuario);
  const hidratada = useSesion((estado) => estado.hidratada);

  if (!hidratada) {
    return <EstadoCarga />;
  }
  if (!esPersonal(usuario?.rol)) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
      }}>
      <Tabs.Screen
        name="panel"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="bandeja"
        options={{
          title: 'Bandeja',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="inbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="equipo"
        options={{
          title: 'Personal',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventario"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="archive-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
