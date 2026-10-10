/**
 * Layout raíz: proveedores de toda la app (tema, datos y área segura) y la pila de navegación.
 * Base compartida: un cambio aquí necesita la aprobación de un guardián (CODEOWNERS).
 *
 * Rutas:
 *   /login            inicio de sesión (provisional hasta HU-05)
 *   (comunidad)/...   vista de la comunidad: /, /catalogo, /solicitudes, /perfil
 *   (personal)/...    vista del personal:    /panel, /bandeja, /equipo, /inventario
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/queryClient';
import { tema } from '@/theme';

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={tema}>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
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
