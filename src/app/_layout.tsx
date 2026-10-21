/**
 * Layout raíz: proveedores de toda la app (tema, datos y área segura) y la pila de navegación.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Rutas:
 *   /login            inicio de sesión con correo institucional (HU-05)
 *   (comunidad)/...   vista de la comunidad: /, /servicios, /catalogo, /solicitudes
 *   (personal)/...    vista del personal:    /panel, /gestion, /equipo, /inventario, /estadisticas
 *   apiladas          /perfil, /servicio/[id] y /administracion/... (con su barra y flecha atrás)
 */
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  useFonts,
} from '@expo-google-fonts/open-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/queryClient';
import { SincronizarRecordatorios } from '@/components/notificaciones/SincronizarRecordatorios';
import { tema } from '@/theme';

// La pantalla de carga sigue visible hasta que Open Sans esté lista.
SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const [fuentesCargadas, errorFuentes] = useFonts({
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
  });
  // Si la carga falla, la app abre con la fuente del sistema en vez de quedarse en la pantalla de carga.
  const listo = fuentesCargadas || errorFuentes !== null;

  useEffect(() => {
    if (listo) {
      SplashScreen.hide();
    }
  }, [listo]);

  if (!listo) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={tema}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {/* HU-27: los recordatorios de las reservas aprobadas, aunque no se abra Notificaciones. */}
          <SincronizarRecordatorios />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(comunidad)" />
            <Stack.Screen name="(personal)" />
            <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          </Stack>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
