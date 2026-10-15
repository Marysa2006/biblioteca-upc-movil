/**
 * Barra de una pantalla apilada fuera de las pestañas (detalle, administración):
 * título y flecha de atrás con los colores del tema. Se configura desde la pantalla,
 * sin tocar el layout raíz. Va junto con <Pantalla conEncabezado>.
 */
import { Stack } from 'expo-router';

import { colores, fuentes } from '@/theme';

export function EncabezadoApilado({ titulo }: { titulo: string }) {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        title: titulo,
        headerBackButtonDisplayMode: 'minimal',
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.primario,
        headerTitleStyle: { fontFamily: fuentes.seminegrita, color: colores.texto },
      }}
    />
  );
}
