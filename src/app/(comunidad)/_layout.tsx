/**
 * Pestañas de la vista de la comunidad: visitantes, egresados, estudiantes, docentes y administrativos.
 * Al abrir la app con una sesión del personal guardada, entra directo al panel (HU-07).
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 */
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { EstadoCarga } from '@/components/ui';
import { useSesion } from '@/store/sesion';
import { colores, fuentes } from '@/theme';
import { esPersonal } from '@/utils/roles';

/**
 * La redirección al panel ocurre una sola vez por apertura de la app.
 * Así el personal todavía puede visitar la vista de la comunidad desde el panel.
 */
let redireccionInicialHecha = false;

export default function LayoutComunidad() {
  const usuario = useSesion((estado) => estado.usuario);
  const hidratada = useSesion((estado) => estado.hidratada);

  useEffect(() => {
    if (hidratada) {
      redireccionInicialHecha = true;
    }
  }, [hidratada]);

  if (!redireccionInicialHecha) {
    if (!hidratada) {
      return <EstadoCarga />;
    }
    if (esPersonal(usuario?.rol)) {
      return <Redirect href="/panel" />;
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarLabelStyle: { fontFamily: fuentes.seminegrita },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="servicios"
        options={{
          title: 'Servicios',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="room-service-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalogo"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-search-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="solicitudes"
        options={{
          title: 'Mis solicitudes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
